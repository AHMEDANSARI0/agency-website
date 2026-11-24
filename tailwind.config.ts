import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--of-color-primary)",
          hover: "var(--of-color-primary-hover)",
          active: "var(--of-color-primary-active)",
          foreground: "var(--of-color-primary-fg)",
        },
        secondary: {
          DEFAULT: "var(--of-color-secondary)",
          foreground: "var(--of-color-secondary-fg)",
        },
        accent: {
          DEFAULT: "var(--of-color-accent)",
          subtle: "var(--of-color-accent-subtle)",
        },
        electric: {
          DEFAULT: "var(--of-color-electric)",
          cyan: "var(--of-color-cyan)",
          subtle: "var(--of-color-cyan-subtle)",
        },
        canvas: "var(--of-color-bg)",
        surface: {
          DEFAULT: "var(--of-color-surface)",
          elevated: "var(--of-color-surface-elevated)",
          muted: "var(--of-color-surface-muted)",
          tertiary: "var(--of-color-bg-tertiary, var(--of-color-surface-muted))",
          navbar: "var(--of-surface-navbar)",
          footer: "var(--of-surface-footer)",
          card: "var(--of-surface-card)",
          input: "var(--of-surface-input)",
          modal: "var(--of-surface-modal)",
          glass: "var(--of-surface-glass)",
        },
        ink: {
          heading: "var(--of-color-heading)",
          body: "var(--of-color-body)",
          muted: "var(--of-color-muted)",
          navbar: "var(--of-text-navbar)",
        },
        line: {
          DEFAULT: "var(--of-color-border)",
          subtle: "var(--of-color-border-subtle, var(--of-color-border))",
          strong: "var(--of-color-border-strong)",
          glass: "var(--of-border-glass)",
        },
        link: {
          DEFAULT: "var(--of-color-link)",
          hover: "var(--of-color-link-hover)",
          active: "var(--of-color-link-active)",
        },
        status: {
          success: "var(--of-color-success)",
          warning: "var(--of-color-warning)",
          error: "var(--of-color-error)",
        },
      },
      boxShadow: {
        card: "var(--of-shadow-card)",
        elevated: "var(--of-shadow-elevated)",
        glow: "var(--of-shadow-glow)",
      },
      backgroundImage: {
        "brand-gradient": "var(--of-gradient-brand)",
        "hero-glow": "var(--of-gradient-hero)",
      },
      borderRadius: {
        sm: "var(--of-radius-sm)",
        control: "var(--of-radius-control)",
        card: "var(--of-radius-card)",
        feature: "var(--of-radius-feature)",
        "soale-btn": "var(--of-radius-soale-btn, 1.0625rem)",
        "soale-card": "var(--of-radius-soale-card, 1.5rem)",
        "soale-chip": "var(--of-radius-soale-chip, 0.875rem)",
      },
      spacing: {
        "section-sm": "var(--of-section-py-sm)",
        section: "var(--of-section-py)",
        "section-lg": "var(--of-section-py-lg)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: [
          "var(--of-font-heading, var(--font-sans))",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
