/* ═══════════════════════════════════════════════════════════════════
   admin-submissions.js — Netlify Function (POST)  ·  FASE 2 · taak 04
   ───────────────────────────────────────────────────────────────────
   Admin → Supabase READ BRIDGE. The admin SPA is static and the
   service-role key may NEVER touch the browser, so the admin reads
   calculator leads through this server-side function instead.

   Security:
     • Requires a valid admin session token (HMAC, same secret as
       admin-auth.js). No token / expired / bad signature → 401.
     • Reads with the service-role key server-side only.

   Graceful inert behaviour (so the admin keeps working before K1):
     • SECRET missing  → 503 auth_not_configured
     • Supabase missing → 503 db_not_configured
     The admin frontend treats any non-200 as "stay on mock data".

   Endpoint: /api/admin-submissions  (alias) or /.netlify/functions/admin-submissions
═══════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');
const store = require('./_lib/supabase.js');

const SECRET = process.env.ADMIN_SESSION_SECRET || '';
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

/* Verify the HMAC token produced by admin-auth.js sign(): "<b64url payload>.<b64url mac>" */
function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const data = token.slice(0, dot);
  const mac = token.slice(dot + 1);
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

/* Short money label matching the admin's existing mock format ("€280K" / "€2,8M"). */
function shortCost(n) {
  if (n == null || isNaN(n)) return '—';
  n = Number(n);
  if (n >= 1e6) return '€' + (n / 1e6).toFixed(1).replace('.', ',') + 'M';
  if (n >= 1e3) return '€' + Math.round(n / 1e3) + 'K';
  return '€' + Math.round(n);
}

/* ISO timestamptz → "YYYY-MM-DD HH:mm" (same shape the admin sorts on). */
function fmtTs(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const p = new Intl.DateTimeFormat('nl-BE', { timeZone:'Europe/Brussels', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }).formatToParts(d);
    const g = t => (p.find(x => x.type === t) || {}).value;
    return g('year')+'-'+g('month')+'-'+g('day')+' '+g('hour')+':'+g('minute');
  } catch (e) { return String(iso).replace('T', ' ').slice(0, 16); }
}

/* DB row → the exact object shape admin.js (calcCard / openCalcDrawer / analytics) expects. */
function mapRow(row, pdfUrl) {
  const input = (row.input && typeof row.input === 'object') ? row.input : {};
  return {
    id: row.id,
    source: row.source || 'calculator',
    lang: row.lang || 'nl',
    name: row.name || '',
    company: row.company || '',
    email: row.email || '',
    phone: row.phone || '',
    consent: !!row.consent,
    cost: shortCost(row.annual_cost),
    annual_cost: row.annual_cost,
    lost_workdays: row.lost_workdays,
    cost_per_employee: row.cost_per_employee,
    cost_per_lost_day: row.cost_per_lost_day,
    absence_rate: row.absence_rate,
    fte: (input.fte != null ? input.fte : null),
    salary: (input.salary != null ? input.salary : null),
    risk_level: row.risk_level || null,
    pdf_status: row.pdf_status || 'pending',
    pdf_url: pdfUrl || '',
    lead_status: row.lead_status || 'new',
    notes: row.notes || '',
    read: !!row.read_at,
    handled: !!row.handled_at,
    ts: fmtTs(row.created_at)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res(204, {});
  if (event.httpMethod !== 'POST') return res(405, { ok: false, error: 'method_not_allowed' });

  // Inert defaults → admin stays on mock data.
  if (!SECRET) return res(503, { ok: false, error: 'auth_not_configured' });
  if (!store.isConfigured()) return res(503, { ok: false, error: 'db_not_configured' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return res(400, { ok: false, error: 'bad_json' }); }

  const session = verify(body.token);
  if (!session) return res(401, { ok: false, error: 'unauthorized' });
  /* FIX nr4: role-based access — admin/consultant/sales can read submissions */
  if (!['admin','consultant','sales'].includes(session.role || '')) {
    return res(403, { ok: false, error: 'forbidden', detail: 'Insufficient role: ' + (session.role||'unknown') });
  }

  let rows;
  try { rows = await store.listSubmissions(200); }
  catch (e) {
    console.error('[admin-submissions] list failed:', e.message);
    return res(502, { ok: false, error: 'db_read_failed' });
  }

  // Sign a download URL only for rows that actually have a stored PDF.
  const submissions = await Promise.all(rows.map(async (row) => {
    let pdfUrl = '';
    if (row.pdf_path) {
      try { pdfUrl = await store.signedPdfUrl(row.pdf_path, 60 * 60 * 24) || ''; }
      catch (e) { /* leave empty on failure */ }
    }
    return mapRow(row, pdfUrl);
  }));

  return res(200, { ok: true, count: submissions.length, submissions });
};
