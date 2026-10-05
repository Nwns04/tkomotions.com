import type { AIInput, AIProvider, AIResponse, AITool, AIToolCall } from './types';

type CompatibleOptions = {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
};

type ChatCompletion = {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }>;
    };
  }>;
  error?: { message?: string };
};

export class AIProviderError extends Error {
  readonly provider: string;
  readonly status?: number;

  constructor(message: string, provider: string, status?: number) {
    super(message);
    this.name = 'AIProviderError';
    this.provider = provider;
    this.status = status;
  }
}

function parseArguments(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function createOpenAICompatibleProvider(options: CompatibleOptions): AIProvider {
  const fetchImpl = options.fetchImpl ?? fetch;

  function requestBody(input: AIInput, tools?: AITool[], stream = false) {
    return {
      model: options.model,
      temperature: input.temperature ?? 0.2,
      stream,
      messages: input.messages.map((message) => ({ role: message.role, content: message.content })),
      ...(tools?.length
        ? {
            tools: tools.map((tool) => ({
              type: 'function',
              function: { name: tool.name, description: tool.description, parameters: tool.parameters },
            })),
            tool_choice: 'auto',
          }
        : {}),
    };
  }

  async function complete(input: AIInput, tools?: AITool[]): Promise<AIResponse> {
    if (!options.apiKey) {
      throw new AIProviderError(`${options.name} is not configured.`, options.name);
    }
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await fetchImpl(`${options.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody(input, tools)),
      });
      const body = (await response.json().catch(() => ({}))) as ChatCompletion;
      if (!response.ok) {
        throw new AIProviderError(body.error?.message || `${options.name} request failed.`, options.name, response.status);
      }
      const message = body.choices?.[0]?.message;
      const toolCalls: AIToolCall[] = (message?.tool_calls ?? []).map((call, index) => ({
        id: call.id || `${options.name}-tool-${index}`,
        name: call.function?.name || '',
        arguments: parseArguments(call.function?.arguments),
      }));
      console.info(`[sales-engine] ai ${options.name} ${response.status} ${Date.now() - started}ms model=${options.model}`);
      return {
        provider: options.name,
        model: options.model,
        content: message?.content || '',
        toolCalls,
      };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      const timedOut = error instanceof Error && error.name === 'AbortError';
      throw new AIProviderError(timedOut ? `${options.name} request timed out.` : `${options.name} request failed.`, options.name);
    } finally {
      clearTimeout(timer);
    }
  }

  async function stream(input: AIInput, onToken: (token: string) => void): Promise<AIResponse> {
    if (!options.apiKey) {
      throw new AIProviderError(`${options.name} is not configured.`, options.name);
    }

    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await fetchImpl(`${options.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(requestBody(input, undefined, true)),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ChatCompletion;
        throw new AIProviderError(body.error?.message || `${options.name} request failed.`, options.name, response.status);
      }
      if (!response.body) throw new AIProviderError(`${options.name} returned no response stream.`, options.name);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      let content = '';
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        pending += decoder.decode(value, { stream: !done });
        const events = pending.split(/\r?\n\r?\n/);
        pending = events.pop() || '';

        for (const event of events) {
          for (const line of event.split(/\r?\n/)) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              finished = true;
              break;
            }
            try {
              const chunk = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string | null } }> };
              const token = chunk.choices?.[0]?.delta?.content;
              if (token) {
                content += token;
                onToken(token);
              }
            } catch (error) {
              if (error instanceof SyntaxError) continue;
              throw error;
            }
          }
          if (finished) break;
        }

        if (done) break;
      }

      console.info(`[sales-engine] ai ${options.name} streamed ${Date.now() - started}ms model=${options.model}`);
      return { provider: options.name, model: options.model, content, toolCalls: [] };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      const timedOut = error instanceof Error && error.name === 'AbortError';
      throw new AIProviderError(timedOut ? `${options.name} request timed out.` : `${options.name} request failed.`, options.name);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    name: options.name,
    generateResponse: (input) => complete(input),
    generateResponseStream: (input, onToken) => stream(input, onToken),
    generateWithTools: (input, tools) => complete(input, tools),
  };
}
