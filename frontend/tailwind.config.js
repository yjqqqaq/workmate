/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3498db',
          dark: '#2980b9',
        },
        secondary: {
          DEFAULT: '#2ecc71',
          dark: '#27ae60',
        },
        accent: '#e74c3c',
        textColor: '#333',
        textLight: '#777',
        bgColor: '#f8f9fa',
        bgLight: '#ffffff',
        bgDark: '#e9ecef',
        borderColor: '#dee2e6',
      },
      boxShadow: {
        custom: '0 2px 10px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        custom: '6px',
      },
    },
  },
  plugins: [],
}