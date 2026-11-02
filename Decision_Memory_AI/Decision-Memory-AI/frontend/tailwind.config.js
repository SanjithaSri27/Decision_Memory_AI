/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gitlab: {
          dark: '#1f1e24',
          darker: '#17161a',
          purple: '#6b4fbb',
          light: '#ececef',
          border: '#302f34'
        }
      }
    },
  },
  plugins: [],
}

