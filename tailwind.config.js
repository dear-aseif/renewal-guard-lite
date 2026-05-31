/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f4f7f6',
        ink: '#173b3a',
      },
      boxShadow: {
        card: '0 14px 35px -24px rgba(15, 118, 110, 0.35)',
      },
    },
  },
  plugins: [],
}
