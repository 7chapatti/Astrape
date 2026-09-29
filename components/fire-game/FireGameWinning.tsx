"use client";
import { useEffect, useRef } from "react";
import type { Dispatch } from "react";
import type { FireGameAction, FireGameState } from "@/lib/fire-game/types";

const FIREBALL_ENTER_MS = 1200;
const BURN_HOLD_MS = 1200;
const ZOOM_OUT_MS = 1500;
const TOTAL_DUR = FIREBALL_ENTER_MS + BURN_HOLD_MS + ZOOM_OUT_MS;

const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function FireGameWinning({ dispatch }: { state: FireGameState; dispatch: Dispatch<FireGameAction>; }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = 0, H = 0, DPR = 1;

    let targetX = W / 2, targetY = H / 2, targetSize = 24;
    
    function getTargetRect() {
        const el = document.querySelector("h1#hero-title sup#astrape-copyright");
        if (el) {
            const rect = el.getBoundingClientRect();
            targetX = rect.left + rect.width / 2;
            targetY = rect.top + rect.height / 2;
            targetSize = parseFloat(window.getComputedStyle(el).fontSize) || 24;
        }
    }

    function size() {
      DPR = Math.min(devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      getTargetRect();
    }
    size(); window.addEventListener("resize", size);

    const flames: { ox: number; oy: number; vx: number; vy: number; life: number; maxLife: number; size: number }[] = [];
    const doneTimer = setTimeout(() => dispatch({ type: "WIN_SEQUENCE_COMPLETE" }), TOTAL_DUR + 200);

    let raf = 0;
    const t0 = performance.now();

    function frame(ts: number) {
      raf = requestAnimationFrame(frame);
      const elapsed = ts - t0;
      const centerSize = Math.min(W, H) * 0.4; 
      const centerX = W / 2;
      const centerY = H / 2;

      ctx.clearRect(0, 0, W, H);

      let bgAlpha = 1;
      let currentX = centerX;
      let currentY = centerY;
      let currentSize = centerSize;
      let isBurning = false;

      getTargetRect();

      if (elapsed < FIREBALL_ENTER_MS) {
          // Draw black background FIRST so fireball is visible!
          ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`; 
          ctx.fillRect(0, 0, W, H);
          
          const p = elapsed / FIREBALL_ENTER_MS;
          const easeOut = 1 - Math.pow(1 - p, 3);
          const fbX = -200 + (centerX + 200) * easeOut; 
          
          ctx.shadowBlur = 30;
          ctx.shadowColor = "rgba(255, 100, 20, 0.9)";
          drawFireball(ctx, fbX, centerY, 35, ts / 1000);
          ctx.shadowBlur = 0;
          
      } else {
          isBurning = true;
          if (elapsed > FIREBALL_ENTER_MS + BURN_HOLD_MS) {
              const zoomElapsed = elapsed - (FIREBALL_ENTER_MS + BURN_HOLD_MS);
              const p = Math.min(1, zoomElapsed / ZOOM_OUT_MS);
              const ease = easeInOutCubic(p);
              
              bgAlpha = 1 - ease;
              currentX = centerX + (targetX - centerX) * ease;
              currentY = centerY + (targetY - centerY) * ease;
              currentSize = centerSize + (targetSize - centerSize) * ease;
          }
          
          ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`; 
          ctx.fillRect(0, 0, W, H);
      }

      ctx.font = `600 ${currentSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      if (isBurning) {
          const gradient = ctx.createLinearGradient(0, currentY - currentSize/2, 0, currentY + currentSize/2);
          gradient.addColorStop(0, "#ffe9a8");
          gradient.addColorStop(0.4, "#ff9a3d");
          gradient.addColorStop(0.8, "#e13b1c");
          ctx.fillStyle = gradient;
          
          ctx.shadowBlur = 15 * (currentSize / centerSize);
          ctx.shadowColor = `rgba(255, 120, 30, ${bgAlpha})`;
      } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.1)"; 
          ctx.shadowBlur = 0;
      }
      
      ctx.fillText("©", currentX, currentY);
      ctx.shadowBlur = 0; 

      if (isBurning) {
          ctx.globalCompositeOperation = "lighter";
          const scaleRatio = currentSize / centerSize;
          
          for(let i = 0; i < 2; i++) {
              flames.push({
                  ox: (Math.random() - 0.5) * currentSize * 0.6,
                  oy: -currentSize * 0.1,
                  vx: (Math.random() - 0.5) * 2,
                  vy: -Math.random() * 5 - 2,
                  life: 0,
                  maxLife: Math.random() * 0.5 + 0.3,
                  size: (Math.random() * 30 + 20)
              });
          }

          for (let i = flames.length - 1; i >= 0; i--) {
              const f = flames[i];
              f.life += 0.016;
              f.ox += f.vx;
              f.oy += f.vy;
              
              if (f.life >= f.maxLife) {
                  flames.splice(i, 1);
                  continue;
              }

              const progress = f.life / f.maxLife;
              const alpha = Math.max(0, (1 - Math.pow(progress, 1.5))) * bgAlpha; 
              const sSize = f.size * (1 - progress * 0.5) * scaleRatio;
              
              const fx = currentX + f.ox * scaleRatio;
              const fy = currentY + f.oy * scaleRatio;

              const rg = ctx.createRadialGradient(fx, fy, 0, fx, fy, sSize);
              rg.addColorStop(0, `rgba(255, 210, 100, ${alpha * 0.8})`);
              rg.addColorStop(0.4, `rgba(255, 100, 20, ${alpha * 0.5})`);
              rg.addColorStop(1, "rgba(255, 0, 0, 0)");
              
              ctx.fillStyle = rg;
              ctx.beginPath();
              ctx.arc(fx, fy, sSize, 0, Math.PI * 2);
              ctx.fill();
          }
          ctx.globalCompositeOperation = "source-over";
      }
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); clearTimeout(doneTimer);
      window.removeEventListener("resize", size);
    };
  }, [dispatch]);

  return (
    <div className="fixed inset-0 z-[100]">
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