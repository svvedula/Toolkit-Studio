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
  discover: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  projects: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  explore: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.2-4.2',
  library: 'M6 4h12v16l-6-4-6 4z',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 3-2-.6-.6-1.5 1-1.9-1.4-1.4-1.9 1-1.5-.6L13 4h-2l-.6 2-1.5.6-1.9-1-1.4 1.4 1 1.9-.6 1.5L4 11v2l2 .6.6 1.5-1 1.9 1.4 1.4 1.9-1 1.5.6.6 2h2l.6-2 1.5-.6 1.9 1 1.4-1.4-1-1.9.6-1.5 2-.6z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  window: 'M4 5h16v14H4zM4 9h16',
  star: 'M12 4l2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 16.2 7 19l1.2-5.6L4 9.6 9.6 9z',
  back: 'M15 5l-7 7 7 7',
  redo: 'M4 12a8 8 0 0 1 14-5l2-2v6h-6l2.2-2.2A5.5 5.5 0 1 0 17.5 15',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  more: 'M6 12h.01M12 12h.01M18 12h.01',
  cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  folder: 'M3 7h6l2 2h10v10H3z',
  youtube: 'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM10 9v6l5-3z',
  gamepad: 'M7 8h10a4 4 0 0 1 4 4v1a3 3 0 0 1-5.4 1.8L14 13h-4l-1.6 1.8A3 3 0 0 1 3 13v-1a4 4 0 0 1 4-4ZM8 10v3M6.5 11.5h3M16 11h.01M18 12.5h.01',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  store: 'M4 9l1.5-5h13L20 9M4 9h16v2a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0zM5 12v8h14v-8M10 20v-5h4v5',
  clapper: 'M4 10h16v10H4zM4 10l1.5-5L19 4l1 6M8.5 4.6l2 5.2M13.5 4.2l2 5.6',
  models: 'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 0V7a3 3 0 0 0-3-3ZM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 0',
  assistants: 'M4 5h16v11H9l-5 4z',
  video: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM10 8.5v7l6-3.5z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
  clipping: 'M6 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4M6 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4M8 8l12 9M8 16l12-9',
  code: 'M9 7l-5 5 5 5M15 7l5 5-5 5',
  sound: 'M3 12h2M7 8v8M11 5v14M15 8v8M19 11v2',
  social: 'M4 10v4h3l8 4V6l-8 4zM18 9a4 4 0 0 1 0 6',
  research: 'M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10',
  productivity: 'M13 3L5 14h6l-1 7 8-11h-6z',
  design: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
  business: 'M5 20V11M11 20V5M17 20v-6M3 20h18',
  automation: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  game: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  streaming: 'M3 7h18v12H3zM8 3l4 4 4-4',
};
export function Icon({ name, size = 18 }: { name: keyof typeof paths | string; size?: number }) {
  const filled = name === 'star' || name === 'sparkle';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={name === 'more' ? 3 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}
