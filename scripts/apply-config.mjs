// apply-config.mjs: writes the values in site.config.json into the public files.
// The site is static and must work without a build step or JavaScript, so the values are written into the HTML itself.
//   node scripts/apply-config.mjs          rewrite the pages, sitemap.xml, robots.txt and _headers
//   node scripts/apply-config.mjs --check  report anything out of date (exit 1), change nothing
// What it keeps in step:
//   contactEmail  every address on a lumeracreative.* domain in the five pages
//   siteUrl       canonical, Open Graph and structured-data addresses; the folder addresses in 404.html start from; sitemap.xml; robots.txt
//   the inline-script hash in each page's Content-Security-Policy and in _headers
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const PAGES = ['index.html', 'legal.html', 'privacy.html', 'accessibility.html', '404.html'];
const check = process.argv.includes('--check');

if (!/^[a-z0-9._-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(cfg.contactEmail)) { console.error('site.config.json: contactEmail is not a valid address'); process.exit(2); }
if (!/^https:\/\/[a-z0-9.-]+\/([a-z0-9._~-]+\/)*$/i.test(cfg.siteUrl)) { console.error('site.config.json: siteUrl must be an https address that ends with a slash'); process.exit(2); }

const siteBase = new URL(cfg.siteUrl).pathname;                                   // "/" on a root domain, "/lumera-portfolio/" on a project site
const EMAIL = /[A-Za-z0-9._%+-]+@lumeracreative\.[a-z]+/g;                        // any address on our own domains, old or new
const OWN_URL = /https:\/\/(?:abdusameer\.github\.io\/lumera-portfolio|lumeracreative\.agency)\//g;
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const diffs = [];
const put = (file, next) => {
  const cur = fs.existsSync(path.join(ROOT, file)) ? read(file) : null;
  if (cur === next) return;
  diffs.push(file);
  if (!check) fs.writeFileSync(path.join(ROOT, file), next);
};

// the one inline script in index.html has its hash in the page's policy and in _headers
const idx = read('index.html');
const inline = /<script>([\s\S]*?)<\/script>/.exec(idx);
const hash = 'sha256-' + crypto.createHash('sha256').update(inline[1]).digest('base64');

for (const f of PAGES) {
  let s = read(f);
  s = s.replace(EMAIL, cfg.contactEmail).replace(OWN_URL, cfg.siteUrl);
  s = s.replace(/'sha256-[A-Za-z0-9+/=]+'/g, `'${hash}'`);
  if (f === '404.html') {                                                            // served for any missing path, so its addresses start from the site's folder
    const old = (/<meta name="site-base" content="([^"]*)">/.exec(s) || [])[1] ?? siteBase;
    s = s.replace(/(href|src)="(\/[^"]*)"/g, (all, a, v) => (v.startsWith(old) ? `${a}="${siteBase}${v.slice(old.length)}"` : all));
    s = s.replace(/<meta name="site-base" content="[^"]*">/, `<meta name="site-base" content="${siteBase}">`);
  }
  put(f, s);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${cfg.sitemapPages.map(p => `  <url><loc>${cfg.siteUrl}${p}</loc></url>`).join('\n')}\n</urlset>\n`;
put('sitemap.xml', sitemap);
put('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${cfg.siteUrl}sitemap.xml\n`);
if (fs.existsSync(path.join(ROOT, '_headers'))) put('_headers', read('_headers').replace(/'sha256-[A-Za-z0-9+/=]+'/g, `'${hash}'`));

if (check) { console.log(diffs.length ? `out of date: ${diffs.join(', ')}` : `every file matches site.config.json (${cfg.contactEmail}, ${cfg.siteUrl})`); process.exit(diffs.length ? 1 : 0); }
console.log(diffs.length ? `updated: ${diffs.join(', ')}` : 'nothing to change');
