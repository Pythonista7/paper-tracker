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

1. Create a D1 database, KV namespaces, and R2 bucket:
   ```bash
   npx wrangler d1 create paper-tracker
   npx wrangler kv namespace create PAPER_CACHE
   npx wrangler kv namespace create AUTH_STORE
   npx wrangler kv namespace create RATE_LIMIT_STORE
   npx wrangler r2 bucket create paper-tracker-images
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

[[kv_namespaces]]
binding = "AUTH_STORE"
id = "cf7fcdfb78c84b92b830b16091ce2eba"

[[kv_namespaces]]
binding = "RATE_LIMIT_STORE"
id = "6de12a4e0e3343ea8d89e535de99eda7"
   ---
To access your new R2 Bucket in your Worker, add the following snippet to your configuration file:
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "paper-tracker-images"
   ```

2. Update `wrangler.toml` with the generated IDs for D1, KV namespaces, and R2 bucket.
3. Set up authentication by generating a password hash:
   ```bash
   node generate-password-hash.js your-secure-password
   ```
   Then add these environment variables to your Cloudflare Pages project settings:
   - `ADMIN_EMAIL`: Your admin email
   - `ADMIN_PASSWORD_HASH`: The generated hash from the script

4. Apply the initial migration locally:
   ```bash
   npx wrangler d1 migrations apply paper-tracker --local
   ```
5. When ready for production, re-run the migration without `--local`.

> **Note:** The R2 bucket is private by default (recommended). Images are uploaded via authenticated API endpoints and served through your Worker, providing full control over access and security.

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
- `/focus/:paperId` &mdash; Full-screen split view (PDF + editor) for capturing notes with rich markdown support.
- `/login` &mdash; Authentication page for accessing protected features.

Use the top navigation or a board card to jump between these views.

### Features

- **Rich Markdown Editor** with support for:
  - Headings, bold, italic, underline
  - Bullet lists and numbered lists
  - Code blocks with syntax highlighting (JavaScript, TypeScript, CSS, etc.)
  - Blockquotes
  - Links
  - **Image uploads** - Paste from clipboard or drag-and-drop images, automatically uploaded to R2
  - Autosave functionality
- **Authentication** - Protected upload endpoints and admin access
- **PDF Viewer** - Embedded PDF viewing with controls
- **Status Tracking** - Track papers through to-read, in-progress, needs-review, and done states

### Deploying

1. Build the frontend: `npm run build:frontend`.
2. Ensure all environment variables are set in your Cloudflare Pages project:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD_HASH`
3. Deploy through Cloudflare Pages:
   ```bash
   npm run deploy
   ```
   This uses the settings inside `wrangler.toml` (`pages_build_output_dir` points to `frontend/dist`).
4. Apply migrations to production database:
   ```bash
   npx wrangler d1 migrations apply paper-tracker
   ```

## Key directories

- `functions/api` – Hono handlers, validation, repository helpers, and authentication logic.
- `migrations` – D1 schema migrations.
- `frontend` – React SPA with the reading workspace UI.
  - `frontend/src/components/reader` – PDF viewer and markdown notes editor
  - `frontend/src/components/dashboard` – Kanban board and paper management
  - `frontend/src/contexts` – Authentication context

## Architecture

### Backend (Cloudflare Functions)
- **D1 Database** - Stores papers, notes, reading sessions, and share tokens
- **KV Stores**:
  - `PAPER_CACHE` - Caches metadata from arXiv and other sources
  - `AUTH_STORE` - Stores authentication sessions
  - `RATE_LIMIT_STORE` - Rate limiting for API endpoints
- **R2 Storage** - Stores uploaded images from markdown notes (private bucket with Worker proxy)

### Frontend (React + Vite)
- MDXEditor for rich markdown editing with image upload support
- React Query for data fetching and caching
- PDF.js integration for PDF viewing
- TailwindCSS for styling

## Security

- Authentication required for all write operations (papers, notes, image uploads)
- R2 bucket is private by default - images served through authenticated Worker endpoints
- Rate limiting on login attempts
- Sessions stored in secure KV namespace
- CORS configured for local development

## Next steps

- Hook up DOI/arXiv metadata ingestion and richer caching
- Implement sharing routes + public reader mode
- Extend the dashboard with streaks, timers, and topic views
- Add support for annotations and highlights in PDFs
