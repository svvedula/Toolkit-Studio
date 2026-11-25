import { useCallback, useMemo, useState } from 'react';
import Constellation from '../components/Constellation';
import { AccessBadge, Icon, Orb } from '../components/ui';
import { CATEGORIES, TOOLS, categoryById, type AccessTier, type SkillTier, type Tool } from '../data/catalog';
import { navigate, useRoute } from '../lib/router';
import { isSaved, toggleSaved, useStore } from '../lib/store';

const ACCESS: AccessTier[] = ['Free', 'Freemium', 'Paid', 'Open source'];
const SKILL: SkillTier[] = ['Beginner', 'Intermediate', 'Advanced'];

export default function Explore() {
  const data = useStore(d => d);
  const { query } = useRoute();
  const [q, setQ] = useState(query.get('q') || '');
  const [cat, setCat] = useState<string | null>(query.get('cat'));
  const [access, setAccess] = useState<AccessTier[]>([]);
  const [skill, setSkill] = useState<SkillTier[]>([]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TOOLS.filter(t =>
      (!cat || t.category === cat) &&
      (!access.length || access.includes(t.access)) &&
      (!skill.length || skill.includes(t.skill)) &&
      (!needle || (t.name + ' ' + t.description + ' ' + t.tags.join(' ')).toLowerCase().includes(needle)));
  }, [q, cat, access, skill]);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const onSelect = useCallback((t: Tool) => navigate(`/tools/${t.slug}`), []);

  return (
    <div className="page explore">
      <header className="page-head">
        <div>
          <h1>Explore {TOOLS.length} tools</h1>
          <p className="lede">Every tool in the catalog, sorted into {CATEGORIES.length} categories. Filter by what it costs and how much experience it takes.</p>
        </div>
      </header>

      <div className="explore-grid">
        <aside className="filters" aria-label="Filters">
          <input className="search" type="search" placeholder="Search by name, use or tag" value={q} onChange={e => setQ(e.target.value)} aria-label="Search tools" />
          <fieldset>
            <legend>Category</legend>
            <button className={`cat ${!cat ? 'on' : ''}`} onClick={() => setCat(null)}>All categories <span>{TOOLS.length}</span></button>
            {CATEGORIES.map(c => (
              <button key={c.id} className={`cat ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(cat === c.id ? null : c.id)}>
                <Orb hue={c.hue} size={12} /> {c.name} <span>{TOOLS.filter(t => t.category === c.id).length}</span>
              </button>
            ))}
          </fieldset>
          <fieldset>
            <legend>Pricing</legend>
            <div className="pill-row">{ACCESS.map(a => <button key={a} className={`pill ${access.includes(a) ? 'on' : ''}`} aria-pressed={access.includes(a)} onClick={() => setAccess(x => toggle(x, a))}>{a}</button>)}</div>
          </fieldset>
          <fieldset>
            <legend>Experience</legend>
            <div className="pill-row">{SKILL.map(s => <button key={s} className={`pill ${skill.includes(s) ? 'on' : ''}`} aria-pressed={skill.includes(s)} onClick={() => setSkill(x => toggle(x, s))}>{s}</button>)}</div>
          </fieldset>
        </aside>

        <section className="results">
          <div className="explore-orbit"><Constellation compact height={260} focusCategory={cat} active={q || access.length || skill.length ? results.map(r => r.slug).slice(0, 12) : []} onSelect={onSelect} /></div>
          <p className="muted count" aria-live="polite">{results.length} {results.length === 1 ? 'tool' : 'tools'}</p>
          {results.length === 0 ? (
            <div className="empty"><h3>No tools match</h3><p>Clear a filter or try a broader word, like “video” or “voice”.</p></div>
          ) : (
            <ul className="tool-list">
              {results.map(t => (
                <li key={t.slug}>
                  <button className="tool-row" onClick={() => navigate(`/tools/${t.slug}`)}>
                    <Orb hue={categoryById(t.category).hue} size={28} />
                    <span className="tool-row-main">
                      <strong>{t.name}</strong>
                      <span>{t.description}</span>
                    </span>
                    <span className="tool-row-side">
                      <AccessBadge tool={t} />
                      <small>{t.skill}</small>
                    </span>
                  </button>
                  <button className={`save ${isSaved(data, 'tool', t.slug) ? 'on' : ''}`} onClick={() => toggleSaved('tool', t.slug)} aria-pressed={isSaved(data, 'tool', t.slug)} aria-label={`Save ${t.name}`}>
                    <Icon name="star" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
