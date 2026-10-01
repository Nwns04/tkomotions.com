import { env } from '../../config/env.js';
import { AIUsageLog } from '../../models/AIUsageLog.js';
import { createGeminiProvider } from './gemini.js';
import { createGroqProvider } from './groq.js';
import { createProviderManager } from './provider.js';

const providers = {
  gemini: createGeminiProvider({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL, timeoutMs: env.AI_REQUEST_TIMEOUT_MS }),
  groq: createGroqProvider({ apiKey: env.GROQ_API_KEY, model: env.GROQ_MODEL, timeoutMs: env.AI_REQUEST_TIMEOUT_MS }),
};

async function logUsage(entry) {
  if (!entry.owner) return;
  await AIUsageLog.create(entry);
}

export const aiProvider = createProviderManager({
  providers,
  primary: env.AI_PRIMARY_PROVIDER,
  fallback: env.AI_FALLBACK_PROVIDER,
  maxRetries: env.AI_MAX_RETRIES_PER_PROVIDER,
  logUsage,
});

export const aiConfiguration = {
  primary: env.AI_PRIMARY_PROVIDER,
  fallback: env.AI_FALLBACK_PROVIDER,
  providers: {
    gemini: { configured: providers.gemini.configured, model: providers.gemini.model },
    groq: { configured: providers.groq.configured, model: providers.groq.model },
  },
};
