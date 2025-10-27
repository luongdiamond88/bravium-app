/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#00fff2',
          dark: '#041f20',
          light: '#0af0ff',
          accent: '#07a3a3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        glow: '0 0 15px rgba(0,255,242,0.4)',
      },
      backgroundImage: {
        'bravium-gradient': 'linear-gradient(135deg, #041f20 0%, #062b2e 100%)',
      },
    },
  },
  plugins: [],
}
