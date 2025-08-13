/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': '#1a1a1a',
        'surface': '#2a2a2a',
        'surface-light': '#383838',
        'primary': '#00aaff',
        'primary-hover': '#0095e0',
        'text-main': '#e0e0e0',
        'text-secondary': '#a0a0a0',
        'border-color': '#444444',
      },
    },
  },
  plugins: [],
}
