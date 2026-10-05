export type DemoContextTurn = { role: string; content: string };

export const DEMO_SERVICE_ERROR_MESSAGE = "I'm having trouble answering right now. Please try again shortly, or share your details so the team can help.";

// Resolve short references without carrying a previous location into a new search.
export function resolveDemoQuery(message: string, history: DemoContextTurn[] = []) {
  const locations = /\b(wuse|gwarinpa|gwarimpa|jabi|maitama)\b/gi;
  const normalized = message.replace(/\bgwarimpa\b/gi, 'Gwarinpa');
  if (normalized.match(locations)) return normalized;
  if (!/\b(it|its|that|this|there|those|them)\b|how much|tell me more/i.test(normalized)) return normalized;
  for (const turn of [...history].reverse()) {
    const mentioned = [...new Set((turn.content.match(locations) ?? []).map((location) => location.toLowerCase().replace('gwarimpa', 'gwarinpa')))];
    if (mentioned.length > 1) return normalized;
    if (mentioned.length === 1) return normalized + ' in ' + mentioned[0];
  }
  return normalized;
}
