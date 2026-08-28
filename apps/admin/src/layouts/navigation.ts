export interface NavItem {
  label: string;
  to: string;
  /** `resource:ACTION`. Absent means everyone signed in may see it. */
  permission?: string;
}

export interface NavGroup {
  /** Empty for the ungrouped items that sit above the first heading. */
  label: string;
  items: NavItem[];
}

/**
 * The sidebar, grouped by what someone is *doing* rather than by which table a
 * screen reads. Ten flat entries is the point at which a list stops being
 * scannable, and "where do I confirm a booking" is a question about the day's
 * work, not about the schema.
 *
 * Each item declares the permission it needs, so a role is shown only what it
 * can actually open — the same matrix the API enforces, applied to the UI so
 * nobody is invited to click into a 403. A group with nothing visible in it
 * disappears along with its heading.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: '',
    items: [{ label: 'Dashboard', to: '/' }],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Partners', to: '/partners', permission: 'partners:READ' },
      { label: 'Bookings', to: '/bookings', permission: 'bookings:READ' },
      { label: 'Availability', to: '/availability', permission: 'availability:READ' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Cars', to: '/cars', permission: 'cars:READ' },
      { label: 'Stories', to: '/stories', permission: 'media:READ' },
      { label: 'Branches', to: '/branches', permission: 'branches:READ' },
      { label: 'Banks', to: '/banks', permission: 'banks:READ' },
      { label: 'FAQ', to: '/faq', permission: 'faq:READ' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users', to: '/users', permission: 'users:READ' },
      { label: 'Roles', to: '/roles', permission: 'roles:READ' },
      { label: 'Settings', to: '/settings', permission: 'settings:READ' },
    ],
  },
];

/**
 * Screens that are not navigation destinations but still need a name in the
 * breadcrumb trail. `:param` matches one segment.
 */
const EXTRA_ROUTES: { pattern: string; label: string }[] = [
  { pattern: '/cars/new', label: 'New car' },
  { pattern: '/cars/:id', label: 'Edit car' },
];

export interface Crumb {
  label: string;
  /** Absent on the last crumb — the page you are already on is not a link. */
  to?: string;
}

const ALL_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

/**
 * The trail for a path.
 *
 * Built from the same nav config the sidebar uses, so a renamed screen is
 * renamed in both places at once. Returns an empty trail for the dashboard —
 * "Dashboard" alone is a heading the page already has, not a trail.
 */
export function crumbsFor(pathname: string): Crumb[] {
  if (pathname === '/') return [];

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const path = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;

    const nav = ALL_ITEMS.find((item) => item.to === path);
    const extra = EXTRA_ROUTES.find((route) => matches(route.pattern, path));
    const label = nav?.label ?? extra?.label;

    // A segment nobody named is an id, and an id is not a place — the screen
    // above it already said what this is.
    if (!label) continue;

    crumbs.push(isLast ? { label } : { label, to: path });
  }

  return crumbs;
}

function matches(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  if (patternParts.length !== pathParts.length) return false;

  return patternParts.every((part, index) => part.startsWith(':') || part === pathParts[index]);
}
