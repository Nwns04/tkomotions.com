import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'Partners',
  description:
    'TKO Motions works with organizations, businesses, schools, and technology companies where there is a useful opportunity to collaborate.',
  alternates: { canonical: '/partners' },
};

const areas = [
  'Technology',
  'Education',
  'Innovation',
  'AI',
  'Digital Transformation',
  'Business Systems',
  'Product Development',
];

export default function PartnersPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>PARTNERS</span>
            <span className="text-right">BUILD SOMETHING TOGETHER</span>
          </p>
        </Reveal>
        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            BUILD SOMETHING
            <br />
            <em className="not-italic text-kh-green">TOGETHER.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
            TKO works with organizations, businesses, schools, technology companies and other partners where there is a useful opportunity to collaborate.
          </p>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <Reveal>
          <p className="kh-label mb-8 flex justify-between border-b border-kh-rule pb-3">
            <span>POTENTIAL AREAS</span>
            <span className="text-right">WHERE WE COLLABORATE</span>
          </p>
        </Reveal>
        <ul className="grid gap-0 border-t border-kh-rule md:grid-cols-2">
          {areas.map((area, i) => (
            <Reveal key={area} delay={i * 0.04}>
              <li className="flex items-center justify-between border-b border-kh-rule py-6 md:odd:pr-8 md:even:border-l md:even:border-kh-rule md:even:pl-8">
                <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-lg font-medium tracking-[-0.02em]">{area}</span>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="bg-kh-green py-20 text-white">
        <div className="kh-container">
          <Reveal>
            <p className="mb-12 flex justify-between border-b border-white/30 pb-3 font-mono text-[9px] tracking-[0.055em] text-white/70">
              <span>PARTNER WITH TKO</span>
              <span className="text-right">START A CONVERSATION</span>
            </p>
          </Reveal>
          <Reveal>
            <h2 className="max-w-3xl text-3xl font-medium leading-tight tracking-[-0.05em] md:text-5xl">
              TELL US WHAT YOU&apos;RE WORKING ON
              <br />
              <em className="not-italic text-kh-lime">AND WHERE.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10">
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center gap-3 border border-kh-lime bg-kh-lime px-5 font-mono text-[9px] tracking-[0.055em] text-kh-green transition-colors hover:bg-transparent hover:text-kh-lime"
              >
                START A CONVERSATION
                <span aria-hidden="true" className="text-base">↗</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
