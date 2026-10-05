import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'Capabilities',
  description: 'Software, AI, automation, business systems, digital products and innovation. What TKO Motions builds.',
  alternates: { canonical: '/capabilities' },
};

const capabilities = [
  {
    id: 'software',
    number: '01',
    title: 'SOFTWARE & DIGITAL PRODUCTS',
    intro: 'Custom web applications and business software — built around how the work actually happens.',
    body: 'We design and build products that fit the workflow, not the other way around. That means starting from the process, deciding what belongs in the software, and only then choosing the technology.',
    examples: ['Business dashboards', 'Customer portals', 'Internal tools', 'Workflow systems', 'Management platforms', 'APIs and integrations'],
  },
  {
    id: 'ai',
    number: '02',
    title: 'AI & INTELLIGENT SYSTEMS',
    intro: 'Practical AI systems built around real business workflows — not experiments looking for a problem.',
    body: 'AI is useful where it removes real work: answering the same question repeatedly, extracting structured data from documents, or surfacing what matters from a large body of information. We build for those cases.',
    examples: ['AI assistants', 'Knowledge assistants', 'RAG systems', 'Document intelligence', 'Automated responses', 'AI-powered search'],
  },
  {
    id: 'automation',
    number: '03',
    title: 'BUSINESS AUTOMATION',
    intro: 'Reduce repetitive work by connecting the tools a business already uses.',
    body: 'Most businesses do not need more software. They need the software they already have to talk to itself. We build the connections that remove manual re-entry, waiting, and handoff failures.',
    examples: ['WhatsApp and messaging', 'Email workflows', 'Payment systems', 'CRMs and databases', 'APIs and webhooks', 'Scheduled processes'],
  },
  {
    id: 'experience',
    number: '04',
    title: 'DIGITAL EXPERIENCES',
    intro: 'Websites and interfaces designed around how people actually interact with a business.',
    body: 'A website is not a brochure. It is the first working interface between a business and its customers. We design for clarity, trust, and action — not decoration.',
    examples: ['Marketing websites', 'Product interfaces', 'Customer journeys', 'Design systems', 'Content platforms'],
  },
  {
    id: 'systems',
    number: '05',
    title: 'BUSINESS SYSTEMS',
    intro: 'Build the infrastructure behind everyday business operations.',
    body: 'When off-the-shelf software does not fit the way a business runs, we build the system that does. CRM, inventory, operations, payments — designed around the actual work.',
    examples: ['CRM and lead management', 'Inventory and operations', 'Payment systems', 'Reporting and analytics', 'Customer management', 'Communication systems'],
  },
  {
    id: 'innovation',
    number: '06',
    title: 'INNOVATION & PROTOTYPING',
    intro: "When the solution does not exist yet, we prototype, test, and build it.",
    body: 'Some problems do not have a known answer. For those, we work in short cycles: understand the problem, build the smallest useful version, test it, and decide what to do next.',
    examples: ['Concept prototyping', 'Technical feasibility', 'Product discovery', 'Pilot builds', 'Experiment design'],
  },
];

export default function CapabilitiesPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>CAPABILITIES</span>
            <span className="text-right">WHAT WE BUILD</span>
          </p>
        </Reveal>
        <Reveal>
          <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            THE TOOL
            <br />
            FOLLOWS THE <em className="not-italic text-kh-green">NEED.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
            Six areas of work. One approach: start from the problem, not from the technology.
          </p>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <div className="grid gap-24">
          {capabilities.map((capability) => (
            <article key={capability.id} id={capability.id} className="scroll-mt-24 border-t border-kh-rule pt-10">
              <Reveal>
                <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{capability.number}</span>
                <h2 className="mt-3 max-w-3xl text-3xl font-medium leading-tight tracking-[-0.04em] md:text-5xl">
                  {capability.title}
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-kh-ink">{capability.intro}</p>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-kh-muted">{capability.body}</p>
              </Reveal>
              <Reveal delay={0.05}>
                <div className="mt-10">
                  <p className="mb-4 font-mono text-[9px] tracking-[0.055em] text-kh-muted">EXAMPLES</p>
                  <ul className="grid gap-2 md:grid-cols-2">
                    {capability.examples.map((example) => (
                      <li key={example} className="flex items-baseline gap-3 text-base text-kh-muted">
                        <span className="font-mono text-[9px] text-kh-green">—</span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="mt-10">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-3 border-b border-kh-green pb-1 font-mono text-[9px] tracking-[0.055em] text-kh-green"
                  >
                    DISCUSS THIS
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-kh-green py-20 text-white">
        <div className="kh-container">
          <Reveal>
            <p className="mb-12 flex justify-between border-b border-white/30 pb-3 font-mono text-[9px] tracking-[0.055em] text-white/70">
              <span>NEXT</span>
              <span className="text-right">START WITH THE PROBLEM</span>
            </p>
          </Reveal>
          <Reveal>
            <h2 className="max-w-3xl text-4xl font-medium leading-[1] tracking-[-0.06em] md:text-6xl">
              NOT SURE WHICH
              <br />
              <em className="not-italic text-kh-lime">YOU NEED?</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/80">
              That is usually the right starting point. Tell us what is happening, and we will figure out what kind of solution makes sense.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
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
