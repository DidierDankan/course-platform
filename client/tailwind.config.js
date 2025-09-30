/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  safelist: [
    "top-0",
    "right-0",
    "bottom-0",
    "left-0",
    "inset-0",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
