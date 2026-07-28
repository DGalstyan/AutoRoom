import type { MessageKey } from '@/lib/i18n';

export interface NavItem {
  labelKey: MessageKey;
  href: string;
}

/**
 * Global nav, in the exact order given by the spec:
 * ԳԼԽԱՎՈՐ ԷՋ (logo) · Չինաստան · ԱՄՆ · Հատուկ առաջարկներ · Դարձիր գործընկեր ·
 * Բլոգ · Մուտք · Մեր մասին · Կապ մեզ հետ.
 */
export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.china', href: '/china' },
  { labelKey: 'nav.usa', href: '/usa' },
  { labelKey: 'nav.offers', href: '/offers' },
  { labelKey: 'nav.partners', href: '/partners' },
  { labelKey: 'nav.blog', href: '/blog' },
];

/** Partner-portal login sits inside the nav order, styled as a button. */
export const LOGIN_ITEM: NavItem = { labelKey: 'nav.login', href: '/partners/portal' };

export const NAV_ITEMS_AFTER_LOGIN: NavItem[] = [
  { labelKey: 'nav.about', href: '/about' },
  { labelKey: 'nav.contact', href: '/contact' },
];
