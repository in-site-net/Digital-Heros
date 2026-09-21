import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1512",
        surface: "#141F1A",
        surface2: "#1B2922",
        line: "#2A3B33",
        parchment: "#F4F1E8",
        muted: "#8FA096",
        brass: "#D9A441",
        "brass-dim": "#8A6B2A",
        leaf: "#5FBE7C",
        "leaf-dim": "#2E4A38",
        clay: "#C7674B",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
