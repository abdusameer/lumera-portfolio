import { page, ctaBand, crumbs, ARROW, OUT, NEW_TAB } from './parts.mjs';

const video = ({ src, poster, w, h, label, cls = '' }) => `<video class="${cls}" controls muted playsinline preload="none" width="${w}" height="${h}" poster="${poster}" aria-label="${label}"><source src="${src}" type="video/mp4"></video>`;

const facts = rows => `<dl class="case-facts">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

const index = page({
  path: 'work/', active: 'work',
  title: 'Work · Lumera Creative',
  description: 'Concept studies and demonstrations by Lumera Creative: the Voice Receptionist demo, rōk coffee and tea, BB’s Bakery, and more websites designed and built on our own initiative.',
}, `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([['/', 'Home'], [null, 'Work']])}
    <h1 class="display">Work</h1>
    <p class="lead">Concept studies for real Los Angeles businesses and demonstrations of our automation, designed and built by us. None of it was commissioned, and each project is labeled for what it is.</p>
  </div>
</section>

<section class="section--tight">
  <div class="wrap">
    <div class="work-list">
      <a class="work" href="/work/voice-receptionist/" data-reveal>
        <div class="work-media"><img src="/assets/video/voice-site-poster.webp" width="1280" height="800" alt="The Voice Receptionist showcase: “Your next customer is calling,” beside a silver telephone receiver." loading="lazy" decoding="async"><span class="tag">Interactive demo · sample data</span></div>
        <div><p class="work-meta"><span>Automation</span><span>2026</span></p><h2 class="h3">Voice Receptionist <span aria-hidden="true">→</span></h2><p>How a customer call becomes an appointment request, service inquiry, reservation or pickup order, for a salon, an HVAC company, a plumber and a restaurant.</p></div>
      </a>
      <a class="work" href="/work/rok/" data-reveal>
        <div class="work-media"><img src="/assets/video/rok-site-poster.webp" width="1280" height="800" alt="The rōk coffee and tea concept site." loading="lazy" decoding="async"><span class="tag">Concept study</span></div>
        <div><p class="work-meta"><span>Website</span><span>Matcha · four cafés in Los Angeles</span></p><h2 class="h3">rōk coffee and tea <span aria-hidden="true">→</span></h2><p>A scroll-controlled pour that turns the signature drink into the first thing you feel.</p></div>
      </a>
      <a class="work" href="/work/bbs/" data-reveal>
        <div class="work-media"><img src="/assets/video/bbs-site-poster.webp" width="1280" height="800" alt="The BB's Bakery concept site, with a pencil-drawn loaf." loading="lazy" decoding="async"><span class="tag">Concept study</span></div>
        <div><p class="work-meta"><span>Website</span><span>Bakery, coffee and tea · Los Angeles</span></p><h2 class="h3">BB’s Bakery <span aria-hidden="true">→</span></h2><p>A sketchbook in motion: pencil drawings that become photographs, with the practical details up front.</p></div>
      </a>
    </div>
    <div class="more-work" data-reveal>
      <h2 class="label mt-l">More concept studies</h2>
      <ul class="mt-s">
        <li><a href="https://abdusameer.github.io/lennys-casita-redesign/" target="_blank" rel="noopener noreferrer"><strong>Lenny’s Casita</strong><span aria-hidden="true">↗</span><small>Website · concept study</small>${NEW_TAB}</a></li>
        <li><a href="https://abdusameer.github.io/stagger_rebuild/" target="_blank" rel="noopener noreferrer"><strong>Stagger Coffee</strong><span aria-hidden="true">↗</span><small>Website · concept study</small>${NEW_TAB}</a></li>
        <li><a href="https://designz-ah.github.io/motiq-la/" target="_blank" rel="noopener noreferrer"><strong>Motiq</strong><span aria-hidden="true">↗</span><small>Website · concept study</small>${NEW_TAB}</a></li>
        <li><a href="https://abdusameer.github.io/Tirzahs_Mexi-Med/site/" target="_blank" rel="noopener noreferrer"><strong>Tirzahs Mexi-Terranean Grill</strong><span aria-hidden="true">↗</span><small>Website · concept study</small>${NEW_TAB}</a></li>
      </ul>
      <p class="muted small mt-s">These open the live concept sites. None is an official website of the business.</p>
    </div>
  </div>
</section>
${ctaBand('Want this kind of care on your site?', 'Start with the free website audit, or email us about your business.')}
`);

const rok = page({
  path: 'work/rok/', active: 'work',
  title: 'rōk coffee and tea · Concept study · Lumera Creative',
  description: 'An independent concept study for rōk coffee and tea: a scroll-controlled pour that turns the signature drink into the first thing you feel, with a clear journey on desktop and mobile.',
}, `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([['/', 'Home'], ['/work/', 'Work'], [null, 'rōk coffee and tea']])}
    <p><span class="tag">Independent concept study · 2026</span></p>
    <h1 class="display mt-s">rōk coffee and tea</h1>
    <p class="case-q mt-m">Can the signature drink be the first thing you feel, before you read a word?</p>
  </div>
</section>

<section class="section--tight">
  <div class="wrap">
    ${facts([['What', 'Website for a matcha café group'], ['Where', 'Four cafés in Los Angeles'], ['Scope', 'Strategy · Creative direction · UX/UI · Motion · Responsive development']])}
    <figure class="media mt-l" data-reveal>
      <div class="media-pair">
        <div class="media-frame">${video({ src: '/assets/video/rok-site-sm.mp4', poster: '/assets/video/rok-site-poster.webp', w: 1280, h: 800, label: 'Screen recording of the whole rōk site on a laptop, scrolled from top to bottom.' })}</div>
        <div class="media-frame media-phone">${video({ src: '/assets/video/rok-site-m.mp4', poster: '/assets/video/rok-site-m-poster.webp', w: 780, h: 1688, label: 'Screen recording of the whole rōk site on a phone, scrolled from top to bottom.' })}</div>
      </div>
      <figcaption>The whole site on a laptop and a phone: the pour, the four cafés, an independent Fellow Carter Move Mug concept in 3D, press and the FAQ.</figcaption>
    </figure>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div data-reveal><h2 class="h2">The idea</h2></div>
    <div class="prose" data-reveal>
      <p>An independent digital concept for rōk, designed to translate the ritual of a pour into a focused interactive experience. The site uses motion to create a memorable product moment while keeping the customer journey clear across desktop and mobile.</p>
      <h3 class="h4 mt-m">Objective</h3>
      <p>Give rōk a digital expression that feels as considered as the physical experience. The concept needed to create distinction and hold attention without letting animation compete with the information visitors need.</p>
      <h3 class="h4 mt-m">Our response</h3>
      <p>We built a scroll-controlled pour that fills as visitors move forward and drains as they return. The interaction anchors the page and turns a familiar product ritual into a recognizable digital signature for the brand.</p>
    </div>
  </div>
</section>

<section class="section sunk">
  <div class="wrap split">
    <figure class="media" data-reveal>
      <div class="media-frame media-phone">${video({ src: '/assets/video/rok-scrub.mp4', poster: '/assets/video/rok-scrub-poster.webp', w: 780, h: 1050, label: 'The rōk pour: matcha fills a clear cup printed with rōk to the brim, then overflows down over the print.' })}</div>
      <figcaption>The pour. On the live site, your scroll plays it forward and back.</figcaption>
    </figure>
    <div class="prose" data-reveal>
      <h2 class="h2">How we built it</h2>
      <p class="mt-s">The pour is built as a reversible scroll sequence, so the page responds to the visitor instead of playing as a passive video. Phones receive a cropped version of the sequence that decodes faster, and the desktop and mobile compositions were tuned separately for clarity, pacing and performance.</p>
      <p>The effect works in any window size. With reduced motion turned on, a still image replaces the sequence and no video is downloaded. A pinned locations story draws a route between the four cafés and becomes a plain list on short screens or with reduced motion.</p>
      <p class="mt-m"><a class="btn btn--secondary" href="https://abdusameer.github.io/rok_cafe/" target="_blank" rel="noopener noreferrer">View the live concept ${OUT}${NEW_TAB}</a></p>
    </div>
  </div>
</section>

<section class="section--tight">
  <div class="wrap">
    <div class="note" data-reveal>
      <p><strong>Project context.</strong> Independent concept study by Lumera Creative LLC. Experience strategy, original photography, interface design, motion, responsive development, product visualization and supporting concept material were created by Lumera Creative LLC. Business names, product designs and identifying marks remain the property of their respective owners.</p>
      <p class="mt-s"><strong>Fellow product concept.</strong> Independent product concept featuring the Fellow Carter Move Mug, created by Lumera Creative LLC. It was not commissioned, sponsored, or endorsed by Fellow or by rōk. Fellow’s product designs, name, and identifying marks remain the property of Fellow.</p>
    </div>
    <a class="next-case mt-l" href="/work/bbs/"><span class="label">Next project</span><strong class="h3">BB’s Bakery ${ARROW}</strong></a>
  </div>
</section>
${ctaBand()}
`);

const bbs = page({
  path: 'work/bbs/', active: 'work',
  title: 'BB’s Bakery · Concept study · Lumera Creative',
  description: 'An independent concept study for BB’s Bakery: a sketchbook in motion, where pencil drawings become photographs, with a clear mobile-first journey to the products and a visit.',
}, `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([['/', 'Home'], ['/work/', 'Work'], [null, 'BB’s Bakery']])}
    <p><span class="tag">Independent concept study · 2026</span></p>
    <h1 class="display mt-s">BB’s Bakery</h1>
    <p class="case-q mt-m">Can a small bakery’s site feel handmade, like the bread?</p>
  </div>
</section>

<section class="section--tight">
  <div class="wrap">
    ${facts([['What', 'Website for a neighborhood bakery'], ['Where', 'Bakery, coffee and tea · Los Angeles'], ['Scope', 'Experience strategy · Creative direction · UX/UI · Illustration direction · Motion · Responsive development']])}
    <figure class="media mt-l" data-reveal>
      <div class="media-pair">
        <div class="media-frame">${video({ src: '/assets/video/bbs-site-sm.mp4', poster: '/assets/video/bbs-site-poster.webp', w: 1280, h: 800, label: "Screen recording of the whole BB's Bakery site on a laptop, scrolled from top to bottom." })}</div>
        <div class="media-frame media-phone">${video({ src: '/assets/video/bbs-site-m.mp4', poster: '/assets/video/bbs-site-m-poster.webp', w: 780, h: 1688, label: "Screen recording of the whole BB's Bakery site on a phone, scrolled from top to bottom." })}</div>
      </div>
      <figcaption>The whole site on a laptop and a phone: the loaf, six breads going from pencil to photograph, the story and a visit.</figcaption>
    </figure>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div data-reveal><h2 class="h2">The idea</h2></div>
    <div class="prose" data-reveal>
      <p>An independent digital concept for BB’s Bakery, built around the pen-and-pencil character already present in the bakery’s identity. The experience carries that visual language into a clear mobile-first journey for exploring the products, understanding the bakery’s personality, and finding practical information before visiting.</p>
      <h3 class="h4 mt-m">Objective</h3>
      <p>Preserve the bakery’s distinctive personality while making everyday customer decisions easier. The concept needed to balance expressive illustration with clear access to the products and the practical information a visitor needs.</p>
      <h3 class="h4 mt-m">Our response</h3>
      <p>We designed the experience like a sketchbook in motion. Product drawings transition into photographic scenes as visitors scroll, while a small illustrated guide creates continuity throughout the page. The interaction encourages discovery without letting the visual concept interfere with navigation or essential information.</p>
    </div>
  </div>
</section>

<section class="section sunk">
  <div class="wrap">
    <figure class="media" data-reveal>
      <div class="media-pair">
        <div class="media-frame"><img src="/assets/img/bbs/hero-loaf-outline-1100.webp" width="1100" height="1100" alt="Pencil outline of a round scored loaf." loading="lazy" decoding="async"></div>
        <div class="media-frame"><picture><source type="image/avif" srcset="/assets/img/bbs/hero-loaf-photo-700.avif 700w, /assets/img/bbs/hero-loaf-photo-1100.avif 1100w" sizes="(min-width: 760px) 30vw, 100vw"><img src="/assets/img/bbs/hero-loaf-photo-1100.webp" width="1100" height="1100" alt="The same loaf as a photograph: a crusty round with a cross-shaped score." loading="lazy" decoding="async"></picture></div>
      </div>
      <figcaption><span class="tag">Concept images</span> The pencil sketch, and the photograph it becomes. Both come from the study.</figcaption>
    </figure>
    <div class="prose mt-l" data-reveal>
      <h2 class="h2">How we built it</h2>
      <p class="mt-s">The central transition connects line-drawn product states with matching photographic states. Scroll controls the transformation while the layout, typography and navigation stay put.</p>
      <p>On phones the timing is simplified, interactions are touch-safe, and a dedicated composition replaces the desktop one, so nothing depends on hover or desktop screen dimensions. Motion follows the reduced-motion setting, and the site is prerendered so it still works without JavaScript.</p>
      <p class="mt-m"><a class="btn btn--secondary" href="https://abdusameer.github.io/BB-Bakery/" target="_blank" rel="noopener noreferrer">View the live concept ${OUT}${NEW_TAB}</a></p>
    </div>
  </div>
</section>

<section class="section--tight">
  <div class="wrap">
    <div class="note" data-reveal><p><strong>Project context.</strong> Independent concept study by Lumera Creative LLC. The experience was inspired by the pen-and-pencil character visible in BB’s public-facing signage. Experience strategy, interface design, illustration direction, motion, responsive development, original photography, video and supporting concept material were created by Lumera Creative LLC. The concept was not commissioned by or produced in partnership with BB’s Bakery.</p></div>
    <a class="next-case mt-l" href="/work/voice-receptionist/"><span class="label">Next project</span><strong class="h3">Voice Receptionist ${ARROW}</strong></a>
  </div>
</section>
${ctaBand()}
`);

const voice = page({
  path: 'work/voice-receptionist/', active: 'work',
  title: 'Voice Receptionist · Interactive demo · Lumera Creative',
  description: 'An interactive demonstration with sample data: choose a salon, HVAC company, plumber or restaurant and follow one call as it becomes an organized request for the business.',
}, `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([['/', 'Home'], ['/work/', 'Work'], [null, 'Voice Receptionist']])}
    <p><span class="tag tag--sample">Interactive demo · sample data · 2026</span></p>
    <h1 class="display mt-s">Voice Receptionist</h1>
    <p class="case-q mt-m">Can a business owner see what a voice receptionist would do before trusting it with a call?</p>
  </div>
</section>

<section class="section--tight">
  <div class="wrap">
    ${facts([['What', 'Interactive demonstration'], ['Businesses', 'Salon · HVAC · Plumbing · Restaurant'], ['Data', 'Fictional sample data; it connects to nothing']])}
    <figure class="media mt-l" data-reveal>
      <div class="media-frame">${video({ src: '/assets/video/voice-site-sm.mp4', poster: '/assets/video/voice-site-poster.webp', w: 1280, h: 800, label: 'Screen recording of the whole Voice Receptionist showcase, scrolled from top to bottom: Your next customer is calling, the business selector and the sample HVAC call with its summary.' })}</div>
      <figcaption>The whole showcase, recorded top to bottom: the opening, the business selector and a sample HVAC call with its summary.</figcaption>
    </figure>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div data-reveal><h2 class="h2">The idea</h2></div>
    <div class="prose" data-reveal>
      <p>A voice receptionist demonstration showing how customer conversations can be organized into clear business requests. Visitors choose a business type and follow a sample call through a scroll-controlled story.</p>
      <p>Each business asks different questions, collects different details and ends with a different result: an appointment request for a salon, a service request for an HVAC company or a plumber, and a reservation or pickup order for a restaurant.</p>
      <p>The demonstration also shows what changes from one business to the next (services, scheduling rules, questions, capacity, menu options and when a person should take over) and what stays the same in every call.</p>
      <div class="btn-row mt-m"><a class="btn btn--primary" href="https://abdusameer.github.io/lumera-hvac-receptionist/" target="_blank" rel="noopener noreferrer">Explore the demo ${OUT}${NEW_TAB}</a><a class="btn btn--secondary" href="/services/voice-receptionist/">The voice receptionist service</a></div>
    </div>
  </div>
</section>

<section class="section--tight">
  <div class="wrap">
    <div class="note" data-reveal><p><strong>About this demo.</strong> Voice Receptionist is an internal Lumera project, not client work. Every business, person, address, price and appointment shown is fictional sample data. The demo places no calls and creates, sends or books nothing.</p></div>
    <a class="next-case mt-l" href="/work/rok/"><span class="label">Next project</span><strong class="h3">rōk coffee and tea ${ARROW}</strong></a>
  </div>
</section>
${ctaBand()}
`);

export default { 'work/index.html': index, 'work/rok/index.html': rok, 'work/bbs/index.html': bbs, 'work/voice-receptionist/index.html': voice };
