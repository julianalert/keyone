import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // The marketing site has its own Tailwind v4 stylesheet (see postcss-tailwind.cjs)
    '!./app/[(]marketing[)]/**',
    '!./components/marketing/**',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F9F7F3',
        ink: '#1a1a18',
        'ink-muted': '#5F5E5A',
        'ink-subtle': '#888780',
        border: '#e0ddd7',
        'green-dark': '#3B6D11',
        'green-mid': '#97C459',
        'green-light': '#C0DD97',
        'green-pale': '#EAF3DE',
        cream: '#fff',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Instrument Serif', 'serif'],
      },
      borderWidth: {
        'half': '0.5px',
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
        xs: ['12px', { lineHeight: '1.4' }],
        sm: ['13px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.55' }],
        md: ['15px', { lineHeight: '1.6' }],
        lg: ['16px', { lineHeight: '1.65' }],
        xl: ['18px', { lineHeight: '1.65' }],
        '2xl': ['22px', { lineHeight: '1.3' }],
        '3xl': ['28px', { lineHeight: '1.2' }],
        '4xl': ['36px', { lineHeight: '1.2' }],
        '5xl': ['42px', { lineHeight: '1.15' }],
        '6xl': ['54px', { lineHeight: '1.12' }],
      },
    },
  },
  plugins: [],
}

export default config
