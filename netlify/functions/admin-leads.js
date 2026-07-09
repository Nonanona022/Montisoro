/* ═══════════════════════════════════════════════════════════════════
   admin-leads.js — Netlify Function (POST)
   ───────────────────────────────────────────────────────────────────
   CRM leads: list / create / update / delete.
   HMAC-protected. Roles:
   - admin:      full access (read + write + delete)
   - consultant: read + update stage/notes
   - sales:      read + update stage/notes
   - viewer:     read only

   Endpoint: /api/admin-leads
═══════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');
const store  = require('./_lib/supabase.js');

const SECRET         = process.env.ADMIN_SESSION_SECRET || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function res(sc, body) {
  return {
    statusCode: sc,
    headers: { 'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS' },
    body: JSON.stringify(body)
  };
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

/* Sanitize a lead object — only allow known fields */
function sanitize(body) {
  const ALLOWED = ['name','org','email','phone','stage','source','value','value_eur','notes','assigned_to','submission_id'];
  const STAGES  = ['new','qualified','diagnostic','proposal','won','cold'];
  const SOURCES = ['fit-check','contact','calculator','casey-waitlist','referral','other'];
  const out = {};
  ALLOWED.forEach(k => { if (body[k] !== undefined) out[k] = body[k]; });
  if (out.stage && !STAGES.includes(out.stage)) delete out.stage;
  if (out.source && !SOURCES.includes(out.source)) delete out.source;
  if (out.email) out.email = String(out.email).slice(0, 255).trim().toLowerCase();
  return out;
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

  const role   = payload.role || 'viewer';
  const action = body.action || 'list';

  /* Role matrix */
  const canWrite  = ['admin','consultant','sales'].includes(role);
  const canDelete = role === 'admin';

  try {
    /* ── LIST ── */
    if (action === 'list') {
      const leads = await store.listLeads(body.limit || 500);
      return res(200, { ok: true, leads, total: leads.length });
    }

    /* ── CREATE ── */
    if (action === 'create') {
      if (!canWrite) return res(403, { error: 'insufficient_role' });
      const data = sanitize(body.data || {});
      if (!data.email && !data.name) return res(400, { error: 'name_or_email_required' });
      const lead = await store.insertLead(data);
      return res(200, { ok: true, lead });
    }

    /* ── UPDATE ── */
    if (action === 'update') {
      if (!canWrite) return res(403, { error: 'insufficient_role' });
      if (!body.id) return res(400, { error: 'missing_id' });
      const patch = sanitize(body.patch || {});
      await store.patchLead(body.id, patch);
      return res(200, { ok: true, id: body.id, patched: Object.keys(patch) });
    }

    /* ── DELETE ── */
    if (action === 'delete') {
      if (!canDelete) return res(403, { error: 'admin_only' });
      if (!body.id) return res(400, { error: 'missing_id' });
      await store.deleteLead(body.id);
      return res(200, { ok: true, deleted: body.id });
    }

    return res(400, { error: 'unknown_action', actions: ['list','create','update','delete'] });
  } catch(e) {
    return res(500, { error: 'db_error', detail: e.message });
  }
};
