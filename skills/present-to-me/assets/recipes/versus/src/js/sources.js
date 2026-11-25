/* ===== Sources and questions: one registry for every outside figure in the deck, and the questions page. =====
   [id, group, title (publisher, date read), url ('' = given to us, no public link), slide ids that rely on it]
   Add a source here, never on a slide, and name the slides it supports. The appendix page lists them by group.
   EXAMPLE DATA. These entries show the format. Replace them with real sources, and delete any figure you cannot source. */
const SOURCE_GROUPS = [['spec', 'The two laptops'], ['buyer', 'The buyer'], ['method', 'Method']];
const SOURCES = [
  ['sheet', 'spec', 'Maker specification sheets for the Light 13 and the Studio 15 (example data)', 'https://example.com/laptops/specs', ['title', 'same', 'difference', 'why']],
  ['price', 'spec', 'Maker price list, read on the day of the talk (example data)', 'https://example.com/laptops/prices', ['title', 'difference', 'years', 'choose']],
  ['bench', 'spec', 'Our own timing of one heavy job on both laptops, plugged in and on battery (example data)', '', ['difference', 'why', 'years']],
  ['week', 'buyer', 'The buyer\'s own week: heavy hours, days away from a desk, budget, what an hour is worth (their estimates)', '', ['years', 'choose', 'verdict']],
  ['model', 'method', 'The cost model in this deck (src/js/model.js), with the same heavy work on both laptops', '', ['years', 'choose', 'verdict']],
];

/* The questions page: the hard questions, answered before they are asked. [question, answer]. EXAMPLE DATA. */
const QA = [
  ['Why put a price on my time at all?', 'Because the Studio 15 costs more money and saves time. To weigh one against the other you need a price on an hour. The figure is yours. Set it on the chooser slide.'],
  ['What if I do no heavy work?', 'Then the Studio 15 never pays back and the Light 13 is the pick. Set heavy work to zero on the chooser slide to see it.'],
  ['Why does a day away from a desk count against the Studio 15?', 'On battery it is held to the same power as the Light 13, so the same job takes the same time. It saves time only when it is plugged in.'],
  ['Is the bigger screen worth nothing?', 'It is worth something, and it is not in the money. The cost lines count the two prices and the waiting. Screen, weight and battery are on the rows slide for you to weigh.'],
  ['Which numbers are estimates?', 'What an hour is worth and how long you keep the laptop. Every other figure is a measure of the laptop. In this example deck all of them are invented.'],
  ['What does the comparison leave out?', 'Resale value, repairs and accessories. We assumed they are the same for both, so they would move both lines by the same amount.'],
];
