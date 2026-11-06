/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sci-Fi Glassmorphic palette mapped to jira keys for full compatibility
        jira: {
          bg: '#070B14',
          sidebar: '#0A101E',
          surface: '#101726',
          'surface-2': '#172138',
          'surface-3': '#23324F',
          border: '#2B416C',
          text: '#DDE5F2',
          muted: '#8B97A9',
          blue: '#00F0FF',
          'blue-soft': '#00C2CF',
          purple: '#8B5CF6',
        },
        sci: {
          bg: '#070B14',
          surface: '#101726',
          'surface-2': '#172138',
          'surface-3': '#23324F',
          border: '#2B416C',
          text: '#DDE5F2',
          muted: '#8B97A9',
          cyan: '#00F0FF',
          blue: '#3B82F6',
          glow: 'rgba(0, 240, 255, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sci: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 10px rgba(0, 240, 255, 0.1)',
        glow: '0 0 15px rgba(0, 240, 255, 0.2), 0 0 30px rgba(0, 120, 255, 0.1)',
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
