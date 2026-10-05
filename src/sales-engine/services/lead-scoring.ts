export type LeadScoreInput = {
  intent?: string;
  budget?: string;
  location?: string;
  timeline?: string;
  inspectionRequested?: boolean;
  name?: string;
  phone?: string;
  email?: string;
};

export function scoreSalesLead(input: LeadScoreInput) {
  const flags = {
    buyingIntent: input.intent?.toLowerCase() === 'buy',
    budgetProvided: Boolean(input.budget?.trim()),
    locationSpecified: Boolean(input.location?.trim()),
    timelineProvided: Boolean(input.timeline?.trim() || input.inspectionRequested),
    contactInformation: Boolean(input.name?.trim() && (input.phone?.trim() || input.email?.trim())),
  };
  const score = (flags.buyingIntent ? 25 : 0)
    + (flags.budgetProvided ? 20 : 0)
    + (flags.locationSpecified ? 20 : 0)
    + (flags.timelineProvided ? 20 : 0)
    + (flags.contactInformation ? 15 : 0);

  return {
    score,
    classification: score >= 80 ? 'HOT' : score >= 50 ? 'WARM' : 'COLD',
    flags,
  } as const;
}
