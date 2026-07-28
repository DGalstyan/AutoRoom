import { createTheme, alpha } from '@mui/material/styles';

/**
 * AutoRoom back-office theme.
 *
 * Material's defaults are all overridden deliberately: rounded-square buttons
 * with shouty uppercase labels and stacked grey elevations read as "a Google
 * product", which is not what this is. The look here comes from the brand
 * system already in the repo — near-black, paper white, one red — plus flat
 * surfaces separated by hairlines rather than shadows.
 *
 * Three typefaces, three jobs: Sora carries headings, Inter carries prose and
 * controls, and IBM Plex Mono carries data and labels. The mono is the register
 * this business already speaks in — VINs, lot numbers, container IDs — so it
 * does real work rather than decorating.
 */

export const brand = {
  ink: '#0B0B0F',
  surface: '#14141A',
  surfaceLight: '#F6F7F9',
  paper: '#FFFFFF',
  muted: '#8A8F98',
  lineDark: '#26262E',
  lineLight: '#E6E8EC',
  accent: '#E4002B',
  accentHover: '#B80022',
  success: '#1FA971',
  warn: '#E6A100',
  info: '#2F6BFF',
} as const;

export const mono = "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace";
const display = "'Sora', system-ui, sans-serif";
const body = "'Inter', system-ui, sans-serif";

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: brand.accent, dark: brand.accentHover, contrastText: brand.paper },
    secondary: { main: brand.ink, contrastText: brand.paper },
    success: { main: brand.success },
    warning: { main: brand.warn },
    info: { main: brand.info },
    error: { main: brand.accent },
    background: { default: brand.paper, paper: brand.paper },
    text: { primary: brand.ink, secondary: brand.muted },
    divider: brand.lineLight,
  },

  shape: { borderRadius: 12 },

  typography: {
    fontFamily: body,
    h1: {
      fontFamily: display,
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: display,
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.15,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontFamily: display,
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    h4: { fontFamily: display, fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.3 },
    h5: { fontFamily: display, fontWeight: 600, fontSize: '1.0625rem', lineHeight: 1.35 },
    h6: { fontFamily: display, fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.4 },
    subtitle1: { fontSize: '1rem', lineHeight: 1.55 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
    button: { fontWeight: 600, letterSpacing: 0 },
    caption: { fontSize: '0.75rem', lineHeight: 1.45 },
    // The eyebrow style used above headings and beside data.
    overline: {
      fontFamily: mono,
      fontSize: '0.6875rem',
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      lineHeight: 1.4,
    },
  },

  // Material's 25-step elevation ramp is replaced by two soft shadows; anything
  // that would have used a mid elevation gets a hairline border instead.
  shadows: [
    'none',
    '0 1px 2px rgba(11,11,15,.06)',
    '0 8px 30px rgba(11,11,15,.08)',
    '0 16px 44px rgba(11,11,15,.12)',
    ...Array<string>(21).fill('0 16px 44px rgba(11,11,15,.12)'),
  ] as never,

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': { colorScheme: 'light' },
        body: { backgroundColor: brand.paper, WebkitFontSmoothing: 'antialiased' },
        // Every scroll/entrance animation in the app is written as a named
        // keyframe so this one rule can switch them all off.
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          },
        },
        '::selection': { background: alpha(brand.accent, 0.18) },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 600,
          paddingInline: 20,
          transition: 'transform 150ms cubic-bezier(.16,1,.3,1), background-color 150ms',
          '&:active': { transform: 'translateY(1px)' },
        },
        sizeLarge: { height: 50, fontSize: '0.9375rem' },
        sizeMedium: { height: 42 },
        containedPrimary: {
          '&:hover': { backgroundColor: brand.accentHover },
        },
        containedSecondary: {
          '&:hover': { backgroundColor: brand.surface },
        },
        outlined: {
          borderColor: brand.lineLight,
          color: brand.ink,
          '&:hover': { borderColor: brand.ink, backgroundColor: 'transparent' },
        },
        text: { '&:hover': { backgroundColor: alpha(brand.ink, 0.04) } },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        // Targets `.MuiOutlinedInput-notchedOutline` rather than the bare
        // `fieldset` element. MUI's own focus rule carries three classes, so a
        // two-class override loses and its primary-red focus border shows —
        // which on this palette makes an ordinary focused field look like a
        // validation error. Focus is ink; red is reserved for genuine errors.
        root: {
          borderRadius: 10,
          backgroundColor: brand.paper,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: brand.lineLight,
            transition: 'border-color 150ms',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(brand.ink, 0.35) },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1,
            borderColor: brand.ink,
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: brand.accent },
        },
        input: { padding: '13px 14px', fontSize: '0.9375rem' },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        // Same specificity problem as the outline above: MUI colours the focused
        // label with the primary palette from an equally-specific rule, so this
        // one needs the extra class to win reliably.
        root: {
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: brand.muted,
          '&.MuiFormLabel-root.Mui-focused': { color: brand.ink },
          '&.MuiFormLabel-root.Mui-error': { color: brand.accent },
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: { root: { marginLeft: 2, fontSize: '0.75rem' } },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: brand.lineLight },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, fontSize: '0.875rem', alignItems: 'center' },
        standardError: {
          backgroundColor: alpha(brand.accent, 0.07),
          color: brand.ink,
          '& .MuiAlert-icon': { color: brand.accent },
        },
        standardSuccess: {
          backgroundColor: alpha(brand.success, 0.1),
          color: brand.ink,
          '& .MuiAlert-icon': { color: brand.success },
        },
        standardInfo: {
          backgroundColor: alpha(brand.info, 0.08),
          color: brand.ink,
          '& .MuiAlert-icon': { color: brand.info },
        },
      },
    },

    MuiLink: {
      defaultProps: { underline: 'none' },
      styleOverrides: {
        root: {
          color: brand.ink,
          fontWeight: 500,
          textDecorationColor: brand.lineLight,
          textUnderlineOffset: 3,
          '&:hover': { color: brand.accent },
        },
      },
    },

    MuiDivider: { styleOverrides: { root: { borderColor: brand.lineLight } } },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: alpha(brand.accent, 0.1),
            '&:hover': { backgroundColor: alpha(brand.accent, 0.14) },
          },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: brand.ink,
          fontSize: '0.75rem',
          borderRadius: 8,
          padding: '6px 10px',
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          border: `1px solid ${brand.lineLight}`,
          boxShadow: '0 16px 44px rgba(11,11,15,.12)',
        },
      },
    },

    // A visible, branded focus ring everywhere — keyboard users should never
    // have to hunt for where they are.
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: `2px solid ${brand.accent}`,
            outlineOffset: 2,
          },
        },
      },
    },
  },
});
