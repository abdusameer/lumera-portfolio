# Implementation log

## Phase 0 — Baseline and truth (2026-09-29)

- Branch `redesign/adaptive-frame` created from `main` @ 16cda3d (clean tree).
- Repository inspected: static HTML, no instructions file, no package manager or tests. Legal page, LICENSE and 60fps recordings already in place.
- Baseline screenshots: `qa/baseline/` (current site and BB's Bakery at 1440×900 and 390×844). The reference site was screenshotted for study only; those images stay out of the repository.
- Projects verified from their repos/sites and classified (see plan). All five are Concept Studies. About Time excluded by the owner.
- Contact verified: `lumera@lumeracreative.com`, domain MX on Google Workspace.
- BB's Bakery facts taken from its `PHASE-1-REPORT.md`: React 19, Vite, TypeScript, GSAP/ScrollTrigger, Lenis, raw WebGL shader; sketch → photo menu; pencil croissant guide; all product imagery is labeled concept imagery.
- BB's sketch/shaded/photo assets confirmed pixel-registered (usable for a truthful sketch-to-photo demonstration).
- Recording BB's Bakery (desktop + phone) with the existing slow-motion pipeline.
- `REFERENCE_NOTES.md` and `IMPLEMENTATION_PLAN.md` written.

## Media upgrade (2026-09-29)

- Found that every recording had been captured at CSS-pixel size (1280×800 desktop, 390×844 phone) and upscaled. Rebuilt the recorder: desktop now records a 1600×1000 viewport (native frames), phones use real 2× screenshots (780×1688) in a slower time-warp. Phone clips drive the scroll position directly (wheel input is dropped by the sites' smooth scrolling under heavy capture).
- Re-recorded Lenny's, Stagger, Motiq (desktop + phone) and BB's Bakery (phone); all land on exact scroll ranges.
- New `rok-scrub.mp4`: the rōk pour cropped to the cup (780×1050), 30fps, keyframe every 6 frames so scroll can seek it. 1.4 MB.
- Posters are WebP and load lazily. Lenny's page colors re-sampled from the new recordings into `assets/js/lennys-colors.js`.
- Self-hosted Archivo + Geist (OFL) and Lenis (MIT); no third-party requests remain.

## Phases 1–4 — System and build (2026-09-29)

- `index.html`, `assets/css/lumera.css`, `assets/js/lumera.js` rebuilt around one travelling frame (`#af`) and `[data-frame]` targets.
- Headlines fit their frame by adjusting Archivo's width axis per line (no wrapping); hero and contact grids pinned to `minmax(0, 1fr)` after the contact headline overflowed at first render.
- Five project compositions: CROP (rōk, scroll-scrubbed pour + progress meter), VIEWPORT (Lenny's, section color follows the drink on screen), FACTS (Stagger, facts framed in front of the media), MASK (Motiq, 21:9 reveal), BOUNDARY (BB's, photograph inside the frame, pencil sketch outside, from the study's own registered assets).
- Approach: frame flattens to a line under the statement, then gains sides step by step to a closed gold box. Capability index: frame outlines the index; a hovered/focused row borrows it. Contact: closed gold field.
- Frame timing fixes after rendered review: tall targets count as reached when their top is 42% down the screen; when scrolling stops mid-transition the frame settles onto the target with more visible area (continuous, reversible, never jumps). Landing on any project via the index now shows its finished form.
- Legal page restyled to the new system; rights contact is now the email; privacy text updated (no third-party requests).

### Originality check 1 — hero and first project

- Hero: a typographic statement inside a hand-measured, deliberately misregistered frame with a live size readout. No carousel, no 3D, no floor grid, no corner-label chrome. Not recognizably borrowed from the reference.
- First project (rōk): split editorial column + tall scrubbed crop with a progress meter, tied to rōk's own mechanic. No resemblance to the reference's panel gallery. Pass.

## Phase 5 — Phones and tablets as their own direction (2026-09-29)

- Below 1024 px there is no travelling overlay. Each target keeps its own corner brackets, drawn in as it enters view; phones add a vertical edge line down the left gutter.
- Phones play the portrait recordings (780×1688) in phone-shaped plates. rōk's scroll scrub and Lenny's color follow work with touch.
- Phone hero sized to its content (no empty screen under the actions). Headlines fit the frame at every width tested, 360 px and up; phones held sideways cap the headline by the small-viewport height.
- Menu dialog: focus moves in and is trapped; Escape and Close return focus to the Menu button; links close it and land below the header.

## Phase 6 — Accessibility and performance (2026-09-29)

- Fonts trimmed with fontTools to what the site uses (Archivo 700–800 with the full width axis, Geist 400–600, Latin-1 plus the punctuation and ō in use): 221 KB → 67 KB. Mobile LCP 2.9 s → 2.1 s.
- Contrast checked for every text and background pair in use, including every page color Lenny's section can take (lowest: secondary text on the brightest green, 4.56:1). The focus outline switches from gold to ink on the cream sections, where gold measured 1.87:1.
- Accessible names now contain the visible text: the "01–05" link, and the logo link on desktop (its two words were joined without a space).
- Headline fitting no longer moves the page while fonts load. On phones the CSS size equals the fitted size (0.179 × the frame's inner width), and the script only fits once the result is final: display face loaded, or the fallback already showing. Simulated slow font: CLS 0 up to a 1.1 s delay; 0.025 past the 1.4 s fallback, when the headline is refitted to the real face.
- Without JavaScript: recordings show art-directed stills (`<noscript>`), the header is solid, display type takes a narrower width and may wrap, and the Menu and Copy buttons are hidden (the header keeps "Start a project"). BB's window defaults to the reduced-motion state, half sketch and half photograph.

## Phase 7 — Audits and pruning (2026-09-29)

AI-design-slop audit (evidence-based, removal-first). Fixed:

| Priority | Finding | Fix |
|---|---|---|
| P2 | Labels restating nearby text: contact eyebrow "Start a project", crop readout repeating its caption, "Next" on the project dividers | Removed the eyebrow; readouts now "Crop" and "01 / 05" … "05 / 05" |
| P2 | "Not yet published" repeated on 9 capability rows | One "No published examples yet." note under each of the two groups |
| P3 | Two gold "Start a project" buttons in the first view | Header copy hidden until the page moves; active state gold |
| P3 | 11 px fact labels | 12 px |
| P3 | Contact address and Copy button sat 66 px left of the button above (a reserved status slot) | Status moved under the row; the row is flush right |

Originality check 2 (completed site, against `REFERENCE_NOTES.md`): no shared layout, navigation, type treatment, transitions, cursor behavior, assets or wording with the reference. The page reads as an editorial document with one measuring frame, not a gallery. Pass.

Pruning: 42 files the new site doesn't use (38 tracked: old stills, JPEG posters and the old rōk recordings; 4 untracked: an unused BB's desktop recording and its posters) moved to the git-ignored `_drafts/assets/`; 2 unused BB's shaded images deleted. `assets/` is now 37 files, 21 MB. `assets/og.jpg` regenerated from the new hero (1200×630, 64 KB). LICENSE now names BB's Bakery among the third parties.

## Phase 8 — Production verification (2026-09-29)

- Served as GitHub Pages serves it: `qa/serve.mjs` at `/lumera-portfolio/`, with `.nojekyll` already present, so files ship unprocessed.
- `qa/check.mjs`: 8 viewports plus interaction, reduced-motion, no-JavaScript and legal-page runs. 0 problems.
- Lighthouse 12 (performance / accessibility / best practices / SEO): mobile 99 / 100 / 100 / 100 in all three runs (LCP 2.1 s, CLS 0, TBT 0 ms, 177 KB transferred); desktop 100 / 100 / 100 / 100 (LCP 0.5 s, CLS 0). Legal page 100 on all four, mobile and desktop.
- Final screenshots in `qa/screenshots/`; full results in `QA_REPORT.md`.
- Nothing pushed or merged. `main` and the live site are untouched.

## Deviations from the plan

- Both trimmed fonts are preloaded (67 KB together), not only the display face: the hero's label, supporting line and buttons are set in Geist and are part of the first view.
- Under 1024 px every project uses static corner frames (the plan said "simpler reveals" for Motiq and BB's). BB's window still follows the scroll on phones; rōk's scrub and Lenny's color follow run there too.
- A capability row borrows the frame on hover and keyboard focus. Tap was not built as a separate behavior; touch screens under 1024 px get the static index.

## Whole-site walkthroughs (2026-09-29, owner request)

The owner asked for every project to show its whole website on both a laptop and a phone, e.g. Lenny's hero through its food menu, instead of one short clip each.

- Recorded ten new walkthroughs (five sites × laptop and phone), top to bottom, with the slow-motion recorder resampled to exactly 60 fps. The scroll follows a smooth path through every section: slower through pinned, animated chapters and quicker through plain content, at rest only at the start and the end. Lenny's continues from its home page into the full food menu page with a half-second crossfade.
- Recorder fixes along the way: a slow-motion phone pass outlasted a single browser protocol call (the drive now runs in the page and is polled); a screencast sends no frames while the screen is still, so the final hold on each footer is padded back from the logged end time; Lenny's menu page is heavy to draw, so it is captured in slower motion to keep 60 fps.
- Each project now has a laptop-and-phone pair at equal heights (the phone column is .2888 of the laptop's, so neither recording is cropped). On phones the pair stacks, phone first. The frame roles carry over: Lenny's viewport and Motiq's mask open onto both screens, Stagger's facts step in front of the pair, and rōk and BB's gain a "Site" role for their pairs, after the crop and the boundary.
- Lenny's section still takes the color of the page on screen, now across the whole site. Colors are sampled from the walkthroughs and darkened where needed so secondary text keeps 4.5:1. The cocktail list lights from precomputed timings (raw page colors, cocktail chapter only), so the darkened menu page can't light a drink by accident.
- The 17 short clips they replace moved to `_drafts/assets/video-clips-2026-09-29/`.- Lengths: 23–34 s per site, and about 55 s for Lenny's (two pages). All walkthroughs together are 77 MB, and each loads only as its project nears the screen. Every capture ran above 60 frames per second of page time (87–132).
- After the change: `qa/check.mjs` found 0 problems. New checks cover the Site roles, the cocktail-list timing, a Play button per walkthrough under reduced motion, and a still in all 11 screens without JavaScript. The mid-page reload check now waits for load, because the walkthroughs keep the network busy. Lighthouse is unchanged: mobile 99 / 100 / 100 / 100 (LCP 2.1 s, CLS 0) and desktop 100 across the board, with 187 KB on first load.

## Scroll it yourself (2026-09-29, owner request)

The owner found the walkthroughs too fast, Lenny's especially ("I can't even see the hero page"), and chose to let visitors scroll each site themselves.

- Each laptop and phone screen has a **Scroll it yourself** button. It loads the real live study inside that screen, laid out at a real laptop (1280 px) or phone (390 px) width and scaled to fit. The visitor scrolls it at their own pace, with every animation and menu working. **Back to the recording** removes it and resumes the video. Only one screen is live at a time. A button appears only where its screen is big enough to read (laptop screens from 700 px, phone screens from 240 px), so phones offer the phone version. The frame is sandboxed without top navigation, so a study can't navigate the portfolio away.
- Below 1024 px the pair stacks (the laptop full width, then the phone), so tablet screens are big enough to watch or scroll.
- Stagger's facts box now follows the pair instead of overlapping it, so it no longer covers the buttons.
- Every walkthrough rests 2.2 s on the site's first screen, on first play and on each loop (handled in the script; the files are unchanged).
- Lenny's was re-recorded with its scroll film slowed: 13 s on the laptop (was 8.3) and 8 s on the phone (was 4.9). Its colors and cocktail timings were resampled.
- The privacy section of the legal page now says what a live study loads, and that nothing loads until the visitor chooses it.
- QA: live mode is checked on a laptop (Lenny's) and a phone (rōk), confirming it loads, fills the screen, restores the video, and isn't offered on phone-sized laptop screens. 0 problems. Lighthouse is unchanged: mobile 99 / 100 / 100 / 100 and desktop 100 across the board.

## iPhone frame (2026-09-29, owner request)

- The phone recordings (and the live phone sites) now sit in an iPhone-style device drawn in CSS: a dark body with a metal edge, a bezel 3.5% of the screen's width, rounded screen corners, a Dynamic Island and side buttons. It uses no images and no product artwork. The island is slightly narrower than life (26% of the screen) so it clears the sites' headers.
- The screen keeps the recording's exact 780:1688, and the phone column widened from .2888 to .2993 of the laptop's, so the device body still matches the laptop's height. Live mode, no-JS stills and the Play buttons mount inside the new `.phone-screen`.
- QA: 0 problems. Lighthouse: desktop 100 across the board; mobile 98–99 over warm runs, with LCP 2.1–2.3 s and CLS 0.

## Three studies, new hero, scroll gold (2026-09-29, owner request)

- The portfolio presents rōk, Lenny's Casita and BB's Bakery, numbered 01–03. Stagger Coffee and Motiq stay online at their own addresses; their walkthroughs moved to the git-ignored `_drafts/assets/video-not-presented/`, and their styles were removed.
- The hero is now LUMERA with "Where design meets innovation." under it (the owner's "Designs Meets" corrected to "Design Meets"). The wordmark fits the frame's width and may grow to 380 px, and the fit leaves room for the tagline. On phones the pre-load size is 0.256 × the frame's width, so nothing moves while fonts load.
- There is no pointer glow anymore; on every device the gold moves through the big statements as you scroll (owner feedback). The hero sweeps as you scroll away from it.
- rōk updated its hero (the cup is printed with rōk and fills to the brim before it overflows), so its laptop and phone walkthroughs were re-recorded. "Scroll to pour" is re-cut from the study's own hero video: 780×1050 at 24 fps, a keyframe every 6 frames, 1.9 MB.
- Bug fixed: under reduced motion, `transition-duration: .01ms` on every element made every property change (the default transition-property is `all`) animate, so the headline fit measured stale sizes and shrank the wordmark (181 px instead of 317 px at 1440×900). Transitions are now 0 s under reduced motion. QA checks the wordmark still fills its frame there.
- The pour clip loads only within 300 px of the screen (its still at 1200 px). With a shorter work list it had started riding the first load (2.1 MB); first load is 221 KB again.
- Title, description, share text and `og.jpg` updated. The legal page and LICENSE name the three presented studies.
- QA: 0 problems. Lighthouse: mobile 98 / 100 / 100 / 100 over warm runs (LCP 2.3 s, CLS 0); desktop 100 across the board.


## The light edition, modeled on akaru.fr (2026-09-30, owner request)

The owner studied akaru.fr (a Lyon agency site) and asked for the portfolio to follow it closely, in its light look, keeping the walkthroughs and Scroll it yourself. A first pass that only borrowed principles (light at both ends of the dark page, project colors, title cards) was judged not enough; it is kept locally in the git-ignored `_drafts/light-and-color/`.

- Rebuilt from scratch: `index.html`, `assets/css/lumera.css`, `assets/js/lumera.js` and `qa/check.mjs`. Nothing of Akaru's code, photography, wording or logo is used; the layout and motion patterns are followed closely (see REFERENCE_NOTES.md).
- Look: paper `#EEEAE3`, ink `#0E0D0B`, one muted color per project (sage, dusty rose, wheat) and three for the capability panels (slate, terra, lilac). Geist for all text. LUMERA is six SVG outlines taken with fontTools from our Archivo file at width 62 and weight 800; each letter stretches to fill its box (about 1 KB).
- The opening: LUMERA as thin slices on black, the page slides in, the letters open. A head script decides before the first paint (fresh visits at the top only; never on reload, back, a hash or reduced motion) and sets the wide layout, so the first paint matches and nothing shifts. A CSS fallback hides the loader after 5 s if the script never runs.
- The sideways strip (wide landscape screens, 1024 px and up): one sticky stage 6.95 screens long. The hero is half the width; the projects rest as 30 / 10 / 5 % strips and open to 62 % in turn, with a short settle at each; BB's then closes into a 26 % column and eight photographs stream up it beside the Selected work list. Keyboard focus inside a panel scrolls to where it is open; "Work" opens the list.
- Studies on their colors (Lenny's stays the night and still follows its recording), the approach as a dark room of rows, the capabilities as panels that push in with the next colors waiting at the edge, and a dark close with LUMERA rising out of the footer letter by letter.
- Phones and tablets: everything stacks as full-width color cards; the MENU pill opens a full-screen menu that rises from the bottom.
- Hidden header controls in the wide hero are also out of the tab order (visibility), so no invisible control takes focus.
- New images in `assets/img/work/`: rōk and Lenny's panels (1600 / 900 w) and eight 720 w column tiles, from the studies' own folders. AI-generated ones are labeled "Concept image".
- `og.jpg` re-rendered from the new hero. The legal page takes the light look.
- QA rewritten for the new page: 0 problems. Lighthouse over three warm runs: mobile 98 / 100 / 100 / 100 (LCP 2.1–2.2 s, CLS 0, TBT 0–40 ms, 338 KB), desktop 98–99 / 100 / 100 / 100 (CLS 0, 686 KB with the panel photographs).

## Every project in the list (2026-09-30, owner request)

- The work list (now headed "Projects") shows everything we've made, six in all: the three featured studies (rōk, Lenny's Casita, BB's Bakery) open their sections below; Stagger Coffee, Motiq and Tirzah's Mexi-Terranean Grill open their live sites in a new tab, marked "Website concept ↗". The owner chose these six; the Stagger app concept, the personal site, Upgrade Society (offline) and About Time are not listed.
- Each row shows its number, name and kind; a heavier rule separates the featured three from the rest. On wide screens the list sits beside the heading at the top of the panel; on phones it stacks under it.
- The legal page names all six (dated September 30, 2026).
