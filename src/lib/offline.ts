// Offline planner: deterministic, template-based plans used when no API key is
// set. Good enough to start work; the UI labels these as drafts.
import { TOOLS, toolBySlug } from '../data/catalog';
import type { Checkin, IntakeItem, Milestone, PlanTask, Project, TaskVersion } from './types';
import { uid } from './store';

type Kind = 'youtube' | 'saas' | 'tiktok' | 'game' | 'newsletter' | 'resell' | 'general';

export function detectKind(goal: string): Kind {
  const g = goal.toLowerCase();
  if (/youtube|faceless|channel|video essay/.test(g)) return 'youtube';
  if (/tiktok|reels|animated|animation|cartoon|series/.test(g)) return 'tiktok';
  if (/saas|web app|app |software|startup|micro/.test(g)) return 'saas';
  if (/game|roblox|unity|godot|indie/.test(g)) return 'game';
  if (/newsletter|substack|blog|writing/.test(g)) return 'newsletter';
  if (/resell|flip|ecommerce|store|side business|furniture|vendor/.test(g)) return 'resell';
  return 'general';
}

const INTAKE_BASE = [
  'Who exactly is this for? Describe the person you want to reach.',
  'What should it look and feel like? Name two or three references you like.',
  'How experienced are you with AI tools and with this kind of project?',
  'How many hours a week can you put in, and by when do you want a first result?',
  'What is your monthly budget for tools? Free only is a valid answer.',
];
const INTAKE_EXTRA: Record<Kind, string[]> = {
  youtube: ['Which niche or topic, and do you want a voice that sounds like you or a synthetic narrator?', 'Long-form, Shorts, or both?'],
  tiktok: ['Do you have a character in mind? Describe their look and personality.', 'Will episodes have dialogue, narration, or music only?'],
  saas: ['What one problem does it solve, and how do people solve it today?', 'Can you code, or should everything be no-code?'],
  game: ['What is the core loop in one sentence?', 'Solo or multiplayer, and what platform do you want to publish on?'],
  newsletter: ['What will a reader learn or get from each issue?', 'Where will you find your first 100 readers?'],
  resell: ['What will you buy and resell, and in what area?', 'How much cash can you tie up in stock at once?'],
  general: ['What does “done” look like for you in 8 weeks?', 'What have you already tried?'],
};
export const offlineIntake = (goal: string) => [...INTAKE_BASE, ...INTAKE_EXTRA[detectKind(goal)]];

type T = [tool: string, title: string, prompt: string, params?: string];
interface Template { approach: string; visual: string; milestones: { title: string; tasks: T[] }[]; recipes: [string, string, string][] }

const V = '{VISUAL}';
const G = '{GOAL}';
const A = '{AUDIENCE}';

const TEMPLATES: Record<Kind, Template> = {
  youtube: {
    approach: 'Pick a narrow niche with proven outliers, write scripts in a repeatable format, and produce every episode from the same visual style so the channel reads as one brand. Ship two episodes a week before optimising anything.',
    visual: 'muted cinematic documentary look, soft volumetric light, 35mm film grain, desaturated teal and amber palette',
    milestones: [
      { title: 'Find the niche and the format', tasks: [
        ['1of10', 'Find 20 outlier videos in your niche', `Search the niche "${G}". Filter to channels under 100k subscribers with videos at 5x+ their average views in the last 6 months. Export the top 20 titles and thumbnails and note the shared hook pattern.`, 'Spreadsheet: title, views, channel size, hook type'],
        ['vidiq', 'Validate keywords and title patterns', `For the niche "${G}" find 15 keywords with high search volume and low competition. For each, give the top-ranking title pattern and a gap the current videos miss. Audience: ${A}.`, 'Keyword, volume score, competition score, title angle'],
      ]},
      { title: 'Build the production pipeline', tasks: [
        ['claude', 'Write the first script', `Write an 8-minute faceless YouTube script about the strongest outlier topic from my research. Audience: ${A}. Structure: 15-second cold-open hook, 3 acts with a twist at each act break, a call-back ending. Mark each line with [VISUAL: …] describing the shot in this style: ${V}. 1,100-1,250 words.`, 'Plain text with [VISUAL] cues, one per 2-3 sentences'],
        ['elevenlabs', 'Record the narration', 'Narrate the script in a calm, curious documentary voice, medium pace (150 wpm), slight warmth, no upward inflection at sentence ends. Insert 0.4s pauses at paragraph breaks.', 'MP3 44.1kHz, Stability 45, Similarity 75, Style 20'],
        ['higgsfield', 'Generate the b-roll shots', `For each [VISUAL] cue: cinematic shot, ${V}. Slow dolly-in, 24fps, shallow depth of field, subject centred on the lower third line. Negative: text, watermarks, distorted hands, extra limbs, logos.`, '16:9, 5s per shot, 1080p'],
      ]},
      { title: 'Edit, package and publish', tasks: [
        ['capcut', 'Cut episode one', 'Lay narration first, place b-roll on each cue, add 2% slow zoom to stills, auto-captions in a clean sans at 70% width, duck music to -22 LUFS under voice.', '1080p 16:9, -14 LUFS integrated'],
        ['midjourney', 'Design the thumbnail', `YouTube thumbnail, one bold subject with a strong emotional expression, high contrast, ${V}, large negative space on the right for 3 words of text --ar 16:9 --style raw --v 7`, '1280x720, 3 variations'],
        ['youtube', 'Publish and schedule', 'Upload with the keyword-led title, first 2 lines of description repeat the hook, 3 chapters, pinned comment with a question. Schedule for your audience’s peak hour.', 'Twice weekly cadence'],
      ]},
      { title: 'Repurpose into Shorts', tasks: [
        ['opusclip', 'Cut 3 Shorts per episode', 'Clip the 3 strongest 30-45s moments with a hook in the first 2 seconds. Auto-reframe, animated captions, brand colour on keywords.', '9:16, 1080x1920'],
      ]},
    ],
    recipes: [['claude', 'higgsfield', 'Copy each [VISUAL] cue from the script into a separate Higgsfield prompt, prefixed with the visual direction.'], ['vidiq', 'claude', 'Paste the keyword table into Claude and ask for 10 titles per keyword, then pick the script topic.'], ['claude', 'elevenlabs', 'Strip the [VISUAL] cues and paste the clean narration into ElevenLabs.']],
  },
  tiktok: {
    approach: 'Lock one character sheet first, then produce short episodes from a fixed shot list so the character stays consistent. Post daily for two weeks to learn what the audience reacts to.',
    visual: 'soft 3D clay animation, rounded shapes, pastel palette with one saturated accent, studio softbox lighting',
    milestones: [
      { title: 'Design the character', tasks: [
        ['openart', 'Create a character reference sheet', `Character reference sheet: front, side, back and 3/4 views plus 6 expressions, ${V}, plain light grey background, consistent proportions, labelled views. Audience: ${A}.`, '16:9 sheet, 4 variations, train a character model from the best'],
        ['chatgpt', 'Write the series bible', `Write a series bible for an animated TikTok series: "${G}". Character personality in 5 traits, voice, catchphrase, world rules, 10 episode premises each with a 2-second hook. Each episode is 20-35 seconds.`, 'Markdown, under 900 words'],
      ]},
      { title: 'Produce the first five episodes', tasks: [
        ['artflow', 'Storyboard and animate episode 1', `Using the trained character, 5 shots: hook close-up, setup wide, gag medium, reaction close-up, button wide. ${V}. Keep outfit and colours identical across shots.`, '9:16, 4s per shot'],
        ['higgsfield', 'Add camera motion to key shots', `Image-to-video on the hook and gag shots: quick push-in on the hook, whip-pan into the gag. ${V}. Negative: morphing face, colour shift, extra limbs.`, '9:16, 3-4s, 1080p'],
        ['elevenlabs', 'Voice the character', 'Design a voice: bright, slightly raspy, fast comic timing. Generate all lines from episode 1 with a 0.2s tail.', 'WAV 48kHz per line'],
      ]},
      { title: 'Cut, caption and post', tasks: [
        ['capcut', 'Edit with captions and sound', 'Cut to beat, captions in a rounded bold font, pop SFX on every gag, trending sound at -18dB under dialogue.', '9:16, 1080x1920, under 35s'],
      ]},
    ],
    recipes: [['openart', 'artflow', 'Export the character model or reference sheet and upload it as the character in ArtFlow so every shot uses the same design.'], ['chatgpt', 'artflow', 'Paste each episode premise as the scene description, one shot per line.']],
  },
  saas: {
    approach: 'Validate the problem with a waitlist before building, build the smallest version that delivers the core outcome, then charge from day one. Keep the stack boring: one builder, one database, one payment provider.',
    visual: '',
    milestones: [
      { title: 'Validate the problem', tasks: [
        ['perplexity', 'Map competitors and pricing', `List every product that solves "${G}" for ${A}. For each: pricing, main complaint in reviews, and what they ignore. Cite sources.`, 'Table with citations'],
        ['tally', 'Launch a waitlist with one qualifying question', 'Waitlist form: email, “How do you solve this today?”, “What would you pay monthly?” (ranges). Thank-you page asks for one intro.', 'Embed on a one-page site'],
      ]},
      { title: 'Build the MVP', tasks: [
        ['claude', 'Write the product spec', `Write an MVP spec for "${G}". One core job, 3 screens max, data model as tables with columns, auth needs, and acceptance criteria for each screen. Cut anything not needed to deliver the core outcome in week one.`, 'Markdown spec, under 1,000 words'],
        ['lovable', 'Generate the app from the spec', 'Build a React + Supabase app from the attached spec. Email and Google sign-in, row-level security on every table keyed to the user id, responsive layout, empty states that tell the user what to do next.', 'Connected to Supabase, deployed preview'],
        ['supabase', 'Lock down the database', 'Enable RLS on all tables. Policies: users read and write only rows where user_id = auth.uid(). Add indexes on foreign keys. Turn on daily backups.', 'Migration SQL checked into the repo'],
      ]},
      { title: 'Charge and measure', tasks: [
        ['lemon-squeezy', 'Add payments', 'One product, monthly and annual plans, 7-day trial. Webhook to set a “plan” column on the user’s profile.', 'Test mode first'],
        ['posthog', 'Track the activation event', 'Track sign-up, first core action, and day-7 return. Build a funnel and a retention chart.', 'Dashboard with 3 insights'],
      ]},
    ],
    recipes: [['claude', 'lovable', 'Paste the full spec as the first Lovable message; send changes one screen at a time.'], ['lovable', 'supabase', 'Use Lovable’s Supabase integration, then review generated policies in the Supabase dashboard.']],
  },
  game: {
    approach: 'Prototype the core loop with grey boxes in a week, playtest with five people, then add art and polish only to what proved fun. Publish small and update weekly.',
    visual: 'stylised low-poly, chunky silhouettes, saturated toy-like colours, soft rim light',
    milestones: [
      { title: 'Prototype the core loop', tasks: [
        ['claude', 'Design the loop and systems', `Game: "${G}". Write a one-page design: core loop in one sentence, 3 player verbs, win and fail states, progression, and a list of scripts needed with their responsibilities. Target: ${A}.`, 'Markdown, under 700 words'],
        ['roblox-studio', 'Grey-box the first level', 'Build the play space with primitive parts only, spawn, one objective, one hazard. Script the loop end to end before any art.', 'Playable in Studio test mode'],
      ]},
      { title: 'Art and feel', tasks: [
        ['meshy', 'Generate hero props', `Game-ready prop: ${V}, under 5k triangles, PBR textures, clean quads, centred pivot.`, 'FBX + 1024px textures'],
        ['suno', 'Make the lobby and gameplay music', 'Upbeat chiptune-meets-synthpop loop, 120 bpm, no vocals, seamless loop point at 60 seconds.', '2 tracks, loopable'],
      ]},
      { title: 'Publish and iterate', tasks: [
        ['canva', 'Make the game icon and thumbnails', `Game icon: one character or object, bold silhouette, ${V}, readable at 64px.`, '512x512 icon, 1920x1080 thumbnails'],
      ]},
    ],
    recipes: [['meshy', 'roblox-studio', 'Export FBX from Meshy and import via the 3D Importer; set collision fidelity to Box for props.']],
  },
  newsletter: {
    approach: 'Promise one specific outcome per issue, build a repeatable research-to-draft pipeline, and grow through one channel you can sustain weekly.',
    visual: 'editorial illustration, flat shapes, two-colour palette, generous negative space',
    milestones: [
      { title: 'Position and format', tasks: [
        ['perplexity', 'Map the space', `Find 10 newsletters about "${G}". For each: audience size if public, issue format, cadence and what readers praise. Cite sources.`, 'Table'],
        ['claude', 'Define the issue template', `Design a repeatable issue format for ${A}: hook, one main idea, 3 links with a one-line take each, one action to try. Write issue #1 in this format.`, '600-800 words'],
      ]},
      { title: 'Grow', tasks: [
        ['notion-ai', 'Build the content calendar', 'Database: issue, topic, sources, status, publish date. Views by week and by status.', '12 weeks planned'],
        ['canva', 'Make share graphics per issue', `Quote card template, ${V}, square and vertical versions.`, '1080x1080, 1080x1920'],
      ]},
    ],
    recipes: [['perplexity', 'claude', 'Paste cited findings into Claude and ask for the issue draft that keeps the links.']],
  },
  resell: {
    approach: 'Treat each opportunity as a scored card: expected sale price minus cost, shipping and time. Act only on cards above your threshold. Never auto-buy.',
    visual: '',
    milestones: [
      { title: 'Set your numbers', tasks: [
        ['chatgpt', 'Build your deal scorecard', `Create a scoring sheet for "${G}": cost, pickup time, repair time, expected sale price, platform fees, shipping, margin, profit per hour. Flag deals under 30% margin.`, 'Table with formulas described'],
        ['perplexity', 'Research sold prices', 'Find recent sold prices for the 10 items I resell most, by condition, in my area and nationally. Cite sources.', 'Table'],
      ]},
      { title: 'Sell', tasks: [
        ['canva', 'Listing photo template', 'Clean listing template: item centred on a neutral background, measurement overlay, condition badge.', '1:1 and 4:5'],
        ['manychat', 'Auto-reply to buyer questions', 'Answer “is this available”, dimensions, pickup times and price firmness from a product card; hand off to you for offers.', 'Instagram DM flow'],
      ]},
    ],
    recipes: [['perplexity', 'chatgpt', 'Paste sold-price research into the scorecard to set expected sale price.']],
  },
  general: {
    approach: 'Break the goal into a research step, a first deliverable you can ship this week, and a feedback loop. Keep the stack small so you learn the tools instead of collecting them.',
    visual: '',
    milestones: [
      { title: 'Understand the landscape', tasks: [
        ['perplexity', 'Research how others do it', `How are people achieving "${G}" today? Give 5 approaches with cost, time to first result and common failure points. Cite sources.`, 'Table'],
        ['claude', 'Turn research into a plan', `Using the research, write a 4-week plan for "${G}" for someone who is ${A}. Each week: one deliverable, the tasks, and how I'll know it worked.`, 'Markdown'],
      ]},
      { title: 'Ship the first result', tasks: [
        ['notion-ai', 'Set up your tracker', 'Database of tasks with status, week, and notes. A weekly review template with “what moved” and “what blocked”.', 'Two views'],
      ]},
    ],
    recipes: [['perplexity', 'claude', 'Paste the cited table into Claude as context for the plan.']],
  },
};

function answerFor(intake: IntakeItem[], re: RegExp) {
  return intake.find(i => re.test(i.q.toLowerCase()) && i.a.trim())?.a.trim();
}

export function offlinePlan(goal: string, intake: IntakeItem[]) {
  const kind = detectKind(goal);
  const t = TEMPLATES[kind];
  const audience = answerFor(intake, /who|audience|for\?/) || 'a general audience';
  const look = answerFor(intake, /look|feel|aesthetic|style/);
  const visual = t.visual ? (look ? `${look}; ${t.visual}` : t.visual) : '';
  const budget = (answerFor(intake, /budget/) || '').toLowerCase();
  const freeOnly = /free|0|zero|none|no budget/.test(budget);

  const fill = (s: string) => s.replaceAll(V, visual).replaceAll(G, goal).replaceAll(A, audience);
  const swapPaid = (slug: string) => {
    if (!freeOnly) return slug;
    const tool = toolBySlug(slug)!;
    if (tool.access !== 'Paid') return slug;
    const alt = TOOLS.find(x => x.category === tool.category && x.access !== 'Paid');
    return alt ? alt.slug : slug;
  };

  const milestones = t.milestones.map((m, i) => ({
    title: m.title, targetWeek: i + 1,
    tasks: m.tasks.map(([tool, title, prompt, params]) => ({ tool: swapPaid(tool), title, prompt: fill(prompt), params, why: '' })),
  }));
  const slugs = [...new Set(milestones.flatMap(m => m.tasks.map(x => x.tool)))];
  return {
    approach: t.approach + (freeOnly ? ' Paid tools were swapped for free or freemium ones in the same category.' : ''),
    visualDirection: visual,
    stack: slugs.map(slug => ({ slug, why: toolBySlug(slug)!.description })),
    milestones,
    recipes: t.recipes.map(([from, to, handoff]) => ({ from: swapPaid(from), to: swapPaid(to), handoff })),
  };
}

export function offlineRegenerate(task: PlanTask, instruction: string, visual?: string): TaskVersion {
  const i = instruction.trim();
  let prompt = task.prompt;
  if (/short|concise|tighter/i.test(i)) { const parts = prompt.split(/(?<=\.)\s+/); prompt = parts.slice(0, Math.max(1, Math.ceil(parts.length / 2))).join(' '); }
  else prompt = `${prompt}\n\nAdjustment: ${i}.${visual && !prompt.includes(visual) ? ` Keep the visual direction: ${visual}.` : ''}`;
  return { title: task.title, prompt, params: task.params, at: new Date().toISOString(), note: i };
}

export function offlineRecalibrate(project: Project, checkin: Checkin): { response: string; milestones: Milestone[] } {
  const bp = project.blueprint!;
  const blocked = checkin.blockers.trim().length > 0;
  const remaining = bp.milestones.filter(m => m.status !== 'done').map(m => ({
    ...m,
    targetWeek: m.targetWeek + (blocked ? 1 : 0),
    tasks: m.tasks.filter(t => t.status !== 'done'),
  })).filter(m => m.tasks.length);
  if (blocked && remaining[0]) {
    remaining[0] = {
      ...remaining[0],
      tasks: [{ id: uid(), title: 'Unblock: ' + checkin.blockers.slice(0, 60), tool: 'claude', status: 'todo', why: 'Address this week’s blocker first',
        prompt: `I'm working on "${project.goal}". I'm blocked by: "${checkin.blockers}". Give me three concrete ways around this, the fastest first, each with the exact next action I can take in under 30 minutes.`, params: 'Numbered list' }, ...remaining[0].tasks],
    };
  }
  const response = blocked
    ? `Remaining milestones moved back one week so the blocker gets real time. A first task was added to work through it before anything else. Next up: ${remaining[0]?.tasks[1]?.title || remaining[0]?.tasks[0]?.title || 'review the plan'}.`
    : `Good week. Dates hold. Next up: ${remaining[0]?.tasks[0]?.title || 'all milestones are done — set a new goal'}.`;
  return { response: response + ' (Offline recalibration: add an API key in Settings for a tailored review.)', milestones: remaining };
}
