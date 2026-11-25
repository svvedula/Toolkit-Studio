// Typed access to the Electron preload bridge, with browser fallbacks so the
// same UI runs in `npm run dev:web` without the desktop shell.

interface AiHandlers {
  delta?: (p: { id: string; text: string }) => void;
  done?: (p: { id: string; text: string }) => void;
  error?: (p: { id: string; error: string }) => void;
}

export interface DesktopBridge {
  isDesktop: true;
  platform: string;
  store: { get(): Promise<any>; set(data: any): Promise<boolean> };
  secret: { has(): Promise<boolean>; set(key: string): Promise<boolean> };
  openExternal(url: string): Promise<boolean>;
  openToolWindow(o: { url: string; title?: string; pinned?: boolean }): Promise<{ ok: boolean; error?: string }>;
  checkEmbed(url: string): Promise<{ embeddable: boolean; reason?: string }>;
  notify(title: string, body: string): Promise<boolean>;
  ai: {
    stream(req: { id: string; system: string; messages: { role: 'user' | 'assistant'; content: string }[]; maxTokens?: number; model?: string }): Promise<{ ok: boolean }>;
    cancel(id: string): Promise<boolean>;
    on(h: AiHandlers): () => void;
  };
}

declare global { interface Window { desktop?: DesktopBridge } }

export const desktop: DesktopBridge | undefined = typeof window !== 'undefined' ? window.desktop : undefined;
export const isDesktop = !!desktop;

export function openExternal(url: string) {
  if (desktop) desktop.openExternal(url);
  else window.open(url, '_blank', 'noopener,noreferrer');
}

export async function openToolWindow(url: string, title: string, pinned = false) {
  if (desktop) return desktop.openToolWindow({ url, title, pinned });
  window.open(url, '_blank', 'noopener,noreferrer,width=1100,height=780');
  return { ok: true };
}

export async function hasApiKey() {
  return desktop ? desktop.secret.has() : false;
}
