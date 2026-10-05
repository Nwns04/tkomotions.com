import { createAIProvider } from './ai';
import { readSalesEngineConfig } from './config';
import type { AIMessage } from './ai/types';

export type DemoTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export const DEMO_FALLBACK_MESSAGE = "I don't have that information available right now. I can connect you with a member of the team.";

export const TKO_PROPERTIES_KNOWLEDGE = `
Business: TKO Properties
Locations: Wuse, Gwarinpa, Maitama, Jabi
Properties:
- 3-bedroom apartment | Location: Wuse | Price: ₦85,000,000
- 4-bedroom duplex | Location: Gwarinpa | Price: ₦120,000,000
- 4-bedroom terrace | Location: Jabi | Price: ₦95,000,000
- 5-bedroom duplex | Location: Maitama | Price: ₦250,000,000
Inspection: Monday-Saturday | 9:00 AM-5:00 PM
Payment: Outright payment. Installment available on selected properties.
`;

export function buildDemoSystemPrompt(): string {
  return `You are the TKO Properties sales assistant for a real-estate demo.

Use only the approved business information below. Never invent prices, property availability, policies, or appointments.

Approved business information:
${TKO_PROPERTIES_KNOWLEDGE}

Rules:
- Answer in a helpful, professional sales tone.
- If the customer asks about properties by location or budget, match the question to the known properties.
- If a question is outside the known knowledge, reply exactly: "I don't have that information available right now. I can connect you with a member of the team."
- Do not claim that a property is available unless it is listed in the approved business information.
- Use the product names and locations exactly as provided.
- If a customer is interested, politely ask whether they would like to arrange an inspection or speak with a sales agent.
`;
}

export function normalizeDemoHistory(history: DemoTurn[] = []): DemoTurn[] {
  return history
    .filter((turn) => turn && typeof turn.content === 'string' && turn.content.trim().length > 0)
    .slice(-12)
    .map((turn) => ({
      role: turn.role === 'assistant' ? 'assistant' : 'user',
      content: turn.content.trim(),
    }));
}

export async function generateDemoSalesReply(message: string, history: DemoTurn[] = []): Promise<string> {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return DEMO_FALLBACK_MESSAGE;
  }

  try {
    const config = readSalesEngineConfig(process.env);
    const provider = createAIProvider(config);
    const messages: AIMessage[] = [
      { role: 'system', content: buildDemoSystemPrompt() },
      ...normalizeDemoHistory(history).map((turn) => ({
        role: turn.role,
        content: turn.content,
      })),
      { role: 'user', content: trimmedMessage },
    ];

    const response = await provider.generateResponse({ messages, temperature: 0.2 });
    const answer = response.content?.trim();
    return answer || DEMO_FALLBACK_MESSAGE;
  } catch (error) {
    console.error('[sales-engine] demo reply failed', error);
    return DEMO_FALLBACK_MESSAGE;
  }
}
