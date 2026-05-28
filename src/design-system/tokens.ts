/**
 * H.A.L. Compass Design Tokens (2026 Refresh)
 *
 * Theme: "Nocturne Radar"
 * Goal: calmer, universal dark palette with subtle terminal homage.
 */

export const colors = {
  bg: {
    0: '#070C14',
    1: '#0D1420',
    2: '#151F2D',
  },

  panel: 'rgba(17, 27, 41, 0.8)',
  panelSoft: 'rgba(25, 38, 56, 0.62)',
  border: 'rgba(118, 138, 168, 0.28)',
  borderStrong: 'rgba(152, 176, 212, 0.44)',

  text: '#E8EEF8',
  textSoft: '#C8D2E3',
  muted: '#8FA0B9',

  // Primary accent moved from neon green to cool cyan.
  primary: '#59C8FF',
  primarySoft: 'rgba(89, 200, 255, 0.2)',

  // Secondary accent used for highlights and key actions.
  accent: '#F3C969',
  cyan: '#7CE5FF',

  success: '#62D3A0',
  danger: '#FF7F92',
  warning: '#F3C969',
  info: '#7EA9FF',

  // Terminal homage - intentionally subtle, not dominant.
  phosphor: '#79D3A7',
} as const;

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '20px',
} as const;

export const motion = {
  fast: '120ms',
  base: '200ms',
  slow: '380ms',
} as const;

export const typography = {
  mono: '"IBM Plex Mono", "SF Mono", "Cascadia Code", monospace',
  display: '"Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif',
  body: '"Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif',
} as const;
