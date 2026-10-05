import Link from 'next/link';
import type { WorkItem } from '@/types';

export function WorkCard({ item }: { item: WorkItem }) {
  return <Link className="site-work-card" href={`/work/${item.slug}`}><small>{item.number}</small><div><h2>{item.title}</h2><p>{item.summary}</p></div><b aria-hidden="true">↗</b></Link>;
}