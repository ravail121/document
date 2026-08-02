# AI workflow

## Tools used

I used Cursor. It wrote nearly all of the application code from staged prompts against this repository.

## How the workflow was structured

I deliberately designed first and generated in verifiable stages instead of one large prompt. The sequence was approximately:

1. Docker skeleton (Next.js + Postgres, health endpoint)
2. Schema and seed
3. Session, queries, permissions, and document API
4. TipTap editor with autosave and conflict handling
5. Dashboard and user switcher
6. Sharing
7. File upload
8. Tests and error hardening
9. Deploy prep (serverless pool, `force-dynamic`, build)
10. Visual design (dashboard, editor, share dialog)

Every stage ended with explicit verification that had to pass before the next stage started. The first stage was only a health endpoint proving the app container could reach Postgres, so environment problems showed up immediately rather than after hours of feature work.

## Where AI materially sped things up

- Boilerplate and wiring: route handlers, Docker files, TipTap setup, Tailwind token plumbing.
- Design foresight: race analysis (lost updates, duplicate shares, self-shares) happened before coding, so optimistic locking, `ON CONFLICT DO NOTHING`, and the self-share trigger were built in rather than retrofitted.
- Deployment gotchas: serverless connection limits (`max: 1`), no persistent disk for uploads, and static caching leaking session-scoped pages — addressed with pool settings, in-memory parsing, and `force-dynamic`.
- UI token system and restyles from the provided HTML design specs.

## What I changed or rejected

- Rejected SQLite locally in favor of Postgres in Docker for environment parity with production.
- Rejected a login page in favor of the header “Viewing as” switcher, matching the brief’s simulated accounts.
- Rejected application-level duplicate checking for shares in favor of the composite primary key plus `ON CONFLICT DO NOTHING`.
- Rejected a full Markdown library in favor of `lib/parse.ts`, which only emits nodes the editor can actually render.
- Skipped the Supabase JS client and public anon keys; the app talks to Postgres directly through `pg` and `DATABASE_URL`.

## How I verified correctness

Staged gates used curl-level checks: list and create documents as Alice, 404 for missing ids, 403 for Bob on an unshared document, 200 then 409 for a stale-version PUT, share then observe Bob’s “Shared with me” list, revoke and confirm access denied. The two-tab conflict path is the same 409 mechanism the editor surfaces as a reload banner.

Cross-user checks ran after sharing and dashboard work. Automated coverage lives in `tests/permissions.test.ts`, `tests/parse.test.ts`, and `tests/validation.test.ts`, run with `npm test` / `docker compose exec app npm test`. Share uniqueness was confirmed in `psql` with a row count of 1 after parallel duplicate inserts, rather than trusting the SQL by inspection alone.

## Honest assessment

AI wrote most of the code. The judgment calls — what to cut, where the races were, which concurrency tier fit the timebox, and what to verify before trusting each stage — were mine, and they were made before generation started.
