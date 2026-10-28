import { page, PROCESS, faqList, ctaBand, crumbs, ARROW, OUT, NEW_TAB } from './parts.mjs';

const overview = page({
  path: 'services/', active: 'services',
  title: 'Services · Lumera Creative',
  description: 'Websites, AI voice receptionists, missed-call text-back, GoHighLevel CRM setup, lead follow-up, quotes and reactivation. Voice receptionist plans from $150/month; everything else quoted for your business.',
}, `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([['/', 'Home'], [null, 'Services']])}
    <h1 class="display">What we build, and what it’s for.</h1>
    <p class="lead">Three kinds of help, each tied to a problem you can name: a website that isn’t pulling its weight, calls that go unanswered, or leads that slip through.</p>
    <div class="btn-row"><a class="btn btn--primary" href="/audit/">Get your free website audit</a><a class="btn btn--secondary" href="#pricing">How pricing works</a></div>
  </div>
</section>

<section class="section--tight">
  <div class="wrap">
    <div class="svc-group" data-reveal>
      <div class="svc-group-head"><p class="label">Improve my website</p><h2 class="h2">Websites</h2></div>
      <div class="svc-list">
        <div class="svc"><h3 class="h3">Website design and build</h3><p>A new site that says what you do in the first few seconds, works on every phone and makes it easy to call, book or ask.</p><a class="arrow-link" href="/services/websites/">Websites ${ARROW}</a></div>
        <div class="svc"><h3 class="h3">Restructuring an existing site</h3><p>Keep what works, fix what confuses: clearer pages, clearer next steps and contact options that work.</p><a class="arrow-link" href="/services/websites/#restructure">Restructuring ${ARROW}</a></div>
      </div>
    </div>
    <div class="svc-group" data-reveal>
      <div class="svc-group-head"><p class="label">Handle missed calls and inquiries</p><h2 class="h2">Calls</h2></div>
      <div class="svc-list">
        <div class="svc"><h3 class="h3">Voice receptionist</h3><p>An AI receptionist answers your calls, collects the details your team needs and passes on an organized summary.</p><p><strong>Plans from $150/month.</strong></p><a class="arrow-link" href="/services/voice-receptionist/">Voice receptionist ${ARROW}</a></div>
        <div class="svc"><h3 class="h3">Missed-call text-back</h3><p>When a call is missed, the caller gets a text, says what they need and is helped to the next step.</p><a class="arrow-link" href="/services/voice-receptionist/#text-back">Missed-call text-back ${ARROW}</a></div>
      </div>
    </div>
    <div class="svc-group" data-reveal>
      <div class="svc-group-head"><p class="label">Organize leads and follow-up</p><h2 class="h2">CRM and follow-up</h2></div>
      <div class="svc-list">
        <div class="svc"><h3 class="h3">CRM setup in GoHighLevel</h3><p>Contacts, your pipeline, your calendar and your forms in one place, set up around the way your business works.</p><a class="arrow-link" href="/services/crm-follow-up/#crm">CRM setup ${ARROW}</a></div>
        <div class="svc"><h3 class="h3">Lead follow-up and reactivation</h3><p>Follow up on new inquiries, outstanding estimates and past leads through workflows configured for your business.</p><a class="arrow-link" href="/services/crm-follow-up/#follow-up">Follow-up ${ARROW}</a></div>
        <div class="svc"><h3 class="h3">Quotes and proposals</h3><p>Draft quotes and proposals prepared from your services and pricing rules, ready for your team to review before they go out.</p><a class="arrow-link" href="/services/crm-follow-up/#quotes">Quotes ${ARROW}</a></div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="pricing" aria-labelledby="pricing-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="pricing-title">How pricing works</h2><p class="lead mt-s">One published price, and a quote for everything else, so you pay for what your business needs rather than a package.</p></div>
    <div data-reveal>
      <ul class="list-rows">
        <li><h3 class="h4">Voice receptionist</h3><p>Plans from $150/month. What’s included is set out in your quote before you commit.</p></li>
        <li><h3 class="h4">Everything else</h3><p>Custom-priced, as a one-time project fee or a monthly plan depending on the scope. We quote after the free audit and a conversation about your needs and budget.</p></li>
        <li><h3 class="h4">No surprises</h3><p>Your quote lists the scope, the price and any additional charges before you decide anything.</p></li>
      </ul>
    </div>
  </div>
</section>

<section class="section sunk" aria-labelledby="how-title">
  <div class="wrap">
    <div class="section-head" data-reveal><h2 class="h2" id="how-title">How working with us goes</h2></div>
    <div data-reveal>${PROCESS}</div>
  </div>
</section>

<section class="section" aria-labelledby="sfaq-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="sfaq-title">Questions</h2></div>
    <div data-reveal>${faqList(['cost', 'technical', 'person', 'crm', 'start'])}</div>
  </div>
</section>
${ctaBand()}
`);

const websites = page({
  path: 'services/websites/', active: 'services',
  title: 'Websites · Lumera Creative',
  description: 'Website design, build and restructuring for businesses across the U.S.: a site that explains what you do, works on every phone and makes it easy to get in touch. Custom quote after a free website audit.',
}, `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([['/', 'Home'], ['/services/', 'Services'], [null, 'Websites']])}
    <h1 class="display">A website that explains what you do and makes it easy to get in touch.</h1>
    <p class="lead">Most visitors decide in seconds whether they’re in the right place. We design sites that answer that quickly, on the phone in their hand.</p>
    <div class="btn-row"><a class="btn btn--primary" href="/audit/">Get your free website audit</a><a class="btn btn--secondary" href="/work/">See our concept work</a></div>
  </div>
</section>

<section class="section--tight">
  <div class="wrap split">
    <div data-reveal><h2 class="h2">What we do</h2></div>
    <ul class="list-rows" data-reveal>
      <li><h3 class="h4">New websites</h3><p>Designed and built for your business: what you offer, who it’s for, where you are and the one thing you want a visitor to do next.</p></li>
      <li id="restructure"><h3 class="h4">Restructuring an existing site</h3><p>When the site you have is confusing, slow or hard to update, we keep what works and rebuild the rest: clearer pages, clearer next steps and contact options that work.</p></li>
      <li><h3 class="h4">Digital product interfaces</h3><p>Screens for a tool your customers or your team use, designed so the next action is always clear.</p></li>
      <li><h3 class="h4">Interactive moments, where they help</h3><p>Motion and interaction used to explain your product or service, never to get in the way of the information people came for.</p></li>
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="care-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="care-title">What we check on every site</h2><p class="lead mt-s">The details that decide whether a visitor stays.</p></div>
    <ul class="list-rows" data-reveal>
      <li><h3 class="h4">Phones first</h3><p>Layouts designed for a phone, then adapted for larger screens, with readable text and buttons that are easy to tap.</p></li>
      <li><h3 class="h4">An obvious next step</h3><p>Call, book, ask for a quote or visit: whatever matters most to your business is easy to find on every page.</p></li>
      <li><h3 class="h4">Everyone can use it</h3><p>Keyboard access, visible focus, readable contrast and respect for reduced-motion settings.</p></li>
      <li><h3 class="h4">Tested before it’s handed over</h3><p>Phone, tablet and desktop sizes, resized windows, keyboards and reduced motion. Then we measure and fix.</p></li>
    </ul>
  </div>
</section>

<section class="section sunk" aria-labelledby="wwork-title">
  <div class="wrap">
    <div class="section-head" data-reveal><h2 class="h2" id="wwork-title">Concept studies</h2><p class="lead">Websites we designed and built on our own initiative, for real Los Angeles businesses. None was commissioned.</p></div>
    <div class="work-list">
      <a class="work" href="/work/rok/" data-reveal><div class="work-media"><img src="/assets/video/rok-site-poster.webp" width="1280" height="800" alt="The rōk coffee and tea concept site." loading="lazy" decoding="async"><span class="tag">Concept study</span></div><div><h3 class="h3">rōk coffee and tea <span aria-hidden="true">→</span></h3><p>A scroll-controlled pour as the signature moment.</p></div></a>
      <a class="work" href="/work/bbs/" data-reveal><div class="work-media"><img src="/assets/video/bbs-site-poster.webp" width="1280" height="800" alt="The BB's Bakery concept site." loading="lazy" decoding="async"><span class="tag">Concept study</span></div><div><h3 class="h3">BB’s Bakery <span aria-hidden="true">→</span></h3><p>A sketchbook in motion, with the practical details up front.</p></div></a>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="wprice-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="wprice-title">Pricing and process</h2></div>
    <div data-reveal>
      <div class="note"><p><strong>Custom-priced.</strong> Websites are quoted for your business, as a one-time project fee or a monthly plan depending on the scope. The quote lists the scope, the price and any additional charges before you decide.</p></div>
      <div class="mt-m">${PROCESS}</div>
    </div>
  </div>
</section>
${ctaBand('Find out what your site gets right', 'The free website audit reads your homepage and up to two linked pages, and tells you in plain language what’s clear, what could confuse customers and what to fix first.')}
`);

const receptionist = page({
  path: 'services/voice-receptionist/', active: 'services',
  title: 'Voice receptionist and missed-call text-back · Lumera Creative',
  description: 'An AI voice receptionist that answers your calls, collects the details your team needs and passes on an organized summary. Plans from $150/month. Missed-call text-back is quoted for your business.',
}, `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([['/', 'Home'], ['/services/', 'Services'], [null, 'Voice receptionist']])}
    <h1 class="display">A receptionist that answers when you can’t.</h1>
    <p class="lead">An AI voice receptionist answers your calls, asks the questions your business needs answered and passes an organized summary to your team, instead of a voicemail.</p>
    <div class="btn-row"><a class="btn btn--primary" href="/audit/">Get your free website audit</a><a class="btn btn--secondary" href="/#demo">Try the sample calls</a></div>
  </div>
</section>

<section class="section--tight">
  <div class="wrap">
    <div class="price" data-reveal>
      <p class="label">Voice receptionist</p>
      <p class="price-figure">Plans from $150/month</p>
      <p class="muted">What’s included for your business is set out in your quote before you commit.</p>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="call-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="call-title">How a call goes</h2><p class="lead mt-s">The questions change by business. The sequence doesn’t.</p></div>
    <ol class="list-rows" data-reveal>
      <li><h3 class="h4">1. Answer the call</h3><p>A consistent greeting whenever the line is set to answer.</p></li>
      <li><h3 class="h4">2. Understand the request</h3><p>An appointment, a repair, a table or an order.</p></li>
      <li><h3 class="h4">3. Collect the details you need</h3><p>Only the questions your business asks before a visit or a call back.</p></li>
      <li><h3 class="h4">4. Check your calendar, where one is connected</h3><p>Real openings come from a connected calendar or booking tool. Without one, the receptionist takes a request and your team confirms it.</p></li>
      <li><h3 class="h4">5. Confirm the next step</h3><p>The caller hears what was recorded and what happens next.</p></li>
      <li><h3 class="h4">6. Pass it to your team</h3><p>An organized summary instead of a voicemail.</p></li>
    </ol>
  </div>
</section>

<section class="section sunk" aria-labelledby="setup-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="setup-title">Set up around your business</h2><p class="lead mt-s">The pattern stays the same. These parts are configured for you, and you approve them.</p></div>
    <ul class="list-rows" data-reveal>
      <li><h3 class="h4">Services</h3><p>What you offer, how long each takes and who can do it.</p></li>
      <li><h3 class="h4">Hours and scheduling rules</h3><p>When the line answers, buffers between visits, service areas and how far ahead people can book.</p></li>
      <li><h3 class="h4">Questions</h3><p>The details your team needs before a visit or a call back.</p></li>
      <li><h3 class="h4">Urgent and unusual calls</h3><p>When a person should take over and how they’re reached, under rules you approve. A live transfer during the call isn’t part of the current setup.</p></li>
    </ul>
  </div>
</section>

<section class="section" id="text-back" aria-labelledby="tb-title">
  <div class="wrap split">
    <div data-reveal><p class="label">Also available</p><h2 class="h2" id="tb-title">Missed-call text-back</h2><p class="lead mt-s">For calls nobody can pick up.</p></div>
    <div data-reveal>
      <ul class="list-rows">
        <li><h3 class="h4">A text, not silence</h3><p>When a call is missed, the caller gets a text back, so they’re not left wondering whether anyone will call.</p></li>
        <li><h3 class="h4">The reason, in writing</h3><p>The caller says what they need, and your team sees it before calling back.</p></li>
        <li><h3 class="h4">A next step</h3><p>The reply helps them take the next step, so the conversation keeps moving.</p></li>
      </ul>
      <div class="note mt-m"><p><strong>Custom-priced</strong>, on its own or alongside the receptionist or a CRM.</p></div>
    </div>
  </div>
</section>

<section class="section dark" aria-labelledby="vdemo-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="vdemo-title">Hear how it handles a call</h2></div>
    <div data-reveal>
      <p class="lead">Choose a salon, an HVAC company, a plumber or a restaurant and follow one sample call to its summary. It’s a demonstration with fictional data; it doesn’t place calls or book anything.</p>
      <div class="btn-row mt-m"><a class="btn btn--primary" href="https://abdusameer.github.io/lumera-hvac-receptionist/" target="_blank" rel="noopener noreferrer">Open the receptionist demo ${OUT}${NEW_TAB}</a><a class="btn btn--secondary" href="/work/voice-receptionist/">About the demo</a></div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="vfaq-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="vfaq-title">Questions</h2></div>
    <div data-reveal>${faqList(['person', 'technical', 'cost', 'start'])}</div>
  </div>
</section>
${ctaBand()}
`);

const crm = page({
  path: 'services/crm-follow-up/', active: 'services',
  title: 'CRM setup and follow-up · Lumera Creative',
  description: 'GoHighLevel CRM setup, lead follow-up, quotes and proposals, and reactivation workflows, configured around your business. Custom quote after a free website audit.',
}, `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([['/', 'Home'], ['/services/', 'Services'], [null, 'CRM and follow-up']])}
    <h1 class="display">One place for every lead, and follow-up that doesn’t rely on memory.</h1>
    <p class="lead">Inquiries come in by phone, text, forms and email. We bring them into one CRM and set up the follow-up, so nothing waits on someone remembering.</p>
    <div class="btn-row"><a class="btn btn--primary" href="/audit/">Get your free website audit</a><a class="btn btn--secondary" href="#workflow">See a sample workflow</a></div>
  </div>
</section>

<section class="section--tight">
  <div class="wrap">
    <div class="svc-list">
      <div class="svc" id="crm" data-reveal><h2 class="h3">CRM setup in GoHighLevel</h2><p>Your contacts, pipeline stages, calendar and forms set up in GoHighLevel around the way your business works, so every inquiry has a place and a status.</p></div>
      <div class="svc" id="follow-up" data-reveal><h2 class="h3">Lead follow-up</h2><p>Follow up on new inquiries and outstanding estimates through workflows configured for your business, so a lead doesn’t go quiet because a message was never sent.</p></div>
      <div class="svc" id="quotes" data-reveal><h2 class="h3">Quotes and proposals</h2><p>Draft quotes and proposals prepared from your services and pricing rules, ready for your team to review before they go out.</p></div>
      <div class="svc" id="reactivation" data-reveal><h2 class="h3">Reactivation</h2><p>Reach back out to past leads and customers through workflows configured for your business.</p></div>
    </div>
  </div>
</section>

<section class="section dark" id="workflow" aria-labelledby="wf-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="wf-title">A sample inquiry, start to finish</h2><p class="lead mt-s">A scripted example with fictional data. It isn’t connected to a real customer, inbox, CRM or production system.</p></div>
    <div class="panel" data-reveal>
      <ol class="steps">
        <li class="step"><div><h3 class="h4">Capture</h3><p>Alex Morgan asks for a kitchen remodel estimate through the website. The details are stored in one place.</p></div></li>
        <li class="step"><div><h3 class="h4">Qualify</h3><p>The request is checked for the information needed and sorted as an estimate request.</p></div></li>
        <li class="step"><div><h3 class="h4">Route</h3><p>It’s assigned to the residential estimates workflow and the estimates team.</p></div></li>
        <li class="step"><div><h3 class="h4">Notify</h3><p>The team gets a new-request alert, and the customer an acknowledgement.</p></div></li>
        <li class="step"><div><h3 class="h4">Record</h3><p>It’s logged in the pipeline as New, with the next step: a site visit.</p></div></li>
      </ol>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="cprice-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="cprice-title">Pricing and process</h2></div>
    <div data-reveal>
      <div class="note"><p><strong>Custom-priced.</strong> CRM setup and follow-up are quoted for your business, as a one-time project fee or a monthly plan depending on the scope. The quote lists the scope, the price and any additional charges before you decide.</p></div>
      <div class="mt-m">${PROCESS}</div>
    </div>
  </div>
</section>

<section class="section sunk" aria-labelledby="cfaq-title">
  <div class="wrap split">
    <div data-reveal><h2 class="h2" id="cfaq-title">Questions</h2></div>
    <div data-reveal>${faqList(['crm', 'technical', 'cost', 'start'])}</div>
  </div>
</section>
${ctaBand()}
`);

export default { 'services/index.html': overview, 'services/websites/index.html': websites, 'services/voice-receptionist/index.html': receptionist, 'services/crm-follow-up/index.html': crm };
