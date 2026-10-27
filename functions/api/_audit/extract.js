// extract.js: reads one page's HTML and lists what is actually on it, in code, before any AI is involved.
// Everything here is deterministic: the same HTML always gives the same facts, and every finding in the written result has to come
// from these facts or from the page text that goes with them. Uses Cloudflare's HTMLRewriter, which reads HTML the way a browser does.

const SKIP_TEXT = 'script, style, noscript, template, svg, head';
const BLOCK = /^(p|div|section|article|header|footer|nav|main|aside|li|ul|ol|h[1-6]|br|tr|td|th|table|address|form|label|button|dt|dd|figcaption|blockquote|option)$/;
const ACTION = /\b(book|call|contact|quote|estimate|order|schedule|appointment|reserve|reservation|get started|start|buy|shop|apply|request|sign ?up|join|subscribe|donate|enquire|inquire|message|text us|email us|get in touch|visit|directions|menu|consult|free)\b/i;
const CTA_CLASS = /\b(btn|button|cta)\b|button|btn-|-btn|cta/i;

// HTMLRewriter hands over text as it is written in the HTML, so character references are decoded here
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', copy: '©', reg: '®', trade: '™', middot: '·', bull: '•', eacute: 'é', egrave: 'è', ntilde: 'ñ', aacute: 'á', oacute: 'ó', iacute: 'í', uacute: 'ú', uuml: 'ü', ouml: 'ö', auml: 'ä', ccedil: 'ç', times: '×', deg: '°', frac12: '½' };
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); try { return String.fromCodePoint(n); } catch { return m; } }
  return ENT[e.toLowerCase()] ?? m;
});
const clean = s => decode(String(s || '')).replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();
const UI_CONTROL = /^(menu|open menu|close|close (the )?menu|toggle navigation|previous|next|prev|play|pause|mute|unmute|search|submit search|skip to content|back to top|×|x|copy)$/i;
const cap = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export async function extract(page) {
  const base = new URL(page.url);
  const f = {
    url: page.url, https: base.protocol === 'https:', status: page.status, redirects: page.redirects, htmlBytesRead: page.bytes, htmlCutAt2MB: page.truncated,
    lang: null, title: '', metaDescription: null, viewport: null, generator: null,
    headings: [], nav: [], ctas: [], phoneLinks: [], emailLinks: [], forms: [], fieldsOutsideForms: [],
    images: { total: 0, missingAlt: 0, emptyAlt: 0, missingAltExamples: [] }, iframes: [], addressElements: [], structuredData: [],
  };
  const links = [];                     // every link, for finding the contact and services pages
  const labels = new Map();             // label[for] -> text
  let skip = 0, text = '', scriptCount = 0, rootDiv = false;
  let cur = { heading: null, link: null, button: null, label: null, form: null, address: null, ld: null, nav: 0, title: false };

  const field = (el, tag) => {
    const type = (el.getAttribute('type') || (tag === 'input' ? 'text' : tag)).toLowerCase();
    if (['hidden', 'submit', 'button', 'image', 'reset'].includes(type)) return null;
    return { tag, type, name: el.getAttribute('name') || null, id: el.getAttribute('id') || null, label: null,
      wrappedBy: cur.label, placeholder: el.getAttribute('placeholder') || null, ariaLabel: el.getAttribute('aria-label') || null, required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true' };
  };
  // An element takes one end-tag handler, and several of the handlers below need one, so the first handler to see each element
  // (the '*' one) owns it and runs everyone's in turn. A self-closing element (common inside inline SVG) never gets an end tag.
  let ends = null;
  const end = (el, fn) => { if (ends) ends.push(fn); else fn(); };

  const rw = new HTMLRewriter()
    .on('*', { element(el) {
      text += BLOCK.test(el.tagName) ? '\n' : ' ';
      for (const o of [cur.heading, cur.link, cur.button, cur.label, cur.address]) if (o) o.text += ' ';   // "family-owned<br>Auto-Repair" keeps its space
      if (el.selfClosing || el.canHaveContent === false) { ends = null; return; }
      const mine = ends = [];
      try { el.onEndTag(() => { for (let i = mine.length - 1; i >= 0; i--) mine[i](); }); } catch { ends = null; }
    } })
    .on(SKIP_TEXT, { element(el) { skip++; end(el, () => { skip--; }); } })
    .on('html', { element(el) { f.lang = el.getAttribute('lang'); } })
    .on('title', { element(el) { if (!f.title) { cur.title = true; end(el, () => { cur.title = false; }); } }, text(t) { if (cur.title) f.title += t.text; } })
    .on('meta', { element(el) {
      const n = (el.getAttribute('name') || '').toLowerCase(), c = el.getAttribute('content');
      if (n === 'description' && f.metaDescription === null) f.metaDescription = clean(c);
      if (n === 'viewport') f.viewport = clean(c);
      if (n === 'generator') f.generator = cap(clean(c), 80);
    } })
    .on('script', { element(el) {
      scriptCount++;
      if ((el.getAttribute('type') || '').toLowerCase() === 'application/ld+json') { cur.ld = ''; end(el, () => { parseLd(cur.ld, f); cur.ld = null; }); }
    }, text(t) { if (cur.ld !== null) cur.ld += t.text; } })
    .on('div#root, div#__next, div#app, div#___gatsby, div#__nuxt', { element() { rootDiv = true; } })
    .on('h1, h2, h3', { element(el) { const h = { level: +el.tagName[1], text: '' }; cur.heading = h; end(el, () => { h.text = cap(clean(h.text), 160); if (h.text) f.headings.push(h); cur.heading = null; }); },
      text(t) { if (cur.heading) cur.heading.text += t.text; } })
    .on('nav', { element(el) { cur.nav++; end(el, () => { cur.nav--; }); } })
    .on('a[href]', { element(el) {
      const l = { href: el.getAttribute('href') || '', text: '', aria: el.getAttribute('aria-label') || el.getAttribute('title') || '', cls: (el.getAttribute('class') || '') + ' ' + (el.getAttribute('id') || ''), inNav: cur.nav > 0 };
      cur.link = l;
      end(el, () => { l.text = clean(l.text) || clean(l.aria); links.push(l); if (cur.link === l) cur.link = null; });
    }, text(t) { if (cur.link) cur.link.text += t.text; } })
    .on('button, [role="button"]', { element(el) {
      const b = { text: '', aria: el.getAttribute('aria-label') || '', type: (el.getAttribute('type') || '').toLowerCase(), inForm: !!cur.form };
      cur.button = b;
      end(el, () => { b.text = clean(b.text) || clean(b.aria); if (b.text && !UI_CONTROL.test(b.text)) { if (b.inForm && cur.form && b.type !== 'button') cur.form.submit.push(cap(b.text, 60)); else f.ctas.push({ kind: 'button', text: cap(b.text, 80), href: null }); } cur.button = null; });
    }, text(t) { if (cur.button) cur.button.text += t.text; } })
    .on('input[type="submit"], input[type="button"]', { element(el) { const v = clean(el.getAttribute('value')) || 'Submit'; if (cur.form) cur.form.submit.push(cap(v, 60)); else f.ctas.push({ kind: 'button', text: cap(v, 80), href: null }); } })
    .on('form', { element(el) {
      const form = { action: el.getAttribute('action') || null, method: (el.getAttribute('method') || 'get').toLowerCase(), fields: [], submit: [] };
      f.forms.push(form); cur.form = form;
      end(el, () => { if (cur.form === form) cur.form = null; });
    } })
    .on('input, select, textarea', { element(el) { const x = field(el, el.tagName); if (!x) return; (cur.form ? cur.form.fields : f.fieldsOutsideForms).push(x); } })
    .on('label', { element(el) {
      const lb = { for: el.getAttribute('for'), text: '' }; cur.label = lb;
      end(el, () => { lb.text = cap(clean(lb.text), 100); if (lb.for) labels.set(lb.for, lb.text); if (cur.label === lb) cur.label = null; });
    }, text(t) { if (cur.label) cur.label.text += t.text; } })
    .on('img', { element(el) {
      f.images.total++;
      const alt = el.getAttribute('alt');
      if (alt === null) { f.images.missingAlt++; if (f.images.missingAltExamples.length < 5) f.images.missingAltExamples.push(cap((el.getAttribute('src') || el.getAttribute('data-src') || '').split('?')[0].split('/').pop() || '(no file name)', 60)); }
      else if (!alt.trim()) f.images.emptyAlt++;
      if (cur.link && alt) cur.link.text += ' ' + alt;
    } })
    .on('iframe', { element(el) { try { const h = new URL(el.getAttribute('src') || '', base).hostname; if (h && f.iframes.length < 8 && !f.iframes.includes(h)) f.iframes.push(h); } catch {} } })
    .on('address', { element(el) { const a = { text: '' }; cur.address = a; end(el, () => { a.text = cap(clean(a.text), 200); if (a.text) f.addressElements.push(a.text); cur.address = null; }); }, text(t) { if (cur.address) cur.address.text += t.text; } })
    .onDocument({ text(t) { if (!skip) text += t.text; } });

  await rw.transform(new Response(page.html, { headers: { 'content-type': 'text/html; charset=utf-8' } })).arrayBuffer();

  f.title = cap(clean(f.title), 200);
  // fields get the text a visitor sees for them: their own label, a label around them, then the placeholder or aria-label
  for (const x of [...f.forms.flatMap(fm => fm.fields), ...f.fieldsOutsideForms]) {
    x.label = (x.id && labels.get(x.id)) || (x.wrappedBy && cap(clean(x.wrappedBy.text), 100)) || null;
    delete x.wrappedBy; delete x.id;
  }
  f.forms = f.forms.filter(fm => fm.fields.length).slice(0, 6);
  f.fieldsOutsideForms = f.fieldsOutsideForms.slice(0, 12);
  f.headings = f.headings.slice(0, 40);

  // links: navigation, phone and email links, and links that ask the visitor to do something
  const seenNav = new Set(), seenCta = new Set();
  for (const l of links) {
    const href = l.href.trim(), t = cap(l.text, 80);
    if (/^tel:/i.test(href)) { if (f.phoneLinks.length < 10) f.phoneLinks.push({ number: decodeSafe(href.slice(4)), text: t }); continue; }
    if (/^mailto:/i.test(href)) { if (f.emailLinks.length < 10) f.emailLinks.push({ address: decodeSafe(href.slice(7).split('?')[0]), text: t }); continue; }
    if (!t) continue;
    let abs = null; try { abs = new URL(href, base).href; } catch {}
    if (l.inNav && !seenNav.has(t + abs) && f.nav.length < 40) { seenNav.add(t + abs); f.nav.push({ text: t, href: abs }); }
    if ((CTA_CLASS.test(l.cls) || ACTION.test(t)) && t.length <= 60 && !seenCta.has(t.toLowerCase()) && f.ctas.length < 30) { seenCta.add(t.toLowerCase()); f.ctas.push({ kind: 'link', text: t, href: abs }); }
  }

  // the same link or button repeated in a header, a menu and a footer is listed once
  const once = (arr, key) => { const seen = new Set(); return arr.filter(x => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; }); };
  f.ctas = once(f.ctas.filter(c => /\p{L}/u.test(c.text)), c => c.kind + '|' + c.text.toLowerCase());
  f.phoneLinks = once(f.phoneLinks, p => p.number.replace(/\D/g, '') + '|' + p.text.toLowerCase());
  f.emailLinks = once(f.emailLinks, e => e.address.toLowerCase() + '|' + e.text.toLowerCase());

  // the visible text, with what looks like an address, opening hours, phone numbers and email addresses picked out of it
  const lines = text.split('\n').map(clean).filter(Boolean);   // clean() decodes character references as well
  const full = lines.join('\n');
  f.wordCount = (full.match(/\S+/g) || []).length;
  f.addressText = findAddresses(full);
  f.hoursText = findHours(lines);
  f.phonesInText = uniq(full.match(/(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]\d{4}\b/g) || []).slice(0, 6);
  f.emailsInText = uniq(full.match(/\b[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}\b/gi) || []).slice(0, 6);
  f.likelyNeedsJavaScript = f.wordCount < 80 && (rootDiv || scriptCount > 5);
  return { facts: f, text: full, links };
}

function decodeSafe(s) { try { return decodeURIComponent(s).trim(); } catch { return s.trim(); } }
function uniq(a) { return [...new Set(a.map(clean))]; }

const STREET = /\b\d{1,6}\s+(?:[NSEW]\.?\s+)?(?:[A-Za-z0-9][\w'.-]*\s+){0,4}?(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Ln|Lane|Way|Pl|Place|Ct|Court|Pkwy|Parkway|Hwy|Highway|Cir|Circle|Ter|Terrace|Sq|Square|Plaza|Broadway)\b\.?(?:[ ,#\w.-]{0,40}?\b[A-Z]{2}\s+\d{5}(?:-\d{4})?)?/g;
const CITY_ZIP = /\b[A-Z][a-zA-Z .'-]{1,30},\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/g;
function findAddresses(full) {
  const flat = full.replace(/\n/g, ', ');
  // "© 2026 One Way Heating" reads like a street number and name; anything just after a copyright sign is skipped
  const hits = re => [...flat.matchAll(re)].filter(m => !/(©|\(c\)|copyright)\s*$/i.test(flat.slice(Math.max(0, m.index - 14), m.index))).map(m => m[0]);
  return uniq([...hits(STREET), ...hits(CITY_ZIP)]).map(s => cap(s, 140)).slice(0, 6);
}

const DAY = /\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(day|sday|nesday|rsday|urday)?\b|\b(daily|weekdays|weekends|every day|7 days)\b/i;
const DATED = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.? \d{1,2}(st|nd|rd|th)?\b/i;   // an event on a date, not opening hours
const TIME = /\b\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)|\b\d{1,2}:\d{2}\b|\bclosed\b|\b24 hours\b|\bnoon\b|\bmidnight\b/i;
// Opening hours are kept as the page orders them, a run of nearby lines at a time. A layout that puts the days in one column and the
// times in another reads as all the days and then all the times, so lines are never paired up here: a wrong pairing would put
// wrong hours in the result.
function findHours(lines) {
  const out = [];
  for (let i = 0; i < lines.length && out.length < 6; i++) {
    if (lines[i].length > 160 || DATED.test(lines[i]) || !(DAY.test(lines[i]) || TIME.test(lines[i]) && DAY.test(lines[i + 1] || ''))) continue;
    let j = i; const run = [];
    while (j < lines.length && run.length < 16 && lines[j].length <= 160 && !DATED.test(lines[j]) && (DAY.test(lines[j]) || TIME.test(lines[j]))) run.push(lines[j++]);
    if (run.some(l => TIME.test(l))) out.push(cap(run.join(' | '), 300));
    i = j;
  }
  return uniq(out);
}

// schema.org data a site publishes about itself: the business's name, phone, address and hours
function parseLd(raw, f) {
  let data; try { data = JSON.parse(raw); } catch { return; }
  const walk = (n, depth) => {
    if (!n || typeof n !== 'object' || depth > 4 || f.structuredData.length >= 4) return;
    if (Array.isArray(n)) return n.forEach(x => walk(x, depth + 1));
    if (n['@graph']) walk(n['@graph'], depth + 1);
    const type = [].concat(n['@type'] || []).join(', ');
    if (type && (n.address || n.telephone || n.openingHours || n.openingHoursSpecification)) {
      const addr = typeof n.address === 'string' ? n.address : n.address && [n.address.streetAddress, n.address.addressLocality, n.address.addressRegion, n.address.postalCode].filter(Boolean).join(', ');
      const hours = n.openingHours ? [].concat(n.openingHours).join('; ') : n.openingHoursSpecification ? [].concat(n.openingHoursSpecification).map(s => `${[].concat(s.dayOfWeek || []).map(d => String(d).split('/').pop()).join(',')} ${s.opens || ''}-${s.closes || ''}`).join('; ') : null;
      f.structuredData.push({ type: cap(type, 60), name: n.name ? cap(clean(n.name), 80) : null, telephone: n.telephone || null, address: addr ? cap(clean(addr), 140) : null, openingHours: hours ? cap(hours, 200) : null });
    }
  };
  walk(data, 0);
}

// the contact page and the services page, if the homepage links to them on the same site
export function pickSubpages(links, homeUrl) {
  const home = new URL(homeUrl), bare = h => h.toLowerCase().replace(/^www\./, '');
  const sameSite = l => { try { const u = new URL(l.href, home); return /^https?:$/.test(u.protocol) && bare(u.hostname) === bare(home.hostname) && !/\.(pdf|jpe?g|png|gif|webp|zip|docx?)$/i.test(u.pathname) && (u.pathname !== home.pathname) ? u : null; } catch { return null; } };
  const find = (re) => {
    for (const l of links) {
      const u = sameSite(l);
      if (u && (re.test(l.text) || re.test(u.pathname))) { u.hash = ''; return u.href; }
    }
    return null;
  };
  const contact = find(/\bcontact|get in touch|reach us|locations?\b|visit us|find us/i);
  let services = find(/\bservices?\b|what we do|treatments|offerings|solutions|practice[- ]areas|\bmenus?\b|our work|products/i);
  if (services === contact) services = null;
  return { contact, services };
}
