/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        p1: "#2f80ed",
        p2: "#70facb",
        s1: "#c8a762",
        a1: "#00b2ff",
      },
    },
  },
  plugins: [],
};
