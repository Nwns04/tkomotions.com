export class AIProviderError extends Error {
  constructor(message, { provider, category = 'provider_error', transient = false, retryAfterMs = 0, status = 0 } = {}) {
    super(message);
    this.name = 'AIProviderError';
    this.provider = provider;
    this.category = category;
    this.transient = transient;
    this.retryAfterMs = retryAfterMs;
    this.status = status;
  }
}

export function classifyHttpError(provider, status, headers, body) {
  const retryAfterSeconds = Number(headers?.get?.('retry-after') || 0);
  const retryAfterMs = Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : 0;
  if (status === 429) return new AIProviderError('Provider rate limit reached.', { provider, category: 'rate_limited', transient: true, retryAfterMs, status });
  if (status === 408) return new AIProviderError('Provider request timed out.', { provider, category: 'timeout', transient: true, status });
  if ([500, 502, 503, 504].includes(status)) return new AIProviderError('Provider is temporarily unavailable.', { provider, category: 'unavailable', transient: true, status });
  if (status === 404) return new AIProviderError('Configured model is unavailable.', { provider, category: 'model_unavailable', status });
  if (status === 401) return new AIProviderError('Provider credentials were rejected.', { provider, category: 'authentication', status });
  if (status === 403) return new AIProviderError('Provider or model access is not permitted.', { provider, category: 'permission', status });
  return new AIProviderError(`Provider rejected the request${body?.error?.message ? `: ${body.error.message}` : '.'}`, { provider, category: status === 400 ? 'invalid_request' : 'provider_error', status });
}
