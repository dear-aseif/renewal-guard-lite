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
        card: '0 16px 40px -26px rgba(15, 23, 42, 0.28)',
        'card-hover': '0 20px 42px -24px rgba(15, 118, 110, 0.24)',
        button: '0 8px 16px -10px rgba(15, 118, 110, 0.8)',
        'button-hover': '0 10px 20px -10px rgba(15, 118, 110, 0.9)',
      },
    },
  },
  plugins: [],
}
