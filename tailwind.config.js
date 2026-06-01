/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0a0a0a',
        ink: '#a3a3a3',
        surface: '#171717',
        slate: {
          50: '#171717',
          100: '#262626',
          200: '#404040',
          300: '#525252',
          400: '#737373',
          500: '#a3a3a3',
          600: '#b7b7b7',
          700: '#d4d4d4',
          800: '#e5e5e5',
          900: '#f5f5f5',
        },
        teal: {
          50: '#052e2b',
          100: '#134e4a',
          200: '#115e59',
          300: '#2dd4bf',
          600: '#10b981',
          700: '#34d399',
          800: '#6ee7b7',
        },
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.18), 0 1px 2px -1px rgba(0, 0, 0, 0.18)',
        'card-hover': '0 10px 15px -3px rgba(16, 185, 129, 0.10), 0 4px 6px -4px rgba(16, 185, 129, 0.10)',
        button: '0 4px 6px -4px rgba(16, 185, 129, 0.22)',
        'button-hover': '0 10px 15px -3px rgba(16, 185, 129, 0.16), 0 4px 6px -4px rgba(16, 185, 129, 0.16)',
      },
      spacing: {
        'section': '2rem',
        'card': '1rem',
      },
    },
  },
  plugins: [],
}
