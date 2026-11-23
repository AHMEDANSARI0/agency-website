import type {
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

export const BUILT_IN_THEME_PRESETS: ThemePreset[] = [
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
];

export const OMNIFLOW_RED_GLASS_PRESET_ID = "omniflow-red-glass";

export const DEFAULT_THEME_PRESET_ID = "omniflow-light-signature";

export function createDefaultThemeConfiguration(): ThemeConfiguration {
  const defaultPreset = BUILT_IN_THEME_PRESETS[0];
  return {
    activePresetId: defaultPreset.id,
    defaultMode: "light",
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
    customPresets: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Safely upgrades untouched legacy pre-Phase-2 seed themes (`omniflow-editorial-ember` / `omniflow-signature`
 * with `defaultMode: "dark"`, no `updatedBy`, no `previousPublished`, and no custom presets)
 * to the Phase 2 Light-First Indigo Signature system, while 100% preserving any admin-customized theme.
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
    raw.activePresetId === "atlantic-jade";

  const hasAdminCustomization = Boolean(
    raw.updatedBy ||
      raw.previousPublished ||
      (Array.isArray(raw.customPresets) && raw.customPresets.length > 0)
  );

  if (isLegacySeedId && !hasAdminCustomization) {
    return {
      config: createDefaultThemeConfiguration(),
      upgraded: true,
    };
  }

  return { config: raw, upgraded: false };
}
