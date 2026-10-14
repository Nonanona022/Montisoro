'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'website/scripts/calculator.js'), 'utf8');
const headers = fs.readFileSync(path.join(root, 'website/_headers'), 'utf8');
const pages = [
  ['NL', 'website/pages/calculator.html', '45.000'],
  ['EN', 'website/pages/calculator-en.html', '45,000']
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  /var state\s*=\s*\{\s*fte:500,\s*splitA:50,\s*salary:45000,/.test(script),
  'De interne calculatorstate moet starten met 500 FTE, 50% arbeiders en 45.000 euro brutoloon.'
);
assert(
  /\/scripts\/\*\s+Cache-Control: public, max-age=0, must-revalidate/.test(headers),
  'Calculator-JavaScript moet bij elk bezoek worden gerevalideerd.'
);

for (const [language, relativePath, formattedSalary] of pages) {
  const html = fs.readFileSync(path.join(root, relativePath), 'utf8');
  assert(/id="fteNum"[^>]*value="500"/.test(html), `${language}: zichtbaar FTE-veld is niet 500.`);
  assert(/id="splitNum"[^>]*value="50"/.test(html), `${language}: zichtbare verdeling is niet 50%.`);
  assert(
    new RegExp(`id="salaryNum"[^>]*value="${formattedSalary.replace('.', '\\.')}"`).test(html),
    `${language}: zichtbaar brutoloon is niet 45.000.`
  );
  assert(
    /calculator\.js\?v=20261014-2/.test(html),
    `${language}: de calculator gebruikt geen versiegebonden script-URL.`
  );
}

console.log('✓ Calculatordefaults en cachebeveiliging zijn consistent in NL en EN');
