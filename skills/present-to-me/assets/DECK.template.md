# DECK.md · {{TITLE}}

The deck's memory. Read it before changing anything. Update it in the same session as any change the user asked for.

## Story Brief

1. **Audience.** Who decides, what they believe now, what they are afraid of.
2. **Decision.** What they should do after the talk: one verb, one object.
3. **One sentence.** The claim to remember if they forget everything else.
4. **Why now.** What makes waiting costly, starting with forces outside the organisation.
5. **Proof.** The three strongest pieces of evidence, each with its source.
6. **Hard questions.** The three objections expected, and the honest answer to each.
7. **Numbers.** Which figures go on screen, where each comes from, which are estimates.
8. **Constraints.** Minutes, slide language and spoken language, brand, room, privacy, deadline.

Material to show:

Cut list:

## Colour dictionary

One meaning per colour, on every slide.

| Token | Colour | Means |
|---|---|---|
| `--m1` | orange | |
| `--m2` | blue | |
| `--m3` | purple | |
| `--risk` | red | a limit crossed |
| `--ok` | green | a pass |

## Storyboard

| # | id | chapter | title (the claim) | pattern | presses | the picture | numbers from |
|---|---|---|---|---|---|---|---|
| 1 | title | Open | | hero | 0 | | |

## Facts that are easy to get wrong

Things a later session would not guess from the code: a number that changed, a name the user insists on, a label that must use the vendor's own words.

-

## Decisions

Newest first. Date, what was decided, the user's own words where they matter, and which slides it touched.

-

## Open questions

What is not yet confirmed, who will confirm it, and by when.

-

## How to verify a change

1. `npm run build` prints no line starting with ✗.
2. `npm run check` ends with `all slides ok`.
3. `npm run shot -- <id> <press>` for every slide touched, and look at the image.
4. Notes updated in the same edit as the slide.
