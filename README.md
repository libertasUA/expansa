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

What runs is under `apps/`; what is imported is under `packages/`.

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

**The layout has no ADR yet** — #66. ADR 0004 described the flat root this replaced and is
marked superseded; the rules that keep the boundaries honest are in `CLAUDE.md` and in each
package's own `CLAUDE.md`.
