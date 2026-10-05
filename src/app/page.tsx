import Image from 'next/image';
import Link from 'next/link';
import { posts } from '../../.velite';
import { Reveal } from '@/components/animations/Reveal';
import { HeroCarousel } from '@/components/hero/HeroCarousel';

const capabilities = [
  {
    number: '01',
    title: 'SOFTWARE & DIGITAL PRODUCTS',
    description: 'Web applications, internal platforms, customer-facing products, dashboards and business tools.',
    href: '/capabilities#software',
  },
  {
    number: '02',
    title: 'AI & INTELLIGENT SYSTEMS',
    description: 'AI assistants, automation, retrieval systems, business intelligence and AI-powered workflows.',
    href: '/capabilities#ai',
  },
  {
    number: '03',
    title: 'BUSINESS AUTOMATION',
    description: 'We connect processes, APIs, messaging platforms and business systems to reduce repetitive work.',
    href: '/capabilities#automation',
  },
  {
    number: '04',
    title: 'DIGITAL EXPERIENCES',
    description: 'Websites and digital interfaces designed around how people actually interact with a business.',
    href: '/capabilities#experience',
  },
  {
    number: '05',
    title: 'BUSINESS SYSTEMS',
    description: 'CRM, workflow, inventory, operations, communication, payment and management systems.',
    href: '/capabilities#systems',
  },
  {
    number: '06',
    title: 'INNOVATION & PROTOTYPING',
    description: "When the solution doesn't exist yet, we prototype, test and build it.",
    href: '/capabilities#innovation',
  },
];

const process = [
  ['01', 'FIND', 'Understand the business, the users and the friction.'],
  ['02', 'DEFINE', 'Turn the problem into a clear system and measurable objective.'],
  ['03', 'DESIGN', 'Design the experience, workflow and technical architecture.'],
  ['04', 'BUILD', 'Develop, integrate, test and refine the solution.'],
  ['05', 'MOVE', 'Deploy, improve and help the solution create measurable business value.'],
];

const builds = [
  {
    number: '001',
    name: 'LEAD SYSTEM',
    category: 'BUSINESS AUTOMATION / LEAD INTELLIGENCE',
    description: 'A working system for discovering and managing business opportunities.',
    href: '/work/lead-system',
    liveUrl: 'https://leaddemo.onrender.com/work/',
    image: '/images/hero/people-candidate.webp',
    alt: 'Developers collaborating at a computer, representing the work behind the Lead System.',
  },
  {
    number: '002',
    name: 'TKO MOTIONS',
    category: 'CORPORATE PLATFORM',
    description: 'The TKO Motions digital platform and company system.',
    href: '/work/tko-motions',
    liveUrl: 'https://tkomotions.com',
    image: '/images/hero/city-lagos-wide.webp',
    alt: 'Lagos skyline, reflecting the Nigerian business context for TKO Motions.',
  },
];

const featuredAiSolutions = [
  { title: 'AI CUSTOMER ASSISTANT', price: '₦80K SETUP + ₦10K / MONTH', description: 'Answer customers automatically.' },
  { title: 'AI LEAD ASSISTANT', price: '₦150K SETUP + ₦20K / MONTH', description: 'Capture and qualify enquiries.' },
  { title: 'AI SALES ENGINE', price: '₦350K SETUP + ₦60K / MONTH', description: 'Turn enquiries into sales.' },
  { title: 'AI BUSINESS OPERATIONS', price: '₦750K+ SETUP + ₦120K+ / MONTH', description: 'Automate how your business works.' },
];

export default function HomePage() {
  const featuredNotes = posts
    .filter((post) => !post.draft)
    .sort((first, second) => Date.parse(second.date ?? '') - Date.parse(first.date ?? ''))
    .slice(0, 3);

  return (
    <>
      <HeroCarousel />

      <section className="kh-container py-20">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>01 / BELIEF</span><span className="text-right">WHAT WE START WITH</span>
          </p>
        </Reveal>
        <Reveal>
          <h2 className="max-w-5xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">
            BUSINESSES DON&apos;T ALWAYS NEED MORE TECHNOLOGY.
            <br />
            <em className="not-italic text-kh-green">THEY NEED THE RIGHT TECHNOLOGY.</em>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted md:text-xl">
            TKO Motions helps businesses identify operational problems, uncover opportunities, and turn them into practical digital solutions.
          </p>
        </Reveal>
      </section>

      <section className="kh-container py-20" id="systems">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>02 / CAPABILITIES</span><span className="text-right">WHAT WE BUILD</span>
          </p>
        </Reveal>
        <Reveal>
          <h2 className="max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">
            SIX THINGS WE BUILD.<br /><em className="not-italic text-kh-muted">ONE PROBLEM AT A TIME.</em>
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability, index) => (
            <Reveal key={capability.number} delay={index * 0.05}>
              <Link href={capability.href} className="group block border-t border-kh-rule pt-5 transition-colors hover:border-kh-green">
                <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{capability.number}</span>
                <h3 className="mt-2 text-xl font-medium leading-tight tracking-[-0.025em] transition-colors group-hover:text-kh-green">{capability.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-kh-muted">{capability.description}</p>
                <span aria-hidden="true" className="mt-4 inline-block text-lg text-kh-green transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-kh-soft py-20" id="ai-solutions">
        <div className="kh-container">
          <Reveal>
            <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
              <span>03 / AI SOLUTIONS</span><span className="text-right">PRACTICAL AI FOR BUSINESS</span>
            </p>
          </Reveal>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <h2 className="max-w-xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">
                AI THAT DOES MORE THAN ANSWER QUESTIONS.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-kh-muted">
                AI should help a business work better. We build practical systems to handle customer enquiries, qualify leads, automate repetitive work and improve everyday operations.
              </p>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[9px] tracking-[0.055em]">
                <Link href="/solutions/ai" className="inline-flex items-center gap-3 border-b border-kh-green pb-1 text-kh-green">
                  EXPLORE AI SOLUTIONS <span aria-hidden="true" className="text-base">→</span>
                </Link>
                <Link href="/solutions/ai-sales#demo" className="inline-flex items-center gap-3 border-b border-kh-rule pb-1 text-kh-muted hover:text-kh-green">
                  TRY THE SALES DEMO <span aria-hidden="true" className="text-base">↗</span>
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-x-8 sm:grid-cols-2">
              {featuredAiSolutions.map((solution, index) => (
                <Reveal key={solution.title} delay={index * 0.05}>
                  <article className="border-t border-kh-rule py-5">
                    <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">0{index + 1}</span>
                    <h3 className="mt-3 text-lg font-medium tracking-[-0.025em]">{solution.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-kh-muted">{solution.description}</p>
                    <p className="mt-4 font-mono text-[10px] tracking-[0.055em] text-kh-green">{solution.price}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-kh-rule pt-5">
              <div>
                <h3 className="text-base font-medium">Need something more complex?</h3>
                <p className="mt-1 text-sm text-kh-muted">Enterprise &amp; custom AI systems, from ₦1.5m.</p>
              </div>
              <Link href="/solutions/ai#custom-ai-systems" className="inline-flex items-center gap-2 border-b border-kh-green pb-1 font-mono text-[9px] tracking-[0.055em] text-kh-green">
                EXPLORE CUSTOM SYSTEMS <span aria-hidden="true" className="text-base">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-kh-soft py-20">
        <div className="kh-container">
          <Reveal>
            <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
              <span>04 / PROCESS</span><span className="text-right">HOW WE MOVE</span>
            </p>
          </Reveal>
          <Reveal>
            <h2 className="max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">
              FROM FRICTION<br /><em className="not-italic text-kh-green">TO FUNCTION.</em>
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-5">
            {process.map(([number, title, description], index) => (
              <Reveal key={number} delay={index * 0.06}>
                <div className="border-t border-kh-rule pt-5">
                  <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{number}</span>
                  <h3 className="mt-2 text-2xl font-medium tracking-[-0.04em] text-kh-green">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-kh-muted">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <div className="mt-12">
              <Link href="/process" className="inline-flex items-center gap-3 border-b border-kh-green pb-1 font-mono text-[9px] tracking-[0.055em] text-kh-green">
                SEE THE FULL PROCESS <span aria-hidden="true" className="text-base">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="kh-container py-20">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
              <span>05 / BUILT · LIVE</span><span className="text-right">REAL SYSTEMS / OPEN TO EXPLORE</span>
          </p>
        </Reveal>
        <Reveal>
          <h2 className="max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">
            THE WORK IS<br /><em className="not-italic text-kh-green">THE PROOF.</em>
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-12 md:grid-cols-2">
          {builds.map((build, index) => (
            <Reveal key={build.number} delay={index * 0.08}>
              <article className="group">
                <Link href={build.href} className="block" aria-label={`Read the ${build.name} case study`}>
                  <div className="relative aspect-[16/10] overflow-hidden bg-kh-soft">
                    <Image
                      src={build.image}
                      alt={build.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-6 border-t border-kh-rule pt-5">
                    <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">BUILD / {build.number}</span>
                    <h3 className="mt-2 text-2xl font-medium tracking-[-0.03em] transition-colors group-hover:text-kh-green">{build.name}</h3>
                    <p className="mt-1 font-mono text-[8px] tracking-[0.055em] text-kh-muted">{build.category}</p>
                    <p className="mt-3 text-sm leading-relaxed text-kh-muted">{build.description}</p>
                  </div>
                </Link>
                <div className="mt-5 flex flex-wrap gap-5 font-mono text-[9px] tracking-[0.055em]">
                  <a href={build.liveUrl} target="_blank" rel="noreferrer" className="text-kh-green">VIEW LIVE ↗</a>
                  <Link href={build.href} className="text-kh-muted hover:text-kh-green">READ CASE STUDY →</Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-kh-soft py-20">
        <div className="kh-container">
          <Reveal>
            <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
              <span>06 / FIELD NOTES</span><span className="text-right">THINKING IN THE OPEN</span>
            </p>
          </Reveal>
          <Reveal>
            <h2 className="max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">
              IDEAS FROM<br /><em className="not-italic text-kh-green">THE WORKSHOP.</em>
            </h2>
          </Reveal>
          <div className="mt-14 border-t border-kh-rule">
            {featuredNotes.length === 0 && <p className="py-8 text-kh-muted">First Field Notes are in development.</p>}
            {featuredNotes.map((note, index) => (
              <Reveal key={note.slug}>
                <Link href={note.url ?? `/field-notes/${note.slug ?? ''}`} className="group grid gap-2 border-b border-kh-rule py-6 md:grid-cols-[80px_180px_1fr_40px] md:items-center md:gap-6">
                  <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{String(index + 1).padStart(3, '0')}</span>
                  <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{note.category}</span>
                  <span className="text-xl font-medium tracking-[-0.02em] transition-colors group-hover:text-kh-green">{note.title}</span>
                  <span aria-hidden="true" className="hidden text-lg text-kh-green md:block">→</span>
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-10">
              <Link href="/field-notes" className="inline-flex items-center gap-3 border-b border-kh-green pb-1 font-mono text-[9px] tracking-[0.055em] text-kh-green">
                ALL FIELD NOTES <span aria-hidden="true" className="text-base">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-kh-green py-24 text-white">
        <div className="kh-container">
          <Reveal>
            <p className="mb-12 flex justify-between border-b border-white/30 pb-3 font-mono text-[9px] tracking-[0.055em] text-white/70">
              <span>07 / CONTACT</span><span className="text-right">START WITH THE PROBLEM</span>
            </p>
          </Reveal>
          <Reveal>
            <h2 className="max-w-4xl text-5xl font-medium leading-[0.98] tracking-[-0.06em] md:text-7xl">
              WHAT SHOULD<br /><em className="not-italic text-kh-lime">MOVE?</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/80">
              Tell us what isn&apos;t working, what you&apos;re trying to build, or what opportunity you&apos;re exploring.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-wrap gap-6">
              <Link href="/contact" className="inline-flex min-h-12 items-center gap-3 border border-kh-lime bg-kh-lime px-5 font-mono text-[9px] tracking-[0.055em] text-kh-green transition-colors hover:bg-transparent hover:text-kh-lime">
                START A PROJECT <span aria-hidden="true" className="text-base">↗</span>
              </Link>
              <a href="mailto:hello@tkomotions.com" className="inline-flex min-h-12 items-center gap-3 border border-white/40 px-5 font-mono text-[9px] tracking-[0.055em] text-white transition-colors hover:border-kh-lime hover:text-kh-lime">
                HELLO@TKOMOTIONS.COM
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}