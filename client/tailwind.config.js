/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-end': 'var(--color-primary-end)',
        accent: 'var(--color-accent)',
        heading: '#1B2437',
        body: '#6B7280',
        'star-empty': '#E4E7EC',
        'star-filled': '#FBBF24',
        footer: '#3C4451',
        sidebar: '#1E2130',
        'admin-bg': '#F5F7FF',
        'admin-heading': '#1B2144',
        'admin-body': '#6B7280',
      },
      fontFamily: {
        sans: ['Assistant', 'Heebo', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        popIn: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        popIn: 'popIn 180ms ease-out',
      },
    },
  },
  plugins: [],
};
