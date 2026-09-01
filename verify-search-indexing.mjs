import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'website';
const PAGES = path.join(ROOT, 'pages');
const expectedIconLinks = [
  '<link rel="icon" href="/favicon.ico" sizes="any">',
  '<link rel="icon" type="image/png" sizes="128x128" href="/favicon.png">',
  '<link rel="apple-touch-icon" href="/favicon.png">',
];

const routeToFile = new Map([
  ['/', 'Home.html'], ['/home-en', 'Home-en.html'],
  ['/about', 'about.html'], ['/about-en', 'about-en.html'],
  ['/aanpak', 'aanpak.html'], ['/approach-en', 'approach-en.html'],
  ['/technologie', 'technologie.html'], ['/technology-en', 'technology-en.html'],
  ['/calculator', 'calculator.html'], ['/calculator-en', 'calculator-en.html'],
  ['/fit-check', 'fit-check.html'], ['/fit-check-en', 'fit-check-en.html'],
  ['/contact', 'contact.html'], ['/contact-en', 'contact-en.html'],
  ['/privacy', 'privacy.html'], ['/privacy-en', 'privacy-en.html'],
  ['/disclaimer', 'disclaimer.html'], ['/disclaimer-en', 'disclaimer-en.html'],
  ['/faq', 'FAQ.html'], ['/faq-en', 'FAQ-en.html'],
  ['/referentie', 'Referentie.html'], ['/references-en', 'references-en.html'],
  ['/referentie-case', 'referentie-case.html'], ['/reference-case-en', 'reference-case-en.html'],
  ['/referentie-case-alcon', 'referentie-case-alcon.html'], ['/reference-case-alcon-en', 'reference-case-alcon-en.html'],
  ['/referentie-case-feneko', 'referentie-case-feneko.html'], ['/reference-case-feneko-en', 'reference-case-feneko-en.html'],
  ['/referentie-case-lonza', 'referentie-case-lonza.html'], ['/reference-case-lonza-en', 'reference-case-lonza-en.html'],
  ['/referentie-case-novartis', 'referentie-case-novartis.html'], ['/reference-case-novartis-en', 'reference-case-novartis-en.html'],
]);

const additionalPublicPages = new Set([
  'case.html', 'case-en.html', '404.html',
]);

const failures = [];
const fail = message => failures.push(message);
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>https:\/\/montisoro\.com([^<]*)<\/loc>/g)]
  .map(match => match[1] || '/');

for (const route of sitemapUrls) {
  const fileName = routeToFile.get(route);
  if (!fileName) {
    fail(`Sitemap route has no source mapping: ${route}`);
    continue;
  }
  const file = path.join(PAGES, fileName);
  if (!fs.existsSync(file)) {
    fail(`Missing production page: ${file}`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  if (/name=["']robots["'][^>]*noindex/i.test(html)) fail(`Production page is noindex: ${file}`);
  const canonical = route === '/' ? 'https://montisoro.com/' : `https://montisoro.com${route}`;
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) fail(`Canonical mismatch: ${file}`);
  for (const link of expectedIconLinks) if (!html.includes(link)) fail(`Missing stable favicon link in ${file}: ${link}`);
  if (/rel=["']icon["'][^>]+\.svg/i.test(html)) fail(`Unsupported SVG favicon link remains in ${file}`);
}

const ico = fs.readFileSync(path.join(ROOT, 'favicon.ico'));
if (!(ico[0] === 0 && ico[1] === 0 && ico[2] === 1 && ico[3] === 0)) fail('website/favicon.ico is not a real ICO file');

const redirects = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
const netlify = fs.readFileSync('netlify.toml', 'utf8');
if (/favicon\.ico\s+\/favicon\.png\s+200/.test(redirects)) fail('_redirects still rewrites ICO to PNG');
if (/from\s*=\s*["']\/favicon\.ico["']/.test(netlify)) fail('netlify.toml still rewrites ICO to PNG');
for (const oldPath of ['/nl/france', '/nl/literatuur', '/nl/subsidies', '/nl/sitemap']) {
  const escaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`^${escaped}\\s+\/pages\/404\\.html\\s+404!$`, 'm').test(redirects)) {
    fail(`Obsolete URL does not return a forced 404: ${oldPath}`);
  }
}

const headers = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8');
for (const pattern of ['/documents/*', '/prototypes/*']) {
  if (!headers.includes(pattern) || !headers.includes('X-Robots-Tag: noindex, nofollow, noarchive')) {
    fail(`Missing noindex header policy for ${pattern}`);
  }
}

const publicNames = new Set([...routeToFile.values(), ...additionalPublicPages]);
for (const name of fs.readdirSync(PAGES).filter(name => name.toLowerCase().endsWith('.html'))) {
  if (publicNames.has(name)) continue;
  if (/^google[a-z0-9]+\.html$/i.test(name)) continue;
  const html = fs.readFileSync(path.join(PAGES, name), 'utf8');
  if (!/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
    fail(`Sandbox page is missing noindex: website/pages/${name}`);
  }
}

for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.html')) continue;
  if (entry.name === 'index.html' || /^google[a-z0-9]+\.html$/i.test(entry.name)) continue;
  const html = fs.readFileSync(path.join(ROOT, entry.name), 'utf8');
  if (!/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
    fail(`Root audit page is missing noindex: website/${entry.name}`);
  }
}

if (failures.length) {
  console.error(`SEO verification failed (${failures.length}):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`SEO verification passed: ${sitemapUrls.length} canonical pages, valid ICO, stable favicon links, and internal noindex policies.`);
