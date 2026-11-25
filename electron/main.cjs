// Toolkit Studio — Electron main process.
// Responsibilities: window management, local persistence, encrypted API key,
// the AI orchestrator transport (streams from the Anthropic API), embed checks,
// and floating tool windows. The renderer never sees the API key.
const { app, BrowserWindow, ipcMain, shell, safeStorage, Notification, nativeTheme } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');

const isDev = !!process.env.VITE_DEV_SERVER_URL;
let mainWindow = null;
const toolWindows = new Map();

// ---------- local store (JSON file in userData) ----------
const storePath = () => path.join(app.getPath('userData'), 'toolkit-store.json');
const secretPath = () => path.join(app.getPath('userData'), 'secret.bin');

function readStore() {
  try { return JSON.parse(fs.readFileSync(storePath(), 'utf8')); } catch { return {}; }
}
function writeStore(data) {
  const tmp = storePath() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, storePath());
}

function readApiKey() {
  try {
    const buf = fs.readFileSync(secretPath());
    return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(buf) : buf.toString('utf8');
  } catch { return ''; }
}

// ---------- URL safety (no SSRF into the user's LAN) ----------
function isSafePublicUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'https:') return false;
  const h = u.hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return false;
  if (net.isIP(h)) {
    if (/^(10\.|127\.|169\.254\.|192\.168\.|0\.)/.test(h)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
    if (h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) return false;
  }
  return true;
}

// ---------- windows ----------
function createMainWindow() {
  nativeTheme.themeSource = 'light';
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#DADCE8',
    title: 'Toolkit Studio',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
    },
  });

  // Every link that tries to open a new window goes to the system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafePublicUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (e, url) => {
    const allowed = isDev ? url.startsWith(process.env.VITE_DEV_SERVER_URL) : url.startsWith('file://');
    if (!allowed) { e.preventDefault(); if (isSafePublicUrl(url)) shell.openExternal(url); }
  });

  if (isDev) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

function openToolWindow({ url, title, pinned }) {
  if (!isSafePublicUrl(url)) return { ok: false, error: 'Only public https links can open in a tool window.' };
  const existing = toolWindows.get(url);
  if (existing && !existing.isDestroyed()) { existing.focus(); return { ok: true }; }
  const [x, y] = mainWindow ? mainWindow.getPosition() : [80, 80];
  const win = new BrowserWindow({
    width: 1100, height: 780, x: x + 60, y: y + 40,
    title: title || 'Tool', autoHideMenuBar: true, alwaysOnTop: !!pinned,
    backgroundColor: '#F4F4F9',
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      // one persistent partition per host so sign-ins stick between sessions
      partition: 'persist:tool-' + new URL(url).hostname,
    },
  });
  win.webContents.setWindowOpenHandler(({ url: u }) => {
    if (isSafePublicUrl(u)) win.loadURL(u);
    return { action: 'deny' };
  });
  win.loadURL(url);
  toolWindows.set(url, win);
  win.on('closed', () => toolWindows.delete(url));
  return { ok: true };
}

// ---------- IPC ----------
ipcMain.handle('store:get', () => readStore());
ipcMain.handle('store:set', (_e, data) => { writeStore(data); return true; });

ipcMain.handle('secret:has', () => !!readApiKey());
ipcMain.handle('secret:set', (_e, key) => {
  const value = String(key || '').trim();
  if (!value) { try { fs.unlinkSync(secretPath()); } catch {} return true; }
  const buf = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(value) : Buffer.from(value, 'utf8');
  fs.writeFileSync(secretPath(), buf);
  return true;
});

ipcMain.handle('shell:open', (_e, url) => { if (isSafePublicUrl(url)) shell.openExternal(url); return true; });
ipcMain.handle('tool:window', (_e, opts) => openToolWindow(opts || {}));

// Does this site allow being framed? Reads X-Frame-Options and CSP frame-ancestors.
ipcMain.handle('embed:check', async (_e, url) => {
  if (!isSafePublicUrl(url)) return { embeddable: false, reason: 'blocked-url' };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal });
    clearTimeout(t);
    const xfo = (res.headers.get('x-frame-options') || '').toLowerCase();
    const csp = (res.headers.get('content-security-policy') || '').toLowerCase();
    try { res.body && res.body.cancel(); } catch {}
    if (xfo.includes('deny') || xfo.includes('sameorigin')) return { embeddable: false, reason: 'x-frame-options' };
    const fa = csp.split(';').map(s => s.trim()).find(s => s.startsWith('frame-ancestors'));
    if (fa && !fa.includes('*')) return { embeddable: false, reason: 'frame-ancestors' };
    return { embeddable: true };
  } catch (err) {
    return { embeddable: false, reason: 'unreachable' };
  }
});

ipcMain.handle('notify', (_e, { title, body }) => {
  if (Notification.isSupported()) new Notification({ title: String(title || 'Toolkit Studio'), body: String(body || '') }).show();
  return true;
});

// AI transport: stream a Messages API call, forwarding text deltas to the renderer.
const activeStreams = new Map();
ipcMain.handle('ai:stream', async (event, req) => {
  const { id, system, messages, maxTokens, model } = req || {};
  const apiKey = readApiKey();
  const send = (ch, payload) => { if (!event.sender.isDestroyed()) event.sender.send(ch, { id, ...payload }); };
  if (!apiKey) { send('ai:error', { error: 'no-key' }); return { ok: false }; }

  const ctrl = new AbortController();
  activeStreams.set(id, ctrl);
  let full = '';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-5-5',
        max_tokens: Math.min(Number(maxTokens) || 8000, 32000),
        system,
        messages,
        stream: true,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      send('ai:error', { error: `API ${res.status}: ${txt.slice(0, 400)}` });
      return { ok: false };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const dataLine = chunk.split('\n').find(l => l.startsWith('data:'));
        if (!dataLine) continue;
        try {
          const evt = JSON.parse(dataLine.slice(5).trim());
          if (evt.type === 'content_block_delta' && evt.delta && evt.delta.type === 'text_delta') {
            full += evt.delta.text;
            send('ai:delta', { text: evt.delta.text });
          } else if (evt.type === 'error') {
            send('ai:error', { error: evt.error && evt.error.message || 'stream error' });
          }
        } catch {}
      }
    }
    send('ai:done', { text: full });
    return { ok: true };
  } catch (err) {
    send('ai:error', { error: err.name === 'AbortError' ? 'cancelled' : String(err.message || err) });
    return { ok: false };
  } finally {
    activeStreams.delete(id);
  }
});
ipcMain.handle('ai:cancel', (_e, id) => { const c = activeStreams.get(id); if (c) c.abort(); return true; });

// ---------- lifecycle ----------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
  app.whenReady().then(() => {
    if (process.platform === 'win32') app.setAppUserModelId('studio.toolkit.app');
    createMainWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
