import { createAIProvider } from '../ai';
import type { AIInput } from '../ai';
import { connectToDatabase } from '../db/connection';
import { AgentAction, Appointment, Conversation, Lead, Message } from '../db/models';
import { DEMO_FALLBACK_MESSAGE } from '../demo-engine';
import { ensureDemoBusiness, findDemoKnowledge, listDemoProperties, searchDemoKnowledge } from './demo-business';
import { scoreSalesLead, type LeadScoreInput } from './lead-scoring';
import { notifyQualifiedLead } from './lead-notification';

const humanMessage = 'A member of the team has taken over this conversation and will respond shortly.';

export type DemoPropertyCard = {
  title: string;
  location: string;
  price: string;
  images: string[];
};

export type DemoStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'properties'; properties: DemoPropertyCard[] };

const propertyImages: Record<string, string[]> = {
  wuse: ['/images/wuse1.webp', '/images/wuse 2.webp', '/images/wuse 3.webp'],
  jabi: ['/images/jabi.webp', '/images/jabi 2.webp', '/images/jabi 3.webp'],
  gwarinpa: ['/images/gwarimpa.webp', '/images/gwarimpa2.webp', '/images/gwarimpa3.webp'],
};

function isPropertyBrowseRequest(content: string) {
  return /\b(view|show|list|browse|see|available)\b/i.test(content)
    && /\b(properties|property|homes?|houses?|apartments?)\b/i.test(content);
}

function isPropertyRecommendationRequest(content: string) {
  return /\b(recommend|looking for|searching for|need|family|bedroom)\b/i.test(content)
    && /\b(home|house|property|apartment|bedroom|family|wuse|gwarinpa|jabi|maitama)\b/i.test(content);
}

function isPropertyPricingRequest(content: string) {
  return /\b(pricing|prices?|costs?)\b/i.test(content);
}

function isAgentRequest(content: string) {
  return /\b(speak|talk|connect)\b/i.test(content) && /\b(agent|person|human|team)\b/i.test(content);
}

function isInspectionPolicyRequest(content: string) {
  return /\b(inspection|viewing|visit|open|opening hours|business hours|installment|installments|payment terms)\b/i.test(content);
}

function systemPrompt(context: string) {
  return `You are the TKO Properties customer-service and sales assistant for a real-estate demonstration. Be warm, courteous, clear and helpful without being pushy. Use only the approved knowledge below. Never invent prices, availability, policies, discounts or appointment times. If the answer is unavailable, reply exactly: "${DEMO_FALLBACK_MESSAGE}". Use short sentences and plain text. Put each property on its own bullet, with the property type, location and price easy to scan. Leave a blank line between sections. End with one gentle, useful next-step question when appropriate. If someone shows interest, invite them to use the secure contact form.\n\nApproved knowledge:\n${context || 'No matching approved information was found.'}`;
}

export async function replyToDemoVisitor(visitorKey: string, content: string, onEvent?: (event: DemoStreamEvent) => void) {
  await connectToDatabase();
  const business = await ensureDemoBusiness();
  let conversation = await Conversation.findOne({ businessId: business._id, visitorKey, channel: 'WEB' }).sort({ updatedAt: -1 });
  if (!conversation) conversation = await Conversation.create({ businessId: business._id, visitorKey, channel: 'WEB', status: 'ACTIVE' });

  await Promise.all([
    Message.create({ businessId: business._id, conversationId: conversation._id, role: 'customer', content }),
    Conversation.updateOne({ _id: conversation._id }, { $set: { lastMessageAt: new Date() } }),
  ]);

  const conversationId = String(conversation._id);
  async function sendImmediateReply(reply: string, actionType = 'search_knowledge', properties?: DemoPropertyCard[]) {
    if (properties?.length) onEvent?.({ type: 'properties', properties });
    onEvent?.({ type: 'text', text: reply });
    await Promise.all([
      Message.create({ businessId: business._id, conversationId: conversation._id, role: 'assistant', content: reply }),
      AgentAction.create({ businessId: business._id, conversationId: conversation._id, actionType, status: 'SUCCESS', payload: { query: content.slice(0, 500) }, result: 'Answered from approved demo workflow' }),
    ]);
    return { reply, conversationId };
  }

  if (conversation.status === 'HUMAN') return sendImmediateReply(humanMessage, 'human_handoff');

  if (isAgentRequest(content)) {
    const reply = 'Of course. Please share your name and best contact details using the viewing request form below, and our team will be happy to help.';
    return sendImmediateReply(reply, 'human_handoff');
  }

  const propertyBrowseRequest = isPropertyBrowseRequest(content);
  const propertyPricingRequest = isPropertyPricingRequest(content);
  const propertyRecommendationRequest = isPropertyRecommendationRequest(content);
  const policyRequest = isInspectionPolicyRequest(content);
  const matches = propertyBrowseRequest || propertyPricingRequest || propertyRecommendationRequest
    ? await listDemoProperties(business._id)
    : policyRequest
      ? await findDemoKnowledge(business._id, /inspection|payment|business hours/i)
      : await searchDemoKnowledge(business._id, content);

  if (propertyBrowseRequest || propertyPricingRequest || propertyRecommendationRequest) {
    const location = matches
      .map((match) => match.content.match(/Location:\s*([^.]+)/i)?.[1]?.trim())
      .find((candidate) => candidate && new RegExp(`\\b${candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(content));
    const relevantMatches = location
      ? matches.filter((match) => match.content.toLowerCase().includes(`location: ${location.toLowerCase()}`))
      : matches;
    const introduction = location
      ? `Of course. I found this sample home in ${location} that may suit what you’re looking for:`
      : propertyPricingRequest
        ? 'Of course. Here are the sample homes and prices currently available in this demo:'
        : propertyRecommendationRequest
          ? 'Of course. Here are a few sample homes that may be a good place to start:'
          : 'Of course. Here are a few homes currently available in this demo:';
    const propertyCards = relevantMatches.flatMap((match): DemoPropertyCard[] => {
      const property = match.content.match(/^(.*?)\.\s*Location:\s*(.*?)\.\s*Price:\s*(.+)$/i);
      if (!property) return [];
      const location = property[2].trim();
      return [{
        title: property[1].trim(),
        location,
        price: property[3].trim(),
        images: propertyImages[location.toLowerCase()] ?? [],
      }];
    });
    const reply = propertyCards.length
      ? `${introduction}\n\n${propertyCards.map((property) => `• ${property.title}\n  Location: ${property.location}\n  Price: ${property.price}`).join('\n\n')}\n\nWould you like more details about one, or help arranging a viewing?`
      : DEMO_FALLBACK_MESSAGE;
    return sendImmediateReply(reply, 'search_knowledge', propertyCards);
  }

  if (policyRequest && matches.length) {
    const reply = `Of course. Here are the viewing and payment details:\n\n${matches.map((match) => `• ${match.content}`).join('\n\n')}\n\nWould you like help arranging a viewing?`;
    return sendImmediateReply(reply);
  }

  const knowledgeAction = AgentAction.create({ businessId: business._id, conversationId: conversation._id, actionType: 'search_knowledge', status: 'SUCCESS', payload: { query: content.slice(0, 500) }, result: `${matches.length} approved knowledge matches` });
  let streamedContent = '';
  try {
    const recent = await Message.find({ conversationId: conversation._id }).sort({ createdAt: -1 }).limit(12).lean();
    const provider = createAIProvider();
    const input: AIInput = {
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt(matches.map((match) => match.content).join('\n')) },
        ...recent.reverse().map((message) => ({ role: message.role === 'customer' ? 'user' as const : 'assistant' as const, content: message.content })),
      ],
    };
    const response = provider.generateResponseStream
      ? await provider.generateResponseStream(input, (token) => {
        streamedContent += token;
        onEvent?.({ type: 'text', text: token });
      })
      : await provider.generateResponse(input);
    const generatedReply = response.content.trim();
    const reply = generatedReply || DEMO_FALLBACK_MESSAGE;
    if (!provider.generateResponseStream || (!generatedReply && !streamedContent)) {
      streamedContent = reply;
      onEvent?.({ type: 'text', text: reply });
    }
    await Promise.all([
      Message.create({ businessId: business._id, conversationId: conversation._id, role: 'assistant', content: reply }),
      knowledgeAction,
    ]);
    return { reply, conversationId };
  } catch (error) {
    console.error('[sales-engine] demo workflow failed', error);
    const reply = streamedContent
      ? `${streamedContent.trimEnd()}\n\n${DEMO_FALLBACK_MESSAGE}`
      : DEMO_FALLBACK_MESSAGE;
    if (onEvent) onEvent({ type: 'text', text: streamedContent ? `\n\n${DEMO_FALLBACK_MESSAGE}` : reply });
    await Promise.all([
      Message.create({ businessId: business._id, conversationId: conversation._id, role: 'assistant', content: reply }),
      knowledgeAction,
    ]);
    return { reply, conversationId };
  }
}

export async function captureDemoLead(visitorKey: string, input: LeadScoreInput & { propertyType?: string; requirements?: string }) {
  await connectToDatabase();
  const business = await ensureDemoBusiness();
  const conversation = await Conversation.findOne({ businessId: business._id, visitorKey, channel: 'WEB' }).sort({ updatedAt: -1 });
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
      { $setOnInsert: { businessId: business._id, leadId: lead._id, conversationId: conversation?._id ?? null, customer: lead.name, scheduledFor: input.timeline?.trim() || 'Inspection time to be confirmed', status: 'REQUESTED', notes: 'Website demo inspection request.', isDemo: true } },
      { upsert: true, new: true },
    );
    await AgentAction.create({ businessId: business._id, conversationId: conversation?._id ?? null, actionType: 'request_appointment', status: 'SUCCESS', payload: { leadId: String(lead._id) }, result: 'Inspection request created' });
  }
  return lead;
}
