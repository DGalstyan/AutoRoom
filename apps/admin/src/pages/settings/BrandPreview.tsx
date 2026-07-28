import type { BrandingIdentity, BrandingTheme, BrandingTypography } from '@autoroom/api/client';
import { Box, Paper, Stack, Typography } from '@mui/material';

/**
 * Live preview of the branding being edited.
 *
 * Deliberately a miniature of the real surfaces — a dark header, a light
 * section, a primary button, the palette — rather than a row of swatches. The
 * question someone is actually answering while picking an accent is "does this
 * read on the button and on the dark bar", and swatches alone cannot answer it.
 *
 * Fonts render only if the viewer's machine has them; the panel self-hosts Sora
 * and Inter and nothing else. The helper text next to the font fields says so,
 * so a fallback here is not mistaken for a broken preview.
 */
export function BrandPreview({
  identity,
  theme,
  typography,
}: {
  identity: BrandingIdentity;
  theme: BrandingTheme;
  typography: BrandingTypography;
}) {
  const display = `'${typography.display}', 'Sora', system-ui, sans-serif`;
  const body = `'${typography.body}', 'Inter', system-ui, sans-serif`;

  return (
    <Box>
      <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
        Live preview
      </Typography>

      <Paper
        variant="outlined"
        sx={{ borderRadius: 3, overflow: 'hidden', position: 'sticky', top: 88 }}
      >
        {/* Dark surface — the site header and footer. */}
        <Box
          sx={{
            bgcolor: theme.bg,
            px: 2.5,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          {identity.logoDarkUrl ? (
            <Box
              component="img"
              src={identity.logoDarkUrl}
              alt=""
              sx={{ height: 22, maxWidth: 140, objectFit: 'contain' }}
            />
          ) : (
            <>
              <Box
                aria-hidden
                sx={{
                  width: 11,
                  height: 17,
                  bgcolor: theme.accent,
                  transform: 'skewX(-14deg)',
                  borderRadius: '2px',
                }}
              />
              <Box
                sx={{
                  fontFamily: display,
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  letterSpacing: '0.14em',
                  color: theme.paper,
                }}
              >
                {identity.brandName.toUpperCase()}
              </Box>
            </>
          )}
          <Box sx={{ flex: 1 }} />
          <Box sx={{ fontFamily: body, fontSize: '0.75rem', color: theme.muted }}>Menu</Box>
        </Box>

        {/* Light surface — a page section with the primary call to action. */}
        <Box sx={{ bgcolor: theme.surfaceLight, px: 2.5, py: 3 }}>
          <Box
            sx={{
              fontFamily: display,
              fontSize: '1.25rem',
              fontWeight: 700,
              color: theme.ink,
              letterSpacing: '-0.01em',
              mb: 0.75,
            }}
          >
            {identity.brandName}
          </Box>
          <Box sx={{ fontFamily: body, fontSize: '0.8125rem', color: theme.muted, mb: 2.5 }}>
            Body text in {typography.body}. Headings in {typography.display}.
          </Box>

          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box
              component="span"
              sx={{
                bgcolor: theme.accent,
                color: theme.paper,
                fontFamily: body,
                fontSize: '0.8125rem',
                fontWeight: 600,
                px: 2,
                py: 1,
                borderRadius: 999,
              }}
            >
              Primary action
            </Box>
            <Box
              component="span"
              sx={{
                border: `1px solid ${theme.lineLight}`,
                color: theme.ink,
                fontFamily: body,
                fontSize: '0.8125rem',
                px: 2,
                py: 1,
                borderRadius: 999,
                bgcolor: theme.paper,
              }}
            >
              Secondary
            </Box>
          </Stack>
        </Box>

        {/* Status colours, which never appear on the surfaces above. */}
        <Box
          sx={{
            display: 'flex',
            borderTop: `1px solid ${theme.lineLight}`,
          }}
        >
          {(['success', 'warn', 'info'] as const).map((token) => (
            <Box
              key={token}
              sx={{
                flex: 1,
                bgcolor: theme[token],
                py: 1,
                textAlign: 'center',
                fontFamily: body,
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: theme.paper,
              }}
            >
              {token}
            </Box>
          ))}
        </Box>
      </Paper>

      {identity.faviconUrl && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.5 }}>
          <Box
            component="img"
            src={identity.faviconUrl}
            alt=""
            sx={{ width: 16, height: 16, objectFit: 'contain' }}
          />
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            Favicon at actual size
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
