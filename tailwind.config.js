/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0C10',
          panel: 'rgba(22, 25, 30, 0.65)',
          card: '#16191E',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: '#1C2026',
        },
        brand: {
          cyan: '#00E5FF',
          glow: 'rgba(0, 229, 255, 0.4)',
          accent: '#448AFF',
        },
        status: {
          critical: '#FF2A2A',
          warning: '#FFAB00',
          ok: '#00E676',
          info: '#448AFF',
        },
        text: {
          primary: '#F0F4F8',
          secondary: '#A0ABC0',
          muted: '#626F86',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 4s linear infinite',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
