import { useCallback, useEffect, useRef, useState } from 'react';
import { api, apiMessage } from '../../api/client.js';
import { Button, Field, LoadingBlock, Notice, PageHeader, StatusBadge } from '../components/UI.jsx';
import { exampleOutreachCsv, parseOutreachCsv } from '../utils/outreachCsv.js';
import './outreach.css';

const blank = () => ({ company: '', name: '', email: '', subject: '', message: '', followup: '', followup2: '', delayDays: 4, followup2DelayDays: 10, permissionBasis: '', autoFollowup: false });
const date = value => value ? new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
function download(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function OutreachPage() {
  const [state, setState] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false), [search, setSearch] = useState(''), [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState(blank), [editing, setEditing] = useState(null), [confirming, setConfirming] = useState(null);
  const [importIssues, setImportIssues] = useState([]);
  const [campaignId, setCampaignId] = useState('');
  const [selected, setSelected] = useState([]);
  const [sendDate, setSendDate] = useState('');
  const [spacing, setSpacing] = useState(5);
  const [scheduleFollowups, setScheduleFollowups] = useState(true);
  const editor = useRef(null), confirmation = useRef(null);
  const load = useCallback(async () => { const { data } = await api.get('/outreach'); setState(data); }, []);
  useEffect(() => {
    load().catch(reason => setError(apiMessage(reason)));
    const timer = setInterval(() => load().catch(() => {}), 30000);
    return () => clearInterval(timer);
  }, [load]);
  async function action(callback) {
    setBusy(true); setError(''); setMessage('');
    try { await callback(); await load(); }
    catch (reason) { setError(reason.response ? apiMessage(reason) : reason.message); }
    finally { setBusy(false); }
  }
  function openEditor(lead) {
    setEditing(lead || null); setDraft(lead ? Object.fromEntries(Object.keys(blank()).map(key => [key, lead[key]])) : blank());
    editor.current.showModal();
  }
  async function save(event) {
    event.preventDefault();
    await action(async () => {
      if (editing) await api.patch('/outreach/' + editing.publicId, draft);
      else {
        const { data } = await api.post('/outreach/import', { rows: [draft], ...(campaignId ? { campaignId } : {}) });
        if (!data.added) throw new Error(data.skipped[0]?.reason || 'Contact could not be added.');
        // Imports intentionally disable automation; a manually reviewed draft may enable it.
        if (draft.autoFollowup) {
          const { data: fresh } = await api.get('/outreach');
          const lead = fresh.leads.find(row => row.email === draft.email.trim().toLowerCase());
          if (lead) await api.patch('/outreach/' + lead.publicId, draft);
        }
      }
      editor.current.close(); setMessage('Contact saved.');
    });
  }
  async function importFile(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    await action(async () => {
      if (file.size > 900000) throw new Error('Choose a CSV smaller than 900 KB.');
      const rows = parseOutreachCsv(await file.text());
      const { data } = await api.post('/outreach/import', { rows, ...(campaignId ? { campaignId } : {}) });
      setImportIssues(data.skipped); setMessage(`Added ${data.added} contact(s). Skipped ${data.skipped.length}. Imported contacts start with automatic follow-ups off.`);
    });
  }
  function confirmSend(lead, followup = false) {
    setConfirming({ lead, followup }); confirmation.current.showModal();
  }
  async function send(test) {
    if (!confirming) return;
    await action(async () => {
      const { lead, followup } = confirming;
      await api.post('/outreach/' + lead.publicId + '/send', { test, followup, confirmed: !test });
      confirmation.current.close(); setConfirming(null);
      setMessage(test ? 'Test completed. No email was sent; the contact remains available for live sending.' : 'Resend accepted the email. Delivery status will update through webhooks.');
    });
  }
  async function stop(lead, reason) {
    await action(async () => {
      await api.post('/outreach/' + lead.publicId + '/stop', { reason });
      setMessage(reason === 'replied' ? 'Reply recorded. Follow-ups stopped.' : 'Sending stopped for this contact.');
    });
  }
  const config = state?.config;
  const visible = (state?.leads || []).filter(lead => (!campaignId || String(lead.campaignId || '') === campaignId) && `${lead.company} ${lead.name} ${lead.email}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || (filter === 'review' ? [lead.initialState, lead.followupState].some(value => ['review', 'sending'].includes(value)) : lead.status === filter)));
  return <div className="outreach-page">
    <PageHeader eyebrow="Finance / Outreach" title="Email Outreach" description="CSV campaigns, scheduled emails, and two reply-aware follow-ups." actions={<Button disabled={busy || !state} onClick={() => openEditor(null)}>+ Add contact</Button>} />
    <Notice>{error}</Notice><Notice type="success">{message}</Notice>
    {!state ? !error && <LoadingBlock /> : <>
      <section className="outreach-card">
        <h2>Campaigns & CSV uploads</h2>
        <div className="outreach-row-actions">
          <label>Campaign <select value={campaignId} onChange={event => { setCampaignId(event.target.value); setSelected([]); }}><option value="">All / legacy contacts</option>{(state.campaigns || []).map(item => <option value={item._id} key={item._id}>{item.name} ({item.status})</option>)}</select></label>
          <Button variant="secondary" disabled={busy} onClick={() => { const name = prompt('Name your new campaign'); if (name?.trim()) action(async () => { const { data } = await api.post('/outreach/campaigns', { name: name.trim() }); setCampaignId(data.campaign._id); setMessage('Campaign created. Upload its CSV next.'); }); }}>+ New campaign</Button>
          {campaignId && <><Button variant="secondary" disabled={busy} onClick={() => action(async () => { await api.post('/outreach/campaigns/' + campaignId + '/status', { status: 'active' }); setMessage('Campaign activated. Scheduled emails can now send.'); })}>Activate</Button><Button variant="secondary" disabled={busy} onClick={() => action(async () => { await api.post('/outreach/campaigns/' + campaignId + '/status', { status: 'paused' }); setMessage('Campaign paused.'); })}>Pause</Button></>}
        </div>
        <p>Choose a campaign before uploading CSV. Re-imports add new addresses to that campaign and report duplicates; they do not erase existing contacts.</p>
      </section>
      <section className="outreach-card">
        <h2>Schedule selected contacts</h2>
        <p>Choose recipients using the checkboxes in the table. A single selection schedules individually; multiple selections use bulk scheduling.</p>
        <div className="outreach-row-actions">
          <Button variant="secondary" disabled={busy || !selected.length} onClick={() => {
            const basis = prompt('State the accurate, documented reason these selected business contacts may be approached. This is stored on each lead; it is not proof of consent.');
            if (!basis?.trim()) return;
            action(async () => {
              const { data } = await api.post('/outreach/review-contact-basis', { ids: selected, permissionBasis: basis.trim() });
              setMessage(`Updated contact basis for ${data.reviewed} selected contact(s). Review messages before scheduling.`);
            });
          }}>Set contact basis for selected</Button>
          <Button variant="secondary" disabled={busy || !visible.length} onClick={() => setSelected(visible.filter(l => l.initialState === 'pending' && !l.stoppedReason && !l.sentAt).map(l => l.publicId))}>Select all eligible on this page</Button>
          <Button variant="secondary" disabled={busy || !selected.length} onClick={() => setSelected([])}>Clear selection</Button>
        </div>
        <div className="outreach-row-actions">
          <label>Send date and time <input type="datetime-local" value={sendDate} onChange={event => setSendDate(event.target.value)} /></label>
          <label>Minutes between sends <input type="number" min="0" max="1440" value={spacing} onChange={event => setSpacing(Number(event.target.value))} /></label>
          <label><input type="checkbox" checked={scheduleFollowups} onChange={event => setScheduleFollowups(event.target.checked)} /> Enable follow-ups</label>
          <Button disabled={busy || !selected.length || !sendDate} onClick={() => action(async () => {
            if (!confirm(`Schedule ${selected.length} contact(s)? Review messages and contact basis first.`)) return;
            const iso = new Date(sendDate).toISOString();
            const { data } = await api.post('/outreach/schedule', { ids: selected, startAt: iso, intervalMinutes: spacing, autoFollowup: scheduleFollowups });
            setSelected([]); setMessage(`Scheduled ${data.scheduled} contact(s).`);
          })}>Schedule {selected.length} selected</Button>
        </div>
        <small>Times are interpreted in your browser's timezone, then saved as absolute times. Campaigns must be activated for automatic sending. Automatic follow-ups require working inbound reply detection.</small>
      </section>
      <section className="outreach-setup" aria-label="Sending setup">
        <div className="outreach-mode"><span className={`outreach-indicator ${config.live ? 'live' : ''}`} /> <strong>{config.live ? 'Live sending available' : 'Test mode'}</strong><span>{config.from || 'Sender not configured'}</span></div>
        <p>{config.live ? 'Review and confirm each email before sending.' : 'Test sends simulate delivery. Live sending requires the server Resend settings and explicit activation.'}</p>
        <p><strong>Reply tracking:</strong> {config.receiving ? `Receiving configured for ${config.replyTo}. Replies are matched by sender address.` : 'Manual. Record replies below to stop follow-ups.'} <strong>Automatic follow-ups:</strong> {config.autoFollowupReady ? 'Available for contacts enabled before sending.' : 'Off until receiving and scheduling are configured.'}</p>
        {config.requestedLive && !config.configured && <Notice>Live sending was requested, but the API key, sender, reply address, or HTTPS origin is incomplete.</Notice>}
      </section>
      <section className="outreach-stats" aria-label="Outreach totals">{[['Contacts', state.stats.total], ['Emails sent', state.stats.sent], ['Replies', state.stats.replied], ['Follow-ups sent', state.stats.followups]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
      <section className="outreach-card"><div className="outreach-section-heading"><div><h2>Import contacts</h2><p>CSV import adds drafts only. Include email, subject, message, and permissionBasis; review each contact before sending.</p></div><Button variant="secondary" disabled={busy} onClick={() => download(exampleOutreachCsv(), 'tko-outreach-template.csv', 'text/csv')}>Download CSV template</Button></div>
        <label className="field"><span>Choose CSV · up to 500 rows / 900 KB</span><input type="file" accept=".csv,text/csv" disabled={busy} onChange={importFile} /></label>
        {importIssues.length > 0 && <details><summary>{importIssues.length} skipped row(s)</summary><ul>{importIssues.map((issue, index) => <li key={index}>Row {issue.row}: {issue.reason}</li>)}</ul></details>}
      </section>
      <section className="outreach-card"><div className="outreach-section-heading"><div><h2>Contacts & messages</h2><p>{state.leads.length < state.stats.total ? `Showing the newest ${state.leads.length} of ${state.stats.total} contacts. Export includes all contacts.` : 'Select a contact to edit or review its email.'}</p></div><Button variant="secondary" disabled={busy} onClick={() => action(async () => { const { data } = await api.get('/outreach/export'); download(JSON.stringify(data, null, 2), 'tko-outreach-backup.json', 'application/json'); })}>Export backup</Button></div>
        <div className="outreach-filters"><input aria-label="Search contacts" placeholder="Search company, contact, or email" value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="Filter contacts" value={filter} onChange={event => setFilter(event.target.value)}>{[['all', 'All statuses'], ['draft', 'Drafts'], ['sent', 'Sent'], ['delivered', 'Delivered'], ['replied', 'Replied'], ['opted-out', 'Opted out'], ['review', 'Delivery review']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="outreach-table-wrap"><table className="outreach-table"><thead><tr><th>Select</th><th>Contact</th><th>Status</th><th>Follow-up</th><th>Actions</th></tr></thead><tbody>{visible.map(lead => {
          const stopped = Boolean(lead.stoppedReason), attempted = lead.initialState !== 'pending';
          const review = [lead.initialState, lead.followupState].some(value => ['sending', 'review'].includes(value));
          return <tr key={lead.publicId}><td><input type="checkbox" aria-label={`Select ${lead.email}`} disabled={busy || lead.initialState !== 'pending' || Boolean(lead.stoppedReason)} checked={selected.includes(lead.publicId)} onChange={event => setSelected(previous => event.target.checked ? [...previous, lead.publicId] : previous.filter(id => id !== lead.publicId))} /></td><td><strong>{lead.company || lead.name || 'Contact'}</strong><small>{lead.email}</small>{lead.name && <small>{lead.name}</small>}</td><td><StatusBadge status={review ? 'Needs review' : lead.status} />{review && <small>Check Resend before any further send.</small>}<small>Scheduled: {date(lead.scheduledAt)}</small><small>Sent: {date(lead.sentAt)}</small></td><td>{lead.followup2SentAt ? 'Second sent ' + date(lead.followup2SentAt) : lead.followup2DueAt ? 'Second due ' + date(lead.followup2DueAt) : lead.followupSentAt ? 'First sent ' + date(lead.followupSentAt) : lead.followupDueAt ? date(lead.followupDueAt) : stopped ? 'Stopped' : lead.autoFollowup ? 'Enabled before sending' : 'Off'}</td><td><div className="outreach-row-actions"><Button variant="secondary" disabled={busy} onClick={() => openEditor(lead)}>{attempted ? 'View' : 'Edit'}</Button>{lead.scheduledAt && !attempted && <Button variant="secondary" disabled={busy} onClick={() => action(async () => { await api.post('/outreach/' + lead.publicId + '/unschedule'); setMessage('Schedule cancelled.'); })}>Unschedule</Button>}{!stopped && !attempted && !lead.scheduledAt && <Button disabled={busy} onClick={() => confirmSend(lead)}>Review & send</Button>}{!stopped && lead.sentAt && lead.followupState === 'pending' && !lead.followupSentAt && <Button variant="secondary" disabled={busy} onClick={() => confirmSend(lead, true)}>Review follow-up</Button>}{!stopped && <><Button variant="secondary" disabled={busy} onClick={() => stop(lead, 'replied')}>Mark replied</Button><Button variant="secondary" disabled={busy} onClick={() => stop(lead, 'paused')}>Stop</Button></>}<Button variant="secondary" disabled={busy || Boolean(lead.optedOutAt)} onClick={() => stop(lead, 'opted-out')}>Opt out</Button></div></td></tr>;
        })}</tbody></table>{!visible.length && <div className="empty-state"><h3>{state.leads.length ? 'No matching contacts' : 'Your outreach starts here'}</h3><p>{state.leads.length ? 'Try another search or filter.' : 'Add a contact or import your first CSV. Nothing is sent on import.'}</p></div>}</div>
      </section>
      <section className="outreach-card"><h2>Recent activity</h2>{state.events.length ? <ol className="outreach-activity">{state.events.map((event, index) => <li key={index}><div><strong>{event.company}</strong><span>{event.type} · {event.detail}</span></div><time>{date(event.createdAt)}</time></li>)}</ol> : <p>Activity appears here after a test or live send.</p>}</section>
    </>}
    <dialog className="outreach-dialog" ref={editor} onCancel={event => { if (busy) event.preventDefault(); }}><form onSubmit={save}><div className="outreach-section-heading"><h2>{editing ? 'Contact & message' : 'Add contact'}</h2><Button type="button" variant="secondary" disabled={busy} onClick={() => editor.current.close()}>Close</Button></div>
      {editing?.initialState !== undefined && editing.initialState !== 'pending' && <p>Sending has been attempted. The message is locked to prevent duplicate or inconsistent sends.</p>}
      <fieldset disabled={busy || Boolean(editing && editing.initialState !== 'pending')} className="outreach-fields">
        {[['company', 'Company', 'text', 150], ['name', 'Contact name', 'text', 150], ['email', 'Recipient email', 'email', 254], ['subject', 'Subject', 'text', 250]].map(([key, label, type, maxLength]) => <Field key={key} label={label}><input type={type} maxLength={maxLength} required={key === 'email'} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></Field>)}
        {[['message', 'Initial email', 12000], ['followup', 'First follow-up', 12000], ['followup2', 'Second follow-up', 12000], ['permissionBasis', 'Permission or reason for contacting this person', 500]].map(([key, label, maxLength]) => <Field key={key} label={label}><textarea rows={key === 'permissionBasis' ? 2 : 5} maxLength={maxLength} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></Field>)}
        <Field label="Days after the initial email"><input type="number" min="1" max="30" required value={draft.delayDays} onChange={event => setDraft({ ...draft, delayDays: event.target.value })} /></Field>
        <Field label="Days after initial email for second follow-up"><input type="number" min="2" max="60" value={draft.followup2DelayDays} onChange={event => setDraft({ ...draft, followup2DelayDays: event.target.value })} /></Field>
        <label className="outreach-check"><input type="checkbox" disabled={!config?.autoFollowupReady} checked={draft.autoFollowup} onChange={event => setDraft({ ...draft, autoFollowup: event.target.checked })} /> Send automatic follow-ups if no reply is recorded.</label>
        {!config?.autoFollowupReady && <small>Automatic follow-ups need the receiving webhook and server scheduling settings.</small>}
        <Button disabled={busy}>{busy ? 'Saving…' : 'Save contact'}</Button>
      </fieldset>
      {error && <Notice>{error}</Notice>}
    </form></dialog>
    <dialog className="outreach-dialog" ref={confirmation} onCancel={event => { if (busy) event.preventDefault(); }}><div className="outreach-section-heading"><h2>Review {confirming?.followup ? 'follow-up' : 'email'}</h2><Button variant="secondary" disabled={busy} onClick={() => { confirmation.current.close(); setConfirming(null); }}>Close</Button></div>
      {confirming && <><p><strong>From:</strong> {config?.from || 'Not configured'}<br /><strong>To:</strong> {confirming.lead.email}<br /><strong>Subject:</strong> {confirming.followup ? 'Re: ' : ''}{confirming.lead.subject}</p><div className="outreach-preview">{confirming.followup ? confirming.lead.followup : confirming.lead.message}</div><p className="outreach-caption">An unsubscribe link is added automatically. {confirming.lead.autoFollowup && !confirming.followup ? `Follow-ups are enabled for day ${confirming.lead.delayDays} and day ${confirming.lead.followup2DelayDays}, if message text exists and no reply is recorded.` : 'No new automatic follow-up is scheduled by this action.'}</p><p><strong>Contact basis:</strong> {confirming.lead.permissionBasis || 'Missing — edit this contact before sending.'}</p></>}
      <div className="outreach-row-actions"><Button variant="secondary" disabled={busy} onClick={() => send(true)}>Test without sending</Button><Button disabled={busy || !config?.live} onClick={() => send(false)}>{busy ? 'Processing…' : 'Confirm & send email'}</Button></div>{error && <Notice>{error}</Notice>}
    </dialog>
  </div>;
}
