import type { Config } from "tailwindcss";

/**
 * Toutes les valeurs viennent des tokens CSS (src/app/globals.css).
 * Les échelles Tailwind par défaut sont REMPLACÉES (pas étendues) pour
 * interdire les valeurs hors système : espacements, tailles, rayons.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      bg: "var(--bg)",
      surface: "var(--surface)",
      sunken: "var(--surface-sunken)",
      line: "var(--line)",
      "line-strong": "var(--line-strong)",
      text: "var(--text)",
      "text-2": "var(--text-2)",
      "text-3": "var(--text-3)",
      accent: "var(--accent)",
      "accent-soft": "var(--accent-soft)",
      "accent-strong": "var(--accent-strong)",
      cta: "var(--cta)",
      "cta-hover": "var(--cta-hover)",
      "cta-text": "var(--cta-text)",
      "cta-soft": "var(--cta-soft)",
      "cta-deep": "var(--cta-deep)",
      nav: "var(--nav-bg)",
      "nav-text": "var(--nav-text)",
      "nav-muted": "var(--nav-muted)",
      "nav-hover": "var(--nav-hover)",
      "nav-active": "var(--nav-active)",
      success: "var(--success)",
      "success-soft": "var(--success-soft)",
      danger: "var(--danger)",
      "danger-soft": "var(--danger-soft)",
      warning: "var(--warning)",
      "warning-soft": "var(--warning-soft)",
      white: "#ffffff",
    },
    spacing: {
      0: "0",
      px: "1px",
      0.5: "2px",
      1: "4px",
      2: "8px",
      3: "12px",
      4: "16px",
      5: "20px",
      6: "24px",
      8: "32px",
      10: "40px",
      12: "48px",
      16: "64px",
      20: "80px",
      24: "96px",
      // Tailles de mise en page (largeurs de colonnes, listes)
      40: "160px",
      60: "240px",
      64: "256px",
      80: "320px",
    },
    fontSize: {
      xs: ["12px", { lineHeight: "16px" }],
      sm: ["14px", { lineHeight: "20px" }],
      base: ["16px", { lineHeight: "24px" }],
      lg: ["18px", { lineHeight: "24px" }],
      xl: ["24px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
      "2xl": ["36px", { lineHeight: "40px", letterSpacing: "-0.02em" }],
      "3xl": ["48px", { lineHeight: "52px", letterSpacing: "-0.02em" }],
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    borderRadius: {
      none: "0",
      sm: "4px",
      md: "8px",
      lg: "12px",
      full: "9999px",
    },
    fontFamily: {
      sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
    },
    extend: {
      maxWidth: { page: "1280px", prose: "64ch" },
      boxShadow: { card: "var(--shadow-card)", cta: "var(--shadow-cta)" },
      transitionTimingFunction: { out: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    },
  },
  plugins: [],
};

export default config;
