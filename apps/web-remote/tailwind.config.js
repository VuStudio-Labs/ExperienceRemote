/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        remote: {
          bg: '#0a0a0f',
          surface: '#12121a',
          border: '#2a2a3a',
          accent: '#6366f1',
          'accent-hover': '#818cf8',
        },
      },
    },
  },
  plugins: [],
};
