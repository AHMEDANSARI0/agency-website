"use client";

import React, { useEffect, useRef, useState } from "react";

const SOUND_PREF_KEY = "omniflow_ambient_sound";
const CHORD_FREQS = [146.83, 220.0, 293.66];
const CHIME_NOTES = [293.66, 349.23, 392.0, 440.0, 523.25];

/**
 * Subtle opt-in WebAudio ambient soundscape toggle.
 * Silent by default, zero auto-popups, docked bottom-left to avoid overlapping Back-to-Top / Consent controls,
 * and hidden automatically under prefers-reduced-motion: reduce.
 */
export function AmbientSoundToggle() {
  const [active, setActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const chimeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReducedMotion(true);
    }
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (document.hidden) {
        void ctx.suspend();
      } else if (active) {
        void ctx.resume();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [active]);

  useEffect(() => {
    return () => {
      if (chimeTimerRef.current) window.clearTimeout(chimeTimerRef.current);
      if (ctxRef.current) void ctxRef.current.close();
    };
  }, []);

  if (reducedMotion) return null;

  function startAudio() {
    if (!ctxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      filter.connect(master);

      CHORD_FREQS.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = idx === 2 ? "triangle" : "sine";
        osc.frequency.value = freq;
        osc.detune.value = (idx - 1) * 5;
        oscGain.gain.value = idx === 2 ? 0.045 : 0.075;
        osc.connect(oscGain).connect(filter);
        osc.start();
      });

      ctxRef.current = ctx;
      masterGainRef.current = master;

      const scheduleChime = () => {
        const currentCtx = ctxRef.current;
        const currentMaster = masterGainRef.current;
        if (!currentCtx || !currentMaster) return;
        if (currentCtx.state === "running") {
          const now = currentCtx.currentTime;
          const osc = currentCtx.createOscillator();
          const g = currentCtx.createGain();
          osc.type = "sine";
          osc.frequency.value =
            CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)] ?? 440;
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.08, now + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);
          osc.connect(g).connect(currentMaster);
          osc.start(now);
          osc.stop(now + 2.2);
        }
        chimeTimerRef.current = window.setTimeout(
          scheduleChime,
          2600 + Math.random() * 3200
        );
      };
      chimeTimerRef.current = window.setTimeout(scheduleChime, 1400);
    }

    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    void ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.24, ctx.currentTime + 1.0);
    setActive(true);
    try {
      window.localStorage.setItem(SOUND_PREF_KEY, "on");
    } catch {
      // Ignore
    }
  }

  function stopAudio() {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.45);
      window.setTimeout(() => {
        void ctx.suspend();
      }, 500);
    }
    setActive(false);
    try {
      window.localStorage.setItem(SOUND_PREF_KEY, "off");
    } catch {
      // Ignore
    }
  }

  return (
    <div className="fixed bottom-5 left-5 z-40 hidden sm:flex sm:items-center">
      <button
        type="button"
        onClick={() => (active ? stopAudio() : startAudio())}
        aria-pressed={active}
        aria-label={active ? "Mute ambient sound" : "Play subtle ambient sound"}
        title={active ? "Ambient sound on (click to mute)" : "Optional ambient sound"}
        className="grid h-9 w-9 place-items-center rounded-full border border-line-strong surface-glass shadow-card transition-colors hover:border-primary/40"
      >
        <span className="flex h-3 items-end gap-[2.5px]" aria-hidden="true">
          {[0.55, 1, 0.75, 0.42].map((bar, idx) => (
            <span
              key={idx}
              className={`w-[2.5px] rounded-full transition-all duration-300 ${
                active ? "bg-primary" : "bg-ink-muted/60"
              }`}
              style={{
                height: active ? `${bar * 100}%` : "3px",
                animation: active
                  ? `of-eq ${1.05 + idx * 0.18}s ease-in-out ${
                      idx * 0.14
                    }s infinite alternate`
                  : "none",
              }}
            />
          ))}
        </span>
      </button>
    </div>
  );
}
