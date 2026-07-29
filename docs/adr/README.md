# Architecture Decision Records

> **An ADR records one decision that had real alternatives and would be expensive to
> reverse: what was chosen, what was rejected and why, and which downsides were accepted
> knowingly.** Frozen once merged, and opened only by someone who wants to change the
> decision — the rule it produces lives in `CLAUDE.md` or `docs/domain/`, because that is
> what gets followed.

Not a transcript of a discussion and not a draft. What is left of the discussion.

## Why they earn their keep

**They protect a decision from whoever can only see the result.** Every deliberate
deviation from the idiomatic looks like an accident to someone who was not in the
conversation. This matters more than usual here, because most of the code is written by
agents whose prior is the average of the internet — and the average NestJS project uses
`useClass`, the average TypeScript project makes ids a union. Undocumented deviations do
not survive contact with a helpful assistant.

**They stop the same argument happening twice.** `engines/identity` was proposed and
reversed within twenty minutes of one conversation. Without a record that reversal gets
re-made later, possibly in the other direction.

**Writing one tests the decision.** This is the least expected benefit and has been the
most valuable. Three errors survived hours of discussion and died the moment someone tried
to write them down connectedly: that warehouse clamping threatens associativity, that
identity linking should be built rather than bought, and that a siege's prize could be a
planetary slot after the ark had become a ship.

## When to write one

Both conditions, not either:

> **A competent person could reasonably have chosen otherwise** — and **reversing it later
> would be expensive.**

Alternatives but cheap to undo → just do it. Expensive but only one sane option → that is
not a decision. There is no ADR for "use TypeScript".

**The subject is not the criterion; the shape of the decision is.** "Architecture" in the
name is historical. Monetisation qualifies — the alternatives were real, the reversal is
the most expensive in the project, and the downsides were accepted knowingly. "What a base
is" does not: it is a fact about the world, and facts belong in `docs/domain/`.

## When not to write one

**Before the decision has been worn.** ADR 0003 was superseded four days after it was
written, because it described a layout with nothing in it yet. ADR 0001 was written just as
early and still stands.

> **Adopted technology can be chosen on paper — the alternatives are knowable from outside.
> Our own structure has to be exercised first.**

**When it is a rule rather than a decision.** "Comments explain why, not what" never had an
alternative worth rejecting. It is a convention, and conventions live in `CLAUDE.md`.

## How they are used

Almost never read.

> **An agent should not have to open an ADR to complete a task.** If it does, a rule is
> missing from `CLAUDE.md`.

The interface between the two is one line — the rule in the imperative, with the number
appended:

```
Anything outside `server` enters the framework as a value through `useFactory`,
never as a class Nest instantiates — ADR 0005.
```

The reasoning stays behind. "Why" has no imperative form, and whoever is executing does not
need it; whoever wants to argue opens the number.

> **Every ADR must leave a line in `CLAUDE.md` or `docs/domain/`, or it has no effect on
> what gets built.**

The arrow runs one way. An ADR always produces a rule; most rules have no ADR behind them,
and a rule without a number is normal rather than a gap — it means nobody thought it worth
arguing about.

## Superseding

Status moves `Proposed → Accepted → Superseded`. `Proposed` is not ceremony: ADR 0002 sat
in that state for two weeks because the domain questions it depended on were unanswered.

**Content is frozen after merge; status is not.** Marking a document superseded is the
mechanism of superseding, not an edit to it.

> **Supersede wholly or not at all.** ADR 0004 replaced part of 0003 and left the rest
> standing, so both must now be read and reconciled to know what applies. If a new decision
> touches most of an old one, restate the remainder and retire the old document entirely.

## The sections are not equally valuable

| Section | Worth |
|---|---|
| **Alternatives Considered** | Highest. This is what ends the re-argument, and it should name the option someone will actually propose — usually the idiomatic one — not only what was deliberated. |
| **Consequences** | High, and the downsides matter more than the upsides. An accepted cost that goes unrecorded reads as an oversight and gets "fixed". |
| Context | Necessary, prone to bloat. |
| Decision | Prone to absorbing the rules that follow from it. Those belong in `CLAUDE.md`; this section states the decision. |

## Index

| # | Status | Decides |
|---|---|---|
| [0001](0001-server-runtime-and-framework.md) | Accepted | Node 24 LTS, CommonJS on the server, TypeScript 5.9, NestJS on the Fastify adapter |
| [0002](0002-time-model.md) | Accepted | Quantities are computed from a checkpoint rather than ticked; events are scheduled. **A rate may never depend on an amount** — which constrains game design, not just code |
| [0003](0003-repository-layout.md) | **Partially superseded by 0004** | Contours are workspace packages. Its dependency rules, portability split, dual CJS/ESM build and project-reference graph still stand only here |
| [0004](0004-repository-layout-at-the-root.md) | Accepted | The layout lives at the repository root; who owns which tables; `server/src` |
| [0005](0005-adopted-capabilities.md) | Accepted | What is adopted rather than written, and where each piece of an adopted capability lands |

## Decisions that meet the bar and have no ADR

Found by the audit in #48. Each currently survives somewhere it will not be looked for.

| Decision | Lives in | Why it qualifies |
|---|---|---|
| **Monetisation** — nothing affecting the outcome is ever sold | `docs/domain/intro.md`, already written in ADR shape | Pay-to-win is the industry default and was rejected explicitly; the reversal is the most expensive in the project; it has already forbidden one mechanic and was argued three times in a single session |
| **Finite worlds** — a world runs one to two years and ends | `docs/domain/intro.md` | Eternal servers, seasons and vote-driven wipes were all real alternatives; retention, the schema and the win condition all hang off the answer |
| **Web as the first client** | two lines in `CLAUDE.md`; the reasoning is in the description of PR #40 | A second client is a separate codebase, and the reasoning currently survives only in a merged pull request |
