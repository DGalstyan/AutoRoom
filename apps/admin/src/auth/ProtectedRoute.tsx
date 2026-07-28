import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';

/**
 * Gate for everything behind sign-in.
 *
 * While the session is being restored from the refresh cookie the answer is
 * genuinely unknown, so it renders a spinner rather than bouncing to `/login` —
 * otherwise every reload would flash the login screen at an already-signed-in
 * user. The attempted path rides along in router state so sign-in can return
 * them to where they were headed.
 */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
      </Box>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}

/** Inverse gate: keeps a signed-in user off the login and register screens. */
export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === 'loading') return null;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}
