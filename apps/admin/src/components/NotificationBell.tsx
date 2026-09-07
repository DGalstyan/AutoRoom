import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Lead } from '@autoroom/api/client';
import { Badge, Box, Divider, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { useAuth } from '@/auth/AuthProvider';

const POLL_INTERVAL_MS = 30_000;
const PREVIEW_COUNT = 5;

/**
 * Admin top-bar bell — surfaces new submissions from the public site's
 * lead-capture entry points (Universal popup, Quiz, and the Contact page
 * form) without anyone having to remember to check the Leads page. Polls
 * `GET /leads?status=NEW` rather than pushing, since there's no websocket/SSE
 * channel in this API yet — 30s is frequent enough for a staff inbox without
 * hammering the endpoint.
 *
 * Only rendered for roles that can actually read leads (admin/manager) — a
 * content editor has no use for a bell pointing at a page they'd get a 403
 * opening.
 *
 * Deliberately doesn't mark anything "seen" on open: `status` is a real CRM
 * field (NEW → CONTACTED → CLOSED) a manager advances deliberately from the
 * Leads page once they've actually worked the lead, not a side effect of
 * glancing at a dropdown.
 */
export function NotificationBell() {
  const { api, identity } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const canRead = identity?.permissions.includes('leads:READ') ?? false;

  const newLeadsQuery = useQuery({
    queryKey: ['leads', 'NEW', 'bell'],
    queryFn: () => api.leads.list({ status: 'NEW', take: PREVIEW_COUNT }),
    enabled: canRead,
    refetchInterval: POLL_INTERVAL_MS,
  });

  if (!canRead) return null;

  const items = newLeadsQuery.data?.items ?? [];
  const total = newLeadsQuery.data?.total ?? 0;

  return (
    <>
      <IconButton
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label={total > 0 ? `${total} new leads` : 'Notifications'}
        sx={{ mr: 0.5 }}
      >
        <Badge badgeContent={total} color="error" max={99}>
          <NotificationsOutlinedIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 340 } } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>New leads</Typography>
        </Box>
        <Divider />

        {items.length === 0 ? (
          <Box sx={{ px: 2, py: 2.5 }}>
            <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
              No new messages.
            </Typography>
          </Box>
        ) : (
          items.map((lead) => (
            <LeadPreview key={lead.id} lead={lead} onClose={() => setAnchor(null)} />
          ))
        )}

        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            navigate('/leads');
          }}
          sx={{ fontSize: '0.8125rem', color: 'primary.main', justifyContent: 'center' }}
        >
          View all leads
        </MenuItem>
      </Menu>
    </>
  );
}

function LeadPreview({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const navigate = useNavigate();
  const about = [lead.carName, lead.topic, lead.interest].filter(Boolean).join(' · ');

  return (
    <MenuItem
      onClick={() => {
        onClose();
        navigate('/leads');
      }}
      sx={{ alignItems: 'flex-start', whiteSpace: 'normal', py: 1 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          {lead.name} · {lead.phone}
        </Typography>
        {about && (
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }} noWrap>
            {about}
          </Typography>
        )}
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mt: 0.25 }}>
          {lead.sourcePage} · {new Date(lead.createdAt).toLocaleString()}
        </Typography>
      </Box>
    </MenuItem>
  );
}
