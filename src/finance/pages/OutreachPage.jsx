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
  const [importPreview, setImportPreview] = useState(null);
  const [importStage, setImportStage] = useState('upload');
  const [importResult, setImportResult] = useState(null);
  const [importLogs, setImportLogs] = useState([]);
  const [showImportConsole, setShowImportConsole] = useState(false);
  const [importing, setImporting] = useState(false);
  const [campaignId, setCampaignId] = useState('');
  const [view, setView] = useState('dashboard'), [step, setStep] = useState(0), [newName, setNewName] = useState('');
  const [tab, setTab] = useState('contacts'), [showSettings, setShowSettings] = useState(false), [showSchedule, setShowSchedule] = useState(false);
  const [selected, setSelected] = useState([]);
  const [basisText, setBasisText] = useState('');
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
  // Diagnostic messages deliberately exclude CSV row content, addresses and request credentials.
  function logImport(phase, detail, level = 'info') {
    const record = { at: new Date().toISOString(), phase, detail: String(detail).slice(0, 240), level };
    setImportLogs(previous => [...previous.slice(-49), record]);
    if (level === 'error') console.error('[Outreach CSV]', record);
    else console.info('[Outreach CSV]', record);
  }
  function importFailure(reason) {
    const status = reason?.response?.status;
    const message = reason?.response ? apiMessage(reason) : reason?.message || 'Unknown error';
    // API errors can include user-supplied values: redact email addresses in diagnostic output.
    const detail = String(message).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email hidden]');
    return { status, detail };
  }
  async function importFile(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setError(''); setImportResult(null); setImportIssues([]); setImportPreview(null);
    setImportStage('upload');
    logImport('File selected', `CSV size ${file.size} bytes`);
    try {
      if (!/\.csv$/i.test(file.name)) throw new Error('Choose a .csv file.');
      if (file.size > 900000) throw new Error('Choose a CSV smaller than 900 KB.');
      const rows = parseOutreachCsv(await file.text());
      if (!rows.length) throw new Error('The CSV has no contact rows.');
      setImportPreview({ rows, size: file.size, name: file.name });
      setImportStage('preview');
      logImport('CSV parsed', `${rows.length} rows ready to preview. No data uploaded yet.`);
    } catch (reason) {
      const { detail } = importFailure(reason);
      setError(detail); logImport('CSV validation failed', detail, 'error'); setShowImportConsole(true);
    }
  }
  async function commitImport() {
    if (!importPreview || !campaignId || importing) return;
    setImporting(true); setBusy(true); setError(''); setMessage(''); setImportResult(null);
    let imported = false;
    try {
      logImport('Import request', `Sending ${importPreview.rows.length} rows to campaign (contact data excluded from logs)`);
      const { data } = await api.post('/outreach/import', { rows: importPreview.rows, campaignId });
      imported = true;
      const skipped = Array.isArray(data.skipped) ? data.skipped : [];
      setImportIssues(skipped);
      setImportResult({ added: data.added, skipped: skipped.length, total: importPreview.rows.length, progressSaved: null });
      setImportPreview(null); // Import can succeed even when the next step fails; don't offer a blind retry.
      setImportStage('complete');
      logImport('Contacts saved', `${data.added} added; ${skipped.length} skipped. No emails sent.`);
      setMessage(`Imported ${data.added} contact(s); ${skipped.length} skipped. No emails sent.`);
      if (view === 'wizard' && data.added > 0) {
        try {
          await api.patch('/outreach/campaigns/' + campaignId + '/settings', { setupStep: 2 });
          setStep(2);
          setImportResult(previous => ({ ...previous, progressSaved: true }));
          logImport('Setup progress', 'Saved step 3 (Review & edit)');
        } catch (reason) {
          const { status, detail } = importFailure(reason);
          setImportResult(previous => ({ ...previous, progressSaved: false }));
          setError('Contacts were imported successfully, but wizard progress could not be saved. Open Review & edit or reopen the campaign; do not reupload the file.');
          setStep(2); // Show imported records despite settings failure.
          logImport('Progress save failed', `HTTP ${status || 'network'}: ${detail}`, 'error');
          setShowImportConsole(true);
        }
      }
    } catch (reason) {
      const { status, detail } = importFailure(reason);
      // When transport fails, the server could have committed a partial import.
      setError('Import could not be confirmed. Check campaign contacts before attempting another upload. ' + detail);
      logImport('Import not confirmed', `HTTP ${status || 'network'}: ${detail}`, 'error');
      setShowImportConsole(true);
    } finally {
      setImporting(false); setBusy(false);
      try { await load(); }
      catch (reason) { logImport('Refresh failed', `HTTP ${reason?.response?.status || 'network'}; check contacts from the dashboard`, 'error'); }
    }
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
  const campaign = (state?.campaigns || []).find(item => String(item._id) === campaignId);
  const campaignEvents = (state?.events || []).filter(event => String(event.campaignId || (state?.leads || []).find(l => l.publicId === event.leadId)?.campaignId || '') === campaignId);
  const activeCampaignId = campaign?._id;
  const campaignLeads = (state?.leads || []).filter(lead => String(lead.campaignId || '') === campaignId);
  const visible = campaignLeads.filter(lead => `${lead.company} ${lead.name} ${lead.email} ${lead.subject}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || (filter === 'review' ? [lead.initialState, lead.followupState].some(value => ['review', 'sending'].includes(value)) : lead.status === filter)));
  const sent = campaignLeads.filter(lead => Boolean(lead.sentAt));
  const replied = campaignLeads.filter(lead => Boolean(lead.repliedAt));
  function goDashboard() { setView('dashboard'); setCampaignId(''); setSelected([]); setShowSettings(false); setShowSchedule(false); }
  function adoptCampaignSettings(item) { setSendDate(item?.sendDate || ''); setSpacing(item?.spacing ?? 5); setScheduleFollowups(item?.scheduleFollowups ?? true); }
  async function persistSettings(fields, quiet = false) {
    if (!campaignId) return;
    await action(async () => { await api.patch('/outreach/campaigns/' + campaignId + '/settings', fields); if (!quiet) setMessage('Campaign settings saved.'); });
  }
  async function advanceWizard(next) {
    if (!campaignId) return;
    await action(async () => {
      await api.patch('/outreach/campaigns/' + campaignId + '/settings', { setupStep: next, sendDate, spacing, scheduleFollowups });
      setStep(next);
    });
  }
  async function finishWizard() {
    await action(async () => {
      await api.patch('/outreach/campaigns/' + campaignId + '/settings', { setupComplete: true, setupStep: 4, sendDate, spacing, scheduleFollowups });
      setView('workspace'); setTab('contacts'); setMessage('Setup completed. No emails have been sent or scheduled.');
    });
  }
  async function createCampaign() {
    if (!newName.trim()) { setError('Enter a campaign name first.'); return; }
    await action(async () => {
      const { data } = await api.post('/outreach/campaigns', { name: newName.trim() });
      setCampaignId(String(data.campaign._id)); setStep(1); setMessage('Campaign draft created. Import its CSV next.');
    });
  }
  function openCampaign(id) { const item = (state?.campaigns || []).find(c => String(c._id) === String(id)); adoptCampaignSettings(item); setStep(item?.setupStep ?? 1); setCampaignId(String(id)); setView(item?.setupComplete ? 'workspace' : 'wizard'); setTab('contacts'); setSelected([]); setSearch(''); setFilter('all'); }
  const schedulePanel = <section className="outreach-card">
        <h2>Schedule selected contacts</h2>
        <p>Select reviewed draft contacts below, set their contact basis, then schedule. Only active campaigns can schedule sends.</p>
        <Field label="Documented reason for contacting selected recipients"><textarea rows={2} maxLength={500} value={basisText} onChange={e => setBasisText(e.target.value)} placeholder="Document truthful contact basis (at least 12 characters)" /></Field>
        <div className="outreach-row-actions">
          <Button variant="secondary" disabled={busy || !selected.length} onClick={() => {
            if (basisText.trim().length < 12) { setError('Enter a documented contact basis of at least 12 characters.'); return; }
            action(async () => {
              const { data } = await api.post('/outreach/review-contact-basis', { ids: selected, permissionBasis: basisText.trim() });
              setMessage(`Updated contact basis for ${data.reviewed} selected contact(s). Review messages before scheduling.`);
            });
          }}>Set contact basis for selected</Button>
          <Button variant="secondary" disabled={busy || !visible.length} onClick={() => setSelected(visible.filter(l => l.initialState === 'pending' && !l.stoppedReason && !l.sentAt).map(l => l.publicId))}>Select eligible contacts</Button>
          <Button variant="secondary" disabled={busy || !selected.length} onClick={() => setSelected([])}>Clear selection</Button>
        </div>
        <div className="outreach-row-actions">
          <label>Send date and time <input type="datetime-local" value={sendDate} onChange={event => setSendDate(event.target.value)} /></label>
          <label>Minutes between sends <input type="number" min="0" max="1440" value={spacing} onChange={event => setSpacing(Number(event.target.value))} /></label>
          <label><input type="checkbox" checked={scheduleFollowups} onChange={event => setScheduleFollowups(event.target.checked)} /> Enable follow-ups</label>
          <Button disabled={busy || campaign?.status !== 'active' || !selected.length || !sendDate} onClick={() => action(async () => {
            if (!confirm(`Schedule ${selected.length} contact(s)? Review messages and contact basis first.`)) return;
            const iso = new Date(sendDate).toISOString();
            const { data } = await api.post('/outreach/schedule', { ids: selected, startAt: iso, intervalMinutes: spacing, autoFollowup: scheduleFollowups });
            setSelected([]); setMessage(`Scheduled ${data.scheduled} contact(s).`);
          })}>Schedule {selected.length} selected</Button>
        </div>
        <small>Times use your browser timezone. Activate the campaign before scheduling; automatic follow-ups require inbound reply detection.</small>
      </section>;
  const sendingPanel = <section className="outreach-setup" aria-label="Sending setup">
        <div className="outreach-mode"><span className={`outreach-indicator ${config?.live ? 'live' : ''}`} /> <strong>{config?.live ? 'Live sending available' : 'Test mode'}</strong><span>{config?.from || 'Sender not configured'}</span></div>
        <p>{config?.live ? 'Review and confirm each email before sending.' : 'Live sending requires server settings and explicit activation.'}</p>
        <p><strong>Reply tracking:</strong> {config?.receiving ? `Receiving configured for ${config.replyTo}.` : 'Manual reply recording required.'} <strong>Automatic follow-ups:</strong> {config?.autoFollowupReady ? 'Available with appropriate per-contact settings.' : 'Not ready until inbound receiving and scheduling are configured.'}</p>
      </section>;
  const importPanel = <section className="outreach-card outreach-import">
    <div className="outreach-section-heading"><div><h2>Import campaign contacts</h2><p>Choose a CSV, review the recognized fields and sample records, then confirm import. Nothing is sent during import.</p></div><Button variant="secondary" disabled={busy} onClick={() => download(exampleOutreachCsv(), 'tko-outreach-template.csv', 'text/csv')}>Download CSV template</Button></div>
    <div className="outreach-import-steps" aria-label="CSV import stages"><span className={importStage === 'upload' ? 'current' : ''}>1. Select CSV</span><span className={importStage === 'preview' ? 'current' : ''}>2. Preview fields</span><span className={importStage === 'complete' ? 'current' : ''}>3. Result</span></div>
    {importStage === 'upload' && <label className="outreach-dropzone"><strong>Choose a CSV to import</strong><span>CSV only · Up to 500 contacts · Maximum 900 KB</span><input type="file" accept=".csv,text/csv" disabled={busy || !campaignId} onChange={importFile} /><small>Download the template above to see supported field names.</small></label>}
    {importStage === 'preview' && importPreview && <div className="outreach-import-preview"><h3>Review before importing</h3><p><strong>{importPreview.rows.length} contacts</strong> in {importPreview.name}. Recognized fields:</p><div className="outreach-import-columns">{Object.keys(importPreview.rows[0] || {}).map(field => <span key={field}>{field}</span>)}</div><div className="outreach-import-stats">{importPreview.rows.filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(r.email || ''))).length} emails look valid · {importPreview.rows.filter(r => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(r.email || ''))).length} need review (server performs final checks)</div><p>Check column mapping against your CSV. Unrecognized columns are ignored; to correct them, rename the headers using the template and select the file again.</p><div className="outreach-row-actions"><Button variant="secondary" disabled={busy} onClick={() => { setImportPreview(null); setImportStage('upload'); }}>Choose different file</Button><Button disabled={busy} onClick={commitImport}>{importing ? 'Importing…' : `Import ${importPreview.rows.length} contacts`}</Button></div></div>}
    {importStage === 'complete' && importResult && <div className="outreach-import-result" role="status"><h3>Import request completed</h3><p><strong>{importResult.added} added</strong> · {importResult.skipped} skipped · 0 emails sent</p><p>{importResult.progressSaved === false ? 'Contacts saved, but setup progress was not saved. Do not upload again.' : 'Review imported contacts below. Imported follow-ups remain disabled.'}</p><Button variant="secondary" onClick={() => { setImportStage('upload'); setImportResult(null); }}>Import another CSV</Button></div>}
    {importIssues.length > 0 && <details open><summary>{importIssues.length} skipped row(s) — view reasons</summary><ul>{importIssues.map((issue, index) => <li key={index}>Row {issue.row}: {issue.reason}</li>)}</ul></details>}
    <details className="outreach-import-console" open={showImportConsole} onToggle={event => setShowImportConsole(event.currentTarget.open)}><summary>Import diagnostics console ({importLogs.length} events)</summary><div className="outreach-console-toolbar"><span>Technical steps and HTTP errors. CSV contents are not logged.</span><Button variant="secondary" onClick={() => { const content = importLogs.map(l => `${l.at} [${l.level}] ${l.phase}: ${l.detail}`).join('\n'); download(content, 'outreach-import-diagnostics.txt', 'text/plain'); }}>Download log</Button><Button variant="secondary" onClick={() => setImportLogs([])}>Clear</Button></div><pre>{importLogs.map(l => `${l.at} [${l.level}] ${l.phase}: ${l.detail}`).join('\n') || 'No events yet. Select a CSV to begin.'}</pre></details>
  </section>;
  const contactsPanel = <section className="outreach-card"><div className="outreach-section-heading"><div><h2>Contacts & messages</h2><p>Review CSV fields, edit drafts, select recipients and inspect sending history. Sent messages cannot be edited.</p></div><div className="outreach-row-actions"><Button variant="secondary" disabled={busy} onClick={() => openEditor(null)}>+ Add contact</Button><Button variant="secondary" disabled={busy} onClick={() => action(async () => { const { data } = await api.get('/outreach/export'); download(JSON.stringify(data, null, 2), 'tko-outreach-backup.json', 'application/json'); })}>Export backup</Button></div></div>
        <div className="outreach-filters"><input aria-label="Search contacts" placeholder="Search company, contact, email or subject" value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="Filter contacts" value={filter} onChange={event => setFilter(event.target.value)}>{[['all', 'All statuses'], ['draft', 'Drafts'], ['sent', 'Sent'], ['delivered', 'Delivered'], ['replied', 'Replied'], ['opted-out', 'Opted out'], ['review', 'Delivery review']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="outreach-table-wrap"><table className="outreach-table"><thead><tr><th>Select</th><th>Contact / Company</th><th>Email / Subject</th><th>Status</th><th>Follow-up</th><th>Actions</th></tr></thead><tbody>{visible.map(lead => {
          const stopped = Boolean(lead.stoppedReason), attempted = lead.initialState !== 'pending';
          const review = [lead.initialState, lead.followupState].some(value => ['sending', 'review'].includes(value));
          return <tr key={lead.publicId}><td><input type="checkbox" aria-label={`Select ${lead.email}`} disabled={busy || attempted || stopped} checked={selected.includes(lead.publicId)} onChange={event => setSelected(previous => event.target.checked ? [...previous, lead.publicId] : previous.filter(id => id !== lead.publicId))} /></td><td><strong>{lead.company || lead.name || 'Contact'}</strong><small>{lead.name}</small></td><td><strong>{lead.subject || 'No subject'}</strong><small>{lead.email}</small></td><td><StatusBadge status={review ? 'Needs review' : lead.status} /><small>Scheduled: {date(lead.scheduledAt)}</small><small>Sent: {date(lead.sentAt)}</small></td><td>{lead.followup2SentAt ? 'Second sent ' + date(lead.followup2SentAt) : lead.followup2DueAt ? 'Second due ' + date(lead.followup2DueAt) : lead.followupSentAt ? 'First sent ' + date(lead.followupSentAt) : lead.followupDueAt ? date(lead.followupDueAt) : stopped ? 'Stopped' : lead.autoFollowup ? 'Enabled' : 'Off'}</td><td><details className="outreach-action-menu"><summary>Actions ▾</summary><div className="outreach-action-list"><Button variant="secondary" disabled={busy} onClick={() => openEditor(lead)}>{attempted ? 'View' : 'Edit / view'}</Button>{lead.scheduledAt && !attempted && <Button variant="secondary" disabled={busy} onClick={() => action(async () => { await api.post('/outreach/' + lead.publicId + '/unschedule'); setMessage('Schedule cancelled.'); })}>Unschedule</Button>}{!stopped && !attempted && !lead.scheduledAt && <Button disabled={busy} onClick={() => confirmSend(lead)}>Review & send</Button>}{!stopped && lead.sentAt && lead.followupState === 'pending' && !lead.followupSentAt && <Button variant="secondary" disabled={busy} onClick={() => confirmSend(lead, true)}>Review follow-up</Button>}{!stopped && <><Button variant="secondary" disabled={busy} onClick={() => stop(lead, 'replied')}>Mark replied</Button><Button variant="secondary" disabled={busy} onClick={() => stop(lead, 'paused')}>Stop</Button></>}<Button variant="secondary" disabled={busy || Boolean(lead.optedOutAt)} onClick={() => stop(lead, 'opted-out')}>Opt out</Button></div></details></td></tr>;
        })}</tbody></table>{!visible.length && <div className="empty-state"><h3>No matching campaign contacts</h3><p>Import a CSV or add a contact to this campaign.</p></div>}</div>
      </section>;
  const activityPanel = <section className="outreach-card"><h2>Campaign activity</h2><p>Showing events linked to contacts in this campaign only. Older records are matched to their contacts where available.</p>{campaignEvents.length ? <ol className="outreach-activity">{campaignEvents.map((event, index) => <li key={index}><div><strong>{event.company}</strong><span>{event.type} · {event.detail}</span></div><time>{date(event.createdAt)}</time></li>)}</ol> : <p>No recent activity.</p>}</section>;
  async function changeStatus(status) { await action(async () => { await api.post('/outreach/campaigns/' + campaignId + '/status', { status }); setMessage(`Campaign ${status}.`); }); }
  return <div className="outreach-page">
    <PageHeader eyebrow="Finance / Outreach" title={view === 'dashboard' ? 'Email Outreach' : view === 'wizard' ? 'New Campaign' : (campaign?.name || 'Campaign')} description={view === 'dashboard' ? 'Manage your outreach campaigns.' : view === 'wizard' ? 'Follow the steps to prepare your campaign.' : 'Review messages, track delivery and manage contacts.'} actions={view === 'dashboard' ? <Button disabled={busy || !state} onClick={() => { setNewName(''); setCampaignId(''); setStep(0); setView('wizard'); }}>+ New Campaign</Button> : <Button variant="secondary" onClick={goDashboard}>← All campaigns</Button>} />
    <Notice>{error}</Notice><Notice type="success">{message}</Notice>
    {!state ? !error && <LoadingBlock /> : <>
    {view === 'dashboard' && <>
      <section className="outreach-stats" aria-label="Outreach totals">{[['Campaigns', state.campaigns?.length || 0], ['Contacts', state.stats.total], ['Emails sent', state.stats.sent], ['Replies', state.stats.replied]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
      <section className="outreach-card"><div className="outreach-section-heading"><div><h2>Your Campaigns</h2><p>Open a campaign to see its emails, contacts, sending controls and actions.</p></div></div>
        <div className="outreach-campaign-list">{(state.campaigns || []).map(item => { const members = state.leads.filter(lead => String(lead.campaignId || '') === String(item._id)); return <button type="button" key={item._id} className="outreach-campaign-item" onClick={() => openCampaign(item._id)}><span><strong>{item.name}</strong><small>{item.setupComplete ? item.status : 'Setup incomplete · Resume'} · {members.length} loaded contacts · {members.filter(l => l.sentAt).length} sent</small></span><span aria-hidden="true">→</span></button>; })}</div>
        {!state.campaigns?.length && <p>No campaigns yet. Select + New Campaign to get started.</p>}
      </section>
    </>}
    {view === 'wizard' && <section className="outreach-card outreach-wizard">
      <div className="outreach-wizard-progress" aria-label={`Step ${step + 1} of 5`}>{['Details', 'Import CSV', 'Review & edit', 'Settings', 'Finish'].map((label, i) => <span key={label} className={i === step ? 'current' : i < step ? 'done' : ''}>{i + 1}. {label}</span>)}</div>
      {step === 0 && <div className="outreach-wizard-body"><h2>1. Campaign details</h2><p>Name your campaign before importing any contacts.</p><Field label="Campaign name"><input maxLength={150} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. October Business Outreach" /></Field></div>}
      {step === 1 && <div className="outreach-wizard-body"><h2>2. Import CSV</h2><p>Campaign: <strong>{campaign?.name || newName}</strong>. Upload your CSV to import message fields and contacts.</p>{importPanel}</div>}
      {step === 2 && <div className="outreach-wizard-body"><h2>3. Review & edit imported data</h2><p>Open each contact to review its email subject, initial message, follow-ups, delays and contact basis.</p>{contactsPanel}</div>}
      {step === 3 && <div className="outreach-wizard-body"><h2>4. General settings</h2><p>Set your intended sending time and spacing. You can change these later from Campaign Settings.</p>{sendingPanel}<div className="outreach-row-actions"><label>Send date and time <input type="datetime-local" value={sendDate} onChange={e => setSendDate(e.target.value)} /></label><label>Minutes between sends <input type="number" min="0" max="1440" value={spacing} onChange={e => setSpacing(Number(e.target.value))} /></label><label><input type="checkbox" checked={scheduleFollowups} onChange={e => setScheduleFollowups(e.target.checked)} /> Enable follow-ups when scheduling</label></div></div>}
      {step === 4 && <div className="outreach-wizard-body"><h2>5. Review & finish</h2><p><strong>{campaign?.name}</strong> · {campaignLeads.length} contacts · {campaignLeads.filter(l => l.initialState === 'pending').length} unsent drafts</p><p>Finishing saves the campaign workspace. It does not automatically send, activate or schedule any email. Activate and schedule only after reviewing the contacts.</p>{!campaignLeads.length && <Notice>There are no imported contacts yet. You may finish as an empty draft or return to import.</Notice>}</div>}
      <div className="outreach-wizard-footer"><Button variant="secondary" onClick={() => step === 0 ? goDashboard() : advanceWizard(step - 1)}>{step === 0 ? 'Cancel' : 'Back'}</Button>{step === 0 ? <Button disabled={busy || !newName.trim()} onClick={createCampaign}>Create & continue →</Button> : step === 4 ? <Button disabled={busy} onClick={finishWizard}>Finish · Open campaign →</Button> : <Button disabled={busy} onClick={() => advanceWizard(step + 1)}>Continue →</Button>}</div>
    </section>}
    {view === 'workspace' && campaign && <>
      <div className="outreach-workspace-bar"><span><strong>Status: {campaign.status}</strong> · {campaignLeads.length} contacts · {sent.length} sent · {replied.length} replies</span><div className="outreach-row-actions"><Button variant="secondary" onClick={() => setShowSettings(true)}>General settings</Button><Button variant="secondary" onClick={() => setShowSchedule(true)}>Schedule contacts</Button>{campaign.status !== 'active' ? <Button disabled={busy} onClick={() => changeStatus('active')}>Activate campaign</Button> : <Button variant="secondary" disabled={busy} onClick={() => changeStatus('paused')}>Pause sending</Button>}</div></div>
      <section className="outreach-stats">{[['Contacts', campaignLeads.length], ['Emails sent', sent.length], ['Replies', replied.length], ['Pending', campaignLeads.filter(l => !l.sentAt && !l.stoppedReason).length]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
      <nav className="outreach-tabs" aria-label="Campaign sections">{[['contacts','Contacts & emails'],['sent','Sent emails'],['followups','Follow-ups'],['activity','Activity']].map(([key,label]) => <button type="button" key={key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); setFilter('all'); setSearch(''); setSelected([]); }}>{label}</button>)}</nav>
      {tab === 'contacts' && <>{importPanel}{contactsPanel}</>}
      {tab === 'sent' && <section className="outreach-card"><h2>Sent emails</h2><p>View sent email subjects, recipients, timestamps and follow-up state. Open a record for the complete message.</p>{sent.length ? <div className="outreach-table-wrap"><table className="outreach-table"><thead><tr><th>Recipient</th><th>Subject</th><th>Sent</th><th>Status</th><th>Actions</th></tr></thead><tbody>{sent.map(lead => <tr key={lead.publicId}><td>{lead.email}</td><td>{lead.subject}</td><td>{date(lead.sentAt)}</td><td><StatusBadge status={lead.status} /></td><td><Button variant="secondary" onClick={() => openEditor(lead)}>View email</Button></td></tr>)}</tbody></table></div> : <p>No emails have been sent from this campaign.</p>}</section>}
      {tab === 'followups' && <section className="outreach-card"><h2>Follow-ups</h2><p>Review or stop individual sequences under Contacts & emails. Follow-ups stop when replies are recorded.</p><div className="outreach-table-wrap"><table className="outreach-table"><thead><tr><th>Contact</th><th>First follow-up</th><th>Second follow-up</th><th>Action</th></tr></thead><tbody>{campaignLeads.filter(l => l.sentAt).map(lead => <tr key={lead.publicId}><td>{lead.email}</td><td>{date(lead.followupSentAt || lead.followupDueAt)}</td><td>{date(lead.followup2SentAt || lead.followup2DueAt)}</td><td><Button variant="secondary" onClick={() => openEditor(lead)}>View</Button>{!lead.stoppedReason && <Button variant="secondary" disabled={busy} onClick={() => stop(lead, 'paused')}>Stop</Button>}</td></tr>)}</tbody></table></div></section>}
      {tab === 'activity' && activityPanel}
    </>}
    </>}
    {showSettings && <div className="outreach-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowSettings(false); }}><section className="outreach-settings-modal" role="dialog" aria-modal="true" aria-label="Campaign settings"><div className="outreach-section-heading"><h2>Campaign settings</h2><Button variant="secondary" onClick={() => setShowSettings(false)}>Close</Button></div>{sendingPanel}<div className="outreach-row-actions"><label>Default send date <input type="datetime-local" value={sendDate} onChange={e => setSendDate(e.target.value)} /></label><label>Minutes between sends <input type="number" min="0" max="1440" value={spacing} onChange={e => setSpacing(Number(e.target.value))} /></label><label><input type="checkbox" checked={scheduleFollowups} onChange={e => setScheduleFollowups(e.target.checked)} /> Follow-ups by default</label></div><Button disabled={busy} onClick={() => persistSettings({ sendDate, spacing, scheduleFollowups })}>Save settings</Button></section></div>}
    {showSchedule && <div className="outreach-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowSchedule(false); }}><section className="outreach-settings-modal" role="dialog" aria-modal="true" aria-label="Schedule campaign contacts"><div className="outreach-section-heading"><h2>Schedule contacts</h2><Button variant="secondary" onClick={() => setShowSchedule(false)}>Close</Button></div>{schedulePanel}</section></div>}
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
