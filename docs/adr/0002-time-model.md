# ADR 0002 — Time Model: Lazy Quantities and Scheduled Events

- **Status**: Accepted
- **Date**: 2026-07-29

## Context

Everything in this game happens over time. Energy accrues, a compartment takes
minutes to restore, a convoy is hours in transit. One question underlies all of it:
**how does the server know the state of the world at an arbitrary instant?**

The obvious answer is a tick — walk every holding every N seconds and credit what
has accrued. It breaks in three ways, and all three are expensive to discover late:

- **Load follows world size rather than activity.** Ten thousand holdings mean ten
  thousand writes a second, forever, whether anyone is playing or not. A dead world
  costs as much as a live one.
- **A tick that falls behind is silently wrong for everybody at once**, and the
  symptom reaches us as "my resources look off" rather than as an alert.
- **A second server doubles every credit**, so there is no way to scale out.

The observation that replaces it: a quantity's value is *nobody's business until
somebody asks*, and it is **computable**. Knowing the amount at 14:00 and the rate,
the amount at any later instant is arithmetic.

## Decision

### 1. Continuous quantities are computed, never credited

The database stores a **checkpoint** — the state at a known instant:

```
holdings(id, world_id, account_id, kind, checkpointed_at, quantities jsonb)
```

```json
{ "energy": { "amount": 47994, "ratePerSecond": 1.5, "capacity": 50000 } }
```

The current value is a pure function of the checkpoint and the instant asked for.
**Reading performs no writes.** A holding nobody has touched for a month costs
nothing and is still correct the second someone attacks it.

`checkpointed_at` belongs to the row rather than to each quantity: every quantity of
a holding is always projected to the same instant, and splitting that would create
states where they disagree.

`quantities` is `jsonb` rather than a column per resource, because a column per
resource makes adding a resource a migration — and the acceptance criterion for a
Contour 2 engine is that a Contour 3 entity costs zero lines of code. The cost is
that a typo in a quantity id stores silently; it is caught by validating content at
boot, which is where every other content typo is caught.

### 2. The invariant: a rate may never be a function of an amount

Projection is only correct if the rate is constant across the interval it covers.
From that follows the single rule this whole model rests on:

> **A rate must be piecewise-constant, and must never depend on the amount.**

Otherwise the rate changes at an instant determined by the very value being
computed — to know the value you need the instant, and to know the instant you need
the value.

**Clamping does not violate this.** `min(a + r·Δ, C)` composes: projecting to `t₂`
equals projecting to `t₁` and then `t₁` to `t₂`, because clamping is monotone and
rates are non-negative. The value stops; the rate does not change. That distinction
sounds verbal and is load-bearing. An earlier draft of this ADR claimed clamping
threatened associativity — it does not, and `engines/quantity` proves it over
generated inputs.

**Reaching a ceiling is not an event.** Nothing is written when a store fills. There
is no row, no notification, no scheduled job — the formula keeps answering correctly
for a minute afterwards or a month.

Negative rates are rejected outright. Continuous upkeep is exactly the banned shape:
a stock running out at a moment determined by the stock.

### 3. Every mutation catches up before it changes anything

```
project to the instant of the change → apply it → store the new checkpoint
```

Skipping the first step charges a spend against a stale balance and discards the
production in between. This is enforced by construction rather than by discipline:
`spend`, `credit` and `setRate` project internally, so there is no way to call them
against an un-caught-up state.

### 4. Discrete events are scheduled, and only some must be executed

Not everything is a curve. A restoration completes, a convoy arrives, a battle
resolves. These have side effects — losses on both sides, reports, notifications —
and side effects cannot be produced lazily, because "lazily" means "when someone
asks", and the person affected is not the one asking.

Each is scheduled at an instant computed when it starts:

```
scheduled_events(id, world_id, holding_id, kind, payload jsonb, scheduled_at)
```

There is no periodic scan for work that is due in the sense of a tick; there is a
scheduler that takes what is due. Which scheduler is #15 and is not decided here.

**Not every event needs executing, though**, and the criterion is worth stating:

> **An event must be executed by the scheduler if its effects are visible to anyone
> other than its owner. Everything else may be settled at the next read or write.**

A synthesis order completing at 14:40 for a player who returns at 19:00 produces an
identical world either way — it happened at 14:40 by every calculation, only the row
was written later. A fleet arriving does not have that property.

This keeps tens of thousands of pending private orders out of the queue while
leaving push where it is actually needed.

### 5. One source of time

All instants are UTC milliseconds, obtained from an injected `Clock`. `Date.now()`
in domain code is forbidden: without a clock that can be moved by hand, a two-hour
restoration cannot be tested in less than two hours and a battle cannot be replayed.
Engines never read a clock at all — the instant is a parameter, which is what makes
them reproducible.

### 6. The client runs the same projection

Since the value is computable from the checkpoint, anything holding the checkpoint
can compute it. The server sends `{amount, ratePerSecond, capacity, at}` and the
client extrapolates locally, so a counter ticks every frame without a request.

This is why `engines/quantity` is a portable package rather than server code: two
implementations of this arithmetic would drift, and drift here looks like the game
cheating.

**Both sides must use the same clock.** The client projects against *server* time,
derived from the `at` in the last response, not against its own — otherwise a player
whose machine is five minutes fast sees a number the server will not honour.

## Design constraint: mechanics must pass a test

This ADR constrains game design, not just implementation. Every new mechanic has to
answer:

> **Can a rate change at an instant nobody scheduled?**

If yes, the mechanic is reformulated rather than the model being propped up. Five
ways out, in order of preference:

1. **Make it an order rather than a process.** Synthesis converts energy to fuel as
   a batch with a fixed duration, not as a continuous conversion whose input can run
   dry.
2. **Make it a discrete event at a known instant.** A newcomer's shield expires on a
   date; it does not thin out.
3. **Move the quantity in steps at events.** Asteroid depletion happens when a
   convoy departs with its load, not continuously as a negative rate.
4. **Roll randomness in advance.** "A 5% chance each hour" becomes a seeded roll at
   scheduling time producing a concrete event at a concrete instant — the same
   treatment combat already gets.
5. **Accept a fan-out write**, for small bounded groups only.

Known cases already implied by the concept:

- **Asteroid depletion** — finite deposits are in `docs/domain/intro.md`. Modelled
  continuously, the exhaustion instant moves every time a complex is added or
  destroyed. Option 3 above is the intended answer and needs settling before
  extraction complexes are built.
- **Clan and neighbourhood bonuses** — a rate that depends on another player's state
  goes stale silently when that player acts. A bonus affecting a *rate* may only
  span a small bounded group, such as one orbit. Clan-wide effects must be one-off
  rather than rate-altering.
- **Production chains** — a refinery consuming one resource to produce another
  couples two rates and dries up at an amount-dependent instant. Option 1.

Mechanics deliberately avoided for this reason, by changing the design rather than
the model: fleet upkeep (fleet size is capped by shipyard berths), production halting
on a full store (the excess is simply lost), and desertion.

## Alternatives Considered

- **A global tick over all holdings.** Rejected: load scales with world size rather
  than activity, lag distorts the world for everyone at once and silently, and a
  second process doubles every credit.
- **A tick over active players only.** Half a solution. Inactive holdings still
  accumulate and must be correct at the instant somebody attacks them, so the lazy
  projection has to be written anyway — and then a tick sits on top of it, doing the
  same arithmetic twice with two chances to disagree.
- **Event sourcing — state as a fold over a log.** Excellent auditability and
  reproducibility, and genuinely tempting for battle history. Rejected as the primary
  model: reading a holding's state becomes proportional to its history, and the log
  grows without bound. A checkpoint is the opposite trade — a world that has run for
  a year costs the same to read as one that has run for a day. A narrow event journal
  is still worth having for reports.
- **A column per resource.** Fast and typed, and how the genre usually does it.
  Rejected because it makes adding a resource a schema migration, which is exactly
  the coupling Contour 2 exists to remove.

## Consequences

- **Writes are proportional to activity, not to time or world size.** A day of play
  with a few actions is a handful of rows; a day of absence is none.
- **There is no history to recompute.** Each change overwrites one row, and what came
  before is already accounted for in its value. This is the property that makes the
  question "won't we have to recompute everything?" have the answer "there is nothing
  to recompute".
- **Odd instants cost nothing.** Time is a number of milliseconds, not a slot in a
  grid: an event at 21:21:34.891 is written as 21:21:34.891 and the next projection
  starts exactly there. There are no ticks, buckets or rounding anywhere in the model.
- **Floating-point error does not accumulate**, because each projection recomputes
  from the checkpoint rather than adding to the previous result. A tick would compound
  its error 86 400 times a day; this compounds it once per write.
- **A bug in the projection affects the entire world.** It is Contour 2 code, covered
  by property tests over generated inputs, and both the server and the client depend
  on it being identical.
- **Balance patches that change a rate leave every stored checkpoint stale**, since
  the rate is stored as a derived value rather than recomputed from its sources. A
  patch is therefore an operation with a migration, not just new content. See Open
  Questions.
- **Settling on read does not persist**, so until a scheduler exists a player who only
  reads accumulates completed-but-unwritten orders, and every read replays them. It is
  self-limiting once #15 lands; it is unbounded until then.

## Open Questions

- **Which scheduler** executes due events — #15. This ADR fixes only the principle and
  the criterion for what must be pushed.
- **Ordering and idempotency** when events coincide or a worker fails mid-apply — #16.
- **Asteroid depletion**, per the design constraint above. Needed before extraction
  complexes exist.
- **What a balance patch does to stored rates**: recompute every checkpoint in a
  migration at a known instant, which is honest and expensive once; or let each
  holding pick up the new rate on its next write, which is cheap but means an absent
  player accrued at the old rate for a week. The first is preferred but not settled.
