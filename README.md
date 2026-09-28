# Lumera Creative

Portfolio site for Lumera Creative, a two-person creative development studio making cinematic, scroll-driven websites.

Live at https://abdusameer.github.io/lumera-portfolio/

## Selected work

| Project | Live site |
|---|---|
| rōk coffee and tea | https://abdusameer.github.io/rok_cafe/ |
| Lenny's Casita | https://abdusameer.github.io/lennys-casita-redesign/ |
| Stagger Coffee | https://abdusameer.github.io/stagger_rebuild/ |

All three are independent concept redesigns and are not affiliated with the businesses.

## How it's built

One `index.html` with inline CSS and JavaScript. No framework, no build step. Fonts come from Google Fonts.

- `assets/video/`: 8-second scroll recordings of each site (H.264, muted, no audio) plus poster frames. The hero showreel plays them back to back.
- `assets/img/`: screenshots of each site at 1600px and 800px wide, plus phone screenshots.
- `assets/og.jpg`: the image shown when the link is shared.

Videos only load when they are close to the screen, and they pause when you scroll away. With reduced motion turned on, nothing plays by itself; each recording gets a Play button instead.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Adding contact details

Search `index.html` for `CONTACT:`. Swap the "Contact coming soon" badge for a mailto link.
