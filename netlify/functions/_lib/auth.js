/* ═══════════════════════════════════════════════════════════════════
   _lib/auth.js — gecentraliseerde token-verificatie + RBAC + wachtwoord-hash
   FASE 2 · STAP 4. SERVER-SIDE ONLY.
   ───────────────────────────────────────────────────────────────────
   Eén bron van waarheid voor wat vandaag verspreid in elke admin-* functie
   stond: HMAC-token verifiëren, rol-rang vergelijken, wachtwoord hashen/checken.

   Token-formaat (compatibel met admin-auth.js sign()):
     base64url(JSON.stringify({email,role,exp})) + '.' + base64url(HMAC-SHA256)

   Wachtwoord-hash: Node-ingebouwde scrypt (GEEN dependency).
     Formaat: scrypt$<N>$<saltBase64>$<hashBase64>
═══════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');
const SECRET = process.env.ADMIN_SESSION_SECRET || '';

/* Verifieer een sessietoken. Geeft de claims terug ({email,role,exp}) of null. */
function verifyToken(token) {
  if (!SECRET || !token || typeof token !== 'string') return null;
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
  if (!payload || (payload.exp && Date.now() > payload.exp)) return null;
  return payload;
}

/* Onderteken een payload tot een sessietoken (identiek aan admin-auth.js). */
function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return data + '.' + mac;
}

/* Rol-hiërarchie: admin > editor > viewer. */
const RANK = { viewer: 1, editor: 2, admin: 3 };
function roleAtLeast(role, min) { return (RANK[role] || 0) >= (RANK[min] || 99); }

/* Poortwachter voor functies. Leest de token uit de JSON-body (bestaande
   conventie) of een 'Authorization: Bearer'-header.
   → { ok:true, claims } | { ok:false, status, error }  (werpt nooit). */
function requireAuth(event, minRole) {
  let token = '';
  try { token = (JSON.parse(event.body || '{}').token) || ''; } catch (e) {}
  if (!token && event.headers) {
    const h = event.headers.authorization || event.headers.Authorization || '';
    if (/^Bearer /i.test(h)) token = h.replace(/^Bearer /i, '');
  }
  const claims = verifyToken(token);
  if (!claims) return { ok: false, status: 401, error: 'unauthorized' };
  if (minRole && !roleAtLeast(claims.role, minRole)) return { ok: false, status: 403, error: 'forbidden' };
  return { ok: true, status: 200, claims };
}

/* Wachtwoord → scrypt-hash (Node-ingebouwd, geen dependency). */
function hashPassword(pw) {
  const N = 16384, salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(pw), salt, 32, { N, r: 8, p: 1 });
  return 'scrypt$' + N + '$' + salt.toString('base64') + '$' + hash.toString('base64');
}

/* Constant-time wachtwoordverificatie tegen een opgeslagen scrypt-hash. */
function verifyPassword(pw, stored) {
  try {
    const parts = String(stored).split('$');
    if (parts.length !== 4 || parts[0] !== 'scrypt') return false;
    const N = parseInt(parts[1], 10);
    const salt = Buffer.from(parts[2], 'base64');
    const hash = Buffer.from(parts[3], 'base64');
    const test = crypto.scryptSync(String(pw), salt, hash.length, { N, r: 8, p: 1 });
    return test.length === hash.length && crypto.timingSafeEqual(test, hash);
  } catch (e) { return false; }
}

module.exports = { verifyToken, sign, roleAtLeast, requireAuth, hashPassword, verifyPassword, RANK };
