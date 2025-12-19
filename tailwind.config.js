/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          coral: {
            primary: '#FF6B6B',
            light: '#FF8787',
            dark: '#EE5A52',
          },
          peach: '#FFB88C',
          lavender: '#B8B5FF',
          mint: '#A8E6CF',
          cream: '#FFF4E6',
          bg: {
            primary: '#FFFBF5',
            secondary: '#FFF8F0',
            elevated: '#FFFFFF',
          },
          text: {
            primary: '#2D2D2D',
            secondary: '#6B6B6B',
            tertiary: '#9B9B9B',
          }
        },
        fontFamily: {
          display: ['Outfit', 'sans-serif'],
          body: ['"DM Sans"', 'sans-serif'],
          accent: ['"Plus Jakarta Sans"', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'monospace'],
        },
        borderRadius: {
          'sm': '12px',
          'md': '16px',
          'lg': '24px',
          'xl': '32px',
        },
        boxShadow: {
          'sm': '0 2px 8px rgba(255, 107, 107, 0.08)',
          'md': '0 4px 16px rgba(255, 107, 107, 0.12)',
          'lg': '0 8px 32px rgba(255, 107, 107, 0.16)',
          'xl': '0 16px 48px rgba(255, 107, 107, 0.2)',
          'glow-coral': '0 0 24px rgba(255, 107, 107, 0.4)',
          'glow-peach': '0 0 24px rgba(255, 184, 140, 0.4)',
          'glow-mint': '0 0 24px rgba(168, 230, 207, 0.4)',
        },
        animation: {
          'float': 'float 4s ease-in-out infinite',
          'pulse-slow': 'pulse 2s ease-in-out infinite',
          'shake': 'shake 0.4s ease-in-out',
        },
        keyframes: {
          float: {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
          },
          shake: {
            '0%, 100%': { transform: 'translateX(0)' },
            '25%': { transform: 'translateX(-10px)' },
            '75%': { transform: 'translateX(10px)' },
          },
        },
        backdropBlur: {
          xs: '2px',
        },
      },
    },
    plugins: [],
  }