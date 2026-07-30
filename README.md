# Expansa — MMO strategy game

MMO strategy game with a sci-fi setting. Node.js + TypeScript server, PostgreSQL, one
client shipping at launch.

## Getting started

```bash
cp .env.example .env
docker compose up -d
curl localhost:3000/health
```

Everything server-side runs inside the compose stack — do not run pnpm on the host.
`CLAUDE.md` has the full development loop and the traps worth knowing about.

## Layout

`apps/` holds the applications, backend and frontend together because they are one product.
`packages/` holds what is shared.

```
apps/
  clients/web/          the client — React on Vite
  server-side/
    nest/               handlers, wiring, and the only place that sees all three contours
    platform/           adapters over adopted technology: PostgreSQL, jobs, notifiers
    migrations/         one ordered history for the whole database
packages/
  kernel/               types, ports and pure functions — no dependencies, runs anywhere
  engines/              parameterised engines, one package per family of scenarios
  content/              game data                                            (empty)
docs/                   architecture decisions (docs/adr) and domain notes (docs/domain)
```

Contour boundaries are workspace packages rather than directories: a package cannot import
what its `package.json` does not declare, and TypeScript project references refuse the same
import a second time. Nothing is created before it holds something, so an empty directory is
a map rather than a promise.

**Shared means imported by more than one application** — that count, not deployability, is
what decides where a thing goes. A library with a single consumer stays beside it, which is
why `platform` sits under `apps/server-side`. ADR 0007. The rules that keep the boundaries
honest are in `CLAUDE.md` and in each package's own `CLAUDE.md`.
