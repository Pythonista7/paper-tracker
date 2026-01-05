# Paper Tracker

A lightweight Cloudflare-ready reading workspace for research papers. Track PDFs from URLs (arXiv, journals, etc.), keep progress states, and write contextual Markdown notes beside an embedded viewer.

## Stack

- **Cloudflare Pages + Functions** (via Wrangler) for the API edge layer.
- **Cloudflare D1** for structured storage (papers, notes, sessions, share tokens).
- **Cloudflare KV** for cached metadata lookups.
- **React + Vite** SPA deployed to Pages for the UI.
- **Hono + Zod** powering the API routes, with a minimal repository layer for D1.

## Getting started

### Prerequisites

- Node.js 18+
- Wrangler CLI authenticated with your Cloudflare account (`npx wrangler login`)

### Install dependencies

```bash
npm install
npm install --prefix frontend
```

### Configure Cloudflare services

1. Create a D1 database and KV namespace (one for dev, one for prod if needed):
   ```bash
   npx wrangler d1 create paper-tracker
   npx wrangler kv namespace create PAPER_CACHE
   ```
> Done
   ```
   To access your new D1 Database in your Worker, add the following snippet to your configuration file:
[[d1_databases]]
binding = "paper_tracker"
database_name = "paper-tracker"
database_id = "999533cd-1ad4-44d8-9072-1cebc01bba1a"
   ---
To access your new KV Namespace in your Worker, add the following snippet to your configuration file:
[[kv_namespaces]]
binding = "PAPER_CACHE"
id = "d767c72d4aaf4a8da5a24ad5c38aba20"
   ```

2. Update `wrangler.toml` with the generated `database_id` and `kv` IDs.
3. Apply the initial migration locally:
   ```bash
   npx wrangler d1 migrations apply paper-tracker --local
   ```
4. When ready for production, re-run the migration without `--local`.

### Local development

Build the frontend at least once so `frontend/dist` exists (needed for `wrangler pages dev`). Then run the API (Pages Functions) and UI in parallel:

```bash
npm run dev:api   # runs `wrangler pages dev` with the Functions + static assets
npm run dev:frontend  # starts Vite dev server with proxying /api -> wrangler
```

Vite proxies `/api` calls to the Pages dev server on 127.0.0.1:8788 (configured in `frontend/vite.config.ts`).

### Frontend routes

- `/dashboard` &mdash; Kanban-style overview grouped by status with search/filter, add-paper modal, and reading pulse cards.
- `/read/:paperId` &mdash; Standard reader with PDF on the left and read-only Markdown notes.
- `/focus/:paperId` &mdash; Full-screen split view (PDF + editor) for capturing notes.

Use the top navigation or a board card to jump between these views.

### Deploying

1. Build the frontend: `npm run build:frontend`.
2. Deploy through Cloudflare Pages:
   ```bash
   npm run deploy
   ```
   This uses the settings inside `wrangler.toml` (`pages_build_output_dir` points to `frontend/dist`).

## Key directories

- `functions/api` – Hono handlers, validation, and repository helpers.
- `migrations` – D1 schema migrations.
- `frontend` – React SPA with the reading workspace UI.

## Next steps

- Hook up DOI/arXiv metadata ingestion and richer caching.
- Add authentication (Cloudflare Access) for private authoring.
- Implement sharing routes + public reader mode.
- Extend the dashboard with streaks, timers, and topic views.
