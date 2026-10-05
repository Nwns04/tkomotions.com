import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AIPackagePricing, type AiAddOn, type AiPriceItem } from '@/components/ai-solutions/AIPackagePricing';
import { AISalesDemo } from '@/components/sales-engine/AISalesDemo';

export const metadata: Metadata = {
  title: 'AI Business Solutions',
  description: 'Practical AI assistants and business systems for customer enquiries, sales and everyday operations.',
  alternates: { canonical: '/solutions/ai' },
};

const solutions: AiPriceItem[] = [
  {
    number: '01',
    name: 'AI CUSTOMER ASSISTANT',
    outcome: 'Help me answer customers.',
    setupNgn: 80000,
    monthlyNgn: 10000,
    description: 'Answer routine customer questions and capture useful enquiries without replying manually each time.',
    bestForSummary: 'Vendors & small businesses',
    bestFor: 'Fashion, shoes, bags, hair, beauty, gadgets, food, cakes, tailoring, photography, makeup and solo service businesses.',
    example: 'A fashion shopper asks about price, size 42, availability and delivery to Lagos. The assistant answers from the vendor’s information and captures a serious enquiry.',
    includes: [
      'Website AI customer assistant',
      'Business knowledge setup',
      'Products and services information',
      'FAQ automation',
      'Pricing and basic business information',
      'Opening hours, location and delivery information',
      'Basic enquiry capture',
      'Human handoff',
      'Basic conversation history',
      'Basic maintenance and support',
    ],
  },
  {
    number: '02',
    name: 'AI LEAD ASSISTANT',
    outcome: 'Help me manage enquiries.',
    setupNgn: 150000,
    monthlyNgn: 20000,
    description: 'Manage regular enquiries, collect customer requirements and organize conversations into actionable leads.',
    bestForSummary: 'Growing businesses',
    bestFor: 'Established fashion brands, electronics and furniture sellers, auto dealers, restaurants, hotels, event vendors, training businesses, real estate and growing online stores.',
    example: 'A furniture buyer wants a six-seater dining table. The assistant collects product, budget, location, style, delivery needs and contact details before notifying the owner.',
    includes: [
      'Everything in AI Customer Assistant',
      'Advanced business knowledge base',
      'Product and service catalogue',
      'Lead capture and qualification',
      'Customer requirement collection',
      'Lead notifications',
      'Basic lead management and categorization',
      'Appointment or order requests',
      'Basic follow-up workflows',
      'Conversation history',
      'Basic business dashboard',
      'Monthly optimization',
    ],
  },
  {
    number: '03',
    name: 'AI SALES ENGINE',
    outcome: 'Turn enquiries into sales.',
    setupNgn: 350000,
    monthlyNgn: 60000,
    description: 'Combine advanced qualification, lead scoring and follow-up in one sales workflow.',
    bestForSummary: 'Sales-driven businesses',
    bestFor: 'Sales-driven businesses, including real estate, schools, hospitality, logistics, professional services and larger ecommerce teams.',
    example: 'A property prospect shares a location and budget. The assistant qualifies the enquiry, scores intent and gives the sales team a clear follow-up path.',
    includes: [
      'Everything in AI Lead Assistant',
      'Advanced lead qualification and scoring',
      'Sales pipeline and CRM',
      'Automated follow-up',
      'Appointment and order workflows',
      'Sales notifications and dashboard',
      'Human takeover',
      'Sales performance insights',
      'Monthly optimization',
    ],
  },
  {
    number: '04',
    name: 'AI BUSINESS OPERATIONS',
    outcome: 'Automate how your business works.',
    setupNgn: 750000,
    setupSuffix: '+',
    monthlyNgn: 120000,
    monthlySuffix: '+',
    description: 'Improve customer-facing work and automate parts of internal business operations with AI-assisted workflows.',
    bestForSummary: 'Established businesses',
    bestFor: 'Established SMEs, schools, hotels, logistics and real estate companies, professional services, multi-location businesses and teams handling many documents or enquiries.',
    example: 'Staff can find approved internal knowledge while recurring reports, document handling and workflow approvals move through a shared operations system.',
    includes: [
      'Everything in AI Sales Engine',
      'Internal AI assistant',
      'Document knowledge base',
      'Staff knowledge system',
      'Automated reports',
      'Workflow and task automation',
      'CRM workflows',
      'Document processing',
      'Management dashboard',
      'Approval workflows',
      'Internal notifications',
      'Business process automation',
      'Custom integrations',
    ],
  },
];

const customSystem: AiPriceItem = {
  number: '05',
  name: 'CUSTOM AI SYSTEMS',
  outcome: 'Build around your specific operation.',
  setupNgn: 1500000,
  setupSuffix: '+',
  monthlyNgn: 200000,
  monthlySuffix: '+',
  description: 'A custom AI-powered business system designed around complex workflows, existing software and organizational requirements.',
  bestForSummary: 'Complex operations and integrations',
  bestFor: 'Larger organizations, fintechs, large ecommerce operations, logistics networks, multi-branch businesses and organizations with complex integrations.',
  example: 'Multiple AI agents can work across approved business systems, with custom workflows, dashboards, reporting and human approval controls.',
  includes: [
    'Multiple AI agents',
    'Custom workflows and business logic',
    'Custom APIs and CRM/ERP integrations',
    'WhatsApp integration, scoped to requirements',
    'Internal systems and custom dashboards',
    'Document automation and advanced reporting',
    'Role-based access and human approval controls',
    'Dedicated support',
  ],
};

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
        <AIPackagePricing solutions={solutions} customSystem={customSystem} addOns={addOns} />
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

      <section className="bg-kh-soft py-20 md:py-24">
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