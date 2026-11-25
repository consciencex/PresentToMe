/* ===== Sources: one registry for every outside figure in the deck. =====
   [id, group, title (publisher, date read), url ('' = given to us, no public link), slide ids that rely on it]
   Add a source here, never on a slide, and name the slides it supports. The appendix page lists them by group.
   EXAMPLE DATA: these entries show the format. Replace them with real sources, and delete any figure you cannot source. */
const SOURCE_GROUPS = [['cost', 'Prices and costs'], ['site', 'The site'], ['method', 'Method']];
const SOURCES = [
  ['bill', 'cost', 'Harbor Foods: electricity bills, last 12 months (example data)', '', ['pressures', 'options', 'money']],
  ['tariff', 'cost', 'Utility tariff schedule and five-year price history (example data)', 'https://example.com/tariff', ['pressures', 'options']],
  ['quote', 'cost', 'Installer quote: 800 kWp rooftop system, $0.90 a watt (example data)', '', ['money', 'decision', 'anatomy']],
  ['survey', 'site', 'Roof survey: usable area and spare structural load (example data)', '', ['tests', 'anatomy']],
  ['sun', 'site', 'Solar atlas: yearly average sun hours at the site (example data)', 'https://example.com/solar-atlas', ['tests', 'day']],
  ['load', 'site', 'Site meter: hourly load, one sunny weekday (example data)', '', ['day']],
  ['model', 'method', 'Cost model: src/js/model.js in this deck, same use and same prices for every option', '', ['options', 'money', 'decision']],
];
