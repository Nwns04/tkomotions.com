export async function financeHealth(origin, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(`${origin.replace(/\/$/, '')}/api/health`, { cache: 'no-store', signal: AbortSignal.timeout(2000) });
    if (!response.ok) return { ok: false, finance: 'unavailable' };
    const data = await response.json();
    if (data.service !== 'tko-finance' || data.database !== 'connected') return { ok: false, finance: 'unavailable' };
    return { ok: true, finance: 'available' };
  } catch { return { ok: false, finance: 'unavailable' }; }
}
