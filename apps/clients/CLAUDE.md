# clients

One package per client. The root `CLAUDE.md` is already loaded; this adds only what
applies to writing one.

`clients/web` is the first, and choosing it does not close the question — mobile stays
possible, which is what the rules below are for.

## Rendering and platform APIs only

Transport, session, local store, cached state and view models are **not** rendering.

```
src/core/    transport, session, store, projections, view models
src/ui/      components, screens, navigation
```

The split exists from the first commit so that extracting a shared client package, when a
second client appears, is a file move rather than a rewrite. Nothing is extracted in
advance: a family of zero cannot be designed for.

## Declare what you can do; nothing is inferred

The server will not branch on platform, and will not read a User-Agent to guess. A client
that needs different behaviour **says so explicitly** — anything left unsaid is not
provided, and a client that quietly relies on being recognised will simply be wrong.

## The contract is versioned and additive

`/v1`, and fields may be added. Removing one or changing its meaning requires a new
version. This is not politeness: a mobile client updates over weeks, so the server serves
several contract versions at once.

`/health` is exempt — infrastructure read by Docker, not a contract anyone pins to.

## Compute, do not poll

The server sends a checkpoint — `amount`, `ratePerSecond`, `capacity`, `at` — not a
computed total, and the client projects from it with the same engine the server used. A
counter ticks every frame without a request.

That is why the engines are portable packages: two implementations of the same arithmetic
would drift, and drift here reads as the game cheating.

**Project against server time, never the local clock.** Take the offset from the `at` in
the last response. A machine five minutes fast otherwise shows a number the server will
refuse to honour.

## Scenery is generated, the ark is drawn

Planets, star fields and system layouts come from a seed, because hand-painted art would
make the art budget the cap on how large a world can be. The ark is the exception: one
design, shared by every player, and the only asset that does not scale with world size.

## What the picture is allowed to know

Two rules from `docs/domain/intro.md` decide what may be displayed at all:

- **Bodies are public astronomy.** Every planet and its orbital slot count is on the map
  from the first day.
- **Occupancy is not.** Who sits in those slots is dark except around home, so an
  unobserved planet shows outlines rather than free berths.

Getting this wrong in the UI leaks information the design depends on withholding.

## Tooling

Vite proxies `/v1` to the server, so the browser sees one origin and there is no CORS to
configure. Everything runs in the compose stack like the rest of the project; a mobile
client would be the exception, needing USB and emulators.
