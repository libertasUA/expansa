# ADR 0000 — Template

- **Status**: Template
- **Date**: —

<!--
Read README.md first if you are unsure whether this decision needs an ADR at all.
The bar is both conditions, not either: a competent person could reasonably have
chosen otherwise, AND reversing it later would be expensive.
-->

## Context

The problem being solved, the constraints in force, and what is known at the time of the
decision.

Keep it short. This is the section that bloats, and a reader who needs the full background
is usually looking for a domain document rather than this one.

## Decision

What was decided. State it so that it is checkable: a reader should be able to tell whether
a given piece of code violates it.

**State the decision, not the rules that follow from it.** Rules go to `CLAUDE.md`, which is
what gets loaded and followed. If this section is turning into a list of instructions, they
belong somewhere else.

## Alternatives Considered

- **Option A** — why it was rejected.
- **Option B** — why it was rejected.

The most valuable section, and the reason the document exists: it is what stops the same
argument happening a second time.

**Name the option someone will actually propose**, which is usually the idiomatic one — not
only the options that were deliberated. Someone arriving with "wouldn't `useClass` be
simpler here" should find their own thought already answered.

## Consequences

What gets easier, what gets harder, what obligations this places on the code, and what new
risks it introduces.

**Record the downsides accepted knowingly.** An unrecorded cost reads as an oversight to
whoever finds it, and gets "fixed": four small files where one direct call would do looks
like bloat unless it is written down that this was the price.

## Open Questions

What was deliberately deferred, and what signals should bring us back to it.

<!--
Before merging: which line does this leave in CLAUDE.md or docs/domain/?

An ADR that directs nobody has no effect on what gets built — nothing loads it during
normal work, and nothing should have to.
-->
