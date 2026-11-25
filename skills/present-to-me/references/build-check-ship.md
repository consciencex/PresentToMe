# Build, check, ship

## Set up

```bash
node <skill folder>/scripts/new-deck.mjs ./my-deck --kind explainer --title "How the battery gets a house through the evening" --brand "Example Foods"
cd my-deck
npm install
npx playwright install chromium
```

`--kind` chooses the deck you start from. Each kind is a complete deck that already passes the check: its figure, its drawings, its live slide and its morphs are wired. Its story, titles, numbers and notes are an example, and you replace every one.

| Kind | For | Starts with |
|---|---|---|
| `explainer` | How something works, or what it is | The thing as a 3D figure, its parts one per press, the process, the numbers, a slide the room can try |
| `versus` | A or B | Both things side by side, what is the same, the rows that differ, what differs inside, the cost over time, a chooser |
| `decision` | Asking for a yes | Why now, options on one basis, tests, how it works, the money, the ask. This is the example deck in `assets/starter/` |
| `blank` | A story that fits none of the three | A title, a questions page and a sources page |

Every kind brings every tool, the kit components, the templates, the scene presets and the Anatomy scene tools. `new-deck.mjs` writes only into a new or empty folder.

Node 20 or later is required. The deck itself has no runtime dependencies. Playwright is used only by the check and the screenshot tools. `npm install` and `npx playwright install chromium` download packages and a browser, so ask the user before the first run.

## The loop

```bash
npm run dev                      # http://localhost:5173, rebuilds and reloads on save
npm run new -- pricing cards     # slides/pricing.html from a template: cards, drawing, split, versus, checklist
npm run build                    # dist/ and SLIDES.md
npm run shot -- pricing 2        # shots/pricing-2.png: the slide after press 2
npm run check                    # every slide, every press, in a real browser, and the bar of the design kit
npm run shots                    # the check, plus one PNG per slide at its last press
```

`npm run new` adds the slide to the last chapter before the appendix. Name another chapter as a third argument.

After every change to layout or drawing: build, shot, look at the image. Reading the PNG is the step that finds problems.

## What the build does

- Reads `deck.config.json`: title, brand, currency, fonts, styles, scripts, chapters.
- Assembles the slides in chapter order. It writes each eyebrow (chapter number and name) and each appendix number, so authors never type them.
- Moves the `<p class="src">` lines of each slide to the page that holds `<!--SLIDE_SOURCES-->`.
- Puts the brand mark in every slide's footer.
- Makes every `anatomy/scenes/*.data.json` available as `SCN.<name>`, and every `.svg`, `.png` and `.webp` in `assets/logos/` as `LOGOS.<name>`. Nothing needs registering.
- Concatenates the scripts listed in the config, in order, into one script. Every file shares one global scope, so wrap each hook file in `(function () { … })();`.
- Writes `dist/index.html` (web), `dist/offline.html` (one file), `dist/presenter.html`, and `SLIDES.md` (the slide index).

A slide file starts with `<section class="slide…" id="…"`, in that order, and needs a `data-title`.

Never edit `dist/` or `SLIDES.md`. They are rewritten on every build.

### Where the build writes

The build writes to `dist/`, or to the folder named by `--out` or `DECK_OUT`. It never empties a folder. It removes only the files its own previous run wrote there, which it lists in `.deck-build.json`. It refuses the deck folder, any source folder, and any other folder that holds files it did not write.

### Messages

A line starting with ✗ is an error and the build exits with code 1. A line starting with · is advice.

| Message | Meaning and fix |
|---|---|
| ✗ missing slides/x.html | The config lists a slide that has no file |
| ✗ slide "x" is listed twice | Remove one entry from the chapters |
| ✗ must start with `<section class="slide…" id="x">` | The first tag of the file, with class before id |
| ✗ has id="a" but the config calls it "b" | The section id must equal the file name |
| ✗ needs data-title | The title shown in the menu and the slide index |
| ✗ an element has data-s="3" but data-steps="2" | That element never appears. Raise `data-steps` or fix the number |
| ✗ assets/… is referenced but not found | A missing image or logo |
| ✗ assets/… points outside the assets folder | The path climbs out with `..`. Keep files inside `assets/` |
| ✗ SCN.x is used but … does not exist | Run the scene's `.mjs` file, or `npm run scenes` |
| ✗ src/js/x.js is listed in "scripts" but not found | A script name in the config with no file |
| ✗ slides have src lines but no slide holds SLIDE_SOURCES | Add a sources page (`slides/sources.html`) |
| ✗ speaker notes are still in the page after --no-notes | Notes written in another tag. Use `<aside class="notes">` |
| ✗ the output folder … choose another | See "Where the build writes" |
| · N words on the slide | Over 70 visible words. Move detail to the notes |
| · the title is N characters | Over 90. Shorten it to a claim |
| · N presses but the notes are not split by press | Add `<p data-press="k">` paragraphs |
| · a raw hex colour in a style attribute | Use a token |
| · no speaker notes | Add `<aside class="notes">` |
| · a script defines H.x but no slide has that id | A hook for a slide that was renamed or removed |
| · slides/x.html is not in deck.config.json | A draft. It is left out |
| · fonts load from Google Fonts | Run `npm run fonts` for a true offline file |

Treat advice as a question, not an order. A slide of controls may fairly exceed the word count. A slide that is a wall of text may not.

## What the check does

`npm run check` builds, serves the build on this computer only, and opens the deck in Chromium at 1952 × 1136. For every slide it goes to press 0, steps through every press, steps back to 0 and jumps to the end. It fails on:

- a script error or a console error;
- a file that fails to load;
- anything visible that leaves the 1920 × 1080 stage by more than 4px;
- a box that hides its overflow and cuts off its content;
- a phone-width layout (400px) that scrolls sideways;
- the word `TODO` left on a slide or in its notes;
- a slide that still carries the title of the example the deck was started from;
- a deck that misses the bar of the design kit (next section).

Mark a container `data-allow-overflow` when leaving the stage is intended, for example an object that flies in.

Each slide's row says what the slide uses:

```
 6  anatomy         4 presses  ok   3D figure 39% · hook · morph site
 7  day             3 presses  ok   3D figure 4% · drawing 35% · hook · morph site
 9  decision        0 presses  ok   hook · morph capex payback · plain
```

The percentage is the share of the stage the picture fills. `text only` marks a slide with no picture. It ends with `all slides ok` or a count of problems. `--only 3,7` checks chosen slide numbers and skips the kit rules. `--shots` saves `shots/NN-id.png`.

### The bar of the design kit

A deck can load without an error and still be pages of text in a style of its own. The check measures what the deck draws, moves and lets the room change, and fails a deck of four body slides or more that misses a rule. Appendix slides are not counted.

| Key | The rule | What counts |
|---|---|---|
| `pictures` | Every slide has a picture | A drawing or a 3D figure that fills 6% of the stage or more, or a narrow figure that is over a third of its height. A slide marked `data-plain` is exempt (the ask, a checklist). One slide in four may be plain |
| `photos` | A photograph is the only picture on two slides at most | An image, video or canvas of 5% of the stage or more, on a slide with no drawing |
| `figure` | The deck has a 3D figure | A scene placed with `Kit.figure` or `placeScene` |
| `live` | The room can change something | A slider, a select, `.seg` buttons, or any control marked `data-live` |
| `morph` | Something travels between slides | The same `data-morph` name on two neighbouring slides: two such joints, or one in a deck under six body slides |
| `motion` | Every press moves the drawing | Each slide with presses has a hook or a kit component in markup mode |
| `style` | The house style is kept | No dark slide, and at least one raised card |

A rule the deck has a real reason to miss is switched off in `deck.config.json`, with the reason:

```json
"kit": { "allow": { "figure": "The subject is a pricing policy. Nothing in it is physical." } }
```

The check prints each allowance. Tell the user about every one when you hand over. An allowance is for a deck the rule does not fit. It is not for a deck that ran out of time.

A pass means nothing is broken and nothing is missing. It does not mean the slide is good. Look at the shots for: text over a line, labels touching, uneven cards, a picture too small for its box, an empty half, a press that changes nothing visible.

Running two checks at once, for example two agents working on one deck: set `DECK_OUT=<a new folder>` for each so they do not share `dist/`. `PLAYWRIGHT_HOME=<folder with node_modules>` reuses a Playwright installed elsewhere.

## Fonts

The config holds a Google Fonts link. The web build links to it, so a viewer's browser fetches the typefaces from Google. `npm run fonts` downloads the font files into `public/fonts/` with a `fonts.css`, after which both builds use the local files and `offline.html` embeds them. Run it once per deck and again after changing the link. The tool fetches from Google Fonts over https and from nowhere else. Check each family's licence before redistributing the files with a public repository.

## Handing over

Two builds exist, and they go to different folders.

| Command | Folder | Speaker notes | For |
|---|---|---|---|
| `npm run build` | `dist/` | Inside the page and in `presenter.html` | The presenter's own computer |
| `npm run build:public` | `public-build/` | Left out, with the presenter window | Anything other people will open |

The check, the dev server and the screenshot tools all rebuild `dist/` with notes. Nothing but `build:public` writes `public-build/`, so publish only that folder.

- **To present from a laptop:** `dist/offline.html`. It opens from disk. Images in `assets/` are inside it, and so are the typefaces once `npm run fonts` has run. Sound and video in `public/media/` stay separate files, so keep the `media/` folder beside it. The presenter window (`presenter.html`) must sit beside it too.
- **To share a link:** publish `public-build/` on any static host. The page carries `noindex` by default (`"noindex": false` in the config removes it).
- **To send as a file:** `public-build/offline.html`, with the `media/` folder if the deck has sound or video.

Before anything leaves the presenter's computer:

- Use the public build. The other one carries the notes for anyone who views the source.
- A build without notes still ships the comments in `src/js/`. Keep private remarks out of code comments.
- Read the slides and the sources page once for things that should not leave the room: names, prices under negotiation, internal project names. No tool removes them.
- `noindex` asks search engines not to list the page. It does not make the page private. Anyone with the link can open it. For real privacy use the host's access control.
- Publishing is the user's decision. Ask, say what will be public, and report the address afterwards.

After a deploy, confirm that the live page is the build you meant: fetch it and compare it with the local `public-build/index.html`.

## Version control and memory

- Do not commit, push or create a repository unless the user asks.
- A commit takes the deck folder without `dist/`, `public-build/`, `shots/` and `node_modules/` (the `.gitignore` covers them). Keep the generated `anatomy/scenes/*.data.json` with the deck, so a fresh copy builds without running the scenes.
- `DECK.md` is the deck's memory: the Story Brief, the colour dictionary, facts that are easy to get wrong, and a dated log of decisions with the user's own words. Update it in the same session as the change. Start every later session by reading it.
- Keep secrets (keys, passcodes) in `.env.local`, which is ignored, and never in source, notes, logs or screenshots.
