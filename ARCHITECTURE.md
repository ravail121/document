# Architecture

## What I prioritized and why

With a 4–6 hour budget I spent complexity on correctness rather than infrastructure. The product can fail in two expensive ways: silently losing an edit, or showing one user’s documents to another. Everything else was eligible to be cut.

That produced one deployable Next.js app, one Postgres database, no auth provider, no Redis, and no queue. The time went into optimistic locking, permission checks on every request, schema-level uniqueness for shares, and staged verification before each feature was considered done.

## Shape of the system

This is a layered monolith: one deployment unit, organized into clear layers inside the codebase.

1. Presentation — `app/page.tsx`, `app/documents/[id]/page.tsx`, and `components/*` (Editor, ShareDialog, Header, dashboard actions).
2. API — `app/api/**/route.ts` handlers that translate HTTP into session, permission, and query calls.
3. Business logic — `lib/session.ts`, `lib/permissions.ts`, `lib/validation.ts`, `lib/parse.ts`, `lib/request.ts`.
4. Data access — `lib/queries.ts` is the only module that contains SQL; `lib/db.ts` owns the `pg` Pool.

Postgres schema and seed data live in `db/01_schema.sql` and `db/02_seed.sql`.

Every mutating or privileged document route follows the same check order: resolve session → document exists (404) → permission (403) → validate input (400) → act. Authorization always comes from the `userId` session cookie via `getCurrentUserId()` in `lib/session.ts`, never from a client-supplied actor id in the body. Share routes accept a target `userId` in the body; that value is the share recipient, not the authenticated actor.

Locally the app runs under Docker Compose (`docker-compose.yml`: Next.js + Postgres 16). Production runs the same code on Vercel against hosted Postgres, with a different `DATABASE_URL`. Developing against real Postgres locally avoided SQLite dialect surprises and kept init scripts, triggers, and JSONB behavior identical to production.

## The decisions worth defending

### Concurrency

Last-write-wins silently loses data (the lost-update problem). CRDTs or operational transforms are the right long-term answer for simultaneous editing, but they cost weeks. For this timebox I used optimistic locking.

`documents.version` starts at 1. Saves go through `updateDocument` in `lib/queries.ts`:

```sql
UPDATE documents
SET title = $1, content = $2, version = version + 1, updated_at = now()
WHERE id = $3 AND version = $4
RETURNING ...
```

If zero rows match, the handler returns 409 with `currentVersion`. The editor stops autosaving and shows a reload banner so the user must fetch the latest document instead of overwriting it.

### Races die in the schema

`document_shares` has `PRIMARY KEY (document_id, user_id)`. Inserts use `ON CONFLICT DO NOTHING` in `createShare`, so a double-click cannot create a duplicate row or surface a unique-violation as a 500. That is safer than check-then-insert in application code, which is a TOCTOU race under concurrency.

A `BEFORE INSERT` trigger (`reject_self_share` in `db/01_schema.sql`) rejects sharing a document with its owner; the shares API maps that error to a 400.

### Fake authentication, real authorization

The brief allows simulated users. The header switcher posts to `/api/session` and sets a cookie. Every document and share route still enforces owner-or-shared rules in `lib/permissions.ts` and the route handlers: shared users can read and edit, but cannot share, revoke, or delete; removing a share takes effect on the next request. Swapping in real auth only changes where the actor id comes from.

### Documents as JSONB

Tiptap models a document as one JSON tree. That tree is stored in `documents.content` as JSONB, so marks and structure survive save and reload exactly. Splitting into block tables would add joins and migration cost without helping at this scale.

### No Redis

In a larger system Redis would appear for session stores, response caching, presence pub/sub, and rate limiting. Here sessions are a single cookie, pages that read the session are `force-dynamic`, there is no live multiplayer, and traffic is assignment-scale — so Redis would be idle infrastructure.

### Serverless-aware deployment

Vercel functions are ephemeral. `lib/db.ts` therefore sets `max: 1` and TLS when `NODE_ENV === "production"`, and expects a transaction-pooler `DATABASE_URL` so many isolates do not open large pools against Postgres. Upload parsing in `app/api/upload/route.ts` reads the file into memory and never writes to disk, because serverless has no durable filesystem. Session-dependent routes and pages export `dynamic = "force-dynamic"` so a cached dashboard cannot serve the wrong user’s documents.

Application authorization is enforced in Next.js. The checked-in schema in `db/01_schema.sql` does not enable Postgres Row Level Security or define policies; any RLS on the live hosted database would be an environment-side control outside this repository.

## Deliberate scope cuts

- Real authentication — replace the cookie switcher with Auth.js or similar and map identities onto `users`.
- View-only shares — today `canWrite` equals `canRead`; add a role on `document_shares` and branch in `lib/permissions.ts`.
- Re-sharing by non-owners — share routes are owner-only by design (`app/api/documents/[id]/shares/route.ts`).
- Full Markdown fidelity — `lib/parse.ts` only covers what the toolbar can render.
- Persistent original files — uploads become documents immediately; object storage would be needed to keep source files.
- Live collaboration — version conflicts plus reload; realtime would need websockets or a CRDT layer.

## What I would do with another 2 to 4 hours

1. Real auth wired to the existing permission checks.
2. View-only vs edit roles on shares.
3. Broader Markdown import or a documented subset test matrix.
4. An HTTP-level test that asserts 409 on stale version and 403 for a non-shared reader.
