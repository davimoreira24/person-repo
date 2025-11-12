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
    },
  },
  plugins: [],
};

export default config;

