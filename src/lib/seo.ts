import type { Metadata } from 'next';

export function createPageMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path, type: 'website' } };
}