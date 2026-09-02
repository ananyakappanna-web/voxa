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
        primary: {
          DEFAULT: '#D4A574',
          hover: '#E8B4B8',
          light: '#F5EDE8',
          dark: '#8B2635',
          subtle: 'rgba(212, 165, 116, 0.12)'
        },
        luxury: {
          black: '#0D0709',
          maroon: '#1A0E12',
          burgundy: '#5C1A2B',
          deepMaroon: '#2B0A12',
          card: '#160B0F',
          cardHover: '#231117',
          cardBorder: 'rgba(212, 165, 116, 0.15)',
          cardBorderHover: 'rgba(232, 180, 184, 0.35)',
          
          gold: '#D4A574',
          goldLight: '#E5C396',
          rose: '#E8B4B8',
          ruby: '#C97B8A',
          deepRose: '#8B2635',
          
          cream: '#F5EDE8',
          muted: '#A8888D',
          mutedDark: '#6E5559',
          
          like: '#C97B8A',
          likeGlow: 'rgba(201, 123, 138, 0.25)',
          repost: '#D4A574',
          repostGlow: 'rgba(212, 165, 116, 0.25)',
          bookmark: '#E8B4B8',
          bookmarkGlow: 'rgba(232, 180, 184, 0.25)'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Cinzel"', '"Playfair Display"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'luxury-glow': '0 0 30px -5px rgba(201, 123, 138, 0.25)',
        'luxury-card': '0 8px 32px 0 rgba(13, 7, 9, 0.6)',
        'luxury-gold': '0 4px 20px -2px rgba(212, 165, 116, 0.3)',
        'luxury-rose': '0 4px 25px -2px rgba(201, 123, 138, 0.35)'
      },
      backgroundImage: {
        'metallic-gradient': 'linear-gradient(135deg, #E8B4B8 0%, #D4A574 35%, #C97B8A 70%, #8B2635 100%)',
        'gold-gradient': 'linear-gradient(135deg, #F5EDE8 0%, #D4A574 50%, #C97B8A 100%)',
        'dark-radial': 'radial-gradient(ellipse at top, #2B0A12 0%, #0D0709 70%)',
        'glow-radial': 'radial-gradient(circle at 50% 0%, rgba(92, 26, 43, 0.3) 0%, rgba(13, 7, 9, 0) 75%)'
      }
    },
  },
  plugins: [],
}
