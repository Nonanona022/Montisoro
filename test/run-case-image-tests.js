'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const css = read('website/stylesheets/site.css');
const cases = read('website/data/cases.js');
const testimonials = read('website/data/testimonials.js');
const motion = read('website/scripts/motion.js');
const netlify = read('netlify.toml');
const redirects = read('website/_redirects');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  /\.cs2-photo\s*>\s*img,[\s\S]*?object-fit:cover;/.test(css),
  'Casefoto\'s moeten centraal met object-fit: cover in hun kader passen.'
);
assert(
  /referentie-case-alcon[\s\S]*?photo_about:\s*'\.\.\/assets\/cases\/alcon-cleanroom\.jpg'/.test(cases),
  'De Alcon-case moet de aangeleverde cleanroomfoto gebruiken.'
);
assert(
  /#cs2-root\[data-slug="referentie-case-volvo"\][\s\S]*?aspect-ratio:16 \/ 9;[\s\S]*?object-fit:contain;/.test(css),
  'De volledige Volvo-foto moet zonder bijkomende uitsnede in een 16:9-kader staan.'
);

const pages = [
  ['website/pages/referentie-case-volvo.html', 'volvo-truck-production.jpg', 1280, 720, 'Rode Volvo-vrachtwagen op de productielijn in de fabriek.'],
  ['website/pages/reference-case-volvo-en.html', 'volvo-truck-production.jpg', 1280, 720, 'Red Volvo truck on the production line inside the factory.'],
  ['website/pages/referentie-case-alcon.html', 'alcon-cleanroom.jpg', 1500, 1000, 'Twee Alcon-medewerkers aan het werk in een cleanroom.'],
  ['website/pages/reference-case-alcon-en.html', 'alcon-cleanroom.jpg', 1500, 1000, 'Two Alcon employees working in a cleanroom.'],
  ['website/pages/referentie-case-feneko.html', 'feneko-about.jpg', 780, 908, 'Medewerker aan het werk in de aluminiumproductie van FenekO.'],
  ['website/pages/reference-case-feneko-en.html', 'feneko-about.jpg', 780, 908, 'Employee at work in FenekO&#39;s aluminium production.']
];

for (const [relative, image, width, height, alt] of pages) {
  const html = read(relative);
  assert(
    html.includes('href="../stylesheets/site.css?v=20261014-case-images-2"'),
    `${relative}: de casefotocorrectie kan door oude browsercache worden overschreven.`
  );
  if (relative.includes('case-volvo')) {
    assert(
      html.includes('src="../scripts/motion.js?v=20261014-volvo-route"'),
      `${relative}: de nieuwe taalwissel kan door oude browsercache worden overschreven.`
    );
  }
  assert(html.includes(`src="../assets/cases/${image}"`), `${relative}: onjuist beeldbestand.`);
  assert(html.includes(`width="${width}" height="${height}"`), `${relative}: intrinsieke afbeeldingsafmetingen ontbreken.`);
  assert(html.includes(`alt="${alt}"`), `${relative}: ontbrekende of onjuiste alt-tekst.`);
  assert(!/alt="[^"]*Sleep hier een sfeerfoto/.test(html), `${relative}: interne placeholder staat nog in de alt-tekst.`);
}

for (const image of ['volvo-truck-production.jpg', 'alcon-cleanroom.jpg', 'feneko-about.jpg']) {
  const size = fs.statSync(path.join(root, 'website/assets/cases', image)).size;
  assert(size < 250000, `${image}: geoptimaliseerde foto is nog groter dan 250 KB.`);
}

assert(!/novartis/i.test(cases), 'De verwijderde Novartis-case mag niet in de case-data blijven staan.');
assert(!/novartis/i.test(testimonials), 'De verwijderde Novartis-case mag niet in de testimonialdata blijven staan.');
assert(!/referentie-case-novartis|reference-case-novartis/i.test(motion), 'De verwijderde Novartis-route mag niet in de taalroutering blijven staan.');
assert(!fs.existsSync(path.join(root, 'website/assets/cases/novartis-about.jpg')), 'De Novartis-JPG mag niet in de website staan.');
assert(!fs.existsSync(path.join(root, 'website/assets/cases/novartis-about.png')), 'De Novartis-PNG mag niet in de website staan.');
assert(!fs.existsSync(path.join(root, 'website/pages/referentie-case-novartis.html')), 'De Nederlandse Novartis-casepagina moet verwijderd zijn.');
assert(!fs.existsSync(path.join(root, 'website/pages/reference-case-novartis-en.html')), 'De Engelse Novartis-casepagina moet verwijderd zijn.');

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const novartisRedirects = [
  ['/referentie-case-novartis', '/referentie'],
  ['/referentie-case-novartis.html', '/referentie'],
  ['/reference-case-novartis-en', '/references-en'],
  ['/reference-case-novartis-en.html', '/references-en'],
  ['/referentie-case-novartis-en', '/references-en'],
  ['/referentie-case-novartis-en.html', '/references-en'],
  ['/pages/referentie-case-novartis', '/referentie'],
  ['/pages/referentie-case-novartis.html', '/referentie'],
  ['/pages/reference-case-novartis-en', '/references-en'],
  ['/pages/reference-case-novartis-en.html', '/references-en']
];

for (const [from, to] of novartisRedirects) {
  const netlifyRule = new RegExp(
    `\\[\\[redirects\\]\\]\\s*from = "${escapeRegex(from)}"\\s*to = "${escapeRegex(to)}"\\s*status = 301\\s*force = true`
  );
  const fallbackRule = new RegExp(`^${escapeRegex(from)}\\s+${escapeRegex(to)}\\s+301!$`, 'm');
  assert(netlifyRule.test(netlify), `Netlify mist de permanente redirect van ${from} naar ${to}.`);
  assert(fallbackRule.test(redirects), `De fallbackredirect van ${from} naar ${to} ontbreekt.`);
}

assert(!cases.includes('Volvo Group'), 'De case-data moet overal Volvo Trucks gebruiken.');

const volvoNl = read('website/pages/referentie-case-volvo.html');
const volvoEn = read('website/pages/reference-case-volvo-en.html');
assert(volvoNl.includes('rel="canonical" href="https://montisoro.com/referentie-case-volvo"'), 'De Nederlandse Volvo-case mist de nieuwe canonical.');
assert(volvoEn.includes('rel="canonical" href="https://montisoro.com/reference-case-volvo-en"'), 'De Engelse Volvo-case mist de nieuwe canonical.');
assert(!fs.existsSync(path.join(root, 'website/pages/referentie-case.html')), 'De oude Nederlandse Volvo-pagina mag niet als tweede indexeerbare pagina blijven bestaan.');
assert(!fs.existsSync(path.join(root, 'website/pages/reference-case-en.html')), 'De oude Engelse Volvo-pagina mag niet als tweede indexeerbare pagina blijven bestaan.');
assert(/from = "\/referentie-case"[\s\S]*?to = "\/referentie-case-volvo"[\s\S]*?status = 301/.test(netlify), 'Netlify mist de permanente redirect voor de oude Nederlandse Volvo-URL.');
assert(/from = "\/reference-case-en"[\s\S]*?to = "\/reference-case-volvo-en"[\s\S]*?status = 301/.test(netlify), 'Netlify mist de permanente redirect voor de oude Engelse Volvo-URL.');
assert(redirects.includes('/referentie-case.html              /referentie-case-volvo         301!'), 'De fallbackredirect voor de oude Nederlandse .html-URL ontbreekt.');
assert(redirects.includes('/reference-case-en.html            /reference-case-volvo-en       301!'), 'De fallbackredirect voor de oude Engelse .html-URL ontbreekt.');

console.log('✓ Casefoto’s, opgeschoonde Novartis-case, Volvo-canonicals en permanente redirects zijn correct');
