import { resolveDemoQuery, type DemoContextTurn } from './demo-context';

export type DemoRequestType = 'enquiry' | 'viewing' | 'payment' | 'callback';
export type DemoRequirements = {
  propertyType: string;
  location: string;
  budget: string;
  timeline: string;
  viewingTime: string;
  requirements: string;
  intent: string;
};
export type DemoPropertyCard = {
  title: string;
  location: string;
  price: string;
  media: Array<{ src: string; type: 'image' | 'video'; thumbnail?: string }>;
};
export type DemoGuidance = {
  followUps: string[];
  requestType?: DemoRequestType;
  requirements: DemoRequirements;
};
export type DemoStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'properties'; properties: DemoPropertyCard[] }
  | ({ type: 'guidance' } & DemoGuidance);
export type DemoSalesReply = DemoGuidance & { reply: string; properties?: DemoPropertyCard[] };

export const demoRequestLabels: Record<DemoRequestType, string> = {
  enquiry: 'Save enquiry', viewing: 'Request viewing', payment: 'Ask about payments', callback: 'Request callback',
};

export const DEMO_PROPERTIES: DemoPropertyCard[] = [
  { title: '3-bedroom apartment', location: 'Wuse', price: '₦85,000,000', media: ['/images/wuse1.webp', '/images/wuse 2.webp', '/images/wuse 3.webp'].map(src => ({ src, type: 'image' as const })) },
  { title: '4-bedroom duplex', location: 'Gwarinpa', price: '₦120,000,000', media: ['/images/gwarimpa.webp', '/images/gwarimpa2.webp', '/images/gwarimpa3.webp'].map(src => ({ src, type: 'image' as const })) },
  { title: '4-bedroom terrace', location: 'Jabi', price: '₦95,000,000', media: ['/images/jabi.webp', '/images/jabi 2.webp', '/images/jabi 3.webp'].map(src => ({ src, type: 'image' as const })) },
  { title: '5-bedroom duplex', location: 'Maitama', price: '₦250,000,000', media: [] },
];

function locationsIn(text: string) {
  return [...new Set((text.match(/\b(wuse|gwarinpa|gwarimpa|jabi|maitama)\b/gi) ?? []).map(value => value.toLowerCase().replace('gwarimpa', 'gwarinpa')))];
}
function budgetIn(text: string) {
  const amounts = [...text.matchAll(/(?:₦|NGN\s*)?(\d[\d,]*(?:\.\d+)?)\s*(million|mn|m|thousand|k)\b/gi)];
  const amount = amounts.at(-1);
  if (amount) return Number(amount[1].replace(/,/g, '')) * (/^(million|mn|m)$/i.test(amount[2]) ? 1_000_000 : 1_000);
  const naira = text.match(/(?:₦|NGN\s*)(\d[\d,]*)|(?:budget|under|below|up to|max(?:imum)?)\s*(?:is|of)?\s*(\d[\d,]{5,})/i);
  return naira ? Number((naira[1] || naira[2]).replace(/,/g, '')) : undefined;
}
function bedroomsIn(text: string) {
  const match = text.match(/\b(\d+|one|two|three|four|five|six)[-\s]*(?:bedrooms?|beds?)\b/i);
  if (!match) return undefined;
  const words: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
  return words[match[1].toLowerCase()] || Number(match[1]);
}

export function extractDemoRequirements(history: DemoContextTurn[]): DemoRequirements {
  const details: DemoRequirements = { propertyType: '', location: '', budget: '', timeline: '', viewingTime: '', requirements: '', intent: 'Exploring' };
  const userTurns = history.filter(turn => turn.role === 'user' || turn.role === 'customer');
  for (const turn of userTurns) {
    const text = turn.content;
    const locations = locationsIn(text);
    if (locations.length === 1) {
      const nextLocation = DEMO_PROPERTIES.find(p => p.location.toLowerCase() === locations[0])?.location || '';
      if (details.location && details.location !== nextLocation && !bedroomsIn(text)) details.propertyType = '';
      details.location = nextLocation;
    }
    if (locations.length > 1 || /\b(any|all|other)\s+(locations?|areas?|homes?|properties)\b/i.test(text)) details.location = '';
    const budget = budgetIn(text);
    if (budget !== undefined && Number.isFinite(budget)) details.budget = '₦' + budget.toLocaleString('en-NG');
    if (/\b(no budget|any budget|all prices)\b/i.test(text)) details.budget = '';
    const bedrooms = bedroomsIn(text);
    if (bedrooms) details.propertyType = bedrooms + '-bedroom home';
    const timeline = text.match(/\b(next (?:month|year)|this month|in \d+ (?:weeks?|months?)|as soon as possible|just (?:looking|exploring)|not ready)\b/i)?.[0];
    if (timeline) details.timeline = timeline;
    const viewing = text.match(/\b(?:(?:next|this)\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)(?:\s+(?:at|around|by)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?\b/i)?.[0];
    if (viewing) details.viewingTime = viewing;
    if (/\b(buy|buying|purchase|moving|move)\b/i.test(text)) details.intent = 'Buy';
    if (/\b(rent|renting|lease)\b/i.test(text)) details.intent = 'Rent';
    if (/\b(just exploring|just looking|not ready)\b/i.test(text)) details.intent = 'Exploring';
  }
  const selected = DEMO_PROPERTIES.find(property => property.location === details.location);
  if (selected && (!details.propertyType || bedroomsIn(details.propertyType) === bedroomsIn(selected.title))) details.propertyType = selected.title;
  details.requirements = userTurns.slice(-8).map(turn => turn.content).join('\n').slice(0, 3000);
  return details;
}

export function getDemoGuidance(message: string, history: DemoContextTurn[] = []): DemoGuidance {
  const requirements = extractDemoRequirements([...history, { role: 'user', content: message }]);
  const place = requirements.location ? ' the ' + requirements.location + ' home' : ' a home';
  return { requirements, followUps: ['When can I see' + place + '?', 'What are the payment options?', 'Save my enquiry'] };
}

export function getDemoSalesReply(message: string, history: DemoContextTurn[] = [], catalog: DemoPropertyCard[] = DEMO_PROPERTIES, now: Date = new Date()): DemoSalesReply | null {
  const guidance = getDemoGuidance(message, history);
  const query = resolveDemoQuery(message, history);
  const text = query.toLowerCase();
  const details = guidance.requirements;
  const explicitLocations = locationsIn(message);
  const resolvedLocations = locationsIn(query);
  const location = explicitLocations.length === 1 ? explicitLocations[0] : resolvedLocations.length === 1 ? resolvedLocations[0] : details.location.toLowerCase();
  const property = catalog.find(p => p.location.toLowerCase() === location);
  const home = property ? 'the ' + property.location + ' ' + property.title : 'a sample home';
  const response = (reply: string, extra: Partial<DemoSalesReply> = {}): DemoSalesReply => ({ ...guidance, reply, ...extra });
  const viewingWords = /\b(viewing|inspection|inspect|visit|come|come round|come over|schedule|appointment)\b|(?:when|what time|which day|can i|could i).*\b(see|view)\b/i.test(message);
  const previousViewing = /\b(viewing|inspection|which day|day and time)\b/i.test(history.at(-1)?.content || '');
  const dateReply = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b|\b\d{1,2}(?::\d{2})?\s*(am|pm)\b/i.test(message);
  const rental = /\b(rent|rental|lease)\b/i.test(message);
  if (rental) return response('The sample prices shown are purchase prices. I do not have approved rental listings in this demo. Would you like to save a rental enquiry with your preferred location and budget?', { requestType: 'enquiry', followUps: ['Save my rental enquiry', 'Show me homes for purchase'] });
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)[!.?\s]*$/i.test(message)) return response('Hello! I can help you compare the sample homes, check prices and request a viewing. Which location or budget do you have in mind?', { followUps: ['Show me available homes', 'I need a three-bedroom home', 'When can I see the Wuse house?'] });
  if (/\b(speak|talk|connect|callback|call me|contact me)\b/i.test(message) && /\b(agent|person|human|team|callback|call me|contact me)\b/i.test(message)) return response('You can add a callback request to your demo enquiry about ' + home + '. Review the details below, then add a name and preferred contact method. This is a fictional property demo.', { requestType: 'callback', followUps: ['Save my enquiry', 'What are the viewing times?'] });
  if (/\b(save|send)\b.*\b(enquiry|inquiry|details|requirements)\b|i.?m interested|i am interested|not ready|just exploring|just looking/i.test(message)) return response('We can keep the details you have shared together as a sample enquiry. You can review and edit the summary before saving it; no viewing is booked. Would you like to save the enquiry or keep exploring?', { requestType: 'enquiry', followUps: ['Show me other homes', 'What are the payment options?'] });

  if (viewingWords || (previousViewing && dateReply)) {
    const relativeDay = /\btomorrow\b/i.test(message) ? new Date(now.getTime() + 86_400_000) : /\btoday\b/i.test(message) ? now : undefined;
    const relativeSunday = relativeDay && new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'Africa/Lagos' }).format(relativeDay) === 'Sunday';
    const sunday = /\bsunday\b/i.test(message) || relativeSunday;
    const hour = message.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    const hours = hour ? (Number(hour[1]) % 12) + (hour[3].toLowerCase() === 'pm' ? 12 : 0) : undefined;
    const outsideHours = hours !== undefined && (hours < 9 || hours > 17 || (hours === 17 && Number(hour?.[2] || 0) > 0));
    let reply = 'You can request a viewing of ' + home + ' Monday to Saturday, between 9:00 AM and 5:00 PM.';
    if (sunday) reply = 'Sunday is outside the approved viewing days. You can request a viewing of ' + home + ' Monday to Saturday, between 9:00 AM and 5:00 PM.';
    if (outsideHours) reply = 'That time is outside the approved viewing hours. You can request a viewing of ' + home + ' Monday to Saturday, between 9:00 AM and 5:00 PM.';
    if (dateReply && !sunday && !outsideHours) reply += ' I can include your preferred time in the request.';
    reply += '\n\n' + (dateReply && !sunday && !outsideHours ? 'Use “Request viewing” to review the details. A real business would confirm availability before booking.' : 'Which day and time would suit you? An appointment would need confirmation.');
    return response(reply, { requestType: 'viewing', followUps: sunday || outsideHours ? ['Can I come on Saturday at 10 AM?', 'Save my enquiry'] : dateReply ? ['What are the payment options?', 'Save my enquiry'] : ['Can I come on Saturday at 10 AM?', 'What are the payment options?'] });
  }
  if (/\b(installments?|instalments?|payment|pay|deposit|mortgage|finance|financing|discount|negotiate|negotiable)\b/i.test(message)) {
    const unknown = /\b(deposit|mortgage|finance|financing|discount|negotiate|negotiable)\b|how much.*(?:monthly|month)|how many months/i.test(message);
    return response((unknown ? 'I do not have verified deposit amounts, financing terms or discounts for ' + home + '. ' : '') + 'Outright payment is accepted. Installments are available on selected properties, but eligibility and terms for ' + home + ' need confirmation.\n\nWould you like to add a payment-details request to your sample enquiry?', { requestType: 'payment', followUps: ['Save my enquiry', 'When can I see ' + home + '?'] });
  }
  if (/\b(address|directions|where|map|located|location)\b/i.test(message) && !/\b(show|list|browse|looking|need)\b/i.test(message)) return response(property ? 'The ' + property.title + ' is listed in ' + property.location + '. This demo has no verified street address or map pin. You can add a request for directions to your enquiry.' : 'The demo homes are in Wuse, Gwarinpa, Jabi and Maitama. Which home would you like directions for?', { requestType: property ? 'enquiry' : undefined, followUps: property ? ['When can I see ' + home + '?', 'Save my enquiry'] : ['Tell me about the Wuse home', 'Tell me about the Jabi home'] });
  if (/\b(pool|swimming|parking|security|power|electricity|water|furnished|furnishing|amenities|facilities|title|documents|ownership|legal|c.of.o|size|sqm|square|floor|service charge|fees|school|road|kitchen|bathrooms?|boys quarters|bq|lift|elevator|balcony|condition|completed|completion|construction|land|flood|drainage)\b/i.test(message)) return response('I do not have verified details about that for ' + home + '. I can include your question in the sample enquiry so a sales team would know what to confirm. Would you like to save it or check the price and viewing times?', { requestType: 'enquiry', followUps: ['Save my enquiry', 'When can I see ' + home + '?'] });
  if (/\b(steps|process|proceed)\b|what(?: is| comes)? next|next steps?/i.test(message)) return response('First, choose a home and confirm its details and payment terms. Next, request a viewing or a callback. A sales team would confirm availability and explain the purchase steps.\n\nWould you prefer a viewing request or to save your questions first?', { requestType: 'enquiry', followUps: ['When can I see ' + home + '?', 'Save my enquiry'] });

  const wantsProperties = /\b(show|list|browse|see|available|prices?|pricing|costs?|recommend|looking|searching|need|bedrooms?|homes?|houses?|properties|property|apartments?|duplex|terrace|photos?|pictures?|images?|compare|wuse|gwarinpa|gwarimpa|jabi|maitama)\b|how much/i.test(message) || budgetIn(message) !== undefined || bedroomsIn(message) !== undefined || (!!details.location && /^(?:next month|this month|next year|in \d+ (?:weeks?|months?))[.!?]*$/i.test(message.trim()));
  if (wantsProperties) {
    const all = /\b(all|other|any)\s+(homes?|properties|locations?|areas?)\b/i.test(message);
    const requestedLocations = explicitLocations.length > 1 ? explicitLocations : location && !all ? [location] : [];
    const budget = details.budget ? Number(details.budget.replace(/\D/g, '')) : undefined;
    const bedrooms = bedroomsIn(message) ?? (details.propertyType ? bedroomsIn(details.propertyType) : undefined);
    const matches = catalog.filter(p => (!requestedLocations.length || requestedLocations.includes(p.location.toLowerCase())) && (all || !bedrooms || bedroomsIn(p.title) === bedrooms) && (all || budget === undefined || Number(p.price.replace(/\D/g, '')) <= budget));
    if (!matches.length) return response('I do not have a sample home matching those requirements' + (details.budget ? ' within ' + details.budget : '') + '. I can save what you are looking for, or show the other sample homes if you would like to adjust the location, bedrooms or budget.', { requestType: 'enquiry', followUps: ['Show me all homes', 'Save my enquiry'] });
    const lookingAt = matches.length === 1 ? 'Here is the sample ' + matches[0].title + ' in ' + matches[0].location + ', priced at ' + matches[0].price + '.' : 'Here are the sample homes that match your enquiry:';
    const next = !details.budget ? 'What budget range would you like to stay within?' : !details.timeline ? 'Are you looking to move soon or just exploring?' : 'Would you like to check payment options or request a viewing?';
    const chosen = matches.length === 1 ? matches[0] : undefined;
    const requirements = chosen ? { ...details, propertyType: chosen.title, location: chosen.location } : details;
    return response(lookingAt + '\n\n' + next, { properties: matches, requirements, followUps: chosen ? ['When can I see the ' + chosen.location + ' house?', 'What are the payment options?', 'Save my enquiry'] : ['Show me homes in Wuse', 'Show me homes in Jabi', 'Save my enquiry'] });
  }
  return null;
}

export function sendDemoSalesReply(reply: DemoSalesReply, send: (event: DemoStreamEvent) => void) {
  if (reply.properties?.length) send({ type: 'properties', properties: reply.properties });
  send({ type: 'text', text: reply.reply });
  send({ type: 'guidance', requirements: reply.requirements, followUps: reply.followUps, requestType: reply.requestType });
}
