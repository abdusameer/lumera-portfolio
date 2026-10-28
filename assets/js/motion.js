/* Lumera Creative: motion. GSAP with ScrollTrigger animates; Lenis is the one smooth-scroll engine, and only for a mouse or trackpad.
   Every page is complete before this runs: without it (no JavaScript, a failed download, reduced motion) nothing is hidden and
   scrolling is the browser's own. Touch screens keep native scrolling; the brief asks that phones are never taken over.
   Headings that reveal word by word keep their whole text for assistive technology; the split words are hidden from it. */
(() => {
  'use strict';
  const { gsap, ScrollTrigger, Lenis } = window;
  if (!gsap || !ScrollTrigger) return;
  const doc = document, root = doc.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;                                        // final states, native scrolling, nothing to undo
  gsap.registerPlugin(ScrollTrigger);
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = doc) => el.querySelector(s);
  const $$ = (s, el = doc) => Array.from(el.querySelectorAll(s));
  const cleanups = [];

  /* ---- Lenis: smooth wheel scrolling on mouse and trackpad only, connected to ScrollTrigger through GSAP's ticker */
  let lenis = null;
  if (fine && Lenis) {
    lenis = new Lenis({ lerp: 0.12, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = t => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(() => { gsap.ticker.remove(raf); lenis.destroy(); });
    // in-page links land below the sticky header
    const offset = () => -(($('.site-head') || {}).offsetHeight || 0) - 16;
    doc.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const target = doc.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: offset(), duration: 1.1 });
      history.pushState(null, '', url.hash);
      target.setAttribute('tabindex', target.getAttribute('tabindex') || '-1');
      setTimeout(() => target.focus({ preventScroll: true }), 600);
    });
    // the menu (narrow windows) holds the page still while it is open
    const menu = $('.menu');
    if (menu) menu.addEventListener('toggle', () => (menu.open ? lenis.stop() : lenis.start()));
  }

  /* ---- split a plain-text heading into words; the original text stays readable to assistive technology */
  const split = el => {
    if (el.dataset.split || el.children.length) return null;          // never split headings that hold links or other markup
    const text = el.textContent.trim();
    el.dataset.split = '1';
    el.textContent = '';
    const sr = doc.createElement('span'); sr.className = 'visually-hidden'; sr.textContent = text;
    const vis = doc.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    text.split(/\s+/).forEach((w, i) => {
      const o = doc.createElement('span'); o.className = 'w';
      const n = doc.createElement('span'); n.className = 'wi'; n.textContent = w;
      o.append(n); vis.append(o);
      if (i) vis.insertBefore(doc.createTextNode(' '), o);
    });
    el.append(sr, vis);
    return $$('.wi', vis);
  };

  /* ---- the opening: the message first, then the actions, then the system it describes */
  const hero = $('.hero') || $('.page-hero');
  if (hero) {
    const h1 = $('h1', hero), words = h1 ? split(h1) : null;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    if (words) tl.from(words, { yPercent: 115, duration: 1, stagger: 0.055 });
    const after = $$('.lead, .case-q, .btn-row, .hero-note, .crumbs, .page-hero > .wrap > p:first-child', hero).filter(el => !h1 || !el.contains(h1));
    if (after.length) tl.from(after, { opacity: 0, y: 18, duration: 0.8, stagger: 0.08 }, words ? 0.35 : 0);
    const cards = $$('.sys > *', hero);
    if (cards.length) tl.from(cards, { opacity: 0, y: 28, scale: 0.97, duration: 0.9, stagger: 0.09, clearProps: 'transform' }, 0.45);

    /* the cards drift a little with the pointer (mouse only, after the opening), each at its own depth */
    const sys = $('.sys', hero);
    if (fine && sys && cards.length) {
      const depth = [10, -8, 6, -5, 4];
      const movers = cards.slice(0, depth.length).map((c, i) => ({ x: gsap.quickTo(c, 'x', { duration: 0.8, ease: 'power3.out' }), y: gsap.quickTo(c, 'y', { duration: 0.8, ease: 'power3.out' }), d: depth[i] }));
      let live = false, frame = 0, px = 0, py = 0;
      tl.eventCallback('onComplete', () => { live = true; });
      const move = e => {
        if (!live) return;
        px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5;
        if (frame) return;
        frame = requestAnimationFrame(() => { frame = 0; movers.forEach(m => { m.x(px * m.d * 2); m.y(py * m.d * 2); }); });
      };
      const rest = () => movers.forEach(m => { m.x(0); m.y(0); });
      hero.addEventListener('pointermove', move);
      hero.addEventListener('pointerleave', rest);
      addEventListener('blur', rest);
      const vis = () => { if (doc.hidden) rest(); };
      doc.addEventListener('visibilitychange', vis);
      cleanups.push(() => { hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', rest); removeEventListener('blur', rest); doc.removeEventListener('visibilitychange', vis); cancelAnimationFrame(frame); });
    }
  }

  /* ---- sections: headings rise word by word, then their content follows; each plays once */
  $$('.section-head .h2, .section .split > div > .h2, .svc-group-head .h2').forEach(h => {
    const words = split(h);
    if (!words) return;
    gsap.from(words, { yPercent: 115, duration: 0.9, ease: 'power4.out', stagger: 0.045, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });
  $$('[data-reveal]').forEach(el => {
    if (hero && hero.contains(el)) return;
    gsap.from(el, { opacity: 0, y: 26, duration: 0.8, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* ---- content is never out of reach: opacity only (never visibility), so everything stays in the tab order, and a section that
     receives keyboard focus before its turn is shown at once */
  doc.addEventListener('focusin', e => {
    const el = e.target.closest && e.target.closest('[data-reveal], .sys > *');
    if (el && +getComputedStyle(el).opacity < 1) gsap.to(el, { opacity: 1, y: 0, duration: 0.25, overwrite: true });
  });

  /* ---- measurements change when fonts and images arrive */
  const refresh = () => ScrollTrigger.refresh();
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(refresh);
  addEventListener('load', refresh, { once: true });

  /* ---- a change to reduced motion mid-visit shows everything in place and hands scrolling back */
  const stopAll = () => {
    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.globalTimeline.getChildren(true, true, true).forEach(t => t.progress(1).kill());
    gsap.set('[data-reveal], .wi, .sys > *', { clearProps: 'all' });
    cleanups.splice(0).forEach(fn => fn());
  };
  reduce.addEventListener('change', e => { if (e.matches) stopAll(); });
  addEventListener('pagehide', e => { if (!e.persisted) stopAll(); });
  root.classList.add('has-motion');
})();
