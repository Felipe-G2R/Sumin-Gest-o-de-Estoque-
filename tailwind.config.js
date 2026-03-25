/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FDFA',
          500: '#0D9488',
          700: '#0F766E',
        },
        neutral: {
          50: '#F8FAFC',
          200: '#E2E8F0',
          800: '#1E293B',
        },
        destructive: {
          500: '#EF4444',
        },
        warning: {
          500: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
