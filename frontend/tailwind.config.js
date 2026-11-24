/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        echo: {
          bg: '#020713',
          'bg-secondary': '#061222',
          'card': '#07182B',
          'card-hover': '#0C233D',
          'cyan': '#00D9FF',
          'blue': '#167BFF',
          'purple': '#925CFF',
          'white': '#F4F8FF',
          'muted': '#9FB2CA',
          'green': '#00E6A0',
          'border': 'rgba(0, 217, 255, 0.15)',
          'border-strong': 'rgba(0, 217, 255, 0.35)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Orbitron', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 217, 255, 0.45)',
        'glow-blue': '0 0 25px -5px rgba(22, 123, 255, 0.45)',
        'glow-purple': '0 0 25px -5px rgba(146, 92, 255, 0.45)',
        'glow-green': '0 0 25px -5px rgba(0, 230, 160, 0.45)',
        'glass': '0 8px 32px 0 rgba(0, 7, 25, 0.37)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% 50%, rgba(0, 217, 255, 0.15) 0%, transparent 70%)',
        'grid-pattern': 'linear-gradient(to right, rgba(0, 217, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 217, 255, 0.05) 1px, transparent 1px)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
      }
    },
  },
  plugins: [],
}
