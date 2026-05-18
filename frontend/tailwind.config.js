/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0B",
        card: "#18181B",
        border: "#27272A",
        primary: "#6D28D9", // Purple
        secondary: "#06B6D4", // Cyan
        accent: "#F43F5E", // Rose
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #6D28D9, 0 0 10px #6D28D9, 0 0 15px #6D28D9' },
          '100%': { boxShadow: '0 0 10px #06B6D4, 0 0 20px #06B6D4, 0 0 30px #06B6D4' },
        }
      }
    },
  },
  plugins: [],
}
