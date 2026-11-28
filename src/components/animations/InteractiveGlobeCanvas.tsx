"use client";

import { useReducedMotionChange } from "@/components/animations/useReducedMotionChange";

import React, { useEffect, useMemo, useRef } from "react";
import type { GlobeParticleDensity } from "@/types/hero-canvas";

export interface InteractiveGlobeCanvasProps {
  variant: "quantum_sphere" | "horizon_arc";
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  rotationSpeed?: number;
  particleDensity?: GlobeParticleDensity;
  primaryGlowColor?: string;
  secondaryGlowColor?: string;
  showOrbitalRing?: boolean;
  showSignalArcs?: boolean;
  interactiveDrag?: boolean;
  className?: string;
}

interface GlobePoint {
  lat: number;
  lng: number;
  isHub: boolean;
  tint: 0 | 1;
  size: number;
}

interface SpaceParticle {
  nx: number;
  ny: number;
  r: number;
  speed: number;
  phase: number;
  isHex: boolean;
  tint: 0 | 1;
}

interface SignalArc {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  speed: number;
  offset: number;
}

/**
 * Compact continent bounding boxes [minLat, maxLat, minLng, maxLng, weight]
 * Produces authentic recognizable world landmasses without external GeoJSON files.
 */
const CONTINENT_PATCHES: ReadonlyArray<
  readonly [number, number, number, number, number]
> = [
  // North America
  [25, 54, -125, -72, 1.3],
  [52, 66, -140, -95, 0.65],
  [15, 26, -106, -86, 0.55],
  // South America
  [-18, 10, -79, -46, 1.0],
  [-48, -18, -73, -54, 0.75],
  [-24, -4, -48, -35, 0.6],
  // Europe & UK
  [37, 58, -9, 28, 1.25],
  [56, 68, 5, 34, 0.6],
  // Africa
  [5, 34, -16, 36, 1.15],
  [-33, 5, 11, 41, 1.0],
  // Middle East & South Asia (Dubai, Riyadh, Karachi, Mumbai)
  [14, 36, 36, 62, 0.95],
  [8, 34, 66, 90, 1.15],
  // East & Southeast Asia
  [21, 46, 98, 123, 1.25],
  [31, 44, 126, 142, 0.75],
  [-8, 18, 98, 122, 0.75],
  // Australia
  [-38, -14, 115, 152, 0.85],
];

const GLOBAL_HUBS: ReadonlyArray<readonly [number, number]> = [
  [24.86, 67.01], // Karachi
  [25.2, 55.27], // Dubai
  [51.51, -0.13], // London
  [40.71, -74.01], // New York
  [37.77, -122.42], // San Francisco
  [1.35, 103.82], // Singapore
  [35.68, 139.65], // Tokyo
  [52.52, 13.4], // Berlin
  [-23.55, -46.63], // Sao Paulo
  [-33.87, 151.21], // Sydney
];

const SIGNAL_ARCS: SignalArc[] = [
  { fromLat: 24.86, fromLng: 67.01, toLat: 51.51, toLng: -0.13, speed: 0.34, offset: 0.0 },
  { fromLat: 51.51, fromLng: -0.13, toLat: 40.71, toLng: -74.01, speed: 0.28, offset: 0.22 },
  { fromLat: 25.2, fromLng: 55.27, toLat: 1.35, toLng: 103.82, speed: 0.31, offset: 0.45 },
  { fromLat: 1.35, fromLng: 103.82, toLat: 35.68, toLng: 139.65, speed: 0.38, offset: 0.62 },
  { fromLat: 40.71, fromLng: -74.01, toLat: -23.55, toLng: -46.63, speed: 0.26, offset: 0.78 },
  { fromLat: 52.52, fromLng: 13.4, toLat: 24.86, toLng: 67.01, speed: 0.33, offset: 0.91 },
];

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return [168, 85, 247];
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function projectLatLng(
  latDeg: number,
  lngDeg: number,
  yaw: number,
  pitch: number
): { x: number; y: number; z: number } {
  const lat = (latDeg * Math.PI) / 180;
  const lng = (lngDeg * Math.PI) / 180 + yaw;

  const cosLat = Math.cos(lat);
  const x0 = cosLat * Math.sin(lng);
  const y0 = -Math.sin(lat);
  const z0 = cosLat * Math.cos(lng);

  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  return {
    x: x0,
    y: y0 * cosP - z0 * sinP,
    z: y0 * sinP + z0 * cosP,
  };
}

export function InteractiveGlobeCanvas({
  variant,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  rotationSpeed = 0.9,
  particleDensity = "balanced",
  primaryGlowColor = "#A855F7",
  secondaryGlowColor = "#FB923C",
  showOrbitalRing = true,
  showSignalArcs = true,
  interactiveDrag = true,
  className = "",
}: InteractiveGlobeCanvasProps) {
  const motionPreferenceVersion = useReducedMotionChange();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { points, spaceParticles } = useMemo(() => {
    const rand = seededRandom(20261125);
    const mult =
      particleDensity === "dense"
        ? 1.35
        : particleDensity === "minimal"
          ? 0.65
          : 1;

    const generated: GlobePoint[] = [];

    // Seed global hub beacons first
    for (let i = 0; i < GLOBAL_HUBS.length; i++) {
      const [lat, lng] = GLOBAL_HUBS[i];
      generated.push({
        lat,
        lng,
        isHub: true,
        tint: i % 2 === 0 ? 1 : 0,
        size: 2.5,
      });
    }

    // Seed continent land-mask particle clusters
    for (const [minLat, maxLat, minLng, maxLng, weight] of CONTINENT_PATCHES) {
      const count = Math.round(34 * weight * mult);
      for (let i = 0; i < count; i++) {
        // Cluster slightly toward centers of patches for organic coastlines
        const u = (rand() + rand()) * 0.5;
        const v = (rand() + rand()) * 0.5;
        const lat = minLat + u * (maxLat - minLat);
        const lng = minLng + v * (maxLng - minLng);
        generated.push({
          lat,
          lng,
          isHub: rand() > 0.94,
          tint: rand() > 0.42 ? 1 : 0,
          size: 1.05 + rand() * 1.15,
        });
      }
    }

    // Subtle oceanic latitude/longitude grid dots for structural sphere curvature
    const latSteps = [-60, -40, -20, 0, 20, 40, 60];
    for (const lat of latSteps) {
      for (let lng = -180; lng < 180; lng += 15) {
        generated.push({
          lat,
          lng,
          isHub: false,
          tint: 0,
          size: 0.8,
        });
      }
    }

    const spCount = Math.round(38 * mult);
    const sp: SpaceParticle[] = [];
    for (let i = 0; i < spCount; i++) {
      sp.push({
        nx: rand() * 2 - 1,
        ny: rand() * 2 - 1,
        r: 1.2 + rand() * 2.8,
        speed: 0.25 + rand() * 0.65,
        phase: rand() * Math.PI * 2,
        isHex: rand() > 0.68,
        tint: rand() > 0.5 ? 1 : 0,
      });
    }

    return { points: generated, spaceParticles: sp };
  }, [particleDensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isThemeMotionSuppressed = () => {
      const scaleRaw = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue("--of-motion-scale")
        .trim();
      return scaleRaw !== "" && Number(scaleRaw) <= 0;
    };
    let motionSuppressed = prefersReduced || isThemeMotionSuppressed();

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(240, rect.width);
      height = Math.max(240, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => resize())
        : null;
    ro?.observe(canvas);

    // Rotation & interactive pointer inertia state
    let yaw = -0.55; // Start showing Europe / Middle East / Americas nicely
    let pitch = variant === "horizon_arc" ? 0.34 : 0.22;
    let velYaw = 0;
    let velPitch = 0;
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let rafId = 0;
    let isInViewport = true;
    let lastTs = performance.now();

    const onPointerDown = (e: PointerEvent) => {
      if (!interactiveDrag) return;
      isDragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !interactiveDrag) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      velYaw = dx * 0.0055;
      velPitch = dy * 0.0035;
      yaw += velYaw;
      pitch = Math.max(-0.65, Math.min(0.75, pitch + velPitch));
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      canvas.releasePointerCapture?.(e.pointerId);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });

    const [r1, g1, b1] = hexToRgb(primaryGlowColor);
    const [r2, g2, b2] = hexToRgb(secondaryGlowColor);

    const drawHexagon = (cx: number, cy: number, radius: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const px = cx + radius * Math.cos(a);
        const py = cy + radius * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const renderFrame = (now: number) => {
      rafId = 0;
      const isHidden = document.hidden;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      if (!isHidden) {
        const isLightMode =
          document.documentElement.getAttribute("data-theme") === "light";

        // Theme-aware ink & highlight adaptation:
        // In Light Mode, deepen pale lavender/orange glows slightly so nodes stay crisp & high-contrast on alabaster glass
        const [pr1, pg1, pb1] = isLightMode
          ? [Math.round(r1 * 0.68), Math.round(g1 * 0.42), Math.round(b1 * 0.82)]
          : [r1, g1, b1];
        const [pr2, pg2, pb2] = isLightMode
          ? [Math.round(r2 * 0.88), Math.round(g2 * 0.52), Math.round(b2 * 0.35)]
          : [r2, g2, b2];

        if (!isDragging && !motionSuppressed) {
          yaw += dt * 0.24 * rotationSpeed + velYaw;
          pitch = Math.max(-0.65, Math.min(0.75, pitch + velPitch));
          velYaw *= 0.92;
          velPitch *= 0.9;
        }

        ctx.clearRect(0, 0, width, height);

        const isHorizon = variant === "horizon_arc";
        const baseRadius = isHorizon
          ? Math.min(width * 0.72, height * 1.18) * scale
          : Math.min(width, height) * 0.38 * scale;

        const cx = width * 0.5 + offsetX;
        const cy = isHorizon
          ? height * 1.16 + offsetY
          : height * 0.5 + offsetY;

        // 1. Outer Atmospheric Halo Glow (Dark Purple AI / Orchid + Sunset Orange)
        const outerHalo = ctx.createRadialGradient(
          cx,
          cy,
          baseRadius * 0.72,
          cx,
          cy,
          baseRadius * (isHorizon ? 1.34 : 1.46)
        );
        const glowAlpha1 = isLightMode ? 0.16 : isHorizon ? 0.38 : 0.30;
        const glowAlpha2 = isLightMode ? 0.10 : 0.18;
        outerHalo.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${glowAlpha1})`);
        outerHalo.addColorStop(0.5, `rgba(${r2}, ${g2}, ${b2}, ${glowAlpha2})`);
        outerHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = outerHalo;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius * 1.46, 0, Math.PI * 2);
        ctx.fill();

        // 2. Subtle Floating Space Bokeh & Micro-Hexagons (Quantum Sphere mode)
        if (!isHorizon) {
          const tSec = now * 0.001;
          for (const sp of spaceParticles) {
            const driftY = Math.sin(tSec * sp.speed + sp.phase) * 9;
            const sx = cx + sp.nx * baseRadius * 1.36;
            const sy = cy + sp.ny * baseRadius * 1.26 + driftY;
            const [cr, cg, cb] = sp.tint === 1 ? [pr2, pg2, pb2] : [pr1, pg1, pb1];
            const alpha = isLightMode ? 0.24 : 0.42;
            if (sp.isHex) {
              ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
              ctx.lineWidth = 1;
              drawHexagon(sx, sy, sp.r * 1.7);
            } else {
              ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
              ctx.beginPath();
              ctx.arc(sx, sy, sp.r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Helper for Tilted 3D Dotted Orbital Ring (behind pass z < 0, front pass z >= 0)
        const drawOrbitalRingHalf = (frontHalf: boolean) => {
          if (!showOrbitalRing) return;
          const ringDots = 108;
          const ringRx = baseRadius * 1.33;
          const ringRz = baseRadius * 1.33;
          const ringTiltX = 0.34;
          const ringTiltZ = -0.14;
          const spin = (now * 0.00045 * Math.max(0.25, rotationSpeed)) % (Math.PI * 2);

          for (let i = 0; i < ringDots; i++) {
            const theta = (i / ringDots) * Math.PI * 2 + spin;
            const xFlat = Math.cos(theta) * ringRx;
            const zFlat = Math.sin(theta) * ringRz;
            const isFront = zFlat >= 0;
            if (isFront !== frontHalf) continue;

            const yTilted = -zFlat * Math.sin(ringTiltX);
            const zTilted = zFlat * Math.cos(ringTiltX);
            const rx = xFlat * Math.cos(ringTiltZ) - yTilted * Math.sin(ringTiltZ);
            const ry = xFlat * Math.sin(ringTiltZ) + yTilted * Math.cos(ringTiltZ);

            const depthScale = 1 + (zTilted / (baseRadius * 2.2)) * 0.25;
            const sx = cx + rx * depthScale;
            const sy = cy + ry * depthScale;

            const pulseDist = Math.abs(((i / ringDots + spin * 0.35) % 1) - 0.5);
            const isComet = pulseDist < 0.045;

            const baseAlpha = frontHalf
              ? isLightMode
                ? 0.62
                : 0.85
              : isLightMode
                ? 0.20
                : 0.30;

            ctx.fillStyle = isComet
              ? isLightMode
                ? `rgba(${pr2}, ${pg2}, ${pb2}, ${frontHalf ? 0.95 : 0.45})`
                : `rgba(250, 247, 255, ${frontHalf ? 0.98 : 0.5})`
              : `rgba(${pr1}, ${pg1}, ${pb1}, ${baseAlpha})`;
            ctx.beginPath();
            ctx.arc(
              sx,
              sy,
              isComet ? 2.7 : frontHalf ? 1.7 : 1.15,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        };

        // 3. Pass 1: Back half of Orbital Ring (z < 0)
        drawOrbitalRingHalf(false);

        // 4. Project all globe points once
        const projected = points.map((pt) => {
          const p = projectLatLng(pt.lat, pt.lng, yaw, pitch);
          return {
            pt,
            x: cx + p.x * baseRadius,
            y: cy + p.y * baseRadius,
            z: p.z,
          };
        });

        // 5. Translucent Back Hemisphere Points (Quantum Sphere glass effect)
        if (!isHorizon) {
          for (const item of projected) {
            if (item.z >= 0) continue;
            const [cr, cg, cb] =
              item.pt.tint === 1 ? [pr2, pg2, pb2] : [pr1, pg1, pb1];
            const alpha = (1 + item.z * 0.75) * (isLightMode ? 0.14 : 0.16);
            if (alpha <= 0.02) continue;
            ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(item.x, item.y, item.pt.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 6. Planetary Core Body + Theme-Matched Obsidian / Alabaster Glass Fill
        const bodyGrad = ctx.createRadialGradient(
          cx - baseRadius * 0.22,
          cy - baseRadius * 0.28,
          baseRadius * 0.08,
          cx,
          cy,
          baseRadius
        );
        if (isLightMode) {
          bodyGrad.addColorStop(0, "rgba(255, 255, 255, 0.92)");
          bodyGrad.addColorStop(0.72, "rgba(241, 234, 251, 0.94)");
          bodyGrad.addColorStop(1, `rgba(${r1}, ${g1}, ${b1}, 0.26)`);
        } else {
          bodyGrad.addColorStop(0, "rgba(24, 13, 44, 0.88)");
          bodyGrad.addColorStop(0.74, "rgba(9, 4, 18, 0.95)");
          bodyGrad.addColorStop(1, `rgba(${r1}, ${g1}, ${b1}, 0.42)`);
        }

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Crisp Atmospheric Rim Crest
        const rimGrad = ctx.createLinearGradient(
          cx - baseRadius,
          cy - baseRadius,
          cx + baseRadius,
          cy + (isHorizon ? 0 : baseRadius)
        );
        rimGrad.addColorStop(0, `rgba(${pr1}, ${pg1}, ${pb1}, 0.90)`);
        rimGrad.addColorStop(
          0.5,
          isLightMode
            ? `rgba(${pr1}, ${pg1}, ${pb1}, 0.55)`
            : "rgba(250, 247, 255, 0.92)"
        );
        rimGrad.addColorStop(1, `rgba(${pr2}, ${pg2}, ${pb2}, 0.88)`);

        ctx.save();
        ctx.strokeStyle = rimGrad;
        ctx.lineWidth = isHorizon ? 2.4 : 1.85;
        ctx.shadowColor = `rgba(${r1}, ${g1}, ${b1}, ${isLightMode ? 0.35 : 0.72})`;
        ctx.shadowBlur = isHorizon ? 24 : 18;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 7. Internal Geodesic Constellation Lines between visible Hub Beacons
        const frontHubs = projected.filter((p) => p.pt.isHub && p.z > 0.05);
        ctx.lineWidth = 0.75;
        for (let i = 0; i < frontHubs.length; i++) {
          for (let j = i + 1; j < frontHubs.length; j++) {
            const a = frontHubs[i];
            const b = frontHubs[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < baseRadius * 0.78) {
              const lineAlpha =
                (1 - dist / (baseRadius * 0.78)) *
                (isLightMode ? 0.28 : 0.24) *
                Math.min(a.z, b.z);
              ctx.strokeStyle = `rgba(${pr1}, ${pg1}, ${pb1}, ${lineAlpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }

        // 8. Front Hemisphere Continent & City Particle Clusters (z >= 0)
        for (const item of projected) {
          if (item.z < 0) continue;
          const depth = Math.pow(item.z, 0.65);
          const [cr, cg, cb] =
            item.pt.tint === 1 ? [pr2, pg2, pb2] : [pr1, pg1, pb1];

          const alpha = Math.min(1, (isLightMode ? 0.36 : 0.28) + depth * 0.72);
          const rad = item.pt.size * (0.75 + depth * 0.45);

          if (item.pt.isHub) {
            ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${(alpha * 0.28).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(item.x, item.y, rad * 2.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = isLightMode
              ? `rgba(${pr2}, ${pg2}, ${pb2}, ${(alpha * 0.95).toFixed(3)})`
              : `rgba(250, 247, 255, ${(alpha * 0.95).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(item.x, item.y, rad * 0.95, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(item.x, item.y, rad, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 9. Animated 3D Great-Circle Signal Arcs
        if (showSignalArcs) {
          const tArc = now * 0.001 * Math.max(0.2, rotationSpeed);
          for (const arc of SIGNAL_ARCS) {
            const pFrom = projectLatLng(arc.fromLat, arc.fromLng, yaw, pitch);
            const pTo = projectLatLng(arc.toLat, arc.toLng, yaw, pitch);
            if (pFrom.z < -0.15 && pTo.z < -0.15) continue;

            const midLat = (arc.fromLat + arc.toLat) * 0.5 + 12;
            const midLng = (arc.fromLng + arc.toLng) * 0.5;
            const pMid = projectLatLng(midLat, midLng, yaw, pitch);

            const x0 = cx + pFrom.x * baseRadius;
            const y0 = cy + pFrom.y * baseRadius;
            const x2 = cx + pTo.x * baseRadius;
            const y2 = cy + pTo.y * baseRadius;
            const lift = isHorizon ? 1.24 : 1.28;
            const x1 = cx + pMid.x * baseRadius * lift;
            const y1 = cy + pMid.y * baseRadius * lift;

            ctx.strokeStyle = `rgba(${pr1}, ${pg1}, ${pb1}, ${isLightMode ? 0.24 : 0.20})`;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.quadraticCurveTo(x1, y1, x2, y2);
            ctx.stroke();

            const prog = (tArc * arc.speed + arc.offset) % 1;
            const tailStart = Math.max(0, prog - 0.22);
            const steps = 10;
            ctx.lineWidth = 2.0;
            ctx.strokeStyle = `rgba(${pr2}, ${pg2}, ${pb2}, 0.88)`;
            ctx.beginPath();
            for (let s = 0; s <= steps; s++) {
              const t = tailStart + ((prog - tailStart) * s) / steps;
              const omt = 1 - t;
              const bx = omt * omt * x0 + 2 * omt * t * x1 + t * t * x2;
              const by = omt * omt * y0 + 2 * omt * t * y1 + t * t * y2;
              if (s === 0) ctx.moveTo(bx, by);
              else ctx.lineTo(bx, by);
            }
            ctx.stroke();

            const omt = 1 - prog;
            const headX =
              omt * omt * x0 + 2 * omt * prog * x1 + prog * prog * x2;
            const headY =
              omt * omt * y0 + 2 * omt * prog * y1 + prog * prog * y2;
            ctx.fillStyle = isLightMode
              ? `rgba(${pr2}, ${pg2}, ${pb2}, 0.98)`
              : "rgba(250, 247, 255, 0.96)";
            ctx.beginPath();
            ctx.arc(headX, headY, 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 10. Pass 2: Front half of Tilted Dotted Orbital Ring (z >= 0)
        drawOrbitalRingHalf(true);
      }

      if (!motionSuppressed && !isHidden && isInViewport) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    const stopAnimation = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    };
    const startAnimation = () => {
      if (!rafId && !document.hidden && isInViewport) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };
    const syncMotionPreference = () => {
      const nextMotionSuppressed =
        prefersReduced || isThemeMotionSuppressed();
      if (nextMotionSuppressed === motionSuppressed) return;
      motionSuppressed = nextMotionSuppressed;
      if (motionSuppressed) stopAnimation();
      else {
        lastTs = performance.now();
        startAnimation();
      }
    };
    const motionObserver = new MutationObserver(syncMotionPreference);
    motionObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
    motionObserver.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    const onVisibilityChange = () => {
      if (document.hidden) stopAnimation();
      else startAnimation();
    };
    const visibilityObserver =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            isInViewport = entry.isIntersecting;
            if (isInViewport) startAnimation();
            else stopAnimation();
          }, { rootMargin: "160px" })
        : null;

    visibilityObserver?.observe(canvas);
    document.addEventListener("visibilitychange", onVisibilityChange);
    startAnimation();

    return () => {
      stopAnimation();
      ro?.disconnect();
      visibilityObserver?.disconnect();
      motionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [
    variant,
    scale,
    offsetX,
    offsetY,
    rotationSpeed,
    primaryGlowColor,
    secondaryGlowColor,
    showOrbitalRing,
    showSignalArcs,
    interactiveDrag,
    points,
    spaceParticles,
    motionPreferenceVersion,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full select-none ${
        interactiveDrag ? "cursor-grab active:cursor-grabbing" : ""
      } ${className}`}
      style={{ touchAction: "pan-y" }}
    />
  );
}
