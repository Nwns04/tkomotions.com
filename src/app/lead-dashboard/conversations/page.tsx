'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Conversation = { id: string; status: string; lastMessageAt: string; messages: Array<{ id: string; role: string; content: string; createdAt: string }> };

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [replies, setReplies] = useState<Record<string, string>>({});

  async function load() {
    const response = await fetch('/api/conversations');
    if (response.status === 401) { router.replace('/finance/login'); return; }
    if (!response.ok) throw new Error('Conversations could not be loaded.');
    const data = await response.json() as { conversations?: Conversation[] };
    setConversations(data.conversations ?? []);
  }
  useEffect(() => { load().catch((reason) => setError(reason.message)); }, []);
  async function takeOver(id: string) {
    setBusyId(id); setError('');
    try { const response = await fetch(`/api/conversations/${id}/handoff`, { method: 'PATCH' }); if (!response.ok) throw new Error('Could not take over this conversation.'); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not take over this conversation.'); } finally { setBusyId(''); }
  }
  async function sendHumanReply(id: string) {
    const content = replies[id]?.trim(); if (!content) return;
    setBusyId(id); setError('');
    try { const response = await fetch(`/api/conversations/${id}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }); if (!response.ok) throw new Error('Could not send the human reply.'); setReplies({ ...replies, [id]: '' }); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not send the human reply.'); } finally { setBusyId(''); }
  }
  return <main className="kh-container py-16 md:py-20"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="kh-label">Sales workspace</p><h1 className="mt-3 text-4xl font-medium tracking-[-0.06em] md:text-6xl">Conversations</h1></div><Link href="/lead-dashboard" className="rounded-full border border-kh-rule px-4 py-2 text-sm text-kh-green">Lead overview</Link></div>{error && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}<div className="space-y-5">{conversations.map((conversation) => <section key={conversation.id} className="rounded-2xl border border-kh-rule bg-white p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-kh-muted">{conversation.status}</p><p className="mt-1 text-sm text-kh-muted">Last activity {new Date(conversation.lastMessageAt).toLocaleString()}</p></div>{conversation.status === 'ACTIVE' && <button onClick={() => takeOver(conversation.id)} disabled={busyId === conversation.id} className="rounded-full bg-kh-green px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{busyId === conversation.id ? 'Taking over…' : 'Take over'}</button>}</div><div className="space-y-2">{conversation.messages.map((message) => <p key={message.id} className={`rounded-xl px-3 py-2 text-sm ${message.role === 'customer' ? 'bg-kh-soft text-kh-ink' : 'border border-kh-rule text-kh-muted'}`}><strong className="mr-2 capitalize">{message.role}:</strong>{message.content}</p>)}</div>{conversation.status === 'HUMAN' && <form onSubmit={(event) => { event.preventDefault(); sendHumanReply(conversation.id); }} className="mt-4 flex gap-2"><input value={replies[conversation.id] || ''} onChange={(event) => setReplies({ ...replies, [conversation.id]: event.target.value })} placeholder="Reply as staff" className="flex-1 rounded-xl border border-kh-rule px-3 py-2 text-sm" /><button disabled={busyId === conversation.id} className="rounded-xl bg-kh-green px-4 py-2 text-sm font-medium text-white disabled:opacity-60">Send</button></form>}</section>)}{!conversations.length && !error && <p className="text-kh-muted">No customer conversations yet.</p>}</div></main>;
}
