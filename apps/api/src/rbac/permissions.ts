/**
 * The `role × resource × action` matrix from `references/admin.md` A2.
 *
 * This file is the single definition: the seed writes it into the database, and
 * A2's middleware will check requests against the stored rows. Roles stay
 * data-driven — `super_admin` can edit a role's permissions at runtime and the
 * change takes effect immediately — so treat what is here as the *initial*
 * state, not a hardcoded rule.
 */

export const ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'PUBLISH'] as const;
export type Action = (typeof ACTIONS)[number];

const CRUD = ['CREATE', 'READ', 'UPDATE', 'DELETE'] as const satisfies readonly Action[];
const CRUD_PUBLISH = [...CRUD, 'PUBLISH'] as const satisfies readonly Action[];

/**
 * Every guarded resource and the actions that are meaningful for it. A resource
 * only gets PUBLISH if it has a published/draft distinction on the public site.
 */
export const RESOURCES = {
  users: CRUD,
  roles: ['READ', 'UPDATE'],
  settings: ['READ', 'UPDATE'],
  audit: ['READ'],

  branches: CRUD,
  banks: CRUD,
  faq: CRUD_PUBLISH,
  team: CRUD,
  media: CRUD,

  cars: CRUD_PUBLISH,
  auctions: CRUD_PUBLISH,
  offers: CRUD_PUBLISH,

  leads: CRUD,
  partners: CRUD,
  bookings: CRUD,
  availability: CRUD,

  orders: CRUD,
  documents: CRUD,
  payments: CRUD,
} as const satisfies Record<string, readonly Action[]>;

export type Resource = keyof typeof RESOURCES;

export interface RoleDefinition {
  key: string;
  name: string;
  description: string;
  /** `'*'` grants every action on every resource. */
  grants: '*' | Partial<Record<Resource, readonly Action[]>>;
}

const CONTENT_RESOURCES = ['cars', 'offers', 'faq', 'branches', 'team', 'media'] as const;

export const ROLES: RoleDefinition[] = [
  {
    key: 'super_admin',
    name: 'Super admin',
    description: 'Everything, including user and role management and settings.',
    grants: '*',
  },
  {
    key: 'admin',
    name: 'Admin',
    description:
      'All content, orders and leads; manages managers and editors. Cannot edit role definitions or write billing.',
    grants: {
      // "manage managers/editors" — full user administration...
      users: CRUD,
      // ...but "not role definitions": read-only, so an admin cannot widen its own role.
      roles: ['READ'],
      settings: ['READ', 'UPDATE'],
      audit: ['READ'],
      branches: CRUD,
      banks: CRUD,
      faq: CRUD_PUBLISH,
      team: CRUD,
      media: CRUD,
      cars: CRUD_PUBLISH,
      auctions: CRUD_PUBLISH,
      offers: CRUD_PUBLISH,
      leads: CRUD,
      partners: CRUD,
      bookings: CRUD,
      availability: CRUD,
      orders: CRUD,
      documents: CRUD,
      // "not billing" — payments are visible but not editable.
      payments: ['READ'],
    },
  },
  {
    key: 'manager',
    name: 'Manager (sales / CRM)',
    description:
      'Leads, partners, bookings and orders (view and advance status). No settings or user management.',
    grants: {
      leads: CRUD,
      partners: CRUD,
      bookings: CRUD,
      availability: CRUD,
      // "view + advance status" — no creating or deleting orders.
      orders: ['READ', 'UPDATE'],
      documents: ['READ'],
      payments: ['READ'],
      // Read-only catalogue access so a lead's car reference resolves in the
      // CRM inbox. Not in the spec's list, which names only what managers own —
      // without it the inbox cannot render what the lead is about.
      cars: ['READ'],
      auctions: ['READ'],
      offers: ['READ'],
      branches: ['READ'],
      banks: ['READ'],
    },
  },
  {
    key: 'content_editor',
    name: 'Content editor',
    description: 'Cars, offers, FAQ, branches, team and media. No leads, orders or settings.',
    grants: Object.fromEntries(
      CONTENT_RESOURCES.map((resource) => [resource, RESOURCES[resource]]),
    ) as Partial<Record<Resource, readonly Action[]>>,
  },
  {
    key: 'partner',
    name: 'Partner',
    description:
      'Partner portal only — the cars assigned to them, their bookings and their orders. Never sees the admin panel.',
    grants: {
      // Deliberately no `cars:READ` or `bookings:READ`, even though the portal
      // shows both. Those grants are checked by the *admin* routes, which
      // return the whole catalogue and every partner's bookings — handing one
      // to a partner would open exactly what the portal exists to narrow.
      //
      // Record-level scoping ("their own") is not expressible in this matrix at
      // all, so the `/portal/*` routes carry it instead: they require a signed-in
      // account with a Partner attached and filter by that partner's id, with no
      // parameter that could ask for anyone else's rows.
      orders: ['READ'],
      documents: ['READ'],
      payments: ['READ'],
    },
  },
];

/** Flat list of every `resource:action` pair, for seeding the Permission table. */
export function allPermissions(): { resource: Resource; action: Action }[] {
  return (Object.keys(RESOURCES) as Resource[]).flatMap((resource) =>
    RESOURCES[resource].map((action) => ({ resource, action })),
  );
}

/** The pairs a role holds, with `'*'` expanded. */
export function permissionsForRole(role: RoleDefinition): { resource: Resource; action: Action }[] {
  if (role.grants === '*') return allPermissions();
  return (Object.keys(role.grants) as Resource[]).flatMap((resource) => {
    const actions = role.grants === '*' ? RESOURCES[resource] : (role.grants[resource] ?? []);
    return actions.map((action) => ({ resource, action }));
  });
}
