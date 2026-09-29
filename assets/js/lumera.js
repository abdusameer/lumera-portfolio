/* Lumera Creative — site behavior. Plain JavaScript, one rAF loop, Lenis for scroll.
   The Adaptive Frame: one frame that travels between [data-frame] targets and changes its role for each. */
(() => {
  'use strict';

  const doc = document, root = doc.documentElement;
  root.classList.add('js');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const PHONE = 760, WIDE = 1024;
  const phoneLayout = innerWidth < PHONE;                    // media sources are chosen once, at load
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
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

  /* ------------------------------------------------------------------ header + nav state */
  const bar = $('#bar');
  tasks.add((dt, moved) => { if (moved || dirty) bar.classList.toggle('is-solid', sy > 24); });

  const navLinks = $$('.nav a[href^="#"]');
  const navTargets = navLinks.map(a => doc.querySelector(a.getAttribute('href')));
  const secIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a, i) => a.setAttribute('aria-current', navTargets[i] === e.target ? 'true' : 'false'));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navTargets.forEach(t => t && secIO.observe(t));
  new IntersectionObserver(([e]) => { if (e.isIntersecting) navLinks.forEach(a => a.setAttribute('aria-current', 'false')); }, { rootMargin: '-45% 0px -50% 0px' }).observe($('#top'));

  /* ------------------------------------------------------------------ in-page links */
  const headerH = () => bar.offsetHeight;
  const goTo = (id, focus) => {
    const top = id === '#top';
    const target = top ? doc.body : doc.querySelector(id);
    if (!target) return;
    const done = () => {
      if (!focus || top) return;
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    if (lenis) {
      lenis.scrollTo(top ? 0 : target, { offset: top ? 0 : -headerH() + 1, duration: 1.25, easing: t => 1 - Math.pow(1 - t, 4), onComplete: done });
    } else {
      const y = top ? 0 : target.getBoundingClientRect().top + window.scrollY - headerH() + 1;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      done();
    }
  };
  doc.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href');
    if (id.length < 2 || (id !== '#top' && !doc.querySelector(id))) return;
    e.preventDefault();
    const fromMenu = !!a.closest('.menu');
    closeMenu(false);
    goTo(id, true);
    history.replaceState(null, '', id === '#top' ? location.pathname + location.search : id);
    if (fromMenu) markDirty();
  });

  /* ------------------------------------------------------------------ mobile menu (dialog) */
  const menu = $('#menu'), menuBtn = $('#menu-btn'), menuClose = $('#menu-close');
  const mainEl = $('#main'), footEl = $('.foot');
  let lastFocus = null;
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
    lastFocus = doc.activeElement;
    menu.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    mainEl.inert = true; footEl.inert = true; bar.inert = true;
    if (lenis) lenis.stop();
    doc.addEventListener('keydown', onMenuKey);
    (focusables()[1] || menuClose).focus();
  }
  function closeMenu(restore) {
    if (menu.hidden) return;
    menu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    mainEl.inert = false; footEl.inert = false; bar.inert = false;
    if (lenis) lenis.start();
    doc.removeEventListener('keydown', onMenuKey);
    if (restore && lastFocus && lastFocus.focus) lastFocus.focus();
  }
  menuBtn.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu(true)));
  menuClose.addEventListener('click', () => closeMenu(true));
  matchMedia(`(min-width: ${WIDE}px)`).addEventListener('change', e => { if (e.matches) closeMenu(false); });

  /* ------------------------------------------------------------------ fit type to the frame
     Each .fit-line fills its container's width by adjusting Archivo's width axis instead of wrapping. */
  const fits = $$('.fit');
  // the small viewport height (toolbars shown): stable while mobile toolbars move, and the same unit the CSS uses
  const svhProbe = doc.createElement('i');
  svhProbe.setAttribute('aria-hidden', 'true');
  svhProbe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
  doc.body.appendChild(svhProbe);
  const svh = () => svhProbe.offsetHeight || innerHeight;
  const availH = el => {
    const host = el.parentElement;
    const cs = getComputedStyle(host);
    let h = host.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    Array.from(host.children).forEach(c => { if (c !== el) h -= c.getBoundingClientRect().height; });
    const own = getComputedStyle(el);
    h -= parseFloat(own.paddingTop) + parseFloat(own.marginTop);
    return h;
  };
  const fitOne = el => {
    const lines = $$('.fit-line', el);
    const W = el.clientWidth;
    if (!lines.length || !W) return;
    el.style.fontSize = '100px';
    const at = pct => { lines.forEach(l => l.style.setProperty('--wdth', pct + '%')); return lines.map(l => l.getBoundingClientRect().width); };
    const w100 = at(100), w75 = at(75);
    const widthAt = (k, pct) => w75[k] + (w100[k] - w75[k]) * (pct - 75) / 25;   // width axis is close to linear
    const widest = Math.max(...lines.map((_, k) => widthAt(k, 86)));
    let size = 100 * W / widest;
    // height cap only where the frame has a set height (desktop hero/contact); on phones the frame follows the type
    const host = el.closest('.intro-frame, .contact-field');
    const h = host && parseFloat(getComputedStyle(host).minHeight) > 0 ? availH(el) : 0;
    if (h > 0) size = Math.min(size, h / (lines.length * 0.86));
    // never taller than the screen can show next to the label and actions (phones held sideways)
    const vhCap = (svh() - headerH() - 150) / (lines.length * 0.86);
    if (vhCap > 30) size = Math.min(size, vhCap);
    size = clamp(size, 30, 280);
    el.style.fontSize = size.toFixed(2) + 'px';
    const f = size / 100;
    lines.forEach((l, k) => {
      const a = w75[k] * f, b = w100[k] * f;
      l.style.setProperty('--wdth', clamp(75 + (W - a) / (b - a) * 25, 62, 125).toFixed(2) + '%');
    });
    // one correction pass so nothing crosses the frame
    const widths = lines.map(l => l.getBoundingClientRect().width);
    lines.forEach((l, k) => {
      const cur = parseFloat(l.style.getPropertyValue('--wdth'));
      const slope = (w100[k] - w75[k]) * f / 25;
      if (slope > 0) l.style.setProperty('--wdth', clamp(cur + (W - widths[k]) / slope, 62, 125).toFixed(2) + '%');
    });
    const over = Math.max(...lines.map(l => l.getBoundingClientRect().width));
    if (over > W + 0.5) el.style.fontSize = (size * W / over).toFixed(2) + 'px';
  };
  const fitAll = () => fits.forEach(fitOne);
  // fit only when the result can stand: the display face is loaded, or the fallback is already showing.
  // Until then the CSS size holds the headline's space, so a fallback fit can't move the page when Archivo arrives.
  const faceReady = () => !doc.fonts || !doc.fonts.check || doc.fonts.check('800 100px Archivo');
  const fitIfReady = () => { if (faceReady() || root.classList.contains('fonts-ready')) fitAll(); };
  fitIfReady();
  const fontsReady = (doc.fonts && doc.fonts.ready) ? doc.fonts.ready : Promise.resolve();
  fontsReady.then(() => { fitAll(); root.classList.add('fonts-ready'); measureAll(); });

  /* ------------------------------------------------------------------ the Adaptive Frame */
  const af = $('#af');
  const side = { t: $('.af-t', af), r: $('.af-r', af), b: $('.af-b', af), l: $('.af-l', af) };
  const readEl = $('.af-read', af), readRole = $('.af-role', af), readDim = $('.af-dim', af);

  // role → how the frame draws itself
  const ROLE = {
    open:     { gap: 34, mis: 1, op: [1, 1, 1, 1], gold: 0,   a: .92 },
    neutral:  { gap: 0,  mis: 0, op: [1, 1, 1, 1], gold: 0,   a: .6 },
    crop:     { gap: 12, mis: 0, op: [1, 1, 1, 1], gold: 0,   a: .9 },
    viewport: { gap: 12, mis: 0, op: [1, 1, 1, 1], gold: 0,   a: .9 },
    facts:    { gap: 0,  mis: 0, op: [1, 1, 1, 1], gold: 0,   a: .85 },
    mask:     { gap: 12, mis: 0, op: [1, 1, 1, 1], gold: 0,   a: .9 },
    site:     { gap: 12, mis: 0, op: [1, 1, 1, 1], gold: 0,   a: .9 },
    boundary: { gap: 0,  mis: 0, op: [1, 1, 1, 1], gold: 0,   a: 1 },
    line:     { gap: 0,  mis: 0, op: [0, 0, 1, 0], gold: 0,   a: .85 },
    step1:    { gap: 0,  mis: 0, op: [0, 0, 1, 0], gold: 0,   a: .85 },
    step2:    { gap: 0,  mis: 0, op: [0, 0, 1, 1], gold: 0,   a: .85 },
    step3:    { gap: 18, mis: 0, op: [1, 0, 1, 1], gold: .35, a: .9 },
    step4:    { gap: 0,  mis: 0, op: [1, 1, 1, 1], gold: 1,   a: 1 },
    index:    { gap: 0,  mis: 0, op: [1, 1, 1, 1], gold: 0,   a: .45 },
    row:      { gap: 0,  mis: 0, op: [1, 1, 1, 1], gold: .8,  a: 1 },
    field:    { gap: 0,  mis: 0, op: [1, 1, 1, 1], gold: 1,   a: 1 },
  };
  // the opening frame is unresolved: its sides overshoot or fall short of the corners
  const MIS = { t: [-30, -130], r: [58, 22], b: [86, 28], l: [-24, -76] };
  const TONE = { dark: [238, 232, 221], light: [27, 24, 19] };
  const GOLD = [217, 168, 96];

  let afOn = false, targets = [], idx = 0, introK = reduce ? 1 : 0, introStart = 0;
  let P = -1, lastMove = 0, settling = false;   // P = target index + progress; eases to a decision when scrolling stops
  let cur = null, readKey = '', colorKey = '', readW = 0;

  const styleOf = t => {
    const r = ROLE[t.role] || ROLE.neutral;
    return { gap: r.gap, mis: r.mis, op: r.op, gold: r.gold, a: r.a, tone: TONE[t.tone] };
  };
  const mixStyle = (A, B, k) => ({
    gap: lerp(A.gap, B.gap, k), mis: lerp(A.mis, B.mis, k), gold: lerp(A.gold, B.gold, k), a: lerp(A.a, B.a, k),
    op: A.op.map((v, i) => lerp(v, B.op[i], k)), tone: A.tone.map((v, i) => lerp(v, B.tone[i], k)),
  });
  const mixRect = (A, B, k) => ({ x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k), w: lerp(A.w, B.w, k), h: lerp(A.h, B.h, k) });

  function measureTargets() {
    const vh = innerHeight, max = Math.max(0, root.scrollHeight - vh), s = window.scrollY;
    targets = $$('[data-frame]').filter(el => el.getClientRects().length).map(el => {
      const r = el.getBoundingClientRect();
      const anchorEl = el.dataset.frameAnchor ? $(el.dataset.frameAnchor) : el;
      const ar = anchorEl.getBoundingClientRect();
      return {
        el, role: el.dataset.frame, label: el.dataset.frameLabel || el.dataset.frame,
        tone: el.closest('[data-tone="light"]') ? 'light' : 'dark',
        live: el.hasAttribute('data-frame-live'), clip: el.hasAttribute('data-frame-clip'),
        x: r.left, y: r.top + s, w: r.width, h: r.height,
        // tall targets count as reached once their top is 42% down the screen; smaller ones when centered
        a: clamp(ar.height > vh * 0.45 ? ar.top + s - vh * 0.42 : ar.top + s + ar.height / 2 - vh / 2, 0, max),
        veil: el.querySelector(':scope > .veil'), clipState: '',
      };
    });
    for (let i = 1; i < targets.length; i++) targets[i].a = Math.max(targets[i].a, targets[i - 1].a);
    idx = Math.min(idx, Math.max(0, targets.length - 2));
    markDirty();
  }
  const rectOf = t => {
    if (t.live) { const r = t.el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }
    return { x: t.x, y: t.y - sy, w: t.w, h: t.h };
  };
  // how long the frame rests on each target before moving on (a shorter rest into project media)
  const dwellFor = (A, B) => (A.role === 'neutral' && B.clip) ? 0.08 : 0.28;

  function setClip(t, state, hole) {
    if (!t.veil) return;
    if (state === 'frame') {
      const { x0, y0, x1, y1 } = hole;
      t.veil.style.opacity = '';
      t.veil.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x0}px ${y0}px, ${x1}px ${y0}px, ${x1}px ${y1}px, ${x0}px ${y1}px, ${x0}px ${y0}px)`;
    } else if (state !== t.clipState) {
      t.veil.style.clipPath = '';
      t.veil.style.opacity = state === 'full' ? '0' : '';
    }
    t.clipState = state;
  }

  // capability rows can borrow the frame on hover or focus
  let over = null, overK = 0;
  $$('.cap-row').forEach(row => {
    row.addEventListener('pointerenter', () => { over = row; });
    row.addEventListener('pointerleave', () => { if (over === row) over = null; });
    row.addEventListener('focusin', () => { over = row; });
    row.addEventListener('focusout', () => { if (over === row) over = null; });
  });

  function drawFrame(R, st) {
    const g = st.gap, m = st.mis;
    const X = Math.round(R.x), Y = Math.round(R.y), Wd = Math.round(R.w), Ht = Math.max(1, Math.round(R.h));
    const t0 = X + g + MIS.t[0] * m, t1 = X + Wd - g + MIS.t[1] * m;
    const b0 = X + g + MIS.b[0] * m, b1 = X + Wd - g + MIS.b[1] * m;
    const l0 = Y + g + MIS.l[0] * m, l1 = Y + Ht - g + MIS.l[1] * m;
    const r0 = Y + g + MIS.r[0] * m, r1 = Y + Ht - g + MIS.r[1] * m;
    side.t.style.transform = `translate3d(${t0.toFixed(1)}px,${Y}px,0) scaleX(${Math.max(0, t1 - t0).toFixed(1)})`;
    side.b.style.transform = `translate3d(${b0.toFixed(1)}px,${Y + Ht - 1}px,0) scaleX(${Math.max(0, b1 - b0).toFixed(1)})`;
    side.l.style.transform = `translate3d(${X}px,${l0.toFixed(1)}px,0) scaleY(${Math.max(0, l1 - l0).toFixed(1)})`;
    side.r.style.transform = `translate3d(${X + Wd - 1}px,${r0.toFixed(1)}px,0) scaleY(${Math.max(0, r1 - r0).toFixed(1)})`;
    side.t.style.opacity = (st.op[0] * st.a).toFixed(3);
    side.r.style.opacity = (st.op[1] * st.a).toFixed(3);
    side.b.style.opacity = (st.op[2] * st.a).toFixed(3);
    side.l.style.opacity = (st.op[3] * st.a).toFixed(3);
    const c = st.tone.map((v, i) => Math.round(lerp(v, GOLD[i], st.gold)));
    const ck = c.join(',');
    if (ck !== colorKey) { af.style.setProperty('--af-c', `rgb(${ck})`); colorKey = ck; }
  }

  function drawReadout(R, label, role) {
    const dims = role === 'open' && introK >= 1 && sy < 4 ? '— × —' : `${Math.round(R.w)} × ${Math.max(1, Math.round(R.h))}`;
    const key = label + '|' + dims;
    if (key !== readKey) { readRole.textContent = label; readDim.textContent = dims; readKey = key; readW = readEl.offsetWidth; }
    const vh = innerHeight;
    let x = R.x + R.w - readW, y = R.y + R.h + 12;
    if (y + 14 > vh - 6) { y = R.y + R.h - 22; x = R.x + R.w - readW - 14; }   // no room below: tuck inside the corner
    readEl.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
    readEl.style.opacity = (R.w < 24 || R.y > vh || R.y + R.h < 0) ? '0' : '1';
  }

  const visible = r => {
    const w = Math.max(0, Math.min(innerWidth, r.x + r.w) - Math.max(0, r.x));
    const h = Math.max(0, Math.min(innerHeight, r.y + r.h) - Math.max(headerH(), r.y));
    return w * h;   // visible area in px: settle on what the visitor is actually looking at
  };

  function updateFrame(dt, moved) {
    if (!afOn || targets.length < 2) return;
    const s = sy, now = performance.now();
    if (moved) lastMove = now;
    while (idx < targets.length - 2 && s >= targets[idx + 1].a) idx++;
    while (idx > 0 && s < targets[idx].a) idx--;
    const A = targets[idx], B = targets[idx + 1];
    const span = B.a - A.a;
    const raw = span > 1 ? clamp((s - A.a) / span, 0, 1) : (s >= B.a ? 1 : 0);
    const d = dwellFor(A, B);
    const k = smooth(clamp((raw - d) / (1 - 2 * d), 0, 1));
    const Ps = idx + k;

    // while scrolling the frame tracks the scroll exactly; when it stops, the frame settles on the more visible target
    const idle = now - lastMove > 240;
    let Pt = Ps;
    if (idle && k > 0.001 && k < 0.999) {
      const va = visible(rectOf(A)), vb = visible(rectOf(B));
      Pt = idx + (vb > va * 1.08 ? 1 : va > vb * 1.08 ? 0 : Math.round(k));
    }
    if (P < 0 || Math.abs(P - Ps) > 1.5) P = Ps;                 // first frame or a jump (refresh, anchor link)
    P = lerp(P, Pt, dtK(idle ? 0.085 : 0.55, dt));
    if (Math.abs(P - Pt) < 0.0008) P = Pt;
    settling = P !== Pt;

    const i = clamp(Math.floor(P), 0, targets.length - 2);
    const kk = clamp(P - i, 0, 1);
    const A2 = targets[i], B2 = targets[i + 1];
    let R = mixRect(rectOf(A2), rectOf(B2), kk);
    let st = mixStyle(styleOf(A2), styleOf(B2), kk);
    let label = kk < 0.5 ? A2.label : B2.label, role = kk < 0.5 ? A2.role : B2.role;

    // opening draw-in: the frame grows out of its own centre on first load
    if (introK < 1) {
      if (!introStart) introStart = now;
      introK = clamp((now - introStart) / 1100, 0, 1);
      const e = easeOut(introK), cx = R.x + R.w / 2, cy = R.y + R.h / 2;
      R = { x: lerp(cx, R.x, e), y: lerp(cy, R.y, e), w: R.w * e, h: R.h * e };
    }

    // a capability row borrows the frame while hovered or focused
    const wantOver = over && (A2.role === 'index' || B2.role === 'index');
    overK = lerp(overK, wantOver ? 1 : 0, dtK(0.2, dt));
    if (overK > 0.002 && (over || cur)) {
      if (over) cur = over;
      const rr = cur.getBoundingClientRect();
      const ok = smooth(overK);
      R = mixRect(R, { x: rr.left, y: rr.top, w: rr.width, h: rr.height }, ok);
      st = mixStyle(st, { ...ROLE.row, tone: st.tone }, ok);
      if (ok > 0.5) { label = 'Row · ' + cur.querySelector('.cap-name').textContent; role = 'row'; }
    } else if (!over) cur = null;

    drawFrame(R, st);
    drawReadout(R, label, role);

    // media inside a frame target is veiled until the frame reaches it
    targets.forEach((t, n) => {
      if (!t.clip) return;
      if (n <= i) setClip(t, 'full');
      else if (n === i + 1) {
        if (kk >= 0.999) setClip(t, 'full');
        else {
          const m = rectOf(t);
          setClip(t, 'frame', {
            x0: clamp(R.x - m.x, 0, m.w).toFixed(1), y0: clamp(R.y - m.y, 0, m.h).toFixed(1),
            x1: clamp(R.x + R.w - m.x, 0, m.w).toFixed(1), y1: clamp(R.y + R.h - m.y, 0, m.h).toFixed(1),
          });
        }
      } else setClip(t, 'hidden');
    });
  }

  function setMode() {
    const want = !reduce && innerWidth >= WIDE;
    if (want === afOn && root.classList.contains(want ? 'af-on' : 'af-off')) return;
    afOn = want;
    root.classList.toggle('af-on', afOn);
    root.classList.toggle('af-off', !afOn);
    $$('[data-frame-clip]').forEach(el => {
      let v = el.querySelector(':scope > .veil');
      if (afOn && !v) { v = doc.createElement('i'); v.className = 'veil'; v.setAttribute('aria-hidden', 'true'); el.appendChild(v); }
      if (!afOn && v) v.remove();
    });
    measureTargets();
  }
  const frameTask = (dt, moved) => {
    if (!afOn) return;
    const A = targets[idx], B = targets[idx + 1];
    const justStopped = performance.now() - lastMove < 400;
    if (moved || dirty || settling || justStopped || introK < 1 || over || overK > 0.002 || (A && A.live) || (B && B.live)) updateFrame(dt, moved);
  };

  // static frames (mobile, reduced motion): brackets close in as each target enters the view
  const inIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); inIO.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  $$('[data-frame]').forEach(el => (reduce ? el.classList.add('in') : inIO.observe(el)));

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
  // offer it only where the screen is big enough to read the site
  const liveFit = () => {
    liveBtns.forEach(b => { b.hidden = screenOf(b).clientWidth < LIVE[b.dataset.live].min; });
    $$('.site-live').forEach(row => { row.hidden = $$('.live-btn', row).every(b => b.hidden); });
    if (live && live.btn.hidden) closeLive();
  };
  liveBtns.forEach(b => {
    nameBtn(b, false);
    b.addEventListener('click', () => (live && live.btn === b ? closeLive() : openLive(b)));
  });
  liveFit();

  /* ------------------------------------------------------------------ rōk: scroll scrubs the pour inside the crop */
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
      new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) { if (!scrub.poster) scrub.poster = scrub.dataset.poster; loadVideo(scrub); } }, { rootMargin: '700px 0px' }).observe(crop);
      tasks.add((dt, moved) => {
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

  /* ------------------------------------------------------------------ BB's Bakery: the frame is the boundary between sketch and photograph */
  const art = $('#bbs-art');
  if (art) {
    // window keyframes in % of the artwork: [left, top, width, height]
    const KF = [[12, 18, 10, 64], [34, 13, 38, 74], [6, 6, 88, 88]];
    const place = ([l, t, w, h]) => {
      art.style.setProperty('--wl', l + '%'); art.style.setProperty('--wt', t + '%');
      art.style.setProperty('--ww', w + '%'); art.style.setProperty('--wh', h + '%');
      art.style.setProperty('--il', l + '%'); art.style.setProperty('--it', t + '%');
      art.style.setProperty('--ir', (100 - l - w) + '%'); art.style.setProperty('--ib', (100 - t - h) + '%');
    };
    if (reduce) place([50, 6, 44, 88]);
    else {
      let near = false, shown = 0;
      place(KF[0]);
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
        place(A.map((v, i) => +lerp(v, B[i], e).toFixed(2)));
      });
    }
  }

  /* ------------------------------------------------------------------ gold catch-light on the big statements */
  const catchers = $$('[data-catch]');
  if (!reduce && catchers.length) {
    const shownC = new Set();
    const cio = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? shownC.add(e.target) : shownC.delete(e.target))));
    catchers.forEach(el => cio.observe(el));
    if (fine) {
      root.classList.add('has-glow');
      let px = -9999, py = -9999, lx = px, ly = py, active = false;
      addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return; px = e.clientX; py = e.clientY; if (!active) { lx = px; ly = py; active = true; } }, { passive: true });
      doc.documentElement.addEventListener('pointerleave', () => { active = false; px = py = -9999; });
      tasks.add((dt, moved) => {
        if (!active && lx < -9000) return;
        lx = active ? lerp(lx, px, dtK(0.22, dt)) : px; ly = active ? lerp(ly, py, dtK(0.22, dt)) : py;
        shownC.forEach(el => { const r = el.getBoundingClientRect(); el.style.setProperty('--lx', (lx - r.left).toFixed(1) + 'px'); el.style.setProperty('--ly', (ly - r.top).toFixed(1) + 'px'); });
      });
    } else {
      root.classList.add('has-sheen');
      tasks.add((dt, moved) => {
        if (!moved && !dirty) return;
        const vh = innerHeight;
        shownC.forEach(el => {
          const r = el.getBoundingClientRect();
          const t = clamp((vh * 0.92 - r.top) / (vh * 0.8), -0.15, 1.15);
          el.style.setProperty('--cr', '220px');
          el.style.setProperty('--lx', (t * (r.width + 440) - 220).toFixed(1) + 'px');
          el.style.setProperty('--ly', (r.height * 0.5).toFixed(1) + 'px');
        });
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
  function measureAll() { setMode(); measureTargets(); }
  let rt = 0;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { fitIfReady(); measureAll(); liveFit(); if (lenis) lenis.resize(); }, 120); };
  addEventListener('resize', onResize);
  addEventListener('orientationchange', onResize);
  if ('ResizeObserver' in window) {
    let ro = 0;
    new ResizeObserver(() => { cancelAnimationFrame(ro); ro = requestAnimationFrame(measureTargets); }).observe(doc.body);
  }
  addEventListener('load', () => { fitIfReady(); measureAll(); });
  measureAll();
  tasks.add(frameTask);   // last: reads the latest positions of live targets
  // never hold the headline back for long: if the face is still loading, fit the fallback and show it
  setTimeout(() => { if (!root.classList.contains('fonts-ready')) { fitAll(); root.classList.add('fonts-ready'); } }, 1400);
})();
