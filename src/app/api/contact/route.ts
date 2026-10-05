import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getResendClient } from '@/lib/resend';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160).optional(),
  email: z.string().email().max(254),
  phone: z.string().trim().max(60).optional(),
  need: z.string().trim().min(1).max(120),
  problem: z.string().trim().min(10).max(6000),
  budget: z.string().trim().max(80).optional(),
  timeline: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: 'Please check the project details and try again.' }, { status: 400 });

  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL;
  if (!resend || !from) return NextResponse.json({ message: 'Project enquiries are temporarily unavailable. Please email hello@tkomotions.com.' }, { status: 503 });

  const { name, company, email, phone, need, problem, budget, timeline } = parsed.data;
  const result = await resend.emails.send({
    from,
    to: 'hello@tkomotions.com',
    replyTo: email,
    subject: `Project enquiry from ${name}`,
    text: [`Name: ${name}`, `Company: ${company || 'Not provided'}`, `Email: ${email}`, `Phone / WhatsApp: ${phone || 'Not provided'}`, `Project type: ${need}`, `Problem: ${problem}`, `Budget: ${budget || 'Not provided'}`, `Timeline: ${timeline || 'Not provided'}`].join('\n\n'),
  });
  if (result.error) return NextResponse.json({ message: 'The project enquiry could not be sent. Please try again.' }, { status: 502 });
  return NextResponse.json({ ok: true }, { status: 200 });
}