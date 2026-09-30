// Rendered-browser QA for the Lumera Creative portfolio.
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

async function auditStatic(page) {
  return page.evaluate(() => {
    const out = {};
    const de = document.documentElement;
    out.hscroll = de.scrollWidth > window.innerWidth + 1;
    out.overflowers = [...document.querySelectorAll('body *')].filter(el => {
      if (el.closest('.af, .menu, .sprite')) return false;
      const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1);
    }).slice(0, 8).map(el => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
    out.h1 = document.querySelectorAll('h1').length;
    const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map(h => +h.tagName[1]);
    out.headingSkips = hs.filter((l, i) => i > 0 && l > hs[i - 1] + 1).length;
    out.imgsNoAlt = [...document.images].filter(i => !i.hasAttribute('alt')).length;
    out.brokenImgs = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('loading') !== 'lazy').map(i => i.src);
    out.videosNoLabel = [...document.querySelectorAll('video')].filter(v => !v.getAttribute('aria-label')).length;
    out.deadHash = [...document.querySelectorAll('a[href^="#"]')].filter(a => a.getAttribute('href') === '#' || (a.getAttribute('href') !== '#top' && !document.querySelector(a.getAttribute('href')))).map(a => a.getAttribute('href'));
    out.links = [...document.querySelectorAll('a[href]')].length;
    const small = [];
    document.querySelectorAll('a[href], button').forEach(el => {
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.menu[hidden]')) return;
      const r = el.getBoundingClientRect(); if (!r.width) return;
      if (el.closest('.skip')) return;
      // inline text links inside running copy are exempt (WCAG 2.5.8 inline exception)
      if (el.closest('p, dd, li') && !el.matches('.btn, .copy, .cap-refs a, .work-index a, .foot-links a, .contact-mail a, .menu-mail a')) return;
      if (r.height < 24 || r.width < 24) small.push(`${Math.round(r.width)}x${Math.round(r.height)} ${el.textContent.trim().slice(0, 24)}`);
    });
    out.targetsUnder24 = small;
    out.mode = de.className;
    return out;
  });
}

async function frameState(page) {
  return page.evaluate(() => {
    const af = document.getElementById('af');
    const on = document.documentElement.classList.contains('af-on');
    const role = af.querySelector('.af-role').textContent, dim = af.querySelector('.af-dim').textContent;
    const t = document.querySelector('.af-t').getBoundingClientRect();
    return { on, role, dim, top: { x: Math.round(t.left), y: Math.round(t.top), w: Math.round(t.width) } };
  });
}

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
    await sleep(1600);
    res.first = await auditStatic(page);
    const shot = async name => { const f = `${vp.name}-${name}.jpg`; await page.screenshot({ path: path.join(OUT, f), type: 'jpeg', quality: 72 }); res.shots.push(f); };
    await shot('00-hero');
    const ids = ['work', 'rok', 'rok-site', 'lennys', 'bbs', 'bbs-site', 'approach', 'capabilities', 'contact'];
    res.sections = {};
    for (const id of ids) {
      const y = await page.evaluate(id => { const el = document.getElementById(id); return el.getBoundingClientRect().top + window.scrollY - 60; }, id);
      // step toward the target so scroll-linked pieces see real progress
      const cur = await page.evaluate(() => window.scrollY);
      for (let k = 1; k <= 6; k++) await scrollToY(page, cur + (y - cur) * k / 6, 90);
      await sleep(1100);
      res.sections[id] = await frameState(page);
      await shot(`${String(ids.indexOf(id) + 1).padStart(2, '0')}-${id}`);
    }
    // back up through the page (reversal)
    await scrollToY(page, 0, 1200);
    res.backToTop = await frameState(page);
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

  /* ---------- desktop interactions ---------- */
  {
    const vp = VIEWPORTS[0];
    const { page, log } = await newPage(browser, vp);
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await sleep(1500);
    const I = report.interactions.desktop = {};
    // nav links land on their section
    I.nav = [];
    for (const href of ['#work', '#approach', '#capabilities', '#contact']) {
      await page.click(`.nav a[href="${href}"]`);
      await sleep(1900);
      I.nav.push(await page.evaluate(h => { const el = document.querySelector(h); const r = el.getBoundingClientRect(); return { href: h, top: Math.round(r.top), focused: document.activeElement === el, hash: location.hash }; }, href));
    }
    I.nav.forEach(n => { if (Math.abs(n.top - 72) > 6) problem('desktop nav', `${n.href} landed at ${n.top}px (header is 72px)`); });
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
    for (let k = 0; k < 6; k++) { await sleep(1500); colors.push(await page.evaluate(() => ({ t: +document.querySelector('#lennys video[data-colors="d"]').currentTime.toFixed(1), bg: getComputedStyle(document.getElementById('lennys')).backgroundColor, on: [...document.querySelectorAll('.drinks li')].findIndex(li => li.classList.contains('is-on')) }))); }
    I.lennys = colors;
    if (new Set(colors.map(c => c.bg)).size < 2) problem("Lenny's", 'section color never changed while the recording played');
    // the cocktail list lights during the cocktail chapter only (precomputed timings), never on the food menu
    I.lennysDrinks = await page.evaluate(async () => {
      const v = document.querySelector('#lennys video[data-colors="d"]'), seq = window.LUMERA_LENNYS_COLORS.dDrink;
      const at = async t => { v.currentTime = t; await new Promise(r => setTimeout(r, 900)); return [...document.querySelectorAll('.drinks li')].findIndex(li => li.classList.contains('is-on')); };
      const first = seq.indexOf('0');
      return { firstDrinkAt: first / 10, onFirst: await at(first / 10 + 0.3), onMenu: await at(Math.min(v.duration - 2, seq.length / 10 - 8)) };
    });
    if (I.lennysDrinks.onFirst !== 0 || I.lennysDrinks.onMenu !== -1) problem("Lenny's", 'cocktail list lights at the wrong time: ' + JSON.stringify(I.lennysDrinks));
    // BB's boundary grows with scroll
    const bbY = await page.evaluate(() => { const a = document.getElementById('bbs-art'); return a.getBoundingClientRect().top + window.scrollY; });
    const win = async y => { await scrollToY(page, y, 1500); return page.evaluate(() => getComputedStyle(document.getElementById('bbs-art')).getPropertyValue('--ww').trim()); };
    I.bbs = { early: await win(bbY - 800), later: await win(bbY - 150), end: await win(bbY + 300) };
    if (!(parseFloat(I.bbs.later) > parseFloat(I.bbs.early) && parseFloat(I.bbs.end) >= parseFloat(I.bbs.later))) problem("BB's", 'boundary does not grow with scroll: ' + JSON.stringify(I.bbs));
    // capability row borrows the frame
    await page.evaluate(() => document.getElementById('capabilities').scrollIntoView());
    await sleep(1400);
    const row = await page.$('.cap-row');
    await row.hover(); await sleep(900);
    I.capHover = await frameState(page);
    if (!/^Row/.test(I.capHover.role)) problem('capabilities', 'hovered row did not take the frame: ' + I.capHover.role);
    // copy button
    await page.evaluate(() => document.getElementById('contact').scrollIntoView());
    await sleep(800);
    const ctx = browser.defaultBrowserContext(); await ctx.overridePermissions(BASE, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
    await page.click('.copy'); await sleep(300);
    I.copy = await page.evaluate(() => document.querySelector('.copy-status').textContent);
    if (I.copy !== 'Copied') problem('contact', 'copy button status: ' + I.copy);
    I.mailto = await page.evaluate(() => [...document.querySelectorAll('a[href^="mailto:"]')].map(a => a.getAttribute('href')));
    // keyboard: first Tab shows the skip link, then header links in order
    await page.goto(BASE, { waitUntil: 'networkidle0' }); await sleep(800);
    const order = [];
    for (let k = 0; k < 8; k++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return `${a.tagName.toLowerCase()}:${(a.textContent || '').trim().slice(0, 22)}|outline=${cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0}`; })); }
    I.tabOrder = order;
    if (!/Skip/.test(order[0])) problem('keyboard', 'first Tab is not the skip link');
    if (order.some(o => o.endsWith('outline=false'))) problem('keyboard', 'a focused control has no visible outline: ' + order.filter(o => o.endsWith('outline=false')).join(', '));
    // refresh mid-page keeps a sane frame
    await page.evaluate(() => { const el = document.getElementById('lennys'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 200); });
    await sleep(800);
    // mid-page the walkthroughs keep streaming, so the network never goes quiet: wait for load instead
    await page.reload({ waitUntil: 'load' }); await sleep(2000);
    I.reloadMid = { y: await page.evaluate(() => Math.round(window.scrollY)), frame: await frameState(page) };
    // resize without reload: 1440 → 900 → 1440
    await page.setViewport({ width: 900, height: 900 }); await sleep(1200);
    I.resizeNarrow = { mode: await page.evaluate(() => document.documentElement.className), hscroll: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) };
    await page.setViewport({ width: 1440, height: 900 }); await sleep(1200);
    I.resizeBack = { mode: await page.evaluate(() => document.documentElement.className), frame: await frameState(page), hscroll: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) };
    if (!/af-off/.test(I.resizeNarrow.mode) || !/af-on/.test(I.resizeBack.mode)) problem('resize', 'frame mode did not follow the width: ' + I.resizeNarrow.mode + ' → ' + I.resizeBack.mode);
    if (I.resizeNarrow.hscroll || I.resizeBack.hscroll) problem('resize', 'horizontal overflow after resizing');
    // drag through arbitrary widths
    I.widths = [];
    for (const w of [1366, 1180, 1023, 960, 820, 700, 600, 520, 480, 1600, 1920]) {
      await page.setViewport({ width: w, height: 900 }); await sleep(500);
      const a = await page.evaluate(() => ({ w: innerWidth, hscroll: document.documentElement.scrollWidth > innerWidth + 1, fit: [...document.querySelectorAll('.fit-line')].map(l => l.getBoundingClientRect().right <= l.closest('.fit').getBoundingClientRect().right + 1).every(Boolean) }));
      I.widths.push(a);
      if (a.hscroll) problem('resize sweep', `overflow at ${w}px`);
      if (!a.fit) problem('resize sweep', `fitted headline crosses its frame at ${w}px`);
    }
    report.interactions.desktopLog = log;
    if (log.console.length || log.pageErrors.length) problem('desktop interactions', [...log.console, ...log.pageErrors].slice(0, 4).join(' | '));
    await page.close();
  }

  /* ---------- phone menu ---------- */
  {
    const vp = VIEWPORTS[5];
    const { page, log } = await newPage(browser, vp);
    await page.goto(BASE, { waitUntil: 'networkidle0' }); await sleep(1200);
    const M = report.interactions.menu = {};
    await page.click('#menu-btn'); await sleep(400);
    M.open = await page.evaluate(() => ({ hidden: document.getElementById('menu').hidden, expanded: document.getElementById('menu-btn').getAttribute('aria-expanded'), focus: document.activeElement.textContent.trim(), mainInert: document.getElementById('main').inert }));
    await page.screenshot({ path: path.join(OUT, 'menu-open-390.jpg'), type: 'jpeg', quality: 72 });
    // focus stays inside
    for (let k = 0; k < 8; k++) await page.keyboard.press('Tab');
    M.trapped = await page.evaluate(() => !!document.activeElement.closest('#menu'));
    await page.keyboard.press('Escape'); await sleep(300);
    M.afterEscape = await page.evaluate(() => ({ hidden: document.getElementById('menu').hidden, focus: document.activeElement.id }));
    await page.click('#menu-btn'); await sleep(300);
    await page.click('#menu nav a[href="#capabilities"]'); await sleep(1800);
    M.linkNav = await page.evaluate(() => ({ hidden: document.getElementById('menu').hidden, top: Math.round(document.getElementById('capabilities').getBoundingClientRect().top) }));
    if (M.open.hidden || M.open.expanded !== 'true' || !M.open.mainInert) problem('menu', 'did not open correctly');
    if (!M.trapped) problem('menu', 'focus escaped the open menu');
    if (!M.afterEscape.hidden || M.afterEscape.focus !== 'menu-btn') problem('menu', 'Escape did not close and return focus');
    if (!M.linkNav.hidden || Math.abs(M.linkNav.top - 60) > 8) problem('menu', 'menu link did not close and land: ' + JSON.stringify(M.linkNav));
    report.interactions.menuLog = log;
    await page.close();
  }

  /* ---------- reduced motion ---------- */
  for (const vp of [VIEWPORTS[0], VIEWPORTS[5]]) {
    const { page, log } = await newPage(browser, vp, { reduce: true });
    await page.goto(BASE, { waitUntil: 'networkidle0' }); await sleep(1200);
    const R = report.interactions['reduced-' + vp.name] = {};
    R.mode = await page.evaluate(() => document.documentElement.className);
    R.overlayHidden = await page.evaluate(() => getComputedStyle(document.getElementById('af')).display === 'none');
    R.playButtons = await page.evaluate(() => document.querySelectorAll('.play').length);
    R.autoplaying = await page.evaluate(() => [...document.querySelectorAll('video')].filter(v => !v.paused).length);
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    let k = 0;
    for (let y = 0; y < H; y += vp.height * 1.6) { await scrollToY(page, y, 350); if (k < 12) await page.screenshot({ path: path.join(OUT, `reduced-${vp.name}-${String(k++).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 65 }); }
    R.allBracketsDrawn = await page.evaluate(() => [...document.querySelectorAll('[data-frame]')].every(el => el.classList.contains('in')));
    // the headline fit must work without transitions too (it measures its own size changes)
    R.heroFill = await page.evaluate(() => { const h = document.querySelector('.intro h1'), l = h.querySelector('.fit-line'); return +(l.getBoundingClientRect().width / h.clientWidth).toFixed(3); });
    if (R.heroFill < 0.97) problem('reduced motion', `hero wordmark fills only ${Math.round(R.heroFill * 100)}% of its frame`);
    if (!R.overlayHidden) problem('reduced motion', 'moving frame still shown');
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
    const ids = ['rok', 'lennys', 'bbs'];
    for (const id of ids) {
      await page.evaluate(id => document.getElementById(id).scrollIntoView(), id);
      await sleep(250);
      await page.screenshot({ path: path.join(OUT, `nojs-${vp.name}-${id}.jpg`), type: 'jpeg', quality: 70 });
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(OUT, `nojs-${vp.name}-hero.jpg`), type: 'jpeg', quality: 70 });
    const N = report.interactions['noJS-' + vp.name] = await page.evaluate(() => {
      const shown = el => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
      const h1 = document.querySelector('h1');
      const media = [...document.querySelectorAll('.crop, .site-desk, .phone-screen')].map(box => {
        const img = box.querySelector('img'); const b = box.getBoundingClientRect(), r = img ? img.getBoundingClientRect() : null;
        return { box: box.className, still: !!img && img.complete && img.naturalWidth > 0, fills: !!r && Math.abs(r.width - b.width) < 2 && Math.abs(r.height - b.height) < 2, src: img ? img.currentSrc.split('/').pop() : null };
      });
      const fitOver = [...document.querySelectorAll('.fit')].some(f => [...f.querySelectorAll('.fit-line')].some(l => l.getBoundingClientRect().right > f.getBoundingClientRect().right + 1));
      return {
        h1Visible: getComputedStyle(h1).visibility, text: h1.innerText.replace(/\s+/g, ' '),
        hscroll: document.documentElement.scrollWidth > innerWidth, fitOver, media,
        videosShown: [...document.querySelectorAll('video')].filter(shown).length,
        deadControls: ['.menu-btn', '.copy', '.play'].filter(sel => [...document.querySelectorAll(sel)].some(shown)),
        headerBg: getComputedStyle(document.querySelector('.bar')).backgroundColor,
      };
    });
    const where = 'no-JS ' + vp.name;
    if (N.h1Visible !== 'visible') problem(where, 'headline hidden');
    if (N.hscroll) problem(where, 'horizontal overflow');
    if (N.fitOver) problem(where, 'a display headline crosses its frame');
    N.media.forEach(m => { if (!m.still || !m.fills) problem(where, `no still filling ${m.box} (${m.src})`); });
    if (N.videosShown) problem(where, `${N.videosShown} empty video boxes shown`);
    if (N.deadControls.length) problem(where, 'controls that need JavaScript are shown: ' + N.deadControls.join(', '));
    if (/rgba\(0, 0, 0, 0\)|transparent/.test(N.headerBg)) problem(where, 'header has no background over light sections');
    await page.close();
  }

  /* ---------- scroll it yourself: the live site inside a screen ---------- */
  // (its own pages: the embedded studies load third-party players and tiles, whose console output isn't ours to judge)
  for (const [vp, sel, kind] of [[VIEWPORTS[0], '#lennys .site', 'desk'], [VIEWPORTS[5], '#rok-site', 'phone']]) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr || 1, isMobile: !!vp.touch, hasTouch: !!vp.touch });
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await sleep(800);
    const L = report.interactions['live-' + vp.name] = {};
    L.buttons = await page.evaluate(() => [...document.querySelectorAll('.live-btn')].map(b => `${b.closest('.proj').id}/${b.dataset.live}:${b.hidden ? 'hidden' : 'shown'}`));
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
