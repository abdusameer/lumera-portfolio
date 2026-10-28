import { page, PROCESS, auditBlock, faqList, contactCard, ctaBand, crumbs, ARROW } from './parts.mjs';

const about = page({
  path: 'about/', active: 'about',
  title: 'About · Lumera Creative',
  description: 'Lumera Creative was founded by Afrid and Sam, computer science graduates in Los Angeles. We design websites and build the systems behind them for businesses across the U.S.',
}, `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([['/', 'Home'], [null, 'About']])}
    <h1 class="display">Two founders, one approach: start with the problem.</h1>
    <p class="lead">Founded by Afrid and Sam, Lumera Creative brings together computer science, thoughtful design and practical business automation. We build websites and connected systems that help businesses handle inquiries, simplify everyday tasks and follow up with customers.</p>
  </div>
</section>

<section class="section--tight">
  <div class="wrap founders">
    <div class="people" data-reveal>
      <div class="person"><span class="monogram" aria-hidden="true">A</span><div><h2 class="h3">Afrid</h2><p>Co-founder · Computer science graduate</p></div></div>
      <div class="person"><span class="monogram" aria-hidden="true">S</span><div><h2 class="h3">Sam</h2><p>Co-founder · Computer science graduate</p></div></div>
    </div>
    <dl class="facts" data-reveal>
      <div><dt>Based in</dt><dd>Los Angeles</dd></div>
      <div><dt>Available to</dt><dd>Businesses across the U.S.</dd></div>
      <div><dt>What we build</dt><dd>Websites, voice receptionists, missed-call text-back, CRM setup and follow-up</dd></div>
      <div><dt>You talk to</dt><dd>The two people who build it</dd></div>
    </dl>
  </div>
</section>

<section class="section" id="approach" aria-labelledby="approach-title">
  <div class="wrap split">
    <div data-reveal>
      <h2 class="h2" id="approach-title">Where design meets innovation.</h2>
      <p class="lead mt-s">We design and build the technology the problem calls for.</p>
    </div>
    <div data-reveal>
      <p class="lead">We don’t start with a deliverable. We start with the problem.</p>
      <ul class="list-rows mt-m">
        <li><h3 class="h4">Understand what’s in the way</h3><p>Before anything is designed, we find the actual obstacle: what people can’t find, can’t feel, or can’t do.</p></li>
        <li><h3 class="h4">Find where technology helps</h3><p>Sometimes it’s a website. Sometimes it’s a tool, an automation, or less software than you expected.</p></li>
        <li><h3 class="h4">Design the system that fits</h3><p>Structure, interaction and look are designed together, for the people who will use it.</p></li>
        <li><h3 class="h4">Build it, and test it properly</h3><p>Phone, tablet and desktop layouts, resized windows, keyboards and reduced motion. Then we measure and fix.</p></li>
      </ul>
    </div>
  </div>
</section>

<section class="section sunk" aria-labelledby="together-title">
  <div class="wrap">
    <div class="section-head" data-reveal><h2 class="h2" id="together-title">How working with us goes</h2><p class="lead">Plain language at every step, and nothing starts until you’ve agreed to it.</p></div>
    <div data-reveal>${PROCESS}</div>
  </div>
</section>

<section class="section" aria-labelledby="honest-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="honest-title">Our work so far</h2></div>
    <div class="prose" data-reveal>
      <p>We’re a new studio. The projects on this site are concept studies for real Los Angeles businesses and demonstrations of our automation, made on our own initiative to show how we think and build. Each one is labeled for what it is.</p>
      <p class="mt-m"><a class="arrow-link" href="/work/">See the work ${ARROW}</a></p>
    </div>
  </div>
</section>
${ctaBand('Tell us what isn’t working', 'Run the free website audit, or email us about your business. We’ll suggest what to do first.')}
`);

const audit = page({
  path: 'audit/', active: 'audit', audit: true,
  title: 'Free website audit · Lumera Creative',
  description: 'Enter your website address for a free, plain-language first look: what your site communicates clearly, what could confuse customers, and what to fix first. No email needed.',
}, `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([['/', 'Home'], [null, 'Free website audit']])}
    <h1 class="display">See your website the way a new customer does.</h1>
    <p class="lead">A free, automated first look at your homepage and up to two linked pages, written in plain language. No email needed, and no obligation.</p>
  </div>
</section>
${auditBlock({ id: 'check', intro: false })}
<section class="section sunk" aria-labelledby="after-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="after-title">What happens after</h2></div>
    <ul class="list-rows" data-reveal>
      <li><h3 class="h4">Read it at your own pace</h3><p>The results stay on the page. The same address shows the same results for 7 days.</p></li>
      <li><h3 class="h4">Discuss your results with us, if you like</h3><p>One button writes an email with your results in it. Nothing is sent until you send it.</p></li>
      <li><h3 class="h4">A tailored quote, only if you want one</h3><p>We talk through what you need and your budget, then send a quote that sets out the scope, the price and any additional charges.</p></li>
    </ul>
  </div>
</section>
<section class="section" aria-labelledby="afaq-title">
  <div class="wrap qa-grid">
    <div>
      <h2 class="h2" id="afaq-title">Questions</h2>
      <div class="mt-m">${faqList(['audit', 'cost', 'start'])}</div>
    </div>
    ${contactCard}
  </div>
</section>
`);

export default { 'about/index.html': about, 'audit/index.html': audit };
