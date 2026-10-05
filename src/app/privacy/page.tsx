import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How TKO Motions collects, uses, and protects information.',
  alternates: { canonical: '/privacy' },
};

const sections = [
  {
    title: 'INFORMATION WE COLLECT',
    body: 'We collect information you provide directly — such as your name, email address, company name, phone number, and any project details you submit through our contact form.',
  },
  {
    title: 'WHY WE COLLECT IT',
    body: 'We use this information to respond to project enquiries, provide our services, and communicate about work you have asked us to consider or deliver.',
  },
  {
    title: 'CONTACT-FORM DATA',
    body: 'When you submit the project intake form, your details are sent to our team by email. We do not sell this data, and we do not use it for marketing without your consent.',
  },
  {
    title: 'COOKIES',
    body: 'We may use cookies and similar technologies to operate the site and understand how visitors use it. Where required by law, we will ask for consent before setting non-essential cookies.',
  },
  {
    title: 'ANALYTICS',
    body: 'If analytics tools are in use, they collect aggregated, non-identifying information about visits to this site.',
  },
  {
    title: 'THIRD-PARTY SERVICES',
    body: 'We use third-party providers for email delivery, hosting, and related infrastructure. These providers process data on our behalf under their own terms.',
  },
  {
    title: 'PAYMENT SERVICES',
    body: 'Where applicable, payment processing is handled by third-party providers. TKO Motions does not store full card details.',
  },
  {
    title: 'DATA RETENTION',
    body: 'We retain project enquiry data for as long as needed to respond to the enquiry and for legitimate business record-keeping, unless a longer retention period is required by law.',
  },
  {
    title: 'DATA SECURITY',
    body: 'We take reasonable measures to protect information submitted to us. No system is completely secure, and we cannot guarantee absolute security.',
  },
  {
    title: 'YOUR RIGHTS',
    body: 'You may contact us to request access to, correction of, or deletion of personal information we hold about you.',
  },
  {
    title: 'CONTACT',
    body: 'For privacy questions, contact temitopekehinde@tkomotions.com.',
  },
  {
    title: 'POLICY UPDATES',
    body: 'This policy may be updated. The current version is always available on this page.',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="kh-container pt-20 pb-14">
        <p className="kh-label mb-12 flex justify-between border-b border-kh-rule pb-3">
          <span>LEGAL / PRIVACY</span>
          <span className="text-right">LAST UPDATED: JANUARY 2026</span>
        </p>
        <h1 className="max-w-4xl text-4xl font-medium leading-[0.98] tracking-[-0.06em] md:text-6xl">
          PRIVACY
          <br />
          <em className="not-italic text-kh-green">POLICY.</em>
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-relaxed text-kh-muted">
          <strong className="font-medium text-kh-ink">This is a working draft.</strong> Before public launch, replace this content with a policy reviewed for your jurisdiction.
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
