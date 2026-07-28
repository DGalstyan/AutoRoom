import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import { Wordmark } from '@/components/Wordmark';
import { useAuth } from '@/auth/AuthProvider';
import { brand } from '@/theme';

const SIDEBAR_WIDTH = 248;

/**
 * Navigation.
 *
 * Only destinations that exist are listed. Each declares the permission it
 * needs, so the sidebar shows a role only what that role can actually open —
 * the same matrix the API enforces, applied to the UI so nobody is invited to
 * click into a 403. Catalogue, CRM and settings entries get added here as their
 * screens land.
 */
const NAV: { label: string; to: string; permission?: string }[] = [
  { label: 'Dashboard', to: '/' },
  { label: 'Users', to: '/users', permission: 'users:READ' },
  { label: 'Roles', to: '/roles', permission: 'roles:READ' },
  { label: 'Settings', to: '/settings', permission: 'settings:READ' },
];

export function AppShell() {
  const { identity, signOut } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  /**
   * Two independent open states, because the two layouts mean different things:
   * on desktop the sidebar is part of the page and starts open, on a phone it
   * is an overlay that starts closed. One shared flag would either hide the nav
   * on first paint or open a modal drawer over the dashboard.
   */
  const [desktopNavOpen, setDesktopNavOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const navOpen = isDesktop ? desktopNavOpen : mobileNavOpen;
  const toggleNav = () =>
    isDesktop ? setDesktopNavOpen((open) => !open) : setMobileNavOpen((open) => !open);

  const permissions = identity?.permissions ?? [];
  const visible = NAV.filter((item) => !item.permission || permissions.includes(item.permission));

  const sidebar = (
    <Box
      component="nav"
      aria-label="Main"
      sx={{
        width: SIDEBAR_WIDTH,
        flex: 'none',
        bgcolor: brand.ink,
        color: brand.paper,
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <Box sx={{ px: 3, py: 3 }}>
        <Wordmark tone="light" size="sm" />
      </Box>

      <List dense disablePadding sx={{ px: 1.5, pb: 3, flex: 1 }}>
        {visible.map((item) => {
          const selected = location.pathname === item.to;
          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={selected}
              onClick={() => setMobileNavOpen(false)}
              sx={{
                borderRadius: 1.5,
                color: selected ? brand.paper : '#B7BBC2',
                '&:hover': { bgcolor: '#FFFFFF10' },
                '&.Mui-selected': {
                  bgcolor: '#FFFFFF14',
                  '&:hover': { bgcolor: '#FFFFFF1A' },
                },
              }}
            >
              {selected && (
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    left: -6,
                    width: 3,
                    height: 18,
                    borderRadius: 999,
                    bgcolor: brand.accent,
                  }}
                />
              )}
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: { fontSize: '0.875rem', fontWeight: selected ? 600 : 400 },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: brand.surfaceLight }}>
      {/* Desktop: part of the layout, collapsed by animating its width to 0 so
          the main column reclaims the space instead of sitting beside a gap.

          Sticky and viewport-tall, not just tall: the page scrolls as one
          document, so a static column ends one screen down and the dark band
          stops with it, leaving bare background beside long content. Pinning it
          keeps the nav on screen and the colour running the full height however
          far the main column scrolls. `alignSelf` stops the flex parent from
          stretching it, which would defeat `position: sticky`. */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: desktopNavOpen ? SIDEBAR_WIDTH : 0,
          flex: 'none',
          overflow: 'hidden',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          height: '100dvh',
          transition: theme.transitions.create('width', {
            duration: theme.transitions.duration.shorter,
          }),
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        {sidebar}
      </Box>

      {/* Below md: an overlay, dismissed by the backdrop or Esc. */}
      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        slotProps={{ paper: { sx: { border: 'none' } } }}
        sx={{ display: { md: 'none' } }}
      >
        {sidebar}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Pinned: the account menu and the nav toggle are the two controls
            available from anywhere, so they should not require scrolling back
            up. Above the sidebar in the stack so the shadowless bar still reads
            as the top edge. */}
        <Toolbar
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: theme.zIndex.appBar,
            bgcolor: brand.paper,
            borderBottom: `1px solid ${brand.lineLight}`,
            gap: 1,
            minHeight: { xs: 60, md: 68 },
            px: { xs: 2, md: 4 },
          }}
        >
          <IconButton
            onClick={toggleNav}
            edge="start"
            aria-label={navOpen ? 'Hide navigation' : 'Show navigation'}
            aria-expanded={navOpen}
            sx={{ mr: 0.5 }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' }, mr: 1.5 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.3 }}>
              {identity?.name}
            </Typography>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              {identity?.role.name}
            </Typography>
          </Box>

          <IconButton
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            aria-label="Account menu"
            sx={{ p: 0.5 }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: brand.ink,
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              {initials(identity?.name)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ px: 2, py: 1.25, maxWidth: 240 }}>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {identity?.name}
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }} noWrap>
                {identity?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                void signOut();
              }}
              sx={{ gap: 1.5, fontSize: '0.875rem', mt: 0.5 }}
            >
              <LogoutOutlined fontSize="small" />
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>

        <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}
