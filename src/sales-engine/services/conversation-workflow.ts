import { createAIProvider } from '../ai';
import type { AIInput } from '../ai';
import { connectToDatabase } from '../db/connection';
import { AgentAction, Appointment, Conversation, Lead, Message } from '../db/models';
import { DEMO_SERVICE_ERROR_MESSAGE, type DemoContextTurn } from '../demo-context';
import { getDemoGuidance, getDemoSalesReply, sendDemoSalesReply, type DemoStreamEvent } from '../demo-sales-flow';
import { ensureDemoBusiness, getDemoKnowledge } from './demo-business';
import { scoreSalesLead, type LeadScoreInput } from './lead-scoring';
import { notifyQualifiedLead } from './lead-notification';

export type { DemoStreamEvent, DemoPropertyCard } from '../demo-sales-flow';

export function systemPrompt(context: string) {
  return 'You are the TKO Properties sales assistant in a fictional real-estate demo. Help the visitor find a suitable home and take a useful next step. Answer the actual question first. Use only the approved information below. Never invent addresses, amenities, fees, payment eligibility, availability, legal documents or confirmed appointment times. Viewing requests are Monday to Saturday, 9 AM to 5 PM and require confirmation. If a fact is missing, say what needs verification, offer to add that question to the enquiry, and keep helping. Ask at most one relevant question at a time about location, budget or moving timeframe, and do not repeat information already given. Respect visitors who are just exploring; offer to save an enquiry instead of forcing a viewing. Use short plain-text paragraphs. Do not promise that a fictional property team will call the visitor or that a booking has been made. Do not collect contact details in chat: invite them to use the enquiry form.\n\nApproved information:\n' + context;
}

export async function replyToDemoVisitor(visitorKey: string, content: string, onEvent?: (event: DemoStreamEvent) => void, history: DemoContextTurn[] = []) {
  await connectToDatabase();
  const business = await ensureDemoBusiness();
  let conversation = await Conversation.findOne({ businessId: business._id, visitorKey, channel: 'WEB' }).sort({ updatedAt: -1 });
  if (!conversation) conversation = await Conversation.create({ businessId: business._id, visitorKey, channel: 'WEB', status: 'ACTIVE' });
  const stored = await Message.find({ conversationId: conversation._id }).sort({ createdAt: -1, _id: -1 }).limit(12).lean();
  const prior: DemoContextTurn[] = history.length ? history : stored.reverse().map(message => ({
    role: message.role === 'customer' ? 'user' : 'assistant', content: message.content,
  }));
  await Promise.all([
    Message.create({ businessId: business._id, conversationId: conversation._id, role: 'customer', content }),
    Conversation.updateOne({ _id: conversation._id }, { $set: { lastMessageAt: new Date() } }),
  ]);
  const conversationId = String(conversation._id);
  async function saveReply(reply: string) {
    await Message.create({ businessId: business._id, conversationId: conversation._id, role: 'assistant', content: reply });
    return { reply, conversationId };
  }
  if (conversation.status === 'HUMAN') {
    const reply = 'This conversation is with the team. You can review or save your enquiry while waiting for a response.';
    onEvent?.({ type: 'text', text: reply });
    onEvent?.({ type: 'guidance', ...getDemoGuidance(content, prior), requestType: 'callback' });
    return saveReply(reply);
  }

  const knownReply = getDemoSalesReply(content, prior);
  if (knownReply) {
    if (onEvent) sendDemoSalesReply(knownReply, onEvent);
    await AgentAction.create({ businessId: business._id, conversationId: conversation._id, actionType: 'search_knowledge', status: 'SUCCESS', payload: { query: content.slice(0, 500) }, result: 'Answered from approved demo sales flow' });
    return saveReply(knownReply.reply);
  }

  let streamedContent = '';
  try {
    const approvedKnowledge = await getDemoKnowledge(business._id);
    const provider = createAIProvider();
    const input: AIInput = { temperature: 0.2, messages: [
      { role: 'system', content: systemPrompt(approvedKnowledge.map(match => match.content).join('\n')) },
      ...prior.slice(-12).map(turn => ({ role: turn.role === 'user' || turn.role === 'customer' ? 'user' as const : 'assistant' as const, content: turn.content })),
      { role: 'user', content },
    ] };
    const response = provider.generateResponseStream
      ? await provider.generateResponseStream(input, token => { streamedContent += token; onEvent?.({ type: 'text', text: token }); })
      : await provider.generateResponse(input);
    const reply = response.content.trim();
    if (!reply) throw new Error('AI provider returned an empty demo response.');
    if (!provider.generateResponseStream) onEvent?.({ type: 'text', text: reply });
    onEvent?.({ type: 'guidance', ...getDemoGuidance(content, prior), requestType: 'enquiry' });
    return saveReply(reply);
  } catch (error) {
    console.error('[sales-engine] demo workflow failed', error);
    const reply = streamedContent ? streamedContent.trimEnd() + '\n\n' + DEMO_SERVICE_ERROR_MESSAGE : DEMO_SERVICE_ERROR_MESSAGE;
    onEvent?.({ type: 'text', text: streamedContent ? '\n\n' + DEMO_SERVICE_ERROR_MESSAGE : reply });
    onEvent?.({ type: 'guidance', ...getDemoGuidance(content, prior), requestType: 'enquiry' });
    return saveReply(reply);
  }
}

export async function captureDemoLead(visitorKey: string, input: LeadScoreInput & { propertyType?: string; requirements?: string; viewingTime?: string }) {
  await connectToDatabase();
  const business = await ensureDemoBusiness();
  let conversation = await Conversation.findOne({ businessId: business._id, visitorKey, channel: 'WEB' }).sort({ updatedAt: -1 });
  if (!conversation) conversation = await Conversation.create({ businessId: business._id, visitorKey, channel: 'WEB', status: 'ACTIVE' });
  const score = scoreSalesLead(input);
  const interest = input.propertyType && input.location ? `${input.propertyType} / ${input.location}` : input.propertyType || input.location || 'General enquiry';
  const lead = await Lead.findOneAndUpdate(
    { businessId: business._id, conversationId: conversation?._id ?? null },
    {
      $set: {
        name: input.name?.trim() || '', phone: input.phone?.trim() || '', email: input.email?.trim() || '',
        source: 'Website', status: input.inspectionRequested ? 'APPOINTMENT' : 'NEW', score: score.score,
        classification: score.classification, scoreFlags: score.flags, requirements: input.requirements?.trim() || '',
        interest, propertyType: input.propertyType?.trim() || '', location: input.location?.trim() || '',
        budget: input.budget?.trim() || '', timeline: input.timeline?.trim() || '', intent: input.intent?.trim() || 'Buy',
        inspectionRequested: Boolean(input.inspectionRequested), isDemo: true,
      },
      $setOnInsert: { businessId: business._id, conversationId: conversation?._id ?? null },
    },
    { new: true, upsert: true },
  );
  if (conversation) {
    conversation.leadId = lead._id;
    await conversation.save();
  }
  await AgentAction.create({ businessId: business._id, conversationId: conversation?._id ?? null, actionType: 'create_lead', status: 'SUCCESS', payload: { score: lead.score, classification: lead.classification }, result: 'Demo lead captured through contact form' });
  const notification = await notifyQualifiedLead(business, lead);
  await AgentAction.create({ businessId: business._id, conversationId: conversation?._id ?? null, actionType: 'notify_business', status: notification.sent ? 'SUCCESS' : 'REJECTED', payload: { score: lead.score }, result: notification.reason });
  if (input.inspectionRequested) {
    await Appointment.findOneAndUpdate(
      { businessId: business._id, leadId: lead._id, status: { $in: ['REQUESTED', 'SCHEDULED'] } },
      { $setOnInsert: { businessId: business._id, leadId: lead._id, conversationId: conversation?._id ?? null, customer: lead.name, scheduledFor: input.viewingTime?.trim() || 'Inspection time to be confirmed', status: 'REQUESTED', notes: 'Website demo inspection request.', isDemo: true } },
      { upsert: true, new: true },
    );
    await AgentAction.create({ businessId: business._id, conversationId: conversation?._id ?? null, actionType: 'request_appointment', status: 'SUCCESS', payload: { leadId: String(lead._id) }, result: 'Inspection request created' });
  }
  return lead;
}
