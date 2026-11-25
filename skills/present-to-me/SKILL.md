---
name: present-to-me
description: Build an interactive, story-driven presentation that runs in the browser, with one idea per slide, press-by-press reveals, animated charts drawn from a live model, isometric 3D anatomy figures, real logos, speaker notes, a presenter window, and a single offline HTML file. Use this skill whenever the user asks for a presentation, slide deck, pitch, keynote, briefing, board or executive deck, or a visual way to explain something simply, and whenever they want a document, report, proposal or data turned into slides, even if they only say "slides" or "present this". Also use it to extend, restyle or fix a deck made with it. It starts with a short "Grill with me" interview that finds the story before any slide is built. Not for editing .pptx, Keynote or Google Slides files.
license: MIT
compatibility: Needs Node.js 20 or later and a shell. Playwright (Chromium) is needed for the automated check and screenshots.
metadata:
  author: PresentToMe contributors
  version: "1.0.0"
---

# PresentToMe

You build a presentation as a small web project: one HTML file per slide, a model file that owns every number, hooks that draw and animate, and a build that produces a web page and one offline file. The presenter presses a key, one thing appears, and they say the sentence that goes with it.

The result should feel like a talk the audience can follow without reading: a claim in the title, one picture that proves it, almost no body text. Decoration that carries no meaning reads as machine-made, and the audience stops trusting the content.

## The work, in order

Do these in order. Each step ends with something the user can see and correct.

1. **Grill with me.** Interview the user until the story is clear. Read [references/grill-with-me.md](references/grill-with-me.md) and follow it. The output is a Story Brief the user approves. Skip only when the user hands you a finished outline, and even then check the brief's eight lines against it.
2. **Storyboard.** Turn the brief into a slide list: id, chapter, title as a claim, pattern, number of presses, what the picture is, where its numbers come from. Read [references/story.md](references/story.md) for the arc and [references/slide-patterns.md](references/slide-patterns.md) for the patterns. Show the list and get a yes before building. A wrong story is cheap to fix here and expensive later.
3. **Scaffold.** Run `node <this skill>/scripts/new-deck.mjs <target folder> --title "…" --brand "…"`, then `npm install` in the target. Fill in `DECK.md`: the audience, the decision, the colour dictionary. The finished example deck in `assets/starter/` is your reference for code and quality. Read its slides and hooks before writing your own.
4. **Build one chapter at a time.** For each slide: create it from a template (`npm run new -- <id> <template>`), write the hook, write the notes split by press, add the source line. Then `npm run build`, `npm run shot -- <id> <press>`, and look at the image. Show the user each finished chapter.
5. **Check the whole deck.** `npm run build` prints no line starting with ✗. `npm run check` ends with `all slides ok`. `npm run shots`, then look at every image. A passing check proves nothing about whether a slide is good.
6. **Hand over.** Tell the user how to present (keys, presenter window), give them `dist/offline.html`, and record open questions in `DECK.md`. Deploy only if they ask. Read [references/build-check-ship.md](references/build-check-ship.md).

For a change to an existing deck, read `DECK.md` first, make the change, then do steps 4 to 6 for the slides you touched.

## Rules that make it this kind of deck

Each rule has a reason. When a case is not covered, reason from the reason.

- **One idea per slide, stated as the title.** The title is a sentence that makes a claim or asks the question the slide answers, in 4 to 10 words. "Costs" is a label. "Owning costs least from year 7." is a claim. If a slide needs two claims, it is two slides.
- **A press reveals what the speaker says next.** Each press adds one thing: one line, one card, one verdict. The audience reads whatever is on screen, so anything shown early is read early and the speaker loses the room.
- **Show it, do not write it.** Aim for under 70 visible words a slide. The picture carries the point, the notes carry the detail, the appendix carries the proof. The build warns above 70 words.
- **Colour carries meaning, and keeps it.** Pick at most three meaning colours (`--m1`, `--m2`, `--m3`), give each one meaning for the whole deck, and write it in `DECK.md`. In the example, orange is what we own, blue is the grid, purple is renting, on every slide. Colour used as decoration destroys that code.
- **Every number has one home.** A number lives in `src/js/model.js` or in a source in `src/js/sources.js`. Slides bind to it with `data-bind` or read `MODEL` in a hook. A number typed into two slides will disagree with itself after the first edit. Mark estimates as estimates. If you cannot source a figure, say so to the user and leave it out or label it. Never invent one.
- **Compare like with like.** When options are compared, size them to the same work and state that basis on the slide in one line. Read [references/numbers-and-comparisons.md](references/numbers-and-comparisons.md) before building any cost or option slide.
- **Pictures are real drawings.** Charts from data, diagrams of the actual mechanism, isometric figures of the actual thing, real logos of the actual companies. Never icons in tinted squares, cards with a coloured edge or header bar, all-caps bullet lists, glows, or a second copy of a figure already used. The full list is in [references/visual-style.md](references/visual-style.md).
- **Notes are the script.** Every slide has speaker notes written as sentences to say aloud, one paragraph per press (`<p data-press="2">`), ending with a sentence that leads to the next slide. Change a slide and you change its notes in the same edit.
- **Any press, any order.** The engine asks a slide for press k in any order: forwards, backwards, or jumping in from the menu. Build every slide that has presses with `pressHook({ build, settle, play })`: `settle(k)` draws press k from scratch, and `play(k)` animates only the natural next press. Read [references/motion-and-interaction.md](references/motion-and-interaction.md).
- **Look at what you built.** After every layout change, take a screenshot and read it. Overlaps, clipped text and weak hierarchy are invisible in code.
- **Write decisions down.** `DECK.md` holds the brief, the colour dictionary, and a dated log of what the user decided and why. The next session, yours or another agent's, starts by reading it. Without it, later edits undo earlier decisions.

## The starter, in one screen

```
deck.config.json     title, brand, currency, fonts, slide order by chapter. Order lives only here.
slides/<id>.html     one slide: <section class="slide" id="…" data-title="…" data-steps="N">
src/js/engine.js     stage scaling, presses, keys, notes, menu, helpers (pressHook, svgEl, txt, tween, loopOn, placeScene, …)
src/js/model.js      INPUT, runModel(), recompute(): the home of every number
src/js/sources.js    the source registry
src/js/hooks*.js     H.<id> = pressHook({ build, settle, play }) for each slide that draws or moves
styles/style.css     tokens (colour, type), base classes (.card, .raised, .tag, .pk, .chip, .t)
styles/slides*.css   per-slide styles
anatomy/scenes/      isometric figures: <name>.mjs writes <name>.data.json, available as SCN.<name>
assets/logos/        real logos, available as LOGOS.<name> and as assets/logos/<name>.svg
tools/               build, check, shot, dev, fonts, new-slide, scenes
DECK.md              the brief, the colour dictionary, the decision log
```

Commands, run in the deck folder:

| Command | What it does |
|---|---|
| `npm run dev` | Live preview at http://localhost:5173, rebuilds on save |
| `npm run build` | Writes `dist/index.html`, `dist/offline.html`, `dist/presenter.html`, `SLIDES.md`. ✗ is an error, · is advice |
| `npm run check` | Opens every slide at every press in Chromium. Fails on script errors, missing files, content leaving the stage, clipped text |
| `npm run shot -- <id> <press> [out.png]` | Screenshot of one slide at one press |
| `npm run shots` | The check, plus one PNG per slide in `shots/` |
| `npm run new -- <id> [cards\|drawing\|split\|checklist]` | New slide from a template, added to the config |
| `npm run scenes` | Regenerates the anatomy figures |
| `npm run fonts` | Downloads the typefaces so the offline file carries them |

Keys while presenting: → Space PageDown next, ← PageUp back, N notes, M menu, P presenter window, F full screen, Home and End.

## What to read, and when

| Read | When |
|---|---|
| [references/grill-with-me.md](references/grill-with-me.md) | Before anything else on a new deck |
| [references/story.md](references/story.md) | Planning chapters, order, titles, and how to explain something hard |
| [references/slide-patterns.md](references/slide-patterns.md) | Choosing how a slide makes its point. 30 patterns with layout, presses and technique |
| [references/visual-style.md](references/visual-style.md) | Before writing any CSS or drawing. Tokens, type, cards, what to avoid |
| [references/motion-and-interaction.md](references/motion-and-interaction.md) | Before writing a hook. The `settle(k)` contract, loops, sliders, modals, hover |
| [references/numbers-and-comparisons.md](references/numbers-and-comparisons.md) | Any slide with money, options, payback or a calculator |
| [references/anatomy-3d.md](references/anatomy-3d.md) | When a physical thing or a system should be shown as an isometric figure |
| [references/logos-and-sources.md](references/logos-and-sources.md) | Using a real logo or citing a figure |
| [references/notes-and-presenting.md](references/notes-and-presenting.md) | Writing notes, a script in a second language, a film opener, rehearsing |
| [references/build-check-ship.md](references/build-check-ship.md) | Build messages, the check, fonts, offline file, publishing, privacy |
| [references/pitfalls.md](references/pitfalls.md) | When something behaves oddly, and once before the final check |

## Working with the user

- Talk in the user's language. Write the slides in the language the audience reads. These are often different, and the user will tell you if you ask once.
- Lead with the result. Show a screenshot, say what changed in two or three lines, name what you could not verify.
- The user's corrections are the specification. When they correct a slide, find the general rule behind the correction, apply it to the other slides it touches, and log it in `DECK.md`.
- Ask before anything that leaves the machine or cannot be undone: publishing, sending, deleting. Building, checking and taking screenshots need no permission.
- Speaker notes ship inside the page. If the deck will be on a public link, build with `--no-notes`, and keep names, prices under negotiation and private remarks out of the slides themselves.
