# Docs

A collaborative document editor built with Next.js and Postgres. Users create and edit rich-text documents, share them with others, and import plain text or Markdown files; identity is simulated via a header switcher while authorization is enforced on the server.

## Links

- Live app: https://document-fawn-one.vercel.app
- Source: https://github.com/ravail121/document

## Test accounts

There is no login form. The header exposes a "Viewing as" control that sets a `userId` cookie via `POST /api/session`. Simulated accounts are intentional for this assignment; every document and share route still derives the actor from the session cookie and checks ownership or share rows server-side.

| Name  | Email             | User id                                |
|-------|-------------------|----------------------------------------|
| Alice | alice@example.com | `11111111-1111-1111-1111-111111111111` |
| Bob   | bob@example.com   | `22222222-2222-2222-2222-222222222222` |

Sharing demo: as Alice, open a document, share it with Bob, switch to Bob in the header, and confirm it appears under "Shared with me".

## Features

- Create, rename, edit, and delete documents. Delete is owner-only.
- Dashboard separates "My documents" (owned) from "Shared with me" (via `document_shares`).
- TipTap editor toolbar: bold, italic, underline, H1, H2, bulleted list, numbered list.
- Autosave debounces 800ms after the last title or content change, PUTs `{ title, content, version }`, and updates the local version on success.
- Optimistic concurrency: if the stored version no longer matches, the API returns 409 and the editor shows a reload banner instead of overwriting.
- Upload `.txt` or `.md` files up to 1MB (extension-checked on the server). Parsing is in-memory only; `.md` supports a small subset (`#` / `##`, lists, `**bold**`, `*italic*`).
- Share and revoke access (owner only). Shared users can read and edit; they cannot re-share.
- Health check at `/api/health` verifies the database with `SELECT NOW()`.

## Run locally

Docker is the only prerequisite.

```bash
cp .env.example .env
docker compose up --build
```

- App: http://localhost:3000
- Health: `curl http://localhost:3000/api/health` → `{"ok":true,"db":true,"time":"..."}`

`docker-compose.yml` sets `DATABASE_URL=postgres://docs:docs@db:5432/docs` for the app service. Schema and seed scripts under `db/` run only when Postgres initializes an empty data directory. After changing files in `db/`, reset first:

```bash
docker compose down -v
docker compose up --build
```

## Tests

```bash
docker compose exec app npm test
```

(`npm test` runs `vitest run`.)

- `tests/permissions.test.ts` — owner / share / stranger / missing-document authorization with mocked queries
- `tests/parse.test.ts` — plain-text and Markdown → TipTap JSON conversion
- `tests/validation.test.ts` — title and content validation helpers

## Architecture

Presentation lives in `app/` pages and `components/`. HTTP handlers in `app/api/` call business logic in `lib/` (`session`, `permissions`, `validation`, `parse`) and SQL-only data access in `lib/queries.ts` via the `pg` pool in `lib/db.ts`. Postgres schema and seed data are in `db/`. Locally the stack runs under Docker Compose (Next.js + Postgres 16); production uses the same Next.js code on Vercel against hosted Postgres, switching only `DATABASE_URL` (and enabling SSL / `max: 1` when `NODE_ENV=production`).

```text
app/
  page.tsx                 Dashboard (owned + shared lists)
  documents/[id]/page.tsx  Editor page (authz + Editor)
  api/                     Route handlers (documents, shares, upload, session, users, health)
components/                Client UI (Editor, ShareDialog, Header, upload/create/delete)
lib/
  queries.ts               Parameterized SQL (only file that talks to Postgres)
  permissions.ts           canRead / canWrite / isOwner
  session.ts               Cookie-based simulated identity
  parse.ts                 Upload text/Markdown → TipTap JSON
  db.ts                    Pool singleton (serverless-aware in production)
db/
  01_schema.sql            Tables, indexes, self-share trigger
  02_seed.sql              Alice, Bob, welcome document
tests/                     Vitest unit tests
```

See `ARCHITECTURE.md` for the full reasoning.

## Environment variables

| Variable        | Required | Notes |
|-----------------|----------|-------|
| `DATABASE_URL`  | Yes      | Postgres connection string. Local Compose uses `postgres://docs:docs@db:5432/docs`. Production should use the Supabase transaction pooler URL. |
| `NODE_ENV`      | Set by runtime | When `production`, the pool enables `ssl: { rejectUnauthorized: false }` and `max: 1`. |

## Known limitations and next steps

Deliberate cuts:

- No real authentication — cookie switcher only; replace with Auth.js / Clerk and map identities to `users`.
- No view-only shares — `canWrite` currently equals `canRead`; add a role column on `document_shares` and branch in `lib/permissions.ts`.
- Shared users cannot re-share — owner-only share routes; extend permissions if multi-level sharing is needed.
- Markdown upload is a small custom subset — expand `lib/parse.ts` or adopt a dedicated parser if fuller Markdown is required.
- No persistent file storage — uploads become documents immediately; add object storage only if original files must be retained.
- No presence / live multiplayer — conflicts use version numbers and a reload banner; realtime would need websockets or a CRDT layer.

With another 2–4 hours, prioritize: real auth, view-only share roles, richer Markdown import, and a small end-to-end test that exercises share + conflict over the HTTP API.
