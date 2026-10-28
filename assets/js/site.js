/* Lumera Creative: site behavior. Small on purpose: the page reads and works without it.
   Header state, the mobile menu, copy buttons, the receptionist demo's business picker, a short rise for sections,
   and old in-page addresses from the previous single-page site. */
(() => {
  'use strict';
  const doc = document, root = doc.documentElement;
  root.classList.add('js');
  const $ = (s, el = doc) => el.querySelector(s);
  const $$ = (s, el = doc) => Array.from(el.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- addresses from the old one-page site: #rok, #capabilities and the rest go to their new homes */
  const OLD = { rok: '/work/rok/', bbs: '/work/bbs/', voice: '/work/voice-receptionist/', capabilities: '/services/', approach: '/about/#approach', systems: '#demo', faq: '#contact', top: '' };
  if ((location.pathname === '/' || /\/index\.html$/.test(location.pathname)) && location.hash) {
    const k = location.hash.slice(1);
    if (OLD[k] !== undefined && !doc.getElementById(k)) {
      const to = OLD[k];
      if (to.startsWith('#')) location.hash = to; else if (to) location.replace(to); else history.replaceState(null, '', location.pathname);
    }
  }

  /* ---- header: a hairline once the page has moved */
  const head = $('.site-head');
  if (head) {
    let ticking = false;
    const update = () => { head.classList.toggle('is-scrolled', window.scrollY > 4); ticking = false; };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---- mobile menu: a <details>; this closes it after a choice, on Escape, and keeps the page still behind it */
  const menu = $('.menu');
  if (menu) {
    const summary = $('summary', menu);
    const sync = () => root.classList.toggle('no-scroll', menu.open);
    menu.addEventListener('toggle', sync);
    $$('a', menu).forEach(a => a.addEventListener('click', () => { menu.open = false; }));
    addEventListener('keydown', e => { if (e.key === 'Escape' && menu.open) { menu.open = false; summary.focus(); } });
    matchMedia('(min-width: 900px)').addEventListener('change', e => { if (e.matches) menu.open = false; });
  }

  /* ---- copy an address */
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const status = btn.parentElement.querySelector('.copy-status');
    const text = btn.dataset.copy, label = btn.dataset.label || (btn.dataset.label = btn.textContent);
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (err) {
      const ta = doc.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.className = 'visually-hidden';
      doc.body.appendChild(ta); ta.select();
      try { ok = doc.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
    }
    clearTimeout(btn._t);
    if (ok) { btn.textContent = 'Copied'; if (status) status.textContent = 'Copied to your clipboard'; }
    else {
      const a = btn.parentElement.querySelector('a[href^="mailto:"]');
      if (a) { const r = doc.createRange(); r.selectNodeContents(a); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
      if (status) status.textContent = `Couldn't copy it. It's selected: press ${mac ? '⌘C' : 'Ctrl+C'}.`;
    }
    btn._t = setTimeout(() => { btn.textContent = label; if (status) status.textContent = ''; }, 2600);
  }));

  /* ---- receptionist demo: choose a business, see its sample call (all calls are in the page; this only shows one at a time) */
  $$('[data-biz]').forEach(box => {
    const tabs = $$('[role="tab"]', box), panels = $$('[role="tabpanel"]', box);
    if (!tabs.length) return;
    const pick = (tab, focus) => {
      tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
      panels.forEach(p => { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
      if (focus) tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => pick(t));
      t.addEventListener('keydown', e => {
        const n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (e.key === 'Home') { e.preventDefault(); pick(tabs[0], true); }
        else if (e.key === 'End') { e.preventDefault(); pick(tabs[tabs.length - 1], true); }
        else if (n) { e.preventDefault(); pick(tabs[(i + n + tabs.length) % tabs.length], true); }
      });
    });
    pick(tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0]);
  });

  /* ---- a short rise as sections arrive. If the observer never reports (a broken or throttled page), everything is shown after 2.5 s,
     and anything in view when the page opens is shown at once, so nothing waits on the effect */
  const items = $$('[data-reveal]');
  if (items.length && !reduce && 'IntersectionObserver' in window) {
    root.classList.add('motion');
    let heard = false;
    const io = new IntersectionObserver(entries => {
      heard = true;
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px 8% 0px' });
    items.forEach(el => io.observe(el));
    setTimeout(() => { if (!heard) { items.forEach(el => el.classList.add('is-in')); io.disconnect(); } }, 2500);
    // jumping to a section (menu, links, the browser's find) shows what is there straight away
    addEventListener('hashchange', () => { const t = location.hash && doc.getElementById(location.hash.slice(1)); if (t) $$('[data-reveal]', t).concat(t.matches('[data-reveal]') ? [t] : []).forEach(el => el.classList.add('is-in')); });
  }
})();
