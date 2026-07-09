/* ═══════════════════════════════════════════════════════════════════
   admin-auth.js — Netlify Function (POST)  ·  K2 hardening
   ───────────────────────────────────────────────────────────────────
   Server-side wachtwoordcontrole + ondertekend sessietoken.
   Vervangt de client-side plaintext-check als PRODUCTIE-pad.

   ⚠️  Dit is de APPLICATIE-laag. De buitenste poort blijft een externe
   IdP-gate (Cloudflare Access) — zie /admin-panel/documents/security-setup.md.
   Een statische SPA kan een token niet per-request server-side valideren;
   de echte beveiliging is de Access-gate. Deze functie zorgt dat het
   wachtwoord niet langer in de client-broncode staat en dat de rol
   server-side wordt bepaald.

   Env:
     ADMIN_PASSWORD        — het admin-wachtwoord (verplicht)
     ADMIN_SESSION_SECRET  — HMAC-secret voor tokenondertekening (verplicht)
     ALLOWED_ORIGIN        — CORS origin (default '*')

   Endpoint: /api/admin-auth  (alias) of /.netlify/functions/admin-auth
═══════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');
const rl = require('./_lib/rateLimit.js');

const SECRET = process.env.ADMIN_SESSION_SECRET || '';
const PASSWORD = process.env.ADMIN_PASSWORD || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const TTL_MS = 1000 * 60 * 60 * 8; // 8 uur
const MAX_FAILS = 8;                       // mislukte pogingen per IP
const FAIL_WINDOW_MS = 10 * 60 * 1000;     // binnen 10 min → lockout (anti-brute-force)

// Rol = server-side bron van waarheid (niet manipuleerbaar door de client).
const ROLE_BY_EMAIL = {
  'laurence@montisoro.com': 'admin'
};

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

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return data + '.' + mac;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res(204, {});
  if (event.httpMethod !== 'POST') return res(405, { ok: false, error: 'method_not_allowed' });

  // Geen config = geen toegang (veilige default; consistent met "backend inert").
  if (!PASSWORD || !SECRET) return res(503, { ok: false, error: 'auth_not_configured' });

  // Brute-force-rem: te veel MISLUKTE pogingen vanaf dit IP → tijdelijk blokkeren.
  const failKey = 'auth:' + rl.clientIp(event);
  if (rl.isOver(failKey, MAX_FAILS, FAIL_WINDOW_MS)) return res(429, { ok: false, error: 'too_many_attempts' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return res(400, { ok: false, error: 'bad_json' }); }

  const email = String(body.email || '').trim().toLowerCase();
  const pw = String(body.password || '');
  const role = ROLE_BY_EMAIL[email];
  if (!role) { rl.record(failKey, FAIL_WINDOW_MS); return res(401, { ok: false, error: 'invalid_credentials' }); } // geen user-enumeratie

  // Constant-time vergelijking
  let ok = false;
  try {
    const a = Buffer.from(pw);
    const b = Buffer.from(PASSWORD);
    ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) { ok = false; }
  if (!ok) { rl.record(failKey, FAIL_WINDOW_MS); return res(401, { ok: false, error: 'invalid_credentials' }); }

  rl.clear(failKey); // geslaagde login → teller resetten
  const exp = Date.now() + TTL_MS;
  const token = sign({ email: email, role: role, exp: exp });
  return res(200, { ok: true, email: email, role: role, exp: exp, token: token });
};
