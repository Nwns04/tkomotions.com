import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Build with TKO Motions. We are interested in people who enjoy solving problems, learning quickly, and building useful things.',
  alternates: { canonical: '/careers' },
};

const areas = [
  'Software Engineering',
  'Product Design',
  'AI / Machine Learning',
  'Robotics',
  'Product Management',
  'Business Development',
  'Content & Media',
];

export default function CareersPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>CAREERS</span>
            <span className="text-right">BUILD WITH US</span>
          </p>
        </Reveal>
        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            BUILD
            <br />
            WITH <em className="not-italic text-kh-green">US.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
            We are interested in people who enjoy solving problems, learning quickly, and building useful things.
          </p>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <Reveal>
          <p className="kh-label mb-8 flex justify-between border-b border-kh-rule pb-3">
            <span>POTENTIAL AREAS</span>
            <span className="text-right">SEVEN DIRECTIONS</span>
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

      <section className="bg-kh-soft py-20">
        <div className="kh-container">
          <Reveal>
            <p className="kh-label mb-8 flex justify-between border-b border-kh-rule pb-3">
              <span>OPENINGS</span>
              <span className="text-right">CURRENT STATUS</span>
            </p>
          </Reveal>
          <Reveal>
            <h2 className="max-w-3xl text-3xl font-medium leading-tight tracking-[-0.05em] md:text-5xl">
              NO OPEN POSITIONS
              <br />
              <em className="not-italic text-kh-muted">RIGHT NOW.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-kh-muted">
              We are not actively hiring, but we keep profiles on file. If you build things and solve problems, send yours.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10">
              <a
                href="mailto:temitopekehinde@tkomotions.com?subject=Profile%20submission"
                className="inline-flex min-h-12 items-center gap-3 border border-kh-green bg-kh-green px-5 font-mono text-[9px] tracking-[0.055em] text-white transition-colors hover:bg-transparent hover:text-kh-green"
              >
                SEND YOUR PROFILE
                <span aria-hidden="true" className="text-base">↗</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="kh-container py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <h2 className="max-w-2xl text-3xl font-medium leading-tight tracking-[-0.05em] md:text-5xl">
              NOT LOOKING FOR A JOB, BUT HAVE AN IDEA?
            </h2>
            <Link
              href="/partners"
              className="inline-flex min-h-12 items-center gap-3 border border-kh-green px-5 font-mono text-[9px] tracking-[0.055em] text-kh-green transition-colors hover:bg-kh-green hover:text-white"
            >
              PARTNER WITH US
              <span aria-hidden="true" className="text-base">→</span>
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
