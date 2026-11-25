import { useSyncExternalStore } from 'react';

// Hash routing: works identically under file:// (packaged app) and the dev server.
const subscribe = (cb: () => void) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb); };
const getPath = () => (window.location.hash.replace(/^#/, '') || '/discover');

export function useRoute() {
  const path = useSyncExternalStore(subscribe, getPath);
  const [p, q = ''] = path.split('?');
  return { path: p, parts: p.split('/').filter(Boolean), query: new URLSearchParams(q) };
}

export function navigate(path: string) {
  if (getPath() === path) return;
  window.location.hash = path;
  document.querySelector('main')?.scrollTo({ top: 0 });
}
