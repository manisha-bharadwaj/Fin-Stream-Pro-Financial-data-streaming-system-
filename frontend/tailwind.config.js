/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-primary': '#0f1117',
                'bg-secondary': '#161b22',
                'bg-card': '#1a1f2e',
                'border-color': '#30363d',
                'text-primary': '#e6edf3',
                'text-muted': '#8b949e',
            },
            animation: {
                'pulse-dot': 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fadeIn': 'fadeIn 0.5s ease-out',
                'dropFlash': 'dropFlash 0.5s ease-in-out',
            },
        },
    },
    plugins: [],
}
