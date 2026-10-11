/** Config idéntica a la que iba inline con el Play CDN (retirado en jul 2026). */
module.exports = {
  content: ['./**/*.html', './assets/**/*.js', '!./node_modules/**'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        surface:    'hsl(var(--surface) / <alpha-value>)',
        'surface-2':'hsl(var(--surface-2) / <alpha-value>)',
        border:     'hsl(var(--border) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        muted:      'hsl(var(--muted) / <alpha-value>)',
        'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
        accent:     'hsl(var(--accent) / <alpha-value>)',
        'accent-2': 'hsl(var(--accent-2) / <alpha-value>)',
        'accent-dark': 'hsl(var(--accent-dark) / <alpha-value>)',
        'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      maxWidth: { container: '1280px', prose: '720px' },
      borderRadius: { card: '12px', btn: '8px' },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
