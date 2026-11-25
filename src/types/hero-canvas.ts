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
  showOrbitalRing: boolean;
  showSignalArcs: boolean;
  interactiveDrag: boolean;
  showCommandCenter: boolean;
  eyebrowOverride?: string;
}

export const DEFAULT_HERO_CANVAS_CONFIG: HeroCanvasConfig = {
  visualMode: "orbital_halo",
  layoutAlign: "centered",
  globeScale: 1,
  globeOffsetX: 0,
  globeOffsetY: 0,
  rotationSpeed: 1,
  particleDensity: "balanced",
  primaryGlowColor: "#4DB1C0",
  secondaryGlowColor: "#FF2E93",
  showOrbitalRing: true,
  showSignalArcs: true,
  interactiveDrag: true,
  showCommandCenter: true,
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
    badge: "Default · Dual Mode",
    description:
      "Rotating Sunset-Orange to Electric-Orchid orbital light ring behind centered Hero copy and Command Center.",
    config: {
      ...DEFAULT_HERO_CANVAS_CONFIG,
      visualMode: "orbital_halo",
      layoutAlign: "centered",
    },
  },
  {
    id: "quip-quantum-sphere",
    name: "Quantum Holographic 3D Sphere",
    badge: "3D Globe · Split Right",
    description:
      "Inspired by Quip 3D Globe: left-aligned Hero copy paired with an interactive 3D holographic sphere, glowing magenta/cyan continent nodes, geodesic mesh, and tilted dotted orbital ring.",
    config: {
      visualMode: "quantum_sphere",
      layoutAlign: "split_left",
      globeScale: 1.05,
      globeOffsetX: 0,
      globeOffsetY: 0,
      rotationSpeed: 1,
      particleDensity: "dense",
      primaryGlowColor: "#4DB1C0",
      secondaryGlowColor: "#FF2E93",
      showOrbitalRing: true,
      showSignalArcs: true,
      interactiveDrag: true,
      showCommandCenter: true,
      eyebrowOverride: "",
    },
  },
  {
    id: "blueorbit-horizon-globe",
    name: "BlueOrbit Rising Horizon Globe",
    badge: "3D Horizon · Centered",
    description:
      "Inspired by BlueOrbit / Unfold Interactive Globe: centered Hero headline floating above a rising planetary horizon crest with rotating dotted continents and live trajectory arcs.",
    config: {
      visualMode: "horizon_arc",
      layoutAlign: "centered",
      globeScale: 1.08,
      globeOffsetX: 0,
      globeOffsetY: 16,
      rotationSpeed: 0.85,
      particleDensity: "dense",
      primaryGlowColor: "#3B82F6",
      secondaryGlowColor: "#8B5CF6",
      showOrbitalRing: false,
      showSignalArcs: true,
      interactiveDrag: true,
      showCommandCenter: true,
      eyebrowOverride: "",
    },
  },
  {
    id: "omniflow-orbital-globe-hybrid",
    name: "Soale Halo + 3D Quantum Globe",
    badge: "Hybrid · Full Canvas",
    description:
      "Combines Soale's warm Sunset-to-Orchid ambient halo with the interactive 3D Quantum Sphere in split-screen mode.",
    config: {
      visualMode: "halo_plus_globe",
      layoutAlign: "split_left",
      globeScale: 1,
      globeOffsetX: 0,
      globeOffsetY: 0,
      rotationSpeed: 1.1,
      particleDensity: "balanced",
      primaryGlowColor: "#FF7023",
      secondaryGlowColor: "#C823FF",
      showOrbitalRing: true,
      showSignalArcs: true,
      interactiveDrag: true,
      showCommandCenter: true,
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
      : "orbital_halo";

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
    globeScale: clampNum(obj.globeScale, 0.55, 1.65, 1),
    globeOffsetX: clampNum(obj.globeOffsetX, -280, 280, 0),
    globeOffsetY: clampNum(obj.globeOffsetY, -200, 200, 0),
    rotationSpeed: clampNum(obj.rotationSpeed, 0, 3, 1),
    particleDensity,
    primaryGlowColor: sanitizeHexColor(
      obj.primaryGlowColor,
      DEFAULT_HERO_CANVAS_CONFIG.primaryGlowColor
    ),
    secondaryGlowColor: sanitizeHexColor(
      obj.secondaryGlowColor,
      DEFAULT_HERO_CANVAS_CONFIG.secondaryGlowColor
    ),
    showOrbitalRing:
      typeof obj.showOrbitalRing === "boolean" ? obj.showOrbitalRing : true,
    showSignalArcs:
      typeof obj.showSignalArcs === "boolean" ? obj.showSignalArcs : true,
    interactiveDrag:
      typeof obj.interactiveDrag === "boolean" ? obj.interactiveDrag : true,
    showCommandCenter:
      typeof obj.showCommandCenter === "boolean" ? obj.showCommandCenter : true,
    eyebrowOverride:
      typeof obj.eyebrowOverride === "string"
        ? obj.eyebrowOverride.slice(0, 90)
        : "",
  };
}
