import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      fontFamily: {
        nunito: ["Nunito", "sans-serif"],
      },
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        xp: {
          DEFAULT: "hsl(var(--xp))",
          foreground: "hsl(var(--xp-foreground))",
        },
        nav: {
          active: "hsl(var(--nav-active))",
          inactive: "hsl(var(--nav-inactive))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
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
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "tiger-pop": {
          "0%": { transform: "scale(0) rotate(-20deg)", opacity: "0" },
          "60%": { transform: "scale(1.15) rotate(8deg)", opacity: "1" },
          "80%": { transform: "scale(0.95) rotate(-4deg)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "tiger-wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(420px) rotate(720deg)", opacity: "0" },
        },
        "xp-pop": {
          "0%": { transform: "scale(0.4)", opacity: "0" },
          "60%": { transform: "scale(1.3)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "stamp-in": {
          "0%": { transform: "scale(3) rotate(-25deg)", opacity: "0" },
          "70%": { transform: "scale(0.9) rotate(-12deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-12deg)", opacity: "0.85" },
        },
        "title-pop": {
          "0%": { transform: "scale(0.6) translateY(20px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "item-drop": {
          "0%": { transform: "translateY(-120px) scale(0.4) rotate(-30deg)", opacity: "0" },
          "60%": { transform: "translateY(10px) scale(1.15) rotate(8deg)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1) rotate(0deg)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-soft": "bounce-soft 0.4s ease-in-out",
        "tiger-pop": "tiger-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "tiger-wiggle": "tiger-wiggle 1.8s ease-in-out infinite",
        "confetti-fall": "confetti-fall 2.8s ease-in forwards",
        "xp-pop": "xp-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s both",
        "stamp-in": "stamp-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both",
        "title-pop": "title-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both",
        "fade-in": "fade-in 0.4s ease-out both",
        "item-drop": "item-drop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
