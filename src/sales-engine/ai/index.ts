import { readSalesEngineConfig, type SalesEngineConfig } from '../config';
import { createGroqProvider } from './providers/groq';
import { createOpenAIProvider } from './providers/openai';
import type { AIProvider } from './types';

export function createAIProvider(config: SalesEngineConfig = readSalesEngineConfig()): AIProvider {
  const options = {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    timeoutMs: config.timeoutMs,
  };
  if (config.provider === 'openai') return createOpenAIProvider(options);
  return createGroqProvider(options);
}

export type { AIInput, AIMessage, AIProvider, AIResponse, AITool, AIToolCall, AIToolResponse } from './types';
