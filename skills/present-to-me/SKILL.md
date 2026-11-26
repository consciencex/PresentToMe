---
name: present-to-me
description: Build an interactive, story-driven presentation that runs in the browser, with one idea per slide, press-by-press reveals, animated charts drawn from a live model, isometric 3D anatomy figures, elements that travel between slides, real logos, speaker notes, a presenter window, and a single offline HTML file. Use this skill whenever the user asks for a presentation, slide deck, pitch, keynote, briefing, board or executive deck, a comparison of two things as slides, or a visual way to explain something simply, and whenever they want a document, report, proposal or data turned into slides, even if they only say "slides" or "present this". Also use it to extend, restyle or fix a deck made with it. It starts with a short "Grill with me" interview that finds the story before any slide is built. Not for editing .pptx, Keynote or Google Slides files. ใช้เมื่อผู้ใช้ขอทำสไลด์ พรีเซนต์ deck นำเสนอ หรืออยากอธิบายเรื่องยากให้เข้าใจง่าย
license: MIT
compatibility: Needs Node.js 20 or later and a shell. Playwright (Chromium) is needed for the automated check and screenshots.
metadata:
  author: Suppanimit Meemungkit (Wai)
  version: "1.1.1"
---

# PresentToMe

You build a presentation as a small web project: one HTML file per slide, a model file that owns every number, components that draw and animate, and a build that produces a web page and one offline file. The presenter presses a key, one thing appears, and they say the sentence that goes with it.

This is the storytelling method of Wai (Suppanimit Meemungkit). A hard subject becomes easy to follow when it is told as an interactive presentation in the shape of a martini glass, with animation and continuity doing part of the explaining.

## How a deck gets made here

You do not compose a deck from these pages. You start from a finished deck of the right kind, where the design kit is already wired and working, and you retell it for the user's story. The check then measures the result and fails a deck that lost the kit on the way.

| The request sounds like | Kind | You start with |
|---|---|---|
| "Explain X", "how does X work", "slides about X", a bare topic | `explainer` | The thing as a 3D figure, its parts one per press, where it goes, the process, the numbers, the limit, a slide the room can try |
| "X or Y", "X vs Y", "which should I pick" | `versus` | Both things side by side, what is the same, the rows that differ, what differs inside, the cost over time, a chooser, the verdict |
| "Get this approved", "we need budget", "should we do X" | `decision` | A film opener, why now, options on one basis, tests, how it works, live money, the ask |
| None of these | `blank` | A title, questions and sources. You build the rest from templates |

## Story first, then the design kit

Spend the first effort on what the audience should understand or decide, and the one sentence that gets them there. Every design choice serves that.

Tell the story as a martini glass. The stem comes first. The presenter leads along one path, one idea and one press at a time, until the whole room understands the same thing. Then the mouth opens. The audience asks, sliders move, appendix pages open, and the deck answers. No control is offered before the claim it tests has been made. [references/story.md](references/story.md) explains how to apply this to the talk, the deck and each slide.

The design kit makes the story visible. It has seven parts, and each has a fast way to build it.

| Part of the kit | What it does for the audience | The fast way |
|---|---|---|
| Raised cards | One idea per card: a tag, a short heading, one drawing, one line | `class="card raised"` and the `cards` template |
| Colour with meaning | Three colours, each with one meaning for the whole deck | The tokens `--m1`, `--m2`, `--m3`, written down in `DECK.md` |
| Motion on every press | A press reveals what the speaker says next: a line draws, a bar grows, a part lifts | `pressHook` with a component's `set(t)`, or `data-kit` in the markup |
| Drawn visuals | Charts from the data and diagrams of the real mechanism | `Kit.bars`, `Kit.versus`, `Kit.lines`, `Kit.area`, `Kit.tank`, `Kit.dots`, `Kit.timeline`, `Kit.steps`, `Kit.number` |
| 3D anatomy | An isometric drawing of the real thing whose parts light up and move apart | A preset in `anatomy/scenes/presets.mjs` and `Kit.figure` |
| Live parameters | Sliders on the assumptions the audience doubts. Every later slide follows | `INPUT`, `recompute()` and `data-bind` |
| Continuity | The same object or number travels from one slide into the next, so the story reads as one movement | `data-morph="name"` on the element in both slides |

[references/kit-components.md](references/kit-components.md) has a short example for every component. Read it before you draw anything by hand.

## The bar

A deck made with this skill is finished when all of these hold. `npm run check` measures the first seven and fails a deck of four slides or more that misses one.

| Check key | The rule |
|---|---|
| `pictures` | Every slide has a picture made for it: a chart, a diagram or a 3D figure. Text in boxes is a page of a document. Only the ask or a checklist may be plain (`data-plain`), one slide in four at most |
| `photos` | A photograph is evidence, on two slides at most. It never replaces the drawing |
| `figure` | The deck shows its subject, or the thing its story is about, as a 3D figure |
| `live` | At least one slide lets the room change something and watch the result move |
| `morph` | At least two elements travel between neighbouring slides: the object that enters a larger scene, the number that becomes a line of the next slide |
| `motion` | Every press animates what it adds. Nothing appears with only a fade when it could draw, grow or lift |
| `style` | The house style is kept: light slides, raised cards, the three meaning colours, the type scale. A brand changes the tokens, the logo and the typeface |
| by eye | The titles alone make the argument, the mouth of the martini glass opens near the end, and every screenshot has been looked at |

A rule the deck has a real reason to miss is switched off in `deck.config.json` with the reason: `"kit": { "allow": { "figure": "The subject is a pricing policy. Nothing in it is physical." } }`. Tell the user about every allowance when you hand over. Never use one to get a failing deck through.

## The work, in order

Each step ends with something the user can see and correct.

1. **Grill with me.** Interview the user until the story is clear. Read [references/grill-with-me.md](references/grill-with-me.md) and follow it. The output is a Story Brief the user approves. If the user gave only a topic, still ask the three questions that decide everything: who is the audience, what should they understand or choose, and how long is the talk. If they cannot be reached, choose the most likely answers, mark them `ASSUMED` in `DECK.md`, and say so in your reply.
2. **Name the kind** from the table above.
3. **Find the facts.** A topic with no material needs research before a storyboard. Look up the numbers you need, record each in `src/js/sources.js` with the date you read it, and never write a number from memory as fact. If you cannot look things up, say so and mark the numbers unverified.
4. **Start the deck.** Run `node <this skill>/scripts/new-deck.mjs <new folder> --kind <kind> --title "…" --brand "…"`. Add `--lang th` for Thai slides: it brings a Thai typeface and the type rules Thai needs. Before the first `npm install`, `npx playwright install chromium` or `npm run fonts`, ask the user once: say what will be downloaded and roughly how large (the browser is a few hundred megabytes). If they decline, the build still works: it has no dependencies.
5. **Look at what you were given.** Run `npm run shots` and read the images, then read `src/js/hooks.js`. This is the level of finish the user expects, and you now know which slide does what.
6. **Storyboard against it.** For each slide of the example, decide: retell it, cut it, or add a slide beside it. Write the list in `DECK.md`: id, chapter, title as a claim, what the picture is, which part of the kit it uses, where its numbers come from. Read [references/story.md](references/story.md) for the arc and [references/slide-patterns.md](references/slide-patterns.md) for more patterns. Show the list and get a yes before building.
7. **Retell one slide at a time.** Keep each slide's layout, hook and motion. Change what it says:
   - the text and the notes in `slides/<id>.html`;
   - the data block at the top of `src/js/hooks.js` (the parts, the stages, the rows, the cards);
   - the assumptions in `src/js/model.js`;
   - the figure: in `anatomy/scenes/<name>.mjs`, call the preset nearest the shape of the user's subject, run it, and look at the preview.
   Then `npm run build`, `npm run shot -- <id> <press>`, and look at the image. A new slide comes from a template: `npm run new -- <id> <template>`.
8. **Check the whole deck.** `npm run build` prints no line starting with ✗. `npm run check` ends with `all slides ok`. It also fails while any slide still carries the example's title, or the word TODO. Run `npm run shots` and look at every image.
9. **Hand over.** Tell the user how to present (keys, presenter window), give them `dist/offline.html`, and record open questions in `DECK.md`. For a file or link that other people will open, run `npm run build:public` and hand over `public-build/`, which has no speaker notes. Read [references/build-check-ship.md](references/build-check-ship.md).

For a change to an existing deck, read `DECK.md` first, make the change, then do steps 7 to 9 for the slides you touched.

### Choosing the figure

The figure shows the subject itself, or the thing the story is about. Pick the preset nearest its shape and name its parts for your story.

| Preset | Shape | Suits |
|---|---|---|
| `laptop`, `phone` | A slab that opens into layers | A device and what is inside it |
| `tower` | A case with a side that slides off | A desktop computer, a cabinet with parts inside |
| `rack` | A cabinet whose units slide out | Servers, drawers, a vending machine, lockers |
| `building` | Floors that lift apart | An office, a factory, a hospital, a school |
| `box` | A tray, a product and a lid | A packaged product, a kit, a container |
| `column` | A round body in segments that lift apart | A rocket, a bottle, a battery cell, a silo, a tank |
| `stack` | Any layers on a base | A battery pack, a sandwich of materials, a software stack |

When none is close, write a scene with the helpers in `anatomy/scenes/scene.mjs`. [references/anatomy-3d.md](references/anatomy-3d.md) has the rules. When the subject is not physical at all (a policy, a price list), show the thing the story is about: the building it applies to, the product it changes, the process as a stack.

## Rules

When a case is not covered, follow the reason given for the nearest rule.

- **One idea per slide, stated as the title.** The title is a sentence that makes a claim or asks the question the slide answers, in 4 to 10 words. "Costs" is a label. "Owning costs least from year 7." is a claim. If a slide needs two claims, it is two slides.
- **A press reveals what the speaker says next.** Each press adds one thing. The audience reads whatever is on screen, so anything shown early is read early. `data-steps` on the section is the number of presses.
- **Show it, do not write it.** Aim for under 70 visible words a slide. The picture carries the point, the notes carry the detail, the appendix carries the proof.
- **Colour carries meaning, and keeps it.** Give each of the three colours one meaning for the whole deck and write it in `DECK.md`. A colour used for decoration breaks that mapping.
- **Every number has one home.** A number lives in `src/js/model.js` or comes from a source in `src/js/sources.js`. Slides bind to it with `data-bind` or read `MODEL` in a hook. Mark estimates as estimates. If you cannot source a number, tell the user and leave it out or label it. Never invent one.
- **Compare like with like.** Size every option to the same work and state that basis on the slide in one line. Read [references/numbers-and-comparisons.md](references/numbers-and-comparisons.md) before building any cost or option slide.
- **Pictures are real drawings.** Charts from data, diagrams of the actual mechanism, isometric figures of the actual thing, real logos of the actual companies. No icons in tinted squares, cards with a coloured edge, all-caps bullet lists or glows. The list is in [references/visual-style.md](references/visual-style.md).
- **Keep the house style.** Do not replace `styles/style.css`, add dark slides, or build the look from product photos. If the user asks for another look, change the tokens first and show them.
- **Carry things across.** When the next slide is about the same object or the same number, the audience should see it move there. Tag it with `data-morph` on both slides. A cut between two related slides loses the thread.
- **Notes are the script.** Every slide has speaker notes written as sentences to say aloud, one paragraph per press (`<p data-press="2">`), ending with a sentence that leads to the next slide. Change a slide and you change its notes in the same edit.
- **Any press, any order.** The engine asks a slide for press k in any order: forwards, backwards, or from the menu. Build every slide that has presses with `pressHook({ build, settle, play })`. Read [references/motion-and-interaction.md](references/motion-and-interaction.md).
- **Look at what you built.** After every layout change, take a screenshot and read it. Overlaps, clipped text and weak hierarchy do not show in code.
- **Write decisions down.** `DECK.md` holds the brief, the colour dictionary, and a dated log of what the user decided and why. The next session starts by reading it.

## The deck in one screen

```
deck.config.json     title, brand, currency, fonts, slide order by chapter. Order lives only here.
slides/<id>.html     one slide: <section class="slide" id="…" data-title="…" data-steps="N">
src/js/hooks*.js     the data block of the story, then H.<id> = pressHook({ build, settle, play }) per slide
src/js/model.js      INPUT, runModel(), recompute(): the home of every number
src/js/sources.js    the source registry and the rows of the questions page
src/js/engine.js     stage, presses, keys, notes, menu, Morph, helpers (pressHook, svgEl, tween, placeScene, …)
src/js/kit.js        the chart components: Kit.bars, Kit.versus, Kit.lines, Kit.area, Kit.tank, Kit.dots, …
src/js/kit-figure.js Kit.figure: a 3D figure explained one part per press
styles/style.css     tokens (colour, type), base classes (.card, .raised, .tag, .pk, .chip, .t)
anatomy/scenes/      presets.mjs, examples/, and your scene files
assets/logos/        real logos, available as LOGOS.<name> and as assets/logos/<name>.svg
tools/               build, check, shot, dev, fonts, new-slide, scenes
DECK.md              the brief, the colour dictionary, the decision log
```

The four kinds stay readable inside this skill: `assets/recipes/explainer/`, `assets/recipes/versus/`, and `assets/starter/` (the decision deck and everything every deck shares).

| Command | What it does |
|---|---|
| `npm run dev` | Live preview at http://localhost:5173 on this machine only |
| `npm run build` | Writes `dist/` and `SLIDES.md`. ✗ is an error, · is advice |
| `npm run build:public` | Writes `public-build/` with no speaker notes, for sharing |
| `npm run check` | Opens every slide at every press in Chromium, then measures the bar |
| `npm run shot -- <id> <press> [out.png]` | Screenshot of one slide at one press |
| `npm run shots` | The check, plus one PNG per slide in `shots/` |
| `npm run new -- <id> [cards\|drawing\|split\|versus\|checklist]` | New slide from a template |
| `npm run scenes` | Regenerates the 3D figures |
| `npm run fonts` | Downloads the typefaces so the offline file carries them |

Keys while presenting: → Space PageDown Enter next, ← PageUp Backspace back, N notes, M menu, P presenter window, F full screen, Home and End.

## What to read, and when

| Read | When |
|---|---|
| [references/grill-with-me.md](references/grill-with-me.md) | Before anything else on a new deck |
| [references/story.md](references/story.md) | Planning chapters, order, continuity, titles, and how to explain something hard |
| [references/kit-components.md](references/kit-components.md) | Before drawing any chart or diagram |
| [references/slide-patterns.md](references/slide-patterns.md) | Choosing how a slide makes its point |
| [references/anatomy-3d.md](references/anatomy-3d.md) | Before making or changing a 3D figure |
| [references/motion-and-interaction.md](references/motion-and-interaction.md) | Before writing a hook, a morph or a live control |
| [references/visual-style.md](references/visual-style.md) | Before writing any CSS |
| [references/numbers-and-comparisons.md](references/numbers-and-comparisons.md) | Any slide with money, options, payback or sliders |
| [references/logos-and-sources.md](references/logos-and-sources.md) | Using a real logo or citing a number |
| [references/notes-and-presenting.md](references/notes-and-presenting.md) | Writing notes, a script in a second language, a film opener, rehearsing |
| [references/build-check-ship.md](references/build-check-ship.md) | Build messages, the check and its rules, fonts, sharing, privacy |
| [references/pitfalls.md](references/pitfalls.md) | When something behaves oddly, and once before the final check |

## Working with the user

- Talk in the user's language. Write the slides in the language the audience reads. If you do not know both, ask once.
- Lead with the result. Show a screenshot, say what changed in two or three lines, name what you could not verify.
- The user's corrections are the specification. When they correct a slide, find the general rule behind the correction, apply it to the other slides it touches, and log it in `DECK.md`.
- Ask before anything that installs, downloads, leaves the machine or cannot be undone: `npm install`, a browser download, fonts, an image or logo from the web, a voice or image service, publishing, sending, deleting. Building, checking and taking screenshots need no permission.
- Do not commit to the user's repository unless they ask.
- Speaker notes are inside `dist/`. Anything that other people will open comes from `npm run build:public`. Keep names, prices under negotiation and private remarks out of the slides themselves and out of comments in `src/js`, which ship with the page.
