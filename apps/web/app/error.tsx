'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useMessages } from '@/components/shared/LocaleProvider';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useMessages().common;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-bg px-4 text-center text-white">
      <h1 className="font-display text-h2 font-bold">{t.errorHeading}</h1>
      <Button variant="primary" onClick={reset}>
        {t.errorRetry}
      </Button>
    </div>
  );
}
