# Build, check, ship

## Set up

```bash
node <skill folder>/scripts/new-deck.mjs ./my-deck --title "The roof can pay the power bill" --brand "Harbor Foods"
cd my-deck
npm install
npx playwright install chromium
```

`new-deck.mjs` writes a blank deck: a title slide, a questions page and a sources page, an empty model and registry, every tool, the templates and the anatomy kit. Add `--example` to start from the full example deck instead. Node 20 or later is required. The deck itself has no runtime dependencies. Playwright is used only by the check and the screenshot tools.

## The loop

```bash
npm run dev                      # http://localhost:5173, rebuilds and reloads on save
npm run new -- pricing cards     # slides/pricing.html from the cards template, added to the last chapter
npm run build                    # dist/ and SLIDES.md
npm run shot -- pricing 2        # shots/pricing-2.png: the slide after press 2
npm run check                    # every slide, every press, in a real browser
npm run shots                    # the check, plus one PNG per slide at its last press
```

After every change to layout or drawing: build, shot, look at the image. Reading the PNG is the step that finds problems.

## What the build does

- Reads `deck.config.json`: title, brand, currency, fonts, styles, scripts, chapters.
- Assembles the slides in chapter order. It writes each eyebrow (chapter number and name) and each appendix number, so authors never type them.
- Moves every `<p class="src">` to the page that holds `<!--SLIDE_SOURCES-->`.
- Puts the brand mark in every slide's footer.
- Makes every `anatomy/scenes/*.data.json` available as `SCN.<name>` and every file in `assets/logos/` as `LOGOS.<name>`. Nothing needs registering.
- Concatenates the scripts listed in the config, in order, into one script. Every file shares one global scope, so wrap each hook file in `(function () { … })();`.
- Writes `dist/index.html` (web), `dist/offline.html` (one file, assets and fonts inlined), `dist/presenter.html`, and `SLIDES.md` (the slide index).

Never edit `dist/` or `SLIDES.md`. They are rewritten on every build.

### Messages

A line starting with ✗ is an error and the build exits with code 1. A line starting with · is advice.

| Message | Meaning and fix |
|---|---|
| ✗ missing slides/x.html | The config lists a slide that has no file |
| ✗ has id="a" but the config calls it "b" | The section id must equal the file name |
| ✗ an element has data-s="3" but data-steps="2" | That element never appears. Raise `data-steps` or fix the number |
| ✗ assets/… is referenced but not found | A missing image or logo |
| ✗ SCN.x is used but … does not exist | Run the scene's `.mjs` file, or `npm run scenes` |
| ✗ slides have src lines but no slide holds SLIDE_SOURCES | Add a sources page (`slides/sources.html` in the example) |
| · N words on the slide | Over 70 visible words. Move detail to the notes |
| · the title is N characters | Over 90. Shorten it to a claim |
| · N presses but the notes are not split by press | Add `<p data-press="k">` paragraphs |
| · a raw hex colour in a style attribute | Use a token |
| · no speaker notes | Add `<aside class="notes">` |
| · a script defines H.x but no slide has that id | A hook for a slide that was renamed or removed |
| · slides/x.html is not in deck.config.json | A draft. It is left out |
| · fonts load from Google Fonts | Run `npm run fonts` for a true offline file |

Treat advice as a question, not an order. A workbench slide may fairly exceed the word count. A slide that is a wall of text may not.

## What the check does

`npm run check` builds, serves `dist/`, and opens the deck in Chromium at 1952 × 1136. For every slide it goes to press 0, steps through every press, steps back to 0 and jumps to the end. It fails on:

- a script error or a console error;
- a file that fails to load;
- anything visible that leaves the 1920 × 1080 stage by more than 4px;
- a text element whose content is clipped by its box;
- a phone-width layout (400px) that scrolls sideways.

Mark a container `data-allow-overflow` when leaving the stage is intended, for example an object that flies in.

It ends with `all slides ok` or a count of problems. `--only 3,7` checks chosen slide numbers. `--shots` saves `shots/NN-id.png`.

A pass means nothing is broken. It does not mean the slide is good. Look at the shots for: text over a line, labels touching, uneven cards, a picture too small for its box, an empty half, a press that changes nothing visible.

Running two checks at once, for example two agents working on one deck: set `DECK_OUT=<folder>` for each so they do not share `dist/`. `PLAYWRIGHT_HOME=<folder with node_modules>` reuses a Playwright installed elsewhere.

## Fonts

The config holds a Google Fonts link. The web build links to it. `npm run fonts` downloads the font files into `public/fonts/` with a `fonts.css`, after which both builds use the local files and `offline.html` embeds them. Run it once per deck and again after changing the link. Check each family's licence before redistributing the files with a public repository.

## Handing over

- **To present from a laptop:** `dist/offline.html`. One file, opens from disk, no network needed once the fonts are embedded. The presenter window (`presenter.html`) must sit beside it.
- **To share a link:** publish the `dist/` folder on any static host. The page carries `noindex` by default (`"noindex": false` in the config removes it).
- **To send as a file:** `offline.html` by itself is the whole deck.

Before any public link:

- Build with `npm run build -- --no-notes`. Speaker notes are otherwise inside the page for anyone who views the source.
- Read the slides once for things that should not leave the room: names, prices under negotiation, internal project names.
- `noindex` asks search engines not to list the page. It does not make the page private. Anyone with the link can open it. For real privacy use the host's access control.
- Publishing is the user's decision. Ask, say what will be public, and report the address afterwards.

After a deploy, confirm that the live page is the build you meant: fetch it and compare it with the local `dist/index.html`.

## Version control and memory

- Commit the deck folder without `dist/`, `shots/` and `node_modules/` (the `.gitignore` covers them). Commit the generated `anatomy/scenes/*.data.json`, so a fresh checkout builds without running the scenes.
- `DECK.md` is the deck's memory: the Story Brief, the colour dictionary, facts that are easy to get wrong, and a dated log of decisions with the user's own words. Update it in the same session as the change. Start every later session by reading it.
- Keep secrets (keys, passcodes) in `.env.local`, which is ignored, and never in source, notes, logs or screenshots.
