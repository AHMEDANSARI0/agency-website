export const CARD_EFFECTS = [
  "random",
  "fade-up",
  "from-left",
  "from-right",
  "pop",
  "none",
] as const;
export type CardEffect = (typeof CARD_EFFECTS)[number];

export interface CardMotionConfig {
  enabled: boolean;
  defaultEffect: CardEffect;
  durationMs: number;
  overrides: Record<string, CardEffect>;
  revision: string;
}

export const DEFAULT_CARD_MOTION: CardMotionConfig = {
  enabled: true,
  defaultEffect: "fade-up",
  durationMs: 420,
  overrides: {},
  revision: "",
};

export function normalizeCardMotion(raw: unknown): CardMotionConfig {
  const x =
    raw && typeof raw === "object" ? (raw as Partial<CardMotionConfig>) : {};
  const effect = (value: unknown): value is CardEffect =>
    typeof value === "string" &&
    (CARD_EFFECTS as readonly string[]).includes(value);
  const overrides: Record<string, CardEffect> = {};
  if (x.overrides && typeof x.overrides === "object") {
    for (const [key, value] of Object.entries(x.overrides).slice(0, 500)) {
      if (/^c-[0-9a-f]{16}$/.test(key) && effect(value)) {
        overrides[key] = value;
      }
    }
  }

  const revision =
    typeof x.revision === "string" && /^[a-f0-9-]{1,64}$/.test(x.revision)
      ? x.revision
      : "";
  const legacyDefault =
    x.defaultEffect === "random" &&
    !revision &&
    x.durationMs === 550 &&
    Object.keys(overrides).length === 0;

  return {
    enabled: typeof x.enabled === "boolean" ? x.enabled : true,
    defaultEffect: legacyDefault
      ? "fade-up"
      : effect(x.defaultEffect)
        ? x.defaultEffect
        : DEFAULT_CARD_MOTION.defaultEffect,
    durationMs:
      typeof x.durationMs === "number" &&
      Number.isInteger(x.durationMs) &&
      x.durationMs >= 200 &&
      x.durationMs <= 1200
        ? x.durationMs
        : DEFAULT_CARD_MOTION.durationMs,
    overrides,
    revision,
  };
}
