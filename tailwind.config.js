/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#070B14',
        secondary: '#0F1629',
        tertiary: '#1A2240',
        indigo: {
          light: '#A5B4FC',
          DEFAULT: '#6366F1',
          dark: '#3730A3',
        },
        silver: {
          light: '#E8E8F0',
          DEFAULT: '#C0C0E0',
        },
        moonlight: '#F0E6FF',
        text: {
          primary: '#FFFFFF',
          secondary: '#9CA3C0',
        },
      },
      backgroundImage: {
        'gradient-midnight': 'linear-gradient(135deg, #070B14 0%, #0F1629 50%, #1A2240 100%)',
        'gradient-silver': 'linear-gradient(180deg, #C0C0E0 0%, #E8E8F0 100%)',
        'gradient-card': 'linear-gradient(180deg, #1A2240 0%, #0F1629 100%)',
        'gradient-indigo': 'linear-gradient(135deg, #A5B4FC 0%, #6366F1 50%, #A5B4FC 100%)',
      },
      fontFamily: {
        'title': ['Cormorant Garamond', 'serif'],
      },
      boxShadow: {
        'moonlight': '0 0 20px rgba(240, 230, 255, 0.3)',
        'moonlight-lg': '0 0 40px rgba(240, 230, 255, 0.5)',
      },
    },
  },
  plugins: [],
}
