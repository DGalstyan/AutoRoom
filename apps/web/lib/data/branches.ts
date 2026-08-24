/**
 * Branches — single source of truth, verbatim from
 * `.claude/skills/autoroom-website/references/branches.md`.
 *
 * Used by `BranchMap` (Homepage), the footer, and (later) the Contact page.
 * Never retype an address — import this file.
 */

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  hours: string;
}

export const BRANCHES: readonly Branch[] = [
  {
    id: 'yerevan',
    name: 'Մասնաճյուղ N1',
    city: 'Երևան',
    address: 'Սայաթ-Նովա 20',
    phone: '+374 94 077757',
    hours: '10:00–22:00',
  },
  {
    id: 'armavir',
    name: 'Մասնաճյուղ N2',
    city: 'Արմավիր',
    address: 'Հանրապետության 37/31',
    phone: '+374 77 838750',
    hours: '10:00–22:00',
  },
  {
    id: 'ejmiatsin',
    name: 'Մասնաճյուղ N3',
    city: 'Էջմիածին',
    address: 'Վազգեն Առաջին 5/53',
    phone: '+374 98 349400',
    hours: '10:00–22:00',
  },
] as const;

/**
 * `tel:` hrefs must not contain spaces.
 */
export function branchTelHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, '')}`;
}

// TODO(content-armenian): the Homepage BranchMap spec lists FOUR pins
// (Երևան, Արմավիր, Արմավիր #2, Էջմիածին) but the canonical branch list above
// has three offices. Confirm the 2nd Armavir branch's address/phone with the
// client, then add it here — this file is the only place it should be added.
