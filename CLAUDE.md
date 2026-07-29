# Expansa — MMO Strategy Game

## Overview
MMO strategy game (Travian/Third World-like) with a sci-fi setting.
Backend: Node.js + TypeScript.

**One client ships at launch; which one is not decided.** Mobile (React Native) and web
are both candidates, and a Steam build would be the web client in a desktop shell rather
than a third codebase. The boundaries below are built for several clients — see Clients.

## Architecture: Three-Contour Approach

Each contour shrinks the one above it by orders of magnitude, so the product itself stays
small enough to hold in one head. That reduction is the criterion for everything below:
if a thing does not shrink the contour above it, it is in the wrong place.

- **Contour 1 (Technology Stack)**: runtime, protocols, storage, security, observability,
  performance, concurrency, infrastructure, stable contracts and extension points.
  Written rarely, expensively, tested and profiled, reused across many products —
  which is a description of PostgreSQL, Node and Fastify, not of our code.
  **Mostly chosen, not written.**
- **Contour 2 (Parameterized Modules)**: large capabilities that represent a *family* of
  scenarios, reconfigured through schemas, metadata, policies and handlers — never through
  new branches. **Half of it is bought**: authentication, payments, notifications, roles.
  The other half we write, because nobody sells a strategy-game engine.
- **Contour 3 (Product)**: the game — domain model, data schemas, business rules,
  policies, module configuration, and a small number of genuinely unique handlers.
  Mostly YAML config, minimal code.

**The test**: if the code contains the words `building`, `unit`, `fleet`, `asteroid`
or `clan`, it is Contour 3. Contour 2 knows only about "a timed transformation with a
cost, prerequisites and effects"; that construction, research and ship production are
all instances of it is a fact of Contour 3.

Naming a module after a game system is the failure mode this test exists to prevent:
a "building system" is one scenario in a folder, not an engine. The engine is a timed
transformation; buildings are configuration.

## Contour 1: chosen, not written

```
Contour 1 = adopted technology (~90%) + the seams between it (~10%)
```

Its heaviest part — PostgreSQL — is not even in `node_modules`; it is a separate process in
a separate container. Our code belongs on the **seams**, where neither adopted piece knows
about the other. Code here that is not on a seam is usually something that should have been
adopted instead.

Two rules that reach beyond this contour and so live here rather than in `platform/`:

- **A runtime dependency is a Contour 1 decision**, carrying the same weight as choosing the
  database — adopting badly costs as much as writing badly and is harder to see, because
  nobody reads it. Development tooling is not covered.
- **We married PostgreSQL and keep the query layer replaceable.** A port is how an adopted
  technology is owned rather than owning us; it belongs where a thing is replaceable and is
  a liability where we married.

**Writing in `kernel` or `platform`: read `platform/CLAUDE.md` first.** It holds the three
questions to ask before adding anything, what may not be abstracted, and why there is no
`@nestjs` dependency there.

## Contour 2: half bought, half written

**Bought (2a).** Every horizontal capability — authentication, payments, notifications,
roles, analytics. If something adoptable exists, writing our own is not allowed. The
library needs no directory; everything around it does — port in `kernel`, adapter in
`platform`, binding in `server`, configuration in `content`. ADR 0005.

**Written (2b).** The family engines: projected quantities, timed transformations, modifier
stacks, deterministic resolution, visibility. Nobody sells these.

The one rule that reaches outside the package, because it constrains product work too:

> **Adding a Contour 3 entity must cost zero lines of code.**

A new resource, building or ship is a content entry. If it requires touching TypeScript,
the engine did not happen.

**Writing an engine: read `engines/CLAUDE.md` first.** It holds the threshold for building
one at all, the config-versus-handler boundary, and the time invariant from ADR 0002 that
decides what an engine may model.

## Repository Layout

Contours are **workspace packages, not directories** — ADR 0004. A package cannot import
what its `package.json` does not declare, and TypeScript project references refuse the
same import a second time, so the boundary holds without anyone remembering it.

The root states the architecture:

```
kernel/        Contour 1 — descriptions: types, ports, pure functions. No dependencies.
platform/      Contour 1 — adapters over adopted technology                  (not yet)
engines/       Contour 2 — one package per family of scenarios               (not yet)
contracts/     client ↔ server surface, versioned                            (not yet)
content/       Contour 3 — data                                              (not yet)
server/        Contour 3 — handlers, wiring, and the only composition root
clients/       one package per client                                        (not yet)
```

```
server  →  engines  →  kernel
   ↓                     ↑
platform ────────────────┘
```

Inside the server:

```
server/src/
├── handlers/    unique effects, invoked by name from content
├── wiring/      builds engines from content, injects platform adapters
├── api/         controllers — transport only, zero logic
└── jobs/        event handlers — transport only, zero logic
```

`api/` and `jobs/` are twins and equally empty: the same use case must be reachable from
both, which is the check that logic is genuinely detached from transport. It matters here
more than usual, because most world mutations arrive from the scheduler rather than from
a request.

- **Contour 1 splits on portability, not purity.** `Timestamp` appears in the signature of
  the projection function that runs on both sides, so it is `kernel`; a connection pool is
  not portable and is `platform`.
- **An engine depends on `kernel` and on nothing else in the repository.** It declares what
  it needs as a port, `platform` implements it, `server` connects them. An engine that
  needs anything more was drawn wrong.
- **Storage belongs to whoever owns the state**: `accounts` to `platform`, generic tables
  to the non-portable engine that owns them, game tables to the product. **A portable
  engine owns no storage at all** — it also runs where there is no database.
- **Portable packages build twice**, CommonJS for the server and ESM for a client bundler,
  selected by the `exports` map. Declarations come from the CommonJS build only.
- **Nothing is created before it holds something.** Packages marked *not yet* are a map,
  not directories.
- The build is a project-reference graph: `tsc -b` from the root, and the server's watch
  loop rebuilds `kernel` on change. `nest build` is not used — it knows nothing about
  references and would compile against stale declarations.

## Tech Stack

### Platform

Married, in the sense above. Changing any row is a project-level decision, not a task.

| | Version | Pinned in |
|---|---|---|
| Node.js | 24 LTS, image `node:24-bookworm-slim` | `Dockerfile.dev`, `engines` |
| TypeScript | 5.9.3, `strict` | `tsconfig.base.json` |
| PostgreSQL | 18, image `postgres:18-alpine` | `docker-compose.yml` |
| pnpm | 11.17.0 via corepack | `packageManager` |
| Local environment | Docker Compose: Postgres + a Node container | `docker-compose.yml` |

Reasons that otherwise get rediscovered the expensive way:

- **Debian, not Alpine**, for the Node image: glibc versus musl matters once `node_modules`
  is bind-mounted from an Ubuntu host.
- **The database is published on host port 5435.** 5432-5434 belong to system-installed
  PostgreSQL clusters on this machine, and quietly talking to the wrong database is
  expensive to diagnose. Inside the compose network it is `postgres:5432`.
- **PostgreSQL 18 mounts `/var/lib/postgresql`**, not `/var/lib/postgresql/data` — 18+
  expects a version subdirectory so `pg_upgrade --link` works.
- **Images are pinned to a major version, never `latest`.**
- **Everything runs in the container**, including the web client's Vite server; do not run
  pnpm on the host. A mobile client would be the exception, needing USB and emulators.
- **Vite proxies `/v1` to the server**, so the browser sees one origin and there is no CORS
  configuration to get wrong. It also polls for file changes, because a bind mount does not
  deliver inotify events.
- **pnpm blocks dependency install scripts**, which is the right default. `esbuild` is
  allowed in `pnpm-workspace.yaml` because Vite cannot start without its native binary;
  anything else added there is a deliberate exception.
- Server is **CommonJS** (NestJS tooling requires it); portable packages emit both
  CommonJS and ESM so a client bundler can consume them — ADR 0004.
- **Not TypeScript 7 yet**: `@nestjs/cli` still pins 5.9.x.

### Decided

- Runtime and framework: NestJS 11 on the Fastify adapter — ADR 0001
- Repository layout: contours are workspace packages, rooted — ADR 0004 (supersedes 0003)
- **The first client is web** — React on Vite, in `clients/web`. Chosen for the feedback
  loop: no emulator, no store review, and a Steam build would be this client in a desktop
  shell anyway. Mobile stays possible; `src/core` and `src/ui` are split from the first
  commit so the shared half can be extracted when a second client appears.
- Time model: quantities are computed from a checkpoint, never credited by a tick;
  discrete events are scheduled — ADR 0002. **A rate may never depend on an amount**, and
  a new mechanic that would break that gets reformulated rather than the model propped up.
- Authentication is **stubbed**, and fails closed. Every route requires a principal
  unless marked `@Public()`; `AUTH_MODE` has no default and an unset or `real` value
  refuses to boot. Use cases take a `Principal`, never a request or a token.

Persistence is settled in discussion and awaiting its ADR (#13): Drizzle, READ COMMITTED
with explicit row locks, transactions through `AsyncLocalStorage`. The detail lives in
`platform/CLAUDE.md`, since nothing outside that package acts on it.

### Still open

Do not assume an answer; ask before writing code that depends on it.

- Validation and schema approach. Partly narrowed: the schema must execute in the client
  too, which rules out decorator-based `class-validator` DTOs as the only source
- Job scheduler and queue — leaning toward a PostgreSQL-native queue, so that enqueueing is
  inside the same transaction as the state change that caused it
- Event ordering for simultaneous events on one base
- Client-server contract details and the server-push channel

### Not chosen at all

Gaps, recorded so they stay visible:

- **No test runner decision.** `node:test` is in use because it needs no adoption and no
  configuration; #34 is still open, and it should be settled before the persistence layer,
  whose lock ordering and retry behaviour is exactly the code that fails silently without
  tests.
- **No observability.** No structured logging, request ids, query timing or lock-wait
  visibility. We chose explicit row locks and currently could not see contention if it
  happened.
- **No CI.** Nothing runs typecheck, build or the contour-boundary check automatically.

## Clients

One client will be written; the architecture assumes there will be more. Almost nothing on
the server depends on which comes first — only push transport, payment provider and session
storage do, and all three are adapters at the edge.

Two rules belong here because the *server* has to honour them:

- **The server never knows which client is talking to it.** No branching on platform.
- **The contract is versioned (`/v1`) and changes additively.** A mobile client updates over
  weeks, so several contract versions are served at once. `/health` is exempt.

One consequence lands in the schema before any client exists and is expensive to retrofit:
**accounts, not users.** `accounts` plus `identities(provider, external_id)`, because one
player may arrive through Apple, Google, Steam or email and must be one account.

**Working in a client: read `clients/CLAUDE.md` first.** It holds the `core`/`ui` split,
projecting against server time, and what the map is allowed to display.

## Local Development

Everything server-side runs inside the compose stack; do not run pnpm on the host.

```bash
cp .env.example .env          # first time only
docker compose up -d          # postgres, server, web — all hot-reload
docker compose logs -f server
docker compose exec server pnpm typecheck        # every project
docker compose exec server pnpm test             # every project that has tests
curl localhost:3000/health
open http://localhost:5173     # the web client

# Authenticated endpoints: in stub mode the bearer token IS the account id,
# so any UUID works and no sign-in flow exists yet.
curl -H "Authorization: Bearer 3f6b1c22-9a44-4c31-8b7e-2d5a90ff1e07" \
     localhost:3000/v1/me
```

Notes that will otherwise cost time:
- If `docker compose` cannot reach a daemon, the active context is Docker Desktop and
  it is not running: `docker context use default`.
- The dev loop is `tsc -b --watch` plus `node --watch`, *not* `nest start --watch` —
  the latter can leave the old process holding the port and silently serve stale code.
  `-b` is what makes an edit in `kernel/` reach the running server.
- A build error in a dependency stops the server from restarting, and it is reported in
  the `tsc` half of the compose output, not the `app` half. Check both before assuming
  the server is serving current code.
- **Never share a `tsbuildinfo` between an emitting build and `tsc --noEmit`**: the second
  build sees "up to date" and emits nothing, leaving an empty `dist`. The server's
  `typecheck` passes `--incremental false` for this reason; composite projects cannot, so
  they use `tsc -b --force` instead.

## Workflow Rules
- Every change starts from a GitHub issue. No issue, no work.
- Never push directly to `main` — always a feature branch + PR.
- Use git worktrees for parallel work: `git worktree add ../expansa-issue-N -b issue-N-description`
- Branch naming: `issue-<number>-<short-description>`
- Commit messages reference the issue: `Fixes #12` or `Refs #12`
- PR description must link the issue it closes
- **Stacked PRs must be merged bottom-up.** Merges here are squash merges, so merging a
  parent first discards any child merged into it afterwards. This has already silently
  dropped two PRs; prefer not stacking at all.

## Documentation Rules
- **All written artifacts are in English**: ADRs, domain docs, README, code comments,
  commit messages, PR descriptions, issue titles and bodies. This holds regardless of
  the language used in chat.
- Significant architectural decisions with alternatives considered → new ADR in
  /docs/adr/, sequentially numbered, never edited after merge (superseded by new ADR instead)
- Business logic changes → update the relevant /docs/domain/<feature>.md
- Don't document trivial refactors or bug fixes — keep signal high

### Where a rule goes

This file is loaded at the start of every session; a package's `CLAUDE.md` is loaded only
when work happens there. So the split is not cosmetic — it decides what every task pays for.

| | |
|---|---|
| **Here** | how to place a thing, how to work, and any rule another package must honour |
| **`<package>/CLAUDE.md`** | how to write code *in that package* |

Rule of thumb: **this file states, a package elaborates.** The acceptance criterion for an
engine is here because product work depends on it; that ids are strings rather than unions
is in `engines/`, because only an engine author can get that wrong.

> **No rule may appear in two files.** A duplicated rule is one that gets edited in one
> place and goes stale in the other. A package file may *reference* a rule stated here — it
> may not restate it.

Existing package files: `platform/`, `engines/`, `clients/`. `kernel/` and `server/` are
not split yet — #42.

## Code Conventions

- **Comments explain why, not what.** A comment restating the code is noise; one recording
  why an obvious approach was rejected is why the file is still readable in six months.
- **No `any`.** `strict` and `noUncheckedIndexedAccess` are on. An unavoidable cast is
  narrow and carries a comment saying why it is safe.
- **Branded types instead of bare `string` and `number`** wherever confusion is possible:
  `AccountId`, `Timestamp`, `Duration`. Seconds mistaken for milliseconds in a game where
  every quantity is a function of elapsed time fails silently and reads as a balance bug.
- **Never `Date.now()` in domain code.** Time comes from an injected `Clock`, and engines
  take the instant as an argument — ADR 0001, ADR 0002.
- **Use cases take a `Principal`**, never a request, a token or a session. The same use
  case is invoked over HTTP, from a job handler and from a script; only one of those has a
  request to read.
- **A package's public surface is its `index.ts`.** Reaching into another package's
  internal module is not done.
- **Named exports only.** A default export renames itself at every import site.
- **Files kebab-case, one exported concept each**; classes PascalCase.
- **Import order**: Node builtins, external packages, workspace packages, relative paths.
- **`readonly` on data interfaces.** Anything crossing a boundary — checkpoints, principals,
  engine state — is immutable, and engines return new values rather than mutating arguments.
- **Errors carry meaning, not strings.** `kernel` throws built-in error types because it is
  portable and knows nothing about HTTP; the server maps them at the edge.
