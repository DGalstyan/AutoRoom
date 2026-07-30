import { Chip } from '@mui/material';
import { brand } from '@/theme';

/**
 * The five things a status can mean. Screens choose a *meaning*, not a colour,
 * so "live" is the same green on a car, a video and a branch — and changing
 * what green is stays one edit rather than a search for hex codes.
 */
export type StatusTone = 'live' | 'pending' | 'info' | 'muted' | 'danger';

const TONES: Record<StatusTone, string> = {
  live: brand.success,
  pending: brand.warn,
  info: brand.info,
  muted: brand.muted,
  danger: brand.accent,
};

/**
 * The colour behind a tone, for the places a chip is the wrong shape — the
 * bookings calendar draws its own bars and needs the hue directly. Exported so
 * those stay in step with the badges rather than re-picking a green.
 */
export const toneColor = (tone: StatusTone) => TONES[tone];

/**
 * A small state pill — Draft/Published, Requested/Confirmed, Open/Taken.
 *
 * Every screen had its own copy of this chip with the same magic numbers and a
 * hand-mixed `18` alpha suffix. One component means they cannot drift apart,
 * and a status that reads one way on the Cars list cannot read another on the
 * calendar.
 */
export function StatusBadge({
  label,
  tone = 'muted',
  filled = false,
}: {
  label: string;
  tone?: StatusTone;
  /** Solid rather than tinted — for badges over a photo, where a wash vanishes. */
  filled?: boolean;
}) {
  const color = TONES[tone];

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 22,
        fontSize: '0.6875rem',
        fontWeight: 600,
        color: filled ? brand.paper : color,
        // A 12%-alpha wash of the same hue: legible on white without the chip
        // competing with the row's own text.
        bgcolor: filled ? color : `${color}1F`,
      }}
    />
  );
}
