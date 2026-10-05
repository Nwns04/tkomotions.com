import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/sales-engine/db/connection';
import { AgentAction, Conversation } from '@/sales-engine/db/models';
import { ensureDemoBusiness } from '@/sales-engine/services/demo-business';
import { requireStaff, staffRequired } from '@/sales-engine/staff-auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const staff = await requireStaff(request);
  if (!staff) return staffRequired();
  const { conversationId } = await params;
  if (!mongoose.isValidObjectId(conversationId)) return NextResponse.json({ message: 'Conversation was not found.' }, { status: 404 });
  await connectToDatabase();
  const business = await ensureDemoBusiness();
  const conversation = await Conversation.findOneAndUpdate(
    { _id: conversationId, businessId: business._id },
    { $set: { status: 'HUMAN', handoffReason: 'Taken over by staff.', takenOverAt: new Date() } },
    { new: true },
  );
  if (!conversation) return NextResponse.json({ message: 'Conversation was not found.' }, { status: 404 });
  await AgentAction.create({ businessId: business._id, conversationId: conversation._id, actionType: 'handoff_to_human', status: 'SUCCESS', payload: { staff: staff.email }, result: 'Staff took over this conversation' });
  return NextResponse.json({ conversation: conversation.toJSON() });
}
