import { NextResponse } from 'next/server';

const financeOrigin = process.env.FINANCE_API_ORIGIN || `http://127.0.0.1:${process.env.FINANCE_PORT || 4000}`;

export async function requireStaff(request: Request) {
  const response = await fetch(`${financeOrigin}/api/finance/auth/session`, {
    headers: { cookie: request.headers.get('cookie') || '' },
    cache: 'no-store',
  }).catch(() => null);
  const data = response ? await response.json().catch(() => null) : null;
  if (!response?.ok || !data?.authenticated) return null;
  return data.user as { publicId: string; email: string; name: string };
}

export function staffRequired() {
  return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
}
