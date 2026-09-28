import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Order } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage, extractFieldErrors } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { UploadField } from '@/components/UploadField';
import { DOCUMENT_KINDS, DOCUMENT_KIND_LABEL } from '@/pages/orders/orderOptions';
import { brand, mono } from '@/theme';

/** Paperwork — invoices, customs forms, a title. Photos (auction/receipt/
 * handover) live on the car's own image albums instead, shown separately. */
export function DocumentsPanel({
  order,
  canCreate,
  canDelete,
}: {
  order: Order;
  canCreate: boolean;
  canDelete: boolean;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Order['documents'][number] | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['order', order.id] });

  const removeMutation = useMutation({
    mutationFn: (documentId: string) => api.orders.removeDocument(order.id, documentId),
    onSuccess: () => {
      toast('Document removed.');
      setRemoving(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Documents</Typography>
        {canCreate && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
            Add document
          </Button>
        )}
      </Stack>

      {order.documents.length === 0 ? (
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          No documents yet.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {order.documents.map((document) => (
            <Stack
              key={document.id}
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: 'center',
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${brand.lineLight}`,
              }}
            >
              <DescriptionOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  component="a"
                  href={document.url}
                  target="_blank"
                  rel="noopener"
                  sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'inherit', display: 'block' }}
                  noWrap
                >
                  {document.name}
                </Typography>
                <Typography sx={{ fontFamily: mono, fontSize: '0.75rem', color: 'text.secondary' }}>
                  {DOCUMENT_KIND_LABEL[document.kind]}
                </Typography>
              </Box>
              {canDelete && (
                <IconButton size="small" onClick={() => setRemoving(document)} aria-label="Remove">
                  <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </Stack>
          ))}
        </Stack>
      )}

      {adding && (
        <AddDocumentDialog orderId={order.id} onClose={() => setAdding(false)} onDone={refresh} />
      )}

      {removing && (
        <ConfirmDialog
          open
          title="Remove this document?"
          message={`"${removing.name}" will be removed from this order.`}
          confirmLabel="Remove"
          destructive
          busy={removeMutation.isPending}
          onConfirm={() => removeMutation.mutate(removing.id)}
          onClose={() => setRemoving(null)}
        />
      )}
    </Paper>
  );
}

function AddDocumentDialog({
  orderId,
  onClose,
  onDone,
}: {
  orderId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { api } = useAuth();
  const [kind, setKind] = useState<(typeof DOCUMENT_KINDS)[number]['value']>('OTHER');
  const [name, setName] = useState('');
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => api.orders.addDocument(orderId, { kind, name: name.trim(), url: url! }),
    onSuccess: () => {
      onDone();
      onClose();
    },
    onError: (caught) => {
      setFieldErrors(extractFieldErrors(caught));
      setError(errorMessage(caught));
    },
  });

  const canSubmit = name.trim().length > 0 && Boolean(url);

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setFieldErrors({});
          mutation.mutate();
        }}
      >
        <DialogTitle>Add document</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as typeof kind)}
              select
              fullWidth
            >
              {DOCUMENT_KINDS.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              fullWidth
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
            />
            <UploadField
              label="File"
              accept="application/pdf,image/*"
              value={url}
              onChange={setUrl}
              helperText={fieldErrors.url}
              maxSizeLabel="Up to 25 MB"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? 'Adding…' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
