/* Lumera Creative — site behavior, light edition. Plain JavaScript, one rAF loop, Lenis for scroll.
   On wide screens the opening and the work share one pinned stage: each project waits at the edge as a strip of
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

  /* ------------------------------------------------------------------ scroll + one loop */
  let lenis = null;
  if (!reduce && window.Lenis) lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });

  const tasks = new Set();
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

  /* ------------------------------------------------------------------ mode: the pinned layouts need a wide, landscape window and motion */
  let wide = root.classList.contains('wide');
  const wantWide = () => !reduce && innerWidth >= WIDE && innerWidth > innerHeight * 1.1;

  /* ------------------------------------------------------------------ the strip */
  const strip = $('.strip'), stage = $('#stage');
  const panels = $$('[data-panel]', stage);
  const bbsP = panels[3];
  const bbsScroll = $('.p-scroll', bbsP), bbsMedia = $('.p-media', bbsP), bbsInfo = $('.p-info', bbsP);
  const stream = $('.stream', bbsP), streamPill = $('.stream-pill', bbsP);
  const stripRise = $$('[data-rise]', strip);
  // scroll lengths, in screen heights: a rest on the opening, one per project, the column closing, the stream
  const G = { hold: 0.3, step: 1, close: 0.8, stream: 1.7, tail: 0.15 };
  let S = null, introK = 1, introT = 0;

  function measureStrip() {
    panels.forEach(p => { p._x = p._w = null; });
    if (!wide) {
      S = null;
      strip.style.height = '';
      panels.forEach(p => { p.style.width = ''; p.style.transform = ''; });
      bbsScroll.style.transform = ''; bbsMedia.style.height = ''; bbsInfo.style.opacity = '';
      stream.classList.remove('on'); streamPill.classList.remove('on');
      if (rio) stripRise.forEach(el => { if (!el.classList.contains('in')) rio.observe(el); });   // stacked: rise on sight
      return;
    }
    const vw = innerWidth, vh = innerHeight;
    const len = vh * (G.hold + 3 * G.step + G.close + G.stream + G.tail);
    strip.style.height = (len + vh) + 'px';
    const COL = 0.26 * vw, tileH = COL * 10 / 16;
    S = {
      vw, vh, len, top: strip.offsetTop,
      HERO: 0.5 * vw, OPEN: 0.62 * vw, S1: 0.30 * vw, S2: 0.10 * vw, S3: 0.05 * vw, COL, tileH,
      // the column's own image, then the stream, travel up until the last tile clears the pill
      travel: Math.max(0, tileH + stream.children.length * (tileH + 8) - vh * 0.84),
    };
    markDirty();
  }
  // the scroll position at which a panel is open at the left edge
  const stripY = i => S.top + S.vh * (i <= 0 ? 0 : i <= 3 ? G.hold + i * G.step : G.hold + 3 * G.step + G.close);
  const openW = i => (i === 0 ? S.HERO : S.OPEN);
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
    const s = clamp(sy - S.top, 0, S.len), u = s / S.vh;
    const A0 = G.hold, A1 = A0 + 3 * G.step, B1 = A1 + G.close;
    let f = 0, q = 0, r = 0;
    if (u > A0 && u < A1) { const x = (u - A0) / G.step, k = Math.floor(x); f = k + settle(x - k); }
    else if (u >= A1) { f = 3; q = smooth(clamp((u - A1) / G.close, 0, 1)); r = clamp((u - B1) / G.stream, 0, 1); }

    // the track: panels before the current one have gone by at full width; the current one is sliding out
    const fi = Math.min(Math.floor(f), 3);
    let x = 0;
    for (let j = 0; j < fi; j++) x -= openW(j);
    x -= (f - fi) * openW(fi);
    const w = [0, 1, 2, 3].map(i => widthAt(i, f));
    if (q > 0) w[3] = lerp(S.OPEN, S.COL, q);                // the last project closes into a column
    const ie = introK >= 1 ? 1 : easeOutQuart(introK);
    let cx = x;
    for (let i = 0; i < 5; i++) {
      const wi = i < 4 ? w[i] : Math.max(0, S.vw - cx);      // the work list fills whatever is left
      const arrive = i > 0 && ie < 1 ? (1 - ie) * S.vw * (0.32 + i * 0.07) : 0;
      place(panels[i], cx + arrive, wi);
      cx += wi;
    }

    // the column: the name fades, the image becomes a tile, and the rest of the work streams up under it
    bbsInfo.style.opacity = q > 0 ? (1 - clamp(q * 2.2, 0, 1)).toFixed(3) : '';
    bbsMedia.style.height = q > 0 ? lerp(S.vh * 0.62, S.tileH, q).toFixed(1) + 'px' : '';
    stream.classList.toggle('on', q > 0.55);
    streamPill.classList.toggle('on', q > 0.9);
    bbsScroll.style.transform = r > 0 ? `translate3d(0,${(-r * S.travel).toFixed(1)}px,0)` : '';
    if (q > 0.3) stripRise.forEach(el => el.classList.add('in'));

    root.classList.toggle('past-hero', f > 0.28 || s >= S.len);
  }
  tasks.add((dt, moved) => {
    if (introK < 1) { introK = clamp((performance.now() - introT) / 1500, 0, 1); dirty = true; }
    if (!S) { if (moved || dirty) root.classList.toggle('past-hero', sy > panels[0].offsetHeight * 0.5); return; }
    if (!moved && !dirty) return;
    if (sy > S.top + S.len + S.vh * 1.5 && !dirty) return;   // well past the strip: nothing to move
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

  /* ------------------------------------------------------------------ capabilities: panels push in from the right */
  const caps = $('#capabilities'), capPanels = $$('.cap', caps), capNav = $$('.cap-nav span', caps), capBar = $('.cap-bar i', caps);
  let C = null, capOn = -1;
  function measureCaps() {
    if (!wide) { C = null; caps.style.height = ''; capPanels.forEach(p => { p.style.transform = ''; }); return; }
    const vh = innerHeight, n = capPanels.length;
    const len = vh * ((n - 1) + 0.5);                      // a quarter-screen rest before the first move and after the last
    caps.style.height = (len + vh) + 'px';
    C = { vh, vw: innerWidth, n, len, top: caps.offsetTop };
    markDirty();
  }
  tasks.add((dt, moved) => {
    if (!C || (!moved && !dirty)) return;
    if (sy < C.top - C.vh * 1.5 || sy > C.top + C.len + C.vh * 1.5) return;
    const u = clamp((sy - C.top) / C.vh - 0.25, 0, C.n - 1), k = Math.floor(u);
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

  /* ------------------------------------------------------------------ header: the small logo turns light over the dark sections */
  const topBar = $('#top-bar');
  const darks = $$('#lennys, .approach, .contact, .foot');
  tasks.add((dt, moved) => {
    if (!moved && !dirty) return;
    const on = darks.some(el => { const r = el.getBoundingClientRect(); return r.top <= 40 && r.bottom >= 40; });
    topBar.classList.toggle('on-dark', on);
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
    menuT = setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduce ? 0 : 900);
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
    // never hold the page for long: at most 1.5 s for the font, and the slices show for at least 1.1 s
    Promise.race([fontsReady, new Promise(r => setTimeout(r, 1500))]).then(() => setTimeout(go, Math.max(0, 1100 - (performance.now() - t0))));
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
      if (!strip.contains(el) || !wide) rio.observe(el);
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
  const canPlay = v => v._inView && !v.closest('.is-live');
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
  const addPlayButton = v => {
    const b = doc.createElement('button');
    b.type = 'button'; b.className = 'play';
    const label = () => { b.textContent = v.paused ? 'Play recording' : 'Pause'; };
    label();
    b.addEventListener('click', () => { loadVideo(v); if (v.paused) v.play().catch(() => {}); else v.pause(); });
    v.addEventListener('play', label); v.addEventListener('pause', label);
    v.parentElement.appendChild(b);
  };
  videos.forEach(v => {
    v.addEventListener('ended', () => { v.currentTime = 0; if (!reduce && canPlay(v)) startWalk(v); });
    posterIO.observe(v);
    if (reduce) { addPlayButton(v); playIO.observe(v); return; }
    nearIO.observe(v); playIO.observe(v);
  });

  /* ------------------------------------------------------------------ scroll it yourself: the live site inside a screen
     The site is laid out at a real laptop (1280 wide) or phone (390 wide) viewport and scaled to the screen.
     Only one runs at a time, and only where the screen is big enough to read. */
  const LIVE = { desk: { base: 1280, min: 700, word: 'laptop' }, phone: { base: 390, min: 230, word: 'phone' } };
  let live = null;
  const liveBtns = $$('.live-btn');
  const screenOf = b => $(b.dataset.live === 'desk' ? '.site-desk' : '.phone-screen', b.closest('.site'));
  const nameBtn = (b, on) => {
    const word = LIVE[b.dataset.live].word, text = on ? 'Back to the recording' : 'Scroll it yourself';
    $('.live-label', b).textContent = text;
    b.setAttribute('aria-label', `${text}, on a ${word}`);
    b.setAttribute('aria-expanded', on ? 'true' : 'false');
  };
  const fitLive = () => {
    if (!live) return;
    const w = live.box.clientWidth, h = live.box.clientHeight;
    const bw = Math.max(LIVE[live.kind].base, w), bh = Math.round(bw * h / w);
    Object.assign(live.frame.style, { width: bw + 'px', height: bh + 'px', transform: `scale(${(w / bw).toFixed(5)})` });
  };
  const liveRO = 'ResizeObserver' in window ? new ResizeObserver(fitLive) : null;
  const closeLive = () => {
    if (!live) return;
    const L = live; live = null;
    if (liveRO) liveRO.unobserve(L.box);
    L.frame.remove();
    L.box.classList.remove('is-live', 'is-loaded');
    nameBtn(L.btn, false);
    const v = $('video', L.box);
    if (v && !reduce && canPlay(v)) startWalk(v);
  };
  const openLive = b => {
    closeLive();
    const box = screenOf(b), kind = b.dataset.live;
    const frame = doc.createElement('iframe');
    frame.className = 'live-frame';
    frame.title = `The live ${b.dataset.name} site, on a ${LIVE[kind].word}. Scroll it here.`;
    // the study can't navigate the portfolio away; its links open in new tabs or inside the screen
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
    frame.setAttribute('allow', 'autoplay; fullscreen');
    frame.referrerPolicy = 'no-referrer';
    frame.addEventListener('load', () => box.classList.add('is-loaded'), { once: true });
    frame.src = b.dataset.src;
    const v = $('video', box);
    if (v) { clearTimeout(v._hold); v.pause(); }
    box.classList.add('is-live');
    box.appendChild(frame);
    live = { box, kind, frame, btn: b };
    fitLive();
    if (liveRO) liveRO.observe(box);
    nameBtn(b, true);
  };
  const liveFit = () => {
    liveBtns.forEach(b => { b.hidden = screenOf(b).clientWidth < LIVE[b.dataset.live].min; });
    $$('.site-live').forEach(row => { row.hidden = $$('.live-btn', row).every(b => b.hidden); });
    if (live && live.btn.hidden) closeLive();
  };
  liveBtns.forEach(b => {
    nameBtn(b, false);
    b.addEventListener('click', () => (live && live.btn === b ? closeLive() : openLive(b)));
  });

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

  /* ------------------------------------------------------------------ Lenny's: the section takes the color of the page on screen */
  // 10 samples per second of each recording's page color (sampled from the frames, darkened to keep text contrast);
  // the laptop recording leads on wide screens, the phone recording on phones
  const LENNYS = window.LUMERA_LENNYS_COLORS || null;
  const lennys = $('#lennys'), lv = lennys && $(`video[data-colors="${phoneLayout ? 'm' : 'd'}"]`, lennys);
  if (lennys && lv && LENNYS && !reduce) {
    const seq = (phoneLayout ? LENNYS.m : LENNYS.d).match(/.{6}/g).map(h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]);
    const drinkSeq = (phoneLayout ? LENNYS.mDrink : LENNYS.dDrink) || '';   // which cocktail is on screen, per sample
    const drinks = $$('.drinks li', lennys);
    let col = seq[0].slice(), shownKey = '', on = -1, playing = false;
    lv.addEventListener('playing', () => { playing = true; });
    lv.addEventListener('pause', () => { playing = false; });
    tasks.add(dt => {
      if (!playing) return;
      const f = lv.currentTime * 10, i = Math.floor(f), fr = f - i;
      const a = seq[Math.min(i, seq.length - 1)], b = seq[Math.min(i + 1, seq.length - 1)];
      const target = a.map((v, c) => lerp(v, b[c], fr));
      col = col.map((v, c) => lerp(v, target[c], dtK(0.2, dt)));
      const key = col.map(v => Math.round(v)).join(',');
      if (key !== shownKey) { lennys.style.backgroundColor = `rgb(${key})`; lennys.style.setProperty('--bg', `rgb(${key})`); shownKey = key; }
      // which cocktail is on screen (decided from the recording's own page colors when it was sampled)
      const ch = drinkSeq[Math.min(i, drinkSeq.length - 1)];
      const best = ch && ch !== '-' ? +ch : -1;
      if (best !== on) { drinks.forEach((li, k) => li.classList.toggle('is-on', k === best)); on = best; }
    });
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

  /* ------------------------------------------------------------------ copy the email address */
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const status = btn.parentElement.querySelector('.copy-status');
    const text = btn.dataset.copy;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (err) {
      const ta = doc.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      doc.body.appendChild(ta); ta.select();
      try { ok = doc.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
    }
    if (status) { status.textContent = ok ? 'Copied' : 'Select and copy the address'; clearTimeout(btn._t); btn._t = setTimeout(() => { status.textContent = ''; }, 2600); }
  }));

  /* ------------------------------------------------------------------ layout changes */
  function setMode() {
    const w = wantWide();
    if (w !== wide) { wide = w; root.classList.toggle('wide', wide); }
    measureStrip(); measureCaps(); liveFit();
    if (lenis) lenis.resize();
  }
  let rt = 0, lastW = innerWidth, lastH = innerHeight;
  const onResize = () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      // phones hide and show their toolbars while scrolling; only a real change of size re-lays the page
      if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120 && !wide) return;
      lastW = innerWidth; lastH = innerHeight; setMode();
    }, 120);
  };
  addEventListener('resize', onResize);
  addEventListener('orientationchange', onResize);
  // content above the capabilities can change height (folds opening, fonts): keep the pinned lengths right
  if ('ResizeObserver' in window) {
    let ro = 0;
    new ResizeObserver(() => { cancelAnimationFrame(ro); ro = requestAnimationFrame(() => { if (C && caps.offsetTop !== C.top) measureCaps(); if (S && strip.offsetTop !== S.top) measureStrip(); }); }).observe(mainEl);
  }
  addEventListener('load', setMode);
  fontsReady.then(setMode);
  setMode();
})();
