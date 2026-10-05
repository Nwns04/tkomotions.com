import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { DEMO_SERVICE_ERROR_MESSAGE, resolveDemoQuery, type DemoContextTurn } from '@/sales-engine/demo-context';
import { captureDemoLead, replyToDemoVisitor, type DemoStreamEvent } from '@/sales-engine/services/conversation-workflow';

const demoMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .max(12)
    .default([]),
});

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(60).optional().default(''),
  email: z.string().trim().email().max(254).optional().or(z.literal('')).default(''),
  propertyType: z.string().trim().max(200).optional().default(''),
  location: z.string().trim().max(120).optional().default(''),
  budget: z.string().trim().max(80).optional().default(''),
  timeline: z.string().trim().max(120).optional().default(''),
  intent: z.string().trim().max(40).default('Buy'),
  inspectionRequested: z.boolean().default(false),
  requirements: z.string().trim().max(4000).optional().default(''),
}).refine((value) => value.phone || value.email, { message: 'Enter a phone number or email address.' });

const staticProperties = [
  {
    title: '3-bedroom apartment',
    location: 'Wuse',
    price: '₦85,000,000',
    media: ['/images/wuse1.webp', '/images/wuse 2.webp', '/images/wuse 3.webp'].map((src) => ({ src, type: 'image' as const })),
  },
  {
    title: '4-bedroom duplex',
    location: 'Gwarinpa',
    price: '₦120,000,000',
    media: ['/images/gwarimpa.webp', '/images/gwarimpa2.webp', '/images/gwarimpa3.webp'].map((src) => ({ src, type: 'image' as const })),
  },
  {
    title: '4-bedroom terrace',
    location: 'Jabi',
    price: '₦95,000,000',
    media: ['/images/jabi.webp', '/images/jabi 2.webp', '/images/jabi 3.webp'].map((src) => ({ src, type: 'image' as const })),
  },
  {
    title: '5-bedroom duplex',
    location: 'Maitama',
    price: '₦250,000,000',
    media: [],
  },
];

function sendStaticDemoReply(message: string, sendEvent: (event: DemoStreamEvent) => void, history: DemoContextTurn[] = []) {
  const content = resolveDemoQuery(message, history).toLowerCase();
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)[!.?\s]*$/.test(content)) {
    sendEvent({ type: 'text', text: 'Hello! I can help with the sample homes, prices and viewing times. What would you like to know?' });
    return;
  }
  const wantsAgent = /\b(speak|talk|connect)\b/.test(content) && /\b(agent|person|human|team)\b/.test(content);
  if (wantsAgent) {
    sendEvent({ type: 'text', text: 'Of course. Please share your name and best contact details using the form below, and our team will follow up.' });
    return;
  }

  const wantsPolicy = /\b(inspection|viewing|visit|open|opening hours|business hours|installment|installments|payment)\b/.test(content);
  if (wantsPolicy) {
    sendEvent({ type: 'text', text: 'Inspections are Monday to Saturday, 9:00 AM to 5:00 PM. Outright payment is accepted, and installment is available on selected properties.\n\nWould you like help arranging a viewing?' });
    return;
  }

  const wantsProperties = /how much|\b(view|show|list|browse|see|available|price|prices|cost|recommend|looking|need|bedroom|home|house|property|apartment|wuse|gwarinpa|jabi|maitama)\b/.test(content);
  if (wantsProperties) {
    const locationMatch = staticProperties.find((property) => content.includes(property.location.toLowerCase()));
    const properties = locationMatch ? [locationMatch] : staticProperties;
    sendEvent({ type: 'properties', properties });
    sendEvent({ type: 'text', text: locationMatch ? `Of course. Here is the sample home in ${locationMatch.location}:` : 'Of course. Here are the sample homes and prices currently available in this demo:' });
    return;
  }

  sendEvent({ type: 'text', text: DEMO_SERVICE_ERROR_MESSAGE });
}

const visitors = new Map<string, { count: number; resetAt: number }>();
function permitted(request: Request) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const current = visitors.get(key);
  const now = Date.now();
  if (!current || current.resetAt < now) { visitors.set(key, { count: 1, resetAt: now + 60_000 }); return true; }
  if (current.count >= 12) return false;
  current.count += 1;
  return true;
}

async function visitor() {
  const store = await cookies();
  const existing = store.get('tko.demo.visitor')?.value;
  return { key: existing || randomUUID(), isNew: !existing };
}

export async function POST(request: Request) {
  try {
    if (!permitted(request)) return NextResponse.json({ message: 'Please wait a moment before sending another message.' }, { status: 429 });
    const body = await request.json().catch(() => null);
    const parsed = demoMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Please enter a valid question.' }, { status: 400 });
    }

    const identity = await visitor();
    const encoder = new TextEncoder();
    let streamClosed = false;
    let replyStarted = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const sendEvent = (event: DemoStreamEvent) => {
          if (!streamClosed) {
            replyStarted = true;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
        };
        void replyToDemoVisitor(identity.key, parsed.data.message, sendEvent)
          .then(() => {
            if (!streamClosed) controller.close();
          })
          .catch((error: unknown) => {
            console.error('[sales-engine] demo response failed', error);
            if (!replyStarted) sendStaticDemoReply(parsed.data.message, sendEvent, parsed.data.history);
            if (!streamClosed) controller.close();
          });
      },
      cancel() {
        streamClosed = true;
      },
    });
    const response = new NextResponse(stream, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        'Content-Type': 'text/event-stream; charset=utf-8',
        'X-Accel-Buffering': 'no',
      },
    });
    if (identity.isNew) response.cookies.set('tko.demo.visitor', identity.key, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
    return response;
  } catch (error) {
    console.error('[sales-engine] demo request failed', error);
    return NextResponse.json(
      {
        message: DEMO_SERVICE_ERROR_MESSAGE,
      },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message || 'Please provide your contact details.' }, { status: 400 });
    const identity = await visitor();
    const lead = await captureDemoLead(identity.key, parsed.data);
    const response = NextResponse.json({ lead: lead.toJSON() }, { status: 201 });
    if (identity.isNew) response.cookies.set('tko.demo.visitor', identity.key, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
    return response;
  } catch (error) {
    console.error('[sales-engine] lead capture failed', error);
    return NextResponse.json({ message: 'We could not save your details right now. Please try again shortly.' }, { status: 500 });
  }
}
