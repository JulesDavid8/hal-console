/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // H.A.L. Compass Design Tokens (Nocturne Radar)
        hal: {
          bg: {
            0: '#070C14',
            1: '#0D1420',
            2: '#151F2D',
          },
          panel: 'rgba(17, 27, 41, 0.8)',
          'panel-soft': 'rgba(25, 38, 56, 0.62)',
          border: 'rgba(118, 138, 168, 0.28)',
          'border-strong': 'rgba(152, 176, 212, 0.44)',
          text: '#E8EEF8',
          'text-soft': '#C8D2E3',
          muted: '#8FA0B9',
          primary: '#59C8FF',
          'primary-soft': 'rgba(89, 200, 255, 0.2)',
          accent: '#F3C969',
          cyan: '#7CE5FF',
          success: '#62D3A0',
          danger: '#FF7F92',
          warning: '#F3C969',
          info: '#7EA9FF',
          phosphor: '#79D3A7',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'SF Mono', 'Cascadia Code', 'monospace'],
        display: ['"Space Grotesk"', '"IBM Plex Sans"', 'Segoe UI', 'sans-serif'],
        body: ['"Space Grotesk"', '"IBM Plex Sans"', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'hal-glow': '0 0 30px rgba(89, 200, 255, 0.24)',
        'hal-glow-soft': '0 0 14px rgba(89, 200, 255, 0.18)',
        'hal-phosphor': '0 0 12px rgba(121, 211, 167, 0.2)',
      },
      borderRadius: {
        'hal-sm': '8px',
        'hal-md': '12px',
        'hal-lg': '20px',
      },
    },
  },
  plugins: [],
}
