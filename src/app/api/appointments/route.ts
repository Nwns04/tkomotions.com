import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/sales-engine/db/connection';
import { Appointment, Lead } from '@/sales-engine/db/models';
import { ensureDemoBusiness } from '@/sales-engine/services/demo-business';
import { requireStaff, staffRequired } from '@/sales-engine/staff-auth';

const appointmentSchema = z.object({
  leadId: z.string().trim().min(1).max(120),
  leadName: z.string().trim().min(1).max(120).default('Customer'),
  scheduledFor: z.string().datetime().or(z.string().min(1)),
  notes: z.string().trim().max(2000).default('Inspection requested by customer.'),
  status: z.string().trim().max(40).default('SCHEDULED'),
});

export async function GET(request: Request) {
  if (!await requireStaff(request)) return staffRequired();
  await connectToDatabase();
  const business = await ensureDemoBusiness();
  const appointments = await Appointment.find({ businessId: business._id }).sort({ createdAt: -1 }).limit(100);
  return NextResponse.json({ appointments: appointments.map((appointment) => appointment.toJSON()) }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    if (!await requireStaff(request)) return staffRequired();
    const body = await request.json().catch(() => null);
    const parsed = appointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Please provide valid appointment details.' }, { status: 400 });
    }

    await connectToDatabase();
    const business = await ensureDemoBusiness();
    const lead = await Lead.findOne({ _id: parsed.data.leadId, businessId: business._id });
    if (!lead) return NextResponse.json({ message: 'Lead was not found.' }, { status: 404 });
    const appointment = await Appointment.create({ businessId: business._id, leadId: lead._id, customer: parsed.data.leadName || lead.name, scheduledFor: parsed.data.scheduledFor, notes: parsed.data.notes, status: parsed.data.status, isDemo: true });
    lead.status = 'APPOINTMENT'; await lead.save();
    return NextResponse.json({ appointment: appointment.toJSON() }, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ message: 'Appointment could not be created right now.' }, { status: 500 });
  }
}
