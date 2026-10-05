import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreLead, createDemoLead, listDemoLeads } from './demoLead.js';

test('scores a high-intent buyer as hot and returns a valid lead summary', () => {
  const result = scoreLead({
    buyingIntent: true,
    budgetProvided: true,
    locationSpecified: true,
    timelineProvided: true,
    contactInformation: true,
  });

  assert.equal(result.score, 100);
  assert.equal(result.classification, 'HOT');
  assert.equal(result.status, 'NEW');
});

test('creates a lead record with the expected source and property details', () => {
  const lead = createDemoLead({
    name: 'John Doe',
    phone: '+2348000000000',
    email: 'john@example.com',
    source: 'Website',
    propertyType: '3-bedroom apartment',
    location: 'Wuse',
    budget: '₦90m',
    intent: 'Buy',
    inspectionRequested: true,
    requirements: 'Looking for a 3-bedroom apartment in Wuse around ₦90m.',
  });

  assert.equal(lead.name, 'John Doe');
  assert.equal(lead.status, 'NEW');
  assert.equal(lead.score, 100);
  assert.equal(lead.source, 'Website');
  assert.equal(lead.requirements, 'Looking for a 3-bedroom apartment in Wuse around ₦90m.');
  assert.equal(lead.interest, '3-bedroom apartment / Wuse');
  assert.equal(listDemoLeads().length > 0, true);
});
