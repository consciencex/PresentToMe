/* ===== Sources and questions: one registry for every outside figure in the deck, and the questions page. =====
   [id, group, title (publisher, date read), url ('' = given to us, no public link), slide ids that rely on it]
   Add a source here, never on a slide, and name the slides it supports. The appendix page lists them by group.
   EXAMPLE DATA: these entries show the format. Replace them with real sources, and delete any figure you cannot source. */
const SOURCE_GROUPS = [['cost', 'Prices and costs'], ['site', 'The site'], ['method', 'Method']];
const SOURCES = [
  ['bill', 'cost', 'Example Foods: electricity bills, last 12 months (example data)', '', ['pressures', 'options', 'money']],
  ['tariff', 'cost', 'Utility tariff schedule and five-year price history (example data)', 'https://example.com/tariff', ['pressures', 'options']],
  ['quote', 'cost', 'Installer quote: 800 kWp rooftop system, $0.90 a watt (example data)', '', ['money', 'decision', 'anatomy']],
  ['survey', 'site', 'Roof survey: usable area and spare structural load (example data)', '', ['tests', 'anatomy']],
  ['sun', 'site', 'Solar atlas: yearly average sun hours at the site (example data)', 'https://example.com/solar-atlas', ['tests', 'day']],
  ['load', 'site', 'Site meter: hourly load, one sunny weekday (example data)', '', ['day']],
  ['model', 'method', 'Cost model: src/js/model.js in this deck, same use and same prices for every option', '', ['options', 'money', 'decision']],
];

/* The questions page: the hard questions, answered before they are asked. [question, answer]. EXAMPLE DATA. */
const QA = [
  ['What happens on cloudy days and at night?', 'We buy from the grid, exactly as today. The roof covers about a quarter of our use over a year; nothing depends on it being sunny on a given day.'],
  ['Can the roof carry it?', 'Yes. The survey found a spare load of 25 kg/m² and the array adds 15. It also needs under half of the usable roof.'],
  ['Why not rent the panels and keep the cash?', 'Renting costs least for the first years, then owning does for the rest of the system\'s life. The crossing is on the cost-lines slide and moves with the inputs on the money slide.'],
  ['What if grid prices stop rising?', 'Set the price rise to zero on the money slide: the payback moves out and owning still ends ahead.'],
  ['Who looks after it?', 'Facilities, about one day a month, with a monitoring and cleaning contract funded as a yearly line.'],
  ['What does it not do?', 'It does not take us off the grid. The battery covers short cuts only. Nights, the evening peak and long cuts still depend on the grid.'],
];
