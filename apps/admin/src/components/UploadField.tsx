import { useRef, useState } from 'react';
import { Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { brand } from '@/theme';

/**
 * Pick a file, get a URL back.
 *
 * The URL is also editable by hand. Uploading is the normal path, but a video
 * already hosted elsewhere should not have to be downloaded and re-uploaded
 * just to be referenced, and a wrong URL should be fixable without a new file.
 *
 * Errors render inline rather than as a toast: the thing that failed is on
 * screen, and a message that floats away takes the explanation with it.
 */
export function UploadField({
  label,
  accept,
  value,
  onChange,
  helperText,
  disabled = false,
  preview,
}: {
  label: string;
  /** An `accept` attribute, e.g. `video/mp4,video/webm` or `image/*`. */
  accept: string;
  value: string | null;
  onChange: (url: string | null) => void;
  helperText?: string;
  disabled?: boolean;
  /** Renders the current value once set — a poster thumbnail, a video tag. */
  preview?: (url: string) => React.ReactNode;
}) {
  const { api } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded = await api.upload(file);
      onChange(uploaded.url);
    } catch (caught) {
      setError(errorMessage(caught, 'Upload failed.'));
    } finally {
      setBusy(false);
      // Cleared so re-picking the same file after a failure still fires change.
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <Stack spacing={1}>
      <TextField
        label={label}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        fullWidth
        disabled={disabled || busy}
        error={Boolean(error)}
        helperText={error ?? helperText}
      />

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={busy ? <CircularProgress size={14} thickness={5} /> : <CloudUploadIcon />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
        >
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
        {value && !busy && (
          <Button size="small" color="inherit" onClick={() => onChange(null)} disabled={disabled}>
            Clear
          </Button>
        )}
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Up to 25 MB</Typography>
      </Stack>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => void send(event.target.files?.[0])}
      />

      {value && preview && (
        <Box
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${brand.lineLight}`,
            bgcolor: brand.surfaceLight,
          }}
        >
          {preview(value)}
        </Box>
      )}
    </Stack>
  );
}
