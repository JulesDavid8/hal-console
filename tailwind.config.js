/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // H.A.L. Compass Design Tokens (2026 Foundation)
        hal: {
          bg: {
            0: '#020705',
            1: '#04100b',
            2: '#0a1b13',
          },
          panel: 'rgba(6, 26, 16, 0.76)',
          'panel-soft': 'rgba(8, 34, 21, 0.56)',
          border: 'rgba(106, 255, 164, 0.24)',
          'border-strong': 'rgba(150, 255, 190, 0.52)',
          text: '#d8ffe9',
          'text-soft': '#b6e9c9',
          muted: '#7fb79a',
          primary: '#6dffab',
          'primary-soft': 'rgba(109, 255, 171, 0.24)',
          accent: '#c8ff71',
          cyan: '#67f3d2',
          danger: '#ff6a86',
          warning: '#ffd461',
        },
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', '"IBM Plex Mono"', 'SF Mono', 'monospace'],
        display: ['Orbitron', '"Share Tech Mono"', 'monospace'],
      },
      boxShadow: {
        'hal-glow': '0 0 30px rgba(109, 255, 171, 0.24)',
        'hal-glow-soft': '0 0 14px rgba(109, 255, 171, 0.18)',
      },
      borderRadius: {
        'hal-sm': '8px',
        'hal-md': '14px',
        'hal-lg': '22px',
      },
    },
  },
  plugins: [],
}
