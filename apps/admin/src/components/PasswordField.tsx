import { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';

/**
 * Password input with a reveal toggle. Typing a long password blind is the
 * single most common cause of a "wrong password" that was not wrong — and on
 * this app a few of those in a row locks the account for 15 minutes.
 */
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  required,
  helperText,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  helperText?: string;
  error?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoComplete={autoComplete}
      required={required}
      helperText={helperText}
      error={error}
      fullWidth
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setVisible((current) => !current)}
                edge="end"
                size="small"
                aria-label={visible ? 'Hide password' : 'Show password'}
                sx={{ color: 'text.secondary' }}
              >
                {visible ? (
                  <VisibilityOffOutlined fontSize="small" />
                ) : (
                  <VisibilityOutlined fontSize="small" />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
