import type { MediaKind } from '@autoroom/api/client';

/**
 * The three things a video can be, labelled the way the spec names them so the
 * admin and `references/pages.md` can be read side by side.
 */
export const KINDS: { value: MediaKind; label: string; hint: string }[] = [
  {
    value: 'CUSTOMER_STORY',
    label: 'Customer story',
    hint: 'Homepage Section 7 — the Story Wall. 60–90s, one customer each.',
  },
  {
    value: 'FOUNDER',
    label: 'Founder story',
    hint: 'Homepage Section 6 — how AutoRoom started. Up to 1.5 minutes.',
  },
  {
    value: 'GUIDE_REEL',
    label: 'Guide reel',
    hint: 'Short explainer used across the site.',
  },
];

export const kindLabel = (kind: MediaKind) =>
  KINDS.find((entry) => entry.value === kind)?.label ?? kind;

export const kindHint = (kind: MediaKind) =>
  KINDS.find((entry) => entry.value === kind)?.hint ?? '';
