import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Common questions about working with TKO Motions — what we do, how we start, and what kind of projects we take on.',
  alternates: { canonical: '/faq' },
};

const faqs = [
  {
    q: 'What does TKO Motions do?',
    a: 'TKO Motions builds digital products, software, AI solutions, automation and business systems designed to solve practical business problems.',
  },
  {
    q: 'Do you only build websites?',
    a: 'No. Websites are one part of what we do. We also build software applications, automation, AI systems, APIs, integrations and business tools.',
  },
  {
    q: 'Can you build a system from scratch?',
    a: 'Yes. Projects can start from an idea, an existing manual process or an existing system that needs improvement.',
  },
  {
    q: 'Can you improve an existing application?',
    a: 'Yes. We can assess an existing system and work on improvements, integrations, redesign, performance or new functionality.',
  },
  {
    q: 'Do you work with small businesses?',
    a: 'Yes. The appropriate solution depends on the problem, scope and available resources.',
  },
  {
    q: 'Do you build AI products?',
    a: 'Yes. AI can be incorporated into products and business workflows where it provides a practical advantage.',
  },
  {
    q: 'Do you work with businesses outside Nigeria?',
    a: 'Where appropriate, TKO can work with organizations outside Nigeria.',
  },
  {
    q: 'How much does a project cost?',
    a: 'There is no single fixed price. Cost depends on scope, complexity, integrations, timeline and ongoing requirements.',
  },
  {
    q: 'How do we start?',
    a: 'Send a project brief through the contact page. The first conversation is about understanding the problem.',
  },
];

export default function FAQPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <Reveal>
          <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
            <span>FAQ</span>
            <span className="text-right">COMMON QUESTIONS</span>
          </p>
        </Reveal>
        <Reveal>
          <h1 className="max-w-4xl text-5xl font-medium leading-[0.95] tracking-[-0.07em] md:text-7xl">
            QUESTIONS,
            <br />
            <em className="not-italic text-kh-green">ANSWERED.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-kh-muted">
            If your question is not here, ask directly — that is usually the fastest way.
          </p>
        </Reveal>
      </section>

      <section className="kh-container pb-24">
        <Accordion type="single" collapsible className="border-t border-kh-rule">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`faq-${index}`} className="border-b border-kh-rule">
              <AccordionTrigger className="py-6 text-left text-lg font-medium tracking-[-0.02em] hover:no-underline md:text-xl">
                <span className="flex gap-4">
                  <span className="font-mono text-[9px] font-normal tracking-[0.055em] text-kh-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {faq.q}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-base leading-relaxed text-kh-muted md:pl-9">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="bg-kh-soft py-20">
        <div className="kh-container">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-8">
              <h2 className="max-w-2xl text-3xl font-medium leading-tight tracking-[-0.05em] md:text-5xl">
                STILL HAVE A QUESTION?
              </h2>
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center gap-3 border border-kh-green bg-kh-green px-5 font-mono text-[9px] tracking-[0.055em] text-white transition-colors hover:bg-transparent hover:text-kh-green"
              >
                ASK DIRECTLY
                <span aria-hidden="true" className="text-base">↗</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
