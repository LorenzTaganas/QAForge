/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        qf: {
          bg: '#101116',
          sidebar: '#171922',
          surface: '#1C1F2A',
          card: '#222532',
          input: '#191C26',
          border: '#303443',
          'border-strong': '#3B4053',
          text: '#F0F1F5',
          secondary: '#A3A8B7',
          muted: '#777E90',
          primary: '#7C6CF2',
          'primary-hover': '#9184FF',
          success: '#35B77A',
          warning: '#E7A94B',
          danger: '#F06B70',
          info: '#59A8F5',
        },
        // Backwards-compatible aliases used by the existing pages.
        jira: {
          bg: '#101116',
          sidebar: '#171922',
          surface: '#1C1F2A',
          'surface-2': '#222532',
          'surface-3': '#262A38',
          border: '#303443',
          text: '#F0F1F5',
          muted: '#A3A8B7',
          faint: '#777E90',
          blue: '#7C6CF2',
          'blue-soft': '#9184FF',
          purple: '#7C6CF2',
          success: '#35B77A',
          warning: '#E7A94B',
          danger: '#F06B70',
          info: '#59A8F5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 24px -16px rgba(0, 0, 0, 0.7)',
        popover: '0 12px 32px -8px rgba(0, 0, 0, 0.75)',
        lift: '0 18px 40px -12px rgba(0, 0, 0, 0.8)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-4px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out both',
        'slide-in': 'slide-in 0.18s ease-out both',
      },
    },
  },
  plugins: [],
}
