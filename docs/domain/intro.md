# Expansa — Game Concept

Working document. It describes what the game *is*, so that technical decisions have
something to be derived from. Sections marked **Open** are unanswered; each notes what it
blocks, because several of them constrain the data model rather than just the design.

## Concept notes

Captured as stated by the author, before structuring. Where these conflict with anything
below, these win and the section below is what needs updating.

- Expansa is a game about **building a base in space** and **active interaction between
  players**.
- What the base physically *is* — a station, a planet, an asteroid, or something else —
  is not decided yet.
- The map is divided into **sectors**, along the lines of solar systems within a galaxy —
  a hierarchical space rather than one flat coordinate grid.
- Every sector should have its own **unique, visually striking space artwork**. Sectors
  are meant to feel like distinct places, not interchangeable cells.
- A minimal sector holds roughly **50 players** — enough for active interaction, while
  still being far enough apart from one another.
- Players are **not visible by default**. Finding them requires either launching **probes**
  or building **static reconnaissance outposts**, and those outposts can be destroyed.
- Players can enter into **agreements**: resource-exchange deals and non-aggression pacts.
  These are in-game contracts rather than informal chat arrangements.
- **Asteroids appear on the map from time to time** as finite, depletable resource
  deposits, meant to be fought over.
- The emphasis is on **clans**: clan progression, communication, and clan war. This is the
  centre of the game rather than a feature attached to it.
- Clans get a **customisable clan page**.
- Clans can build **clan outposts**, which grant entry into a sector.
- A player can hold **more than one base**. Secondary bases can be destroyed or captured,
  but the **primary base is never lost**.
- Military strength is an **interstellar fleet**.
- Tentative: a **flexible weapon upgrade system**, so ships are configured rather than
  merely unlocked.
- The **resource set is undecided**, as is whether **desertion** exists at all.
- Worth doing: write a **minimal history of the world** and derive the rest from it.

## The spine: intelligence is what makes clans necessary

Three of the rules above are one idea, and it is the most valuable thing in the concept.
Players are invisible, reconnaissance is expensive and destructible, and clans are the
centre. Together they mean **scouting is expensive for an individual and cheap for a
group**, because intelligence pools: fifty people sharing a map see a sector none of them
could see alone.

In the genre's usual form an alliance is chat plus coordinated defence — a convenience. In
Expansa the clan is an **organ of perception**: without one you are blind. A player joins a
clan not because it is more efficient but because otherwise they are not playing the game.

Every mechanic should be checked against this: does it strengthen the fact that seeing
requires other people?

## Personal safety, collective risk

The primary base cannot be destroyed or captured; secondary bases and clan outposts can.
Losing a war costs territory, sector access, and secondary holdings — never the account.

This is a deliberate fit for a mobile audience. The genre's classic failure is a player
losing everything while asleep and never returning.

**The invulnerability covers destruction and capture, not raiding.** A primary base that
cannot even be robbed makes turtling optimal: zero risk, zero pressure, no war.

## World lifecycle

**A world is finite. It runs for roughly one to two years and then ends, in the fiction as
well as in the database.**

The ending is diegetic — the collapse of the system the world lives in — and its countdown
is visible from the first day. This turns the reset from maintenance into premise: nobody's
progress is taken away, because everyone was told from the start that this world dies. The
only question was what you would accomplish before it did, and with whom.

Worlds **overlap**: the next world starts before the current one ends, so players arriving
too late to matter in the old world are directed to the new one.

### What survives the end of a world

- Account, personal history, titles ("survived the collapse of …")
- The clan as an entity: name, page, reputation, war record
- Purchased cosmetics and supporter marks

### What does not

- Bases, fleet, technology
- Territory, clan outposts, reconnaissance networks, asteroids

A clan that carries its own history from world to world is the strongest retention hook in
this design: the player returns not to a game but to their people.

Because a world is finite, personal power does not need an artificial ceiling to keep
newcomers competitive — the horizon does that on its own.

## Win condition

The world does not end on a calendar. **It ends when a clan holds the key objectives
continuously for a defined period**, with the timer visible to everyone while it runs.

This produces the best endgame the genre offers: the moment one clan pulls ahead, everyone
else unites against it, and yesterday's enemies sign the non-aggression pacts that already
exist as a mechanic. The world ends in a public siege of the leader rather than in someone
quietly out-accumulating everyone.

**Open**: what the key objectives are — the galactic core, a set of gates, something else.
This depends on the setting.

## Monetisation

**Nothing that affects the outcome is ever sold — not to a player, not to a clan.**

The test for any future proposal: *would the result of a clash between two equally
organised clans change if one of them paid?* If yes, it is not built.

This is not only an ethical position. Selling intelligence would destroy the spine of the
design: if scouting can be bought, the clan stops being necessary as an organ of
perception, and the game collapses into an ordinary accumulation race.

### The model

| | What | Scale |
|---|---|---|
| Backbone | Subscription: convenience and identity. Locks away no part of the game. | small, monthly |
| One-off | Clan, sector, and fleet decoration | small amounts |
| Free to all | Automation: auto-raid, queues, deferred orders | — |

The goal is deliberately **many people paying a little**, not a paying minority carrying
the game. That is a statement about how the game should feel, not a revenue tactic: money
is not part of the competition at all.

### Belonging, not status

Purchased identity must distinguish **groups horizontally**, not rank **people
vertically**. A mark that says "I am part of this" is belonging. A gold aura that says "I
am above you" is status, and status cosmetics reproduce the same hierarchy as pay-to-win
without the numbers.

The clan page and sector decoration are naturally horizontal — they separate *us* from
*them* rather than ranking individuals. They are also the most-seen surfaces in the game.

Personal base decoration is a weak slot by construction: fog of war means almost nobody
sees your base. Fleet decoration is the exception among personal items, because battle
reports are read by both sides and forwarded into clan chat.

### The convenience / power line

> **Power is anything that changes how much a player gets done per real hour. Convenience
> is anything that changes how pleasantly they see it.**

By that test an extra build queue, auto-collection, and auto-raiding are *power*, however
commonly they are sold as convenience. Map filters, saved fleet templates, war logs,
extended history and statistics, and notification settings are convenience.

Automation is therefore **given to everyone for free**. It is the sharpest tool a paying
player could be handed, and handed to everyone instead it closes the gap between the player
who sets a 3 a.m. alarm and the player with five minutes a day — the genre's central
problem on mobile.

### Consequences accepted

Revenue per player will be lower than under a pay-to-win model, which means this design
implies a small, durable game with a committed audience rather than one competing on user
acquisition budget. This is a decision about what kind of project this is, and it is
recorded here because it will be tempting to soften once real numbers arrive.

## Setting

Science fiction. The leading direction, not yet confirmed:

**After the collapse.** A galactic civilisation fell. Its jump-gate network is broken,
survivors emerge alone and rebuild from wreckage. Space is dark because the old detection
grid is dead — so probes are not a game convention but the only remaining way to see.
Sectors are reachable only through gates a clan has repaired and holds. Asteroids and
derelict fleets are what a dead civilisation leaves as it keeps falling apart, and they run
out. Ships are not designed but assembled from salvage, which is what makes weapon
configuration a description of the situation rather than a mechanic.

The finite world fits this setting exactly: a dying system is why the world ends.

**Open**: what the fallen civilisation was, and why survivors fight instead of cooperating.
The strongest available answer is that salvage is finite and nobody can rebuild production
from nothing, so the war is over the *right to dig*.

## Map

A hierarchy of sectors rather than a flat grid, with entry to a sector granted by a clan
outpost. This makes the map **a graph, not a plane**:

- Distance is path length through the graph, not Euclidean distance
- Outposts are **chokepoints** — closing one cuts off a sector
- Clan territory acquires real strategic geography

**Open**: what happens to a fleet in transit through a sector whose outpost is destroyed
mid-flight.

Sector artwork should be **generated procedurally from a seed** (`sector_id → seed →
image`) rather than hand-drawn. Hand-drawn art would make the art budget the cap on world
size: at fifty players per sector, ten thousand players need two hundred sectors.
Procedural generation is also consistent with the determinism already chosen for combat.

## Open questions

- **What a base physically is** — station, planet, or something else. It decides whether
  bases can move (which would break the distance model), whether sector slots are finite
  (which is where scarcity would come from), and whether it collides with asteroids as a
  separate contested entity. The strongest candidate: a sector is a star system with a
  finite number of planetary slots, around fifty, which makes the fifty-player figure a
  physical property of the world rather than a tuning value.
- **Resource set** — how many kinds, and whether they are symmetric.
- **Warehouse overflow** — is the excess lost, or does production stop? Blocks the time
  model ADR.
- **Upkeep and deficit** — what happens when consumption exceeds production, and whether
  desertion exists at all. Blocks the time model ADR, because losing units one at a time
  produces an event whose time must be recomputed on every change to production or fleet.
- **Session shape** — what a player does in a two-minute session on a phone.
- **Target player** — someone who sets alarms at 3 a.m., or someone with a few minutes a
  day. This decides whether offline protection and push notifications are core mechanics.
- **Clan purchases** — a shared clan wallet with member contributions, or a single officer
  buying for everyone. This affects the schema and should be settled before clans are
  designed.
- **Asteroid spawn timing** — contested spawns on a schedule reward whoever is awake.
  Mitigations: long capture windows, timers visible in advance, clan-level rather than
  individual participation.

## Already fixed

- Server-authoritative: the client never computes anything the server trusts.
- Resources are lazily evaluated; discrete events are scheduled deferred jobs.
- Combat is deterministic and reproducible from a stored seed.
- Mobile only. One world at launch, `world_id` in the schema from day one.
