import { Box, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/Wordmark';

/**
 * Shell for every signed-out screen.
 *
 * One centred column on a plain surface — the panel is a tool for people who
 * already know what it is, so the screen carries the mark, the heading and the
 * fields, and nothing that has to be scrolled past to reach the password box.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: { xs: 2.5, sm: 3 },
        py: { xs: 5, sm: 8 },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 4, sm: 5 } }}>
          <Wordmark />
        </Box>

        <Paper
          variant="outlined"
          sx={{
            px: { xs: 3, sm: 4.5 },
            py: { xs: 4, sm: 5 },
            borderRadius: 4,
          }}
        >
          <Typography variant="h3" sx={{ mb: subtitle ? 1 : 4 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: 'text.secondary', mb: 4, fontSize: '0.9375rem' }}>
              {subtitle}
            </Typography>
          )}
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
