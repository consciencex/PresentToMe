# Visual style

The look is light, quiet and precise: white stage, thin grey lines, three colours that mean something, one drawing per idea. Read this before writing CSS or drawing anything.

## The stage and its frame

- The stage is 1920 × 1080, white, scaled to fit the window. Size everything in px for that canvas. Never use viewport units inside a slide.
- A thin strip crosses the top of every slide (`--bar`). Set it to one brand colour, or a gradient of the brand's colours in equal segments.
- The brand mark sits bottom right, 30px tall, on every slide except `.slide.bare` (films, title). Put the brand's SVG in `brand/logo.svg`, or set only `brand.name` in the config for a text mark.
- The page number sits left of the brand mark, in mono.
- Outside the stage: a 56px control bar (previous, next, where you are, count, Notes, Presenter, Slides, full screen) with a 2px progress line. A notes panel and a slide menu float above it.

## Tokens

All colour and type come from `:root` in `styles/style.css`. Slides and hooks never contain a raw hex value: CSS uses `var(--m1-ink)`, and SVG drawn by a hook uses `C['m1-ink']`, which reads the same token.

| Token | Use |
|---|---|
| `--bg`, `--bg-2` | Stage background, and an alternate for `.slide.alt` |
| `--surface`, `--surface-2`, `--surface-3` | Cards, tiles, pressed controls |
| `--line`, `--line-2` | Borders and hairlines |
| `--fg`, `--fg-2`, `--fg-3` | Text: strong, normal, quiet |
| `--m1`, `--m2`, `--m3` | The three meaning colours. Each has `-ink` (for text) and `-soft` (a 10 to 12% tint for fills) |
| `--risk`, `--ok`, `--warn` | A limit crossed, a pass, a caution. Used only for those |
| `--f-display`, `--f-body`, `--f-mono` | Titles and big numbers, body, and tags, axes and units |

### Choosing the three meaning colours

Decide what the deck contrasts, and give each side one colour: ours and theirs, today and target, own, rent and buy. Write the dictionary at the top of `DECK.md`:

```
m1 orange  = what we own (the roof, the panels, the saving)
m2 blue    = the grid (today, the bill)
m3 purple  = renting the panels
```

Then hold to it in titles, lines, pills, fills and lit figures. If a brand supplies colours, map the brand's primary to `m1` and pick the others for contrast. Check each `-ink` on white for a contrast of at least 4.5 to 1.

A fourth category gets a neutral grey, or the deck is contrasting too many things.

### Type

| Element | Style |
|---|---|
| Title `.t` | Display, 700, 66px, line height 1.06, slightly wide (`font-stretch: 112%`), balanced over two lines at most |
| Hero headline | Display, 700, 108 to 136px |
| Eyebrow | Mono, 500, 22px, uppercase, letter-spacing .08em, quiet grey, chapter number in m1 ink |
| Card heading `h3` | Display, 600, 26 to 32px, one line |
| Body | Body face, 22 to 32px. Nothing on a slide below 16px, and that only for axis labels |
| Tag `.tag` | Mono, 500, 18px, uppercase, letter-spacing .06em |
| Big number `.big` | Display, 700, 54 to 92px, tabular figures, with a small grey unit |

The default faces are Archivo (display), IBM Plex Sans (body) and IBM Plex Mono, loaded from the link in `deck.config.json`. Change the link and the three `--f-*` tokens for another brand. For a script the body face lacks (Thai, Arabic, CJK), add a companion face to the link and to `--f-body`. Run `npm run fonts` so the offline file carries them.

Uppercase is for tags and eyebrows only. Sentences are in sentence case.

## The house card

Almost every content slide is built from this.

```html
<div class="card raised" data-s="1">
  <span class="tag">1 · Price</span>
  <h3>We don't set the price</h3>
  <svg class="fig" id="pCost" viewBox="0 0 480 440" aria-label="…"></svg>
  <p class="pk">We control how much we use. <b>The supplier sets the price.</b></p>
</div>
```

- `.card` is a flat surface with a 20px radius. `.raised` lifts it: a white-to-surface gradient, a 1px border, a soft shadow.
- The tag names the item. The heading states it. The drawing shows it. The `.pk` line, under a hairline, says what follows from it: a plain clause, then the clause that matters in bold.
- One drawing per card. No bullets inside a card.

## Small parts

| Part | Class | Notes |
|---|---|---|
| Chip | `.chip`, with `.m1 .m2 .m3 .r .g .w` | A 22px pill, optionally with a dot `<i>`. For legends and verdicts |
| Outlined pill | `.pill.m1` | For a named thing on the title slide |
| Segmented switch | `.seg` with `aria-pressed` buttons | For two or three views of one chart |
| Slider | `input[type=range]` | 6px track, 26px thumb. Always inside `.no-swipe` |
| Tile | see `.mw-tile` | Tag, one large figure, one grey line |
| Legend | `.legend` | A coloured dash and a name |
| Tooltip | `bindTip(node, html)` | Dark, 22px, positioned in stage px |
| Checkbox | `.ck` | 60px, fills m1 when ticked, with a spring on the tick |

## Drawings

- Draw in SVG from data, with `svgEl` and `txt`. A chart has a caption that names what it measures, its unit and its basis.
- Line weight: 5px for a series, 3 to 3.5px for a secondary or dashed series, 1px for gridlines in `--line-2`, 2px for the zero line.
- Label lines at their ends, in the line's `-ink` colour. Avoid a separate legend when an end label will do.
- A crossing, a payback or any other point the slide is about gets a hollow ring: white fill, 3.5px stroke in the series colour, 10px radius.
- Axis text is mono, 17px, quiet grey. Keep about six gridlines (`niceStep`).
- Every `<svg>` has an `aria-label` that says what it shows and what to see in it.
- Isometric figures are thin grey line art that lights up in the m1 colour. See [anatomy-3d.md](anatomy-3d.md).

## Layout habits

- Leave the stage margins alone: 120px at the sides, content between about y 230 and 990.
- Two-column slides: the picture takes the wide column (about two thirds), the cards the narrow one (480 to 560px).
- Align hairlines, baselines and card edges across a row. Uneven cards look unfinished.
- Empty space is fine. A slide that feels empty usually needs a larger picture, not more text.
- Check the result at a small size too. If the title and the picture still read as a thumbnail, the hierarchy is right.

## What reads as machine-made

Leave these out. Each one adds ink that carries no meaning, and audiences have learned to read that as filler.

- Line icons in tinted rounded squares, or any icon standing in for a drawing.
- Cards with a coloured left edge, a coloured header bar, or a gradient fill.
- Dark label boxes, glows, neon, glass blur.
- All-caps bullet lists. Emoji as bullets.
- Rings, badges or highlights that do not mean "next", "chosen" or "changed".
- A colour used for variety.
- Source text, footnotes or disclaimers on the slide. They go in the appendix.
- The same figure or illustration on two slides.
- Centered paragraphs of body text. Three-column "feature" grids with a heading and two lines each and no picture.
- A dark slide dropped into a light deck for drama.
- Stock photos of people shaking hands, and any picture that could sit in a different deck unchanged.

When a slide needs something and none of the patterns fit, ask what real thing the point is about, and draw that thing.
