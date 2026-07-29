import { useAuth } from '@/auth/AuthProvider';
import { DashboardPage } from '@/pages/DashboardPage';
import { PortalPage } from '@/pages/portal/PortalPage';

/**
 * What `/` means depends on who signed in.
 *
 * Partners and staff share the login screen and the shell, but not the landing
 * page: a partner has none of the admin permissions, so the staff dashboard
 * would show them an empty list of things they may do. Branching here rather
 * than on separate paths keeps one URL to bookmark and removes any chance of a
 * partner being handed a link into the admin side by accident.
 */
export function HomeRoute() {
  const { identity } = useAuth();
  if (identity?.role.key === 'partner') return <PortalPage />;
  return <DashboardPage />;
}
