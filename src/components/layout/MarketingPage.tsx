import Link from 'next/link';
import type { MarketingPageData } from '@/types';

export function MarketingPage({ page }: { page: MarketingPageData }) {
  return <article className="site-page"><div className="site-page-index">TKO MOTIONS <span>/</span> {page.eyebrow}</div><header className="site-page-heading"><h1>{page.title}</h1><p>{page.intro}</p></header><div className="site-page-content">{page.sections.map((section) => <section key={section.title}><span>{section.index}</span><div><h2>{section.title}</h2><p>{section.body}</p></div></section>)}</div>{page.notice && <p className="site-page-notice">{page.notice}</p>}<Link className="site-text-link" href={page.ctaHref ?? '/contact'}>{page.cta ?? 'Start a conversation'} <span aria-hidden="true">↗</span></Link></article>;
}