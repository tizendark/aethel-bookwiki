/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        primary: "var(--primary)",
        text: "var(--text)",
        muted: "var(--text-secondary)",
        border: "var(--border)",
        brand: {
          primary: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
          surface: "var(--brand-surface)",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0,0,0,0.2)',
        'editorial': '0 20px 40px rgba(0,0,0,0.4)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
