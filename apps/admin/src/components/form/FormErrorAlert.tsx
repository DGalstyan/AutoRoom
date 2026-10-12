import { useEffect, useRef } from 'react';
import { Alert } from '@mui/material';

/**
 * The form-level error banner for a dialog. A dialog's content scrolls, so a plain banner at the top
 * is out of sight when the visitor is filling in the lower fields: this one sticks to the top of the
 * scrolling area and scrolls itself into view when a message appears.
 */
export function FormErrorAlert({ message }: { message: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (message) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [message]);
  if (!message) return null;
  return (
    <Alert ref={ref} severity="error" sx={{ position: 'sticky', top: 0, zIndex: 3 }}>
      {message}
    </Alert>
  );
}
