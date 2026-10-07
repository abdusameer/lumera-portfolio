/* Lumera Creative — site behavior, light edition. Plain JavaScript, one rAF loop, Lenis for scroll.
   On wide screens and portrait phones the opening and the work share one pinned stage: each project waits at the edge as a strip of
   its color and opens as it arrives; the capabilities are colored panels that push in one after another. */
(() => {
  'use strict';

  const doc = document, root = doc.documentElement;
  root.classList.add('js');   // (the head script has usually done this already)

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PHONE = 760, WIDE = 1024;
  const phoneLayout = innerWidth < PHONE;                    // media sources are chosen once, at load
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
  const settle = t => lerp(t, smooth(t), 0.55);               // a little rest at each stop, still continuous
  const $ = (s, el = doc) => el.querySelector(s);
  const $$ = (s, el = doc) => Array.from(el.querySelectorAll(s));
  const dtK = (k, dt) => 1 - Math.pow(1 - k, dt / 16.667);  // frame-rate independent easing factor
  // the large viewport height (a phone's screen with its toolbars tucked away). It stays the same while the toolbars come and go,
  // so pinned lengths measured from it never shift under the reader; the pinned stages themselves are 100lvh tall in CSS.
  const vhProbe = doc.createElement('div');
  vhProbe.setAttribute('aria-hidden', 'true');
  vhProbe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
  doc.body.appendChild(vhProbe);
  const VH = () => vhProbe.offsetHeight || innerHeight;

  /* ------------------------------------------------------------------ scroll + one loop */
  let lenis = null;
  let touchOwned = false;                                       // a sideways touch gesture the page is handling itself (see the input section)
  if (!reduce && window.Lenis) lenis = new window.Lenis({
    lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true, gestureOrientation: 'both',   // 'both': each wheel or trackpad event moves the page by its dominant axis only
    // Lenis reads every touch as the browser's own scrolling and stops whatever it is animating. The touch events of a sideways drag
    // (including the touchend that comes just after the release starts its step) are left out, so they can't cut that step short.
    virtualScroll: d => !(touchOwned && d.event.type.startsWith('touch')),
  });

  const tasks = new Set();
  const regions = [];                                           // the pinned experiences: { bounds(), stops() }, in page order (see the input section)
  let measureDemo = () => {}, demoMoved = () => false;
  let sy = window.scrollY, prevSy = -1, lastT = 0, dirty = true;
  const loop = t => {
    const dt = lastT ? Math.min(64, t - lastT) : 16.667; lastT = t;
    if (lenis) lenis.raf(t);
    sy = window.scrollY;
    const moved = sy !== prevSy;
    tasks.forEach(fn => fn(dt, moved));
    prevSy = sy; dirty = false;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const markDirty = () => { dirty = true; };
  const fontsReady = (doc.fonts && doc.fonts.ready) ? doc.fonts.ready : Promise.resolve();

  /* ------------------------------------------------------------------ mode: the pinned layouts need motion and room.
     Wide: a landscape window 1024 px and up. Narrow: a portrait phone or tablet at least 600 px tall.
     Anything else (phones held sideways, small square windows, reduced motion) reads as one stacked column.
     The head script makes the same decision before the first paint. */
  const modeNow = () => {
    const w = innerWidth, h = innerHeight;
    const wideOK = !reduce && w >= WIDE && w > h * 1.1 && h >= 500;
    const narrowOK = !reduce && !wideOK && h >= 600 && h >= w * 1.15;
    return { pin: wideOK || narrowOK, narrow: narrowOK };
  };
  let pin = root.classList.contains('pin'), narrow = root.classList.contains('narrow');

  /* ------------------------------------------------------------------ the strip */
  const strip = $('.strip'), stage = $('#stage');
  const panels = $$('[data-panel]', stage);
  const bbsP = panels[3];
  const bbsScroll = $('.p-scroll', bbsP), bbsMedia = $('.p-media', bbsP), bbsInfo = $('.p-info', bbsP);
  const stream = $('.stream', bbsP), streamPill = $('.stream-pill', bbsP);
  const stripRise = $$('[data-rise]', strip);
  // scroll lengths, in screen heights: a rest on the opening, one per project, the column closing, the stream.
  // Narrow screens have no column: the project list is a fourth step instead.
  const G = { hold: 0.3, step: 1, close: 0.8, stream: 1.7, tail: 0.15 };
  const hold = () => (narrow ? 0.08 : G.hold);              // phones: the opening answers the first scroll at once
  const steps = () => (narrow ? 4 : 3);
  let S = null, introK = 1, introT = 0;

  function measureStrip() {
    panels.forEach(p => { p._x = p._w = null; });
    if (!pin) {
      S = null;
      strip.style.height = '';
      panels.forEach(p => { p.style.width = ''; p.style.transform = ''; });
      bbsScroll.style.transform = ''; bbsMedia.style.height = ''; bbsInfo.style.opacity = '';
      stream.classList.remove('on'); streamPill.classList.remove('on');
      if (rio) stripRise.forEach(el => { if (!el.classList.contains('in')) rio.observe(el); });   // stacked: rise on sight
      return;
    }
    const vw = innerWidth, vh = VH();
    const len = vh * (hold() + steps() * G.step + (narrow ? 0 : G.close + G.stream) + G.tail);
    strip.style.height = (len + vh) + 'px';
    const COL = 0.26 * vw, tileH = COL * 10 / 16;
    S = {
      vw, vh, len, top: strip.offsetTop,
      ...(narrow ? { HERO: 0.8 * vw, OPEN: 0.84 * vw, S1: 0.12 * vw, S2: 0.05 * vw, S3: 0.03 * vw }
                 : { HERO: 0.5 * vw, OPEN: 0.62 * vw, S1: 0.30 * vw, S2: 0.10 * vw, S3: 0.05 * vw }),
      COL, tileH,
      // the column's own image, then the stream, travel up until the last tile clears the pill
      travel: Math.max(0, tileH + stream.children.length * (tileH + 8) - vh * 0.84),
    };
    markDirty();
  }
  // the scroll position at which a panel is open at the left edge
  const stripY = i => S.top + S.vh * (i <= 0 ? 0 : (i <= 3 || narrow) ? hold() + i * G.step : hold() + 3 * G.step + G.close);
  const stripNames = () => panels.map((p, i) => (i === 0 ? 'Lumera Creative' : i === 4 ? 'Projects' : (p.getAttribute('aria-label') || '').replace(/^\d+,\s*/, '')));
  regions.push({
    id: 'strip', label: 'Opening and selected work',
    bounds: () => S && [S.top, S.top + S.len],
    // only stops that change what is on screen (on wide screens the last one is the end of the stream)
    stops: () => (S ? (narrow ? [0, 1, 2, 3, 4].map(stripY) : [0, 1, 2, 3, 4].map(stripY).concat(S.top + S.len)) : []),
    names: () => (narrow ? stripNames() : stripNames().concat('The rest of the work')),
    // the panel under the finger moves with it: one stage of scroll for the width that panel travels
    scale: (i, dir) => (S ? S.vh / Math.max(1, openW(clamp(dir > 0 ? i : i - 1, 0, 3))) : 0),
  });
  const openW = i => (i === 0 ? S.HERO : i === 4 ? S.vw : S.OPEN);
  const widthAt = (i, f) => {
    const d = i - f, o = openW(i);
    if (d <= 0) return o;
    if (d <= 1) return lerp(o, S.S1, d);
    if (d <= 2) return lerp(S.S1, S.S2, d - 1);
    if (d <= 3) return lerp(S.S2, S.S3, d - 2);
    return S.S3;
  };
  const place = (p, x, w) => {
    x = Math.round(x * 10) / 10; w = Math.round(w * 10) / 10;
    if (p._x !== x) { p.style.transform = `translate3d(${x}px,0,0)`; p._x = x; }
    if (p._w !== w) { p.style.width = w + 'px'; p._w = w; }
  };

  function drawStrip() {
    const s = clamp(sy - S.top, 0, S.len), u = s / S.vh, n = steps();
    const A0 = hold(), A1 = A0 + n * G.step, B1 = A1 + G.close;
    let f = 0, q = 0, r = 0;
    if (u > A0 && u < A1) { const x = (u - A0) / G.step, k = Math.floor(x); f = k + settle(x - k); }
    else if (u >= A1) { f = n; if (!narrow) { q = smooth(clamp((u - A1) / G.close, 0, 1)); r = clamp((u - B1) / G.stream, 0, 1); } }

    // the track: panels before the current one have gone by at full width; the current one is sliding out
    const fi = Math.min(Math.floor(f), n);
    let x = 0;
    for (let j = 0; j < fi; j++) x -= openW(j);
    x -= (f - fi) * openW(fi);
    const w = [0, 1, 2, 3, 4].map(i => widthAt(i, f));
    if (q > 0) w[3] = lerp(S.OPEN, S.COL, q);                // the last project closes into a column
    const ie = introK >= 1 ? 1 : easeOutQuart(introK);
    let cx = x;
    for (let i = 0; i < 5; i++) {
      const wi = i < 4 || narrow ? w[i] : Math.max(0, S.vw - cx);   // wide: the work list fills whatever is left
      // the projects arrive from the right; on phones only a short way, so rōk's photo is on screen from the first paint
      const arrive = i > 0 && ie < 1 ? (1 - ie) * S.vw * (narrow ? 0.05 * i : 0.32 + i * 0.07) : 0;
      place(panels[i], cx + arrive, wi);
      cx += wi;
    }

    // the column: the name fades, the image becomes a tile, and the rest of the work streams up under it
    bbsInfo.style.opacity = q > 0 ? (1 - clamp(q * 2.2, 0, 1)).toFixed(3) : '';
    bbsMedia.style.height = q > 0 ? lerp(S.vh * 0.62, S.tileH, q).toFixed(1) + 'px' : '';
    stream.classList.toggle('on', q > 0.55);
    streamPill.classList.toggle('on', q > 0.9);
    bbsScroll.style.transform = r > 0 ? `translate3d(0,${(-r * S.travel).toFixed(1)}px,0)` : '';
    if (narrow ? f > n - 0.6 : q > 0.3) stripRise.forEach(el => el.classList.add('in'));

    root.classList.toggle('past-hero', f > 0.28 || s >= S.len);
  }
  tasks.add((dt, moved) => {
    if (introK < 1) { introK = clamp((performance.now() - introT) / 1500, 0, 1); dirty = true; }
    if (!S) { if (moved || dirty) root.classList.toggle('past-hero', sy > panels[0].offsetHeight * 0.5); return; }
    if (!moved && !dirty) return;
    if (sy > S.top + S.len + S.vh * 1.5 && !dirty) { root.classList.add('past-hero'); return; }   // well past the strip: nothing to move (a jump straight here still brings the header in)
    drawStrip();
  });

  // keyboard: a focused panel opens where it can be seen
  stage.addEventListener('focusin', e => {
    stage.scrollLeft = 0; stage.scrollTop = 0;
    if (!S) return;
    const i = panels.indexOf(e.target.closest('[data-panel]'));
    if (i < 0) return;
    const y = stripY(i);
    if (Math.abs(sy - y) > 4) scrollToY(y, false);
  });
  stage.addEventListener('scroll', () => { stage.scrollLeft = 0; stage.scrollTop = 0; });
  // a project panel is one link: a click anywhere on it (but not on the stream or another link) opens its study
  $$('.panel--proj', stage).forEach(p => p.addEventListener('click', e => {
    if (e.defaultPrevented || e.target.closest('a, button, .stream')) return;
    const a = $('.round', p); if (a) a.click();
  }));

  /* ------------------------------------------------------------------ capabilities: panels push in from the right */
  const caps = $('#capabilities'), capPanels = $$('.cap', caps), capNav = $$('.cap-nav span', caps), capBar = $('.cap-bar i', caps);
  let C = null, capOn = -1;
  // keyboard: a focused panel pushes in, so focus is never on something sitting off screen
  caps.addEventListener('focusin', e => {
    const stageEl = e.target.closest('.caps-stage'); if (stageEl) { stageEl.scrollLeft = 0; stageEl.scrollTop = 0; }
    if (!C) return;
    const i = capPanels.indexOf(e.target.closest('.cap'));
    if (i < 0) return;
    const y = C.top + (C.lead + i) * C.vh;
    if (Math.abs(sy - y) > 4) scrollToY(y, false);
  });
  function measureCaps() {
    if (!pin) { C = null; caps.style.height = ''; capPanels.forEach(p => { p.style.transform = ''; }); return; }
    const vh = VH(), n = capPanels.length, lead = narrow ? 0.08 : 0.25;   // a rest before the first move and after the last (short on phones)
    const len = vh * ((n - 1) + 2 * lead);
    caps.style.height = (len + vh) + 'px';
    C = { vh, vw: innerWidth, n, len, lead, top: caps.offsetTop };
    markDirty();
  }
  regions.push({
    id: 'caps', label: 'What we build',
    bounds: () => C && [C.top, C.top + C.len],
    stops: () => (C ? capPanels.map((p, i) => C.top + (C.lead + i) * C.vh) : []),
    names: () => capPanels.map(p => ($('h3', p) || {}).textContent || ''),
    scale: () => (C ? C.vh / Math.max(1, C.vw * 0.92) : 0),
  });
  tasks.add((dt, moved) => {
    if (!C || (!moved && !dirty)) return;
    if (sy < C.top - C.vh * 1.5 || sy > C.top + C.len + C.vh * 1.5) return;
    const u = clamp((sy - C.top) / C.vh - C.lead, 0, C.n - 1), k = Math.floor(u);
    const sC = Math.min(C.n - 1, k + settle(u - k));
    const P1 = C.vw * 0.08, P2 = C.vw * 0.03;              // the next panels wait at the edge as strips
    capPanels.forEach((p, i) => {
      const d = i - sC;
      const x = d <= 0 ? 0 : d <= 1 ? d * (C.vw - P1) : d <= 2 ? (C.vw - P1) + (d - 1) * (P1 - P2) : C.vw - P2;
      p.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    });
    const on = Math.round(sC);
    if (on !== capOn) { capNav.forEach((s, i) => s.classList.toggle('on', i === on)); capOn = on; }
    capBar.style.setProperty('--p', ((sC + 1) / C.n).toFixed(4));
  });

  /* ------------------------------------------------------------------ header: the owl takes the tone of whatever is behind it.
     It reads what sits under the logo (a photo, a recording, or a section's color) and turns light over dark ground, ink over light. */
  const topBar = $('#top-bar'), logoEl = $('.top .logo');
  const chan = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lumOf = (r, g, b) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
  const probe = doc.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const grids = new WeakMap();                                    // each photo, read once at low resolution
  const readGrid = (src, natW, natH, w) => {
    const h = Math.max(1, Math.round(w * natH / natW));
    probe.canvas.width = w; probe.canvas.height = h;
    try { probe.drawImage(src, 0, 0, w, h); } catch (e) { return null; }
    const d = probe.getImageData(0, 0, w, h).data, lum = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) lum[i] = lumOf(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
    return { w, h, lum };
  };
  const imgGrid = img => {                                        // read once, off the main thread; null until it is ready
    if (grids.has(img)) return grids.get(img);
    grids.set(img, null);
    createImageBitmap(img, { resizeWidth: 48, resizeQuality: 'low' }).then(bm => { grids.set(img, readGrid(bm, bm.width, bm.height, bm.width)); if (bm.close) bm.close(); }).catch(() => {});
    return null;
  };
  let vid = { el: null, t: 0, g: null };                          // a playing recording, re-read four times a second
  const vidGrid = v => { const now = performance.now(); if (vid.el !== v || now - vid.t > 500) vid = { el: v, t: now, g: readGrid(v, v.videoWidth, v.videoHeight, 32) }; return vid.g; };
  // the media's own pixels under the logo, through object-fit cover or contain; null over a letterbox
  const mediaTone = (el, natW, natH, g, r) => {
    if (!g) return null;
    const b = el.getBoundingClientRect(), contain = getComputedStyle(el).objectFit === 'contain';
    const s = contain ? Math.min(b.width / natW, b.height / natH) : Math.max(b.width / natW, b.height / natH);
    const ox = b.left + (b.width - natW * s) / 2, oy = b.top + (b.height - natH * s) / 2;
    const u0 = (r.left - ox) / (natW * s), u1 = (r.right - ox) / (natW * s), v0 = (r.top - oy) / (natH * s), v1 = (r.bottom - oy) / (natH * s);
    if (u1 < 0 || u0 > 1 || v1 < 0 || v0 > 1) return null;
    const x0 = Math.floor(clamp(u0, 0, 1) * (g.w - 1)), x1 = Math.ceil(clamp(u1, 0, 1) * (g.w - 1));
    const y0 = Math.floor(clamp(v0, 0, 1) * (g.h - 1)), y1 = Math.ceil(clamp(v1, 0, 1) * (g.h - 1));
    let sum = 0, n = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { sum += g.lum[y * g.w + x]; n++; }
    return n ? sum / n : null;
  };
  const toneUnder = r => {
    for (const el of doc.elementsFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2)) {
      if (topBar.contains(el)) continue;
      let t = null;
      if (el.tagName === 'IMG' && el.complete && el.naturalWidth) t = mediaTone(el, el.naturalWidth, el.naturalHeight, imgGrid(el), r);
      else if (el.tagName === 'VIDEO' && el.readyState >= 2 && el.videoWidth && getComputedStyle(el).visibility !== 'hidden') t = mediaTone(el, el.videoWidth, el.videoHeight, vidGrid(el), r);
      else if (el.tagName === 'IFRAME') return 0.8;   // a live study inside a screen: treated as light
      else {
        const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
        if (m && (m.length < 4 || +m[3] > 0.5)) return lumOf(+m[0], +m[1], +m[2]);
      }
      if (t !== null) return t;
    }
    return lumOf(238, 234, 227);                                  // the paper
  };
  let toneAt = 0, onDark = false;
  tasks.add((dt, moved) => {
    const now = performance.now();
    if (now - toneAt < (moved || dirty ? 90 : 300)) return;       // about ten looks a second while scrolling; recordings keep it looking at rest
    toneAt = now;
    if (getComputedStyle(logoEl).visibility === 'hidden') return;
    const dark = toneUnder(logoEl.getBoundingClientRect()) < 0.18;   // where ink and paper read equally well
    if (dark !== onDark) { onDark = dark; topBar.classList.toggle('on-dark', dark); }
  });

  /* ------------------------------------------------------------------ in-page links */
  const anchorY = el => {
    if (S && strip.contains(el)) return el === strip ? 0 : stripY(panels.indexOf(el.closest('[data-panel]')));
    return el.getBoundingClientRect().top + window.scrollY;
  };
  function scrollToY(y, slow, done) {
    if (lenis) lenis.scrollTo(y, { duration: slow ? 1.4 : 0.9, easing: t => 1 - Math.pow(1 - t, 4), onComplete: done });
    else { window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); if (done) done(); }
  }
  const goTo = (id, focus) => {
    const top = id === '#top';
    const target = top ? strip : doc.querySelector(id);
    if (!target) return;
    scrollToY(top ? 0 : anchorY(target), true, () => {
      if (!focus || top) return;
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  };
  doc.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href');
    if (id.length < 2 || (id !== '#top' && !doc.querySelector(id))) return;
    e.preventDefault();
    closeMenu(false);
    goTo(id, true);
    history.replaceState(null, '', id === '#top' ? location.pathname + location.search : id);
  });

  /* ------------------------------------------------------------------ menu (dialog): rises from the bottom */
  const menu = $('#menu'), menuBtn = $('#menu-btn'), menuClose = $('#menu-close');
  const mainEl = $('#main'), footEl = $('.foot');
  let lastFocus = null, menuT = 0;
  const focusables = () => $$('a[href], button:not([disabled])', menu);
  const onMenuKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  function openMenu() {
    clearTimeout(menuT);
    lastFocus = doc.activeElement;
    menu.hidden = false;
    void menu.offsetWidth;                                 // start the rise from the closed state
    menu.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    mainEl.inert = true; footEl.inert = true; topBar.inert = true;
    if (lenis) lenis.stop();
    doc.addEventListener('keydown', onMenuKey);
    ($('.menu-nav a', menu) || menuClose).focus({ preventScroll: true });
  }
  function closeMenu(restore) {
    if (menu.hidden || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    mainEl.inert = false; footEl.inert = false; topBar.inert = false;
    if (lenis) lenis.start();
    doc.removeEventListener('keydown', onMenuKey);
    menuT = setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduce ? 0 : 520);
    if (restore && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  menuBtn.addEventListener('click', () => (menu.classList.contains('is-open') ? closeMenu(true) : openMenu()));
  menuClose.addEventListener('click', () => closeMenu(true));

  /* ------------------------------------------------------------------ the opening: LUMERA as thin slices, then the page slides in */
  // (the head script decided whether it runs, before the first paint; a restored scroll position still cancels it)
  const loader = $('#loader');
  if (root.classList.contains('intro-run') && window.scrollY > 8) root.classList.remove('intro-run');
  if (root.classList.contains('intro-run')) {
    requestAnimationFrame(() => requestAnimationFrame(() => loader.classList.add('show')));
    const t0 = performance.now();
    const go = () => {
      loader.classList.add('out');
      root.classList.add('intro-go');
      introK = 0; introT = performance.now() + 250; markDirty();
      setTimeout(() => { loader.classList.remove('show', 'out'); root.classList.remove('intro-run', 'intro-go'); }, 2700);
    };
    // never hold the page for long: at most 1 s for the font, and the slices show for at least 0.9 s
    Promise.race([fontsReady, new Promise(r => setTimeout(r, 1000))]).then(() => setTimeout(go, Math.max(0, 900 - (performance.now() - t0))));
  }

  /* ------------------------------------------------------------------ words that rise into place */
  let rio = null;
  if (!reduce) {
    rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    // none of them is on the first screen, so the splitting waits until the page is idle
    (window.requestIdleCallback || (fn => setTimeout(fn, 200)))(() => $$('[data-rise]').forEach(el => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach((w, i) => {
        const outer = doc.createElement('span'), inner = doc.createElement('span');
        outer.className = 'w'; inner.textContent = w; inner.style.setProperty('--i', i);
        outer.appendChild(inner); el.appendChild(outer);
        if (i < words.length - 1) el.appendChild(doc.createTextNode(' '));
      });
      el.classList.add('rise');
      // inside the wide strip they rise when the work list opens (see drawStrip); elsewhere when they come into view
      if (!strip.contains(el) || !pin) rio.observe(el);
    }), { timeout: 1500 });
  }

  /* ------------------------------------------------------------------ the close: LUMERA rises out of the footer, each letter from a slice */
  const footMark = $('.foot-mark'), footLetters = footMark ? $$('svg', footMark) : [];
  if (!reduce && footLetters.length) {
    let near = false;
    new IntersectionObserver(([e]) => { near = e.isIntersecting; markDirty(); }, { rootMargin: '0px 0px 200px 0px' }).observe(footMark);
    let lastP = -1;
    tasks.add((dt, moved) => {
      if (!near || (!moved && !dirty)) return;
      const r = footMark.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / r.height, 0, 1);
      if (p === lastP) return;
      lastP = p;
      footLetters.forEach((s, k) => {
        const pk = clamp(p * 1.35 - k * 0.06, 0, 1), e = easeOut(pk), e2 = smooth(clamp((pk - 0.2) / 0.8, 0, 1));
        s.style.transform = `translate3d(0,${((1 - e) * 104).toFixed(2)}%,0)`;
        s.style.clipPath = `inset(0 ${((1 - e2) * 48.6).toFixed(2)}%)`;
      });
    });
  }

  /* ------------------------------------------------------------------ recordings: load near, play in view */
  const pickSrc = v => {
    if (phoneLayout && v.dataset.srcM) return v.dataset.srcM;
    const w = (v.clientWidth || innerWidth) * (window.devicePixelRatio || 1);
    return (v.dataset.srcSm && w < 1100) ? v.dataset.srcSm : v.dataset.src;
  };
  const posterOf = v => (phoneLayout && v.dataset.posterM) ? v.dataset.posterM : v.dataset.poster;
  const loadVideo = v => {
    if (v.dataset.loaded) return;
    v.dataset.loaded = '1';
    v.src = v.dataset.scrub || pickSrc(v);
    v.preload = v.dataset.scrub ? 'auto' : 'metadata';
    v.load();
  };
  const videos = $$('video.media-video');
  const posterIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const v = e.target, p = posterOf(v);
    if (p && !v.poster) v.poster = p;
    posterIO.unobserve(v);
  }), { rootMargin: '1200px 0px' });
  const nearIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { loadVideo(e.target); nearIO.unobserve(e.target); } }), { rootMargin: '500px 0px' });
  // each walkthrough rests on the site's first screen before it scrolls, every time it starts from the top
  const HOLD = 2200;
  const canPlay = v => v._inView && !v._userPaused && !doc.hidden && !v.closest('.is-live');   // a visitor's own pause stands
  const startWalk = v => {
    clearTimeout(v._hold);
    if (v.currentTime > 0.05) { v.play().catch(() => {}); return; }
    v._hold = setTimeout(() => { if (canPlay(v)) v.play().catch(() => {}); }, HOLD);
  };
  const playIO = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    v._inView = e.isIntersecting;
    if (e.isIntersecting) { loadVideo(v); if (!reduce && canPlay(v)) startWalk(v); }
    else { clearTimeout(v._hold); v.pause(); }
  }), { threshold: 0.3 });
  // every recording has a visible pause and play control (WCAG 2.2.2), reachable by keyboard and touch
  const addPlayButton = v => {
    const study = ($('.study-title', v.closest('.study')) || {}).textContent || 'project';
    const device = v.closest('.phone-screen') ? 'phone' : 'laptop';
    const b = doc.createElement('button');
    b.type = 'button'; b.className = 'play';
    const label = () => { const on = !v.paused; b.dataset.state = on ? 'playing' : 'paused'; b.setAttribute('aria-label', `${on ? 'Pause' : 'Play'} the ${study.trim()} recording, ${device}`); };
    label();
    b.addEventListener('click', () => {
      loadVideo(v);
      if (v.paused) { v._userPaused = false; v.play().catch(() => {}); }
      else { v._userPaused = true; clearTimeout(v._hold); v.pause(); }
    });
    v.addEventListener('play', label); v.addEventListener('pause', label);
    v.parentElement.appendChild(b);
  };
  videos.forEach(v => {
    v.addEventListener('ended', () => { v.currentTime = 0; if (!reduce && canPlay(v)) startWalk(v); });
    posterIO.observe(v);
    addPlayButton(v);
    if (reduce) { playIO.observe(v); return; }
    nearIO.observe(v); playIO.observe(v);
  });
  // a hidden tab pauses the recordings; coming back resumes only those a visitor hasn't paused
  doc.addEventListener('visibilitychange', () => videos.forEach(v => { if (doc.hidden) v.pause(); else if (!reduce && canPlay(v)) startWalk(v); }));

  /* ------------------------------------------------------------------ scroll it yourself: the live site inside a screen
     The site is laid out at a real laptop (1280 wide) or phone (390 wide) viewport and scaled to the screen.
     Only one runs at a time, and only where the screen is big enough to read. */
  const LIVE = { desk: { base: 1280, min: 700, word: 'laptop' }, phone: { base: 390, min: 230, word: 'phone' } };
  let live = null;
  const liveBtns = $$('.live-btn');
  const screenOf = b => $(b.dataset.live === 'desk' ? '.site-desk' : '.phone-screen', b.closest('.site'));
  const liveStatus = $('#live-status');
  const nameBtn = (b, on) => {
    const word = LIVE[b.dataset.live].word, name = b.dataset.name;
    $('.live-label', b).textContent = on ? 'Close live view' : 'Scroll it yourself';
    b.setAttribute('aria-label', on ? `Close the live ${name} site and return to the recording, on a ${word}` : `Scroll it yourself, on a ${word}`);
    b.setAttribute('aria-expanded', on ? 'true' : 'false');
  };
  const fitLive = () => {
    if (!live) return;
    const w = live.box.clientWidth, h = live.box.clientHeight;
    const bw = Math.max(LIVE[live.kind].base, w), bh = Math.round(bw * h / w);
    Object.assign(live.frame.style, { width: bw + 'px', height: bh + 'px', transform: `scale(${(w / bw).toFixed(5)})` });
  };
  const liveRO = 'ResizeObserver' in window ? new ResizeObserver(fitLive) : null;
  const closeLive = (back) => {
    if (!live) return;
    const L = live; live = null;
    clearTimeout(L.slowT);
    if (L.slow) L.slow.remove();
    if (liveRO) liveRO.unobserve(L.box);
    L.frame.remove();
    L.box.classList.remove('is-live', 'is-loaded');
    L.box.removeAttribute('role'); L.box.removeAttribute('aria-label'); L.box.removeAttribute('tabindex');
    nameBtn(L.btn, false);
    const v = $('video', L.box);
    if (v && !reduce && canPlay(v)) startWalk(v);
    if (back && !L.btn.hidden) L.btn.focus();                                // closing by hand or with Escape returns to the control that opened it
    if (liveStatus) liveStatus.textContent = back ? `The live ${L.btn.dataset.name} site is closed.` : '';
  };
  const openLive = b => {
    closeLive();
    const box = screenOf(b), kind = b.dataset.live;
    const frame = doc.createElement('iframe');
    frame.className = 'live-frame';
    frame.title = `The live ${b.dataset.name} site, on a ${LIVE[kind].word}. Scroll it here.`;
    // the study can't navigate the portfolio away; its links open in new tabs or inside the screen
    // the minimum a study needs: its scripts and its links that open in new tabs. Without allow-same-origin the study runs as its own origin,
    // so it can't reach this page, its storage, or the other studies hosted at the same address.
    frame.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
    frame.setAttribute('allow', 'autoplay; fullscreen');
    frame.referrerPolicy = 'no-referrer';
    frame.addEventListener('load', () => {
      box.classList.add('is-loaded');
      if (live && live.frame === frame) { clearTimeout(live.slowT); if (live.slow) { live.slow.remove(); live.slow = null; } }
    }, { once: true });
    frame.src = b.dataset.src;
    const v = $('video', box);
    if (v) { clearTimeout(v._hold); v.pause(); }
    box.dataset.wait = `Opening the live ${b.dataset.name} site…`;
    box.classList.add('is-live');
    box.appendChild(frame);
    live = { box, kind, frame, btn: b, slow: null };
    // focus moves to the viewer, which is named; Tab goes on into the study, Shift+Tab back to the close control, Escape closes it
    box.setAttribute('role', 'group'); box.setAttribute('aria-label', `Live ${b.dataset.name} site, on a ${LIVE[kind].word}`); box.tabIndex = -1;
    box.focus({ preventScroll: true });
    if (liveStatus) liveStatus.textContent = `The live ${b.dataset.name} site is open. Press Escape to close it, Tab to move into it, or use Close live view.`;
    // ten seconds is longer than these sites ever take; say so, take the blame, and offer another way in
    live.slowT = setTimeout(() => {
      if (!live || live.frame !== frame || box.classList.contains('is-loaded')) return;
      const note = doc.createElement('div');
      note.className = 'live-slow';
      note.setAttribute('role', 'status');
      const msg = doc.createElement('p'); msg.textContent = 'This is taking longer than it should. Sorry about that.';
      const link = doc.createElement('a');
      link.href = b.dataset.src; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = 'Open it in a new tab';
      note.append(msg, link);
      box.appendChild(note);
      live.slow = note;
    }, 10000);
    fitLive();
    if (liveRO) liveRO.observe(box);
    nameBtn(b, true);
  };
  const liveFit = () => {
    liveBtns.forEach(b => { b.hidden = screenOf(b).clientWidth < LIVE[b.dataset.live].min; });
    $$('.site-live').forEach(row => { row.hidden = $$('.live-btn', row).every(b => b.hidden); });
    if (live && live.btn.hidden) closeLive(false);
  };
  liveBtns.forEach(b => {
    nameBtn(b, false);
    b.addEventListener('click', () => (live && live.btn === b ? closeLive(true) : openLive(b)));
  });
  doc.addEventListener('keydown', e => { if (e.key === 'Escape' && live && !menu.classList.contains('is-open')) { e.preventDefault(); closeLive(true); } });

  /* ------------------------------------------------------------------ rōk: scroll scrubs the pour */
  const scrub = $('.scrub-video');
  if (scrub) {
    const crop = scrub.closest('.crop'), meter = $('.scrub-meter', crop);
    if (reduce) {
      new IntersectionObserver(([e], o) => { if (e.isIntersecting) { scrub.poster = scrub.dataset.posterEnd || scrub.dataset.poster; o.disconnect(); } }, { rootMargin: '1200px 0px' }).observe(crop);
      meter.style.setProperty('--p', '1');
    } else {
      let ready = false, shown = 0, seeking = false, want = 0, near = false;
      scrub.addEventListener('loadeddata', () => { ready = true; markDirty(); });
      scrub.addEventListener('seeked', () => { seeking = false; });
      // the still arrives well ahead; the clip itself (about 2 MB) only once the pour is close, so it never rides the first load
      new IntersectionObserver(([e], o) => { if (e.isIntersecting) { if (!scrub.poster) scrub.poster = scrub.dataset.poster; o.disconnect(); } }, { rootMargin: '1200px 0px' }).observe(crop);
      new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) loadVideo(scrub); }, { rootMargin: '300px 0px' }).observe(crop);
      tasks.add(dt => {
        if (!near) return;
        const r = crop.getBoundingClientRect(), vh = innerHeight;
        const p = clamp((vh * 0.85 - r.top) / (vh * 0.55 + r.height), 0, 1);
        shown = lerp(shown, p, dtK(0.16, dt));
        if (Math.abs(shown - p) < 0.0005) shown = p;
        meter.style.setProperty('--p', shown.toFixed(4));
        if (!ready || !scrub.duration) return;
        want = shown * (scrub.duration - 0.05);
        if (!seeking && Math.abs(scrub.currentTime - want) > 0.012) { seeking = true; scrub.currentTime = want; }
      });
    }
  }

  /* ------------------------------------------------------------------ BB's Bakery: a window between the pencil sketch and the photograph */
  const art = $('#bbs-art');
  if (art) {
    // window keyframes in % of the artwork: [left, top, width, height]
    const KF = [[12, 18, 10, 64], [34, 13, 38, 74], [6, 6, 88, 88]];
    const placeWin = ([l, t, w, h]) => {
      art.style.setProperty('--wl', l + '%'); art.style.setProperty('--wt', t + '%');
      art.style.setProperty('--ww', w + '%'); art.style.setProperty('--wh', h + '%');
      art.style.setProperty('--il', l + '%'); art.style.setProperty('--it', t + '%');
      art.style.setProperty('--ir', (100 - l - w) + '%'); art.style.setProperty('--ib', (100 - t - h) + '%');
    };
    if (reduce) placeWin([50, 6, 44, 88]);
    else {
      let near = false, shown = 0;
      placeWin(KF[0]);
      new IntersectionObserver(([e]) => { near = e.isIntersecting; }, { rootMargin: '300px 0px' }).observe(art);
      tasks.add((dt, moved) => {
        if (!near) return;
        const r = art.getBoundingClientRect(), vh = innerHeight;
        // sketch while the stage enters, photograph by the time it starts to leave
        const p = clamp((vh * 0.75 - r.top) / (vh * 0.75 + r.height * 0.25), 0, 1);
        const before = shown;
        shown = lerp(shown, p, dtK(0.14, dt));
        if (Math.abs(shown - p) < 0.0005) shown = p;
        if (Math.abs(shown - before) < 1e-5 && !moved && !dirty) return;
        const q = smooth(shown);
        const seg = q < 0.55 ? 0 : 1, local = seg === 0 ? q / 0.55 : (q - 0.55) / 0.45;
        const A = KF[seg], B = KF[seg + 1], e = smooth(local);
        placeWin(A.map((v, i) => +lerp(v, B[i], e).toFixed(2)));
      });
    }
  }

  /* ------------------------------------------------------------------ systems demonstration: one fictional inquiry through five stages
     The five stages and the log are plain text in the page; this only lights them in turn. Nothing here talks to a real system.
     One progress value drives it: where the page is scrolled. Pinned on a large window, each stage is half a screen of scroll; where the
     stages stand in a column (phones, tablets, narrow windows), a stage runs once it reaches a reading line 42% down the screen, so
     scrolling (or swiping) down advances it and scrolling up goes back. Previous / Next, swipes and the arrow keys move to the next
     stage's place on the page, and Run plays through at a steady pace. In a column the controls above the stages scroll away as it
     moves on, so a pager with the same Previous / Next and Run / Pause / Replay rides the bottom of the screen. Only a short, wide
     window with the stages in a row has no column to follow; there the controls set the stage directly. */
  const sysCtl = { manual: () => false, inside: () => false, manualMode: () => false, transport: () => 'run', press: () => {}, halt: () => {} };
  const sys = $('#sys-demo');
  if (sys) {
    const stages = $$('.sys-stage', sys), rows = $$('.sys-log li, .sys-record > div[data-stage]', sys), N = stages.length;
    const runB = $('#sys-run'), pauseB = $('#sys-pause'), prevB = $('#sys-prev'), nextB = $('#sys-next'), replayB = $('#sys-replay');
    const live = $('#sys-live'), statusEl = $('#sys-status'), hint = $('.sys-hint', sys), track = $('.sys-track', sys), pin = $('.sys-pin');
    const STATUS = ['Not started', 'Received', 'Categorized as a kitchen remodel estimate', 'Assigned to residential estimates', 'Follow-up notifications prepared', 'Recorded in the pipeline, next step a site visit'];
    const EVENT = ['New estimate request received. Contact details captured.', 'Request categorized.', 'Assigned to the appropriate workflow.', 'Follow-up notification prepared.', 'Record added to the business pipeline.'];
    const STEP = 2200;                                                       // ms a stage stays lit when it runs by itself
    const GEO = { A: 0.25, SEG: 0.5, B: 0.25 };                              // pinned: a quiet lead, half a screen of scroll per stage, a quiet tail
    let k = reduce ? N : -1, playing = false, elapsed = 0, shownK = null, said = -2, Y = null;   // k: -1 not started, 0..4 the stage running, 5 done
    let D = null;                                                            // where each state sits on the page: { pinned, stops: [state -1 .. N] }
    const stopY = j => D.stops[clamp(j, -1, N) + 1];
    const kAt = y => { let j = -1; for (let i = 0; i <= N; i++) if (y >= D.stops[i + 1] - 6) j = i; return j; };
    const along = y => {                                                     // fractional state at a scroll position (extended beyond both ends)
      const t = D.stops, gap = (t[t.length - 1] - t[0]) / (t.length - 1) || 1;
      if (y <= t[0]) return -1 + (y - t[0]) / gap;
      for (let i = 0; i < t.length - 1; i++) if (y < t[i + 1]) return i - 1 + (y - t[i]) / Math.max(1, t[i + 1] - t[i]);
      return N + (y - t[t.length - 1]) / gap;
    };
    const at = p => {                                                        // scroll position of a fractional state
      const t = D.stops, gap = (t[t.length - 1] - t[0]) / (t.length - 1) || 1;
      if (p <= -1) return t[0] + (p + 1) * gap;
      if (p >= N) return t[t.length - 1];
      const i = Math.floor(p) + 1, f = p - Math.floor(p);
      return t[i] + (t[i + 1] - t[i]) * f;
    };
    const place = i => {                                                     // the marker sits on the center of the running stage (offsets, so entrance movement doesn't skew it)
      const li = stages[Math.max(0, Math.min(N - 1, i))], node = $('.sys-node', li);
      track.style.setProperty('--px', (li.offsetLeft + node.offsetLeft + node.offsetWidth / 2) + 'px');
      track.style.setProperty('--py', (li.offsetTop + node.offsetTop + node.offsetHeight / 2) + 'px');
    };
    const jumpY = y => (lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y));
    const ctlBtns = [runB, pauseB, prevB, nextB, replayB];
    const buttons = () => {
      const had = ctlBtns.find(b => b === doc.activeElement);
      runB.disabled = playing || k >= N; pauseB.disabled = !playing; prevB.disabled = k < 0; nextB.disabled = k >= N; replayB.disabled = k < 0;
      runB.textContent = k >= 0 && k < N ? 'Resume' : 'Run demonstration';
      // a control that has just been used and switched itself off hands the keyboard to the one that takes over
      if (had && had.disabled) (playing ? pauseB : [runB, nextB, replayB, prevB].find(b => !b.disabled) || replayB).focus({ preventScroll: true });
      markDirty();                                                           // the pager's run / pause button follows
    };
    const render = () => {
      if (k === shownK) return;
      shownK = k;
      sys.dataset.mode = k < 0 ? 'idle' : 'active';
      stages.forEach((el, i) => {
        const st = k < 0 ? '' : i < k ? 'done' : i === k ? 'active' : 'waiting';
        el.classList.remove('is-done', 'is-active', 'is-waiting');
        if (st) el.classList.add('is-' + st);
        $('.sys-state', el).textContent = st === 'done' ? 'Done' : st === 'active' ? 'Running' : st === 'waiting' ? 'Waiting' : '';
      });
      const now = Math.min(N, k + 1);
      rows.forEach(li => { const sg = +li.dataset.stage; li.classList.toggle('is-pending', k < 0 || (k < N && sg - 1 > k)); li.classList.toggle('is-now', sg === now); });
      statusEl.textContent = STATUS[k < 0 ? 0 : now];
      place(k < 0 ? 0 : k);
      // the first-view hint: gone once it runs; in a column it keeps its space, so the stages don't move under the reading line
      if (D && !D.pinned) { hint.hidden = false; hint.style.visibility = k >= 0 ? 'hidden' : ''; }
      else { hint.style.visibility = ''; hint.hidden = k >= 0; }
      buttons();
    };
    // the live line: said once the demonstration has rested on a state, not for every state a glide or a quick scroll passes through
    let heldK = k, heldAt = 0;
    const speak = now => {
      if (k !== heldK) { heldK = k; heldAt = now; }
      if (said === k || now - heldAt < 250 || (flight && flight.r === region)) return;
      if (said !== -2) live.textContent = k < 0 ? 'Not started.' : k >= N ? 'Demonstration complete. The sample inquiry is recorded in the pipeline.' : `Step ${k + 1} of ${N}: ${$('h4', stages[k]).textContent}. ${EVENT[k]}`;
      said = k;
    };
    let playP = null;
    const play = on => {
      playing = on && k < N; playP = null;
      if (playing && D && k < 0) nav.to(region, 1);                          // from the start, the first stage lights at once; the pace runs from there
      buttons();
    };
    const region = {
      id: 'demo', label: 'Capability demonstration', speaks: true,          // its own live region names each stage
      entry: 1,                                                              // coming in from above, a step lands on the first stage (not the idle state, which looks the same)
      paged: () => !!D && !D.pinned,                                         // its pager shows while the stages stand in a column (the controls above them scroll away)
      count: i => [i <= 0 ? '–' : i > N ? '✓' : String(i).padStart(2, '0'), String(N).padStart(2, '0')],
      bounds: () => D && [D.stops[0] - D.gap / 2, D.stops[N + 1] + D.gap / 2],    // half a stage of slack at either end, so resting just past one still counts
      stops: () => (D ? D.stops.slice() : []),
      names: () => ['Not started', ...stages.map(li => $('h4', li).textContent), 'Done'],
      scale: () => 0,                                                        // the stages stand still under a finger; a swipe takes one step
    };
    const goto = j => {                                                      // to a state (-1 .. N): by scroll where the page holds it, directly otherwise
      j = clamp(j, -1, N);
      if (D) nav.to(region, j + 1); else { k = j; elapsed = j < 0 ? 0 : j * STEP + 1; render(); }
    };
    runB.addEventListener('click', () => play(true));
    pauseB.addEventListener('click', () => play(false));
    prevB.addEventListener('click', () => { play(false); if (D) nav.step(-1, { r: region, stay: true }); else goto(k - 1); });
    nextB.addEventListener('click', () => { play(false); if (D) nav.step(1, { r: region, stay: true }); else goto(k + 1); });
    replayB.addEventListener('click', () => {
      play(false);
      if (!D) { k = -1; elapsed = 0; render(); play(true); return; }
      if (D.pinned) { jumpY(stopY(0)); k = 0; render(); play(true); return; }   // pinned: straight back to the first stage, running
      playing = true; playP = null; nav.to(region, 1); buttons();           // in a column: running at once; the pace starts when the glide back arrives
    });
    // a visitor's own input takes over from the pace the demonstration sets itself
    ['wheel', 'touchstart', 'keydown'].forEach(t => addEventListener(t, e => { if (playing && !(e.target.closest && e.target.closest('.sys-controls, .pager--demo'))) play(false); }, { passive: true }));
    sysCtl.inside = el => !!(el && el.closest && el.closest('#sys-demo'));
    sysCtl.manualMode = () => !D && !reduce;
    sysCtl.manual = dir => { const j = k + dir; if (j < -1 || j > N) return false; play(false); goto(j); return true; };
    // the pager's one button: Run (or Resume), Pause while it runs, Replay once it has finished; the same as the buttons in the panel
    sysCtl.transport = () => (playing ? 'pause' : k >= N ? 'replay' : 'run');
    sysCtl.press = () => { const t = sysCtl.transport(); (t === 'pause' ? pauseB : t === 'replay' ? replayB : runB).click(); };
    sysCtl.halt = () => { if (playing) play(false); };
    // pinned on a large window: the pinned stage lasts GEO.A + 5 * GEO.SEG + GEO.B screens of scroll. It is pinned only if the panel in its
    // fullest state (the record and log open) fits the screen below the corner logo and menu; otherwise it stays in the page
    const reveal = $('.sys-reveal', sys), lowerIn = $('.sys-lower-in', sys), stick = sys.parentNode;
    const px = v => parseFloat(v) || 0;
    const fullHeight = () => {                                              // the panel with the record and log open (and without the first-view hint, which is gone by then)
      const gap = px(getComputedStyle(sys).rowGap);
      const hintBlock = hint.hidden ? 0 : hint.offsetHeight + gap + px(getComputedStyle(hint).marginTop);
      return sys.offsetHeight - reveal.offsetHeight - px(getComputedStyle(reveal).marginTop) - hintBlock + lowerIn.offsetHeight;
    };
    const unpin = () => { Y = null; pin.style.height = ''; pin.classList.remove('is-pinned'); sys.classList.remove('sys-pinned'); stick.style.removeProperty('--sys-pt'); shownK = null; };
    const nodeYs = () => stages.map(li => { const r = $('.sys-node', li).getBoundingClientRect(); return r.top + window.scrollY + r.height / 2; });
    const measureColumn = () => {                                            // the stages in a column: their places on the page, from a reading line
      D = null;
      if (reduce) return;
      const ys = nodeYs();
      if (!(ys[N - 1] - ys[0] > 40 * (N - 1))) return;                       // the stages stand in a row: nothing to follow
      const line = VH() * 0.42, s = ys.map(v => Math.round(v - line)), gap = Math.round((s[N - 1] - s[0]) / (N - 1));
      D = { pinned: false, stops: [s[0] - gap, ...s, s[N - 1] + gap], first: ys[0], gap };
      shownK = null; markDirty();
    };
    measureDemo = () => {
      const can = pin && !reduce && root.classList.contains('pin') && !narrow && innerHeight >= 600 && innerWidth >= 1100;
      if (can) {
        pin.classList.add('is-pinned'); sys.classList.add('sys-pinned'); stick.style.removeProperty('--sys-pt');
        const was = statusEl.textContent; statusEl.textContent = STATUS[N];                              // measure with the longest status line
        const full = fullHeight(); statusEl.textContent = was;
        const cs = getComputedStyle(stick), minTop = parseFloat(cs.paddingTop) || 84, bottom = Math.max(20, parseFloat(cs.paddingBottom) || 0);
        if (full + minTop + bottom <= innerHeight) {
          stick.style.setProperty('--sys-pt', Math.round(Math.max(minTop, (innerHeight - full) / 2)) + 'px');   // the panel keeps one place while it opens
          const vh = innerHeight, len = vh * (GEO.A + N * GEO.SEG + GEO.B);
          pin.style.height = (len + vh) + 'px';
          Y = { top: pin.getBoundingClientRect().top + window.scrollY, len, vh };
          D = { pinned: true, stops: [-1, 0, 1, 2, 3, 4, 5].map(j => (j < 0 ? Y.top : Y.top + vh * (GEO.A + j * GEO.SEG) + 4)), gap: vh * GEO.SEG };
          shownK = null; markDirty();
          return;
        }
      }
      unpin(); measureColumn();
    };
    demoMoved = () => !!D && (D.pinned ? Math.abs(pin.getBoundingClientRect().top + window.scrollY - Y.top) > 2 : Math.abs(nodeYs()[0] - D.first) > 2);
    regions.push(region);
    tasks.add(dt => {
      if (D) {
        if (playing && !flight) {                                            // Run: the page moves through the states at a steady pace
          if (playP == null) playP = along(sy);
          playP = Math.min(N, playP + dt / STEP);
          jumpY(at(playP));
          if (playP >= N) play(false);
        }
        const nk = kAt(sy); if (nk !== k) k = nk;
        render();
      } else if (playing) {
        elapsed += dt; k = Math.min(N, Math.floor(elapsed / STEP)); if (k >= N) play(false); render();
      }
      speak(performance.now());
    });
    if ('ResizeObserver' in window) new ResizeObserver(() => place(k < 0 ? 0 : k)).observe(track);
    if (!reduce && 'IntersectionObserver' in window) {                     // the panel arrives once, as it comes into view
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { sys.classList.add('in'); io.disconnect(); } }, { rootMargin: '0px 0px -12% 0px' });
      io.observe(sys);
    } else sys.classList.add('in');
    render();
  }

  /* ------------------------------------------------------------------ copy the email address */
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const status = btn.parentElement.querySelector('.copy-status');
    const text = btn.dataset.copy, label = btn.dataset.label || (btn.dataset.label = btn.textContent);
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (err) {
      const ta = doc.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      doc.body.appendChild(ta); ta.select();
      try { ok = doc.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
    }
    clearTimeout(btn._t);
    if (ok) {
      btn.textContent = 'Copied'; btn.classList.add('is-done');
      if (status) status.textContent = 'Copied';
    } else {
      // our side couldn't copy; do the next best thing and leave the address selected
      const a = btn.parentElement.querySelector('a[href^="mailto:"]');
      if (a) { const r = doc.createRange(); r.selectNodeContents(a); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
      if (status) status.textContent = `Couldn't copy it for you. It's selected: press ${mac ? '⌘C' : 'Ctrl+C'}.`;
    }
    btn._t = setTimeout(() => { btn.textContent = label; btn.classList.remove('is-done'); if (status) status.textContent = ''; }, 2600);
  }));

  /* ------------------------------------------------------------------ input: one progress, any gesture
     The page's scroll position is the single progress value for every pinned experience (the opening and the work, the capabilities,
     the demonstration). Nothing has its own timeline. Each experience is a region with a list of stops, one per stage that looks
     different on screen; every input moves between those stops or scrolls the page:
       vertical touch, wheel, trackpad   the browser's own scrolling, never prevented (Lenis smooths wheels near the pinned areas; 'both'
                                         mode reads one axis per event, so a diagonal gesture never counts twice). After a touch scroll
                                         comes to rest between two stages of a pinned area, the page glides to the nearer stage in the
                                         direction it moved. (A hard flick's momentum is the browser's, and can carry past a stage.)
       horizontal touch or pen drag      only on a pinned stage (touch-action: pan-y), decided after 10 px of movement and then locked to
                                         that axis. The stage follows the finger (at most one stage either way) and settles on release:
                                         one gesture, one stage. A tap never stops a step that is moving. Gestures that start within
                                         24 px of the screen's edges are left to the system (back and forward); pinch-zoomed in, sideways
                                         movement pans the zoomed view instead.
       arrow keys, Page Up/Down, Space   one stage per press; holding a key doesn't race through stages.
       Previous / Next (touch screens)   the same steps.
     Steps chain: a step taken while another is still moving goes one past that one's target, so quick gestures are never lost.
     At either end of a region a further step lets go: the page moves on by most of a screen, and the opposite step comes back in.
     Input is only taken over while a region can respond; everywhere else the page scrolls natively. */
  const REL = () => VH() * 0.85;
  const maxY = () => Math.max(0, root.scrollHeight - innerHeight);
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const jump = y => (lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y));
  const glide = (y, ms, done) => {
    if (lenis) lenis.scrollTo(y, { duration: ms / 1000, easing: easeOutCubic, force: true, onComplete: () => { if (done) done(); } });
    else { window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); if (done) setTimeout(done, reduce ? 0 : ms); }
  };
  const glideMs = y => clamp(360 + Math.abs(y - sy) / VH() * 260, 420, 900);
  const within = (r, y, pad = 3) => { const b = r.bounds(); return !!b && y >= b[0] - pad && y <= b[1] + pad; };
  const pos = (stops, y) => {                              // fractional stop index of a scroll position (below 0 before the first, above n-1 after the last)
    const n = stops.length; if (!n) return 0;
    const gap = n > 1 ? (stops[n - 1] - stops[0]) / (n - 1) : VH();
    if (y <= stops[0]) return (y - stops[0]) / gap;
    for (let i = 0; i < n - 1; i++) if (y < stops[i + 1]) return i + (y - stops[i]) / Math.max(1, stops[i + 1] - stops[i]);
    return n - 1 + (y - stops[n - 1]) / gap;
  };
  let flight = null;                                       // a step on its way: { r, i (stop index, or null when letting go), y }
  let released = null;                                     // where the last step past an end landed: { r, dir, y }
  const seqStatus = $('#seq-status');
  const announce = (r, i) => {                             // one short line for screen readers, only after a deliberate step
    if (!seqStatus || i == null || r.speaks) return;
    const names = r.names ? r.names() : [];
    seqStatus.textContent = `${r.label}, ${i + 1} of ${r.stops().length}${names[i] ? ': ' + names[i] : ''}`;
  };
  const nav = {
    regionFor(y, dir) {
      if (released && dir === -released.dir && Math.abs(y - released.y) < 12) return released.r;
      return regions.find(r => within(r, y)) || null;
    },
    to(r, i, done, talk) {                                 // glide to one stop of a region
      const stops = r.stops(); if (!stops.length) return false;
      i = clamp(i, 0, stops.length - 1);
      const y = clamp(stops[i], 0, maxY());
      flight = { r, i, y }; released = null;
      glide(y, glideMs(y), () => { if (flight && flight.y === y) flight = null; if (talk) announce(r, i); if (done) done(); });
      return true;
    },
    // one step forward (+1) or back (-1). opts: r (a region to use), from (a fractional stop to count from), talk, stay (never let go)
    step(dir, opts = {}) {
      const r = opts.r || (flight && flight.r) || nav.regionFor(sy, dir);
      if (!r) return false;
      const stops = r.stops(), n = stops.length; if (!n) return false;
      let p;
      if (flight && flight.r === r && flight.i != null) p = flight.i;
      else if (released && released.r === r && Math.abs(sy - released.y) < 12) p = released.dir > 0 ? n - 0.5 : -0.5;
      else p = opts.from != null ? opts.from : pos(stops, sy);
      const near = Math.round(p), onStop = Math.abs(p - near) < 0.03;   // (resting a fraction of a pixel off a stage counts as on it)
      let i;
      if (onStop) i = near + dir;
      else if (p < 0) i = dir > 0 ? (r.entry || 0) : -1;   // coming in from before the first stage
      else if (p > n - 1) i = dir < 0 ? n - 1 : n;         // coming back from after the last
      else i = dir > 0 ? Math.ceil(p) : Math.floor(p);
      if (i >= 0 && i < n) return nav.to(r, i, null, opts.talk);
      if (opts.stay) return false;
      // past the first or last stage: let go, and the page moves on
      const b = r.bounds(), y = clamp(dir > 0 ? b[1] + REL() : b[0] - REL(), 0, maxY());
      if (Math.abs(y - sy) < 8) return false;
      flight = { r, i: null, y }; released = { r, dir, y };
      glide(y, glideMs(y), () => { if (flight && flight.y === y) flight = null; });
      return true;
    },
  };
  // a wheel, or a click somewhere other than a step control, ends any step on its way (the page is the visitor's again)
  addEventListener('wheel', () => { flight = null; }, { passive: true });
  // so does anything else that stops its glide (the browser's own touch scrolling, an immediate jump), once no gesture is deciding
  if (lenis) tasks.add(() => { if (flight && !g && lenis.isScrolling !== 'smooth') flight = null; });
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && !(e.target.closest && e.target.closest('.pager, .sys-controls'))) flight = null; }, { passive: true });
  const zone = y => regions.some(r => { const b = r.bounds(); return b && y > b[0] - innerHeight * 0.6 && y < b[1] + innerHeight * 0.6; });
  if (lenis) tasks.add(() => { lenis.options.smoothWheel = zone(sy); });

  // keys
  const KEYS = { ArrowDown: 1, ArrowRight: 1, PageDown: 1, ArrowUp: -1, ArrowLeft: -1, PageUp: -1 };
  const usesKey = (el, key) => {
    if (!el || !el.closest) return false;
    if (el.closest('input, textarea, select, [contenteditable="true"], [role="slider"], [role="textbox"], iframe')) return true;
    return key === ' ' && !!el.closest('button, a[href], summary, [role="button"]');
  };
  addEventListener('keydown', e => {
    if (e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey || menu.classList.contains('is-open')) return;
    let dir = KEYS[e.key];
    if (e.key === ' ') dir = e.shiftKey ? -1 : 1; else if (e.shiftKey) return;
    if (!dir || usesKey(e.target, e.key)) return;
    if (e.repeat) { if (flight || nav.regionFor(sy, dir)) e.preventDefault(); return; }   // a held key takes one step, not a run of them
    if (nav.step(dir, { talk: true })) { e.preventDefault(); return; }
    // the demonstration in a short wide window (stages in a row): left and right move it while focus is inside it
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && sysCtl.manualMode() && sysCtl.inside(e.target) && sysCtl.manual(dir)) e.preventDefault();
  });

  // touch and pen: the gesture's intent decides what happens (vertical: the browser scrolls; horizontal: one stage)
  const EDGE = 24, SLOP = 10;
  // iPhone Safari: its back/forward swipe reaches further in than 24 px and it cancels drags it wants for itself, and redrawing the
  // pinned stage under the finger every frame is heavy there. So the edge is wider, a swipe still counts if Safari cancels it
  // part-way, and a swipe takes its step as one smooth glide instead of following the finger.
  const IOS = !!(window.CSS && CSS.supports && CSS.supports('-webkit-touch-callout', 'none'));
  const edgeL = IOS ? 40 : EDGE;
  let g = null, followY = null, noClickUntil = 0, zoomed = false;
  // pinch-zoomed in: sideways movement pans the zoomed view, so the stages hand it back to the browser (touch-action: auto) until zoomed out
  const vv = window.visualViewport;
  if (vv) vv.addEventListener('resize', () => {
    const z = vv.scale > 1.02;
    if (z !== zoomed) { zoomed = z; root.classList.toggle('zoomed', z); if (z && g) cancelDrag(); }
  });
  tasks.add(() => { if (followY != null) { jump(followY); followY = null; } });   // the follow is written once per frame
  const letGo = () => { if (g && g.cap && g.el) { try { if (g.el.hasPointerCapture(g.id)) g.el.releasePointerCapture(g.id); } catch (err) { /* already released */ } } g = null; };
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    if (!e.isPrimary) { if (g) cancelDrag(); touchOwned = false; return; }   // a second finger (a pinch) ends any drag
    touchOwned = false;
    if (menu.classList.contains('is-open')) return;
    if (e.clientX < edgeL || e.clientX > innerWidth - edgeL) return;                    // the system's back and forward gestures
    if (!e.target.closest || e.target.closest('iframe, input, textarea, select, [contenteditable="true"]')) return;
    // only on the stages that leave sideways movement to the page (touch-action: pan-y); elsewhere the browser would take it anyway.
    // Zoomed in, sideways is the browser's too: it pans the zoomed view (see the zoom watch below)
    if (zoomed || !e.target.closest('.pin .stage, .pin .caps-stage, .sys-demo')) return;
    // a region the page is in, the one a step is still travelling through, or the one just let go of
    const r = nav.regionFor(sy, 0) || (flight && flight.r) || (released && Math.abs(sy - released.y) < 12 ? released.r : null);
    const manual = !r && sysCtl.manualMode() && sysCtl.inside(e.target);
    if (!r && !manual) return;
    // a step still on its way keeps going: a tap doesn't stop it, a vertical drag hands the page to the browser, a sideways one takes over
    g = { id: e.pointerId, el: e.target instanceof Element ? e.target : null, x0: e.clientX, y0: e.clientY, r, manual, axis: null, cap: false, dx: 0, samples: [[e.clientX, e.timeStamp]], from: 0, sy0: sy, dx0: 0 };
    touchOwned = e.pointerType === 'touch';            // until the gesture shows itself vertical, its touches don't stop a moving step
  }, { passive: true });
  addEventListener('pointermove', e => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.axis) {
      if (Math.hypot(dx, dy) < SLOP) return;
      g.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'x' : 'y';
      if (g.axis === 'y') { g = null; touchOwned = false; return; }   // vertical: the browser scrolls the page (touch-action: pan-y)
      if (g.r) {                                       // counted from the stage a moving step was heading to, followed from where the page is
        g.from = flight && flight.r === g.r && flight.i != null ? flight.i : pos(g.r.stops(), sy);
        if (flight) { g.took = flight; jump(sy); flight = null; }
        g.sy0 = sy; g.dx0 = dx;
      }
      try { if (g.el) { g.el.setPointerCapture(g.id); g.cap = true; } } catch (err) { /* capture is optional: the window still hears every move */ }
      g.scale = !IOS && g.r && g.r.scale ? g.r.scale(Math.round(g.from), dx < 0 ? 1 : -1) : 0;
    }
    g.dx = dx;
    g.samples.push([e.clientX, e.timeStamp]); if (g.samples.length > 6) g.samples.shift();
    if (g.r && g.scale) {                              // the stage follows the finger, one stage either way at most
      const stops = g.r.stops(), i0 = clamp(Math.round(g.from), 0, stops.length - 1);
      const lo = Math.min(g.sy0, stops[Math.max(0, i0 - 1)]), hi = Math.max(g.sy0, stops[Math.min(stops.length - 1, i0 + 1)]);
      let y = g.sy0 - (dx - g.dx0) * g.scale;
      if (y < lo) y = lo - (lo - y) * 0.25;
      if (y > hi) y = hi + (y - hi) * 0.25;            // beyond the reachable stages it only gives a little
      followY = clamp(y, 0, maxY());
    }
  }, { passive: true });
  function cancelDrag() {                              // no step: a step the finger took over goes on; otherwise back to where the finger took the page
    const s = g; letGo();
    if (!s || s.axis !== 'x') return;
    followY = null;
    if (s.took) {
      const f = flight = s.took;
      glide(f.y, glideMs(f.y), () => { if (flight === f) flight = null; });
    } else if (Math.abs(sy - s.sy0) > 1) glide(s.sy0, 320);
  }
  const endDrag = e => {
    if (!g || (e && e.pointerId !== g.id)) return;
    const cancelled = !!e && e.type === 'pointercancel';
    if (cancelled) { touchOwned = false; if (!(IOS && g.axis === 'x' && Math.abs(g.dx) >= 30)) { cancelDrag(); return; } }   // the browser has taken the touch (on iPhone a clear sideways swipe still counts)
    const s = g; letGo();
    if (s.axis !== 'x') return;
    const a = s.samples[0], b = s.samples[s.samples.length - 1];
    const v = (b[0] - a[0]) / Math.max(1, b[1] - a[1]);                             // px per ms over the last few moves
    const far = Math.abs(s.dx) >= Math.max(40, innerWidth * 0.1), quick = Math.abs(s.dx) >= 18 && Math.abs(v) >= 0.3;
    const reversed = Math.abs(v) >= 0.3 && Math.sign(v) !== Math.sign(s.dx);         // flicked back the other way: the visitor changed their mind
    const dir = (far || quick) && !reversed ? (s.dx < 0 ? 1 : -1) : 0;               // leftward advances, rightward goes back
    followY = null;
    if (dir) {
      noClickUntil = performance.now() + 400;                                        // a swipe that ends on a link doesn't also follow it
      if (s.manual) sysCtl.manual(dir);
      else if (!nav.step(dir, { r: s.r, from: s.from, talk: true })) { g = s; cancelDrag(); }   // nowhere to go (the top of the page): back into place
    } else { g = s; cancelDrag(); }
  };
  addEventListener('pointerup', endDrag, { passive: true });
  addEventListener('pointercancel', endDrag, { passive: true });
  addEventListener('lostpointercapture', e => { if (g && e.pointerId === g.id) g.cap = false; }, { passive: true });   // only bookkeeping: the gesture ends on pointerup or pointercancel
  addEventListener('click', e => { if (performance.now() < noClickUntil) { e.preventDefault(); e.stopPropagation(); } }, true);

  // after a touch scroll comes to rest between two stages of a pinned area, glide to the nearer one in the direction it was moving
  let fingerDown = false, liftedAt = 0, stillSince = 0, lastDir = 0, prevY = sy;
  addEventListener('touchstart', () => { fingerDown = true; liftedAt = 0; }, { passive: true });
  addEventListener('touchend', e => { if (!e.touches.length) { fingerDown = false; liftedAt = performance.now(); } }, { passive: true });
  addEventListener('touchcancel', () => { fingerDown = false; liftedAt = performance.now(); }, { passive: true });
  tasks.add((dt, moved) => {
    const now = performance.now();
    if (moved) { stillSince = now; if (sy !== prevY) lastDir = Math.sign(sy - prevY); }
    prevY = sy;
    if (!liftedAt || fingerDown || g || flight || now - stillSince < 160) return;
    if (now - liftedAt > 6000) { liftedAt = 0; return; }
    liftedAt = 0;
    const r = regions.find(x => x.id !== 'demo' && within(x, sy, 0));               // only the pinned stages; the demonstration reads like a page
    if (!r) return;
    const stops = r.stops(), n = stops.length, p = pos(stops, sy), near = Math.round(p);
    if (p < -0.02 || p > n - 0.98) return;                                           // beyond either end, the page stays free
    if (Math.abs(p - near) < 0.02) { if (Math.abs(sy - stops[near]) > 1) nav.to(r, near); return; }   // a few pixels off a stage: onto it
    const i = Math.floor(p), f = p - i;
    nav.to(r, lastDir >= 0 ? (f > 0.2 ? i + 1 : i) : (f < 0.8 ? i : i + 1));
  });

  // the opening hint: visible at once, back on every load, and gone once the visitor has actually moved the opening
  tasks.add(() => { if (!root.classList.contains('cue-off') && sy > (S ? S.top + S.vh * 0.18 : VH() * 0.18)) root.classList.add('cue-off'); });

  // previous / next where the screen is touched (phones and tablets): the counter shows the current stage
  const coarse = matchMedia('(pointer: coarse)');
  const pad2 = x => String(x).padStart(2, '0');
  const pagers = $$('.pager').map(el => ({ el, seq: el.dataset.seq, r: regions.find(x => x.id === el.dataset.seq), prev: $('[data-dir="-1"]', el), next: $('[data-dir="1"]', el), play: $('.pager-play', el), num: $('.pager-num', el), total: $('.pager-total', el), shown: null, at: -1, n: 0, ps: '' }));
  const PLAY = { run: ['Run demonstration', '#i-play'], pause: ['Pause demonstration', '#i-pause'], replay: ['Replay demonstration', '#i-replay'] };
  const syncPagers = () => pagers.forEach(P => {
    // the strip's and the capabilities' show on pinned stages where the screen is touched (or the layout is narrow);
    // a region can decide for itself (the demonstration: while its stages stand in a column)
    const on = !!(P.r && !reduce && P.r.bounds() && (P.r.paged ? P.r.paged() : pin && (narrow || coarse.matches)));
    if (on !== P.shown) { P.el.hidden = !on; P.shown = on; root.classList.toggle('has-pager-' + P.seq, on); }
    if (!on) return;
    if (P.play) {
      const t = sysCtl.transport();
      if (t !== P.ps) { P.ps = t; P.play.setAttribute('aria-label', PLAY[t][0]); $('use', P.play).setAttribute('href', PLAY[t][1]); }
    }
    const stops = P.r.stops(), n = stops.length, y = flight && flight.r === P.r && flight.i != null ? flight.y : sy;
    const i = clamp(Math.round(pos(stops, y)), 0, n - 1);
    if (i === P.at && n === P.n) return;
    P.at = i; P.n = n;
    const [num, total] = P.r.count ? P.r.count(i, n) : [pad2(i + 1), pad2(n)];
    P.num.textContent = num; P.total.textContent = total;
    const names = P.r.names ? P.r.names() : [];
    P.prev.setAttribute('aria-label', i > 0 ? `Previous: ${names[i - 1] || 'stage ' + i}` : 'Previous: back up the page');
    P.next.setAttribute('aria-label', i < n - 1 ? `Next: ${names[i + 1] || 'stage ' + (i + 2)}` : 'Next: continue down the page');
    P.prev.disabled = i === 0 && P.r.bounds()[0] < 8;   // nothing above the top of the page
  });
  pagers.forEach(P => {
    [P.prev, P.next].forEach(b => b.addEventListener('click', () => {
      if (P.seq === 'demo') sysCtl.halt();                                           // a step by hand takes over from Run
      nav.step(+b.dataset.dir, { r: P.r, talk: true });
    }));
    if (P.play) P.play.addEventListener('click', () => sysCtl.press());
  });
  tasks.add((dt, moved) => { if (moved || dirty || flight) syncPagers(); });
  coarse.addEventListener && coarse.addEventListener('change', syncPagers);

  // phones: the owl steps aside while reading downward and returns on the way back up
  const phone = matchMedia('(max-width: 759px)');
  let lastY = sy;
  tasks.add((dt, moved) => {
    if (!moved) return;
    const dy = sy - lastY;
    if (phone.matches && sy > innerHeight * 1.5 && dy > 6) topBar.classList.add('logo-away');
    else if (!phone.matches || sy <= innerHeight * 1.5 || dy < -6) topBar.classList.remove('logo-away');
    lastY = sy;
  });

  /* ------------------------------------------------------------------ layout changes */
  function setMode() {
    const m = modeNow();
    if (m.pin !== pin || m.narrow !== narrow) { pin = m.pin; narrow = m.narrow; root.classList.toggle('pin', pin); root.classList.toggle('narrow', narrow); }
    root.style.setProperty('--menu-w', menuBtn.offsetWidth + 'px');   // the wide pager sits beside the menu button
    measureStrip(); measureCaps(); measureDemo(); liveFit(); syncPagers();
    if (lenis) lenis.resize();
  }
  let rt = 0, lastW = innerWidth, lastH = innerHeight;
  const onResize = () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      // phones hide and show their toolbars while scrolling; only a real change of size re-lays the page
      if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 160 && (narrow || !pin)) return;
      lastW = innerWidth; lastH = innerHeight; setMode();
    }, 120);
  };
  addEventListener('resize', onResize);
  addEventListener('orientationchange', onResize);
  // content above the capabilities can change height (folds opening, fonts): keep the pinned lengths right
  if ('ResizeObserver' in window) {
    let ro = 0;
    new ResizeObserver(() => { cancelAnimationFrame(ro); ro = requestAnimationFrame(() => { if (C && caps.offsetTop !== C.top) measureCaps(); if (S && strip.offsetTop !== S.top) measureStrip(); if (demoMoved()) measureDemo(); }); }).observe(mainEl);
  }
  addEventListener('load', setMode);
  fontsReady.then(setMode);
  setMode();
})();
