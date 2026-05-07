/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        picard: {
          red: '#C8102E',
          navy: '#1A1A2E',
          gold: '#B8860B',
          cream: '#FAF7F2',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      boxShadow: {
        soft: '0 12px 40px -16px rgba(26, 26, 46, 0.25)',
        ring: '0 0 0 2px rgba(184, 134, 11, 0.7)',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(184, 134, 11, 0.5)' },
          '50%': { boxShadow: '0 0 0 12px rgba(184, 134, 11, 0)' },
        },
      },
      animation: {
        'pulse-gold': 'pulseGold 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
