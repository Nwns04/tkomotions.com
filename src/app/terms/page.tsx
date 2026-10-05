import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms governing use of the TKO Motions website.',
  alternates: { canonical: '/terms' },
};

const sections = [
  {
    title: 'WEBSITE USAGE',
    body: 'By accessing this website, you agree to use it lawfully and in accordance with these terms.',
  },
  {
    title: 'INTELLECTUAL PROPERTY',
    body: 'The content, design, and code of this website belong to TKO Motions Ltd unless otherwise stated. You may not reproduce or redistribute them without permission.',
  },
  {
    title: 'ACCEPTABLE USE',
    body: 'You agree not to misuse the site — including attempting to gain unauthorised access, disrupting service, or using the site for unlawful purposes.',
  },
  {
    title: 'EXTERNAL LINKS',
    body: 'This website may link to third-party sites. TKO Motions is not responsible for the content or practices of those sites.',
  },
  {
    title: 'SERVICE INFORMATION',
    body: 'Information about services on this site is for general description. Actual scope, deliverables, and terms are agreed separately in writing for each project.',
  },
  {
    title: 'LIMITATIONS',
    body: 'This website is provided as-is. TKO Motions makes no warranty that it will be uninterrupted, error-free, or free of harmful components.',
  },
  {
    title: 'LIABILITY',
    body: 'To the extent permitted by law, TKO Motions is not liable for indirect, incidental, or consequential damages arising from use of this website.',
  },
  {
    title: 'GOVERNING LAW',
    body: 'These terms are governed by the laws of the Federal Republic of Nigeria.',
  },
  {
    title: 'CONTACT',
    body: 'For questions about these terms, contact temitopekehinde@tkomotions.com.',
  },
];

export default function TermsPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
          <span>LEGAL / TERMS</span>
          <span className="text-right">LAST UPDATED: JANUARY 2026</span>
        </p>
        <h1 className="max-w-4xl text-4xl font-medium leading-[0.98] tracking-[-0.06em] md:text-6xl">
          TERMS
          <br />
          <em className="not-italic text-kh-green">OF USE.</em>
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-relaxed text-kh-muted">
          <strong className="font-medium text-kh-ink">This is a working draft.</strong> Replace with reviewed terms before public launch.
        </p>
      </section>

      <section className="kh-container pb-24">
        <div className="grid gap-12 md:gap-16">
          {sections.map((section, i) => (
            <article key={section.title} className="border-t border-kh-rule pt-6">
              <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="mt-2 max-w-2xl text-xl font-medium tracking-[-0.02em] md:text-2xl">{section.title}</h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-kh-muted">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
