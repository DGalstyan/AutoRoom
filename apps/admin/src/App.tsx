import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@/theme';
import { AuthProvider } from '@/auth/AuthProvider';
import { ProtectedRoute, PublicOnlyRoute } from '@/auth/ProtectedRoute';
import { AppShell } from '@/layouts/AppShell';
import { ToastProvider } from '@/components/ToastProvider';
import { LoginPage } from '@/pages/LoginPage';
import { UsersPage } from '@/pages/UsersPage';
import { RolesPage } from '@/pages/RolesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { CarsPage } from '@/pages/CarsPage';
import { CarFormPage } from '@/pages/CarFormPage';
import { HomeRoute } from '@/pages/HomeRoute';
import { PartnersPage } from '@/pages/PartnersPage';
import { BookingsPage } from '@/pages/BookingsPage';
import { AvailabilityPage } from '@/pages/AvailabilityPage';
import { BranchesPage } from '@/pages/BranchesPage';
import { StoriesPage } from '@/pages/StoriesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // 401s mean the session ended; retrying just delays the redirect.
      retry: 1,
    },
  },
});

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {/* The panel is mounted at /admin — every route below is relative to it. */}
        <BrowserRouter basename="/admin">
          <AuthProvider>
            <ToastProvider>
              <Routes>
                {/* Sign-in is the only screen a signed-out visitor can reach.
                    No self-registration and no self-serve password recovery: the
                    first super_admin comes from the seed, and every later account
                    is created by a super_admin from within the panel. */}
                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route path="/" element={<HomeRoute />} />
                    <Route path="/cars" element={<CarsPage />} />
                    <Route path="/cars/:id" element={<CarFormPage />} />
                    <Route path="/partners" element={<PartnersPage />} />
                    <Route path="/bookings" element={<BookingsPage />} />
                    <Route path="/availability" element={<AvailabilityPage />} />
                    <Route path="/branches" element={<BranchesPage />} />
                    <Route path="/stories" element={<StoriesPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/roles" element={<RolesPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
