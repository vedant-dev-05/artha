import type { Config } from "tailwindcss";

/**
 * Design tokens ported from `wireframes/artha_design_system.md`.
 * Values are exposed as CSS variables in globals.css so a future dark theme
 * can override them without rewriting component class names.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: {
          DEFAULT: "var(--color-surface)",
          dim: "var(--color-surface-dim)",
          bright: "var(--color-surface-bright)",
          variant: "var(--color-surface-variant)",
          lowest: "var(--color-surface-lowest)",
          low: "var(--color-surface-low)",
          container: "var(--color-surface-container)",
          high: "var(--color-surface-high)",
          highest: "var(--color-surface-highest)",
        },
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        outline: "var(--color-outline)",
        "outline-variant": "var(--color-outline-variant)",
        primary: "var(--color-primary)",
        "on-primary": "var(--color-on-primary)",
        "primary-container": "var(--color-primary-container)",
        "on-primary-container": "var(--color-on-primary-container)",
        secondary: "var(--color-secondary)",
        "on-secondary": "var(--color-on-secondary)",
        "secondary-container": "var(--color-secondary-container)",
        "on-secondary-container": "var(--color-on-secondary-container)",
        accent: "var(--color-accent)",
        "accent-soft": "var(--color-accent-soft)",
        "on-accent": "var(--color-on-accent)",
        success: "var(--color-success)",
        "on-success": "var(--color-on-success)",
        "success-container": "var(--color-success-container)",
        "on-success-container": "var(--color-on-success-container)",
        warning: "var(--color-warning)",
        "on-warning": "var(--color-on-warning)",
        "warning-container": "var(--color-warning-container)",
        "on-warning-container": "var(--color-on-warning-container)",
        error: "var(--color-error)",
        "on-error": "var(--color-on-error)",
        "error-container": "var(--color-error-container)",
        "on-error-container": "var(--color-on-error-container)",
        "inverse-surface": "var(--color-inverse-surface)",
        "inverse-on-surface": "var(--color-inverse-on-surface)",
        scrim: "var(--color-scrim)",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "12px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },
      spacing: {
        "gutter-xs": "4px",
        "gutter-sm": "8px",
        "gutter-md": "12px",
        "gutter-lg": "16px",
        "gutter-xl": "24px",
        section: "32px",
        "page-margin": "16px",
        nav: "72px",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        headline: ["var(--font-display)", "sans-serif"],
        title: ["var(--font-body)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        label: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "display-lg": [
          "40px",
          { lineHeight: "44px", letterSpacing: "-0.75px", fontWeight: "700" },
        ],
        "display-lg-mobile": [
          "32px",
          { lineHeight: "36px", letterSpacing: "-0.5px", fontWeight: "700" },
        ],
        "headline-lg": [
          "28px",
          { lineHeight: "34px", letterSpacing: "-0.25px", fontWeight: "600" },
        ],
        "headline-md": [
          "22px",
          { lineHeight: "28px", letterSpacing: "-0.15px", fontWeight: "600" },
        ],
        "title-lg": [
          "18px",
          { lineHeight: "24px", letterSpacing: "0px", fontWeight: "600" },
        ],
        "title-md": [
          "16px",
          { lineHeight: "22px", letterSpacing: "0px", fontWeight: "600" },
        ],
        "body-lg": [
          "15px",
          { lineHeight: "22px", letterSpacing: "0px", fontWeight: "400" },
        ],
        "body-md": [
          "14px",
          { lineHeight: "20px", letterSpacing: "0px", fontWeight: "400" },
        ],
        "label-lg": [
          "14px",
          { lineHeight: "20px", letterSpacing: "0.1px", fontWeight: "600" },
        ],
        "label-md": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.2px", fontWeight: "600" },
        ],
        "label-sm": [
          "11px",
          { lineHeight: "14px", letterSpacing: "0.2px", fontWeight: "500" },
        ],
        "mono-md": [
          "13px",
          { lineHeight: "18px", letterSpacing: "0px", fontWeight: "500" },
        ],
      },
      boxShadow: {
        sm: "0 2px 10px rgba(1,45,29,0.05)",
        md: "0 8px 24px rgba(1,45,29,0.10)",
        sheet: "0 -12px 40px rgba(1,45,29,0.16)",
      },
      transitionDuration: {
        "state-change": "100ms",
        "surface-enter": "250ms",
        "surface-exit": "150ms",
      },
      transitionTimingFunction: {
        "state-change": "ease-out",
        "surface-enter": "cubic-bezier(0.2, 0, 0, 1)",
        "surface-exit": "cubic-bezier(0.3, 0, 1, 1)",
      },
      keyframes: {
        "sheet-in": {
          from: { transform: "translateY(24px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "progress-in": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
      },
      animation: {
        "sheet-in": "sheet-in 250ms cubic-bezier(0.2, 0, 0, 1)",
        "fade-in": "fade-in 150ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
