import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Lead, LeadMeetingActionInput } from '@autoroom/api/client';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { formatDateTime, toDateTimeInput } from '@/pages/availability/time';

type Action = LeadMeetingActionInput['action'];

const ACTION_LABEL: Record<Action, string> = {
  confirm: 'Confirm',
  reschedule: 'Reschedule',
  cancel: 'Cancel meeting',
  complete: 'Mark completed',
};

const SUBMIT_LABEL: Record<Action, string> = {
  confirm: 'Confirm meeting',
  reschedule: 'Move meeting',
  cancel: 'Cancel meeting',
  complete: 'Mark completed',
};

/**
 * Staff handling one dealer's meeting request: confirm it, move it, cancel it,
 * or mark it done. The dealer is texted about every change except completion,
 * with a line staff can add — the switch lets a call you already made skip the
 * SMS. A failed text never undoes the change; the toast says it did not go out.
 */
export function MeetingDialog({
  lead,
  initialAction = 'confirm',
  onClose,
  onDone,
}: {
  lead: Lead | null;
  initialAction?: Action;
  onClose: () => void;
  /** Called with the updated lead after a successful change. */
  onDone: (lead: Lead) => void;
}) {
  const { api } = useAuth();
  const toast = useToast();

  const [action, setAction] = useState<Action>(initialAction);
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);

  // Reset every time the dialog opens for a lead.
  useEffect(() => {
    if (!lead) return;
    setAction(initialAction);
    setWhen(lead.meetingAt ? toDateTimeInput(lead.meetingAt) : '');
    setNote('');
    setNotify(true);
  }, [lead, initialAction]);

  const mutation = useMutation({
    mutationFn: () =>
      api.leads.meeting(lead!.id, {
        action,
        ...(action === 'reschedule' && when ? { meetingAt: new Date(when).toISOString() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        notify: action === 'complete' ? false : notify,
      }),
    onSuccess: ({ lead: updated, notified }) => {
      toast(
        notified === 'failed'
          ? 'Saved, but the SMS to the dealer could not be sent.'
          : notified === 'sent'
            ? 'Meeting updated and the dealer was texted.'
            : 'Meeting updated.',
        notified === 'failed' ? 'error' : 'success',
      );
      onDone(updated);
      onClose();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const cancelled = lead?.meetingStatus === 'CANCELLED';
  const actions: Action[] = cancelled
    ? ['reschedule']
    : ['confirm', 'reschedule', 'cancel', 'complete'];
  const needsTime = action === 'reschedule';
  const canSubmit = !needsTime || Boolean(when);

  return (
    <Dialog open={Boolean(lead)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Dealer meeting</DialogTitle>
      <DialogContent>
        {lead && (
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Stack spacing={0.25}>
              <Typography sx={{ fontWeight: 600 }}>
                {lead.name}
                {lead.company ? ` · ${lead.company}` : ''}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                Requested for {lead.meetingAt ? formatDateTime(lead.meetingAt) : 'no time'} ·{' '}
                {lead.phone}
                {lead.phoneVerifiedAt ? ' (verified)' : ''}
              </Typography>
            </Stack>

            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={action}
              onChange={(_, next: Action | null) => next && setAction(next)}
              aria-label="What to do with this meeting"
              sx={{ flexWrap: 'wrap' }}
            >
              {actions.map((entry) => (
                <ToggleButton key={entry} value={entry} sx={{ minHeight: 40, flex: '1 1 auto' }}>
                  {ACTION_LABEL[entry]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {needsTime && (
              <TextField
                label="New time"
                type="datetime-local"
                value={when}
                onChange={(event) => setWhen(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="Your local time. The dealer is texted the Yerevan time."
              />
            )}

            {action !== 'complete' && (
              <>
                <TextField
                  label="Message to the dealer (optional)"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  multiline
                  minRows={2}
                  slotProps={{ htmlInput: { maxLength: 300 } }}
                  helperText={`${note.length}/300 — added to the SMS`}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notify}
                      onChange={(event) => setNotify(event.target.checked)}
                    />
                  }
                  label="Text the dealer about this change"
                />
              </>
            )}

            {action === 'cancel' && (
              <Alert severity="warning">
                The meeting is marked cancelled. You can bring it back later by rescheduling.
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          color={action === 'cancel' ? 'error' : 'primary'}
          disabled={!canSubmit || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {SUBMIT_LABEL[action]}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
