import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectToDatabase } from '@/sales-engine/db/connection';
import { Conversation, Message } from '@/sales-engine/db/models';
import { ensureDemoBusiness } from '@/sales-engine/services/demo-business';
import { requireStaff, staffRequired } from '@/sales-engine/staff-auth';

const schema = z.object({ content: z.string().trim().min(1).max(8000) });

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  if (!await requireStaff(request)) return staffRequired();
  const { conversationId } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!mongoose.isValidObjectId(conversationId) || !parsed.success) return NextResponse.json({ message: 'Please enter a valid message.' }, { status: 400 });
  await connectToDatabase();
  const business = await ensureDemoBusiness();
  const conversation = await Conversation.findOne({ _id: conversationId, businessId: business._id, status: 'HUMAN' });
  if (!conversation) return NextResponse.json({ message: 'Take over the conversation before sending a human reply.' }, { status: 409 });
  const message = await Message.create({ businessId: business._id, conversationId: conversation._id, role: 'human', content: parsed.data.content });
  conversation.lastMessageAt = new Date(); await conversation.save();
  return NextResponse.json({ message: message.toJSON() }, { status: 201 });
}
