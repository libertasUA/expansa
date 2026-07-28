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

There is no `packages/` directory: the repository root states the architecture instead.

```
kernel/        types, ports and pure functions — no dependencies, runs anywhere
platform/      adapters over adopted technology: PostgreSQL, jobs, notifiers
engines/       parameterised engines, one package per family of scenarios
contracts/     the client ↔ server surface, versioned
content/       game data — YAML
server/        handlers, wiring, and the only place that sees all three contours
clients/       one package per client
docs/          architecture decisions (docs/adr) and domain notes (docs/domain)
```

Directories not yet present are a map rather than a promise — nothing is created before it
holds something. The reasoning is in `docs/adr/0004-repository-layout-at-the-root.md`; the
rules that keep the boundaries honest are in `CLAUDE.md`.
