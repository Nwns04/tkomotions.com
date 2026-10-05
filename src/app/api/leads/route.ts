import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { connectToDatabase } from '@/sales-engine/db/connection';
import { Lead } from '@/sales-engine/db/models';
import { captureDemoLead } from '@/sales-engine/services/conversation-workflow';
import { ensureDemoBusiness } from '@/sales-engine/services/demo-business';
import { requireStaff, staffRequired } from '@/sales-engine/staff-auth';

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(60).optional(),
  email: z.string().trim().email().max(254).optional(),
  source: z.string().trim().min(1).max(80).default('Website'),
  propertyType: z.string().trim().max(200).optional(),
  location: z.string().trim().max(120).optional(),
  budget: z.string().trim().max(80).optional(),
  intent: z.string().trim().max(40).default('Buy'),
  inspectionRequested: z.boolean().default(false),
  requirements: z.string().trim().min(1).max(4000).optional(),
});

export async function GET(request: Request) {
  if (!await requireStaff(request)) return staffRequired();
  await connectToDatabase();
  const business = await ensureDemoBusiness();
  const leads = await Lead.find({ businessId: business._id }).sort({ createdAt: -1 }).limit(100);
  return NextResponse.json({ leads: leads.map((lead) => lead.toJSON()) }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    if (!await requireStaff(request)) return staffRequired();
    const body = await request.json().catch(() => null);
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Please provide valid lead details.' }, { status: 400 });
    }

    await connectToDatabase();
    const lead = await captureDemoLead(`staff-${randomUUID()}`, parsed.data);
    return NextResponse.json({ lead: lead.toJSON() }, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ message: 'Lead could not be created right now.' }, { status: 500 });
  }
}
