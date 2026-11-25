# Real logos and real sources

Naming the actual companies, products and documents makes a deck concrete. A real logo beside a real price reads as fact. A generic "Cloud Provider A" box reads as a draft. This file covers how to use both properly.

## Logos

### When a logo belongs on a slide

A logo identifies the thing next to it. Use one when the slide talks about that company or product: at the end of that vendor's line on a chart, at the top right of that option's card, inside the shape that stands for that service, beside the product name in a caption.

A logo never decorates. No "trusted by" wall, no row of marks to look connected.

### Getting the file

1. Ask the user first. They may have the organisation's own logo files and partner logos with permission.
2. For other companies, take the mark from the company's own brand or press page. That is the correct artwork, and the page states the terms.
3. Prefer SVG. Use PNG only when the owner publishes nothing else.
4. Save it as `assets/logos/<name>.svg`, with a short lowercase name.
5. Record where it came from in `assets/logos/SOURCES.md`: file, source address, date, licence or terms. Do this when you add the file. Reconstructing it later is slow.

Open libraries of brand marks exist and are convenient. Their licence covers the drawing of the icon, not the trademark, and some companies ask that their marks not be redistributed that way. When a deck will be public, check the owner's own page.

Downloading a file is an action the user should approve: say what you want to fetch and from where before fetching it.

### Using it on a slide

In HTML, reference the file. The build inlines it for the offline version:

```html
<img src="assets/logos/acme.svg" alt="Acme">
```

In an SVG drawn by a hook, use the `LOGOS` map the build provides (a data address for every file in `assets/logos/`):

```js
svgEl('circle', { cx: x, cy: y, r: 22, fill: C.bg, stroke: C['line-2'] }, g);
svgEl('image', { href: LOGOS.acme, x: x - 14, y: y - 14, width: 28, height: 28 }, g);
```

| Place | Size |
|---|---|
| In a header pill with other marks | 28px tall |
| Top right of a card | about 34px tall |
| Beside a product name in a caption | about 48px tall |
| At the end of a chart line, in a white circle | 24 to 28px |
| The presenter's own brand, footer of every slide | 30px tall |
| The presenter's own brand, title slide only | about 66px tall |

### Rules that keep it fair and correct

- Use the artwork unchanged: no recolouring, stretching, cropping or effects. The one accepted change is showing an option that was not chosen in grey, together with the rest of its card.
- Keep clear space around the mark, about half its height.
- Use the mark only to refer to the company or its product, in a statement that is true and sourced. Do not suggest that the company endorses the deck.
- Put the company's words next to its logo. If the vendor says "standard access", write that. Put your own shorthand in the notes.
- Never print a figure next to a logo that the company does not publish. If the limit is unpublished, draw the limit without a number and say in a small line that it is unpublished.
- A logo on a slide is a use of someone's trademark. For an internal talk this is ordinary practice. For a deck that will be published, tell the user that each owner's brand terms apply, and that this is not legal advice.

The starter ships no third-party logos, for that reason. `assets/logos/` holds only a README.

## Sources

### The source line

Every slide that shows an outside figure carries one line, just before the page number:

```html
<p class="src">Tariff history: utility schedule, read 3 March. Quote: installer, 800 kWp, 12 February. Logos: Acme (acme.com/brand).</p>
```

The build removes the line from the slide and lists it on the appendix page that holds `<!--SLIDE_SOURCES-->`, with the slide number and title. The slide stays clean, and the proof is one click away. If the list outgrows its page, add another slide with the same placeholder: the build splits the list between them by length.

Write the line so that a stranger could find the document: who published it, what it is, the date. Say "our estimate" or "example data" when that is the truth.

### The registry

`src/js/sources.js` lists each outside source once:

```js
['tariff', 'cost', 'Utility tariff schedule and five-year price history (read 3 March)', 'https://…', ['pressures', 'options']],
// id, group, title with publisher and date, address ('' when it was given to us privately), the slides that rely on it
```

The appendix renders it by group with the slide numbers. Adding the slide ids is what makes a later change safe: when a source is corrected, you know which slides to revisit.

### Reading and citing

- Read the source yourself before citing it. A figure passed along from memory or from a summary is not sourced.
- Quote prices and limits with the date you read them. They change.
- Separate what the source states from what you infer. "The vendor states X. We conclude Y." If the conclusion is yours, the slide must not put it in the vendor's mouth.
- When a source does not state something the story needs, the slide says "to confirm" or "to test", and the notes say who will confirm it and when.
- Keep private sources private. A quote or an internal report is cited by name and date with no link, and it is left out of any public build.

### Notes for hard questions

Anything the presenter may be challenged on goes in the notes in square brackets, next to the press where it could come up:

```html
<p data-press="2">… [If asked: the vendor never says the basic tier runs an older model. "Mid-tier" is our shorthand.]</p>
```

The slide stays simple, and the presenter is covered.
