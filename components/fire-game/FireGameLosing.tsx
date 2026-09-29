"use client";
import { useEffect, useRef, useState } from "react";
import type { Dispatch } from "react";
import type { FireGameAction, FireGameState } from "@/lib/fire-game/types";

const FALL_MS = 600;
const SMOKE_MS = 700;
const HOLD_MS = 250;
const REVEAL_MS = 600;
const easeInQuad = (t: number) => t * t;

export default function FireGameLosing({ state, dispatch }: { state: FireGameState; dispatch: Dispatch<FireGameAction>; }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealing, setRevealing] = useState(false);
  const startRef = useRef(state.loseExit ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.4, vx: 0, vy: 2 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const start = startRef.current;
    let W = 0, H = 0, DPR = 1;

    function size() {
      DPR = Math.min(devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    size(); window.addEventListener("resize", size);

    const t1 = FALL_MS;
    const t2 = t1 + SMOKE_MS;
    const t3 = t2 + HOLD_MS;
    const t4 = t3 + REVEAL_MS;
    const revealTimer = setTimeout(() => setRevealing(true), t3);
    const doneTimer = setTimeout(() => dispatch({ type: "LOSE_SEQUENCE_COMPLETE" }), t4);

    let raf = 0;
    const t0 = performance.now();

    function frame(ts: number) {
      raf = requestAnimationFrame(frame);
      const elapsed = ts - t0;
      const waterY = H * 0.75;
      
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(8,16,28,.85)"; ctx.fillRect(0, waterY, W, H - waterY);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i <= W; i += 20) {
         const waveY = waterY + Math.sin(ts / 250 + i / 50) * 4;
         if (i === 0) ctx.moveTo(i, waveY);
         else ctx.lineTo(i, waveY);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      for (let i = 0; i <= W; i += 20) {
         const waveY = waterY + 8 + Math.sin(ts / 300 + i / 40 + Math.PI) * 3;
         if (i === 0) ctx.moveTo(i, waveY);
         else ctx.lineTo(i, waveY);
      }
      ctx.stroke();

      if (elapsed < t1) {
        const p = Math.min(1, elapsed / FALL_MS);
        const y = -50 + (waterY + 50) * easeInQuad(p);
        
        const clampedX = Math.max(W * 0.1, Math.min(start.x, W * 0.9));
        const x = clampedX + (start.vx * 0.2) * (elapsed / 16); 
        
        drawFireball(ctx, x, Math.min(y, waterY), 16, ts / 1000);
        
        if (p > 0.95) {
            ctx.fillStyle = "rgba(200,220,255, 0.4)";
            ctx.beginPath(); ctx.ellipse(x, waterY, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
        }
      } else if (elapsed < t2) {
        const p = (elapsed - t1) / SMOKE_MS;
        const clampedX = Math.max(W * 0.1, Math.min(start.x, W * 0.9));
        const x = clampedX + (start.vx * 0.2) * (t1 / 16);
        drawSmoke(ctx, x, waterY, p);
      }
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); clearTimeout(revealTimer); clearTimeout(doneTimer);
      window.removeEventListener("resize", size);
    };
  }, [dispatch]);

  return (
    <div className="fixed inset-0 z-[100]" style={{ opacity: revealing ? 0 : 1, transition: revealing ? `opacity ${REVEAL_MS}ms ease-in-out` : undefined }}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

function drawFireball(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, now: number) {
  const flicker = 0.85 + 0.15 * Math.sin(now * 14);
  const rg = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2 * flicker);
  rg.addColorStop(0, "rgba(255,240,200,1)"); rg.addColorStop(0.4, "rgba(255,150,40,.9)"); rg.addColorStop(1, "rgba(255,60,20,0)");
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r * 2.2 * flicker, 0, Math.PI * 2); ctx.fill();
}

function drawSmoke(ctx: CanvasRenderingContext2D, x: number, y: number, p: number) {
  const a = Math.max(0, 1 - p);
  const r = 10 + 40 * p; 
  const drift = -80 * p; 
  const rg = ctx.createRadialGradient(x, y + drift, 0, x, y + drift, r);
  rg.addColorStop(0, `rgba(180,190,200,${0.6 * a})`);
  rg.addColorStop(1, "rgba(120,130,140,0)");
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y + drift, r, 0, Math.PI * 2); ctx.fill();
}