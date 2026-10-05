import { financeHealth } from '~/server/services/financeHealth.js';

export const dynamic = 'force-dynamic';
export async function GET() {
  const origin = process.env.FINANCE_API_ORIGIN || `http://127.0.0.1:${process.env.FINANCE_PORT || 4000}`;
  const health = await financeHealth(origin);
  return Response.json({ ...health, service: 'tkomotions-web' }, { status: health.ok ? 200 : 503 });
}
