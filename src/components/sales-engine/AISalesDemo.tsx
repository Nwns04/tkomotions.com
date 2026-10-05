'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { demoRequestLabels, extractDemoRequirements, getDemoGuidance, type DemoPropertyCard as PropertyCard, type DemoStreamEvent, type DemoRequirements, type DemoRequestType } from '@/sales-engine/demo-sales-flow';
import { DEMO_SERVICE_ERROR_MESSAGE } from '@/sales-engine/demo-context';

type PropertyMedia = PropertyCard['media'][number];
type DemoMessage = {
  role: 'user' | 'assistant';
  content: string;
  followUps?: string[];
  properties?: PropertyCard[];
  requestType?: DemoRequestType;
  enquiry?: DemoRequirements;
};
type DemoContact = DemoRequirements & { name: string; phone: string; email: string; requestType: DemoRequestType };

const suggestions = ['Show me available homes', 'I need a three-bedroom home', 'When can I see the Wuse house?', 'What are the payment options?'];
const initialMessages: DemoMessage[] = [{
  role: 'assistant',
  content: 'Welcome to TKO Properties, a fictional property demo. I can help you find a sample home, compare prices and prepare an enquiry. Which location or budget do you have in mind?',
}];
const emptyRequirements: DemoRequirements = { propertyType: '', location: '', budget: '', timeline: '', viewingTime: '', requirements: '', intent: 'Exploring' };

function EnquirySummary({ details, requestType }: { details: DemoRequirements; requestType: DemoRequestType }) {
  const rows = [
    ['Property', details.propertyType || 'To be discussed'],
    ['Location', details.location || 'To be discussed'],
    ['Budget', details.budget || 'Not provided'],
    ['Moving timeframe', details.timeline || 'Not provided'],
    ['Request', demoRequestLabels[requestType]],
    ...(requestType === 'viewing' ? [['Preferred viewing', details.viewingTime || 'To be confirmed']] : []),
  ];
  return <dl className="grid gap-2 text-xs leading-relaxed">
    {rows.map(([label, value]) => <div key={label} className="grid grid-cols-[7rem_1fr] gap-3"><dt className="text-kh-muted">{label}</dt><dd className="min-w-0 break-words text-kh-ink">{value}</dd></div>)}
  </dl>;
}

export function AISalesDemo() {
  const [messages, setMessages] = useState<DemoMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactBusy, setContactBusy] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [selectedGallery, setSelectedGallery] = useState<{ title: string; items: PropertyMedia[]; index: number } | null>(null);
  const [contact, setContact] = useState<DemoContact>({ ...emptyRequirements, name: '', phone: '', email: '', requestType: 'enquiry' });
  const [completedEnquiry, setCompletedEnquiry] = useState<DemoContact | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasUserMessaged = messages.some(message => message.role === 'user');

  useEffect(() => {
    const list = messageListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, isBusy]);

  useEffect(() => {
    if (!selectedGallery) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedGallery(null);
      if (event.key === 'ArrowRight') setSelectedGallery(gallery => gallery && ({ ...gallery, index: (gallery.index + 1) % gallery.items.length }));
      if (event.key === 'ArrowLeft') setSelectedGallery(gallery => gallery && ({ ...gallery, index: (gallery.index - 1 + gallery.items.length) % gallery.items.length }));
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGallery]);

  function openEnquiry(requestType: DemoRequestType, details?: DemoRequirements) {
    setContact(current => ({ ...current, ...(details || extractDemoRequirements(messages)), requestType }));
    setContactMessage('');
    setShowContactForm(true);
  }

  async function handleSend(nextMessage: string) {
    const trimmed = nextMessage.trim();
    if (!trimmed || isBusy || showContactForm) return;
    const history = messages.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 2000) })).filter(turn => turn.content.trim());
    const assistantIndex = messages.length + 1;
    setMessages(current => [...current, { role: 'user', content: trimmed }]);
    setInput('');
    setIsBusy(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60_000);
    let reply = '';
    let properties: PropertyCard[] = [];
    let guidance = getDemoGuidance(trimmed, history);
    let requestType: DemoRequestType | undefined;
    const updateAssistant = () => {
      const next: DemoMessage = { role: 'assistant', content: reply, properties, followUps: guidance.followUps, requestType, enquiry: guidance.requirements };
      setMessages(current => current[assistantIndex]
        ? current.map((message, index) => index === assistantIndex ? next : message)
        : [...current, next]);
    };
    const consume = (eventText: string) => {
      const data = eventText.split(/\r?\n/).find(line => line.startsWith('data:'))?.slice(5).trim();
      if (!data) return;
      let event: DemoStreamEvent;
      try { event = JSON.parse(data) as DemoStreamEvent; } catch { return; }
      if (event.type === 'text') reply += event.text;
      if (event.type === 'properties') properties = event.properties;
      if (event.type === 'guidance') {
        guidance = event;
        requestType = event.requestType;
      }
      updateAssistant();
    };
    try {
      const response = await fetch('/api/ai-sales-demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ message: trimmed, history }) });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message || 'Your message could not be sent.');
      }
      if (!response.body) throw new Error('The reply stream was unavailable.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      while (true) {
        const result = await reader.read();
        pending += decoder.decode(result.value, { stream: !result.done });
        const events = pending.split(/\r?\n\r?\n/);
        pending = events.pop() || '';
        events.forEach(consume);
        if (result.done) { if (pending.trim()) consume(pending); break; }
      }
      if (!reply.trim()) throw new Error('The assistant returned no reply.');
    } catch (error) {
      const reason = error instanceof Error && error.name === 'AbortError' ? 'The reply is taking longer than expected.' : DEMO_SERVICE_ERROR_MESSAGE;
      reply = (reply ? reply.trimEnd() + '\n\n' : '') + reason;
      requestType = 'enquiry';
      updateAssistant();
    } finally {
      window.clearTimeout(timeoutId);
      setIsBusy(false);
      inputRef.current?.focus();
    }
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (contactBusy) return;
    if (!contact.phone.trim() && !contact.email.trim()) { setContactMessage('Add a phone number or email address.'); return; }
    setContactBusy(true);
    setContactMessage('');
    try {
      const response = await fetch('/api/ai-sales-demo', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...contact, inspectionRequested: contact.requestType === 'viewing' }) });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || 'Could not save your demo enquiry.');
      setCompletedEnquiry({ ...contact });
      setMessages(current => [...current, { role: 'assistant', content: 'Your demo enquiry has been saved. No real property appointment has been booked. You can see the sample lead summary below the chat.' }]);
      setShowContactForm(false);
    } catch (error) {
      setContactMessage(error instanceof Error ? error.message : 'Could not save your demo enquiry.');
    } finally { setContactBusy(false); }
  }

  return (
    <>
    <div className="flex h-[min(680px,calc(100svh-180px))] min-h-[440px] flex-col overflow-hidden border border-kh-rule bg-white">
      {/* Header — quiet, single status line */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-kh-rule px-5 py-3.5">
        <span className="h-2 w-2 rounded-full bg-kh-lime" />
        <p className="text-sm font-medium text-kh-ink">TKO Properties</p>
        <span className="text-[11px] text-kh-muted">· Fictional demo</span>
      </div>

      {/* Message area */}
      <div className="relative min-h-0 flex-1">
        {/* top fade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-white to-transparent" />

        <div
          ref={messageListRef}
          role="log"
          aria-live="polite"
          aria-label="Conversation messages"
          data-lenis-prevent
          className="h-full space-y-5 overflow-y-auto overscroll-contain px-5 py-6"
        >
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'user' ? (
                <div className="max-w-[78%] rounded-2xl bg-kh-green px-4 py-2.5 text-sm leading-relaxed text-white md:text-[15px] whitespace-pre-line">
                  {message.content}
                </div>
              ) : (
                <div className="max-w-[85%] space-y-2">
                  {message.content && (
                    <p className="text-sm leading-relaxed text-kh-ink md:text-[15px] whitespace-pre-line">
                      {message.content}
                    </p>
                  )}
                  {message.properties && message.properties.length > 0 && (
                    <ol className="mt-3 space-y-6">
                      {message.properties.map((property, index) => (
                        <li key={`${property.location}-${property.title}`} className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-xs text-kh-muted">{index + 1}.</span>
                            <h3 className="text-sm font-medium leading-snug text-kh-ink">{property.title}</h3>
                          </div>
                          <p className="mt-1 pl-5 text-xs text-kh-muted">{property.location}</p>
                          <p className="mt-0.5 pl-5 text-sm font-medium text-kh-green">{property.price}</p>
                          {property.media.length > 0 ? (
                            <div data-lenis-prevent className="mt-3 flex gap-2 overflow-x-auto pl-5 pb-1 [scrollbar-width:thin]">
                              {property.media.map((item, mediaIndex) => (
                                <button
                                  key={item.src}
                                  type="button"
                                  onClick={() => setSelectedGallery({ title: `${property.title} in ${property.location}`, items: property.media, index: mediaIndex })}
                                  className="relative h-20 w-20 shrink-0 overflow-hidden bg-kh-soft"
                                  aria-label={item.type === 'video' ? `Play video ${mediaIndex + 1} of ${property.title}` : `View photo ${mediaIndex + 1} of ${property.title}`}
                                >
                                  {item.type === 'image' || item.thumbnail ? (
                                    <Image src={item.thumbnail || item.src} alt={`${property.title} in ${property.location}`} fill sizes="80px" className="object-cover transition-transform duration-200 hover:scale-105" />
                                  ) : (
                                    <video src={item.src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                                  )}
                                  {item.type === 'video' && (
                                    <span className="absolute inset-0 grid place-items-center bg-black/30">
                                      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-[11px] text-kh-ink">▶</span>
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="ml-5 mt-3 flex h-20 w-20 items-center justify-center bg-kh-soft px-2 text-center text-[10px] text-kh-muted">
                              No media
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                  {message.followUps && message.followUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {message.followUps.map((followUp) => (
                        <button
                          key={followUp}
                          type="button"
                          disabled={isBusy || showContactForm}
                          onClick={() => handleSend(followUp)}
                          className="rounded-full border border-kh-rule bg-white px-2.5 py-1 text-[11px] leading-4 text-kh-green transition-colors hover:border-kh-green hover:bg-kh-soft disabled:cursor-wait disabled:opacity-50"
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  )}
                  {message.requestType && !showContactForm && (
                    <button
                      type="button"
                      onClick={() => openEnquiry(message.requestType || 'enquiry', extractDemoRequirements(messages))}
                      className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-kh-green"
                    >
                      {demoRequestLabels[message.requestType]}
                      <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                        →
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {isBusy && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kh-muted [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kh-muted [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kh-muted [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Contact form overlay — replaces the message area when active */}
        {showContactForm && (
          <div
            data-lenis-prevent
            className="absolute inset-0 z-20 flex flex-col overflow-y-auto overscroll-contain bg-white px-5 py-5"
          >
            <button
              type="button"
              disabled={contactBusy}
              onClick={() => setShowContactForm(false)}
              className="mb-4 inline-flex items-center gap-1.5 self-start text-[13px] text-kh-muted hover:text-kh-ink"
            >
              <span>←</span> Back to chat
            </button>
            <p className="text-sm font-medium text-kh-ink">Review your demo enquiry</p>
            <p className="mt-1 text-xs leading-relaxed text-kh-muted">This demonstrates how an enquiry is captured. Use sample contact details if you prefer. No real property appointment will be booked.</p>
            <form onSubmit={submitContact} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs text-kh-muted">What would you like to do?
                <select value={contact.requestType} onChange={event => setContact({ ...contact, requestType: event.target.value as DemoRequestType })} className="border border-kh-rule bg-white px-3 py-2.5 text-sm text-kh-ink">
                  {Object.entries(demoRequestLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <div className="border border-kh-rule bg-kh-soft p-3"><EnquirySummary details={contact} requestType={contact.requestType} /></div>
              <details className="border-b border-kh-rule pb-3">
                <summary className="cursor-pointer text-xs font-medium text-kh-green">Edit enquiry details</summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {([
                    ['propertyType', 'Property'], ['location', 'Location'], ['budget', 'Budget'], ['timeline', 'Moving timeframe'],
                    ...(contact.requestType === 'viewing' ? [['viewingTime', 'Preferred viewing day and time']] : []),
                  ] as Array<[keyof DemoRequirements, string]>).map(([key, label]) => <label key={key} className="grid gap-1 text-xs text-kh-muted">{label}<input value={contact[key]} maxLength={key === 'budget' ? 80 : 120} onChange={event => setContact({ ...contact, [key]: event.target.value })} className="border border-kh-rule px-3 py-2 text-sm text-kh-ink" /></label>)}
                  <label className="grid gap-1 text-xs text-kh-muted sm:col-span-2">Questions and requirements<textarea value={contact.requirements} maxLength={3000} rows={3} onChange={event => setContact({ ...contact, requirements: event.target.value })} className="border border-kh-rule px-3 py-2 text-sm text-kh-ink" /></label>
                </div>
              </details>
              <label className="grid gap-1 text-xs text-kh-muted">Name<input required minLength={2} maxLength={120} value={contact.name} onChange={event => setContact({ ...contact, name: event.target.value })} placeholder="Your name or a sample name" className="border border-kh-rule px-3 py-2.5 text-sm text-kh-ink" /></label>
              <p className="text-xs text-kh-muted">Add a phone number or email address.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs text-kh-muted">Phone<input type="tel" maxLength={60} value={contact.phone} onChange={event => setContact({ ...contact, phone: event.target.value })} className="border border-kh-rule px-3 py-2.5 text-sm text-kh-ink" /></label>
                <label className="grid gap-1 text-xs text-kh-muted">Email<input type="email" maxLength={254} value={contact.email} onChange={event => setContact({ ...contact, email: event.target.value })} className="border border-kh-rule px-3 py-2.5 text-sm text-kh-ink" /></label>
              </div>
              <div className="mt-1 flex gap-3">
                <button disabled={contactBusy} className="bg-kh-green px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{contactBusy ? 'Saving…' : 'Save demo enquiry'}</button>
                <button type="button" disabled={contactBusy} onClick={() => setShowContactForm(false)} className="text-sm text-kh-muted">Cancel</button>
              </div>
              {contactMessage && <p role="status" className="text-sm text-red-600">{contactMessage}</p>}
            </form>
          </div>
        )}
      </div>

      {/* Bottom bar — suggestions (empty state only) + input */}
      <div className="shrink-0 border-t border-kh-rule px-3 pb-3 pt-3">
        {!hasUserMessaged && !showContactForm && (
          <div
            data-lenis-prevent
            className="mb-3 flex flex-wrap gap-2 px-1"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSend(suggestion)}
                className="rounded-full border border-kh-rule px-3 py-1.5 text-[12px] text-kh-ink/80 transition-colors hover:border-kh-green hover:text-kh-green"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            disabled={showContactForm}
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about a home, prices or arranging a viewing"
            className="min-w-0 flex-1 rounded-full border border-transparent bg-kh-soft px-4 py-2.5 text-sm text-kh-ink transition-colors focus:border-kh-rule focus:bg-white focus:outline-none"
            aria-label="Ask TKO Properties about homes, prices or viewings"
          />
          <button
            type="submit"
            disabled={!input.trim() || isBusy || showContactForm}
            aria-label="Send message"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-kh-green text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span aria-hidden>↑</span>
          </button>
        </form>
      </div>
    </div>
    {completedEnquiry && (
      <section className="mt-5 border border-kh-rule bg-kh-soft p-5" aria-labelledby="demo-lead-title">
        <p className="font-mono text-[9px] tracking-[0.055em] text-kh-green">DEMO ENQUIRY CAPTURED</p>
        <h3 id="demo-lead-title" className="mt-2 text-lg font-medium text-kh-ink">Sample lead summary</h3>
        <div className="mt-4"><EnquirySummary details={completedEnquiry} requestType={completedEnquiry.requestType} /></div>
        <p className="mt-3 text-xs leading-relaxed text-kh-muted">Contact method recorded: {completedEnquiry.phone && completedEnquiry.email ? 'phone and email' : completedEnquiry.phone ? 'phone' : 'email'}. This is a demo enquiry, not a confirmed booking.</p>
        <div className="mt-5 border-t border-kh-rule pt-4">
          <p className="text-sm leading-relaxed text-kh-ink">This is how your business could capture an enquiry with the customer’s requirements already organized. Want this for your business?</p>
          <Link href="/contact?need=ai-sales-demo" className="mt-3 inline-flex min-h-11 items-center gap-3 text-sm font-medium text-kh-green">Discuss my business <span aria-hidden="true">→</span></Link>
          <p className="mt-1 text-xs text-kh-muted">A separate project enquiry to TKO Motions.</p>
        </div>
      </section>
    )}
    {selectedGallery && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8"
        role="dialog"
        aria-modal="true"
        aria-label={`Property media: ${selectedGallery.title}`}
        onClick={(event) => { if (event.target === event.currentTarget) setSelectedGallery(null); }}
      >
        <button type="button" onClick={() => setSelectedGallery(null)} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center border border-white/50 text-2xl text-white" aria-label="Close photo viewer">×</button>
        <div className="relative h-[min(76svh,760px)] w-full max-w-5xl">
          {selectedGallery.items[selectedGallery.index].type === 'video' ? (
            <video src={selectedGallery.items[selectedGallery.index].src} controls autoPlay className="h-full w-full object-contain" aria-label={`${selectedGallery.title}, video ${selectedGallery.index + 1}`} />
          ) : (
            <Image src={selectedGallery.items[selectedGallery.index].src} alt={`${selectedGallery.title}, photo ${selectedGallery.index + 1}`} fill sizes="(max-width: 768px) 100vw, 80vw" className="object-contain" />
          )}
        </div>
        {selectedGallery.items.length > 1 && <>
          <button type="button" onClick={() => setSelectedGallery((gallery) => gallery && ({ ...gallery, index: (gallery.index - 1 + gallery.items.length) % gallery.items.length }))} className="absolute left-3 top-1/2 -translate-y-1/2 border border-white/50 bg-black/40 px-3 py-2 text-white" aria-label="Previous item">←</button>
          <button type="button" onClick={() => setSelectedGallery((gallery) => gallery && ({ ...gallery, index: (gallery.index + 1) % gallery.items.length }))} className="absolute right-3 top-1/2 -translate-y-1/2 border border-white/50 bg-black/40 px-3 py-2 text-white" aria-label="Next item">→</button>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-xs text-white">{selectedGallery.index + 1} / {selectedGallery.items.length}</p>
        </>}
      </div>
    )}
    </>
  );
}