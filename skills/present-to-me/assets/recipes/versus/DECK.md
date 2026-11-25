# DECK.md · Light 13 or Studio 15? Your week decides.

The deck's memory. Read it before changing anything. Update it in the same session as any change the user asked for.

This is the versus example that ships with PresentToMe. Both laptops and their maker are invented, and so is every figure. Its structure, figures and motion are yours to keep. Replace its story, titles, numbers and notes, then rewrite this file for your own pair.

## Story Brief

1. **Audience.** One buyer who will take one of two laptops from the same maker. They have read both specification sheets and are stuck. The fear is paying for power they never use, or saving money and then waiting on the machine every week.
2. **Decision.** Choose one laptop, the Light 13 or the Studio 15.
3. **One sentence.** Your week decides.
4. **Why now.** The buyer is buying this month either way, so no slide argues for buying. The talk starts at the choice.
5. **Proof.** The maker's two specification sheets. Our own timing of one heavy job on both laptops. The cost model in `src/js/model.js`.
6. **Hard questions.** Why put a price on my time? What if I do no heavy work? Why does a day away from a desk count against the Studio 15?
7. **Numbers.** The measures of each laptop, and the buyer's week: heavy hours, days away from a desk, what an hour is worth, budget. All in `src/js/model.js`. The value of an hour and the years the laptop is kept are estimates.
8. **Constraints.** 8 minutes. English slides. One screen. No public link.

Material to show: the two laptops as figures, the five measures that separate them, the three parts inside that cause the difference.

Cut list: resale value, repairs and accessories (assumed equal for both), benchmark tables, the other models in the range.

## Colour dictionary

One meaning per colour, on every slide.

| Token | Colour | Means |
|---|---|---|
| `--m1` | orange | the Light 13: its figure, its bars, its line, its name |
| `--m2` | blue | the Studio 15: its figure, its bars, its line, its name, its parts |
| `--m3` | purple | not used. Free for a third thing |
| grey | | what is the same in both, and a figure that is not the pick |
| `--risk` | red | a test failed: over the budget, or no payback while the buyer owns it |
| `--ok` | green | not used |

## Storyboard

A versus has no ask. The last slide says who should take which, and repeats the one sentence.

| # | id | chapter | title (the claim) | pattern | presses | the picture | numbers from |
|---|---|---|---|---|---|---|---|
| 1 | title | Open | Light 13 or Studio 15? Your week decides. | 2 hero | 0 | Both laptops as figures side by side, each in its colour. They assemble, then light | model: weight, price |
| 2 | same | What separates them | In six ways they are the same laptop. | drawn ties | 1 | A figure at each end and one line for each shared thing, drawn from both ends to its name. Press 1 turns both figures grey and names what is left | data block: SAME, ROWS |
| 3 | difference | What separates them | Light 13 carries better. Studio 15 works faster. | 8 versus rows | 5 | `Kit.versus`, one row per press, the ring on the better value. Both figures small at the head, carried in | model: a and b |
| 4 | why | What separates them | Three parts make the Studio 15 fast and heavy. | 20 exploded anatomy | 3 | `Kit.figure` opens the Studio 15. Chip, fan and battery lift and light in blue, each with a card and one number | model: watts, minutes, watt-hours |
| 5 | years | Which is yours | Waiting costs too, so the Studio 15 pays back. | 9 cost lines that cross | 2 | `Kit.lines`: the Light 13 climbs from its price, the Studio 15 stays flat at its own, a ring where they cross, bands for who has cost less | model: cum, payback |
| 6 | choose | Which is yours | Which one does your own week pick? | 33 chooser | 0 | Four sliders. Two tests as `Kit.bars`, the picked figure lit, the verdict in words | model, live |
| 7 | verdict | Which is yours | Your week decides which one is yours. | 10 pick and alternative | 0 | One card for each laptop with its figure and one line. A frame round the one the chooser picked | model: pick, payback |
| 8 | qa | Appendix | Questions you may ask. | 35 | 0 | Reference page | sources.js |
| 9 | sources | Appendix | Sources. | 35 | 0 | Reference page | sources.js |

What travels between slides: both figures from the title into `same` and on to the head of `difference`. The Studio 15 from there into `why`, where it opens. Both figures and the payback from `choose` into `verdict`.

## Facts that are easy to get wrong

- The cost lines count each price and the extra hours the Light 13 makes the buyer wait. The time both laptops spend on the same work is left out on purpose.
- Heavy hours are counted as they run on the Light 13. The Studio 15 gives back 40% of each, and only on days at a desk.
- On battery the Studio 15 is held to the power of the Light 13. That is why a day away from a desk counts against it, and why the last line of the `why` slide says so.
- Battery hours are computed in the model from watt-hours and the draw in light work. They are not typed anywhere.
- The Studio 15 is the pick only when it passes both tests: it fits the budget, and it pays back inside the years the buyer keeps it.
- The counts in the titles of `same` and `why` are read from the lists in `src/js/hooks.js`. Change a list and the word changes.
- `difference` and `why` take one press for each entry of their list. `data-steps` and the notes must match, and the console says so when they do not.

## To retell this deck for another pair

1. `src/js/hooks.js`: the data block at the top. The two things, what they share, the rows, the parts, the words of the verdict.
2. `src/js/model.js`: `INPUT` and `runModel`. The measures of each thing and the case the room can change.
3. `slides/*.html`: every title, every line, every note.
4. `anatomy/scenes/light.mjs` and `studio.mjs`: call another preset for another kind of thing, then run each file.

## Decisions

Newest first. Date, what was decided, the user's own words where they matter, and which slides it touched.

- **(example)** Waiting is priced at what the buyer says an hour is worth, and that figure is a slider. "Nobody will accept my number for their hour." Slides: years, choose, qa.
- **(example)** Screen, weight and battery stay out of the money. They are rows to weigh, and the verdict names what each pick gives up. Slides: difference, choose, verdict.

## Open questions

- None in the example.

## How to verify a change

1. `npm run build` prints no line starting with ✗.
2. `npm run check` ends with `all slides ok`.
3. `npm run shot -- <id> <press>` for every slide touched, and look at the image.
4. Notes updated in the same edit as the slide.
