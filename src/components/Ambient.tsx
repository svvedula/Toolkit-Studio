import { useEffect, useRef } from 'react';

// Animated environment behind every page: drifting particles, flowing neon
// ribbons and slowly breathing gradient light. Runs at ~30fps, pauses when the
// window is hidden, and renders a single still frame for reduced motion.

interface Particle { x: number; y: number; r: number; vx: number; vy: number; tw: number; hue: number }

export default function Ambient() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1, raf = 0, last = 0, t = Math.random() * 100;
    let parts: Particle[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      const n = Math.round((w * h) / 9000);
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + 0.3,
        vx: (Math.random() - 0.5) * 0.12, vy: -Math.random() * 0.15 - 0.02,
        tw: Math.random() * Math.PI * 2, hue: Math.random() < 0.6 ? 225 : 275,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    const ribbon = (phase: number, yBase: number, amp: number, width: number, c1: string, c2: string, alpha: number) => {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, c1); g.addColorStop(0.55, c2); g.addColorStop(1, c1);
      ctx.strokeStyle = g;
      const strands = 22;
      for (let s = 0; s < strands; s++) {
        const k = s / (strands - 1);
        ctx.globalAlpha = alpha * (0.25 + 0.75 * Math.sin(k * Math.PI));
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += 14) {
          const u = x / w;
          const twist = Math.sin(u * 5 + phase * 0.9) * width * (k - 0.5);
          const y = yBase + Math.sin(u * 3.2 + phase) * amp + Math.sin(u * 7.1 - phase * 0.6) * amp * 0.25 + twist;
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!reduce && now - last < 33) return;
      last = now; t += reduce ? 0 : 0.006;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, w, h);

      // breathing light pools
      ctx.globalCompositeOperation = 'lighter';
      const pool = (x: number, y: number, r: number, color: string) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      };
      pool(w * (0.72 + Math.sin(t * 0.7) * 0.05), h * 0.18, Math.max(w, h) * 0.42, 'rgba(110,70,255,0.16)');
      pool(w * (0.12 + Math.cos(t * 0.5) * 0.04), h * 0.95, Math.max(w, h) * 0.45, 'rgba(40,110,255,0.15)');

      // neon ribbons
      ribbon(t * 1.0, h * 0.8, h * 0.09, 110, 'rgba(60,110,255,0.95)', 'rgba(180,90,255,0.95)', 0.32);
      ribbon(t * 0.8 + 2, h * 0.3, h * 0.06, 70, 'rgba(120,80,255,0.9)', 'rgba(60,170,255,0.9)', 0.13);

      // particles
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.tw += 0.04;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        if (p.x < -5) p.x = w + 5; else if (p.x > w + 5) p.x = -5;
        ctx.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(p.tw));
        ctx.fillStyle = `hsl(${p.hue} 100% 80%)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (reduce) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(draw);

    const vis = () => { if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(draw); };
    document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', vis); };
  }, []);

  return <canvas ref={ref} className="ambient" aria-hidden />;
}
