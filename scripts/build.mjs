// build.mjs: writes the site's HTML pages from scripts/site/*.mjs.
// The output is plain static HTML committed to the repository; Cloudflare Pages serves it as is, with no build step at deploy.
//   node scripts/build.mjs           write every page, then site.config.json's page list
//   node scripts/build.mjs --check   report pages that are out of date (exit 1), change nothing
// After building, run node scripts/apply-config.mjs to keep the contact address, site address and sitemap in step.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import home from './site/home.mjs';
import services from './site/services.mjs';
import work from './site/work.mjs';
import about from './site/about.mjs';
import legal from './site/legal.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const pages = { 'index.html': home, ...services, ...work, ...about, ...legal };
const stale = [];
for (const [file, html] of Object.entries(pages)) {
  const full = path.join(ROOT, file);
  const cur = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
  if (cur === html) continue;
  stale.push(file);
  if (!check) { fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, html); }
}

// the sitemap lists every page except the 404, by its public address
const cfgFile = path.join(ROOT, 'site.config.json');
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
const addresses = Object.keys(pages).filter(f => f !== '404.html').map(f => f.replace(/index\.html$/, '').replace(/\.html$/, ''));
const nextCfg = JSON.stringify({ ...cfg, pages: Object.keys(pages), sitemapPages: addresses }, null, 2) + '\n';
if (fs.readFileSync(cfgFile, 'utf8') !== nextCfg) { stale.push('site.config.json'); if (!check) fs.writeFileSync(cfgFile, nextCfg); }

if (check) { console.log(stale.length ? `out of date: ${stale.join(', ')}` : `all ${Object.keys(pages).length} pages are up to date`); process.exit(stale.length ? 1 : 0); }
console.log(stale.length ? `wrote: ${stale.join(', ')}` : 'nothing to change');
