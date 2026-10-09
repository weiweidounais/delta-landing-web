"use client";

import {useEffect, useRef} from "react";
import styles from "./hero-cursor-smoke.module.css";

const MAX_PARTICLES = 72;
const FADE_OUT_MS = 320;

type Point = {x: number; y: number};
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  rotation: number;
  turn: number;
  stretch: number;
  opacity: number;
  texture: number;
  phase: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Merged, rotated wisps form an irregular smoke texture, rather than a circular cursor glow.
function makeSmokeTextures() {
  return Array.from({length: 5}, (_, variant) => {
    const texture = document.createElement("canvas");
    texture.width = texture.height = 160;
    const context = texture.getContext("2d");
    if (!context) return texture;
    for (let index = 0; index < 22; index++) {
      const angle = index * 2.39996 + variant;
      const spread = 12 + (index % 5) * 5;
      const x = 80 + Math.cos(angle) * spread;
      const y = 80 + Math.sin(angle) * spread * .78;
      const radius = 20 + ((index * 13 + variant * 7) % 19);
      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, "rgba(143, 164, 173, .14)");
      gradient.addColorStop(.36, "rgba(118, 143, 156, .105)");
      gradient.addColorStop(.72, "rgba(90, 116, 134, .035)");
      gradient.addColorStop(1, "rgba(78, 105, 124, 0)");
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      context.scale(1.15, .64 + (index % 4) * .08);
      context.fillStyle = gradient;
      context.fillRect(-radius, -radius, radius * 2, radius * 2);
      context.restore();
    }
    return texture;
  });
}

export function HeroCursorSmoke() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", {alpha: true});
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    let textures: HTMLCanvasElement[] | null = null;
    let particles: Particle[] = [];
    let target: Point | null = null;
    let lastEmitted: Point | null = null;
    let pointerInside = false;
    let width = 1, height = 1, ratio = 1;
    let frame = 0, lastFrame = 0, lastEmission = 0;
    let fadeStarted: number | null = null;

    const disabled = () => document.hidden || reducedMotion.matches || coarsePointer.matches;

    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
      particles = [];
      target = lastEmitted = null;
      pointerInside = false;
      lastEmission = 0;
      fadeStarted = null;
      context.clearRect(0, 0, width, height);
    };

    const emit = (point: Point, dx: number, dy: number) => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({
        x: point.x + (Math.random() - .5) * 9,
        y: point.y + (Math.random() - .5) * 9,
        vx: clamp(dx * .6, -32, 32) + (Math.random() - .5) * 18,
        vy: clamp(dy * .5, -22, 22) - 18 - Math.random() * 17,
        age: 0,
        life: 1.7 + Math.random() * .7,
        size: 29 + Math.random() * 22,
        rotation: Math.random() * Math.PI * 2,
        turn: (Math.random() - .5) * .5,
        stretch: .72 + Math.random() * .42,
        opacity: .28 + Math.random() * .17,
        texture: Math.floor(Math.random() * 5),
        phase: Math.random() * Math.PI * 2,
      });
    };

    const draw = (now: number) => {
      frame = 0;
      if (disabled()) {
        clear();
        return;
      }
      const elapsed = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : 1 / 60;
      lastFrame = now;

      if (pointerInside && target && now - lastEmission >= 24) {
        const from = lastEmitted ?? target;
        const dx = target.x - from.x, dy = target.y - from.y;
        const distance = Math.hypot(dx, dy);
        if (!lastEmitted || distance > 2) {
          const count = Math.min(3, Math.max(1, Math.ceil(distance / 25)));
          for (let index = 1; index <= count; index++) {
            emit({x: from.x + dx * index / count, y: from.y + dy * index / count}, dx / count, dy / count);
          }
          lastEmitted = {...target};
          lastEmission = now;
        }
      }

      context.clearRect(0, 0, width, height);
      const fade = fadeStarted === null ? 1 : Math.max(0, 1 - (now - fadeStarted) / FADE_OUT_MS);
      if (fade <= 0) {
        clear();
        return;
      }
      if (particles.length && !textures) textures = makeSmokeTextures();
      particles = particles.filter(particle => {
        particle.age += elapsed;
        const progress = particle.age / particle.life;
        if (progress >= 1) return false;
        particle.x += (particle.vx + Math.sin(progress * 4 + particle.phase) * 9) * elapsed;
        particle.y += particle.vy * elapsed;
        particle.vx *= Math.exp(-elapsed * .65);
        particle.rotation += particle.turn * elapsed;
        const size = particle.size * (1 + progress * 2.2);
        const envelope = Math.min(1, progress / .09) * Math.pow(1 - progress, 1.15);
        context.save();
        context.globalAlpha = particle.opacity * envelope * fade;
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.scale(1, particle.stretch);
        context.drawImage(textures![particle.texture], -size / 2, -size / 2, size, size);
        context.restore();
        return true;
      });
      // Stationary cursors let the remaining wisps dissolve; no idle animation loop remains.
      if (particles.length) frame = requestAnimationFrame(draw);
      else lastFrame = 0;
    };

    const schedule = () => {
      if (!frame && !disabled()) frame = requestAnimationFrame(draw);
    };

    const measure = () => {
      const newWidth = Math.max(1, canvas.clientWidth || window.innerWidth);
      const newHeight = Math.max(1, canvas.clientHeight || window.innerHeight);
      const newRatio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(2_400_000 / (newWidth * newHeight)));
      if (newWidth !== width || newHeight !== height || newRatio !== ratio) {
        clear();
        width = newWidth; height = newHeight; ratio = newRatio;
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      if (disabled()) clear();
    };

    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || disabled()) return;
      const x = event.clientX, y = event.clientY;
      if (x < 0 || x > width || y < 0 || y > height) return;
      pointerInside = true;
      fadeStarted = null;
      target = {x, y};
      schedule();
    };

    const pointerLeave = (event: PointerEvent) => {
      // pointerout also bubbles when crossing ordinary elements; only leaving the window fades the trail.
      if (event.pointerType !== "mouse" || event.relatedTarget !== null) return;
      pointerInside = false;
      target = lastEmitted = null;
      if (particles.length && fadeStarted === null) fadeStarted = performance.now();
      schedule();
    };

    const policyChange = () => {
      clear();
      measure();
    };
    window.addEventListener("pointermove", pointerMove, {passive: true});
    window.addEventListener("pointerout", pointerLeave, {passive: true});
    window.addEventListener("blur", clear);
    window.addEventListener("resize", measure);
    document.addEventListener("visibilitychange", policyChange);
    reducedMotion.addEventListener("change", policyChange);
    coarsePointer.addEventListener("change", policyChange);
    measure();

    return () => {
      clear();
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerout", pointerLeave);
      window.removeEventListener("blur", clear);
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", policyChange);
      reducedMotion.removeEventListener("change", policyChange);
      coarsePointer.removeEventListener("change", policyChange);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
