import { AccessBadge, Icon, Orb } from '../components/ui';
import { categoryById, toolBySlug } from '../data/catalog';
import { navigate } from '../lib/router';
import { toggleSaved, useStore } from '../lib/store';

export default function Library() {
  const saved = useStore(d => d.saved);
  const projects = useStore(d => d.projects);
  const tools = saved.filter(s => s.type === 'tool').map(s => toolBySlug(s.id)).filter(Boolean) as NonNullable<ReturnType<typeof toolBySlug>>[];

  return (
    <div className="page library">
      <header className="page-head"><div><h1>Library</h1><p className="lede">Tools you saved and the projects you’re running.</p></div></header>

      <section>
        <h2>Saved tools</h2>
        {tools.length === 0 ? (
          <div className="empty"><h3>Nothing saved yet</h3><p>Use the star on any tool to keep it here.</p><button className="btn btn-primary" onClick={() => navigate('/explore')}>Explore tools</button></div>
        ) : (
          <ul className="tool-list">
            {tools.map(t => (
              <li key={t.slug}>
                <button className="tool-row" onClick={() => navigate(`/tools/${t.slug}`)}>
                  <Orb hue={categoryById(t.category).hue} size={28} />
                  <span className="tool-row-main"><strong>{t.name}</strong><span>{t.description}</span></span>
                  <span className="tool-row-side"><AccessBadge tool={t} /></span>
                </button>
                <button className="save on" onClick={() => toggleSaved('tool', t.slug)} aria-label={`Remove ${t.name} from library`}><Icon name="star" size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Active projects</h2>
        {projects.length === 0 ? <p className="muted">No projects yet.</p> : (
          <ul className="simple-list">{projects.map(p => <li key={p.id}><a href={`#/projects/${p.id}`}>{p.title}</a></li>)}</ul>
        )}
      </section>
    </div>
  );
}
