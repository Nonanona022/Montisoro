// Geef sandbox-/demopagina's een noindex-meta zodat ze nooit in Google komen.
// Lokaal draaien vanuit de HOOFDMAP van de repo:
//     node noindex-sandbox.mjs
// Idempotent: pagina's die al noindex hebben of op de PROD-whitelist staan worden overgeslagen.
// Raakt ALLEEN website/pages/*.html aan; voegt enkel een <meta> toe in de <head>.

import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';

// Je ECHTE, indexeerbare pagina's (sitemap-set + generieke case-router). Deze NIET aanraken.
const PROD = new Set([
  'Home.html','Home-en.html','about.html','about-en.html','aanpak.html','aanpak-en.html',
  'technologie.html','technologie-en.html','calculator.html','calculator-en.html',
  'fit-check.html','fit-check-en.html','contact.html','contact-en.html','FAQ.html','FAQ-en.html',
  'Referentie.html','Referentie-en.html','referentie-case.html','referentie-case-en.html',
  'referentie-case-alcon.html','referentie-case-alcon-en.html','referentie-case-lonza.html',
  'referentie-case-lonza-en.html','referentie-case-feneko.html','referentie-case-feneko-en.html',
  'privacy.html','privacy-en.html','disclaimer.html','disclaimer-en.html',
  'case.html','case-en.html','404.html',
]);

const roots = ['website/pages','deploy-bundle/website/pages'];
let changed = 0, skipped = 0;
for (const root of roots){
  if (!fs.existsSync(root)) continue;
  const files = await glob(`${root}/*.html`);
  for (const file of files){
    const name = path.basename(file);
    if (PROD.has(name)) { continue; }                       // echte pagina → met rust laten
    let html = fs.readFileSync(file,'utf8');
    if (/name=["']robots["'][^>]*noindex/i.test(html)) { skipped++; continue; } // al noindex
    // net na <head> invoegen (of na de eerste <meta charset> als die er is)
    const tag = '\n<meta name="robots" content="noindex,nofollow">';
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, m => m + tag);
      fs.writeFileSync(file, html); changed++;
      console.log('noindex → ' + file);
    }
  }
}
console.log(`\nKlaar. ${changed} sandbox-pagina's kregen noindex, ${skipped} hadden het al.`);
console.log('Bekijk de diff in GitHub Desktop en push.');
