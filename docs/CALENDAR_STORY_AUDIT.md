# The First 90 Days — story and interaction audit

Reviewed 25 November 2026. Basis: the supplied v1.1 source and content for all twelve days, plus browser review of the cover, Day 00, Day 07, Day 21 and Day 90. This is a design audit, not a new research finding or a complete usability study.

## Recommendation

Keep the desk and the calendar. Turn each page into an event whose traces remain on the desk. Use the same ongoing project and recurring people so the visitor sees a job becoming clearer. Generate artwork for those events, rather than adding more corner stickers or helper speeches.

The calendar already contains twelve different mechanisms; it does not need twelve more. It needs stronger connections between them and more visible consequences.

## What the current exhibit actually does

- The days move from accepting the offer through unwritten rules, everyday tasks, feedback, questions, changed briefs, learning, check-ins and mutual reflection.
- The visitor unfolds, sorts, orders, rewrites, compares and collects. Day 21's revised-brief slider visibly changes the same document.
- Day 30 learning selections already feed into Day 45's agenda. Marks, clips, notes and selected preferences also carry into later views. There is continuity to build on.
- The desk largely retains the same arrangement. Most page illustrations are a character and a small sticker near the title. The main action often ends with explanatory copy.
- Day 90 primarily maps days and activity. It can show what was opened or marked, but that alone does not demonstrate what the visitor understood.

## Why the offer comparison feels stronger

In Offer Looks Good, two objects stay in front of you and compete for a decision. Opening a drawer changes how you read those same offers. The physical action, information and decision are connected.

In the calendar, changing the date often replaces the entire question. The visitor encounters a new mini activity before the previous one has left a visible trace. The story is coherent in the writing; its continuity is less visible in the experience.

## Changes in priority order

1. **Make an ongoing story visible.** A proposal: one fictional junior, one recurring project and a small recurring team. A revised project artifact should reappear later, visibly changed. Clearly label this as an illustrative composite.
2. **Give each day one main action.** Put that day's artifact at the centre; quieten unrelated props. Reveal optional tools when they have a use. Keep navigation predictable.
3. **Show consequences in the object.** Three conflicting comments should land on the same design. A changed deadline should move several deliverables. A clearer question should produce a visible reply. These outcomes are authored scenarios, not predictions about real participants.
4. **Carry evidence forward.** Extend the useful Day 30 → Day 45 connection. The clarification from Day 14 could appear on the revised brief; Day 60 could show a teammate using the file the visitor organised.
5. **Make Day 90 a reconstruction.** Assemble the offer, feedback, revision, question and check-in fragments the visitor encountered. Let them inspect what changed and what remains unclear. Retain the day grid as navigation.
6. **Keep reflection optional.** Bridge and Arch should be small companions. Explanations open on request and remain dismissed. Avoid a mascot, celebration or speech after every click.

## Day-by-day direction

| Day | Decision | What would make the event visible |
|---|---|---|
| 00 | KEEP / SHARPEN | The letter unfolds beside a visibly unfinished first-morning plan. Promise versus unknowns. |
| 01 | SHARPEN | Formal reporting lines lift to reveal who actually helps with files, feedback and questions. |
| 03 | SHARPEN | A slim job-description pocket releases a growing pile of ordinary production tasks. |
| 07 | REWORK PRESENTATION | Three reviewers annotate the same poster. Ordering replies visibly groups the competing needs. |
| 14 | SHARPEN | Show the unsent draft and a clearer rewrite; a specific reply becomes a clue carried forward. |
| 21 | KEEP / EXPAND | Keep the comparison slider; connect changed rows to the files and schedule they affect. |
| 30 | KEEP | Keep the learning choices; preview that these become questions in the coming check-in. |
| 45 | KEEP / SHARPEN | Make the visitor's Day 30 choices visibly arrive on the agenda. Show the team responding too. |
| 60 | SHARPEN | Show the useful shared-file and handover work alongside the polished portfolio artifact. |
| 75 | SHARPEN | Revisit concrete earlier tasks when choosing what to keep, rather than only abstract preferences. |
| 85 | SHARPEN | Keep two sheets, but reveal adjustments made by BOTH the newcomer and the team. |
| 90 | REWORK REVEAL | Reassemble a small evidence collage; the changed understanding is the result, not the number of clicks. |

## Copy and interaction issues worth fixing during a redesign

- Day 07's final button says “Write the reply”, but the current action sets an order and reveals a paragraph. Either provide a reply action or rename it “See what each reviewer needs”.
- Several explanations state an agreeable lesson after an action. Let the visitor see the tension first, then reveal the interpretation. For example, production work can teach systems, but repetitive production does not guarantee learning.
- A confident assumed team voice can make support sound guaranteed. Keep the team perspective situated in the fictional scenario and leave room for ambiguity.
- Avoid adding busy animations to communicate that the calendar is interactive. Animate the changed artifact: a new version, a paper being pulled, a relationship becoming visible.

## What was fixed in this delivery

Object hints now default to off. When explicitly enabled, an object's explanation appears once and that preference survives reloads and calendar resets. “Why it matters” starts collapsed and opens only on request. The helper illustrations no longer bob indefinitely. Untried-object beacons are quiet when hints are off.

These are interruption fixes. The story directions above are recommendations for the next version; they have not been presented as an implemented redesign.

## Asset order

Start with prompts **01, 02, 03 and 08** in `GEMINI_CALENDAR_PROMPTS.md`: the task spill, conflicting feedback, revision ripple and accumulated evidence. These make the narrative mechanisms more concrete. The other four support the remaining turning points.

Artwork cannot fix weak cause and effect by itself. Keep all essential text, choices, document states and accessibility labels live in the site.
