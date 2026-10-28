// Privacy, Accessibility and Legal & credits keep their wording from the previous site, except where it described the old layout.
// Their sections are read from scripts/site/legal/*.html and wrapped in the new page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, crumbs } from './parts.mjs';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'legal');
const read = f => fs.readFileSync(path.join(DIR, f), 'utf8');

const legalPage = ({ file, path: p, title, h1, lede, updated, description }) => {
  const body = read(file);
  const toc = [...body.matchAll(/<section id="([^"]+)"[^>]*>\s*<h2[^>]*>(?:<span>\d+<\/span>)?([^<]+)<\/h2>/g)].map(m => `<li><a href="#${m[1]}">${m[2]}</a></li>`).join('');
  return page({ path: p, title, description }, `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([['/', 'Home'], [null, h1]])}
    <p class="label">Last updated ${updated}</p>
    <h1 class="display mt-s">${h1}</h1>
    <p class="lead">${lede}</p>
  </div>
</section>
<section class="section--tight">
  <div class="wrap legal-body">
    <nav class="legal-toc" aria-label="On this page"><ol>${toc}</ol></nav>
    <div class="legal-content">
${body}
    </div>
  </div>
</section>
`);
};

const privacy = legalPage({ file: 'privacy.html', path: 'privacy', title: 'Privacy · Lumera Creative', h1: 'Privacy', updated: 'October 28, 2026', description: 'What the Lumera Creative website collects, what it does not, and how to contact us about privacy.', lede: 'What this website collects, what it doesn’t, and who to ask. Lumera Creative LLC publishes it, and this page is written for the site as it works today.' });
const accessibility = legalPage({ file: 'accessibility.html', path: 'accessibility', title: 'Accessibility · Lumera Creative', h1: 'Accessibility', updated: 'October 28, 2026', description: 'Our accessibility goal for the Lumera Creative website, what we have done, known limitations, and how to report a problem.', lede: 'We want everyone to be able to use this site, and we want to hear when they can’t.' });
const legal = legalPage({ file: 'legal.html', path: 'legal', title: 'Legal & credits · Lumera Creative', h1: 'Legal & credits', updated: 'October 28, 2026', description: 'Ownership, credits, privacy and terms for the Lumera Creative website.', lede: 'What we made is ours. The businesses our concepts are about own their names, logos and marks. This page, from Lumera Creative LLC, explains both in plain language.' });

let lost = page({ path: '404', title: 'Page not found · Lumera Creative', description: 'This page isn’t here.', noindex: true }, `
<section class="page-hero">
  <div class="wrap">
    <p class="label">Page not found</p>
    <h1 class="display mt-s">This page isn’t here.</h1>
    <p class="lead">The link may be old, or it has a typo. Either way it’s ours to fix, not yours.</p>
    <div class="btn-row"><a class="btn btn--primary" href="/">Go to the home page</a><a class="btn btn--secondary" href="/audit/">Get your free website audit</a></div>
    <ul class="list-rows mt-l">
      <li><a class="arrow-link" href="/services/">Services <span aria-hidden="true">→</span></a></li>
      <li><a class="arrow-link" href="/work/">Work <span aria-hidden="true">→</span></a></li>
      <li><a class="arrow-link" href="/about/">About <span aria-hidden="true">→</span></a></li>
    </ul>
  </div>
</section>
`);
// served for any missing path: scripts/apply-config.mjs keeps its addresses starting from the site's folder
lost = lost.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="site-base" content="/">');

export default { 'privacy.html': privacy, 'accessibility.html': accessibility, 'legal.html': legal, '404.html': lost };
