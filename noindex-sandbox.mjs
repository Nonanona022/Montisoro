// Geef sandbox-/demopagina's een noindex-meta zodat ze nooit in Google komen.
// Lokaal draaien vanuit de HOOFDMAP van de repo:
//     node noindex-sandbox.mjs
// Idempotent: pagina's die al noindex hebben of op de PROD-whitelist staan worden overgeslagen.
// Raakt sandboxpagina's in website/pages/ en losse auditpagina's in website/;
// voegt enkel een <meta> toe in de <head>.

import fs from 'node:fs';
import path from 'node:path';

// Je ECHTE, indexeerbare pagina's (sitemap-set + generieke case-router). Deze NIET aanraken.
const PROD = new Set([
  'Home.html','Home-en.html','about.html','about-en.html','aanpak.html','approach-en.html',
  'technologie.html','technology-en.html','calculator.html','calculator-en.html',
  'fit-check.html','fit-check-en.html','contact.html','contact-en.html','FAQ.html','FAQ-en.html',
  'Referentie.html','references-en.html','referentie-case.html','reference-case-en.html',
  'referentie-case-alcon.html','reference-case-alcon-en.html',
  'referentie-case-feneko.html','reference-case-feneko-en.html',
  'privacy.html','privacy-en.html','disclaimer.html','disclaimer-en.html',
  'rit-3-0.html','rit-3-0-en.html','langdurig-verzuim.html','long-term-absence-en.html',
  'non-clinical-casemanager.html','non-clinical-case-manager-en.html',
  'verzuimbeleid.html','absence-policy-en.html',
  'calculator-methodologie.html','calculator-methodology-en.html',
  'case.html','case-en.html','404.html',
]);

const roots = ['website/pages','deploy-bundle/website/pages'];
let changed = 0, skipped = 0;
for (const root of roots){
  if (!fs.existsSync(root)) continue;
  const files = fs.readdirSync(root)
    .filter(name => name.toLowerCase().endsWith('.html'))
    .map(name => path.join(root, name));
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

// Ook losse audit-/testpagina's in de publish-root zijn anders via de generieke
// Netlify-slug rewrite indexeerbaar. index.html heeft al noindex; de
// Google-verificatiefile bevat geen inhoud en blijft ongewijzigd.
for (const root of ['website','deploy-bundle/website']) {
  if (!fs.existsSync(root)) continue;
  const files = fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map(entry => path.join(root, entry.name));
  for (const file of files) {
    const name = path.basename(file);
    if (name === 'index.html' || /^google[a-z0-9]+\.html$/i.test(name)) continue;
    let html = fs.readFileSync(file, 'utf8');
    if (/name=["']robots["'][^>]*noindex/i.test(html)) { skipped++; continue; }
    if (!/<head[^>]*>/i.test(html)) continue;
    html = html.replace(/<head[^>]*>/i, m => m + '\n<meta name="robots" content="noindex,nofollow">');
    fs.writeFileSync(file, html); changed++;
    console.log('noindex → ' + file);
  }
}
console.log(`\nKlaar. ${changed} sandbox-pagina's kregen noindex, ${skipped} hadden het al.`);
console.log('Bekijk de diff in GitHub Desktop en push.');
