/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          bg: '#FDFBF7', // Creamy white
          pink: '#FFD1DC',
          blue: '#AEC6CF',
          green: '#C1E1C1', // Tea Green
          yellow: '#FDFD96',
          lavender: '#E6E6FA',
          peach: '#FFDAC1',
          text: '#4A4A4A', // Soft gray text
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['"Nunito"', 'sans-serif'], // Rounded friendly font (will need to import or use system)
      }
    },
  },
  plugins: [],
}
