import fs from 'node:fs';

const pairs = [
  ['/', '/home-en', '2026-09-24'],
  ['/about', '/about-en', '2026-07-10'],
  ['/aanpak', '/approach-en', '2026-07-10'],
  ['/technologie', '/technology-en', '2026-07-10'],
  ['/calculator', '/calculator-en', '2026-09-24'],
  ['/fit-check', '/fit-check-en', '2026-07-10'],
  ['/contact', '/contact-en', '2026-09-01'],
  ['/privacy', '/privacy-en', '2026-07-10'],
  ['/disclaimer', '/disclaimer-en', '2026-07-10'],
  ['/faq', '/faq-en', '2026-07-10'],
  ['/referentie', '/references-en', '2026-07-10'],
  ['/referentie-case', '/reference-case-en', '2026-09-24'],
  ['/referentie-case-alcon', '/reference-case-alcon-en', '2026-09-24'],
  ['/referentie-case-feneko', '/reference-case-feneko-en', '2026-09-24'],
  ['/rit-3-0', '/rit-3-0-en', '2026-09-24'],
  ['/langdurig-verzuim', '/long-term-absence-en', '2026-09-24'],
  ['/non-clinical-casemanager', '/non-clinical-case-manager-en', '2026-09-24'],
  ['/verzuimbeleid', '/absence-policy-en', '2026-09-24'],
  ['/calculator-methodologie', '/calculator-methodology-en', '2026-09-24'],
];

const absolute = route => `https://montisoro.com${route === '/' ? '/' : route}`;
const entry = (route, nl, en, lastmod) => `  <url>
    <loc>${absolute(route)}</loc>
    <lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="nl" href="${absolute(nl)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${absolute(en)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${absolute(nl)}" />
  </url>`;

const urls = pairs.flatMap(([nl,en,lastmod]) => [entry(nl,nl,en,lastmod),entry(en,nl,en,lastmod)]);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
fs.writeFileSync('website/sitemap.xml',xml);
console.log(`Generated sitemap with ${urls.length} canonical URLs.`);
