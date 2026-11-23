export type ThemeMode = "light" | "dark" | "system";
export type ResolvedThemeMode = "light" | "dark";

export interface SemanticColorTokens {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentSubtle: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  heading: string;
  body: string;
  muted: string;
  border: string;
  borderStrong: string;
  link: string;
  linkHover: string;
  linkActive: string;
  success: string;
  warning: string;
  error: string;
}

export interface ComponentStateTokens {
  navbarBg: string;
  navbarBorder: string;
  footerBg: string;
  footerText: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  inputFocusRing: string;
  dropdownBg: string;
  modalBg: string;
  modalOverlay: string;
  badgeBg: string;
  badgeText: string;
  buttonDisabledBg: string;
  buttonDisabledText: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  gradientAngleDeg: number;
  gradientIntensity: number; // 0 to 100
  shadowCard: string;
  shadowElevated: string;
}

export interface ThemeTokenSet {
  colors: SemanticColorTokens;
  components: ComponentStateTokens;
}

export interface ComponentTokenOverrides {
  navbarBg?: string;
  footerBg?: string;
  cardBg?: string;
  badgeBg?: string;
  primaryButtonBg?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  light: ThemeTokenSet;
  dark: ThemeTokenSet;
  overrides?: {
    light?: ComponentTokenOverrides;
    dark?: ComponentTokenOverrides;
  };
}

export interface ThemeConfiguration {
  activePresetId: string;
  defaultMode: ThemeMode;
  published: {
    light: ThemeTokenSet;
    dark: ThemeTokenSet;
    overrides?: {
      light?: ComponentTokenOverrides;
      dark?: ComponentTokenOverrides;
    };
  };
  draft: {
    light: ThemeTokenSet;
    dark: ThemeTokenSet;
    overrides?: {
      light?: ComponentTokenOverrides;
      dark?: ComponentTokenOverrides;
    };
  };
  previousPublished?: {
    light: ThemeTokenSet;
    dark: ThemeTokenSet;
  } | null;
  customPresets: ThemePreset[];
  updatedAt: string;
  updatedBy?: string;
}

export interface ContrastWarning {
  mode: ResolvedThemeMode;
  pairLabel: string;
  foreground: string;
  background: string;
  ratio: number;
  minimumRequired: number;
}
