/**
 * H.A.L. Compass Design Tokens — Proposed 2026 Theme
 * 
 * Theme Name: "Precision Terminal"
 * 
 * Philosophy:
 * - Familiar to professional traders (terminal power + high information density)
 * - New and refined (modern clarity, reduced fatigue)
 * - Color used semantically and sparingly
 * - Calm confidence over "neon terminal" gimmick
 */

/**
 * ============================================
 * NEW RECOMMENDED PALETTE
 * ============================================
 */

export const colors = {
  // === Backgrounds (Cool Charcoal Base) ===
  bg: {
    0: '#0B0E12',      // Deepest background
    1: '#111418',      // Main surface
    2: '#181C22',      // Elevated panels
  },

  // === Surfaces ===
  panel: 'rgba(24, 28, 34, 0.85)',
  panelSoft: 'rgba(30, 35, 42, 0.6)',
  border: 'rgba(60, 68, 80, 0.6)',
  borderStrong: 'rgba(80, 90, 105, 0.8)',

  // === Text ===
  text: '#E6E8EB',           // Primary text - high contrast
  textSoft: '#C5C9D0',       // Secondary text
  muted: '#8A9099',          // Muted / labels

  // === Primary Accent (Refined Teal/Cyan) ===
  // This replaces the heavy lime green as the main brand color
  primary: '#00C4B4',        // Main brand accent - sophisticated terminal nod
  primarySoft: 'rgba(0, 196, 180, 0.15)',

  // === Semantic Colors (Used sparingly for meaning) ===
  accent: '#7C8CFF',         // Secondary highlight (charts, links)
  cyan: '#00D4FF',           // Data / technical highlights

  // Bullish / Positive
  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.12)',

  // Bearish / Negative
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.12)',

  // Warnings / Attention
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.12)',

  // Neutral / Info
  info: '#60A5FA',
} as const;

/**
 * ============================================
 * TYPOGRAPHY
 * ============================================
 */
export const typography = {
  // Keep strong mono for data (numbers, tickers, commands)
  mono: '"Share Tech Mono", "IBM Plex Mono", "SF Mono", monospace',
  
  // Cleaner display for headers (less "sci-fi", more confident)
  display: 'Inter, system-ui, -apple-system, sans-serif',
  
  // Body text
  body: 'Inter, system-ui, -apple-system, sans-serif',
} as const;

/**
 * ============================================
 * RADIUS & MOTION (Keep similar)
 * ============================================
 */
export const radius = {
  sm: '6px',
  md: '10px',
  lg: '16px',
} as const;

export const motion = {
  fast: '120ms',
  base: '200ms',
  slow: '380ms',
} as const;
