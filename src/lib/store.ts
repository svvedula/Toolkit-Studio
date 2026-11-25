import { useSyncExternalStore } from 'react';
import type { AppData, Project } from './types';
import { desktop } from './desktop';

const LS_KEY = 'toolkit-studio:data';
const DEFAULTS: AppData = {
  projects: [],
  saved: [],
  settings: { model: 'claude-sonnet-5-5', heroScene: '', askFirst: true },
};

let state: AppData = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function merge(d: Partial<AppData> | null | undefined): AppData {
  return { ...DEFAULTS, ...(d || {}), settings: { ...DEFAULTS.settings, ...(d?.settings || {}) } };
}

export async function loadStore() {
  try {
    if (desktop) state = merge(await desktop.store.get());
    else {
      try { state = merge(JSON.parse(localStorage.getItem(LS_KEY) || 'null')); } catch { state = merge(null); }
    }
  } finally {
    loaded = true;
    listeners.forEach(l => l());
  }
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (desktop) desktop.store.set(state);
    else { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ } }
  }, 250);
}

export function update(fn: (d: AppData) => AppData) {
  state = fn(state);
  listeners.forEach(l => l());
  persist();
}

export function getState() { return state; }

export function useStore<T>(select: (d: AppData) => T): T {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => select(state),
  );
}
export const useLoaded = () => useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => loaded);

// ---- helpers ----
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function upsertProject(p: Project) {
  update(d => {
    const exists = d.projects.some(x => x.id === p.id);
    return { ...d, projects: exists ? d.projects.map(x => (x.id === p.id ? p : x)) : [p, ...d.projects] };
  });
}
export function patchProject(id: string, fn: (p: Project) => Project) {
  update(d => ({ ...d, projects: d.projects.map(p => (p.id === id ? fn(p) : p)) }));
}
export function deleteProject(id: string) {
  update(d => ({ ...d, projects: d.projects.filter(p => p.id !== id), saved: d.saved.filter(s => !(s.type === 'project' && s.id === id)) }));
}
export function toggleSaved(type: 'tool' | 'project' | 'prompt', id: string, extra?: { label?: string; text?: string }) {
  update(d => {
    const has = d.saved.some(s => s.type === type && s.id === id);
    return { ...d, saved: has ? d.saved.filter(s => !(s.type === type && s.id === id)) : [{ type, id, ...extra }, ...d.saved] };
  });
}
export const isSaved = (d: AppData, type: string, id: string) => d.saved.some(s => s.type === type && s.id === id);
