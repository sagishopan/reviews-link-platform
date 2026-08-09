/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    borderRadius: {
      'none': '0px',
      'sm': '2px',
      'md': '4px',
      'lg': '0px',
      'xl': '0px',
      '2xl': '4px',
      '3xl': '8px',
      'full': '9999px',
    },
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-end': 'var(--color-primary-end)',
        accent: 'var(--color-accent)',
        heading: '#E84C89',
        body: '#6B7280',
        'star-empty': '#E4E7EC',
        'star-filled': '#FCD34D',
        footer: '#E84C89',
        sidebar: '#E84C89',
        'admin-bg': '#F5F7FF',
        'admin-heading': '#E84C89',
        'admin-body': '#6B7280',
      },
      fontFamily: {
        sans: ['Noto Sans', 'Assistant', 'Heebo', 'system-ui', 'sans-serif'],
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
