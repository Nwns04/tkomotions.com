const demoLeadStore = [];

const LEAD_WEIGHTS = {
  buyingIntent: 25,
  budgetProvided: 20,
  locationSpecified: 20,
  timelineProvided: 20,
  contactInformation: 15,
};

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'APPOINTMENT', 'WON', 'LOST'];

export function scoreLead(input = {}) {
  const flags = {
    buyingIntent: Boolean(input.buyingIntent),
    budgetProvided: Boolean(input.budgetProvided),
    locationSpecified: Boolean(input.locationSpecified),
    timelineProvided: Boolean(input.timelineProvided || input.inspectionRequested),
    contactInformation: Boolean(input.contactInformation),
  };

  const score = Math.min(100, Object.entries(flags).reduce((total, [key, active]) => {
    return total + (active ? LEAD_WEIGHTS[key] : 0);
  }, 0));

  let classification = 'COLD';
  if (score >= 80) classification = 'HOT';
  else if (score >= 50) classification = 'WARM';

  return {
    score,
    classification,
    status: 'NEW',
    flags,
  };
}

export function listDemoLeads() {
  return JSON.parse(JSON.stringify(demoLeadStore)).sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
}

export function createDemoLead(payload = {}) {
  const normalized = {
    name: payload.name || 'Unknown lead',
    phone: payload.phone || '',
    email: payload.email || '',
    source: payload.source || 'Website',
    propertyType: payload.propertyType || '',
    location: payload.location || '',
    budget: payload.budget || '',
    intent: payload.intent || 'Buy',
    inspectionRequested: Boolean(payload.inspectionRequested),
    requirements: payload.requirements || '',
    interest: payload.propertyType && payload.location ? `${payload.propertyType} / ${payload.location}` : (payload.propertyType || payload.location || 'General enquiry'),
  };

  const scored = scoreLead({
    buyingIntent: Boolean(payload.intent && payload.intent.toLowerCase() === 'buy'),
    budgetProvided: Boolean(payload.budget),
    locationSpecified: Boolean(payload.location),
    timelineProvided: Boolean(payload.timeline || payload.inspectionRequested),
    contactInformation: Boolean(payload.name && (payload.phone || payload.email)),
    inspectionRequested: Boolean(payload.inspectionRequested),
  });

  const lead = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...normalized,
    score: scored.score,
    classification: scored.classification,
    status: scored.status,
    source: normalized.source,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  demoLeadStore.unshift(lead);
  return lead;
}

export function getLeadById(id) {
  return demoLeadStore.find((lead) => lead.id === id) || null;
}

export function updateLeadStatus(id, nextStatus) {
  const target = getLeadById(id);
  if (!target) return null;
  target.status = LEAD_STATUSES.includes(nextStatus) ? nextStatus : 'NEW';
  target.updatedAt = new Date().toISOString();
  return target;
}
