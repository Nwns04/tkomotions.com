import { quotationAIJsonSchema } from './schema.js';
import { AIProviderError, classifyHttpError } from './errors.js';

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

export function createGeminiProvider({ apiKey, model, timeoutMs, fetchImpl = fetch }) {
  const name = 'gemini';
  const configured = Boolean(apiKey);

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(url, { ...options, signal: controller.signal });
    } catch (error) {
      if (error.name === 'AbortError') throw new AIProviderError('Gemini request timed out.', { provider: name, category: 'timeout', transient: true });
      throw new AIProviderError('Gemini network request failed.', { provider: name, category: 'network', transient: true });
    } finally { clearTimeout(timer); }
  }

  return {
    name,
    model,
    configured,
    async generate({ prompt }) {
      if (!configured) throw new AIProviderError('Gemini is not configured.', { provider: name, category: 'not_configured' });
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await request(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseJsonSchema: quotationAIJsonSchema,
            temperature: 0.2,
          },
        }),
      });
      const body = await readJson(response);
      if (!response.ok) throw classifyHttpError(name, response.status, response.headers, body);
      const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
      if (!text) throw new AIProviderError('Gemini returned an empty response.', { provider: name, category: 'malformed_response', transient: true });
      let data;
      try { data = JSON.parse(text); } catch { throw new AIProviderError('Gemini returned malformed JSON.', { provider: name, category: 'malformed_response', transient: true }); }
      return { data, usage: { inputTokens: body.usageMetadata?.promptTokenCount ?? null, outputTokens: body.usageMetadata?.candidatesTokenCount ?? null } };
    },
    async health() {
      if (!configured) return { status: 'Not Configured', model };
      try {
        const response = await request(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}?key=${encodeURIComponent(apiKey)}`);
        if (response.ok) return { status: 'Connected', model };
        if (response.status === 429) return { status: 'Rate Limited', model };
        return { status: 'Unavailable', model };
      } catch { return { status: 'Unavailable', model }; }
    },
  };
}
