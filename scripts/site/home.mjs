import { page, auditBlock, faqList, contactCard, ARROW, OUT, NEW_TAB, EMAIL, SITE } from './parts.mjs';

// interface icons: Solar (Iconify, CC BY 4.0), monitor-smartphone, phone-calling and checklist-minimalistic, linear style
const icon = {
  web: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M11 17H8C5.17157 17 3.75736 17 2.87868 16.1213C2 15.2426 2 13.8284 2 11V10C2 6.22876 2 4.34315 3.17157 3.17157C4.34315 2 6.22876 2 10 2H15.5C17.8346 2 19.0019 2 19.8856 2.47231C20.5833 2.84525 21.1548 3.4167 21.5277 4.11441C22 4.99805 22 6.16537 22 8.5"/><path d="M14 15C14 13.1144 14 12.1716 14.5858 11.5858C15.1716 11 16.1144 11 18 11C19.8856 11 20.8284 11 21.4142 11.5858C22 12.1716 22 13.1144 22 15V18C22 19.8856 22 20.8284 21.4142 21.4142C20.8284 22 19.8856 22 18 22C16.1144 22 15.1716 22 14.5858 21.4142C14 20.8284 14 19.8856 14 18V15Z"/><path d="M19 20H17"/><path d="M11 22H8"/><path d="M11 22V17"/><path d="M11 13H2"/></g></svg>',
  calls: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M13.5 2C13.5 2 15.8335 2.21213 18.8033 5.18198C21.7731 8.15183 21.9853 10.4853 21.9853 10.4853"/><path d="M14.207 5.53564C14.207 5.53564 15.197 5.81849 16.6819 7.30341C18.1668 8.78834 18.4497 9.77829 18.4497 9.77829"/><path d="M17.6763 20.9631C18.1917 20.9122 18.6399 20.6343 19.0011 20.254L20.4217 18.7584C21.3806 17.7489 21.1102 16.0182 19.8833 15.312L17.9728 14.2123C17.1672 13.7486 16.1858 13.8848 15.5562 14.5477L15.1007 15.0272C15.1007 15.0272 14.0181 16.167 11.0631 13.0559C8.10812 9.94484 9.1907 8.80507 9.1907 8.80507L9.47752 8.50311C10.1841 7.75924 10.2507 6.56497 9.63424 5.6931L8.37326 3.90961C7.61028 2.8305 6.13596 2.68795 5.26145 3.60864L3.69185 5.26114C3.25823 5.71766 2.96765 6.30945 3.00289 6.96594C3.09304 8.64546 3.81072 12.259 7.81536 16.4752C12.0621 20.9462 16.0468 21.1239 17.6763 20.9631Z"/></g></svg>',
  leads: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"/><path stroke-linejoin="round" d="M6 15.8L7.14286 17L10 14"/><path stroke-linejoin="round" d="M6 8.8L7.14286 10L10 7"/><path d="M13 9L18 9"/><path d="M13 16L18 16"/></g></svg>',
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
        <div class="person"><h3>Afrid</h3><p>Co-founder · Computer science graduate</p></div>
        <div class="person"><h3>Sam</h3><p>Co-founder · Computer science graduate</p></div>
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
