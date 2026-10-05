import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'Lead System — Build 001',
  description: 'A working business lead discovery and outreach system built by TKO Motions.',
  alternates: { canonical: '/work/lead-system' },
};

const sections = [
  {
    number: '01',
    label: 'THE PROBLEM',
    heading: 'Opportunities were getting lost in the handoff.',
    body: [
      'Business development work was happening across spreadsheets, email threads, and memory. New leads were captured in one place, qualified in another, and followed up — or not — based on who remembered.',
      'There was no single view of what was in play, and no clear signal of where a lead had stalled.',
    ],
  },
  {
    number: '02',
    label: 'THE OPPORTUNITY',
    heading: 'One system, one view, one workflow.',
    body: [
      'If the discovery, qualification, and outreach steps could live in a single system, the work could be tracked from first contact to closed deal without manual re-entry.',
    ],
  },
  {
    number: '03',
    label: 'THE SYSTEM',
    heading: 'A lead discovery and outreach platform.',
    body: [
      'The Lead System handles the full lifecycle of a business opportunity: discovering prospects, capturing them into a structured pipeline, tracking status, and supporting outreach.',
      'It replaces ad-hoc spreadsheets with a proper workflow — visible to whoever needs to see it.',
    ],
  },
];

const workflow = [
  { step: '01', title: 'DISCOVER', description: 'Prospects enter the system.' },
  { step: '02', title: 'CAPTURE', description: 'Structured into the pipeline.' },
  { step: '03', title: 'QUALIFY', description: 'Scored and prioritised.' },
  { step: '04', title: 'OUTREACH', description: 'Contact tracked and logged.' },
  { step: '05', title: 'MANAGE', description: 'Status visible to the team.' },
];

const stack = ['Web application', 'Structured pipeline', 'Lead management', 'Outreach tracking'];

export default function LeadSystemPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>WORK / BUILD 001</span>
            <span className="text-right">LIVE SYSTEM</span>
          </p>
        </Reveal>
        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            LEAD
            <br />
            <em className="not-italic text-kh-green">SYSTEM.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
            A working system for discovering and managing business opportunities — built to remove manual tracking and give business development work a single source of truth.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-wrap gap-6 font-mono text-[9px] tracking-[0.055em]">
            <a
              href="https://leaddemo.onrender.com/work/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-3 border border-kh-green bg-kh-green px-4 text-white transition-colors hover:bg-transparent hover:text-kh-green"
            >
              VIEW LIVE SYSTEM
              <span aria-hidden="true" className="text-base">↗</span>
            </a>
            <Link
              href="/work"
              className="inline-flex min-h-11 items-center gap-2 border-b border-kh-rule pb-1 text-kh-ink transition-colors hover:border-kh-green hover:text-kh-green"
            >
              ← ALL WORK
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <Reveal>
          <div className="relative aspect-[16/9] overflow-hidden border border-kh-rule bg-kh-soft">
            <Image
              src="/images/hero/people-candidate.webp"
              alt="Lead System interface preview"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </div>
        </Reveal>
      </section>

      <section className="bg-kh-soft py-10">
        <div className="kh-container">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="font-mono text-[8px] tracking-[0.055em] text-kh-muted">CATEGORY</p>
              <p className="mt-2 text-base font-medium">Business Automation / Lead Intelligence</p>
            </div>
            <div>
              <p className="font-mono text-[8px] tracking-[0.055em] text-kh-muted">STATUS</p>
              <p className="mt-2 text-base font-medium text-kh-green">Live / In active use</p>
            </div>
            <div>
              <p className="font-mono text-[8px] tracking-[0.055em] text-kh-muted">YEAR</p>
              <p className="mt-2 text-base font-medium">2025</p>
            </div>
          </div>
        </div>
      </section>

      <section className="kh-container py-24">
        <div className="grid gap-20 md:gap-32">
          {sections.map((section, index) => (
            <Reveal key={section.number} delay={index * 0.05}>
              <div className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-16">
                <div>
                  <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{section.number}</span>
                  <p className="mt-1 font-mono text-[9px] tracking-[0.055em] text-kh-green">{section.label}</p>
                </div>
                <div>
                  <h2 className="max-w-2xl text-2xl font-medium leading-tight tracking-[-0.03em] md:text-4xl">
                    {section.heading}
                  </h2>
                  <div className="mt-6 grid max-w-2xl gap-4 text-base leading-relaxed text-kh-muted">
                    {section.body.map((paragraph, innerIndex) => (
                      <p key={innerIndex}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-kh-soft py-24">
        <div className="kh-container">
          <Reveal>
            <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
              <span>HOW IT WORKS</span>
              <span className="text-right">FIVE STEPS</span>
            </p>
          </Reveal>
          <Reveal>
            <h2 className="max-w-3xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-5xl">
              FROM DISCOVERY
              <br />
              <em className="not-italic text-kh-green">TO DECISION.</em>
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-5">
            {workflow.map((item, index) => (
              <Reveal key={item.step} delay={index * 0.05}>
                <div className="border-t border-kh-rule pt-5">
                  <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{item.step}</span>
                  <h3 className="mt-2 text-xl font-medium tracking-[-0.03em] text-kh-green">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-kh-muted">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="kh-container py-24">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>TECHNOLOGY</span>
            <span className="text-right">WHAT IT IS BUILT ON</span>
          </p>
        </Reveal>
        <Reveal>
          <div className="flex flex-wrap gap-3">
            {stack.map((item) => (
              <span key={item} className="border border-kh-rule px-4 py-2 font-mono text-[9px] tracking-[0.055em] text-kh-ink">
                {item}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-xl text-sm leading-relaxed text-kh-muted">
            Only technologies genuinely used in the build are listed. No aspirational stacks.
          </p>
        </Reveal>
      </section>

      <section className="bg-kh-green py-24 text-white">
        <div className="kh-container">
          <Reveal>
            <p className="mb-12 flex justify-between border-b border-white/30 pb-3 font-mono text-[9px] tracking-[0.055em] text-white/70">
              <span>OUTCOME</span>
              <span className="text-right">VERIFIED ONLY</span>
            </p>
          </Reveal>
          <Reveal>
            <h2 className="max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-5xl">
              THE SYSTEM IS LIVE
              <br />
              <em className="not-italic text-kh-lime">AND IN ACTIVE USE.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/80">
              Measurable outcomes will be published when they can be verified. Until then, the proof is the working system itself — open and live at the link below.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="kh-container py-24">
        <Reveal>
          <p className="kh-label mb-6 flex justify-between border-b border-kh-rule pb-3">
            <span>LIVE SYSTEM</span>
            <a href="https://leaddemo.onrender.com/work/" target="_blank" rel="noreferrer" className="text-kh-green">
              OPEN FULL SYSTEM ↗
            </a>
          </p>
        </Reveal>
        <Reveal>
          <div className="relative overflow-hidden border border-kh-rule bg-kh-soft">
            <iframe
              src="https://leaddemo.onrender.com/work/"
              title="Lead System live preview"
              loading="lazy"
              className="block h-[600px] w-full border-0 bg-[#f1f2ed]"
            />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 text-sm text-kh-muted">
            Live embed. If the frame does not load, open the system directly using the link above.
          </p>
        </Reveal>
      </section>

      <section className="bg-kh-soft py-20">
        <div className="kh-container">
          <Reveal>
            <p className="kh-label mb-10 flex justify-between border-b border-kh-rule pb-3">
              <span>NEXT</span>
              <span className="text-right">SEE MORE OR START</span>
            </p>
          </Reveal>
          <Reveal>
            <div className="flex flex-wrap gap-6">
              <Link
                href="/work"
                className="inline-flex min-h-12 items-center gap-3 border border-kh-green px-5 font-mono text-[9px] tracking-[0.055em] text-kh-green transition-colors hover:bg-kh-green hover:text-white"
              >
                ← ALL WORK
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center gap-3 border border-kh-green bg-kh-green px-5 font-mono text-[9px] tracking-[0.055em] text-white transition-colors hover:bg-transparent hover:text-kh-green"
              >
                START A PROJECT
                <span aria-hidden="true" className="text-base">↗</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
