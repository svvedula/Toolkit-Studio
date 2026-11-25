// The single place where prompts, model choices and AI jobs live.
// Each job has an AI path (desktop + API key) and an offline path so the app
// is always usable. Offline results are labelled as drafts in the UI.
import { TOOLS, toolBySlug, CATEGORIES } from '../data/catalog';
import type { Blueprint, Checkin, IntakeItem, Milestone, PlanTask, Project, TaskVersion } from './types';
import { desktop } from './desktop';
import { getState, uid } from './store';
import { offlineIntake, offlinePlan, offlineRegenerate, offlineRecalibrate } from './offline';

export class NoKeyError extends Error { constructor() { super('no-key'); } }

const CATALOG_LINES = TOOLS.map(t => `${t.slug} | ${t.name} | ${t.category} | ${t.access} | ${t.tags.join(' ')}`).join('\n');

const BASE_SYSTEM = `You are the planning engine inside Toolkit Studio, a desktop app that turns a person's goal into an execution system made of specific AI tools.

Rules you always follow:
- Only use tools from the catalog below, referenced by slug. Pick a focused stack (4-8 tools), not everything.
- Every prompt is production-grade and specific to its tool: for image/video include shot, subject, lighting, lens, camera move, aspect ratio, style anchor, negative prompt and output parameters; for code tools include stack, data model and acceptance criteria; for writing tools include audience, structure, length and format. Ready to paste, no placeholders like [insert].
- Keep one visual direction (style anchor) per project and inject it into every image and video prompt so outputs look like one brand.
- If a step needs a paid tier, set "paid": true.
- Never plan autonomous purchases, scraping of login-gated sites, or anything that breaks a platform's terms.

Catalog (slug | name | category | access | tags):
${CATALOG_LINES}`;

function extractJson<T>(text: string): T {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('The model did not return a plan. Try again.');
  return JSON.parse(text.slice(start, end + 1));
}

type Msg = { role: 'user' | 'assistant'; content: string };

/** Stream one AI call. Resolves with the full text. */
export function runAi(system: string, messages: Msg[], onDelta?: (chunk: string, full: string) => void, maxTokens = 12000): { promise: Promise<string>; cancel: () => void } {
  const id = uid();
  let off = () => {};
  const promise = new Promise<string>(async (resolve, reject) => {
    if (!desktop || !(await desktop.secret.has())) return reject(new NoKeyError());
    let full = '';
    off = desktop.ai.on({
      delta: p => { if (p.id !== id) return; full += p.text; onDelta?.(p.text, full); },
      done: p => { if (p.id !== id) return; off(); resolve(p.text || full); },
      error: p => { if (p.id !== id) return; off(); reject(p.error === 'no-key' ? new NoKeyError() : new Error(p.error)); },
    });
    desktop.ai.stream({ id, system, messages, maxTokens, model: getState().settings.model });
  });
  return { promise, cancel: () => { desktop?.ai.cancel(id); off(); } };
}

// ---------- jobs ----------

export async function intakeQuestions(goal: string): Promise<{ questions: string[]; source: 'ai' | 'offline' }> {
  try {
    const { promise } = runAi(BASE_SYSTEM, [{ role: 'user', content:
      `Goal: "${goal}"\n\nBefore planning, ask 5 to 8 short, specific questions that will change the plan: audience, aesthetic, experience level, weekly time, budget, constraints, and anything specific to this goal. Return JSON only: {"questions": ["..."]}` }], undefined, 1500);
    const out = extractJson<{ questions: string[] }>(await promise);
    return { questions: out.questions.slice(0, 8), source: 'ai' };
  } catch (e) {
    if (!(e instanceof NoKeyError)) console.warn(e);
    return { questions: offlineIntake(goal), source: 'offline' };
  }
}

const PLAN_SHAPE = `Return JSON only, with this shape:
{
  "approach": "2-4 sentences: the strategy and why it fits this person",
  "visualDirection": "one-line style anchor reused in every image/video prompt, or empty if not visual",
  "stack": [{"slug": "catalog-slug", "why": "one line"}],
  "milestones": [
    {"title": "...", "targetWeek": 1, "tasks": [
      {"title": "...", "tool": "catalog-slug", "why": "one line", "prompt": "the full copy-ready prompt", "params": "output parameters", "paid": false}
    ]}
  ],
  "recipes": [{"from": "slug", "to": "slug", "handoff": "exactly what passes between them and how"}]
}
Use 3-5 milestones, 2-4 tasks each. Order milestones by week.`;

function normalizePlan(raw: any, source: 'ai' | 'offline'): Blueprint {
  const valid = (s: string) => !!toolBySlug(s);
  const milestones: Milestone[] = (raw.milestones || []).map((m: any, i: number) => ({
    id: uid(), title: String(m.title || `Milestone ${i + 1}`), targetWeek: Number(m.targetWeek) || i + 1, status: 'todo',
    tasks: (m.tasks || []).filter((t: any) => valid(t.tool)).map((t: any): PlanTask => ({
      id: uid(), title: String(t.title), tool: t.tool, status: 'todo', why: t.why, prompt: String(t.prompt || ''), params: t.params, paid: !!t.paid || toolBySlug(t.tool)?.access === 'Paid',
    })),
  }));
  const used = new Set(milestones.flatMap(m => m.tasks.map(t => t.tool)));
  const stack = (raw.stack || []).filter((s: any) => valid(s.slug));
  for (const slug of used) if (!stack.some((s: any) => s.slug === slug)) stack.push({ slug, why: '' });
  return {
    version: 1, source,
    approach: String(raw.approach || ''),
    visualDirection: raw.visualDirection || '',
    stack,
    milestones,
    recipes: (raw.recipes || []).filter((r: any) => valid(r.from) && valid(r.to)),
  };
}

/** Streams a plan. `onTool` fires as tool slugs appear in the stream so the UI can light them up. */
export async function generatePlan(goal: string, intake: IntakeItem[], hooks: { onText?: (full: string) => void; onTool?: (slug: string) => void } = {}): Promise<Blueprint> {
  const seen = new Set<string>();
  const scan = (full: string) => {
    const re = /"(?:slug|tool)"\s*:\s*"([a-z0-9-]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(full))) if (!seen.has(m[1]) && toolBySlug(m[1])) { seen.add(m[1]); hooks.onTool?.(m[1]); }
  };
  const answers = intake.filter(i => i.a.trim()).map(i => `Q: ${i.q}\nA: ${i.a}`).join('\n\n') || '(no answers given)';
  try {
    const { promise } = runAi(BASE_SYSTEM, [{ role: 'user', content: `Goal: "${goal}"\n\nIntake answers:\n${answers}\n\n${PLAN_SHAPE}` }], (_c, full) => { hooks.onText?.(full); scan(full); });
    return normalizePlan(extractJson(await promise), 'ai');
  } catch (e) {
    if (!(e instanceof NoKeyError)) throw e;
    const plan = offlinePlan(goal, intake);
    // replay the stack so the constellation animation still tells the story
    for (const s of plan.stack) { await new Promise(r => setTimeout(r, 180)); hooks.onTool?.(s.slug); }
    return normalizePlan(plan, 'offline');
  }
}

export async function regenerateTask(project: Project, taskId: string, instruction: string): Promise<TaskVersion> {
  const bp = project.blueprint!;
  const task = bp.milestones.flatMap(m => m.tasks).find(t => t.id === taskId)!;
  try {
    const { promise } = runAi(BASE_SYSTEM, [{ role: 'user', content:
      `Project goal: "${project.goal}"\nVisual direction: ${bp.visualDirection || 'n/a'}\nTool: ${task.tool}\n\nCurrent task:\nTitle: ${task.title}\nPrompt: ${task.prompt}\nParams: ${task.params || ''}\n\nRewrite ONLY this task following the person's instruction: "${instruction}". Keep the same tool. Return JSON only: {"title": "...", "prompt": "...", "params": "..."}` }], undefined, 3000);
    const out = extractJson<{ title: string; prompt: string; params?: string }>(await promise);
    return { title: out.title || task.title, prompt: out.prompt || task.prompt, params: out.params ?? task.params, at: new Date().toISOString(), note: instruction };
  } catch (e) {
    if (!(e instanceof NoKeyError)) throw e;
    return offlineRegenerate(task, instruction, bp.visualDirection);
  }
}

export async function recalibrate(project: Project, checkin: Checkin): Promise<{ response: string; milestones: Milestone[] }> {
  const bp = project.blueprint!;
  const doneTitles = bp.milestones.flatMap(m => m.tasks.filter(t => t.status === 'done').map(t => t.title));
  const remaining = bp.milestones.filter(m => m.status !== 'done');
  try {
    const { promise } = runAi(BASE_SYSTEM, [{ role: 'user', content:
      `Project goal: "${project.goal}". Visual direction: ${bp.visualDirection || 'n/a'}.
Completed tasks: ${doneTitles.join('; ') || 'none'}.
Remaining milestones (JSON): ${JSON.stringify(remaining.map(m => ({ title: m.title, targetWeek: m.targetWeek, tasks: m.tasks.filter(t => t.status !== 'done').map(t => ({ title: t.title, tool: t.tool })) })))}
This week's check-in. Progress: "${checkin.progress}". Blockers: "${checkin.blockers}".

Recalibrate: change dates and scope based on what actually happened (do not just reprint the plan). Address each blocker concretely. Then write next week's tasks with fresh copy-ready prompts.
Return JSON only: {"response": "3-6 sentences to the person", "milestones": [same milestone shape as before, remaining work only, with tasks including prompt, params, tool, why, paid]}` }]);
    const out = extractJson<any>(await promise);
    const norm = normalizePlan({ milestones: out.milestones }, 'ai');
    return { response: String(out.response || ''), milestones: norm.milestones };
  } catch (e) {
    if (!(e instanceof NoKeyError)) throw e;
    return offlineRecalibrate(project, checkin);
  }
}

export const categoriesForStack = (slugs: string[]) =>
  CATEGORIES.filter(c => slugs.some(s => toolBySlug(s)?.category === c.id));
