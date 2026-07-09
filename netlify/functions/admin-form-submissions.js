/* ═══════════════════════════════════════════════════════════════════
   admin-form-submissions.js — Netlify Function (POST)
   ───────────────────────────────────────────────────────────────────
   Admin → Supabase READ BRIDGE for form_submissions table
   (contact / fitcheck / casey / booking).
   Same security pattern as admin-submissions.js (HMAC token).

   Endpoint: /api/admin-form-submissions
═══════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');
const store  = require('./_lib/supabase.js');

const SECRET         = process.env.ADMIN_SESSION_SECRET || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

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

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const data = token.slice(0, dot);
  const mac  = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  let ok = false;
  try {
    const a = Buffer.from(mac), b = Buffer.from(expected);
    ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) { ok = false; }
  if (!ok) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')); }
  catch (e) { return null; }
  if (!payload || !payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

/* ISO timestamptz → "YYYY-MM-DD HH:mm" in Europe/Brussels (lokale tijd) */
function fmtTs(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const p = new Intl.DateTimeFormat('nl-BE', { timeZone:'Europe/Brussels', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }).formatToParts(d);
    const g = t => (p.find(x => x.type === t) || {}).value;
    return g('year')+'-'+g('month')+'-'+g('day')+' '+g('hour')+':'+g('minute');
  } catch (e) { return String(iso).replace('T', ' ').slice(0, 16); }
}

/* DB row → admin-compatible shape */
function mapRow(row) {
  const f = (row.fields && typeof row.fields === 'object') ? row.fields : {};
  return {
    id:         row.id,
    ts:         fmtTs(row.created_at),
    type:       row.type,
    lang:       row.lang || 'nl',
    email:      row.email || '',
    name:       row.name  || f.name || '',
    company:    row.company || f.organisatie || '',
    route:      f.route      || '',
    maturity:   f.maturity   || null,
    scale:      f.scale      || '',
    mail_status:    row.mail_status    || 'pending',
    confirm_status: row.confirm_status || 'pending',
    lead_status:    row.lead_status    || 'new',
    notes:      row.notes || '',
    read:       !!row.read_at,
    handled:    !!row.handled_at,
    fields:     f   /* volledige ruwe invoer → inbox toont ALLES wat de klant ingaf */
  };
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return res(200, {});
  if (event.httpMethod !== 'POST') return res(405, { error: 'method_not_allowed' });

  if (!SECRET) return res(503, { error: 'auth_not_configured' });
  if (!store.isConfigured()) return res(503, { error: 'db_not_configured' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return res(400, { error: 'invalid_json' }); }

  const payload = verify(body.token);
  if (!payload) return res(401, { error: 'unauthorized' });
  /* FIX nr4: role-based access */
  if (!['admin','consultant','sales'].includes(payload.role || '')) {
    return res(403, { error: 'forbidden', detail: 'Insufficient role: ' + (payload.role||'unknown') });
  }

  try {
    const rows = (await store.listFormSubmissions(500)).map(mapRow);

    /* Split by type for the admin's convenience */
    const out = { contact: [], fitcheck: [], casey: [], booking: [] };
    rows.forEach(function(r) {
      if (out[r.type]) out[r.type].push(r);
    });

    return res(200, { ok: true, submissions: out, total: rows.length });
  } catch (e) {
    return res(500, { error: 'db_read_failed', detail: e.message });
  }
};
