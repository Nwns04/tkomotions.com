export type MarketingPageData = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ index: string; title: string; body: string }>;
  notice?: string;
  cta?: string;
  ctaHref?: string;
};

export type WorkItem = { number: string; title: string; slug: string; summary: string; category: string; url?: string; description: string };
export type FieldNoteItem = {
  title?: string;
  description?: string;
  date?: string;
  category?: 'BUSINESS' | 'TECHNOLOGY' | 'AI' | 'BUILD' | 'AFRICA' | 'INNOVATION';
  draft?: boolean;
  featured?: boolean;
  body?: string;
  slug?: string;
  url?: string;
};