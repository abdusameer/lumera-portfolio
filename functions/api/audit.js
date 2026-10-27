// /api/audit: the free website audit, as a Cloudflare Pages Function on the site's own origin.
//   GET   whether the automatic check is open right now, and the public Turnstile site key the page needs to start it
//   POST  { url, token } -> one JSON reply for errors and remembered results, otherwise a stream of newline-separated JSON events:
//         { type: 'progress', text } … then { type: 'result', result } or { type: 'error', code, message }
// Bindings (set in the Cloudflare dashboard, never in page code):
//   ANTHROPIC_API_KEY, TURNSTILE_SECRET   secrets
//   TURNSTILE_SITE_KEY                    public site key for the widget
//   AUDIT_KV                              Workers KV: remembered results (7 days) and the daily counts (2 days)
//   AUDIT_DAILY_CAP (20), AUDIT_IP_CAP (3), AUDIT_MODEL (claude-opus-5-5)
//   AUDIT_DEBUG ('1' adds facts and cost to the reply), AUDIT_DRY_RUN ('1' reads the site but skips the paid step): local development only
import { normalize, fetchPage, loadRobots, AuditError } from './_audit/fetch-site.js';
import { extract, pickSubpages } from './_audit/extract.js';
import { writeResult, WriteError, STANDARD_LIMITS } from './_audit/write.js';

const CACHE_TTL = 7 * 86400, COUNT_TTL = 2 * 86400;
const VERSION = 1;

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const fail = (code, message, status) => json({ error: code, message }, status);
const today = () => new Date().toISOString().slice(0, 10);
const caps = env => ({ day: Number(env.AUDIT_DAILY_CAP) || 20, ip: Number(env.AUDIT_IP_CAP) || 3 });
const ready = env => !!(env.ANTHROPIC_API_KEY && env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY && env.AUDIT_KV);
const getCount = async (env, key) => Number(await env.AUDIT_KV.get(key)) || 0;

export async function onRequestGet({ env }) {
  if (!ready(env)) return json({ open: false, reason: 'unavailable' });
  const used = await getCount(env, `count:day:${today()}`);
  return json(used >= caps(env).day ? { open: false, reason: 'limit_day' } : { open: true, siteKey: env.TURNSTILE_SITE_KEY });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!ready(env)) return fail('unavailable', 'The automatic check is not available right now.', 503);
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return fail('forbidden', 'This check only runs from lumeracreative.agency.', 403);
  if (Number(request.headers.get('content-length') || 0) > 4096) return fail('invalid_request', 'That request is too large.', 413);

  let body;
  try { body = await request.json(); } catch { return fail('invalid_request', 'That request could not be read.', 400); }
  let target;
  try { target = normalize(body && body.url); } catch (e) { return fail(e.code || 'invalid_url', e.message, 400); }

  const ip = request.headers.get('cf-connecting-ip') || '';
  if (!(await turnstileOk(env, body.token, ip))) return fail('bot_check', "We couldn't confirm the check was started by a person. Please try again.", 403);

  // a result from the last 7 days costs nothing to show again
  const cacheKey = `cache:v${VERSION}:${target.key}`;
  const hit = await env.AUDIT_KV.get(cacheKey, 'json');
  if (hit) return json({ result: { ...hit, remembered: true } });

  const date = today(), ipKey = `count:ip:${date}:${await hashIp(ip, date, env)}`, dayKey = `count:day:${date}`;
  const [ipUsed, dayUsed] = await Promise.all([getCount(env, ipKey), getCount(env, dayKey)]);
  if (ipUsed >= caps(env).ip) return fail('limit_ip', `You've used today's ${caps(env).ip} automatic check${caps(env).ip === 1 ? '' : 's'}.`, 429);
  if (dayUsed >= caps(env).day) return fail('limit_day', "We've reached today's limit of automatic checks.", 429);

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter(), enc = new TextEncoder();
  const send = obj => writer.write(enc.encode(JSON.stringify(obj) + '\n')).catch(() => {});
  context.waitUntil((async () => {
    try {
      const result = await run(env, target, send, async () => {
        // counted only once the site has been read and the paid step is about to run
        await Promise.all([env.AUDIT_KV.put(ipKey, String(ipUsed + 1), { expirationTtl: COUNT_TTL }), env.AUDIT_KV.put(dayKey, String((await getCount(env, dayKey)) + 1), { expirationTtl: COUNT_TTL })]);
      });
      const { debug, ...kept } = result;
      if (!result.dryRun) await env.AUDIT_KV.put(cacheKey, JSON.stringify(kept), { expirationTtl: CACHE_TTL });
      await send({ type: 'result', result: env.AUDIT_DEBUG === '1' ? result : kept });
    } catch (e) {
      const known = e instanceof AuditError || e instanceof WriteError;
      console.log(JSON.stringify({ audit: target.key, error: e.code || 'internal', detail: e.detail || (known ? undefined : String(e && e.stack || e)) }));
      await send({ type: 'error', code: known ? e.code : 'internal', message: known ? e.message : 'Something went wrong on our side.' });
    } finally { writer.close().catch(() => {}); }
  })());
  return new Response(readable, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
}

async function run(env, target, send, reserve) {
  const checked = new Set();
  const host = target.host.replace(/^www\./, '');
  await send({ type: 'progress', text: `Looking up ${host}` });

  // robots.txt is read before any page, and again if the homepage redirects to another site
  const startOrigin = `${target.https ? 'https' : 'http'}://${target.host}`;
  let allowed = await loadRobots(startOrigin, checked);
  if (!allowed(target.path)) throw new AuditError('robots', "This website's robots.txt asks automated tools not to read it, so we didn't.");

  // https first; plain http only if the secure address doesn't answer
  let home;
  const tries = target.https ? [`https://${target.host}${target.path}`, `http://${target.host}${target.path}`] : [`http://${target.host}${target.path}`];
  for (const [i, u] of tries.entries()) {
    try { home = await fetchPage(u, { checked }); break; } catch (e) {
      if (i === tries.length - 1 || !['fetch_failed', 'timeout'].includes(e.code)) throw e;
    }
  }
  if (new URL(home.url).origin !== startOrigin) {
    allowed = await loadRobots(new URL(home.url).origin, checked);
    if (!allowed(new URL(home.url).pathname)) throw new AuditError('robots', "This website's robots.txt asks automated tools not to read it, so we didn't.");
  }

  await send({ type: 'progress', text: 'Reading the homepage' });
  const homeX = await extract(home);
  const pages = [{ role: 'homepage', facts: homeX.facts, text: homeX.text }];
  const notes = [];
  const sub = pickSubpages(homeX.links, home.url);
  const wanted = [['contact', sub.contact], ['services', sub.services]].filter(([, u]) => u && allowed(new URL(u).pathname));
  if (wanted.length) await send({ type: 'progress', text: `Reading the ${wanted.map(([r]) => r === 'contact' ? 'contact page' : 'services page').join(' and ')}` });
  const got = await Promise.all(wanted.map(async ([role, u]) => {
    try { const p = await fetchPage(u, { checked }); const x = await extract(p); return { role, facts: x.facts, text: x.text }; }
    catch (e) { notes.push(`The ${role} page (${u}) couldn't be read: ${e.message}`); return null; }
  }));
  pages.push(...got.filter(Boolean));
  if (notes.length) pages[0].facts.pagesNotRead = notes;

  // local development only: AUDIT_DRY_RUN='1' stops here and returns the extracted facts, with nothing counted or paid for
  if (env.AUDIT_DRY_RUN === '1') return { dryRun: true, version: VERSION, checkedAt: new Date().toISOString(), site: { address: target.key, url: home.url, name: '' }, sections: { clear: [], confusing: [], fix_first: [], lumera_help: [] }, notChecked: STANDARD_LIMITS, pages: pages.map(p => ({ role: p.role, url: p.facts.url })), debug: { facts: pages.map(p => ({ role: p.role, ...p.facts })), text: pages.map(p => p.text) } };
  await reserve();
  await send({ type: 'progress', text: 'Writing your results' });
  const beat = setInterval(() => send({ type: 'progress', text: 'Still writing your results', ping: true }), 12000);
  let w;
  try { w = await writeResult(env, pages); } finally { clearInterval(beat); }
  console.log(JSON.stringify({ audit: target.key, model: w.model, ms: w.ms, cost: Number(w.cost.toFixed(4)), usage: w.usage, dropped: w.output.dropped.length }));

  const { dropped, not_checked, site_name, ...sections } = w.output;
  return {
    version: VERSION, checkedAt: new Date().toISOString(), site: { address: target.key, url: home.url, name: site_name },
    pages: pages.map(p => ({ role: p.role, url: p.facts.url })),
    sections, notChecked: [...STANDARD_LIMITS, ...not_checked],
    debug: { facts: pages.map(p => ({ role: p.role, ...p.facts })), cost: w.cost, usage: w.usage, model: w.model, ms: w.ms, dropped },
  };
}

async function turnstileOk(env, token, ip) {
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET); form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form, signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    return j.success === true;
  } catch { return false; }
}

// the per-visitor count is kept under a one-way hash of the IP address and the date, never the address itself
async function hashIp(ip, date, env) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${env.IP_HASH_SALT || env.TURNSTILE_SECRET}|${date}|${ip}`));
  return btoa(String.fromCharCode(...new Uint8Array(d).slice(0, 12))).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' })[c]);
}
