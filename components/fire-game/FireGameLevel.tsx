"use client";
import { useEffect, useRef } from "react";
import Matter from "matter-js";
import { buildLevel } from "@/lib/fire-game/level";
import type { FireExit } from "@/lib/fire-game/types";

const FIREBALL_RADIUS = 12;
const MOVE_SPEED = 5.2;
const CLIMB_MOVE_SPEED = MOVE_SPEED * 0.6;
const JUMP_SPEED = 6.0; 
const CLIMB_SPEED = 4.2;
const WALL_THICKNESS = 8;
const BOOST_VX = 14;

export default function FireGameLevel({ onWin, onLose }: { onWin: (exit: FireExit) => void; onLose: (exit: FireExit) => void; }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef({ left: false, right: false, up: false, down: false, jumpQueued: false });
  const onWinRef = useRef(onWin);
  const onLoseRef = useRef(onLose);
  useEffect(() => {
    onWinRef.current = onWin;
    onLoseRef.current = onLose;
  });

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const level = buildLevel();
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1 } });
    const world = engine.world;

    const wallBodies = level.segments.map((s) => {
      const cx = (s.x1 + s.x2) / 2, cy = (s.y1 + s.y2) / 2;
      const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
      const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
      
      return Matter.Bodies.rectangle(cx, cy, Math.max(len, 1), WALL_THICKNESS, {
        isStatic: true, angle, friction: 0, restitution: 0.1, 
        label: s.climbable ? "climbable" : "wall",
      });
    });

    const fireball = Matter.Bodies.circle(level.spawn.x, level.spawn.y, FIREBALL_RADIUS, {
      friction: 0, frictionAir: 0.015, restitution: 0.1, label: "fireball",
    });
    Matter.Body.setInertia(fireball, Infinity);

    const winSensor = Matter.Bodies.rectangle(
      level.winZone.x + level.winZone.w / 2, level.winZone.y + level.winZone.h / 2,
      level.winZone.w, level.winZone.h, { isStatic: true, isSensor: true, label: "winZone" }
    );
    const boosterW = 60;
    const boosterX = level.winZone.x - boosterW - 10;
    const boosterSensor = Matter.Bodies.rectangle(
      boosterX + boosterW / 2, level.winZone.y + level.winZone.h / 2,
      boosterW, level.winZone.h, { isStatic: true, isSensor: true, label: "booster" }
    );

    Matter.Composite.add(world, [...wallBodies, fireball, winSensor, boosterSensor]);

    let W = 0, H = 0, camX = level.spawn.x, camY = level.spawn.y;
    function toScreen(wx: number, wy: number) { return { x: W / 2 + (wx - camX), y: H / 2 + (wy - camY) }; }
    
    let resolved = false, boosted = false;
    let jumpContacts = 0, touchingClimbable = false;

    const onBeforeUpdate = () => {
      jumpContacts = 0;
      touchingClimbable = false;
      const pairs = engine.pairs.list;
      for (const pair of pairs) {
        if (pair.bodyA === fireball || pair.bodyB === fireball) {
          const other = pair.bodyA === fireball ? pair.bodyB : pair.bodyA;
          if (other.label === "wall" || other.label === "climbable") jumpContacts++;
          if (other.label === "climbable") touchingClimbable = true;
        }
      }
    };

    const onCollisionStart = (e: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of e.pairs) {
        const other = pair.bodyA === fireball ? pair.bodyB : pair.bodyB === fireball ? pair.bodyA : null;
        if (!other) continue;
        if (other.label === "booster" && !boosted) {
          boosted = true;
          Matter.Body.setVelocity(fireball, { x: BOOST_VX, y: fireball.velocity.y });
        }
        if (other.label === "winZone" && !resolved && fireball.velocity.x >= level.winMinSpeed) {
          resolved = true;
          const s = toScreen(fireball.position.x, fireball.position.y);
          onWinRef.current({ x: s.x, y: s.y, vx: fireball.velocity.x, vy: fireball.velocity.y });
        }
      }
    };
    
    Matter.Events.on(engine, "beforeUpdate", onBeforeUpdate);
    Matter.Events.on(engine, "collisionStart", onCollisionStart);

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();

      if (e.key.startsWith("Arrow") || e.code === "Space") e.preventDefault();
      if (e.key === "ArrowLeft" || k === "a") keys.current.left = true;
      if (e.key === "ArrowRight" || k === "d") keys.current.right = true;
      if (e.key === "ArrowDown" || k === "s") keys.current.down = true;
      if (e.key === "ArrowUp" || k === "w") keys.current.up = true;
      if (e.code === "Space" || e.key === "ArrowUp" || k === "w") {
         if (!keys.current.jumpQueued) keys.current.jumpQueued = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.key === "ArrowLeft" || k === "a") keys.current.left = false;
      if (e.key === "ArrowRight" || k === "d") keys.current.right = false;
      if (e.key === "ArrowUp" || k === "w") keys.current.up = false;
      if (e.key === "ArrowDown" || k === "s") keys.current.down = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function size() {
      const DPR = Math.min(devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    size(); window.addEventListener("resize", size);

    let controlsLocked = false;
    const flameParticles: { x: number; y: number; born: number }[] = [];
    let raf = 0, last = performance.now();

    function frame(ts: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(32, ts - last); last = ts;
      const now = ts / 1000;

      if (!resolved) {
        if (fireball.position.y > level.fallLockY) controlsLocked = true;
        if (!controlsLocked) {
          const dir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
          if (touchingClimbable && (keys.current.up || keys.current.down)) {
            Matter.Body.setVelocity(fireball, { x: dir * CLIMB_MOVE_SPEED, y: keys.current.up ? -CLIMB_SPEED : CLIMB_SPEED });
          } else {
            Matter.Body.setVelocity(fireball, { x: dir * MOVE_SPEED, y: fireball.velocity.y });
          }
          if (keys.current.jumpQueued) {
            keys.current.jumpQueued = false;
            if (jumpContacts > 0) Matter.Body.setVelocity(fireball, { x: fireball.velocity.x, y: -JUMP_SPEED });
          }
          if (dir !== 0 && Math.random() < 0.6) {
            flameParticles.push({ x: fireball.position.x - dir * FIREBALL_RADIUS * 0.6, y: fireball.position.y, born: now });
          }
        } else {
          keys.current.jumpQueued = false;
        }
        Matter.Engine.update(engine, dt);
        if (fireball.position.y > level.fallBottomY && !resolved) {
          resolved = true;
          const s = toScreen(fireball.position.x, fireball.position.y);
          onLoseRef.current({ x: s.x, y: s.y, vx: fireball.velocity.x, vy: fireball.velocity.y });
        }
      }

      while (flameParticles.length && now - flameParticles[0].born > 0.5) flameParticles.shift();
      camX += (Math.max(W / 2, Math.min(level.width - W / 2, fireball.position.x)) - camX) * 0.12;
      camY += (Math.max(H / 2, Math.min(level.height - H / 2, fireball.position.y - H * 0.12)) - camY) * 0.08;

      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2 - camX, H / 2 - camY);

      for (const s of level.segments) {
        if (s.invisible) continue;
        ctx.strokeStyle = s.climbable ? "rgba(122,178,255,.9)" : "rgba(158,164,170,.9)";
        ctx.lineWidth = s.climbable ? 5 : 4;
        ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
      }
      for (const fp of flameParticles) {
        const a = Math.max(0, 1 - (now - fp.born) / 0.5);
        const rg = ctx.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, 5 * a);
        rg.addColorStop(0, `rgba(255,190,110,${0.6 * a})`); rg.addColorStop(1, "rgba(255,90,30,0)");
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(fp.x, fp.y, 5 * a, 0, Math.PI * 2); ctx.fill();
      }
      const flicker = 0.85 + 0.15 * Math.sin(now * 14);
      const rg = ctx.createRadialGradient(fireball.position.x, fireball.position.y, 0, fireball.position.x, fireball.position.y, FIREBALL_RADIUS * 2.2 * flicker);
      rg.addColorStop(0, "rgba(255,240,200,1)"); rg.addColorStop(0.4, "rgba(255,150,40,.9)"); rg.addColorStop(1, "rgba(255,60,20,0)");
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(fireball.position.x, fireball.position.y, FIREBALL_RADIUS * 2.2 * flicker, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff8e6"; ctx.beginPath(); ctx.arc(fireball.position.x, fireball.position.y, FIREBALL_RADIUS * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); window.removeEventListener("resize", size);
      Matter.Events.off(engine, "beforeUpdate", onBeforeUpdate); Matter.Events.off(engine, "collisionStart", onCollisionStart);
      Matter.Composite.clear(world, false); Matter.Engine.clear(engine);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  return <canvas
      ref={canvasRef}
      role="img"
      aria-label="Rebuild mini-game. Move with the arrow keys or A and D, jump with space or W."
      className="block h-full w-full"
    />;
}
