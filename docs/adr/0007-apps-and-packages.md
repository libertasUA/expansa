# ADR 0007 — `apps/` and `packages/`

- **Status**: Accepted
- **Date**: 2026-07-30
- **Supersedes**: ADR 0004 wholly. Its storage-ownership table and the shape of `server/src`
  are restated below unchanged; its physical layout and its argument for a wide root are
  withdrawn.

## Context

ADR 0004 put every contour package at the repository root, on the argument that opening the
repository should show the architecture without reading a document. It was written four days
after ADR 0003 had made the opposite choice, and its own consequences section conceded that
"someone arriving from another monorepo will look for `packages/`".

Two things have not held.

**The root listing was not carrying its keep.** It showed seven directories of which four did
not exist — a map, by design. What it stated was the contour of each package, and the contour
is not enforced by position: it is enforced by `package.json` resolution and by TypeScript
project references, as ADR 0004 itself said one paragraph earlier. The layout was
documentation, and documentation that has to argue against a convention every reader already
knows is expensive documentation.

**The product now has two sides.** A server and a web client, with a second client possible.
Nothing at the root said they were one product, and nothing said where a second client would
go.

## Decision

Two top-level directories.

```
apps/
  server-side/
    nest/                 the server
    platform/             adapters over adopted technology
    migrations/           one ordered history for the whole database
  clients/
    web/                  React on Vite
packages/
  kernel/                 types, ports, pure functions
  engines/                one package per family of scenarios
  content/                game data
```

`apps/` holds the applications, with backend and frontend under one parent because they are
one product. `packages/` holds what is shared.

### The boundary is the number of consumers, not deployability

This is the half that is easy to read wrong, and reading it wrong misplaces `platform`.

> **More than one application imports it → `packages/`. Exactly one → it lives beside that
> application.**

Today:

| | Consumers |
|---|---|
| `@expansa/kernel` | 4 — the server, the platform, the engine, the client |
| `@expansa/engine-quantity` | 2 — the server and the client |
| `@expansa/platform` | 1 — the server |

`platform` is a library: it has `main` and `types`, no `start`, and is never run on its own.
Under a *deployable versus imported* reading it would belong in `packages/`. It does not,
because it is not shared — the client cannot import it and never will. It sits with its only
consumer.

The consequence is that a package can move later: the day a second application imports
something, it becomes shared and relocates.

### Storage belongs to whoever owns the state

Restated from ADR 0004, unchanged.

| Owner | Tables |
|---|---|
| `platform` | `accounts`, `identities` — infrastructure, no game vocabulary |
| a non-portable engine | its own generic tables, e.g. `transformations`, `scheduled_events` |
| the server | game tables: bases, clans, sectors, fleets |

A generic engine has generic tables, so the no-game-nouns test passes by construction rather
than by discipline.

**A portable engine owns no storage at all.** It also runs in a client, where there is no
database and where importing a table definition would drag a driver into the bundle. Its
checkpoints are persisted by whoever calls it on the server side.

### The shape of the server's `src`

Restated from ADR 0004, unchanged.

```
src/
├── handlers/    the unique effects that engines invoke by name from content
├── wiring/      builds engines from content, injects platform adapters
├── api/         controllers — transport only
└── jobs/        event handlers — transport only
```

`handlers` has a positive definition rather than "rules for which no family was found", which
is what stops it growing. Two checks fall out at startup for free: content naming a handler
that does not exist fails at load rather than at the first click, and a registered handler
that no content mentions is dead code.

## Alternatives Considered

- **Keep the flat root** — ADR 0004's layout, and the status quo, so it costs nothing to
  keep. Rejected: it spends the most-read surface in the repository on stating something the
  package graph already enforces, and it needed a README paragraph explaining the absence of
  `packages/`. A layout that has to be defended against a convention is a layout being paid
  for twice.
- **`packages/` only, with the server and the client as packages among the rest.** This is
  what ADR 0003 had. It is honest — everything *is* a workspace package — but it flattens the
  one distinction that turned out to matter daily: which things are run and which are only
  ever imported.
- **A directory per contour**: `contour-1/`, `contour-2/`, `contour-3/`. The most faithful to
  the architecture and the worst to work in. Contour 1 is mostly adopted, so its directory
  would hold a fraction of what it names, and moving a package between contours — which
  happens, `platform` was `server-runtime` — would become a physical move.
- **Splitting by deployability rather than by sharing**, which is the more common reading of
  `apps`/`packages` and would put `platform` under `packages/`. Rejected because `packages/`
  would then mean two things at once, and the client would be one careless import away from a
  connection pool.

## Consequences

- **The contours are no longer visible in the top-level tree.** That was ADR 0004's whole
  argument and it is being given up knowingly. They remain enforced where they always were —
  pnpm refuses an undeclared import, project references refuse it again, `check-contours`
  catches game vocabulary in an engine — and stated in each package's `CLAUDE.md`.
- **Everything relative broke once**: `extends` and `references` in six `tsconfig.json` files,
  the workspace globs, Drizzle's schema and output paths, two ESLint globs, the Prettier
  ignore and the contour checker's root. Cheap now, and this is the second layout move in
  eight days — a third should be resisted rather than priced.
- **A package with one consumer sits away from the other packages**, so `packages/` is not a
  complete list of the libraries. The count is the rule; the directory is not the index.
- Someone will eventually add a library under `packages/` that only one application uses,
  because that is what the convention means elsewhere. The consumer count is the thing to
  check in review.

## Open Questions

Carried over from ADR 0004, still unanswered.

- **Where game tables live** once there are several: in the server's `src`, or a package of
  their own. Answering early is guessing; the answer arrives with the first migration that
  has more than `accounts` in it.
- **Whether `platform` stays one package** once it holds the database layer, the job runner,
  observability and payment adapters. If it splits, the pieces stay under `apps/server-side`
  until something other than the server imports one.
