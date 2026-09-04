/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        canvas: '#0a0a0a',
        ink: '#a3a3a3',
        surface: '#171717',
        // Archive neutral foundation — darkness form of #1D1B16
        inkbase: '#1D1B16',
        // Archive primary accent (lime #9EE66E) — replaces emerald as main accent
        lime: {
          50: '#f2fbe4',
          100: '#e3f7cc',
          200: '#cbf0a3',
          300: '#aeea77',
          400: '#9EE66E',
          500: '#8fd85c',
          600: '#74b944',
          700: '#5a9137',
          800: '#46712c',
          900: '#3a5a27',
        },
        // Archive secondary accent (warm gold #FFD96A)
        gold: {
          200: '#FFE9A8',
          300: '#FFE07A',
          400: '#FFD96A',
          500: '#F2C94C',
          600: '#D9A62B',
        },
        // Archive tertiary accent (honey #EECB69)
        honey: {
          300: '#F5DE9A',
          400: '#EECB69',
          500: '#DDB54E',
        },
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
        card: '22px',
        'card-lg': '28px',
        'card-xl': '34px',
        pill: '100px',
      },
      boxShadow: {
        card: '0 18px 45px 0 rgba(60, 49, 27, 0.1), 0 16px 34px 0 rgba(60, 49, 27, 0.12)',
        'card-hover': '0 24px 70px 0 rgba(60, 49, 27, 0.16), 0 18px 45px 0 rgba(60, 49, 27, 0.1)',
        hero: '0 24px 70px 0 rgba(60, 49, 27, 0.14)',
        button: '0 4px 6px -4px rgba(158, 230, 110, 0.22)',
        'button-hover': '0 10px 15px -3px rgba(158, 230, 110, 0.2), 0 4px 6px -4px rgba(158, 230, 110, 0.16)',
      },
      spacing: {
        'section': '2rem',
        'card': '1rem',
      },
    },
  },
  plugins: [],
}