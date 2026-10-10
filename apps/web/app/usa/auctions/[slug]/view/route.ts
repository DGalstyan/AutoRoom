import { NextResponse, type NextRequest } from 'next/server';
import { apiBase } from '@/lib/env';

/**
 * «Տեսնել մեքենան օնլայն» — asks the API for a short-lived guest access token for this car and
 * sends the visitor to the access page with it. The auction View-Only link never reaches the
 * browser until that token is exchanged, and the token stops working after the admin-set time.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = apiBase();

  try {
    const res = await fetch(`${base}/public/cars/${encodeURIComponent(slug)}/guest-access`, {
      method: 'POST',
      cache: 'no-store',
    });
    if (res.ok) {
      const { token } = (await res.json()) as { token: string };
      return NextResponse.redirect(new URL(`/usa/auctions/access/${token}`, request.url));
    }
  } catch {
    // fall through to the car page
  }
  return NextResponse.redirect(new URL(`/usa/auctions/${encodeURIComponent(slug)}`, request.url));
}
