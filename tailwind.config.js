/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          50: '#fdfbf7',
          100: '#f7f1e6',
          200: '#eedcc2',
          300: '#e3c298',
          400: '#d5a16d',
          500: '#c58448',
          600: '#a7673a',
          700: '#864f31',
          800: '#6d402b',
          900: '#5a3526',
          950: '#321c13',
        },
        shelf: {
          light: '#a67c52',
          DEFAULT: '#7a5230',
          dark: '#4f331c',
          shadow: '#2a1a0d',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      boxShadow: {
        'shelf': '0 12px 24px -6px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
        'book': '2px 4px 10px rgba(0, 0, 0, 0.35), inset -1px 0 2px rgba(255, 255, 255, 0.15)',
        'book-hover': '-4px 8px 18px rgba(0, 0, 0, 0.5), inset -2px 0 4px rgba(255, 255, 255, 0.25)',
      }
    },
  },
  plugins: [],
};
