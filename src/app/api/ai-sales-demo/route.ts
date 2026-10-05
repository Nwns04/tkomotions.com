import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { DEMO_SERVICE_ERROR_MESSAGE, type DemoContextTurn } from '@/sales-engine/demo-context';
import { getDemoSalesReply, getDemoGuidance, sendDemoSalesReply } from '@/sales-engine/demo-sales-flow';
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
  requestType: z.enum(['enquiry', 'viewing', 'payment', 'callback']).default('enquiry'),
  viewingTime: z.string().trim().max(120).optional().default(''),
  requirements: z.string().trim().max(4000).optional().default(''),
}).refine((value) => value.phone || value.email, { message: 'Enter a phone number or email address.' });

function sendStaticDemoReply(message: string, sendEvent: (event: DemoStreamEvent) => void, history: DemoContextTurn[] = []) {
  const reply = getDemoSalesReply(message, history);
  if (reply) return sendDemoSalesReply(reply, sendEvent);
  sendEvent({ type: 'text', text: DEMO_SERVICE_ERROR_MESSAGE });
  sendEvent({ type: 'guidance', ...getDemoGuidance(message, history), requestType: 'enquiry' });
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
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const sendEvent = (event: DemoStreamEvent) => {
          if (!streamClosed) {
            replyStarted = true;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
        };
        // DNS discovery can outlast the database's connection timeout. Keep the
        // demo responsive while the workflow can still finish saving in the background.
        fallbackTimer = setTimeout(() => {
          if (streamClosed || replyStarted) return;
          sendStaticDemoReply(parsed.data.message, sendEvent, parsed.data.history);
          streamClosed = true;
          controller.close();
        }, getDemoSalesReply(parsed.data.message, parsed.data.history) ? 3_000 : 20_000);
        void replyToDemoVisitor(identity.key, parsed.data.message, sendEvent, parsed.data.history)
          .then(() => {
            if (!streamClosed) { streamClosed = true; controller.close(); }
          })
          .catch((error: unknown) => {
            console.error('[sales-engine] demo response failed', error);
            if (!replyStarted) sendStaticDemoReply(parsed.data.message, sendEvent, parsed.data.history);
            if (!streamClosed) controller.close();
          })
          .finally(() => clearTimeout(fallbackTimer));
      },
      cancel() {
        clearTimeout(fallbackTimer);
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
    const lead = await captureDemoLead(identity.key, { ...parsed.data, inspectionRequested: parsed.data.requestType === 'viewing', requirements: [parsed.data.requestType === 'viewing' ? 'Viewing requested (not confirmed)' : parsed.data.requestType === 'payment' ? 'Payment details requested' : parsed.data.requestType === 'callback' ? 'Callback requested' : 'Enquiry saved', parsed.data.requirements].filter(Boolean).join('\n').slice(0, 4000) });
    const response = NextResponse.json({ lead: lead.toJSON() }, { status: 201 });
    if (identity.isNew) response.cookies.set('tko.demo.visitor', identity.key, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
    return response;
  } catch (error) {
    console.error('[sales-engine] lead capture failed', error);
    return NextResponse.json({ message: 'We could not save your details right now. Please try again shortly.' }, { status: 500 });
  }
}
