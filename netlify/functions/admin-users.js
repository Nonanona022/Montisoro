/* ═══════════════════════════════════════════════════════════════════
   admin-users.js — Netlify Function (POST)  ·  STAP 4 (RBAC management)
   ───────────────────────────────────────────────────────────────────
   Beheer van admin-gebruikers in public.users — ADMIN-ROL ONLY.
   Hiermee worden echte per-gebruiker accounts gemaakt i.p.v. één gedeeld
   wachtwoord. password_hash wordt server-side gezet (scrypt); de hash en het
   mfa_secret worden NOOIT teruggegeven aan de client.

   Acties (body.action):
     list           → alle gebruikers (zonder geheimen)
     upsert         → { user:{ email, name, role, status, password? } }
     set-password   → { email, password }
     disable        → { email }

   Security: requireAuth(event,'admin') (HMAC-token, rol uit het token).
   Inert-safe: zonder secret/Supabase → 503.
   Endpoint: /api/admin-users
═══════════════════════════════════════════════════════════════════ */
'use strict';
const auth = require('./_lib/auth.js');
const store = require('./_lib/supabase.js');

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const SECRET = process.env.ADMIN_SESSION_SECRET || '';
const ROLES = ['admin', 'editor', 'viewer'];
const STATUSES = ['active', 'paused', 'disabled'];

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

function redact(u) {
  if (!u) return u;
  const c = Object.assign({}, u);
  delete c.password_hash;
  delete c.mfa_secret;
  return c;
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return res(204, {});
  if (event.httpMethod !== 'POST') return res(405, { error: 'method_not_allowed' });

  if (!SECRET) return res(503, { error: 'auth_not_configured' });
  if (!store.isConfigured()) return res(503, { error: 'db_not_configured' });

  // ADMIN-rol vereist (server-side, niet manipuleerbaar door de client).
  const gate = auth.requireAuth(event, 'admin');
  if (!gate.ok) return res(gate.status, { error: gate.error });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return res(400, { error: 'invalid_json' }); }

  const action = body.action;
  try {
    if (action === 'list') {
      return res(200, { ok: true, users: await store.listUsers() });
    }

    if (action === 'upsert') {
      const u = body.user || {};
      const email = String(u.email || '').trim().toLowerCase();
      if (!email) return res(400, { error: 'missing_email' });
      const rec = {
        email: email,
        name: u.name || null,
        role: ROLES.includes(u.role) ? u.role : 'viewer',
        status: STATUSES.includes(u.status) ? u.status : 'active',
        invited_by: gate.claims.email || null
      };
      if (u.password) rec.password_hash = auth.hashPassword(String(u.password));
      const saved = await store.upsertUser(rec);
      return res(200, { ok: true, user: redact(saved) });
    }

    if (action === 'set-password') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email || !password) return res(400, { error: 'missing_fields' });
      await store.setUserPassword(email, auth.hashPassword(password));
      return res(200, { ok: true });
    }

    if (action === 'disable') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return res(400, { error: 'missing_email' });
      const saved = await store.upsertUser({ email: email, status: 'disabled' });
      return res(200, { ok: true, user: redact(saved) });
    }

    return res(400, { error: 'invalid_action' });
  } catch (e) {
    return res(500, { error: 'server_error', detail: e.message });
  }
};
