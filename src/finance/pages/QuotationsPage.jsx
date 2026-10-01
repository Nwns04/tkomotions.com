import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../../api/client.js';
import { formatDate, formatMoney } from '../utils/format.js';
import { EmptyState, LinkButton, LoadingBlock, Notice, PageHeader, StatusBadge } from '../components/UI.jsx';

const statuses = ['', 'Draft', 'Approved', 'Converted', 'Cancelled'];

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      api.get('/quotations', { params: { search, status } })
        .then(({ data }) => setQuotations(data.quotations))
        .catch((requestError) => setError(apiMessage(requestError)));
    }, 200);
    return () => clearTimeout(timer);
  }, [search, status]);

  return <><PageHeader eyebrow="Proposals" title="Quotations" description="Draft manually or use AI assistance, then approve and convert cleanly into an invoice." actions={<LinkButton to="/finance/quotations/new">+ New quotation</LinkButton>} /><Notice>{error}</Notice><div className="toolbar"><div className="search-box">⌕<input aria-label="Search quotations" placeholder="Search quotation or client" value={search} onChange={(event) => setSearch(event.target.value)} /></div><select aria-label="Filter quotations by status" value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item} value={item}>{item || 'All statuses'}</option>)}</select></div>{quotations === null ? <LoadingBlock /> : quotations.length ? <section className="panel table-panel"><div className="responsive-table"><table><thead><tr><th>Quotation</th><th>Client</th><th>Title</th><th>Valid until</th><th>Total</th><th>Status</th><th>Source</th></tr></thead><tbody>{quotations.map((quotation) => <tr key={quotation.publicId}><td><Link to={`/finance/quotations/${quotation.publicId}`}>{quotation.number}</Link></td><td>{quotation.client?.name || quotation.prospectName}</td><td>{quotation.title}</td><td>{formatDate(quotation.validUntil)}</td><td>{formatMoney(quotation.total, quotation.currency)}</td><td><StatusBadge status={quotation.status} /></td><td>{quotation.ai?.generated ? `${quotation.ai.provider}${quotation.ai.fallbackUsed ? ' · fallback' : ''}` : 'Manual'}</td></tr>)}</tbody></table></div></section> : <EmptyState title="No quotations found" body={search || status ? 'Adjust your search or filters.' : 'Create a quotation manually or let AI assist with the first draft.'} action={!search && !status ? 'Create quotation' : null} to="/finance/quotations/new" />}</>;
}
