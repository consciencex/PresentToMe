# Kit components

`src/js/kit.js` draws the common charts for you, in the house style, with the motion already built in. Use a component before you draw a chart by hand. The appendix slide "The kit at a glance" (`slides/kit.html`, `src/js/hooks-kit.js`) shows every one with example data.

## How every component works

```js
let c;
H.weight = pressHook({
  build(s) { c = Kit.bars(s.querySelector('svg'), { items: [{ label: 'Air', value: 1.24, tone: 'm1' }, { label: 'Pro', value: 1.55, tone: 'm2' }], unit: 'kg' }); },
  settle(k) { c.set(k >= 1 ? 1 : 0); },
  play(k, m) { if (k === 1) m.tw(c.dur, c.set); }
});
```

- `Kit.<name>(svg, options)` builds the whole drawing at once and returns `{ set, part, dur, el }`.
- `set(t)` draws one frame. `set(0)` is empty, `set(1)` is finished, and the same `t` always gives the same frame. Tween it with `m.tw(c.dur, c.set)`.
- `part` holds the pieces you can bring in one press at a time, for example `c.part.line('own', t)`.
- `dur` is the suggested length of the animation in seconds.
- Build in `build(s)`, which runs on every enter. The component measures its text, so it must be in the page when it is built.

Options every SVG component takes:

| Option | Meaning |
|---|---|
| `size` | `[width, height]` of the viewBox. Text sizes are in these units, so match the box the SVG fills (a house card drawing is about `[480, 440]`) |
| `label` | The `aria-label`: what the drawing shows and what to see in it |
| `caption` | A mono caption at the top left, such as `'MONTHLY BILL · $'` |
| `format` | How numbers print: a function, or `'money'`, `'moneyExact'`, `'pct'` (0.42 prints 42%), `'n'`, `'n1'`, `'n2'`. The default keeps as many decimals as the data has, up to two |
| `unit` | Added after each value: `'kg'` prints `1.24 kg`, `'%'` prints `42%` |

Tones are `'m1'`, `'m2'`, `'m3'`, `'risk'`, `'ok'` and `'grey'`. Give each meaning colour one meaning for the whole deck, as `visual-style.md` says.

## Markup mode: a chart with no JavaScript

```html
<div class="card raised kit-card" data-s="1">
  <svg data-kit="bars" aria-label="Weight of two models"
    data-kit-data='{"size":[480,300],"unit":"kg","items":[{"label":"Air","value":1.24,"tone":"m1"},{"label":"Pro","value":1.55,"tone":"m2"}]}'></svg>
</div>
```

- Any element with `data-kit="<name>"` and `data-kit-data='{json}'` is built when its slide is entered. No hook and no `scripts` entry are needed.
- It plays when its press arrives: the press of the closest `data-s` element around it, or on entering when there is none. Several components on one press start 120 ms apart.
- `data-kit-dur="2"` sets the seconds. Function options such as a custom `format` are not possible in JSON. Use the named formats.
- The JSON sits in single quotes, so write an apostrophe as `&#39;`. Bad JSON shows as a console error that names the component, and the check reports it.
- A slide that drives a component from its own hook (one part per press, a model that changes) calls `Kit.<name>` in the hook instead of using `data-kit`.

## bars

Compares one value across 2 to 8 items, optionally against a limit.

```js
Kit.bars(svg, { size: [480, 300], unit: 'kg', ref: { value: 1.8, label: 'our limit 1.8 kg' },
  items: [{ label: 'Air', value: 1.24, tone: 'm1' }, { label: 'Pro', value: 1.55, tone: 'm2' }, { label: 'Max', value: 2.1 }] });
```

- `items`: `{ label, value, tone }`. Items without a tone are grey.
- `dir`: `'h'` or `'v'`. By default bars are vertical, and horizontal when a label or value is wider than its column.
- `ref`: `{ value, label, tone }`, a dashed line. A value that would print across it moves inside its bar when it fits.
- `max`: the value at the full length. Set it when two bar charts must share a scale.
- Parts: `bar(i, t)`.

## versus

A against B over several rows: the main component for product and option comparisons.

```js
Kit.versus(svg, { size: [880, 420], a: { name: 'Model A', tone: 'm1' }, b: { name: 'Model B', tone: 'm2' }, rows: [
  { label: 'Weight', a: 1.24, b: 1.55, unit: 'kg', better: 'low' },
  { label: 'Battery', a: 18, b: 14, unit: 'h', better: 'high' },
  { label: 'Price', a: 1299, b: 1099, format: 'moneyExact', better: 'low' }] });
```

- Each row has its own scale, shared by its two bars, because the units differ from row to row.
- `better` is `'low'` or `'high'` (default). The better value gets a ring at its bar end and bold type. Equal values get no ring.
- A row may set its own `unit`, `format` and `max`.
- Row labels wider than about a third of the width move above the bars, which needs about 70 units of height per row.
- Parts: `row(i, t)` and `names(t)`, the two names at the top. When rows arrive one per press, show the names first with `c.part.names(1)`. The template `node tools/new-slide.mjs <id> versus` is a full slide of this, in markup mode.

## lines

One or more series over x: growth, cost over time, two options that cross.

```js
Kit.lines(svg, { size: [960, 520], x: [0, 1, 2, 3, 4, 5], format: 'money',
  series: [{ id: 'own', label: 'Own', tone: 'm1', values: [720e3, 760e3, 800e3, 840e3, 880e3, 920e3] },
           { id: 'rent', label: 'Rent', tone: 'm3', dash: true, values: [0, 200e3, 400e3, 600e3, 800e3, 1000e3] }],
  cross: { a: 'own', b: 'rent', label: 'owning wins from here' },
  bands: [{ from: 0, to: 4.5, label: 'renting costs least', tone: 'm3' }, { from: 4.5, to: 5, label: 'owning', tone: 'm1' }] });
```

- `x`: numbers (placed by value) or strings (placed evenly). `xFormat` prints numeric x ticks.
- `series`: `{ id, label, tone, values, dash, end }`. The end label is `label` and the last value, pushed apart so two close lines never overlap. `end` replaces its text.
- `marks`: `[{ series, x, label, tone }]`, a ring on the line at that x.
- `cross`: `{ a, b, label, tone }`, a ring where series a and b first cross.
- `bands`: `[{ from, to, label, tone }]`, zones under the x axis.
- `smooth: true` draws curves through the points. `min` and `max` fix the y range.
- Parts: `axes(t)`, `line(id, t)`, `marks(t)`, `bands(t)`. For one series per press, show the axes in `settle` and draw one line per press.

## area

Stacked shares that add up to a total: load by source, cost by line.

```js
Kit.area(svg, { size: [960, 520], x: ['00', '06', '12', '18', '24'], unit: 'kW', limit: { value: 90, label: 'grid limit' },
  layers: [{ id: 'cold', label: 'Cold rooms', tone: 'm2', values: [30, 32, 40, 36, 30] },
           { id: 'light', label: 'Lighting', tone: 'm1', values: [8, 14, 18, 20, 9] }] });
```

- The first layer sits at the bottom. A legend at the top names each layer.
- `limit`: `{ value, label, tone }`, a dashed line, red by default.
- Parts: `layer(id, t)`, `limit(t)`. Layers rise one by one in `set`.

## tank

A level against a cap: storage, a budget used, a quota.

```js
Kit.tank(svg, { size: [320, 440], value: 520, cap: 400, unit: 'kWh', tone: 'm2', capLabel: 'cap' });
```

- The vessel fills to `value`. Above `cap` the extra is a dashed red outline, and `over by …` prints under the value.
- `max` sets the vessel's full height. By default it is 12% above the larger of value and cap.
- `overLabel` replaces "over by".

## dots

A count out of a whole, where the whole should be felt: 65 of 540 pallets.

```js
Kit.dots(svg, { size: [480, 440], total: 540, groups: [{ count: 65, label: 'at risk', tone: 'risk' }] });
```

- `groups` colour the first dots in order. The rest stay grey. Each group's count counts up as its dots fill.
- `cols` fixes the number of columns. By default the grid fills the box.
- Above about 1,000 dots each one is too small to see. Show a rate instead.

## timeline

A plan: phases, milestones and where we are today.

```js
Kit.timeline(svg, { size: [960, 360], start: 2025, end: 2028, today: 2025.4,
  phases: [{ label: 'Survey', from: 2025, to: 2025.5 }, { label: 'Build', from: 2025.5, to: 2026.6, tone: 'm1' }, { label: 'Run', from: 2026.6, to: 2028, tone: 'm2' }],
  milestones: [{ at: 2025.5, label: 'board yes' }, { at: 2026.6, label: 'power on' }] });
```

- `start` and `end` are numbers, for example decimal years (`yearOf('2026-03-01')` converts a date).
- Phases that do not overlap share one row. Set `row` to place one yourself.
- Labels go inside a bar when it is thick and long enough, above it otherwise.
- Milestone and today labels stack in levels so they never touch.
- `ticks`: numbers or `[{ at, label }]`. `tickFormat` prints the numbers. `todayLabel` replaces "today".

## steps

How something works, as 3 to 6 steps joined by arrows.

```js
Kit.steps(svg, { size: [960, 240], steps: [{ label: 'Sun on the roof' }, { label: 'Inverter' }, { label: 'Our load first', tone: 'm1' }, { label: 'Grid gets the rest', sub: 'export' }] });
```

- Boxes appear in order. Each arrow draws in after its box, with a dot travelling along it.
- A long label wraps over up to three lines, then its type steps down to 14px. It is never cut, but keep labels to about four words.
- `tone` on a step outlines the step the slide is about. `sub` adds a mono line under the label.
- Parts: `flow(u)` places the travelling dot along the whole chain, for a loop: `loopOn('id', s => c.part.flow((s % 3) / 3))`.

## number

One big figure that counts up, with its unit and one grey line. HTML, not SVG.

```js
Kit.number(div, { value: 72, unit: '%', line: 'of the roof is usable', tone: 'm1' });
```

- `format` and `prefix` work as above. `px` sets the font size (92 by default, from `.big`).
- The element gets class `kit-num`. Styles are in `styles/kit.css`.

## Mistakes to avoid

- A `size` far from the box it fills. Text is sized in viewBox units, so a 960-wide viewBox in a 480px card prints 9px labels.
- Building before the slide is in the page. Text widths then measure as zero and labels collide.
- More than three colours in one chart. Use grey for the rest.
- A number typed into `data-kit-data` that the model also holds. Use a hook and read `MODEL` instead, as `numbers-and-comparisons.md` says.
- `styles/kit.css` and `kit` missing from `deck.config.json`. A blank deck needs both.
