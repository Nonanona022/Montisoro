// Fix interne links -> schone URL's (lost de /:slug 404 op).
// Lokaal draaien vanuit de HOOFDMAP van de repo:
//     node fix-links.mjs
// Gericht op paginalinks: href="Naam.html" -> href="/naam" (+ #fragment behouden),
// plus de taal-knop/Home-link in motion.js. Idempotent. Raakt assets/CSS/externe links NIET.

import { glob } from 'glob';
import fs from 'node:fs';

const ROOTS = ['website', 'deploy-bundle/website'];
const SKIP = /(node_modules|\/documents\/|\/prototypes\/|-demo\.|voorbeeld|harness| test\.|actiepunten|High-End|UX audit|Banner )/i;

function cleanPath(name) {
  const l = name.toLowerCase();
  if (l === 'home') return '/';
  if (l === 'home-en') return '/home-en';
  return '/' + l;                 // /aanpak, /faq, /referentie, /about-en, /referentie-case-alcon, ...
}

// ── 1. interne .html-links in HTML -> schone URL's ──────────────────────
let filesChanged = 0, linksFixed = 0;
const htmlFiles = (await glob(ROOTS.map(r => `${r}/**/*.html`), { nocase: true })).filter(f => !SKIP.test(f));
for (const file of htmlFiles) {
  const src = fs.readFileSync(file, 'utf8');
  let n = 0;
  let out = src.replace(/href="([A-Za-z0-9_-]+)\.html(#[^"]*)?"/g, (_w, name, frag) => {
    n++; return 'href="' + cleanPath(name) + (frag || '') + '"';
  });
  out = out.replace(/href="\/pages\/([A-Za-z0-9_-]+)(?:\.html)?(#[^"]*)?"/g, (_w, name, frag) => {
    n++; return 'href="' + cleanPath(name) + (frag || '') + '"';
  });
  if (out !== src) { fs.writeFileSync(file, out); filesChanged++; linksFixed += n; }
}

// ── 2. motion.js: taal-knop + Home-item -> schone URL's ─────────────────
let motionPatched = 0;
const tgtOld = `    var target;\n    if (isEN){\n      target = (baseKey === 'Home') ? 'Home.html' : baseKey + '.html';\n    } else {\n      target = (baseKey === 'Home') ? 'Home-en.html' : baseKey + '-en.html';\n    }`;
const tgtNew = `    var target;\n    if (isEN){\n      target = (baseKey === 'Home') ? '/' : '/' + baseKey.toLowerCase();\n    } else {\n      target = (baseKey === 'Home') ? '/home-en' : '/' + baseKey.toLowerCase() + '-en';\n    }`;
const motionFiles = await glob(ROOTS.map(r => `${r}/**/motion.js`), { nocase: true });
for (const file of motionFiles) {
  const src = fs.readFileSync(file, 'utf8');
  let out = src
    .split(`/-en\\.html$/i.test(path)`).join(`/-en(?:\\.html)?$/i.test(path)`)
    .split(tgtOld).join(tgtNew)
    .split(`homeA.href = isEN ? 'Home-en.html' : 'Home.html';`).join(`homeA.href = isEN ? '/home-en' : '/';`);
  if (out !== src) { fs.writeFileSync(file, out); motionPatched++; }
}

console.log(`\nKlaar.`);
console.log(`  HTML-bestanden aangepast : ${filesChanged}  (${linksFixed} links -> schone URL's)`);
console.log(`  motion.js gepatcht       : ${motionPatched}  (taal-knop + Home-link)`);
console.log(`\nBekijk de diff in GitHub Desktop en push daarna.`);
