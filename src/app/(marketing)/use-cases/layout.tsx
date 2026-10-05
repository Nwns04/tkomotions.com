import type { ReactNode } from 'react';
export default function UseCasesLayout({ children }: { children: ReactNode }) {
  return <>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', '@id': 'https://tkomotions.com/#website', name: 'TKO Motions', url: 'https://tkomotions.com', description: 'Business Innovation & Digital Solutions. Solutions that move businesses forward.' }) }} /></>;
}
