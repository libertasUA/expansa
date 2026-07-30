# server — Contour 3, the product and the composition root

The only package that sees all three contours. The root `CLAUDE.md` is already loaded;
this adds only what applies to writing code here.

```
server/src/
├── handlers/    unique effects, invoked by name from content
├── wiring/      builds engines from content, injects platform adapters
├── api/         controllers — transport only, zero logic
└── jobs/        event handlers — transport only, zero logic
```

**Not yet settled: where use cases live.** ADR 0004 named `handlers`, `wiring`, `api` and
`jobs` and said nothing about the operations a player initiates, which is why `ark/`
currently sits beside `auth/` — an accident rather than a decision. See #42.

## What the server owes every client

There will be more than one client, and the server is where that is honoured or lost:

- **The server never knows which client is talking to it.** No branching on platform, and no
  reading a User-Agent to guess. A client that needs different behaviour asks for it.
- **The contract is versioned and additive.** Fields may be added to `/v1`; removing one or
  changing its meaning needs a new version, because a mobile client updates over weeks and
  several versions are served at once. `/health` is exempt — it is infrastructure read by
  Docker, not a contract anyone pins to.

## Game tables reference the player, not the account

The account id is `platform`'s and outlives a world — ADR 0006. A game table therefore
references **who a player is in a world**, a separate round-scoped row, and never the
account directly. Anything round-scoped that attaches to the account has to be migrated the
first time a second world opens.

## Every route requires a principal

The global guard denies by default; `@Public()` is the opt-out and there are two of them,
both under `v1/auth`. A route that needs no principal says so — a guard that has to be
remembered per controller is one that gets forgotten on the controller that mattered.

Authentication is currently stubbed. `docs/environment.md` has what that means while
developing.

## Catch up before you mutate

Every change to a holding follows the same order, from ADR 0002:

```
project to the instant of the change → apply it → store the new checkpoint
```

Applying a spend against a stale checkpoint charges it to an old balance and throws away
the production in between. Nothing reports it.

The engine operations project internally, so calling `spend`, `credit` or `setRate` cannot
skip it. What can still be forgotten is settling completed events before doing anything
else, so a repository should not hand out a holding without the instant it is wanted for.

## Which events the scheduler must run

Not all of them, and the criterion is from ADR 0002:

> **An event must be executed by the scheduler if its effects are visible to anyone other
> than its owner. Everything else may be settled at the next read or write.**

A synthesis completing while its owner is away produces an identical world whether it is
written then or on their return. A fleet arriving does not — the other player has to learn
of it. Getting this wrong in the cheap direction leaves tens of thousands of private orders
in a queue; in the expensive direction, an event that never fires for anyone who stopped
playing.

## Reads write nothing

A read may settle completed events to answer correctly, and must not persist that. The
next write settles them again identically, which is safe because projection is associative
— ADR 0002.

## Transport holds no logic

`api/` and `jobs/` are twins and equally thin: parse the input, build a command, call the
use case. The same operation must be reachable from both, which is the check that logic is
detached from transport. It matters more here than usual, because most world mutations
arrive from the scheduler rather than from a request.

## Use cases take a `Principal`

Never a request, a token or a session. The same use case is invoked over HTTP, from a job
handler and from a script, and only one of those has a request to read.
