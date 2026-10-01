import test from 'node:test';
import assert from 'node:assert/strict';
import { AIProviderError } from './errors.js';
import { createProviderManager } from './provider.js';

const validQuotation = {
  serviceCategory: 'Motion Design',
  detectedPackage: 'Launch Film',
  title: 'Product launch motion package',
  summary: 'A concise launch film and cutdowns.',
  currency: 'NGN',
  lineItems: [{ description: 'Launch film', quantity: 1, unitPrice: 25000000, catalogPublicId: '' }],
  includedFeatures: ['One master film'],
  excludedFeatures: ['Media spend'],
  assumptions: ['Client supplies approved copy'],
  optionalAdditions: ['Additional cutdowns'],
  internalWarnings: [],
  suggestedPaymentTerms: '70% upfront, 30% before final delivery.',
  formalQuotationCopy: 'TKO Motions proposes a product launch motion package.',
  whatsAppCopy: 'Hi! Here is the proposed launch package.',
};

function provider(name, generate, configured = true) {
  return { name, model: `${name}-test-model`, configured, generate, health: async () => ({ configured }) };
}

test('uses the primary provider when its structured response is valid', async () => {
  let fallbackCalls = 0;
  const manager = createProviderManager({
    providers: {
      gemini: provider('gemini', async () => ({ data: validQuotation, usage: { inputTokens: 20, outputTokens: 40 } })),
      groq: provider('groq', async () => { fallbackCalls += 1; return { data: validQuotation }; }),
    },
    primary: 'gemini',
    fallback: 'groq',
    maxRetries: 0,
  });

  const result = await manager.generateQuotation({ requirements: 'Launch video' });
  assert.equal(result.mode, 'ai');
  assert.equal(result.provider, 'gemini');
  assert.equal(result.fallbackUsed, false);
  assert.equal(fallbackCalls, 0);
});

test('falls back when the primary returns malformed structured output', async () => {
  const logs = [];
  const manager = createProviderManager({
    providers: {
      gemini: provider('gemini', async () => ({ data: { title: 'Incomplete' } })),
      groq: provider('groq', async () => ({ data: validQuotation })),
    },
    primary: 'gemini',
    fallback: 'groq',
    maxRetries: 0,
    logUsage: async (entry) => logs.push(entry),
  });

  const result = await manager.generateQuotation({ requirements: 'Launch video' });
  assert.equal(result.provider, 'groq');
  assert.equal(result.fallbackUsed, true);
  assert.equal(logs[0].errorCategory, 'schema_validation');
  assert.equal(logs[1].success, true);
});

test('falls back for rate limits, timeouts, unavailable models, and missing keys', async (t) => {
  const cases = [
    ['rate_limited', true, true],
    ['timeout', true, true],
    ['model_unavailable', false, true],
    ['not_configured', false, false],
  ];

  for (const [category, transient, configured] of cases) {
    await t.test(category, async () => {
      const manager = createProviderManager({
        providers: {
          gemini: provider('gemini', async () => {
            throw new AIProviderError('Primary failed.', { provider: 'gemini', category, transient });
          }, configured),
          groq: provider('groq', async () => ({ data: validQuotation })),
        },
        primary: 'gemini',
        fallback: 'groq',
        maxRetries: 0,
      });

      const result = await manager.generateQuotation({ requirements: 'Launch video' });
      assert.equal(result.mode, 'ai');
      assert.equal(result.provider, 'groq');
      assert.equal(result.fallbackUsed, true);
    });
  }
});

test('returns manual mode without losing the request when both providers fail', async () => {
  const request = { requirements: 'Three social cutdowns', currency: 'NGN' };
  const failing = (name) => provider(name, async () => {
    throw new AIProviderError('Unavailable.', { provider: name, category: 'unavailable', transient: true });
  });
  const manager = createProviderManager({
    providers: { gemini: failing('gemini'), groq: failing('groq') },
    primary: 'gemini',
    fallback: 'groq',
    maxRetries: 0,
  });

  const result = await manager.generateQuotation(request);
  assert.equal(result.mode, 'manual');
  assert.match(result.message, /continue creating this quotation manually/i);
  assert.deepEqual(result.failures, [
    { provider: 'gemini', category: 'unavailable' },
    { provider: 'groq', category: 'unavailable' },
  ]);
  assert.deepEqual(request, { requirements: 'Three social cutdowns', currency: 'NGN' });
});
