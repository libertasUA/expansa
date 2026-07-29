# engines — Contour 2, the half we write

One package per family of scenarios. The root `CLAUDE.md` is already loaded; this adds
only what applies to writing an engine.

## Before writing one at all

**Does something adoptable already exist?** Authentication, payments, notifications, roles
and billing are horizontal capabilities that every product needs, which is exactly why they
are for sale. If it can be bought, writing it here is not allowed — ADR 0005.

Only when nothing adoptable exists does the family threshold apply:

> **At least three members of the family must be listed from `docs/domain/` without
> inventing them.**

One product and one developer means generalisation is paid for immediately and amortised
only within this game. A module built for a family of one is a liability.

## Meeting the acceptance criterion

The criterion itself is in the root file. What it means while writing code here:

- **An id is a `string`, never a union.** The moment it becomes `'energy' | 'fuel'`, adding
  a quantity means editing this package and the criterion is gone.
- **Definitions arrive through the constructor**, never by import. An engine that imports
  content has fused itself to one product.
- **A new *kind* of mechanic is engine work** and that is legitimate. A new instance of an
  existing kind is not.

## What an engine is

A set of functions built from configuration, not a class that imports content.

```ts
const quantities = createQuantityEngine(definitions);
quantities.project(checkpoint, at);
```

| Property | What it buys |
|---|---|
| Config arrives as an argument, never by import | a new entity costs no code |
| All state arrives as arguments — no hidden reads | testable without a database |
| No clock and no randomness; the instant and the seed are parameters | a battle report replays months later |

Purity is a property most engines have, **not the definition**. A pure function handling
one specific case is a handler, not an engine. The question is always: *is this the same
mechanism applied to many things?*

## Config or handler

Configuration expresses **what**; a handler expresses **how**, when the how is genuinely
unique, and is invoked by name from content.

Both extremes fail. All-config invents a programming language with no debugger and no
types. A handler per entity puts Contour 3 back to writing code for every building.

> **The smell: a condition appearing in config means a handler was needed.**

An upgrade cost is a formula in config — every building has one of the same shape. "A clan
outpost grants entry to a sector when built" is a handler; expressing it as data would drag
sector access into the schema.

## The time invariant

From ADR 0002, and it constrains what an engine may model at all:

> **A rate must be piecewise-constant and must never depend on an amount.**

Clamping is fine — `min(a + r·Δ, C)` composes, because clamping is monotone and rates are
non-negative. What breaks is a rate that changes at an instant determined by the value being
computed. A mechanic wanting production to halt on a full store, or units to starve as a
stock runs out, is reformulated rather than supported; five ways out are listed in ADR 0002.

## Dependencies

**`kernel` and nothing else in the repository.** An engine that needs more was drawn wrong:
it declares a port, `platform` implements it, `server` connects them.

No game vocabulary — `building`, `unit`, `fleet`, `asteroid`, `clan`. An engine knows about
"a timed transformation with a cost, prerequisites and effects"; that construction and
research are instances of it is a fact of Contour 3.

## Storage

**A portable engine owns no storage at all** — it also runs where there is no database, and
importing a table definition would drag a driver into a client bundle. Its state is
persisted by whoever calls it. A non-portable engine may own generic tables, which live in
the `game` schema alongside the product's.

## Tests

`node:test`, run against the compiled output. `@types/node` is a devDependency of the tests
only; the engine itself builds with `types: []`, so reaching for `process` or `Buffer` fails
to compile rather than silently ending the package's portability.

Tests double as the contract. Someone reading `engine.test.ts` should learn what the engine
does without opening the implementation.
