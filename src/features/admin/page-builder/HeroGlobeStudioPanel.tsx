"use client";

import React from "react";
import { Move, Sparkles } from "lucide-react";
import {
  HERO_CANVAS_PRESETS,
  type GlobeParticleDensity,
  type HeroCanvasConfig,
  type HeroLayoutAlign,
  type HeroVisualMode,
} from "@/types/hero-canvas";

interface HeroGlobeStudioPanelProps {
  selectedSlug: string;
  heroCanvasConfig: HeroCanvasConfig;
  canvasPositionDragMode: boolean;
  onToggleDragMode: () => void;
  onSwitchToHome: () => void;
  onUpdateHeroCanvas: (patch: Partial<HeroCanvasConfig>) => void;
}

export function HeroGlobeStudioPanel({
  selectedSlug,
  heroCanvasConfig,
  canvasPositionDragMode,
  onToggleDragMode,
  onSwitchToHome,
  onUpdateHeroCanvas,
}: HeroGlobeStudioPanelProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/25 bg-primary/8 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <Sparkles className="h-4 w-4" />
          Interactive 3D Globe &amp; Hero Canvas Studio
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
          Harmonized with OmniFlow Dark Purple AI &amp; Sunset Orange. Every
          preset, color swatch, and slider updates the live website canvas on
          the right in real time.
        </p>
      </div>

      {selectedSlug !== "home" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          The Interactive 3D Globe Hero renders on <strong>Home (/)</strong>.{" "}
          <button
            type="button"
            onClick={onSwitchToHome}
            className="font-semibold underline"
          >
            Switch to Home Page
          </button>{" "}
          to customize live.
        </div>
      )}

      {/* 1. Four Theme-Harmonized Visual Presets */}
      <div className="space-y-2">
        <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          1. Choose Hero 3D Module Preset
        </label>
        <div className="grid grid-cols-1 gap-2">
          {HERO_CANVAS_PRESETS.map((preset) => {
            const isSelected =
              heroCanvasConfig.visualMode === preset.config.visualMode;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onUpdateHeroCanvas(preset.config)}
                className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                    : "border-line-subtle bg-surface-elevated hover:border-line-strong"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink-heading">
                      {preset.name}
                    </span>
                    <span className="rounded-full border border-line-subtle bg-surface-card px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                    {preset.description}
                  </p>
                </div>
                <span
                  className="mt-1 h-4 w-4 shrink-0 rounded-full border border-white/20 shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, ${preset.config.primaryGlowColor}, ${preset.config.secondaryGlowColor})`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Hero Copy & Globe Composition */}
      <div className="space-y-2">
        <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          2. Hero Copy &amp; Globe Composition
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              {
                id: "split_left" as HeroLayoutAlign,
                label: "Split Left + Right Globe",
                sub: "Copy left · 3D Sphere right",
              },
              {
                id: "centered" as HeroLayoutAlign,
                label: "Centered Horizon",
                sub: "Headline centered over backdrop",
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onUpdateHeroCanvas({ layoutAlign: opt.id })}
              className={`rounded-xl border p-2.5 text-left transition ${
                heroCanvasConfig.layoutAlign === opt.id
                  ? "border-primary bg-primary/10 text-ink-heading"
                  : "border-line-subtle bg-surface-elevated text-ink-muted hover:text-ink-heading"
              }`}
            >
              <div className="text-xs font-semibold">{opt.label}</div>
              <div className="mt-0.5 text-[10px] opacity-80">{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Render Engine */}
      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Active Render Engine
        </label>
        <select
          aria-label="Hero visual render engine"
          value={heroCanvasConfig.visualMode}
          onChange={(e) =>
            onUpdateHeroCanvas({
              visualMode: e.target.value as HeroVisualMode,
            })
          }
          className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs font-medium text-ink-heading"
        >
          <option value="quantum_sphere">
            OmniFlow 3D Quantum Sphere (HTML5 3D Canvas)
          </option>
          <option value="horizon_arc">
            OmniFlow Rising Horizon 3D Globe (HTML5 3D Canvas)
          </option>
          <option value="orbital_halo">
            Soale Orbital Halo (SVG Ambient Ring)
          </option>
          <option value="halo_plus_globe">
            Hybrid: Ambient Halo + 3D Quantum Sphere
          </option>
        </select>
      </div>

      {/* 3. Direct Canvas Drag Positioning + Sliders */}
      <div className="space-y-3 rounded-xl border border-line-subtle bg-surface-elevated p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            3. 3D Transform &amp; Canvas Position
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleDragMode}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                canvasPositionDragMode
                  ? "bg-primary text-primary-foreground"
                  : "border border-primary/30 bg-surface-card text-primary"
              }`}
            >
              <Move className="h-3 w-3" />
              {canvasPositionDragMode ? "Done Dragging" : "Drag on Canvas"}
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateHeroCanvas({
                  globeScale: 1.04,
                  globeOffsetX: 0,
                  globeOffsetY: 0,
                })
              }
              className="rounded-lg px-2 py-1 text-[10px] text-ink-muted hover:text-ink-heading"
            >
              Reset
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px]">
            <span className="text-ink-body">Globe Scale</span>
            <span className="font-mono text-primary">
              {heroCanvasConfig.globeScale.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min={0.65}
            max={1.65}
            step={0.05}
            value={heroCanvasConfig.globeScale}
            onChange={(e) =>
              onUpdateHeroCanvas({
                globeScale: Number.parseFloat(e.target.value),
              })
            }
            className="mt-1 w-full accent-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-[11px]">
              <span className="text-ink-body">Offset X</span>
              <span className="font-mono text-ink-muted">
                {heroCanvasConfig.globeOffsetX}px
              </span>
            </div>
            <input
              type="range"
              min={-240}
              max={240}
              step={4}
              value={heroCanvasConfig.globeOffsetX}
              onChange={(e) =>
                onUpdateHeroCanvas({
                  globeOffsetX: Number.parseInt(e.target.value, 10),
                })
              }
              className="mt-1 w-full accent-primary"
            />
          </div>
          <div>
            <div className="flex justify-between text-[11px]">
              <span className="text-ink-body">Offset Y</span>
              <span className="font-mono text-ink-muted">
                {heroCanvasConfig.globeOffsetY}px
              </span>
            </div>
            <input
              type="range"
              min={-160}
              max={160}
              step={4}
              value={heroCanvasConfig.globeOffsetY}
              onChange={(e) =>
                onUpdateHeroCanvas({
                  globeOffsetY: Number.parseInt(e.target.value, 10),
                })
              }
              className="mt-1 w-full accent-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-[11px]">
              <span className="text-ink-body">Spin Speed</span>
              <span className="font-mono text-ink-muted">
                {heroCanvasConfig.rotationSpeed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={heroCanvasConfig.rotationSpeed}
              onChange={(e) =>
                onUpdateHeroCanvas({
                  rotationSpeed: Number.parseFloat(e.target.value),
                })
              }
              className="mt-1 w-full accent-primary"
            />
          </div>
          <div>
            <label className="block text-[11px] text-ink-body">
              Dot Density
            </label>
            <select
              aria-label="Globe dot density"
              value={heroCanvasConfig.particleDensity}
              onChange={(e) =>
                onUpdateHeroCanvas({
                  particleDensity: e.target.value as GlobeParticleDensity,
                })
              }
              className="mt-1 w-full rounded-lg border border-line-subtle bg-surface-card px-2 py-1 text-xs text-ink-heading"
            >
              <option value="minimal">Minimal (Fast)</option>
              <option value="balanced">Balanced</option>
              <option value="dense">Ultra Dense (HD)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Atmosphere, Rim Glow & Interactive Layers */}
      <div className="space-y-3 rounded-xl border border-line-subtle bg-surface-elevated p-3">
        <span className="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          4. Theme Glow Palette &amp; Interactive Layers
        </span>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-card px-2.5 py-1.5 text-xs">
            <span className="text-ink-body">Orchid Rim</span>
            <input
              type="color"
              value={heroCanvasConfig.primaryGlowColor}
              onChange={(e) =>
                onUpdateHeroCanvas({ primaryGlowColor: e.target.value })
              }
              className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-card px-2.5 py-1.5 text-xs">
            <span className="text-ink-body">Beacon Glow</span>
            <input
              type="color"
              value={heroCanvasConfig.secondaryGlowColor}
              onChange={(e) =>
                onUpdateHeroCanvas({ secondaryGlowColor: e.target.value })
              }
              className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent"
            />
          </label>
        </div>

        <label className="block rounded-lg border border-line-subtle bg-surface-card px-3 py-2 text-xs">
          <span className="flex items-center justify-between text-ink-body">
            <span>Hero background glow</span>
            <span className="font-mono text-primary">
              {Math.round(heroCanvasConfig.glowIntensity * 100)}%
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={heroCanvasConfig.glowIntensity}
            aria-label="Hero background glow intensity"
            onChange={(e) =>
              onUpdateHeroCanvas({
                glowIntensity: Number.parseFloat(e.target.value),
              })
            }
            className="mt-1 w-full accent-primary"
          />
        </label>

        <div className="space-y-2 pt-1">
          {(
            [
              {
                key: "showOrbitalRing" as const,
                label: "Tilted Dotted Orbital Ring",
              },
              {
                key: "showSignalArcs" as const,
                label: "Animated Global Trajectory Arcs",
              },
              {
                key: "interactiveDrag" as const,
                label: "Allow Visitors to Spin Globe with Mouse",
              },
              {
                key: "showCommandCenter" as const,
                label: "Show Optional Command Center Preview Card",
              },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-line-subtle bg-surface-card px-3 py-2 text-xs text-ink-body"
            >
              <span>{item.label}</span>
              <input
                type="checkbox"
                checked={heroCanvasConfig[item.key]}
                onChange={(e) =>
                  onUpdateHeroCanvas({ [item.key]: e.target.checked })
                }
                className="h-4 w-4 rounded accent-primary"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
