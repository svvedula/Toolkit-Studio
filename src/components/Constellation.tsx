import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, TOOLS, categoryById, type Tool } from '../data/catalog';

// The signature element: every tool in the catalog as a clay orb on a slowly
// turning sphere, clustered by category. Drag to spin. Tools in `active` pull
// into the centre and the rest recede — the stack forming out of the catalog.

interface Props {
  active?: string[];
  focusCategory?: string | null;
  onSelect?: (t: Tool) => void;
  height?: number | string;
  compact?: boolean;
}

interface Node { tool: Tool; hue: string; base: [number, number, number]; pull: number; glow: number; sx: number; sy: number; sr: number; z: number }

function fib(n: number, i: number): [number, number, number] {
  const y = 1 - (i / (n - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const th = Math.PI * (3 - Math.sqrt(5)) * i;
  return [Math.cos(th) * r, y, Math.sin(th) * r];
}
const norm = (v: number[]) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l] as [number, number, number]; };

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export default function Constellation({ active = [], focusCategory = null, onSelect, height = 520, compact = false }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const activeRef = useRef<Set<string>>(new Set());
  const focusRef = useRef<string | null>(null);
  const [hover, setHover] = useState<{ tool: Tool; x: number; y: number } | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  activeRef.current = new Set(active);
  focusRef.current = focusCategory;

  if (!nodesRef.current.length) {
    const centers = new Map(CATEGORIES.map((c, i) => [c.id, fib(CATEGORIES.length, i)]));
    const counts = new Map<string, number>();
    nodesRef.current = TOOLS.map(tool => {
      const c = centers.get(tool.category)!;
      const k = counts.get(tool.category) || 0; counts.set(tool.category, k + 1);
      // spiral each tool around its category centre
      const ang = k * 2.39996; const rad = 0.16 + 0.07 * Math.sqrt(k);
      const up = Math.abs(c[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      const t1 = norm([c[1] * up[2] - c[2] * up[1], c[2] * up[0] - c[0] * up[2], c[0] * up[1] - c[1] * up[0]]);
      const t2 = norm([c[1] * t1[2] - c[2] * t1[1], c[2] * t1[0] - c[0] * t1[2], c[0] * t1[1] - c[1] * t1[0]]);
      const base = norm([c[0] + (t1[0] * Math.cos(ang) + t2[0] * Math.sin(ang)) * rad, c[1] + (t1[1] * Math.cos(ang) + t2[1] * Math.sin(ang)) * rad, c[2] + (t1[2] * Math.cos(ang) + t2[2] * Math.sin(ang)) * rad]);
      return { tool, hue: categoryById(tool.category).hue, base, pull: 0, glow: 0, sx: 0, sy: 0, sr: 0, z: 0 };
    });
  }

  useEffect(() => {
    const cv = canvas.current!, el = wrap.current!;
    const ctx = cv.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1, raf = 0;
    let rotY = 0.6, rotX = -0.25, velY = reduce ? 0 : 0.0016, velX = 0;
    let dragging = false, lastX = 0, lastY = 0, moved = 0;
    let mouse: { x: number; y: number } | null = null;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = el.clientWidth; h = el.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
    };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    const frame = () => {
      if (!dragging) { rotY += velY; rotX += velX; velX *= 0.95; if (!reduce) velY += (0.0016 - velY) * 0.02; }
      rotX = Math.max(-1.1, Math.min(1.1, rotX));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * (compact ? 0.4 : 0.38);
      const cx = w / 2, cy = h / 2;
      const act = activeRef.current, foc = focusRef.current, anyActive = act.size > 0;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY), cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      // faint orbit rings for depth
      ctx.strokeStyle = 'rgba(150,130,255,0.35)'; ctx.lineWidth = 1.5; ctx.shadowColor = 'rgba(140,110,255,0.9)'; ctx.shadowBlur = 12;
      for (const k of [1, 0.66]) { ctx.beginPath(); ctx.ellipse(cx, cy, R * k * 1.05, R * k * 1.05 * Math.abs(Math.cos(rotX)) * 0.35 + 6, 0, 0, Math.PI * 2); ctx.stroke(); }

      ctx.shadowBlur = 0;
      const activeList: Node[] = [];
      for (const n of nodesRef.current) {
        const isAct = act.has(n.tool.slug);
        const inFocus = !foc || n.tool.category === foc;
        n.pull += ((isAct ? 1 : 0) - n.pull) * (reduce ? 1 : 0.07);
        n.glow += (((isAct || (!anyActive && foc && inFocus)) ? 1 : 0) - n.glow) * 0.1;
        let [x, y, z] = n.base;
        const x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX;
        x = x1; y = y2; z = z2;
        if (isAct) activeList.push(n);
        const persp = 1 / (1.9 - z * 0.6);
        n.sx = cx + x * R * persp * 1.35; n.sy = cy + y * R * persp * 1.35; n.z = z;
        n.sr = (compact ? 7 : 10) * persp * 1.6 * (1 + n.glow * 0.25);
      }
      // active tools settle into a ring in the centre
      activeList.sort((a, b) => a.tool.slug.localeCompare(b.tool.slug));
      activeList.forEach((n, i) => {
        const a = (i / Math.max(activeList.length, 1)) * Math.PI * 2 + rotY * 0.6;
        const many = activeList.length > 1;
        const rx = many ? Math.min(w * 0.36, R * (compact ? 1.9 : 0.75)) : 0;
        const ry = many ? R * (compact ? 0.62 : 0.42) : 0;
        const tx = cx + Math.cos(a) * rx, ty = cy + Math.sin(a) * ry;
        n.sx += (tx - n.sx) * n.pull; n.sy += (ty - n.sy) * n.pull; n.z += (1.2 - n.z) * n.pull;
        n.sr += ((compact ? 16 : 24) - n.sr) * n.pull;
      });

      // hand-off threads between active tools
      if (activeList.length > 1) {
        ctx.strokeStyle = 'rgba(190,150,255,0.75)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
        ctx.beginPath();
        activeList.forEach((n, i) => { const m = activeList[(i + 1) % activeList.length]; ctx.moveTo(n.sx, n.sy); ctx.lineTo(m.sx, m.sy); });
        ctx.stroke(); ctx.setLineDash([]);
      }

      const sorted = [...nodesRef.current].sort((a, b) => a.z - b.z);
      let hit: Node | null = null;
      for (const n of sorted) {
        const isAct = act.has(n.tool.slug);
        const dim = (anyActive && !isAct) || (foc && n.tool.category !== foc && !anyActive);
        const depth = (n.z + 1) / 2;
        ctx.globalAlpha = dim ? 0.14 + depth * 0.12 : 0.35 + depth * 0.65;
        // contact shadow
        ctx.shadowColor = n.hue; ctx.shadowBlur = dim ? 0 : n.sr * (0.9 + n.glow);
        // clay sphere
        const g = ctx.createRadialGradient(n.sx - n.sr * 0.38, n.sy - n.sr * 0.42, n.sr * 0.1, n.sx, n.sy, n.sr * 1.05);
        g.addColorStop(0, shade(n.hue, 0.55)); g.addColorStop(0.45, n.hue); g.addColorStop(1, shade(n.hue, -0.35));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.sx, n.sy, n.sr, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // specular
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.ellipse(n.sx - n.sr * 0.35, n.sy - n.sr * 0.45, n.sr * 0.28, n.sr * 0.16, -0.6, 0, Math.PI * 2); ctx.fill();
        if (n.glow > 0.05 && isAct) {
          ctx.globalAlpha = n.glow;
          ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(n.sx, n.sy, n.sr + 3, 0, Math.PI * 2); ctx.stroke();
        }
        if (mouse && !dim && Math.hypot(mouse.x - n.sx, mouse.y - n.sy) < n.sr + 3) hit = n;
      }
      ctx.globalAlpha = 1;
      // labels on active tools
      ctx.font = `600 ${compact ? 11 : 13}px "IBM Plex Sans", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      for (const n of activeList) {
        if (n.pull < 0.6) continue;
        const label = n.tool.name; const tw = ctx.measureText(label).width + 14;
        ctx.globalAlpha = n.pull;
        ctx.fillStyle = 'rgba(16,18,48,0.88)';
        ctx.beginPath(); ctx.roundRect(n.sx - tw / 2, n.sy + n.sr + 6, tw, compact ? 18 : 22, 11); ctx.fill();
        ctx.fillStyle = '#EEF0FF';
        ctx.fillText(label, n.sx, n.sy + n.sr + (compact ? 19 : 21));
      }
      ctx.globalAlpha = 1;
      cv.style.cursor = dragging ? 'grabbing' : hit ? 'pointer' : 'grab';
      setHover(prev => {
        if (!hit) return prev ? null : prev;
        if (prev && prev.tool === hit.tool && Math.abs(prev.x - hit.sx) < 1 && Math.abs(prev.y - hit.sy) < 1) return prev;
        return { tool: hit.tool, x: hit.sx, y: hit.sy - hit.sr };
      });
      (cv as any)._hit = hit;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const pos = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const down = (e: PointerEvent) => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; cv.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      mouse = pos(e);
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY; moved += Math.abs(dx) + Math.abs(dy);
      velY = dx * 0.005; velX = dy * 0.004; rotY += velY; rotX += velX;
      lastX = e.clientX; lastY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      if (moved < 5) { const hit = (cv as any)._hit as Node | null; if (hit && selectRef.current) selectRef.current(hit.tool); }
      try { cv.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
    };
    const leave = () => { mouse = null; };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up); cv.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move);
      cv.removeEventListener('pointerup', up); cv.removeEventListener('pointerleave', leave);
    };
  }, [compact]);

  return (
    <div ref={wrap} className="constellation" style={{ height }}>
      <canvas ref={canvas} role="img" aria-label={`Catalog of ${TOOLS.length} tools, grouped by category. Drag to rotate.`} />
      {hover && (
        <div className="orb-tip" style={{ left: hover.x, top: hover.y }}>
          <strong>{hover.tool.name}</strong>
          <span>{categoryById(hover.tool.category).name}</span>
          <span>{hover.tool.access}</span>
        </div>
      )}
    </div>
  );
}
