/* ═══════════════════════════════════════════════════════════════════
   admin-mark.js — Netlify Function (POST)
   ───────────────────────────────────────────────────────────────────
   Zet read_at / handled_at op een inzending (persistent in Supabase).
   HMAC-beveiligd (zelfde tokenpatroon als admin-form-submissions).

   Body: { token, table:'calculator_submissions'|'form_submissions',
           id, read?:bool, handled?:bool }
   Endpoint: /api/admin-mark
═══════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');
const store  = require('./_lib/supabase.js');

const SECRET         = process.env.ADMIN_SESSION_SECRET || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const TABLES = { calculator_submissions: 'patchSubmission', form_submissions: 'patchFormSubmission' };

function res(sc, body) {
  return { statusCode: sc, headers: {
    'Content-Type':'application/json','Cache-Control':'no-store',
    'Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS'
  }, body: JSON.stringify(body) };
}
function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const data = token.slice(0, dot), mac = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  let ok = false;
  try { const a = Buffer.from(mac), b = Buffer.from(expected); ok = a.length === b.length && crypto.timingSafeEqual(a, b); } catch (e) { ok = false; }
  if (!ok) return null;
  try { const p = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')); if (!p || !p.exp || Date.now() > p.exp) return null; return p; }
  catch (e) { return null; }
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return res(200, {});
  if (event.httpMethod !== 'POST') return res(405, { error: 'method_not_allowed' });
  if (!SECRET) return res(503, { error: 'auth_not_configured' });
  if (!store.isConfigured()) return res(503, { error: 'db_not_configured' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return res(400, { error: 'invalid_json' }); }
  if (!verify(body.token)) return res(401, { error: 'unauthorized' });

  const fn = TABLES[body.table];
  if (!fn) return res(400, { error: 'invalid_table' });
  if (!body.id) return res(400, { error: 'missing_id' });

  const patch = {};
  if (body.read    !== undefined) patch.read_at    = body.read    ? new Date().toISOString() : null;
  if (body.handled !== undefined) patch.handled_at = body.handled ? new Date().toISOString() : null;
  if (body.lead_status !== undefined) {
    const ALLOWED = ['new','viewed','followed_up'];
    if (ALLOWED.indexOf(body.lead_status) >= 0) patch.lead_status = body.lead_status;
  }
  if (body.notes !== undefined) patch.notes = String(body.notes).slice(0, 4000);
  if (!Object.keys(patch).length) return res(400, { error: 'nothing_to_update' });

  try { await store[fn](body.id, patch); return res(200, { ok: true, id: body.id, patched: Object.keys(patch) }); }
  catch (e) { return res(500, { error: 'db_patch_failed', detail: e.message }); }
};
