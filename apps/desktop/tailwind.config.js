/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#1a1a2e',
          surface: '#16213e',
          border: '#2a2a4a',
          accent: '#6366f1',
        },
      },
    },
  },
  plugins: [],
};
