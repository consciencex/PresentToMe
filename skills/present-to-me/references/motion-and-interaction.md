# Motion and interaction

How slides move and respond. Read this before writing a hook.

## Two ways to reveal

**Without code.** Give the section `data-steps="N"` and any element `data-s="k"`. The element appears from press k (the engine adds `.is-on`, and CSS fades it up over .55 s). Add class `fade` for a fade without the rise. `data-dim="k"` with class `dim-later` dims an element from press k. This covers cards, tiles, takeaways and anything that only needs to appear.

**With a hook.** For drawings, animation and live numbers, define a hook in a `src/js/hooks-*.js` file:

```js
H.myslide = {
  enter(s) { },        // the slide became active: build once, start loops
  step(s, k) { },      // press k is now current (called after enter, and on every press)
  leave(s) { },        // the slide is no longer active: stop loops and timers
};
```

`s` is the section element. `H` is `Deck.hooks`, so the key is the slide's id. An optional `outro(s, done)` plays a hand-off into the next slide.

## The contract: any press, any order

The engine calls `step(s, k)`:

- after `enter`, with k = 0 when arriving forwards;
- after `enter`, with k = the last press when arriving backwards from the next slide;
- with any k when someone jumps from the menu, reloads the page, or the check walks the deck;
- with k − 1 when the presenter steps back.

So a hook must be able to show press k from nothing. The engine provides `pressHook` for exactly this. Use it for every slide with presses:

```js
(function () {                         // one function scope per file: every script shares one global scope
  let chart;
  H.myslide = pressHook({
    build(s) { chart = drawChart(s.querySelector('svg')); },      // runs on every enter, from the model's current values
    settle(k) { chart.line(k >= 1 ? 1 : 0); chart.marks(k >= 2 ? 1 : 0); },   // the state after press k, nothing moving
    play(k, m) {                                                   // animate the one thing press k adds
      if (k === 1) m.tw(1.4, t => chart.line(t), .1);
      if (k === 2) m.tw(.5, t => chart.marks(t));
    },
    leave() { }
  });
})();
```

- `settle(k)` is the specification of the slide. It sets everything to the state after press k. If it is right, stepping back, jumping in and the automated check all work.
- `play(k, m)` runs only when press k follows press k − 1. `pressHook` has already called `settle(k − 1)`, so `play` animates from there to the same end state `settle(k)` would give. `play(0)` is the entrance animation.
- `m` tracks what `play` starts: `m.tw(seconds, fn, delaySeconds)`, `m.later(ms, fn)`, `m.add(handle)` for anything with a `stop()`, such as the return of `drawPath`. Everything tracked is stopped on the next press and on leaving, so a late timer can never draw over a newer state.
- The easiest way to keep `settle` and `play` consistent is to write each part of the drawing as a function of progress, `part(t)` for t from 0 to 1. Then `settle` calls `part(0)` or `part(1)` and `play` tweens `part(t)`.
- `H.myslide.k` is the current press, for a `model` listener that needs to redraw.

`src/js/hooks-charts.js` and `H.options` in `src/js/hooks-money.js` are complete examples.

## Helpers in `src/js/engine.js`

| Helper | Does |
|---|---|
| `$(sel)`, `$$(sel)` | `querySelector`, and `querySelectorAll` as an array |
| `svgEl(tag, attrs, parent)` | Creates an SVG element |
| `txt(parent, x, y, string, attrs)` | Creates SVG text |
| `F(weight, size, color, family)` | A style string for SVG text: `txt(g, x, y, 'Own', { style: F(600, 20, C['m1-ink']) })` |
| `C['m1']`, `C['fg-3']` | The resolved value of a CSS token, for SVG attributes |
| `pressHook({ build, settle, play, leave })` | The standard hook for a slide with presses (above) |
| `tween(seconds, fn(t), done)` | Calls `fn` with t from 0 to 1. Returns `{ stop }` |
| `loopOn(id, fn(seconds))` | A frame loop. Returns `{ start, stop }` |
| `ease`, `easeOut`, `lerp`, `clamp`, `linear(d0, d1, r0, r1)` | Easing and scales |
| `drawPath(path, seconds, delay)` | Draws a path in, as if by pen |
| `smoothPath(points)` | A smooth line through points that never overshoots |
| `countUp(el, to, seconds, decimals, prefix, suffix)` | Counts a number up |
| `niceStep(span, n)` | A round gridline step |
| `fmtMoney(v)`, `fmtN(v, decimals)` | Money with the deck's currency sign, and grouped numbers |
| `bindTip(node, html)` | A hover tooltip on the stage |
| `placeScene(box, SCN.name, { lit })`, `explodeScene(el, scn, u)` | Places and moves an isometric figure |
| `Deck.go(i, step)`, `Deck.i`, `Deck.step`, `Deck.slides` | Navigation and state |

## What moves, and when

- **On entering:** the slide fades in over .45 s. Things that set the scene draw themselves: the first line of a chart, a figure assembling. Loops start.
- **On a press:** the one thing the speaker says next. One series, one card, one verdict.
- **Furniture slides** (timeline, risks, the ask, appendix) have no presses and animate once on entering.

Typical timings:

| Motion | Duration and easing |
|---|---|
| `data-s` reveal | .55 s, rises 18px |
| A line drawing in | 1.4 s, `ease`. Its end label fades in at 1.2 s, crossing rings at 1.3 s |
| Bars growing | 1 s, `easeOut`, staggered |
| A count-up | 1.2 s |
| A figure assembling | 1.2 to 1.4 s, `easeOut` |
| A camera move or a lift | .6 to .85 s, `ease` |
| A stamp or a tick landing | .3 s with a spring, `cubic-bezier(.3,1.6,.5,1)` |
| Stagger between cards | 120 ms. Between auto-ticks, 650 ms |
| A whole entering sequence | about 2 s |

Motion explains order and cause: this came from that, this grew, this crossed that. If a movement explains nothing, remove it.

## Loops and timers

- Create every continuous animation with `loopOn`, start it in `settle` or `play` for the press that needs it, and stop it in `leave`. A hidden slide then costs nothing.
- Start every timed animation through `m` (`m.tw`, `m.later`, `m.add`). A bare `setTimeout` or `tween` from an earlier press that fires late is the usual cause of a drawing in the wrong state.
- In a hook written without `pressHook`, keep every timer and tween handle in an array and stop them all at the start of each `step` and in `leave`.

## Live numbers

```js
// in the hook
function build() {
  $('#inputs').addEventListener('input', e => { INPUT[e.target.dataset.k] = +e.target.value; recompute(); });
  document.addEventListener('model', draw);     // redraw whenever any input anywhere changes
}
```

- An input writes `INPUT` and calls `recompute()`. It never draws directly.
- `recompute()` reruns the model, updates every `data-bind` element, and fires `model`.
- Every hook that draws from the model listens for `model` and redraws. A slide later in the deck then follows an edit made on the money slide.
- Put controls in a `.no-swipe` container so a touch drag on a slider does not change slide.

## Hover, click and keys

- Hover: `bindTip` on chart marks, bars and dots, for the exact value.
- Click: rows that expand, toggles, parts of a figure, a checkbox that changes a total. Mouse clicks on the stage do not advance the deck, so interactive parts are safe.
- Keys are handled by the engine. They are ignored while focus is in an input (Esc leaves it) and while a modifier key is down.
- A modal sets `Deck.modal = { close, toggle }` when it opens and `null` when it closes. While set, Esc closes it, Space calls `toggle`, and the slide keys do nothing.

## A hand-off between two slides

```js
H.rack.outro = (s, done) => {
  const run = tween(1.1, t => moveFigure(ease(t)), done);     // done() makes the engine go to the next slide
  return { skip() { run.stop(); done(); }, cancel() { run.stop(); reset(); } };
};
```

Pressing next during the outro skips to its end. Any other move cancels it. Before playing, check that the next slide is the one the hand-off was built for, because reordering the deck breaks that assumption.

## Motion and accessibility

`deck.config.json` has `"motion": "full"` by default: the deck plays every animation whatever the operating system's "reduce motion" setting says. Presenting machines, remote desktops and virtual desktops often have animations switched off, and a deck that honours it shows frozen end states and films that do not play. Set `"motion": "respect"` for a deck people will read alone, and then give every hook a still state for `REDUCED`.

Every drawing carries an `aria-label`, controls are real `<button>` and `<input>` elements, and `:focus-visible` is styled in `style.css`.
