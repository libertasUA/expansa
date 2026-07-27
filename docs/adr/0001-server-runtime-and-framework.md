# ADR 0001 — Server Runtime and Framework

- **Status**: Accepted
- **Date**: 2026-07-27

## Context

The server is the authoritative simulation for an MMO strategy game: it owns all game
state, resolves combat, and is the only party allowed to mutate the world. It must
handle concurrent writes to the same entities correctly, run scheduled work, and expose
a typed contract to an Expo client.

Two constraints shape this decision beyond pure technical merit:

- The project is developed by a single person over a long horizon, so structure that is
  enforced by tooling is worth more than structure maintained by discipline.
- Learning value is an explicit, stated goal for this project, not an afterthought.

## Decision

**Runtime: Node.js 24 LTS** (currently 24.18.0). The version is pinned by the
development container image rather than by host tooling, with `engines` in
`package.json` as a secondary guard. TypeScript with `strict: true`.

**Module system: CommonJS on the server.** ESM was the initial intent, but the NestJS
CLI, its watch mode, and decorator metadata emission are all built around CommonJS;
ESM support exists and is fragile enough that debugging it would cost more than it
returns. Code shared with the mobile client lives in `packages/shared` and stays
ESM-compatible, since Metro requires it.

**TypeScript 5.9**, not 7. TypeScript 7 (the native compiler) is released, but
`@nestjs/cli` still pins 5.9.x, and decorator metadata is the least safe area in which
to be an early adopter of a rewritten compiler.

**Framework: NestJS 11 running on the Fastify adapter** (`@nestjs/platform-fastify`).

NestJS is not an alternative to Fastify — it sits on top of it. Fastify remains the HTTP
layer and stays reachable directly when a plugin or a low-level hook is needed.

This ADR covers the runtime and the framework only. How requests are validated and how
transactions are managed are separate decisions with their own trade-offs; see
Open Questions.

## Alternatives Considered

- **Bare Fastify.** Lighter, less magic, faster to start. Rejected because all structure
  would then be convention-only — exactly what a solo, long-lived project erodes first.
  It also offers no dependency injection, which the game model effectively requires: the
  clock must be injectable — otherwise a two-hour construction cannot be tested in less
  than two hours — and Contour 2 engines must receive Contour 3 content through injection
  rather than importing it.
- **Express.** Most widely known, but effectively in maintenance mode. Schema validation,
  serialization, and OpenAPI would each be assembled from third-party middleware, with
  the spec drifting from the code as the default outcome.
- **Hono.** Excellent for edge runtimes. We hold stateful WebSocket connections and
  long-running transactions, so its advantages do not materialize, and its plugin
  ecosystem is thinner for our needs.
- **Bun / Deno as the runtime.** Faster and more pleasant in development. Rejected
  because the dominant technical risk of this project is subtle concurrency and
  transaction behaviour; "the Postgres driver generally works" is a poor position from
  which to debug a lock-ordering bug. The server is expected to be database-bound, not
  CPU-bound, so runtime benchmark wins are largely irrelevant here.

## Consequences

- The module system gives the three-contour architecture a boundary the compiler can
  enforce: a provider not exported from its module is unreachable from outside it.
  Contour boundaries stop being a convention in CLAUDE.md.
- Dependency injection makes an injectable clock, and injected Contour 3 content,
  practical rather than aspirational.
- Development velocity will be lower for the first weeks: the framework is being learned
  while non-trivial game logic is being designed. Failures will be ambiguous between
  "misunderstanding Nest" and "wrong game model". This is accepted knowingly.
- Decorator metadata means the build cannot rely on Node 24's native type stripping;
  compilation goes through `tsc` or `swc`. Standalone scripts without decorators
  (content validation, seeds) can still be run as `.ts` directly.
- CommonJS on the server means dependencies published as ESM-only cannot be `require`d
  directly and need dynamic `import()`. This is a known, recurring friction point when
  choosing libraries.
- `nest start --watch` is not used for local development. It restarts the application
  through an intermediate shell and can fail to kill the previous process, which then
  keeps holding the port while the new one dies — leaving the developer silently
  running stale code. Development instead runs `tsc --watch` and `node --watch`
  side by side, where Node owns the restart of its own child.

## Open Questions

- **Validation and schema approach.** Idiomatic NestJS uses `class-validator` DTOs, but
  this project also needs schemas that run outside Node (React Native, content
  validation scripts). Deferred to its own ADR.
- **Transaction management under DI.** Nest providers are singletons with no notion of
  "the current transaction", while this game will need multi-service work inside a
  single transaction holding row locks. Deferred to the persistence ADR.
- Whether to compile with `tsc` or `swc` is left to the build setup; it does not affect
  application code.
