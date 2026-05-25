/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#f97316',   // orange-500 - sporty
        secondary: '#1e293b', // slate-800
      },
    },
  },
  plugins: [],
};
