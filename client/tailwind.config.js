/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Jira-inspired dark palette
        jira: {
          bg: '#0B0E12',
          sidebar: '#0E1116',
          surface: '#1B1F23',
          'surface-2': '#22272B',
          'surface-3': '#2D333B',
          border: '#2D333B',
          text: '#D1D6DE',
          muted: '#8C9097',
          blue: '#0065FF',
          'blue-soft': '#0052CC',
          purple: '#62666C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.18)',
        glow: '0 0 0 1px rgba(0, 101, 255, 0.25), 0 8px 30px rgba(0, 101, 255, 0.18)',
        card: '0 18px 50px -12px rgba(0, 0, 0, 0.7)',
        lift: '0 24px 60px -20px rgba(0, 0, 0, 0.75)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-6px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'slide-in': 'slide-in 0.3s ease-out both',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}