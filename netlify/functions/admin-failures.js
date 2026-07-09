/* ═══════════════════════════════════════════════════════════════════
   admin-failures.js — Netlify Function (POST)  ·  FIX 4
   ───────────────────────────────────────────────────────────────────
   Returns recent delivery_failures records so the admin email-log view
   can show unresolved email/PDF delivery issues.
   HMAC-protected. Endpoint: /api/admin-failures
═══════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');
const store  = require('./_lib/supabase.js');

const SECRET         = process.env.ADMIN_SESSION_SECRET || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function res(sc, body) {
  return { statusCode: sc, headers: { 'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS' }, body: JSON.stringify(body) };
}

function verify(token) {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const data = token.slice(0, dot), mac = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  let ok = false;
  try { const a = Buffer.from(mac), b = Buffer.from(expected); ok = a.length === b.length && crypto.timingSafeEqual(a, b); } catch(e){}
  if (!ok) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch(e) { return null; }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res(200, {});
  if (event.httpMethod !== 'POST') return res(405, { error: 'method_not_allowed' });
  if (!SECRET) return res(503, { error: 'auth_not_configured' });
  if (!store.isConfigured()) return res(503, { error: 'db_not_configured' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch(e) { return res(400, { error: 'bad_json' }); }

  const payload = verify(body.token);
  if (!payload) return res(401, { error: 'unauthorized' });
  /* FIX nr4: read = admin/consultant, resolve = admin only */
  const role = payload.role || '';
  if (!['admin','consultant'].includes(role)) {
    return res(403, { error: 'forbidden', detail: 'Insufficient role: ' + role });
  }
  /* Resolve action requires admin */
  if (body.action === 'resolve' && role !== 'admin') {
    return res(403, { error: 'forbidden', detail: 'Only admin can mark failures as resolved' });
  }
  if (body.action === 'resolve' && body.failure_id) {
    try {
      await store.resolveFailure(body.failure_id);
      return res(200, { ok: true, resolved: body.failure_id });
    } catch(e) { return res(500, { error: 'resolve_failed', detail: e.message }); }
  }

  try {
    const failures = await store.listDeliveryFailures(body.limit || 50);
    return res(200, { ok: true, failures: failures || [], total: (failures || []).length });
  } catch(e) {
    return res(500, { error: 'db_error', detail: e.message });
  }
};
