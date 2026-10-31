import OutreachReplies from './OutreachReplies.jsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, apiMessage } from '../../api/client.js';
import { Button, Field, LoadingBlock, Notice, PageHeader, StatusBadge } from '../components/UI.jsx';
import { exampleOutreachCsv, parseOutreachCsv } from '../utils/outreachCsv.js';
import { OUTREACH_SCHEDULE_LIMIT, eligibleForScheduling, schedulingBatch } from '../utils/outreachScheduling.js';
import { outreachActionMessage } from '../utils/outreachErrors.js';
import OutreachModal from '../components/OutreachModal.jsx';
import './outreach.css';

const blank = () => ({ company: '', name: '', email: '', subject: '', message: '', followup: '', followup2: '', delayDays: 4, followup2DelayDays: 10, permissionBasis: '', autoFollowup: false });
const validCampaignId = value => typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value);
const getCampaignId = value => {
  const id = value?._id ?? value?.id ?? value?.campaignId;
  return validCampaignId(id) ? id : null;
};
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
  const [campaignFilter, setCampaignFilter] = useState('current');
  const [campaignAction, setCampaignAction] = useState(null);
  const [campaignEdit, setCampaignEdit] = useState({ name: '', sendDate: '', spacing: 5, scheduleFollowups: false });
  const [selected, setSelected] = useState([]);
  const [batchFilter, setBatchFilter] = useState('all');
  const [basisText, setBasisText] = useState('');
  const [sendDate, setSendDate] = useState('');
  const [spacing, setSpacing] = useState(5);
  const [scheduleFollowups, setScheduleFollowups] = useState(true);
  const [nativeDialogOpen, setNativeDialogOpen] = useState(false);
  const editor = useRef(null), confirmation = useRef(null);
  const importRequest = useRef({ version: 0 });
  function resetImportPreview() {
    importRequest.current.version++;
    setImportPreview(null); setImportStage('upload');
  }
  const load = useCallback(async () => { const { data } = await api.get('/outreach'); setState(data); setSelected(previous => previous.filter(id => data.leads.some(lead => lead.publicId === id && lead.scheduling?.eligible)).slice(0, OUTREACH_SCHEDULE_LIMIT)); }, []);
  useEffect(() => {
    const requestState = importRequest.current;
    load().catch(reason => setError(apiMessage(reason)));
    const timer = setInterval(() => load().catch(() => {}), 30000);
    return () => { clearInterval(timer); requestState.version++; };
  }, [load]);
  async function action(callback) {
    setBusy(true); setError(''); setMessage('');
    try { await callback(); await load(); }
    catch (reason) { setError(outreachActionMessage(reason)); }
    finally { setBusy(false); }
  }
  async function refreshContacts() {
    setBusy(true);
    try { await load(); setError(''); setMessage('Contacts refreshed. Review their statuses before scheduling again.'); }
    catch (reason) { setError(outreachActionMessage(reason)); }
    finally { setBusy(false); }
  }
  function closeSettings() { setShowSettings(false); setError(''); setMessage(''); }
  function closeSchedule() { setShowSchedule(false); setError(''); setMessage(''); }
  function openEditor(lead) {
    setError(''); setMessage(''); setNativeDialogOpen(true);
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
    const ref = reason?.response?.data?.ref || reason?.response?.headers?.['x-outreach-import-ref'];
    const addedBeforeFailure = reason?.response?.data?.addedBeforeFailure;
    return { status, detail, ref, addedBeforeFailure };
  }
  async function importFile(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    const requestId = ++importRequest.current.version;
    const targetCampaignId = campaignId;
    setError(''); setImportResult(null); setImportIssues([]); setImportPreview(null);
    setImportStage('upload');
    logImport('File selected', `CSV size ${file.size} bytes`);
    try {
      if (!/\.csv$/i.test(file.name)) throw new Error('Choose a .csv file.');
      if (file.size > 900000) throw new Error('Choose a CSV smaller than 900 KB.');
      const contents = await file.text();
      if (requestId !== importRequest.current.version) return;
      const rows = parseOutreachCsv(contents);
      if (!rows.length) throw new Error('The CSV has no contact rows.');
      const { data } = await api.post('/outreach/import-preview', { rows, campaignId: targetCampaignId });
      if (requestId !== importRequest.current.version) return;
      setImportPreview({ rows, size: file.size, name: file.name, classification: data.rows, campaignId: targetCampaignId });
      setImportStage('preview');
      logImport('CSV parsed', `${rows.length} rows ready to preview. Preview checked; no contacts saved yet.`);
    } catch (reason) {
      if (requestId !== importRequest.current.version) return;
      const { detail } = importFailure(reason);
      setError(detail); logImport('CSV validation failed', detail, 'error'); setShowImportConsole(true);
    }
  }
  async function commitImport() {
    if (!importPreview || importing) return;
    if (importPreview.campaignId !== campaignId) {
      resetImportPreview(); setError('Choose the CSV again for this campaign.'); return;
    }
    if (!validCampaignId(campaignId) || !campaign) {
      setError('No valid campaign was selected. Return to All campaigns and open the campaign before importing.');
      logImport('Import blocked', 'Missing or invalid campaign ID; no rows were uploaded.', 'error');
      setShowImportConsole(true);
      return;
    }
    setImporting(true); setBusy(true); setError(''); setMessage(''); setImportResult(null);
    let imported = false;
    try {
      logImport('Import request', `Sending ${importPreview.rows.length} rows to campaign (contact data excluded from logs)`);
      const { data } = await api.post('/outreach/import', { rows: importPreview.rows, campaignId: importPreview.campaignId, sourceName: importPreview.name.slice(0, 160) });
      imported = true;
      if (data.added > 0) { setBatchFilter(data.batchId); setSelected([]); }
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
      const { status, detail, ref, addedBeforeFailure } = importFailure(reason);
      // When transport fails, the server could have committed a partial import.
      setError('Import could not be confirmed. Check campaign contacts before attempting another upload. ' + detail);
      logImport('Import not confirmed', `HTTP ${status || 'network'}: ${detail}${ref ? ` | Server reference: ${ref}` : ''}${Number.isInteger(addedBeforeFailure) ? ` | Saved before error: ${addedBeforeFailure}` : ''}`, 'error');
      setShowImportConsole(true);
    } finally {
      setImporting(false); setBusy(false);
      try { await load(); }
      catch (reason) { logImport('Refresh failed', `HTTP ${reason?.response?.status || 'network'}; check contacts from the dashboard`, 'error'); }
    }
  }
  function confirmSend(lead, followup = false) {
    setError(''); setMessage(''); setNativeDialogOpen(true);
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
  const campaign = (state?.campaigns || []).find(item => getCampaignId(item) === campaignId);
  const campaignEvents = (state?.events || []).filter(event => String(event.campaignId || (state?.leads || []).find(l => l.publicId === event.leadId)?.campaignId || '') === campaignId);
  const activeCampaignId = getCampaignId(campaign);
  const archived = campaign?.status === 'archived';
  const listedCampaigns = (state?.campaigns || []).filter(item => campaignFilter === 'all' || (campaignFilter === 'current' ? item.status !== 'archived' : item.status === campaignFilter));
  const campaignLeads = (state?.leads || []).filter(lead => String(lead.campaignId || '') === campaignId);
  const batches = [...new Map(campaignLeads.filter(lead => lead.importBatchId).map(lead => [lead.importBatchId, { id: lead.importBatchId, name: lead.importName, at: lead.createdAt }])).values()].sort((a, b) => new Date(b.at) - new Date(a.at));
  const eligible = eligibleForScheduling;
  const wizardBatch = schedulingBatch(campaignLeads);
  const visible = campaignLeads.filter(lead => (batchFilter === 'all' || (batchFilter === 'legacy' ? !lead.importBatchId : lead.importBatchId === batchFilter)) && `${lead.company} ${lead.name} ${lead.email} ${lead.subject}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || (filter === 'review' ? [lead.initialState, lead.followupState].some(value => ['review', 'sending'].includes(value)) : lead.status === filter)));
  const sent = campaignLeads.filter(lead => Boolean(lead.sentAt));
  const replied = campaignLeads.filter(lead => Boolean(lead.repliedAt));
  const scheduled = campaignLeads.filter(lead => lead.scheduledAt && !lead.sentAt && !lead.stoppedReason);
  const nextScheduledAt = scheduled.length ? new Date(Math.min(...scheduled.map(lead => new Date(lead.scheduledAt).getTime()))) : null;
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  function goDashboard() { resetImportPreview(); setView('dashboard'); setCampaignId(''); setSelected([]); setShowSettings(false); setShowSchedule(false); }
  function adoptCampaignSettings(item) { setSendDate(item?.sendDate || ''); setSpacing(item?.spacing ?? 5); setScheduleFollowups(Boolean(item?.scheduleFollowups && state?.config?.autoFollowupReady)); }
  async function persistSettings(fields, quiet = false) {
    if (!validCampaignId(campaignId)) { setError('A valid campaign must be selected first.'); return; }
    await action(async () => { await api.patch('/outreach/campaigns/' + campaignId + '/settings', fields); if (!quiet) setMessage('Campaign defaults saved. Use Schedule contacts to confirm sending.'); });
  }
  async function advanceWizard(next) {
    if (!validCampaignId(campaignId)) { setError('A valid campaign must be selected first.'); return; }
    await action(async () => {
      await api.patch('/outreach/campaigns/' + campaignId + '/settings', { setupStep: next, sendDate, spacing, scheduleFollowups });
      setStep(next);
    });
  }
  async function finishWizard() {
    if (!validCampaignId(campaignId)) { setError('A valid campaign must be selected first.'); return; }
    await action(async () => {
      await api.patch('/outreach/campaigns/' + campaignId + '/settings', { setupComplete: true, setupStep: 4, sendDate, spacing, scheduleFollowups });
      setView('workspace'); setTab('contacts'); setMessage('Campaign saved as draft. No contacts scheduled.');
    });
  }
  async function confirmWizardSchedule() {
    await action(async () => {
      const start = new Date(sendDate);
      if (!Number.isFinite(start.getTime()) || start.getTime() <= Date.now() + 120000) throw new Error('Choose a send time at least two minutes in the future.');
      const ids = wizardBatch.map(lead => lead.publicId);
      if (!ids.length) throw new Error('No eligible contacts. Review the reasons or save as draft.');
      const { data } = await api.post('/outreach/schedule', { ids, startAt: start.toISOString(), intervalMinutes: spacing, autoFollowup: scheduleFollowups && Boolean(config?.autoFollowupReady), confirmCampaignId: campaignId, sendDate });
      setView('workspace'); setTab('contacts'); setSelected([]);
      setMessage('Campaign activated. ' + data.scheduled + ' contact(s) scheduled; ' + (data.skipped?.length || 0) + ' skipped.');
    });
  }
  async function createCampaign() {
    if (!newName.trim()) { setError('Enter a campaign name first.'); return; }
    if (validCampaignId(campaignId)) {
      await action(async () => {
        await api.patch('/outreach/campaigns/' + campaignId + '/settings', { name: newName.trim(), setupStep: 1 });
        setStep(1); setMessage('Campaign details saved. Continue with CSV import.');
      });
      return;
    }
    await action(async () => {
      const { data } = await api.post('/outreach/campaigns', { name: newName.trim() });
      const id = getCampaignId(data?.campaign) || (validCampaignId(data?.campaignId) ? data.campaignId : null);
      if (!id) {
        throw new Error('The server created a campaign but did not return a valid campaign ID. Return to All campaigns and reopen it; do not create another duplicate campaign.');
      }
      setCampaignId(id); setStep(1); setMessage('Campaign draft created. Import its CSV next.');
    });
  }
  function openCampaign(id) {
    if (!validCampaignId(id)) { setError('This campaign has no valid ID. Reload the dashboard and contact support if the issue continues.'); return; }
    const item = (state?.campaigns || []).find(c => getCampaignId(c) === id);
    if (!item) { setError('Campaign not found. Refresh the dashboard.'); return; }
    setBatchFilter('all'); resetImportPreview(); setImportResult(null); adoptCampaignSettings(item); setNewName(item.name || ''); setStep(item?.setupStep ?? 1); setCampaignId(id); setView(item?.status !== 'draft' || item?.setupComplete ? 'workspace' : 'wizard'); setTab('contacts'); setSelected([]); setSearch(''); setFilter('all'); }
  const schedulePanel = <section className="outreach-card">
        <h2>Schedule selected contacts</h2>
        <p>Select up to 500 reviewed draft contacts per confirmation, choose a future time, then confirm scheduling. Schedule any remaining contacts in another batch. The contact note is optional. Only active campaigns can schedule sends. Already sent, queued or blocked contacts are skipped.</p><p>{visible.filter(eligible).length} eligible in this view; {visible.filter(lead => !eligible(lead)).length} skipped. Change the import group under Contacts to choose a different batch.</p>
        <Field label="Contact note for selected recipients (optional)"><textarea rows={2} maxLength={500} value={basisText} onChange={e => setBasisText(e.target.value)} placeholder="Optional internal note; your email message can explain the introduction." /></Field>
        <div className="outreach-row-actions">
          <Button variant="secondary" disabled={busy || !selected.length} onClick={() => {
            action(async () => {
              const { data } = await api.post('/outreach/review-contact-basis', { ids: selected, permissionBasis: basisText.trim() });
              setMessage(`Saved optional contact note for ${data.reviewed} selected contact(s).`);
            });
          }}>Save optional note for selected</Button>
          <Button variant="secondary" disabled={busy || !visible.length} onClick={() => setSelected(schedulingBatch(visible).map(l => l.publicId))}>Select eligible contacts</Button>
          <Button variant="secondary" disabled={busy || !selected.length} onClick={() => setSelected([])}>Clear selection</Button>
        </div>
        <div className="outreach-row-actions">
          <label>Confirmed send time ({browserTimezone}) <input type="datetime-local" value={sendDate} onChange={event => setSendDate(event.target.value)} /></label>
          <label>Minutes between sends <input type="number" min="0" max="1440" value={spacing} onChange={event => setSpacing(Number(event.target.value))} /></label>
          <label><input type="checkbox" disabled={!config?.autoFollowupReady} checked={scheduleFollowups && Boolean(config?.autoFollowupReady)} onChange={event => setScheduleFollowups(event.target.checked)} /> Enable follow-ups</label>
          <Button disabled={busy || campaign?.status !== 'active' || !selected.length || !sendDate} onClick={() => action(async () => {
            const start = new Date(sendDate);
            if (!Number.isFinite(start.getTime()) || start.getTime() <= Date.now() + 120000) throw new Error("Choose a send time at least two minutes in the future.");
            if (selected.length > OUTREACH_SCHEDULE_LIMIT) throw new Error('Select up to 500 contacts per scheduling confirmation.');
            if (!confirm(`Schedule ${selected.length} contact(s) for ${start.toLocaleString()} (${browserTimezone}), ${spacing} minute(s) apart?`)) return;
            const iso = start.toISOString();
            const { data } = await api.post('/outreach/schedule', { ids: selected, startAt: iso, intervalMinutes: spacing, autoFollowup: scheduleFollowups && Boolean(config?.autoFollowupReady) });
            setSelected([]); setShowSchedule(false); setMessage(`Confirmed: ${data.scheduled} contact(s) scheduled; ${data.skipped?.length || 0} skipped. Starting ${start.toLocaleString()} (${browserTimezone}).`);
          })}>Schedule {selected.length} selected</Button>
        </div>
        <small>Times use {browserTimezone}. Saving campaign defaults does not schedule contacts. After confirming, check that contact statuses change to Scheduled.</small>
      </section>;
  const sendingPanel = <section className="outreach-setup" aria-label="Sending setup">
        <div className="outreach-mode"><span className={`outreach-indicator ${config?.live ? 'live' : ''}`} /> <strong>{config?.live ? 'Live sending available' : 'Test mode'}</strong><span>{config?.from || 'Sender not configured'}</span></div>
        <p>{config?.live ? 'Review and confirm each email before sending.' : 'Live sending requires server settings and explicit activation.'}</p>
        <p><strong>Reply tracking:</strong> {config?.receiving ? `Receiving configured for ${config.replyTo}.` : 'Manual reply recording required.'} <strong>Automatic follow-ups:</strong> {config?.autoFollowupReady ? 'Available with appropriate per-contact settings.' : 'Not ready until inbound receiving and scheduling are configured.'}</p>
      </section>;
  const importPanel = <section className="outreach-card outreach-import">
    <div className="outreach-section-heading"><div><h2>Import campaign contacts</h2><p>Choose a CSV, review the recognized fields and sample records, then confirm import. Nothing is sent during import.</p></div><Button variant="secondary" disabled={busy} onClick={() => download(exampleOutreachCsv(), 'tko-outreach-template.csv', 'text/csv')}>Download CSV template</Button></div>
    <div className="outreach-import-steps" aria-label="CSV import stages"><span className={importStage === 'upload' ? 'current' : ''}>1. Select CSV</span><span className={importStage === 'preview' ? 'current' : ''}>2. Preview fields</span><span className={importStage === 'complete' ? 'current' : ''}>3. Result</span></div>
    {importStage === 'upload' && <label className="outreach-dropzone"><strong>Choose a CSV to import</strong><span>CSV only · Up to 500 contacts · Maximum 900 KB</span><input type="file" accept=".csv,text/csv" disabled={busy || archived || !validCampaignId(campaignId) || !campaign} onChange={importFile} /><small>Download the template above to see supported field names.</small></label>}
    {importStage === 'preview' && importPreview?.campaignId === campaignId && <div className="outreach-import-preview"><h3>Review before importing</h3><p><strong>{importPreview.rows.length} contacts</strong> in {importPreview.name}. Recognized fields:</p><div className="outreach-import-columns">{Object.keys(importPreview.rows[0] || {}).map(field => <span key={field}>{field}</span>)}</div><div className="outreach-import-stats">{importPreview.rows.filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(r.email || ''))).length} emails look valid · {importPreview.rows.filter(r => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(r.email || ''))).length} need review (server performs final checks)</div><p>{importPreview.classification?.filter(row => row.eligible).length || 0} new eligible contacts. Duplicates are skipped; contacts blocked by another sequence remain drafts.</p><details><summary>Eligibility by CSV row</summary><ul>{importPreview.classification?.map(row => <li key={row.row}>Row {row.row}: {row.reason}</li>)}</ul></details><p>Check column mapping against your CSV. Unrecognized columns are ignored; to correct them, rename the headers using the template and select the file again.</p><div className="outreach-row-actions"><Button variant="secondary" disabled={busy} onClick={() => { resetImportPreview(); }}>Choose different file</Button><Button disabled={busy} onClick={commitImport}>{importing ? 'Importing…' : `Import ${importPreview.rows.length} contacts`}</Button></div></div>}
    {importStage === 'complete' && importResult && <div className="outreach-import-result" role="status"><h3>Import request completed</h3><p><strong>{importResult.added} added</strong> · {importResult.skipped} skipped · 0 emails sent</p><p>{importResult.progressSaved === false ? 'Contacts saved, but setup progress was not saved. Do not upload again.' : 'Review imported contacts below. Imported follow-ups remain disabled.'}</p><Button variant="secondary" onClick={() => { setImportStage('upload'); setImportResult(null); }}>Import another CSV</Button></div>}
    {importIssues.length > 0 && <details open><summary>{importIssues.length} skipped row(s) — view reasons</summary><ul>{importIssues.map((issue, index) => <li key={index}>Row {issue.row}: {issue.reason}</li>)}</ul></details>}
    <details className="outreach-import-console" open={showImportConsole} onToggle={event => setShowImportConsole(event.currentTarget.open)}><summary>Import diagnostics console ({importLogs.length} events)</summary><div className="outreach-console-toolbar"><span>Technical steps and HTTP errors. CSV contents are not logged.</span><Button variant="secondary" onClick={() => { const content = importLogs.map(l => `${l.at} [${l.level}] ${l.phase}: ${l.detail}`).join('\n'); download(content, 'outreach-import-diagnostics.txt', 'text/plain'); }}>Download log</Button><Button variant="secondary" onClick={() => setImportLogs([])}>Clear</Button></div><pre>{importLogs.map(l => `${l.at} [${l.level}] ${l.phase}: ${l.detail}`).join('\n') || 'No events yet. Select a CSV to begin.'}</pre></details>
  </section>;
  const contactsPanel = <section className="outreach-card"><div className="outreach-section-heading"><div><h2>Contacts & messages</h2><p>Review CSV fields, edit drafts, select recipients and inspect sending history. Sent messages cannot be edited.</p></div><div className="outreach-row-actions"><Button variant="secondary" disabled={busy || archived} onClick={() => openEditor(null)}>+ Add contact</Button><Button variant="secondary" disabled={busy} onClick={() => action(async () => { const { data } = await api.get('/outreach/export'); download(JSON.stringify(data, null, 2), 'tko-outreach-backup.json', 'application/json'); })}>Export backup</Button></div></div>
        <div className="outreach-filters"><select aria-label="Import group" value={batchFilter} onChange={event => { setBatchFilter(event.target.value); setSelected([]); }}><option value="all">All campaign contacts</option>{batches.map((batch, index) => <option key={batch.id} value={batch.id}>{index === 0 ? 'Latest CSV import: ' : ''}{batch.name} - {date(batch.at)}</option>)}{campaignLeads.some(lead => !lead.importBatchId) && <option value="legacy">Earlier contacts (before import tracking)</option>}</select><input aria-label="Search contacts" placeholder="Search company, contact, email or subject" value={search} onChange={event => { setSearch(event.target.value); setSelected([]); }} /><select aria-label="Filter contacts" value={filter} onChange={event => { setFilter(event.target.value); setSelected([]); }}>{[['all', 'All statuses'], ['draft', 'Drafts'], ['sent', 'Sent'], ['delivered', 'Delivered'], ['replied', 'Replied'], ['opted-out', 'Opted out'], ['review', 'Delivery review']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="outreach-table-wrap"><table className="outreach-table"><thead><tr><th>Select</th><th>Contact / Company</th><th>Email / Subject</th><th>Status</th><th>Follow-up</th><th>Actions</th></tr></thead><tbody>{visible.map(lead => {
          const stopped = Boolean(lead.stoppedReason), attempted = lead.initialState !== 'pending';
          const review = [lead.initialState, lead.followupState].some(value => ['sending', 'review'].includes(value));
          return <tr key={lead.publicId}><td><input type="checkbox" aria-label={`Select ${lead.email}`} disabled={busy || !eligible(lead) || (selected.length >= OUTREACH_SCHEDULE_LIMIT && !selected.includes(lead.publicId))} title={lead.scheduling?.reason || (selected.length >= OUTREACH_SCHEDULE_LIMIT && !selected.includes(lead.publicId) ? 'Select up to 500 contacts per confirmation' : 'Eligible to schedule')} checked={selected.includes(lead.publicId)} onChange={event => setSelected(previous => event.target.checked ? [...previous, lead.publicId].slice(0, OUTREACH_SCHEDULE_LIMIT) : previous.filter(id => id !== lead.publicId))} /></td><td><strong>{lead.company || lead.name || 'Contact'}</strong><small>{lead.name}</small></td><td><strong>{lead.subject || 'No subject'}</strong><small>{lead.email}</small></td><td><StatusBadge status={review ? 'Needs review' : lead.status} /><small>{lead.scheduling?.reason || 'Eligible to schedule'}</small><small>Scheduled: {date(lead.scheduledAt)}</small><small>Sent: {date(lead.sentAt)}</small></td><td>{lead.followup2SentAt ? 'Second sent ' + date(lead.followup2SentAt) : lead.followup2DueAt ? 'Second due ' + date(lead.followup2DueAt) : lead.followupSentAt ? 'First sent ' + date(lead.followupSentAt) : lead.followupDueAt ? date(lead.followupDueAt) : stopped ? 'Stopped' : lead.autoFollowup ? 'Enabled' : 'Off'}</td><td><details className="outreach-action-menu"><summary>Actions ▾</summary><div className="outreach-action-list"><Button variant="secondary" disabled={busy} onClick={() => openEditor(lead)}>{attempted ? 'View' : 'Edit / view'}</Button>{lead.scheduledAt && !attempted && <Button variant="secondary" disabled={busy} onClick={() => action(async () => { await api.post('/outreach/' + lead.publicId + '/unschedule'); setMessage('Schedule cancelled.'); })}>Unschedule</Button>}{!archived && !stopped && !attempted && !lead.scheduledAt && <Button disabled={busy} onClick={() => confirmSend(lead)}>Review & send</Button>}{!archived && !stopped && lead.sentAt && lead.followupState === 'pending' && !lead.followupSentAt && <Button variant="secondary" disabled={busy} onClick={() => confirmSend(lead, true)}>Review follow-up</Button>}{!stopped && <><Button variant="secondary" disabled={busy} onClick={() => stop(lead, 'replied')}>Mark replied</Button><Button variant="secondary" disabled={busy} onClick={() => stop(lead, 'paused')}>Stop</Button></>}<Button variant="secondary" disabled={busy || Boolean(lead.optedOutAt)} onClick={() => stop(lead, 'opted-out')}>Opt out</Button></div></details></td></tr>;
        })}</tbody></table>{!visible.length && <div className="empty-state"><h3>No matching campaign contacts</h3><p>Import a CSV or add a contact to this campaign.</p></div>}</div>
      </section>;
  const activityPanel = <section className="outreach-card"><h2>Campaign activity</h2><p>Showing events linked to contacts in this campaign only. Older records are matched to their contacts where available.</p>{campaignEvents.length ? <ol className="outreach-activity">{campaignEvents.map((event, index) => <li key={index}><div><strong>{event.company}</strong><span>{event.type} · {event.detail}</span></div><time>{date(event.createdAt)}</time></li>)}</ol> : <p>No recent activity.</p>}</section>;
  async function openCampaignAction(item, kind, event) {
    event?.currentTarget.closest('details')?.removeAttribute('open');
    setBusy(true); setError(''); setMessage('');
    try {
      const { data } = await api.get('/outreach/campaigns/' + getCampaignId(item) + '/summary');
      if (!data.campaign) throw new Error('Campaign details could not be loaded. Refresh and try again.');
      setCampaignEdit({ name: data.campaign.name, sendDate: data.campaign.sendDate || '', spacing: data.campaign.spacing ?? 5, scheduleFollowups: Boolean(data.campaign.scheduleFollowups && config?.autoFollowupReady) });
      setCampaignAction({ kind, campaign: data.campaign });
    } catch (reason) { setError(outreachActionMessage(reason)); }
    finally { setBusy(false); }
  }
  function closeCampaignAction() { setCampaignAction(null); setError(''); setMessage(''); }
  async function confirmCampaignAction(event) {
    event?.preventDefault();
    if (!campaignAction) return;
    const { kind, campaign: target } = campaignAction, id = getCampaignId(target);
    await action(async () => {
      if (kind === 'edit') {
        await api.patch('/outreach/campaigns/' + id + '/settings', { ...campaignEdit, name: campaignEdit.name.trim() });
        if (campaignId === id) adoptCampaignSettings(campaignEdit);
      } else if (kind === 'delete') {
        await api.delete('/outreach/campaigns/' + id, { data: { confirmed: true, expectedUpdatedAt: target.updatedAt } });
        if (campaignId === id) goDashboard();
      } else {
        await api.post('/outreach/campaigns/' + id + '/status', { status: kind, confirmed: true, expectedUpdatedAt: target.updatedAt });
      }
      setCampaignAction(null);
      setMessage(kind === 'edit' ? 'Campaign details saved. Existing schedules are unchanged.' : kind === 'delete' ? 'Draft campaign deleted.' : kind === 'archived' ? 'Campaign archived. Queued sends and follow-ups cancelled; history kept.' : kind === 'restore' ? 'Campaign restored without resuming sending. Review it before activating or scheduling.' : kind === 'active' ? 'Campaign activated. Pending due sends may now be processed.' : 'Campaign paused. Pending sending is on hold.');
    });
  }
  const actionTitles = { edit: 'Edit campaign', active: 'Activate or resume campaign', paused: 'Pause campaign', archived: 'Archive campaign', restore: 'Restore campaign', delete: 'Delete draft campaign' };
  return <div className="outreach-page">
    <PageHeader eyebrow="Finance / Outreach" title={view === 'replies' ? 'Replies' : view === 'dashboard' ? 'Email Outreach' : view === 'wizard' ? 'New Campaign' : (campaign?.name || 'Campaign')} description={view === 'dashboard' ? 'Manage your outreach campaigns.' : view === 'wizard' ? 'Follow the steps to prepare your campaign.' : 'Review messages, track delivery and manage contacts.'} actions={view === 'dashboard' ? <div className="outreach-row-actions"><Button variant="secondary" disabled={busy || !state} onClick={() => { setError(''); setMessage(''); setView('replies'); }}>Replies{state?.stats?.replyUnread > 0 && <span className="outreach-unread">{state.stats.replyUnread}</span>}</Button><Button disabled={busy || !state} onClick={() => { setNewName(''); setCampaignId(''); setBatchFilter('all'); resetImportPreview(); setImportResult(null); setSelected([]); setSendDate(''); setSpacing(5); setScheduleFollowups(false); setStep(0); setView('wizard'); }}>+ New Campaign</Button></div> : <Button variant="secondary" disabled={busy || importing} onClick={goDashboard}>← All campaigns</Button>} />
    {!showSettings && !showSchedule && !nativeDialogOpen && !campaignAction && <><Notice>{error}</Notice><Notice type="success">{message}</Notice></>}
    {!state ? !error && <LoadingBlock /> : <>
    {view === 'dashboard' && <>
      <section className="outreach-stats" aria-label="Outreach totals">{[['Campaigns', state.campaigns?.length || 0], ['Contacts', state.stats.total], ['Emails sent', state.stats.sent], ['Replies', state.stats.replied]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
      <section className="outreach-card"><div className="outreach-section-heading"><div><h2>Your Campaigns</h2><p>Open a campaign to see its emails, contacts, sending controls and actions.</p></div></div>
        <div className="outreach-campaign-filters" role="group" aria-label="Campaign status filters">{[['current','Current'],['all','All'],['active','Active'],['paused','Paused'],['draft','Draft'],['archived','Archived']].map(([value,label]) => <Button key={value} variant={campaignFilter === value ? 'primary' : 'secondary'} aria-pressed={campaignFilter === value} onClick={() => setCampaignFilter(value)}>{label}</Button>)}</div>
        <p>{campaignFilter === 'current' ? 'Current campaigns. Archived campaigns are available under Archived or All.' : 'Showing ' + campaignFilter + ' campaigns.'}</p>
        <div className="outreach-campaign-list">{listedCampaigns.map(item => { const members = state.leads.filter(lead => String(lead.campaignId || '') === getCampaignId(item)); return <article key={getCampaignId(item) || item.name} className="outreach-campaign-row">
          <button type="button" disabled={busy} className="outreach-campaign-item" onClick={() => openCampaign(getCampaignId(item))}><span><strong>{item.name}</strong><small>{item.status === 'archived' ? 'Archived' : item.setupComplete ? item.status : 'Setup incomplete - Resume'} - {item.stats?.contacts ?? members.length} contacts - {item.stats?.sent ?? members.filter(l => l.sentAt).length} sent</small></span><span aria-hidden="true">Open</span></button>
          <details className="outreach-campaign-menu"><summary aria-label={'Actions for ' + item.name}>Actions</summary><div className="outreach-campaign-menu-items">
            <Button variant="secondary" disabled={busy} onClick={() => openCampaign(getCampaignId(item))}>{!item.setupComplete && item.status === 'draft' ? 'Resume setup' : 'Open campaign'}</Button>
            {item.status !== 'archived' && <><Button variant="secondary" disabled={busy} onClick={event => openCampaignAction(item, 'edit', event)}>Edit campaign</Button><Button variant="secondary" disabled={busy} onClick={event => openCampaignAction(item, item.status === 'active' ? 'paused' : 'active', event)}>{item.status === 'active' ? 'Pause sending' : item.status === 'paused' ? 'Resume sending' : 'Activate campaign'}</Button><Button variant="secondary" disabled={busy} onClick={event => openCampaignAction(item, 'archived', event)}>Archive campaign</Button></>}
            {item.status === 'archived' && <Button variant="secondary" disabled={busy} onClick={event => openCampaignAction(item, 'restore', event)}>Restore campaign</Button>}
            {item.canDelete && <Button variant="secondary" className="outreach-delete-action" disabled={busy} onClick={event => openCampaignAction(item, 'delete', event)}>Delete draft</Button>}
          </div></details>
        </article>; })}</div>
        {!listedCampaigns.length && <p>No campaigns in this view.</p>}
      </section>
    </>}
    {view === 'replies' && <OutreachReplies leads={state.leads} forwardTo={config?.replyForwardTo} onChanged={load} />}
    {view === 'wizard' && <section className="outreach-card outreach-wizard">
      <div className="outreach-wizard-progress" aria-label={`Step ${step + 1} of 5`}>{['Details', 'Import CSV', 'Review & edit', 'Settings', 'Finish'].map((label, i) => <span key={label} className={i === step ? 'current' : i < step ? 'done' : ''}>{i + 1}. {label}</span>)}</div>
      {step === 0 && <div className="outreach-wizard-body"><h2>1. Campaign details</h2><p>Name your campaign before importing any contacts.</p><Field label="Campaign name"><input maxLength={150} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. October Business Outreach" /></Field></div>}
      {step === 1 && <div className="outreach-wizard-body"><h2>2. Import CSV</h2><p>Campaign: <strong>{campaign?.name || newName}</strong>. Upload your CSV to import message fields and contacts.</p>{importPanel}</div>}
      {step === 2 && <div className="outreach-wizard-body"><h2>3. Review & edit imported data</h2><p>Open each contact to review its email subject, initial message, follow-ups, delays and optional contact note.</p>{contactsPanel}</div>}
      {step === 3 && <div className="outreach-wizard-body"><h2>4. General settings</h2><p>Choose timing and spacing for the final Confirm & schedule step, or save as draft.</p>{sendingPanel}<div className="outreach-row-actions"><label>Send date for confirmation ({browserTimezone}) <input type="datetime-local" value={sendDate} onChange={e => setSendDate(e.target.value)} /></label><label>Minutes between sends <input type="number" min="0" max="1440" value={spacing} onChange={e => setSpacing(Number(e.target.value))} /></label><label><input type="checkbox" disabled={!config?.autoFollowupReady} checked={scheduleFollowups && Boolean(config?.autoFollowupReady)} onChange={e => setScheduleFollowups(e.target.checked)} /> Enable follow-ups when scheduling</label></div></div>}
      {step === 4 && <div className="outreach-wizard-body"><h2>5. Review & finish</h2><p><strong>{campaign?.name}</strong> · {campaignLeads.length} contacts · {campaignLeads.filter(eligible).length} eligible drafts</p><p>{wizardBatch.length} eligible contacts will be queued; {campaignLeads.filter(lead => !eligible(lead)).length} skipped. Confirming activates this campaign.</p>{campaignLeads.filter(eligible).length > wizardBatch.length && <p>Up to 500 contacts can be scheduled per confirmation. The remaining {campaignLeads.filter(eligible).length - wizardBatch.length} eligible contact(s) will stay as drafts; schedule them from the campaign workspace after this batch.</p>}<p>Start: <strong>{sendDate ? date(new Date(sendDate)) : 'Choose a future send date'}</strong> ({browserTimezone}), {spacing} minute(s) apart. Follow-ups: {scheduleFollowups && config?.autoFollowupReady ? 'Enabled when message text exists' : 'Off'}.</p><p>Review the contacts and timing, then Confirm & schedule. You can also save as draft.</p>{!campaignLeads.length && <Notice>There are no imported contacts yet. You may finish as an empty draft or return to import.</Notice>}</div>}
      <div className="outreach-wizard-footer"><Button variant="secondary" onClick={() => step === 0 ? goDashboard() : advanceWizard(step - 1)}>{step === 0 ? 'Cancel' : 'Back'}</Button>{step === 0 ? <Button disabled={busy || !newName.trim()} onClick={createCampaign}>{validCampaignId(campaignId) ? 'Save & continue →' : 'Create & continue →'}</Button> : step === 4 ? <><Button variant="secondary" disabled={busy} onClick={finishWizard}>Save as draft</Button><Button disabled={busy || !sendDate || !campaignLeads.some(eligible)} onClick={confirmWizardSchedule}>Confirm &amp; schedule</Button></> : <Button disabled={busy} onClick={() => advanceWizard(step + 1)}>Continue →</Button>}</div>
    </section>}
    {view === 'workspace' && campaign && <>
      <div className="outreach-workspace-bar"><span><strong>Status: {campaign.status}</strong> · {campaignLeads.length} contacts · {sent.length} sent · {replied.length} replies</span><div className="outreach-row-actions"><Button variant="secondary" disabled={busy || archived} onClick={() => { setError(''); setMessage(''); setShowSettings(true); }}>General settings</Button><Button variant="secondary" disabled={busy || archived} onClick={() => { setError(''); setMessage(''); setSelected(previous => previous.length ? previous.filter(id => visible.some(lead => lead.publicId === id && eligible(lead))) : schedulingBatch(visible).map(lead => lead.publicId)); setShowSchedule(true); }}>Schedule new eligible contacts</Button>{campaign.status !== 'active' ? <Button disabled={busy} onClick={() => openCampaignAction(campaign, archived ? 'restore' : 'active')}>{archived ? 'Restore campaign' : campaign.status === 'paused' ? 'Resume sending' : 'Activate campaign'}</Button> : <Button variant="secondary" disabled={busy} onClick={() => openCampaignAction(campaign, 'paused')}>Pause sending</Button>}</div></div>
      <section className="outreach-stats">{[['Contacts', campaignLeads.length], ['Emails sent', sent.length], ['Replies', replied.length], ['Scheduled', scheduled.length], ['Unscheduled drafts', campaignLeads.filter(l => !l.sentAt && !l.stoppedReason && !l.scheduledAt).length]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
      {archived && <Notice type="success">This campaign is archived. Queued sending was cancelled; messages and history remain available. Restore it to make changes.</Notice>}
      <p role="status">{scheduled.length ? `${scheduled.length} contact(s) scheduled. Next send: ${date(nextScheduledAt)} (${browserTimezone}).` : "No emails scheduled. Activate the campaign, then use Schedule new eligible contacts to confirm recipients and a future time."}</p>
      <nav className="outreach-tabs" aria-label="Campaign sections">{[['contacts','Contacts & emails'],['sent','Sent emails'],['followups','Follow-ups'],['replies','Replies'],['activity','Activity']].map(([key,label]) => <button type="button" key={key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); setFilter('all'); setSearch(''); setSelected([]); }} aria-label={key === 'replies' ? 'Replies' : undefined}>{label}{key === 'replies' && campaign.unreadReplies > 0 && <span className="outreach-unread" aria-hidden="true">{campaign.unreadReplies}</span>}</button>)}</nav>
      {tab === 'contacts' && <>{importPanel}{contactsPanel}</>}
      {tab === 'sent' && <section className="outreach-card"><h2>Sent emails</h2><p>View sent email subjects, recipients, timestamps and follow-up state. Open a record for the complete message.</p>{sent.length ? <div className="outreach-table-wrap"><table className="outreach-table"><thead><tr><th>Recipient</th><th>Subject</th><th>Sent</th><th>Status</th><th>Actions</th></tr></thead><tbody>{sent.map(lead => <tr key={lead.publicId}><td>{lead.email}</td><td>{lead.subject}</td><td>{date(lead.sentAt)}</td><td><StatusBadge status={lead.status} /></td><td><Button variant="secondary" onClick={() => openEditor(lead)}>View email</Button></td></tr>)}</tbody></table></div> : <p>No emails have been sent from this campaign.</p>}</section>}
      {tab === 'followups' && <section className="outreach-card"><h2>Follow-ups</h2><p>Review or stop individual sequences under Contacts & emails. Follow-ups stop when replies are recorded.</p><div className="outreach-table-wrap"><table className="outreach-table"><thead><tr><th>Contact</th><th>First follow-up</th><th>Second follow-up</th><th>Action</th></tr></thead><tbody>{campaignLeads.filter(l => l.sentAt).map(lead => <tr key={lead.publicId}><td>{lead.email}</td><td>{date(lead.followupSentAt || lead.followupDueAt)}</td><td>{date(lead.followup2SentAt || lead.followup2DueAt)}</td><td><Button variant="secondary" onClick={() => openEditor(lead)}>View</Button>{!lead.stoppedReason && <Button variant="secondary" disabled={busy} onClick={() => stop(lead, 'paused')}>Stop</Button>}</td></tr>)}</tbody></table></div></section>}
      {tab === 'replies' && <OutreachReplies campaignId={campaignId} leads={campaignLeads} forwardTo={config?.replyForwardTo} onChanged={load} />}
      {tab === 'activity' && activityPanel}
    </>}
    </>}
    {campaignAction && <OutreachModal label="Campaign action" title={actionTitles[campaignAction.kind]} busy={busy} onClose={closeCampaignAction} error={error} message={message}>
      <form onSubmit={confirmCampaignAction} className="outreach-campaign-action-form">
        <p><strong>{campaignAction.campaign.name}</strong> - {campaignAction.campaign.stats?.contacts || 0} contacts - {campaignAction.campaign.stats?.sent || 0} sent</p>
        {campaignAction.kind === 'edit' ? <>
          <Field label="Campaign name"><input required maxLength={150} value={campaignEdit.name} onChange={event => setCampaignEdit({ ...campaignEdit, name: event.target.value })} /></Field>
          <Field label={'Default send date (' + browserTimezone + ')'}><input type="datetime-local" value={campaignEdit.sendDate} onChange={event => setCampaignEdit({ ...campaignEdit, sendDate: event.target.value })} /></Field>
          <Field label="Minutes between sends"><input type="number" min="0" max="1440" required value={campaignEdit.spacing} onChange={event => setCampaignEdit({ ...campaignEdit, spacing: Number(event.target.value) })} /></Field>
          <label><input type="checkbox" disabled={!config?.autoFollowupReady} checked={campaignEdit.scheduleFollowups} onChange={event => setCampaignEdit({ ...campaignEdit, scheduleFollowups: event.target.checked })} /> Follow-ups by default</label>
          <p>These are campaign defaults. Existing contact schedules will stay unchanged.</p>
        </> : campaignAction.kind === 'active' ? <><p>{campaignAction.campaign.stats?.scheduled || 0} scheduled contacts and {campaignAction.campaign.stats?.followups || 0} follow-up sequences are waiting.</p><p><strong>{campaignAction.campaign.stats?.overdue || 0} contact(s) have overdue work.</strong> Activating allows pending due sends and follow-ups to be processed immediately, including work that becomes due while this confirmation is open.</p></>
          : campaignAction.kind === 'paused' ? <p>Pause scheduled sends and follow-ups. Dates and messages are kept for review before resuming. Emails already being processed may finish.</p>
          : campaignAction.kind === 'archived' ? <><p>Cancel {campaignAction.campaign.stats?.scheduled || 0} queued initial sends and {campaignAction.campaign.stats?.followups || 0} follow-up sequences, then hide this campaign from Current.</p><p>Delivery and reply history will be kept. Emails already being processed may finish. Restoring will not recreate cancelled schedules.</p></>
          : campaignAction.kind === 'restore' ? <p>Restore this campaign to {campaignAction.campaign.archivedFromStatus === 'draft' ? 'Draft' : 'Paused'}. Sending will stay off; review and explicitly schedule or resume it afterward.</p>
          : <p>Permanently delete this draft and its contacts. This cannot be undone. Campaigns with delivery attempts or reply history must be archived instead.</p>}
        <Button disabled={busy || (campaignAction.kind === 'edit' && !campaignEdit.name.trim()) || (campaignAction.kind === 'delete' && !campaignAction.campaign.canDelete)}>{campaignAction.kind === 'edit' ? 'Save campaign changes' : campaignAction.kind === 'delete' ? 'Confirm delete draft' : campaignAction.kind === 'archived' ? 'Confirm archive' : campaignAction.kind === 'restore' ? 'Confirm restore' : campaignAction.kind === 'active' ? 'Confirm activation' : 'Confirm pause'}</Button>
      </form>
    </OutreachModal>}
    {showSettings && <OutreachModal label="Campaign settings" title="Campaign defaults" busy={busy} onClose={closeSettings} error={error} message={message}>{sendingPanel}<div className="outreach-row-actions"><label>Default send date ({browserTimezone}; not scheduled yet) <input type="datetime-local" value={sendDate} onChange={e => setSendDate(e.target.value)} /></label><label>Minutes between sends <input type="number" min="0" max="1440" value={spacing} onChange={e => setSpacing(Number(e.target.value))} /></label><label><input type="checkbox" disabled={!config?.autoFollowupReady} checked={scheduleFollowups && Boolean(config?.autoFollowupReady)} onChange={e => setScheduleFollowups(e.target.checked)} /> Follow-ups by default</label></div><Button disabled={busy} onClick={() => persistSettings({ sendDate, spacing, scheduleFollowups })}>Save settings</Button></OutreachModal>}
    {showSchedule && <OutreachModal label="Schedule campaign contacts" title="Schedule contacts" busy={busy} onClose={closeSchedule} error={error} message={message} onRefresh={refreshContacts}>{schedulePanel}</OutreachModal>}
    <dialog className="outreach-dialog" ref={editor} onClose={() => { setNativeDialogOpen(false); setError(''); }} onCancel={event => { if (busy) event.preventDefault(); }}><form onSubmit={save}><div className="outreach-section-heading"><h2>{editing ? 'Contact & message' : 'Add contact'}</h2><Button type="button" variant="secondary" disabled={busy} onClick={() => editor.current.close()}>Close</Button></div>
      {editing?.initialState !== undefined && editing.initialState !== 'pending' && <p>Sending has been attempted. The message is locked to prevent duplicate or inconsistent sends.</p>}
      <fieldset disabled={busy || archived || Boolean(editing && editing.initialState !== 'pending')} className="outreach-fields">
        {[['company', 'Company', 'text', 150], ['name', 'Contact name', 'text', 150], ['email', 'Recipient email', 'email', 254], ['subject', 'Subject', 'text', 250]].map(([key, label, type, maxLength]) => <Field key={key} label={label}><input type={type} maxLength={maxLength} required={key === 'email'} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></Field>)}
        {[['message', 'Initial email', 12000], ['followup', 'First follow-up', 12000], ['followup2', 'Second follow-up', 12000], ['permissionBasis', 'Contact note (optional)', 500]].map(([key, label, maxLength]) => <Field key={key} label={label}><textarea rows={key === 'permissionBasis' ? 2 : 5} maxLength={maxLength} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></Field>)}
        <Field label="Days after the initial email"><input type="number" min="1" max="30" required value={draft.delayDays} onChange={event => setDraft({ ...draft, delayDays: event.target.value })} /></Field>
        <Field label="Days after initial email for second follow-up"><input type="number" min="2" max="60" value={draft.followup2DelayDays} onChange={event => setDraft({ ...draft, followup2DelayDays: event.target.value })} /></Field>
        <label className="outreach-check"><input type="checkbox" disabled={!config?.autoFollowupReady} checked={draft.autoFollowup} onChange={event => setDraft({ ...draft, autoFollowup: event.target.checked })} /> Send automatic follow-ups if no reply is recorded.</label>
        {!config?.autoFollowupReady && <small>Automatic follow-ups need the receiving webhook and server scheduling settings.</small>}
        <Button disabled={busy}>{busy ? 'Saving…' : 'Save contact'}</Button>
      </fieldset>
      {error && <Notice>{error}</Notice>}
    </form></dialog>
    <dialog className="outreach-dialog" ref={confirmation} onClose={() => { setNativeDialogOpen(false); setError(''); }} onCancel={event => { if (busy) event.preventDefault(); }}><div className="outreach-section-heading"><h2>Review {confirming?.followup ? 'follow-up' : 'email'}</h2><Button variant="secondary" disabled={busy} onClick={() => { confirmation.current.close(); setConfirming(null); }}>Close</Button></div>
      {confirming && <><p><strong>From:</strong> {config?.from || 'Not configured'}<br /><strong>To:</strong> {confirming.lead.email}<br /><strong>Subject:</strong> {confirming.followup ? 'Re: ' : ''}{confirming.lead.subject}</p><div className="outreach-preview">{confirming.followup ? confirming.lead.followup : confirming.lead.message}</div><p className="outreach-caption">An unsubscribe link is added automatically. {confirming.lead.autoFollowup && !confirming.followup ? `Follow-ups are enabled for day ${confirming.lead.delayDays} and day ${confirming.lead.followup2DelayDays}, if message text exists and no reply is recorded.` : 'No new automatic follow-up is scheduled by this action.'}</p>{confirming.lead.permissionBasis && <p><strong>Contact note (optional):</strong> {confirming.lead.permissionBasis}</p>}</>}
      <div className="outreach-row-actions"><Button variant="secondary" disabled={busy} onClick={() => send(true)}>Test without sending</Button><Button disabled={busy || !config?.live} onClick={() => send(false)}>{busy ? 'Processing…' : 'Confirm & send email'}</Button></div>{error && <Notice>{error}</Notice>}
    </dialog>
  </div>;
}
