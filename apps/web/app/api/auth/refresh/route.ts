import type { NextRequest } from 'next/server';
import { proxyPortalRequest } from '@/lib/portal/proxy';

export async function POST(request: NextRequest) {
  return proxyPortalRequest(request, 'POST', '/auth/refresh');
}
