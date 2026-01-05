/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#47e0ca',
        'surface-900': '#0b0f1c',
        'surface-800': '#131827'
      }
    }
  },
  plugins: []
};
