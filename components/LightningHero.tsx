"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function LightningHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const clRef = useRef<HTMLDivElement>(null);
  const crRef = useRef<HTMLDivElement>(null);
  const [fxOn, setFxOn] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const hero = heroRef.current!;
    const sc = sceneRef.current!;
    const fx = fxRef.current!;
    const stage = stageRef.current!;
    const cl = clRef.current!;
    const cr = crRef.current!;
    const S = sc.getContext("2d")!;
    const F = fx.getContext("2d")!;

    let W = 0,
      H = 0,
      DPR = 1,
      layers: { c: (typeof CFG)[number]; img: HTMLCanvasElement }[] = [];
    let fxEnabled = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    let flash = 0,
      strikeAt = -99,
      bolts: number[][] = [],
      hit = { x: 0, y: 0 },
      open = 0,
      introDone = false,
      visible = true,
      boltScale = 1;
    const ao: number[][] = [[], []];
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
      const x2 = x + Math.cos(ang) * len,
        y2 = y + Math.sin(ang) * len;
      c.moveTo(x, y);
      c.lineTo(x2, y2);
      const n = dep === 0 ? 1 : r() < 0.75 ? 2 : 1;
      for (let i = 0; i < n; i++) limb(c, x2, y2, len * (0.68 + r() * 0.14), ang + (r() - 0.5) * 1.1 - 0.15, dep + 1, r);
    }
    function tree(c: CanvasRenderingContext2D, x: number, base: number, h: number, r: () => number, w: number) {
      c.lineWidth = w;
      c.moveTo(x, base);
      c.lineTo(x, base - h * 0.3);
      const branches = 3 + ((r() * 2) | 0);
      for (let i = 0; i < branches; i++) {
        const t = i / (branches - 1 || 1);
        limb(c, x, base - h * 0.3 * t, h * (0.5 - t * 0.15), -Math.PI / 2 + (r() - 0.5) * 1.5, 0, r);
      }
    }
    function build(cfg: (typeof CFG)[number], i: number) {
      const c = document.createElement("canvas");
      c.width = W * DPR;
      c.height = H * DPR;
      const x = c.getContext("2d")!;
      x.scale(DPR, DPR);
      const r = rng(1000 + i * 77),
        base = H * cfg.b;
      x.strokeStyle = cfg.lit;
      x.lineCap = "round";
      x.beginPath();
      for (let px = -10; px < W + 30; px += W * cfg.s * (0.7 + r() * 0.7)) {
        if (cfg.edge && Math.abs(px - W / 2) < W * 0.28 && r() < 0.9) continue;
        tree(x, px, base, H * (cfg.h[0] + r() * (cfg.h[1] - cfg.h[0])), r, cfg.w);
      }
      x.stroke();
      return c;
    }
    function size() {
      DPR = Math.min(devicePixelRatio || 1, 1.5);
      W = hero.clientWidth;
      H = hero.clientHeight;
      for (const c of [sc, fx]) {
        c.width = W * DPR;
        c.height = H * DPR;
      }
      S.setTransform(DPR, 0, 0, DPR, 0, 0);
      F.setTransform(DPR, 0, 0, DPR, 0, 0);
      layers = CFG.map((c, i) => ({ c, img: build(c, i) }));
    }
    function drawScene() {
      S.fillStyle = "#03040a";
      S.fillRect(0, 0, W, H);
      if (flash > 0.01) {
        const rg = S.createRadialGradient(hit.x, H * 0.3, 0, hit.x, H * 0.3, H * 0.9);
        rg.addColorStop(0, `rgba(${RGB},${flash * 0.22})`);
        rg.addColorStop(1, `rgba(${RGB},0)`);
        S.fillStyle = rg;
        S.fillRect(0, 0, W, H);
      }
      for (const L of layers) {
        S.globalAlpha = Math.min(1, L.c.base + flash * L.c.k);
        S.drawImage(L.img, 0, 0, W, H);
      }
      S.globalAlpha = 1;
    }
    function seg(x1: number, y1: number, x2: number, y2: number, d: number, dep: number, o: number[][]) {
      if (d < 3) {
        o.push([x1, y1, x2, y2, dep]);
        return;
      }
      const mx = (x1 + x2) / 2 + rnd(-d, d),
        my = (y1 + y2) / 2 + rnd(-d, d) * 0.3;
      seg(x1, y1, mx, my, d / 2, dep, o);
      seg(mx, my, x2, y2, d / 2, dep, o);
      if (dep < 2 && Math.random() < 0.07) seg(mx, my, mx + rnd(-1, 1) * H * 0.18, my + rnd(0.05, 0.25) * H, d / 2, dep + 1, o);
    }
    function strike(x: number, y: number, big?: boolean) {
      bolts = [];
      seg(x + rnd(-90, 90), -10, x, y, H * 0.16, 0, bolts);
      hit = { x, y };
      strikeAt = performance.now() / 1000;
      boltScale = big ? 1.7 : 1;
    }
    // Trace only the main trunk of the bolt (dep === 0, ignoring side-branches)
    // into a top-to-bottom polyline, extended straight down to the floor of
    // the hero so it spans the full curtain height.
    function boltSpine() {
      const trunk = bolts.filter((s) => s[4] === 0);
      const pts: { x: number; y: number }[] = [];
      for (const s of trunk) {
        pts.push({ x: s[0], y: Math.max(0, s[1]) });
        pts.push({ x: s[2], y: Math.max(0, s[3]) });
      }
      pts.sort((a, b) => a.y - b.y);
      const spine: { x: number; y: number }[] = [];
      for (const p of pts) {
        const last = spine[spine.length - 1];
        if (!last || p.y - last.y > 0.5) spine.push(p);
      }
      if (!spine.length) return [{ x: W / 2, y: 0 }, { x: W / 2, y: H }];
      if (spine[0].y > 0) spine.unshift({ x: spine[0].x, y: 0 });
      spine.push({ x: spine[spine.length - 1].x, y: H });
      return spine;
    }
    // Clip the two curtain panels so their facing edge follows the bolt's
    // path instead of a straight vertical line. The curtains keep sliding
    // apart exactly as before; only the shape of the torn edge changes.
    function clipCurtainsToBolt() {
      const spine = boltSpine();
      const panelL = W * 0.502;
      const panelR = W * 0.502;
      const rightStart = W - panelR;
      const pct = (n: number) => Math.max(0, Math.min(100, n)).toFixed(2);
      const leftPts = spine.map((p) => `${pct((p.x / panelL) * 100)}% ${pct((p.y / H) * 100)}%`);
      const rightPts = spine.map((p) => `${pct(((p.x - rightStart) / panelR) * 100)}% ${pct((p.y / H) * 100)}%`);
      const leftPoly = `polygon(0% 0%, ${leftPts.join(", ")}, 0% 100%)`;
      const rightPoly = `polygon(${rightPts.join(", ")}, 100% 100%, 100% 0%)`;
      cl.style.clipPath = leftPoly;
      cr.style.clipPath = rightPoly;
      (cl.style as any).webkitClipPath = leftPoly;
      (cr.style as any).webkitClipPath = rightPoly;
    }
    function drawBolt(a: number) {
      F.lineCap = "round";
      F.lineJoin = "round";
      for (const [w, c, al] of [
        [12, "110,150,255", 0.1],
        [4, "160,190,255", 0.35],
        [1.6, "255,255,255", 0.95],
      ] as const) {
        F.strokeStyle = `rgba(${c},${al * a})`;
        for (const s of bolts) {
          F.lineWidth = (w as number) * boltScale / (1 + s[4] * 0.9);
          F.beginPath();
          F.moveTo(s[0], s[1]);
          F.lineTo(s[2], s[3]);
          F.stroke();
        }
      }
    }
    function regen() {
      for (const o of ao) {
        o.length = 0;
        let v = 0;
        for (let i = 0; i <= H / 12 + 1; i++) {
          v = v * 0.55 + rnd(-9, 9);
          o.push(v);
        }
      }
    }
    function arc(x: number, a: number, k: number) {
      const o = ao[k];
      F.lineCap = "round";
      for (const [w, c, al] of [
        [9, "110,150,255", 0.14],
        [3, "170,200,255", 0.5],
        [1.2, "255,255,255", 0.9],
      ] as const) {
        F.strokeStyle = `rgba(${c},${al * a})`;
        F.lineWidth = w as number;
        F.beginPath();
        o.forEach((v, i) => (i ? F.lineTo(x + v, i * 12) : F.moveTo(x + v, 0)));
        F.stroke();
      }
    }
    function finish() {
      introDone = true;
      open = 1;
      cl.style.display = cr.style.display = "none";
      stage.classList.remove("opacity-0");
      stage.classList.add("opacity-100");
    }

    let seen = false;
    try {
      seen = !!sessionStorage.getItem("astrape-intro");
      sessionStorage.setItem("astrape-intro", "1");
    } catch {}

    size();
    regen();
    let t0 = performance.now() / 1000,
      did = [false, false],
      nextAmb = 0,
      lastR = 0;
    const STRIKE_T = 0.6,
      OPEN_START = 0.85,
      OPEN_DUR = 2.4;
    if (!fxEnabled || seen) {
      finish();
      nextAmb = t0 + 1.2;
    }

    let raf = 0;
    function frame(ts: number) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const now = ts / 1000,
        t = now - t0;
      let p = 0;
      if (fxEnabled && !introDone) {
        if (!did[0] && t > STRIKE_T) {
          did[0] = true;
          strike(W / 2, H * 0.5, true);
          clipCurtainsToBolt();
        }
        p = Math.min(1, Math.max(0, (t - OPEN_START) / OPEN_DUR));
        open = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        cl.style.transform = `translateX(${-open * 100}%)`;
        cr.style.transform = `translateX(${open * 100}%)`;
        if (p >= 1 && !did[1]) {
          did[1] = true;
          finish();
          nextAmb = now + rnd(2.5, 4);
        }
      } else if (fxEnabled && now > nextAmb) {
        strike(W * rnd(0.12, 0.88), H * rnd(0.7, 0.82));
        nextAmb = now + rnd(9, 15);
      }
      const st = now - strikeAt;
      flash = 0.55 * (st < 0 ? 0 : st < 0.07 ? st / 0.07 : Math.exp(-(st - 0.07) * 3.2));
      const ba = st < 0.09 ? 1 : Math.exp(-(st - 0.09) * 3.5);
      drawScene();
      F.clearRect(0, 0, W, H);
      F.globalCompositeOperation = "lighter";
      if (bolts.length) {
        if (ba < 0.02) bolts = [];
        else drawBolt(ba);
      }
      if (flash > 0.02) {
        const rg = F.createRadialGradient(hit.x, hit.y, 0, hit.x, hit.y, H * 0.5);
        rg.addColorStop(0, `rgba(140,175,255,${flash * 0.35})`);
        rg.addColorStop(1, "rgba(140,175,255,0)");
        F.fillStyle = rg;
        F.fillRect(0, 0, W, H);
      }
      if (fxEnabled && !introDone && t > OPEN_START && p < 1) {
        if (now - lastR > 0.11) {
          regen();
          lastR = now;
        }
        const a = Math.min(1, (t - OPEN_START) / 0.8) * (1 - Math.max(0, (p - 0.7) / 0.3));
        arc(W / 2 - open * (W / 2), a, 0);
        arc(W / 2 + open * (W / 2), a, 1);
      }
      F.globalCompositeOperation = "source-over";
      hero.style.setProperty("--f", flash.toFixed(2));
    }
    raf = requestAnimationFrame(frame);

    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting));
    io.observe(hero);
    let rz: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rz);
      rz = setTimeout(() => {
        size();
        regen();
      }, 200);
    };
    window.addEventListener("resize", onResize);

    const toggle = (on: boolean) => {
      fxEnabled = on;
      if (!on) {
        bolts = [];
        strikeAt = -99;
        if (!introDone) finish();
      } else {
        nextAmb = performance.now() / 1000 + 3;
      }
    };
    (hero as any)._toggle = toggle;

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <header ref={heroRef} className="relative h-[100svh] min-h-[560px] overflow-hidden bg-bg [--f:0]">
      <canvas ref={sceneRef} className="absolute inset-0 block h-full w-full" aria-hidden />
      <div ref={stageRef} className="relative z-[3] flex h-full flex-col opacity-0 transition-opacity duration-[1.4s] ease-in-out">
        <nav className="relative">
          <div className="flex items-center justify-between px-5 py-6 sm:px-8">
            <Link href="/" className="font-display text-[1.35rem] font-bold tracking-tight no-underline">
              Astrape
            </Link>
            <div className="hidden items-center gap-7 sm:flex">
              <Link href="/services" className="text-[.95rem] font-medium text-mute no-underline hover:text-ink">Services</Link>
              <Link href="/rebuild" className="text-[.95rem] font-medium text-mute no-underline hover:text-ink">Rebuild</Link>
              <Link href="/projects" className="text-[.95rem] font-medium text-mute no-underline hover:text-ink">Projects</Link>
              <Link href="/about" className="text-[.95rem] font-medium text-mute no-underline hover:text-ink">About</Link>
              <Link href="/contact" className="text-[.95rem] font-medium text-mute no-underline hover:text-ink">Contact</Link>
              <button
                className="border-0 bg-transparent p-1 text-[.95rem] font-medium text-mute hover:text-ink"
                aria-pressed={!fxOn}
                onClick={() => {
                  setFxOn((v) => {
                    const next = !v;
                    (heroRef.current as any)?._toggle(next);
                    return next;
                  });
                }}
              >
                {fxOn ? "Effects on" : "Effects off"}
              </button>
            </div>
            <button
              type="button"
              className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] border-0 bg-transparent sm:hidden"
              aria-expanded={menuOpen}
              aria-controls="hero-mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className={`block h-[1.5px] w-5 bg-ink transition-transform ${menuOpen ? "translate-y-[6.5px] rotate-45" : ""}`} />
              <span className={`block h-[1.5px] w-5 bg-ink transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-[1.5px] w-5 bg-ink transition-transform ${menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
            </button>
          </div>
          {menuOpen && (
            <div id="hero-mobile-nav" className="absolute inset-x-0 top-full z-20 border-b border-line bg-bg px-5 py-2 sm:hidden">
              {[
                { href: "/services", label: "Services" },
                { href: "/rebuild", label: "Rebuild" },
                { href: "/projects", label: "Projects" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block border-t border-line py-3 text-[1.05rem] font-medium text-mute no-underline first:border-t-0">
                  {l.label}
                </Link>
              ))}
              <button
                className="block w-full border-t border-line py-3 text-left text-[1.05rem] font-medium text-mute"
                aria-pressed={!fxOn}
                onClick={() => {
                  setFxOn((v) => {
                    const next = !v;
                    (heroRef.current as any)?._toggle(next);
                    return next;
                  });
                }}
              >
                {fxOn ? "Effects on" : "Effects off"}
              </button>
            </div>
          )}
        </nav>
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-[8vh] text-center">
          <h1
            className="m-0 font-display text-[clamp(4.2rem,17vw,12rem)] font-extrabold leading-[.9] tracking-[-.035em]"
            style={{ textShadow: "0 0 calc(var(--f)*70px) rgba(122,162,255,calc(var(--f)*.9))" }}
          >
            Astrape
          </h1>
          <p className="m-0 mt-6 font-display text-[clamp(1.25rem,2.8vw,1.8rem)] font-semibold leading-tight">
            Custom websites that load instantly.
          </p>
          <p className="mx-auto mb-8 mt-2 max-w-[34rem] text-mute">
            A web studio for businesses that want a site nobody mistakes for a template.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-md border border-ink bg-ink px-6 py-3 font-medium text-[#05070d] no-underline hover:border-acc hover:bg-acc">
              Start a project
            </Link>
            <Link href="/services" className="rounded-md border border-line px-6 py-3 font-medium no-underline hover:border-acc">
              What we do
            </Link>
          </div>
        </div>
      </div>
      <div ref={clRef} className="absolute inset-y-0 left-0 z-[4] w-[50.2%] bg-[#030509]" aria-hidden />
      <div ref={crRef} className="absolute inset-y-0 right-0 z-[4] w-[50.2%] bg-[#030509]" aria-hidden />
      <canvas ref={fxRef} className="pointer-events-none absolute inset-0 z-[5] block h-full w-full" aria-hidden />
    </header>
  );
}
