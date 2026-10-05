import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'About',
  description: 'TKO Motions helps businesses find the right problem, design a practical response, and build the system that moves work forward.',
  alternates: { canonical: '/about' },
};

const principles = [
  {
    index: '01',
    title: 'START WITH THE WORK',
    body: 'We study the actual operations, bottlenecks, and opportunities before deciding what to build.',
  },
  {
    index: '02',
    title: 'DEFINE THE PROBLEM CLEARLY',
    body: 'The right solution starts with a precise objective, a defined audience, and a measurable outcome.',
  },
  {
    index: '03',
    title: 'BUILD FOR USE',
    body: 'We design systems around the realities of people, teams, and the work they need to do every day.',
  },
];

const values = [
  'Business context before technology choices.',
  'Clear thinking over flashy solutions.',
  'Practical systems that hold up under real use.',
  'Work designed for the people behind the process.',
];

export default function AboutPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>ABOUT / TKO MOTIONS LTD</span>
            <span className="text-right">BUSINESS INNOVATION</span>
          </p>
        </Reveal>

        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            WE HELP BUSINESSES
            <br />
            FIND THE <em className="not-italic text-kh-green">RIGHT PROBLEM</em>
            <br />
            AND BUILD THE <em className="not-italic text-kh-green">RIGHT SOLUTION.</em>
          </h1>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted md:text-xl">
            TKO Motions is a Nigerian business innovation and digital solutions company working across software,
            AI, automation, and digital product thinking.
          </p>
        </Reveal>
      </section>

      <section className="bg-kh-soft py-20">
        <div className="kh-container">
          <Reveal>
            <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
              <span>01 / APPROACH</span>
              <span className="text-right">HOW WE WORK</span>
            </p>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {principles.map((principle, index) => (
              <Reveal key={principle.index} delay={index * 0.06}>
                <article className="border-t border-kh-rule pt-6">
                  <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{principle.index}</span>
                  <h2 className="mt-4 text-2xl font-medium tracking-[-0.04em] text-kh-ink">{principle.title}</h2>
                  <p className="mt-3 text-base leading-relaxed text-kh-muted">{principle.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="kh-container py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <Reveal>
            <div>
              <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
                <span>02 / COMPANY</span>
                <span className="text-right">OUR POSITION</span>
              </p>

              <p className="max-w-2xl text-xl leading-relaxed text-kh-ink md:text-2xl">
                We believe useful technology is not about adding complexity for its own sake. It is about noticing the friction,
                designing a better way through it, and making sure the system delivers value in the real world.
              </p>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-kh-muted">
                Our work sits at the intersection of business thinking, design, and engineering. We help teams uncover what matters,
                translate that into a plan, and then build what actually moves the work forward.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="rounded-none border border-kh-rule bg-kh-soft p-8">
              <p className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">WHAT WE VALUE</p>
              <ul className="mt-7 space-y-4">
                {values.map((value) => (
                  <li key={value} className="flex items-start gap-3 border-t border-kh-rule pt-4 text-base leading-relaxed text-kh-ink">
                    <span className="mt-1 font-mono text-[9px] text-kh-green">—</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-kh-green py-20 text-white">
        <div className="kh-container">
          <Reveal>
            <p className="mb-12 flex justify-between border-b border-white/30 pb-3 font-mono text-[9px] tracking-[0.055em] text-white/70">
              <span>NEXT</span>
              <span className="text-right">START WITH THE FACTS</span>
            </p>
          </Reveal>
          <Reveal>
            <h2 className="max-w-3xl text-4xl font-medium leading-[1] tracking-[-0.06em] md:text-6xl">
              IF THERE IS A
              <br />
              <em className="not-italic text-kh-lime">BUSINESS PROBLEM</em>
              <br />
              WE CAN HELP FRAME IT.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-10">
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center gap-3 border border-kh-lime bg-kh-lime px-5 font-mono text-[9px] tracking-[0.055em] text-kh-green transition-colors hover:bg-transparent hover:text-kh-lime"
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
