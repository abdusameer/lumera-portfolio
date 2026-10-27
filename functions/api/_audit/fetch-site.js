// fetch-site.js: turns what a visitor typed into a public web address, and reads pages from it safely.
// Only http and https on a public hostname: no IP addresses, no localhost or private names, and every hostname is looked up first so
// a name that points into a private range is refused too. Each page gets at most 3 redirects (each one checked again), 8 seconds and
// 2 MB of HTML. The check identifies itself as LumeraAudit and follows the site's robots.txt.

export const UA = 'Mozilla/5.0 (compatible; LumeraAudit/1.0; +https://lumeracreative.agency/privacy#audit)';
const TIMEOUT_MS = 8000;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

export class AuditError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

// names that never point at a public website
const RESERVED_SUFFIX = /(^|\.)(localhost|local|localdomain|internal|intranet|lan|home|corp|private|test|example|invalid|onion|arpa)$/i;

// "yourbusiness.com", "https://www.yourbusiness.com/about?x=1" -> { key, url } where key is what the cache is kept under
export function normalize(input) {
  let s = String(input || '').trim();
  if (!s || s.length > 300) throw new AuditError('invalid_url', 'Enter your website address, for example yourbusiness.com.');
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
  let u;
  try { u = new URL(s); } catch { throw new AuditError('invalid_url', 'Enter your website address, for example yourbusiness.com.'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new AuditError('invalid_url', 'Only website addresses that start with http or https can be checked.');
  if (u.username || u.password) throw new AuditError('invalid_url', 'Enter the address without a username or password.');
  if (u.port && u.port !== '80' && u.port !== '443') throw new AuditError('not_allowed', 'That address uses a port this check does not read.');
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  checkHostname(host);
  const path = u.pathname.replace(/\/+$/, '') || '';
  const bare = host.replace(/^www\./, '');
  return { key: bare + path, host, path: path || '/', https: u.protocol === 'https:' };
}

export function checkHostname(host) {
  if (host.startsWith('[') || host.includes(':')) throw new AuditError('not_allowed', 'Enter a website name, not an IP address.');
  const labels = host.split('.');
  // dotted, decimal, octal or hex IPv4 in any form: a last label that is all digits or 0x… is never a real top-level domain
  if (/^(\d+|0x[0-9a-f]+)$/i.test(labels[labels.length - 1])) throw new AuditError('not_allowed', 'Enter a website name, not an IP address.');
  if (labels.length < 2) throw new AuditError(/^localhost$/i.test(host) ? 'not_allowed' : 'invalid_url', /^localhost$/i.test(host) ? 'That address is not a public website.' : 'Enter your full website address, for example yourbusiness.com.');
  if (!labels.every(l => /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i.test(l) || /^xn--[a-z0-9-]+$/i.test(l))) throw new AuditError('invalid_url', 'Enter your website address, for example yourbusiness.com.');
  if (!/^([a-z]{2,63}|xn--[a-z0-9-]+)$/i.test(labels[labels.length - 1])) throw new AuditError('invalid_url', 'Enter your website address, for example yourbusiness.com.');
  if (RESERVED_SUFFIX.test(host)) throw new AuditError('not_allowed', 'That address is not a public website.');
}

// ---------------------------------------------------------------- private and reserved address ranges
function v4ToInt(ip) { const p = ip.split('.').map(Number); return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]; }
const V4_BLOCKED = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24],
  ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
].map(([a, bits]) => [v4ToInt(a), bits]);
export function isPrivateV4(ip) {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return true;
  const n = v4ToInt(ip);
  return V4_BLOCKED.some(([base, bits]) => (n >>> (32 - bits)) === (base >>> (32 - bits)));
}
export function isPrivateV6(ip) {
  const s = ip.toLowerCase();
  if (s === '::' || s === '::1') return true;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (mapped) return isPrivateV4(mapped[1]);
  return /^(fc|fd|fe[89ab]|ff)/.test(s) || s.startsWith('2001:db8') || s.startsWith('64:ff9b:') || s.startsWith('100:');
}

// look the name up over DNS-over-HTTPS and refuse it if it has no public address, or if any address it has is private
async function resolvePublic(host) {
  const ask = async type => {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) throw new AuditError('fetch_failed', "We couldn't look up that website's address.");
    const j = await r.json();
    return (j.Answer || []).filter(a => a.type === (type === 'A' ? 1 : 28)).map(a => a.data);
  };
  const [v4, v6] = await Promise.all([ask('A'), ask('AAAA').catch(() => [])]);
  if (!v4.length && !v6.length) throw new AuditError('not_found', "We couldn't find a website at that address. Check the spelling and try again.");
  if (v4.some(isPrivateV4) || v6.some(isPrivateV6)) throw new AuditError('not_allowed', 'That address is not a public website.');
}

// ---------------------------------------------------------------- one page, safely
// returns { url, status, html, bytes, truncated, redirects, contentType }
export async function fetchPage(startUrl, { checked = new Set(), maxBytes = MAX_BYTES, anyType = false } = {}) {
  let url = new URL(startUrl);
  for (let hop = 0; ; hop++) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new AuditError('fetch_failed', 'The website redirected to an address this check does not read.');
    if (url.port && url.port !== '80' && url.port !== '443') throw new AuditError('not_allowed', 'The website redirected to a port this check does not read.');
    const host = url.hostname.toLowerCase();
    if (!checked.has(host)) { checkHostname(host); await resolvePublic(host); checked.add(host); }
    let res;
    try {
      res = await fetch(url.href, { redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', 'accept-language': 'en-US,en;q=0.8' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      throw new AuditError(e && e.name === 'TimeoutError' ? 'timeout' : 'fetch_failed', e && e.name === 'TimeoutError' ? 'The website took longer than 8 seconds to answer.' : "We couldn't connect to that website.");
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      if (hop >= MAX_REDIRECTS) throw new AuditError('fetch_failed', 'The website redirected more than 3 times.');
      url = new URL(res.headers.get('location'), url);
      continue;
    }
    const type = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) throw new AuditError(res.status === 403 || res.status === 401 || res.status === 429 ? 'blocked' : 'fetch_failed', res.status === 403 || res.status === 401 || res.status === 429 ? 'The website turned away our automated check.' : `The website answered with an error (${res.status}).`);
    if (!anyType && type && !/text\/html|application\/xhtml\+xml/.test(type)) throw new AuditError('not_html', "That address isn't a web page this check can read.");
    const { bytes, truncated } = await readCapped(res, maxBytes);
    const charset = (/charset=([^;\s]+)/.exec(type) || [])[1] || 'utf-8';
    let html;
    try { html = new TextDecoder(charset.replace(/["']/g, ''), { fatal: false }).decode(bytes); } catch { html = new TextDecoder().decode(bytes); }
    return { url: url.href, status: res.status, html, bytes: bytes.byteLength, truncated, redirects: hop, contentType: type };
  }
}

async function readCapped(res, max) {
  if (!res.body) return { bytes: new Uint8Array(0), truncated: false };
  const reader = res.body.getReader();
  const parts = []; let n = 0, truncated = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (n + value.byteLength > max) { parts.push(value.subarray(0, max - n)); n = max; truncated = true; break; }
      parts.push(value); n += value.byteLength;
    }
  } catch (e) {
    if (!n) throw new AuditError(e && e.name === 'TimeoutError' ? 'timeout' : 'fetch_failed', e && e.name === 'TimeoutError' ? 'The website took longer than 8 seconds to send its page.' : "We couldn't finish reading that website.");
    truncated = true;   // keep what arrived before the time ran out
  } finally { if (truncated) reader.cancel().catch(() => {}); }
  const out = new Uint8Array(n); let o = 0;
  for (const p of parts) { out.set(p, o); o += p.byteLength; }
  return { bytes: out, truncated };
}

// ---------------------------------------------------------------- robots.txt
// The rules for LumeraAudit if the file names it, otherwise the rules for every robot; the longest matching rule wins, Allow on a tie.
export async function loadRobots(origin, checked) {
  try {
    const page = await fetchPage(new URL('/robots.txt', origin).href, { checked, maxBytes: 256 * 1024, anyType: true });
    return parseRobots(page.html);
  } catch { return () => true; }   // no robots.txt, or an error reading it, means no rules
}

export function parseRobots(txt) {
  const groups = []; let cur = null, lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
    if (!m) continue;
    const field = m[1].toLowerCase(), value = m[2].trim();
    if (field === 'user-agent') {
      if (!lastWasAgent || !cur) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(value.toLowerCase()); lastWasAgent = true;
    } else if ((field === 'allow' || field === 'disallow') && cur) {
      lastWasAgent = false;
      if (field === 'disallow' && !value) continue;
      cur.rules.push({ allow: field === 'allow', path: value });
    } else lastWasAgent = false;
  }
  const mine = groups.filter(g => g.agents.some(a => a !== '*' && 'lumeraaudit'.startsWith(a)));
  const rules = (mine.length ? mine : groups.filter(g => g.agents.includes('*'))).flatMap(g => g.rules);
  const toRe = p => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
  const compiled = rules.map(r => ({ ...r, re: toRe(r.path), len: r.path.length }));
  return path => {
    let best = null;
    for (const r of compiled) if (r.re.test(path) && (!best || r.len > best.len || (r.len === best.len && r.allow))) best = r;
    return !best || best.allow;
  };
}
