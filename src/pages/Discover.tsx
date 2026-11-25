import { useCallback, useState } from 'react';
import Constellation from '../components/Constellation';
import SplineHero from '../components/SplineHero';
import { IntakeForm, PlanView } from '../components/Plan';
import { CATEGORIES, STARTER_GOALS, TOOLS, categoryById, toolBySlug, type Tool } from '../data/catalog';
import { Icon, Orb } from '../components/ui';
import { generatePlan, intakeQuestions } from '../lib/orchestrator';
import { detectKind } from '../lib/offline';
import { navigate } from '../lib/router';
import { uid, upsertProject, useStore } from '../lib/store';
import type { Blueprint, IntakeItem } from '../lib/types';

type Phase = 'idle' | 'asking' | 'intake' | 'building' | 'plan';

export default function Discover() {
  const settings = useStore(d => d.settings);
  const projects = useStore(d => d.projects);
  const saved = useStore(d => d.saved);
  const [toolSearch, setToolSearch] = useState('');
  const [goal, setGoal] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [questions, setQuestions] = useState<{ list: string[]; source: 'ai' | 'offline' }>({ list: [], source: 'offline' });
  const [intake, setIntake] = useState<IntakeItem[]>([]);
  const [lit, setLit] = useState<string[]>([]);
  const [streamChars, setStreamChars] = useState(0);
  const [plan, setPlan] = useState<Blueprint | null>(null);
  const [error, setError] = useState('');
  const [askFirst, setAskFirst] = useState(settings.askFirst);

  const onSelect = useCallback((t: Tool) => navigate(`/tools/${t.slug}`), []);

  async function build(items: IntakeItem[]) {
    setIntake(items); setPhase('building'); setLit([]); setStreamChars(0); setError('');
    try {
      const bp = await generatePlan(goal, items, {
        onText: full => setStreamChars(full.length),
        onTool: slug => setLit(l => (l.includes(slug) ? l : [...l, slug])),
      });
      setLit(bp.stack.map(s => s.slug));
      setPlan(bp); setPhase('plan');
    } catch (e: any) {
      setError(e?.message || 'Planning failed.'); setPhase(items.length ? 'intake' : 'idle');
    }
  }

  async function start(e?: React.FormEvent) {
    e?.preventDefault();
    if (!goal.trim()) return;
    setPlan(null); setError('');
    if (askFirst) {
      setPhase('asking');
      const q = await intakeQuestions(goal.trim());
      setQuestions({ list: q.questions, source: q.source }); setPhase('intake');
    } else build([]);
  }

  function saveAsProject() {
    if (!plan) return;
    const id = uid();
    upsertProject({ id, title: goal, goal, kind: detectKind(goal), createdAt: new Date().toISOString(), intake, blueprint: plan, checkins: [] });
    navigate(`/projects/${id}`);
  }

  function createProject(g: string, title: string) {
    const id = uid();
    upsertProject({ id, title, goal: g, kind: detectKind(g), createdAt: new Date().toISOString(), intake: [], checkins: [] });
    navigate(`/projects/${id}`);
  }

  const idle = phase === 'idle';
  const orbit = <Constellation active={lit} onSelect={onSelect} height={idle ? 380 : 300} compact={!idle} />;
  const savedTools = saved.filter(s => s.type === 'tool').map(s => toolBySlug(s.id)).filter(Boolean) as Tool[];

  const goalBar = (
    <form className="goal-bar" onSubmit={start}>
      <span className="goal-spark" aria-hidden><Icon name="sparkle" size={20} /></span>
      <label htmlFor="goal" className="sr-only">Your goal</label>
      <textarea
        id="goal" rows={1} value={goal} placeholder="Start a faceless YouTube channel about space history…"
        onChange={e => setGoal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); start(); } }}
        disabled={phase === 'asking' || phase === 'building'}
      />
      <label className="toggle">
        <input type="checkbox" checked={askFirst} onChange={e => setAskFirst(e.target.checked)} />
        <span>Ask me questions first</span>
      </label>
      <button className="btn btn-primary btn-lg" disabled={!goal.trim() || phase === 'asking' || phase === 'building'}>
        {phase === 'asking' ? 'Preparing questions…' : <>Plan it <Icon name="arrow" size={18} /></>}
      </button>
    </form>
  );

  if (idle) {
    return (
      <div className="page discover dash">
        <div className="dash-main">
          <section className="hero">
            <div className="hero-copy">
              <h1>What do you<br />want to <span className="grad">make?</span></h1>
              <p className="lede">Describe the goal. Out of {TOOLS.length} tools you get the handful that fit, a week-by-week plan, and a prompt for every step.</p>
            </div>
            <div className="hero-orbit">
              {settings.heroScene ? <SplineHero scene={settings.heroScene} fallback={orbit} /> : orbit}
            </div>
          </section>
          {goalBar}
          {error && <p className="error panel-error">{error}</p>}

          <section className="glass block">
            <header className="block-head">
              <span className="block-icon"><Icon name="cube" size={22} /></span>
              <div><h2>Start a project</h2><p>Pick a starting point. You answer a few questions, then get the full plan.</p></div>
              <a className="view-all" href="#/projects">View all <Icon name="arrow" size={14} /></a>
            </header>
            <div className="project-cards">
              {STARTER_GOALS.map(s => {
                const look = STARTER_LOOK[s.kind] || STARTER_LOOK.general;
                return (
                  <button key={s.kind} className="project-card" style={{ ['--c' as any]: look.color }} onClick={() => createProject(s.goal, s.title)}>
                    <span className="pc-icon"><Icon name={look.icon} size={26} /></span>
                    <span className="pc-text"><strong>{s.title}</strong><span>{s.goal}</span></span>
                    <span className="pc-go"><Icon name="arrow" size={16} /></span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="glass block">
            <header className="block-head">
              <span className="block-icon"><Icon name="business" size={22} /></span>
              <div><h2>Explore by category</h2><p>All {TOOLS.length} tools, sorted into {CATEGORIES.length} categories.</p></div>
              <a className="view-all" href="#/explore">View all categories <Icon name="arrow" size={14} /></a>
            </header>
            <div className="cat-tiles">
              {CATEGORIES.slice(0, 5).map(c => (
                <a key={c.id} className="cat-tile" style={{ ['--c' as any]: c.hue }} href={`#/explore?cat=${c.id}`}>
                  <Icon name={c.id} size={30} /><span>{c.name}</span>
                </a>
              ))}
              <a className="cat-tile" href="#/explore"><Icon name="more" size={30} /><span>{CATEGORIES.length - 5} more</span></a>
            </div>
          </section>
        </div>

        <aside className="dash-side">
          <section className="glass widget">
            <h2><Icon name="sparkle" size={20} /> Explore <span className="grad">{TOOLS.length}</span> tools</h2>
            <p className="muted">Filter by category, search, and open any tool beside your plan.</p>
            <form onSubmit={e => { e.preventDefault(); navigate(`/explore?q=${encodeURIComponent(toolSearch)}`); }}>
              <input className="search" type="search" placeholder="Search tools…" value={toolSearch} onChange={e => setToolSearch(e.target.value)} aria-label="Search tools" />
            </form>
            <div className="mini-tiles">
              <a href="#/explore" className="mini-tile on"><Icon name="projects" size={20} /><span>All ({TOOLS.length})</span></a>
              {['models', 'video', 'image', 'code', 'productivity'].map(id => (
                <a key={id} href={`#/explore?cat=${id}`} className="mini-tile" style={{ ['--c' as any]: categoryById(id).hue }}>
                  <Icon name={id} size={20} /><span>{categoryById(id).name.replace(' generation', '').replace('Web dev & coding', 'Coding')}</span>
                </a>
              ))}
            </div>
            <a className="btn btn-ghost" href="#/explore">Browse all tools <Icon name="arrow" size={14} /></a>
          </section>

          <section className="glass widget widget-teal">
            <h2><Icon name="library" size={20} /> Library</h2>
            <p className="muted">Your saved tools and projects.</p>
            <div className="lib-box">
              <span className="lib-star"><Icon name="star" size={22} /></span>
              <div>
                <strong>Saved tools</strong>
                {savedTools.length ? (
                  <div className="row wrap lib-orbs">{savedTools.slice(0, 6).map(t => <a key={t.slug} href={`#/tools/${t.slug}`} title={t.name}><Orb hue={categoryById(t.category).hue} size={18} /></a>)}</div>
                ) : <p className="muted small">Nothing saved yet.</p>}
              </div>
              {!savedTools.length && <a className="btn btn-primary btn-sm" href="#/explore">Explore tools</a>}
            </div>
            <p className="active-label"><span className="dot" /> Active projects</p>
            {projects.length === 0 ? <p className="muted small">None yet. Start one on the left.</p> : projects.slice(0, 3).map(p => {
              const tasks = p.blueprint?.milestones.flatMap(m => m.tasks) || [];
              const done = tasks.filter(t => t.status === 'done').length;
              return (
                <a key={p.id} className="lib-project" href={`#/projects/${p.id}`}>
                  <span className="lp-icon"><Icon name={(STARTER_LOOK[p.kind] || STARTER_LOOK.general).icon} size={18} /></span>
                  <span className="lp-main"><strong>{p.title}</strong><small>{tasks.length ? `${done} / ${tasks.length} tasks done` : 'Waiting for answers'}</small>
                    <span className="meter"><span style={{ width: (tasks.length ? (done / tasks.length) * 100 : 0) + '%' }} /></span></span>
                  <Icon name="arrow" size={16} />
                </a>
              );
            })}
          </section>

          <section className="glass widget widget-spline">
            <h2>Make the home screen yours</h2>
            <p className="muted">Drop in any Spline 3D scene and it replaces the tool orbit above.</p>
            <a className="btn btn-primary btn-sm" href="#/settings">Add a scene <Icon name="arrow" size={14} /></a>
            <svg className="spline-swirl" viewBox="0 0 200 160" aria-hidden>
              <defs><linearGradient id="sw" x1="0" x2="1"><stop offset="0" stopColor="#4F7BFF" /><stop offset="1" stopColor="#B26BFF" /></linearGradient></defs>
              <path d="M10 140 C 60 40, 120 160, 190 30" stroke="url(#sw)" strokeWidth="26" fill="none" strokeLinecap="round" opacity=".9" />
              <path d="M10 140 C 60 40, 120 160, 190 30" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".35" />
            </svg>
          </section>
        </aside>
      </div>
    );
  }

  return (
    <div className="page discover">
      <section className="hero hero-docked">
        {orbit}
        {phase === 'building' && <p className="building" aria-live="polite">Picking tools and writing prompts{lit.length ? `, ${lit.length} tools chosen so far` : '…'}</p>}
      </section>
      {goalBar}
      {error && <p className="error panel-error">{error}</p>}

      {phase === 'intake' && <IntakeForm key={questions.list.join('|')} questions={questions.list} source={questions.source} onSubmit={build} />}

      {phase === 'plan' && plan && (
        <>
          <div className="plan-head">
            <h2>{goal}</h2>
            <div className="row">
              <button className="btn btn-quiet" onClick={() => { setPhase('idle'); setPlan(null); setLit([]); }}>Start over</button>
              <button className="btn btn-primary" onClick={saveAsProject}>Save as project</button>
            </div>
          </div>
          <PlanView blueprint={plan} />
        </>
      )}
    </div>
  );
}

const STARTER_LOOK: Record<string, { icon: string; color: string }> = {
  youtube: { icon: 'youtube', color: '#FF4D5E' },
  saas: { icon: 'sparkle', color: '#A86BFF' },
  tiktok: { icon: 'clapper', color: '#8B7BFF' },
  game: { icon: 'gamepad', color: '#9C7CFF' },
  newsletter: { icon: 'mail', color: '#4FA3FF' },
  resell: { icon: 'store', color: '#FF9A3D' },
  general: { icon: 'cube', color: '#6E8BFF' },
};
