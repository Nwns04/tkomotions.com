import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, apiMessage, downloadPdf } from '../../api/client.js';
import { formatDate, formatMoney, inputDate } from '../utils/format.js';
import { Button, LinkButton, LoadingBlock, Notice, PageHeader, StatusBadge } from '../components/UI.jsx';
import { QuotationPreview } from '../components/DocumentPreview.jsx';

const plusDays = (days) => { const value = new Date(); value.setDate(value.getDate() + days); return inputDate(value); };

export default function QuotationDetailPage() {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [settings, setSettings] = useState({});
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [convertOpen, setConvertOpen] = useState(false);
  const [conversion, setConversion] = useState({ clientPublicId: '', issueDate: inputDate(), dueDate: plusDays(14) });

  const load = useCallback(() => Promise.all([api.get(`/quotations/${publicId}`), api.get('/settings'), api.get('/clients')])
    .then(([quotationResponse, settingsResponse, clientResponse]) => {
      const next = quotationResponse.data.quotation;
      setQuotation(next); setSettings(settingsResponse.data.settings); setClients(clientResponse.data.clients);
      setConversion((current) => ({ ...current, clientPublicId: next.client?.publicId || current.clientPublicId }));
    }).catch((requestError) => setError(apiMessage(requestError))), [publicId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!convertOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setConvertOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [convertOpen]);

  async function action(name, confirmation) {
    if (confirmation && !window.confirm(confirmation)) return;
    setBusy(name); setError('');
    try { await api.post(`/quotations/${publicId}/${name}`); await load(); }
    catch (requestError) { setError(apiMessage(requestError)); }
    finally { setBusy(''); }
  }

  async function convert(event) {
    event.preventDefault(); setBusy('convert'); setError('');
    try {
      const { data } = await api.post(`/quotations/${publicId}/convert`, conversion);
      navigate(`/finance/invoices/${data.invoice.publicId}`);
    } catch (requestError) { setError(apiMessage(requestError)); }
    finally { setBusy(''); }
  }

  if (!quotation) return <><PageHeader eyebrow="Quotation" title="Loading document" /><Notice>{error}</Notice><LoadingBlock /></>;

  return <><PageHeader eyebrow="Quotation" title={quotation.number} description={`${quotation.client?.name || quotation.prospectName} · ${quotation.title}`} actions={<div className="action-wrap"><Button variant="secondary" onClick={() => window.print()}>Print</Button><Button variant="secondary" onClick={() => downloadPdf(`/quotations/${publicId}/pdf`, `${quotation.number}.pdf`).catch((requestError) => setError(apiMessage(requestError)))}>Download PDF</Button>{quotation.status === 'Draft' && <LinkButton variant="secondary" to={`/finance/quotations/${publicId}/edit`}>Edit</LinkButton>}{quotation.status === 'Draft' && <Button disabled={busy} onClick={() => action('approve')}>Approve</Button>}{quotation.status === 'Approved' && <Button onClick={() => setConvertOpen(true)}>Convert to invoice</Button>}</div>} /><Notice>{error}</Notice><div className="detail-summary"><div><span>Status</span><StatusBadge status={quotation.status} /></div><div><span>Proposed total</span><strong>{formatMoney(quotation.total, quotation.currency)}</strong></div><div><span>Valid until</span><strong>{formatDate(quotation.validUntil)}</strong></div><div><span>Draft source</span><strong>{quotation.ai?.generated ? `${quotation.ai.provider}${quotation.ai.fallbackUsed ? ' fallback' : ''}` : 'Manual'}</strong></div></div><div className="document-detail-grid"><section className="document-stage"><QuotationPreview quotation={quotation} client={quotation.client} settings={settings} /></section><aside className="detail-sidebar"><section className="panel"><span className="eyebrow">Workflow</span><div className="stack-actions">{quotation.status === 'Converted' && quotation.convertedInvoice && <LinkButton to={`/finance/invoices/${quotation.convertedInvoice.publicId}`}>Open invoice</LinkButton>}{!['Converted', 'Cancelled'].includes(quotation.status) && <Button variant="danger" disabled={busy} onClick={() => action('cancel', 'Cancel this quotation? It will remain in history.')}>Cancel quotation</Button>}</div></section>{quotation.ai?.generated && <section className="panel"><span className="eyebrow">AI assistance</span><dl className="record-list"><div><dt>Provider</dt><dd>{quotation.ai.provider}</dd></div><div><dt>Model</dt><dd>{quotation.ai.model}</dd></div><div><dt>Fallback used</dt><dd>{quotation.ai.fallbackUsed ? 'Yes' : 'No'}</dd></div></dl></section>}{quotation.internalWarnings?.length > 0 && <section className="panel warning-panel"><h2>Internal warnings</h2><ul>{quotation.internalWarnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></section>}{quotation.whatsAppCopy && <section className="panel"><span className="eyebrow">WhatsApp copy</span><p className="copy-block">{quotation.whatsAppCopy}</p></section>}</aside></div>{convertOpen && <div className="modal-backdrop" onMouseDown={() => setConvertOpen(false)}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="conversion-dialog-title" onSubmit={convert} onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">Conversion</span><h2 id="conversion-dialog-title">Create invoice</h2></div><button type="button" aria-label="Close conversion dialog" onClick={() => setConvertOpen(false)}>×</button></div><p>The quotation’s verified line items and financial settings will be copied into a new draft invoice.</p><label className="field"><span>Client</span><select value={conversion.clientPublicId} onChange={(event) => setConversion({ ...conversion, clientPublicId: event.target.value })} required autoFocus><option value="">Select client</option>{clients.map((client) => <option value={client.publicId} key={client.publicId}>{client.name}</option>)}</select></label><label className="field"><span>Invoice date</span><input type="date" value={conversion.issueDate} onChange={(event) => setConversion({ ...conversion, issueDate: event.target.value })} required /></label><label className="field"><span>Due date</span><input type="date" value={conversion.dueDate} onChange={(event) => setConversion({ ...conversion, dueDate: event.target.value })} required /></label><div className="form-actions"><Button type="button" variant="ghost" onClick={() => setConvertOpen(false)}>Cancel</Button><Button disabled={busy === 'convert'}>{busy === 'convert' ? 'Converting…' : 'Create draft invoice'}</Button></div></form></div>}</>;
}
