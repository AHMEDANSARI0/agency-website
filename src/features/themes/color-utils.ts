import type {
  ComponentTokenOverrides,
  ContrastWarning,
  ResolvedThemeMode,
  ThemeConfiguration,
  ThemeTokenSet,
} from "@/types/theme";
import { OMNIFLOW_DARK_TOKENS, OMNIFLOW_LIGHT_TOKENS } from "./presets";

const HEX_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_REGEX =
  /^rgba?\(\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/;
const HSL_REGEX =
  /^hsla?\(\s*(?:360|3[0-5]\d|[12]?\d?\d)(?:deg)?\s*,\s*(?:100|[1-9]?\d)%\s*,\s*(?:100|[1-9]?\d)%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/;

export function isValidCssColor(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 64) return false;
  if (/[;{}<>\\]/.test(trimmed)) return false;
  return HEX_REGEX.test(trimmed) || RGB_REGEX.test(trimmed) || HSL_REGEX.test(trimmed);
}

export function sanitizeTokenSet(
  input: Partial<ThemeTokenSet> | undefined | null,
  fallback: ThemeTokenSet
): ThemeTokenSet {
  const safeColors = { ...fallback.colors };
  const safeComponents = { ...fallback.components };

  if (input?.colors) {
    for (const key of Object.keys(safeColors) as Array<keyof typeof safeColors>) {
      const candidate = input.colors[key];
      if (isValidCssColor(candidate)) {
        safeColors[key] = candidate.trim();
      }
    }
  }

  if (input?.components) {
    const colorComponentKeys: Array<
      Exclude<
        keyof typeof safeComponents,
        "gradientAngleDeg" | "gradientIntensity" | "shadowCard" | "shadowElevated"
      >
    > = [
      "navbarBg",
      "navbarBorder",
      "footerBg",
      "footerText",
      "cardBg",
      "cardBorder",
      "inputBg",
      "inputBorder",
      "inputFocusRing",
      "dropdownBg",
      "modalBg",
      "modalOverlay",
      "badgeBg",
      "badgeText",
      "buttonDisabledBg",
      "buttonDisabledText",
      "gradientFrom",
      "gradientVia",
      "gradientTo",
    ];

    for (const key of colorComponentKeys) {
      const candidate = input.components[key];
      if (isValidCssColor(candidate)) {
        safeComponents[key] = candidate.trim();
      }
    }

    if (
      typeof input.components.gradientAngleDeg === "number" &&
      Number.isFinite(input.components.gradientAngleDeg)
    ) {
      safeComponents.gradientAngleDeg = Math.min(
        360,
        Math.max(0, Math.round(input.components.gradientAngleDeg))
      );
    }

    if (
      typeof input.components.gradientIntensity === "number" &&
      Number.isFinite(input.components.gradientIntensity)
    ) {
      safeComponents.gradientIntensity = Math.min(
        100,
        Math.max(0, Math.round(input.components.gradientIntensity))
      );
    }
  }

  return { colors: safeColors, components: safeComponents };
}

interface RgbTuple {
  r: number;
  g: number;
  b: number;
}

export function parseColorToRgb(color: string): RgbTuple | null {
  const trimmed = color.trim();
  if (HEX_REGEX.test(trimmed)) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((ch) => ch + ch)
        .join("");
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
    };
  }

  const hslMatch = trimmed.match(/^hsla?\(\s*(\d+)(?:deg)?\s*,\s*(\d+)%\s*,\s*(\d+)%/);
  if (hslMatch) {
    const h = Number(hslMatch[1]) / 360;
    const s = Number(hslMatch[2]) / 100;
    const l = Number(hslMatch[3]) / 100;
    if (s === 0) {
      const gray = Math.round(l * 255);
      return { r: gray, g: gray, b: gray };
    }
    const hue2rgb = (p: number, q: number, t: number) => {
      let tn = t;
      if (tn < 0) tn += 1;
      if (tn > 1) tn -= 1;
      if (tn < 1 / 6) return p + (q - p) * 6 * tn;
      if (tn < 1 / 2) return q;
      if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
      r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    };
  }

  return null;
}

function relativeLuminance({ r, g, b }: RgbTuple): number {
  const transform = (channel: number) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

export function getContrastRatio(foreground: string, background: string): number | null {
  const fg = parseColorToRgb(foreground);
  const bg = parseColorToRgb(background);
  if (!fg || !bg) return null;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function evaluateThemeContrast(
  mode: ResolvedThemeMode,
  tokens: ThemeTokenSet
): ContrastWarning[] {
  const checks: Array<{
    pairLabel: string;
    fg: string;
    bg: string;
    min: number;
  }> = [
    {
      pairLabel: "Heading on Page Background",
      fg: tokens.colors.heading,
      bg: tokens.colors.background,
      min: 4.5,
    },
    {
      pairLabel: "Body Text on Page Background",
      fg: tokens.colors.body,
      bg: tokens.colors.background,
      min: 4.5,
    },
    {
      pairLabel: "Body Text on Card Surface",
      fg: tokens.colors.body,
      bg: tokens.components.cardBg,
      min: 4.5,
    },
    {
      pairLabel: "Primary Button Label on Primary Button",
      fg: tokens.colors.primaryForeground,
      bg: tokens.colors.primary,
      min: 4.5,
    },
    {
      pairLabel: "Muted Text on Page Background",
      fg: tokens.colors.muted,
      bg: tokens.colors.background,
      min: 3.5,
    },
  ];

  const warnings: ContrastWarning[] = [];
  for (const item of checks) {
    const ratio = getContrastRatio(item.fg, item.bg);
    if (ratio !== null && ratio < item.min) {
      warnings.push({
        mode,
        pairLabel: item.pairLabel,
        foreground: item.fg,
        background: item.bg,
        ratio,
        minimumRequired: item.min,
      });
    }
  }
  return warnings;
}

function tokenSetToCssDeclarations(
  tokens: ThemeTokenSet,
  overrides?: ComponentTokenOverrides
): string {
  const c = tokens.colors;
  const comp = tokens.components;
  const primaryColor =
    overrides?.primaryButtonBg && isValidCssColor(overrides.primaryButtonBg)
      ? overrides.primaryButtonBg
      : c.primary;
  const navbarBg =
    overrides?.navbarBg && isValidCssColor(overrides.navbarBg) ? overrides.navbarBg : comp.navbarBg;
  const footerBg =
    overrides?.footerBg && isValidCssColor(overrides.footerBg) ? overrides.footerBg : comp.footerBg;
  const cardBg =
    overrides?.cardBg && isValidCssColor(overrides.cardBg) ? overrides.cardBg : comp.cardBg;
  const badgeBg =
    overrides?.badgeBg && isValidCssColor(overrides.badgeBg) ? overrides.badgeBg : comp.badgeBg;

  const alpha = (comp.gradientIntensity / 100).toFixed(2);
  const fgRgb = parseColorToRgb(comp.gradientFrom) ?? { r: 79, g: 70, b: 229 };
  const toRgb = parseColorToRgb(comp.gradientTo) ?? { r: 124, g: 58, b: 237 };

  const lines: Array<[string, string]> = [
    ["--of-color-primary", primaryColor],
    ["--of-color-primary-hover", c.primaryHover],
    ["--of-color-primary-active", c.primaryActive],
    ["--of-color-primary-fg", c.primaryForeground],
    ["--of-color-secondary", c.secondary],
    ["--of-color-secondary-fg", c.secondaryForeground],
    ["--of-color-accent", c.accent],
    ["--of-color-accent-subtle", c.accentSubtle],
    ["--of-color-bg", c.background],
    ["--of-color-surface", c.surface],
    ["--of-color-surface-elevated", c.surfaceElevated],
    ["--of-color-surface-muted", c.surfaceMuted],
    ["--of-color-heading", c.heading],
    ["--of-color-body", c.body],
    ["--of-color-muted", c.muted],
    ["--of-color-border", c.border],
    ["--of-color-border-strong", c.borderStrong],
    ["--of-color-link", c.link],
    ["--of-color-link-hover", c.linkHover],
    ["--of-color-link-active", c.linkActive],
    ["--of-color-success", c.success],
    ["--of-color-warning", c.warning],
    ["--of-color-error", c.error],
    ["--of-surface-navbar", navbarBg],
    ["--of-border-navbar", comp.navbarBorder],
    ["--of-surface-footer", footerBg],
    ["--of-text-footer", comp.footerText],
    ["--of-surface-card", cardBg],
    ["--of-border-card", comp.cardBorder],
    ["--of-surface-input", comp.inputBg],
    ["--of-border-input", comp.inputBorder],
    ["--of-ring-focus", comp.inputFocusRing],
    ["--of-surface-dropdown", comp.dropdownBg],
    ["--of-surface-modal", comp.modalBg],
    ["--of-overlay-modal", comp.modalOverlay],
    ["--of-surface-badge", badgeBg],
    ["--of-text-badge", comp.badgeText],
    ["--of-btn-disabled-bg", comp.buttonDisabledBg],
    ["--of-btn-disabled-text", comp.buttonDisabledText],
    [
      "--of-gradient-brand",
      `linear-gradient(${comp.gradientAngleDeg}deg, ${comp.gradientFrom}, ${comp.gradientVia}, ${comp.gradientTo})`,
    ],
    [
      "--of-gradient-hero",
      `radial-gradient(circle at 20% 15%, rgba(${fgRgb.r}, ${fgRgb.g}, ${fgRgb.b}, ${alpha}), transparent 52%), radial-gradient(circle at 80% 10%, rgba(${toRgb.r}, ${toRgb.g}, ${toRgb.b}, ${alpha}), transparent 46%)`,
    ],
    ["--of-shadow-card", comp.shadowCard],
    ["--of-shadow-elevated", comp.shadowElevated],
    ["--of-radius-card", "0.875rem"],
    ["--of-radius-control", "0.625rem"],
  ];

  return lines.map(([k, v]) => `  ${k}: ${v};`).join("\n");
}

export function buildThemeCssVariables(config?: Partial<ThemeConfiguration> | null): string {
  const safeLight = sanitizeTokenSet(config?.published?.light, OMNIFLOW_LIGHT_TOKENS);
  const safeDark = sanitizeTokenSet(config?.published?.dark, OMNIFLOW_DARK_TOKENS);

  const lightCss = tokenSetToCssDeclarations(safeLight, config?.published?.overrides?.light);
  const darkCss = tokenSetToCssDeclarations(safeDark, config?.published?.overrides?.dark);

  return `:root, [data-theme="light"] {\n${lightCss}\n}\n\n[data-theme="dark"], .dark {\n${darkCss}\n}`;
}
