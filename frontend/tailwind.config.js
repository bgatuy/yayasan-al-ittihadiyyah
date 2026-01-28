/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        // Sesuaikan kode warna ini dengan brand Yayasan Anda
        primary: '#0f766e',
        secondary: '#134e4a',
        accent: '#fbbf24',    // Kuning/Emas (amber-500)
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}