# Toolkit Studio

One prompt. Infinite tools. A desktop app that turns a goal into a focused tool stack, a week-by-week plan, and a copy-ready prompt for every step.

## Run it (Windows)

You need Node.js 20 or newer (`node -v` to check).

```powershell
cd $HOME\Documents\toolkit-studio
npm install
npm run dev        # opens the desktop app with hot reload
```

Build the installer:

```powershell
npm run dist:win   # creates release\Toolkit Studio Setup 0.1.0.exe
```

Then open **Settings** in the app and paste an Anthropic API key. Without a key everything still works using offline templates, and plans are labelled as drafts.

## What's in v0.1

| Area | Status |
|---|---|
| Discover: goal, intake questions, streamed plan, tool orbit that pulls the chosen stack into the centre | Done |
| Projects: starter goals, intake, plan by week or by tool, task status | Done |
| Redo one task: rewrite, word-level diff, accept or keep original | Done |
| Weekly check-in: logs progress and blockers, moves dates, rewrites remaining tasks | Done |
| Explore: 82 tools, 15 categories, pricing and experience filters, search | Done |
| Tool page: live embed check (reads X-Frame-Options / frame-ancestors), falls back to a side window that keeps sign-ins | Done |
| Library: saved tools and projects | Done |
| Optional Spline hero scene (Settings) | Done |
| Local persistence (JSON in the app's data folder), API key encrypted with the OS keychain | Done |
| Cloud sync, sign-in, public `/p/:id` blueprints, cloning | Schema ready in `supabase/`, not wired yet |
| Background research worker, opportunity cards, notifications | Schema ready; Electron `notify` IPC in place |
| Prompts, integrations, models, community, submit, admin pages | Not started |

## Stack and why

- **Electron + Vite + React + TypeScript.** Electron instead of Tauri so you don't need Rust or the MSVC toolchain on Windows. The brief's Next.js was swapped for a Vite SPA because a desktop app loads from `file://`, where Next server actions don't run. AI calls run in the Electron main process instead, so the key never reaches the UI.
- **No CSS framework.** One hand-written design system in `src/styles/app.css` (clay "studio lightbox" look). Fonts come from `@fontsource`, so they work offline.
- **Catalog as data.** `src/data/catalog.ts` is the single source; `npm run seed:sql` regenerates `supabase/seed.sql` from it.
- **One orchestrator.** `src/lib/orchestrator.ts` holds every prompt and AI job (intake, plan, single-task regeneration, check-in recalibration). `src/lib/offline.ts` is the no-key fallback.

## Layout

```
electron/main.cjs      window, store, encrypted key, AI streaming, embed check, tool windows
electron/preload.cjs   the only bridge the UI can use
src/data/catalog.ts    82 tools, 15 categories, starter goals
src/lib/               orchestrator, offline planner, store, router, types
src/components/        Constellation (canvas orbit), Plan, Shell, Spline hero, UI bits
src/pages/             Discover, Projects, ProjectDetail, Explore, ToolDetail, Library, Settings
supabase/              migration with row-level security + generated seed
```

## Guardrails built in

- External links open in the system browser; tool windows run sandboxed with one sign-in partition per site.
- The main process refuses non-https and private-network URLs (no SSRF into your LAN).
- The planner is told never to plan autonomous purchases or scraping of login-gated sites.

## Known gaps

- Four tool URLs are inferred and flagged in the app: Viblo, Miqla, Emergent, Runable.
- `npm install` was not run during authoring (no package network access); the UI was bundled and tested in a browser, and the Electron files were syntax-checked. If a dependency version fails to resolve, bump it to the latest major.
