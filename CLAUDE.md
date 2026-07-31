# Expansa MMO strategy


## Three contours — architecture principle

- **Contour 1** — the tech stack (runtime, storage, protocols).
- **Contour 2** — parameterised modules, configured via schema/policy, not branches.
  Two kinds: domain-agnostic (auth, billing) and game-specific (production, combat).
- **Contour 3** — the product: domain model, data, rules, module configuration.

## Repository layout

```
apps/
  server-side/
    nest/         the server (Contour 3): API, use cases, composition root
    platform/     adapters over adopted technology (Contour 1): DB access, jobs
    migrations/   one ordered history for the whole database
  clients/
    web/          web client
packages/
  kernel/         types, ports, pure functions — no dependencies, runs anywhere
  engines/        game-mechanic engines (Contour 2), shared by server and clients
  content/        game data/schemas (Contour 3), zero TypeScript logic
```

**Shared means imported by more than one application.** A library with a single consumer
stays beside it rather than moving to `packages/` — which is why `platform`, despite being a
library, sits under `apps/server-side` — ADR 0007.

## Stack

Married: changing any row is a project-level decision, not a task.

| | Version | Pinned in |
|---|---|---|
| Node.js | 24 LTS, `node:24-bookworm-slim` | `Dockerfile.dev` |
| TypeScript | 5.9.3, `strict` | `tsconfig.base.json` |
| PostgreSQL | 18, `postgres:18-alpine` | `docker-compose.yml` |
| pnpm | 11.17.0 via corepack | `packageManager` |

NestJS 11 on the Fastify adapter — ADR 0001. Persistence is Drizzle with explicit row locks,
settled in discussion and awaiting ADR #13. `docs/environment.md` holds the reasons behind
the pins, and the traps.

## Running it

**Everything runs in the compose stack. Never run pnpm on the host.**

```bash
cp .env.example .env                              # first time only
docker compose up -d                              # postgres, server, web — all hot-reload
docker compose logs -f server
docker compose exec server pnpm typecheck
docker compose exec server pnpm test
docker compose exec server pnpm lint
docker compose exec server pnpm format
docker compose exec server pnpm db:migrate
curl localhost:3000/health                        # the web client is on 5173
```

A build error in a dependency stops the server from restarting and is reported in the `tsc`
half of the compose output, not the `app` half — check both before believing the server is
running current code. Everything else that costs an hour is in `docs/environment.md`.

## Working

- **Every change starts from a GitHub issue.** No issue, no work.
- **Never push to `main`.** Branch with `pnpm branch issue-<number>-<short-description>`,
  which branches from `main` rather than from whatever is checked out.
- **Take the conflict, not the stack.** Whoever merges second rebases, which costs minutes;
  stacking has cost three pull requests.
- A commit references its issue (`Fixes #12`), and a pull request links the issue it closes.
- **All written artifacts are in English** — ADRs, docs, comments, commit messages, issue and
  pull request bodies — whatever language the conversation is in.
- A change to business logic updates the matching `docs/domain/` file.
- A pre-commit hook formats, lints and checks contour vocabulary; CI runs those plus
  typecheck, tests and the client build.

## Conventions

Anything checkable belongs to Prettier and ESLint — run `pnpm format` and `pnpm lint:fix`,
and read `eslint.config.mjs` for which rules exist and why. What follows cannot be checked:

- **Branded types instead of bare `string` and `number`** wherever confusion is possible:
  `AccountId`, `Timestamp`, `Duration`. Seconds mistaken for milliseconds, in a game where
  every quantity is a function of elapsed time, fails silently and reads as a balance bug.
- **Never `Date.now()` in domain code.** Time arrives from an injected `Clock`, and an engine
  takes the instant as an argument — ADR 0001, ADR 0002.
- **`readonly` on data interfaces.** Anything crossing a boundary is immutable, and engines
  return new values rather than mutating their arguments.
- **Errors carry meaning, not strings.** `kernel` throws built-in error types because it is
  portable and knows nothing about HTTP; the server maps them at the edge.
- **A package's public surface is its `index.ts`**, and exports are named — a default export
  renames itself at every import site.
- **Comments record why**, and are worth most when they say why an obvious approach was
  rejected.

