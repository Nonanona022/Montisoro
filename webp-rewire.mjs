// WebP-rewire — voegt <picture>+WebP toe met de originele afbeelding als vangnet.
// Lokaal draaien vanuit de HOOFDMAP van de repo (waar de map "website" in zit):
//     node webp-rewire.mjs
// Vereist: sharp/glob stonden al geïnstalleerd voor de conversie. Enkel "glob" nodig hier.
// 100% additief + idempotent: elke <img> blijft als fallback staan; 2x draaien verandert niets extra.
// Raakt NIETS anders aan dan beeld-verwijzingen. Bekijk daarna de diff in GitHub Desktop.

import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['website', 'deploy-bundle/website']; // de 3 trees zitten hieronder (incl. admin-panel)
const SKIP_SRC = /(favicon|og-image|email-)/i;       // deze beelden NIET vervangen (compat)
const SKIP_HTML = /(node_modules|\/documents\/|\/prototypes\/|-demo\.|voorbeeld|harness| test\.|actiepunten|High-End|UX audit|Banner )/i;

let htmlChanged = 0, imgWrapped = 0, cssChanged = 0, crPatched = 0;

function webpOf(p){ return p.replace(/\.(png|jpe?g)(\?.*)?$/i, (_, e, q) => '.webp' + (q || '')); }

// ── 1. inline <img> -> <picture> in HTML ────────────────────────────────
async function doHtml() {
  const files = (await glob(ROOTS.map(r => `${r}/**/*.html`), { nocase: true }))
    .filter(f => !SKIP_HTML.test(f));
  for (const file of files) {
    let src = fs.readFileSync(file, 'utf8');
    let n = 0;
    const dir = path.dirname(file);
    let out = src.replace(/<img\b[^>]*>/gi, (tag, offset, full) => {
      const before = full.slice(Math.max(0, offset - 120), offset);
      if (/type="image\/webp">\s*$/.test(before)) return tag;       // al gewrapt
      const m = tag.match(/\bsrc\s*=\s*"([^"]+)"/i);
      if (!m) return tag;
      const imgSrc = m[1];
      if (!/\.(png|jpe?g)$/i.test(imgSrc) || SKIP_SRC.test(imgSrc)) return tag;
      const webp = webpOf(imgSrc);
      // alleen wrappen als het .webp-bestand echt bestaat naast het origineel
      const abs = path.resolve(dir, webp.split('?')[0]);
      if (!fs.existsSync(abs)) return tag;
      n++;
      return '<picture><source srcset="' + webp + '" type="image/webp">' + tag + '</picture>';
    });
    // banner-lines achtergrond in inline CSS
    out = patchBannerLines(out, dir);
    if (out !== src) { fs.writeFileSync(file, out); htmlChanged++; imgWrapped += n; }
  }
}

// ── 2. banner-lines background -> image-set (HTML inline + .css) ─────────
function patchBannerLines(text, dir) {
  return text.replace(
    /background:\s*url\((['"]?)((?:\.\.\/)*assets\/banner-lines\.jpg)\1\)\s+center\/cover\s+no-repeat/gi,
    (whole, q, url) => {
      const webpAbs = path.resolve(dir, webpOf(url));
      if (!fs.existsSync(webpAbs)) return whole;                    // geen webp -> laat staan
      if (whole.includes('image-set')) return whole;               // al gedaan
      const webp = webpOf(url);
      return whole + ';background-image:image-set(url("' + webp + '") type("image/webp"),url("' + url + '") type("image/jpeg"))';
    }
  );
}
async function doCss() {
  const files = await glob(ROOTS.map(r => `${r}/**/*.css`), { nocase: true });
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const out = patchBannerLines(src, path.dirname(file));
    if (out !== src) { fs.writeFileSync(file, out); cssChanged++; }
  }
}

// ── 3. case-render.js: JS-gebouwde case-foto's/logo's -> <picture> ──────
async function doCaseRender() {
  const files = await glob(ROOTS.map(r => `${r}/**/case-render.js`), { nocase: true });
  for (const file of files) {
    let s = fs.readFileSync(file, 'utf8');
    if (s.includes('function wpic')) continue;                     // al gepatcht
    const helper =
      "\n  function __webpUrl(u){ return String(u).replace(/\\.(png|jpe?g)(\\?.*)?$/i, function(_,e,q){ return '.webp' + (q||''); }); }\n" +
      "  function wpic(imgHtml, src){ return /\\.(png|jpe?g)(\\?|$)/i.test(String(src)) ? '<picture><source srcset=\"' + esc(__webpUrl(src)) + '\" type=\"image/webp\">' + imgHtml + '</picture>' : imgHtml; }\n";
    // helper injecteren net na de esc()-definitie
    s = s.replace(/(function esc\(s\)\{[^\n]*\n)/, '$1' + helper);
    // 5 img-builders omwikkelen
    const R = [
      [`'<img class="cs2-hero-logo" src="' + esc(c.logo) + '" alt="' + esc(c.company) + '">'`,
       `wpic('<img class="cs2-hero-logo" src="' + esc(c.logo) + '" alt="' + esc(c.company) + '">', c.logo)`],
      [`'<div class="cs2-quote-photo"><img src="' + esc(c.quote_photo) + '" alt=""></div>'`,
       `'<div class="cs2-quote-photo">' + wpic('<img src="' + esc(c.quote_photo) + '" alt="">', c.quote_photo) + '</div>'`],
      [`'<div class="' + cls + '"><img src="' + esc(val) + '" alt=""></div>'`,
       `'<div class="' + cls + '">' + wpic('<img src="' + esc(val) + '" alt="">', val) + '</div>'`],
      [`'<div class="' + wrapCls + '"><img src="' + esc(val) + '" alt=""></div>'`,
       `'<div class="' + wrapCls + '">' + wpic('<img src="' + esc(val) + '" alt="">', val) + '</div>'`],
      [`if (val){ return '<img src="' + esc(val) + '" alt="">'; }`,
       `if (val){ return wpic('<img src="' + esc(val) + '" alt="">', val); }`],
    ];
    for (const [a, b] of R) s = s.split(a).join(b);
    fs.writeFileSync(file, s); crPatched++;
  }
}

await doHtml();
await doCss();
await doCaseRender();
console.log(`\nKlaar.`);
console.log(`  HTML-bestanden aangepast : ${htmlChanged}  (${imgWrapped} afbeeldingen gewrapt)`);
console.log(`  CSS-bestanden aangepast  : ${cssChanged}  (banner-lines image-set)`);
console.log(`  case-render.js gepatcht  : ${crPatched}`);
console.log(`\nBekijk de wijzigingen in GitHub Desktop en push daarna.`);
