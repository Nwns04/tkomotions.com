import { NextResponse } from 'next/server';

export const revalidate = 43200;

export async function GET() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/NGN', {
      next: { revalidate },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Exchange rates are temporarily unavailable.' }, { status: 503 });
    }

    const data = await response.json();
    if (data.result !== 'success' || !data.rates || !data.time_last_update_utc) {
      return NextResponse.json({ error: 'Exchange rates are temporarily unavailable.' }, { status: 503 });
    }

    return NextResponse.json(
      { rates: data.rates, updatedAt: data.time_last_update_utc },
      { headers: { 'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400' } },
    );
  } catch {
    return NextResponse.json({ error: 'Exchange rates are temporarily unavailable.' }, { status: 503 });
  }
}