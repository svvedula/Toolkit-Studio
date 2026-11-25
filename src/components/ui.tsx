import { useState, type ReactNode } from 'react';
import { categoryById, toolBySlug, type Tool } from '../data/catalog';
import { navigate } from '../lib/router';

export function Orb({ hue, size = 14 }: { hue: string; size?: number }) {
  return <span className="orb" style={{ width: size, height: size, ['--hue' as any]: hue }} aria-hidden />;
}

export function ToolChip({ slug, onClick }: { slug: string; onClick?: () => void }) {
  const t = toolBySlug(slug);
  if (!t) return null;
  return (
    <button className="tool-chip" onClick={onClick || (() => navigate(`/tools/${t.slug}`))}>
      <Orb hue={categoryById(t.category).hue} size={12} />
      {t.name}
    </button>
  );
}

export function AccessBadge({ tool }: { tool: Tool }) {
  return <span className={`access access-${tool.access.replace(' ', '-').toLowerCase()}`}>{tool.access}</span>;
}

export function CopyButton({ text, label = 'Copy prompt' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn btn-quiet"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch {
          const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
        }
        setDone(true); setTimeout(() => setDone(false), 1400);
      }}
    >{done ? 'Copied' : label}</button>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

const paths: Record<string, string> = {
  discover: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3.5 5.5-2 5-5 2 2-5 5-2Z',
  projects: 'M4 6h7v5H4zM13 6h7v8h-7zM4 13h7v5H4zM13 16h7v2h-7z',
  explore: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.2-4.2',
  library: 'M6 4h12v16l-6-4-6 4z',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 3-2-.6-.6-1.5 1-1.9-1.4-1.4-1.9 1-1.5-.6L13 4h-2l-.6 2-1.5.6-1.9-1-1.4 1.4 1 1.9-.6 1.5L4 11v2l2 .6.6 1.5-1 1.9 1.4 1.4 1.9-1 1.5.6.6 2h2l.6-2 1.5-.6 1.9 1 1.4-1.4-1-1.9.6-1.5 2-.6z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  window: 'M4 5h16v14H4zM4 9h16',
  star: 'M12 4l2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 16.2 7 19l1.2-5.6L4 9.6 9.6 9z',
  back: 'M15 5l-7 7 7 7',
  redo: 'M4 12a8 8 0 0 1 14-5l2-2v6h-6l2.2-2.2A5.5 5.5 0 1 0 17.5 15',
  check: 'M5 12.5l4.5 4.5L19 7.5',
};
export function Icon({ name, size = 18 }: { name: keyof typeof paths | string; size?: number }) {
  const filled = name === 'star';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}
