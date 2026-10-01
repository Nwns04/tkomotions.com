import { Route, Routes } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from '../auth/AuthContext.jsx';
import FinanceLayout from './components/FinanceLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import ClientEditorPage from './pages/ClientEditorPage.jsx';
import ClientDetailPage from './pages/ClientDetailPage.jsx';
import InvoicesPage from './pages/InvoicesPage.jsx';
import InvoiceEditorPage from './pages/InvoiceEditorPage.jsx';
import InvoiceDetailPage from './pages/InvoiceDetailPage.jsx';
import ReceiptsPage from './pages/ReceiptsPage.jsx';
import ReceiptEditorPage from './pages/ReceiptEditorPage.jsx';
import ReceiptDetailPage from './pages/ReceiptDetailPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import QuotationsPage from './pages/QuotationsPage.jsx';
import QuotationEditorPage from './pages/QuotationEditorPage.jsx';
import QuotationDetailPage from './pages/QuotationDetailPage.jsx';
import IntelligencePage from './pages/IntelligencePage.jsx';

export default function FinanceApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<FinanceLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/new" element={<ClientEditorPage />} />
            <Route path="clients/:publicId" element={<ClientDetailPage />} />
            <Route path="clients/:publicId/edit" element={<ClientEditorPage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="quotations/new" element={<QuotationEditorPage />} />
            <Route path="quotations/:publicId" element={<QuotationDetailPage />} />
            <Route path="quotations/:publicId/edit" element={<QuotationEditorPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/new" element={<InvoiceEditorPage />} />
            <Route path="invoices/:publicId" element={<InvoiceDetailPage />} />
            <Route path="invoices/:publicId/edit" element={<InvoiceEditorPage />} />
            <Route path="receipts" element={<ReceiptsPage />} />
            <Route path="receipts/new" element={<ReceiptEditorPage />} />
            <Route path="receipts/:publicId" element={<ReceiptDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/ai" element={<IntelligencePage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
