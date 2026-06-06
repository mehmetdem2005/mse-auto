# Deployment

Three platforms. **Frontend → Vercel**, **Backend/worker → Render**, **Database + Auth → Supabase.**

> ⚠️ **Secrets never live in git.** Every key below is set in the platform dashboard (or via
> the platform API), or in a local `.env` that is gitignored. `render.yaml` uses `sync: false`
> so values are entered in Render, not committed. See `.env.example` for the full list.

---

## 1. Supabase (database + auth)

1. Create a project at https://supabase.com (region close to you).
2. Run the migrations in order (`supabase/migrations/0001…0011`):
   ```bash
   supabase link --project-ref <PROJECT_REF>     # uses your Supabase access token
   supabase db push
   ```
   (or paste each migration into the SQL editor). Enable the `vector` extension first.
3. From **Project Settings → API**, copy these into the other platforms:
   | Value                         | Env var                     | Used by        |
   |-------------------------------|-----------------------------|----------------|
   | Project URL                   | `SUPABASE_URL`              | web + worker   |
   | `anon` public key             | `SUPABASE_ANON_KEY`         | web            |
   | `service_role` secret key     | `SUPABASE_SERVICE_ROLE_KEY` | worker + web server (never the browser) |

`EMBED_DIM` (default 768) **must** match the `vector(N)` dimension in the migrations.

## 2. Render (worker — needs ffmpeg, so Docker)

`render.yaml` (repo root) is a Blueprint. In Render: **New → Blueprint**, connect this GitHub
repo, and it builds `apps/worker/Dockerfile`. Default `CMD` is `serve` (HTTP `POST /tick` +
`/health`); switch to a Background Worker in `loop` mode if you prefer always-on.

Set these env vars in Render (all `sync: false` in the blueprint):

| Env var | Source |
|---|---|
| `GEMINI_API_KEY` | Gemini (AI Studio) key |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | from Supabase step 1 |
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` | Google Cloud OAuth (see `HANDOFF.md §5`) |
| `WORKER_TOKEN` | a long random string; also set the same value in the cron caller |
| `ALERT_WEBHOOK_URL` | optional Slack/Discord/Telegram webhook |

To trigger ticks, point Supabase `pg_cron`+`pg_net` (migration `0003`) or any cron at
`POST https://<render-service>/tick` with header `x-worker-token: <WORKER_TOKEN>`.

## 3. Vercel (web panel)

`vercel.json` (repo root) builds `@studio/core` then `@studio/web` and serves `apps/web/.next`.
In Vercel: **Add New → Project**, import this repo, keep root directory at the repo root
(the `buildCommand` handles the monorepo). Set env vars in **Project → Settings → Environment Variables**:

| Env var | Notes |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | from Supabase step 1 |
| `GEMINI_API_KEY` | for server-side API routes |
| `APP_PASSWORD` | the single-user login password |
| `SESSION_SECRET` | long random string, **different** from `APP_PASSWORD` (signs the login cookie) |
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` | for the in-app "Connect YouTube" flow |

In Google Cloud Console the OAuth **Authorized redirect URI** must be exactly:
`https://<your-vercel-domain>/api/youtube/callback`.

## Notes on the keys you supplied
- **Gemini** → `GEMINI_API_KEY` (the only AI provider this codebase uses).
- **Supabase / Render / Vercel / GitHub** tokens are *platform* tokens (CLI/API/repo
  connection), not application env vars.
- **`GITHUB_TOKEN`** (+ `GITHUB_OWNER`/`GITHUB_REPO`) only powers the opt-in self-improvement
  feature and stays off (`SELF_IMPROVE_ENABLED=off`) by default.
- **OpenAI, Deepseek, Expo** keys are **not referenced anywhere** in this codebase — nothing
  here consumes them.
