import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';

function loadModule(path, dependencies = {}, suffix = '', globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code + suffix, { exports, require: name => {
    if (!(name in dependencies)) throw new Error('Unexpected dependency: ' + name);
    return dependencies[name];
  }, console, ...globals });
  return exports;
}
const context = loadModule('../../src/sales-engine/demo-context.ts');
const flow = loadModule('../../src/sales-engine/demo-sales-flow.ts', { './demo-context': context });
const history = [
  { role: 'user', content: 'I need a three-bedroom home in Wuse' },
  { role: 'assistant', content: 'Here is the Wuse apartment. What is your budget?' },
  { role: 'user', content: 'My budget is ₦90 million and I want to move next month' },
  { role: 'assistant', content: 'The Wuse apartment is within your budget.' },
];
test('viewing questions take priority over property browsing and keep the selected home', () => {
  for (const question of ['When can I see the Wuse house?', 'Can I view the Wuse apartment?', 'When can I come round?', 'Can I come tomorrow?']) {
    const response = flow.getDemoSalesReply(question, history, undefined, new Date('2026-10-05T12:00:00Z'));
    assert.match(response.reply, /Wuse/);
    assert.match(response.reply, /Monday to Saturday/);
    assert.match(response.reply, /9:00 AM and 5:00 PM/);
    assert.equal(response.requestType, 'viewing');
    assert.equal(response.properties, undefined);
  }
});
test('Saturday requests remain pending rather than confirming a booking', () => {
  const response = flow.getDemoSalesReply('Can I come on Saturday at 10 AM?', history);
  assert.match(response.reply, /confirm availability before booking/);
  assert.equal(response.requirements.viewingTime.toLowerCase(), 'saturday at 10 am');
  assert.equal(response.requirements.timeline, 'next month');
});
test('Sunday, tomorrow on Sunday, and late visits get an honest alternative', () => {
  const sunday = flow.getDemoSalesReply('Can I come on Sunday?', history);
  assert.match(sunday.reply, /Sunday is outside/);
  const tomorrow = flow.getDemoSalesReply('Can I come tomorrow?', history, undefined, new Date('2026-10-10T12:00:00Z'));
  assert.match(tomorrow.reply, /Sunday is outside/);
  const late = flow.getDemoSalesReply('Can I come at 7 PM?', history);
  assert.match(late.reply, /outside the approved viewing hours/);
});
test('pricing follow-up retains the selected property and exact price', () => {
  const response = flow.getDemoSalesReply('How much is it?', history);
  assert.equal(response.properties.length, 1);
  assert.equal(response.properties[0].location, 'Wuse');
  assert.equal(response.properties[0].price, '₦85,000,000');
});
test('budget and bedroom qualification filter properties, without listing overpriced homes', () => {
  const fits = flow.getDemoSalesReply('I need a three-bedroom home under 90m');
  assert.equal(fits.properties.length, 1);
  assert.equal(fits.properties[0].location, 'Wuse');
  const misses = flow.getDemoSalesReply('I need a three-bedroom home under 80m');
  assert.equal(misses.properties, undefined);
  assert.match(misses.reply, /do not have a sample home matching/);
  assert.equal(misses.requestType, 'enquiry');
});
test('a location change replaces the previous location and all-homes resets filters', () => {
  const jabi = flow.getDemoSalesReply('Show me homes in Jabi', []);
  assert.equal(jabi.properties[0].location, 'Jabi');
  const all = flow.getDemoSalesReply('Show me all homes', history);
  assert.equal(all.properties.length, 4);
});
test('payment terms are qualified, and unknown amenities and addresses are not invented', () => {
  const payments = flow.getDemoSalesReply('Can I pay in installments?', history);
  assert.match(payments.reply, /selected properties/);
  assert.match(payments.reply, /need confirmation/);
  assert.equal(payments.requestType, 'payment');
  for (const question of ['Does it have a swimming pool?', 'What is the exact address?', 'What is the deposit?']) {
    const response = flow.getDemoSalesReply(question, history);
    assert.match(response.reply, /no verified|do not have verified|need confirmation/i);
    assert.match(response.reply, /enquiry/);
  }
});
test('rental requests are not answered with purchase listings', () => {
  const response = flow.getDemoSalesReply('Can I rent in Wuse?', []);
  assert.equal(response.properties, undefined);
  assert.match(response.reply, /no.*rental listings/i);
  assert.equal(response.requirements.intent, 'Rent');
});
test('a visitor who is not ready can save an enquiry without requesting an inspection', () => {
  const response = flow.getDemoSalesReply('I am just exploring, not ready yet', history);
  assert.equal(response.requestType, 'enquiry');
  assert.match(response.reply, /no viewing is booked/);
  assert.equal(response.requirements.intent, 'Exploring');
});
test('lead summary uses visitor statements, not invented budgets from assistant listings', () => {
  const details = flow.extractDemoRequirements([...history, {role:'assistant',content:'Maitama is ₦250 million'}, {role:'user',content:'Saturday at 10 AM'}]);
  assert.equal(details.location, 'Wuse');
  assert.equal(details.propertyType, '3-bedroom apartment');
  assert.equal(details.budget, '₦90,000,000');
  assert.equal(details.timeline, 'next month');
  assert.equal(details.viewingTime.toLowerCase(), 'saturday at 10 am');
});
test('guidance includes contextual next steps and a short timeframe answer continues the journey', () => {
  const reply = flow.getDemoSalesReply('Next month', history);
  assert.match(reply.reply, /payment options or request a viewing/);
  assert.ok(reply.followUps.some(value => /Wuse/.test(value)));
});
const route = loadModule('../../src/app/api/ai-sales-demo/route.ts', {
  'next/server': {}, 'next/headers': {}, 'node:crypto': {}, zod: { z },
  '@/sales-engine/demo-context': context, '@/sales-engine/demo-sales-flow': flow,
  '@/sales-engine/services/conversation-workflow': {},
}, '\nexports.staticReply = sendStaticDemoReply; exports.leadSchema = leadSchema;');
test('database fallback uses the same viewing reply and enquiry metadata', () => {
  const events = [];
  route.staticReply('When can I see the Wuse house?', event => events.push(event), history);
  assert.match(events.find(event => event.type === 'text').text, /Monday to Saturday/);
  const guidance = events.find(event => event.type === 'guidance');
  assert.equal(guidance.requestType, 'viewing');
  assert.equal(guidance.requirements.budget, '₦90,000,000');
});
test('lead API defaults to an enquiry rather than an inspection', () => {
  const parsed = route.leadSchema.parse({name:'Sample Visitor',email:'sample@example.com'});
  assert.equal(parsed.requestType, 'enquiry');
  assert.equal(parsed.inspectionRequested, false);
});
function workflow({ failAI = false, previous = [] } = {}) {
  const saved = [];
  let input;
  const models = {
    Conversation: { findOne: () => ({ sort: async () => ({_id:'conversation',status:'ACTIVE'}) }), updateOne: async () => {} },
    Message: { create: async value => saved.push(value), find: () => ({sort: () => ({limit: () => ({lean: async () => previous})})}) },
    AgentAction: { create: async () => {} },
  };
  const module = loadModule('../../src/sales-engine/services/conversation-workflow.ts', {
    '../ai': { createAIProvider: () => ({generateResponse: async value => {
      input = value;
      if (failAI) throw new Error('Simulated provider timeout');
      return {content:'Approved answer'};
    }}) },
    '../db/connection': {connectToDatabase: async () => {}}, '../db/models': models,
    '../demo-context': context, '../demo-sales-flow': flow,
    './demo-business': {ensureDemoBusiness: async () => ({_id:'business'}),getDemoKnowledge: async () => [{content:'3-bedroom apartment in Wuse. Price: ₦85,000,000.'},{content:'Inspections Monday to Saturday, 9 AM to 5 PM.'}]},
    './lead-scoring': {}, './lead-notification': {},
  });
  return {module,saved,getInput:()=>input};
}
test('workflow uses the same verified viewing flow and stores the response', async () => {
  const setup = workflow();
  const events = [];
  await setup.module.replyToDemoVisitor('visitor','When can I see the Wuse house?',event=>events.push(event),history);
  assert.equal(setup.getInput(),undefined);
  assert.match(setup.saved.at(-1).content,/Monday to Saturday/);
  assert.equal(events.at(-1).requestType,'viewing');
});
test('natural questions outside deterministic flow get full knowledge and helpful prompt', async () => {
  const setup = workflow();
  await setup.module.replyToDemoVisitor('visitor','Could you explain how this assistant works?');
  assert.match(setup.getInput().messages[0].content,/85,000,000/);
  assert.match(setup.getInput().messages[0].content,/do not repeat information/i);
});
test('provider failure remains distinct from unknown facts and provides an enquiry action', async () => {
  const setup = workflow({failAI:true});
  const events = [];
  const result = await setup.module.replyToDemoVisitor('visitor','Could you explain how this assistant works?',event=>events.push(event));
  assert.equal(result.reply,context.DEMO_SERVICE_ERROR_MESSAGE);
  assert.equal(events.at(-1).requestType,'enquiry');
});

test('changing location clears the previous home selection when no bedroom count is repeated', () => {
  const details = flow.extractDemoRequirements([...history, { role: 'user', content: 'Show me homes in Jabi' }]);
  assert.equal(details.location, 'Jabi');
  assert.match(details.propertyType, /4-bedroom/);
});

test('slow storage returns one timely viewing reply and ignores late workflow events', async () => {
  let fallback;
  let finish;
  let emit;
  const handlers = [];
  class Response {
    constructor(body) { this.body = body; this.cookies = { set() {} }; }
  }
  const slowRoute = loadModule('../../src/app/api/ai-sales-demo/route.ts', {
    'next/server': { NextResponse: Response },
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'sample-visitor' }) }) },
    'node:crypto': {}, zod: { z },
    '@/sales-engine/demo-context': context, '@/sales-engine/demo-sales-flow': flow,
    '@/sales-engine/services/conversation-workflow': { replyToDemoVisitor: (_key, _message, send) => {
      emit = send; return new Promise(resolve => { finish = resolve; });
    } },
  }, '', { TextEncoder, ReadableStream, Date, setTimeout: (callback, delay) => { fallback = callback; handlers.push(delay); return 1; }, clearTimeout() {} });
  const result = await slowRoute.POST({ headers: { get: () => null }, json: async () => ({ message: 'When can I see the Wuse house?', history }) });
  assert.equal(handlers[0], 3000);
  fallback();
  emit({ type: 'text', text: 'Late duplicate' });
  finish();
  const reader = result.body.getReader();
  let output = '';
  while (true) { const { done, value } = await reader.read(); if (done) break; output += new TextDecoder().decode(value); }
  assert.match(output, /Monday to Saturday/);
  assert.doesNotMatch(output, /Late duplicate/);
  assert.equal((output.match(/"type":"text"/g) || []).length, 1);
});

test('enquiry capture creates appointments only for viewing requests and keeps viewing time separate', async () => {
  const appointments = [];
  const savedLeads = [];
  const module = loadModule('../../src/sales-engine/services/conversation-workflow.ts', {
    '../ai': {}, '../db/connection': { connectToDatabase: async () => {} },
    '../db/models': {
      Conversation: { findOne: () => ({ sort: async () => null }), create: async () => ({ _id: 'new-conversation', save: async () => {} }) },
      Lead: { findOneAndUpdate: async (filter, update) => { savedLeads.push({ filter, update }); return { _id: 'lead', ...update.$set }; } },
      AgentAction: { create: async () => {} },
      Appointment: { findOneAndUpdate: async (_filter, update) => appointments.push(update.$setOnInsert) },
    },
    '../demo-context': context, '../demo-sales-flow': flow,
    './demo-business': { ensureDemoBusiness: async () => ({ _id: 'business' }) },
    './lead-scoring': { scoreSalesLead: () => ({ score: 35, classification: 'WARM', flags: {} }) },
    './lead-notification': { notifyQualifiedLead: async () => ({ sent: false, reason: 'Test: no outbound notifications' }) },
  });
  const details = { name: 'Sample Visitor', email: 'sample@example.com', location: 'Wuse', timeline: 'next month', viewingTime: 'Saturday at 10 AM', intent: 'Exploring' };
  await module.captureDemoLead('sample', { ...details, inspectionRequested: false });
  assert.equal(appointments.length, 0);
  assert.equal(savedLeads[0].filter.conversationId, 'new-conversation');
  await module.captureDemoLead('sample', { ...details, inspectionRequested: true });
  assert.equal(appointments[0].status, 'REQUESTED');
  assert.equal(appointments[0].scheduledFor, 'Saturday at 10 AM');
  assert.equal(savedLeads[1].update.$set.timeline, 'next month');
});
