import { Box, Typography } from '@mui/material';
import { brand } from '@/theme';

/**
 * The wordmark. The mark is a slanted red bar — a road marking, which is both
 * the business and a shape that survives being 10px tall in a sidebar.
 */
export function Wordmark({
  tone = 'dark',
  size = 'md',
}: {
  tone?: 'dark' | 'light';
  size?: 'sm' | 'md';
}) {
  const color = tone === 'dark' ? brand.ink : brand.paper;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: size === 'sm' ? 1 : 1.25 }}>
      <Box
        aria-hidden
        sx={{
          width: size === 'sm' ? 10 : 13,
          height: size === 'sm' ? 16 : 20,
          bgcolor: brand.accent,
          transform: 'skewX(-14deg)',
          borderRadius: '2px',
          flex: 'none',
        }}
      />
      <Typography
        component="span"
        sx={{
          fontFamily: "'Sora', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: size === 'sm' ? '0.875rem' : '1.0625rem',
          letterSpacing: '0.16em',
          color,
          lineHeight: 1,
        }}
      >
        AUTOROOM
      </Typography>
    </Box>
  );
}
