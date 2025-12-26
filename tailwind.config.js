/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                euro: {
                    blue: '#0e47cb',
                    dark: '#003399',
                    light: '#f0f4ff',
                    yellow: '#ffcc00'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [
        require("tailwindcss-animate")
    ],
}
