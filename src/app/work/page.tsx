import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Live systems built by TKO Motions. No invented case studies — only what we can show.',
  alternates: { canonical: '/work' },
};

const projects = [
  {
    number: '001',
    name: 'LEAD SYSTEM',
    category: 'BUSINESS AUTOMATION / LEAD INTELLIGENCE',
    description:
      'A working system for discovering and managing business opportunities — built to remove manual tracking and give sales work a single source of truth.',
    preview: '/images/hero/people-candidate.webp',
    liveUrl: 'https://leaddemo.onrender.com/work/',
    href: '/work/lead-system',
    status: 'LIVE',
  },
  {
    number: '002',
    name: 'TKO MOTIONS',
    category: 'CORPORATE PLATFORM',
    description: 'The TKO Motions digital platform and company system — the site you are on now.',
    preview: '/images/hero/city-lagos-wide.webp',
    liveUrl: 'https://tkomotions.com',
    href: '/work/tko-motions',
    status: 'LIVE',
  },
  {
    number: '003',
    name: 'TAXBOT NAIJA',
    category: 'TKO PRODUCT / WHATSAPP AI',
    description:
      'A WhatsApp-first Nigerian tax assistant combining tax information, calculations and AI-assisted guidance.',
    preview: '/images/hero/compute-wide.webp',
    liveUrl: 'https://taxbotnaija.com',
    href: '/work/taxbot-naija',
    status: 'LIVE',
  },
];

export default function WorkPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>WORK</span>
            <span className="text-right">BUILT · LIVE · OPEN</span>
          </p>
        </Reveal>
        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            THE WORK
            <br />
            IS THE <em className="not-italic text-kh-green">PROOF.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
            Real systems, live and open to explore. No invented metrics, no polished mockups standing in for the actual thing.
          </p>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <div className="border-t border-kh-rule">
          {projects.map((project, index) => (
            <Reveal key={project.number} delay={index * 0.05}>
              <article className="group grid gap-8 border-b border-kh-rule py-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
                <Link href={project.href} className="relative block aspect-[16/10] overflow-hidden bg-kh-soft">
                  <Image
                    src={project.preview}
                    alt={`${project.name} preview`}
                    fill
                    sizes="(max-width: 768px) 100vw, 45vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute top-4 left-4 border border-white/60 bg-white/85 px-2.5 py-1 font-mono text-[8px] tracking-[0.055em] text-kh-green backdrop-blur-sm">
                    {project.status}
                  </span>
                </Link>

                <div className="flex flex-col">
                  <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">BUILD / {project.number}</span>
                  <Link href={project.href}>
                    <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em] transition-colors group-hover:text-kh-green md:text-4xl">
                      {project.name}
                    </h2>
                  </Link>
                  <p className="mt-2 font-mono text-[8px] tracking-[0.055em] text-kh-muted">{project.category}</p>
                  <p className="mt-5 max-w-lg text-base leading-relaxed text-kh-muted">{project.description}</p>

                  <div className="mt-auto flex flex-wrap gap-6 pt-8 font-mono text-[9px] tracking-[0.055em]">
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 border-b border-kh-green pb-1 text-kh-green"
                    >
                      VIEW LIVE
                      <span aria-hidden="true">↗</span>
                    </a>
                    <Link
                      href={project.href}
                      className="inline-flex items-center gap-2 border-b border-kh-rule pb-1 text-kh-ink transition-colors hover:border-kh-green hover:text-kh-green"
                    >
                      READ CASE STUDY
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-kh-soft py-20">
        <div className="kh-container">
          <Reveal>
            <p className="kh-label mb-10 flex justify-between border-b border-kh-rule pb-3">
              <span>NEXT</span>
              <span className="text-right">START SOMETHING</span>
            </p>
          </Reveal>
          <Reveal>
            <h2 className="max-w-3xl text-4xl font-medium leading-[1] tracking-[-0.06em] md:text-5xl">
              HAVE SOMETHING THAT NEEDS TO MOVE?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8">
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
