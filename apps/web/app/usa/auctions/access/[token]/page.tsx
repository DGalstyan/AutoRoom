import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerMessages } from '@/lib/i18n';
import { apiBase } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

/** Exchanges a guest access token for the auction View-Only link: valid → redirect, expired/invalid → a clear message. */
export default async function AuctionGuestAccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const base = apiBase();

  let status = 0;
  let url: string | null = null;
  try {
    const res = await fetch(`${base}/public/auction-access/${encodeURIComponent(token)}`, {
      cache: 'no-store',
    });
    status = res.status;
    if (res.ok) url = ((await res.json()) as { url: string }).url;
  } catch {
    status = 0;
  }
  if (url) redirect(url);

  const { messages } = await getServerMessages();
  const t = messages.common.carDetail.auctionFollowAlong.access;
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 pt-32 text-center">
      <h1 className="font-display text-[28px] font-bold leading-9 text-ink">
        {status === 410 ? t.expiredHeading : t.invalidHeading}
      </h1>
      <p className="max-w-md text-lead text-neutral-700">
        {status === 410 ? t.expiredBody : t.invalidBody}
      </p>
      <Link
        href="/usa"
        className="mt-4 inline-flex h-12 items-center rounded-pill bg-accent px-6 text-[14px] font-medium text-ink transition-colors duration-standard hover:bg-accent-600"
      >
        {t.back}
      </Link>
    </section>
  );
}
