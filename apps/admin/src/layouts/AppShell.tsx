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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import { Wordmark } from '@/components/Wordmark';
import { useAuth } from '@/auth/AuthProvider';
import { brand, mono } from '@/theme';

const SIDEBAR_WIDTH = 248;

/**
 * Navigation, grouped the way `admin.md` A3 specifies.
 *
 * Every destination declares the permission it needs, so the sidebar shows a
 * role only what that role can actually open — the same matrix the API enforces,
 * applied to the UI so nobody is invited to click into a 403.
 *
 * Items whose screens land in later phases are listed but disabled, marked
 * SOON. Hiding them would misrepresent the product; letting them 404 would be
 * worse.
 */
const NAV: {
  group: string;
  items: { label: string; to: string; permission?: string; ready?: boolean }[];
}[] = [
  {
    group: 'Overview',
    items: [{ label: 'Dashboard', to: '/', ready: true }],
  },
  {
    group: 'Catalogue',
    items: [
      { label: 'Cars', to: '/cars', permission: 'cars:READ' },
      { label: 'Machinery', to: '/machinery', permission: 'machinery:READ' },
      { label: 'Auctions', to: '/auctions', permission: 'auctions:READ' },
      { label: 'Offers', to: '/offers', permission: 'offers:READ' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Leads', to: '/leads', permission: 'leads:READ' },
      { label: 'Partners', to: '/partners', permission: 'partners:READ' },
      { label: 'Bookings', to: '/bookings', permission: 'bookings:READ' },
      { label: 'Orders', to: '/orders', permission: 'orders:READ' },
    ],
  },
  {
    group: 'Content',
    items: [
      { label: 'FAQ', to: '/faq', permission: 'faq:READ' },
      { label: 'Branches', to: '/branches', permission: 'branches:READ' },
      { label: 'Team', to: '/team', permission: 'team:READ' },
      { label: 'Banks', to: '/banks', permission: 'banks:READ' },
    ],
  },
  {
    group: 'System',
    items: [
      { label: 'Users', to: '/users', permission: 'users:READ' },
      { label: 'Roles', to: '/roles', permission: 'roles:READ' },
      { label: 'Settings', to: '/settings', permission: 'settings:READ' },
    ],
  },
];

export function AppShell() {
  const { identity, signOut } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const permissions = identity?.permissions ?? [];

  const sidebar = (
    <Box
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

      <Box sx={{ px: 1.5, pb: 3, flex: 1 }}>
        {NAV.map((section) => {
          const visible = section.items.filter(
            (item) => !item.permission || permissions.includes(item.permission),
          );
          if (visible.length === 0) return null;

          return (
            <Box key={section.group} sx={{ mb: 2.5 }}>
              <Typography
                variant="overline"
                sx={{ color: brand.muted, px: 1.5, display: 'block', mb: 0.5 }}
              >
                {section.group}
              </Typography>
              <List dense disablePadding>
                {visible.map((item) => {
                  const selected = location.pathname === item.to;
                  return (
                    <ListItemButton
                      key={item.to}
                      component={item.ready ? RouterLink : 'div'}
                      to={item.ready ? item.to : undefined}
                      selected={selected}
                      disabled={!item.ready}
                      onClick={() => setDrawerOpen(false)}
                      sx={{
                        color: selected ? brand.paper : '#B7BBC2',
                        '&.Mui-disabled': { opacity: 1, color: '#5C6068' },
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
                      {!item.ready && (
                        <Typography
                          component="span"
                          sx={{ fontFamily: mono, fontSize: '0.5625rem', color: '#4E525A' }}
                        >
                          SOON
                        </Typography>
                      )}
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: brand.surfaceLight }}>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>{sidebar}</Box>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { border: 'none' } } }}
        sx={{ display: { md: 'none' } }}
      >
        {sidebar}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Toolbar
          sx={{
            bgcolor: brand.paper,
            borderBottom: `1px solid ${brand.lineLight}`,
            gap: 1,
            minHeight: { xs: 60, md: 68 },
            px: { xs: 2, md: 4 },
          }}
        >
          <IconButton
            onClick={() => setDrawerOpen(true)}
            edge="start"
            aria-label="Open navigation"
            sx={{ display: { md: 'none' }, mr: 0.5 }}
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
