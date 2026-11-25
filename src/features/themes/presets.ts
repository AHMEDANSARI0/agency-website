import type {
  ArchivedThemeSnapshot,
  ThemeConfiguration,
  ThemeDesignTokens,
  ThemePreset,
  ThemeTokenSet,
} from "@/types/theme";

export const DEFAULT_DESIGN_SYSTEM_TOKENS: ThemeDesignTokens = {
  typography: "architectural",
  buttonStyle: "pill",
  borderRadius: "balanced",
  spacing: "comfortable",
  animationIntensity: "full",
};

/**
 * OmniFlow Light-First Signature Palette (Default)
 * - Clean white & cool grey layered surfaces (#F8FAFC / #FFFFFF / #F1F5F9)
 * - Deep charcoal & executive slate typography (#0B1120 / #334155 / #475569)
 * - Royal Indigo, Violet & Electric Blue accents (#4F46E5 / #6366F1 / #2563EB)
 * - 100% WCAG AA contrast verified across every foreground/surface pair
 */
export const OMNIFLOW_LIGHT_TOKENS: ThemeTokenSet = {
  colors: {
    primary: "#4F46E5",
    primaryHover: "#4338CA",
    primaryActive: "#3730A3",
    primaryForeground: "#FFFFFF",
    secondary: "#0F172A",
    secondaryForeground: "#F8FAFC",
    accent: "#6366F1",
    accentSubtle: "rgba(79, 70, 229, 0.08)",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceMuted: "#F1F5F9",
    heading: "#0B1120",
    body: "#334155",
    muted: "#475569",
    border: "#E2E8F0",
    borderStrong: "#CBD5E1",
    link: "#4338CA",
    linkHover: "#3730A3",
    linkActive: "#312E81",
    success: "#047857",
    warning: "#B45309",
    error: "#DC2626",
  },
  components: {
    navbarBg: "rgba(255, 255, 255, 0.88)",
    navbarBorder: "rgba(226, 232, 240, 0.9)",
    navbarText: "#0B1120",
    footerBg: "#0B1120",
    footerText: "#CBD5E1",
    cardBg: "#FFFFFF",
    cardBorder: "#E2E8F0",
    inputBg: "#FFFFFF",
    inputBorder: "#CBD5E1",
    inputFocusRing: "#4F46E5",
    dropdownBg: "#FFFFFF",
    modalBg: "#FFFFFF",
    modalOverlay: "rgba(15, 23, 42, 0.52)",
    badgeBg: "#EEF2FF",
    badgeText: "#3730A3",
    buttonDisabledBg: "#E2E8F0",
    buttonDisabledText: "#64748B",
    gradientFrom: "#4F46E5",
    gradientVia: "#6366F1",
    gradientTo: "#2563EB",
    gradientAngleDeg: 135,
    gradientIntensity: 11,
    shadowCard:
      "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 12px 32px -12px rgba(15, 23, 42, 0.08)",
    shadowElevated:
      "0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 24px 48px -14px rgba(15, 23, 42, 0.14)",
  },
};

/**
 * OmniFlow Midnight Charcoal-Navy Dark Mode
 * - Deep charcoal & midnight navy surfaces (#090D16 / #0F1624 / #162033)
 * - Crisp alabaster & cool slate typography (#F8FAFC / #CBD5E1 / #94A3B8)
 * - Cohesive Indigo / Violet / Electric Blue accents with WCAG AA button contrast
 */
export const OMNIFLOW_DARK_TOKENS: ThemeTokenSet = {
  colors: {
    primary: "#4F46E5",
    primaryHover: "#6366F1",
    primaryActive: "#4338CA",
    primaryForeground: "#FFFFFF",
    secondary: "#F8FAFC",
    secondaryForeground: "#090D16",
    accent: "#818CF8",
    accentSubtle: "rgba(99, 102, 241, 0.14)",
    background: "#090D16",
    surface: "#0F1624",
    surfaceElevated: "#162033",
    surfaceMuted: "#11192A",
    heading: "#F8FAFC",
    body: "#CBD5E1",
    muted: "#94A3B8",
    border: "#1E293B",
    borderStrong: "#334155",
    link: "#818CF8",
    linkHover: "#A5B4FC",
    linkActive: "#C7D2FE",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#F87171",
  },
  components: {
    navbarBg: "rgba(9, 13, 22, 0.86)",
    navbarBorder: "rgba(148, 163, 184, 0.16)",
    navbarText: "#F8FAFC",
    footerBg: "#060911",
    footerText: "#94A3B8",
    cardBg: "#0F1624",
    cardBorder: "#1E293B",
    inputBg: "#0B111E",
    inputBorder: "#334155",
    inputFocusRing: "#818CF8",
    dropdownBg: "#11192A",
    modalBg: "#11192A",
    modalOverlay: "rgba(2, 6, 23, 0.76)",
    badgeBg: "rgba(99, 102, 241, 0.18)",
    badgeText: "#C7D2FE",
    buttonDisabledBg: "#1E293B",
    buttonDisabledText: "#64748B",
    gradientFrom: "#4F46E5",
    gradientVia: "#6366F1",
    gradientTo: "#2563EB",
    gradientAngleDeg: 135,
    gradientIntensity: 18,
    shadowCard:
      "0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 14px 34px -12px rgba(0, 0, 0, 0.55)",
    shadowElevated:
      "0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 24px 52px -14px rgba(0, 0, 0, 0.72)",
  },
};

const COBALT_ENTERPRISE_LIGHT: ThemeTokenSet = {
  ...OMNIFLOW_LIGHT_TOKENS,
  colors: {
    ...OMNIFLOW_LIGHT_TOKENS.colors,
    primary: "#1D4ED8",
    primaryHover: "#1E40AF",
    primaryActive: "#1E3A8A",
    accent: "#2563EB",
    accentSubtle: "rgba(29, 78, 216, 0.08)",
    link: "#1D4ED8",
    linkHover: "#1E40AF",
    linkActive: "#1E3A8A",
  },
  components: {
    ...OMNIFLOW_LIGHT_TOKENS.components,
    inputFocusRing: "#1D4ED8",
    badgeBg: "#EFF6FF",
    badgeText: "#1E40AF",
    gradientFrom: "#1D4ED8",
    gradientVia: "#2563EB",
    gradientTo: "#4F46E5",
  },
};

const COBALT_ENTERPRISE_DARK: ThemeTokenSet = {
  ...OMNIFLOW_DARK_TOKENS,
  colors: {
    ...OMNIFLOW_DARK_TOKENS.colors,
    primary: "#1D4ED8",
    primaryHover: "#2563EB",
    primaryActive: "#1E40AF",
    accent: "#60A5FA",
    accentSubtle: "rgba(59, 130, 246, 0.15)",
    link: "#60A5FA",
    linkHover: "#93C5FD",
    linkActive: "#BFDBFE",
  },
  components: {
    ...OMNIFLOW_DARK_TOKENS.components,
    inputFocusRing: "#60A5FA",
    badgeBg: "rgba(59, 130, 246, 0.18)",
    badgeText: "#BFDBFE",
    gradientFrom: "#1D4ED8",
    gradientVia: "#2563EB",
    gradientTo: "#4F46E5",
  },
};

const EMERALD_OPS_LIGHT: ThemeTokenSet = {
  ...OMNIFLOW_LIGHT_TOKENS,
  colors: {
    ...OMNIFLOW_LIGHT_TOKENS.colors,
    primary: "#047857",
    primaryHover: "#065F46",
    primaryActive: "#064E3B",
    accent: "#059669",
    accentSubtle: "rgba(4, 120, 87, 0.08)",
    link: "#047857",
    linkHover: "#065F46",
    linkActive: "#064E3B",
  },
  components: {
    ...OMNIFLOW_LIGHT_TOKENS.components,
    inputFocusRing: "#047857",
    badgeBg: "#ECFDF5",
    badgeText: "#065F46",
    gradientFrom: "#047857",
    gradientVia: "#059669",
    gradientTo: "#0284C7",
  },
};

const EMERALD_OPS_DARK: ThemeTokenSet = {
  ...OMNIFLOW_DARK_TOKENS,
  colors: {
    ...OMNIFLOW_DARK_TOKENS.colors,
    primary: "#047857",
    primaryHover: "#059669",
    primaryActive: "#065F46",
    accent: "#34D399",
    accentSubtle: "rgba(16, 185, 129, 0.15)",
    link: "#34D399",
    linkHover: "#6EE7B7",
    linkActive: "#A7F3D0",
  },
  components: {
    ...OMNIFLOW_DARK_TOKENS.components,
    inputFocusRing: "#34D399",
    badgeBg: "rgba(16, 185, 129, 0.18)",
    badgeText: "#A7F3D0",
    gradientFrom: "#047857",
    gradientVia: "#059669",
    gradientTo: "#0284C7",
  },
};

const EDITORIAL_SLATE_LIGHT: ThemeTokenSet = {
  ...OMNIFLOW_LIGHT_TOKENS,
  colors: {
    ...OMNIFLOW_LIGHT_TOKENS.colors,
    primary: "#5B21B6",
    primaryHover: "#4C1D95",
    primaryActive: "#3B0764",
    accent: "#7C3AED",
    accentSubtle: "rgba(109, 40, 217, 0.08)",
    link: "#5B21B6",
    linkHover: "#4C1D95",
    linkActive: "#3B0764",
  },
  components: {
    ...OMNIFLOW_LIGHT_TOKENS.components,
    inputFocusRing: "#5B21B6",
    badgeBg: "#F5F3FF",
    badgeText: "#4C1D95",
    gradientFrom: "#5B21B6",
    gradientVia: "#6D28D9",
    gradientTo: "#4F46E5",
  },
};

const EDITORIAL_SLATE_DARK: ThemeTokenSet = {
  ...OMNIFLOW_DARK_TOKENS,
  colors: {
    ...OMNIFLOW_DARK_TOKENS.colors,
    primary: "#5B21B6",
    primaryHover: "#6D28D9",
    primaryActive: "#4C1D95",
    accent: "#A78BFA",
    accentSubtle: "rgba(139, 92, 246, 0.16)",
    link: "#A78BFA",
    linkHover: "#C4B5FD",
    linkActive: "#DDD6FE",
  },
  components: {
    ...OMNIFLOW_DARK_TOKENS.components,
    inputFocusRing: "#A78BFA",
    badgeBg: "rgba(139, 92, 246, 0.18)",
    badgeText: "#DDD6FE",
    gradientFrom: "#5B21B6",
    gradientVia: "#6D28D9",
    gradientTo: "#4F46E5",
  },
};

const CYBER_ARCHITECT_LIGHT: ThemeTokenSet = {
  ...OMNIFLOW_LIGHT_TOKENS,
  colors: {
    ...OMNIFLOW_LIGHT_TOKENS.colors,
    primary: "#3730A3",
    primaryHover: "#312E81",
    primaryActive: "#1E1B4B",
    accent: "#0284C7",
    accentSubtle: "rgba(2, 132, 199, 0.09)",
    link: "#3730A3",
    linkHover: "#1D4ED8",
    linkActive: "#1E3A8A",
  },
  components: {
    ...OMNIFLOW_LIGHT_TOKENS.components,
    inputFocusRing: "#0284C7",
    badgeBg: "#F0F9FF",
    badgeText: "#075985",
    gradientFrom: "#3730A3",
    gradientVia: "#2563EB",
    gradientTo: "#0891B2",
  },
};

const CYBER_ARCHITECT_DARK: ThemeTokenSet = {
  ...OMNIFLOW_DARK_TOKENS,
  colors: {
    ...OMNIFLOW_DARK_TOKENS.colors,
    primary: "#4338CA",
    primaryHover: "#4F46E5",
    primaryActive: "#3730A3",
    accent: "#38BDF8",
    accentSubtle: "rgba(56, 189, 248, 0.14)",
    link: "#38BDF8",
    linkHover: "#7DD3FC",
    linkActive: "#BAE6FD",
  },
  components: {
    ...OMNIFLOW_DARK_TOKENS.components,
    inputFocusRing: "#38BDF8",
    badgeBg: "rgba(56, 189, 248, 0.16)",
    badgeText: "#BAE6FD",
    gradientFrom: "#4338CA",
    gradientVia: "#2563EB",
    gradientTo: "#06B6D4",
  },
};

/**
 * OmniFlow Red Glass — Light Variant
 * Sophisticated charcoal (#17191F), clean off-white (#F5F6FA / #FFFFFF / #ECEEF4),
 * subtle frosted glass (rgba(255,255,255,0.68)), and controlled red accents (#EF2929 / #D91F28).
 */
export const OMNIFLOW_RED_GLASS_LIGHT: ThemeTokenSet = {
  colors: {
    primary: "#EF2929",
    primaryHover: "#D91F28",
    primaryActive: "#B81820",
    primaryForeground: "#FFFFFF",
    secondary: "#17191F",
    secondaryForeground: "#FFFFFF",
    accent: "#EF2929",
    accentSubtle: "#FFF0F0",
    background: "#F5F6FA",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceMuted: "#ECEEF4",
    heading: "#17191F",
    body: "#626875",
    muted: "#858B98",
    border: "#E2E5EC",
    borderStrong: "#CFD4DF",
    link: "#D91F28",
    linkHover: "#B81820",
    linkActive: "#99151B",
    success: "#047857",
    warning: "#B45309",
    error: "#D91F28",
  },
  components: {
    primaryButtonBg: "#EF2929",
    navbarBg: "rgba(255,255,255,0.68)",
    navbarBorder: "rgba(255,255,255,0.75)",
    navbarText: "#17191F",
    footerBg: "#101116",
    footerText: "#B6BAC5",
    cardBg: "#FFFFFF",
    cardBorder: "#E2E5EC",
    borderSecondary: "#ECEEF3",
    tertiaryBg: "#ECEEF4",
    glassBg: "rgba(255,255,255,0.68)",
    glassBorder: "rgba(255,255,255,0.75)",
    electricAccent: "#D91F28",
    cyanAccent: "#EF2929",
    cyanSubtle: "#FFF0F0",
    glowOpacity: 0.2,
    inputBg: "#FFFFFF",
    inputBorder: "#E2E5EC",
    inputFocusRing: "#EF2929",
    dropdownBg: "#FFFFFF",
    modalBg: "#FFFFFF",
    modalOverlay: "rgba(16, 17, 22, 0.52)",
    badgeBg: "#FFF0F0",
    badgeText: "#B81820",
    buttonDisabledBg: "#ECEEF4",
    buttonDisabledText: "#858B98",
    gradientFrom: "#EF2929",
    gradientVia: "#D91F28",
    gradientTo: "#17191F",
    gradientAngleDeg: 135,
    gradientIntensity: 6,
    shadowCard:
      "0 1px 2px 0 rgba(23, 25, 31, 0.04), 0 10px 28px -12px rgba(23, 25, 31, 0.07)",
    shadowElevated:
      "0 4px 14px -2px rgba(23, 25, 31, 0.06), 0 22px 44px -14px rgba(23, 25, 31, 0.12)",
  },
};

/**
 * OmniFlow Red Glass — Dark Variant
 * Deep neutral charcoal (#101116 / #17191F / #1D2028), crisp alabaster ink (#F5F6FA / #B6BAC5),
 * translucent dark glass (rgba(35,37,47,0.68)), and controlled red illumination (#FF3038 / #EF2929).
 */
export const OMNIFLOW_RED_GLASS_DARK: ThemeTokenSet = {
  colors: {
    primary: "#FF3038",
    primaryHover: "#FF5158",
    primaryActive: "#D91F28",
    primaryForeground: "#FFFFFF",
    secondary: "#F5F6FA",
    secondaryForeground: "#17191F",
    accent: "#FF3038",
    accentSubtle: "rgba(255,48,56,0.12)",
    background: "#101116",
    surface: "#191B23",
    surfaceElevated: "#20232D",
    surfaceMuted: "#17191F",
    heading: "#F5F6FA",
    body: "#B6BAC5",
    muted: "#858B98",
    border: "#30333E",
    borderStrong: "#3D4150",
    link: "#FF5158",
    linkHover: "#FF7076",
    linkActive: "#FFA1A5",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#FF5158",
  },
  components: {
    primaryButtonBg: "#EF2929",
    navbarBg: "rgba(35,37,47,0.68)",
    navbarBorder: "rgba(255,255,255,0.10)",
    navbarText: "#F5F6FA",
    footerBg: "#101116",
    footerText: "#B6BAC5",
    cardBg: "#191B23",
    cardBorder: "#30333E",
    borderSecondary: "#262933",
    tertiaryBg: "#1D2028",
    glassBg: "rgba(35,37,47,0.68)",
    glassBorder: "rgba(255,255,255,0.10)",
    electricAccent: "#EF2929",
    cyanAccent: "#FF3038",
    cyanSubtle: "rgba(255,48,56,0.12)",
    glowOpacity: 0.24,
    inputBg: "#17191F",
    inputBorder: "#30333E",
    inputFocusRing: "#FF3038",
    dropdownBg: "#20232D",
    modalBg: "#20232D",
    modalOverlay: "rgba(10, 11, 15, 0.76)",
    badgeBg: "rgba(255,48,56,0.12)",
    badgeText: "#FF7076",
    buttonDisabledBg: "#262933",
    buttonDisabledText: "#858B98",
    gradientFrom: "#EF2929",
    gradientVia: "#FF3038",
    gradientTo: "#20232D",
    gradientAngleDeg: 135,
    gradientIntensity: 9,
    shadowCard:
      "0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 12px 30px -12px rgba(0, 0, 0, 0.52)",
    shadowElevated:
      "0 1px 0 rgba(255, 255, 255, 0.07) inset, 0 22px 48px -14px rgba(0, 0, 0, 0.68)",
  },
};

export const OMNIFLOW_RED_GLASS_PRESET_ID = "omniflow-red-glass";

export const ORIGINAL_AGENCY_ARCHIVED_PRESET_ID =
  "original-agency-theme-archived";
export const ORIGINAL_AGENCY_ARCHIVED_PRESET_NAME =
  "Original Agency Theme — Archived";
export const ORIGINAL_AGENCY_ARCHIVED_VERSION = "1.0.0-archived";

export const SOALE_INSPIRED_PRESET_ID = "soale-inspired-premium-agency";
export const SOALE_INSPIRED_PRESET_NAME = "Soale Inspired — Premium Agency";

export const SOALE_INSPIRED_DESIGN_SYSTEM: ThemeDesignTokens = {
  typography: "editorial",
  buttonStyle: "rounded",
  borderRadius: "generous",
  spacing: "spacious",
  animationIntensity: "full",
};

/**
 * Soale Inspired — Premium Agency (Light Variant)
 * - Warm off-white canvas (#F7F6F3), crisp white cards (#FFFFFF), warm stone muted layer (#EFECE6)
 * - Deep charcoal primary text (#171518 — 16.8:1 AAA), readable secondary (#5E5A61 — 6.25:1 AA),
 *   and WCAG AA-adapted muted text (#6B656F — 5.23:1 AA on #F7F6F3 & 5.65:1 AA on #FFFFFF)
 * - Controlled royal violet (#6D199C — 8.56:1), deep plum (#1D0C49 — 17.48:1), and subtle burgundy (#7A1F4A)
 */
export const SOALE_PREMIUM_LIGHT: ThemeTokenSet = {
  colors: {
    primary: "#6D199C",
    primaryHover: "#581380",
    primaryActive: "#440D64",
    primaryForeground: "#FFFFFF",
    secondary: "#1D0C49",
    secondaryForeground: "#FFFFFF",
    accent: "#7A1F4A",
    accentSubtle: "#F3ECF7",
    background: "#F7F6F3",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceMuted: "#EFECE6",
    heading: "#171518",
    body: "#5E5A61",
    muted: "#6B656F",
    border: "#E5E1E7",
    borderStrong: "#CAC3D0",
    link: "#6D199C",
    linkHover: "#4E1073",
    linkActive: "#1D0C49",
    success: "#157347",
    warning: "#9A5B08",
    error: "#C92A2A",
  },
  components: {
    primaryButtonBg: "#6D199C",
    navbarBg: "rgba(247, 246, 243, 0.84)",
    navbarBorder: "rgba(229, 225, 231, 0.92)",
    navbarText: "#171518",
    footerBg: "#100E13",
    footerText: "#C2BBC8",
    cardBg: "#FFFFFF",
    cardBorder: "#E5E1E7",
    borderSecondary: "#EDEAEF",
    tertiaryBg: "#EAE5DD",
    glassBg: "rgba(255, 255, 255, 0.78)",
    glassBorder: "rgba(229, 225, 231, 0.90)",
    electricAccent: "#7A1F4A",
    cyanAccent: "#1D0C49",
    cyanSubtle: "rgba(109, 25, 156, 0.08)",
    glowOpacity: 0.16,
    inputBg: "#FFFFFF",
    inputBorder: "#CFC9D6",
    inputFocusRing: "#6D199C",
    dropdownBg: "#FFFFFF",
    modalBg: "#FFFFFF",
    modalOverlay: "rgba(23, 21, 24, 0.56)",
    badgeBg: "#F3ECF7",
    badgeText: "#581380",
    buttonDisabledBg: "#E5E1E7",
    buttonDisabledText: "#6B656F",
    gradientFrom: "#6D199C",
    gradientVia: "#7A1F4A",
    gradientTo: "#1D0C49",
    gradientAngleDeg: 135,
    gradientIntensity: 7,
    shadowCard:
      "0 1px 2px rgba(23, 21, 24, 0.04), 0 14px 34px -16px rgba(23, 21, 24, 0.07)",
    shadowElevated:
      "0 8px 24px -6px rgba(23, 21, 24, 0.08), 0 28px 56px -18px rgba(29, 12, 73, 0.12)",
  },
};

/**
 * Soale Inspired — Premium Agency (Dark Variant)
 * - Deep velvet obsidian (#100E13), rich charcoal-plum surfaces (#17141C / #211C28)
 * - Warm alabaster primary text (#F7F5F8 — 17.7:1 AAA), secondary (#C2BBC8 — 10.27:1 AAA),
 *   and readable muted text (#A29AA8 — 7.06:1 AAA on #100E13 & 6.12:1 AA on #211C28)
 * - Luminous orchid-violet (#B77AD8 — 6.2:1 AA; dark ink #140F1A button label — 6.1:1 AA)
 */
export const SOALE_PREMIUM_DARK: ThemeTokenSet = {
  colors: {
    primary: "#B77AD8",
    primaryHover: "#C892E6",
    primaryActive: "#A362C7",
    primaryForeground: "#140F1A",
    secondary: "#F7F5F8",
    secondaryForeground: "#171518",
    accent: "#A78FCA",
    accentSubtle: "rgba(183, 122, 216, 0.13)",
    background: "#100E13",
    surface: "#17141C",
    surfaceElevated: "#211C28",
    surfaceMuted: "#1B1722",
    heading: "#F7F5F8",
    body: "#C2BBC8",
    muted: "#A29AA8",
    border: "#342D3A",
    borderStrong: "#4C4256",
    link: "#C593E2",
    linkHover: "#DFB9F3",
    linkActive: "#F7F5F8",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
  },
  components: {
    primaryButtonBg: "#B77AD8",
    navbarBg: "rgba(23, 20, 28, 0.80)",
    navbarBorder: "rgba(247, 245, 248, 0.10)",
    navbarText: "#F7F5F8",
    footerBg: "#0B090E",
    footerText: "#C2BBC8",
    cardBg: "#17141C",
    cardBorder: "#342D3A",
    borderSecondary: "#27212D",
    tertiaryBg: "#241E2C",
    glassBg: "rgba(23, 20, 28, 0.74)",
    glassBorder: "rgba(247, 245, 248, 0.10)",
    electricAccent: "#D08AA5",
    cyanAccent: "#A78FCA",
    cyanSubtle: "rgba(167, 143, 202, 0.12)",
    glowOpacity: 0.2,
    inputBg: "#141118",
    inputBorder: "#3E3646",
    inputFocusRing: "#B77AD8",
    dropdownBg: "#1B1722",
    modalBg: "#1B1722",
    modalOverlay: "rgba(8, 6, 11, 0.76)",
    badgeBg: "rgba(183, 122, 216, 0.15)",
    badgeText: "#DFB9F3",
    buttonDisabledBg: "#26202C",
    buttonDisabledText: "#8E8596",
    gradientFrom: "#6D199C",
    gradientVia: "#7A1F4A",
    gradientTo: "#1D0C49",
    gradientAngleDeg: 135,
    gradientIntensity: 14,
    shadowCard:
      "0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 18px 40px -16px rgba(0, 0, 0, 0.62)",
    shadowElevated:
      "0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 28px 60px -18px rgba(0, 0, 0, 0.78)",
  },
};

export const SOALE_INSPIRED_PREMIUM_PRESET: ThemePreset = {
  id: SOALE_INSPIRED_PRESET_ID,
  name: SOALE_INSPIRED_PRESET_NAME,
  description:
    "Editorial warm off-white (#F7F6F3) and crisp white (#FFFFFF) paired with deep obsidian charcoal (#100E13 / #17141C), Inter display typography, and controlled royal violet & plum accents (#6D199C / #B77AD8).",
  isBuiltIn: true,
  version: "2.0.0",
  defaultMode: "light",
  designSystem: { ...SOALE_INSPIRED_DESIGN_SYSTEM },
  light: SOALE_PREMIUM_LIGHT,
  dark: SOALE_PREMIUM_DARK,
  overrides: {},
};

/**
 * Independent, immutable pre-redesign snapshot of the complete live agency theme:
 * Captures Light & Dark color tokens, glass/surface/border/shadow/component styling,
 * typography scale, spacing density, border radii, button geometry, and animation settings.
 */
export const ORIGINAL_AGENCY_ARCHIVED_DESIGN_SYSTEM: ThemeDesignTokens = {
  typography: "architectural",
  buttonStyle: "pill",
  borderRadius: "balanced",
  spacing: "comfortable",
  animationIntensity: "full",
};

export const ORIGINAL_AGENCY_ARCHIVED_LIGHT: ThemeTokenSet = structuredClone(
  OMNIFLOW_RED_GLASS_LIGHT
);

export const ORIGINAL_AGENCY_ARCHIVED_DARK: ThemeTokenSet = structuredClone(
  OMNIFLOW_RED_GLASS_DARK
);

export const ORIGINAL_AGENCY_THEME_ARCHIVED_PRESET: ThemePreset = {
  id: ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
  name: ORIGINAL_AGENCY_ARCHIVED_PRESET_NAME,
  description:
    "Immutable versioned snapshot of the complete pre-Soale OmniFlow agency theme (Light & Dark variants, charcoal/off-white/glass/red tokens, architectural typography, pill controls, balanced radii, and full motion).",
  isBuiltIn: true,
  isArchivedOriginal: true,
  isLocked: true,
  version: ORIGINAL_AGENCY_ARCHIVED_VERSION,
  sourcePresetId: OMNIFLOW_RED_GLASS_PRESET_ID,
  defaultMode: "light",
  designSystem: { ...ORIGINAL_AGENCY_ARCHIVED_DESIGN_SYSTEM },
  light: ORIGINAL_AGENCY_ARCHIVED_LIGHT,
  dark: ORIGINAL_AGENCY_ARCHIVED_DARK,
  overrides: {},
  archivedAt: "2026-11-22T00:00:00.000Z",
};

export const OMNIFLOW_DARK_PURPLE_AI_PRESET_ID = "omniflow-dark-purple-ai";
export const OMNIFLOW_DARK_PURPLE_AI_PRESET_NAME = "OmniFlow Dark Purple AI";

/**
 * OmniFlow Dark Purple AI — Light Variant
 * - Crisp alabaster & soft violet-tinted surfaces (#FAF8FC / #FFFFFF / #F3EEF9)
 * - Deep plum-obsidian ink (#140A24 / #3F3356 / #5F5278) — >= 5.5:1 WCAG AA
 * - Royal electric purple (#7E22CE), magenta (#C026D3), and warm orange (#EA580C) accents
 */
export const OMNIFLOW_DARK_PURPLE_AI_LIGHT: ThemeTokenSet = {
  colors: {
    primary: "#7E22CE",
    primaryHover: "#6B21A8",
    primaryActive: "#581C87",
    primaryForeground: "#FFFFFF",
    secondary: "#140A24",
    secondaryForeground: "#FAF8FC",
    accent: "#C026D3",
    accentSubtle: "rgba(126, 34, 206, 0.08)",
    background: "#FAF8FC",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceMuted: "#F3EEF9",
    heading: "#140A24",
    body: "#3F3356",
    muted: "#5F5278",
    border: "#E6DFF2",
    borderStrong: "#CFC2E6",
    link: "#7E22CE",
    linkHover: "#6B21A8",
    linkActive: "#581C87",
    success: "#047857",
    warning: "#B45309",
    error: "#DC2626",
  },
  components: {
    primaryButtonBg: "#7E22CE",
    navbarBg: "rgba(250, 248, 252, 0.88)",
    navbarBorder: "rgba(230, 223, 242, 0.92)",
    navbarText: "#140A24",
    footerBg: "#0B0514",
    footerText: "#D5CBE8",
    cardBg: "#FFFFFF",
    cardBorder: "#E6DFF2",
    borderSecondary: "#EFEAF8",
    tertiaryBg: "#F1ECF8",
    glassBg: "rgba(255, 255, 255, 0.80)",
    glassBorder: "rgba(230, 223, 242, 0.90)",
    electricAccent: "#EA580C",
    cyanAccent: "#C026D3",
    cyanSubtle: "rgba(192, 38, 211, 0.08)",
    glowOpacity: 0.16,
    inputBg: "#FFFFFF",
    inputBorder: "#CFC2E6",
    inputFocusRing: "#7E22CE",
    dropdownBg: "#FFFFFF",
    modalBg: "#FFFFFF",
    modalOverlay: "rgba(20, 10, 36, 0.56)",
    badgeBg: "#F3E8FF",
    badgeText: "#6B21A8",
    buttonDisabledBg: "#E6DFF2",
    buttonDisabledText: "#6D6088",
    gradientFrom: "#7E22CE",
    gradientVia: "#C026D3",
    gradientTo: "#EA580C",
    gradientAngleDeg: 135,
    gradientIntensity: 10,
    shadowCard:
      "0 1px 2px rgba(20, 10, 36, 0.04), 0 14px 34px -14px rgba(88, 28, 135, 0.09)",
    shadowElevated:
      "0 6px 20px -4px rgba(20, 10, 36, 0.07), 0 26px 54px -16px rgba(88, 28, 135, 0.16)",
  },
};

/**
 * OmniFlow Dark Purple AI — Signature Dark Variant (Default)
 * - Deep obsidian-violet canvas (#07030D) & layered command surfaces (#110920 / #180D2C)
 * - Crisp lavender-white ink (#FAF7FF / #D5CBE8 / #A89BC2) — >= 5.7:1 WCAG AA
 * - Vibrant purple CTA (#7E22CE / #9333EA), orchid (#C084FC), magenta (#C026D3) & warm orange (#FB923C)
 */
export const OMNIFLOW_DARK_PURPLE_AI_DARK: ThemeTokenSet = {
  colors: {
    primary: "#C084FC",
    primaryHover: "#D8B4FE",
    primaryActive: "#A855F7",
    primaryForeground: "#FFFFFF",
    secondary: "#FAF7FF",
    secondaryForeground: "#07030D",
    accent: "#E879F9",
    accentSubtle: "rgba(168, 85, 247, 0.15)",
    background: "#07030D",
    surface: "#110920",
    surfaceElevated: "#180D2C",
    surfaceMuted: "#140B26",
    heading: "#FAF7FF",
    body: "#D5CBE8",
    muted: "#A89BC2",
    border: "#281844",
    borderStrong: "#3D2761",
    link: "#C084FC",
    linkHover: "#E9D5FF",
    linkActive: "#FAF7FF",
    success: "#34D399",
    warning: "#FB923C",
    error: "#F87171",
  },
  components: {
    primaryButtonBg: "#7E22CE",
    navbarBg: "rgba(7, 3, 13, 0.84)",
    navbarBorder: "rgba(192, 132, 252, 0.14)",
    navbarText: "#FAF7FF",
    footerBg: "#05020A",
    footerText: "#D5CBE8",
    cardBg: "#110920",
    cardBorder: "#281844",
    borderSecondary: "#1F1236",
    tertiaryBg: "#0D0619",
    glassBg: "rgba(17, 9, 32, 0.78)",
    glassBorder: "rgba(192, 132, 252, 0.16)",
    electricAccent: "#FB923C",
    cyanAccent: "#E879F9",
    cyanSubtle: "rgba(232, 121, 249, 0.13)",
    glowOpacity: 0.24,
    inputBg: "#0D0619",
    inputBorder: "#362157",
    inputFocusRing: "#C084FC",
    dropdownBg: "#140B26",
    modalBg: "#140B26",
    modalOverlay: "rgba(4, 2, 8, 0.78)",
    badgeBg: "rgba(168, 85, 247, 0.18)",
    badgeText: "#E9D5FF",
    buttonDisabledBg: "#211339",
    buttonDisabledText: "#8C7DA8",
    gradientFrom: "#7E22CE",
    gradientVia: "#C026D3",
    gradientTo: "#FB923C",
    gradientAngleDeg: 135,
    gradientIntensity: 18,
    shadowCard:
      "0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 18px 42px -16px rgba(0, 0, 0, 0.68)",
    shadowElevated:
      "0 1px 0 rgba(255, 255, 255, 0.07) inset, 0 28px 64px -18px rgba(126, 34, 206, 0.28)",
  },
};

export const OMNIFLOW_DARK_PURPLE_AI_PRESET: ThemePreset = {
  id: OMNIFLOW_DARK_PURPLE_AI_PRESET_ID,
  name: OMNIFLOW_DARK_PURPLE_AI_PRESET_NAME,
  description:
    "Signature Dark Purple AI SaaS system (#07030D canvas, #110920 command cards, #7E22CE -> #C026D3 -> #FB923C gradient accents) with crisp alabaster Light mode.",
  isBuiltIn: true,
  version: "1.0.0",
  defaultMode: "dark",
  designSystem: { ...DEFAULT_DESIGN_SYSTEM_TOKENS },
  light: OMNIFLOW_DARK_PURPLE_AI_LIGHT,
  dark: OMNIFLOW_DARK_PURPLE_AI_DARK,
  overrides: {},
};

export const SOALE_CREATIVE_AI_PRESET_ID = "soale-creative-ai-dual";
export const SOALE_CREATIVE_AI_PRESET_NAME =
  "Soale Creative AI — Orbital Glow (Dark & Light)";

/**
 * Soale Creative AI — Daylight Alabaster Variant
 * - Warm alabaster canvas (#FAF8F6) & pure white cards (#FFFFFF)
 * - Deep obsidian charcoal ink (#0E0B14 / #3B3447 / #5C536B) — >= 5.6:1 WCAG AA
 * - Sunset orange (#C2410C), rose-magenta (#BE185D), and orchid-violet (#7E22CE) halo accents
 */
export const SOALE_CREATIVE_AI_LIGHT: ThemeTokenSet = {
  colors: {
    primary: "#C2410C",
    primaryHover: "#9A3412",
    primaryActive: "#7C2D12",
    primaryForeground: "#FFFFFF",
    secondary: "#0E0B14",
    secondaryForeground: "#FAF8F6",
    accent: "#A21CAF",
    accentSubtle: "rgba(194, 65, 12, 0.08)",
    background: "#FAF8F6",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceMuted: "#F3EFEA",
    heading: "#0E0B14",
    body: "#3B3447",
    muted: "#5C536B",
    border: "#E6E0EB",
    borderStrong: "#CEC5D8",
    link: "#B43B0A",
    linkHover: "#9A3412",
    linkActive: "#7C2D12",
    success: "#047857",
    warning: "#B45309",
    error: "#DC2626",
  },
  components: {
    primaryButtonBg: "#0E0B14",
    navbarBg: "rgba(250, 248, 246, 0.86)",
    navbarBorder: "rgba(230, 224, 235, 0.92)",
    navbarText: "#0E0B14",
    footerBg: "#08070B",
    footerText: "#D4CEE0",
    cardBg: "#FFFFFF",
    cardBorder: "#E6E0EB",
    borderSecondary: "#EFEBF3",
    tertiaryBg: "#EAE4F0",
    glassBg: "rgba(255, 255, 255, 0.82)",
    glassBorder: "rgba(230, 224, 235, 0.90)",
    electricAccent: "#EA580C",
    cyanAccent: "#C026D3",
    cyanSubtle: "rgba(192, 38, 211, 0.08)",
    glowOpacity: 0.14,
    inputBg: "#FFFFFF",
    inputBorder: "#CEC5D8",
    inputFocusRing: "#C2410C",
    dropdownBg: "#FFFFFF",
    modalBg: "#FFFFFF",
    modalOverlay: "rgba(14, 11, 20, 0.56)",
    badgeBg: "#FFF1EB",
    badgeText: "#9A3412",
    buttonDisabledBg: "#E6E0EB",
    buttonDisabledText: "#685E78",
    gradientFrom: "#FF7023",
    gradientVia: "#BF4A91",
    gradientTo: "#C823FF",
    gradientAngleDeg: 105,
    gradientIntensity: 14,
    shadowCard:
      "0 1px 2px rgba(14, 11, 20, 0.04), 0 14px 34px -14px rgba(14, 11, 20, 0.08)",
    shadowElevated:
      "0 6px 20px -4px rgba(14, 11, 20, 0.08), 0 26px 54px -16px rgba(126, 34, 206, 0.14)",
  },
};

/**
 * Soale Creative AI — Obsidian Orbital Dark Variant
 * - Deep obsidian canvas (#060609) & sleek charcoal bento surfaces (#0D0C12 / #14121C)
 * - Luminous sunset-orange (#FF7023), rose-pink (#BF4A91), and orchid-violet (#C823FF) halo glow
 * - Crisp WCAG AA alabaster ink (#FAF8FF / #D4CEE0 / #A69FB8)
 */
export const SOALE_CREATIVE_AI_DARK: ThemeTokenSet = {
  colors: {
    primary: "#FF8547",
    primaryHover: "#FFA06E",
    primaryActive: "#F97316",
    primaryForeground: "#FFFFFF",
    secondary: "#FAF8FF",
    secondaryForeground: "#060609",
    accent: "#E879F9",
    accentSubtle: "rgba(255, 112, 35, 0.14)",
    background: "#060609",
    surface: "#0D0C12",
    surfaceElevated: "#14121C",
    surfaceMuted: "#111018",
    heading: "#FAF8FF",
    body: "#D4CEE0",
    muted: "#A69FB8",
    border: "#252230",
    borderStrong: "#3A354A",
    link: "#FF945C",
    linkHover: "#FFB38A",
    linkActive: "#FAF8FF",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
  },
  components: {
    primaryButtonBg: "#C2410C",
    navbarBg: "rgba(6, 6, 9, 0.82)",
    navbarBorder: "rgba(255, 255, 255, 0.10)",
    navbarText: "#FAF8FF",
    footerBg: "#040406",
    footerText: "#D4CEE0",
    cardBg: "#0D0C12",
    cardBorder: "#252230",
    borderSecondary: "#1B1924",
    tertiaryBg: "#1A1724",
    glassBg: "rgba(13, 12, 18, 0.78)",
    glassBorder: "rgba(255, 255, 255, 0.10)",
    electricAccent: "#FF7023",
    cyanAccent: "#C823FF",
    cyanSubtle: "rgba(200, 35, 255, 0.13)",
    glowOpacity: 0.24,
    inputBg: "#0A090E",
    inputBorder: "#3A354A",
    inputFocusRing: "#FF8547",
    dropdownBg: "#14121C",
    modalBg: "#14121C",
    modalOverlay: "rgba(4, 4, 6, 0.80)",
    badgeBg: "rgba(255, 112, 35, 0.16)",
    badgeText: "#FFB38A",
    buttonDisabledBg: "#1E1B29",
    buttonDisabledText: "#8C859E",
    gradientFrom: "#FF7023",
    gradientVia: "#BF4A91",
    gradientTo: "#C823FF",
    gradientAngleDeg: 105,
    gradientIntensity: 20,
    shadowCard:
      "0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 18px 42px -16px rgba(0, 0, 0, 0.72)",
    shadowElevated:
      "0 1px 0 rgba(255, 255, 255, 0.08) inset, 0 28px 64px -18px rgba(200, 35, 255, 0.24)",
  },
};

export const SOALE_CREATIVE_AI_DUAL_PRESET: ThemePreset = {
  id: SOALE_CREATIVE_AI_PRESET_ID,
  name: SOALE_CREATIVE_AI_PRESET_NAME,
  description:
    "Exact Soale Creative AI dual-mode system: obsidian (#060609) & daylight alabaster (#FAF8F6) paired with the rotating sunset-orange -> rose -> electric-orchid (#FF7023 -> #BF4A91 -> #C823FF) orbital halo glow.",
  isBuiltIn: true,
  version: "3.0.0",
  defaultMode: "dark",
  designSystem: {
    typography: "editorial",
    buttonStyle: "rounded",
    borderRadius: "generous",
    spacing: "spacious",
    animationIntensity: "full",
    headingWeight: "500",
    bodyLineHeight: "editorial",
    letterSpacing: "tight",
  },
  light: SOALE_CREATIVE_AI_LIGHT,
  dark: SOALE_CREATIVE_AI_DARK,
  overrides: {},
};

export const BUILT_IN_THEME_PRESETS: ThemePreset[] = [
  OMNIFLOW_DARK_PURPLE_AI_PRESET,
  SOALE_CREATIVE_AI_DUAL_PRESET,
  {
    id: "omniflow-light-signature",
    name: "OmniFlow Indigo Signature",
    description:
      "Premium light-first B2B system: clean white & cool slate surfaces (#F8FAFC / #FFFFFF), royal indigo-violet-blue accents, deep charcoal ink, and midnight-navy dark mode.",
    isBuiltIn: true,
    light: OMNIFLOW_LIGHT_TOKENS,
    dark: OMNIFLOW_DARK_TOKENS,
  },
  {
    id: "omniflow-cobalt-enterprise",
    name: "Cobalt & Crisp Slate",
    description:
      "Architectural enterprise blue (#1D4ED8 / #2563EB) paired with cool alabaster surfaces and deep slate dark mode.",
    isBuiltIn: true,
    light: COBALT_ENTERPRISE_LIGHT,
    dark: COBALT_ENTERPRISE_DARK,
  },
  {
    id: "omniflow-emerald-ops",
    name: "Operational Emerald & Slate",
    description:
      "Restrained operational emerald (#047857 / #059669) engineered for finance, healthcare, and workflow operations teams.",
    isBuiltIn: true,
    light: EMERALD_OPS_LIGHT,
    dark: EMERALD_OPS_DARK,
  },
  {
    id: "omniflow-violet-studio",
    name: "Executive Violet & Indigo",
    description:
      "Refined royal violet (#5B21B6 / #7C3AED) with crisp white surfaces and midnight charcoal dark mode.",
    isBuiltIn: true,
    light: EDITORIAL_SLATE_LIGHT,
    dark: EDITORIAL_SLATE_DARK,
  },
  {
    id: "omniflow-cyber-architect",
    name: "Midnight Cyan & Electric Indigo",
    description:
      "Futuristic architectural indigo (#3730A3 / #4338CA), electric blue (#2563EB), and subtle telemetry cyan (#0284C7 / #38BDF8) over deep navy-charcoal.",
    isBuiltIn: true,
    light: CYBER_ARCHITECT_LIGHT,
    dark: CYBER_ARCHITECT_DARK,
  },
  {
    id: "omniflow-red-glass",
    name: "OmniFlow Red Glass",
    description:
      "A premium futuristic color system combining sophisticated charcoal, clean off-white, subtle glass surfaces, and controlled red accents.",
    isBuiltIn: true,
    light: OMNIFLOW_RED_GLASS_LIGHT,
    dark: OMNIFLOW_RED_GLASS_DARK,
  },
  ORIGINAL_AGENCY_THEME_ARCHIVED_PRESET,
  SOALE_INSPIRED_PREMIUM_PRESET,
];

export const DEFAULT_THEME_PRESET_ID = OMNIFLOW_DARK_PURPLE_AI_PRESET_ID;

export function createArchivedOriginalThemeSnapshot(
  source?: Partial<ThemeConfiguration> | null
): ArchivedThemeSnapshot {
  if (source?.archivedOriginalTheme) {
    return structuredClone(source.archivedOriginalTheme);
  }
  return {
    id: ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
    name: ORIGINAL_AGENCY_ARCHIVED_PRESET_NAME,
    description: ORIGINAL_AGENCY_THEME_ARCHIVED_PRESET.description,
    version: ORIGINAL_AGENCY_ARCHIVED_VERSION,
    sourcePresetId: OMNIFLOW_RED_GLASS_PRESET_ID,
    defaultMode: "light",
    designSystem: structuredClone(ORIGINAL_AGENCY_ARCHIVED_DESIGN_SYSTEM),
    light: structuredClone(ORIGINAL_AGENCY_ARCHIVED_LIGHT),
    dark: structuredClone(ORIGINAL_AGENCY_ARCHIVED_DARK),
    overrides: {},
    archivedAt: ORIGINAL_AGENCY_THEME_ARCHIVED_PRESET.archivedAt!,
  };
}

export function createDefaultThemeConfiguration(): ThemeConfiguration {
  const defaultPreset =
    BUILT_IN_THEME_PRESETS.find((p) => p.id === DEFAULT_THEME_PRESET_ID) ??
    BUILT_IN_THEME_PRESETS[0];
  return {
    activePresetId: defaultPreset.id,
    defaultMode: defaultPreset.defaultMode ?? "dark",
    designSystem: { ...DEFAULT_DESIGN_SYSTEM_TOKENS },
    published: {
      light: structuredClone(defaultPreset.light),
      dark: structuredClone(defaultPreset.dark),
      overrides: {},
    },
    draft: {
      light: structuredClone(defaultPreset.light),
      dark: structuredClone(defaultPreset.dark),
      overrides: {},
    },
    previousPublished: null,
    archivedOriginalTheme: createArchivedOriginalThemeSnapshot(),
    customPresets: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Safely upgrades untouched legacy default seed themes (`omniflow-editorial-ember`, `omniflow-signature`,
 * `atlantic-jade`, `omniflow-light-signature`, `soale-inspired-premium-agency`
 * with no `updatedBy`, no `previousPublished`, and no custom presets)
 * to the Dark Purple AI default preset, while 100% preserving any admin-customized theme.
 */
export function normalizeStoredThemeConfig(
  raw: ThemeConfiguration | null | undefined
): { config: ThemeConfiguration; upgraded: boolean } {
  if (!raw) {
    return { config: createDefaultThemeConfiguration(), upgraded: true };
  }

  const isLegacySeedId =
    raw.activePresetId === "omniflow-editorial-ember" ||
    raw.activePresetId === "omniflow-signature" ||
    raw.activePresetId === "atlantic-jade" ||
    raw.activePresetId === "omniflow-light-signature" ||
    raw.activePresetId === SOALE_INSPIRED_PRESET_ID;

  const isSystemUpdatedBy =
    !raw.updatedBy ||
    raw.updatedBy === "system" ||
    raw.updatedBy === "system@omniflow.local" ||
    raw.updatedBy === "system@omniflow.advisory";

  const hasAdminCustomization = Boolean(
    !isSystemUpdatedBy ||
      (raw.previousPublished && !isSystemUpdatedBy) ||
      (Array.isArray(raw.customPresets) && raw.customPresets.length > 0)
  );

  if (isLegacySeedId && !hasAdminCustomization) {
    return {
      config: createDefaultThemeConfiguration(),
      upgraded: true,
    };
  }

  if (!raw.archivedOriginalTheme) {
    return {
      config: {
        ...raw,
        archivedOriginalTheme: createArchivedOriginalThemeSnapshot(raw),
      },
      upgraded: false,
    };
  }

  return { config: raw, upgraded: false };
}
