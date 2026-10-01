import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../../api/client.js';
import { formatDate, formatMoney } from '../utils/format.js';
import { EmptyState, LinkButton, LoadingBlock, Notice, PageHeader, StatusBadge } from '../components/UI.jsx';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState(null); const [filters, setFilters] = useState({ search: '', from: '', to: '' }); const [error, setError] = useState('');
  useEffect(() => { const timer = setTimeout(() => api.get('/receipts', { params: filters }).then(({ data }) => setReceipts(data.receipts)).catch((requestError) => setError(apiMessage(requestError))), 200); return () => clearTimeout(timer); }, [filters]);
  const set = (key) => (event) => setFilters({ ...filters, [key]: event.target.value });
  return <><PageHeader eyebrow="Proof of payment" title="Receipts" description="A permanent, clear record of every payment received." actions={<LinkButton to="/finance/receipts/new">+ New receipt</LinkButton>} /><Notice>{error}</Notice><div className="toolbar receipt-toolbar"><div className="search-box">⌕<input aria-label="Search receipts" placeholder="Receipt, client, or reference" value={filters.search} onChange={set('search')} /></div><input aria-label="From date" type="date" value={filters.from} onChange={set('from')} /><input aria-label="To date" type="date" value={filters.to} onChange={set('to')} /></div>{receipts === null ? <LoadingBlock /> : receipts.length ? <section className="panel table-panel"><div className="responsive-table"><table><thead><tr><th>Receipt</th><th>Client</th><th>Date</th><th>Method</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead><tbody>{receipts.map((receipt) => <tr key={receipt.publicId}><td><Link to={`/finance/receipts/${receipt.publicId}`}>{receipt.number}</Link></td><td>{receipt.client?.name}</td><td>{formatDate(receipt.paymentDate)}</td><td>{receipt.method}</td><td>{receipt.reference || '—'}</td><td>{formatMoney(receipt.amount, receipt.currency || receipt.invoice?.currency || 'NGN')}</td><td><StatusBadge status={receipt.status} /></td></tr>)}</tbody></table></div></section> : <EmptyState title="No receipts found" body="Receipts generated from payments or entered manually will appear here." action="Create receipt" to="/finance/receipts/new" />}</>;
}
