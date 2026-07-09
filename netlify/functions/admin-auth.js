/* ═══════════════════════════════════════════════════════════════════
   admin-auth.js — Netlify Function (POST)  ·  STAP 4 (DB-backed RBAC)
   ───────────────────────────────────────────────────────────────────
   Server-side wachtwoordcontrole + ondertekend sessietoken, nu met rol +
   per-gebruiker credentials uit public.users (migratie 0011/0015).

   TRANSITIE-VEILIG (geen lockout):
     • Supabase NIET geconfigureerd → exact het oude gedrag (gedeeld
       ADMIN_PASSWORD + hardcoded ROLE_BY_EMAIL).
     • Gebruiker zonder password_hash → gebruikt het gedeelde ADMIN_PASSWORD.
     • DB-fout bij de lookup → val terug op ROLE_BY_EMAIL (nooit buitensluiten).
     • Gebruiker met status 'disabled' → geweigerd (geen user-enumeratie).

   ⚠️  De buitenste poort blijft de externe IdP-gate (Cloudflare Access) —
   zie /admin-panel/documents/security-setup.md. Deze functie houdt het
   wachtwoord uit de client en bepaalt de rol server-side.

   Env: ADMIN_PASSWORD, ADMIN_SESSION_SECRET (verplicht), ALLOWED_ORIGIN.
   Endpoint: /api/admin-auth
═══════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');
const rl = require('./_lib/rateLimit.js');
const auth = require('./_lib/auth.js');
const store = require('./_lib/supabase.js');

const SECRET = process.env.ADMIN_SESSION_SECRET || '';
const PASSWORD = process.env.ADMIN_PASSWORD || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const TTL_MS = 1000 * 60 * 60 * 8; // 8 uur
const MAX_FAILS = 8;                       // mislukte pogingen per IP
const FAIL_WINDOW_MS = 10 * 60 * 1000;     // binnen 10 min → lockout (anti-brute-force)

// Transitie-fallback wanneer er (nog) geen users-tabel/rij is.
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

  // Rol + per-user wachtwoord: uit Supabase indien geconfigureerd, anders fallback.
  let role = ROLE_BY_EMAIL[email];   // transitie-fallback
  let pwHash = null;
  if (store.isConfigured()) {
    try {
      const user = await store.getUserByEmail(email);
      if (user) {
        if (user.status === 'disabled') {              // geblokkeerd account
          rl.record(failKey, FAIL_WINDOW_MS);
          return res(401, { ok: false, error: 'invalid_credentials' }); // geen enumeratie
        }
        role = user.role || role;
        pwHash = user.password_hash || null;
      }
    } catch (e) { /* DB-fout → fallback behouden, nooit lockout */ }
  }

  if (!role) { rl.record(failKey, FAIL_WINDOW_MS); return res(401, { ok: false, error: 'invalid_credentials' }); } // onbekende gebruiker

  // Wachtwoord: per-user scrypt-hash indien gezet, anders het gedeelde ADMIN_PASSWORD.
  let ok = false;
  if (pwHash) {
    ok = auth.verifyPassword(pw, pwHash);
  } else {
    try {
      const a = Buffer.from(pw), b = Buffer.from(PASSWORD);
      ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch (e) { ok = false; }
  }
  if (!ok) { rl.record(failKey, FAIL_WINDOW_MS); return res(401, { ok: false, error: 'invalid_credentials' }); }

  rl.clear(failKey); // geslaagde login → teller resetten

  // Best-effort: last_login bijwerken (faalt stil, blokkeert de login niet).
  if (store.isConfigured()) { try { await store.touchUserLogin(email); } catch (e) {} }

  const exp = Date.now() + TTL_MS;
  const token = auth.sign({ email: email, role: role, exp: exp });
  return res(200, { ok: true, email: email, role: role, exp: exp, token: token });
};
