// Match the server's maximum contacts per scheduling request.
export const OUTREACH_SCHEDULE_LIMIT = 500;
export const eligibleForScheduling = lead => lead.scheduling?.eligible === true;
export const schedulingBatch = leads => leads.filter(eligibleForScheduling).slice(0, OUTREACH_SCHEDULE_LIMIT);
