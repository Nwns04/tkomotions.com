'use client';

import dynamic from 'next/dynamic';

const FinanceClient = dynamic(() => import('./FinanceClient'), {
  ssr: false,
  loading: () => <div className="page-loader"><span /></div>,
});

export default function FinancePage() {
  return <FinanceClient />;
}