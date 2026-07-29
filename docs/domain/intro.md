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
  *Refined by the author: bodies are public astronomy and your own orbit is free to watch;
  what is hidden is everything around every other planet. See The spine.*
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
  *Superseded by the author: the primary base can fall to a long, visible, interruptible
  siege — never to a raid, and never to capture. See Personal safety, collective risk.*
- Military strength is an **interstellar fleet**.
- Tentative: a **flexible weapon upgrade system**, so ships are configured rather than
  merely unlocked.
- The **resource set is undecided**, as is whether **desertion** exists at all.
- Worth doing: write a **minimal history of the world** and derive the rest from it.

## The spine: intelligence is what makes clans necessary

The most valuable idea in the concept, and the one every mechanic should be checked
against: **scouting is expensive for an individual and cheap for a group**, so a clan is
not a convenience but an organ of perception. Without one you are blind.

What is hidden is not *where people are* but *what they are doing*.

### Where the fog sits

**Bodies are public astronomy.** Every planet, moon and large asteroid in a system is on
everyone's map from the first day, along with how many orbital slots each planet has. The
map is complete and empty.

**Occupancy is not.** Who sits in those slots, what is built on those rocks, and how strong
any of it is — none of that is on the map until someone looks.

**Your own orbit is free.** You hang a few thousand kilometres from the other arks around
your planet, so you see them and their movements permanently and at no cost. That is where
the value of neighbourhood comes from: watching your own is free, watching anyone else's
is not.

**Every other planet is dark** — including the ones in your own system, a few days' flight
away. A planet is visible; what orbits it, at interplanetary distance, is not.

### Why this makes the clan necessary, arithmetically

> One player watches **one orbit**. A clan with members around five planets watches **five**.

Not because it bought better sensors, but because each member watches their own doorstep
for free and shares it. That is the whole mechanism, and it operates every day rather than
in occasional expeditions.

### Intelligence perishes, which is the point

A position learned once is known forever. Fleet strength, a departed convoy, a siege just
begun — all of it is stale within hours. So observation is continuous work rather than a
purchase, and continuous work over fifty neighbours is physically impossible alone.

This gives the two reconnaissance tools distinct jobs: a **probe** takes a snapshot of one
target and the answer rots by evening; a **reconnaissance outpost** watches a region
continuously, catching fleets launching and convoys leaving, and can be destroyed by
whoever objects to being watched.

### Scouting is economic before it is military

You also do not know **which moons and asteroids are already being worked**. Sending a
complex to an occupied rock wastes the fuel that got it there.

Everyone extracts; not everyone fights. So the everyday reason to scout is finding free
ground, and the military use rides on infrastructure that pays for itself.

## What a base is

**A large ship — the ark that carried its owner out of the collapse.** It holds a
survivor's entire remaining civilisation, and its hull is technology nobody alive can
reproduce or easily breach, which is why it is hard to kill: the reason lives in the
fiction rather than in the rulebook.

Everyone having an ark is answered by the same collapse. They were built in thousands
during the evacuation and most were lost; they are common among survivors precisely
because only their passengers survived.

### The economy is outside the ark

This is the load-bearing idea, and everything else follows from it.

The ark itself produces almost nothing. It absorbs **solar energy** in small amounts —
slowly, forever, and nobody can take that away. Everything else has to be fetched:

```
energy       from nothing, slow, cannot be taken
   ↓ synthesis — always available, always a terrible rate
fuel         buys reach
   ↓ dispatching robotic complexes
material     extracted outside — fast, and exposed
```

> **Synthesis is always possible and always bad. Extraction is good, but it requires
> reaching out, and it can be taken from you.**

The whole game lives in the gap between those two rates. Stay home and you survive; reach
out and you grow, at risk.

Fuel is the expensive part, synthesised by a costly module, and it is what buys distance:
sending robotic complexes to nearby planets, moons and asteroids, and hauling what they
extract back home. On the larger objects a complex can become a **permanent base** rather
than a temporary operation.

**Extracted material comes home in convoys, not by wire.** That is a deliberate choice
over continuous delivery: cargo in transit is a target, so the supply line is part of the
war rather than an abstraction behind it.

### No state is terminal

Complexes cost material, material is extracted, extraction needs a complex — a circle that
would leave a player who lost everything permanently dead.

So the synthesiser produces **basic material as well as fuel**, at a rate bad enough that
nobody would choose it as a strategy. It is not an economy, it is a floor: lose everything
and you recover, slowly and humiliatingly, but you recover.

### Where an ark sits

**A sector is a solar system.** It holds several planets, and each planet has a fixed
number of **orbital slots**. An ark occupies one of them.

That gives two levels of geography with different jobs:

- **Between systems** — a graph. Gates, and clan outposts that grant entry. The strategic
  scale, crossed rarely.
- **Inside a system** — planets at distances paid for in fuel. The operational scale, used
  daily.

Slots being fixed is what makes the map a graph rather than a plane: an ark is at a
position, not at a coordinate, and distance is the cost of travelling between positions.

**The planet you orbit is your neighbourhood.** Seven or so arks around the same planet see
each other permanently, compete for the same nearby rocks, and are the first people any of
them will ever deal with. Fifty players in a system is too many to know; the people around
your planet are a village.

Planets are not equal, and the difference is already implied by the economy: energy is
solar, so **an inner planet earns more of it than an outer one**. Add differing slot counts
and differing bodies within reach, and the inner system is expensive property while the
outskirts are where you go when nothing better is free. No bonus table required — it falls
out of the physics already chosen.

This is also where the pressure comes from. Fifty arks in a system reach for the same
rocks, so conflict does not need a pretext: it is in the geometry from the first day.

## Personal safety, collective risk

The economy living outside the ark changes what a war is about. Most of what a player owns
is exposed by design — complexes on distant rocks, convoys in transit — and losses there
are **frequent and small** rather than rare and catastrophic. That fits a phone-shaped
audience far better than the reverse: a player with five minutes a day survives losing a
mining complex and quits after losing everything overnight.

### The ladder of targets

| Target | Cost to the attacker | What it yields |
|---|---|---|
| Convoy in transit | cheap | whatever it carries |
| Extraction complex | moderate | what has accumulated on site |
| The ark itself | expensive, heavy losses | the stockpile at home |
| Siege to destruction | enormous | removal of a rival |

Each rung has its own role and none replaces the others.

**The ark can be raided, and it must be.** Convoys bring material home, so a stockpile
accumulates there; an ark that could not be touched would make hoarding optimal and reaching
outward pointless, which is the opposite of the design. But its defence is strong and an
attacker takes real losses, so raiding an ark is a clan operation for a serious prize
rather than a way to farm a neighbour.

### Destruction

**An ark can be destroyed — by a siege, never by a raid, and never quickly.**

An earlier version of this document made the primary base indestructible, for a good
reason: the genre's classic failure is a player losing everything while asleep and never
returning. That reason still holds; what did not hold is a world that cannot clean itself,
where a sector fills with abandoned arks nobody may remove.

Making destruction merely *expensive* does not solve the original problem. Cost deters idle
aggression, but not a clan that has decided you should go, which is exactly the case the
rule existed to cover. **Duration and visibility solve it.** Destroying an ark requires a
siege that:

- runs for **days**, not hours
- is **publicly visible** from the first hour — to the target, their clan, and the
  neighbourhood
- is **interruptible**: break the siege and the timer resets
- is **expensive** for the attacker, so it is not done out of boredom

The loss then reads as "my clan did not relieve me in three days" rather than "I was
robbed in my sleep". It is a clan-scale event, which is what this design is built around.
Blockade is not the alternative to this but its first stage: cut the target off, strip the
surroundings, then start on the hull.

**Capture is not possible.** A hull nobody can breach cannot become someone else's home
without destroying the very reason it was hard to breach. A fallen ark leaves wreckage.

**The prize is the orbital slot.** Slots around a planet are fixed and the inner ones are
taken, so a siege is fought over a specific address rather than over punishment. It also
makes the world self-clearing: an abandoned ark is cheap to remove, because nobody defends
it, and its slot returns to circulation.

### Losing is a fork, not an exit

A destroyed ark costs the base, not the account. The owner chooses:

- **Stay** — rebuild here, with their clan, from the synthesiser's floor upward.
- **Leave** — the ark's last jump into the next world, which is already running because
  worlds overlap. They arrive early, while it is empty and the good positions are open.

Leaving means **abandoning the clan**, and a clan is how you see anything at all, so it is
not the easy option. The point is that defeat becomes a story rather than an ending.

Two rules keep this honest:

- **The jump is never sold.** Not for money, not as a subscription perk. It would be a
  purchase of escape from a lost war — see Monetisation.
- **The jump does not work under siege.** Otherwise three days of pressure end with the
  target evaporating in the last minute. Leave before it starts, or after the ark falls.

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

- **Siege length and cost** — the numbers, not the shape. Long enough that a clan in
  another timezone can respond, short enough that besieging is a decision rather than a
  campaign. Probably measured against how long a clan takes to muster, once that is known.
- **Can the ark move at all?** It is a ship now, which makes the question unavoidable.
  Freely mobile breaks the distance model the whole map rests on, and permanently fixed
  makes "ship" only a word. The leading answer is that it can move but as an *event*: days
  of preparation, a ruinous amount of fuel, visible to everyone. Relocation then exists as
  something earned rather than bought — see Monetisation, where buying it was rejected.
- **Slots per player.** With fifty in a system, roughly one orbital slot each — say six to
  eight planets with six to ten slots apiece, fewer and more expensive close to the star.
  Much more and slots stop being scarce; much less and most players hold no address worth
  defending.
- **Whether static bases share the orbital pool.** A planet could have one set of positions
  occupied by arks and permanent surface bases alike, or two separate sets. One pool is a
  single `slots` table and no special cases; two make a planet contested at two levels at
  once.
- **What happens to the loser's extraction network** when the ark falls. Destroyed with it,
  left dormant with a window to re-establish, or open to whoever arrives first. This decides
  whether "rebuild here" is a real alternative to jumping to the next world, or strictly
  worse and therefore not a choice at all.
- **Where a newcomer's ark arrives** — near other newcomers and away from developed
  players, but the rule needs stating before the map generator exists.
- **A fourth, rare resource**, extracted only from asteroids, so that asteroids are worth
  a fight of their own. Likely, not settled.
- **How an asteroid depletes.** Modelled as a falling rate, its exhaustion moment moves
  every time a complex is added or destroyed — the one shape ADR 0002 forbids. The
  intended answer is that a deposit drops in steps when a convoy departs with its load,
  but it needs settling before extraction complexes exist.
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
- A base is a ship — the ark that carried its owner out of the collapse — and it occupies
  a fixed orbital slot around a planet. A sector is a solar system with several planets.
- Bodies are public astronomy; occupancy is not. Your own orbit is free to watch, every
  other planet is dark, and a clan sees as many orbits as it has neighbourhoods.
- The economy lives outside it. Solar energy accrues from nothing; fuel is synthesised and
  buys reach; material is extracted by robotic complexes and hauled home in convoys.
  Synthesis is always available and always a bad rate, so no position is ever terminal.
- Everything worth taking is exposed: convoys, complexes, and the stockpile at home. An ark
  can be raided, but its defence is strong and the attacker pays for it.
- An ark falls only to a long, public, interruptible siege, and is never captured. The
  prize is its orbital slot.
- A defeated player keeps the account and chooses: rebuild, or jump to the next world and
  leave the clan behind. The jump is never sold and never works under siege.
- One client ships at launch; whether it is mobile or web is not decided. The design
  still assumes a phone-shaped audience — short sessions, no 3 a.m. alarms — which is a
  statement about players rather than about the platform.
- One world at launch, `world_id` in the schema from day one.
- Three resources: **energy** (accrues from nothing), **fuel** (synthesised, buys reach),
  **material** (extracted outside, or synthesised at a punitive rate).
- A full store loses the excess; production does not halt. Fleet size is capped by shipyard
  berths rather than by upkeep, so nothing starves and desertion does not exist. Both
  choices exist to keep any rate from depending on an amount — ADR 0002.
