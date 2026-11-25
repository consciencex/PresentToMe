# Story: order, devices, titles, and explaining hard things simply

Read this after the Story Brief is approved and before you write the slide list.

## Contents

1. The arc
2. Why that order works
3. The martini glass
4. Continuity
5. Sizing the deck to the time
6. Devices that hold a long deck together
7. Explaining a hard thing simply
8. Titles
9. Cutting a slide into presses
10. The storyboard format

## 1. The arc

A decision deck moves through these jobs. A chapter is one job. Short decks merge chapters and never reorder them.

| Chapter | Its job | Typical slides |
|---|---|---|
| Open | Make the room feel the problem before any proposal. A short film or one striking picture, then the title: the one sentence. | 1 to 2 |
| Why now | What is changing that the audience cannot argue with, and what it costs to wait. Outside forces first, then our own numbers. | 2 to 6 |
| Options | The ways to respond, compared on the same basis. No recommendation yet. | 1 to 3 |
| Proof | The doubt the audience has, asked as a question, then answered with evidence: the market's, then our own test. | 2 to 4 |
| First case | One concrete use, with honest numbers, including where it is small. | 1 to 3 |
| From one to many | The turn: why the single case becomes a platform, a programme, a standard. | 1 to 2 |
| Choosing | The choice framed as tests that candidates pass or fail, ending in the pick. | 3 to 10 |
| How it works | What it is made of and how it runs: parts, layers, people. | 3 to 15 |
| Decision | The money, what happens if we wait, the timeline, the ask, the risks, the closing line. | 4 to 6 |
| Appendix | Questions and answers, detail, sources. Never presented, always ready. | as needed |

The example deck in `assets/starter/` is the short form: Open (film, title), Why now (pressures, options), Does it fit us (tests, anatomy, a day), Decision (money, the ask), Appendix (questions, sources, the kit). It merges Options into Why now, and its chapter "Does it fit us" holds both the proof and the how-it-works slides.

### Three kinds of talk

Not every talk asks for a decision. Name the kind before the storyboard, because it sets the arc and the deck you start from (`new-deck.mjs --kind`).

| The request sounds like | Kind | The audience leaves able to |
|---|---|---|
| "Explain X", "how does X work", "a talk about X", a bare topic | `explainer` | Explain it to someone else |
| "X or Y", "X vs Y", "which should I pick" | `versus` | Choose, and say why |
| "Get this approved", "we need budget", "should we do X" | `decision` | Say yes or no to a stated ask |

**An explainer** follows one thing from outside to inside to in use.

| Beat | Its job | The picture |
|---|---|---|
| Open | The question the audience would ask, and the thing itself | Its 3D figure, assembling |
| The whole | What it is made of | The same figure, one part lit and named per press |
| The process | What happens, in order, to one traveller | Stages with the traveller moving through them |
| The numbers | The two or three numbers that make it real | Bars, a tank, one big number |
| The limit | What it cannot do, or what it costs | The same chart with the limit drawn |
| Try it | The room tests it on its own case | A chooser or a slider |
| Close | The one sentence again | The figure, whole |

**A versus** keeps both things on screen and removes everything that does not separate them.

| Beat | Its job | The picture |
|---|---|---|
| Open | The choice, and who is choosing | Both figures side by side, each in its colour |
| The same | What is equal, so nobody compares it again | The shared parts, greyed and counted |
| The difference | The few measures that separate them | Versus rows, one per press |
| Why | What differs inside that causes it | One figure opened, the part that differs lit |
| Over time | What the difference costs or gives over years | Two lines that cross, or bars per year |
| Choose | The room's own case | A chooser: their work, their budget |
| Verdict | Who should take which | One line for each |

An explainer and a versus still have a stem and a mouth, they still open with the audience's question, and they still end by saying one sentence. They have no ask, so the last slide is the sentence to remember.

## 2. Why that order works

- **The outside world comes before us.** Public facts need no defence. The audience agrees with the first slides, and agreement carries.
- **Need before solution.** Growth and pressure first, then the options. Naming a product on slide two makes every later slide a sales pitch.
- **Doubt is answered before money.** If the room privately thinks "will it even work?", no cost slide will land. Put that question in a title and answer it with evidence.
- **One concrete case before the general claim.** People believe a platform after they have seen one tenant. Admit what that one case cannot justify alone. That admission is what makes the next chapter necessary.
- **A choice is shown as a test.** "We prefer B" invites argument. "Three tests, and only B passes all three" invites checking. Say the tests before the results.
- **The ask comes after every number in it has been seen.** Nothing on the approval slide should be new.
- **Risks follow the ask.** Placed before it, they read as hesitation. Placed after, they read as a plan.
- **Anything contestable or detailed lives in the appendix.** The front stays simple, and the presenter can open any proof when asked.

## 3. The martini glass

The shape of every talk built with this pack is a martini glass: a narrow stem, then a wide mouth.

- **The stem** is the story as the presenter tells it. One path, one idea at a time, one press at a time. The audience cannot wander, so everyone arrives at the same understanding.
- **The mouth** opens when the stem is done. Now the audience steers: they ask, the presenter moves a slider, opens an appendix page, jumps to a slide from the menu. Many paths, all starting from the shared understanding the stem built.

The name comes from Segel and Heer's study of narrative visualization, which found this to be the most common structure in the interactive stories they examined: an author-driven narrative first, then reader-driven exploration ([Narrative Visualization: Telling Stories with Data, 2010](https://idl.uw.edu/papers/narrative)). The same study notes that individual slides of an interactive slideshow often work the same way, each making the author's point before inviting interaction.

Apply it at three sizes.

| Size | The stem | The mouth |
|---|---|---|
| The talk | The presentation, start to ask | Questions, with the deck as the instrument for answering them |
| The deck | Open, why now, proof, choice: press by press, no controls | The money slide with its sliders, the questions page, the appendix, the menu |
| The slide | The presses, in order, each with its sentence | After the last press, the controls on that slide come alive: a slider, a toggle, a hover |

Rules that keep the glass in shape:

- **Stem before mouth, always.** No control is offered before the claim it tests has been made. A slide that opens with sliders is a dashboard, and the audience explores without knowing what to look for.
- **Open the mouth where doubt lives.** Put a slider on each assumption the audience is likely to challenge, and nowhere else. The Story Brief's hard questions tell you which.
- **Keep the mouth bounded.** Two to six controls, each with a sensible range, and a Reset. Every position of every slider must give a true and readable result.
- **Prepare the first moves.** Write two or three slider moves into the notes in square brackets. The presenter then uses the controls to answer doubt, and does not explore live.
- **Let the mouth feed the ask.** Whatever the room sets on the money slide, the slides after it follow. The decision is then made on numbers the audience chose.

What goes wrong:

- All mouth and no stem: an interactive dashboard presented as a talk. Nobody knows what to conclude.
- All stem and no mouth: a film. Fine for five minutes, but the doubt in the room is never answered.
- A mouth that is too wide: so many controls that the presenter gets lost in front of the audience.

## 4. Continuity

A talk reads as one movement when things carry over from slide to slide. The audience should never have to work out that the small box on this slide is the machine from the last one. Show it move there.

There are three kinds of continuity, from cheapest to richest.

- **The same colour and the same number.** The colour dictionary and the model give these. They cost nothing once set up.
- **A bridge sentence.** The last line of each slide's notes names the next slide's question.
- **A morph.** The same element appears on two neighbouring slides, and the engine moves it from its place on one to its place on the other. Tag it on both slides with `data-morph="name"`.

Use a morph where the story changes scale or role.

| The story says | What travels |
|---|---|
| "This machine goes into that room" | The figure of the machine, from large on its own slide to small inside the scene of the room |
| "This number is what we are asking for" | The number, from the tile on the money slide to the row of the ask |
| "Of these three, we pick this one" | The chosen card, from the row of options to the head of the next slide |
| "Look inside this part" | The part, from small inside the whole to large on its own slide |
| "This total becomes the budget line" | The total, from the end of the chart to the table |

Rules for a morph:

- The element is the same thing on both slides. Never morph two things that only look alike.
- Use two to six in a deck, at the joints of the story. A morph on every slide is noise.
- Place the element on the second slide where it belongs there. The engine works out the path.
- The bridge sentence in the notes and the morph tell the same hand-off.

In the example deck, the building travels from the anatomy slide into the corner of the day chart, and the payback and the purchase price travel from the money slide into the ask. [motion-and-interaction.md](motion-and-interaction.md) has the mechanics.

## 5. Sizing the deck to the time

Plan one minute a slide on average and one press every 15 to 30 seconds. Keep a fifth of the time for questions.

| Time | Slides | Shape |
|---|---|---|
| 5 minutes | 5 to 6 | Title, why now, the option that wins and why, the money, the ask |
| 15 minutes | 10 to 14 | Add options, one proof slide, one "how it works" slide, questions in the appendix |
| 30 minutes | 20 to 28 | Full arc, one or two slides per chapter |
| 50 minutes | 40 to 55 | Full arc with a chapter spine, concept slides before tests, a large appendix |

When time is cut, cut whole slides from the middle chapters. Never squeeze two ideas into one slide to save a slide.

## 6. Devices that hold a long deck together

- **Callback.** The last line of the opener is the title's headline, word for word. The closing slide returns to it. The audience hears the one sentence three times without a slide called "summary".
- **A strip that returns.** When a chapter has several parts (three tests, four phases), show them as a strip of boxes. Before each part, the same strip comes back with the finished boxes ticked and the next one lit. The audience always knows where they are.
- **A spine.** For a long technical chapter, one picture (a stack of layers, a map, a process line) returns between sections with the next piece lifted and the coming slides listed. One hook drives every return.
- **Concept before test.** If a slide depends on an idea the audience may not hold ("peak demand", "payback"), give that idea its own short slide first. One new term a slide.
- **One colour, one meaning.** Decide what each of the three colours means and never break it, in titles, lines, pills and figures. Titles, lines and figures then use the same three colours, and charts need no legend.
- **The same number everywhere.** A figure shown on slide 4 and again on slide 20 comes from one variable. If the presenter changes an input on the money slide, the ask follows.
- **Simple front, detailed back.** Sources, caveats and method are stripped from the slides and collected in the appendix by the build.
- **The alternative stays visible, greyed.** An option that was considered and not chosen is shown desaturated with a light hatch, not deleted. It shows the choice was real.
- **Admit the weak point first.** "This one project alone is real but small." "Renting is cheapest for the first six years." Said by the presenter, these buy trust for everything after.
- **A bridge sentence.** The last line of each slide's notes names the next slide's question. Slides then feel like one argument.
- **A morph.** The object on one slide travels into its place on the next. See section 4.

## 7. Explaining a hard thing simply

The audience should need to hold only one new thing at a time. Nothing true has to be left out for that.

- **Start where they already are.** Begin with something from their own week: the monthly bill, the queue at a counter, the full inbox. Move from that to the mechanism.
- **Make the abstract physical, then draw it.** A quota is a tank that fills. Capacity is a machine filling from the bottom. Isolation is a wall between rooms. Priority is two lanes. Choose a mechanism that behaves like the real thing, so the picture stays right when someone pushes on it.
- **Build the diagram one press at a time.** A finished architecture diagram is unreadable. The same diagram drawn in five presses, each with one spoken sentence, is easy.
- **Turn a number into a picture.** A share becomes a fill level. A comparison becomes two bars on one scale. A break-even becomes two lines that cross, with a ring on the crossing. Then print the number once, large.
- **Ask the question the audience is thinking.** "Can the roof carry it?" as a title opens the doubt on purpose. The next two slides close it.
- **Use the audience's words, and say when a word is yours.** If a vendor says "standard access" and you say "mid-tier", the slide uses the vendor's word and the notes explain your shorthand. A label that overstates gets caught.
- **Say what it does not do.** One line on the limit ("this does not keep the cold rooms running in a power cut") makes the rest credible.
- **Teach by letting them change it.** A slider on the one assumption they doubt does more than a paragraph defending it.
- **Keep the proof one click away.** The simple slide is honest only if the detail exists. Put it in the appendix and say so.

When a slide still feels hard, it usually holds two ideas. Split it.

## 8. Titles

A title is one sentence of 4 to 10 words that fits on two lines at most. Four kinds work:

| Kind | Example | Use for |
|---|---|---|
| A claim | "The roof can pay the power bill." | Most slides |
| The question the slide answers | "Can the roof carry the weight?" | Opening a doubt, starting a test |
| A two-beat contrast | "Sunny hours from the roof, nights from the grid." | Before and after, two sides |
| A plain label | "Ready for approval." "Questions you may ask." | The ask and reference pages only |

Colour one to three words by meaning: "Pay the *grid*, *rent* the panels, or *own* them." with each word in its colour. Never colour a word for emphasis alone.

| Weak | Strong |
|---|---|
| Cost analysis | Owning costs least from year 7. |
| Market trends | Grid prices have risen five years running. |
| Our approach | Three tests decide whether the roof fits. |
| Risks | Six risks, and what we have planned for each. |
| System overview | Four parts turn the roof into a power plant. |

Test a title by reading only the titles of the deck in order. They should make the argument alone.

## 9. Cutting a slide into presses

Write the notes before the slide.

1. Write what you would say for this slide as plain spoken paragraphs.
2. Each paragraph that needs something new on screen is a press. Mark it.
3. If one paragraph needs two new things, it is two presses.
4. A press with nothing to say is deleted.
5. What is on screen when the slide first appears is whatever the first paragraph needs, and no more.

The slide then has `data-steps` equal to the number of marked paragraphs, and the notes carry `<p data-press="k">` in the same order. Most slides have 0 to 4 presses. A slide that builds one picture step by step may have up to 10.

Slides that are furniture (timeline, risks, the ask, appendix pages) have no presses. They animate once when they appear.

## 10. The storyboard format

Show this to the user before building.

```
#  id         chapter   title (the claim)                          pattern            presses  the picture                         numbers from
1  film       Open      (16 s film) the bill, the trend, the roof  film               0        kinetic type and three scenes       model
2  title      Open      The roof can pay the power bill.           hero               0        the building, roof lit              quote
3  pressures  Why now   Three things about power we don't control. three raised cards 3        price line, peak curve, outage      bills, tariff
4  options    Why now   Pay the grid, rent the panels, or own.     crossing lines     2        three cost lines, two rings, bands  model
…
```

For each slide, name the picture in words. "A chart" is not a picture. "Three cost lines for the same energy, with a ring where owning drops below renting" is.
