Daybook is a logbook for the practical side of therapy: the worksheets, the reps, the feelings check-ins, the gratitude lines, all in one place and ready to take into session. It lives at `daybook.example.com`, alongside Pip, Terpa and Tare.

A daybook is an old working ledger: where you write down what you did today. That's the whole idea. It's a notebook with a ribbon in today's page, not a coach and not a crisis service.

## Principles

1. **Worksheet-faithful.** Each practice screen is shaped like the therapist's paper version: same fields, same order, same words ("predicted difficulty", "remaining difficulty", "tally"). Your therapist should recognise it at a glance.
2. **Accountability, not shame.** Show progress ("3 of 4"), never failure. No streaks, no fire, no red crosses. Attempts count as data.
3. **Honest about what it is.** A logbook. No AI advice, no insights that tell the user how they feel. The feelings screen always carries `CrisisFooter`.
4. **Fast to log, slow to reflect.** Logging is one thumb and under 20 seconds, with the primary action in the bottom third. History, charts and session prep get room to breathe.
5. **Every entry can go to session.** `FlagToggle` is on every log screen and every `EntryCard`, and it looks the same everywhere.
6. **Extensible shell, bespoke practices.** Shared chrome plus one hand-designed screen per practice type. No generic form builder.
7. **Calm by default, bright when it counts.** `apricot` and `marigold` are saved for actions, flags and wins. Everything else is `paper` and `ink`.

## Voice

Plain, warm, British. A good mate who happens to be organised.

- Second person, short sentences. "You planned gym today." not "Your journey continues."
- State the facts of a win; don't cheer. "Done. Rated it a 3, down from 6." beats "Amazing work!!"
- Ask, don't scold. "No gym logged yesterday. What got in the way?"
- Sentence case everywhere. No exclamation marks, ever. No emoji.
- Never use: journey, healing, self-care, mindful, wellness, streak.
- Use the worksheet's words for labels: Predicted difficulty, Actual difficulty, Remaining difficulty, Tally, Date completed, Comments.
- For "safety behaviours", ask neutrally: "Anything you did to make it easier?"

| Moment | Say | Not |
| --- | --- | --- |
| Rep logged | Logged. Thought 7, it was 5, now it's a 2. | Great job! Keep it up! |
| Rung done | That one's done. Remaining 3, under the 4 line. | You crushed it! |
| Missed target | You planned gym yesterday. What got in the way? | You broke your streak |
| Empty ladder | No tasks yet. Add the first rung. | Your journey starts here |
| Offline | Saved on this phone, will sync. | Error: no connection |

## Colour

The design is the light theme. Colour lives in tokens so a dark theme can be added later without touching components.

- Set every screen on `paper`. Cards, sheets and inputs sit on `paper-raised`. Quiet bands (the done band, the crisis footer) use `paper-sunk`.
- All text is `ink`, with `ink-muted` for meta. Both pass AA on every paper surface.
- `apricot` is the warm primary: the primary button, the active nav pill, target pips. Text on apricot is always `ink`. When apricot has to be text, use `apricot-ink`.
- `teal` is the cool secondary: the focus ring, quiet buttons, the predicted line on charts, sessions. `teal-tint` backs the next-session card and the sync pill.
- `marigold` means flagged for session, and nothing else.
- There is no red and no green in the system. Nothing is ever an error colour.

### The difficulty ramp (0–8)

`difficulty-0` to `difficulty-8` run cool to warm: pale sky through a neutral sand at 4 to deep terracotta at 8. It is one continuous ramp, not a traffic light, so 8 reads as intense, not dangerous. Lightness drops steadily as the number goes up, so the order still reads without colour vision, and the number is always printed on it. Text is `ink` on 0–7 and `ink-inverse` on 8. Under 4 is the worksheet's "done" line, and it lands exactly where the ramp turns from cool to warm.

Use the ramp only for difficulty and intensity scores: `RatingScale`, `Score`, `LadderRung` blocks and chart points. Never use it for decoration.

## Type

One family: **Atkinson Hyperlegible Next** (variable, 200–800), designed for low-vision legibility, with distinct numerals and a slashed zero. Numbers are the heroes.

- `num-hero` (72px, 800) for the chosen rating, one per screen. `num-lg` for predicted vs remaining in the task header. `num-md` for scores in lists.
- `title-lg` for screen titles, `title` for sheet titles, `heading` for sections and card titles.
- `body` (17px) is the reading size; `small` for meta; `label` (13px caps) only for worksheet column labels.
- Layouts must survive the phone's largest text size: let rows wrap, and never fix a height on text.

## Space, shape, depth

- 4px base: `space-1` to `space-7`. The screen gutter and card padding are `space-4`, and the gap between sections is `space-5`.
- Radii feel like a well-made notebook: `radius-md` for controls, `radius-lg` for cards and rungs, `radius-xl` for sheets, `radius-pill` for status pills only.
- `shadow-card` is a paper edge, not a float. `shadow-sheet` is for bottom sheets and the nav only.
- Tap targets are at least 44px tall, and primary buttons are 48–56px. The 0–8 cells are 56px tall and gapless.
- Focus: a 2px solid `focus` (teal) ring with a 2px offset on every interactive element.

## Layout

- Mobile first at 390px wide, running as an installed PWA in standalone mode, so allow for safe-area insets. `BottomNav` is fixed to the bottom.
- The primary action sits in the bottom third. `RatingScale` and `FlagToggle` must never need a stretch.
- Tablet (820px) is two columns: list on the left, detail on the right. This is also what the therapist sees when the tablet is passed across the room. Desktop is just a wide tablet.

## Iconography

`Daybook.Icon`: 24px, 1.75px stroke, round caps, drawn in `currentColor`. Each practice type has its own mark: a ladder for the hierarchy, a label tag for feelings (naming the feeling is the point), and a seed for gratitude (the seed bank). A new practice type gets a new mark on the same grid. Never use illustrations, lotus flowers, meditating figures, brains, gradient blobs or emoji.

## Celebration

A finished rung, a rep that came in easier than predicted, or a feared prediction that didn't happen gets one moment of colour: an `apricot-tint` wash behind the confirmation and the numbers set in `num-lg` ("7 → 2"). There's no confetti, no sound, and nothing that implies the user was expected to fail.
