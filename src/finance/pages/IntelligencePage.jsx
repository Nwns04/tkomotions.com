import { useCallback, useEffect, useState } from 'react';
import { api, apiMessage } from '../../api/client.js';
import { formatDate, formatMoney, fromMinor, toMinor } from '../utils/format.js';
import { Button, Field, LinkButton, LoadingBlock, Notice, PageHeader, StatusBadge } from '../components/UI.jsx';

const emptyItem = { name: '', category: '', packageName: '', description: '', currency: 'NGN', unitPrice: '', pricingNotes: '', includedFeatures: '', active: true };

export default function IntelligencePage() {
  const [status, setStatus] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ type: 'error', text: '' });

  const load = useCallback(() => Promise.all([api.get('/ai/status'), api.get('/catalog', { params: { includeInactive: true } })])
    .then(([statusResponse, catalogResponse]) => { setStatus(statusResponse.data); setCatalog(catalogResponse.data.items); })
    .catch((error) => setNotice({ type: 'error', text: apiMessage(error) })), []);
  useEffect(() => { load(); }, [load]);

  function edit(item) {
    setEditingId(item.publicId);
    setForm({ ...item, unitPrice: fromMinor(item.unitPrice), includedFeatures: item.includedFeatures.join('\n') });
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setNotice({ type: 'error', text: '' });
    const payload = { ...form, unitPrice: toMinor(form.unitPrice), includedFeatures: form.includedFeatures.split('\n').map((item) => item.trim()).filter(Boolean), active: Boolean(form.active) };
    try {
      if (editingId) await api.put(`/catalog/${editingId}`, payload); else await api.post('/catalog', payload);
      setForm(emptyItem); setEditingId(''); setNotice({ type: 'success', text: 'Service catalog saved.' }); await load();
    } catch (error) { setNotice({ type: 'error', text: apiMessage(error) }); }
    finally { setBusy(false); }
  }

  async function deactivate(item) {
    if (!window.confirm(`Deactivate ${item.name}? Existing quotations will not be changed.`)) return;
    try { await api.delete(`/catalog/${item.publicId}`); await load(); }
    catch (error) { setNotice({ type: 'error', text: apiMessage(error) }); }
  }

  return <><PageHeader eyebrow="Intelligence" title="AI and service catalog" description="Provider health is read-only. API keys stay in server environment variables and are never returned here." actions={<LinkButton to="/finance/settings" variant="ghost">Business settings</LinkButton>} /><Notice type={notice.type}>{notice.text}</Notice>{!status ? <LoadingBlock /> : <><section className="provider-grid">{status.health.map((provider) => <article className="panel provider-card" key={provider.provider}><div><span className="eyebrow">{provider.provider === status.configuration.primary ? 'Primary' : 'Fallback'}</span><h2>{provider.provider === 'gemini' ? 'Google Gemini' : 'Groq Cloud'}</h2><code>{provider.model}</code></div><StatusBadge status={provider.status} /><dl><div><dt>Configured</dt><dd>{status.configuration.providers[provider.provider]?.configured ? 'Yes' : 'No'}</dd></div><div><dt>Last provider used</dt><dd>{status.lastProviderUsed === provider.provider ? 'Most recent' : '—'}</dd></div></dl></article>)}</section><section className="panel usage-summary"><div><span>Last successful AI request</span><strong>{status.lastSuccessfulRequest ? formatDate(status.lastSuccessfulRequest) : 'No successful requests yet'}</strong></div><div><span>Fallback required most recently</span><strong>{status.fallbackWasRequired ? 'Yes' : 'No'}</strong></div><div><span>Keys exposed to browser</span><strong>No</strong></div></section></>}
    <div className="catalog-layout"><form className="editor-card catalog-form" onSubmit={save}><div className="form-section-title"><span>01</span><div><h2>{editingId ? 'Edit catalog service' : 'Add catalog service'}</h2><p>The database catalog remains authoritative for TKO pricing.</p></div></div><div className="form-grid"><Field label="Service name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field><Field label="Category"><input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required /></Field><Field label="Package"><input value={form.packageName} onChange={(event) => setForm({ ...form, packageName: event.target.value })} /></Field><Field label="Currency"><select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}><option>NGN</option><option>USD</option><option>GBP</option></select></Field><Field label={`Unit price (${form.currency})`}><input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: event.target.value })} required /></Field><Field label="Description"><textarea rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Field label="Included features (one per line)"><textarea rows="4" value={form.includedFeatures} onChange={(event) => setForm({ ...form, includedFeatures: event.target.value })} /></Field><Field label="Pricing rules / notes"><textarea rows="4" value={form.pricingNotes} onChange={(event) => setForm({ ...form, pricingNotes: event.target.value })} /></Field><Field label="Catalog status"><label className="check-field"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span>Active and available to quotation AI</span></label></Field></div><div className="form-actions">{editingId && <Button type="button" variant="ghost" onClick={() => { setEditingId(''); setForm(emptyItem); }}>Cancel edit</Button>}<Button disabled={busy}>{busy ? 'Saving…' : editingId ? 'Save service' : 'Add service'}</Button></div></form><section className="panel catalog-list"><div className="panel-head"><div><span className="eyebrow">Pricing authority</span><h2>Service catalog</h2></div><span>{catalog?.filter((item) => item.active).length || 0} active</span></div>{catalog === null ? <LoadingBlock /> : catalog.length ? <div>{catalog.map((item) => <article className={!item.active ? 'is-inactive' : ''} key={item.publicId}><div><span>{item.category}{item.packageName ? ` · ${item.packageName}` : ''}</span><h3>{item.name}</h3><p>{item.description || 'No description'}</p><strong>{formatMoney(item.unitPrice, item.currency)}</strong></div><div><Button type="button" variant="secondary" onClick={() => edit(item)}>Edit</Button>{item.active && <Button type="button" variant="danger" onClick={() => deactivate(item)}>Deactivate</Button>}</div></article>)}</div> : <div className="empty-state compact"><h3>No catalog services</h3><p>Add TKO services and pricing before relying on AI quotation drafts.</p></div>}</section></div>
    {status?.usage?.length > 0 && <section className="panel usage-log"><div className="panel-head"><div><span className="eyebrow">Private operational log</span><h2>Recent AI usage</h2></div></div><div className="responsive-table"><table><thead><tr><th>Time</th><th>Provider</th><th>Model</th><th>Request</th><th>Result</th><th>Latency</th><th>Fallback</th></tr></thead><tbody>{status.usage.map((entry) => <tr key={`${entry.createdAt}-${entry.provider}`}><td>{formatDate(entry.createdAt)}</td><td>{entry.provider}</td><td>{entry.model}</td><td>{entry.requestType}</td><td>{entry.success ? 'Success' : entry.errorCategory}</td><td>{entry.latencyMs} ms</td><td>{entry.fallbackUsed ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div></section>}</>;
}
