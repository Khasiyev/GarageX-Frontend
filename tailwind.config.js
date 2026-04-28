/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        skin: {
          bg: 'var(--skin-bg)',
          card: 'var(--skin-card)',
          input: 'var(--skin-input)',
          border: 'var(--skin-border)',
          hover: 'var(--skin-hover)',
          text: 'var(--skin-text)',
          text2: 'var(--skin-text2)',
          text3: 'var(--skin-text3)',
          sidebar: 'var(--skin-sidebar)',
        },
      },
    },
  },
  plugins: [],
};
