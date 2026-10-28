/* Lumera Creative: the free website audit (ported from the audit-tool branch; the server side in functions/api is unchanged).
   Two ways to the same audit, in one form. The automatic check sends only the website address to /api/audit (on this site), passes
   Cloudflare's bot check, and shows its result here. The emailed request sends nothing from the page: it writes the email and opens
   the visitor's own email app, with the same message on screen and a copy button for a computer where no email app opens. The form
   switches to the request when the automatic check is unavailable, over its limit or can't read the site, when the visitor asks for
   a person, and after a result, to discuss it with us (the results go into the email). Nothing about the check loads until the
   visitor starts typing an address, so the page contacts no other company until then. */
(() => {
  'use strict';
  const doc = document;
  const $ = (s, el = doc) => el.querySelector(s);
  const auditForm = $('#audit-form');
  if (!auditForm) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const to = auditForm.dataset.to;
  const done = $('#af-done'), msgBox = $('#af-msg'), err = $('#af-error'), copyBtn = $('#af-copy'), copyStatus = $('.af-copy-status');
  const req = $('#af-req'), why = $('#af-why'), submitBtn = $('#af-submit'), note = $('#af-note'), switchRow = $('#af-switch'), bot = $('#af-bot');
  const progress = $('#af-progress'), progressLine = $('.af-progress-line', progress), progressTime = $('.af-progress-time', progress), result = $('#af-result');
  const field = n => auditForm.elements[n];
  const API = '/api/audit';
  const SITE_RE = /^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)*\.[a-z]{2,}(\/\S*)?$/i;
  const CHECK_NOTE = note.innerHTML;
  let mode = 'check', lastResult = null, running = false;

  // ------------------------------------------------ the emailed request
  const toRequest = (reason, discuss) => {
    mode = 'request';
    req.hidden = false; switchRow.hidden = true; bot.hidden = true;
    why.hidden = !reason; why.textContent = reason || '';
    submitBtn.textContent = discuss ? 'Send my results' : 'Request my free audit';
    note.textContent = `Sending opens your email app with ${discuss ? 'your request and results' : 'the request'} ready to go to ${to}. Nothing is sent until you send it.`;
    ['name', 'email'].forEach(n => { field(n).required = true; });
    auditForm.hidden = false;
  };
  const toCheck = () => {
    mode = 'check'; lastResult = null;
    req.hidden = true; why.hidden = true; switchRow.hidden = false; bot.hidden = false;
    submitBtn.textContent = 'Check my website'; note.innerHTML = CHECK_NOTE;
    ['name', 'email'].forEach(n => { field(n).required = false; field(n).removeAttribute('aria-invalid'); });
    auditForm.hidden = false; result.hidden = true; done.hidden = true; err.textContent = '';
  };
  $('#af-to-request').addEventListener('click', () => { toRequest(''); field('name').focus(); });

  const sendRequest = () => {
    const site = field('site').value.trim(), name = field('name').value.trim(), email = field('email').value.trim(), focus = field('focus').value.trim();
    const bad = [];
    if (!SITE_RE.test(site)) bad.push(['site', 'Enter your website address, for example yourbusiness.com.']);
    if (!name) bad.push(['name', 'Enter your name.']);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad.push(['email', 'Enter an email address we can reply to.']);
    ['site', 'name', 'email'].forEach(n => field(n).removeAttribute('aria-invalid'));
    if (bad.length) {
      bad.forEach(([n]) => field(n).setAttribute('aria-invalid', 'true'));
      err.textContent = bad.map(b => b[1]).join(' ');
      field(bad[0][0]).focus();
      return;
    }
    err.textContent = '';
    const results = lastResult ? resultText(lastResult) : '';
    const subject = (lastResult ? 'My website audit results: ' : 'Free website audit: ') + site;
    const head = `Hello Lumera,\n\n${lastResult ? "I'd like to discuss my website audit results." : 'Please send me a free website audit.'}\n\nWebsite: ${site}\nName: ${name}\nEmail: ${email}` + (focus ? `\nWhat I'd like you to look at: ${focus}` : '');
    const body = head + (results ? `\n\n${results}` : '') + '\n\nThank you.';
    // an email link much longer than this is cut short by some email apps, so a long result goes in as its first part, and the
    // whole message stays on screen to copy
    const short = body.length > 1800 ? head + `\n\n${results.slice(0, 1800 - head.length - 120).replace(/\s+\S*$/, '')}…\n\n(The full results are below this message on the page I sent it from.)\n\nThank you.` : body;
    msgBox.value = `To: ${to}\nSubject: ${subject}\n\n${body}`;
    done.hidden = false;
    location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(short)}`;
    done.focus({ preventScroll: true });
  };

  // ------------------------------------------------ the automatic check
  // whether it is open, and the bot check, are fetched the first time the visitor starts on the address
  let ready = null, widget = null, token = '', tokenWait = null;
  const tokenNow = () => token ? Promise.resolve(token) : new Promise(res => { tokenWait = res; });
  const prepare = () => ready || (ready = (async () => {
    const r = await fetch(API, { headers: { accept: 'application/json' } });
    const cfg = r.ok && /json/.test(r.headers.get('content-type') || '') ? await r.json() : { open: false, reason: 'unavailable' };
    if (!cfg.open) return cfg;
    await new Promise((res, rej) => {
      if (window.turnstile) return res();
      const s = doc.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true;
      s.onload = res; s.onerror = rej;
      doc.head.appendChild(s);
    });
    widget = window.turnstile.render(bot, {
      sitekey: cfg.siteKey, action: 'audit', appearance: 'interaction-only', theme: 'light', 'response-field': false,
      callback: t => { token = t; if (tokenWait) { tokenWait(t); tokenWait = null; } },
      'expired-callback': () => { token = ''; },
      'error-callback': () => { token = ''; if (tokenWait) { tokenWait(''); tokenWait = null; } },
    });
    return cfg;
  })().catch(() => ({ open: false, reason: 'unavailable' })));
  ['focus', 'input'].forEach(t => field('site').addEventListener(t, () => { if (mode === 'check') prepare(); }, { once: true }));

  const REASON = {
    limit_day: "We've reached today's limit of automatic checks.",
    limit_ip: "You've used today's automatic checks.",
    unavailable: "The automatic check isn't available right now.",
  };
  const fallback = text => toRequest(`${text} You can still get your audit: send us your details and we'll write it ourselves.`);

  const check = async () => {
    const site = field('site').value.trim();
    field('site').removeAttribute('aria-invalid');
    if (!SITE_RE.test(site)) { field('site').setAttribute('aria-invalid', 'true'); err.textContent = 'Enter your website address, for example yourbusiness.com.'; field('site').focus(); return; }
    err.textContent = '';
    running = true; submitBtn.disabled = true;
    const t0 = Date.now();
    const tick = setInterval(() => { progressTime.textContent = `${Math.round((Date.now() - t0) / 1000)} s`; }, 1000);
    const say = text => { progressLine.textContent = text; };
    progress.hidden = false; say('Getting ready'); progressTime.textContent = ''; result.hidden = true;
    try {
      const cfg = await prepare();
      if (!cfg.open) return fallback(REASON[cfg.reason] || REASON.unavailable);
      say('Confirming you’re a person');
      const t = await Promise.race([tokenNow(), new Promise(res => setTimeout(() => res(''), 30000))]);
      if (!t) { err.textContent = "We couldn't confirm the check was started by a person. Please try again."; return; }
      token = ''; if (widget !== null) window.turnstile.reset(widget);   // each confirmation is used once
      say('Sending your address');
      const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: site, token: t }) });
      let final = null;
      if (/ndjson/.test(r.headers.get('content-type') || '')) {
        // the check reports each step as it goes, one line of JSON at a time
        const reader = r.body.getReader(), dec = new TextDecoder();
        let buf = '';
        for (;;) {
          const { done: end, value } = await reader.read();
          if (value) buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, i); buf = buf.slice(i + 1);
            if (!line.trim()) continue;
            const ev = JSON.parse(line);
            if (ev.type === 'progress') { if (!ev.ping) say(ev.text); } else final = ev;
          }
          if (end) break;
        }
      } else final = await r.json().catch(() => null);
      if (final && final.result) return show(final.result);
      const code = final && (final.code || final.error), msg = final && final.message;
      if (['invalid_url', 'not_allowed', 'not_found', 'bot_check'].includes(code)) {
        field('site').setAttribute('aria-invalid', code === 'bot_check' ? 'false' : 'true');
        err.textContent = msg; field('site').focus();
        return;
      }
      fallback(msg ? (/[.!?]$/.test(msg) ? msg : msg + '.') : REASON.unavailable);
    } catch (e) {
      fallback(REASON.unavailable);
    } finally {
      clearInterval(tick); running = false; submitBtn.disabled = false; progress.hidden = true;
    }
  };

  // ------------------------------------------------ the result, built from text only: nothing from the reply is read as HTML
  const PARTS = [
    ['clear', 'What your website communicates clearly', 'ul'],
    ['confusing', 'What could confuse customers or make contacting you difficult', 'ul'],
    ['fix_first', 'What to fix first', 'ol'],
  ];
  const ROLE = { homepage: 'homepage', contact: 'contact page', services: 'services page' };
  const el = (tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const when = iso => { try { return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return ''; } };
  const show = res => {
    lastResult = res;
    result.replaceChildren();
    result.append(el('p', 'af-r-label', 'An automated first look by Lumera Creative'));
    const h = el('h3', 'af-r-h', res.site.name || res.site.address); h.id = 'af-result-h'; result.append(h);
    const read = (res.pages || []).map(p => ROLE[p.role] || p.role);
    result.append(el('p', 'af-r-meta', `${res.site.address} · checked ${when(res.checkedAt)}${res.remembered ? ' (results are kept for 7 days)' : ''}${read.length ? ' · read the ' + (read.length > 1 ? read.slice(0, -1).join(', ') + ' and ' + read[read.length - 1] : read[0]) : ''}`));
    for (const [key, title, list] of PARTS) {
      const items = (res.sections && res.sections[key]) || [];
      if (!items.length) continue;
      const part = el('section', 'af-r-part'), ul = el(list, 'af-r-list');
      part.append(el('h4', null, title));
      for (const p of items) {
        const li = el('li');
        li.append(el('span', 'af-tag af-tag--' + (p.kind === 'suggestion' ? 'sug' : 'obs'), p.kind === 'suggestion' ? 'Suggestion' : 'Observation'), el('span', 'af-r-text', p.text));
        if (p.evidence) li.append(el('span', 'af-r-ev', 'Based on: ' + p.evidence));
        ul.append(li);
      }
      part.append(ul); result.append(part);
    }
    const help = (res.sections && res.sections.lumera_help) || [];
    if (help.length) {
      const part = el('section', 'af-r-part'), ul = el('ul', 'af-r-list');
      part.append(el('h4', null, 'Where Lumera could help'));
      for (const x of help) { const li = el('li'); li.append(el('span', 'af-tag af-tag--sug', 'Suggestion'), el('strong', 'af-r-svc', x.service), el('span', 'af-r-text', x.text)); ul.append(li); }
      part.append(ul); result.append(part);
    }
    const lim = el('section', 'af-r-part af-r-limits'), ul = el('ul', 'af-r-list');
    lim.append(el('h4', null, "What this check couldn't see"));
    (res.notChecked || []).forEach(t => ul.append(el('li', null, t)));
    lim.append(ul); result.append(lim);
    result.append(el('p', 'af-r-fine', 'Observations describe what the check found on the pages it read. Suggestions are ideas to consider. This first look was written automatically from those pages, so a detail may be wrong; we check everything with you before quoting any work.'));
    const acts = el('div', 'af-r-actions'), talk = el('button', 'btn btn--primary', 'Discuss your results with us'), again = el('button', 'af-r-again', 'Check another website');
    talk.type = 'button'; again.type = 'button';
    talk.addEventListener('click', () => { toRequest('', true); field('name').focus(); auditForm.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }); });
    again.addEventListener('click', () => { toCheck(); field('site').value = ''; field('site').focus(); });
    acts.append(talk, again); result.append(acts);
    auditForm.hidden = true; result.hidden = false;
    result.focus({ preventScroll: true });
    result.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  };
  // the results as plain text, for the email
  const resultText = res => {
    const lines = [`My automated first look (${res.site.address}, ${when(res.checkedAt)}):`];
    for (const [key, title] of PARTS) {
      const items = (res.sections && res.sections[key]) || [];
      if (items.length) lines.push('', title + ':', ...items.map(p => `- ${p.kind === 'suggestion' ? 'Suggestion' : 'Observation'}: ${p.text}`));
    }
    return lines.join('\n');
  };

  auditForm.addEventListener('submit', e => {
    e.preventDefault();
    if (running) return;
    if (mode === 'request') sendRequest(); else check();
  });
  copyBtn.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(msgBox.value); ok = true; } catch (e) {
      msgBox.select();
      try { ok = doc.execCommand('copy'); } catch (e2) { ok = false; }
    }
    if (!ok) msgBox.select();
    copyStatus.textContent = ok ? 'Copied' : `Couldn't copy it for you. It's selected: press ${mac ? '⌘C' : 'Ctrl+C'}.`;
    clearTimeout(copyBtn._t); copyBtn._t = setTimeout(() => { copyStatus.textContent = ''; }, 2600);
  });
})();
