# The local environment, and the traps in it

Everything here was learned the expensive way. None of it is needed to write a use case,
which is why it is not in the root `CLAUDE.md` — open it when the stack, the build or the
watch loop behaves in a way that makes no sense.

The rule that *is* in the root file, because breaking it is the most likely mistake and it
costs an afternoon: **everything runs in the compose stack, and pnpm is never run on the
host.** A mobile client would be the exception, needing USB and emulators.

## Containers

- **Debian, not Alpine, for the Node image.** glibc versus musl matters the moment
  `node_modules` is bind-mounted from an Ubuntu host.
- **The database is published on host port 5435.** Ports 5432-5434 belong to
  system-installed PostgreSQL clusters on this machine, and quietly talking to the wrong
  database is expensive to diagnose. Inside the compose network it is `postgres:5432`.
- **PostgreSQL 18 mounts `/var/lib/postgresql`**, not `/var/lib/postgresql/data` — 18+
  expects a version subdirectory so that `pg_upgrade --link` works.
- **Images are pinned to a major version, never `latest`.**
- If `docker compose` cannot reach a daemon, the active context is Docker Desktop and it is
  not running: `docker context use default`.

## The watch loop

The dev loop is `tsc -b --watch` plus `node --watch`, **not** `nest start --watch`. The
latter can leave the old process holding the port and silently serve stale code. The `-b` is
what makes an edit in `packages/kernel/` reach the running server.

- **A build error in a dependency stops the server from restarting**, and it is reported in
  the `tsc` half of the compose output, not the `app` half. Check both before assuming the
  server is serving current code.
- `nest build` is not used anywhere: it knows nothing about project references and would
  compile against stale declarations.

## Building

- **Never share a `tsbuildinfo` between an emitting build and `tsc --noEmit`.** The second
  build sees "up to date" and emits nothing, leaving an empty `dist`. The server's
  `typecheck` passes `--incremental false` for this reason; composite projects cannot, so
  they use `tsc -b --force` instead.
- **Portable packages build twice** — CommonJS for the server and ESM for a client bundler,
  selected by the `exports` map. Declarations come from the CommonJS build only.
- The server is **CommonJS**, because NestJS tooling requires it — ADR 0004.
- **Not TypeScript 7 yet**: `@nestjs/cli` still pins 5.9.x.

## pnpm

- **pnpm blocks dependency install scripts**, which is the right default. `esbuild` is
  allowed in `pnpm-workspace.yaml` because Vite cannot start without its native binary;
  anything else added there is a deliberate exception.

## Authentication in development

`AUTH_MODE` has **no default**. Unset refuses to boot, and so does `real`, which is not
implemented. `stub` refuses to boot when `NODE_ENV=production`.

In `stub` mode the token returned by sign-in **is** the account id, so any well-formed UUID
works as a bearer token:

```bash
curl -X POST -H 'Content-Type: application/json' \
     -d '{"login":"roma@example.com","password":"correcthorse"}' \
     localhost:3000/v1/auth/register
```

`.env.example` documents the variable itself.
