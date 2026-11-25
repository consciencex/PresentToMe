# Numbers and comparisons

A decision deck is trusted exactly as far as its numbers are. Read this before building any slide with money, options, payback or a calculator.

## One home for every number

`src/js/model.js` holds three things:

```js
const INPUT = { billMonth: 42000, growth: 0.04, capex: 720000, years: 15 };   // every assumption, with a comment saying where it comes from
function runModel(I) { /* pure: inputs in, results out */ }
function recompute() { MODEL = runModel(INPUT); /* fill data-bind elements */ document.dispatchEvent(new CustomEvent('model')); }
```

- A slide shows a number by binding to it: `<b data-bind="payback"></b>`. `recompute()` fills every bound element.
- A hook that draws reads `MODEL` and `INPUT`, and redraws on the `model` event.
- A number that only one drawing needs and that has no place in the model (an illustrative history, a schematic count) can be a constant in the hook, with a comment that says what it is.
- Never type a figure into slide HTML that the model also holds. The first time an input changes, the typed copy is wrong, and nobody notices until the room does.

Add a `set('key', value)` line in `recompute()` for each bound figure. Format in one place: `fmtMoney(v)` for money, `fmtN(v, decimals)` for counts.

## Labels that say what a number is

Every figure on screen is one of four kinds, and the audience should be able to tell which.

| Kind | How to show it |
|---|---|
| Measured by us | State it plainly. Name the test or meter in the source line |
| Quoted to us | Plain, with the supplier and date in the source line |
| Published by someone else | Plain, with the publisher and the date read |
| Our estimate | Add "est." or "about" on the slide, and the reasoning in the notes |

If a figure cannot be sourced, tell the user, and either leave it off or label it as an assumption. Never fill a gap with a plausible number. One invented figure, once found, discredits the measured ones around it.

When the presenter says a rounder number than the model computes, the slide shows the computed one and the notes say which is which.

## Comparing options: like with like

Most cost slides fail in the same way: each option is sized differently, so the comparison answers no question. Before drawing anything, fix the basis.

1. **Same work.** Size every option to do the same job at the same quality: the same energy, the same capacity, the same number of users. If one option can do more, say so separately. Do not let it show as a bigger benefit.
2. **Same benefit.** If all options deliver the same result, the benefit is one shared line, drawn once. Showing a different "saving" per option makes the audience think the outcomes differ.
3. **Leave out what is equal.** A cost that is identical in every option hides the differences. Remove it from all lines and state that you did. The example deck compares only the energy the roof can supply, because the rest is bought from the grid in every case.
4. **Same period and same prices.** One horizon, one price path.
5. **Fixed and variable, separately.** Each option is a one-time cost plus a cost per month or per unit. Drawn over time, that is a starting height and a slope, and the options become lines that cross.
6. **State the basis in one line on the slide.** "Same energy, same prices, 15 years." It is the caption of the chart.

Then judge on two things only: **when it pays back**, and **the total over the period**. Limits, lock-in and other qualities go in a separate small table. Mixing them into the money makes both unreadable.

Put the simple chart and a small table in the front of the deck. Put the line-by-line calculation, with a source for every row, in the appendix.

## Lines that cross

```js
const cum = { a: [0], b: [0], c: [I.capex] };                 // c starts with its purchase
for (let m = 1; m <= months; m++) { /* add this month's cost to each */ }

// the month series a drops to series b, with the fraction found by straight-line interpolation
const cross = (a, b) => {
  for (let m = 1; m <= months; m++) if (cum[a][m] <= cum[b][m]) {
    const d0 = cum[a][m - 1] - cum[b][m - 1], d1 = cum[a][m] - cum[b][m];
    return m - 1 + (d0 === d1 ? 0 : d0 / (d0 - d1));
  }
  return null;                                                 // they never cross inside the horizon
};
```

- Handle "never": a crossing that does not happen inside the horizon is `null`, and the slide says "never" or drops the ring. Test this by pushing a slider to its extreme.
- Start any search after the purchase month. A line that begins at zero before the purchase is booked looks like an instant payback.
- Let the axis reach past the last crossing, so the crossing is never at the edge.
- Mark each crossing with a ring and a label that names the event and the time ("beats renting · 6.3 yrs").
- Bands under the axis that name the cheapest option per period take their edges from the crossings.

## Saving, payback and return

- Print the answer itself, large: the saving a year, the payback, the total. Two running costs side by side leave the audience to do the subtraction, and the number they came for is the one not on the slide.
- A cumulative saving chart is the cost chart turned into a difference: it starts below zero by the purchase and crosses zero at payback. It makes the gain visible when the cost lines are close.
- Keep hard money apart from soft benefits. Time saved, risk avoided and quality gained are real, but they go in their own view with their own label. Mixed into the payback, they make the payback unbelievable.
- A cost that sits in another budget is still a cost. If a line is left out, list it beside the total as "not counted here", never drop it silently.
- Name lines for what they contain. A line called "our platform" must not include cloud spend that continues.

## A calculator the room can use

The money slide in the example (`slides/money.html`, `H.money`) is the minimal form: inputs on the left, tiles and a chart on the right.

- Give a slider to every assumption the audience is likely to doubt, with a range that includes the pessimistic case.
- Show the three or four results that matter as tiles: payback, total saved, what we pay.
- Compare the result with the organisation's own rule ("inside our 7-year rule") and turn it red when it fails.
- Add a Reset button. Presenters wander.
- Every later slide that shows money must follow the calculator. In the example the approval page and the third test box listen for `model`.
- Prepare two or three moves in the notes in square brackets: "[Set the price rise to zero: owning still ends ahead.]". The presenter then uses the calculator to answer doubt instead of exploring it live.

## Sensitivity

One slide answers "what if you are wrong?". Run the same model with one input changed (a higher price, a year's delay, zero growth) and draw the results on one chart with a ring at each break-even. Say in the notes which input moves the answer most. If no reasonable value of any input reverses the recommendation, say that sentence aloud. It is the strongest line in the deck.

A scenario value you pick yourself is a new number with no source. Prefer the break-even, which is computed: "it still passes our rule until the efficiency falls to 1.6" needs no assumption. If you do show a picked case, label it on the slide as yours ("our cautious case"), and list it with the assumptions.

## Checks before the numbers are shown

- Does each total equal the sum of the rows shown above it?
- Does the figure on the ask equal the figure on the money slide?
- Do the notes quote any number as plain text? If so, will it be wrong after the next model edit? Prefer words like "the figure on the tile".
- Push every slider to both ends. Nothing should print `NaN`, `Infinity`, a negative payback, or a label on top of another.
- Is every outside figure in `sources.js` with the slides that rely on it?
