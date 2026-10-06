# UI primitives — canonical rules

## Cards — `Card`
One radius scale, one padding scale. Don't hand-write `rounded-[32px] bg-white p-…`.
| prop | values | use |
|---|---|---|
| `tone` | `light` (default) · `muted` · `dark` | white card · tinted inner well · card on a dark section |
| `radius` | `xl` 32px (default) · `lg` 20px | feature/section card · compact/nested card |
| `padding` | `md` 24 (default) · `lg` 32 · `sm` 16 · `none` | `none` for full-bleed images |
| `raised` | boolean | the shared `shadow-card` — one hero card per group, not every card |
| `interactive` | boolean | whole card is a link target (hover lift + focus ring) |

## CTA levels — `Button`
One **primary** per view; everything else steps down.
1. **`primary`** — gold fill, **ink** text (white on gold fails contrast). The action the section exists for.
2. **`outline`** (`secondary` = white-filled variant for dark photography) — the alternative next to a primary.
3. **`tertiary`** — text only, underline on hover: Back, Cancel, in-copy "Learn more". (`ghost` is a legacy alias.)

Sizes: `md` 44px (default) · `lg` 48px · `xl` 56px (hero / final-CTA bands only). Every size keeps a ≥44px touch target.

## Forms — `Field`
- Every control has a **persistent, visible `<label>`** bound with `htmlFor`/`id` (`Field` does this). A placeholder is never the label — use it only for an *example* value.
- Hints and errors are linked with `aria-describedby`; invalid sets `aria-invalid`; errors render `role="alert"`.
- Groups of buttons/radios use `<Field group>` (labels a `role="group"`).
- Documented exception: compact filter bars (`ChinaFilters`, `UsaAuctionFilters`, portal sort/branch selects) may use `aria-label` because the selected value is always visible.

## Not yet migrated
~20 hand-written `rounded-pill bg-accent …` CTAs (heroes, final CTAs, forms) still carry their own pixel-matched sizing; move them to `Button` (`md`/`lg`/`xl`) one page at a time with a Figma check.
