# Implementation plan — Lumera Creative portfolio rebuild

Branch: `redesign/adaptive-frame` (local). `main` stays live and untouched until the owner approves a merge and push.

## Baseline (verified 2026-09-29)

- Static site, no build step: `index.html` (inline CSS/JS), `legal.html`, `assets/`, GitHub Pages from `main` / root at `/lumera-portfolio/`.
- No `AGENTS.md`, no package manager, no lint/type/test tooling. Lenis loaded from jsDelivr, fonts from Google Fonts.
- Existing media: 60fps desktop (`<name>.mp4`, `-sm.mp4`) and phone (`-m.mp4`) scroll recordings for rōk, Lenny's, Stagger, Motiq; stills; OG image.
- Contact: `lumera@lumeracreative.com` (supplied by the owner 2026-09-29; domain MX points to Google Workspace).
- Existing identity worth keeping: warm near-black, ivory, gold signal (`#E8C07A`) and the gold catch-light on display type (owner favorite).

## Portfolio truth table

| # | Project | Classification | Year | Evidence | Live |
|---|---|---|---|---|---|
| 01 | rōk coffee and tea | Concept Study | 2026 | rok_cafe README: AI stand-in imagery, disclosed on site | abdusameer.github.io/rok_cafe/ |
| 02 | Lenny's Casita | Concept Study | 2026 | Repo is a redesign; media from the restaurant's published material | abdusameer.github.io/lennys-casita-redesign/ |
| 03 | Stagger Coffee | Concept Study | 2026 | Repo is a rebuild of an existing café site | abdusameer.github.io/stagger_rebuild/ |
| 04 | Motiq | Concept Study | 2026 | Site footer: "Independent design concept, not an official Motiq website" | designz-ah.github.io/motiq-la/ |
| 05 | BB's Bakery | Concept Study | 2026 | Repo README: unofficial concept, not commissioned; images labeled "Concept image" | abdusameer.github.io/BB-Bakery/ |

Excluded at the owner's request: About Time. No client work, testimonials, metrics or AI/automation case studies exist, so none are shown.

## Architecture decisions

- Keep the static architecture (it is authoritative and fast). Split into `index.html`, `assets/css/lumera.css`, `assets/js/lumera.js` for maintainability.
- No GSAP: the Adaptive Frame is plain scroll math on one rAF loop. Lenis stays (it already defines the site's scroll feel), self-hosted in `assets/vendor/`.
- Self-host fonts (OFL): **Archivo** variable (display; width axis 62–125 lets type reflow to the frame) and **Geist** variable (utility: body, labels, readouts). Drop the third typeface.
- Colors: warm black `#0D0C0A`, ivory `#EEE8DD`, muted `#8E877B`, hairlines at 16% ivory, one signal **gold `#D9A860`** (refined from the existing `#E8C07A` for contrast on ivory hover states). Project accents sampled from each project's own imagery.

## The Adaptive Frame (one system)

One fixed overlay element (four hairline sides, corner gaps, a role/size readout) travels between `data-frame` targets in document order. Between consecutive targets its rectangle is interpolated from scroll position, with a dwell so it rests on each target. Roles:

| Target | Role | Behaviour |
|---|---|---|
| Hero statement | OPEN | Unresolved boundary: sides misregistered, corners open, readout "— × —" |
| Project dividers | NEUTRAL | Collapses to a small square around the project number |
| rōk | CROP | Tall crop of the pour; scroll scrubs the pour inside it |
| Lenny's | VIEWPORT | Plays the Tequila & Mezcal recording; section color follows the drink on screen |
| Stagger | FACTS | Frame holds the facts in front of the media, which moves to a background role |
| Motiq | MASK | Opens from the neutral square to full content width, revealing the work |
| BB's Bakery | BOUNDARY | Inside the frame: photograph; outside: BB's own pencil sketch |
| Approach | LINE → FORM | Flat line under the statement, gaining closure step by step to a closed box |
| Capability index | INDEX | Outlines the index; snaps to a row on hover/focus/tap |
| Contact | FIELD | Closed, gold: the resolved form around the call to action |

Media targets are clipped to the frame while the frame arrives (a masked reveal), then fully shown. Reduced motion and no-JS: static CSS frames around every target, all media visible.

Mobile (< 1024px): no traveling overlay. A vertical boundary line runs down the left gutter; targets get brackets that step out from it when they enter view. rōk's scrub and Lenny's color sync keep working (touch-safe); Motiq/BB's use simpler reveals.

## Sections

01 Introduction → 02 Selected Work (5 distinct compositions) → 03 Approach → 04 Capability index → 05 Contact → footer. Header: Work, Approach, Capabilities, Start a project; mobile menu dialog with focus trap and Escape.

## Quality gates

- Accessibility: landmarks, one H1, skip link, focus-visible, 44px targets, dialog focus management, alt text, reduced motion.
- Performance: explicit media dimensions, lazy media, no offscreen loops, videos paused offscreen, fonts preloaded only for the display face.
- QA tooling added in `qa/`: subpath server (`/lumera-portfolio/`), Puppeteer checks at 1440/1280/1024/768/430/390/360 + landscape, keyboard/menu/reduced-motion runs, Lighthouse mobile.
- Originality reviews after hero, first project, full site (logged).

## Deliverables

`REFERENCE_NOTES.md`, this plan, `IMPLEMENTATION_LOG.md`, `QA_REPORT.md`, final screenshots in `qa/screenshots/`, deployment-ready branch.
