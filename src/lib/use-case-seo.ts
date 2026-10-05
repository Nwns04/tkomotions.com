import type { Metadata } from 'next';
import { createPageMetadata } from './seo';
export function useCaseMetadata(title: string, description: string, path: string, keywords?: string[]): Metadata {
  const base = createPageMetadata(title, description, path);
  return { ...base, keywords, openGraph: { ...base.openGraph, siteName: 'TKO Motions', locale: 'en_NG', images: [{ url: '/opengraph-image', alt: 'TKO Motions — Business Innovation & Digital Solutions' }] }, twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] } };
}
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: 'https://tkomotions.com' + item.path })) };
}
