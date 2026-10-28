# Lumera Creative

The portfolio website of Lumera Creative LLC, a creative technology and automation agency. It presents independent concept studies and a capability demonstration. The projects are not paid client work, and none of them is an official website of the business it concerns.

Live: https://lumeracreative.agency/

## Pages

Plain HTML, CSS and JavaScript. Cloudflare Pages serves the committed files as they are; there is no build step at deploy.
The pages are written by `scripts/build.mjs` from `scripts/site/*.mjs`, so the header, footer, audit form and questions stay
the same on every page. After editing anything in `scripts/site/`:

```bash
node scripts/build.mjs                  # write the pages and their list in site.config.json
node scripts/apply-config.mjs           # contact address, site address, sitemap.xml and robots.txt
```

Styles are in `assets/css/site.css`, behavior in `assets/js/site.js`, and the free website audit's page code in
`assets/js/audit.js` (its server side is `functions/api/audit.js`).

## Local preview

Static pages only:

```bash
node .claude/serve.js        # http://localhost:8794/ (PORT to change)
```

With the audit endpoint, using `.dev.vars` (never committed):

```bash
npx wrangler pages dev . --kv AUDIT_KV
```

## Configuration

The public contact address and the site's own address are set in `site.config.json`. After changing either, run:

```bash
node scripts/apply-config.mjs          # write the values into the pages, sitemap.xml and robots.txt
node scripts/apply-config.mjs --check  # report anything out of date, change nothing
```

## Deployment

The site is static. GitHub Pages serves the repository root. `_headers` holds the security headers for Cloudflare Pages and is ignored by GitHub Pages.

© 2026 Lumera Creative LLC. All rights reserved. See [LICENSE](LICENSE).
