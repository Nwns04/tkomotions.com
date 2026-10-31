import { useCallback, useEffect, useRef, useState } from 'react';
import { api, apiMessage } from '../../api/client.js';
import { Button, Notice } from '../components/UI.jsx';
const time = value => value ? new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : 'Time unavailable';
const ordered = items => [...new Map(items.map(item => [item.id, item])).values()].sort((a, b) => new Date(a.sortAt) - new Date(b.sortAt) || a.id.localeCompare(b.id));
const fileSize = size => size >= 1048576 ? (size / 1048576).toFixed(1) + ' MB' : Math.ceil(size / 1024) + ' KB';
const acceptedFiles = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv,.zip';
function MessageBody({ message, onDownload, disabled }) {
  const body = message.body || '';
  const quote = message.direction === 'incoming' ? body.search(/\n(?:On [^\n]{1,300}wrote:|From: |_{5,}|-{8,})/i) : -1;
  return <><div className="outreach-chat-text">{(quote > 0 ? body.slice(0, quote) : body) || 'No readable message text.'}</div>{quote > 0 && <details><summary>Show quoted email</summary><div className="outreach-chat-text">{body.slice(quote)}</div></details>}{message.truncated && <small>Long message shortened. The original remains in Resend.</small>}{message.attachments?.length > 0 && <ul className="outreach-chat-files">{message.attachments.map((file, index) => <li key={index}><span>{file.filename} <small>({fileSize(file.size || 0)})</small></span>{(message.direction === 'incoming' || message.state === 'sent') && <Button type="button" variant="secondary" disabled={disabled} onClick={() => onDownload(message, index, file.filename)} aria-label={'Download ' + file.filename}>Download</Button>}</li>)}</ul>}</>;
}
export default function OutreachReplies({ campaignId = '', leads = [], onChanged }) {
  const [threads, setThreads] = useState([]), [nextList, setNextList] = useState(null), [syncCursor, setSyncCursor] = useState(null);
  const [selected, setSelected] = useState(''), [conversation, setConversation] = useState(null), [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [files, setFiles] = useState([]), [preparing, setPreparing] = useState(false);
  const fileInput = useRef(null);
  const [draft, setDraft] = useState(''), [linkId, setLinkId] = useState(''), [search, setSearch] = useState(''), [filter, setFilter] = useState('all');
  const active = useRef(''), generation = useRef(0), mounted = useRef(true), drafts = useRef({}), olderLoaded = useRef(false), scroller = useRef(null);
  const listState = useRef({ epoch: 0, pages: 1, cursor: null, pending: Promise.resolve() });
  const refreshList = useCallback(before => {
    const epoch = listState.current.epoch;
    const pending = listState.current.pending.catch(() => {}).then(async () => {
      if (!mounted.current || epoch !== listState.current.epoch) return;
      // Serialize pagination and refreshes so an older response cannot discard loaded pages.
      if (before && before !== listState.current.cursor) return;
      let cursor = before, items = [], pages = 0;
      do {
        const { data } = await api.get('/outreach/conversations', { params: { ...(campaignId ? { campaignId } : {}), ...(cursor ? { before: cursor } : {}) } });
        if (!mounted.current || epoch !== listState.current.epoch) return;
        items.push(...(data.conversations || [])); pages++; cursor = data.nextCursor || null;
      } while (!before && cursor && pages < listState.current.pages);
      listState.current.pages = before ? listState.current.pages + 1 : pages;
      listState.current.cursor = cursor;
      setThreads(previous => [...new Map([...(before ? previous : []), ...items].map(item => [item.id, item])).values()]);
      setNextList(cursor);
    });
    listState.current.pending = pending;
    return pending;
  }, [campaignId]);
  const readConversation = useCallback(async (id, before, initial = false) => {
    const request = generation.current;
    const scroll = scroller.current, wasNearBottom = !scroll || scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 90, oldHeight = scroll?.scrollHeight || 0;
    const { data } = await api.get('/outreach/conversations/' + encodeURIComponent(id), { params: before ? { before } : {} });
    if (!mounted.current || active.current !== id || generation.current !== request) return;
    if (before) olderLoaded.current = true;
    setConversation(previous => ({ ...data, messages: initial || !previous || previous.id !== id ? data.messages : ordered([...(previous.messages || []), ...data.messages]), nextCursor: before || !olderLoaded.current ? data.nextCursor : previous?.nextCursor }));
    requestAnimationFrame(() => { if (!scroller.current) return; if (before) scroller.current.scrollTop += scroller.current.scrollHeight - oldHeight; else if (initial || wasNearBottom) scroller.current.scrollTop = scroller.current.scrollHeight; });
    const unread = data.messages.filter(item => item.replyId && !item.readAt).map(item => item.replyId);
    if (unread.length && document.visibilityState === 'visible') {
      await api.post('/outreach/conversations/' + encodeURIComponent(id) + '/read', { replyIds: unread });
      if (mounted.current && active.current === id && generation.current === request) { await refreshList(); await onChanged?.(); }
    }
  }, [refreshList, onChanged]);
  useEffect(() => {
    const list = listState.current;
    list.epoch++; list.pages = 1; list.cursor = null; setThreads([]); setNextList(null);
    mounted.current = true; active.current = ''; generation.current++; setSelected(''); setConversation(null); setError(''); setMessage('');
    refreshList().catch(reason => { if (mounted.current) setError(apiMessage(reason)); });
    const timer = setInterval(() => { refreshList().catch(() => {}); if (active.current && document.visibilityState === 'visible') readConversation(active.current).catch(() => {}); }, 15000);
    return () => { list.epoch++; mounted.current = false; active.current = ''; clearInterval(timer); };
  }, [refreshList, readConversation]);
  async function openThread(id) {
    active.current = id; generation.current++; olderLoaded.current = false;
    setSelected(id); setConversation(null); setLoading(true); setError(''); setMessage(''); setLinkId(''); setDraft(drafts.current[id]?.body || ''); setFiles(drafts.current[id]?.attachments || []);
    try { await readConversation(id, undefined, true); } catch (reason) { if (active.current === id) setError(apiMessage(reason)); }
    finally { if (active.current === id) setLoading(false); }
  }
  async function run(task) { setBusy(true); setError(''); setMessage(''); try { await task(); } catch (reason) { if (mounted.current) setError((reason.response ? apiMessage(reason) : reason.message || apiMessage(reason))); } finally { if (mounted.current) setBusy(false); } }
  const sync = after => run(async () => {
    const { data } = await api.post('/outreach/replies/sync', after ? { after } : {}); setSyncCursor(data.nextCursor || null);
    await refreshList(); if (active.current) await readConversation(active.current); await onChanged?.();
    setMessage(`${data.imported} earlier reply message(s) imported. No mailbox copies sent.`);
  });
  function updateDraft(body, attachments) {
    setDraft(body); setFiles(attachments);
    drafts.current[active.current] = { body, attachments, requestId: crypto.randomUUID() };
  }
  async function chooseFiles(event) {
    const selectedFiles = [...event.target.files]; event.target.value = '';
    if (!selectedFiles.length) return;
    const id = active.current, existing = files, body = draft;
    await run(async () => {
      if (existing.length + selectedFiles.length > 5 || existing.reduce((sum, file) => sum + file.size, 0) + selectedFiles.reduce((sum, file) => sum + file.size, 0) > 5 * 1024 * 1024) throw Error('Attach up to 5 files, with a combined size of 5 MB.');
      if (selectedFiles.some(file => file.name.length > 180 || /[\p{Cc}/\\]/u.test(file.name) || !acceptedFiles.split(',').some(extension => file.name.toLowerCase().endsWith(extension)))) throw Error('Use a PDF, Office document, image, text, CSV or ZIP file with a valid filename.');
      setPreparing(true);
      try {
        const attachments = [...existing, ...await Promise.all(selectedFiles.map(file => new Promise((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve({ filename: file.name, size: file.size, content: String(reader.result).split(',')[1] || '' }); reader.onerror = () => reject(Error('The file could not be read. Select it again.')); reader.readAsDataURL(file);
        })))];
        drafts.current[id] = { body, attachments, requestId: crypto.randomUUID() };
        if (mounted.current && active.current === id) setFiles(attachments);
      } finally { if (mounted.current) setPreparing(false); }
    });
  }
  const download = (item, index, filename) => run(async () => {
    let response;
    try { response = await api.get('/outreach/conversations/' + encodeURIComponent(active.current) + '/attachments/' + encodeURIComponent(item.id) + '/' + index, { responseType: 'blob' }); }
    catch (reason) { if (reason.response?.data instanceof Blob) { try { reason.response.data = JSON.parse(await reason.response.data.text()); } catch { /* Use the normal error message. */ } } throw reason; }
    const url = URL.createObjectURL(response.data), anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  });
  async function send(event) {
    event.preventDefault(); if (!conversation?.canSend || !draft.trim() || busy) return;
    const id = active.current;
    const entry = drafts.current[id] || { body: draft, attachments: files, requestId: crypto.randomUUID() };
    if (!entry.replyId) entry.replyId = conversation.replyId;
    drafts.current[id] = entry;
    await run(async () => {
      try {
        await api.post('/outreach/conversations/' + encodeURIComponent(id) + '/send', { body: entry.body.trim(), requestId: entry.requestId, replyId: entry.replyId, confirmed: true, attachments: (entry.attachments || []).map(({ filename, content }) => ({ filename, content })) });
        delete drafts.current[id]; if (active.current === id) { setDraft(''); setFiles([]); } setMessage('Response sent.');
      } catch (reason) {
        // Only this explicit pre-send rejection can safely discard the old send identity.
        // Keep it for timeouts and uncertain delivery to prevent duplicate emails.
        if (reason.response?.status === 409 && reason.response?.data?.code === 'OUTREACH_REPLY_CHANGED') {
          drafts.current[id] = { body: entry.body, attachments: entry.attachments || [], requestId: crypto.randomUUID() };
        }
        if (active.current === id) await readConversation(id).catch(() => {});
        await refreshList().catch(() => {});
        throw reason;
      }
      try { if (active.current === id) await readConversation(id); await refreshList(); await onChanged?.(); }
      catch { setMessage('Response sent. Refresh the conversation to update its history.'); }
    });
  }
  const visible = threads.filter(item => (filter !== 'unread' || item.unread > 0) && (filter !== 'unmatched' || !item.leadId) && `${item.company || ''} ${item.from || ''} ${item.subject || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <section className={`outreach-card outreach-chat ${selected ? 'is-open' : ''}`} aria-label={campaignId ? 'Campaign conversations' : 'Replies inbox'}>
    <div className="outreach-section-heading"><div><h2>Conversations</h2><p>Read the full exchange and respond by email.</p></div><div className="outreach-row-actions"><Button variant="secondary" disabled={busy} onClick={() => sync()}>Import existing replies</Button>{syncCursor && <Button variant="secondary" disabled={busy} onClick={() => sync(syncCursor)}>Import older replies</Button>}<Button variant="secondary" disabled={busy} onClick={() => run(async () => { await refreshList(); if (active.current) await readConversation(active.current); })}>Refresh</Button></div></div>
    <div className={`outreach-chat-layout ${selected ? 'has-conversation' : ''}`}>
      <aside className="outreach-chat-sidebar" aria-label="Conversations list"><input aria-label="Search conversations" placeholder="Search conversations" value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="Filter conversations" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All conversations</option><option value="unread">Unread</option><option value="unmatched">Unmatched</option></select>
        <div className="outreach-chat-threads" data-lenis-prevent>{visible.map(item => <button type="button" key={item.id} disabled={busy} className={selected === item.id ? 'selected' : ''} onClick={() => openThread(item.id)}><strong>{item.company || item.from}</strong><span>{item.subject}</span><small>{item.leadId ? item.from : 'Unmatched reply'} - {time(item.sortAt)}</small>{item.unread > 0 && <span className="outreach-unread">{item.unread} unread</span>}</button>)}{!visible.length && <p>No conversations in this view.</p>}{nextList && <Button variant="secondary" disabled={busy} onClick={() => run(() => refreshList(nextList))}>Load older conversations</Button>}</div>
      </aside>
      <div className="outreach-chat-pane" aria-label="Email conversation">
        {!selected ? <div className="outreach-chat-empty">Choose a conversation to see your outreach and their replies.</div> : <>
          <header className="outreach-chat-heading"><Button variant="secondary" disabled={busy} onClick={() => { active.current = ''; generation.current++; setSelected(''); setConversation(null); setError(''); }}>Back to conversations</Button><div><h3>{conversation?.lead?.company || conversation?.recipient || 'Conversation'}</h3>{conversation && <><p>{conversation.subject}</p><small>{conversation.campaign?.name || 'Unmatched reply'}{conversation.lead && ' - Follow-ups stopped'}</small></>}</div></header>
          <div className="outreach-chat-messages" data-lenis-prevent ref={scroller} aria-label="Conversation messages">
            {loading && <p role="status">Loading conversation...</p>}
            {conversation?.nextCursor && <Button variant="secondary" disabled={busy} onClick={() => run(() => readConversation(selected, conversation.nextCursor))}>Load earlier messages</Button>}
            {conversation?.messages.map(item => <article key={item.id} className={`outreach-chat-bubble ${item.direction}`}><div className="outreach-chat-meta"><strong>{item.direction === 'outgoing' ? 'TKO Motions' : item.from}</strong><small>{item.kind === 'initial' ? 'Initial outreach' : item.kind === 'followup' ? 'Follow-up' : item.direction === 'outgoing' ? 'Your response' : 'Reply'} - {time(item.at)}</small></div><MessageBody message={item} onDownload={download} disabled={busy} />{item.direction === 'outgoing' && <small>{item.state === 'cancelled' ? 'Not sent - sending was stopped.' : item.state === 'review' ? 'Delivery needs review - check Resend before resending.' : item.state === 'sending' ? 'Sending...' : item.deliveryStatus || 'Sent'}</small>}</article>)}
          </div>
          {conversation && !conversation.lead && <div className="outreach-chat-link">{conversation.receivedAt ? <form onSubmit={event => { event.preventDefault(); run(async () => {
            const { data } = await api.post('/outreach/replies/' + conversation.replyId + '/link', { leadId: linkId }); await refreshList(); await onChanged?.(); await openThread('lead:' + data.reply.links[0].leadId);
          }); }}><label>Link to sent contact<select required value={linkId} onChange={event => setLinkId(event.target.value)}><option value="">Select a contact</option>{leads.filter(lead => lead.sentAt && new Date(lead.sentAt) <= new Date(conversation.receivedAt)).map(lead => <option key={lead.publicId} value={lead.publicId}>{lead.company || lead.email} - {lead.email}</option>)}</select></label><Button disabled={busy || !linkId}>Link reply and stop follow-ups</Button></form> : <p>Received time unavailable. Review the original in Resend before recording a reply against a contact.</p>}</div>}
          {conversation?.lead && <form className="outreach-chat-composer" onSubmit={send}><label htmlFor="outreach-chat-response">Email response to <strong>{conversation.recipient}</strong></label><textarea id="outreach-chat-response" rows={3} maxLength={12000} value={draft} disabled={busy || !conversation.canSend} onChange={event => updateDraft(event.target.value, files)} placeholder="Write your response..." /><input ref={fileInput} type="file" multiple accept={acceptedFiles} aria-label="Choose reply attachments" hidden disabled={busy || !conversation.canSend} onChange={chooseFiles} /><ul className="outreach-chat-files outreach-draft-files">{files.map((file, index) => <li key={index}><span>{file.filename} <small>({fileSize(file.size)})</small></span><Button type="button" variant="secondary" disabled={busy} aria-label={'Remove ' + file.filename} onClick={() => updateDraft(draft, files.filter((_, position) => position !== index))}>Remove</Button></li>)}</ul><div className="outreach-row-actions"><Button type="button" variant="secondary" disabled={busy || !conversation.canSend} onClick={() => fileInput.current?.click()}>Attach files</Button><Button disabled={busy || !conversation.canSend || !draft.trim()}>{preparing ? 'Preparing files...' : busy ? 'Please wait...' : 'Send reply'}</Button><small>Up to 5 files, 5 MB total. Your response stays in this email thread.</small></div>{conversation.blockedReason && <p>{conversation.blockedReason}</p>}</form>}
        </>}
        <div className="outreach-chat-feedback" aria-live="polite"><Notice>{error}</Notice><Notice type="success">{message}</Notice></div>
      </div>
    </div>
  </section>;
}
