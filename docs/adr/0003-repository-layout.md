# ADR 0003 — Repository Layout and Contour Boundaries

- **Status**: Accepted
- **Date**: 2026-07-28

## Context

CLAUDE.md defines three contours and forbids the outer ones from leaking into the
inner ones. Until now that rule had no representation in the repository: everything
lived under `server/`, and `import '../../../engines/transform'` compiles perfectly.
A boundary that exists only in a document survives exactly as long as someone
remembers it, and ADR 0001 already records the opposite preference — structure held
by tooling beats structure held by discipline.

Two further constraints arrived after CLAUDE.md was written:

- Some Contour 1 and Contour 2 code must run on a **client**, not only on the server.
  ADR 0002 has the client extrapolating resource counters locally from a checkpoint,
  which means the projection function is bundled by a client toolchain.
- **Which client** — mobile or web — is not decided, and a Steam build would be the
  web client in a desktop shell. The layout must not presume a platform.

## Decision

### Contours are workspace packages, not directories

A package cannot import what its `package.json` does not declare: under pnpm's strict
`node_modules` the resolution simply fails. TypeScript project references refuse the
same import a second time, at compile time. Neither depends on anyone remembering the
rule.

```
packages/
├── core/                     Contour 1
│   ├── kernel/               portable, dependency-free
│   └── server-runtime/       platform-bound: Postgres, transactions, jobs
├── engines/                  Contour 2 — one package per family of scenarios
├── contracts/                the client ↔ server surface, versioned
└── content/                  Contour 3 — data
server/                       Contour 3 — code, and the only composition root
clients/                      one package per client
```

Dependency direction, and nothing flows back:

```
server  →  engines  →  kernel
   ↓                     ↑
server-runtime ──────────┘
```

`server` is the only place that sees all three contours at once.

### Contour 1 splits in two, on portability

- **`kernel`** — types, ports, pure functions. No dependencies, no platform. Ships to
  the server and to every client.
- **`server-runtime`** — implementations bound to a platform: connection pool,
  transactions, migrations, job execution.

The criterion is **portable versus platform-bound**, not pure versus impure. A clock
reading `Date.now()` is impure but works identically in Node, a browser and React
Native, so it belongs in `kernel`; duplicating it per platform would be worse than
admitting one impure function. A Postgres pool is not portable and belongs in
`server-runtime`.

Consequence for Contour 2: **an engine depends on `kernel` and on nothing else in the
repository.** It declares what it needs as a port, `server-runtime` implements the
port, and `server` connects the two. An engine is therefore testable against an
in-memory fake, with no database and no container.

### Portable packages are built twice

`kernel` and every portable package emit CommonJS for the server and ESM for a client
bundler, selected through the `exports` map. Nothing consumes the ESM build yet — no
client exists — but building it from the first commit is what stops CommonJS-only
idioms (`require`, `__dirname`, `export =`) from settling into a package whose entire
purpose is to be portable.

Declarations are emitted from the CommonJS build only, so the two outputs cannot
drift apart on a type.

### The build is a project-reference graph

The root `tsconfig.json` holds no sources and lists the projects. `tsc -b` orders the
builds, and the server's watch loop (`tsc -b --watch .`) rebuilds `kernel` on change,
so a cross-package edit reaches the running process without a manual step.

### Nothing is created before it holds something

Created now: `kernel`, and `clients/` as an empty, platform-neutral home.

Not created: `server-runtime`, `engines/*`, `contracts`, `content`, and any shared
client package. CLAUDE.md requires three visible members before a family becomes a
module; a package with no content is a directory with ceremony. The map above records
where each will sit when something real needs to go in it.

## Alternatives Considered

- **Directories inside `server/src` plus an ESLint import rule.** Cheapest, and it was
  the starting point. Rejected because it cannot express the requirement that some of
  this code is bundled by a client toolchain: a directory in the server project is not
  installable by anything else. The lint rule is still worth having *inside* the
  server, for the layering between `api/`, `jobs/` and the rest.
- **One package per contour — `contour1`, `contour2`, `contour3`.** Fails on the first
  real case: Contour 1 holds both a `Timestamp` type the client needs and a Postgres
  pool that must never reach it. The split has to be by portability, which cuts across
  contour numbering.
- **A single `shared` package, as originally scaffolded.** The name answers no
  question — whether Postgres may be imported from it, whether game content may. It
  accumulates whatever is convenient. Deleted by this ADR.
- **Publishing Contour 1 and 2 to a registry now.** Consistent with the idea that they
  are reused across products, but there is one product and one developer; versioning
  and release ceremony would be paid for immediately and returned never. Workspace
  packages keep the boundary without the ceremony, and extracting them later is a
  `package.json` change.

## Consequences

- Adding a Contour 2 engine means adding a package with `kernel` as its only
  dependency. If it turns out to need something else from the repository, that is the
  signal the boundary was drawn wrong — the failure is a resolution error rather than
  a review comment.
- `nest build` is no longer used; the server builds with `tsc -b .`. The Nest CLI
  builds one project and knows nothing about references, so it would silently compile
  against stale declarations from a dependency.
- The dev loop gains a second thing to keep working. `tsc -b --watch` is watching two
  projects, and a build error in `kernel` now stops the server from restarting — which
  is correct, but the failure appears in the `tsc` half of the output rather than the
  `app` half.
- The ESM build has no consumer and no test. It will be exercised for the first time
  when a client is written, and problems will surface then; the cost of that is
  accepted in exchange for the sources staying portable in the meantime.
- Deleting `mobile/` in favour of `clients/` removes a platform assumption from the
  tree itself.

## Open Questions

- **Where the API contract types live** once there is more than `/health`. They belong
  outside `server/`, in a package both sides depend on, but the shape of that package
  is bound up with the validation decision (#14) and is deferred to it.
- **Whether `server-runtime` stays one package.** It will hold the database layer, the
  job runner, observability and payment adapters. That may want splitting; there is no
  evidence either way yet.
- **How Contour 3 content is loaded and validated** at boot, and whether `content` is
  a package of data or a package of data plus its loader.
