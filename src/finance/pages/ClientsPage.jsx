import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../../api/client.js';
import { EmptyState, LinkButton, LoadingBlock, Notice, PageHeader } from '../components/UI.jsx';

export default function ClientsPage() {
  const [clients, setClients] = useState(null); const [search, setSearch] = useState(''); const [error, setError] = useState('');
  useEffect(() => { const timer = setTimeout(() => api.get('/clients', { params: { search } }).then(({ data }) => setClients(data.clients)).catch((requestError) => setError(apiMessage(requestError))), 200); return () => clearTimeout(timer); }, [search]);
  return <><PageHeader eyebrow="Directory" title="Clients" description="Reusable client details and their complete financial history." actions={<LinkButton to="/finance/clients/new">+ New client</LinkButton>} /><Notice>{error}</Notice><div className="toolbar"><div className="search-box">⌕<input aria-label="Search clients" placeholder="Search name, company, or email" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>{clients === null ? <LoadingBlock /> : clients.length ? <section className="client-grid">{clients.map((client) => <Link className="client-card" key={client.publicId} to={`/finance/clients/${client.publicId}`}><div className="client-avatar">{client.name.slice(0, 2).toUpperCase()}</div><div><h3>{client.name}</h3><p>{client.company || 'Individual client'}</p><small>{client.email || client.phone || 'No contact details'}</small></div><span>→</span></Link>)}</section> : <EmptyState title="No clients found" body={search ? 'Try another search term.' : 'Add your first client, then create an invoice for them.'} action={!search ? 'Add client' : null} to="/finance/clients/new" />}</>;
}
