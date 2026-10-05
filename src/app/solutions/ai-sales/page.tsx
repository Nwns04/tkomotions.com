import Link from 'next/link';
import { AISalesDemo } from '@/components/sales-engine/AISalesDemo';

const problemPoints = [
  'Enquiries arrive outside working hours.',
  'Staff do not respond quickly enough.',
  'Leads are forgotten or not followed up consistently.',
  'Repetitive questions consume sales time.',
  'Pipeline visibility disappears without a structured process.',
];

const features = [
  'AI customer assistant',
  'Knowledge-based answers',
  'Lead qualification',
  'Lead scoring',
  'Follow-up automation',
  'Appointments',
  'CRM workflow',
  'Human handoff',
];

const industries = [
  'Real Estate',
  'Schools',
  'Hospitality',
  'Professional Services',
  'Training Companies',
  'Automotive',
  'Logistics',
];

const steps = ['ENQUIRY', 'AI RESPONSE', 'QUALIFICATION', 'LEAD CAPTURE', 'FOLLOW-UP', 'HUMAN SALES TEAM'];

export default function AISalesPage() {
  return (
    <main className="bg-white text-kh-ink">
      <section className="kh-container py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="kh-label mb-6">TKO AI Sales Engine</p>
            <h1 className="max-w-xl text-5xl font-medium leading-[0.96] tracking-[-0.07em] md:text-7xl">
              Turn customer enquiries into qualified sales opportunities.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-kh-muted md:text-xl">
              TKO AI Sales Engine helps businesses answer enquiries, qualify prospects, capture leads and automate follow-up using AI.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="#demo" className="rounded-full bg-kh-green px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90">
                Try the Demo
              </Link>
              <Link href="/lead-dashboard" className="rounded-full border border-kh-rule bg-white px-6 py-3 text-sm font-medium text-kh-ink transition-colors hover:border-kh-green hover:text-kh-green">
                View Lead Dashboard
              </Link>
              <Link href="/contact" className="rounded-full border border-kh-rule bg-white px-6 py-3 text-sm font-medium text-kh-ink transition-colors hover:border-kh-green hover:text-kh-green">
                Book an AI Business Assessment
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-kh-rule bg-kh-soft p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="kh-label">Product Demo</p>
                <p className="mt-2 text-xl font-medium tracking-[-0.04em]">TKO Properties</p>
              </div>
              <span className="rounded-full bg-kh-lime px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-kh-green">Demo</span>
            </div>
            <AISalesDemo />
          </div>
        </div>
      </section>

      <section className="bg-kh-soft py-16 md:py-20">
        <div className="kh-container">
          <p className="kh-label mb-8">Problem</p>
          <h2 className="max-w-3xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">
            Businesses lose opportunities when enquiries are not handled fast and consistently.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {problemPoints.map((point) => (
              <div key={point} className="rounded-2xl border border-kh-rule bg-white p-5">
                <div className="mb-4 h-10 w-10 rounded-full bg-kh-lime/60" />
                <p className="text-sm leading-relaxed text-kh-muted">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="kh-container py-16 md:py-20">
        <p className="kh-label mb-8">How it works</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-kh-rule bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-kh-muted">0{index + 1}</span>
                <span aria-hidden="true" className="text-base text-kh-green">↓</span>
              </div>
              <h3 className="text-xl font-medium tracking-[-0.03em] text-kh-green">{step}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-kh-soft py-16 md:py-20">
        <div className="kh-container">
          <p className="kh-label mb-8">Features</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div key={feature} className="rounded-2xl border border-kh-rule bg-white p-5">
                <div className="mb-4 h-9 w-9 rounded-full bg-kh-green/10" />
                <p className="text-lg font-medium tracking-[-0.03em]">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="kh-container py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="kh-label">Live Demo</p>
            <h2 className="mt-3 text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-5xl">Test the sales assistant</h2>
          </div>
        </div>
        <div className="max-w-3xl"> 
          <AISalesDemo />
        </div>
      </section>

      <section className="bg-kh-soft py-16 md:py-20">
        <div className="kh-container">
          <p className="kh-label mb-8">Industries</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
            {industries.map((industry) => (
              <div key={industry} className="rounded-2xl border border-kh-rule bg-white p-4 text-center text-sm font-medium text-kh-ink">
                {industry}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="kh-container py-16 md:py-20">
        <div className="rounded-4xl border border-kh-rule bg-kh-soft p-8 md:p-12">
          <p className="kh-label">Next step</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">
            Let&apos;s identify where AI can improve your business.
          </h2>
          <div className="mt-8">
            <Link href="/contact" className="inline-flex rounded-full bg-kh-green px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90">
              Book an AI Business Assessment
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
