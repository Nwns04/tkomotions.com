const demoAppointments = [];
const demoFollowUps = [];

export function listDemoAppointments() {
  return JSON.parse(JSON.stringify(demoAppointments)).sort((first, second) => new Date(first.scheduledFor) - new Date(second.scheduledFor));
}

export function listDemoFollowUps() {
  return JSON.parse(JSON.stringify(demoFollowUps)).sort((first, second) => new Date(first.scheduledFor) - new Date(second.scheduledFor));
}

export function createDemoAppointment(payload = {}) {
  const appointment = {
    id: payload.id || `appointment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    leadId: payload.leadId || 'unknown-lead',
    customer: payload.leadName || 'Customer',
    scheduledFor: payload.scheduledFor || new Date(Date.now() + 86400000).toISOString(),
    status: payload.status || 'SCHEDULED',
    notes: payload.notes || 'Inspection requested by customer.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  demoAppointments.unshift(appointment);
  return appointment;
}

export function createDemoFollowUp(payload = {}) {
  const followUp = {
    id: payload.id || `followup-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    leadId: payload.leadId || 'unknown-lead',
    customer: payload.leadName || 'Customer',
    scheduledFor: payload.scheduledFor || new Date(Date.now() + 86400000).toISOString(),
    status: payload.status || 'PENDING',
    reason: payload.reason || 'Follow up with the customer to confirm next steps.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  demoFollowUps.unshift(followUp);
  return followUp;
}

export function getDemoAppointmentByLeadId(leadId) {
  return demoAppointments.find((entry) => entry.leadId === leadId) || null;
}

export function getDemoFollowUpByLeadId(leadId) {
  return demoFollowUps.find((entry) => entry.leadId === leadId) || null;
}
