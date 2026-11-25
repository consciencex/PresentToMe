/* ===== Sources and questions: one registry for every outside figure in the deck, and the questions page. =====
   [id, group, title (publisher, date read), url ('' = given to us, no public link), slide ids that rely on it]
   Add a source here, never on a slide, and name the slides it supports. The appendix page lists them by group.
   EXAMPLE DATA: these entries show the format. Replace them with real sources, and delete any figure you cannot source. */
const SOURCE_GROUPS = [['house', 'The house'], ['battery', 'The battery'], ['method', 'Method']];
const SOURCES = [
  ['meter', 'house', 'Example Home, smart meter, power used by the hour on one clear day (example data)', '', ['day', 'numbers', 'tryit']],
  ['roof', 'house', 'Example Home, 5 kW roof, power made by the hour under clear sky and thick cloud (example data)', '', ['place', 'day', 'limits']],
  ['loads', 'house', 'Appliance ratings for an oven and a car charger (example data)', 'https://example.com/appliance-ratings', ['limits']],
  ['sheet', 'battery', 'Example battery data sheet, capacity, power and weight (example data)', 'https://example.com/battery-data-sheet', ['title', 'parts', 'numbers', 'limits']],
  ['model', 'method', 'Day model, src/js/model.js in this deck, one day walked in quarter hours', '', ['day', 'numbers', 'limits', 'tryit', 'close']],
];

/* The questions page: the hard questions, answered before they are asked. [question, answer]. EXAMPLE DATA. */
const QA = [
  ['What happens on a cloudy day?', 'The battery fills part of the way and the grid runs most of the evening. The second card on the limits slide shows the size of the gap.'],
  ['Would a bigger battery be better?', 'Only up to what the roof can fill and the evening can use. Move the battery size on the try-it slide and watch what is left at midnight.'],
  ['Can it run the oven and charge the car?', 'One at a time, yes. Together they ask for more than it gives at one moment, and the grid adds the rest. Nothing switches off.'],
  ['Does it work in a power cut?', 'Only if it is wired for backup, which the example house is not. Ask the installer before you buy.'],
  ['Does it pay for itself?', 'This deck explains how it works and leaves the money out. The answer needs your own tariff and a quote.'],
  ['What does it not do?', 'It does not take the house off the grid. Long winter evenings, days of thick cloud and very large loads still need it.'],
];
