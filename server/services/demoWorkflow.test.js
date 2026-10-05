import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoAppointment, createDemoFollowUp, listDemoAppointments, listDemoFollowUps } from './demoWorkflow.js';

test('creates an appointment tied to a lead with the expected status', () => {
  const appointment = createDemoAppointment({
    leadId: 'lead-123',
    leadName: 'John Doe',
    scheduledFor: '2026-10-08T10:00:00.000Z',
    notes: 'Property inspection for Wuse 3-bedroom apartment.',
  });

  assert.equal(appointment.leadId, 'lead-123');
  assert.equal(appointment.status, 'SCHEDULED');
  assert.equal(appointment.customer, 'John Doe');
  assert.equal(listDemoAppointments().length > 0, true);
});

test('creates a follow-up with a pending status and a reason', () => {
  const followUp = createDemoFollowUp({
    leadId: 'lead-456',
    leadName: 'Jane Doe',
    scheduledFor: '2026-10-09T12:00:00.000Z',
    reason: 'Send additional pricing and payment options.',
  });

  assert.equal(followUp.leadId, 'lead-456');
  assert.equal(followUp.status, 'PENDING');
  assert.equal(followUp.reason, 'Send additional pricing and payment options.');
  assert.equal(listDemoFollowUps().length > 0, true);
});
