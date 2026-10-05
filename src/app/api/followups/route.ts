import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/sales-engine/db/connection';
import { FollowUp, Lead } from '@/sales-engine/db/models';
import { ensureDemoBusiness } from '@/sales-engine/services/demo-business';
import { requireStaff, staffRequired } from '@/sales-engine/staff-auth';

const followUpSchema = z.object({
  leadId: z.string().trim().min(1).max(120),
  leadName: z.string().trim().min(1).max(120).default('Customer'),
  scheduledFor: z.string().datetime().or(z.string().min(1)),
  reason: z.string().trim().min(1).max(2000),
  status: z.string().trim().max(40).default('PENDING'),
});

export async function GET(request: Request) {
  if (!await requireStaff(request)) return staffRequired();
  await connectToDatabase();
  const business = await ensureDemoBusiness();
  const followUps = await FollowUp.find({ businessId: business._id }).sort({ scheduledFor: 1 }).limit(100);
  return NextResponse.json({ followUps: followUps.map((followUp) => followUp.toJSON()) }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    if (!await requireStaff(request)) return staffRequired();
    const body = await request.json().catch(() => null);
    const parsed = followUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Please provide valid follow-up details.' }, { status: 400 });
    }

    await connectToDatabase();
    const business = await ensureDemoBusiness();
    const lead = await Lead.findOne({ _id: parsed.data.leadId, businessId: business._id });
    if (!lead) return NextResponse.json({ message: 'Lead was not found.' }, { status: 404 });
    const followUp = await FollowUp.create({ businessId: business._id, leadId: lead._id, customer: parsed.data.leadName || lead.name, scheduledFor: new Date(parsed.data.scheduledFor), reason: parsed.data.reason, status: parsed.data.status, isDemo: true });
    lead.status = 'FOLLOW_UP'; await lead.save();
    return NextResponse.json({ followUp: followUp.toJSON() }, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ message: 'Follow-up could not be created right now.' }, { status: 500 });
  }
}
