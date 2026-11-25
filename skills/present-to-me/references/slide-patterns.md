# Slide patterns

Thirty ways a slide can make its point. Pick the pattern from the kind of point, then adapt it. Patterns marked **[example]** exist as working code in `assets/starter/`: read that slide and its hook before writing yours.

Stage facts for every pattern: 1920 × 1080. The content box `.in` has padding 88 top, 120 sides, 96 bottom, and is a flex column with a 40px gap. Eyebrow at about y 100, title from about y 130, usable content from about y 230 to 990. Page number and brand sit bottom right.

## Contents

| Kind of point | Patterns |
|---|---|
| Open and close | 1 Film · 2 Hero |
| A trend or a growth | 3 Staircase timeline · 5 Price lines with stat tiles |
| Parallel reasons | 6 Raised cards, one drawing each · 4 Layers mapped to values |
| Options and choices | 7 One switch, three options · 8 Cost lines that cross · 17 Pick and alternatives |
| Capacity and limits | 9 Fill the machine · 10 Glass tanks · 13 Lanes with live controls · 14 Speed with sliders |
| Tests and verdicts | 12 Test strip · 16 Matrix with verdict pills |
| How it works | 15 Anatomy with a beat per press · 18 Layer stack as a spine · 19 Exploded anatomy · 20 Queue simulation · 21 Week view |
| People | 22 Crew floor · 23 Document with a stamp · 24 Responsibility matrix |
| Decision | 25 Money workbench · 26 Sensitivity · 27 Roadmap · 28 Approval checklist · 29 Risk cards |
| Reference | 11 Demo modal · 30 Questions and sources |

Each pattern lists: the point it makes, the layout, the presses, the technique, and what goes wrong.

---

## Open and close

### 1. Film (cold open or interlude) [example: `film`]
**Point.** Make the room feel the problem before any proposal, or break a long chapter.
**Layout.** A full-stage `<svg viewBox="0 0 1920 1080">` on a `.slide.bare`. A control row at the bottom: play, restart, a scrubber, a clock. The controls fade after 1.8 s of play and return when the pointer moves.
**Presses.** None. It plays on entering and pauses on leaving. 15 to 60 seconds.
**Technique.** The film is a pure function `render(t)`. Two helpers do most of the work: `seg(t, a, b)` runs 0 to 1 between two times, and `win(t, a, b)` fades in, holds and fades out. Because nothing but `t` decides the frame, play, pause, scrub and a frame-by-frame video export all show the same film. With an `<audio>` element, the audio's `currentTime` is the clock, so voice and picture cannot drift.
**Goes wrong.** Browsers block sound until the first click or key. Text inside the film needs inline styles, because the deck's `svg text` rule would override attributes. Changing spoken words means recording again. The film's last line should be the title's headline.

### 2. Hero (title and closing) [example: `title`]
**Point.** State the one sentence. At the end, state the principle behind the ask.
**Layout.** `.slide.bare`. A headline of about 108 to 136px in a column on the left, one phrase in a meaning colour. Under it, two short rows of the form "everyday work → [pill]", a hairline, one sentence. On the right, an isometric figure of the real thing with the key part lit.
**Presses.** None. Rows fade in one after another with CSS delays keyed on `.is-active`.
**Goes wrong.** A third row. If it belongs to another slide's point, cut it.

## A trend or a growth

### 3. Staircase timeline with a growing line
**Point.** "Our use keeps growing", with history and plan on one axis.
**Layout.** One wide SVG. Years along the bottom. A staircase rises left to right, one tread per project, with a dot and a name on each. A vertical "today" line separates solid history from dashed plan. A second smooth line above shows the widening scope.
**Presses.** On entering, a sweep draws both series left to right. Press 1 adds a cost under each live tread and a total. Press 2 marks how the planned ones will run.
**Technique.** A `tween` over a time cursor that clips both series. `smoothPath` for the smooth line.
**Goes wrong.** Planned steps are close together. Labels need one centred column each, not two.

### 5. Price lines with stat tiles
**Point.** A market trend from public prices that nobody can dispute.
**Layout.** Left two thirds: a chart titled in plain words with its unit, one smooth line per vendor, an end label with the vendor's logo in a white circle and the last value. Right third: three or four tiles, each a large coloured number and two lines of explanation.
**Presses.** Lines, then tiles (staggered 120 ms).
**Technique.** `smoothPath`, `drawPath`, `data-s` on the tiles.

## Parallel reasons

### 6. Raised cards, one drawing each [example: `pressures`]
**Point.** Two to four parallel reasons, each made concrete by a small animated picture. This is the house style. When unsure, start here.
**Layout.** The title, then a grid of equal `.card.raised` from about y 315 to 960. Each card: a mono `.tag` ("1 · Price"), an `h3` on one line, one `<svg class="fig">`, and a `.pk` line under a hairline: a plain clause, then a bold clause. Give `.pk` a `min-height` so the hairlines line up across cards.
**Presses.** One card per press. Each drawing plays once when its card arrives.
**Technique.** The hook builds every drawing once on first enter, then plays drawing k on press k, guarded by a done flag. Drawings that loop are started in `enter` and stopped in `leave`.
**Goes wrong.** A drawing that is an icon. Each one must be real data or the real mechanism: bars that grow, a tank that fills and overflows, a map with arcs, ropes that pull taut.
**Variant.** A status chip at the right of the tag row ("hardware limit" green, "to test" amber) when the cards answer "who is responsible for what".

### 4. Layers mapped to values
**Point.** Why owning or changing a layer matters, without numbers.
**Layout.** One large panel. Left: five stacked boxes (the organisation, layer by layer). Right: five values with a line each. Dashed connectors join each layer to its value.
**Presses.** One value and connector per press. A final press lights the layer the talk is about and asks the question the next slides answer.
**Technique.** Static HTML and `data-s`.

## Options and choices

### 7. One switch, three options
**Point.** One routing decision, three ways to carry it out.
**Layout.** A full-width raised bar across the top (the switch). Three raised cards below. Coloured curves leave the bar and reach each card, with a dot travelling along each. Each card: tag "Option A · …", h3, the vendor logos top right, an isometric scene, a mono caption, three short lines, a hairline, one bold sentence.
**Presses.** One option per press.
**Technique.** A pre-built scene per card. Curves and dots drawn by the hook with `loopOn`.

### 8. Cost lines that cross [example: `options`]
**Point.** Which way of paying is cheapest depends on how long or how much. The break-even is read off the chart.
**Layout.** A large raised figure on the left with a caption that states the basis ("same energy, same prices"). On the right, one card per option with its total, then a takeaway.
**Presses.** On entering, line A draws. Press 1 draws line B. Press 2 draws line C, with a hollow ring at each crossing and a label ("beats renting · 6.3 yrs").
**Technique.** The model produces cumulative series. Crossings are found by straight-line interpolation between months. Under the axis, soft bands say which option has cost least so far, and their edges are the crossings, so a band can never disagree with the lines. End labels are pushed apart so two close lines never overprint. The chart redraws on the `model` event.
**Goes wrong.** Options that are not sized for the same work. Lines that sit on top of each other because the chart includes a large cost that is equal in every option: leave the common part out and say so. Tints behind the plot (they grey it). All bands appearing at once (the strip sits empty for two presses).

### 17. Pick and alternatives
**Point.** State the decision and keep the alternatives visible but subordinate.
**Layout.** The chosen card tinted in the m1 colour with a thin m1 frame, a figure and a price. Beside it the alternative, greyed with a light hatch (`.card.off`). Optionally a comparison table below with the chosen column marked.
**Presses.** One card per press, then the table or the takeaway.
**Technique.**
```css
.card.off > * { filter: grayscale(1); opacity: .5 }
.card.off { box-shadow: none; position: relative }
.card.off::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: repeating-linear-gradient(135deg, transparent 0 14px, var(--line-2) 14px 15px) }
```

## Capacity and limits

### 9. Fill the machine
**Point.** One user leaves the thing mostly idle. Adding users press by press fills it. Full is what pays.
**Layout.** A raised utilisation card: a large percentage, a legend that gains one row per press (dot, name, "+N%", and one grey line showing the formula), and a stacked area with a dashed "plan" line and a hatched idle region. Beside it, an isometric figure of the machine used as a gauge: a lit copy clipped from the bottom to the current share.
**Presses.** Up to ten: each tenant is introduced, then poured in.
**Technique.** `settle(k)` for the state after press k, and a `go(k)` that animates only from k − 1. The gauge is two copies of one scene, the lit one under a `clip-path`.
**Goes wrong.** Claiming 100%. Keep the plan line below it. Show the formula per row so every percent can be traced.

### 10. Glass tanks with overflow
**Point.** A capped allowance against demand: what does not fit goes somewhere.
**Layout.** Two tanks of different height side by side, each a rounded rectangle filled to the demand level. The short one has a dashed red cap line. Demand above the cap is a pale dashed outline labelled "overflow", with a dashed arrow to where it goes.
**Technique.** SVG by hook, fill height tweened.
**Goes wrong.** Drawing the overflow as a solid block when its size is unknown. Printing a limit the vendor does not publish.

### 13. Lanes with live controls
**Point.** "Does everything fit at once?", answered with the audience able to change the assumptions.
**Layout.** Left panel: one row per workload with selects and a slider, a memory figure per row, and a total shown as a bar of coloured segments. Right: one row per candidate with a capacity bar, the need overlaid, and a verdict pill.
**Presses.** On entering, the smallest setup. Press 1 plays the controls one at a time to the planned setup, with a ring on each control as it changes.
**Technique.** Each control writes the row's object and calls `render()`. Controls live in a `.no-swipe` container.
**Goes wrong.** Replaying the animation when arriving backwards. Only forward from press 0 plays.

### 14. Speed with sliders
**Point.** "Fast enough for the people who wait?", under a load the audience can change.
**Layout.** A row of need cards with sliders on top, a total bar, then one row per candidate: a rounded pipe with moving dots, a large rate, a verdict pill.
**Technique.** `loopOn` moves the dots at a speed tied to the rate, one scale for every row.
**Goes wrong.** Showing a maximum as if it were the capacity under the planned load. Judge every candidate at the same load.

## Tests and verdicts

### 12. Test strip [example: `tests`]
**Point.** Frame a choice as tests, and show progress through them.
**Layout.** Three large raised boxes: a big number, a tag, a question as h3, a small result drawing, a flag at the top right.
**Presses.** One box per press. The current box lifts 8px and takes a 3px m1 ring with a soft halo. Finished boxes carry a tick. Boxes not reached are dim.
**Technique.** One hook can serve several strip slides, with a `data-focus` attribute on the section naming the lit box.
```css
.strip.has-focus .box:not(.focus) { opacity: .5; filter: saturate(.4) }
.box.focus { box-shadow: 0 0 0 3px var(--m1), 0 0 0 12px var(--m1-soft), 0 18px 38px var(--shadow); transform: translateY(-8px) }
```
**Goes wrong.** A ring with no meaning. Every ring means "next", "chosen" or "changed".

### 16. Matrix with verdict pills
**Point.** How each candidate does against the same requirement, and which pass.
**Layout.** A requirement strip on top. Below, one column per candidate: name, spec, a drawing of how the work fits inside it, a verdict pill (red "out", amber "later", green "option A") and a short reason. Passing columns take an m1 frame.
**Presses.** Empty columns, then the fit, then the verdicts.
**Technique.** SVG by hook, opacity transitions with per-element delays.
**Goes wrong.** Looking candidates up by index. Use ids, so adding one does not shift every slide.

## How it works

### 15. Anatomy with a beat per press
**Point.** Explain a mechanism by pointing at its parts.
**Layout.** A large isometric figure on the left with floating labels. A raised card on the right whose content changes with each beat.
**Presses.** Up to seven beats: assemble, then one part or one behaviour per press.
**Technique.** A generated figure with named pieces and exported anchors. Tables per beat (what is lit, the card text). A `PRESS = [2, 0, 1, 3]` array that maps presses to beats lets the order change without touching the tables.

### 18. Layer stack as a chapter spine
**Point.** Keep the audience oriented through a long technical chapter.
**Layout.** Left: a stack of thin isometric plates, labelled. Right: a raised card with the current layer's question and a route of the slides that answer it.
**Presses.** Each return of the slide lifts the next plate.
**Technique.** The small `Iso` class in `src/js/iso.js` draws boxes that can lift, rotate by drag, and take clicks. Route rows are read from the deck order, so moving a slide moves its row.

### 19. Exploded anatomy with a card per press [example: `anatomy`]
**Point.** "What is physically in it", one component at a time.
**Layout.** The figure takes about two thirds of the stage. The lit part moves out along its own axis. A raised card names it: tag, h3, one line, one figure. A thin leader joins card and part.
**Presses.** One part per press. A final state lights all parts with one takeaway.
**Technique.** `placeScene`, `explodeScene`, `data-lit` on the solids of one piece. See [anatomy-3d.md](anatomy-3d.md).
**Goes wrong.** Using the same figure on two slides. Draw a new scene from a different angle.

### 20. Queue simulation with sliders and tiles
**Point.** Show that a policy keeps things under control, and let the audience overload it.
**Layout.** A wide SVG: sources on the left, a gate, two lanes, slots on the right, an overflow box. Below: sliders for load and a row of tiles with live figures.
**Presses.** None. It runs while the slide is active.
**Technique.** A small simulation per frame in a `loopOn`: arrivals by `Math.random() < rate * dt`, queues sorted by priority then arrival, tiles updated every few frames.
**Goes wrong.** Presenting illustrative rates as measured. Say in the notes which numbers are made up. Keep the tile row inside the stage.

### 21. Week view with a toggle [example of the chart idea: `day`]
**Point.** A load over time, before and after a change.
**Layout.** A segmented toggle, legend chips, a stacked area with a limit line, and optionally a heat map by day and hour.
**Presses.** One press switches the state, the same as clicking the toggle. The areas morph.
**Technique.** A `tween` between two precomputed series.

## People

### 22. Crew floor with camera zoom
**Point.** Who runs it: who is there today, what roles are needed, how each is filled.
**Layout.** An isometric floor divided into team zones. A raised card on the right. A summary strip at the end.
**Presses.** Today's people, then the roles needed, then how each is filled (hire, upskill, partner), then one press per team with the camera zooming to it.
**Technique.** The camera is a tween of the SVG `viewBox`. Labels are scaled by about the zoom to the power −0.55 so they stay readable.
**Goes wrong.** Role data kept in three places. One table should drive this slide, the responsibility matrix and the head count on the ask.

### 23. Document with a stamp
**Point.** A deliverable is ready, shown as the real document.
**Layout.** A raised "paper" card with the document's real text in two columns. A rotated stamp top right. A side card with one figure. A timeline strip below.
**Presses.** One: the stamp lands.
```css
.stamp { opacity: 0; transform: rotate(-9deg) scale(1.9); transition: opacity .18s ease, transform .32s cubic-bezier(.3,1.6,.5,1) }
.doc.stamped .stamp { opacity: .95; transform: rotate(-9deg) scale(1) }
```

### 24. Responsibility matrix
**Point.** One accountable owner for every job.
**Layout.** A grid: teams across, jobs down in labelled groups. Cells hold small circles for accountable, responsible, consulted, informed.
**Presses.** One group per press. Clicking a team highlights its column.
**Technique.** Rows from a data table with a rule checked in code: exactly one accountable owner per job.

## Decision

### 25. Money workbench [example: `money`]
**Point.** The full calculation, editable in the room, so every "what if" is answered on the spot.
**Layout.** The title and three to five tiles on top. Left: a panel of inputs. Right: the chart.
**Presses.** None, or one to draw the second line.
**Technique.** Every input writes `INPUT` and calls `recompute()`, which reruns the model and fires the `model` event. Every later slide that shows money listens and follows. `niceStep` keeps about six gridlines whatever is typed. A Reset button restores the defaults.
**Goes wrong.** A label that claims more than the line holds. Benefits mixed into a cost line. A payback search that starts before the purchase. A slide after this one that typed its own copy of a number.

### 26. Sensitivity
**Point.** What happens if a key assumption is wrong, or if we wait.
**Layout.** Two raised cards in the house style: the outside trend with a dashed fan of scenarios, and our result under each scenario with a ring at each break-even.
**Technique.** Both charts run the same model with one input changed.

### 27. Roadmap with a live "today"
**Point.** When things happen, and where we are now.
**Layout.** Numbered phases on the left. A month grid on the right with a rounded bar per phase, a diamond for the approval, a flag for go-live, and a dashed "today" line.
**Presses.** None. Bars grow in sequence on entering.
**Technique.** "Today" is computed from the real date, and each phase's state (done, now, later) is derived from it.

### 28. Approval checklist [example: `decision`]
**Point.** The ask, as a short formal list of decisions with amounts.
**Layout.** One raised box. Each row: a 60px checkbox, the decision in bold, one line of detail, the amount large on the right. A total under a rule, with the payback beside it.
**Presses.** None. The boxes untick on entering and tick one by one (700 ms, then every 650 ms). Clicking a row unticks it and the total follows.
**Technique.** Native checkboxes styled with a spring on the tick. Amounts bound from the model.
**Goes wrong.** An amount the audience has not seen before. A row whose cost belongs to another budget shown as a sum: write words instead ("no new cost").

### 29. Risk cards
**Point.** Each risk with its mitigation, made concrete.
**Layout.** A 3 × 2 grid of raised cards: tag (the area), h3 (the fear, in 3 to 5 words), a small drawing, one line of mitigation.
**Presses.** None. All drawings play once on entering, staggered by 120 ms inside one tween.
**Technique.** Each drawing builder returns a function of t from 0 to 1. One tween drives them all with offsets.

## Reference

### 11. Demo modal with video and a QR code
**Point.** Let the room try a live thing without leaving the deck.
**Layout.** A button on the relevant card opens a modal: a screen recording with captions drawn by the page, chapter chips that seek, a QR code, a short notice.
**Technique.** Opening sets `Deck.modal = { close, toggle }`, so the engine gives the keys to the modal: Esc closes, Space plays or pauses, arrows do nothing. Focus moves into the modal and returns on close. The QR is an inline SVG generated offline. Decode it once to confirm it holds the right address.
**Goes wrong.** A button that can be clicked while its card is still hidden. Give the hidden card `pointer-events: none`.

### 30. Questions and sources [example: `qa`, `sources`]
**Point.** Hold every hard question and every citation without crowding the front.
**Questions.** A two-column grid of `<details>` rows. Opening one closes the others.
**Sources.** The build takes each slide's `<p class="src">` off the slide and writes the list into every element holding `<!--SLIDE_SOURCES-->`, split by text length across pages. A second list renders the registry in `src/js/sources.js` by group, with the slide numbers that rely on each entry.
**Goes wrong.** A list that runs off its page. Add another holder page. The check fails when text is clipped.
