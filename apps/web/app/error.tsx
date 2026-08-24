'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { messages } from '@/lib/messages';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-bg px-4 text-center text-white">
      <h1 className="font-display text-h2 font-bold">{messages.common.errorHeading}</h1>
      <Button variant="primary" onClick={reset}>
        {messages.common.errorRetry}
      </Button>
    </div>
  );
}
