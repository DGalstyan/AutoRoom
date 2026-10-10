'use client';

import Image, { type ImageProps } from 'next/image';
import { useCallback, useState } from 'react';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * A `fill` image that shows a spinner in the centre of its box until the photo has loaded (or
 * failed), then fades the photo in. Photos from the admin can be large and slow; without this
 * the card is just an empty dark box for seconds. Place it inside a `relative` sized container.
 */
export function LoadingImage({
  className = '',
  onLoad,
  onError,
  ...props
}: Omit<ImageProps, 'fill'>) {
  const [done, setDone] = useState(false);
  const loading = useMessages().common.loading;

  // A cached image can finish loading before React attaches `onLoad`, so also check on mount.
  const ref = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) setDone(true);
  }, []);

  return (
    <>
      {!done && (
        <span
          role="status"
          aria-label={loading}
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="size-9 animate-spin rounded-full border-[3px] border-white/25 border-t-white motion-reduce:animate-pulse" />
        </span>
      )}
      <Image
        {...props}
        ref={ref}
        fill
        onLoad={(event) => {
          setDone(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setDone(true);
          onError?.(event);
        }}
        className={`${className} transition-opacity duration-500 ${done ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}
