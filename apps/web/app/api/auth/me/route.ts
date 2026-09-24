import type { NextRequest } from 'next/server';
import { proxyPortalRequest } from '@/lib/portal/proxy';

export async function GET(request: NextRequest) {
  return proxyPortalRequest(request, 'GET', '/auth/me');
}
