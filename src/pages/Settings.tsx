import { useEffect, useState } from 'react';
import { desktop, isDesktop } from '../lib/desktop';
import { update, useStore } from '../lib/store';

export default function Settings() {
  const settings = useStore(d => d.settings);
  const [hasKey, setHasKey] = useState(false);
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => { desktop?.secret.has().then(setHasKey); }, []);
  const set = (patch: Partial<typeof settings>) => update(d => ({ ...d, settings: { ...d.settings, ...patch } }));

  return (
    <div className="page settings">
      <header className="page-head"><div><h1>Settings</h1></div></header>

      <section className="setting">
        <h2>Anthropic API key</h2>
        <p>Plans, intake questions, task rewrites and check-ins are written by Claude through your own key. Without one, the app uses offline templates. The key is encrypted with your operating system’s keychain and never reaches the interface.</p>
        {!isDesktop ? <p className="notice">Keys can only be stored in the desktop app.</p> : (
          <form className="row" onSubmit={async e => { e.preventDefault(); await desktop!.secret.set(key); setHasKey(!!key.trim()); setKey(''); setSaved(key.trim() ? 'Key saved.' : 'Key removed.'); }}>
            <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder={hasKey ? 'A key is saved. Paste a new one to replace it.' : 'sk-ant-…'} aria-label="API key" autoComplete="off" />
            <button className="btn btn-primary">{key.trim() ? 'Save key' : hasKey ? 'Remove key' : 'Save key'}</button>
          </form>
        )}
        {saved && <p className="muted" role="status">{saved}</p>}
      </section>

      <section className="setting">
        <h2>Model</h2>
        <p>The model used for every planning job.</p>
        <select value={settings.model} onChange={e => set({ model: e.target.value })} aria-label="Model">
          <option value="claude-sonnet-5-5">Claude Sonnet 5.5 (balanced)</option>
          <option value="claude-opus-5-5">Claude Opus 5.5 (deepest plans)</option>
          <option value="claude-haiku-5-5">Claude Haiku 5.5 (fastest)</option>
        </select>
      </section>

      <section className="setting">
        <h2>Ask questions before planning</h2>
        <label className="toggle"><input type="checkbox" checked={settings.askFirst} onChange={e => set({ askFirst: e.target.checked })} /><span>Start every plan with intake questions</span></label>
      </section>

      <section className="setting">
        <h2>Hero scene</h2>
        <p>Paste a Spline scene URL (Export, then Code, then copy the <code>.splinecode</code> link) to replace the tool orbit on Discover with your own 3D scene.</p>
        <input value={settings.heroScene} onChange={e => set({ heroScene: e.target.value.trim() })} placeholder="https://prod.spline.design/…/scene.splinecode" aria-label="Spline scene URL" />
      </section>
    </div>
  );
}
