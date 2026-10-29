// Shared page parts for the Lumera site. scripts/build.mjs writes plain HTML from these; the site itself has no build step at deploy.
export const SITE = 'https://lumeracreative.agency/';
export const EMAIL = 'contact@lumeracreative.agency';
export const V = '20261028e';                       // asset version, bumped when CSS or JS change

export const CSP = "default-src 'none'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self'; connect-src 'self'; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'none'";

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const ARROW = '<span aria-hidden="true">→</span>';
export const OUT = '<span aria-hidden="true">↗</span>';
export const NEW_TAB = '<span class="visually-hidden"> (opens in a new tab)</span>';

const owl = '<svg viewBox="0 0 1000 1000" aria-hidden="true" focusable="false"><use href="/assets/img/owl.svg#owl"/></svg>';

const NAV = [
  ['/services/', 'Services', 'services'],
  ['/work/', 'Work', 'work'],
  ['/about/', 'About', 'about'],
];

export function head({ path, title, description, audit = false, jsonld = '', noindex = false }) {
  const url = SITE + path.replace(/^\//, '');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}<meta name="theme-color" content="#F4F1EC">
<meta name="color-scheme" content="light">
<meta name="author" content="Lumera Creative LLC">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lumera Creative">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}assets/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/geist-lumera.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css?v=${V}">
<script src="/assets/js/site.js?v=${V}" defer></script>
<script src="/assets/vendor/gsap-3.12.5.min.js" defer></script>
<script src="/assets/vendor/ScrollTrigger-3.12.5.min.js" defer></script>
<script src="/assets/vendor/lenis-1.1.18.min.js" defer></script>
<script src="/assets/js/motion.js?v=${V}" defer></script>
${audit ? `<script src="/assets/js/audit.js?v=${V}" defer></script>\n` : ''}${jsonld ? `<script type="application/ld+json">\n${jsonld}\n</script>\n` : ''}</head>
<body>
<!--email_off-->
<a class="skip" href="#main">Skip to content</a>
`;
}

export function header(active = '') {
  const links = NAV.map(([href, label, key]) => `<a href="${href}"${key === active ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const mlinks = NAV.map(([href, label, key]) => `<a href="${href}"${key === active ? ' aria-current="page"' : ''}>${label} ${ARROW}</a>`).join('\n        ');
  return `<header class="site-head">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Lumera Creative, home">${owl}<span class="brand-name" aria-hidden="true">Lumera <span>Creative</span></span></a>
    <nav class="nav-desk" aria-label="Main">${links}</nav>
    <div class="head-actions">
      <a class="btn btn--primary btn--small" href="/audit/"${active === 'audit' ? ' aria-current="page"' : ''}>Free audit</a>
      <details class="menu">
        <summary><span class="menu-icon" aria-hidden="true"></span><span class="menu-label">Menu</span></summary>
        <div class="menu-panel">
          <nav aria-label="Main">
        <a href="/">Home ${ARROW}</a>
        ${mlinks}
          </nav>
          <a class="btn btn--primary" href="/audit/">Get your free website audit</a>
          <p class="menu-contact muted small">Or email <a class="text-link" href="mailto:${EMAIL}">${EMAIL}</a></p>
        </div>
      </details>
    </div>
  </div>
</header>
`;
}

export function footer() {
  return `<footer class="site-foot">
  <div class="wrap">
    <div class="foot-statement">
      <p>Where design meets innovation.</p>
      <p>We design and build the technology the problem calls for.</p>
    </div>
    <div class="foot-grid">
      <div class="foot-contact">
        <h2>Talk to us</h2>
        <p>Lumera Creative, Los Angeles. Available to businesses across the U.S.</p>
        <p class="mail-line"><a href="mailto:${EMAIL}">${EMAIL}</a><button class="copy" type="button" data-copy="${EMAIL}">Copy</button><span class="copy-status" role="status" aria-live="polite"></span></p>
        <p><a class="btn btn--primary" href="/audit/">Get your free website audit</a></p>
      </div>
      <nav aria-labelledby="foot-explore">
        <h2 id="foot-explore">Explore</h2>
        <ul>
          <li><a href="/services/">Services</a></li>
          <li><a href="/services/websites/">Websites</a></li>
          <li><a href="/services/voice-receptionist/">Voice receptionist</a></li>
          <li><a href="/services/crm-follow-up/">CRM and follow-up</a></li>
          <li><a href="/work/">Work</a></li>
          <li><a href="/about/">About</a></li>
        </ul>
      </nav>
      <nav aria-labelledby="foot-site">
        <h2 id="foot-site">This site</h2>
        <ul>
          <li><a href="/audit/">Free website audit</a></li>
          <li><a href="/#contact">Questions and contact</a></li>
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/accessibility">Accessibility</a></li>
          <li><a href="/legal">Legal &amp; credits</a></li>
        </ul>
      </nav>
    </div>
    <div class="foot-legal">
      <p>&copy; 2026 Lumera Creative LLC. All rights reserved.</p>
      <p>The projects shown are independent concept studies and sample-data demonstrations by Lumera Creative LLC, not client work. Third-party names and marks belong to their owners and are used only to identify the subject of a study.</p>
    </div>
  </div>
</footer>
<!--/email_off-->
</body>
</html>
`;
}

export const page = (meta, body) => head(meta) + header(meta.active) + `<main id="main">\n${body}\n</main>\n` + footer();

/* ---------- shared blocks ---------- */

export const PROCESS = `<ol class="process">
  <li><h3 class="h4">Start with a free website audit</h3><p>Enter your website for a plain-language first look, or skip it and email us directly.</p></li>
  <li><h3 class="h4">Talk it through</h3><p>We ask how customers reach you today, what you need and what your budget is. No technical experience required.</p></li>
  <li><h3 class="h4">Get a tailored quote</h3><p>The quote sets out the scope, the price and any additional charges before you decide anything.</p></li>
  <li><h3 class="h4">We set it up around your business</h3><p>Websites and automations are configured around your services, hours and business rules.</p></li>
</ol>`;

// the audit form: the same markup and IDs as on the audit-tool branch, so assets/js/audit.js drives it unchanged
export function auditBlock({ headingTag = 'h2', id = 'audit', intro = true } = {}) {
  return `<section class="section" id="${id}" aria-labelledby="${id}-title">
  <div class="wrap audit">
    <div class="audit-copy" data-reveal>
      <p class="label">Free, with no obligation</p>
      <${headingTag} class="h2" id="${id}-title">Get your free website audit</${headingTag}>
      ${intro ? `<p class="lead mt-s">Enter your website address. You get a plain-language first look at how your site comes across to a new customer.</p>` : ''}
      <ul class="audit-points">
        <li><span><strong>What your website communicates clearly.</strong> The things a new customer can find and understand.</span></li>
        <li><span><strong>What could confuse customers</strong> or make it hard to contact you.</span></li>
        <li><span><strong>What to fix first.</strong> A short, ordered list.</span></li>
        <li><span><strong>Where Lumera could help</strong>, only when one of our services fits.</span></li>
      </ul>
      <p class="muted small mt-s">Each point is marked as an observation (seen on the page) or a suggestion, with a note on what the check couldn't see. No scores and no promises. No email needed.</p>
    </div>
    <div class="audit-card">
      <form class="audit-form" id="audit-form" data-to="${EMAIL}" novalidate>
        <div class="af-field"><label for="af-site">Website address</label><input id="af-site" name="site" type="text" inputmode="url" autocomplete="url" autocapitalize="off" spellcheck="false" placeholder="yourbusiness.com" required aria-describedby="af-error"></div>
        <p class="af-why" id="af-why" hidden></p>
        <div class="af-req" id="af-req" hidden>
          <div class="af-field"><label for="af-name">Your name</label><input id="af-name" name="name" type="text" autocomplete="name" aria-describedby="af-error"></div>
          <div class="af-field"><label for="af-email">Email</label><input id="af-email" name="email" type="email" autocomplete="email" aria-describedby="af-error"></div>
          <div class="af-field"><label for="af-focus">Anything you'd like us to look at? <span class="af-opt">Optional</span></label><textarea id="af-focus" name="focus" rows="3"></textarea></div>
        </div>
        <div class="af-bot" id="af-bot"></div>
        <p class="af-error" id="af-error" role="alert"></p>
        <div class="af-send">
          <button class="btn btn--primary" type="submit" id="af-submit">Check my website</button>
          <p class="af-note" id="af-note">An automated first look by Lumera Creative. It reads your homepage and up to two linked pages, and shows each step while it works. <a href="/privacy#audit">What happens to the address you enter</a>.</p>
        </div>
        <p class="af-switch" id="af-switch"><button type="button" id="af-to-request">Prefer a person to look? Request an audit by email.</button></p>
      </form>
      <div class="af-progress" id="af-progress" hidden><p class="af-progress-line" role="status" aria-live="polite"></p><p class="af-progress-time" aria-hidden="true"></p></div>
      <article class="af-result" id="af-result" tabindex="-1" aria-labelledby="af-result-h" hidden></article>
      <div class="af-done" id="af-done" tabindex="-1" hidden>
        <p class="af-done-h">Your email app should now be open with your request.</p>
        <p>If it didn't open, copy the message below and send it to ${EMAIL}.</p>
        <label class="visually-hidden" for="af-msg">Your audit request</label>
        <textarea id="af-msg" rows="7" readonly></textarea>
        <p class="af-copy-row"><button class="copy" type="button" id="af-copy">Copy message</button><span class="af-copy-status" role="status" aria-live="polite"></span></p>
      </div>
      <p class="af-nojs">Email your website address to <a class="text-link" href="mailto:${EMAIL}?subject=Free%20website%20audit">${EMAIL}</a> and we'll write your audit ourselves.</p>
    </div>
  </div>
</section>`;
}

export const FAQ = {
  audit: ['What does the free website audit include?', `<p>The automatic check reads your homepage and up to two pages it links to (contact and services), looking for what a new customer looks for. You get a plain-language summary of what your website communicates clearly, what could confuse customers or make it hard to contact you, and what to fix first, with a note on what the check couldn't see.</p><p>It's free, it needs no email, and there's no obligation. If the automatic check isn't available, or you'd rather a person looked, you can request the audit by email instead.</p>`],
  cost: ['How much does it cost?', `<p>Voice receptionist plans start at $100 a month.</p><p>Websites, custom CRMs, follow-up workflows and other automation are priced for each business, as a one-time project fee or a monthly plan depending on the scope. After the audit and a conversation about your needs and budget, we send a quote that sets out the scope, the price and any additional charges before you decide.</p>`],
  technical: ['Do I need to be technical?', `<p>No technical experience required. We set things up and explain them in plain language.</p>`],
  person: ['What happens when the receptionist can’t help a caller?', `<p>It collects the caller's details and passes an organized summary to your team, so a person can follow up. Which calls count as urgent, and how they reach your staff, follow rules you approve during setup.</p><p>A live transfer to a person during the call isn't part of the current setup.</p>`],
  crm: ['Do you use an off-the-shelf CRM?', `<p>No. We build the CRM ourselves, around the way your business works, so your contacts, inquiries and follow-up are kept in one place.</p>`],
  where: ['Do you only work with businesses in Los Angeles?', `<p>No. We're based in Los Angeles and available to businesses across the U.S.</p>`],
  start: ['How do we get started?', `<p>Run the free audit, or email us about your business. We'll talk through how customers reach you today, what you need and your budget, then send a tailored quote. Nothing starts until you've agreed to it.</p>`],
  work: ['Is the work on this site client work?', `<p>Not yet. The projects are independent concept studies and demonstrations we designed and built ourselves, and each one is labeled that way. The receptionist and inquiry demos run on sample data.</p>`],
};
export const faqList = keys => `<div class="faq">\n${keys.map(k => `  <details><summary>${esc(FAQ[k][0])}</summary><div>${FAQ[k][1]}</div></details>`).join('\n')}\n</div>`;

export const contactCard = `<section class="contact-card" aria-labelledby="direct-title">
  <h3 class="h3" id="direct-title">Talk to us directly</h3>
  <p>You don't have to run the audit first. Tell us about your business and what you need, and we'll reply as soon as we can.</p>
  <p class="mail-line"><a href="mailto:${EMAIL}">${EMAIL}</a><button class="copy" type="button" data-copy="${EMAIL}">Copy</button><span class="copy-status" role="status" aria-live="polite"></span></p>
  <a class="btn btn--primary" href="mailto:${EMAIL}?subject=Working%20with%20Lumera">Email us</a>
</section>`;

export const ctaBand = (title = 'Not sure where to start?', text = 'Run the free website audit, or email us about your business. We’ll suggest what to do first and send a tailored quote.') => `<section class="section--tight"><div class="wrap">
  <div class="cta-band" data-reveal>
    <div><h2 class="h3">${title}</h2><p>${text}</p></div>
    <div class="btn-row"><a class="btn btn--primary" href="/audit/">Get your free website audit</a><a class="btn btn--secondary" href="mailto:${EMAIL}?subject=Working%20with%20Lumera">Email us</a></div>
  </div>
</div></section>`;

export const crumbs = items => `<ol class="crumbs">${items.map(([href, label]) => href ? `<li><a href="${href}">${label}</a></li>` : `<li aria-current="page">${label}</li>`).join('')}</ol>`;
