/* ═══════════════════════════════════════════════════════════════════
   site-content.js — Netlify Function (GET)  ·  Website ↔ dashboard bridge
   ───────────────────────────────────────────────────────────────────
   PUBLIC, read-only endpoint the live site calls at runtime to hydrate
   dashboard-managed content (testimonials / trusted-by / calculator params).

   • Inert-safe: if Supabase isn't configured → { configured:false }. The
     site then keeps its hardcoded fallback data (window.MONTISORO_*), so
     nothing breaks before the table is populated.
   • Read-only: GET only. No secrets reach the browser (service-role key
     stays server-side; only the curated public content is returned).
   • Cache: short public cache so edits propagate fast but the function
     isn't hammered on every page view.

   Endpoint: /api/site-content  (alias) or /.netlify/functions/site-content
═══════════════════════════════════════════════════════════════════ */
'use strict';
const store = require('./_lib/supabase.js');

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function res(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: Object.assign({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }, extraHeaders || {}),
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res(204, {});
  if (event.httpMethod !== 'GET') return res(405, { ok: false, error: 'method_not_allowed' });

  // Inert until configured → site uses its hardcoded fallback.
  if (!store.isConfigured()) return res(200, { ok: true, configured: false, content: {} });

  try {
    const content = await store.getSiteContent();
    // 5-min CDN cache: fast propagation, low function load.
    return res(200, { ok: true, configured: true, content: content || {} },
      { 'Cache-Control': 'public, max-age=300, must-revalidate' });
  } catch (e) {
    console.error('[site-content] read failed:', e.message);
    // Fail soft: tell the site to keep its fallback rather than error out.
    return res(200, { ok: true, configured: false, content: {}, error: 'read_failed' });
  }
};
