# Lumera Creative

Portfolio site for Lumera Creative, a two-person creative technology studio. We start with the problem, then design and build the technology it calls for.

Live at https://abdusameer.github.io/lumera-portfolio/

## Selected work

| # | Project | Type | Year | Live study |
|---|---|---|---|---|
| 01 | rōk coffee and tea | Concept Study | 2026 | https://abdusameer.github.io/rok_cafe/ |
| 02 | Lenny's Casita | Concept Study | 2026 | https://abdusameer.github.io/lennys-casita-redesign/ |
| 03 | BB's Bakery | Concept Study | 2026 | https://abdusameer.github.io/BB-Bakery/ |

The Projects list shows everything we've made; the three above are featured with full studies, and the rest open their live sites:

| # | Project | Type | Live site |
|---|---|---|---|
| 04 | Stagger Coffee | Website concept | https://abdusameer.github.io/stagger_rebuild/ |
| 05 | Motiq | Website concept | https://designz-ah.github.io/motiq-la/ |
| 06 | Tirzah's Mexi-Terranean Grill | Website concept | https://abdusameer.github.io/Tirzahs_Mexi-Med/ |

All six are independent concepts for real Los Angeles businesses, made on our own initiative. They are not affiliated with or endorsed by the businesses.

## The design: paper, one ink, a color for each project

Warm paper and one ink, with a muted color for each project: sage for rōk, dusty rose for Lenny's, wheat for BB's. LUMERA is drawn tall and narrow from Archivo's narrowest, heaviest cut; everything else is set in Geist. The layout and motion are modeled closely on akaru.fr at the owner's request, rebuilt from scratch with our own content, code and imagery (see [REFERENCE_NOTES.md](REFERENCE_NOTES.md)).

- **The opening.** LUMERA shows as thin slices on black, then the page slides in and the letters open to full width. It runs on a fresh visit at the top of the page, never on a reload, a link to a section, or with reduced motion.
- **The work, sideways.** On wide screens and on portrait phones and tablets the opening and the work share one pinned stage. The three projects wait at the right edge as strips of their colors; scrolling moves the stage sideways and each opens in turn. On wide screens the last closes into a column, and photographs from all three studies stream up it beside the project list; on phones the hero rests at 80% of the width with the strips beside it, each project opens to 84%, and the project list slides in at full width.
- **The studies.** Each project has its own section on its color: its question, the whole site on a laptop and an iPhone-style phone (**Scroll it yourself** loads the live site inside either screen), rōk's pour scrubbed by scroll, Lenny's section taking the colors of its own recording, and BB's window between pencil sketch and photograph. The longer lists fold behind **How we built it**; the direction and the credits stay out, because the credits carry the AI-imagery disclosures.
- **Approach** is a dark room: four steps as rows that light up under the pointer. **Capabilities** are colored panels that push in one after another, the next ones waiting at the edge. The page closes in the dark: "What's getting in the way?", then LUMERA rising out of the footer letter by letter.

The capability panels push in on phones too. Phones held sideways, small landscape windows, reduced motion and no JavaScript get the same content as one stacked column of full-width color cards; without JavaScript the page still reads, with stills in place of recordings.

## How it's built

Plain HTML, CSS and JavaScript. No framework, no build step, and nothing is requested from third parties until a visitor opens a live study with Scroll it yourself.

- `index.html`, `legal.html`, `404.html`: the pages. GitHub Pages serves `404.html` for any missing address, so it uses absolute paths. A one-line script in the head sets the layout mode and whether the opening runs before the first paint, so nothing shifts.
- `assets/css/lumera.css`: the whole design system and every layout. On wide screens sizes follow a 1440 × 900 artboard (1rem = 10 px at 1440); reading sizes keep a px floor so zoom still enlarges text.
- `assets/js/lumera.js`: the opening, the sideways strip, the capability panels, words rising into place, the footer letters, lazy video, rōk's scrub, Lenny's colors, BB's window, the Scroll it yourself live screens, the menu and the copy button. One animation loop.
- `assets/js/lennys-colors.js`: Lenny's page colors, sampled from its walkthroughs and darkened where needed to keep text contrast (generated).
- `assets/vendor/lenis.min.js`: Lenis 1.3.4 smooth scrolling (MIT, license alongside).
- `assets/fonts/`: Geist (SIL OFL), trimmed to the characters and weights the site uses. The LUMERA wordmark is six SVG outlines taken from Archivo (SIL OFL) at width 62 and weight 800, inline in the page; the Archivo file stays as their source.
- `assets/img/work/`: the project panels and the photographs in the column (WebP). rōk's drink and scene images and all of BB's product images are AI-generated and labeled "Concept image"; the storefront is rōk's photo and Lenny's photographs are its own.
- `assets/video/`: a whole-site walkthrough of each study at 60 fps, recorded top to bottom: `<name>-site.mp4` on a laptop, `<name>-site-sm.mp4` a lighter laptop copy, `<name>-site-m.mp4` on a phone. `rok-scrub.mp4` is rōk's pour, keyframed every 6 frames so scrolling can seek it. WebP posters.
- `assets/img/bbs/`: the BB's loaf as a pencil sketch and as a photograph (concept images).
- `assets/og.jpg`, `assets/favicon.svg`, `assets/apple-touch-icon.png`: the share image, and our owl as the icon in browser tabs and on phone home screens.

Videos load only when they come near the screen and pause when they leave it. With reduced motion, nothing plays by itself: each recording gets a Play button, and rōk shows a still.

## Preview locally

To serve it exactly as GitHub Pages does, under `/lumera-portfolio/`:

```bash
cd qa && npm install && node serve.mjs
```

Then open http://localhost:4321/lumera-portfolio/.

## Checks

`qa/check.mjs` drives the site in headless Chrome at 8 viewport sizes, from 1440×900 down to 360×800 plus a phone held sideways. It checks overflow, headings, alt text, video labels, broken assets, in-page links and touch target size at every size, and that the footer's letters have risen at the end of the page. It also runs the opening, the sideways strip (resting layout, each project opening, the column, the stream), keyboard focus opening a panel, the capability panels, the header over dark sections, navigation, the folds, text contrast on every colored surface, rōk's scrub, Lenny's colors, BB's window, the copy button, the tab order (no invisible control takes focus), reload and resize, the phone menu, reduced motion, no JavaScript, Scroll it yourself and the legal page. It needs Google Chrome installed (set `CHROME` to use another path).

```bash
cd qa && npm install && node check.mjs
```

Results go to `qa/results/` (not committed). The latest run is summarized in [QA_REPORT.md](QA_REPORT.md).

## Project notes

- [REFERENCE_NOTES.md](REFERENCE_NOTES.md): what we took from the sites we studied, and what we did not.
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md): the original plan and the truth table for each project.
- [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md): what was done, phase by phase.
- [QA_REPORT.md](QA_REPORT.md): test results and known gaps.

## Contact

lumera@lumeracreative.com

## License

© 2026 Lumera Creative. All rights reserved. This repository is public so it can be hosted on GitHub Pages; that does not grant any right to copy or reuse it. See [LICENSE](LICENSE) and the site's [Legal & credits](https://abdusameer.github.io/lumera-portfolio/legal.html) page. Business names, logos and third-party photography shown in the projects belong to their owners. Geist and Archivo are used under the SIL Open Font License, and Lenis under the MIT License.
