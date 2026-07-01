/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'vscode-bg': '#07080d',
        'vscode-sidebar': '#0f111a',
        'vscode-panel': '#141622',
        'vscode-activity': '#0b0c13',
        'vscode-input': '#181a29',
        'vscode-border': '#222638',
        'vscode-focus': '#4f46e5',
        'vscode-text': '#e2e8f0',
        'vscode-heading': '#ffffff',
        'vscode-muted': '#94a3b8',
        'vscode-placeholder': '#475569',
        'vscode-hover': '#1e2235',
        'vscode-selected': '#2c314c',
        'vscode-primary': '#4f46e5',
        'vscode-secondary': '#10b981',
        'vscode-warning': '#f59e0b',
        'vscode-danger': '#ef4444',
        'vscode-string': '#34d399',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'sans': ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
