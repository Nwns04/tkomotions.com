import Link from 'next/link';
import type { WorkItem } from '@/types';
import { LivePreview } from './LivePreview';

export function WorkDetail({ item }: { item: WorkItem }) {
  return <article className="site-work"><div className="site-page-index">WORK / {item.number} / {item.category.toUpperCase()}</div><header className="site-page-heading"><h1>{item.title}</h1><p>{item.summary}</p></header><div className="site-page-content"><section><span>01</span><div><h2>Overview</h2><p>{item.description}</p></div></section><section><span>02</span><div><h2>Explore</h2><p>This live system is available to explore in its own environment.</p></div></section></div>{item.url && <LivePreview url={item.url} title={item.title} />}<Link className="site-text-link" href="/work">Back to work <span aria-hidden="true">←</span></Link></article>;
}