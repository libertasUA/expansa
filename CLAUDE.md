# Expansa — MMO Strategy Game

## Overview
MMO strategy game (Travian/Third World-like) with a sci-fi setting.
Backend: Node.js + TypeScript.

**One client ships at launch; which one is not decided.** Mobile (React Native) and web
are both candidates, and a Steam build would be the web client in a desktop shell rather
than a third codebase. The boundaries below are built for several clients — see Clients.

## Architecture: Three-Contour Approach

The point of the split is code volume: each contour shrinks the one above it by orders
of magnitude, so the product itself stays small enough to hold in one head.

- **Contour 1 (Technology Stack)**: runtime, protocols, storage, security, observability,
  performance, concurrency, infrastructure, stable contracts and extension points.
  Written rarely, expensively, tested and profiled, reused across many products —
  which is a description of PostgreSQL, Node and Fastify, not of our code.
  **Mostly chosen, not written.** See Contour 1 below.
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

## Contour 1: chosen, not written

```
Contour 1 = adopted technology (~90%) + the seams between it (~10%)
```

The heaviest part of this contour — PostgreSQL — is not even in `node_modules`; it is a
separate process in a separate container. The largest thing we have produced here is
ADR 0001: an hour of discussion and almost no code. That is what "written rarely and
expensively" looks like for one developer who adopts rather than authors.

Our code belongs on the **seams**, where neither adopted piece knows about the other:
Drizzle does not know the transaction must reach a NestJS provider; Nest does not know
row locks must be taken in a deterministic order. Code in Contour 1 that is not on a seam
is usually something that should have been adopted instead.

Three questions before writing anything here:

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

**Marry some of it, keep the rest replaceable.** This is the real engineering judgement
here, and it is not "abstract everything":

- **PostgreSQL is married.** We use `FOR UPDATE SKIP LOCKED`, advisory locks and
  partitioning; hiding it behind a portable abstraction would be paid for continuously
  against a database change that will never happen.
- **The query layer is kept at arm's length** behind repository ports, so replacing it is
  a week rather than a rewrite.
- **NestJS sits in between**: controllers and modules are steeped in it, use cases must
  not know they were called over HTTP.

A port is therefore not ceremony — it is how an adopted technology is owned rather than
owning us. It belongs where a thing is replaceable, and is a liability where we married.

## Repository Layout

Contours are **workspace packages, not directories** — ADR 0003. A package cannot import
what its `package.json` does not declare, and TypeScript project references refuse the
same import a second time, so the boundary holds without anyone remembering it.

```
packages/
├── core/                     Contour 1
│   ├── kernel/               portable, dependency-free: types, ports, pure functions
│   └── server-runtime/       platform-bound: Postgres, transactions, jobs   (not yet)
├── engines/                  Contour 2, one package per family of scenarios (not yet)
├── contracts/                client ↔ server surface, versioned             (not yet)
└── content/                  Contour 3 data                                 (not yet)
server/                       Contour 3 code, and the only composition root
clients/                      one package per client                         (not yet)
```

```
server  →  engines  →  kernel
   ↓                     ↑
server-runtime ──────────┘
```

- **Contour 1 splits on portability, not purity.** `Date.now()` works identically in Node,
  a browser and React Native, so the clock is `kernel`; a connection pool is not portable
  and is `server-runtime`.
- **An engine depends on `kernel` and on nothing else in the repository.** It declares
  what it needs as a port, `server-runtime` implements it, `server` connects them. An
  engine that needs anything more was drawn wrong.
- **Portable packages build twice**, CommonJS for the server and ESM for a client bundler,
  selected by the `exports` map. Declarations come from the CommonJS build only.
- **Nothing is created before it holds something.** Packages marked *not yet* above exist
  as a map, not as directories.
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
- **Everything server-side runs in the container**; do not run pnpm on the host. The client
  toolchain is the exception — a mobile one needs USB and emulators.
- Server is **CommonJS** (NestJS tooling requires it); portable packages emit both
  CommonJS and ESM so a client bundler can consume them — ADR 0003.
- **Not TypeScript 7 yet**: `@nestjs/cli` still pins 5.9.x.

### Decided

See the linked ADR for reasoning, do not re-litigate without one:
- Runtime and framework: NestJS 11 on the Fastify adapter — ADR 0001
- Repository layout: contours are workspace packages, Contour 1 split by portability
  — ADR 0003
- Authentication is **stubbed**, and fails closed. Every route requires a principal
  unless marked `@Public()`; `AUTH_MODE` has no default and an unset or `real` value
  refuses to boot. Use cases take a `Principal`, never a request or a token.
- Time model: lazy evaluation for resources (computed on read, never ticked) plus
  deferred jobs for discrete events (construction completion, troop arrival,
  research). The intended direction, but the ADR is still in draft and unreviewed —
  treat the details as unsettled.

Still open — do not assume an answer, ask before writing code that depends on it:
- Which client is built first — mobile or web
- Validation / schema approach (class-validator vs Zod in a shared package)
- Transaction strategy under NestJS DI
- Database access layer and migration tooling
- Job scheduler and queue
- Event ordering model for simultaneous events on one village
- Client-server contract details and the server-push channel

## Clients

One client is written; the architecture assumes there will be more. Almost nothing on the
server depends on which comes first — only three adapters do: push transport, payment
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
   contract versions at once.

A shared client package is deliberately **not** created up front — a family of zero cannot
be designed for. It gets extracted when the second client appears.

Two consequences land in the schema before any client exists, and are expensive to retrofit:

- **Accounts, not users.** `accounts` plus `identities(provider, external_id)`. One player
  may arrive through Apple, Google, Steam, or email and must be one account.
- **Validation runs on both sides.** Whatever is chosen, the schema must execute in the
  client too — which rules out decorator-based `class-validator` DTOs as the only source.

## Local Development

Everything server-side runs inside the compose stack; do not run pnpm on the host.

```bash
cp .env.example .env          # first time only
docker compose up -d          # postgres + server, server hot-reloads
docker compose logs -f server
docker compose exec server pnpm --filter @expansa/server typecheck
curl localhost:3000/health

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
  `-b` is what makes an edit in `packages/core/kernel` reach the running server.
- A build error in a dependency stops the server from restarting, and it is reported in
  the `tsc` half of the compose output, not the `app` half. Check both before assuming
  the server is serving current code.
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
