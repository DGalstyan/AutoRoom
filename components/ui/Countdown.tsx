'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

interface CountdownProps {
  /** ISO string, epoch ms or Date — auction end, offer deadline, ETA. */
  target: string | number | Date;
  variant?: 'full' | 'compact';
  onComplete?: () => void;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function getTimeLeft(target: Date, now: number): TimeLeft {
  const diff = target.getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: false,
  };
}

const pad = (value: number) => String(value).padStart(2, '0');

function subscribeToSeconds(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}

/**
 * The wall clock, in whole seconds. Truncating to seconds keeps the snapshot
 * stable between renders inside the same tick, which `useSyncExternalStore`
 * requires; `null` on the server means "clock not started yet".
 */
function useNow(): number | null {
  return useSyncExternalStore(
    subscribeToSeconds,
    () => Math.floor(Date.now() / 1000) * 1000,
    () => null,
  );
}

/**
 * Reusable countdown for auction end times, offer deadlines and "Կհասնի ~X օրից".
 * Digits use tabular numerals and fixed-width cells so ticking never shifts
 * layout; the polite live region only changes once a minute, so assistive tech
 * is not spammed every second.
 */
export function Countdown({ target, variant = 'full', onComplete, className }: CountdownProps) {
  const targetDate = target instanceof Date ? target : new Date(target);
  // Derived from the clock, not stored — a server-rendered "now" would hydrate stale.
  const now = useNow();
  const timeLeft = now === null ? null : getTimeLeft(targetDate, now);

  const completed = useRef(false);
  useEffect(() => {
    if (!timeLeft?.done || completed.current) return;
    completed.current = true;
    onComplete?.();
  }, [timeLeft?.done, onComplete]);

  const units = timeLeft
    ? [
        { value: timeLeft.days, label: t('common.countdown.days') },
        { value: timeLeft.hours, label: t('common.countdown.hours') },
        { value: timeLeft.minutes, label: t('common.countdown.minutes') },
        ...(variant === 'full'
          ? [{ value: timeLeft.seconds, label: t('common.countdown.seconds') }]
          : []),
      ]
    : [];

  return (
    <div className={cn('flex items-center gap-3 tabular-nums', className)}>
      <span aria-hidden="true" className="flex items-center gap-3">
        {timeLeft
          ? units.map((unit) => (
              <span key={unit.label} className="flex flex-col items-center">
                <span className="min-w-[2ch] text-center text-lead font-bold">
                  {pad(unit.value)}
                </span>
                <span className="text-caption text-muted">{unit.label}</span>
              </span>
            ))
          : // Reserve the same footprint before the client clock starts.
            Array.from({ length: variant === 'full' ? 4 : 3 }).map((_, index) => (
              <span key={index} className="flex flex-col items-center">
                <span className="min-w-[2ch] text-center text-lead font-bold">--</span>
                <span className="text-caption text-muted">&nbsp;</span>
              </span>
            ))}
      </span>

      <span className="sr-only" aria-live="polite">
        {timeLeft
          ? `${timeLeft.days} ${t('common.countdown.days')} ${timeLeft.hours} ${t('common.countdown.hours')} ${timeLeft.minutes} ${t('common.countdown.minutes')}`
          : ''}
      </span>
    </div>
  );
}
