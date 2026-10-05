import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'TaxBot Naija — Product',
  description: 'A WhatsApp-first Nigerian tax assistant combining tax information, calculations and AI-assisted guidance.',
  alternates: { canonical: '/work/taxbot-naija' },
};

const sections = [
  {
    number: '01',
    label: 'THE PROBLEM',
    heading: 'Tax questions are frequent, personal, and slow to answer.',
    body: [
      'Small business owners and individuals in Nigeria regularly need quick, clear answers about tax — what applies, what to file, and how much.',
      'Getting those answers usually means searching across scattered sources, or waiting for someone to respond.',
    ],
  },
  {
    number: '02',
    label: 'THE OPPORTUNITY',
    heading: 'Meet people where they already are.',
    body: [
      'WhatsApp is the default communication layer in Nigeria. A tax assistant that lives there removes the friction of downloading an app or finding a website.',
    ],
  },
  {
    number: '03',
    label: 'THE SYSTEM',
    heading: 'A WhatsApp-first tax assistant.',
    body: [
      'TaxBot Naija combines reference information, basic tax calculations, and AI-assisted guidance into a conversation interface.',
      'The user asks a question in WhatsApp and gets a structured answer — with the option to go deeper.',
    ],
  },
];

const workflow = [
  { step: '01', title: 'ASK', description: 'User sends a question via WhatsApp.' },
  { step: '02', title: 'PARSE', description: 'Intent and entity extraction.' },
  { step: '03', title: 'RETRIEVE', description: 'Reference data and rules.' },
  { step: '04', title: 'RESPOND', description: 'Structured answer returned.' },
  { step: '05', title: 'ITERATE', description: 'Learn from real questions.' },
];

const stack = ['WhatsApp Business API', 'AI-assisted guidance', 'Tax reference data', 'Calculation engine'];

export default function TaxBotCaseStudy() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>WORK / PRODUCT 003</span>
            <span className="text-right">TKO PRODUCT</span>
          </p>
        </Reveal>
        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            TAXBOT
            <br />
            <em className="not-italic text-kh-green">NAIJA.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
            A WhatsApp-first Nigerian tax assistant combining tax information, calculations and AI-assisted guidance.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-wrap gap-6 font-mono text-[9px] tracking-[0.055em]">
            <a
              href="https://taxbotnaija.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-3 border border-kh-green bg-kh-green px-4 text-white transition-colors hover:bg-transparent hover:text-kh-green"
            >
              EXPLORE PRODUCT
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
            <Image src="/images/hero/compute-wide.webp" alt="Server racks, standing in for the TaxBot Naija preview." fill sizes="100vw" className="object-cover" priority />
          </div>
        </Reveal>
      </section>

      <section className="bg-kh-soft py-10">
        <div className="kh-container">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="font-mono text-[8px] tracking-[0.055em] text-kh-muted">CATEGORY</p>
              <p className="mt-2 text-base font-medium">TKO Product / WhatsApp AI</p>
            </div>
            <div>
              <p className="font-mono text-[8px] tracking-[0.055em] text-kh-muted">STATUS</p>
              <p className="mt-2 text-base font-medium text-kh-green">Live</p>
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
              <span className="text-right">FIVE STEPS</span>
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

      <section className="bg-kh-green py-20 text-white">
        <div className="kh-container">
          <Reveal>
            <p className="mb-12 flex justify-between border-b border-white/30 pb-3 font-mono text-[9px] tracking-[0.055em] text-white/70">
              <span>PRODUCT / LIVE</span>
              <span className="text-right">OPEN TO EXPLORE</span>
            </p>
          </Reveal>
          <Reveal>
            <h2 className="max-w-3xl text-3xl font-medium leading-tight tracking-[-0.05em] md:text-5xl">
              TRY IT
              <br />
              <em className="not-italic text-kh-lime">FOR YOURSELF.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10">
              <a
                href="https://taxbotnaija.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center gap-3 border border-kh-lime bg-kh-lime px-5 font-mono text-[9px] tracking-[0.055em] text-kh-green transition-colors hover:bg-transparent hover:text-kh-lime"
              >
                OPEN TAXBOT NAIJA
                <span aria-hidden="true" className="text-base">↗</span>
              </a>
            </div>
          </Reveal>
        </div>
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
