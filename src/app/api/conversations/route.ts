import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/sales-engine/db/connection';
import { Conversation, Message } from '@/sales-engine/db/models';
import { ensureDemoBusiness } from '@/sales-engine/services/demo-business';
import { requireStaff, staffRequired } from '@/sales-engine/staff-auth';

export async function GET(request: Request) {
  if (!await requireStaff(request)) return staffRequired();
  await connectToDatabase();
  const business = await ensureDemoBusiness();
  const conversations = await Conversation.find({ businessId: business._id }).sort({ lastMessageAt: -1 }).limit(100);
  const data = await Promise.all(conversations.map(async (conversation) => ({
    ...conversation.toJSON(),
    messages: (await Message.find({ businessId: business._id, conversationId: conversation._id }).sort({ createdAt: 1 }).limit(50)).map((message) => message.toJSON()),
  })));
  return NextResponse.json({ conversations: data });
}
