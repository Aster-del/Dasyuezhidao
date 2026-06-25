/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1F1B16",
        cream: "#FBF6EE",
        saffron: "#E08A2C",
        clay: "#B6492C",
        leaf: "#3F6B4A",
        line: "#E7DECC",
      },
      fontFamily: {
        display: ["'Noto Serif TC'", "serif"],
        body: ["'Noto Sans TC'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
