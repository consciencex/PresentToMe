# DECK.md · How a battery gets a house through the evening

The deck's memory. Read it before changing anything. Update it in the same session as any change the user asked for.

This is the explainer example that ships with PresentToMe. Example Home and its battery are invented, and so is every figure. Keep the structure, the figures and the motion. Replace the story, the titles, the numbers and the notes.

## Story Brief

1. **Audience.** A homeowner with panels on the roof, or thinking about them. Not technical. They have seen the white cabinet in a brochure and do not know what it does after dark.
2. **Decision.** None. This is an explainer. They leave able to explain a home battery to a neighbour.
3. **One sentence.** It saves noon for the evening.
4. **Why now.** The roof makes the most power at noon, when the house uses least. The house uses the most in the evening, when the roof makes nothing.
5. **Proof.** One clear day by the hour, from the house's meter. The battery's data sheet. Three cases where it falls short, shown on the same kinds of chart.
6. **Hard questions.** What happens on a cloudy day? Would a bigger battery be better? Can it run the oven and charge the car?
7. **Numbers.** What the battery holds, what one evening uses, the hours one charge lasts, and the share of a day that comes from the roof. All in `src/js/model.js`. All example data.
8. **Constraints.** 10 minutes. English slides. One screen. No real brand, product or published figure.

Material to show: the battery as a 3D figure, the house as a second figure, one day as three rows over one time axis.

Cut list: price and payback, power cuts, how the cells age. Each is a different talk. The questions page answers the first two in a line.

## Colour dictionary

One meaning per colour, on every slide.

| Token | Colour | Means |
|---|---|---|
| `--m1` | orange | our own energy, on the roof and in the battery |
| `--m2` | blue | the grid |
| `--m3` | purple | what the house uses |
| `--risk` | red | a limit crossed, or a case that falls short |
| `--ok` | green | a pass |

## Storyboard

| # | id | chapter | title (the claim) | pattern | presses | the picture | numbers from |
|---|---|---|---|---|---|---|---|
| 1 | title | Open | It saves noon for the evening. | 2 hero | 0 | the battery cabinet comes together from four layers, then its cells light | model |
| 2 | parts | What it is | Four parts, and only one stores energy. | 20 exploded anatomy | 4 | the same cabinet, large. One layer lifts and lights per press, with a card and one number | model, data sheet |
| 3 | place | What it is | It stands between the roof and the rooms. | 23 carried figure | 2 | the house, with the battery small by its wall. The roof lights, then the rooms | model |
| 4 | day | How it works | Noon's sun runs the evening, in three steps. | 18 stages with one traveller | 3 | three rows over one day (roof, battery, house). A dot goes from the roof into the battery, waits, then goes into the house | model |
| 5 | numbers | How it works | One charge is more than one evening. | 5 raised cards | 3 | a tank filled to one evening against what the battery holds, the hours on one charge, two bars for the share from the roof | model |
| 6 | limits | How it works | Three times the battery needs the grid. | 5 raised cards | 3 | the same tank and bars, each with its limit line, for a winter evening, a cloudy day, and oven and car together | model, illustrative cases |
| 7 | tryit | Your house | Does it get your house through the evening? | 33 chooser | 0 | two sliders, and the day chart redrawn to show when the battery is full, when it is empty and where the grid takes over | model, live |
| 8 | close | Your house | It saves noon for the evening. | 2 hero | 0 | the cabinet, whole and lit, with the share of the evening that needs no grid | model, live |
| A1 | qa | Appendix | Questions you may ask. | 35 questions | 0 | | sources.js |
| A2 | sources | Appendix | Sources. | 35 sources | 0 | | sources.js |

Three joints move. The battery travels from `title` to `parts`, and from `parts` into the house on `place`. The share of the evening travels from its tile on `tryit` to the closing line.

## Facts that are easy to get wrong

- The day is one clear day. The model walks it in quarter hours and starts with an empty battery. It does not carry charge over from the day before.
- "Hours on one charge" is what the battery holds divided by the evening's average draw. It is not a measured run time.
- On `limits`, the winter evening, the thick cloud and the two appliances are constants in the data block of `src/js/hooks.js`. The limit lines come from the model.
- The sliders on `tryit` change `INPUT`. Every slide is built from `INPUT` when it is entered, so the earlier slides follow too. Reset before going back.
- The title's headline and the closing headline are the same sentence. Change one and you change the other.

## Decisions

Newest first. Date, what was decided, the user's own words where they matter, and which slides it touched.

- **(example)** Price and payback are left out. "They asked how it works, not what it costs." Slides: none. The questions page says so.

## Open questions

What is not yet confirmed, who will confirm it, and by when.

- None in the example.

## How to verify a change

1. `npm run build` prints no line starting with ✗.
2. `npm run check` ends with `all slides ok`.
3. `npm run shot -- <id> <press>` for every slide touched, and look at the image.
4. Notes updated in the same edit as the slide.
