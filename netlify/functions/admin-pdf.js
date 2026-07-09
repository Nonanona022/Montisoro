/* ═══════════════════════════════════════════════════════════════════
   admin-pdf.js — Netlify Function (POST)  ·  FIX 3
   ───────────────────────────────────────────────────────────────────
   Returns a fresh signed Supabase URL for a calculator PDF.
   HMAC-protected (same pattern as admin-submissions.js).
   Endpoint: /api/admin-pdf
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
  /* FIX nr4: role-based access — admin/consultant/sales can download PDFs */
  if (!['admin','consultant','sales'].includes(payload.role || '')) {
    return res(403, { error: 'forbidden', detail: 'Insufficient role: ' + (payload.role||'unknown') });
  }
  const submissionId = body.submission_id;
  if (!submissionId) return res(400, { error: 'missing_submission_id' });

  try {
    const versions = await store.listPdfVersions(submissionId);
    if (!versions || !versions.length) return res(404, { error: 'no_pdf_found' });
    const latest = versions[0]; // newest-first
    const url = await store.signedPdfUrl(latest, 60 * 60 * 24); // 24h
    if (!url) return res(500, { error: 'failed_to_sign_url' });
    return res(200, { ok: true, url, path: latest, expires_in: '24h' });
  } catch(e) {
    return res(500, { error: 'db_error', detail: e.message });
  }
};
