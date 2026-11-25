import { useEffect, useState } from 'react';
import Constellation from '../components/Constellation';
import { IntakeForm, PlanView } from '../components/Plan';
import { Icon } from '../components/ui';
import { generatePlan, intakeQuestions, recalibrate, regenerateTask } from '../lib/orchestrator';
import { navigate } from '../lib/router';
import { deleteProject, patchProject, uid, useStore } from '../lib/store';
import type { Checkin, IntakeItem, Milestone, PlanTask, Project, Status } from '../lib/types';

function mapTasks(p: Project, fn: (t: PlanTask) => PlanTask): Project {
  if (!p.blueprint) return p;
  const milestones = p.blueprint.milestones.map(m => {
    const tasks = m.tasks.map(fn);
    const status: Status = tasks.length && tasks.every(t => t.status === 'done') ? 'done' : tasks.some(t => t.status !== 'todo') ? 'doing' : 'todo';
    return { ...m, tasks, status };
  });
  return { ...p, blueprint: { ...p.blueprint, milestones } };
}

export default function ProjectDetail({ id }: { id: string }) {
  const projects = useStore(d => d.projects);
  const project = projects.find(p => p.id === id);
  const [questions, setQuestions] = useState<{ list: string[]; source: 'ai' | 'offline' } | null>(null);
  const [building, setBuilding] = useState(false);
  const [lit, setLit] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'plan' | 'checkins'>('plan');

  useEffect(() => {
    if (project && !project.blueprint && !questions) intakeQuestions(project.goal).then(q => setQuestions({ list: q.questions, source: q.source }));
  }, [project?.id, project?.blueprint]);

  if (!project) return <div className="page"><div className="empty"><h3>This project no longer exists</h3><button className="btn btn-primary" onClick={() => navigate('/projects')}>Back to projects</button></div></div>;

  async function build(items: IntakeItem[]) {
    setBuilding(true); setError(''); setLit([]);
    try {
      const bp = await generatePlan(project!.goal, items, { onTool: s => setLit(l => [...l, s]) });
      patchProject(project!.id, p => ({ ...p, intake: items, blueprint: bp }));
    } catch (e: any) { setError(e?.message || 'Planning failed.'); }
    finally { setBuilding(false); }
  }

  const actions = {
    onStatus: (taskId: string, s: Status) => patchProject(project.id, p => mapTasks(p, t => (t.id === taskId ? { ...t, status: s } : t))),
    onRedo: async (taskId: string, instruction: string) => {
      const v = await regenerateTask(project, taskId, instruction);
      patchProject(project.id, p => mapTasks(p, t => (t.id === taskId ? { ...t, proposal: v } : t)));
    },
    onAccept: (taskId: string) => patchProject(project.id, p => mapTasks(p, t => {
      if (t.id !== taskId || !t.proposal) return t;
      const prev = { title: t.title, prompt: t.prompt, params: t.params, at: new Date().toISOString() };
      return { ...t, title: t.proposal.title, prompt: t.proposal.prompt, params: t.proposal.params, proposal: undefined, history: [...(t.history || []), prev] };
    })),
    onRevert: (taskId: string) => patchProject(project.id, p => mapTasks(p, t => (t.id === taskId ? { ...t, proposal: undefined } : t))),
  };

  return (
    <div className="page project-page">
      <button className="back" onClick={() => navigate('/projects')}><Icon name="back" size={16} /> Projects</button>
      <header className="page-head">
        <div>
          <h1>{project.title}</h1>
          {project.goal !== project.title && <p className="lede">{project.goal}</p>}
        </div>
        {project.blueprint && (
          <div className="seg" role="tablist" aria-label="Project view">
            <button role="tab" aria-selected={tab === 'plan'} onClick={() => setTab('plan')}>Plan</button>
            <button role="tab" aria-selected={tab === 'checkins'} onClick={() => setTab('checkins')}>Weekly check-in {project.checkins.length ? `(${project.checkins.length})` : ''}</button>
          </div>
        )}
      </header>

      {!project.blueprint && (
        <>
          {building && <Constellation active={lit} compact height={320} />}
          {error && <p className="error panel-error">{error}</p>}
          {!questions ? <p className="muted">Preparing your questions…</p> : !building && <IntakeForm questions={questions.list} source={questions.source} onSubmit={build} busy={building} />}
        </>
      )}

      {project.blueprint && tab === 'plan' && <PlanView blueprint={project.blueprint} actions={actions} />}
      {project.blueprint && tab === 'checkins' && <CheckIns project={project} />}

      <footer className="danger-zone">
        <button className="link danger" onClick={() => { if (confirm(`Delete “${project.title}”? This can’t be undone.`)) { deleteProject(project.id); navigate('/projects'); } }}>Delete project</button>
      </footer>
    </div>
  );
}

function CheckIns({ project }: { project: Project }) {
  const [progress, setProgress] = useState('');
  const [blockers, setBlockers] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!progress.trim()) return;
    setBusy(true); setError('');
    const checkin: Checkin = { id: uid(), weekOf: new Date().toISOString().slice(0, 10), progress, blockers, at: new Date().toISOString() };
    try {
      const out = await recalibrate(project, checkin);
      patchProject(project.id, p => {
        const bp = p.blueprint!;
        const doneTasks = bp.milestones.flatMap(m => m.tasks.filter(t => t.status === 'done'));
        const archive: Milestone[] = doneTasks.length ? [{ id: 'done-archive', title: 'Done so far', targetWeek: 0, status: 'done', tasks: doneTasks }] : [];
        return { ...p, checkins: [{ ...checkin, response: out.response }, ...p.checkins], blueprint: { ...bp, milestones: [...archive, ...out.milestones] } };
      });
      setProgress(''); setBlockers('');
    } catch (x: any) { setError(x?.message || 'Check-in failed.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="checkins">
      <form className="checkin-form" onSubmit={submit}>
        <h2>This week</h2>
        <label htmlFor="ci-progress">What moved forward?</label>
        <textarea id="ci-progress" rows={3} value={progress} onChange={e => setProgress(e.target.value)} placeholder="Finished the first script, recorded narration" />
        <label htmlFor="ci-block">What got in the way?</label>
        <textarea id="ci-block" rows={2} value={blockers} onChange={e => setBlockers(e.target.value)} placeholder="Video shots don’t match each other" />
        <div className="row"><button className="btn btn-primary" disabled={busy || !progress.trim()}>{busy ? 'Recalibrating…' : 'Log check-in and update plan'}</button></div>
        {error && <p className="error">{error}</p>}
      </form>
      <ol className="checkin-log">
        {project.checkins.map(c => (
          <li key={c.id}>
            <time>Week of {c.weekOf}</time>
            <p><strong>Moved:</strong> {c.progress}</p>
            {c.blockers && <p><strong>Blocked:</strong> {c.blockers}</p>}
            {c.response && <p className="ai-response">{c.response}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
