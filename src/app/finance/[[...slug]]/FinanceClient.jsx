'use client';

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import FinanceApp from '../../../finance/FinanceApp.jsx';

export default function FinanceClient() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/finance/*" element={<FinanceApp />} />
      </Routes>
    </BrowserRouter>
  );
}