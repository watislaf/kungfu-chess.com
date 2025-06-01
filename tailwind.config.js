/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-1deg)" },
          "75%": { transform: "rotate(1deg)" },
        },
        "wiggle-black": {
          "0%, 100%": { transform: "rotate(180deg)" },
          "25%": { transform: "rotate(179deg)" },
          "75%": { transform: "rotate(181deg)" },
        },
        "king-threat": {
          "0%, 100%": { 
            "box-shadow": "0 0 0 0 rgba(239, 68, 68, 0.3)",
            "border-color": "transparent"
          },
          "50%": { 
            "box-shadow": "0 0 0 2px rgba(239, 68, 68, 0.2), 0 0 8px rgba(239, 68, 68, 0.3)",
            "border-color": "rgba(239, 68, 68, 0.4)"
          },
        },
        "glow": {
          "0%, 100%": { "box-shadow": "0 0 8px 2px rgba(59, 130, 246, 0.4)" },
          "50%": { "box-shadow": "0 0 12px 4px rgba(59, 130, 246, 0.6)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
        "damage-shake": {
          "0%, 100%": { transform: "translateX(0) translateY(0)" },
          "20%": { transform: "translateX(-1px) translateY(0.5px)" },
          "40%": { transform: "translateX(1px) translateY(-0.5px)" },
          "60%": { transform: "translateX(-0.5px) translateY(1px)" },
          "80%": { transform: "translateX(0.5px) translateY(-0.5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "wiggle": "wiggle 0.2s ease-in-out 3",
        "wiggle-black": "wiggle-black 0.2s ease-in-out 3",
        "glow": "glow 1.5s ease-in-out infinite alternate",
        "king-threat": "king-threat 6s ease-in-out infinite alternate",
        "fade-in": "fade-in 0.3s ease-in forwards",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shake": "shake 0.6s ease-in-out",
        "damage-shake": "damage-shake 0.4s ease-in-out",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 