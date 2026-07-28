/**
 * Branches — single source of truth (references/branches.md).
 * Used by BranchMap (Homepage + Contact), the aggregated FAQ, and the footer.
 * Never retype an address; import from here.
 */

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  hours: string;
  /** TODO(client): fill lat/lng so `BranchMap` can place real pins. */
  lat?: number;
  lng?: number;
  /** Overrides the address-derived Google Maps link, if the client supplies one. */
  mapsUrl?: string;
  /** TODO(client): branch photo for the `BranchMap` panel. */
  photo?: string;
}

/**
 * Google Maps directions for the `Ուղղություն` CTA. Coordinates win when they
 * exist; otherwise the address is good enough for Maps to resolve, so the CTA
 * works before the client supplies lat/lng.
 */
export function directionsUrl(branch: Branch): string {
  if (branch.mapsUrl) return branch.mapsUrl;
  const destination =
    branch.lat !== undefined && branch.lng !== undefined
      ? `${branch.lat},${branch.lng}`
      : `${branch.address}, ${branch.city}, Armenia`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export const BRANCHES: Branch[] = [
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
  // TODO(client): the BranchMap spec shows a 2nd Armavir pin. Confirm its
  // address/phone before publishing, then add it here — nowhere else.
];
