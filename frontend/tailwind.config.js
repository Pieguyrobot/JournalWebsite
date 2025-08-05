/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        red: '#FF0000',
        darkred: '#8B0000',
      },
    },
  },
  plugins: [],
}