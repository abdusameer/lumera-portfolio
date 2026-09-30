# Lumera Creative

Portfolio site for Lumera Creative, a two-person creative technology studio. We start with the problem, then design and build the technology it calls for.

Live at https://abdusameer.github.io/lumera-portfolio/

## Selected work

| # | Project | Type | Year | Live study |
|---|---|---|---|---|
| 01 | rōk coffee and tea | Concept Study | 2026 | https://abdusameer.github.io/rok_cafe/ |
| 02 | Lenny's Casita | Concept Study | 2026 | https://abdusameer.github.io/lennys-casita-redesign/ |
| 03 | BB's Bakery | Concept Study | 2026 | https://abdusameer.github.io/BB-Bakery/ |

The Stagger Coffee (https://abdusameer.github.io/stagger_rebuild/) and Motiq (https://designz-ah.github.io/motiq-la/) studies stay online but are no longer presented here.

All three are independent redesigns of real Los Angeles businesses, made on our own initiative. They are not affiliated with or endorsed by the businesses.

## The idea: one frame that changes its job

A single hairline frame travels down the page and takes a different role in each section. It is an open, unresolved boundary around the opening statement. The hero reads LUMERA, Where design meets innovation, and gold moves through the big statements as you scroll. In the projects the frame becomes a crop (rōk), a viewport (Lenny's) and the boundary between sketch and photograph (BB's). Every project also shows its whole site, scrolled from top to bottom, on a laptop and an iPhone-style phone side by side. Each recording rests on the site's first screen before it scrolls, and **Scroll it yourself** loads the live site inside either screen, so visitors can scroll it at their own pace. Under the approach statement it flattens to a line, then closes step by step. It outlines the capability index and, at the end, closes in gold around the contact field. A small readout names its current role and live size.

On phones and tablets (under 1024 px), with reduced motion, and without JavaScript, the moving frame is replaced by static corner frames on each section.

## How it's built

Plain HTML, CSS and JavaScript. No framework, no build step, and nothing is requested from third parties until a visitor opens a live study with Scroll it yourself.

- `index.html`, `legal.html`: the two pages.
- `assets/css/lumera.css`: the whole design system and every layout.
- `assets/js/lumera.js`: the travelling frame, headline fitting, lazy video, rōk's scroll scrub, Lenny's color follow, BB's sketch-to-photo window, the Scroll it yourself live screens, the menu and the copy button. One animation loop.
- `assets/js/lennys-colors.js`: Lenny's page colors, sampled from its walkthroughs and darkened where needed to keep text contrast (generated).
- `assets/vendor/lenis.min.js`: Lenis 1.3.4 smooth scrolling (MIT, license alongside).
- `assets/fonts/`: Archivo and Geist (SIL OFL, licenses alongside), trimmed to the characters and axes the site uses. Headlines fit their frame by adjusting Archivo's width axis line by line instead of wrapping.
- `assets/video/`: a whole-site walkthrough of each study at 60 fps, recorded top to bottom (Lenny's includes its food menu page): `<name>-site.mp4` on a laptop (1600×1000), `<name>-site-sm.mp4` a lighter laptop copy for small screens, `<name>-site-m.mp4` on a phone (780×1688). `rok-scrub.mp4` is rōk's pour, cropped to the cup and keyframed every 6 frames so scrolling can seek it. WebP posters.
- `assets/img/bbs/`: the BB's loaf as a pencil sketch and as a photograph, from the study (concept images).
- `assets/og.jpg`, `assets/favicon.svg`: share image and icon.

Videos load only when they come near the screen and pause when they leave it. With reduced motion, nothing plays by itself: each recording gets a Play button, and rōk shows a still. Without JavaScript, each recording shows a still.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

To serve it exactly as GitHub Pages does, under `/lumera-portfolio/`:

```bash
cd qa && npm install && node serve.mjs
```

Then open http://localhost:4321/lumera-portfolio/.

## Checks

`qa/check.mjs` drives the site in headless Chrome at 8 viewport sizes, from 1440×900 down to 360×800 plus a phone held sideways. It checks overflow, headline fit, headings, alt text, video labels, broken assets, in-page links, touch target size and the frame's role in every section. It also runs navigation, the menu's focus handling, rōk's scrub, Lenny's colors, BB's window, the copy button, reload and resize, reduced motion, no JavaScript and the legal page. It needs Google Chrome installed (set `CHROME` to use another path).

```bash
cd qa && npm install && node check.mjs
```

Results go to `qa/results/` (not committed). The latest run is summarized in [QA_REPORT.md](QA_REPORT.md), with screenshots in `qa/screenshots/`.

## Project notes

- [REFERENCE_NOTES.md](REFERENCE_NOTES.md): what we took from studying a reference site, and what we deliberately did not.
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md): the plan, the truth table for each project, and the frame's roles.
- [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md): what was done, phase by phase.
- [QA_REPORT.md](QA_REPORT.md): test results and known gaps.

## Contact

lumera@lumeracreative.com

## License

© 2026 Lumera Creative. All rights reserved. This repository is public so it can be hosted on GitHub Pages; that does not grant any right to copy or reuse it. See [LICENSE](LICENSE) and the site's [Legal & credits](https://abdusameer.github.io/lumera-portfolio/legal.html) page. Business names, logos and third-party photography shown in the projects belong to their owners. Archivo and Geist are used under the SIL Open Font License, and Lenis under the MIT License.
