# QA report — Lumera Creative portfolio rebuild

- **Date:** 2026-09-29
- **Branch:** `redesign/adaptive-frame` (local; not pushed or merged)
- **How it was served:** `qa/serve.mjs`, at `http://localhost:4321/lumera-portfolio/`. This matches the GitHub Pages path, and `.nojekyll` is present, so files ship as written.
- **Tools:** headless Google Chrome through puppeteer-core 23 (`qa/check.mjs`), and Lighthouse 12.

## Summary

| Check | Result |
|---|---|
| Rendered QA: 8 viewports, plus interaction, reduced-motion, no-JavaScript and legal-page runs | 0 problems |
| Whole-site walkthroughs | 10 recordings (5 sites × laptop and phone), exact 60 fps, 78 MB in total, each loaded only as its project nears the screen |
| Scroll it yourself (the live site inside a screen) | Loads and fills the screen at a real laptop (1280) or phone (390) width, scrolls independently of the page, and closes back to the recording |
| Console errors or warnings, failed requests, HTTP errors | None on any run |
| Lighthouse, mobile (3 runs) | 98–99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2.1–2.3 s, CLS 0, TBT 0–20 ms |
| Lighthouse, desktop (2 runs) | 100 on all four; LCP 0.5 s, CLS 0–0.002 |
| Legal page, mobile and desktop | 100 on all four |
| Deployment | Ready; waiting on the owner's approval to merge into `main` and push |

## Viewport matrix

Every viewport loaded the full page, took a screenshot of each section and ran the same static audit. The screenshots are in `qa/screenshots/` (desktop, tablet and phone for every section, plus landscape and no-JavaScript views).

| Viewport | Frame mode | Horizontal overflow | Overflowing elements | One h1 | Heading skips | Images without alt | Broken images | Unlabeled videos | Dead in-page links | Targets under 24 px |
|---|---|---|---|---|---|---|---|---|---|---|
| 1440×900 | Moving frame | No | 0 | Yes | 0 | 0 | 0 | 0 | 0 | 0 |
| 1280×800 | Moving frame | No | 0 | Yes | 0 | 0 | 0 | 0 | 0 | 0 |
| 1024×768 | Moving frame | No | 0 | Yes | 0 | 0 | 0 | 0 | 0 | 0 |
| 768×1024 (touch) | Static frames | No | 0 | Yes | 0 | 0 | 0 | 0 | 0 | 0 |
| 430×932 (touch, 3×) | Static frames | No | 0 | Yes | 0 | 0 | 0 | 0 | 0 | 0 |
| 390×844 (touch, 3×) | Static frames | No | 0 | Yes | 0 | 0 | 0 | 0 | 0 | 0 |
| 360×800 (touch, 2×) | Static frames | No | 0 | Yes | 0 | 0 | 0 | 0 | 0 | 0 |
| 844×390 landscape (touch, 2×) | Static frames | No | 0 | Yes | 0 | 0 | 0 | 0 | 0 | 0 |

At 1024 px and up, the frame took the expected role at every section: Open (hero), 01 / 05 (divider), Crop (rōk's pour), Site (rōk's laptop-and-phone pair), Viewport (Lenny's pair), 03 / 05 at the top of Stagger (its facts box sits below the pair), Mask (Motiq's pair), Boundary (BB's artwork), Site (BB's pair), Problem (approach line), Index (capabilities) and Field (contact).

An extra width sweep at 480, 520, 600, 700, 820, 960, 1023, 1180, 1366, 1600 and 1920 px found no horizontal overflow. The fitted headlines stayed inside their frames at every width.

## Interactions

These ran at 1440×900 unless noted.

| Behavior | Result |
|---|---|
| Header links (Work, Approach, Capabilities, Start a project) | Each lands its section at the bottom edge of the 72 px header (71 px from the top). Focus moves to the section and the URL hash updates. |
| rōk scroll scrub | Video time 0.28 s → 2.46 s → 5.09 s while scrolling down; back to 2.48 s when scrolling up. The progress meter follows (5% → 46% → 96% → 46%). |
| Lenny's color follow | While the laptop walkthrough plays, the section takes the color of the page on screen, darkened where needed to keep text contrast (e.g. `rgb(10, 12, 10)` on the scroll film, `rgb(9, 32, 20)` in the green chapters). |
| Lenny's cocktail list | Lights during the cocktail chapter only: the first drink at 28.5 s into the laptop walkthrough, and nothing while the food menu plays. |
| Walkthrough start | Each walkthrough rests 2.2 s on the site's first screen before it scrolls, on first play and on every loop. |
| Scroll it yourself, laptop (1440×900) | Lenny's live site loads inside the laptop screen, laid out at 1280 px and scaled to fill it exactly. The recording underneath pauses and hides. The wheel scrolls the site, not the portfolio. "Back to the recording" removes it and restores the video. |
| Scroll it yourself, phone (390×844) | rōk's live site loads inside the phone screen at 390 px, scaled to fill it. A swipe scrolls the site. Only phone screens offer it on phones, since a laptop layout is unreadable at that size. |
| BB's sketch-to-photo window | Grows with scroll from 10% to 49% to 88% of the artwork's width. |
| Capability rows | A hovered or focused row borrows the frame (readout "Row · Websites", 382 × 57). |
| Copy button | Shows "Copied" under the address. The layout doesn't move, and the address row stays flush with the button above it. |
| Email links | All four go to `lumera@lumeracreative.com`. The contact button adds the subject "New project". |
| Keyboard | Tab order: skip link, logo, Work, Approach, Capabilities, View selected work, Start a project, then the first project. Every stop shows a visible focus outline. On the cream sections the outline is ink. |
| Reload partway down the page | The frame resumes on the right target (Viewport, at Lenny's). |
| Resize wide → narrow → wide | Switches moving frame → static frames → moving frame, with no overflow. |
| Menu (390×844) | Opens with focus on the first link and the page behind inert. Focus stays inside the menu. Escape closes it and returns focus to the Menu button. A link closes it and lands its section under the header. |
| Reduced motion (1440×900 and 390×844) | Moving frame hidden and nothing plays by itself. All ten walkthroughs (a laptop and a phone per project) get Play buttons, and rōk's pour shows a still. Every static frame is drawn. |
| No JavaScript (1440×900 and 390×844) | Headline visible and inside its frame, with no overflow. All 11 screens (rōk's pour and every laptop and phone walkthrough) show a still that fills its box. The header is solid, and no control that needs the script (Menu, Copy, Play) is shown. |
| Legal page (1440×900 and 390×844) | No overflow, one h1, no heading skips, 12 links, no small targets. |

## Lighthouse 12

Scores are performance / accessibility / best practices / SEO.

| Page | Mode | Runs | Scores | FCP | LCP | TBT | CLS | Transferred |
|---|---|---|---|---|---|---|---|---|
| Home | Mobile (default throttling) | 3 | 98–99 / 100 / 100 / 100 | 1.1–1.6 s | 2.1–2.3 s | 0–20 ms | 0 | 196 KB |
| Home | Desktop | 2 | 100 / 100 / 100 / 100 | 0.3–0.4 s | 0.5 s | 0 ms | 0–0.002 | 196 KB |
| Legal | Mobile | 1 | 100 / 100 / 100 / 100 | 0.9 s | 1.7 s | 0 ms | 0 | 109 KB |
| Legal | Desktop | 1 | 100 / 100 / 100 / 100 | 0.2 s | 0.4 s | 0 ms | 0 | 107 KB |

The only remaining Lighthouse suggestions are text compression, minification and render-blocking CSS:

- **Compression:** the local test server doesn't compress, but GitHub Pages serves gzip.
- **Minification:** there is no build step by design. Gzipped, the files are small:

  | File | Size (gzip) |
  |---|---|
  | HTML | 7 KB |
  | CSS | 8 KB |
  | JS | 10 KB |
  | Lenis | 5 KB |

- **Render-blocking CSS:** the one stylesheet is needed for the first paint.
- **Recordings:** none load until they near the screen, so the walkthroughs don't change the first load.

### Layout stability while fonts load

The headline is fitted to its frame by script. To make sure this never moves the page, the display font (Archivo) was delayed on purpose. Values are CLS, counting every shift.

| Viewport | Font delay | CLS |
|---|---|---|
| 390×844 | none, 0.6 s, 1.1 s | 0 |
| 390×844 | 2.5 s (past the 1.4 s fallback) | 0.025 |
| 360×800 | 0.9 s | 0.0001 |
| 844×390 | 0.9 s | 0.0002 |
| 1440×900 | 0.9 s | 0 |

If the font takes longer than 1.4 s, the headline is shown in a fallback face. When Archivo arrives it is refitted, which causes the one small shift above. That is still well inside the "good" range, under 0.1.

## Whole-site walkthroughs

Each project shows its whole site, scrolled from top to bottom, on a laptop (1600×1000) and a phone (390×844 at 2×). The phone sits in an iPhone-style frame drawn in CSS: bezel, rounded screen, Dynamic Island and side buttons, with no product artwork, and the recording keeps its exact proportions. They were recorded in slow motion and resampled to exactly 60 fps. The capture rate is the number of frames captured per second of page time; above 60, every output frame is its own capture.

| Project | Laptop | Small laptop copy (1024×640) | Phone | Capture rate (laptop / phone) |
|---|---|---|---|---|
| rōk coffee and tea | 28.9 s, 4.1 MB | 2.2 MB | 30.0 s, 4.2 MB | 125 / 132 fps |
| Lenny's Casita (home page, then the food menu page) | 60.3 s, 12.3 MB | 7.6 MB | 57.6 s, 11.9 MB | 116 and 87 / 128 and 129 fps |
| Stagger Coffee | 28.3 s, 5.1 MB | 2.8 MB | 28.8 s, 4.4 MB | 131 / 128 fps |
| Motiq | 33.8 s, 5.5 MB | 3.2 MB | 31.6 s, 4.6 MB | 128 / 127 fps |
| BB's Bakery | 23.2 s, 4.1 MB | 2.0 MB | 22.9 s, 3.1 MB | 118 / 130 fps |

Lenny's scroll film plays over 13 s on the laptop and 8 s on the phone, slow enough to see each scene. Every walkthrough ends exactly at the bottom of its page. A frame-by-frame scan found no jumps; the flagged moments are the sites' own transitions, such as Lenny's instant color change per cocktail or Stagger's coffee bean zooming open.

## Contrast (WCAG 2.2 AA)

| Pair | Ratio |
|---|---|
| Ivory text on warm black | 16.03:1 |
| Secondary text on warm black | 9.08:1 |
| Muted text (numbers, notes) on warm black | 5.49:1 |
| Gold on warm black / warm black on gold (buttons) | 9.05:1 |
| Ink text on Stagger's cream | 15.32:1 |
| Secondary text on Stagger's cream / BB's paper | 6.18:1 / 5.77:1 |
| Secondary text on Lenny's lightest page color (worst case of all 1,179 sampled colors, after darkening) | 4.55:1 |
| Focus outline: ink on cream, which replaced gold at 1.87:1 | 15.32:1 |

Muted text is never placed on Lenny's changing colors.

## Audits

### AI-design-slop audit

This audit was evidence-based and removal-first. All five findings were fixed:

| Priority | Finding | Fix |
|---|---|---|
| P2 | Labels restating nearby text: the contact eyebrow, the crop readout repeating its caption, and "Next" on the project dividers | Removed the eyebrow. The readouts now say "Crop" and "01 / 05" through "05 / 05". |
| P2 | "Not yet published" repeated on 9 capability rows | One note under each of the two groups |
| P3 | Two gold "Start a project" buttons in the first view | The header's button appears once the page moves. |
| P3 | 11 px fact labels | 12 px |
| P3 | Contact address sat 66 px left of the button above it | Fixed, as noted under Interactions |

### Originality check

The completed site was compared against the reference notes. It shares no layout, navigation, type treatment, transitions, cursor behavior, assets or wording with the studied reference. Pass.

### Truthfulness

- All five projects are labeled Concept Study, 2026. The footer and the legal page state that they are independent redesigns, not affiliated with or endorsed by the businesses.
- The facts were checked against each study's own repository or site.
- No testimonials, clients, metrics or awards are shown.
- The capability groups without published examples say so.
- BB's Bakery's AI-generated imagery carries a "Concept images" label wherever it appears.

## Known gaps

1. **No real-device testing.** Every run used headless Chrome with device emulation. The site hasn't been checked on a physical iPhone or Android phone, or in Safari or Firefox. A short pass on a real iPhone in Safari is the most valuable next check.
2. **Stagger Coffee credits.** The source of the photography inside that study isn't verified, so no credit line is shown for it. The site-wide notice covers third-party material.
3. **Motiq hosting.** The live study is hosted on a different GitHub account (designz-ah).
4. **Capabilities.** Applied AI and automation and Custom systems have no published examples yet, and are labeled that way.
5. **Third-party media.** Lenny's Casita and Motiq media belong to those businesses and are credited to them. rōk's drink imagery and BB's product imagery are AI-generated and disclosed as such.
6. **Minification.** CSS and JavaScript are served as written, with no build step. GitHub Pages compresses them.
7. **Public files.** The planning notes and the `qa/` folder are public in the repository, like everything else in it. GitHub Pages serves them as plain files.
8. **Data weight.** Someone who watches every walkthrough downloads about 61 MB on a high-resolution laptop screen, or about 47 MB on a phone (the small laptop copies plus the phone recordings). Lenny's pair is the largest, about 24 MB on a laptop, because it covers two long pages. Nothing loads until a project nears the screen.
9. **Live studies.** Scroll it yourself loads the real study, with its own third-party services (Google Fonts, map tiles, code libraries, and a Vimeo player on Lenny's). Nothing loads until the visitor chooses it, and the legal page says so. While a laptop screen is live, the wheel scrolls the study until the pointer leaves the screen.

## Deployment readiness

The site is ready to deploy. Nothing in the hosting setup changes: same repository, `main` branch, root folder, relative paths and `.nojekyll`. The canonical and share-image URLs already point at `https://abdusameer.github.io/lumera-portfolio/`.

With the owner's approval, deploying means merging `redesign/adaptive-frame` into `main` and pushing. GitHub Pages then republishes on its own.

To roll back, revert the merge commit on `main`. The current live version is `16cda3d`.
