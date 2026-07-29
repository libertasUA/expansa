# platform — Contour 1, the platform-bound half

Adapters over adopted technology, and the machinery those adapters share. The root
`CLAUDE.md` is already loaded; this file adds only what applies to writing code *here*
and is not repeated there.

The package does not exist as code yet — it arrives with #13, and these are the rules it
arrives under.

## The contour is chosen, not written

```
Contour 1 = adopted technology (~90%) + the seams between it (~10%)
```

Its heaviest part — PostgreSQL — is not even in `node_modules`; it is a separate process
in a separate container. What belongs here is the **seams**, where neither adopted piece
knows about the other: Drizzle does not know the transaction must reach a NestJS provider;
Nest does not know row locks must be taken in a deterministic order.

Three questions before writing anything in this package:

1. **Is it genuinely absent from the stack?** If it exists, adopt it — even when writing it
   would be "clearer". Understanding is bought by reading documentation and choosing
   carefully, not by reimplementing what is already profiled.
2. **Is it a seam between two adopted things?** If not, it probably does not belong here.
3. **Does it shrink Contour 2?** Removing transaction plumbing from every engine does.
   Catching a class of bug is welcome but is not what this contour is for.

**A runtime dependency added here is a Contour 1 decision** carrying the weight of choosing
the database: adopted infrastructure, where adopting badly costs as much as writing badly
while being harder to see, because nobody reads it. Development tooling does not reach the
running server and is not covered.

## What the marriage means in practice

The root file records that PostgreSQL is married and the query layer is not. Here that
cashes out as: `FOR UPDATE SKIP LOCKED`, advisory locks and partitioning are written
directly and deliberately, while everything touching Drizzle sits behind a repository port
so that replacing it is a week rather than a rewrite.

## Two kinds of thing live here, and only one has a port

- **Implementations of ports** — a provider adapter, a notifier. One of several
  interchangeable things, chosen by configuration.
- **Shared machinery those implementations use** — the pool, the transaction helper, the
  logger. These implement nothing.

`Database` has no port in `kernel` and must not acquire one. The clock has one because
tests replace it; the database does not, because nothing replaces it — ADR 0005.

## Nothing here may abstract over what we married

What goes here is **what is missing from the adopted library**, never a wrapper around it.
Transaction propagation through `AsyncLocalStorage` is missing from Drizzle and from Nest
both, so it belongs here. A generic repository base class does not.

> **If a file can be described as "so that we could swap the database later", it should not
> exist.**

Symptoms: a `Repository<T>` base class, a query builder over the query builder, an
interface named after a technology rather than after a capability.

## No framework

There is no `@nestjs/*` dependency and there must not be, so `@Injectable()` here does not
resolve. Everything is a plain class or function, constructed by ordinary code and handed
to Nest as a value through `useFactory` — ADR 0005.

The point is not purity. A decorated class needs a Nest test module to exercise; a plain
one needs `new`.

## No game vocabulary

`building`, `unit`, `fleet`, `asteroid`, `clan`, `holding` — none of these may appear.
`lockRows` does not know what it is locking. A repository touching `game.*` tables belongs
in `server`, not here; a repository touching `platform.*` tables belongs here.

## Storage

Two PostgreSQL schemas. This package declares and owns `platform.*` only —
`accounts`, `identities`, `entitlements`, `receipts`, `push_tokens`. Game tables are
declared in `server` — #13.

Migrations are a single ordered history at the repository root, because ordering crosses
schemas and there is one database. Definitions are split by owner; migrations are not.

## Settled, awaiting ADR (#13)

Treat as decided; the reasoning is not written down yet.

- **Drizzle ORM** with `drizzle-kit`, over Kysely. Known gap: `CREATE INDEX CONCURRENTLY`
  cannot run inside the transaction the migrator wraps.
- **READ COMMITTED with explicit row locks.** Every use case locks its aggregate root with
  `FOR UPDATE` first; multi-root operations lock in a deterministic order. Retries are for
  deadlock, not the normal path.
- **Transactions propagate through `AsyncLocalStorage`**, adopting
  `@nestjs-cls/transactional` rather than hand-rolling it. Ours is only what it does not
  do: lock ordering, deadlock retry, and the mandatory catch-up from ADR 0002.
- **Migrations run as an explicit command**, never at boot — two instances starting
  together would race for the same migration.

## When to split this package

It will hold the database, auth adapters, payments, notifications, logging and the queue
driver, which share only "not portable, not product". That is low cohesion by construction
and acceptable while it is a handful of files.

> **Split when a third subsystem appears that imports neither of the other two.**
