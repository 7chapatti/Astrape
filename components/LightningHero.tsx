"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import FireGameOverlay from "./fire-game/FireGameOverlay";
import { useFireGame } from "@/hooks/useFireGame";
import { AMBIENT_STRIKE_INTERVAL_S, DWELL_THRESHOLD_S, MAX_LOGO_BURN } from "@/lib/fire-game/constants";
import type { FireGamePhase, FireGameOutcome } from "@/lib/fire-game/types";

export default function LightningHero() {
  const { state: fireGame, dispatch: fireGameDispatch } = useFireGame();
  
  const phaseRef = useRef<FireGamePhase>(fireGame.phase);
  const outcomeRef = useRef<FireGameOutcome | null>(fireGame.outcome);
  
  // Track mobile state to completely lock game interactions
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    phaseRef.current = fireGame.phase;
    outcomeRef.current = fireGame.outcome;
  }, [fireGame.phase, fireGame.outcome]);

  // Handle window resizing for mobile lockout
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const heroRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [fxOn, setFxOn] = useState(
    () => typeof window === "undefined" || !matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const hero = heroRef.current!;
    const sc = sceneRef.current!;
    const fx = fxRef.current!;
    const S = sc.getContext("2d")!;
    const F = fx.getContext("2d")!;

    let W = 0, H = 0, DPR = 1;
    let layers: { c: any; img: HTMLCanvasElement }[] = [];
    
    // Store user preference separately so we can toggle it on/off based on screen size
    let userFxPref = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    let fxEnabled = userFxPref && window.innerWidth >= 768;
    
    let flash = 0, strikeAt = -99, bolts: number[][] = [], hit = { x: 0, y: 0 }, visible = true;
    
    let dwellAccum = 0, burnAmount = 0;
    const burnEmbers: { x: number; y: number; born: number }[] = [];
    const flames: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[] = [];
    
    const RGB = "120,160,255";
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const rng = (s: number) => () => (s = (s * 16807) % 2147483647) / 2147483647;

    const CFG = [
      { b: 0.8, h: [0.16, 0.26], s: 0.022, lit: "#5b76b8", w: 1.6, k: 1, base: 0.05, edge: 0 },
      { b: 0.88, h: [0.26, 0.4], s: 0.04, lit: "#3d4f8c", w: 2.4, k: 0.65, base: 0.035, edge: 0 },
      { b: 0.98, h: [0.4, 0.62], s: 0.075, lit: "#232e56", w: 3.4, k: 0.4, base: 0.02, edge: 1 },
    ];

    function limb(c: CanvasRenderingContext2D, x: number, y: number, len: number, ang: number, dep: number, r: () => number) {
      if (dep > 4 || len < 4) return;
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      c.moveTo(x, y); c.lineTo(x2, y2);
      const n = dep === 0 ? 1 : r() < 0.75 ? 2 : 1;
      for (let i = 0; i < n; i++) limb(c, x2, y2, len * (0.68 + r() * 0.14), ang + (r() - 0.5) * 1.1 - 0.15, dep + 1, r);
    }

    function tree(c: CanvasRenderingContext2D, x: number, base: number, h: number, r: () => number, w: number) {
      c.lineWidth = w;
      c.moveTo(x, base); c.lineTo(x, base - h * 0.3);
      const branches = 3 + ((r() * 2) | 0);
      for (let i = 0; i < branches; i++) {
        limb(c, x, base - h * 0.3 * (i / (branches - 1 || 1)), h * (0.5 - (i / (branches - 1 || 1)) * 0.15), -Math.PI / 2 + (r() - 0.5) * 1.5, 0, r);
      }
    }

    function build(cfg: any, i: number) {
      const c = document.createElement("canvas");
      c.width = W * DPR; c.height = H * DPR;
      const x = c.getContext("2d")!;
      x.scale(DPR, DPR);
      const r = rng(1000 + i * 77), base = H * cfg.b;
      x.strokeStyle = cfg.lit; x.lineCap = "round"; x.beginPath();
      for (let px = -10; px < W + 30; px += W * cfg.s * (0.7 + r() * 0.7)) {
        if (cfg.edge && Math.abs(px - W / 2) < W * 0.28 && r() < 0.9) continue;
        tree(x, px, base, H * (cfg.h[0] + r() * (cfg.h[1] - cfg.h[0])), r, cfg.w);
      }
      x.stroke();
      return c;
    }

    function size() {
      DPR = Math.min(devicePixelRatio || 1, 1.5);
      W = hero.clientWidth; H = hero.clientHeight;
      for (const c of [sc, fx]) { c.width = W * DPR; c.height = H * DPR; }
      S.setTransform(DPR, 0, 0, DPR, 0, 0); F.setTransform(DPR, 0, 0, DPR, 0, 0);
      layers = CFG.map((c, i) => ({ c, img: build(c, i) }));
    }

    function drawScene() {
      S.fillStyle = "#03040a"; S.fillRect(0, 0, W, H);
      if (flash > 0.01) {
        const rg = S.createRadialGradient(hit.x, H * 0.3, 0, hit.x, H * 0.3, H * 0.9);
        rg.addColorStop(0, `rgba(${RGB},${flash * 0.22})`);
        rg.addColorStop(1, `rgba(${RGB},0)`);
        S.fillStyle = rg; S.fillRect(0, 0, W, H);
      }
      for (const L of layers) {
        S.globalAlpha = Math.min(1, L.c.base + flash * L.c.k);
        S.drawImage(L.img, 0, 0, W, H);
      }
      S.globalAlpha = 1;

      // Only draw flames if effects are allowed (desktop & toggled on)
      if (fxEnabled) {
          if (phaseRef.current === "ambient" || phaseRef.current === "burning" || phaseRef.current === "engulfed") {
            if (burnEmbers.length > 0) drawEmbers();
            drawRealFlames();
          } else if (phaseRef.current === "resolved" && outcomeRef.current === "won") { 
            drawWinFlames();
          }
      }
    }

    function drawWinFlames() {
      S.save();
      S.globalCompositeOperation = "lighter";
      
      const el = document.querySelector("h1#hero-title sup#astrape-copyright");
      if (el) {
         const rect = el.getBoundingClientRect();
         
         const cx = rect.left + rect.width * 0.48; 
         const cy = rect.top + rect.height * 0.52; 
         
         const ringRadius = rect.width * 0.34; 
         
         for (let k = 0; k < 2; k++) {
             const angle = rnd(0, Math.PI * 2);
             const currentRadius = ringRadius + rnd(-2, 2);
             
             flames.push({
                 x: cx + Math.cos(angle) * currentRadius, 
                 y: cy + Math.sin(angle) * currentRadius,
                 vx: rnd(-0.1, 0.1), 
                 vy: rnd(-0.3, -0.8), 
                 life: 0,
                 maxLife: rnd(0.15, 0.35), 
                 size: rnd(3, 6) 
             });
         }
      }

      for (let i = flames.length - 1; i >= 0; i--) {
         const f = flames[i];
         f.life += 0.016;
         f.x += f.vx;
         f.y += f.vy;
         
         if (f.life >= f.maxLife) {
            flames.splice(i, 1);
            continue;
         }

         const progress = f.life / f.maxLife;
         const alpha = Math.max(0, 1 - Math.pow(progress, 1.5));
         const currentSize = f.size * (1 - progress * 0.3);

         const rg = S.createRadialGradient(f.x, f.y, 0, f.x, f.y, currentSize);
         rg.addColorStop(0, `rgba(255, 210, 100, ${alpha * 0.9})`);
         rg.addColorStop(0.5, `rgba(255, 100, 20, ${alpha * 0.5})`);
         rg.addColorStop(1, "rgba(255, 0, 0, 0)");
         
         S.fillStyle = rg;
         S.beginPath();
         S.arc(f.x, f.y, currentSize, 0, Math.PI * 2);
         S.fill();
      }
      S.restore();
    }

    function drawEmbers() {
      const now = performance.now() / 1000;
      S.save();
      S.globalCompositeOperation = "lighter";
      for (const e of burnEmbers) {
        const age = now - e.born;
        const grow = Math.min(1, age / 1.4);
        const flicker = 0.75 + 0.25 * Math.sin(now * 9 + e.x);
        const r = (10 + 6 * grow) * flicker;
        const rg = S.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
        rg.addColorStop(0, `rgba(255,214,140,${0.85 * grow * flicker})`);
        rg.addColorStop(0.5, `rgba(255,120,40,${0.45 * grow * flicker})`);
        rg.addColorStop(1, "rgba(255,60,20,0)");
        S.fillStyle = rg;
        S.beginPath();
        S.arc(e.x, e.y, r, 0, Math.PI * 2);
        S.fill();
      }
      S.restore();
    }

    function drawRealFlames() {
      if (burnEmbers.length === 0) return; 
      S.save();
      S.globalCompositeOperation = "lighter";

      const normalizedBurn = Math.min(1, burnAmount / MAX_LOGO_BURN); 
      const fireTargetY = (H * 0.8) - (H * 0.4 * normalizedBurn);
      
      const spawnRate = 1 + (normalizedBurn * 3);
      
      for (let i = 0; i < spawnRate; i++) {
         if (Math.random() > 0.4) {
            let spawnX = rnd(0, W);
            let spawnY = (H * 0.8) + rnd(-10, 20);

            if (burnEmbers.length > 0 && Math.random() > (normalizedBurn * 0.5)) {
                const ember = burnEmbers[Math.floor(Math.random() * burnEmbers.length)];
                const spread = 15 + (normalizedBurn * (W * 0.4));
                spawnX = ember.x + rnd(-spread, spread);
                spawnY = ember.y + rnd(-5, 15);
            }
            
            if (spawnX < 0 || spawnX > W) continue;

            const fireIntensity = 0.2 + (normalizedBurn * 1.5);
            
            flames.push({
               x: spawnX, 
               y: spawnY,
               vx: rnd(-1, 1) * fireIntensity,
               vy: rnd(-2, -5) * fireIntensity - (normalizedBurn * 2),
               life: 0,
               maxLife: rnd(0.4, 0.8) + (normalizedBurn * 0.8), 
               size: rnd(20, 35) + (normalizedBurn * 60) 
            });
         }
      }

      for (let i = flames.length - 1; i >= 0; i--) {
         const f = flames[i];
         f.life += 0.016;
         f.x += f.vx;
         f.y += f.vy;
         
         if (f.life >= f.maxLife || f.y < fireTargetY - 40) {
            flames.splice(i, 1);
            continue;
         }

         const progress = f.life / f.maxLife;
         const alpha = Math.max(0, 1 - Math.pow(progress, 1.5));
         const currentSize = f.size * (1 - progress * 0.3);

         const rg = S.createRadialGradient(f.x, f.y, 0, f.x, f.y, currentSize);
         rg.addColorStop(0, `rgba(255, 200, 80, ${alpha * 0.7})`);
         rg.addColorStop(0.5, `rgba(255, 80, 10, ${alpha * 0.4})`);
         rg.addColorStop(1, "rgba(255, 0, 0, 0)");
         
         S.fillStyle = rg;
         S.beginPath();
         S.arc(f.x, f.y, currentSize, 0, Math.PI * 2);
         S.fill();
      }
      S.restore();
    }

    function seg(x1: number, y1: number, x2: number, y2: number, d: number, dep: number, o: number[][]) {
      if (d < 3) { o.push([x1, y1, x2, y2, dep]); return; }
      const mx = (x1 + x2) / 2 + rnd(-d, d), my = (y1 + y2) / 2 + rnd(-d, d) * 0.3;
      seg(x1, y1, mx, my, d / 2, dep, o); seg(mx, my, x2, y2, d / 2, dep, o);
      if (dep < 2 && Math.random() < 0.07) seg(mx, my, mx + rnd(-1, 1) * H * 0.18, my + rnd(0.05, 0.25) * H, d / 2, dep + 1, o);
    }

    function strike(x: number, y: number) {
      bolts = []; seg(x + rnd(-90, 90), -10, x, y, H * 0.16, 0, bolts);
      hit = { x, y }; strikeAt = performance.now() / 1000;
    }

    function drawBolt(a: number) {
      F.lineCap = "round"; F.lineJoin = "round";
      for (const [w, c, al] of [[12, "110,150,255", 0.1], [4, "160,190,255", 0.35], [1.6, "255,255,255", 0.95]] as const) {
        F.strokeStyle = `rgba(${c},${al * a})`;
        for (const s of bolts) {
          F.lineWidth = (w as number) / (1 + s[4] * 0.9);
          F.beginPath(); F.moveTo(s[0], s[1]); F.lineTo(s[2], s[3]); F.stroke();
        }
      }
    }

    size();
    let t0 = performance.now() / 1000;
    let nextAmb = t0 + rnd(1, 2.5);

    let lastFrameNow = t0, raf = 0;
    function frame(ts: number) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const now = ts / 1000;
      const dt = Math.min(0.5, Math.max(0, now - lastFrameNow));
      lastFrameNow = now;

      if (phaseRef.current === "playing" || phaseRef.current === "collapsing") {
          burnAmount = 0;
          burnEmbers.length = 0;
          flames.length = 0;
      } else if (phaseRef.current === "resolved") {
          burnAmount = 0;
          burnEmbers.length = 0;
          if (outcomeRef.current !== "won") flames.length = 0; 
      } else if (phaseRef.current === "engulfed") {
          burnAmount = MAX_LOGO_BURN;
      }

      if (fxEnabled && now > nextAmb) {
        const strikeX = W * rnd(0.12, 0.88);
        const strikeY = H * rnd(0.7, 0.82); 
        strike(strikeX, strikeY);
        
        if (phaseRef.current === "ambient" || phaseRef.current === "burning") {
            burnEmbers.push({ x: strikeX, y: strikeY, born: now });
            if (burnEmbers.length > 15) burnEmbers.shift(); 
        }
        
        nextAmb = now + rnd(AMBIENT_STRIKE_INTERVAL_S[0], AMBIENT_STRIKE_INTERVAL_S[1]);
      }

      if (fxEnabled && document.visibilityState === "visible") {
        if (phaseRef.current === "ambient" || phaseRef.current === "burning") {
            dwellAccum += dt;
            burnAmount = Math.min(MAX_LOGO_BURN, (dwellAccum / DWELL_THRESHOLD_S) * MAX_LOGO_BURN);
            if (dwellAccum >= DWELL_THRESHOLD_S && phaseRef.current === "ambient") {
                fireGameDispatch({ type: "DWELL_THRESHOLD_REACHED" });
            }
            if (dwellAccum >= DWELL_THRESHOLD_S * 1.1 && phaseRef.current === "burning") {
                fireGameDispatch({ type: "BURN_COMPLETE" });
            }
        }
      }

      const st = now - strikeAt;
      flash = 0.55 * (st < 0 ? 0 : st < 0.07 ? st / 0.07 : Math.exp(-(st - 0.07) * 3.2));
      const ba = st < 0.09 ? 1 : Math.exp(-(st - 0.09) * 3.5);

      drawScene();
      F.clearRect(0, 0, W, H);
      F.globalCompositeOperation = "lighter";
      
      if (bolts.length) { if (ba < 0.02) bolts = []; else drawBolt(ba); }
      if (flash > 0.02) {
        const rg = F.createRadialGradient(hit.x, hit.y, 0, hit.x, hit.y, H * 0.5);
        rg.addColorStop(0, `rgba(140,175,255,${flash * 0.35})`);
        rg.addColorStop(1, "rgba(140,175,255,0)");
        F.fillStyle = rg; F.fillRect(0, 0, W, H);
      }
      F.globalCompositeOperation = "source-over";
    }

    raf = requestAnimationFrame(frame);
    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting));
    io.observe(hero);
    
    let rz: ReturnType<typeof setTimeout>;
    const onResize = () => { 
        clearTimeout(rz); 
        rz = setTimeout(() => { 
            size(); 
            // If resized into mobile view, halt active lightning 
            const wasEnabled = fxEnabled;
            fxEnabled = userFxPref && window.innerWidth >= 768;
            if (!fxEnabled && wasEnabled) {
                bolts = []; strikeAt = -99;
            }
        }, 200); 
    };
    window.addEventListener("resize", onResize);
    
    const toggle = (on: boolean) => {
      userFxPref = on;
      fxEnabled = userFxPref && window.innerWidth >= 768;
      if (!fxEnabled) { bolts = []; strikeAt = -99; } 
      else { nextAmb = performance.now() / 1000 + 1.5; }
    };
    (hero as any)._toggle = toggle;
    
    return () => { 
        cancelAnimationFrame(raf); 
        io.disconnect(); 
        window.removeEventListener("resize", onResize); 
    };
  }, []);

  return (
    <header ref={heroRef} className="relative h-[100svh] min-h-[560px] overflow-hidden bg-bg">
      <canvas ref={sceneRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
      
      <div ref={stageRef} className="relative z-[3] flex h-full flex-col">
        
        <nav aria-label="Main Navigation" className="relative">
          <div className="flex items-center justify-between px-5 py-6 sm:px-8">
            <div className="flex items-center">
              <Link id="astrape-nav-logo" href="/" className="font-display text-[1.35rem] font-bold tracking-tight no-underline">
                Astrape
              </Link>
            </div>
            
            {/* Nav list is entirely hidden on mobile via Tailwind's `hidden sm:flex` */}
            <ul className="hidden items-center gap-7 sm:flex m-0 p-0 list-none">
              <li>
                <Link href="/services" className="text-[.95rem] font-medium text-mute hover:text-ink">Services</Link>
              </li>
              <li>
                <Link href="/rebuild" className="text-[.95rem] font-medium text-mute hover:text-ink">Rebuild</Link>
              </li>
              <li>
                <Link href="/projects" className="text-[.95rem] font-medium text-mute hover:text-ink">Projects</Link>
              </li>
              <li>
                <Link href="/about" className="text-[.95rem] font-medium text-mute hover:text-ink">About</Link>
              </li>
              <li>
                <Link href="/contact" className="text-[.95rem] font-medium text-mute hover:text-ink">Contact</Link>
              </li>
              <li>
                <button type="button" className="text-[.95rem] font-medium text-mute hover:text-ink" onClick={() => setFxOn((v) => { const next = !v; (heroRef.current as any)?._toggle(next); return next; })}>
                  {fxOn ? "Effects on" : "Effects off"}
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <section aria-labelledby="hero-title" className="flex flex-1 flex-col items-center justify-center px-6 pb-[8vh] text-center">
          <div
            className={`relative inline-block ${fireGame.phase === "engulfed" && !isMobile ? "cursor-pointer" : ""}`}
            {...(fireGame.phase === "engulfed" && !isMobile
              ? { role: "button", tabIndex: 0, "aria-label": "Start Rebuild Mini-Game", onClick: () => fireGameDispatch({ type: "LOGO_CLICKED" }) }
              : {})}
          >
            <h1 id="hero-title" className="m-0 font-display text-[clamp(4.2rem,17vw,12rem)] font-extrabold leading-[.9] tracking-[-.035em]">
              Astrape
              <sup 
                id="astrape-copyright"
                role={fireGame.phase === "resolved" ? "button" : "presentation"}
                tabIndex={fireGame.phase === "resolved" ? 0 : -1}
                onClick={() => {
                    if (isMobile) return;
                    if (fireGame.phase === "resolved") {
                        localStorage.removeItem("astrape-fire-outcome");
                        fireGameDispatch({ type: "BADGE_CLICKED" });
                    }
                }}
                className={`absolute top-[4%] -right-[6%] flex items-center justify-center text-[clamp(1rem,2vw,1.8rem)] font-normal outline-none focus:outline-none select-none ${
                  fireGame.phase === "resolved" 
                    ? `${!isMobile ? "cursor-pointer hover:opacity-100 hover:scale-110 active:scale-95" : ""} opacity-80 transition-all duration-300` 
                    : "opacity-0 pointer-events-none transition-none" 
                }`}
                style={
                  fireGame.phase === "resolved" && fireGame.outcome === "won" && !isMobile
                    ? {
                        color: "#ff9a3d",
                        textShadow: "0 0 10px rgba(255, 130, 40, 0.8), 0 -2px 4px rgba(255, 230, 150, 0.6)",
                      }
                    : { color: "var(--mute)" } 
                }
                title={fireGame.phase === "resolved" ? (fireGame.outcome === "won" ? "Replay Game" : "Retry") : ""}
              >
                {fireGame.phase === "resolved" && fireGame.outcome === "lost" ? "↻" : "©"}
              </sup>
            </h1>
          </div>
          
          <div 
            className={`mt-4 flex flex-col items-center gap-8 transition-all duration-700 ease-in-out ${
              fireGame.phase === "ambient" || fireGame.phase === "resolved" 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-6 pointer-events-none"
            }`}
          >
            <div className="flex max-w-2xl flex-col items-center gap-3">
              <h2 className="m-0 text-[clamp(1.4rem,3vw,2rem)] font-semibold tracking-tight text-ink">
                Custom websites that load instantly.
              </h2>
              <p className="m-0 text-[clamp(1rem,1.2vw,1.1rem)] text-mute">
                A web studio for businesses that want a site nobody mistakes for a template.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/contact" 
                className="rounded-md bg-ink px-6 py-3 text-[.95rem] font-medium text-bg transition-transform hover:scale-105 active:scale-95"
              >
                Start a project
              </Link>
              <Link 
                href="/services" 
                className="rounded-md border border-mute/30 bg-transparent px-6 py-3 text-[.95rem] font-medium text-ink transition-colors hover:border-mute/60 hover:bg-mute/10 active:scale-95"
              >
                What we do
              </Link>
            </div>
          </div>
        </section>

      </div>
      
      <canvas ref={fxRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[61] block h-full w-full" />
      
      {/* Do not even mount the game layout on mobile devices */}
      {!isMobile && (fireGame.phase === "collapsing" || fireGame.phase === "playing" || fireGame.phase === "winning" || fireGame.phase === "losing") && (
        <FireGameOverlay state={fireGame} dispatch={fireGameDispatch} />
      )}
    </header>
  );
}
