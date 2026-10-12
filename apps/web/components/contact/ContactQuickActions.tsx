import { getContacts } from '@/lib/contacts';
import { branchTelHref } from '@/lib/branches';
import { configuredMessengers } from '@/components/shared/MessengerLinks';
import { getServerMessages } from '@/lib/i18n';

/**
 * Phone-only shortcuts for the Contact page: calling or opening WhatsApp / Viber should be one tap,
 * not a scroll to a small text link.
 *  - `strip`: a short row of big buttons above the form (Call, WhatsApp, Viber).
 *  - `bar`: a bottom bar with Call and WhatsApp that sticks to the screen while the page scrolls and
 *    stops above the footer (sticky, not fixed, so it never covers the footer links).
 * Only what the admin has configured is shown (no dead buttons); both hide from `sm` up, where the
 * full contact card is already on screen.
 */
export async function ContactQuickActions({ variant }: { variant: 'strip' | 'bar' }) {
  const [{ general, messengers }, { messages }] = await Promise.all([
    getContacts(),
    getServerMessages(),
  ]);
  const t = messages.contact;
  const phone = general.phones[0];
  const chat = configuredMessengers(messengers).filter(
    ({ key }) => key === 'whatsapp' || key === 'viber',
  );

  const actions = [
    ...(phone
      ? [{ key: 'call', label: t.branches.call, href: branchTelHref(phone), external: false }]
      : []),
    ...chat.map(({ key, name, href }) => ({ key, label: name, href, external: true })),
  ];
  if (actions.length === 0) return null;

  if (variant === 'strip') {
    return (
      <nav
        aria-label={t.quick.label}
        className="mb-6 grid auto-cols-fr grid-flow-col gap-3 sm:hidden"
      >
        {actions.map((action) => (
          <a
            key={action.key}
            href={action.href}
            {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="flex min-h-14 items-center justify-center rounded-[20px] bg-white px-3 text-[16px] font-medium text-ink shadow-card transition-colors duration-standard hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {action.label}
          </a>
        ))}
      </nav>
    );
  }

  const bar = actions.filter((a) => a.key === 'call' || a.key === 'whatsapp');
  if (bar.length === 0) return null;
  return (
    <nav
      aria-label={t.quick.label}
      className="sticky bottom-0 z-30 mt-10 flex gap-3 border-t border-line-light bg-white/95 p-3 backdrop-blur sm:hidden"
    >
      {bar.map((action, index) => (
        <a
          key={action.key}
          href={action.href}
          {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={`flex min-h-12 flex-1 items-center justify-center rounded-pill px-4 text-[16px] font-medium transition-colors duration-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            index === 0
              ? 'bg-accent text-ink hover:bg-accent-600'
              : 'bg-neutral-50 text-ink hover:bg-neutral-100'
          }`}
        >
          {action.label}
        </a>
      ))}
    </nav>
  );
}
