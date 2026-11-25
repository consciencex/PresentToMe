# DECK.md · The roof can pay the power bill

The deck's memory. Read it before changing anything. Update it in the same session as any change the user asked for.

This is the example deck that ships with PresentToMe. Harbor Foods is invented, and so is every figure.

## Story Brief

1. **Audience.** The board of Harbor Foods. The CFO decides. A saving project last year did not deliver, so the fear is paying now for a saving that may not come.
2. **Decision.** Approve buying an 800 kWp rooftop solar system.
3. **One sentence.** The roof can pay the power bill.
4. **Why now.** The grid price keeps rising, the bill follows our busiest hour, and cuts come when the grid chooses.
5. **Proof.** Our own hourly meter data. The roof survey. The installer's quote.
6. **Hard questions.** Why not rent the panels and keep the cash? What if prices stop rising? What happens at night?
7. **Numbers.** The monthly bill, the price rise, the system price, payback and total saved. All in `src/js/model.js`.
8. **Constraints.** 10 minutes. English slides. One screen. No public link.

## Colour dictionary

One meaning per colour, on every slide.

| Token | Colour | Means |
|---|---|---|
| `--m1` | orange | what we own: the roof, the panels, the saving |
| `--m2` | blue | the grid: today, the bill |
| `--m3` | purple | renting the panels |
| `--risk` | red | a limit crossed |
| `--ok` | green | a pass |

## Facts that are easy to get wrong

- The cost lines compare only the energy the roof can supply (26% of use). The rest is bought from the grid in every option and is left out on purpose.
- On a sunny day the roof supplies about 30% of the day's energy. Over a year it is 26%. Both figures are right, and the notes say which is which.
- The film's last line and the title's headline are the same sentence. Change one and you change the other.

## Decisions

Newest first. Date, what was decided, the user's own words where they matter, and which slides it touched.

- **(example)** Renting stays on the cost slide as a real option, with the admission that it is cheapest in the first years. "The CFO likes it because there is no money down." Slides: options, money, qa.

## Open questions

- None in the example.

## How to verify a change

1. `npm run build` prints no line starting with ✗.
2. `npm run check` ends with `all slides ok`.
3. `npm run shot -- <id> <press>` for every slide touched, and look at the image.
4. Notes updated in the same edit as the slide.
