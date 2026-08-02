import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#141619",
        muted: "#8A909C",
        faint: "#B0B5BE",
        line: "#EDEFF2",
        line2: "#E3E6EA",
        canvas: "#FAFBFC",
        surface: "#FFFFFF",
        pine: "#1F3D36",
        pineSoft: "#EEF4F1",
        pineMid: "#2F5D50",
        pineInk: "#E8F0ED",
        pineFg: "#F2F6F4",
        pill: "#F4F5F7",
        section: "#6B7280",
        trash: "#D3D6DC",
        rowLine: "#F0F2F5",
        ownerDot: "#4A5568",
        docBody: "#26282D",
        conflictBg: "#FDF6EC",
        conflictBorder: "#F0E2C8",
        conflictText: "#8A5A18",
        danger: "#9A3B2E",
        dangerBg: "#FDECEA",
      },
      fontFamily: {
        serifDoc: [
          "var(--font-source-serif)",
          "Source Serif 4",
          "Charter",
          "Georgia",
          "serif",
        ],
      },
      borderRadius: {
        pill: "20px",
        row: "10px",
      },
      transitionDuration: {
        fast: "120ms",
      },
    },
  },
  plugins: [],
};

export default config;
