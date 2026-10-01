import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './site/KineticHome.jsx';

const FinanceApp = lazy(() => import('./finance/FinanceApp.jsx'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/finance/*" element={<Suspense fallback={<div className="kh-route-loading">Opening workspace…</div>}><FinanceApp /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
