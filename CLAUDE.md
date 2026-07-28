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

Its heaviest part — PostgreSQL — is not even in `node_modules`; it is a separate process
in a separate container. Our code belongs on the **seams**, where neither adopted piece
knows about the other: Drizzle does not know the transaction must reach a NestJS provider;
Nest does not know row locks must be taken in a deterministic order. Code here that is not
on a seam is usually something that should have been adopted instead.

Three questions before writing anything in this contour:

1. **Is it genuinely absent from the stack?** If it exists, adopt it — even when writing
   it would be "clearer". Understanding is bought by reading documentation and choosing
   carefully, not by reimplementing what is already profiled.
2. **Is it a seam between two adopted things?** If not, it probably is not Contour 1.
3. **Does it shrink Contour 2?** Removing transaction plumbing from every engine does.
   Catching a class of bug is welcome but is not what this contour is for.

**A runtime dependency is a Contour 1 decision** and carries the same weight as choosing
the database: it is adopted infrastructure, and adopting it badly costs as much as writing
it badly while being harder to see, because nobody reads it. Development tooling — linter,
test runner, formatter — does not reach the running server and is not covered by this.

**Marry some of it, keep the rest replaceable.** The real judgement here, and it is not
"abstract everything":

- **PostgreSQL is married.** We use `FOR UPDATE SKIP LOCKED`, advisory locks and
  partitioning; hiding it behind a portable abstraction would be paid for continuously
  against a database change that will never happen.
- **The query layer is kept at arm's length** behind repository ports, so replacing it is
  a week rather than a rewrite.
- **NestJS sits in between**: controllers and modules are steeped in it, use cases must
  not know they were called over HTTP.

A port is therefore not ceremony — it is how an adopted technology is owned rather than
owning us. It belongs where a thing is replaceable, and is a liability where we married.

## Contour 2: half bought, half written

**Bought (2a).** Every horizontal capability. Their seams need no new directory: the
contract goes to `kernel`, the adapter to `platform`, the product decision to `server`.

| Capability | Adopt |
|---|---|
| Authentication | provider SDKs — Apple, Google, Steam |
| Payments | RevenueCat for stores, Stripe for web, Steam MTX |
| Notifications | Expo Push / FCM / APNs |
| Roles and permissions | Casbin or equivalent, for clan roles |
| Analytics | PostHog |

Only the normalisation is ours: three stores with incompatible receipts, one entitlement.

**Written (2b).** The family engines: projected quantities, timed transformations, modifier
stacks, deterministic resolution, visibility. No one sells these.

### The acceptance criterion for an engine

> **Adding a Contour 3 entity must cost zero lines of code.**

A new building, resource or ship is a YAML entry. A new *kind of mechanic* is engine work,
and that is legitimate. If adding a building requires touching TypeScript, the engine did
not happen — and that is visible immediately rather than in six months.

**When to build one**: only when at least three members of the family can be listed from
`docs/domain/` **without inventing them**. One product and one developer means
generalisation is paid for immediately and amortised only within this game.

### What an engine is

A set of functions built from configuration, not a class that imports content:

```ts
const quantities = createQuantityEngine(definitions);
quantities.project(checkpoint, at);
```

Three properties, each buying something specific:

| Property | What it buys |
|---|---|
| Config arrives as an argument, never by import | a new entity costs no code |
| All state arrives as arguments — no hidden reads | testable without a database |
| No clock and no randomness; the instant and the seed are parameters | a battle report can be replayed months later |

Purity is a property most engines have, **not the definition**. A pure function handling
one specific case is a handler, not an engine. The question is always: *is this the same
mechanism applied to many things?*

### Config or handler

Configuration expresses **what**; a handler expresses **how**, when the how is genuinely
unique, and is invoked by name from content.

Both extremes fail. All-config invents a programming language with no debugger and no
types. A handler per entity puts Contour 3 back to writing code for every building.

> **The smell: a condition appearing in config means a handler was needed.**

An upgrade cost is a formula in config — every building has one of the same shape. "A clan
outpost grants entry to a sector when built" is a handler — expressing it as data would
drag the concept of sector access into the schema.

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
- Authentication is **stubbed**, and fails closed. Every route requires a principal
  unless marked `@Public()`; `AUTH_MODE` has no default and an unset or `real` value
  refuses to boot. Use cases take a `Principal`, never a request or a token.

Decided in discussion, **ADR pending** (#13) — treat as settled, but the reasoning is not
yet written down:

- **Drizzle ORM** with `drizzle-kit` for migrations, chosen over Kysely. Known gap:
  `CREATE INDEX CONCURRENTLY` cannot run inside the transaction the migrator wraps.
- **READ COMMITTED with explicit row locks.** Every use case locks its aggregate root with
  `FOR UPDATE` first, and multi-root operations lock in a deterministic order. Retries
  exist for deadlock, not as the normal path.
- **Transactions propagate through `AsyncLocalStorage`**, adopting `@nestjs-cls/transactional`
  rather than hand-rolling it. Ours is only what it does not do: lock ordering, deadlock
  retry, and the mandatory resource catch-up.

### Still open

Do not assume an answer; ask before writing code that depends on it.

- Validation and schema approach. Partly narrowed: the schema must execute in the client
  too, which rules out decorator-based `class-validator` DTOs as the only source
- Job scheduler and queue — leaning toward a PostgreSQL-native queue, so that enqueueing is
  inside the same transaction as the state change that caused it
- Event ordering for simultaneous events on one base
- Client-server contract details and the server-push channel
- Time model: lazy evaluation for resources plus deferred jobs for discrete events is the
  intended direction, but ADR 0002 is still a draft and is blocked on domain questions —
  the resource set, warehouse overflow, and upkeep deficit

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
the server depends on which comes first — only three adapters do: push transport, payment
provider, and session storage. So the choice stays open, and these rules keep it open:

1. **The server never knows which client is talking to it.** No branching on platform. A
   client that needs different behaviour declares its own capabilities; the server does
   not infer them from a User-Agent.
2. **A client directory holds rendering and platform APIs, nothing else.** Transport,
   session, local store, cached state, and view models are not rendering. Inside the first
   client keep them split as `src/core/` and `src/ui/`, so extracting a shared client
   package later is a file move rather than a rewrite.
3. **The contract is versioned (`/v1`) and changes additively.** Fields may be added;
   removing one or changing its meaning requires a new version. This is not optional
   politeness: a mobile client updates over weeks, so the server must serve several
   contract versions at once. `/health` is exempt — it is infrastructure read by Docker,
   not contract a client pins to.

A shared client package is deliberately **not** created up front — a family of zero cannot
be designed for. It gets extracted when the second client appears.

One consequence lands in the schema before any client exists and is expensive to retrofit:
**accounts, not users.** `accounts` plus `identities(provider, external_id)`. One player
may arrive through Apple, Google, Steam, or email and must be one account.

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
