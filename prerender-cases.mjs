import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve('website');
const PAGES = path.join(ROOT, 'pages');
const dataSource = fs.readFileSync(path.join(ROOT, 'data', 'cases.js'), 'utf8');
const renderSource = fs.readFileSync(path.join(ROOT, 'scripts', 'case-render.js'), 'utf8');

const dataContext = vm.createContext({ window: {} });
vm.runInContext(dataSource, dataContext, { filename: 'cases.js' });
const cases = dataContext.window.MONTISORO_CASES;

const targets = [
  ['referentie-case.html', 'referentie-case', 'nl'],
  ['reference-case-en.html', 'referentie-case', 'en'],
  ['referentie-case-alcon.html', 'referentie-case-alcon', 'nl'],
  ['reference-case-alcon-en.html', 'referentie-case-alcon', 'en'],
  ['referentie-case-feneko.html', 'referentie-case-feneko', 'nl'],
  ['reference-case-feneko-en.html', 'referentie-case-feneko', 'en'],
];

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function fakeEscaper() {
  let text = '';
  return {
    set textContent(value) { text = String(value ?? ''); },
    get innerHTML() { return escapeHtml(text); },
  };
}

function renderCase(slug, lang, fileName) {
  let rendered = '';
  const attrs = new Map([['data-slug', slug], ['data-lang', lang]]);
  const root = {
    getAttribute(name) { return attrs.get(name) ?? null; },
    hasAttribute(name) { return attrs.has(name); },
    querySelector() { return null; },
    set innerHTML(value) { rendered = value; },
    get innerHTML() { return rendered; },
  };
  const document = {
    documentElement: { lang },
    head: { appendChild() {} },
    getElementById(id) {
      if (id === 'cs2-root') return root;
      if (id === 'cs2-img-fill') return {};
      return null;
    },
    createElement(tag) { return tag === 'div' ? fakeEscaper() : {}; },
    querySelector() { return null; },
  };
  const context = vm.createContext({
    window: { MONTISORO_CASES: cases },
    document,
    location: { search: '', pathname: `/${fileName}` },
    URLSearchParams,
  });
  vm.runInContext(renderSource, context, { filename: 'case-render.js' });
  if (!rendered.includes('<h1')) throw new Error(`Case ${fileName} did not render an H1`);
  return rendered;
}

function articleSchema(c, lang, canonical) {
  const pick = key => c[`${key}_${lang}`] ?? '';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: String(pick('hero_title')).replaceAll('*', ''),
    description: pick('hero_sum'),
    inLanguage: lang === 'en' ? 'en-BE' : 'nl-BE',
    mainEntityOfPage: canonical,
    about: [c.company, pick('fact_sector')].filter(Boolean),
    author: { '@type': 'Organization', name: 'Montisoro', url: 'https://montisoro.com/' },
    publisher: {
      '@type': 'Organization',
      name: 'Montisoro',
      url: 'https://montisoro.com/',
      logo: { '@type': 'ImageObject', url: 'https://montisoro.com/assets/montisoro-logo.png' },
    },
  };
  if (c.photo_about && c.photo_about !== 'none') {
    schema.image = `https://montisoro.com/${c.photo_about.replace(/^\.\.\//, '')}`;
  }
  return `<script id="case-article-schema" type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

for (const [fileName, slug, lang] of targets) {
  const c = cases.find(item => item.slug === slug);
  if (!c) throw new Error(`Missing case data for ${slug}`);
  const file = path.join(PAGES, fileName);
  let html = fs.readFileSync(file, 'utf8');
  const rendered = renderCase(slug, lang, fileName);
  const main = `<main id="cs2-root" data-slug="${slug}" data-lang="${lang}" data-prerendered="true">\n${rendered}\n</main>`;
  const mainPattern = /<main id="cs2-root"[\s\S]*?<\/main>/;
  if (!mainPattern.test(html)) throw new Error(`Missing cs2-root in ${fileName}`);
  html = html.replace(mainPattern, main);

  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (!canonical) throw new Error(`Missing canonical in ${fileName}`);
  const schema = articleSchema(c, lang, canonical);
  if (/<script id="case-article-schema"[\s\S]*?<\/script>/.test(html)) {
    html = html.replace(/<script id="case-article-schema"[\s\S]*?<\/script>/, schema);
  } else {
    html = html.replace('</head>', `${schema}\n</head>`);
  }
  fs.writeFileSync(file, html);
  console.log(`Prerendered ${fileName}`);
}
