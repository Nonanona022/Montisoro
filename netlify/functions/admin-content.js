/* ═══════════════════════════════════════════════════════════════════
   admin-content.js — Netlify Function (POST)
   ───────────────────────────────────────────────────────────────────
   Admin → Supabase WRITE BRIDGE for site content.
   Writes trusted_by / testimonials / calc_params to the `site_content`
   table so the website read-bridge picks them up automatically.

   Security:
     • Requires a valid admin session token (HMAC, same secret as admin-auth.js).
     • Only allowed keys: trusted_by, testimonials, calc_params.
     • No token / expired / bad signature → 401.
     • Supabase missing → 503 (inert-safe).

   Endpoint: /api/admin-content (alias in netlify.toml)
═══════════════════════════════════════════════════════════════════ */
'use strict';
const store = require('./_lib/supabase.js');
const auth  = require('./_lib/auth.js');

const SECRET         = process.env.ADMIN_SESSION_SECRET || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const ALLOWED_KEYS   = ['trusted_by', 'testimonials', 'calc_params', 'feature_flags', 'booking_schedule', 'faq', 'seo', 'microcopy', 'email_templates'];

function res(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

/* HMAC-verificatie + rolcheck zijn verhuisd naar _lib/auth.js (STAP 4). */

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return res(200, {});
  if (event.httpMethod !== 'POST') return res(405, { error: 'method_not_allowed' });

  /* Auth guard */
  if (!SECRET) return res(503, { error: 'auth_not_configured' });
  if (!store.isConfigured()) return res(503, { error: 'db_not_configured' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return res(400, { error: 'invalid_json' }); }

  /* STAP 4: gecentraliseerde auth + RBAC (admin-rol vereist) */
  const payload = auth.verifyToken(body.token);
  if (!payload) return res(401, { error: 'unauthorized' });
  if (!auth.roleAtLeast(payload.role, 'admin')) {
    return res(403, { error: 'forbidden', detail: 'Only Admin role may publish site content. Your role: ' + (payload.role || 'unknown') });
  }

  /* STAP 5: actie-routing — publish (default) · history · rollback. Allemaal admin-only. */
  const action = body.action || 'publish';

  if (action === 'history') {
    const hkey = body.key;
    if (!hkey || !ALLOWED_KEYS.includes(hkey)) return res(400, { error: 'invalid_key', allowed: ALLOWED_KEYS });
    try { return res(200, { ok: true, key: hkey, versions: await store.listContentVersions(hkey, body.limit || 20) }); }
    catch (e) { return res(500, { error: 'db_read_failed', detail: e.message }); }
  }

  if (action === 'rollback') {
    if (!body.version_id) return res(400, { error: 'missing_version_id' });
    try {
      const v = await store.getContentVersion(body.version_id);
      if (!v) return res(404, { error: 'version_not_found' });
      if (!ALLOWED_KEYS.includes(v.key)) return res(400, { error: 'invalid_key' });
      await store.setSiteContent(v.key, v.data, payload.email || 'admin');
      // De rollback is zelf ook een nieuwe versie → altijd terug-navigeerbaar.
      try { await store.insertContentVersion({ key: v.key, data: v.data, published_by: payload.email || 'admin', note: 'rollback → ' + body.version_id }); } catch (ve) {}
      return res(200, { ok: true, key: v.key, rolled_back_to: body.version_id, published_at: new Date().toISOString() });
    } catch (e) { return res(500, { error: 'rollback_failed', detail: e.message }); }
  }

  /* default: publish (+ versie-snapshot) */
  const key = body.key;
  if (!key || !ALLOWED_KEYS.includes(key)) {
    return res(400, { error: 'invalid_key', allowed: ALLOWED_KEYS });
  }
  if (body.data === undefined || body.data === null) {
    return res(400, { error: 'missing_data' });
  }

  try {
    await store.setSiteContent(key, body.data, payload.email || 'admin');
    // STAP 5: bewaar een versie-snapshot (best-effort — faalt NOOIT de publish).
    try { await store.insertContentVersion({ key: key, data: body.data, published_by: payload.email || 'admin', note: body.note || null }); } catch (ve) {}
    return res(200, {
      ok: true,
      key,
      published_at: new Date().toISOString(),
      by: payload.email || 'admin'
    });
  } catch (e) {
    return res(500, { error: 'db_write_failed', detail: e.message });
  }
};
