import { createOpenAICompatibleProvider } from '../openai-compatible';
import type { AIProvider } from '../types';

export function createGroqProvider(options: { apiKey: string; baseUrl: string; model: string; timeoutMs: number; fetchImpl?: typeof fetch }): AIProvider {
  return createOpenAICompatibleProvider({ name: 'groq', ...options });
}
