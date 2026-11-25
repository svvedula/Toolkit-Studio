// The verified catalog: 82 tools across 15 categories.
// This is data, not code. It ships with the app for offline use and is mirrored
// into Postgres by `npm run seed:sql` (see supabase/migrations).

export type AccessTier = 'Free' | 'Freemium' | 'Paid' | 'Open source';
export type SkillTier = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Category { id: string; name: string; hue: string; }
export interface Tool {
  slug: string;
  name: string;
  category: string;
  access: AccessTier;
  skill: SkillTier;
  url: string;
  tags: string[];
  description: string;
  /** best guess; the desktop app re-checks headers before framing */
  embeddable: boolean;
  /** URL inferred, not confirmed against the vendor's site */
  urlUnverified?: boolean;
}

export const CATEGORIES: Category[] = [
  { id: 'models', name: 'AI models', hue: '#7C6CF2' },
  { id: 'assistants', name: 'AI assistants', hue: '#4E7BF6' },
  { id: 'video', name: 'Video generation', hue: '#F25C8A' },
  { id: 'image', name: 'Image generation', hue: '#FF8A3D' },
  { id: 'clipping', name: 'Clipping & repurposing', hue: '#E8A93A' },
  { id: 'code', name: 'Web dev & coding', hue: '#2FA38B' },
  { id: 'sound', name: 'Sound & voice', hue: '#B05CE0' },
  { id: 'social', name: 'Content & social', hue: '#E8504A' },
  { id: 'research', name: 'Research & knowledge', hue: '#3BA7D9' },
  { id: 'productivity', name: 'Productivity', hue: '#6E8A5A' },
  { id: 'design', name: 'Design & creative', hue: '#E06CC0' },
  { id: 'business', name: 'Business & marketing', hue: '#C98A2E' },
  { id: 'automation', name: 'Automation & connectors', hue: '#5867C8' },
  { id: 'game', name: 'Game dev & 3D', hue: '#3EB55F' },
  { id: 'streaming', name: 'Streaming & entertainment', hue: '#8F7A6A' },
];

type Row = [name: string, access: AccessTier, skill: SkillTier, url: string, tags: string, description: string, embeddable?: boolean, unverified?: boolean];

const RAW: Record<string, Row[]> = {
  models: [
    ['AshnaAI', 'Freemium', 'Beginner', 'https://ashna.ai', 'chat,multi-model,writing', 'Multi-model AI workspace offering access to multiple foundation models in a single interface.'],
    ['Genspark', 'Freemium', 'Beginner', 'https://www.genspark.ai', 'agents,slides,sheets,docs,research,media', 'AI workspace with 70+ frontier models, autonomous agents, slides, sheets, docs and media generation.'],
    ['OpenRouter', 'Freemium', 'Advanced', 'https://openrouter.ai', 'api,llm,routing,developer', 'Unified developer API for routing requests across dozens of open and proprietary LLMs.'],
    ['Hugging Face', 'Freemium', 'Advanced', 'https://huggingface.co', 'open-source,models,datasets,spaces,ml', 'Central open-source hub for machine learning models, datasets and hosted Spaces.'],
    ['Replicate', 'Paid', 'Advanced', 'https://replicate.com', 'api,fine-tune,inference,open-source', 'Cloud API to run and fine-tune open-source AI models at production scale.'],
  ],
  assistants: [
    ['ChatGPT', 'Freemium', 'Beginner', 'https://chatgpt.com', 'writing,reasoning,coding,brainstorm,scripts,keywords', 'OpenAI’s conversational assistant for reasoning, writing, coding and brainstorming.'],
    ['Claude', 'Freemium', 'Beginner', 'https://claude.ai', 'writing,reasoning,coding,code-review,mcp,scripts,analysis', 'Anthropic’s assistant for deep writing, analysis, code review and MCP-connected work.'],
    ['Gemini', 'Freemium', 'Beginner', 'https://gemini.google.com', 'multimodal,google-workspace,search,writing', 'Google’s multimodal assistant, integrated with Workspace and Search.'],
  ],
  video: [
    ['Higgsfield', 'Freemium', 'Intermediate', 'https://higgsfield.ai', 'video,cinematic,camera,viral,shorts,animation', 'Cinematic AI video engine with granular camera angle and movement controls.'],
    ['Runway', 'Freemium', 'Intermediate', 'https://runwayml.com', 'video,editing,motion-brush,generative', 'Generative video suite with motion brushes and editing tools.'],
    ['Luma', 'Freemium', 'Intermediate', 'https://lumalabs.ai', 'video,image-to-video,3d,capture', 'High-fidelity text-to-video and image-to-video generation, plus 3D capture.'],
    ['Pika', 'Freemium', 'Beginner', 'https://pika.art', 'video,effects,shorts,fun', 'Expressive text-to-video with physical effects like inflate, melt and crush.'],
    ['ArtFlow', 'Freemium', 'Beginner', 'https://app.artflow.ai', 'animation,characters,story,comics,consistent-characters', 'Storytelling studio for consistent characters across animated scenes and graphic novels.'],
    ['HeyGen', 'Freemium', 'Beginner', 'https://www.heygen.com', 'avatar,voice-clone,translation,talking-head,faceless', 'Photorealistic talking avatars, voice cloning and multilingual video translation.'],
    ['Synthesia', 'Freemium', 'Beginner', 'https://www.synthesia.io', 'avatar,training,presentations,enterprise', 'Avatar video studio for presentations and training content.'],
  ],
  image: [
    ['OpenArt', 'Freemium', 'Beginner', 'https://openart.ai', 'image,characters,storyboard,style,consistent-characters', 'Image and video studio for character sheets, style training and storyboards.'],
    ['Midjourney', 'Paid', 'Intermediate', 'https://www.midjourney.com', 'image,art,photoreal,thumbnails,aesthetic', 'Artistic image engine known for aesthetic depth and photorealism.'],
    ['Flux', 'Freemium', 'Intermediate', 'https://bfl.ai', 'image,open-weights,detail', 'High-detail open-weights image models from Black Forest Labs.'],
    ['Leonardo.Ai', 'Freemium', 'Beginner', 'https://leonardo.ai', 'image,inpainting,assets,game-assets,thumbnails', 'Image suite with fine-tuned models, canvas inpainting and asset creation.'],
    ['Krea', 'Freemium', 'Beginner', 'https://www.krea.ai', 'image,real-time,upscale,enhance', 'Real-time canvas generation, AI upscaling and video enhancement.'],
    ['ComfyUI', 'Open source', 'Advanced', 'https://www.comfy.org', 'image,local,nodes,stable-diffusion,flux,pipeline', 'Node-based desktop pipeline for local Stable Diffusion and Flux workflows.'],
    ['fal', 'Paid', 'Advanced', 'https://fal.ai', 'api,inference,image,video,audio,developer', 'Low-latency cloud inference for generative image, video and audio.'],
  ],
  clipping: [
    ['Viblo', 'Freemium', 'Beginner', 'https://viblo.ai', 'clips,captions,shorts,tiktok,reels,repurpose', 'Turns long footage into captioned short clips for TikTok and Reels.', false, true],
    ['Miqla', 'Freemium', 'Beginner', 'https://miqla.com', 'clips,podcast,streams,viral,repurpose', 'Finds the most viral moments in long podcasts and streams.', false, true],
    ['OpusClip', 'Freemium', 'Beginner', 'https://www.opus.pro', 'clips,hooks,reframe,captions,shorts,repurpose', 'Extracts hooks, auto-frames faces and adds dynamic subtitles.'],
  ],
  code: [
    ['Lovable', 'Freemium', 'Beginner', 'https://lovable.dev', 'web-app,saas,react,no-code,full-stack', 'Builds production React apps through chat.'],
    ['Bolt', 'Freemium', 'Beginner', 'https://bolt.new', 'web-app,full-stack,deploy,browser-ide', 'In-browser environment that scaffolds, runs and deploys web apps.'],
    ['Emergent', 'Freemium', 'Intermediate', 'https://emergent.sh', 'agents,software,full-stack,saas', 'Agent-driven platform for architecting and building software.', false, true],
    ['Freebuff', 'Free', 'Intermediate', 'https://freebuff.com', 'coding-agent,cli,free,codebase', 'Free, ad-supported coding agent that edits and runs code in your project.'],
    ['Runable', 'Freemium', 'Beginner', 'https://runable.com', 'agent,web-app,hosting,slides', 'General agent that plans, builds and hosts websites and apps from a prompt.', false, true],
    ['v0', 'Freemium', 'Intermediate', 'https://v0.app', 'ui,react,tailwind,components,landing-page', 'Generative frontend UI from Vercel: React and Tailwind components.'],
    ['Replit', 'Freemium', 'Intermediate', 'https://replit.com', 'ide,agent,multiplayer,deploy,full-stack', 'Cloud IDE with multiplayer editing and an autonomous agent.'],
    ['Supabase', 'Freemium', 'Intermediate', 'https://supabase.com', 'database,auth,postgres,storage,backend,saas', 'Postgres database, auth, real-time sync and storage as a service.'],
    ['Vercel', 'Freemium', 'Intermediate', 'https://vercel.com', 'deploy,hosting,serverless,edge,nextjs', 'Deployment platform for modern frontend frameworks.'],
    ['Roblox Studio', 'Free', 'Intermediate', 'https://create.roblox.com', 'game,luau,3d,roblox,publish', 'Game engine and editor for interactive 3D Roblox experiences in Luau.'],
    ['Cursor', 'Freemium', 'Intermediate', 'https://cursor.com', 'ide,code-editor,multi-file,ai-coding', 'AI code editor with codebase indexing and multi-file edits.'],
    ['Windsurf', 'Freemium', 'Intermediate', 'https://windsurf.com', 'ide,agentic,ai-coding', 'Agentic IDE built for multi-step programming tasks.'],
    ['PostHog', 'Freemium', 'Intermediate', 'https://posthog.com', 'analytics,session-replay,feature-flags,saas', 'Product analytics, session replay, feature flags and heatmaps.'],
  ],
  sound: [
    ['ElevenLabs', 'Freemium', 'Beginner', 'https://elevenlabs.io', 'voice,voiceover,tts,clone,dubbing,sfx,faceless', 'Voice synthesis, cloning, sound effects and multilingual dubbing.'],
    ['Fish Audio', 'Freemium', 'Beginner', 'https://fish.audio', 'voice,tts,clone', 'Text-to-speech and low-latency voice cloning.'],
    ['Suno', 'Freemium', 'Beginner', 'https://suno.com', 'music,songs,vocals,soundtrack', 'Full songs with vocals and instruments from a text prompt.'],
    ['PlayHT', 'Freemium', 'Beginner', 'https://play.ht', 'voice,narration,podcast,tts', 'Conversational voices with natural pacing for narration and podcasts.'],
    ['Udio', 'Freemium', 'Beginner', 'https://www.udio.com', 'music,arrangement,lyrics,soundtrack', 'Music generation with complex arrangements and genre blending.'],
  ],
  social: [
    ['vidIQ', 'Freemium', 'Beginner', 'https://vidiq.com', 'youtube,seo,keywords,niche,titles,trends', 'YouTube SEO: niche trends, competitor analysis and title optimization.'],
    ['Submagic', 'Paid', 'Beginner', 'https://www.submagic.co', 'captions,b-roll,shorts,editing', 'Automated captions, B-roll, sound effects and jump cuts for shorts.'],
    ['YouTube', 'Free', 'Beginner', 'https://studio.youtube.com', 'youtube,publish,video,livestream', 'Video hosting, livestreaming and publishing.'],
    ['CapCut', 'Freemium', 'Beginner', 'https://www.capcut.com', 'editing,captions,green-screen,shorts', 'Video editor with auto-captions, green screen, speed ramps and effects.'],
    ['Captions', 'Freemium', 'Beginner', 'https://www.captions.ai', 'teleprompter,eye-contact,captions,mobile', 'Mobile video studio with teleprompter and caption animations.'],
    ['1of10', 'Paid', 'Intermediate', 'https://1of10.com', 'youtube,outliers,thumbnails,research,niche', 'Finds outlier YouTube videos and high-performing thumbnail concepts.'],
  ],
  research: [
    ['Perplexity', 'Freemium', 'Beginner', 'https://www.perplexity.ai', 'search,citations,research,trends', 'Answer engine with web search and citations.'],
    ['NotebookLM', 'Free', 'Beginner', 'https://notebooklm.google.com', 'notes,sources,audio-overview,research', 'Turns your sources into notes, outlines and audio discussions.'],
    ['Elicit', 'Freemium', 'Intermediate', 'https://elicit.com', 'academic,papers,research', 'Queries academic literature and extracts paper data.'],
    ['You.com', 'Freemium', 'Beginner', 'https://you.com', 'search,research,multi-model', 'Search assistant with research modes and model choice.'],
    ['Consensus', 'Freemium', 'Beginner', 'https://consensus.app', 'science,papers,evidence', 'Scientific search that summarizes evidence across research papers.'],
    ['scite', 'Paid', 'Advanced', 'https://scite.ai', 'citations,academic,evidence', 'Shows whether citations support or contrast a study’s findings.'],
  ],
  productivity: [
    ['Notion AI', 'Freemium', 'Beginner', 'https://www.notion.com', 'docs,database,notes,planning,content-calendar', 'Workspace with AI writing, databases and document synthesis.'],
    ['Motion', 'Paid', 'Beginner', 'https://www.usemotion.com', 'calendar,scheduling,tasks', 'Calendar that arranges tasks and meetings by priority.'],
    ['Sunsama', 'Paid', 'Beginner', 'https://www.sunsama.com', 'daily-planning,tasks', 'Daily planner focused on intentional pacing.'],
    ['Tally', 'Freemium', 'Beginner', 'https://tally.so', 'forms,surveys,payments,waitlist,leads', 'Form builder with conditional logic and payments.', true],
  ],
  design: [
    ['Canva', 'Freemium', 'Beginner', 'https://www.canva.com', 'design,thumbnails,social-graphics,templates', 'Drag-and-drop design with AI templates and background removal.'],
    ['Figma', 'Freemium', 'Intermediate', 'https://www.figma.com', 'ui,ux,wireframes,prototype', 'Collaborative UI design, wireframing and prototyping.'],
    ['Gamma', 'Freemium', 'Beginner', 'https://gamma.app', 'slides,docs,webpages,pitch-deck', 'Decks, docs and webpages generated from text prompts.'],
    ['Excalidraw', 'Open source', 'Beginner', 'https://excalidraw.com', 'whiteboard,diagram,architecture,sketch', 'Hand-drawn style whiteboard for diagrams and sketches.', true],
  ],
  business: [
    ['HubSpot', 'Freemium', 'Intermediate', 'https://www.hubspot.com', 'crm,marketing,sales,email', 'Marketing, sales pipeline, CRM and support suite.'],
    ['Manychat', 'Freemium', 'Beginner', 'https://manychat.com', 'dm-automation,instagram,tiktok,whatsapp,leads', 'Automates Instagram DMs, TikTok comments, WhatsApp and Messenger.'],
    ['Instantly', 'Paid', 'Intermediate', 'https://instantly.ai', 'cold-email,outreach,leads,deliverability', 'Cold email automation with inbox warm-up and lead lists.'],
    ['AdCreative.ai', 'Paid', 'Beginner', 'https://www.adcreative.ai', 'ads,banners,copy,conversion', 'Generates ad banners and copy tuned for conversion.'],
    ['Bland AI', 'Paid', 'Advanced', 'https://www.bland.ai', 'phone-agents,calls,voice', 'Autonomous phone agents for inbound and outbound calls.'],
    ['Lemon Squeezy', 'Paid', 'Intermediate', 'https://www.lemonsqueezy.com', 'payments,saas,digital-products,subscriptions,merchant-of-record', 'Merchant of record for SaaS licenses and digital products.'],
  ],
  automation: [
    ['Zapier', 'Freemium', 'Beginner', 'https://zapier.com', 'automation,no-code,integrations,workflows', 'No-code workflows linking thousands of apps.'],
    ['Zapier MCP', 'Freemium', 'Intermediate', 'https://zapier.com/mcp', 'mcp,agents,actions,automation', 'MCP server that lets AI assistants take actions in your apps.'],
    ['n8n', 'Open source', 'Advanced', 'https://n8n.io', 'automation,self-host,workflows,code', 'Self-hostable workflow automation with custom code steps.'],
    ['Make', 'Freemium', 'Intermediate', 'https://www.make.com', 'automation,visual,pipelines', 'Visual builder for multi-branch data pipelines.'],
    ['Composio', 'Freemium', 'Advanced', 'https://composio.dev', 'agents,auth,integrations,tools', 'Tool and auth layer giving agents access to 200+ apps.'],
    ['Typebot', 'Freemium', 'Intermediate', 'https://typebot.io', 'chatbot,leads,forms,webhooks', 'Conversational chatbot builder for lead capture.'],
  ],
  game: [
    ['Meshy', 'Freemium', 'Beginner', 'https://www.meshy.ai', '3d,mesh,textures,game-assets', 'Generates textured 3D meshes from text or photos.'],
    ['Tripo', 'Freemium', 'Beginner', 'https://www.tripo3d.ai', '3d,game-assets,fast', 'Rapid game-ready 3D model generation.'],
    ['Scenario', 'Freemium', 'Intermediate', 'https://www.scenario.com', 'game-assets,style-training,2d', 'Game asset engine trained on your own art style.'],
    ['Spline', 'Freemium', 'Intermediate', 'https://spline.design', '3d,web,interactive,animation,landing-page', 'Browser 3D modeling and animation with real-time web embeds.'],
  ],
  streaming: [
    ['JustWatch', 'Free', 'Beginner', 'https://www.justwatch.com', 'streaming,movies,tv,search', 'Finds where to legally stream, rent or buy films and shows.'],
    ['Plex', 'Freemium', 'Intermediate', 'https://www.plex.tv', 'media-server,streaming,live-tv', 'Personal media server plus free ad-supported channels.'],
    ['Tubi', 'Free', 'Beginner', 'https://tubitv.com', 'streaming,free,movies,tv', 'Free, legal, ad-supported movies and TV.'],
  ],
};

const slugify = (s: string) => s.toLowerCase().replace(/\.ai$/, '-ai').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const TOOLS: Tool[] = Object.entries(RAW).flatMap(([category, rows]) =>
  rows.map(([name, access, skill, url, tags, description, embeddable, unverified]) => ({
    slug: slugify(name), name, category, access, skill, url,
    tags: tags.split(','), description, embeddable: !!embeddable, urlUnverified: !!unverified,
  })),
);

export const toolBySlug = (slug: string) => TOOLS.find(t => t.slug === slug);
export const categoryById = (id: string) => CATEGORIES.find(c => c.id === id)!;

export const STARTER_GOALS = [
  { kind: 'youtube', title: 'Faceless YouTube channel', goal: 'Launch a faceless YouTube channel that posts two videos a week' },
  { kind: 'saas', title: 'Micro-SaaS', goal: 'Build and launch a small paid web app that solves one problem for a niche' },
  { kind: 'tiktok', title: 'Animated TikTok series', goal: 'Produce an animated TikTok series with a recurring character' },
  { kind: 'game', title: 'Indie game', goal: 'Make and publish a small game on Roblox' },
  { kind: 'newsletter', title: 'Newsletter', goal: 'Start a weekly newsletter and grow it to 1,000 subscribers' },
  { kind: 'resell', title: 'Reselling side business', goal: 'Start a local reselling side business for used furniture' },
];
