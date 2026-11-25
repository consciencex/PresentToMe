# Pitfalls

Each of these happened on a real deck. Read the list once before the final check, and come back when something behaves oddly.

## Story and text

| What went wrong | What to do |
|---|---|
| A dense report layout, and a version with three options that each showed a different saving, were both "hard to understand". | One basis for all options, two measures (payback and total), one chart, little text. Detail in the appendix. |
| A slide carried a third point that belonged to a later slide. | One idea per slide. Cut the row, keep the point for its own slide. |
| A label said more than the source did ("mid-tier model" for what the vendor calls "standard access"). | Use the owner's words on the slide. Explain your shorthand in the notes. |
| A limit was drawn with a number the vendor does not publish. | Draw the limit, print no number, add a small line saying it is unpublished. |
| A utilisation bar on one slide showed different shares from the chart that defined them. | Draw both from one array. Never retype a figure. |
| A slide still described last month's decision after the plan changed. | When a decision changes, search every slide, note and script for the old fact. Keep a "facts that changed" list in `DECK.md`. |
| The spoken script kept old numbers after the slides moved on. | Update notes and script in the same edit as the slide. |
| The ask showed an amount the room had not seen before. | Every number on the ask appears on an earlier slide and comes from the same variable. |
| An agent given only a topic built eight slides of text in boxes: no chart drawn, no figure, no motion beyond a fade. | Start from the deck of the right kind (`new-deck.mjs --kind`) and retell it. Keep each slide's layout and hook, and change its data. `npm run check` measures the bar and fails a deck that lost the kit. |
| An agent kept the example's slides and changed only a few words, so half the deck was about the example's subject. | The check fails while a slide still carries the example's title. Retell every slide or cut it. |
| An agent replaced the stylesheet with its own design: dark slides and product photos. | Keep the house style. A brand changes tokens, typeface and logo. See visual-style.md. |
| Two related slides cut from one to the other, and the audience lost the object they were following. | Carry it across with `data-morph`. |

## Layout

| What went wrong | What to do |
|---|---|
| Two labels nearly touched because one share was only 5% wide. | Nudge labels apart in code, and look at the image. Layout rules cannot see collisions. |
| End labels of two close lines printed on top of each other. | Sort the labels by position and enforce a minimum gap. |
| A label sat on the line it described. | Place labels on the side of the curve that is empty: above a falling line's start, below a rising line's start. |
| A row of tiles ran past the right edge of the stage. | The check now fails on this. Count the tiles against the width before adding one more. |
| A long list was cut off at the bottom of its card, and nothing reported it. | The check now reports "cuts off its content" for any box that hides overflow. The sources page steps its type down to fit, and past that it needs a second page. |
| The slide showed two costs and a payback, and never the saving. | Print the answer the audience came for, large. Do not leave them to subtract. |
| A logo's last letters were cut off. | The `viewBox` was narrower than the artwork. Open the SVG alone and check its bounds. |
| The page number sat under a wider logo. | Fixed positions in the footer assume a logo width. Recheck after changing the brand mark. |
| A long title wrapped to three lines. | Shorten the title. Do not shrink the type. |
| Lines for three options sat almost on top of each other. | A large cost that is equal in every option was included. Remove what is equal, and say so in the caption. |
| Tinted bands behind a plot made it grey and cut through the markers. | Keep bands under the axis, outside the plot. |
| Cards in a row had hairlines at different heights. | Give the takeaway line a `min-height`. |
| A `.fill` box stretched and pushed its content past the bottom margin. | Size the SVG `viewBox` so the content fits the box. Let the box set the height, not the content. |

## Presses and state

| What went wrong | What to do |
|---|---|
| Stepping back left the drawing in the later state, or replayed an animation. | Use `pressHook` with a correct `settle(k)`. Animate only the natural next press. |
| A timer from an earlier press fired late and drew over the new state. | Start every timed animation through `m`, so it is stopped on the next press. |
| All parts of a figure appeared at the last press, leaving an empty strip for two presses. | Each press reveals its own part. |
| An invisible button could be clicked before its card was shown. | Hidden cards get `pointer-events: none`. |
| `data-s="3"` on a slide with `data-steps="2"`. | The element never appears. The build reports it. |
| A hook's top-level `const` collided with another file's. | Every script shares one scope. Wrap each hook file in a function. |
| Reordering presses meant rewriting every table in the hook. | Map presses to internal beats with one array, and reorder the array. |
| A hand-off animation played into the wrong slide after a reorder. | Check which slide follows before playing an outro. |
| A drawing built once kept old numbers after an input changed on another slide. | Build from the model on every enter, and redraw on the `model` event. |

## Motion, sound and machines

| What went wrong | What to do |
|---|---|
| On Windows machines with "animation effects" off, the film showed only its last frame, Play ran one second, and the sound button looked on but was silent. Every other slide showed frozen end states. | Presentation decks play full motion by default (`"motion": "full"`). Reduced-motion handling is opt-in. |
| Sound did not start on a fresh browser. | Browsers block audio until the first click or key. Click the page once before starting. Start audio from a user gesture. |
| A browser replayed an old audio file after it was replaced. | Put a content hash in the media file name. |
| Picture and narration drifted. | While the audio plays, read the time from the audio, not from the frame clock. |
| The offline file showed fallback fonts on a machine with no network. | Run `npm run fonts` before the final build. |
| A control that looks active but does nothing. | Whatever state a button shows, pressing it must produce that state. Test each control from a stopped state. |
| A slider drag on a touch screen changed slide. | Put controls in a `.no-swipe` container. |

## Figures

| What went wrong | What to do |
|---|---|
| A new figure rendered blank. | Its data file was missing or stale. Run the scene file, then build. The build reports a missing `SCN` name. |
| The first camera showed the back of the object. | Preview at several azimuths before placing it. The face that tells the story must lead. |
| The same figure appeared at the same size on two slides far apart, and the second read as a repeat. | On the next slide, carry it across with `data-morph` at a new size and in a new role. Further on, draw a second scene from another angle. |
| A part drawn on top of another in the same piece was sorted behind it. | Draw it as an extra of the base part, not as its own item. |
| A lit figure looked flat. | Light only the part the slide is about and keep the rest neutral. |

## Tools and process

| What went wrong | What to do |
|---|---|
| A check passed and the slide was still wrong. | The check finds breakage. Only looking finds a bad slide. Read every shot. |
| A screenshot was taken mid-animation. | Add wait time to the shot, or judge the end state from a later frame. |
| Two builds ran at once into one `dist/` and overwrote each other. | Give each its own `DECK_OUT`. |
| A dev server started before a tool change kept the old build code in memory. | Restart `npm run dev` after editing anything in `tools/`. |
| A QR code pointed at the wrong address. | Decode it after generating it. |
| The published page was not the build that was tested. | After deploying, fetch the live page and compare it with the local build. |
| Speaker notes with a private remark were visible in the page source of a public link. | `npm run build:public` for anything other people will open. |
| A build without notes got its notes back: the check and the screenshot tool rebuild `dist/` with notes. | The public build has its own folder, `public-build/`, which no other tool writes. Publish only that. |
| A scaffold command with an overwrite flag replaced files in an existing project. | `new-deck.mjs` writes only into a new or empty folder. |
| A secret was pasted into a note or a log. | Secrets live in `.env.local` only. |
| A later session undid an earlier decision. | Log each decision in `DECK.md` with the date and the user's words, and read it first. |
| Generated files were edited by hand. | `dist/`, `SLIDES.md` and `*.data.json` are outputs. Edit their sources. |

## Working with the person

- A correction on one slide usually states a rule for all of them. "Less text here" means less text everywhere.
- When the user sends a sketch or a photo, the content is the instruction and the styling is not. Keep the deck's style and take their structure.
- When a request changes a fact (a price, a name, the chosen option), list every slide that shows it and fix them together. Then say which you left alone and why.
- If you make a choice the user did not ask for (replacing a limit line because the plan now exceeds it), say so in the report and offer the alternative.
- Report what you did not verify: a real microphone, the real projector, another browser.
