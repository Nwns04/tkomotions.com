import type { ReactNode } from 'react';

export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="site-page-transition">{children}</div>;
}