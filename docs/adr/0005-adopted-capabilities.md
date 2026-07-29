# ADR 0005 — What Contour 2 Adopts, and How an Adopted Capability Is Wired

- **Status**: Accepted
- **Date**: 2026-07-29

## Context

Contour 2 is *parameterised modules*: large capabilities that represent a family of
scenarios rather than one scenario. The definition names authentication, payments,
notifications, workflow, reports, integrations, roles and billing — and every one of
those travels from product to product. That is what makes them worth building well,
and it is also why they are for sale.

CLAUDE.md already records that half of this contour is bought. What it does not record
is **how a bought capability is structured**, and the gap produced three wrong answers
in a single conversation:

- The `Authenticator` port was placed in `server/`, justified as "only the server
  authenticates". That fails the moment the implementation moves to `platform`, which
  cannot import `server`.
- `engines/identity` and `engines/entitlement` were proposed as modules we would write.
  Linking several providers to one account, and normalising three stores' receipts into
  one entitlement, are capabilities every product needs — which is exactly why they can
  be bought. Writing them is the mistake this contour exists to prevent.
- CLAUDE.md says the bought half "needs no new directory". True of the library itself,
  misleading about everything around it: its port, its adapter and its configuration all
  need a home, and each has a different right answer.

## Decision

### 1. Adopt or write is decided before the family threshold

CLAUDE.md requires three members of a family, visible in `docs/domain/` without
inventing them, before an engine is built. That threshold applies **only to what we
write**. A horizontal capability is asked a different question first:

> **Does something adoptable already exist?** If it does, it is Contour 2a and writing
> our own is not allowed — not "discouraged".

Only when nothing adoptable exists does the family threshold apply, and then the module
is Contour 2b and we write it.

This is the same question Contour 1 asks — "is it genuinely absent from the stack?" —
applied one level up. Both exist to stop the most expensive mistake available: writing,
carefully and at length, something already written, profiled and maintained by someone
else.

| | Question | Then |
|---|---|---|
| **2a** — horizontal capability | does something adoptable exist? | adopt it |
| **2b** — domain family | are there three members in `docs/domain/`? | write it |

Worked examples. *Linking Apple, Google, Steam and email identities to one account* —
Better Auth, Clerk, Supabase Auth and Keycloak all do this, so 2a. *Turning incompatible
store receipts into one entitlement* — RevenueCat exists for exactly this, so 2a. *A
timed transformation with a cost, prerequisites and effects, covering construction,
research and ship production* — nobody sells a strategy-game engine, so 2b.

### 2. An adopted capability lands in four places, never one

```
node_modules   the adopted library itself
kernel         the port — what our code talks to
platform       the adapter — what talks to the adopted library
server         the binding, and everything that knows about NestJS
content        the configuration, when the capability is parameterised
```

The library needs no directory. Everything else does, and putting any of it in the wrong
one couples things that must stay apart.

### 3. Ports live where both sides can see them

A port consumed by `server` and implemented by `platform` cannot live in either: the
dependency graph forbids `platform` from importing `server`.

> **A port lives in `kernel` whenever anything outside the consumer implements it.**

This is not a style preference — it is the only placement the package graph permits, and
discovering it late means moving the interface and every import of it.

### 4. Framework-free modules enter NestJS through `useFactory`

```ts
{ provide: AUTHENTICATOR, useClass: StubAuthenticator }              // wrong
{ provide: AUTHENTICATOR, useFactory: () => new StubAuthenticator() } // right
```

`useClass` makes Nest responsible for constructing the object, which requires the class
to carry `@Injectable()` and its dependencies to be resolvable by Nest. The coupling
that `platform` exists to prevent arrives through the constructor.

`useFactory` receives a finished value. We build the object with ordinary code and hand
it over; Nest stores and injects it without its decorators ever touching it.

> **Anything outside `server` enters the framework as a value, never as a class Nest
> instantiates.**

`platform` has no `@nestjs/*` dependency, so this is enforced rather than remembered:
writing `@Injectable()` there does not resolve.

### 5. `platform` holds two kinds of thing, and only one of them has a port

- **Implementations of ports** — a provider adapter, a notifier. One of several
  interchangeable things, selected by configuration.
- **Shared machinery those implementations use** — the connection pool, the transaction
  helper, the logger. These implement nothing.

`Database` has no port in `kernel`, and should not acquire one. We married PostgreSQL:
`FOR UPDATE SKIP LOCKED`, advisory locks and partitioning are used deliberately, and an
interface over them would be paid for continuously against a database change that will
never happen.

The asymmetry explains a question that would otherwise recur: the clock has a port
because it is replaced in tests, the database does not because nothing replaces it.

### 6. Nothing in `platform` may abstract over technology we married

What goes there is **what is missing from the adopted library**, not a wrapper around it.
Transaction propagation through `AsyncLocalStorage` is missing from Drizzle and from
Nest both, so it belongs there. A generic repository base class does not.

The test:

> **If a file can be described as "so that we could swap the database later", it should
> not exist.**

Symptoms: a `Repository<T>` base class, a query builder over the query builder, an
interface named for a thing rather than for a capability.

### 7. `platform` splits when its parts stop needing each other

It will hold the database, auth adapters, payments, notifications, logging and the queue
driver. They share only "not portable, not product", which is low cohesion by
construction. That is acceptable while it is a handful of files and stops being
acceptable later, so the trigger is named in advance:

> **Split when a third subsystem appears that imports neither of the other two.**

## Alternatives Considered

- **Ports in the consumer, next to what uses them.** Reads well and keeps a feature's
  files together. Impossible here for anything implemented outside the consumer, and the
  failure is a resolution error rather than a design argument.
- **Adapters registered with `useClass` and decorated with `@Injectable()`.** Shorter, and
  what most NestJS code does. Rejected: it makes every adapter a Nest artefact, so
  replacing the framework means rewriting the adapters, and testing one requires standing
  up a Nest module rather than calling a constructor.
- **Writing the horizontal capabilities ourselves**, since their normalisation looks
  small — three receipt formats, four identity providers. Rejected because "looks small"
  is how this class of code is always described before store policies, token rotation,
  refund webhooks and account merging arrive. The threshold for writing exists to catch
  this exact optimism.
- **One package per adapter from the start**, rather than one `platform`. Correct
  eventually and premature now; the split trigger above replaces guessing.

## Consequences

- **The auth stub must be rearranged**: the port moves to `kernel`, `StubAuthenticator`
  to `platform`, and `server/auth/` keeps only the guard, the decorators and the route
  policy — the parts that know about NestJS.
- **`engines/identity` and `engines/entitlement` are not to be built.** When those
  capabilities are needed, the work is choosing a provider and writing an adapter.
- **Choosing an adopted capability is a Contour 1 decision** by the existing rule that a
  runtime dependency carries the weight of choosing the database. It gets the same care
  and, if the alternatives are real, its own ADR.
- **Every adopted capability costs four small files rather than one.** That is more
  ceremony than a direct call, and it is the price of the adapter being replaceable and
  testable without a framework.
- Adapters are plain classes, so they are tested by construction rather than through a
  test module. The suite stays fast for the same reason the engines' does.

## Open Questions

- **Which authentication provider** to adopt, once real sign-in is needed. The stub was
  built precisely so that this can be answered late.
- **Whether cross-platform entitlements can be bought at all.** RevenueCat covers mobile
  stores well; web and Steam are thinner, so this may be the case where nothing adoptable
  exists and 2b applies after all.
- **Whether `contracts` follows the same shape** as an adopted capability, or is its own
  thing. It has no adopted library behind it, which suggests the latter.
