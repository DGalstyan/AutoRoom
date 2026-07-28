# Branches — AutoRoom (single source of truth)

Used by `BranchMap` (Homepage + Contact), the aggregated FAQ, and the footer.
Store as a typed array and import everywhere — never retype an address.

```ts
export const BRANCHES = [
  {
    id: 'yerevan',
    name: 'Մասնաճյուղ N1',
    city: 'Երևան',
    address: 'Սայաթ-Նովա 20',
    phone: '+374 94 077757',
    hours: '10:00–22:00',
    // map: fill lat/lng + Google Maps link for the `Ուղղություն` CTA
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
```

Notes:
- The Homepage `BranchMap` spec lists **four pins**: Երևան, Արմավիր, Արմավիր (2nd
  point), Էջմիածին. The company text lists three offices (above). Confirm the 2nd
  Armavir point's address/phone with the client before publishing; keep the data
  file as the one place to add it.
- Phone numbers render as click-to-call (`tel:+37494077757`, no spaces in `href`).
- Hours are identical (10:00–22:00) today; keep per-branch in case they diverge.
