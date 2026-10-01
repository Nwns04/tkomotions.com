import { quotationAIJsonSchema } from './schema.js';
import { AIProviderError, classifyHttpError } from './errors.js';

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

export function createGroqProvider({ apiKey, model, timeoutMs, fetchImpl = fetch }) {
  const name = 'groq';
  const configured = Boolean(apiKey);

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(url, { ...options, signal: controller.signal });
    } catch (error) {
      if (error.name === 'AbortError') throw new AIProviderError('Groq request timed out.', { provider: name, category: 'timeout', transient: true });
      throw new AIProviderError('Groq network request failed.', { provider: name, category: 'network', transient: true });
    } finally { clearTimeout(timer); }
  }

  return {
    name,
    model,
    configured,
    async generate({ prompt }) {
      if (!configured) throw new AIProviderError('Groq is not configured.', { provider: name, category: 'not_configured' });
      const response = await request('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a structured quotation assistant for TKO Motions. Follow the supplied business constraints exactly.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          reasoning_effort: 'medium',
          response_format: { type: 'json_schema', json_schema: { name: 'tko_quotation', strict: true, schema: quotationAIJsonSchema } },
        }),
      });
      const body = await readJson(response);
      if (!response.ok) throw classifyHttpError(name, response.status, response.headers, body);
      const text = body.choices?.[0]?.message?.content || '';
      if (!text) throw new AIProviderError('Groq returned an empty response.', { provider: name, category: 'malformed_response', transient: true });
      let data;
      try { data = JSON.parse(text); } catch { throw new AIProviderError('Groq returned malformed JSON.', { provider: name, category: 'malformed_response', transient: true }); }
      return { data, usage: { inputTokens: body.usage?.prompt_tokens ?? null, outputTokens: body.usage?.completion_tokens ?? null } };
    },
    async health() {
      if (!configured) return { status: 'Not Configured', model };
      try {
        const response = await request(`https://api.groq.com/openai/v1/models/${encodeURIComponent(model)}`, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (response.ok) return { status: 'Connected', model };
        if (response.status === 429) return { status: 'Rate Limited', model };
        return { status: 'Unavailable', model };
      } catch { return { status: 'Unavailable', model }; }
    },
  };
}
