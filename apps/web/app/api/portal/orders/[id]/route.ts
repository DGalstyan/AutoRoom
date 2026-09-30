import type { NextRequest } from 'next/server';
import { proxyPortalRequest } from '@/lib/portal/proxy';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPortalRequest(request, 'GET', `/portal/orders/${id}`);
}
