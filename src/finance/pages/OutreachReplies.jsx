import { useCallback, useEffect, useRef, useState } from 'react';
import { api, apiMessage } from '../../api/client.js';
import { Button, Notice } from '../components/UI.jsx';
import OutreachModal from '../components/OutreachModal.jsx';
const time = value => value ? new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : 'Time unavailable';
export default function OutreachReplies({ campaignId = '', leads = [], forwardTo = '', onChanged }) {
  const [items, setItems] = useState([]), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false), [opened, setOpened] = useState(null), [leadId, setLeadId] = useState('');
  const [nextPage, setNextPage] = useState(null), [syncCursor, setSyncCursor] = useState(null);
  const [unmatchedOnly, setUnmatchedOnly] = useState(false), [loading, setLoading] = useState(true);
  const version = useRef(0), mounted = useRef(true);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    const { data } = await api.get('/outreach/replies', { params: campaignId ? { campaignId } : {} });
    if (!mounted.current || request !== version.current) return;
    setItems(data.replies || []); setNextPage(data.nextCursor || null); setLoading(false);
  }, [campaignId]);
  useEffect(() => {
    const requestVersion = version;
    mounted.current = true; setItems([]); setOpened(null); setError(''); setMessage(''); setLoading(true); setSyncCursor(null);
    refresh().catch(reason => { if (mounted.current) { setError(apiMessage(reason)); setLoading(false); } });
    const timer = setInterval(() => refresh().catch(() => {}), 30000);
    return () => { mounted.current = false; requestVersion.current++; clearInterval(timer); };
  }, [refresh]);
  async function run(task) {
    setBusy(true); setError(''); setMessage('');
    try { await task(); } catch (reason) { if (mounted.current) setError(apiMessage(reason)); }
    finally { if (mounted.current) setBusy(false); }
  }
  const sync = after => run(async () => {
    const { data } = await api.post('/outreach/replies/sync', after ? { after } : {});
    setSyncCursor(data.nextCursor || null);
    await refresh(); await onChanged?.();
    setMessage(`${data.imported} reply message(s) imported. Existing messages are not forwarded again.${data.nextCursor ? ' More messages are available; use Import older replies.' : ''}`);
  });
  const open = item => run(async () => {
    const { data } = await api.get('/outreach/replies/' + item.publicId);
    setLeadId(''); setOpened(data.reply);
  });
  const visible = items.filter(item => !unmatchedOnly || !item.links?.length);
  return <section className="outreach-card outreach-replies" aria-label={campaignId ? 'Campaign replies' : 'Replies inbox'}>
    <div className="outreach-section-heading"><div><h2>{campaignId ? 'Campaign replies' : 'Replies inbox'}</h2>
      <p>Read received messages here. Matching a reply stops future follow-ups for its contact.</p>
      <p>{forwardTo ? `New replies are also forwarded to ${forwardTo}.` : 'Mailbox forwarding is not configured. Incoming messages remain available here.'}</p>
    </div><div className="outreach-row-actions"><Button variant="secondary" disabled={busy} onClick={() => sync(null)}>Import existing replies</Button>{syncCursor && <Button variant="secondary" disabled={busy} onClick={() => sync(syncCursor)}>Import older replies</Button>}<Button variant="secondary" disabled={busy} onClick={() => run(refresh)}>Refresh replies</Button></div></div>
    {!opened && <><Notice>{error}</Notice><Notice type="success">{message}</Notice></>}
    {!campaignId && <label className="outreach-check"><input type="checkbox" checked={unmatchedOnly} onChange={event => setUnmatchedOnly(event.target.checked)} /> Show unmatched replies only</label>}
    {loading && <p role="status">Loading replies...</p>}
    {!loading && !visible.length && <p>No reply messages in this view. Use Import existing replies to bring in messages received before the inbox was added.{campaignId ? ' Unmatched replies appear in the main Replies inbox.' : ''}</p>}
    <div className="outreach-reply-list">{visible.map(item => <button type="button" disabled={busy} className="outreach-reply-item" key={item.publicId} onClick={() => open(item)}>
      <strong>{item.from}</strong><span>{item.subject}</span><small>{time(item.receivedAt)} - {item.links?.length ? item.links.map(link => link.company || 'Linked contact').join(', ') : 'Unmatched - review needed'}</small>
      <small>{item.forwardState === 'sent' ? 'Forwarded to mailbox' : item.forwardState === 'historical' ? 'Imported earlier reply' : ['review', 'sending'].includes(item.forwardState) ? 'Mailbox forwarding needs review; check Resend before retrying.' : 'Mailbox forwarding pending or not configured'}</small>
    </button>)}</div>
    {nextPage && <Button variant="secondary" disabled={busy} onClick={() => run(async () => {
      const { data } = await api.get('/outreach/replies', { params: { ...(campaignId ? { campaignId } : {}), before: nextPage } });
      setItems(previous => [...previous, ...(data.replies || []).filter(item => !previous.some(old => old.publicId === item.publicId))]); setNextPage(data.nextCursor || null);
    })}>Load older messages</Button>}
    {opened && <OutreachModal label="Received reply" title="Received reply" busy={busy} onClose={() => { setOpened(null); setError(''); setMessage(''); }} error={error} message={message}>
      <div className="outreach-reply-detail"><p><strong>Subject:</strong> {opened.subject}</p><p><strong>From:</strong> {opened.from}<br /><strong>Received:</strong> {time(opened.receivedAt)}</p>
        <p>{opened.links?.length ? 'Linked to: ' + opened.links.map(link => link.company || 'Contact').join(', ') : 'This reply has not been matched. Review the message and link it to a sent contact to stop follow-ups.'}</p>
        <div className="outreach-reply-body">{opened.bodyText || 'This message contains no readable text. Open the original in Resend to inspect images or attachments.'}</div>
        {opened.truncated && <p>This long message was shortened. The complete original is available in Resend.</p>}
        {opened.attachments?.length > 0 && <p>Attachments available in Resend: {opened.attachments.map(a => a.filename).join(', ')}. Attachments are not included in mailbox notification copies.</p>}
        {!opened.links?.length && !opened.receivedAt && <p>The received time is unavailable. Check the original in Resend before recording a reply against a contact.</p>}
        {!opened.links?.length && opened.receivedAt && <form onSubmit={event => { event.preventDefault(); run(async () => {
          const { data } = await api.post('/outreach/replies/' + opened.publicId + '/link', { leadId });
          setOpened(data.reply); await refresh(); await onChanged?.(); setMessage('Reply linked. Future follow-ups stopped.');
        }); }}><label className="field"><span>Link to sent contact</span><select required value={leadId} onChange={event => setLeadId(event.target.value)}><option value="">Select a contact</option>{leads.filter(lead => lead.sentAt && new Date(lead.sentAt) <= new Date(opened.receivedAt)).map(lead => <option key={lead.publicId} value={lead.publicId}>{lead.company || lead.email} - {lead.email}</option>)}</select></label><Button disabled={busy || !leadId}>Link reply and stop follow-ups</Button></form>}
      </div>
    </OutreachModal>}
  </section>;
}
