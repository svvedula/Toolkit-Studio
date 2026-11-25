export type Status = 'todo' | 'doing' | 'done';

export interface TaskVersion { title: string; prompt: string; params?: string; at: string; note?: string }

export interface PlanTask {
  id: string;
  title: string;
  tool: string;          // catalog slug
  status: Status;
  why?: string;
  prompt: string;        // copy-ready, tool-specific
  params?: string;       // output parameters (aspect ratio, length, format…)
  paid?: boolean;        // needs a paid tier
  history?: TaskVersion[];
  /** pending regeneration, shown as a diff until accepted or reverted */
  proposal?: TaskVersion;
}

export interface Milestone {
  id: string;
  title: string;
  targetWeek: number;
  status: Status;
  tasks: PlanTask[];
}

export interface Recipe { from: string; to: string; handoff: string }

export interface Blueprint {
  version: 1;
  approach: string;
  visualDirection?: string;
  stack: { slug: string; why: string }[];
  milestones: Milestone[];
  recipes: Recipe[];
  source: 'ai' | 'offline';
}

export interface IntakeItem { q: string; a: string }

export interface Checkin {
  id: string;
  weekOf: string;
  progress: string;
  blockers: string;
  response?: string;
  at: string;
}

export interface Project {
  id: string;
  title: string;
  goal: string;
  kind: string;
  createdAt: string;
  intake: IntakeItem[];
  blueprint?: Blueprint;
  checkins: Checkin[];
}

export interface Settings {
  model: string;
  heroScene: string; // optional Spline scene URL
  askFirst: boolean;
}

export interface AppData {
  projects: Project[];
  saved: { type: 'tool' | 'project' | 'prompt'; id: string; label?: string; text?: string }[];
  settings: Settings;
}
