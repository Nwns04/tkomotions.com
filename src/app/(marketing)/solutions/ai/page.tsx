import type { Metadata } from 'next';
import { solutions } from '@/lib/ai-packages';
import Image from 'next/image';
import Link from 'next/link';
import { AIPackagePricing, type AiAddOn, type AiCustomSystem, type AiMarketingOffer } from '@/components/ai-solutions/AIPackagePricing';
import { AISalesDemo } from '@/components/sales-engine/AISalesDemo';

export const metadata: Metadata = {
  title: 'AI Business Solutions',
  description: 'Practical AI assistants and business systems for customer enquiries, sales and everyday operations.',
  alternates: { canonical: '/solutions/ai' },
};


const customSystem: AiCustomSystem = {
  "name": "CUSTOM AI SYSTEMS",
  "setupNgn": 1500000,
  "description": "For organizations that need a system designed around advanced workflows, existing software and specific business requirements.",
  "includes": [
    "Multiple AI agents",
    "Custom APIs",
    "CRM/ERP integrations",
    "Internal systems",
    "Advanced dashboards",
    "Document automation",
    "Complex workflows",
    "Role-based access",
    "Custom business logic"
  ]
};

const marketingOffers: AiMarketingOffer[] = [
  {
    "name": "Marketing Launch",
    "priceNgn": 50000,
    "description": "Set up a focused campaign to introduce your business and collect enquiries.",
    "features": [
      "Campaign strategy",
      "Ad copy",
      "Creative direction",
      "Campaign setup",
      "Landing/customer page",
      "Basic tracking"
    ]
  },
  {
    "name": "Monthly Ad Management",
    "priceNgn": 30000,
    "monthly": true,
    "description": "Ongoing management of your advertising campaigns."
  }
];

const addOns: AiAddOn[] = [
  { name: 'WhatsApp integration', priceNgn: 75000 },
  { name: 'Additional AI agent', priceNgn: 100000 },
  { name: 'CRM setup', priceNgn: 75000 },
  { name: 'Appointment or booking system', priceNgn: 75000 },
  { name: 'Custom dashboard', priceNgn: 100000 },
  { name: 'Document / RAG knowledge base', priceNgn: 100000 },
  { name: 'Custom API integration', priceNgn: 100000 },
  { name: 'Payment integration', priceNgn: 75000 },
  { name: 'Advanced workflow', priceNgn: 100000 },
  { name: 'Additional business location', priceNgn: 50000 },
  { name: 'Staff training', priceNgn: 50000 },
  { name: 'Custom reporting', priceNgn: 75000 },
];

const industries = [
  { name: 'Fashion & social commerce', detail: 'Turn repetitive product questions into qualified buying conversations.' },
  { name: 'Gadget sellers', detail: 'Answer product questions and capture availability and purchase enquiries.' },
  { name: 'Service businesses', detail: 'Collect job requirements before your team responds.' },
  { name: 'Professional services', detail: 'Capture enquiries and gather context before a consultation.' },
  { name: 'Real estate', detail: 'Qualify property enquiries and identify serious buyers.' },
  { name: 'Hospitality', detail: 'Handle common booking and service questions.' },
  { name: 'Education', detail: 'Help prospective students and parents navigate admissions enquiries.' },
  { name: 'Ecommerce', detail: 'Guide shoppers through common questions and capture buying intent.' },
  { name: 'Logistics', detail: 'Collect delivery and service details before the team follows up.' },
  { name: 'Home & field services', detail: 'Gather location, job details and timing before dispatch.' },
];

export default function AiSolutionsPage() {
  return (
    <>
      <section className="relative isolate flex min-h-[min(720px,calc(100svh-74px))] items-end overflow-hidden bg-kh-green text-white">
        <Image
          src="/images/hero/people-candidate.webp"
          alt="Business and technology professionals working together at a computer."
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[64%_center]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#0d2319]/70" />
        <div className="kh-container relative z-10 w-full py-12 md:py-16">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/35 pb-3 font-mono text-[9px] tracking-[0.08em] text-white/80">
            <span>TKO MOTIONS / AI SOLUTIONS</span>
            <span>BUSINESS INNOVATION &amp; DIGITAL SOLUTIONS</span>
          </div>
          <div className="max-w-5xl py-16 md:py-24">
            <p className="font-mono text-[10px] tracking-[0.08em] text-kh-lime">PRACTICAL AI FOR REAL BUSINESS WORK</p>
            <h1 className="mt-6 max-w-4xl text-5xl font-medium leading-[0.96] tracking-[-0.07em] md:text-7xl">
              Turn everyday customer enquiries into opportunities.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
              We build practical AI assistants and business systems that help companies respond faster, capture leads, automate repetitive work and move customers closer to action.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#solutions" className="inline-flex min-h-12 items-center gap-3 border border-kh-lime bg-kh-lime px-5 font-mono text-[9px] tracking-[0.055em] text-kh-green transition-colors hover:bg-transparent hover:text-kh-lime">
                EXPLORE AI SOLUTIONS <span aria-hidden="true" className="text-base">↓</span>
              </Link>
              <Link href="#sales-demo" className="inline-flex min-h-12 items-center gap-3 border border-white/50 px-5 font-mono text-[9px] tracking-[0.055em] text-white transition-colors hover:border-kh-lime hover:text-kh-lime">
                TRY THE LIVE SALES ENGINE <span aria-hidden="true" className="text-base">↗</span>
              </Link>
            </div>
          </div>
          <p className="border-t border-white/35 pt-3 font-mono text-[9px] tracking-[0.055em] text-white/70">
            AI IS ONE OF THE TOOLS. BETTER BUSINESS OUTCOMES ARE THE GOAL.
          </p>
        </div>
      </section>

      <section id="sales-demo" className="kh-container scroll-mt-24 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 border-b border-kh-rule pb-3">
            <p className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">TKO PROPERTIES / LIVE DEMO</p>
          </div>
            <AISalesDemo />
        </div>
      </section>

      <section id="solutions" className="kh-container scroll-mt-24 py-20 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-kh-rule pb-8">
          <div>
            <p className="kh-label">01 / AI SOLUTIONS</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">
              Start with the work that needs to move.
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-kh-muted">
            Choose a starting point for customer engagement, sales or business operations. We shape the system around your workflow.
          </p>
        </div>
        <AIPackagePricing solutions={solutions} customSystem={customSystem} addOns={addOns} marketingOffers={marketingOffers} />
        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-kh-muted">
          Starting prices. Final scope and requirements are confirmed with you before work begins.
        </p>
        <div className="mt-8 border-t border-kh-rule pt-6">
          <p className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">PRICING NOTES</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-kh-muted">
            WhatsApp integration is available as an add-on and is not automatically included in packages. Meta usage costs vary. Other third-party charges may also apply, including AI usage beyond any included allowance, SMS and payment gateway fees.
          </p>
        </div>
      </section>

      <section id="business-industries" className="scroll-mt-24 bg-kh-soft py-20 md:py-24">
        <div className="kh-container">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="kh-label">02 / BUILT AROUND YOUR BUSINESS</p>
              <h2 className="mt-5 max-w-xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">
                Built around the way your business actually works.
              </h2>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-kh-muted">
                The right first step depends on how customers find you, what they ask and what your team needs to do next.
              </p>
              <Link href="/use-cases" className="mt-6 inline-flex min-h-11 items-center gap-3 border-b border-kh-green text-sm text-kh-green">Explore business use cases <span aria-hidden="true">→</span></Link>
            </div>
            <div className="grid gap-x-8 sm:grid-cols-2">
              {industries.map((industry, index) => (
                <article key={industry.name} className="border-t border-kh-rule py-5">
                  <span className="font-mono text-[9px] tracking-[0.055em] text-kh-green">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="mt-2 text-lg font-medium tracking-[-0.025em]">{industry.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-kh-muted">{industry.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-kh-green py-20 text-white md:py-24">
        <div className="kh-container">
          <p className="mb-12 flex justify-between border-b border-white/30 pb-3 font-mono text-[9px] tracking-[0.055em] text-white/70">
            <span>03 / NEXT STEP</span><span className="text-right">START WITH THE BUSINESS PROBLEM</span>
          </p>
          <h2 className="max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">
            Find the useful place to start.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            Tell us how enquiries, sales or operations work today. We will help you identify whether AI is the right fit and what a practical first system could do.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-3 border border-kh-lime bg-kh-lime px-5 font-mono text-[9px] tracking-[0.055em] text-kh-green transition-colors hover:bg-transparent hover:text-kh-lime">
              BOOK AN AI BUSINESS ASSESSMENT <span aria-hidden="true" className="text-base">↗</span>
            </Link>
            <Link href="#sales-demo" className="inline-flex min-h-12 items-center gap-3 border border-white/50 px-5 font-mono text-[9px] tracking-[0.055em] text-white transition-colors hover:border-kh-lime hover:text-kh-lime">
              EXPLORE THE SALES ENGINE DEMO <span aria-hidden="true" className="text-base">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}