# Lumera Creative

The portfolio website of Lumera Creative LLC, a creative technology and automation agency. It presents independent concept studies and a capability demonstration. The projects are not paid client work, and none of them is an official website of the business it concerns.

Live: https://abdusameer.github.io/lumera-portfolio/

## Local preview

The site is plain HTML, CSS and JavaScript with no build step. From this folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/.

## Configuration

The public contact address and the site's own address are set in `site.config.json`. After changing either, run:

```bash
node scripts/apply-config.mjs          # write the values into the pages, sitemap.xml and robots.txt
node scripts/apply-config.mjs --check  # report anything out of date, change nothing
```

## Deployment

The site is static. GitHub Pages serves the repository root. `_headers` holds the security headers for Cloudflare Pages and is ignored by GitHub Pages.

© 2026 Lumera Creative LLC. All rights reserved. See [LICENSE](LICENSE).
