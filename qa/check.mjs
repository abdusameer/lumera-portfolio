// Rendered-browser QA for the Lumera Creative portfolio (light edition).
// Serves the repo under /lumera-portfolio/ (like GitHub Pages) and drives it with headless Chrome.
// Usage: node check.mjs            (writes qa/results/report.json and screenshots)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { start } from './serve.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'results');
fs.mkdirSync(OUT, { recursive: true });
const PORT = 4321;
const BASE = `http://localhost:${PORT}/lumera-portfolio/`;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024, touch: true },
  { name: '430x932', width: 430, height: 932, touch: true, dpr: 3 },
  { name: '390x844', width: 390, height: 844, touch: true, dpr: 3 },
  { name: '360x800', width: 360, height: 800, touch: true, dpr: 2 },
  { name: '844x390-landscape', width: 844, height: 390, touch: true, dpr: 2 },
];

const report = { base: BASE, when: new Date().toISOString(), viewports: {}, interactions: {}, problems: [] };
const problem = (where, what) => { report.problems.push(`${where}: ${what}`); };

async function newPage(browser, vp, opts = {}) {
  const page = await browser.newPage();
  const log = { console: [], pageErrors: [], failed: [], http: [] };
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.console.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => log.pageErrors.push(e.message));
  page.on('requestfailed', r => { const u = r.url(); const why = r.failure()?.errorText || ''; if (!/ERR_ABORTED/.test(why)) log.failed.push(`${u} ${why}`); });
  page.on('response', r => { const u = r.url(); if (u.startsWith(`http://localhost:${PORT}`) && r.status() >= 400) log.http.push(`${r.status()} ${u}`); });
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr || 1, isMobile: !!vp.touch, hasTouch: !!vp.touch });
  if (vp.touch) await page.setUserAgent(IPHONE_UA);
  if (opts.reduce) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  return { page, log };
}

async function scrollToY(page, y, settle = 900) {
  await page.evaluate(y => { window.scrollTo(0, y); }, y);
  await sleep(settle);
}
// step toward a position so scroll-linked pieces see real progress
async function stepTo(page, y, steps = 6, settle = 1100) {
  const cur = await page.evaluate(() => window.scrollY);
  for (let k = 1; k <= steps; k++) await scrollToY(page, cur + (y - cur) * k / steps, 80);
  await sleep(settle);
}

async function auditStatic(page) {
  return page.evaluate(() => {
    const out = {};
    const de = document.documentElement;
    out.hscroll = de.scrollWidth > window.innerWidth + 1;
    out.overflowers = [...document.querySelectorAll('body *')].filter(el => {
      if (el.closest('.menu, .sprite, .loader, .stage, .caps-stage')) return false;   // the pinned stages clip their own panels
      const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1);
    }).slice(0, 8).map(el => `${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(' ')[0]}`);
    out.h1 = document.querySelectorAll('h1').length;
    const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map(h => +h.tagName[1]);
    out.headingSkips = hs.filter((l, i) => i > 0 && l > hs[i - 1] + 1).length;
    out.imgsNoAlt = [...document.images].filter(i => !i.hasAttribute('alt')).length;
    out.brokenImgs = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('loading') !== 'lazy').map(i => i.src);
    out.videosNoLabel = [...document.querySelectorAll('video')].filter(v => !v.getAttribute('aria-label')).length;
    out.deadHash = [...document.querySelectorAll('a[href^="#"]')].filter(a => a.getAttribute('href') === '#' || (a.getAttribute('href') !== '#top' && !document.querySelector(a.getAttribute('href')))).map(a => a.getAttribute('href'));
    out.links = [...document.querySelectorAll('a[href]')].length;
    const small = [];
    document.querySelectorAll('a[href], button, summary').forEach(el => {
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.menu[hidden]')) return;
      const r = el.getBoundingClientRect(); if (!r.width) return;
      if (el.closest('.skip')) return;
      // inline text links inside running copy are exempt (WCAG 2.5.8 inline exception)
      if (el.closest('p, dd') && !el.matches('.pill, .copy, .round, .contact-mail a')) return;
      if (r.height < 24 || r.width < 24) small.push(`${Math.round(r.width)}x${Math.round(r.height)} ${el.textContent.trim().slice(0, 24)}`);
    });
    out.targetsUnder24 = small;
    out.mode = de.className;
    return out;
  });
}

// where each strip panel is, in px, and the column's state
const stripState = page => page.evaluate(() => ({
  pin: document.documentElement.classList.contains('pin'),
  narrow: document.documentElement.classList.contains('narrow'),
  panels: [...document.querySelectorAll('[data-panel]')].map(p => { const r = p.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
  stream: document.querySelector('.stream').classList.contains('on'),
  pastHero: document.documentElement.classList.contains('past-hero'),
}));

(async () => {
  // reuse a server that is already serving this repo on the port (e.g. the preview), otherwise start one
  let server = null;
  try { server = await start(PORT); } catch (e) { if (e.code !== 'EADDRINUSE') throw e; }
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });

  /* ---------- per-viewport sweep ---------- */
  for (const vp of VIEWPORTS) {
    const { page, log } = await newPage(browser, vp);
    const res = { shots: [] };
    await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 });
    await sleep(3400);   // the opening runs about 2.8 s
    res.first = await auditStatic(page);
    const shot = async name => { const f = `${vp.name}-${name}.jpg`; await page.screenshot({ path: path.join(OUT, f), type: 'jpeg', quality: 72 }); res.shots.push(f); };
    await shot('00-hero');
    const ids = ['rok', 'rok-site', 'lennys', 'bbs', 'bbs-site', 'approach', 'capabilities', 'contact'];
    for (const id of ids) {
      const y = await page.evaluate(id => { const el = document.getElementById(id); return el.getBoundingClientRect().top + window.scrollY; }, id);
      await stepTo(page, y);
      await shot(`${String(ids.indexOf(id) + 1).padStart(2, '0')}-${id}`);
    }
    await stepTo(page, await page.evaluate(() => document.documentElement.scrollHeight - innerHeight));
    await shot('09-end');
    // the close: every letter of the footer's LUMERA has risen by the end of the page
    res.footLetters = await page.evaluate(() => [...document.querySelectorAll('.foot-mark svg')].map(s => { const r = s.getBoundingClientRect(), m = s.closest('.foot-mark').getBoundingClientRect(); return Math.round(r.bottom - m.bottom); }));
    if (res.footLetters.some(d => Math.abs(d) > 2)) problem(vp.name, 'footer letters have not risen at the end of the page: ' + res.footLetters.join(','));
    await scrollToY(page, 0, 1400);
    res.last = await auditStatic(page);
    res.log = log;
    report.viewports[vp.name] = res;
    const w = vp.name;
    if (res.first.hscroll || res.last.hscroll) problem(w, 'horizontal overflow');
    if (res.last.overflowers.length) problem(w, 'elements past the viewport edge: ' + res.last.overflowers.join(', '));
    if (res.first.h1 !== 1) problem(w, `h1 count ${res.first.h1}`);
    if (res.first.headingSkips) problem(w, 'heading level skipped');
    if (res.first.imgsNoAlt) problem(w, 'images without alt');
    if (res.last.brokenImgs.length) problem(w, 'broken images ' + res.last.brokenImgs.join(', '));
    if (res.first.deadHash.length) problem(w, 'dead # links ' + res.first.deadHash.join(', '));
    if (vp.touch && res.first.targetsUnder24.length) problem(w, 'small touch targets ' + res.first.targetsUnder24.join(' | '));
    if (log.console.length) problem(w, 'console: ' + log.console.slice(0, 3).join(' | '));
    if (log.pageErrors.length) problem(w, 'page errors: ' + log.pageErrors.join(' | '));
    if (log.failed.length) problem(w, 'failed requests: ' + log.failed.join(' | '));
    if (log.http.length) problem(w, 'http errors: ' + log.http.join(' | '));
    await page.close();
  }

  /* ---------- the opening ---------- */
  for (const vp of [VIEWPORTS[0], VIEWPORTS[5]]) {
    const { page, log } = await newPage(browser, vp);
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await sleep(350);
    const during = await page.evaluate(() => ({ loader: getComputedStyle(document.getElementById('loader')).display !== 'none', run: document.documentElement.classList.contains('intro-run') }));
    await sleep(3600);
    const after = await page.evaluate(() => ({
      loader: getComputedStyle(document.getElementById('loader')).display !== 'none',
      letters: [...document.querySelectorAll('.hero-mark svg')].map(s => getComputedStyle(s).clipPath),
      heroText: getComputedStyle(document.querySelector('.hero-tag')).transform,
    }));
    report.interactions['opening-' + vp.name] = { during, after };
    if (!during.loader || !during.run) problem('opening ' + vp.name, 'the loader did not show: ' + JSON.stringify(during));
    if (after.loader) problem('opening ' + vp.name, 'the loader is still up after 4 s');
    if (after.letters.some(c => c !== 'none')) problem('opening ' + vp.name, 'hero letters still clipped: ' + after.letters.join(' | '));
    if (after.heroText !== 'none') problem('opening ' + vp.name, 'hero text did not settle: ' + after.heroText);
    if (log.console.length || log.pageErrors.length) problem('opening ' + vp.name, [...log.console, ...log.pageErrors].slice(0, 3).join(' | '));
    await page.close();
  }

  /* ---------- desktop: the strip, the capabilities, the header, links and the rest ---------- */
  {
    const vp = VIEWPORTS[0];
    const { page, log } = await newPage(browser, vp);
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await sleep(3400);
    const I = report.interactions.desktop = {};
    const VW = vp.width, VH = vp.height;
    // the strip: at rest the hero is half the width and the projects wait at the edge; each opens in turn
    I.strip = { rest: await stripState(page) };
    const r = I.strip.rest;
    if (!r.pin || r.narrow) problem('strip', 'the wide pinned layout is off at 1440×900');
    if (Math.abs(r.panels[0].w - VW * 0.5) > 2 || r.panels[1].x < VW * 0.45 || r.panels[4].x < VW * 0.9) problem('strip', 'rest layout: ' + JSON.stringify(r.panels));
    if (r.pastHero) problem('strip', 'header controls shown over the hero');
    const holdY = VH * 0.3;
    for (const i of [1, 2, 3]) {
      await stepTo(page, holdY + i * VH, 8, 1400);
      const s = await stripState(page);
      I.strip['open' + i] = s;
      const p = s.panels[i];
      if (Math.abs(p.x) > 3 || Math.abs(p.w - VW * 0.62) > 3) problem('strip', `project ${i} is not open at the left edge: ` + JSON.stringify(p));
      if (!s.pastHero) problem('strip', 'logo and menu did not arrive after the hero');
    }
    // the last project closes into a column, the list fills the rest, and the stream starts
    await stepTo(page, holdY + 3 * VH + 0.8 * VH + 20, 6, 1400);
    I.strip.column = await stripState(page);
    const c = I.strip.column;
    if (Math.abs(c.panels[3].w - VW * 0.26) > 3 || Math.abs(c.panels[4].x - VW * 0.26) > 3 || Math.abs(c.panels[4].w - VW * 0.74) > 3 || !c.stream) problem('strip', 'column layout: ' + JSON.stringify(c));
    I.listRisen = await page.evaluate(() => document.querySelector('.list-h').classList.contains('in'));
    if (!I.listRisen) problem('strip', 'the work list heading did not rise');
    // hero nav: Approach and Capabilities land at their tops; Work opens the work list
    await scrollToY(page, 0, 1200);
    I.nav = [];
    for (const href of ['#approach', '#capabilities', '#work']) {
      await page.evaluate(() => window.scrollTo(0, 0)); await sleep(700);
      await page.click(`.hero-nav a[href="${href}"]`);
      await sleep(2200);
      I.nav.push(await page.evaluate(h => { const el = document.querySelector(h); const r = el.getBoundingClientRect(); return { href: h, top: Math.round(r.top), left: Math.round(r.left), focused: document.activeElement === el, hash: location.hash }; }, href));
    }
    I.nav.forEach(n => {
      if (n.href === '#work') { if (Math.abs(n.left - VW * 0.26) > 4) problem('desktop nav', 'Work did not open the work list: ' + JSON.stringify(n)); }
      else if (Math.abs(n.top) > 6) problem('desktop nav', `${n.href} landed at ${n.top}px`);
      if (!n.focused) problem('desktop nav', `${n.href} did not take focus`);
    });
    // keyboard: focusing a project's arrow opens that project
    await scrollToY(page, 0, 900);
    await page.focus('[data-panel]:nth-child(3) .round');
    await sleep(1600);
    I.focusPanel = await stripState(page);
    if (Math.abs(I.focusPanel.panels[2].x) > 4) problem('strip', "focusing Lenny's arrow did not open its panel: " + JSON.stringify(I.focusPanel.panels[2]));
    // capabilities: each panel pushes in over the last, and the nav follows
    const capTop = await page.evaluate(() => document.getElementById('capabilities').offsetTop);
    I.caps = [];
    for (const k of [0, 1, 2]) {
      await stepTo(page, capTop + (0.25 + k) * VH + 10, 6, 1300);
      I.caps.push(await page.evaluate(() => ({ x: [...document.querySelectorAll('.cap')].map(p => Math.round(p.getBoundingClientRect().left)), on: [...document.querySelectorAll('.cap-nav span')].findIndex(s => s.classList.contains('on')) })));
    }
    I.caps.forEach((s, k) => {
      if (Math.abs(s.x[k]) > 3 || s.on !== k) problem('capabilities', `panel ${k + 1} not in place: ` + JSON.stringify(s));
      if (k < 2 && !(s.x[k + 1] > VW * 0.85 && s.x[k + 1] < VW)) problem('capabilities', `the next panel does not wait at the edge: ` + JSON.stringify(s));
    });
    // the logo turns light over the dark sections
    const apTop = await page.evaluate(() => document.getElementById('approach').offsetTop);
    await stepTo(page, apTop + 200, 4, 900);
    I.logoOnDark = await page.evaluate(() => getComputedStyle(document.querySelector('.top .logo')).color);
    if (I.logoOnDark !== 'rgb(238, 234, 227)') problem('header', 'logo is not light over the approach: ' + I.logoOnDark);
    // rōk scrub follows scroll forward and back
    const rokY = await page.evaluate(() => { const c = document.querySelector('.crop'); return c.getBoundingClientRect().top + window.scrollY; });
    const scrubAt = async y => { await scrollToY(page, y, 1600); return page.evaluate(() => { const v = document.querySelector('.scrub-video'); return { t: +v.currentTime.toFixed(2), p: +getComputedStyle(document.querySelector('.scrub-meter')).getPropertyValue('--p') }; }); };
    await scrollToY(page, rokY - 1400, 600);
    I.scrub = { before: await scrubAt(rokY - 700), mid: await scrubAt(rokY - 200), late: await scrubAt(rokY + 400) };
    I.scrub.back = await scrubAt(rokY - 200);
    if (!(I.scrub.mid.t > I.scrub.before.t && I.scrub.late.t > I.scrub.mid.t && Math.abs(I.scrub.back.t - I.scrub.mid.t) < 0.4)) problem('rōk scrub', 'does not track scroll forward and back: ' + JSON.stringify(I.scrub));
    // Lenny's color follows the recording
    const lenY = await page.evaluate(() => { const v = document.querySelector('#lennys .site-screens'); return v.getBoundingClientRect().top + window.scrollY - 120; });
    await scrollToY(page, lenY, 400);
    const colors = [];
    for (let k = 0; k < 6; k++) { await sleep(1500); colors.push(await page.evaluate(() => ({ t: +document.querySelector('#lennys video[data-colors="d"]').currentTime.toFixed(1), bg: getComputedStyle(document.getElementById('lennys')).backgroundColor }))); }
    I.lennys = colors;
    if (new Set(colors.map(c => c.bg)).size < 2) problem("Lenny's", 'section color never changed while the recording played');
    I.lennysDrinks = await page.evaluate(async () => {
      const v = document.querySelector('#lennys video[data-colors="d"]'), seq = window.LUMERA_LENNYS_COLORS.dDrink;
      const at = async t => { v.currentTime = t; await new Promise(r => setTimeout(r, 900)); return [...document.querySelectorAll('.drinks li')].findIndex(li => li.classList.contains('is-on')); };
      const first = seq.indexOf('0');
      return { firstDrinkAt: first / 10, onFirst: await at(first / 10 + 0.3), onMenu: await at(Math.min(v.duration - 2, seq.length / 10 - 8)) };
    });
    if (I.lennysDrinks.onFirst !== 0 || I.lennysDrinks.onMenu !== -1) problem("Lenny's", 'cocktail list lights at the wrong time: ' + JSON.stringify(I.lennysDrinks));
    // BB's window grows with scroll
    const bbY = await page.evaluate(() => { const a = document.getElementById('bbs-art'); return a.getBoundingClientRect().top + window.scrollY; });
    const win = async y => { await scrollToY(page, y, 1500); return page.evaluate(() => getComputedStyle(document.getElementById('bbs-art')).getPropertyValue('--ww').trim()); };
    I.bbs = { early: await win(bbY - 800), later: await win(bbY - 150), end: await win(bbY + 300) };
    if (!(parseFloat(I.bbs.later) > parseFloat(I.bbs.early) && parseFloat(I.bbs.end) >= parseFloat(I.bbs.later))) problem("BB's", 'window does not grow with scroll: ' + JSON.stringify(I.bbs));
    // folds: closed by default, open by click and by keyboard; the credits stay outside them
    I.folds = await page.evaluate(() => [...document.querySelectorAll('.build')].map(d => ({ open: d.open, credits: [...d.closest('.study').querySelectorAll('dt')].some(dt => /Credits/.test(dt.textContent) && !dt.closest('.build')) })));
    if (I.folds.length !== 3 || I.folds.some(f => f.open)) problem('folds', 'expected three closed folds: ' + JSON.stringify(I.folds));
    if (I.folds.some(f => !f.credits)) problem('folds', 'credits folded away in a study');
    await page.evaluate(() => { const s = document.querySelector('#rok .build summary'); window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 300); });
    await sleep(700);
    await page.click('#rok .build summary'); await sleep(900);
    I.foldClick = await page.evaluate(() => { const d = document.querySelector('#rok .build'); const li = d.querySelector('li'); return { open: d.open, shown: li.getBoundingClientRect().height > 0 }; });
    await page.focus('#bbs .build summary'); await page.keyboard.press('Enter'); await sleep(900);
    I.foldKey = await page.evaluate(() => document.querySelector('#bbs .build').open);
    if (!I.foldClick.open || !I.foldClick.shown) problem('folds', 'click did not open the rōk fold: ' + JSON.stringify(I.foldClick));
    if (!I.foldKey) problem('folds', "Enter did not open the BB's fold");
    // contrast of text on each colored surface
    I.contrast = await page.evaluate(() => {
      const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      const lum = s => { const [r, g, b] = s.match(/[\d.]+/g).map(Number); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
      const bgOf = el => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (!/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; } return 'rgb(238, 234, 227)'; };
      const sel = ['.p-name', '.p-meta', '.hero-sub', '.list-text', '#rok .study-q', '#rok .facts dt', '#bbs .study-q', '#bbs .facts dt', '#lennys .study-q', '#lennys .facts dt', '.ap-rows p', '.cap-list', '.cap-note', '.contact-sub', '.foot-note', '.foot-info .dim'];
      return sel.flatMap(s => [...document.querySelectorAll(s)].map(el => ({ s, r: ratio(getComputedStyle(el).color, bgOf(el)), op: +getComputedStyle(el).opacity })));
    });
    I.contrast.forEach(c => { if (c.op === 1 && c.r < 4.5) problem('contrast', `${c.s}: ${c.r}`); });
    // copy button
    await page.evaluate(() => document.getElementById('contact').scrollIntoView());
    await sleep(800);
    const ctx = browser.defaultBrowserContext(); await ctx.overridePermissions(BASE, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
    await page.click('.copy'); await sleep(300);
    I.copy = await page.evaluate(() => document.querySelector('.copy-status').textContent);
    if (I.copy !== 'Copied') problem('contact', 'copy button status: ' + I.copy);
    I.mailto = await page.evaluate(() => [...document.querySelectorAll('a[href^="mailto:"]')].map(a => a.getAttribute('href')));
    // keyboard: first Tab shows the skip link, then the hero's links, each with a visible outline; nothing hidden takes focus
    await page.goto(BASE, { waitUntil: 'networkidle0' }); await sleep(3200);
    const order = [];
    for (let k = 0; k < 8; k++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return `${a.tagName.toLowerCase()}:${(a.textContent || '').trim().slice(0, 22)}|outline=${cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0}|op=${cs.opacity}`; })); }
    I.tabOrder = order;
    if (!/Skip/.test(order[0])) problem('keyboard', 'first Tab is not the skip link');
    if (order.some(o => /outline=false/.test(o))) problem('keyboard', 'a focused control has no visible outline: ' + order.filter(o => /outline=false/.test(o)).join(', '));
    if (order.some(o => /op=0$/.test(o))) problem('keyboard', 'an invisible control took focus: ' + order.filter(o => /op=0$/.test(o)).join(', '));
    // reload mid-page keeps a sane layout; no opening off the top
    await page.evaluate(() => { const el = document.getElementById('lennys'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 200); });
    await sleep(800);
    await page.reload({ waitUntil: 'load' }); await sleep(2000);
    I.reloadMid = await page.evaluate(() => ({ y: Math.round(scrollY), loader: getComputedStyle(document.getElementById('loader')).display !== 'none', pin: document.documentElement.classList.contains('pin') }));
    if (I.reloadMid.loader) problem('reload', 'the opening ran on a mid-page reload');
    // resize without reload: 1440 → 900 → 1440
    await page.setViewport({ width: 900, height: 900 }); await sleep(1200);
    I.resizeNarrow = await page.evaluate(() => ({ pin: document.documentElement.classList.contains('pin'), hscroll: document.documentElement.scrollWidth > innerWidth, strip: document.querySelector('.strip').style.height }));
    await page.setViewport({ width: 1440, height: 900 }); await sleep(1200);
    I.resizeBack = await page.evaluate(() => ({ pin: document.documentElement.classList.contains('pin'), hscroll: document.documentElement.scrollWidth > innerWidth, strip: document.querySelector('.strip').style.height }));
    if (I.resizeNarrow.pin || I.resizeNarrow.strip || !I.resizeBack.pin || !I.resizeBack.strip) problem('resize', 'layout did not follow the width: ' + JSON.stringify([I.resizeNarrow, I.resizeBack]));
    if (I.resizeNarrow.hscroll || I.resizeBack.hscroll) problem('resize', 'horizontal overflow after resizing');
    // drag through arbitrary widths
    I.widths = [];
    for (const w of [1366, 1180, 1023, 960, 820, 700, 600, 520, 480, 1600, 1920]) {
      await page.setViewport({ width: w, height: 900 }); await sleep(500);
      const a = await page.evaluate(() => ({ w: innerWidth, hscroll: document.documentElement.scrollWidth > innerWidth + 1 }));
      I.widths.push(a);
      if (a.hscroll) problem('resize sweep', `overflow at ${w}px`);
    }
    report.interactions.desktopLog = log;
    if (log.console.length || log.pageErrors.length) problem('desktop interactions', [...log.console, ...log.pageErrors].slice(0, 4).join(' | '));
    await page.close();
  }

  /* ---------- phone: the same pinned strip and capability panels, drawn for a tall window ---------- */
  {
    const vp = VIEWPORTS[5];
    const { page, log } = await newPage(browser, vp);
    await page.goto(BASE, { waitUntil: 'networkidle0' }); await sleep(3400);
    const P = report.interactions.phoneStrip = {};
    const VW = vp.width, VH = vp.height;
    P.rest = await stripState(page);
    P.burgerAtRest = await page.evaluate(() => getComputedStyle(document.getElementById('menu-btn')).visibility);
    if (!P.rest.pin || !P.rest.narrow) problem('phone strip', 'the narrow pinned layout is off at 390×844: ' + JSON.stringify(P.rest));
    if (Math.abs(P.rest.panels[0].w - VW * 0.8) > 2 || Math.abs(P.rest.panels[1].x - VW * 0.8) > 2) problem('phone strip', 'rest layout: ' + JSON.stringify(P.rest.panels));
    if (P.burgerAtRest !== 'visible') problem('phone strip', 'the menu pill is hidden over the hero');
    for (const i of [1, 2, 3, 4]) {
      await stepTo(page, (0.3 + i) * VH, 8, 1400);
      const st = await stripState(page);
      P['open' + i] = st.panels[i];
      const want = i === 4 ? VW : VW * 0.84;
      if (Math.abs(st.panels[i].x) > 3 || Math.abs(st.panels[i].w - want) > 3) problem('phone strip', `panel ${i} is not open at the left edge: ` + JSON.stringify(st.panels[i]));
    }
    P.listRisen = await page.evaluate(() => document.querySelector('.list-h').classList.contains('in'));
    if (!P.listRisen) problem('phone strip', 'the project list heading did not rise');
    const capTop = await page.evaluate(() => document.getElementById('capabilities').offsetTop);
    P.caps = [];
    for (const k of [0, 1, 2]) {
      await stepTo(page, capTop + (0.25 + k) * VH + 10, 6, 1300);
      P.caps.push(await page.evaluate(() => [...document.querySelectorAll('.cap')].map(p => Math.round(p.getBoundingClientRect().left))));
    }
    P.caps.forEach((x, k) => { if (Math.abs(x[k]) > 3 || (k < 2 && !(x[k + 1] > VW * 0.85 && x[k + 1] < VW))) problem('phone capabilities', `panel ${k + 1} not in place: ` + JSON.stringify(x)); });
    await page.screenshot({ path: path.join(OUT, 'phone-caps-390.jpg'), type: 'jpeg', quality: 70 });
    if (log.console.length || log.pageErrors.length) problem('phone strip', [...log.console, ...log.pageErrors].slice(0, 3).join(' | '));
    await page.close();
  }

  /* ---------- phone menu ---------- */
  {
    const vp = VIEWPORTS[5];
    const { page, log } = await newPage(browser, vp);
    await page.goto(BASE, { waitUntil: 'networkidle0' }); await sleep(3200);
    const M = report.interactions.menu = {};
    await page.click('#menu-btn'); await sleep(1100);
    M.open = await page.evaluate(() => ({ hidden: document.getElementById('menu').hidden, expanded: document.getElementById('menu-btn').getAttribute('aria-expanded'), focus: document.activeElement.textContent.trim(), mainInert: document.getElementById('main').inert }));
    await page.screenshot({ path: path.join(OUT, 'menu-open-390.jpg'), type: 'jpeg', quality: 72 });
    for (let k = 0; k < 10; k++) await page.keyboard.press('Tab');
    M.trapped = await page.evaluate(() => !!document.activeElement.closest('#menu'));
    await page.keyboard.press('Escape'); await sleep(1100);
    M.afterEscape = await page.evaluate(() => ({ hidden: document.getElementById('menu').hidden, focus: document.activeElement.id }));
    await page.click('#menu-btn'); await sleep(1000);
    await page.click('.menu-nav a[href="#capabilities"]'); await sleep(2400);
    M.linkNav = await page.evaluate(() => ({ hidden: document.getElementById('menu').hidden, top: Math.round(document.getElementById('capabilities').getBoundingClientRect().top) }));
    if (M.open.hidden || M.open.expanded !== 'true' || !M.open.mainInert) problem('menu', 'did not open correctly');
    if (!M.trapped) problem('menu', 'focus escaped the open menu');
    if (!M.afterEscape.hidden || M.afterEscape.focus !== 'menu-btn') problem('menu', 'Escape did not close and return focus: ' + JSON.stringify(M.afterEscape));
    if (!M.linkNav.hidden || Math.abs(M.linkNav.top) > 8) problem('menu', 'menu link did not close and land: ' + JSON.stringify(M.linkNav));
    report.interactions.menuLog = log;
    if (log.console.length || log.pageErrors.length) problem('menu', [...log.console, ...log.pageErrors].slice(0, 3).join(' | '));
    await page.close();
  }

  /* ---------- reduced motion ---------- */
  for (const vp of [VIEWPORTS[0], VIEWPORTS[5]]) {
    const { page, log } = await newPage(browser, vp, { reduce: true });
    await page.goto(BASE, { waitUntil: 'networkidle0' }); await sleep(1200);
    const R = report.interactions['reduced-' + vp.name] = {};
    R.mode = await page.evaluate(() => document.documentElement.className);
    R.loader = await page.evaluate(() => getComputedStyle(document.getElementById('loader')).display !== 'none');
    R.playButtons = await page.evaluate(() => document.querySelectorAll('.play').length);
    R.autoplaying = await page.evaluate(() => [...document.querySelectorAll('video')].filter(v => !v.paused).length);
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    let k = 0;
    for (let y = 0; y < H; y += vp.height * 1.6) { await scrollToY(page, y, 350); if (k < 12) await page.screenshot({ path: path.join(OUT, `reduced-${vp.name}-${String(k++).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 65 }); }
    R.hidden = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('.hero-mark svg, .foot-mark svg').forEach(s => { const cs = getComputedStyle(s); if (cs.clipPath !== 'none' || cs.transform !== 'none') bad.push('letter'); });
      document.querySelectorAll('[data-rise] span').forEach(s => { if (getComputedStyle(s).transform !== 'none') bad.push('word'); });
      return bad.length;
    });
    if (/\bpin\b/.test(R.mode)) problem('reduced motion', 'the pinned sideways layout runs with reduced motion');
    if (R.loader) problem('reduced motion', 'the opening ran');
    if (R.hidden) problem('reduced motion', `${R.hidden} letters or words are not in their final place`);
    if (R.autoplaying) problem('reduced motion', 'recordings autoplay');
    const loops = await page.evaluate(() => document.querySelectorAll('video.media-video').length);
    if (R.playButtons !== loops) problem('reduced motion', `${R.playButtons} Play buttons for ${loops} recordings`);
    if (log.console.length || log.pageErrors.length) problem('reduced ' + vp.name, [...log.console, ...log.pageErrors].slice(0, 3).join(' | '));
    await page.close();
  }

  /* ---------- no JavaScript ---------- */
  for (const vp of [VIEWPORTS[0], VIEWPORTS[5]]) {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr || 1, isMobile: !!vp.touch, hasTouch: !!vp.touch });
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    for (const id of ['work', 'rok', 'lennys', 'bbs']) {
      await page.evaluate(id => document.getElementById(id).scrollIntoView(), id);
      await sleep(250);
      await page.screenshot({ path: path.join(OUT, `nojs-${vp.name}-${id}.jpg`), type: 'jpeg', quality: 70 });
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(OUT, `nojs-${vp.name}-hero.jpg`), type: 'jpeg', quality: 70 });
    const N = report.interactions['noJS-' + vp.name] = await page.evaluate(() => {
      const shown = el => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
      const media = [...document.querySelectorAll('.crop, .site-desk, .phone-screen')].map(box => {
        const img = box.querySelector('img'); const b = box.getBoundingClientRect(), r = img ? img.getBoundingClientRect() : null;
        return { box: box.className, still: !!img && img.complete && img.naturalWidth > 0, fills: !!r && Math.abs(r.width - b.width) < 2 && Math.abs(r.height - b.height) < 2, src: img ? img.currentSrc.split('/').pop() : null };
      });
      return {
        h1: document.querySelector('h1').innerText.replace(/\s+/g, ' '), hscroll: document.documentElement.scrollWidth > innerWidth, media,
        heroNav: shown(document.querySelector('.hero-nav')),
        videosShown: [...document.querySelectorAll('video')].filter(shown).length,
        deadControls: ['.burger', '.copy', '.play', '.live-btn'].filter(sel => [...document.querySelectorAll(sel)].some(shown)),
      };
    });
    const where = 'no-JS ' + vp.name;
    if (!/Where design meets innovation/.test(N.h1)) problem(where, 'headline text missing: ' + N.h1);
    if (N.hscroll) problem(where, 'horizontal overflow');
    if (!N.heroNav) problem(where, 'no navigation without the menu button');
    N.media.forEach(m => { if (!m.still || !m.fills) problem(where, `no still filling ${m.box} (${m.src})`); });
    if (N.videosShown) problem(where, `${N.videosShown} empty video boxes shown`);
    if (N.deadControls.length) problem(where, 'controls that need JavaScript are shown: ' + N.deadControls.join(', '));
    await page.close();
  }

  /* ---------- scroll it yourself: the live site inside a screen ---------- */
  // (its own pages: the embedded studies load third-party players and tiles, whose console output isn't ours to judge)
  for (const [vp, sel, kind] of [[VIEWPORTS[0], '#lennys .site', 'desk'], [VIEWPORTS[5], '#rok-site', 'phone']]) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr || 1, isMobile: !!vp.touch, hasTouch: !!vp.touch });
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await sleep(3200);
    const L = report.interactions['live-' + vp.name] = {};
    L.buttons = await page.evaluate(() => [...document.querySelectorAll('.live-btn')].map(b => `${b.closest('.study').id}/${b.dataset.live}:${b.hidden ? 'hidden' : 'shown'}`));
    await page.evaluate(s => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 90); }, sel);
    await sleep(1400);
    await page.click(`${sel} .live-btn[data-live="${kind}"]`);
    await page.waitForSelector(`${sel} .is-loaded`, { timeout: 30000 }).catch(() => {});
    await sleep(1500);
    L.open = await page.evaluate((s, k) => {
      const box = document.querySelector(`${s} ${k === 'desk' ? '.site-desk' : '.phone-screen'}`), f = box.querySelector('iframe');
      if (!f) return { iframe: false };
      const b = box.getBoundingClientRect(), r = f.getBoundingClientRect();
      return { iframe: true, loaded: box.classList.contains('is-loaded'), src: f.src, layoutWidth: parseFloat(f.style.width), fits: Math.abs(r.width - b.width) < 2 && Math.abs(r.height - b.height) < 2, videoHidden: getComputedStyle(box.querySelector('video')).visibility === 'hidden', label: document.querySelector(`${s} .live-btn[data-live="${k}"]`).getAttribute('aria-label') };
    }, sel, kind);
    await page.screenshot({ path: path.join(OUT, `live-${vp.name}.jpg`), type: 'jpeg', quality: 72 });
    await page.click(`${sel} .live-btn[data-live="${kind}"]`); await sleep(600);
    L.closed = await page.evaluate((s, k) => { const box = document.querySelector(`${s} ${k === 'desk' ? '.site-desk' : '.phone-screen'}`); return { iframe: !!box.querySelector('iframe'), videoVisible: getComputedStyle(box.querySelector('video')).visibility === 'visible' }; }, sel, kind);
    const where = 'live ' + vp.name;
    if (!L.open.iframe || !L.open.loaded) problem(where, 'live site did not load in the screen: ' + JSON.stringify(L.open));
    else if (!L.open.fits || !L.open.videoHidden) problem(where, 'live site does not fill its screen: ' + JSON.stringify(L.open));
    if (L.closed.iframe || !L.closed.videoVisible) problem(where, 'Back to the recording did not restore the video: ' + JSON.stringify(L.closed));
    if (vp.width < 760 && L.buttons.some(b => /desk:shown/.test(b))) problem(where, 'laptop live mode offered on a phone');
    await page.close();
  }

  /* ---------- legal page ---------- */
  for (const vp of [VIEWPORTS[0], VIEWPORTS[5]]) {
    const { page, log } = await newPage(browser, vp);
    await page.goto(BASE + 'legal.html', { waitUntil: 'networkidle0' });
    const a = await auditStatic(page);
    await page.screenshot({ path: path.join(OUT, `legal-${vp.name}.jpg`), type: 'jpeg', quality: 70 });
    report.interactions['legal-' + vp.name] = a;
    if (a.hscroll) problem('legal ' + vp.name, 'horizontal overflow');
    if (log.console.length || log.pageErrors.length || log.http.length) problem('legal ' + vp.name, [...log.console, ...log.pageErrors, ...log.http].join(' | '));
    await page.close();
  }

  await browser.close();
  if (server) server.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(report.problems.length ? `PROBLEMS (${report.problems.length}):\n- ` + report.problems.join('\n- ') : 'No problems found.');
})();
