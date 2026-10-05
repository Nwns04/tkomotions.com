export type SalesEngineConfig = {
  provider: 'groq' | 'openai';
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
};

const DEFAULTS = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-20b' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' },
} as const;

export function readSalesEngineConfig(env: NodeJS.ProcessEnv = process.env): SalesEngineConfig {
  const requested = (env.AI_PROVIDER || 'groq').toLowerCase();
  if (requested !== 'groq' && requested !== 'openai') {
    throw new Error(`Unsupported AI_PROVIDER "${requested}". Use groq or openai.`);
  }
  const provider = requested;
  const apiKey = env.AI_API_KEY || (provider === 'groq' ? env.GROQ_API_KEY : env.OPENAI_API_KEY) || '';
  const model = env.AI_MODEL || (provider === 'groq' ? env.GROQ_MODEL : '') || DEFAULTS[provider].model;
  const baseUrl = (env.AI_BASE_URL || DEFAULTS[provider].baseUrl).replace(/\/$/, '');
  const timeoutMs = Number(env.AI_TIMEOUT_MS || 20000);
  return { provider, apiKey, baseUrl, model, timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 20000 };
}
