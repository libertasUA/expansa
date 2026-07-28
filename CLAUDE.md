# Expansa — MMO Strategy Game

## Overview
Mobile MMO strategy game (Travian/Third World-like) with a sci-fi setting.
Backend: Node.js + TypeScript. Mobile client: React Native (Expo).
No browser client is in scope at launch.

## Architecture: Three-Contour Approach

The point of the split is code volume: each contour shrinks the one above it by orders
of magnitude, so the product itself stays small enough to hold in one head.

- **Contour 1 (Core Infrastructure)**: runtime, storage, transactions, concurrency,
  job execution, auth, observability, stable contracts and extension points. Written
  rarely, carefully and expensively; heavily tested and profiled. Lives in /server core
  modules, /packages/shared, /mobile core shell.
- **Contour 2 (Parameterized Modules)**: product-independent capability engines. Each
  represents a *family* of scenarios and is reconfigured through schemas, metadata,
  policies and handlers — never through new branches. A Contour 2 module does not know
  it is part of a game.
- **Contour 3 (Product)**: the game — domain model, data schemas, business rules,
  policies, module configuration, and a small number of genuinely unique handlers.
  Mostly JSON/YAML config, minimal code.

**The test**: if the code contains the words `building`, `unit`, `fleet`, `asteroid`
or `clan`, it is Contour 3. Contour 2 knows only about "a timed transformation with a
cost, prerequisites and effects"; that construction, research and ship production are
all instances of it is a fact of Contour 3.

**When to build a Contour 2 module**: only when at least three members of the family can
be listed from `docs/domain/` without inventing them. This project has one product and
one developer, so generalisation is paid for immediately and amortised only within this
game — a module built for a family of one is a liability.

Naming a module after a game system is the failure mode this section exists to prevent:
a "building system" is one scenario in a folder, not an engine. The engine is a timed
transformation; buildings are configuration.

## Tech Stack

Decided — see the linked ADR for reasoning, do not re-litigate without one:
- Runtime: Node.js 24 LTS (24.18.0), TypeScript 5.9 strict — ADR 0001
  - Server is **CommonJS** (NestJS tooling requires it); `packages/shared` stays
    ESM-compatible for Metro
  - Not TypeScript 7 yet: `@nestjs/cli` still pins 5.9.x
- Server framework: NestJS 11 on the Fastify adapter — ADR 0001
- Database: PostgreSQL 18
- Local development runs in Docker Compose: PostgreSQL plus a Node container that
  hosts the server and pnpm. Expo stays on the host — it needs USB and emulators.
  Images are pinned to a major version, never `latest`.
  - The containerised database is published on host port **5435**; 5432-5434 belong
    to system-installed PostgreSQL clusters on the dev machine.
  - From inside the compose network the database is `postgres:5432`.
- Mobile: React Native (Expo). Mobile-only at launch, no web client in scope.
- Time model: lazy evaluation for resources (computed on read, never ticked) plus
  deferred jobs for discrete events (construction completion, troop arrival,
  research). The intended direction, but the ADR is still in draft and unreviewed —
  treat the details as unsettled.

Still open — do not assume an answer, ask before writing code that depends on it:
- Validation / schema approach (class-validator vs Zod in a shared package)
- Transaction strategy under NestJS DI
- Database access layer and migration tooling
- Job scheduler and queue
- Event ordering model for simultaneous events on one village
- Client-server contract details and the server-push channel

## Local Development

Everything server-side runs inside the compose stack; do not run pnpm on the host.

```bash
cp .env.example .env          # first time only
docker compose up -d          # postgres + server, server hot-reloads
docker compose logs -f server
docker compose exec server pnpm --filter @expansa/server typecheck
curl localhost:3000/health
```

Notes that will otherwise cost time:
- If `docker compose` cannot reach a daemon, the active context is Docker Desktop and
  it is not running: `docker context use default`.
- The dev loop is `tsc --watch` plus `node --watch`, *not* `nest start --watch` —
  the latter can leave the old process holding the port and silently serve stale code.
- Never run `tsc --noEmit` sharing a `tsbuildinfo` with an emitting build: the second
  build sees "up to date" and emits nothing. The `typecheck` script passes
  `--incremental false` for exactly this reason.

## Workflow Rules
- Every change starts from a GitHub issue. No issue, no work.
- Never push directly to `main` — always a feature branch + PR.
- Use git worktrees for parallel work: `git worktree add ../expansa-issue-N -b issue-N-description`
- Branch naming: `issue-<number>-<short-description>`
- Commit messages reference the issue: `Fixes #12` or `Refs #12`
- PR description must link the issue it closes

## Documentation Rules
- **All written artifacts are in English**: ADRs, domain docs, README, code comments,
  commit messages, PR descriptions, issue titles and bodies. This holds regardless of
  the language used in chat.
- Significant architectural decisions with alternatives considered → new ADR in
  /docs/adr/, sequentially numbered, never edited after merge (superseded by new ADR instead)
- Business logic changes → update the relevant /docs/domain/<feature>.md
- Don't document trivial refactors or bug fixes — keep signal high

## Code Conventions
