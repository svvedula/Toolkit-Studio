// Narrow, typed bridge between the renderer and the main process.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  platform: process.platform,
  store: {
    get: () => ipcRenderer.invoke('store:get'),
    set: (data) => ipcRenderer.invoke('store:set', data),
  },
  secret: {
    has: () => ipcRenderer.invoke('secret:has'),
    set: (key) => ipcRenderer.invoke('secret:set', key),
  },
  openExternal: (url) => ipcRenderer.invoke('shell:open', url),
  openToolWindow: (opts) => ipcRenderer.invoke('tool:window', opts),
  checkEmbed: (url) => ipcRenderer.invoke('embed:check', url),
  notify: (title, body) => ipcRenderer.invoke('notify', { title, body }),
  ai: {
    stream: (req) => ipcRenderer.invoke('ai:stream', req),
    cancel: (id) => ipcRenderer.invoke('ai:cancel', id),
    on: (handlers) => {
      const d = (_e, p) => handlers.delta && handlers.delta(p);
      const f = (_e, p) => handlers.done && handlers.done(p);
      const r = (_e, p) => handlers.error && handlers.error(p);
      ipcRenderer.on('ai:delta', d);
      ipcRenderer.on('ai:done', f);
      ipcRenderer.on('ai:error', r);
      return () => {
        ipcRenderer.removeListener('ai:delta', d);
        ipcRenderer.removeListener('ai:done', f);
        ipcRenderer.removeListener('ai:error', r);
      };
    },
  },
});
