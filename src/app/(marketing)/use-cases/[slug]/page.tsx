import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaqList } from '@/components/marketing/FaqList';
import { UseCaseActions, UseCaseFinalCTA, UseCaseSection, Workflow, copyClass } from '@/components/use-cases/UseCaseShared';
import { getUseCase, useCases, useCaseCategories, industries } from '@/lib/use-cases';
import { solutions } from '@/lib/ai-packages';
import { breadcrumbSchema, useCaseMetadata } from '@/lib/use-case-seo';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return useCases.map(item => ({ slug: item.slug })); }
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = getUseCase(slug);
  if (!item) notFound();
  return useCaseMetadata(item.seoTitle, item.seoDescription, '/use-cases/' + item.slug, item.keywords);
}
const sections = [['problem', 'The problem'], ['solution', 'The solution'], ['how-it-works', 'How it works'], ['business-example', 'Example'], ['recommended-package', 'Package'], ['faq', 'FAQ']] as const;
export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const item = getUseCase(slug);
  if (!item) notFound();
  const recommended = solutions.find(solution => solution.number === item.packageKey)!;
  const category = useCaseCategories.find(category => category.key === item.category)!;
  const schema = [
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Use Cases', path: '/use-cases' }, { name: item.title, path: '/use-cases/' + item.slug }]),
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: item.faq.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) },
    { '@context': 'https://schema.org', '@type': 'WebPage', name: item.seoTitle, description: item.seoDescription, url: 'https://tkomotions.com/use-cases/' + item.slug, isPartOf: { '@id': 'https://tkomotions.com/#website' }, about: { '@type': 'Thing', name: industries[item.industry] } },
  ];
  return <article>
    <header className="kh-container py-14 md:py-20">
      <nav aria-label="Breadcrumb" className="mb-9 flex flex-wrap gap-2 text-xs leading-relaxed text-kh-muted"><Link href="/" className="hover:text-kh-green">Home</Link><span aria-hidden="true">/</span><Link href="/use-cases" className="hover:text-kh-green">Use Cases</Link><span aria-hidden="true">/</span><span aria-current="page">{item.title}</span></nav>
      <div className="flex flex-wrap justify-between gap-3 border-b border-kh-rule pb-4"><p className="kh-label">{item.title}</p><Link href={'/use-cases#' + category.anchor} className="text-xs text-kh-green hover:underline">{industries[item.industry]} / {category.label} →</Link></div>
      <div className="grid gap-8 pt-10 lg:grid-cols-[1.35fr_0.65fr] lg:gap-16">
        <div><h1 className="max-w-4xl text-5xl font-medium leading-[1.01] tracking-[-0.06em] md:text-6xl xl:text-7xl">{item.headline}</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-kh-muted">{item.description}</p><UseCaseActions slug={item.slug} /></div>
        <aside className="self-end border-t-2 border-kh-lime pt-6"><p className="kh-label">A PRACTICAL STARTING POINT</p><p className="mt-4 text-2xl font-medium leading-snug tracking-[-0.03em]">AI solutions from ₦{solutions[0].setupNgn.toLocaleString('en-NG')}</p><p className="mt-2 text-sm leading-relaxed text-kh-muted">Setup + ₦{solutions[0].monthlyNgn.toLocaleString('en-NG')}/month. Starting prices vary with requirements.</p><Link href="#recommended-package" className="mt-5 inline-flex min-h-11 items-center gap-3 border-b border-kh-green text-sm text-kh-green">See the relevant package <span aria-hidden="true">↓</span></Link></aside>
      </div>
    </header>
    <nav aria-label="On this page" className="kh-container flex flex-wrap gap-x-6 gap-y-1 border-y border-kh-rule py-3">{sections.map(([id, label]) => <Link key={id} href={'#' + id} className="inline-flex min-h-11 items-center text-sm text-kh-green hover:underline">{label}</Link>)}</nav>
    <UseCaseSection id="problem" number="02" label="THE PROBLEM" title={item.problemTitle}>
      {item.problem.map(paragraph => <p key={paragraph} className={copyClass}>{paragraph}</p>)}
      <ul className="grid gap-3 border-l-2 border-kh-lime pl-5 sm:grid-cols-2" aria-label="Typical customer questions">{item.questions.map(question => <li key={question} className="text-sm leading-relaxed">“{question}”</li>)}</ul>
    </UseCaseSection>
    <UseCaseSection id="solution" number="03" label="THE SOLUTION" title="An AI assistant built around your business." soft>
      {item.solution.map(paragraph => <p key={paragraph} className={copyClass}>{paragraph}</p>)}
      <Link href="/solutions/ai" className="inline-flex min-h-11 items-center gap-3 text-sm text-kh-green hover:underline">Explore AI Solutions <span aria-hidden="true">→</span></Link>
    </UseCaseSection>
    <UseCaseSection id="how-it-works" number="04" label="HOW IT WORKS" title="A clear path from question to next step."><Workflow steps={item.workflow} /></UseCaseSection>
    <UseCaseSection id="business-example" number="05" label="BUSINESS EXAMPLE" title="See the conversation take shape." soft>
      <p className="text-xs leading-relaxed text-kh-muted">Illustrative workflow · fictional business information · no confirmed order or appointment.</p>
      <ol className="space-y-5">{item.example.map(([speaker, message], index) => <li key={index} className={'border-l-2 pl-5 ' + (speaker === 'Customer' ? 'border-kh-rule' : 'border-kh-green')}><p className="mb-2 text-xs uppercase tracking-[0.06em] text-kh-green">{speaker}</p><blockquote className="text-base leading-relaxed">{message}</blockquote></li>)}</ol>
      <p className="border-t border-kh-rule pt-5 text-sm leading-relaxed text-kh-muted">{item.exampleValue}</p>
      {item.industry === 'real-estate' && <Link href="/solutions/ai#sales-demo" className="inline-flex min-h-11 items-center gap-3 border-b border-kh-green text-sm text-kh-green">Try the working property demo <span aria-hidden="true">↗</span></Link>}
    </UseCaseSection>
    <UseCaseSection id="capabilities" number="06" label="USEFUL WORK" title="What the system can help with.">
      <ul className="grid gap-x-8 sm:grid-cols-2">{item.capabilities.map(capability => <li key={capability} className="flex gap-3 border-b border-kh-rule py-4 text-sm leading-relaxed"><span aria-hidden="true" className="text-kh-green">↗</span>{capability}</li>)}</ul>
    </UseCaseSection>
    <UseCaseSection id="who-this-is-for" number="07" label="BUSINESS FIT" title="Who this is for.">
      <ul className="grid gap-3 sm:grid-cols-2">{item.targetBusinesses.map(business => <li key={business} className="flex items-start gap-3 text-base leading-relaxed"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-kh-green" />{business}</li>)}</ul>
      <p className={copyClass}>The right fit depends on how enquiries arrive, what information customers need and who handles the next step.</p>
    </UseCaseSection>
    <UseCaseSection id="recommended-package" number="08" label="RELEVANT PACKAGE" title="Start with the scope you need." soft>
      <div className="border-l-2 border-kh-green pl-6"><p className="text-xs uppercase tracking-[0.06em] text-kh-green">RECOMMENDED STARTING POINT</p><h3 className="mt-3 text-3xl font-medium tracking-[-0.04em]">{recommended.name}</h3><p className="mt-4 text-xl leading-relaxed">₦{recommended.setupNgn.toLocaleString('en-NG')} setup + ₦{recommended.monthlyNgn.toLocaleString('en-NG')}/month</p><p className="mt-4 text-base leading-relaxed text-kh-muted">{item.packageReason}</p><p className="mt-4 text-xs leading-relaxed text-kh-muted">Starting prices. Final scope, integrations and any third-party charges are confirmed before work begins. WhatsApp integration is available as an additional service and may involve third-party setup and usage charges.</p><Link href={'/solutions/ai#package-' + recommended.number} className="mt-4 inline-flex min-h-11 items-center gap-3 border-b border-kh-green text-sm text-kh-green">View {recommended.name} <span aria-hidden="true">→</span></Link></div>
      <div className="flex flex-wrap gap-x-6 gap-y-2"><Link href="/solutions/ai#solutions" className="inline-flex min-h-11 items-center gap-3 text-sm text-kh-green hover:underline">View all AI solutions and pricing →</Link><Link href="/capabilities#ai" className="inline-flex min-h-11 items-center gap-3 text-sm text-kh-green hover:underline">AI & intelligent systems →</Link></div>
    </UseCaseSection>
    <UseCaseSection id="marketing" number="09" label="MARKETING CONNECTION" title="Your AI system can work alongside your marketing.">
      <p className={copyClass}>{item.marketing}</p><p className="border-l-2 border-kh-lime pl-5 text-sm leading-loose">Content or advertisement → Business website → Customer assistant → Enquiry capture → Human follow-up</p><p className="text-sm leading-relaxed text-kh-muted">Advertising management and advertising spend are separate from the AI solution package.</p><Link href={'/contact?need=marketing-growth&useCase=' + item.slug} className="inline-flex min-h-11 items-center gap-3 border-b border-kh-green text-sm text-kh-green">Ask about Marketing & Growth <span aria-hidden="true">→</span></Link>
    </UseCaseSection>
    <UseCaseSection id="faq" number="10" label="QUESTIONS & ANSWERS" title="Useful answers before you start." soft><FaqList questions={item.faq} /></UseCaseSection>
    <section className="kh-container py-12 md:py-16" aria-labelledby="related-title"><div className="flex flex-wrap items-end justify-between gap-4 border-t border-kh-rule pt-6"><h2 id="related-title" className="text-2xl font-medium tracking-[-0.03em]">Related use cases</h2><Link href="/use-cases" className="inline-flex min-h-11 items-center text-sm text-kh-green hover:underline">Explore all use cases →</Link></div><div className="mt-5 grid gap-x-8 md:grid-cols-3">{item.related.map(relatedSlug => getUseCase(relatedSlug)).filter(related => related !== undefined).map(related => <Link key={related.slug} href={'/use-cases/' + related.slug} className="border-b border-kh-rule py-5 hover:border-kh-green"><h3 className="text-lg font-medium">{related.title} <span aria-hidden="true" className="text-kh-green">↗</span></h3><p className="mt-2 text-sm leading-relaxed text-kh-muted">{related.outcome}</p></Link>)}</div></section>
    <UseCaseFinalCTA slug={item.slug} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
  </article>;
}
