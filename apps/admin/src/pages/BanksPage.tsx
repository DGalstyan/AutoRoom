import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Bank } from '@autoroom/api/client';
import { Alert, Box, Button, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { BankDialog } from '@/pages/banks/BankDialog';
import { brand } from '@/theme';

/**
 * Banks — the partner-bank grid behind the China (and USA) page's financing
 * section: logo, and either the bank's own auto-loan page or, for the one
 * row flagged "in-house", AutoRoom's own pre-arrival financing offer.
 */
export function BanksPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [menu, setMenu] = useState<{ anchor: HTMLElement; bank: Bank } | null>(null);
  const [editing, setEditing] = useState<{ bank?: Bank } | null>(null);
  const [deleting, setDeleting] = useState<Bank | null>(null);

  const canCreate = identity?.permissions.includes('banks:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('banks:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('banks:DELETE') ?? false;

  const banksQuery = useQuery({
    queryKey: ['banks'],
    queryFn: () => api.banks.list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['banks'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.banks.remove(id),
    onSuccess: () => {
      toast('Bank removed.');
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const banks = banksQuery.data?.items ?? [];
  const missingLogo = banks.filter((bank) => !bank.logoUrl).length;

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Banks
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            The financing partner grid on the China and USA pages.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing({})}
            sx={{ flex: 'none' }}
          >
            Add bank
          </Button>
        )}
      </Stack>

      {/* A row with no logo still saves fine, but it would render as a bare
          name on the public grid where every other row is a real logo. */}
      {missingLogo > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {missingLogo === 1
            ? 'One bank has no logo uploaded yet.'
            : `${missingLogo} banks have no logo uploaded yet.`}
        </Alert>
      )}

      <DataTable
        rows={banks}
        getRowId={(bank) => bank.id}
        isPending={banksQuery.isPending}
        error={banksQuery.isError ? banksQuery.error : undefined}
        errorMessage="Could not load banks."
        emptyMessage="No banks yet."
        minWidth={720}
        columns={[
          {
            key: 'logo',
            width: 96,
            render: (bank) => (
              <Box
                sx={{
                  width: 76,
                  height: 44,
                  borderRadius: 1,
                  bgcolor: brand.surfaceLight,
                  border: `1px solid ${brand.lineLight}`,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {bank.logoUrl && (
                  <Box
                    component="img"
                    src={bank.logoUrl}
                    alt=""
                    sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                )}
              </Box>
            ),
          },
          {
            key: 'name',
            header: 'Bank',
            render: (bank) => (
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{bank.name}</Typography>
            ),
          },
          {
            key: 'kind',
            header: 'Kind',
            render: (bank) =>
              bank.inHouse ? (
                <StatusBadge label="In-house" tone="live" />
              ) : (
                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                  Partner bank
                </Typography>
              ),
          },
          {
            key: 'loanUrl',
            header: 'Loan page',
            render: (bank) =>
              bank.loanUrl ? (
                <Typography
                  component="a"
                  href={bank.loanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ fontSize: '0.8125rem', color: 'primary.main' }}
                >
                  {bank.loanUrl.replace(/^https?:\/\//, '')}
                </Typography>
              ) : (
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>—</Typography>
              ),
          },
          {
            key: 'actions',
            align: 'right',
            hidden: !canUpdate && !canDelete,
            render: (bank) => (
              <IconButton
                size="small"
                aria-label={`Actions for ${bank.name}`}
                onClick={(event) => setMenu({ anchor: event.currentTarget, bank })}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            ),
          },
        ]}
      />

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {canUpdate && menu && (
          <MenuItem
            onClick={() => {
              setEditing({ bank: menu.bank });
              setMenu(null);
            }}
          >
            Edit
          </MenuItem>
        )}
        {canDelete && menu && (
          <MenuItem
            onClick={() => {
              setDeleting(menu.bank);
              setMenu(null);
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {editing && (
        <BankDialog
          bank={editing.bank}
          nextPosition={banks.length}
          onClose={() => setEditing(null)}
          onDone={(message) => {
            setEditing(null);
            toast(message);
            void refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove this bank?"
        message={
          deleting ? `${deleting.name} disappears from the China and USA financing grid.` : ''
        }
        confirmLabel="Remove"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
