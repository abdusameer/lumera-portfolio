/* Lumera Creative: the homepage opening. LUMERA rises on black as thin white lines, the lines open into the letters,
   the tagline follows, then the black wipes away to the page. It plays on every homepage load, about two seconds.
   Loaded without defer so the black is in place before the first paint. Skipped for reduced motion and for links to a
   section (/#audit); a tap, click, key or scroll ends it at once; the stylesheet removes it after a few seconds if this
   script stops part-way. The page underneath is complete the whole time. */
(() => {
  'use strict';
  const root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || location.hash) return;
  root.classList.add('opening');

  const run = () => {
    const screen = document.getElementById('opening');
    if (!screen) { root.classList.remove('opening'); return; }
    const timers = [];
    let done = false;
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const finish = quick => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      skips.forEach(t => removeEventListener(t, skip, true));
      screen.classList.add('is-out');
      if (quick) screen.classList.add('is-quick');
      document.dispatchEvent(new CustomEvent('lumera:opened'));      // the hero's own entrance starts as the wipe begins
      setTimeout(() => root.classList.remove('opening'), quick ? 320 : 620);
    };
    const skip = () => finish(true);
    const skips = ['pointerdown', 'keydown', 'wheel', 'touchmove'];
    skips.forEach(t => addEventListener(t, skip, { capture: true, passive: true }));
    requestAnimationFrame(() => requestAnimationFrame(() => screen.classList.add('is-lines')));
    later(() => screen.classList.add('is-open'), 450);
    later(() => finish(false), 1500);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
