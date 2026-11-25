# Deck

An interactive presentation that runs in the browser, built with the [PresentToMe](https://github.com/consciencex/PresentToMe) starter. Plain HTML, CSS and JavaScript on a fixed 1920 × 1080 stage. No framework and no runtime dependencies.

## Run it

```bash
npm install
npx playwright install chromium    # once, for the check and screenshots
npm run dev                        # http://localhost:5173
```

## Present it

Open `dist/index.html` through the dev server, or `dist/offline.html` straight from disk.

| Key | Does |
|---|---|
| → Space PageDown | Next press, then next slide |
| ← PageUp | Back |
| N | Speaker notes |
| P | Presenter window: notes for the current press, next slide, timer |
| M | Slide menu |
| F | Full screen |
| Home, End | First and last slide |

## Edit it

| To change | Edit |
|---|---|
| Slide order, chapters, title, brand, currency, fonts | `deck.config.json` |
| One slide | `slides/<id>.html` |
| A number | `src/js/model.js` |
| A source | `src/js/sources.js` |
| How a slide draws or moves | `src/js/hooks-*.js` (`H.<id>`) |
| Colours and type | `styles/style.css` (`:root`) |
| A slide's layout | `styles/slides*.css` |
| An isometric figure | `anatomy/scenes/<name>.mjs`, then `npm run scenes` |
| A logo | `assets/logos/<name>.svg` |

```bash
npm run new -- <id> cards     # a new slide from a template: cards, drawing, split, checklist
npm run build                 # dist/ and SLIDES.md. ✗ is an error, · is advice
npm run shot -- <id> <press>  # shots/<id>-<press>.png
npm run check                 # every slide at every press in a real browser
npm run shots                 # the check, plus one PNG per slide
npm run fonts                 # embed the typefaces in the offline file
```

`DECK.md` holds the story brief, the colour dictionary and the decision log. Read it before changing the deck. `SLIDES.md` and `dist/` are generated.

## Share it

`dist/offline.html` is the whole deck in one file. For a public link, publish `dist/` after `npm run build -- --no-notes`, which leaves the speaker notes out.

## Credits

Isometric figures are drawn with a vendored subset of the [Anatomy](https://github.com/wheresryan22/anatomy) kit by Ryan (MIT, see `anatomy/KIT-LICENSE`).
