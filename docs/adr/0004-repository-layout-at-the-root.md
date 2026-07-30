# ADR 0004 — Repository Layout at the Root

- **Status**: **Superseded wholly by [ADR 0007](0007-apps-and-packages.md).** Everything below
  describes a layout that no longer exists. The storage-ownership table and the shape of the
  server's `src` were the parts still standing, and 0007 restates both — nothing here needs
  to be read to know what applies.
- **Date**: 2026-07-28
- **Supersedes**: the physical layout and package naming of ADR 0003. Its dependency
  rules, the split of Contour 1 by portability, the dual CommonJS/ESM build and the
  project-reference graph all stand unchanged.

## Context

ADR 0003 put the contour packages under `packages/`, with Contour 1 nested a level
deeper in `packages/core/`. Two things have changed since.

**Contour 1 turned out to be mostly adopted rather than written.** PostgreSQL, Node,
Fastify and Drizzle are Contour 1; what we author is the seams between them. A
directory called `core` oversells a hundred and fifty lines of glue, and a name shapes
what gets put inside it — `server-runtime` invites writing a runtime, which is the exact
failure this project needs to avoid.

**Contour 2 turned out to have an adopted half too.** Authentication, payments,
notifications and role systems are bought, not built. Their seams land in the packages
that already exist, so recognising them adds no directory — but it changes what belongs
in the ones we have.

Separately, `packages/` is a convention borrowed from monorepo tooling. It carries no
meaning here, while the contour of a package does.

## Decision

### The repository root states the architecture

```
kernel/        Contour 1 — descriptions: types, ports, pure functions. No dependencies.
platform/      Contour 1 — adapters over adopted technology: Postgres, jobs, notifiers
engines/       Contour 2 — one package per family of scenarios
contracts/     the client ↔ server surface, versioned
content/       Contour 3 — data
server/        Contour 3 — handlers, wiring, and the only composition root
clients/       one package per client
docs/  tools/
```

Opening the repository shows the model without reading a document. The cost is a wider
root listing, which is accepted.

`server-runtime` becomes **`platform`**: we adapt a platform, we do not write a runtime.

### Storage belongs to whoever owns the state

| Owner | Tables |
|---|---|
| `platform` | `accounts`, `identities` — infrastructure, no game vocabulary |
| a non-portable engine | its own generic tables, e.g. `transformations`, `scheduled_events` |
| `server` | game tables: bases, clans, sectors, fleets |

A generic engine has generic tables, so the no-game-nouns test passes by construction
rather than by discipline.

**A portable engine owns no storage at all.** It also runs in a client, where there is no
database and where importing a table definition would drag a driver into the bundle. Its
checkpoints are persisted by whoever calls it on the server side. This corrects ADR 0003,
which said an engine owns its tables without qualification.

### `server/src/domain` becomes `server/src/handlers`

ADR 0003 defined that directory as "rules for which no family was found" — a definition
by negation, and such directories always grow. With the config-versus-handler boundary it
has a positive one: **handlers are the unique effects that engines invoke by name from
content.**

```
server/src/
├── handlers/    invoked by name from content
├── wiring/      builds engines from content, injects platform adapters
├── api/         controllers — transport only
└── jobs/        event handlers — transport only
```

Two checks fall out at startup for free: content naming a handler that does not exist
fails at load rather than at the first click, and a registered handler that no content
mentions is dead code.

## Alternatives Considered

- **Keep `packages/`.** Conventional, keeps the root narrow, and requires no move. The
  move costs one directory today and grows more expensive with every package; the root
  listing is the first thing anyone reads, and spending it on a tooling convention rather
  than on the architecture is a waste of the most-read surface in the repository.
- **Keep `core/` and rename nothing.** The names were actively misleading: `core` for the
  thinnest and most boring package, `server-runtime` for a set of adapters. A name decides
  what people put inside it.
- **A directory for the adopted half of Contour 2.** Rejected once the seams were traced:
  every one of them lands in `kernel` (contract), `platform` (adapter) or `server`
  (product). Adopted things do not get directories, which is the point.

## Consequences

- `kernel` moves from `packages/core/kernel` to `kernel`. Workspace globs, the solution
  `tsconfig.json` and the server's project reference follow it; nothing else does, because
  imports use the package name.
- The move is cheap now, with one package in existence, and would not be later.
- `platform`, `engines/*`, `contracts` and `content` still do not exist. They are a map,
  not directories — nothing is created before it holds something.
- The root listing is wider than convention expects, and someone arriving from another
  monorepo will look for `packages/`. The README should say so.

## Open Questions

- Where game tables live once there are several: `server/src/db/schema` or a package of
  their own. Answering it early is guessing; the answer arrives with the first migration
  that has more than `accounts` in it.
- Whether `platform` stays one package once it holds the database layer, the job runner,
  observability and payment adapters.
