import Link from 'next/link';
import { Reveal } from '@/components/animations/Reveal';
import { useCases, useCaseCategories, assessmentHref } from '@/lib/use-cases';
import { breadcrumbSchema, useCaseMetadata } from '@/lib/use-case-seo';
import { Workflow, UseCaseFinalCTA } from '@/components/use-cases/UseCaseShared';

export const metadata = useCaseMetadata('AI Use Cases for Real Business Problems', 'Explore practical AI and automation use cases for commerce, artisans, hospitality, property, schools and professional services. Find a useful starting point for your business.', '/use-cases');
export default function UseCasesPage() {
  return <>
    <section className="kh-container py-14 md:py-20">
      <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap gap-2 text-xs text-kh-muted"><Link href="/" className="hover:text-kh-green">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Use Cases</span></nav>
      <p className="kh-label border-b border-kh-rule pb-4">TKO MOTIONS / USE CASES</p>
      <div className="grid items-start gap-12 pt-10 lg:grid-cols-[1.3fr_0.7fr] lg:gap-20">
        <div><p className="text-xs uppercase tracking-[0.08em] text-kh-green">Solutions that move businesses forward.</p><h1 className="mt-5 max-w-4xl text-5xl font-medium leading-[1.01] tracking-[-0.06em] md:text-6xl xl:text-7xl">AI solutions built around real business problems.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-kh-muted">From customer enquiries and bookings to lead qualification and business automation, we build practical AI systems around how businesses actually work.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Link href={assessmentHref()} className="inline-flex min-h-12 items-center justify-between gap-5 bg-kh-green px-5 py-3 text-sm text-white! hover:bg-kh-green-deep">Get a Free Business Assessment <span aria-hidden="true" className="text-kh-lime">↗</span></Link><Link href="/solutions/ai" className="inline-flex min-h-12 items-center justify-between gap-5 border border-kh-rule px-5 py-3 text-sm text-kh-green hover:border-kh-green">Explore AI Solutions <span aria-hidden="true">→</span></Link></div>
        </div>
        <aside className="border-l-2 border-kh-lime bg-kh-soft p-6 md:p-8" aria-label="From interest to action"><p className="kh-label mb-6">FROM INTEREST TO ACTION</p><Workflow steps={['A customer asks a question','They find useful information','Their requirements are captured','Your team takes the next step']} /><p className="mt-6 border-t border-kh-rule pt-5 text-sm leading-relaxed text-kh-muted">AI is one of our capabilities. The starting point is the work your business needs to move.</p></aside>
      </div>
    </section>
    <nav aria-label="Use case categories" className="kh-container flex flex-wrap gap-x-6 gap-y-2 border-y border-kh-rule py-4">{useCaseCategories.map(category => <Link key={category.key} href={'#' + category.anchor} className="inline-flex min-h-11 items-center gap-3 text-sm text-kh-green hover:underline">{category.label}<span aria-hidden="true">↓</span></Link>)}</nav>
    {useCaseCategories.map((category, categoryIndex) => <section key={category.key} id={category.anchor} className="kh-container scroll-mt-24 py-12 md:py-16" aria-labelledby={category.anchor + '-title'}>
      <Reveal><div className="grid gap-4 border-b border-kh-rule pb-6 md:grid-cols-2"><div><p className="kh-label">{String(categoryIndex + 1).padStart(2, '0')} / BUSINESS CONTEXT</p><h2 id={category.anchor + '-title'} className="mt-3 text-3xl font-medium tracking-[-0.04em] md:text-4xl">{category.label}</h2></div><p className="max-w-md self-end text-base leading-relaxed text-kh-muted">{category.description}</p></div></Reveal>
      <div className="grid gap-x-12 md:grid-cols-2">{useCases.filter(item => item.category === category.key).map(item => <article key={item.slug} className="flex flex-col border-b border-kh-rule py-8">
        <p className="text-xs uppercase tracking-[0.06em] text-kh-green">{item.title}</p><h3 className="mt-3 max-w-xl text-2xl font-medium leading-tight tracking-[-0.03em]">{item.outcome}</h3><p className="mt-4 max-w-xl text-base leading-relaxed text-kh-muted">{item.cardDescription}</p><Link href={'/use-cases/' + item.slug} className="mt-6 inline-flex min-h-11 items-center justify-between gap-4 self-start border-b border-kh-green text-sm text-kh-green hover:gap-6" aria-label={'Explore use case: ' + item.title}>Explore use case <span aria-hidden="true">→</span></Link>
      </article>)}</div>
    </section>)}
    <section className="kh-container pb-16"><div className="grid gap-6 border-t border-kh-rule pt-8 md:grid-cols-2"><h2 className="text-2xl font-medium tracking-[-0.03em]">Start with the workflow, then choose the tools.</h2><div><p className="text-base leading-relaxed text-kh-muted">Each use case shows a possible customer journey. We agree the information, handoff process and package around your business before building. Integrations and advanced automation are assessed separately.</p><Link href="/solutions/ai#solutions" className="mt-4 inline-flex min-h-11 items-center gap-3 text-sm text-kh-green hover:underline">Compare current packages and pricing <span aria-hidden="true">→</span></Link></div></div></section>
    <UseCaseFinalCTA />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Use Cases', path: '/use-cases' }])).replace(/</g, '\\u003c') }} />
  </>;
}
