# Notes, scripts and presenting

You write what the presenter says, and you keep it in step with the slides.

## Speaker notes

Every slide ends with notes. They are written to be said aloud.

```html
<aside class="notes">
  <h4>Three ways to pay</h4>
  <p>This chart compares one thing only: the power the roof could supply. A, in blue, is today. We pay for every unit, and the line climbs for as long as we operate.</p>
  <p data-press="1">B, in purple, is renting. No money down, and the line is a bit lower. But it is still a line that climbs forever.</p>
  <p data-press="2">C, in orange, is owning. It starts high, because we pay on day one. Then it is almost flat. [If asked: panels are warrantied for 25 years.] Next: does it fit our building?</p>
</aside>
```

- **One paragraph per press.** The text before the first `data-press` is said when the slide appears. `<p data-press="k">` starts what is said after press k. Paragraphs that follow without the attribute stay with that press. The notes panel (N) dims what belongs to later presses, and the presenter window shows the block for the current press.
- **Spoken sentences.** Short, in the first person, in the order the eye moves. Read them aloud once. If a sentence is hard to say, rewrite it.
- **Say what the picture shows, then what it means.** "The orange line starts high. That is the purchase." The audience looks where the words point.
- **Square brackets are not read aloud.** Use them for stage directions ("[Drag the slider to zero.]") and for answers to keep ready ("[If asked: …]").
- **End with a bridge.** The last sentence names the next slide's question. "Next: does it fit our building?"
- **Length.** 60 to 250 words a slide. Much longer means the slide holds two ideas.
- **Do not quote model numbers as text** when the presenter can read them off the slide. "The figure on the tile" survives a model edit. "5.4 years" may not.

The build warns when a slide has presses and its notes are not split by press.

Notes are inside `dist/`. For anything other people will open, use `npm run build:public`.

## Keeping words and slides in step

The rule that prevents most rehearsal pain: a change to a slide and the change to its notes happen in the same edit.

- A press added, removed or moved means the `data-press` paragraphs are renumbered.
- A number changed in the model means a search of the notes for that number as text.
- A slide moved means the bridge sentences of the slide before its old place and its new place are rewritten.

## A script in a second language

Presenters often show slides in one language and speak in another. Keep the spoken script as its own file, `docs/script-<language>.md`, one section per slide in deck order:

```markdown
## 4 · options · Pay the grid, rent the panels, or own them.
<!-- slide: options -->
(what is said when the slide appears)

<!-- press: 1 -->
(what is said after press 1)

<!-- press: 2 -->
(what is said after press 2)
```

- The `<!-- slide: id -->` line ties the text to the slide by id, so reordering slides does not misalign the script.
- Translate meaning, not sentences. The script is what a person would naturally say in that language.
- Keep product names, units and the words that appear on the slide in the slide's language, so the audience can match voice to screen.
- When a slide changes, update both the notes and the script section.

## The presenter window

Press P in the deck. A second window opens (`dist/presenter.html`) and follows the deck:

- the notes for the current press in a highlighted band, earlier presses dimmed, later ones bright;
- "press k of n", the first words of the next press, or the next slide's title;
- a timer that starts at the first move (R resets it), and + and − for the type size.

Arrow keys in either window move both. The two windows talk over `BroadcastChannel` and, as a fallback for files opened from disk, `postMessage`. Each command carries a sequence number, so a command that arrives on both channels moves the deck once.

Typical setup: the deck in full screen on the projector, the presenter window on the laptop.

## Rehearsal

Rehearse with the real deck, aloud, with a timer. Then fix what the rehearsal showed.

- **Time each chapter.** Compare with the plan from the Story Brief. Cut slides, not sentences, when over.
- **Listen for presses that wait.** If the presenter talks for a minute before pressing, the slide needs another press or the notes need trimming.
- **Listen for presses that rush.** Three presses in five seconds are one press.
- **Mark every stumble.** A stumble is a sentence to rewrite or a term to introduce a slide earlier.
- **Try the hard questions.** Ask the three from the brief and open the appendix page that answers each.
- **Rehearse on the real machine and screen once.** Fonts, sound, full screen and the second window all behave differently there.

## Before walking in

- `dist/offline.html` is on the laptop and opens with the network off. Run `npm run fonts` before the final build so it carries its typefaces.
- Click once on the page before starting. Browsers block sound until the first click or key.
- Full screen is F. The deck remembers the slide if the page is reloaded.
- The presenter window opens from the deck with P. Browsers may block a window that the page opens by itself.
- Know two shortcuts: M opens the menu to jump to any slide, including the appendix. Home returns to the start.

## A film opener

A 15 to 60 second film before the title sets the mood without the presenter saying a word. See pattern 1 in [slide-patterns.md](slide-patterns.md) and `Film` in `src/js/hooks-open.js`.

- Three or four scenes, one short sentence each, large type, one moving picture per scene.
- Show the outside world or the felt problem. No proposal, no product.
- The last line is the title's headline, word for word.
- With narration: write the script first, then record the voice. A generated voice sends the script to a voice service, so ask the user before using one. Then set each scene's times to the voice. Put an `<audio id="filmAudio">` in the slide. While it plays, its clock drives the film. Any change to the spoken words means a new recording, so settle the words early.
- Name a media file after its content (a short hash in the file name) when it may change. Browsers replay a cached old file under an unchanged name.

## Going further: a prompter that follows the voice

For a long talk, the presenter window can grow into a prompter. The deck this skill was distilled from had one. Its design is worth knowing before you build your own:

- The unit is a block: everything said after one press. The window shows the whole block and changes block when the deck moves. Nobody scrolls.
- Three line states, always visible from across a room: said (dim, ticked), now (a filled band), not yet (bright).
- Voice follow is optional and must run on the device only. Check that on-device recognition is available before starting, and never fall back to a cloud recogniser: the script holds the presenter's own words.
- The follower tolerates paraphrase by matching key words in order across the block, and it never presses the deck. At the end of a block it waits for the presenter's key.
- If the script is published with the deck, encrypt it with a passphrase and decrypt in the browser, or leave it out of the public build.
