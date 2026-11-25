import { useMemo, useState } from 'react';
import { categoryById, toolBySlug } from '../data/catalog';
import type { Blueprint, IntakeItem, PlanTask, Status } from '../lib/types';
import { CopyButton, Icon, Orb, ToolChip } from './ui';
import { openExternal, openToolWindow } from '../lib/desktop';
import { navigate } from '../lib/router';

// ---------------- intake ----------------
export function IntakeForm({ questions, onSubmit, busy, source }: { questions: string[]; onSubmit: (items: IntakeItem[]) => void; busy?: boolean; source: 'ai' | 'offline' }) {
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));
  const answered = answers.filter(a => a.trim()).length;
  const need = Math.min(3, questions.length);
  return (
    <form className="intake" onSubmit={e => { e.preventDefault(); if (answered >= need) onSubmit(questions.map((q, i) => ({ q, a: answers[i] }))); }}>
      <header>
        <h2>A few questions first</h2>
        <p>Your answers decide which tools you get and how every prompt is written. {source === 'offline' && 'These are the standard questions; add an API key in Settings to get questions written for your goal.'}</p>
      </header>
      <ol>
        {questions.map((q, i) => (
          <li key={i}>
            <label htmlFor={`q${i}`}>{q}</label>
            <textarea id={`q${i}`} rows={2} value={answers[i]} onChange={e => setAnswers(a => a.map((x, j) => (j === i ? e.target.value : x)))} />
          </li>
        ))}
      </ol>
      <div className="intake-foot">
        <span className="muted">{answered < need ? `Answer at least ${need} to continue.` : `${answered} of ${questions.length} answered.`}</span>
        <button className="btn btn-primary" disabled={answered < need || busy}>{busy ? 'Building your plan…' : 'Build my plan'}</button>
      </div>
    </form>
  );
}

// ---------------- word diff ----------------
function wordDiff(a: string, b: string) {
  const A = a.split(/(\s+)/), B = b.split(/(\s+)/);
  if (A.length * B.length > 400000) return [{ t: 'del' as const, s: a }, { t: 'add' as const, s: b }];
  const dp = Array.from({ length: A.length + 1 }, () => new Uint16Array(B.length + 1));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--)
    dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { t: 'same' | 'add' | 'del'; s: string }[] = [];
  let i = 0, j = 0;
  const push = (t: 'same' | 'add' | 'del', s: string) => { const last = out[out.length - 1]; if (last && last.t === t) last.s += s; else out.push({ t, s }); };
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) { push('same', A[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) push('del', A[i++]);
    else push('add', B[j++]);
  }
  while (i < A.length) push('del', A[i++]);
  while (j < B.length) push('add', B[j++]);
  return out;
}

// ---------------- task card ----------------
interface TaskActions {
  onStatus?: (id: string, s: Status) => void;
  onRedo?: (id: string, instruction: string) => Promise<void>;
  onAccept?: (id: string) => void;
  onRevert?: (id: string) => void;
}

function TaskCard({ task, visual, actions }: { task: PlanTask; visual?: string; actions: TaskActions }) {
  const tool = toolBySlug(task.tool)!;
  const [redoOpen, setRedoOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const diff = useMemo(() => (task.proposal ? wordDiff(task.prompt, task.proposal.prompt) : null), [task.prompt, task.proposal]);

  const next: Record<Status, Status> = { todo: 'doing', doing: 'done', done: 'todo' };
  const statusLabel: Record<Status, string> = { todo: 'To do', doing: 'In progress', done: 'Done' };

  return (
    <article className={`task task-${task.status}`}>
      <div className="task-head">
        {actions.onStatus && (
          <button className={`status status-${task.status}`} onClick={() => actions.onStatus!(task.id, next[task.status])} aria-label={`Status: ${statusLabel[task.status]}. Change status`} title={statusLabel[task.status]}>
            {task.status === 'done' && <Icon name="check" size={14} />}
          </button>
        )}
        <div className="task-title">
          <h4>{task.title}</h4>
          <div className="task-meta">
            <ToolChip slug={task.tool} />
            {task.paid && <span className="paid">Needs a paid plan</span>}
          </div>
        </div>
      </div>
      {task.why && <p className="task-why">{task.why}</p>}

      {diff ? (
        <div className="proposal">
          <p className="proposal-label">Proposed rewrite{task.proposal?.note ? ` for “${task.proposal.note}”` : ''}</p>
          <div className="prompt diff">{diff.map((d, i) => <span key={i} className={`d-${d.t}`}>{d.s}</span>)}</div>
          <div className="row">
            <button className="btn btn-primary" onClick={() => actions.onAccept?.(task.id)}>Accept rewrite</button>
            <button className="btn btn-quiet" onClick={() => actions.onRevert?.(task.id)}>Keep original</button>
          </div>
        </div>
      ) : (
        <div className="prompt">{task.prompt}</div>
      )}
      {task.params && <p className="params"><span>Output</span> {task.params}</p>}
      {visual && /video|image|anim/.test(tool.category + tool.tags.join()) && !task.prompt.includes(visual.slice(0, 20)) && (
        <p className="params"><span>Style anchor</span> {visual}</p>
      )}

      <div className="task-actions">
        <CopyButton text={task.proposal ? task.proposal.prompt : task.prompt} />
        <button className="btn btn-quiet" onClick={() => openToolWindow(tool.url, tool.name)}><Icon name="window" size={16} /> Open {tool.name}</button>
        {actions.onRedo && !task.proposal && (
          <button className="btn btn-quiet" onClick={() => setRedoOpen(o => !o)} aria-expanded={redoOpen}><Icon name="redo" size={16} /> Redo this task</button>
        )}
      </div>
      {redoOpen && !task.proposal && (
        <form className="redo" onSubmit={async e => {
          e.preventDefault(); if (!instruction.trim()) return;
          setBusy(true); setErr('');
          try { await actions.onRedo!(task.id, instruction); setRedoOpen(false); setInstruction(''); }
          catch (x: any) { setErr(x?.message || 'Could not rewrite this task.'); }
          finally { setBusy(false); }
        }}>
          <label htmlFor={`redo-${task.id}`}>What should change? Only this task is rewritten.</label>
          <div className="row">
            <input id={`redo-${task.id}`} value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="e.g. vertical 9:16, darker mood, shorter" />
            <button className="btn btn-primary" disabled={busy || !instruction.trim()}>{busy ? 'Rewriting…' : 'Rewrite'}</button>
          </div>
          {err && <p className="error">{err}</p>}
        </form>
      )}
    </article>
  );
}

// ---------------- plan ----------------
export function PlanView({ blueprint, actions = {} }: { blueprint: Blueprint; actions?: TaskActions }) {
  const [mode, setMode] = useState<'week' | 'tool'>('week');
  const allTasks = blueprint.milestones.flatMap(m => m.tasks);
  const byTool = useMemo(() => {
    const map = new Map<string, PlanTask[]>();
    for (const t of allTasks) map.set(t.tool, [...(map.get(t.tool) || []), t]);
    return [...map.entries()];
  }, [allTasks]);
  const done = allTasks.filter(t => t.status === 'done').length;

  return (
    <div className="plan">
      {blueprint.source === 'offline' && (
        <p className="notice">This is an offline draft built from templates. <a href="#/settings">Add an API key</a> to get a plan written for your answers.</p>
      )}
      <section className="plan-overview">
        <div>
          <h3>Approach</h3>
          <p className="approach">{blueprint.approach}</p>
          {blueprint.visualDirection && (<><h3>Visual direction</h3><p className="visual">{blueprint.visualDirection}</p></>)}
        </div>
        <div className="stack">
          <h3>Your stack</h3>
          <ul>
            {blueprint.stack.map(s => {
              const t = toolBySlug(s.slug)!;
              return (
                <li key={s.slug}>
                  <button onClick={() => navigate(`/tools/${t.slug}`)}>
                    <Orb hue={categoryById(t.category).hue} size={22} />
                    <span><strong>{t.name}</strong><small>{s.why || t.description}</small></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {blueprint.recipes.length > 0 && (
        <section className="recipes">
          <h3>How the tools hand off</h3>
          <ul>
            {blueprint.recipes.map((r, i) => (
              <li key={i}>
                <span className="handoff"><ToolChip slug={r.from} /><span className="thread" aria-label="hands off to" /><ToolChip slug={r.to} /></span>
                <p>{r.handoff}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="plan-bar">
        <h3>Tasks <span className="muted">{done} of {allTasks.length} done</span></h3>
        <div className="seg" role="tablist" aria-label="Group tasks">
          <button role="tab" aria-selected={mode === 'week'} onClick={() => setMode('week')}>By week</button>
          <button role="tab" aria-selected={mode === 'tool'} onClick={() => setMode('tool')}>By tool</button>
        </div>
      </div>

      {mode === 'week'
        ? blueprint.milestones.map(m => (
          <section key={m.id} className="milestone">
            <header><span className="week">Week {m.targetWeek}</span><h3>{m.title}</h3></header>
            {m.tasks.map(t => <TaskCard key={t.id} task={t} visual={blueprint.visualDirection} actions={actions} />)}
          </section>
        ))
        : byTool.map(([slug, tasks]) => {
          const t = toolBySlug(slug)!;
          return (
            <section key={slug} className="milestone">
              <header>
                <Orb hue={categoryById(t.category).hue} size={18} />
                <h3>{t.name}</h3>
                <button className="link" onClick={() => openExternal(t.url)}>Open site <Icon name="external" size={14} /></button>
              </header>
              {tasks.map(x => <TaskCard key={x.id} task={x} visual={blueprint.visualDirection} actions={actions} />)}
            </section>
          );
        })}
    </div>
  );
}
