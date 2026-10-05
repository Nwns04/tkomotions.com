import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

export function MarketingLayout({ children }: { children: ReactNode }) {
  return <><Header /><main className="site-main">{children}</main><Footer /></>;
}