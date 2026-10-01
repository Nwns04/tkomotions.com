import { useEffect, useRef, useState } from 'react';
import logoUrl from './logo.png';
import './kinetic-home.css';

const sections = [
  ['01', 'FRICTION', 'friction'],
  ['02', 'METHOD', 'method'],
  ['03', 'SYSTEMS', 'systems'],
  ['04', 'BUILDS', 'builds'],
  ['05', 'FIELD NOTES', 'field-notes'],
  ['06', 'CONTACT', 'contact'],
];

const heroSlides = [
  { theme: 'WHERE WE BUILD', desktop: '/images/hero/city-lagos-wide.webp', mobile: '/images/hero/city-lagos-portrait.webp', alt: 'Lagos Island skyline across the lagoon at sunset, photographed from the waterfront.', position: 'center 48%' },
  { theme: 'FIND THE FRICTION', desktop: '/images/hero/system-candidate.webp', mobile: '/images/hero/system-portrait.webp', alt: 'Industrial robotic arms working on a vehicle assembly line.', position: 'center center' },
  { theme: 'BUILD WITH PEOPLE', desktop: '/images/hero/people-candidate.webp', mobile: '/images/hero/people-candidate.webp', alt: 'African software developers collaborating around a computer in a working studio.', position: '68% center' },
  { theme: 'MOVE BUSINESS', desktop: '/images/hero/movement-wide.webp', mobile: '/images/hero/movement-portrait.webp', alt: 'Aerial view of shipping containers and transport lanes at a cargo port.', position: 'center center' },
  { theme: 'CONNECT THE SYSTEMS', desktop: '/images/hero/compute-wide.webp', mobile: '/images/hero/compute-portrait.webp', alt: 'Server racks and network connections inside a data center.', position: 'center center' },
  { theme: "MAKE WHAT'S NEXT", desktop: '/images/hero/build-candidate.webp', mobile: '/images/hero/build-portrait.webp', alt: 'Engineering plans and tools on a workbench as a design is developed.', position: 'center center' },
];

const method = [
  ['01', 'FIND', 'Understand what is slowing the business down, and where there is room to move.'],
  ['02', 'DEFINE', 'Make the problem specific. Agree what progress should look like before choosing tools.'],
  ['03', 'DESIGN', 'Shape the product, experience and technical system around the actual need.'],
  ['04', 'BUILD', 'Develop, connect and test the parts that need to work together.'],
  ['05', 'MOVE', 'Put the system to work. Learn from use. Improve what comes next.'],
];

const systems = [
  ['01', 'SOFTWARE SYSTEMS', 'Applications, dashboards, portals and the internal tools that keep work moving.'],
  ['02', 'AI & AUTOMATION', 'AI-assisted workflows, document handling, knowledge tools and less repetitive work.'],
  ['03', 'DIGITAL PRODUCTS', 'Products shaped around real needs, not technology looking for a problem.'],
  ['04', 'WEB EXPERIENCES', 'Websites and platforms that help people understand, trust and act.'],
  ['05', 'BUSINESS TOOLS', 'Purpose-built systems for the work generic software doesn’t quite fit.'],
  ['06', 'INTEGRATIONS', 'APIs, payments, messaging, data and the connections between systems.'],
];

const builds = [
  { id: 'lead', number: '001', name: 'LEAD SYSTEM', url: 'https://leaddemo.onrender.com/work/', description: 'A working system for discovering and managing business opportunities.', label: 'OPPORTUNITY MANAGEMENT' },
  { id: 'tko', number: '002', name: 'TKO MOTIONS', url: 'https://tkomotions.onrender.com/', description: 'An earlier TKO Motions website build.', label: 'CORPORATE WEBSITE' },
];

const fieldNotes = [
  ['024', 'AI / BUSINESS', 'What should a small business actually automate?'],
  ['025', 'SOFTWARE / SYSTEMS', 'Why business software often starts with the wrong question'],
  ['026', 'PRODUCT / BUILDING', 'From idea to working system'],
];

function Arrow({ diagonal = false }) {
  return <span className="kh-arrow" aria-hidden="true">{diagonal ? '↗' : '→'}</span>;
}

function Mark({ footer = false }) {
  return <a href="#top" className="kh-brand" aria-label="TKO Motions, return to top"><img className={footer ? 'kh-logo kh-logo-footer' : 'kh-logo'} src={logoUrl} alt="TKO Motions" /><span className="kh-brand-label">TKO MOTIONS<small>BUSINESS INNOVATION</small></span></a>;
}

function HeroPhoto({ slide, className, onLoad, priority = false }) {
  return (
    <picture className={className}>
      {slide.mobile !== slide.desktop && <source media="(max-width: 760px)" srcSet={slide.mobile} type="image/webp" />}
      <img src={slide.desktop} alt={slide.alt} onLoad={onLoad} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'low'} decoding="async" style={{ objectPosition: slide.position }} />
    </picture>
  );
}

export default function KineticHome() {
  const root = useRef(null);
  const hero = useRef(null);
  const gsapApi = useRef(null);
  const transitionLock = useRef(false);
  const swipeStart = useRef(null);
  const selectSlideRef = useRef(null);
  const [activeSection, setActiveSection] = useState('friction');
  const [activeStep, setActiveStep] = useState(0);
  const [activeBuild, setActiveBuild] = useState(builds[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [incomingSlide, setIncomingSlide] = useState(null);
  const [incomingReady, setIncomingReady] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);

  useEffect(() => {
    const scope = root.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let context;
    let cancelled = false;

    if (reducedMotion) return undefined;

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([gsapModule, triggerModule]) => {
      if (cancelled) return;
      const gsap = gsapModule.default;
      const { ScrollTrigger } = triggerModule;
      gsap.registerPlugin(ScrollTrigger);
      gsapApi.current = gsap;

      context = gsap.context(() => {
      const entry = gsap.timeline({ defaults: { ease: 'power2.out' } });
      entry.from('.kh-entry-photo.is-active img', { scale: 1.06, duration: 1.1 }, 0)
        .from('.kh-entry-lime', { xPercent: -14, opacity: 0.2, duration: 0.9 }, 0.12)
        .from('.kh-entry-kicker, .kh-entry-count', { y: 12, autoAlpha: 0, duration: 0.35, stagger: 0.06 }, 0.34)
        .from('.kh-entry-word', { yPercent: 105, autoAlpha: 0, duration: 0.55, stagger: 0.1 }, 0.52)
        .from('.kh-entry-subtitle, .kh-entry-cue, .kh-entry-controls', { y: 15, autoAlpha: 0, duration: 0.42, stagger: 0.09 }, 0.88);

      gsap.timeline({
        scrollTrigger: {
          trigger: '.kh-entry',
          start: 'top top',
          end: '+=440',
          scrub: 0.8,
        },
      })
        .to('.kh-entry-word:first-child', { xPercent: -7, ease: 'none' }, 0)
        .to('.kh-entry-word:last-child', { xPercent: 8, ease: 'none' }, 0)
        .to('.kh-entry-line', { scaleX: 1, ease: 'none' }, 0.08);

      gsap.to('.kh-page-progress', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: scope, start: 'top top', end: 'bottom bottom', scrub: true },
      });

      gsap.utils.toArray('[data-kh-reveal]').forEach((element) => {
        gsap.from(element, {
          y: 28,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 86%', once: true },
        });
      });

      gsap.from('.kh-friction-terms span', {
        x: -16,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.45,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.kh-friction-map', start: 'top 78%', once: true },
      });
      gsap.from('.kh-friction-core', {
        scale: 0.88,
        autoAlpha: 0,
        duration: 0.7,
        ease: 'back.out(1.4)',
        scrollTrigger: { trigger: '.kh-friction-map', start: 'top 78%', once: true },
      });

      if (window.innerWidth > 760) {
        ScrollTrigger.create({
          trigger: '.kh-method',
          start: 'top top+=76',
          end: 'bottom bottom',
          pin: '.kh-method-stage',
          pinSpacing: false,
          onUpdate: (self) => setActiveStep(Math.min(method.length - 1, Math.floor(self.progress * method.length))),
        });
      }

      sections.forEach(([, , id]) => {
        ScrollTrigger.create({
          trigger: `#${id}`,
          start: 'top 35%',
          end: 'bottom 35%',
          onEnter: () => setActiveSection(id),
          onEnterBack: () => setActiveSection(id),
        });
      });
      }, scope);
    });

    return () => {
      cancelled = true;
      context?.revert();
    };
  }, []);

  function selectSlide(index) {
    if (index === activeSlide || transitionLock.current) return;
    transitionLock.current = true;
    setIncomingReady(false);
    setIncomingSlide((index + heroSlides.length) % heroSlides.length);
  }

  selectSlideRef.current = selectSlide;

  useEffect(() => {
    if (incomingSlide === null || !incomingReady) return undefined;
    if (!gsapApi.current) {
      setActiveSlide(incomingSlide);
      setIncomingSlide(null);
      setIncomingReady(false);
      transitionLock.current = false;
      return undefined;
    }
    const gsap = gsapApi.current;
    const currentImage = hero.current?.querySelector('.kh-entry-photo.is-active img');
    const incomingImage = hero.current?.querySelector('.kh-entry-photo.is-incoming img');
    const sweep = hero.current?.querySelector('.kh-entry-sweep');
    if (!currentImage || !incomingImage || !sweep) return undefined;

    const timeline = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        setActiveSlide(incomingSlide);
        setIncomingSlide(null);
        setIncomingReady(false);
        transitionLock.current = false;
      },
    });
    gsap.set(incomingImage, { opacity: 0, scale: 1.045, xPercent: 0, yPercent: 0 });
    gsap.set(sweep, { clipPath: 'inset(0 100% 0 0)', opacity: 0.9 });
    const motions = {
      0: { scale: 1.055 },
      1: { xPercent: 1.3, scale: 1.025 },
      2: { yPercent: -1.1, scale: 1.03 },
      3: { scale: 1.06 },
      4: { xPercent: -1.4, scale: 1.035 },
      5: { yPercent: -1, scale: 1.035 },
    };
    timeline.to(currentImage, { ...motions[activeSlide], duration: 0.9 }, 0)
      .to(sweep, { clipPath: 'inset(0 0% 0 0)', duration: 0.9 }, 0.05)
      .to(incomingImage, { opacity: 1, scale: 1, duration: 0.95 }, 0.12)
      .to(sweep, { opacity: 0, duration: 0.34 }, 0.68);

    return () => timeline.kill();
  }, [activeSlide, incomingReady, incomingSlide]);

  useEffect(() => {
    if (autoPaused || incomingSlide !== null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timeout = window.setTimeout(() => selectSlideRef.current?.((activeSlide + 1) % heroSlides.length), 6500);
    return () => window.clearTimeout(timeout);
  }, [activeSlide, autoPaused, incomingSlide]);

  function handleHeroKeyDown(event) {
    if (event.target.closest('button, a, input, select, textarea')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); selectSlide((activeSlide + 1) % heroSlides.length); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); selectSlide((activeSlide - 1 + heroSlides.length) % heroSlides.length); }
  }

  function handleTouchStart(event) {
    swipeStart.current = event.changedTouches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (swipeStart.current === null) return;
    const delta = event.changedTouches[0].clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(delta) < 48) return;
    selectSlide((activeSlide + (delta < 0 ? 1 : -1) + heroSlides.length) % heroSlides.length);
  }

  function sendProject(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const body = [
      `Name: ${values.name}`,
      `Company: ${values.company || 'Not provided'}`,
      `Email: ${values.email}`,
      `Phone / WhatsApp: ${values.phone || 'Not provided'}`,
      `What are you trying to build?: ${values.need}`,
      `Problem: ${values.problem}`,
      `Budget: ${values.budget || 'Not provided'}`,
      `Timeline: ${values.timeline || 'Not provided'}`,
    ].join('\n\n');
    window.location.href = `mailto:hello@tkomotions.com?subject=${encodeURIComponent(`Project enquiry from ${values.name}`)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="kinetic-home" id="top" ref={root}>
      <a className="kh-skip" href="#main-content">Skip to content</a>
      <div className="kh-page-progress" aria-hidden="true" />
      <header className="kh-header">
        <Mark />
        <nav className={menuOpen ? 'kh-nav is-open' : 'kh-nav'} aria-label="Primary navigation">
          {sections.map(([number, label, id]) => <a key={id} className={activeSection === id ? 'is-active' : ''} href={`#${id}`} onClick={() => setMenuOpen(false)}><span>{number}</span>{label}</a>)}
          <a className="kh-nav-cta" href="#contact" onClick={() => setMenuOpen(false)}>START A PROJECT <Arrow diagonal /></a>
        </nav>
        <button className="kh-menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      </header>

      <main id="main-content">
        <section className="kh-entry" id="top-entry" ref={hero} aria-label="TKO Motions visual introduction" tabIndex="0" onKeyDown={handleHeroKeyDown} onMouseEnter={() => setAutoPaused(true)} onMouseLeave={() => setAutoPaused(false)} onFocusCapture={() => setAutoPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setAutoPaused(false); }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="kh-entry-images" aria-hidden="true">
            <HeroPhoto slide={heroSlides[activeSlide]} className="kh-entry-photo is-active" priority={activeSlide === 0} />
            {incomingSlide !== null && <HeroPhoto slide={heroSlides[incomingSlide]} className="kh-entry-photo is-incoming" onLoad={() => setIncomingReady(true)} />}
            <div className="kh-entry-lime" />
            <div className="kh-entry-sweep" />
          </div>
          <div className="kh-entry-top"><span className="kh-entry-kicker">TKO MOTIONS</span><span className="kh-entry-count" aria-live="polite">{String(activeSlide + 1).padStart(2, '0')} / 06</span></div>
          <div className="kh-entry-core">
            <p className="kh-entry-kicker kh-entry-theme">{heroSlides[activeSlide].theme}</p>
            <h1 className="kh-entry-question" id="kh-entry-title"><span className="kh-entry-word">WHAT</span><span className="kh-entry-word kh-word-offset">NEEDS</span><span className="kh-entry-word">TO MOVE<span className="kh-green-period">?</span></span></h1>
            <p className="kh-entry-position">Business Innovation & Digital Solutions</p>
            <div className="kh-entry-line" aria-hidden="true" />
            <div className="kh-entry-bottom"><p className="kh-entry-subtitle">We identify the friction, build the system, and help businesses move forward.</p><a className="kh-entry-cue" href="#systems"><span>EXPLORE WHAT WE BUILD</span><b>→</b></a></div>
          </div>
          <div className="kh-entry-controls" aria-label="Hero image slides">
            {activeSlide === 0 && <a className="kh-entry-credit" href="https://commons.wikimedia.org/wiki/File:Lagos-centre-from-executive-lounge-Continental-hotel-2026-IMG_7970.jpg" target="_blank" rel="noreferrer">PHOTO: FRANK VAN ECK · CC BY-SA 4.0</a>}
            <div className="kh-slide-nav">{heroSlides.map((slide, index) => <button key={slide.theme} type="button" className={index === activeSlide ? 'is-active' : ''} aria-label={`Show slide ${index + 1}: ${slide.theme}`} aria-current={index === activeSlide ? 'true' : undefined} onClick={() => selectSlide(index)}><span>{String(index + 1).padStart(2, '0')}</span><i><b /></i></button>)}</div>
            <button type="button" className="kh-autoplay" aria-label={autoPaused ? 'Resume automatic slides' : 'Pause automatic slides'} onClick={() => setAutoPaused(!autoPaused)}>{autoPaused ? 'PLAY' : 'PAUSE'}<span>{autoPaused ? '▶' : 'Ⅱ'}</span></button>
          </div>
        </section>

        <section className="kh-friction kh-section" id="friction" aria-labelledby="kh-friction-title">
          <div className="kh-section-label"><span>01 / FRICTION</span><span>START WITH WHAT ISN’T WORKING</span></div>
          <div className="kh-friction-intro"><h1 id="kh-friction-title">TECHNOLOGY<br />SHOULD SOLVE<br /><em>SOMETHING.</em></h1><p>Businesses don’t always need more technology. They need the right thing to change.</p></div>
          <div className="kh-friction-map" data-kh-reveal>
            <div className="kh-friction-terms"><span>MANUAL</span><span>DISCONNECTED</span><span>SLOW</span><span>REPETITIVE</span><span>MISSED</span></div>
            <div className="kh-friction-core"><div className="kh-crosshair" aria-hidden="true"><i /><i /></div><span>FRICTION</span><small>FIND THE BLOCKAGE</small></div>
            <div className="kh-friction-outcome"><span>FRICTION</span><i>↓</i><span>OPPORTUNITY</span><i>↓</i><strong>SYSTEM</strong></div>
          </div>
          <p className="kh-friction-foot">THE WORK IS NOT TO ADD TECHNOLOGY.<br />IT IS TO MAKE PROGRESS POSSIBLE.</p>
        </section>

        <section className="kh-method kh-section" id="method" aria-labelledby="kh-method-title">
          <div className="kh-section-label"><span>02 / METHOD</span><span>HOW WE MOVE FROM QUESTION TO SYSTEM</span></div>
          <div className="kh-method-layout">
            <div className="kh-method-stage" aria-live="polite">
              <span className="kh-stage-caption">WORKING METHOD / {method[activeStep][0]}</span>
              <strong className="kh-stage-number">{method[activeStep][0]}</strong>
              <h2 id="kh-method-title">{method[activeStep][1]}<span>.</span></h2>
              <p>{method[activeStep][2]}</p>
              <div className="kh-stage-rail"><i style={{ transform: `scaleY(${(activeStep + 1) / method.length})` }} /></div>
              <span className="kh-stage-end">PROBLEM <b>→</b> MOVEMENT</span>
            </div>
            <div className="kh-method-track">
              {method.map(([number, title, description], index) => <article className={activeStep === index ? 'kh-method-item is-active' : 'kh-method-item'} key={number} data-method-step={index}>
                <span className="kh-method-no">{number}</span><div><h3>{title}</h3><p>{description}</p></div><i aria-hidden="true" />
              </article>)}
            </div>
          </div>
        </section>

        <section className="kh-systems kh-section" id="systems" aria-labelledby="kh-systems-title">
          <div className="kh-section-label"><span>03 / SYSTEMS</span><span>THE TOOL FOLLOWS THE NEED</span></div>
          <div className="kh-systems-heading"><h2 id="kh-systems-title">WHAT WE<br /><em>BUILD.</em></h2><p>One problem rarely has a one-size-fits-all answer. We design and build the systems, products and connections that fit the work.</p></div>
          <div className="kh-systems-list">{systems.map(([number, title, description]) => <article className="kh-system-row" key={number} tabIndex="0"><span>{number}</span><h3>{title}</h3><p>{description}</p><b aria-hidden="true">↗</b></article>)}</div>
          <div className="kh-systems-tail"><span>SOFTWARE · AI · AUTOMATION · PRODUCTS · INTEGRATIONS</span><span>BUILT AROUND THE BUSINESS</span></div>
        </section>

        <section className="kh-builds kh-section" id="builds" aria-labelledby="kh-builds-title">
          <div className="kh-section-label"><span>04 / BUILT · LIVE</span><span>REAL SYSTEMS / OPEN TO EXPLORE</span></div>
          <div className="kh-builds-heading"><h2 id="kh-builds-title">THE WORK<br />IS THE <em>PROOF.</em></h2><p>Two live builds. No invented numbers, customer claims or polished mockups standing in for the actual thing.</p></div>
          <div className="kh-build-tabs" role="tablist" aria-label="Live system previews">
            {builds.map((build, index) => <button key={build.id} id={`kh-tab-${build.id}`} type="button" role="tab" aria-controls="kh-live-preview" aria-selected={activeBuild.id === build.id} tabIndex={activeBuild.id === build.id ? 0 : -1} className={activeBuild.id === build.id ? 'is-active' : ''} onClick={() => setActiveBuild(build)} onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
              event.preventDefault();
              const direction = event.key === 'ArrowRight' ? 1 : -1;
              const nextBuild = builds[(index + direction + builds.length) % builds.length];
              setActiveBuild(nextBuild);
              document.getElementById(`kh-tab-${nextBuild.id}`)?.focus();
            }}><span>BUILD / {build.number}</span><strong>{build.name}</strong><Arrow /></button>)}
          </div>
          <article className="kh-live-system" id="kh-live-preview" role="tabpanel" aria-labelledby={`kh-tab-${activeBuild.id}`}>
            <div className="kh-live-meta"><span><i /> LIVE SYSTEM / {activeBuild.number}</span><span>{activeBuild.label}</span><a href={activeBuild.url} target="_blank" rel="noreferrer">ENTER FULL SYSTEM <Arrow diagonal /></a></div>
            <iframe key={activeBuild.id} src={activeBuild.url} title={`${activeBuild.name} live system preview`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
          </article>
          <p className="kh-live-description">{activeBuild.description}</p>
        </section>

        <section className="kh-taxbot kh-section" id="product" aria-labelledby="kh-taxbot-title">
          <div className="kh-section-label"><span>PRODUCT / TAXBOT NAIJA</span><span>TKO PRODUCT DIRECTION</span></div>
          <div className="kh-taxbot-layout"><span className="kh-taxbot-index">TB<span>↗</span></span><div><p className="kh-overline">WHATSAPP-FIRST / NIGERIA</p><h2 id="kh-taxbot-title">TAXBOT<br /><em>NAIJA.</em></h2><p className="kh-taxbot-copy">A WhatsApp-first Nigerian tax assistant combining tax information, calculations and AI-assisted guidance.</p><a className="kh-text-link" href="https://taxbotnaija.com" target="_blank" rel="noreferrer">EXPLORE PRODUCT <Arrow diagonal /></a></div></div>
        </section>

        <section className="kh-field kh-section" id="field-notes" aria-labelledby="kh-field-title">
          <div className="kh-section-label"><span>05 / FIELD NOTES</span><span>IDEAS IN THE WORKSHOP</span></div>
          <div className="kh-field-heading"><h2 id="kh-field-title">FIELD<br /><em>NOTES.</em></h2><p>A place for practical thinking on AI, software, business systems, Nigerian technology and building products. Topics below are planned, not published articles.</p></div>
          <div className="kh-field-list">{fieldNotes.map(([number, category, title]) => <article key={number}><span className="kh-field-number">{number}</span><span className="kh-field-category">{category} / DRAFT</span><h3>{title}</h3><span className="kh-field-state">IN DEVELOPMENT</span></article>)}</div>
        </section>

        <section className="kh-about kh-section" id="about" aria-labelledby="kh-about-title">
          <div className="kh-section-label"><span>ABOUT / TKO MOTIONS LTD</span><span>RC 8976551</span></div>
          <div className="kh-about-grid"><h2 id="kh-about-title">WE IDENTIFY.<br />WE INVESTIGATE.<br />WE DESIGN.<br /><em>WE BUILD.</em></h2><div><p className="kh-about-lead">TKO Motions is a Nigerian Business Innovation & Digital Solutions company working at the intersection of business, software, AI and innovation.</p><p>We look for the blockage. We explore the opportunity. Then we build the useful thing and move forward.</p><a href="#contact" className="kh-text-link">START A CONVERSATION <Arrow /></a></div></div>
        </section>

        <section className="kh-contact kh-section" id="contact" aria-labelledby="kh-contact-title">
          <div className="kh-section-label"><span>06 / CONTACT</span><span>START WITH THE PROBLEM</span></div>
          <div className="kh-contact-grid"><div><p className="kh-overline">PROJECT INTAKE / 001</p><h2 id="kh-contact-title">WHAT SHOULD<br /><em>MOVE?</em></h2><p className="kh-contact-copy">Tell us what isn’t working, what you’re trying to build, or what opportunity you’re exploring.</p><a className="kh-contact-email" href="mailto:hello@tkomotions.com">hello@tkomotions.com <Arrow diagonal /></a></div>
            <form className="kh-project-form" onSubmit={sendProject}>
              <label><span>01 / NAME</span><input name="name" autoComplete="name" required /></label>
              <label><span>02 / COMPANY</span><input name="company" autoComplete="organization" /></label>
              <div className="kh-form-pair"><label><span>03 / EMAIL</span><input name="email" type="email" autoComplete="email" required /></label><label><span>04 / PHONE / WHATSAPP</span><input name="phone" type="tel" autoComplete="tel" /></label></div>
              <label><span>05 / WHAT ARE YOU TRYING TO BUILD?</span><select name="need" defaultValue=""><option value="" disabled>Choose a starting point</option><option>Software system</option><option>AI or automation</option><option>Digital product</option><option>Website or digital experience</option><option>Integration</option><option>Still defining the problem</option></select></label>
              <label><span>06 / WHAT PROBLEM ARE YOU SOLVING?</span><textarea name="problem" rows="3" required /></label>
              <div className="kh-form-pair"><label><span>07 / BUDGET</span><select name="budget" defaultValue=""><option value="">Choose range</option><option>Under ₦500,000</option><option>₦500,000–₦2,000,000</option><option>₦2,000,000–₦5,000,000</option><option>₦5,000,000+</option><option>To be discussed</option></select></label><label><span>08 / TIMELINE</span><select name="timeline" defaultValue=""><option value="">Choose timing</option><option>As soon as possible</option><option>1–3 months</option><option>3–6 months</option><option>Exploring</option></select></label></div>
              <button type="submit">START A CONVERSATION <Arrow diagonal /></button><small>Your email app opens with the project details ready to send.</small>
            </form>
          </div>
        </section>
      </main>

      <footer className="kh-footer">
        <div className="kh-footer-top"><Mark footer /><span>INNOVATE. BUILD. MOVE.</span><span>BUSINESS INNOVATION<br />& DIGITAL SOLUTIONS</span><a href="#top">BACK TO TOP ↑</a></div>
        <nav className="kh-footer-nav" aria-label="Footer navigation">{sections.map(([number, label, id]) => <a key={id} href={`#${id}`}><span>{number}</span>{label}</a>)}</nav>
        <div className="kh-footer-bottom"><span>© {new Date().getFullYear()} TKO MOTIONS LTD · RC 8976551</span><span>NIGERIA</span><a href="/finance/login">FINANCE WORKSPACE <Arrow diagonal /></a></div>
      </footer>
    </div>
  );
}
