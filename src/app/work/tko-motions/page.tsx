import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'TKO Motions Platform — Build 002',
  description: 'The TKO Motions digital platform and company system, built in-house.',
  alternates: { canonical: '/work/tko-motions' },
};

const sections = [
  {
    number: '01',
    label: 'THE PROBLEM',
    heading: 'A company site that had to feel like the company.',
    body: [
      'Most agency and consultancy websites are brochures: pretty pictures, invented metrics, and no way to see the actual work.',
      'TKO needed a site that said what the company actually does, and backed it up with live systems instead of claims.',
    ],
  },
  {
    number: '02',
    label: 'THE OPPORTUNITY',
    heading: 'A platform that is itself proof of the work.',
    body: [
      'If the site were built the same way TKO builds client systems — purposeful, performant, maintainable — it would be its own case study.',
    ],
  },
  {
    number: '03',
    label: 'THE SYSTEM',
    heading: 'A modern, editorially-driven company platform.',
    body: [
      'A marketing site with a custom CMS for Field Notes, live system previews, and a project intake flow.',
      'Designed and built as a foundation that can grow with the company — new products, new case studies, new pages.',
    ],
  },
];

const workflow = [
  { step: '01', title: 'STRUCTURE', description: 'Routes and content model.' },
  { step: '02', title: 'DESIGN', description: 'Editorial, mono, technical.' },
  { step: '03', title: 'BUILD', description: 'Next.js, Tailwind, GSAP.' },
  { step: '04', title: 'CONTENT', description: 'Field Notes MDX pipeline.' },
  { step: '05', title: 'LAUNCH', description: 'Live and iterating.' },
];

const stack = ['Next.js App Router', 'TypeScript', 'Tailwind CSS', 'Velite / MDX', 'GSAP + ScrollTrigger', 'Lenis'];

export default function TKOMotionsCaseStudy() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>WORK / BUILD 002</span>
            <span className="text-right">LIVE SYSTEM</span>
          </p>
        </Reveal>
        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            TKO
            <br />
            <em className="not-italic text-kh-green">MOTIONS.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
            The TKO Motions digital platform and company system — the site you are on now.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-wrap gap-6 font-mono text-[9px] tracking-[0.055em]">
            <a
              href="https://tkomotions.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-3 border border-kh-green bg-kh-green px-4 text-white transition-colors hover:bg-transparent hover:text-kh-green"
            >
              VIEW LIVE
              <span aria-hidden="true" className="text-base">↗</span>
            </a>
            <Link href="/work" className="inline-flex min-h-11 items-center gap-2 border-b border-kh-rule pb-1 text-kh-ink transition-colors hover:border-kh-green hover:text-kh-green">
              ← ALL WORK
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <Reveal>
          <div className="relative aspect-[16/9] overflow-hidden border border-kh-rule bg-kh-soft">
            <Image src="/images/hero/city-lagos-wide.webp" alt="Lagos skyline, standing in for the TKO Motions platform preview." fill sizes="100vw" className="object-cover" priority />
          </div>
        </Reveal>
      </section>

      <section className="bg-kh-soft py-10">
        <div className="kh-container">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="font-mono text-[8px] tracking-[0.055em] text-kh-muted">CATEGORY</p>
              <p className="mt-2 text-base font-medium">Corporate Platform</p>
            </div>
            <div>
              <p className="font-mono text-[8px] tracking-[0.055em] text-kh-muted">STATUS</p>
              <p className="mt-2 text-base font-medium text-kh-green">Live / Iterating</p>
            </div>
            <div>
              <p className="font-mono text-[8px] tracking-[0.055em] text-kh-muted">YEAR</p>
              <p className="mt-2 text-base font-medium">2026</p>
            </div>
          </div>
        </div>
      </section>

      <section className="kh-container py-24">
        <div className="grid gap-20 md:gap-32">
          {sections.map((section, i) => (
            <Reveal key={section.number} delay={i * 0.05}>
              <div className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-16">
                <div>
                  <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{section.number}</span>
                  <p className="mt-1 font-mono text-[9px] tracking-[0.055em] text-kh-green">{section.label}</p>
                </div>
                <div>
                  <h2 className="max-w-2xl text-2xl font-medium leading-tight tracking-[-0.03em] md:text-4xl">{section.heading}</h2>
                  <div className="mt-6 grid max-w-2xl gap-4 text-base leading-relaxed text-kh-muted">
                    {section.body.map((para) => (
                      <p key={para}>{para}</p>
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
              <span className="text-right">FIVE PHASES</span>
            </p>
          </Reveal>
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-5">
            {workflow.map((item, i) => (
              <Reveal key={item.step} delay={i * 0.05}>
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
              <span key={item} className="border border-kh-rule px-4 py-2 font-mono text-[9px] tracking-[0.055em] text-kh-ink">{item}</span>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="bg-kh-soft py-20">
        <div className="kh-container">
          <Reveal>
            <div className="flex flex-wrap gap-6">
              <Link href="/work" className="inline-flex min-h-12 items-center gap-3 border border-kh-green px-5 font-mono text-[9px] tracking-[0.055em] text-kh-green transition-colors hover:bg-kh-green hover:text-white">
                ← ALL WORK
              </Link>
              <Link href="/contact" className="inline-flex min-h-12 items-center gap-3 border border-kh-green bg-kh-green px-5 font-mono text-[9px] tracking-[0.055em] text-white transition-colors hover:bg-transparent hover:text-kh-green">
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
