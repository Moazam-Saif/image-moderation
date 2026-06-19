/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#f4f1ea',
        sand:      '#b49d6f',
        'sand-dark': '#9a8455',
        terra:     '#a56c6c',
        'terra-dark': '#8a5353',
        mist:      '#d9d9d9',
        bark:      '#2c2416',
        'bark-mid': '#5a4a30',
        ink:       '#1a1208',
        fog:       '#e8e4db',
        silver:    '#9a9080',
        cream:     '#faf8f3',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Mono', 'monospace'],
      },
      borderRadius: {
        pill: '100px',
      },
    },
  },
  plugins: [],
}
