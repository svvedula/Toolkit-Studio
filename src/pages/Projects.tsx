import { useState } from 'react';
import { Orb } from '../components/ui';
import { STARTER_GOALS, categoryById, toolBySlug } from '../data/catalog';
import { detectKind } from '../lib/offline';
import { navigate } from '../lib/router';
import { uid, upsertProject, useStore } from '../lib/store';

export default function Projects() {
  const projects = useStore(d => d.projects);
  const [goal, setGoal] = useState('');
  const [title, setTitle] = useState('');

  function create(g: string, t?: string) {
    const id = uid();
    upsertProject({ id, title: t || g, goal: g, kind: detectKind(g), createdAt: new Date().toISOString(), intake: [], checkins: [] });
    navigate(`/projects/${id}`);
  }

  return (
    <div className="page projects">
      <header className="page-head">
        <div>
          <h1>Projects</h1>
          <p className="lede">For goals that take weeks. Each project keeps its plan, prompts and weekly check-ins, and adjusts as you go.</p>
        </div>
      </header>

      <section className="new-project">
        <h2>Start a project</h2>
        <div className="starter-grid">
          {STARTER_GOALS.map(s => (
            <button key={s.kind} className="starter-tile" onClick={() => create(s.goal, s.title)}>
              <strong>{s.title}</strong>
              <span>{s.goal}</span>
            </button>
          ))}
        </div>
        <form className="custom-goal" onSubmit={e => { e.preventDefault(); if (goal.trim()) create(goal.trim(), title.trim() || undefined); }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Project name (optional)" aria-label="Project name" />
          <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Or describe your own goal" aria-label="Goal" required />
          <button className="btn btn-primary" disabled={!goal.trim()}>Create project</button>
        </form>
      </section>

      <section>
        <h2>Your projects</h2>
        {projects.length === 0 ? (
          <div className="empty"><h3>No projects yet</h3><p>Pick a starting point above, or plan something on Discover and save it.</p></div>
        ) : (
          <ul className="project-list">
            {projects.map(p => {
              const tasks = p.blueprint?.milestones.flatMap(m => m.tasks) || [];
              const done = tasks.filter(t => t.status === 'done').length;
              const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
              return (
                <li key={p.id}>
                  <a href={`#/projects/${p.id}`} className="project-row">
                    <span className="project-orbs" aria-hidden>
                      {(p.blueprint?.stack || []).slice(0, 5).map(s => { const t = toolBySlug(s.slug); return t ? <Orb key={s.slug} hue={categoryById(t.category).hue} size={18} /> : null; })}
                    </span>
                    <span className="project-main">
                      <strong>{p.title}</strong>
                      <span>{p.blueprint ? `${done} of ${tasks.length} tasks done, ${p.checkins.length} check-ins` : 'Waiting for intake answers'}</span>
                    </span>
                    <span className="meter" aria-label={`${pct}% complete`}><span style={{ width: pct + '%' }} /></span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

