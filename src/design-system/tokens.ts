/**
 * H.A.L. Compass Design Tokens (2026 Foundation)
 * 
 * This is the single source of truth for all design decisions.
 * Components should rarely use raw values — they should reference these tokens.
 * 
 * These tokens are also exposed via Tailwind (see tailwind.config.js).
 */

export const colors = {
  bg: {
    0: '#020705',
    1: '#04100b',
    2: '#0a1b13',
  },
  panel: 'rgba(6, 26, 16, 0.76)',
  panelSoft: 'rgba(8, 34, 21, 0.56)',
  border: 'rgba(106, 255, 164, 0.24)',
  borderStrong: 'rgba(150, 255, 190, 0.52)',
  text: '#d8ffe9',
  textSoft: '#b6e9c9',
  muted: '#7fb79a',
  primary: '#6dffab',
  primarySoft: 'rgba(109, 255, 171, 0.24)',
  accent: '#c8ff71',
  cyan: '#67f3d2',
  danger: '#ff6a86',
  warning: '#ffd461',
} as const;

export const radius = {
  sm: '8px',
  md: '14px',
  lg: '22px',
} as const;

export const motion = {
  fast: '140ms',
  base: '220ms',
  slow: '420ms',
} as const;

export const typography = {
  mono: '"Share Tech Mono", "IBM Plex Mono", "SF Mono", monospace',
  display: 'Orbitron, "Share Tech Mono", monospace',
} as const;
