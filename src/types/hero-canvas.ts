export type HeroVisualMode =
  | "orbital_halo"
  | "quantum_sphere"
  | "horizon_arc"
  | "halo_plus_globe";

export type HeroLayoutAlign = "centered" | "split_left";

export type GlobeParticleDensity = "minimal" | "balanced" | "dense";

export interface HeroCanvasConfig {
  visualMode: HeroVisualMode;
  layoutAlign: HeroLayoutAlign;
  globeScale: number;
  globeOffsetX: number;
  globeOffsetY: number;
  rotationSpeed: number;
  particleDensity: GlobeParticleDensity;
  primaryGlowColor: string;
  secondaryGlowColor: string;
  glowIntensity: number;
  showOrbitalRing: boolean;
  showSignalArcs: boolean;
  interactiveDrag: boolean;
  showCommandCenter: boolean;
  eyebrowOverride?: string;
}

/**
 * Default Signature Hero Configuration:
 * - Harmonized 1:1 with OmniFlow Dark Purple AI (`#07030D` obsidian canvas,
 *   `#A855F7` royal electric orchid rim, `#FB923C` warm sunset-orange beacons)
 * - Clean split-left executive typography + right-hand interactive 3D sphere
 * - `showCommandCenter: false` by default so zero bulky UI competes with the primary CTA
 */
export const DEFAULT_HERO_CANVAS_CONFIG: HeroCanvasConfig = {
  visualMode: "quantum_sphere",
  layoutAlign: "split_left",
  globeScale: 1.04,
  globeOffsetX: 0,
  globeOffsetY: 0,
  rotationSpeed: 0.9,
  particleDensity: "balanced",
  primaryGlowColor: "#A855F7",
  secondaryGlowColor: "#FB923C",
  glowIntensity: 0.72,
  showOrbitalRing: true,
  showSignalArcs: true,
  interactiveDrag: true,
  showCommandCenter: false,
  eyebrowOverride: "",
};

export interface HeroCanvasPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  config: HeroCanvasConfig;
}

export const HERO_CANVAS_PRESETS: HeroCanvasPreset[] = [
  {
    id: "soale-orbital-default",
    name: "Soale Orbital Halo Ring",
    badge: "Minimal · Ambient Ring",
    description:
      "Centered executive hero framed by OmniFlow's warm Sunset-Orange to Electric-Orchid ambient light ring.",
    config: {
      ...DEFAULT_HERO_CANVAS_CONFIG,
      visualMode: "orbital_halo",
      layoutAlign: "centered",
      primaryGlowColor: "#A855F7",
      secondaryGlowColor: "#FB923C",
      glowIntensity: DEFAULT_HERO_CANVAS_CONFIG.glowIntensity,
      showCommandCenter: false,
    },
  },
  {
    id: "quip-quantum-sphere",
    name: "OmniFlow 3D Quantum Sphere",
    badge: "Default · 3D Split",
    description:
      "Signature split-screen hero: crisp left-aligned value proposition paired with an interactive 3D Orchid & Sunset-Orange particle sphere, geodesic mesh, and tilted orbital ring.",
    config: {
      visualMode: "quantum_sphere",
      layoutAlign: "split_left",
      globeScale: 1.04,
      globeOffsetX: 0,
      globeOffsetY: 0,
      rotationSpeed: 0.9,
      particleDensity: "dense",
      primaryGlowColor: "#A855F7",
      secondaryGlowColor: "#FB923C",
      glowIntensity: DEFAULT_HERO_CANVAS_CONFIG.glowIntensity,
      showOrbitalRing: true,
      showSignalArcs: true,
      interactiveDrag: true,
      showCommandCenter: false,
      eyebrowOverride: "",
    },
  },
  {
    id: "blueorbit-horizon-globe",
    name: "OmniFlow Rising Horizon 3D Globe",
    badge: "3D Horizon · Centered",
    description:
      "Centered headline poised above a rising royal-violet & orchid planetary horizon crest with rotating dotted continents and live trajectory arcs.",
    config: {
      visualMode: "horizon_arc",
      layoutAlign: "centered",
      globeScale: 1.08,
      globeOffsetX: 0,
      globeOffsetY: 16,
      rotationSpeed: 0.8,
      particleDensity: "dense",
      primaryGlowColor: "#9333EA",
      secondaryGlowColor: "#E879F9",
      glowIntensity: DEFAULT_HERO_CANVAS_CONFIG.glowIntensity,
      showOrbitalRing: false,
      showSignalArcs: true,
      interactiveDrag: true,
      showCommandCenter: false,
      eyebrowOverride: "",
    },
  },
  {
    id: "omniflow-orbital-globe-hybrid",
    name: "Ambient Halo + 3D Quantum Globe",
    badge: "Hybrid · Full Depth",
    description:
      "Layers the warm Orchid-to-Sunset ambient halo behind the interactive 3D Quantum Sphere for maximum depth.",
    config: {
      visualMode: "halo_plus_globe",
      layoutAlign: "split_left",
      globeScale: 1.02,
      globeOffsetX: 0,
      globeOffsetY: 0,
      rotationSpeed: 0.95,
      particleDensity: "balanced",
      primaryGlowColor: "#C026D3",
      secondaryGlowColor: "#FB923C",
      glowIntensity: DEFAULT_HERO_CANVAS_CONFIG.glowIntensity,
      showOrbitalRing: true,
      showSignalArcs: true,
      interactiveDrag: true,
      showCommandCenter: false,
      eyebrowOverride: "",
    },
  },
];

function clampNum(val: unknown, min: number, max: number, fallback: number): number {
  const n = typeof val === "number" ? val : Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeHexColor(val: unknown, fallback: string): string {
  if (typeof val !== "string") return fallback;
  const trimmed = val.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toUpperCase() : fallback;
}

export function normalizeHeroCanvasConfig(raw: unknown): HeroCanvasConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_HERO_CANVAS_CONFIG };
  }
  const obj = raw as Record<string, unknown>;
  const visualMode: HeroVisualMode =
    obj.visualMode === "quantum_sphere" ||
    obj.visualMode === "horizon_arc" ||
    obj.visualMode === "halo_plus_globe" ||
    obj.visualMode === "orbital_halo"
      ? obj.visualMode
      : DEFAULT_HERO_CANVAS_CONFIG.visualMode;

  const layoutAlign: HeroLayoutAlign =
    obj.layoutAlign === "split_left" || obj.layoutAlign === "centered"
      ? obj.layoutAlign
      : visualMode === "quantum_sphere" || visualMode === "halo_plus_globe"
        ? "split_left"
        : "centered";

  const particleDensity: GlobeParticleDensity =
    obj.particleDensity === "minimal" ||
    obj.particleDensity === "dense" ||
    obj.particleDensity === "balanced"
      ? obj.particleDensity
      : "balanced";

  return {
    visualMode,
    layoutAlign,
    globeScale: clampNum(
      obj.globeScale,
      0.55,
      1.65,
      DEFAULT_HERO_CANVAS_CONFIG.globeScale
    ),
    globeOffsetX: clampNum(obj.globeOffsetX, -280, 280, 0),
    globeOffsetY: clampNum(obj.globeOffsetY, -200, 200, 0),
    rotationSpeed: clampNum(
      obj.rotationSpeed,
      0,
      3,
      DEFAULT_HERO_CANVAS_CONFIG.rotationSpeed
    ),
    particleDensity,
    primaryGlowColor: sanitizeHexColor(
      obj.primaryGlowColor,
      DEFAULT_HERO_CANVAS_CONFIG.primaryGlowColor
    ),
    secondaryGlowColor: sanitizeHexColor(
      obj.secondaryGlowColor,
      DEFAULT_HERO_CANVAS_CONFIG.secondaryGlowColor
    ),
    glowIntensity: clampNum(
      obj.glowIntensity,
      0,
      1,
      DEFAULT_HERO_CANVAS_CONFIG.glowIntensity
    ),
    showOrbitalRing:
      typeof obj.showOrbitalRing === "boolean" ? obj.showOrbitalRing : true,
    showSignalArcs:
      typeof obj.showSignalArcs === "boolean" ? obj.showSignalArcs : true,
    interactiveDrag:
      typeof obj.interactiveDrag === "boolean" ? obj.interactiveDrag : true,
    showCommandCenter:
      typeof obj.showCommandCenter === "boolean"
        ? obj.showCommandCenter
        : DEFAULT_HERO_CANVAS_CONFIG.showCommandCenter,
    eyebrowOverride:
      typeof obj.eyebrowOverride === "string"
        ? obj.eyebrowOverride.slice(0, 90)
        : "",
  };
}
