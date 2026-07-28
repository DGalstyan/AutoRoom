import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';

/**
 * One transient message at a time.
 *
 * A queue would be over-engineering here: the panel's writes are deliberate,
 * one-at-a-time actions from a dialog, so a second toast arriving while the
 * first is up means the newer result is the one worth reading.
 */

type Severity = 'success' | 'error' | 'info';

interface Toast {
  message: string;
  severity: Severity;
}

const ToastContext = createContext<((message: string, severity?: Severity) => void) | null>(null);

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used inside <ToastProvider>');
  return show;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const show = useCallback((message: string, severity: Severity = 'success') => {
    setToast({ message, severity });
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={toast?.severity === 'error' ? 8000 : 4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {/* Errors linger: they usually need reading, and sometimes acting on. */}
        <Alert
          severity={toast?.severity ?? 'success'}
          variant="filled"
          onClose={() => setToast(null)}
          sx={{ maxWidth: 420 }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
