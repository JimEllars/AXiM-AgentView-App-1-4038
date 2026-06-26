/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'axim-teal': '#14b8a6', // Teal 500
        'void': '#050505',
      }
    }
  },
  plugins: [],
}
