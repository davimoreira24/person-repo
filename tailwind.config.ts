import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E6C357",
          foreground: "#0B1324",
        },
        secondary: {
          DEFAULT: "#1F2945",
          foreground: "#E6F3FF",
        },
        accent: {
          DEFAULT: "#2A94F4",
          muted: "#274273",
        },
        neutral: {
          DEFAULT: "#10182A",
          foreground: "#F5F6FA",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(64, 155, 255, 0.45)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 20% 20%, rgba(64,155,255,0.2), transparent 60%), radial-gradient(circle at 80% 30%, rgba(230,195,87,0.2), transparent 55%), linear-gradient(135deg, rgba(16,24,42,0.95), rgba(12,18,32,0.85))",
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "poop-gross": {
          "0%, 100%": {
            filter: "brightness(1) hue-rotate(0deg)",
            opacity: "0.92",
          },
          "50%": {
            filter: "brightness(1.12) hue-rotate(-12deg)",
            opacity: "1",
          },
        },
        "poop-wobble": {
          "0%, 100%": { transform: "rotate(-0.55deg) scale(1)" },
          "50%": { transform: "rotate(0.55deg) scale(1.004)" },
        },
      },
      animation: {
        "poop-gross": "poop-gross 2.6s ease-in-out infinite",
        "poop-wobble": "poop-wobble 2.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

