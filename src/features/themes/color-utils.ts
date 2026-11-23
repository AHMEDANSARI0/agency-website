import type {
  ComponentTokenOverrides,
  ContrastWarning,
  ResolvedThemeMode,
  ThemeConfiguration,
  ThemeDesignTokens,
  ThemeTokenSet,
} from "@/types/theme";
import {
  BUILT_IN_THEME_PRESETS,
  DEFAULT_DESIGN_SYSTEM_TOKENS,
  OMNIFLOW_DARK_TOKENS,
  OMNIFLOW_LIGHT_TOKENS,
} from "./presets";

export function sanitizeDesignSystemTokens(
  input?: Partial<ThemeDesignTokens> | null
): ThemeDesignTokens {
  return {
    typography:
      input?.typography === "editorial" || input?.typography === "technical"
        ? input.typography
        : DEFAULT_DESIGN_SYSTEM_TOKENS.typography,
    buttonStyle:
      input?.buttonStyle === "rounded" || input?.buttonStyle === "sharp"
        ? input.buttonStyle
        : DEFAULT_DESIGN_SYSTEM_TOKENS.buttonStyle,
    borderRadius:
      input?.borderRadius === "compact" || input?.borderRadius === "generous"
        ? input.borderRadius
        : DEFAULT_DESIGN_SYSTEM_TOKENS.borderRadius,
    spacing:
      input?.spacing === "compact" || input?.spacing === "spacious"
        ? input.spacing
        : DEFAULT_DESIGN_SYSTEM_TOKENS.spacing,
    animationIntensity:
      input?.animationIntensity === "subtle" ||
      input?.animationIntensity === "minimal"
        ? input.animationIntensity
        : DEFAULT_DESIGN_SYSTEM_TOKENS.animationIntensity,
  };
}

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

function isValidCssShadow(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 220) return false;
  if (/[;{}<>\\]|url\s*\(|expression\s*\(/i.test(trimmed)) return false;
  return true;
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
    const colorComponentKeys = [
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
    ] as const;

    for (const key of colorComponentKeys) {
      const candidate = input.components[key];
      if (isValidCssColor(candidate)) {
        safeComponents[key] = candidate.trim();
      }
    }

    const optionalColorKeys = [
      "primaryButtonBg",
      "navbarText",
      "borderSecondary",
      "tertiaryBg",
      "glassBg",
      "glassBorder",
      "electricAccent",
      "cyanAccent",
      "cyanSubtle",
    ] as const;

    for (const optKey of optionalColorKeys) {
      const candidate = input.components[optKey];
      if (isValidCssColor(candidate)) {
        safeComponents[optKey] = candidate.trim();
      }
    }

    if (isValidCssShadow(input.components.shadowCard)) {
      safeComponents.shadowCard = input.components.shadowCard.trim();
    }
    if (isValidCssShadow(input.components.shadowElevated)) {
      safeComponents.shadowElevated = input.components.shadowElevated.trim();
    }

    if (
      typeof input.components.glowOpacity === "number" &&
      Number.isFinite(input.components.glowOpacity)
    ) {
      safeComponents.glowOpacity = Math.min(
        0.65,
        Math.max(0, Number(input.components.glowOpacity.toFixed(2)))
      );
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
  const buttonSurface =
    tokens.components.primaryButtonBg &&
    isValidCssColor(tokens.components.primaryButtonBg)
      ? tokens.components.primaryButtonBg
      : tokens.colors.primary;

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
      // WCAG 2.1 SC 1.4.11 / Bold UI CTA control surface threshold
      pairLabel: "Primary Button Label on Primary Button",
      fg: tokens.colors.primaryForeground,
      bg: buttonSurface,
      min: 3.0,
    },
    {
      // WCAG 2.1 SC 1.4.11 / Auxiliary metadata threshold
      pairLabel: "Muted Text on Page Background",
      fg: tokens.colors.muted,
      bg: tokens.colors.background,
      min: 3.0,
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
  mode: ResolvedThemeMode,
  overrides?: ComponentTokenOverrides,
  designSystem?: ThemeDesignTokens,
  darkIslandTokens?: ThemeTokenSet
): string {
  const c = tokens.colors;
  const comp = tokens.components;
  const primaryColor =
    overrides?.primaryButtonBg && isValidCssColor(overrides.primaryButtonBg)
      ? overrides.primaryButtonBg
      : c.primary;
  const primaryButtonBg =
    overrides?.primaryButtonBg && isValidCssColor(overrides.primaryButtonBg)
      ? overrides.primaryButtonBg
      : comp.primaryButtonBg && isValidCssColor(comp.primaryButtonBg)
        ? comp.primaryButtonBg
        : c.primary;
  const navbarBg =
    overrides?.navbarBg && isValidCssColor(overrides.navbarBg) ? overrides.navbarBg : comp.navbarBg;
  const footerBg =
    overrides?.footerBg && isValidCssColor(overrides.footerBg) ? overrides.footerBg : comp.footerBg;
  const cardBg =
    overrides?.cardBg && isValidCssColor(overrides.cardBg) ? overrides.cardBg : comp.cardBg;
  const badgeBg =
    overrides?.badgeBg && isValidCssColor(overrides.badgeBg) ? overrides.badgeBg : comp.badgeBg;

  const navbarText = comp.navbarText || c.heading;
  const alpha = (comp.gradientIntensity / 100).toFixed(2);
  const primaryRgb = parseColorToRgb(primaryColor) ?? { r: 79, g: 70, b: 229 };
  const btnRgb = parseColorToRgb(primaryButtonBg) ?? primaryRgb;
  const fgRgb = parseColorToRgb(comp.gradientFrom) ?? primaryRgb;
  const toRgb = parseColorToRgb(comp.gradientTo) ?? { r: 37, g: 99, b: 235 };

  const glassBg =
    comp.glassBg && isValidCssColor(comp.glassBg)
      ? comp.glassBg
      : mode === "light"
        ? "rgba(255, 255, 255, 0.78)"
        : "rgba(15, 22, 36, 0.76)";
  const glassBorder =
    comp.glassBorder && isValidCssColor(comp.glassBorder)
      ? comp.glassBorder
      : mode === "light"
        ? "rgba(226, 232, 240, 0.85)"
        : "rgba(148, 163, 184, 0.16)";
  const electricColor =
    comp.electricAccent && isValidCssColor(comp.electricAccent)
      ? comp.electricAccent
      : mode === "light"
        ? "#2563EB"
        : "#3B82F6";
  const cyanColor =
    comp.cyanAccent && isValidCssColor(comp.cyanAccent)
      ? comp.cyanAccent
      : mode === "light"
        ? "#0284C7"
        : "#22D3EE";
  const cyanSubtle =
    comp.cyanSubtle && isValidCssColor(comp.cyanSubtle)
      ? comp.cyanSubtle
      : mode === "light"
        ? "rgba(2, 132, 199, 0.09)"
        : "rgba(34, 211, 238, 0.13)";

  const glowAlpha =
    typeof comp.glowOpacity === "number"
      ? comp.glowOpacity
      : mode === "light"
        ? 0.34
        : 0.48;
  const shadowGlow =
    mode === "light"
      ? `0 10px 28px -8px rgba(${btnRgb.r}, ${btnRgb.g}, ${btnRgb.b}, ${glowAlpha})`
      : `0 12px 34px -8px rgba(${btnRgb.r}, ${btnRgb.g}, ${btnRgb.b}, ${glowAlpha})`;

  const dIsland = darkIslandTokens ?? tokens;
  const darkPrimaryRgb =
    parseColorToRgb(dIsland.colors.primary) ?? { r: 79, g: 70, b: 229 };

  const lines: Array<[string, string]> = [
    ["--of-color-primary", primaryColor],
    ["--of-btn-primary-bg", primaryButtonBg],
    ["--of-color-primary-hover", c.primaryHover],
    ["--of-color-primary-active", c.primaryActive],
    ["--of-color-primary-fg", c.primaryForeground],
    ["--of-color-secondary", c.secondary],
    ["--of-color-secondary-fg", c.secondaryForeground],
    ["--of-color-accent", c.accent],
    ["--of-color-accent-subtle", c.accentSubtle],
    ["--of-color-electric", electricColor],
    ["--of-color-cyan", cyanColor],
    ["--of-color-cyan-subtle", cyanSubtle],
    ["--of-color-bg", c.background],
    ["--of-color-bg-tertiary", comp.tertiaryBg || c.surfaceMuted],
    ["--of-color-surface", c.surface],
    ["--of-color-surface-elevated", c.surfaceElevated],
    ["--of-color-surface-muted", c.surfaceMuted],
    ["--of-color-heading", c.heading],
    ["--of-color-body", c.body],
    ["--of-color-muted", c.muted],
    ["--of-color-border", c.border],
    ["--of-color-border-subtle", comp.borderSecondary || c.border],
    ["--of-color-border-strong", c.borderStrong],
    ["--of-color-link", c.link],
    ["--of-color-link-hover", c.linkHover],
    ["--of-color-link-active", c.linkActive],
    ["--of-color-success", c.success],
    ["--of-color-warning", c.warning],
    ["--of-color-error", c.error],
    ["--of-surface-navbar", navbarBg],
    ["--of-border-navbar", comp.navbarBorder],
    ["--of-text-navbar", navbarText],
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
    ["--of-surface-glass", glassBg],
    ["--of-border-glass", glassBorder],
    [
      "--of-gradient-brand",
      `linear-gradient(${comp.gradientAngleDeg}deg, ${comp.gradientFrom}, ${comp.gradientVia}, ${comp.gradientTo})`,
    ],
    [
      "--of-gradient-hero",
      `radial-gradient(circle at 18% 12%, rgba(${fgRgb.r}, ${fgRgb.g}, ${fgRgb.b}, ${alpha}), transparent 50%), radial-gradient(circle at 82% 8%, rgba(${toRgb.r}, ${toRgb.g}, ${toRgb.b}, ${alpha}), transparent 46%)`,
    ],
    [
      "--of-gradient-cta-banner",
      `radial-gradient(110% 95% at 50% 100%, rgba(${darkPrimaryRgb.r}, ${darkPrimaryRgb.g}, ${darkPrimaryRgb.b}, 0.22) 0%, ${dIsland.colors.surface} 46%, ${dIsland.colors.background} 100%)`,
    ],
    ["--of-dark-island-bg", dIsland.colors.background],
    ["--of-dark-island-surface", dIsland.colors.surface],
    ["--of-dark-island-elevated", dIsland.colors.surfaceElevated],
    ["--of-dark-island-muted", dIsland.colors.surfaceMuted],
    ["--of-dark-island-heading", dIsland.colors.heading],
    ["--of-dark-island-body", dIsland.colors.body],
    ["--of-dark-island-text-muted", dIsland.colors.muted],
    ["--of-dark-island-border", dIsland.colors.border],
    ["--of-shadow-card", comp.shadowCard],
    ["--of-shadow-elevated", comp.shadowElevated],
    ["--of-shadow-glow", shadowGlow],
    ["--of-spotlight-color", `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.10)`],
  ];

  const ds = sanitizeDesignSystemTokens(designSystem);
  const radiusScale =
    ds.borderRadius === "compact"
      ? { sm: "0.375rem", control: "0.5rem", card: "0.625rem", feature: "1rem" }
      : ds.borderRadius === "generous"
        ? { sm: "0.625rem", control: "0.875rem", card: "1.375rem", feature: "2rem" }
        : { sm: "0.5rem", control: "0.625rem", card: "1rem", feature: "1.5rem" };

  const buttonRadius =
    ds.buttonStyle === "sharp"
      ? "0.375rem"
      : ds.buttonStyle === "rounded"
        ? "0.625rem"
        : "9999px";

  const sectionPy =
    ds.spacing === "compact"
      ? "clamp(3.25rem, 5vw, 4.5rem)"
      : ds.spacing === "spacious"
        ? "clamp(5.75rem, 9vw, 8.25rem)"
        : "clamp(4.5rem, 7vw, 6.75rem)";

  const headingTracking =
    ds.typography === "editorial"
      ? "-0.018em"
      : ds.typography === "technical"
        ? "-0.036em"
        : "-0.028em";

  const motionScale =
    ds.animationIntensity === "minimal"
      ? "0"
      : ds.animationIntensity === "subtle"
        ? "0.55"
        : "1";

  lines.push(
    ["--of-radius-sm", radiusScale.sm],
    ["--of-radius-control", radiusScale.control],
    ["--of-radius-card", radiusScale.card],
    ["--of-radius-feature", radiusScale.feature],
    ["--of-radius-button", buttonRadius],
    ["--of-section-py", sectionPy],
    ["--of-heading-tracking", headingTracking],
    ["--of-motion-scale", motionScale]
  );

  return lines.map(([k, v]) => `  ${k}: ${v};`).join("\n");
}

export function buildThemeCssVariables(config?: Partial<ThemeConfiguration> | null): string {
  const activePreset = BUILT_IN_THEME_PRESETS.find(
    (p) => p.id === config?.activePresetId
  );
  const lightFallback = activePreset?.light ?? OMNIFLOW_LIGHT_TOKENS;
  const darkFallback = activePreset?.dark ?? OMNIFLOW_DARK_TOKENS;

  const safeLight = sanitizeTokenSet(config?.published?.light, lightFallback);
  const safeDark = sanitizeTokenSet(config?.published?.dark, darkFallback);
  const safeDesign = sanitizeDesignSystemTokens(config?.designSystem);

  const lightCss = tokenSetToCssDeclarations(
    safeLight,
    "light",
    config?.published?.overrides?.light,
    safeDesign,
    safeDark
  );
  const darkCss = tokenSetToCssDeclarations(
    safeDark,
    "dark",
    config?.published?.overrides?.dark,
    safeDesign,
    safeDark
  );

  return `:root, [data-theme="light"] {\n${lightCss}\n}\n\n[data-theme="dark"], .dark {\n${darkCss}\n}`;
}
