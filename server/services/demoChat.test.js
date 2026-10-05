import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';

function loadModule(path, dependencies = {}, suffix = "") {
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code + suffix, { exports, require: (name) => {
    if (!(name in dependencies)) throw new Error('Unexpected dependency: ' + name);
    return dependencies[name];
  }, console });
  return exports;
}
const context = loadModule('../../src/sales-engine/demo-context.ts');
test('follow-up pricing retains location and explicit searches replace it', () => {
  const history = [{ role: 'user', content: 'Show me homes in Wuse' }];
  assert.equal(context.resolveDemoQuery('How much is it?', history), 'How much is it? in wuse');
  assert.equal(context.resolveDemoQuery('Show me homes in Jabi', history), 'Show me homes in Jabi');
  assert.equal(context.resolveDemoQuery('Show me all homes', history), 'Show me all homes');
  assert.equal(context.resolveDemoQuery('Show me Gwarimpa homes', history), 'Show me Gwarinpa homes');
});
test('ambiguous property references do not pick an arbitrary location', () => {
  assert.equal(context.resolveDemoQuery('How much is it?', [{ role: 'assistant', content: 'Homes in Wuse and Jabi' }]), 'How much is it?');
});
function workflow({ current, previous = [], failAI = false }) {
  const saved = [];
  const conversation = { _id: 'conversation', status: 'ACTIVE' };
  const knowledge = [
    { content: '3-bedroom apartment. Location: Wuse. Price: ₦85,000,000.' },
    { content: '4-bedroom terrace. Location: Jabi. Price: ₦95,000,000.' },
    { content: 'Inspections are Monday to Saturday, 9:00 AM to 5:00 PM.' },
  ];
  let input;
  const models = {
    Conversation: { findOne: () => ({ sort: async () => conversation }), updateOne: async () => {} },
    Message: { create: async (value) => saved.push(value), find: () => ({
      sort: () => ({ limit: () => ({ lean: async () => [{ role: 'customer', content: current }, ...previous] }) }),
    }) },
    AgentAction: { create: async () => {} },
  };
  const module = loadModule('../../src/sales-engine/services/conversation-workflow.ts', {
    '../ai': { createAIProvider: () => ({ generateResponse: async (value) => {
      input = value;
      if (failAI) throw new Error('Simulated provider timeout');
      return { content: 'Approved answer' };
    } }) },
    '../db/connection': { connectToDatabase: async () => {} },
    '../db/models': models,
    '../demo-engine': { DEMO_FALLBACK_MESSAGE: 'Unknown information' },
    '../demo-context': context,
    './demo-business': {
      ensureDemoBusiness: async () => ({ _id: 'business' }),
      getDemoKnowledge: async () => knowledge,
      listDemoProperties: async () => knowledge.slice(0, 2),
      searchDemoKnowledge: async () => [],
      findDemoKnowledge: async () => knowledge.slice(2),
    },
    './lead-scoring': {}, './lead-notification': {},
  });
  return { module, saved, getInput: () => input };
}
test('pricing follow-up returns the previously discussed home without an AI call', async () => {
  const setup = workflow({ current: 'How much is it?', previous: [{ role: 'customer', content: 'Show me homes in Wuse' }] });
  const events = [];
  await setup.module.replyToDemoVisitor('visitor', 'How much is it?', (event) => events.push(event));
  const properties = events.find((event) => event.type === 'properties').properties;
  assert.equal(properties.length, 1);
  assert.equal(properties[0].location, 'Wuse');
  assert.equal(properties[0].price, '₦85,000,000.');
  assert.equal(setup.getInput(), undefined);
});
test('natural questions receive the full approved knowledge even when keywords miss', async () => {
  const setup = workflow({ current: 'When can I come round?' });
  await setup.module.replyToDemoVisitor('visitor', 'When can I come round?');
  assert.match(setup.getInput().messages[0].content, /Monday to Saturday/);
  assert.match(setup.getInput().messages[0].content, /85,000,000/);
});
test('provider failure produces a service error rather than missing information', async () => {
  const setup = workflow({ current: 'Hello', failAI: true });
  const events = [];
  const result = await setup.module.replyToDemoVisitor('visitor', 'Hello', (event) => events.push(event));
  assert.equal(result.reply, context.DEMO_SERVICE_ERROR_MESSAGE);
  assert.equal(events[0].text, context.DEMO_SERVICE_ERROR_MESSAGE);
  assert.equal(setup.saved.at(-1).content, context.DEMO_SERVICE_ERROR_MESSAGE);
});

const route = loadModule('../../src/app/api/ai-sales-demo/route.ts', {
  'next/server': {}, 'next/headers': {}, 'node:crypto': {}, zod: { z },
  '@/sales-engine/demo-context': context,
  '@/sales-engine/services/conversation-workflow': {},
}, '\nexports.staticReply = sendStaticDemoReply;');
test('offline fallback returns correct property, follow-up price, viewing times and greeting', () => {
  const reply = (message, history = []) => {
    const events = [];
    route.staticReply(message, event => events.push(event), history);
    return events;
  };
  const wuse = reply('Show me homes in Wuse');
  assert.equal(wuse[0].properties[0].price, '₦85,000,000');
  const followUp = reply('How much is it?', [{role:'user',content:'Show me homes in Wuse'}]);
  assert.equal(followUp[0].properties[0].location, 'Wuse');
  const jabi = reply('What are the prices in Jabi?');
  assert.equal(jabi[0].properties[0].price, '₦95,000,000');
  assert.match(reply('What are the viewing times?')[0].text, /Monday to Saturday, 9:00 AM to 5:00 PM/);
  assert.match(reply('Hello')[0].text, /Hello!/);
  assert.equal(reply('When can I come round?')[0].text, context.DEMO_SERVICE_ERROR_MESSAGE);
});
