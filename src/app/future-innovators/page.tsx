import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'Future Innovators',
  description: 'Coding, artificial intelligence and robotics programmes for schools, delivered by TKO Motions.',
  alternates: { canonical: '/future-innovators' },
};

const programmes = [
  {
    number: '01',
    title: 'CODING',
    description: 'Build digital foundations through practical projects — from first lines of code to working software.',
  },
  {
    number: '02',
    title: 'ARTIFICIAL INTELLIGENCE',
    description: 'Understand how AI works and how it can be applied to real problems.',
  },
  {
    number: '03',
    title: 'ROBOTICS',
    description: 'Move from software concepts into physical systems that sense and respond.',
  },
  {
    number: '04',
    title: 'INNOVATION',
    description: 'Learn how to identify problems and turn ideas into solutions.',
  },
];

export default function FutureInnovatorsPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>FUTURE INNOVATORS</span>
            <span className="text-right">EDUCATION / INNOVATION</span>
          </p>
        </Reveal>
        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            CODING. AI.
            <br />
            <em className="not-italic text-kh-green">ROBOTICS.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
            TKO Motions works with educational institutions to introduce practical technology and innovation experiences for students.
          </p>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <Reveal>
          <p className="kh-label mb-8 flex justify-between border-b border-kh-rule pb-3">
            <span>PROGRAMME AREAS</span>
            <span className="text-right">FOUR PATHS</span>
          </p>
        </Reveal>
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          {programmes.map((item, i) => (
            <Reveal key={item.number} delay={i * 0.05}>
              <article className="border-t border-kh-rule pt-6">
                <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{item.number}</span>
                <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-kh-green md:text-3xl">{item.title}</h2>
                <p className="mt-4 max-w-md text-base leading-relaxed text-kh-muted">{item.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-kh-soft py-20">
        <div className="kh-container">
          <Reveal>
            <p className="kh-label mb-8 flex justify-between border-b border-kh-rule pb-3">
              <span>FOR SCHOOLS</span>
              <span className="text-right">DISCUSS A PROGRAMME</span>
            </p>
          </Reveal>
          <Reveal>
            <h2 className="max-w-3xl text-3xl font-medium leading-tight tracking-[-0.05em] md:text-5xl">
              BRING PRACTICAL TECHNOLOGY
              <br />
              <em className="not-italic text-kh-green">INTO THE CLASSROOM.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10">
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center gap-3 border border-kh-green bg-kh-green px-5 font-mono text-[9px] tracking-[0.055em] text-white transition-colors hover:bg-transparent hover:text-kh-green"
              >
                DISCUSS A SCHOOL PROGRAMME
                <span aria-hidden="true" className="text-base">↗</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
