import { page, auditBlock, faqList, contactCard, ARROW, OUT, NEW_TAB, EMAIL, SITE } from './parts.mjs';

const icon = {
  web: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8h18M7 21h10M12 18v3"/></svg>',
  calls: '<svg viewBox="0 0 24 24"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  leads: '<svg viewBox="0 0 24 24"><path d="M4 5h16M4 12h10M4 19h6"/><path d="M17 15l2 2 3-4"/></svg>',
};

// sample calls, from the receptionist showcase (fictional data)
const CALLS = [
  { key: 'salon', label: 'Salon', lines: [['c', 'Hi, I’d like to book a gel manicure on Friday afternoon.'], ['a', 'Happy to help. A gel manicure takes about 60 minutes. Do you have a preferred technician?'], ['c', 'Maya, if she’s free.'], ['a', 'Maya has 1:30 PM or 3:45 PM on Friday. Which would you like?'], ['c', '3:45, please. My name is Riley.']],
    title: 'Appointment request', rows: [['Service', 'Gel manicure · 60 min'], ['Staff', 'Maya'], ['Time', 'Friday · 3:45 PM'], ['Customer', 'Riley']] },
  { key: 'plumbing', label: 'Plumbing', lines: [['c', 'There’s a leak under my kitchen sink. Can someone come today?'], ['a', 'Let’s get that started. Is it still leaking, and were you able to close the valve?'], ['c', 'I closed the valve and it slowed down.'], ['a', 'Today’s openings are limited. I can request the 4:00 to 6:00 PM window, or ask the office to call you back.'], ['c', 'Please request 4 to 6. I’m Sam.']],
    title: 'Service request', rows: [['Problem', 'Drip under kitchen sink; valve closed'], ['Requested', 'Today, 4:00–6:00 PM window'], ['Customer', 'Sam'], ['Status', 'Office confirms before anyone is sent']] },
  { key: 'restaurant', label: 'Restaurant', lines: [['c', 'Can I reserve a table for four tomorrow at seven?'], ['a', 'Happy to check. Any seating preference?'], ['c', 'Indoors, please.'], ['a', '7:00 is full for four indoors. I can offer 6:30 PM or 8:15 PM.'], ['c', '8:15 is good. The name is Alex.']],
    title: 'Reservation request', rows: [['Party', '4 adults, indoors'], ['Asked for', 'Tomorrow · 7:00 PM'], ['Offered', 'Tomorrow · 8:15 PM'], ['Name', 'Alex']] },
  { key: 'hvac', label: 'HVAC', lines: [['c', 'My air conditioner is running, but it isn’t cooling.'], ['a', 'I can help with that. Is air coming out of the vents, and is it warm?'], ['c', 'It’s blowing, just warm. The thermostat says 84.'], ['a', 'Tomorrow I have 9:00 AM, 11:30 AM or 2:00 PM for a diagnostic visit.'], ['c', '11:30 works. It’s Jordan.']],
    title: 'Service request', rows: [['Issue', 'Runs but blows warm air; 84°F'], ['Visit', 'Tomorrow · 11:30 AM'], ['Customer', 'Jordan'], ['Next step', 'Your team confirms the visit']] },
];

const callPanel = (c, i) => `<div class="call-panel" role="tabpanel" id="call-${c.key}" aria-labelledby="tab-${c.key}"${i ? ' hidden' : ''} tabindex="0">
            <div class="call bubbles">
              ${c.lines.map(([w, t]) => `<p class="bubble bubble--${w === 'c' ? 'caller' : 'agent'}"><b>${w === 'c' ? 'Caller' : 'Receptionist'}</b>${t}</p>`).join('\n              ')}
            </div>
            <div class="summary">
              <p class="summary-title"><span>${c.title}</span><span class="tag tag--sample">Sample</span></p>
              <dl class="req">${c.rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
            </div>
          </div>`;

export default page({
  path: '',
  title: 'Lumera Creative · Websites, AI receptionists and business automation',
  description: 'Lumera Creative designs websites, sets up AI voice receptionists and missed-call text-back, and organizes leads and follow-up for businesses across the U.S. Based in Los Angeles. Start with a free website audit.',
  audit: true,
  active: 'home',
  jsonld: JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Organization', name: 'Lumera Creative', legalName: 'Lumera Creative LLC', url: SITE, email: EMAIL,
    description: 'Websites, AI voice receptionists, missed-call text-back, CRM setup and follow-up automation for businesses across the U.S.',
    address: { '@type': 'PostalAddress', addressLocality: 'Los Angeles', addressRegion: 'CA', addressCountry: 'US' },
    areaServed: { '@type': 'Country', name: 'United States' },
    founder: [{ '@type': 'Person', name: 'Afrid' }, { '@type': 'Person', name: 'Sam' }],
  }, null, 2),
}, `
<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <h1 class="display" id="hero-title">Websites, AI receptionists and business automation.</h1>
      <p class="lead">We build the website your customers find, the receptionist that answers when you can’t, and the follow-up that keeps new leads from going cold.</p>
      <div class="btn-row">
        <a class="btn btn--primary" href="#audit">Get your free website audit</a>
        <a class="btn btn--secondary" href="/services/">Explore services</a>
      </div>
      <p class="hero-note"><span>Based in Los Angeles</span><span>Working with businesses across the U.S.</span></p>
    </div>
    <div class="sys" aria-label="Examples of what we build, with sample data" role="group">
      <div class="sys-card sys-call">
        <div class="sys-card-head"><span class="sys-card-title"><span class="dot dot--live" aria-hidden="true"></span>Incoming call, answered</span><span class="tag tag--sample">Sample</span></div>
        <div class="bubbles">
          <p class="bubble bubble--caller"><b>Caller</b>Hi, can I book a gel manicure for Friday afternoon?</p>
          <p class="bubble bubble--agent"><b>Receptionist</b>Of course. Maya has 1:30 or 3:45 free. Which works for you?</p>
        </div>
      </div>
      <div class="sys-card sys-req">
        <div class="sys-card-head"><span class="sys-card-title">New request for your team</span><span class="tag tag--sample">Sample</span></div>
        <dl class="req"><div><dt>Service</dt><dd>Gel manicure · 60 min</dd></div><div><dt>When</dt><dd>Friday · 3:45 PM</dd></div><div><dt>Customer</dt><dd>Riley</dd></div></dl>
      </div>
      <div class="sys-row">
        <div class="sys-card">
          <div class="sys-card-head"><span class="sys-card-title">Missed call, texted back</span></div>
          <div class="sms"><p>Sorry we missed you! What can we help with?</p><p>Leak under the kitchen sink. Can someone come today?</p></div>
        </div>
        <div class="sys-card sys-site">
          <div class="sys-card-head"><span class="sys-card-title">A website that explains you</span></div>
          <img src="/assets/video/rok-site-poster.webp" width="1280" height="800" alt="The top of the rōk coffee and tea concept site: a matcha drink over misty tea hills." fetchpriority="high">
        </div>
      </div>
      <p class="sys-foot">Sample conversations and data, shown for illustration.</p>
    </div>
  </div>
</section>

<section class="section sunk" id="help" aria-labelledby="help-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 class="h2" id="help-title">What do you need help with?</h2>
      <p class="lead">Start with the problem. We’ll match it to the right service, or tell you when you need less than you thought.</p>
    </div>
    <div class="needs">
      <article class="need need--web" data-reveal>
        <div><span class="need-icon">${icon.web}</span><h3 class="h3">Improve my website</h3><p>A site that explains what you do in seconds, works on every phone and makes it easy to get in touch.</p></div>
        <ul>
          <li><a href="/services/websites/">Website design and build <span aria-hidden="true">→</span></a></li>
          <li><a href="/services/websites/#restructure">Restructuring an existing site <span aria-hidden="true">→</span></a></li>
          <li><a href="#audit">Free website audit <span aria-hidden="true">→</span></a></li>
        </ul>
        <a class="arrow-link" href="/services/websites/">How websites work with us ${ARROW}</a>
      </article>
      <article class="need need--calls" data-reveal>
        <div><span class="need-icon">${icon.calls}</span><h3 class="h3">Handle missed calls and inquiries</h3><p>Callers get answered or texted back, and you get their details in writing instead of a voicemail to decode.</p></div>
        <ul>
          <li><a href="/services/voice-receptionist/">Voice receptionist <small>from $150/mo</small></a></li>
          <li><a href="/services/voice-receptionist/#text-back">Missed-call text-back <span aria-hidden="true">→</span></a></li>
          <li><a href="#demo">Try the sample calls <span aria-hidden="true">→</span></a></li>
        </ul>
        <a class="arrow-link" href="/services/voice-receptionist/">How the receptionist works ${ARROW}</a>
      </article>
      <article class="need need--leads" data-reveal>
        <div><span class="need-icon">${icon.leads}</span><h3 class="h3">Organize leads and follow-up</h3><p>Every inquiry lands in one place, with follow-up, quotes and check-ins that don’t depend on someone remembering.</p></div>
        <ul>
          <li><a href="/services/crm-follow-up/#crm">CRM setup in GoHighLevel <span aria-hidden="true">→</span></a></li>
          <li><a href="/services/crm-follow-up/#follow-up">Lead follow-up and reactivation <span aria-hidden="true">→</span></a></li>
          <li><a href="/services/crm-follow-up/#quotes">Quotes and proposals <span aria-hidden="true">→</span></a></li>
        </ul>
        <a class="arrow-link" href="/services/crm-follow-up/">How follow-up works ${ARROW}</a>
      </article>
    </div>
  </div>
</section>

<section class="section dark" id="demo" aria-labelledby="demo-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 class="h2" id="demo-title">See it working</h2>
      <p class="lead">Two demonstrations with sample data: a receptionist taking a call, and an inquiry moving through a workflow. They aren’t connected to any client’s phone line or systems.</p>
    </div>
    <div class="demo-grid">
      <div class="panel" data-biz data-reveal>
        <div class="panel-head"><h3 class="h4">A receptionist taking a call</h3><span class="tag tag--sample">Demonstration · sample data</span></div>
        <div class="biz" role="tablist" aria-label="Choose a business">
          ${CALLS.map((c, i) => `<button type="button" role="tab" id="tab-${c.key}" aria-controls="call-${c.key}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${c.label}</button>`).join('\n          ')}
        </div>
        ${CALLS.map(callPanel).join('\n        ')}
        <p class="panel-note">Each business gets its own questions, services and rules. <a class="text-link" href="https://abdusameer.github.io/lumera-hvac-receptionist/" target="_blank" rel="noopener noreferrer">Open the full receptionist demo ${OUT}${NEW_TAB}</a></p>
      </div>
      <div class="panel" data-reveal>
        <div class="panel-head"><h3 class="h4">From inquiry to action</h3><span class="tag tag--sample">Sample inquiry</span></div>
        <ol class="steps">
          <li class="step"><div><h4 class="h4">Capture</h4><p>A request for a kitchen remodel estimate arrives through the website, and its details are stored in one place.</p></div></li>
          <li class="step"><div><h4 class="h4">Qualify</h4><p>It’s checked for the information needed and sorted by type of work.</p></div></li>
          <li class="step"><div><h4 class="h4">Route</h4><p>It goes to the workflow that handles estimate requests.</p></div></li>
          <li class="step"><div><h4 class="h4">Notify</h4><p>The team, and the customer, are told what happens next.</p></div></li>
          <li class="step"><div><h4 class="h4">Record</h4><p>It’s logged in the pipeline with its status and next step: a site visit.</p></div></li>
        </ol>
      </div>
    </div>
    <div class="handoff" data-reveal>
      <div><h3>Your rules</h3><p>Questions, services, hours and what counts as urgent are set up around your business, and you approve them.</p></div>
      <div><h3>A person follows up</h3><p>Every call ends with an organized summary for your team. A live transfer during the call isn’t part of the current setup.</p></div>
      <div><h3>Your calendar decides</h3><p>Openings come from a connected calendar or booking tool where one is set up. Otherwise the receptionist takes a request and your team confirms it.</p></div>
    </div>
  </div>
</section>

<section class="section" id="work" aria-labelledby="work-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 class="h2" id="work-title">Selected work</h2>
      <p class="lead">Concept studies and demonstrations we designed and built ourselves, to show how we think.</p>
    </div>
    <div class="work-list">
      <a class="work" href="/work/voice-receptionist/" data-reveal>
        <div class="work-media"><img src="/assets/video/voice-site-poster.webp" width="1280" height="800" alt="The Voice Receptionist showcase: “Your next customer is calling,” beside a silver telephone receiver." loading="lazy" decoding="async"><span class="tag">Interactive demo · sample data</span></div>
        <div><p class="work-meta"><span>Automation</span><span>2026</span></p><h3 class="h3">Voice Receptionist <span aria-hidden="true">→</span></h3><p>How a customer call becomes an appointment request, service inquiry, reservation or pickup order.</p></div>
      </a>
      <a class="work" href="/work/rok/" data-reveal>
        <div class="work-media"><img src="/assets/video/rok-site-poster.webp" width="1280" height="800" alt="The rōk coffee and tea concept site." loading="lazy" decoding="async"><span class="tag">Concept study</span></div>
        <div><p class="work-meta"><span>Website</span><span>Matcha · four cafés in Los Angeles</span></p><h3 class="h3">rōk coffee and tea <span aria-hidden="true">→</span></h3><p>A scroll-controlled pour that turns the signature drink into the first thing you feel.</p></div>
      </a>
      <a class="work" href="/work/bbs/" data-reveal>
        <div class="work-media"><img src="/assets/video/bbs-site-poster.webp" width="1280" height="800" alt="The BB's Bakery concept site, with a pencil-drawn loaf." loading="lazy" decoding="async"><span class="tag">Concept study</span></div>
        <div><p class="work-meta"><span>Website</span><span>Bakery, coffee and tea · Los Angeles</span></p><h3 class="h3">BB’s Bakery <span aria-hidden="true">→</span></h3><p>A site that feels handmade, like the bread, with the practical details a visitor needs.</p></div>
      </a>
    </div>
    <p class="mt-m"><a class="arrow-link" href="/work/">See all work ${ARROW}</a></p>
  </div>
</section>

<section class="section sunk" id="about" aria-labelledby="about-title">
  <div class="wrap founders">
    <div data-reveal>
      <h2 class="h2" id="about-title">Who you’ll work with</h2>
      <p class="lead mt-s">Founded by Afrid and Sam, Lumera Creative brings together computer science, thoughtful design and practical business automation. We build websites and connected systems that help businesses handle inquiries, simplify everyday tasks and follow up with customers.</p>
      <p class="mt-m"><a class="arrow-link" href="/about/">More about how we work ${ARROW}</a></p>
    </div>
    <div data-reveal>
      <div class="people">
        <div class="person"><span class="monogram" aria-hidden="true">A</span><div><h3>Afrid</h3><p>Co-founder · Computer science graduate</p></div></div>
        <div class="person"><span class="monogram" aria-hidden="true">S</span><div><h3>Sam</h3><p>Co-founder · Computer science graduate</p></div></div>
      </div>
      <dl class="facts">
        <div><dt>Based in</dt><dd>Los Angeles</dd></div>
        <div><dt>Available to</dt><dd>Businesses across the U.S.</dd></div>
        <div><dt>You talk to</dt><dd>The two people who build it</dd></div>
      </dl>
    </div>
  </div>
</section>

${auditBlock()}

<section class="section sunk" id="contact" aria-labelledby="contact-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 class="h2" id="contact-title">Questions</h2>
      <p class="lead">Plain answers about scope, pricing, setup and working together.</p>
    </div>
    <div class="qa-grid">
      ${faqList(['cost', 'technical', 'person', 'start', 'crm', 'audit', 'where', 'work'])}
      ${contactCard}
    </div>
  </div>
</section>
`);
