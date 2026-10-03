"use client";
import { useEffect, useRef } from "react";
import type { Dispatch } from "react";
import type { FireGameAction, FireGameState } from "@/lib/fire-game/types";

const BLACK_FADE_END = 500;
const BALL_START = 250;
const BALL_END = 1750;
const ABSORB_MS = 320;
const IGNITE_START = 1750;
const IGNITE_END = 3600;
const PUSH_START = 3400;
const PUSH_END = 4700;
const HOLD_END = 5200;
const PULL_END = 8700;
const END_PAD = 150;

const FIRE = [255, 154, 61] as const;
const INK = [232, 237, 251] as const;
const BADGE_REST_OPACITY = 0.8;
const BADGE_SHADOW = "0 0 10px rgba(255, 130, 40, 0.8), 0 -2px 4px rgba(255, 230, 150, 0.6)";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const mix = (a: readonly number[], b: readonly number[], t: number) =>
  `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export default function FireGameWinning({ dispatch }: { state: FireGameState; dispatch: Dispatch<FireGameAction> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const stage = document.getElementById("hero-stage");
    const scene = document.getElementById("hero-scene");
    const h1 = document.getElementById("hero-title");
    const badge = document.getElementById("astrape-copyright");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !stage || !scene || !h1 || !badge) {
      const quick = setTimeout(() => dispatch({ type: "WIN_SEQUENCE_COMPLETE" }), 400);
      return () => clearTimeout(quick);
    }

    let W = 0, H = 0, DPR = 1;
    function size() {
      DPR = Math.min(devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    size();
    window.addEventListener("resize", size);

    const stageRect0 = stage.getBoundingClientRect();
    const badgeRect0 = badge.getBoundingClientRect();
    const cx0 = badgeRect0.left + badgeRect0.width / 2;
    const cy0 = badgeRect0.top + badgeRect0.height / 2;
    const centerX = stageRect0.left + stageRect0.width / 2;
    const centerY = stageRect0.top + stageRect0.height / 2;
    const MAX_ZOOM = Math.min(22, Math.max(4, (Math.min(W, H) * 0.5) / Math.max(1, badgeRect0.height)));
    const origin = `${cx0 - stageRect0.left}px ${cy0 - stageRect0.top}px`;
    stage.style.transformOrigin = origin;
    scene.style.transformOrigin = origin;

    function setCamera(z: number) {
      const sc = Math.pow(MAX_ZOOM, z);
      const tr = z === 0 ? "" : `translate(${(centerX - cx0) * z}px, ${(centerY - cy0) * z}px) scale(${sc})`;
      stage!.style.transform = tr;
      scene!.style.transform = tr;
      return sc;
    }

    function clearWordmark() {
      h1!.style.removeProperty("background-image");
      h1!.style.removeProperty("background-clip");
      h1!.style.removeProperty("-webkit-background-clip");
      h1!.style.removeProperty("color");
      h1!.style.removeProperty("filter");
    }

    const particles: Particle[] = [];
    let wordmarkAcc = 0;
    let wordmarkStyled = false;
    let badgeStyled = false;
    let done = false;
    let raf = 0;
    const t0 = performance.now();
    let lastTs = t0;

    function spawn(x: number, y: number, vx: number, vy: number, maxLife: number, sz: number) {
      if (particles.length > 700) return;
      particles.push({ x, y, vx, vy, life: 0, maxLife, size: sz });
    }

    function drawGlow(x: number, y: number, r: number, a: number, hot = false) {
      if (r <= 0 || a <= 0) return;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, hot ? `rgba(255,240,200,${a})` : `rgba(255,210,100,${a * 0.85})`);
      rg.addColorStop(0.45, `rgba(255,110,25,${a * 0.5})`);
      rg.addColorStop(1, "rgba(255,0,0,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function frame(ts: number) {
      raf = requestAnimationFrame(frame);
      const t = ts - t0;
      const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
      lastTs = ts;
      const step = dt * 60;

      let z = 0;
      if (t >= PUSH_START && t < PUSH_END) z = easeInOutCubic(clamp01((t - PUSH_START) / (PUSH_END - PUSH_START)));
      else if (t >= PUSH_END && t < HOLD_END) z = 1;
      else if (t >= HOLD_END) z = 1 - easeInOutCubic(clamp01((t - HOLD_END) / (PULL_END - HOLD_END)));
      const sc = setCamera(z);

      const h1r = h1!.getBoundingClientRect();
      const br = badge!.getBoundingClientRect();
      const bx = br.left + br.width / 2;
      const by = br.top + br.height / 2;

      ctx.clearRect(0, 0, W, H);

      const blackA = 1 - easeInOutSine(clamp01(t / BLACK_FADE_END));
      if (blackA > 0.003) {
        ctx.fillStyle = `rgba(0,0,0,${blackA})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.globalCompositeOperation = "lighter";

      const targetX = h1r.left + h1r.width * 0.05;
      const targetY = h1r.top + h1r.height * 0.52;

      if (t >= BALL_START && t < BALL_END + 50) {
        const p = clamp01((t - BALL_START) / (BALL_END - BALL_START));
        const e = easeInOutSine(p);
        const x = lerp(-70, targetX, e);
        const y = targetY - Math.sin(Math.PI * p) * 45;
        const a = clamp01((t - (BALL_END - ABSORB_MS)) / ABSORB_MS);
        const r = 26 * (1 - 0.92 * a * a);
        const flicker = 0.85 + 0.15 * Math.sin(ts / 1000 * 14);

        for (let i = 0; i < 2; i++) spawn(x - rnd(0, 10), y + rnd(-6, 6), rnd(-1.2, -0.2), rnd(-0.6, 0.4), rnd(0.25, 0.5), rnd(7, 13));
        drawGlow(x, y, r * 2.4 * flicker, 1 - a * a, true);
      }

      if (t >= BALL_END - ABSORB_MS && t < IGNITE_START + 600) {
        const a = clamp01((t - (BALL_END - ABSORB_MS)) / ABSORB_MS);
        const out = 1 - clamp01((t - IGNITE_START) / 600);
        drawGlow(targetX, targetY, 30 + 80 * a, 0.75 * a * out, true);
      }

      const front = easeInOutSine(clamp01((t - IGNITE_START) / (IGNITE_END - IGNITE_START)));
      const fade = clamp01((t - PUSH_START) / (HOLD_END - PUSH_START));
      if (t >= IGNITE_START && fade < 1) {
        const pct = front * 104;
        const body = mix(FIRE, INK, fade);
        const a = Math.max(0, pct - 8);
        h1!.style.setProperty("color", "transparent");
        h1!.style.setProperty("background-clip", "text");
        h1!.style.setProperty("-webkit-background-clip", "text");
        h1!.style.setProperty(
          "background-image",
          `linear-gradient(90deg, ${body} 0%, ${body} ${a}%, rgb(255,233,168) ${pct}%, rgb(${INK.join(",")}) ${pct + 0.5}%, rgb(${INK.join(",")}) 100%)`
        );
        h1!.style.setProperty("filter", `drop-shadow(0 0 ${16 * (1 - fade)}px rgba(255,130,40,${0.75 * (1 - fade)}))`);
        wordmarkStyled = true;

        wordmarkAcc += (4 * (1 - fade) * (front > 0.02 ? 1 : 0)) * step;
        while (wordmarkAcc >= 1) {
          wordmarkAcc -= 1;
          const litW = h1r.width * Math.min(1, pct / 100);
          spawn(
            h1r.left + Math.random() * litW,
            h1r.top + h1r.height * rnd(0.3, 0.78),
            rnd(-0.5, 0.5) * sc,
            rnd(-1.5, -4) * sc,
            rnd(0.35, 0.7),
            rnd(14, 28) * sc
          );
        }
      } else if (wordmarkStyled && fade >= 1) {
        clearWordmark();
        wordmarkStyled = false;
      }

      if (t >= IGNITE_END - 700) {
        const appear = easeInOutSine(clamp01((t - (IGNITE_END - 700)) / 500));
        badge!.style.opacity = String(appear * (BADGE_REST_OPACITY + (1 - BADGE_REST_OPACITY) * z));
        if (!badgeStyled) {
          badge!.style.color = "#ff9a3d";
          badge!.style.textShadow = BADGE_SHADOW;
          badgeStyled = true;
        }
        
        const ringR = br.width * 0.34;
        const n = (2 + z * 3) * appear * step;
        for (let k = 0; k < n; k++) {
          const ang = rnd(0, Math.PI * 2);
          const rr = ringR + rnd(-2, 2) * sc;
          spawn(
            bx + Math.cos(ang) * rr,
            by + Math.sin(ang) * rr,
            rnd(-0.1, 0.1) * sc,
            rnd(-0.3, -0.8) * sc,
            rnd(0.15, 0.35) * (1 + z),
            rnd(3, 6) * sc
          );
        }
        if (t >= IGNITE_END - 300 && t < IGNITE_END + 500) {
          drawGlow(bx, by, br.width * (0.6 + 0.9 * clamp01((t - (IGNITE_END - 300)) / 400)), 0.5 * (1 - clamp01((t - IGNITE_END) / 500)), true);
        }
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const f = particles[i];
        f.life += dt;
        f.x += f.vx * step;
        f.y += f.vy * step;
        if (f.life >= f.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const prog = f.life / f.maxLife;
        const alpha = Math.max(0, 1 - Math.pow(prog, 1.5));
        drawGlow(f.x, f.y, f.size * (1 - prog * 0.3), alpha * 0.85);
      }

      ctx.globalCompositeOperation = "source-over";

      if (!done && t >= PULL_END + END_PAD) {
        done = true;
        dispatch({ type: "WIN_SEQUENCE_COMPLETE" });
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      stage.style.transform = "";
      stage.style.transformOrigin = "";
      scene.style.transform = "";
      scene.style.transformOrigin = "";
      clearWordmark();
      badge.style.opacity = "";
    };
  }, [dispatch]);

  return (
    <div className="fixed inset-0 z-[100]" aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
