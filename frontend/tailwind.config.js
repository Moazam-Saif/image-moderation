/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Angel Armor palette
        cream:    '#ffffff',
        silver:   '#c2c2c2',
        fog:      '#e2e2e2',
        gold:     '#ac956a',
        'gold-dark': '#96804f',
        bark:     '#6a5b40',
        'bark-dark': '#524630',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
