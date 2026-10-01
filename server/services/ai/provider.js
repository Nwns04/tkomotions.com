import { quotationAIResultSchema } from './schema.js';
import { AIProviderError } from './errors.js';
import { buildQuotationPrompt } from './prompt.js';

const manualMessage = 'AI generation is temporarily unavailable. You can continue creating this quotation manually.';
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export function createProviderManager({ providers, primary, fallback, maxRetries = 1, logUsage = async () => {} }) {
  const providerOrder = [...new Set([primary, fallback])].map((name) => providers[name]).filter(Boolean);

  async function record(entry) {
    try { await logUsage(entry); } catch (error) { console.error('Could not write AI usage log:', error.message); }
  }

  async function run(operation, input, context = {}) {
    const prompt = buildQuotationPrompt(operation, input);
    const failures = [];

    for (let providerIndex = 0; providerIndex < providerOrder.length; providerIndex += 1) {
      const provider = providerOrder[providerIndex];
      const fallbackUsed = providerIndex > 0;
      const attempts = provider.configured ? maxRetries + 1 : 1;

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const startedAt = Date.now();
        try {
          const response = await provider.generate({ prompt, operation });
          const validated = quotationAIResultSchema.safeParse(response.data);
          if (!validated.success) {
            throw new AIProviderError('Provider output failed application validation.', {
              provider: provider.name,
              category: 'schema_validation',
              transient: true,
            });
          }
          await record({
            owner: context.ownerId,
            provider: provider.name,
            model: provider.model,
            requestType: operation,
            success: true,
            latencyMs: Date.now() - startedAt,
            fallbackUsed,
            inputTokens: response.usage?.inputTokens ?? null,
            outputTokens: response.usage?.outputTokens ?? null,
          });
          return { mode: 'ai', data: validated.data, provider: provider.name, model: provider.model, fallbackUsed };
        } catch (error) {
          const normalized = error instanceof AIProviderError
            ? error
            : new AIProviderError('Unexpected provider failure.', { provider: provider.name, category: 'provider_error', transient: true });
          failures.push({ provider: provider.name, category: normalized.category });
          await record({
            owner: context.ownerId,
            provider: provider.name,
            model: provider.model,
            requestType: operation,
            success: false,
            latencyMs: Date.now() - startedAt,
            errorCategory: normalized.category,
            fallbackUsed,
          });

          const shouldRetry = normalized.transient && attempt < attempts - 1;
          if (!shouldRetry) break;
          const backoff = normalized.retryAfterMs || 500 * (2 ** attempt);
          if (backoff > 5_000) break;
          await delay(backoff);
        }
      }
    }

    return { mode: 'manual', message: manualMessage, failures };
  }

  return {
    generateQuotation: (input, context) => run('generateQuotation', input, context),
    reviseQuotation: (input, context) => run('reviseQuotation', input, context),
    generateFormalCopy: (input, context) => run('generateFormalCopy', input, context),
    generateWhatsAppCopy: (input, context) => run('generateWhatsAppCopy', input, context),
    recommendPricing: (input, context) => run('recommendPricing', input, context),
    async checkProviderHealth() {
      return Promise.all(providerOrder.map(async (provider) => ({ provider: provider.name, ...(await provider.health()) })));
    },
  };
}

export { manualMessage };
