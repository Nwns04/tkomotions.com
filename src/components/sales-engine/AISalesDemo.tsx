'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';

type PropertyMedia = {
  src: string;
  type: 'image' | 'video';
  thumbnail?: string;
};

type PropertyCard = {
  title: string;
  location: string;
  price: string;
  media: PropertyMedia[];
};

type DemoStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'properties'; properties: PropertyCard[] };

type DemoMessage = {
  role: 'user' | 'assistant';
  content: string;
  showLeadLink?: boolean;
  followUps?: string[];
  properties?: PropertyCard[];
};

const suggestions = [
  'I’d love to see available homes',
  'Could you share the prices?',
  'Please help me arrange an inspection',
  'I’d like to speak with an agent',
];

const initialMessages: DemoMessage[] = [
  {
    role: 'assistant',
    content:
      'Hello, welcome to TKO Properties. I can help you explore available homes, compare prices or arrange an inspection. What can I help you find today?',
  },
];

const LEAD_TRIGGERS = [
  'view',
  'inspection',
  'inspect',
  'arrange',
  'agent',
  'speak',
  'call',
  'visit',
  'book',
  'schedule',
  'meet',
];

function shouldOfferLeadForm(text: string) {
  const lower = text.toLowerCase();
  return LEAD_TRIGGERS.some((keyword) => lower.includes(keyword));
}

function getFollowUpPrompts(reply: string) {
  if (/share your (name|details)|secure contact form|team can provide more information/i.test(reply)) return [];

  const location = reply.match(/Location:\s*([^\n.]+)/i)?.[1]?.trim();
  if (location) {
    return [`Tell me more about the ${location} home`, 'What are the viewing times?'];
  }

  if (/installment|payment options|payment details/i.test(reply)) {
    return ['Show me homes in Wuse', 'Arrange a viewing'];
  }

  if (/inspection|viewing/i.test(reply)) {
    return ['What viewing times are available?', 'Show me homes in Wuse'];
  }

  if (/don't have that information|not available|try again/i.test(reply)) {
    return ['Show me homes in Wuse', 'What are the prices in Jabi?'];
  }

  return ['Show me homes in Wuse', 'What are the prices in Jabi?'];
}

export function AISalesDemo() {
  const [messages, setMessages] = useState<DemoMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactBusy, setContactBusy] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [selectedGallery, setSelectedGallery] = useState<{ title: string; items: PropertyMedia[]; index: number } | null>(null);
  const [contact, setContact] = useState({
    name: '',
    phone: '',
    email: '',
    propertyType: '',
    location: '',
    budget: '',
    timeline: '',
    inspectionRequested: true,
  });
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasUserMessaged = messages.some((m) => m.role === 'user');

  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) messageList.scrollTop = messageList.scrollHeight;
  }, [messages, isBusy]);

  useEffect(() => {
    if (!selectedGallery) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedGallery(null);
      if (event.key === 'ArrowRight') {
        setSelectedGallery((gallery) => gallery && ({ ...gallery, index: (gallery.index + 1) % gallery.items.length }));
      }
      if (event.key === 'ArrowLeft') {
        setSelectedGallery((gallery) => gallery && ({ ...gallery, index: (gallery.index - 1 + gallery.items.length) % gallery.items.length }));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGallery]);

  async function handleSend(nextMessage: string) {
    const trimmed = nextMessage.trim();
    if (!trimmed || isBusy) return;

    const userMessage: DemoMessage = { role: 'user', content: trimmed };
    const history = messages.slice(-12);

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsBusy(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch('/api/ai-sales-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || 'Your message could not be sent. Please try again.');
      }
      if (!response.body) throw new Error('The reply stream was unavailable. Please try again.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const assistantIndex = messages.length + 1;
      let reply = '';
      let pending = '';
      let properties: PropertyCard[] = [];
      const updateAssistant = () => {
        const assistantMessage: DemoMessage = {
          role: 'assistant',
          content: reply,
          showLeadLink: shouldOfferLeadForm(trimmed),
          ...(properties.length ? { properties } : {}),
        };
        setMessages((current) => {
          if (current[assistantIndex]) {
            return current.map((message, index) => index === assistantIndex ? assistantMessage : message);
          }
          return [...current, assistantMessage];
        });
      };
      let finished = false;

      while (!finished) {
        const result = await reader.read();
        finished = result.done;
        pending += decoder.decode(result.value, { stream: !finished });
        const events = pending.split(/\r?\n\r?\n/);
        pending = events.pop() || '';

        for (const eventText of events) {
          const data = eventText.split(/\r?\n/).find((line) => line.startsWith('data:'))?.slice(5).trim();
          if (!data) continue;
          try {
            const event = JSON.parse(data) as DemoStreamEvent;
            if (event.type === 'text') reply += event.text;
            if (event.type === 'properties') properties = event.properties;
            if (reply || properties.length) updateAssistant();
          } catch {
            continue;
          }
        }

        if (finished && pending.trim()) {
          const data = pending.split(/\r?\n/).find((line) => line.startsWith('data:'))?.slice(5).trim();
          if (data) {
            try {
              const event = JSON.parse(data) as DemoStreamEvent;
              if (event.type === 'text') reply += event.text;
              if (event.type === 'properties') properties = event.properties;
              if (reply || properties.length) updateAssistant();
            } catch {
              pending = '';
            }
          }
        }
      }

      if (!reply.trim()) {
        const fallback = "I don't have that information available right now. I can connect you with a member of the team.";
        setMessages((current) => [...current, {
          role: 'assistant',
          content: fallback,
          showLeadLink: shouldOfferLeadForm(trimmed),
          followUps: getFollowUpPrompts(fallback),
        }]);
      } else {
        const followUps = getFollowUpPrompts(reply);
        if (followUps.length) {
          setMessages((current) => current.map((message, index) => index === assistantIndex
            ? { ...message, followUps }
            : message));
        }
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            error instanceof Error && error.name === 'AbortError'
              ? 'This is taking longer than expected. Please try again, or leave your contact details and our team will follow up.'
              : "We're having trouble processing your request right now. Please leave your contact details and our team will get back to you.",
          showLeadLink: true,
          followUps: getFollowUpPrompts(error instanceof Error && error.name === 'AbortError'
            ? 'This is taking longer than expected. Please try again.'
            : "We're having trouble processing your request right now."),
        },
      ]);
    } finally {
      window.clearTimeout(timeoutId);
      setIsBusy(false);
      inputRef.current?.focus();
    }
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (contactBusy) return;

    setContactBusy(true);
    setContactMessage('');

    try {
      const response = await fetch('/api/ai-sales-demo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });

      const data = (await response.json()) as {
        message?: string;
        lead?: { classification?: string };
      };

      if (!response.ok) {
        throw new Error(data.message || 'Could not save your details.');
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `Thank you, ${contact.name}. The TKO Properties team has received your details and will be in touch soon.`,
        },
      ]);
      setShowContactForm(false);
      setContactMessage('');
    } catch (error) {
      setContactMessage(
        error instanceof Error ? error.message : 'Could not save your details.',
      );
    } finally {
      setContactBusy(false);
    }
  }

  return (
    <>
    <div className="flex h-[min(680px,calc(100svh-180px))] min-h-[440px] flex-col overflow-hidden border border-kh-rule bg-white">
      {/* Header — quiet, single status line */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-kh-rule px-5 py-3.5">
        <span className="h-2 w-2 rounded-full bg-kh-lime" />
        <p className="text-sm font-medium text-kh-ink">TKO Properties</p>
        <span className="text-[11px] text-kh-muted">· Live</span>
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
                          disabled={isBusy}
                          onClick={() => handleSend(followUp)}
                          className="rounded-full border border-kh-rule bg-white px-2.5 py-1 text-[11px] leading-4 text-kh-green transition-colors hover:border-kh-green hover:bg-kh-soft disabled:cursor-wait disabled:opacity-50"
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  )}
                  {message.showLeadLink && !showContactForm && (
                    <button
                      type="button"
                      onClick={() => setShowContactForm(true)}
                      className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-kh-green"
                    >
                      Share my details
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
              onClick={() => setShowContactForm(false)}
              className="mb-4 inline-flex items-center gap-1.5 self-start text-[13px] text-kh-muted hover:text-kh-ink"
            >
              <span>←</span> Back to chat
            </button>
            <p className="text-sm font-medium text-kh-ink">Share your details</p>
            <p className="mt-1 text-sm text-kh-muted">
              Our team will follow up to confirm your viewing.
            </p>

            <form onSubmit={submitContact} className="mt-5 grid gap-3">
              <input
                required
                value={contact.name}
                onChange={(event) =>
                  setContact({ ...contact, name: event.target.value })
                }
                placeholder="Your name"
                className="rounded-xl border border-kh-rule bg-white px-3 py-2.5 text-sm focus:border-kh-green focus:outline-none"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={contact.phone}
                  onChange={(event) =>
                    setContact({ ...contact, phone: event.target.value })
                  }
                  placeholder="Phone number"
                  className="rounded-xl border border-kh-rule bg-white px-3 py-2.5 text-sm focus:border-kh-green focus:outline-none"
                />
                <input
                  type="email"
                  value={contact.email}
                  onChange={(event) =>
                    setContact({ ...contact, email: event.target.value })
                  }
                  placeholder="Email"
                  className="rounded-xl border border-kh-rule bg-white px-3 py-2.5 text-sm focus:border-kh-green focus:outline-none"
                />
              </div>
              <input
                value={contact.location}
                onChange={(event) =>
                  setContact({ ...contact, location: event.target.value })
                }
                placeholder="Preferred location"
                className="rounded-xl border border-kh-rule bg-white px-3 py-2.5 text-sm focus:border-kh-green focus:outline-none"
              />
              <input
                value={contact.timeline}
                onChange={(event) =>
                  setContact({ ...contact, timeline: event.target.value })
                }
                placeholder="Preferred inspection time"
                className="rounded-xl border border-kh-rule bg-white px-3 py-2.5 text-sm focus:border-kh-green focus:outline-none"
              />

              <div className="mt-1 flex gap-3">
                <button
                  disabled={contactBusy}
                  className="bg-kh-green px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {contactBusy ? 'Sending…' : 'Send request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="text-sm text-kh-muted"
                >
                  Cancel
                </button>
              </div>

              {contactMessage && (
                <p role="status" className="text-sm text-red-600">
                  {contactMessage}
                </p>
              )}
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
            disabled={!input.trim() || isBusy}
            aria-label="Send message"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-kh-green text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span aria-hidden>↑</span>
          </button>
        </form>
      </div>
    </div>
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