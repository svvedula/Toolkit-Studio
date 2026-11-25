import { useCallback, useState } from 'react';
import Constellation from '../components/Constellation';
import SplineHero from '../components/SplineHero';
import { IntakeForm, PlanView } from '../components/Plan';
import { STARTER_GOALS, TOOLS, type Tool } from '../data/catalog';
import { generatePlan, intakeQuestions } from '../lib/orchestrator';
import { detectKind } from '../lib/offline';
import { navigate } from '../lib/router';
import { uid, upsertProject, useStore } from '../lib/store';
import type { Blueprint, IntakeItem } from '../lib/types';

type Phase = 'idle' | 'asking' | 'intake' | 'building' | 'plan';

export default function Discover() {
  const settings = useStore(d => d.settings);
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

  const hero = (
    <Constellation active={lit} onSelect={onSelect} height={phase === 'idle' ? 'min(54vh, 560px)' : 300} compact={phase !== 'idle'} />
  );

  return (
    <div className="page discover">
      <section className={`hero ${phase !== 'idle' ? 'hero-docked' : ''}`}>
        {settings.heroScene && phase === 'idle' ? <SplineHero scene={settings.heroScene} fallback={hero} /> : hero}
        <div className="hero-copy">
          {phase === 'idle' && <h1>What do you want to make?</h1>}
          {phase === 'idle' && <p className="lede">Describe the goal. Out of {TOOLS.length} tools you get the handful that fit, a week-by-week plan, and a prompt for every step that you can paste straight in.</p>}
          {phase === 'building' && <p className="building" aria-live="polite">Picking tools and writing prompts{lit.length ? `, ${lit.length} tools chosen so far` : '…'}</p>}
        </div>
      </section>

      <form className="goal-bar" onSubmit={start}>
        <label htmlFor="goal" className="sr-only">Your goal</label>
        <textarea
          id="goal" rows={1} value={goal} placeholder="Start a faceless YouTube channel about space history"
          onChange={e => setGoal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); start(); } }}
          disabled={phase === 'asking' || phase === 'building'}
        />
        <label className="toggle">
          <input type="checkbox" checked={askFirst} onChange={e => setAskFirst(e.target.checked)} />
          <span>Ask me questions first</span>
        </label>
        <button className="btn btn-primary btn-lg" disabled={!goal.trim() || phase === 'asking' || phase === 'building'}>
          {phase === 'asking' ? 'Preparing questions…' : 'Plan it'}
        </button>
      </form>

      {phase === 'idle' && (
        <div className="starters">
          <p className="muted">Or start from one of these</p>
          <div className="starter-row">
            {STARTER_GOALS.map(s => <button key={s.kind} className="starter" onClick={() => setGoal(s.goal)}>{s.title}</button>)}
          </div>
        </div>
      )}

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
