/* ═══════════════════════════════════════════════════════════════════
   admin-delete.js — Netlify Function (POST)  ·  GDPR Art. 17
   ───────────────────────────────────────────────────────────────────
   Hard-deletes a form_submission or calculator_submission by ID.
   ADMIN ROLE ONLY. Irreversible.
   Logs the deletion (by whom, when, which id/email) before deleting.

   Endpoint: /api/admin-delete
═══════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');
const store  = require('./_lib/supabase.js');

const SECRET         = process.env.ADMIN_SESSION_SECRET || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const ALLOWED_TABLES = ['form_submissions', 'calculator_submissions'];

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

  /* ADMIN ONLY — deletion is irreversible */
  if (payload.role !== 'admin') {
    return res(403, { error: 'forbidden', detail: 'Only admin role may delete submissions (GDPR Art. 17)' });
  }

  const table = body.table;
  const id    = body.id;
  const reason = String(body.reason || 'GDPR Art. 17 — right to erasure').slice(0, 200);

  if (!ALLOWED_TABLES.includes(table)) {
    return res(400, { error: 'invalid_table', allowed: ALLOWED_TABLES });
  }
  if (!id || typeof id !== 'string' || id.length < 10) {
    return res(400, { error: 'invalid_id' });
  }

  try {
    const deleted = await store.deleteRecord(table, id);

    /* Audit log to Netlify function logs (no secrets, safe) */
    console.log('[GDPR DELETE]', JSON.stringify({
      deleted_by: payload.email,
      deleted_at: new Date().toISOString(),
      table,
      id: deleted.id,
      email: deleted.email,
      created_at: deleted.created_at,
      reason
    }));

    return res(200, {
      ok: true,
      deleted: { id: deleted.id, email: deleted.email, table },
      deleted_by: payload.email,
      deleted_at: new Date().toISOString()
    });
  } catch(e) {
    return res(500, { error: 'delete_failed', detail: e.message });
  }
};
