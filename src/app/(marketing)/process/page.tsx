import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'Process',
  description: 'A practical process for finding friction, defining the right objective, and building a digital system that supports the work.',
  alternates: { canonical: '/process' },
};

const steps = [
  {
    index: '01',
    title: 'FIND',
    summary: 'Understand the business, the users, and the friction.',
    body: 'We start by mapping the work, observing where effort is lost, and identifying the actual pressures that need relief.',
  },
  {
    index: '02',
    title: 'DEFINE',
    summary: 'Turn the problem into a clear system and measurable objective.',
    body: 'Once the pain point is clear, we define the change we want and identify how success will be measured.',
  },
  {
    index: '03',
    title: 'DESIGN',
    summary: 'Shape the experience, workflow, and technical direction.',
    body: 'We design the product or system around the user journey, operational realities, and the information it needs to support.',
  },
  {
    index: '04',
    title: 'BUILD',
    summary: 'Develop, integrate, test, and refine the solution.',
    body: 'We turn the design into a working system, connect it to the tools that matter, and test for clarity and reliability.',
  },
  {
    index: '05',
    title: 'MOVE',
    summary: 'Deploy, improve, and help the solution create measurable value.',
    body: 'After release, we watch how the system performs in use, tighten the edges, and plan the next improvement cycle.',
  },
];

export default function ProcessPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>PROCESS / HOW WE MOVE</span>
            <span className="text-right">FROM FRICTION TO FUNCTION</span>
          </p>
        </Reveal>

        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            WE DO NOT BEGIN
            <br />
            WITH THE TOOL.
            <br />
            WE BEGIN WITH <em className="not-italic text-kh-green">THE PROBLEM.</em>
          </h1>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted md:text-xl">
            Our process keeps the work tied to the real business context so every decision is shaped by the outcome, not just the technology.
          </p>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <div className="grid gap-8">
          {steps.map((step, index) => (
            <Reveal key={step.index} delay={index * 0.05}>
              <article className="grid gap-6 border-t border-kh-rule py-8 md:grid-cols-[140px_1fr_1.2fr] md:items-start">
                <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{step.index}</span>

                <div>
                  <h2 className="text-3xl font-medium tracking-[-0.04em] md:text-5xl">{step.title}</h2>
                  <p className="mt-3 text-base leading-relaxed text-kh-muted md:text-lg">{step.summary}</p>
                </div>

                <p className="text-base leading-relaxed text-kh-ink md:text-lg">{step.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-kh-soft py-20">
        <div className="kh-container">
          <Reveal>
            <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
              <span>OUTCOME</span>
              <span className="text-right">A BETTER SYSTEM, NOT MORE NOISE</span>
            </p>
          </Reveal>

          <Reveal>
            <h2 className="max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">
              THE GOAL IS NEVER
              <br />
              <em className="not-italic text-kh-green">MORE COMPLEXITY.</em>
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
              It is a clearer process, a cleaner system, and a digital capability that helps the business move with less friction and more confidence.
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="mt-10">
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 border-b border-kh-green pb-1 font-mono text-[9px] tracking-[0.055em] text-kh-green"
              >
                START A PROJECT
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
