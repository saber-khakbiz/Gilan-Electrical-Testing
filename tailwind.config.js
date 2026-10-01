// Tailwind CSS v3 config for the pre-compiled tailwind.css.
// Rebuild after adding or changing classes in index.html / script.js:
//   npx tailwindcss@3.4.19 -o tailwind.css --minify
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./index.html", "./script.js"],
    theme: {
        extend: {
            colors: {
                "navy-base": "#0a1128",
                "navy-card": "#101f42",
                "navy-border": "#1c2d5a",
                "amber-hazard": "#f59e0b",
                "amber-glow": "#fbbf24",
            },
            fontFamily: {
                sans: ["Vazirmatn", "sans-serif"],
            },
        },
    },
    plugins: [],
};