/* ═══════════════════════════════════════════════════════════════════
   _lib/pdf.js — HTML report template → A4 PDF buffer
   Loads the briefing-structure report (verzuimrapport-test-report{,-en}.html),
   inlines the engine + variant content + brand fonts so chromium renders
   self-contained, injects window.__MONTISORO_REPORT, prints to PDF.
   Language (NL/EN) is chosen from report.lang.
═══════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// Robust root resolution: esbuild bundles _lib/pdf.js INTO the function file,
// so __dirname's depth varies by how Netlify lays the bundle out. Try several
// candidate roots (+ cwd) and use whichever actually contains the file —
// included_files land at their repo-relative paths under the task root.
const CANDIDATE_ROOTS = [
  path.resolve(__dirname, '..', '..', '..'),
  process.cwd(),
  path.resolve(__dirname, '..', '..'),
  path.resolve(__dirname, '..'),
  __dirname,
  path.resolve(process.cwd(), '..')
];
function P(rel) {
  for (let i = 0; i < CANDIDATE_ROOTS.length; i++) {
    const cand = path.join(CANDIDATE_ROOTS[i], rel);
    try { if (fs.existsSync(cand)) return cand; } catch (e) {}
  }
  return path.join(CANDIDATE_ROOTS[0], rel); // fallback → clear ENOENT path
}

const SITE = (process.env.SITE_BASE_URL || '').replace(/\/+$/, '');
// public path on the live site for a repo-relative file (website/ = web root)
function pub(rel) { return rel.replace(/^website/, ''); }

// Load a text file: try disk first (if included_files bundled it), otherwise
// fetch it from the LIVE site over HTTP. The report template, engine, params,
// content and fonts are all public files the website already serves — so this
// works no matter how Netlify bundles the function (no ENOENT surprises).
async function readText(rel) {
  try { const p = P(rel); if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8'); } catch (e) {}
  if (SITE) {
    const r = await fetch(SITE + pub(rel));
    if (r.ok) return await r.text();
    throw new Error('fetch ' + pub(rel) + ' -> HTTP ' + r.status);
  }
  throw new Error('cannot load ' + rel + ' (not on disk, SITE_BASE_URL unset)');
}
async function readDataUri(rel, mime) {
  try { const p = P(rel); if (fs.existsSync(p)) return `data:${mime};base64,` + fs.readFileSync(p).toString('base64'); } catch (e) {}
  if (SITE) {
    const r = await fetch(SITE + pub(rel));
    if (r.ok) return `data:${mime};base64,` + Buffer.from(await r.arrayBuffer()).toString('base64');
    throw new Error('fetch ' + pub(rel) + ' -> HTTP ' + r.status);
  }
  throw new Error('cannot load ' + rel + ' (not on disk, SITE_BASE_URL unset)');
}

// inline the brand fonts: rewrite the woff2 url()'s in fonts.css to data URIs
async function inlineFonts() {
  let css = await readText('website/stylesheets/fonts.css');
  const files = [...new Set([...css.matchAll(/\.\.\/assets\/fonts\/([^'")]+\.woff2)/g)].map(function (m) { return m[1]; }))];
  for (const f of files) {
    const uri = await readDataUri('website/assets/fonts/' + f, 'font/woff2');
    css = css.split('../assets/fonts/' + f).join(uri);
  }
  return css;
}

async function buildHtml(report) {
  const lang = (report && report.lang === 'en') ? 'en' : 'nl';
  const tpl = lang === 'en'
    ? 'website/documents/verzuimrapport-test-report-en.html'
    : 'website/documents/verzuimrapport-test-report.html';
  const contentTag = lang === 'en'
    ? '<script src="verzuimrapport-test-en.content.js"></script>'
    : '<script src="verzuimrapport-test.content.js"></script>';
  const contentFile = lang === 'en'
    ? 'website/documents/verzuimrapport-test-en.content.js'
    : 'website/documents/verzuimrapport-test.content.js';

  let html = await readText(tpl);
  const engine = await readText('website/services/verzuim-engine.js');
  const content = await readText(contentFile);
  const params = await readText('website/config/calculator-params.js');

  // inline external scripts (relative <script src> won't resolve in setContent)
  html = html.replace('<script src="../config/calculator-params.js"></script>', `<script>${params}</script>`);
  html = html.replace('<script src="../services/verzuim-engine.js"></script>', `<script>${engine}</script>`);
  html = html.replace(contentTag, `<script>${content}</script>`);

  // inline brand fonts (woff2 → data URI) so chromium renders self-contained
  html = html.replace('<link rel="stylesheet" href="../stylesheets/fonts.css">', `<style>${await inlineFonts()}</style>`);

  // inject the report data BEFORE the page's own render script runs
  const inject = `<script>window.__MONTISORO_REPORT = ${JSON.stringify(report)};</script>`;
  html = html.replace('</head>', `${inject}</head>`);

  return html;
}

async function renderPdf(report) {
  const html = await buildHtml(report);
  // @sparticuz/chromium: when the function is esbuild-bundled, its default
  // executablePath() resolves the binary against the WRONG dir (e.g.
  // /var/task/netlify/bin → ENOENT). Point it explicitly at where
  // included_files placed the pack (node_modules/@sparticuz/chromium/bin).
  let execPath;
  try {
    execPath = await chromium.executablePath(path.join(process.cwd(), 'node_modules', '@sparticuz', 'chromium', 'bin'));
  } catch (e) {
    execPath = await chromium.executablePath();
  }
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: execPath,
    headless: chromium.headless,
    defaultViewport: { width: 1240, height: 1754, deviceScaleFactor: 2 }
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    // give fonts + render a beat
    await page.evaluateHandle('document.fonts.ready');
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    return buffer;
  } finally {
    await browser.close();
  }
}

module.exports = { renderPdf, buildHtml };
