import fs from 'node:fs';
import vm from 'node:vm';

const read = file => fs.readFileSync(file, 'utf8');
const failures = [];
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) failures.push(`${label}: ontbreekt: ${needle}`);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) failures.push(`${label}: verouderde tekst aanwezig: ${needle}`);
};

const ga4 = read('website/scripts/ga4.js');
const clarity = read('website/scripts/clarity.js');
const motion = read('website/scripts/motion.js');
const privacyNl = read('website/pages/privacy.html');
const privacyEn = read('website/pages/privacy-en.html');
const adminSource = read('admin-panel/scripts/admin-analyse.js');
const adminPublic = read('website/admin-panel/scripts/admin-analyse.js');

for (const [label, source] of [['GA4', ga4], ['Clarity', clarity]]) {
  requireText(source, "host==='montisoro.com' || host==='www.montisoro.com'", label);
}
requireText(clarity, 'function allowed(cats){ return !!(cats && cats.analytics); }', 'Clarity');
requireText(clarity, "window.clarity('consentv2'", 'Clarity');
requireText(clarity, "ad_Storage: 'denied'", 'Clarity');
requireText(clarity, "analytics_Storage: allowed(cats) ? 'granted' : 'denied'", 'Clarity');
forbidText(clarity, 'cats.analytics || cats.performance', 'Clarity');

requireText(motion, "var POLICY = isEN ? '/privacy-en' : '/privacy';", 'Cookiebanner');
forbidText(motion, '/en/privacy_statement', 'Cookiebanner');
forbidText(motion, '/nl/privacy_statement', 'Cookiebanner');

for (const [label, source] of [['Privacy NL', privacyNl], ['Privacy EN', privacyEn]]) {
  requireText(source, 'Google Analytics 4', label);
  requireText(source, 'Microsoft Clarity', label);
}
requireText(privacyNl, 'sessie-opnamen', 'Privacy NL');
requireText(privacyEn, 'session recordings', 'Privacy EN');
forbidText(privacyNl, 'Vandaag gebruiken we <strong>geen optionele cookies</strong>', 'Privacy NL');
forbidText(privacyEn, 'Today we use <strong>no optional cookies</strong>', 'Privacy EN');

if (adminSource !== adminPublic) failures.push('De twee admin-analysebestanden zijn niet identiek.');
requireText(adminPublic, 'https://clarity.microsoft.com/projects/view/xmf5h83z44/heatmaps', 'Admin heatmap');
requireText(adminPublic, 'Microsoft Clarity is gekoppeld.', 'Admin heatmap');

function runTag(source, { host, categories }) {
  const scripts = [];
  let consentListener = null;
  const consent = categories ? JSON.stringify({ v: 2, categories }) : null;
  const window = {
    location: { hostname: host },
    localStorage: { getItem: () => consent },
    MontisoroConsent: { onChange: cb => { consentListener = cb; } },
    setTimeout: () => 0,
    doNotTrack: '0'
  };
  const document = {
    createElement: () => ({}),
    head: { appendChild: node => scripts.push(node.src) },
    getElementsByTagName: () => [{ parentNode: { insertBefore: node => scripts.push(node.src) } }]
  };
  window.window = window;
  window.navigator = { doNotTrack: '0', msDoNotTrack: '0' };
  window.document = document;
  vm.runInNewContext(source, window);
  return { window, scripts, consentListener };
}

const noConsent = runTag(clarity, { host: 'www.montisoro.com', categories: null });
if (noConsent.scripts.length) failures.push('Clarity laadt vóór toestemming op productie.');

const performanceOnly = runTag(clarity, {
  host: 'www.montisoro.com',
  categories: { functional: true, analytics: false, performance: true, marketing: false }
});
if (performanceOnly.scripts.length) failures.push('Clarity laadt bij alleen prestatietoestemming.');

const clarityAllowed = runTag(clarity, {
  host: 'www.montisoro.com',
  categories: { functional: true, analytics: true, performance: false, marketing: false }
});
if (!clarityAllowed.scripts.some(src => src === 'https://www.clarity.ms/tag/xmf5h83z44')) {
  failures.push('Clarity laadt niet na analytische toestemming op productie.');
}
const initialClarityConsent = clarityAllowed.window.clarity?.q?.find(args => args[0] === 'consentv2');
if (!initialClarityConsent || initialClarityConsent[1]?.analytics_Storage !== 'granted' || initialClarityConsent[1]?.ad_Storage !== 'denied') {
  failures.push('Clarity Consent V2 krijgt niet de verwachte startstatus.');
}
clarityAllowed.consentListener?.({ categories: { functional: true, analytics: false, performance: false, marketing: false } });
const latestClarityConsent = clarityAllowed.window.clarity?.q?.filter(args => args[0] === 'consentv2').at(-1);
if (!latestClarityConsent || latestClarityConsent[1]?.analytics_Storage !== 'denied') {
  failures.push('Clarity Consent V2 verwerkt intrekking niet.');
}

const clarityPreview = runTag(clarity, {
  host: 'preview.example.com',
  categories: { functional: true, analytics: true, performance: true, marketing: true }
});
if (clarityPreview.scripts.length) failures.push('Clarity laadt op een previewhost.');

const gaAllowed = runTag(ga4, {
  host: 'montisoro.com',
  categories: { functional: true, analytics: true, performance: false, marketing: false }
});
if (!gaAllowed.scripts.some(src => src === 'https://www.googletagmanager.com/gtag/js?id=G-JV1X452NRZ')) {
  failures.push('GA4 laadt niet na analytische toestemming op productie.');
}
const gaPreview = runTag(ga4, {
  host: 'preview.example.com',
  categories: { functional: true, analytics: true, performance: true, marketing: true }
});
if (gaPreview.scripts.length) failures.push('GA4 laadt op een previewhost.');

if (failures.length) {
  console.error(`Analytics/privacy verification failed (${failures.length}):`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log('Analytics/privacy verification passed: production-host gating, Consent V2, privacy disclosure and admin heatmap link.');
