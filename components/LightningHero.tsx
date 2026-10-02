"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useFireGame } from "@/hooks/useFireGame";
import { AMBIENT_STRIKE_INTERVAL_S, DWELL_THRESHOLD_S, MAX_LOGO_BURN } from "@/lib/fire-game/constants";
import type { FireGamePhase, FireGameOutcome } from "@/lib/fire-game/types";

const FireGameOverlay = dynamic(() => import("./fire-game/FireGameOverlay"), { ssr: false });

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/rebuild", label: "Rebuild" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

const LAYER_CFG = [
  { b: 0.8, h: [0.16, 0.26], s: 0.022, col: "#5e4632", lit: "#5b76b8", w: 1.6, k: 1, base: 0.4, edge: 0 },
  { b: 0.88, h: [0.26, 0.4], s: 0.04, col: "#553a27", lit: "#3d4f8c", w: 2.4, k: 0.85, base: 0.6, edge: 0 },
  { b: 0.98, h: [0.4, 0.62], s: 0.075, col: "#47301f", lit: "#232e56", w: 3.4, k: 0.75, base: 0.9, edge: 1 },
];
type LayerCfg = (typeof LAYER_CFG)[number];

const inertProps = (on: boolean) => (on ? { inert: true } : {});

export default function LightningHero() {
  const { state: fireGame, dispatch: fireGameDispatch } = useFireGame();

  const phaseRef = useRef<FireGamePhase>(fireGame.phase);
  const outcomeRef = useRef<FireGameOutcome | null>(fireGame.outcome);

  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fxOn, setFxOn] = useState(true);

  const heroRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const toggleFxRef = useRef<((on: boolean) => void) | null>(null);

  useEffect(() => {
    phaseRef.current = fireGame.phase;
    outcomeRef.current = fireGame.outcome;
  }, [fireGame.phase, fireGame.outcome]);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setFxOn(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    menuRef.current?.querySelector("a")?.focus();

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (fireGame.phase === "burning" || fireGame.phase === "engulfed") void import("./fire-game/FireGameOverlay");
  }, [fireGame.phase]);

  useEffect(() => {
    toggleFxRef.current?.(fxOn);
  }, [fxOn]);

  useEffect(() => {
    const hero = heroRef.current!;
    const sc = sceneRef.current!;
    const fx = fxRef.current!;
    const S = sc.getContext("2d")!;
    const F = fx.getContext("2d")!;

    let W = 0, H = 0, DPR = 1;
    let layers: { c: LayerCfg; img: HTMLCanvasElement; lit: HTMLCanvasElement | null }[] = [];

    let userFxPref = true;
    let fxEnabled = userFxPref && window.innerWidth >= 768;

    let flash = 0, strikeAt = -99, bolts: number[][] = [], hit = { x: 0, y: 0 }, visible = true;
    let drewOnce = false;
    let frameDt = 1 / 60;
    let dwellAccum = 0, burnAmount = 0;

    interface Tree { x: number; base: number; h: number; layer: number; segs: number[][]; igAt: number }
    interface FireBit { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; kind: 0 | 1 | 2 }
    let trees: Tree[] = [];
    let burning: Tree[] = [];
    const fireBits: FireBit[] = [];
    let nextSpread = 0;
    let sceneNow = 0;
    const flames: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[] = [];

    const RGB = "120,160,255";
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const rng = (s: number) => () => (s = (s * 16807) % 2147483647) / 2147483647;
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    function sprite(px: number, stops: [number, string][]) {
      const c = document.createElement("canvas");
      c.width = c.height = px;
      const g = c.getContext("2d")!;
      const rg = g.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
      for (const [o, col] of stops) rg.addColorStop(o, col);
      g.fillStyle = rg;
      g.fillRect(0, 0, px, px);
      return c;
    }
    const SPR_HOT = sprite(64, [[0, "rgba(255,245,205,1)"], [0.22, "rgba(255,196,90,0.9)"], [0.6, "rgba(255,120,35,0.3)"], [1, "rgba(255,70,15,0)"]]);
    const SPR_COOL = sprite(64, [[0, "rgba(255,170,70,0.8)"], [0.4, "rgba(232,85,25,0.45)"], [1, "rgba(150,25,0,0)"]]);
    const SPR_LIGHT = sprite(128, [[0, "rgba(255,150,70,1)"], [0.5, "rgba(255,105,35,0.3)"], [1, "rgba(255,80,20,0)"]]);

    type Pen = { moveTo(x: number, y: number): void; lineTo(x: number, y: number): void };

    function limb(p: Pen, segs: number[][] | null, x: number, y: number, len: number, ang: number, dep: number, r: () => number) {
      if (dep > 4 || len < 4) return;
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      p.moveTo(x, y); p.lineTo(x2, y2);
      segs?.push([x, y, x2, y2]);
      const n = dep === 0 ? 1 : r() < 0.75 ? 2 : 1;
      for (let i = 0; i < n; i++) limb(p, segs, x2, y2, len * (0.68 + r() * 0.14), ang + (r() - 0.5) * 1.1 - 0.15, dep + 1, r);
    }

    function tree(p: Pen, segs: number[][] | null, x: number, base: number, h: number, r: () => number) {
      p.moveTo(x, base); p.lineTo(x, base - h * 0.3);
      segs?.push([x, base, x, base - h * 0.3]);
      const branches = 3 + ((r() * 2) | 0);
      for (let i = 0; i < branches; i++) {
        limb(p, segs, x, base - h * 0.3 * (i / (branches - 1 || 1)), h * (0.5 - (i / (branches - 1 || 1)) * 0.15), -Math.PI / 2 + (r() - 0.5) * 1.5, 0, r);
      }
    }

    function build(cfg: LayerCfg, i: number, needLit: boolean) {
      const mk = () => {
        const c = document.createElement("canvas");
        c.width = W * DPR; c.height = H * DPR;
        const x = c.getContext("2d")!;
        x.scale(DPR, DPR);
        return { c, x };
      };
      const brown = mk();
      const lit = needLit ? mk() : null;
      const r = rng(1000 + i * 77), base = H * cfg.b;
      const path = new Path2D();
      const out: Tree[] = [];
      for (let px = -10; px < W + 30; px += W * cfg.s * (0.7 + r() * 0.7)) {
        if (cfg.edge && Math.abs(px - W / 2) < W * 0.28 && r() < 0.9) continue;
        const h = H * (cfg.h[0] + r() * (cfg.h[1] - cfg.h[0]));
        const segs: number[][] | null = needLit ? [] : null;
        tree(path, segs, px, base, h, r);
        if (segs) out.push({ x: px, base, h, layer: i, segs, igAt: -1 });
      }

      const gr = rng(5000 + i * 31);
      const ground = new Path2D();
      ground.moveTo(-10, H);
      for (let gx = -10; gx <= W + 30; gx += W / 16) ground.lineTo(gx, base + gr() * H * 0.012);
      ground.lineTo(W + 30, H);
      ground.closePath();

      for (const [t, col] of [[brown, cfg.col], [lit, cfg.lit]] as const) {
        if (!t) continue;
        t.x.fillStyle = col;
        t.x.fill(ground);
        t.x.strokeStyle = col; t.x.lineWidth = cfg.w; t.x.lineCap = "round";
        t.x.stroke(path);
      }
      return { img: brown.c, lit: lit ? lit.c : null, trees: out };
    }

    function size() {
      drewOnce = false;
      DPR = Math.min(devicePixelRatio || 1, 1.5);
      W = hero.clientWidth; H = hero.clientHeight;
      for (const c of [sc, fx]) { c.width = W * DPR; c.height = H * DPR; }
      S.setTransform(DPR, 0, 0, DPR, 0, 0); F.setTransform(DPR, 0, 0, DPR, 0, 0);

      const needLit = window.innerWidth >= 768;
      const built = LAYER_CFG.map((c, i) => ({ c, ...build(c, i, needLit) }));
      const old = trees;
      layers = built.map((b) => ({ c: b.c, img: b.img, lit: b.lit }));
      trees = built.flatMap((b) => b.trees);

      if (old.length === trees.length) trees.forEach((t, i) => { t.igAt = old[i].igAt; });
      burning = trees.filter((t) => t.igAt >= 0);
      fireBits.length = 0;
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
        S.globalAlpha = L.c.base;
        S.drawImage(L.img, 0, 0, W, H);
        if (L.lit && flash > 0.01) {
          S.globalAlpha = Math.min(1, flash * L.c.k);
          S.drawImage(L.lit, 0, 0, W, H);
        }
      }
      S.globalAlpha = 1;

      if (fxEnabled) {
        const phase = phaseRef.current;
        if (phase === "ambient" || phase === "burning" || phase === "engulfed") {
          drawFire();
        } else if (phase === "resolved" && outcomeRef.current === "won") {
          drawWinFlames();
        }
      }
    }

    function stepFlame(f: (typeof flames)[number]) {
      f.life += frameDt;
      f.x += f.vx * frameDt * 60;
      f.y += f.vy * frameDt * 60;
    }

    function drawWinFlames() {
      S.save();
      S.globalCompositeOperation = "lighter";

      const el = badgeRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const heroRect = hero.getBoundingClientRect();
        const cx = rect.left - heroRect.left + rect.width * 0.48;
        const cy = rect.top - heroRect.top + rect.height * 0.52;
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
            size: rnd(3, 6),
          });
        }
      }

      for (let i = flames.length - 1; i >= 0; i--) {
        const f = flames[i];
        stepFlame(f);
        if (f.life >= f.maxLife) { flames.splice(i, 1); continue; }

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

    const burnNorm = () => Math.min(1, burnAmount / MAX_LOGO_BURN);
    const treeIntensity = (t: Tree) => clamp01((sceneNow - t.igAt) / 3) * (0.45 + 0.55 * burnNorm());

    function ignite(t: Tree, now: number) {
      if (t.igAt >= 0) return;
      t.igAt = now;
      burning.push(t);
    }

    function clearTreeFire() {
      for (const t of trees) t.igAt = -1;
      burning = [];
      fireBits.length = 0;
    }

    function pickStrike(): { x: number; y: number; tree: Tree | null } {
      if (!trees.length) return { x: W * rnd(0.12, 0.88), y: H * rnd(0.7, 0.82), tree: null };
      const t = trees[Math.floor(Math.random() * trees.length)];
      let top = Infinity;
      for (const sg of t.segs) top = Math.min(top, sg[1], sg[3]);
      const limit = top + (t.base - top) * 0.3;
      const crown = t.segs.filter((sg) => sg[3] < limit);
      const pick = crown.length ? crown[Math.floor(Math.random() * crown.length)] : t.segs[t.segs.length - 1];
      return { x: pick[2], y: pick[3], tree: t };
    }

    function updateFire(now: number, dt: number) {
      const norm = burnNorm();
      const target = Math.max(1, Math.round(trees.length * (0.03 + 0.97 * Math.pow(norm, 1.15))));
      if (burning.length > 0 && burning.length < target && now > nextSpread) {
        const from = burning[Math.floor(Math.random() * burning.length)];
        let best: Tree | null = null, bestD = Infinity;
        for (const t of trees) {
          if (t.igAt >= 0) continue;
          const d = Math.abs(t.x - from.x) + Math.abs(t.layer - from.layer) * W * 0.04 + Math.random() * W * 0.02;
          if (d < bestD) { bestD = d; best = t; }
        }
        if (best) ignite(best, now);
        nextSpread = now + rnd(0.6, 1.6);
      }

      for (const t of burning) {
        if (fireBits.length > 650) break;
        const I = treeIntensity(t);
        if (I <= 0.01) continue;
        const depth = 0.7 + 0.3 * t.layer;
        const n = (5 + 10 * I) * dt;
        let k = Math.floor(n);
        if (Math.random() < n - k) k++;
        for (let i = 0; i < k; i++) {
          const roll = Math.random();
          if (roll < 0.1) {
            // spark
            const sg = t.segs[Math.floor(Math.random() * t.segs.length)];
            fireBits.push({ x: sg[2], y: sg[3], vx: rnd(-30, 30), vy: -rnd(50, 120), life: 0, maxLife: rnd(0.9, 1.8), size: rnd(1.2, 2.2), kind: 2 });
          } else if (roll < 0.35) {
            fireBits.push({
              x: t.x + rnd(-1, 1) * (18 + 50 * I) * depth,
              y: t.base + rnd(-3, 4),
              vx: rnd(-10, 10), vy: -rnd(25, 55) * depth,
              life: 0, maxLife: rnd(0.35, 0.7), size: rnd(4, 8) * depth * (1 + norm * 0.5), kind: 1,
            });
          } else {
            const sg = t.segs[Math.floor(Math.random() * t.segs.length)];
            const u = Math.random();
            fireBits.push({
              x: lerp(sg[0], sg[2], u), y: lerp(sg[1], sg[3], u),
              vx: rnd(-12, 12) * depth, vy: -rnd(35, 80) * (0.6 + norm * 0.8) * depth,
              life: 0, maxLife: rnd(0.35, 0.75), size: rnd(4, 9) * depth * (1 + norm * 0.5), kind: 0,
            });
          }
        }
      }

      for (let i = fireBits.length - 1; i >= 0; i--) {
        const b = fireBits[i];
        b.life += dt;
        if (b.life >= b.maxLife) { fireBits[i] = fireBits[fireBits.length - 1]; fireBits.pop(); continue; }
        b.x += (b.vx + Math.sin(b.life * 9 + b.x) * 8) * dt;
        b.y += b.vy * dt;
      }
    }

    function drawFire() {
      if (burning.length === 0) return;
      S.save();
      S.globalCompositeOperation = "lighter";

      for (const t of burning) {
        const I = treeIntensity(t);
        if (I <= 0.01) continue;
        const flick = 0.85 + 0.15 * Math.sin(sceneNow * 11 + t.x * 0.37);
        const R = 30 + 0.14 * t.h + 45 * I;
        S.globalAlpha = 0.17 * I * flick;
        S.drawImage(SPR_LIGHT, t.x - R, t.base - t.h * 0.3 - R, R * 2, R * 2);
        S.drawImage(SPR_LIGHT, t.x - R, t.base - t.h * 0.6 - R, R * 2, R * 2);
      }

      for (const b of fireBits) {
        const prog = b.life / b.maxLife;
        const s = b.size * (1 - prog * 0.5);
        if (b.kind === 2) {
          S.globalAlpha = 0.9 * (1 - prog);
          S.drawImage(SPR_HOT, b.x - s, b.y - s, s * 2, s * 2);
        } else {
          S.globalAlpha = 0.8 * (1 - prog * prog);
          S.drawImage(prog < 0.35 ? SPR_HOT : SPR_COOL, b.x - s * 0.8, b.y - s * 2.4, s * 1.6, s * 3.2);
        }
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

    let ready = false;
    let initRaf = 0;
    let initTimer: ReturnType<typeof setTimeout> | undefined;
    const t0 = performance.now() / 1000;
    let nextAmb = t0 + rnd(1, 2.5);

    let lastFrameNow = t0, raf = 0;
    function frame(ts: number) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const now = ts / 1000;
      const dt = Math.min(0.5, Math.max(0, now - lastFrameNow));
      lastFrameNow = now;
      frameDt = Math.min(0.05, dt || 1 / 60);

      const idle = !fxEnabled && flash < 0.01 && bolts.length === 0;
      if (idle && drewOnce) {
        cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      drewOnce = idle;

      const phase = phaseRef.current;
      if (phase === "playing" || phase === "collapsing") {
        burnAmount = 0;
        clearTreeFire();
        flames.length = 0;
      } else if (phase === "resolved") {
        burnAmount = 0;
        clearTreeFire();
        if (outcomeRef.current !== "won") flames.length = 0;
      } else if (phase === "engulfed") {
        burnAmount = MAX_LOGO_BURN;
      }

      if (fxEnabled && now > nextAmb) {
        const hitTree = pickStrike();
        strike(hitTree.x, hitTree.y);

        if (hitTree.tree && (phaseRef.current === "ambient" || phaseRef.current === "burning")) ignite(hitTree.tree, now);

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

      sceneNow = now;
      if (fxEnabled && (phaseRef.current === "ambient" || phaseRef.current === "burning" || phaseRef.current === "engulfed")) {
        updateFire(now, frameDt);
      }

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

    const wake = () => {
      if (!ready || raf) return;
      lastFrameNow = performance.now() / 1000;
      raf = requestAnimationFrame(frame);
    };
    initRaf = requestAnimationFrame(() => {
      initTimer = setTimeout(() => {
        size();
        ready = true;
        raf = requestAnimationFrame(frame);
      }, 0);
    });
    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting));
    io.observe(hero);

    let rz: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rz);
      rz = setTimeout(() => {
        size();
        const wasEnabled = fxEnabled;
        fxEnabled = userFxPref && window.innerWidth >= 768;
        if (!fxEnabled && wasEnabled) { bolts = []; strikeAt = -99; }
        wake();
      }, 200);
    };
    window.addEventListener("resize", onResize);

    toggleFxRef.current = (on: boolean) => {
      userFxPref = on;
      fxEnabled = userFxPref && window.innerWidth >= 768;
      drewOnce = false;
      if (!fxEnabled) { bolts = []; strikeAt = -99; }
      else { nextAmb = performance.now() / 1000 + 1.5; }
      wake();
    };

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(initRaf);
      clearTimeout(initTimer);
      clearTimeout(rz);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      toggleFxRef.current = null;
    };
  }, []);

  const phase = fireGame.phase;
  const engulfed = phase === "engulfed";
  const resolved = phase === "resolved";
  const badgeClickable = resolved && !isMobile;
  const badgeWon = resolved && fireGame.outcome === "won" && !isMobile;
  const introVisible = phase === "ambient" || resolved;
  const menuHidden = isMobile && !menuOpen;

  return (
    <header ref={heroRef} className="relative h-[100svh] min-h-[560px] overflow-hidden bg-bg">
      <canvas ref={sceneRef} id="hero-scene" aria-hidden="true" className="absolute inset-0 block h-full w-full" />

      <div id="hero-stage" className="relative flex h-full flex-col">
        {/*
          Single nav for every breakpoint. On mobile the <ul> becomes a fixed full-screen panel, and the logo and
          hamburger sit above it (z-10) in the SAME elements, so nothing is duplicated and the logo cannot shift.
          The nav only raises its z-index on mobile so the desktop game overlay is never covered.
        */}
        <nav
          aria-label="Main"
          className="relative flex min-h-[4.75rem] items-center justify-between px-5 py-3 sm:px-8 max-md:z-[1000]"
        >
          <Link
            href="/"
            id="astrape-nav-logo"
            onClick={() => setMenuOpen(false)}
            className="relative z-10 font-display text-[1.35rem] font-bold leading-none tracking-tight no-underline"
          >
            Astrape
          </Link>

          <ul
            id="primary-menu"
            ref={menuRef}
            {...inertProps(menuHidden)}
            className={`m-0 flex list-none items-center p-0 md:gap-7
              max-md:fixed max-md:inset-0 max-md:z-0 max-md:flex-col max-md:justify-center max-md:gap-8 max-md:bg-[#03040a]
              max-md:transition-[opacity,visibility] max-md:duration-300 max-md:ease-out motion-reduce:max-md:transition-none
              ${menuOpen ? "max-md:visible max-md:opacity-100" : "max-md:invisible max-md:opacity-0"}`}
          >
            {NAV_LINKS.map((link, i) => (
              <li
                key={link.href}
                style={{ transitionDelay: menuOpen ? `${100 + i * 50}ms` : "0ms" }}
                className={`max-md:transition-[opacity,transform] max-md:duration-300 max-md:ease-out motion-reduce:max-md:transition-none ${
                  menuOpen ? "max-md:translate-y-0 max-md:opacity-100" : "max-md:translate-y-3 max-md:opacity-0"
                }`}
              >
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-[.95rem] font-medium text-mute hover:text-ink focus-visible:text-ink max-md:text-[1.25rem]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="max-md:hidden">
              <button
                type="button"
                aria-pressed={fxOn}
                onClick={() => setFxOn((v) => !v)}
                className="text-[.95rem] font-medium text-mute hover:text-ink"
              >
                {fxOn ? "Effects on" : "Effects off"}
              </button>
            </li>
          </ul>

          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
            className="relative z-10 -mr-2.5 flex h-11 w-11 items-center justify-center text-mute hover:text-ink focus-visible:text-ink md:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <line
                x1="4" y1="6" x2="20" y2="6"
                className={`origin-center [transform-box:fill-box] transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  menuOpen ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <line
                x1="4" y1="12" x2="20" y2="12"
                className={`origin-center [transform-box:fill-box] transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none ${
                  menuOpen ? "scale-x-0 opacity-0" : ""
                }`}
              />
              <line
                x1="4" y1="18" x2="20" y2="18"
                className={`origin-center [transform-box:fill-box] transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  menuOpen ? "-translate-y-[6px] -rotate-45" : ""
                }`}
              />
            </svg>
          </button>
        </nav>

        <section aria-labelledby="hero-title" className="flex flex-1 flex-col items-center justify-center px-6 pb-[8vh] text-center">
          {/* This wrapper div is needed as the positioning context for the logo button and the © badge. */}
          <div className="relative inline-block">
            <h1 id="hero-title" className="m-0 font-display text-[clamp(4.2rem,17vw,12rem)] font-extrabold leading-[.9] tracking-[-.035em]">
              Astrape
            </h1>

            {engulfed && !isMobile && (
              <button
                type="button"
                aria-label="Start Rebuild mini-game"
                onClick={() => fireGameDispatch({ type: "LOGO_CLICKED" })}
                className="absolute inset-0 cursor-pointer rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              />
            )}

            <button
              ref={badgeRef}
              id="astrape-copyright"
              type="button"
              disabled={!badgeClickable}
              aria-hidden={!badgeClickable}
              aria-label={badgeClickable ? (fireGame.outcome === "won" ? "Replay game" : "Retry game") : undefined}
              onClick={() => fireGameDispatch({ type: "BADGE_CLICKED" })}
              style={badgeWon ? { color: "#ff9a3d", textShadow: "0 0 10px rgba(255, 130, 40, 0.8), 0 -2px 4px rgba(255, 230, 150, 0.6)" } : { color: "var(--mute)" }}
              className={`absolute right-[-6%] top-[4%] m-0 flex select-none items-center justify-center border-0 bg-transparent p-0 text-[clamp(1rem,2vw,1.8rem)] font-normal leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${
                resolved
                  ? `opacity-80 transition-all duration-300 ${badgeClickable ? "cursor-pointer hover:scale-110 hover:opacity-100 active:scale-95" : ""}`
                  : "pointer-events-none opacity-0 transition-none"
              }`}
            >
              {resolved && fireGame.outcome === "lost" ? "↻" : "©"}
            </button>
          </div>

          {/* Wrapper needed so the whole intro can fade as one; inert stops hidden links being tabbable. */}
          <div
            {...inertProps(!introVisible)}
            className={`mt-4 flex flex-col items-center gap-8 transition-all duration-700 ease-in-out motion-reduce:transition-none ${
              introVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
            }`}
          >
            <hgroup className="flex max-w-2xl flex-col items-center gap-3">
              <h2 className="m-0 text-[clamp(1.4rem,3vw,2rem)] font-semibold tracking-tight text-ink">
                Websites built around your business
              </h2>
              <p className="m-0 text-[clamp(1rem,1.2vw,1.1rem)] text-mute">
                High-performance websites built around your business, not squeezed into a generic template
              </p>
            </hgroup>

            <ul className="m-0 flex list-none items-center gap-4 p-0">
              <li>
                <Link
                  href="/contact"
                  className="block rounded-md bg-ink px-6 py-3 text-[.95rem] font-medium text-bg transition-transform hover:scale-105 active:scale-95"
                >
                  Start a project
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="block rounded-md border border-mute/30 bg-transparent px-6 py-3 text-[.95rem] font-medium text-ink transition-colors hover:border-mute/60 hover:bg-mute/10 active:scale-95"
                >
                  What we do
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <canvas ref={fxRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[61] block h-full w-full max-md:hidden" />

      {!isMobile && (phase === "collapsing" || phase === "playing" || phase === "winning" || phase === "losing") && (
        <FireGameOverlay state={fireGame} dispatch={fireGameDispatch} />
      )}
    </header>
  );
}
