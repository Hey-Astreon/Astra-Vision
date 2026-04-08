/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'vscode-bg': '#1e1e1e',
        'vscode-sidebar': '#252526',
        'vscode-panel': '#2d2d2d',
        'vscode-activity': '#333333',
        'vscode-input': '#3c3c3c',
        'vscode-border': '#3c3c3c',
        'vscode-focus': '#007acc',
        'vscode-text': '#cccccc',
        'vscode-heading': '#ffffff',
        'vscode-muted': '#858585',
        'vscode-placeholder': '#6b6b6b',
        'vscode-hover': '#2a2d2e',
        'vscode-selected': '#37373d',
        'vscode-primary': '#007acc',
        'vscode-secondary': '#4ec9b0',
        'vscode-warning': '#d7ba7d',
        'vscode-danger': '#f14c4c',
        'vscode-string': '#ce9178',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'sans': ['IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
