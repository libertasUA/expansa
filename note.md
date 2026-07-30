# Notes — for humans only

**Not written for an agent, and nothing here is a rule.** No agent loads this file, so a rule
placed here would be a rule nobody follows — and a second copy of one that lives elsewhere,
which is worse. If you find yourself writing an instruction below, it belongs in a
`CLAUDE.md` or in `docs/`.

What this file is for: the reasoning *about* the instruction files, which the instruction
files must not carry themselves.

---

## Root `CLAUDE.md`

### What it costs

It is loaded at the start of every session, before anyone knows what the task is. Every line
is paid for by every task, including the ones it cannot possibly help.

That asymmetry is the whole problem: **adding a line costs the author nothing, and nobody ever
initiates a removal.** The file reached 359 lines that way, and by then it had started to
contradict itself in three places — the client was "not decided" forty lines above being
decided, accounts were "held in memory" a week after moving into the database, and `server/`
was described as having no package file while `server/CLAUDE.md` existed.

None of those were carelessness. They are what happens when a file that is read constantly
and edited rarely describes **state** instead of rules.

### The three levels

| | Holds | Loaded |
|---|---|---|
| Root `CLAUDE.md` | what the repo is, how to work, conventions a linter cannot check | always |
| `<package>/CLAUDE.md` | how to write code in that package | when work happens in it |
| `docs/` | environment traps, domain, ADRs | when someone goes looking |

The industry name for the shape is *progressive disclosure*, and Agent Skills are its
productised form: a one-line description stays in context, the body loads when it becomes
relevant.

### What the root file does not have, and what that costs

There is no router — no table saying *"task of this kind → read that file first"*. The second
level is therefore discovered by working in a directory, and the third by knowing it exists.

That is a real gap, not an oversight to leave unnamed: **a design discussion happens with no
package file loaded.** This one did — two sessions of talking about account structure without
`platform/CLAUDE.md` ever entering the context. Anything that must survive that conversation
has to be in the root file or it is not in the room.

It is also the excuse that reinflates the file, so it needs a limit. Today the only rule
carried at the root for this reason is the time invariant, and it is worth watching whether a
router table earns its place before more follow it.

### Adding something

Three questions, in order. Each is more likely to end the discussion than the next.

1. **Does the model's default already agree?** "Comments explain why, not what" needs no
   instruction — a competent engineer does it anyway, and so does the model. What earns space
   is a rule whose *idiomatic answer is wrong here*: `useFactory` over `useClass`, ids as
   strings rather than unions, a rate that may not depend on an amount. Anthropic removed
   80%+ of Claude Code's own system prompt for the Claude 5 models with no measured loss, and
   warns separately against guardrails written for weaker models.
2. **Could the tooling enforce it instead?** ESLint, the pre-commit hook and
   `tools/check-contours.mjs` are the existing pattern. Prose describing a guarantee it does
   not create will outlive the thing it describes.
3. **How many packages can break it?** Exactly one → that package's file. The test is written
   down in `docs/adr/README.md`, and it is a count rather than a judgement of importance on
   purpose. A rule can be load-bearing and still not belong at the root.

### Removing something

The reverse of the above, and it needs an owner because it never happens on its own.

- **Nothing is deleted without a destination or a written reason.** The risk in shrinking an
  instruction file is not that it gets too small — it is that knowledge is dropped rather than
  moved. Move the destinations first.
- Check the package files before moving anything into them. Three rules were already
  duplicated between the root and `packages/engines/CLAUDE.md` — an engine's dependencies,
  portable engines owning no storage, and the game-vocabulary ban — and duplicates go stale in
  one place while looking correct in the other.

### The budget

**Around 120 lines**, held by hand. There is deliberately no CI check: the number is a guess
until the shape has been lived with, and a failing build over a guess trains people to raise
the number rather than answer the question.

Its purpose when it does exist is not tidiness. It converts *"is this line important?"* — to
which the answer is always yes — into *"is it more important than a line already there?"*,
which is answerable and usually reveals that neither is.

### The previous version

Nothing is kept as a backup file; git is the backup. The 359-line version, with everything
that was cut:

```
git show 0067ef3:CLAUDE.md
```
