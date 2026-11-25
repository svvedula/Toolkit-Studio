import { useEffect, useState } from 'react';
import { AccessBadge, Icon, Orb, ToolChip } from '../components/ui';
import { TOOLS, categoryById, toolBySlug } from '../data/catalog';
import { desktop, openExternal, openToolWindow } from '../lib/desktop';
import { navigate } from '../lib/router';
import { isSaved, toggleSaved, useStore } from '../lib/store';

type EmbedState = 'checking' | 'ok' | 'blocked' | 'idle';

export default function ToolDetail({ slug }: { slug: string }) {
  const tool = toolBySlug(slug);
  const data = useStore(d => d);
  const [embed, setEmbed] = useState<EmbedState>('idle');
  const [reason, setReason] = useState('');
  const [pinned, setPinned] = useState(false);

  useEffect(() => { setEmbed('idle'); setReason(''); }, [slug]);

  if (!tool) return <div className="page"><div className="empty"><h3>That tool isn’t in the catalog</h3><button className="btn btn-primary" onClick={() => navigate('/explore')}>Browse all tools</button></div></div>;

  const cat = categoryById(tool.category);
  const related = TOOLS.filter(t => t.category === tool.category && t.slug !== tool.slug);
  const saved = isSaved(data, 'tool', tool.slug);

  async function tryEmbed() {
    setEmbed('checking');
    if (desktop) {
      const r = await desktop.checkEmbed(tool!.url);
      if (r.embeddable) setEmbed('ok');
      else { setEmbed('blocked'); setReason(r.reason || ''); }
    } else {
      // browsers can't read another site's headers; trust the catalog flag
      setEmbed(tool!.embeddable ? 'ok' : 'blocked'); setReason(tool!.embeddable ? '' : 'catalog');
    }
  }

  return (
    <div className="page tool-page" style={{ ['--hue' as any]: cat.hue }}>
      <button className="back" onClick={() => history.length > 1 ? history.back() : navigate('/explore')}><Icon name="back" size={16} /> Back</button>
      <header className="tool-hero">
        <Orb hue={cat.hue} size={88} />
        <div>
          <p className="tool-cat">{cat.name}</p>
          <h1>{tool.name}</h1>
          <p className="lede">{tool.description}</p>
          <div className="row tool-facts">
            <AccessBadge tool={tool} />
            <span className="fact">{tool.skill}</span>
            {tool.tags.slice(0, 6).map(t => <span key={t} className="tag">{t}</span>)}
          </div>
          {tool.urlUnverified && <p className="muted small">Link not yet confirmed against the vendor’s site.</p>}
        </div>
        <div className="tool-cta">
          <button className="btn btn-primary btn-lg" onClick={() => openToolWindow(tool.url, tool.name, pinned)}><Icon name="window" /> Open in a side window</button>
          <label className="toggle small"><input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} /><span>Keep it on top</span></label>
          <div className="row">
            <button className="btn btn-quiet" onClick={() => openExternal(tool.url)}><Icon name="external" size={16} /> Browser</button>
            <button className={`btn btn-quiet ${saved ? 'on' : ''}`} onClick={() => toggleSaved('tool', tool.slug)} aria-pressed={saved}><Icon name="star" size={16} /> {saved ? 'Saved' : 'Save'}</button>
          </div>
        </div>
      </header>

      <section className="workspace">
        <div className="workspace-head">
          <h2>Work here</h2>
          {embed === 'ok' && <button className="link" onClick={() => setEmbed('idle')}>Close</button>}
        </div>
        {embed === 'idle' && (
          <div className="embed-slot">
            <p>Try to load {tool.name} inside this tab. Most sites block this, in which case the side window keeps it one click away and remembers your sign-in.</p>
            <button className="btn btn-quiet" onClick={tryEmbed}>Load inside the app</button>
          </div>
        )}
        {embed === 'checking' && <div className="embed-slot"><p>Checking whether {tool.name} allows embedding…</p></div>}
        {embed === 'blocked' && (
          <div className="embed-slot">
            <p><strong>{tool.name} doesn’t allow being shown inside other apps</strong>{reason && reason !== 'catalog' ? ` (it sends ${reason === 'x-frame-options' ? 'an X-Frame-Options' : reason === 'frame-ancestors' ? 'a frame-ancestors' : 'no usable'} header)` : ''}. Open it in a side window instead; it stays beside your plan.</p>
            <button className="btn btn-primary" onClick={() => openToolWindow(tool.url, tool.name, true)}>Open pinned side window</button>
          </div>
        )}
        {embed === 'ok' && <iframe className="embed" src={tool.url} title={tool.name} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads" allow="clipboard-write" />}
      </section>

      {related.length > 0 && (
        <section className="related">
          <h2>Also in {cat.name.toLowerCase()}</h2>
          <div className="row wrap">{related.map(r => <ToolChip key={r.slug} slug={r.slug} />)}</div>
        </section>
      )}
    </div>
  );
}
