/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#12121a',
        'surface-hover': '#1a1a28',
        border: '#2a2a3a',
        'accent-blue': '#00e5ff',
        'accent-green': '#39ff14',
        'accent-blue-dim': 'rgba(0, 229, 255, 0.15)',
        'accent-green-dim': 'rgba(57, 255, 20, 0.15)',
        'text-dim': '#8888a0',
      },
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        body: ['Source Code Pro', 'monospace'],
      },
    },
  },
  plugins: [],
};
