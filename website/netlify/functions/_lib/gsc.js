/* ═══════════════════════════════════════════════════════════════════
   _lib/gsc.js — Google Search Console koppeling (OAuth 2.0 + API).
   SERVER-SIDE ONLY. Gebruikt de ingebouwde global fetch (Node 18+).
   ───────────────────────────────────────────────────────────────────
   • OAuth-consent-URL bouwen, code→tokens wisselen, access-token verversen.
   • sites.list + searchAnalytics.query (read-only scope).
   • Tokens worden AES-256-GCM VERSLEUTELD opgeslagen (sleutel afgeleid van
     GSC_TOKEN_KEY of ADMIN_SESSION_SECRET) — nooit als platte tekst.
   • Signed state (HMAC) beschermt de OAuth-round-trip tegen CSRF.

   Vereiste env-vars (per Netlify-context, NIET committen):
     GSC_CLIENT_ID       — OAuth-client-ID uit Google Cloud
     GSC_CLIENT_SECRET   — OAuth-client-secret
     SITE_BASE_URL       — bv. https://montisoro.com (voor de redirect-URI)
     GSC_TOKEN_KEY       — (optioneel) aparte encryptiesleutel; anders
                           valt hij terug op ADMIN_SESSION_SECRET
═══════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');

const CLIENT_ID     = process.env.GSC_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GSC_CLIENT_SECRET || '';
const SITE_BASE     = process.env.SITE_BASE_URL || '';
const KEY_SECRET    = process.env.GSC_TOKEN_KEY || process.env.ADMIN_SESSION_SECRET || '';
const SCOPE         = 'https://www.googleapis.com/auth/webmasters.readonly';

/* Is er een OAuth-app geconfigureerd? (zo niet → frontend toont "niet ingesteld") */
function isConfigured(){ return !!(CLIENT_ID && CLIENT_SECRET && SITE_BASE); }

/* De redirect-URI die óók in de Google Cloud OAuth-client geregistreerd moet staan. */
function redirectUri(){ return SITE_BASE.replace(/\/$/, '') + '/api/gsc-callback'; }

/* Admin-terugkeer-URL (hash-router: #analyse?gsc=<status>). */
function adminReturnUrl(status){
  return SITE_BASE.replace(/\/$/, '') + '/admin-panel/pages/admin.html#analyse?gsc=' + encodeURIComponent(status||'connected');
}

/* ── AES-256-GCM: token-opslag (formaat iv:ct:tag, elk base64) ── */
function aesKey(){ return crypto.createHash('sha256').update(String(KEY_SECRET)).digest(); }
function encrypt(plain){
  if (plain == null || plain === '') return null;
  const iv = crypto.randomBytes(12);
  const c  = crypto.createCipheriv('aes-256-gcm', aesKey(), iv);
  const ct = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  return iv.toString('base64') + ':' + ct.toString('base64') + ':' + c.getAuthTag().toString('base64');
}
function decrypt(blob){
  if (!blob) return null;
  try {
    const parts = String(blob).split(':');
    if (parts.length !== 3) return null;
    const d = crypto.createDecipheriv('aes-256-gcm', aesKey(), Buffer.from(parts[0], 'base64'));
    d.setAuthTag(Buffer.from(parts[2], 'base64'));
    return Buffer.concat([d.update(Buffer.from(parts[1], 'base64')), d.final()]).toString('utf8');
  } catch (e) { return null; }
}

/* ── Signed state (CSRF-bescherming op de callback) ── */
function signState(payload){
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac  = crypto.createHmac('sha256', String(KEY_SECRET)).update(data).digest('base64url');
  return data + '.' + mac;
}
function verifyState(token){
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const data = token.slice(0, dot), mac = token.slice(dot + 1);
  const exp  = crypto.createHmac('sha256', String(KEY_SECRET)).update(data).digest('base64url');
  let ok = false;
  try { const a = Buffer.from(mac), b = Buffer.from(exp); ok = a.length === b.length && crypto.timingSafeEqual(a, b); } catch (e) { ok = false; }
  if (!ok) return null;
  try { const p = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')); if (p.exp && Date.now() > p.exp) return null; return p; } catch (e) { return null; }
}

/* ── OAuth-consent-URL ── */
function authUrl(state){
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',      // → refresh_token
    prompt: 'consent',           // forceer refresh_token, ook bij her-consent
    include_granted_scopes: 'true',
    state: state
  });
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + p.toString();
}

/* ── code → tokens ── */
async function exchangeCode(code){
  const body = new URLSearchParams({
    code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
    redirect_uri: redirectUri(), grant_type: 'authorization_code'
  });
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
  });
  if (!r.ok) throw new Error('token exchange failed: ' + r.status);
  return r.json(); // { access_token, refresh_token, expires_in, scope, token_type }
}

/* ── refresh_token → nieuw access_token ── */
async function refreshAccessToken(refreshToken){
  const body = new URLSearchParams({
    refresh_token: refreshToken, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'refresh_token'
  });
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
  });
  if (!r.ok) throw new Error('token refresh failed: ' + r.status);
  return r.json(); // { access_token, expires_in, scope, token_type }
}

/* ── Geverifieerde properties (sites.list) ── */
async function listSites(accessToken){
  const r = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: 'Bearer ' + accessToken }
  });
  if (!r.ok) throw new Error('sites.list failed: ' + r.status);
  const j = await r.json();
  return (j.siteEntry || []).map(function(s){ return { url: s.siteUrl, level: s.permissionLevel }; });
}

/* ── searchAnalytics.query ── */
async function queryAnalytics(accessToken, siteUrl, params){
  const r = await fetch('https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(siteUrl) + '/searchAnalytics/query', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!r.ok) throw new Error('searchAnalytics.query failed: ' + r.status);
  return r.json();
}

module.exports = {
  isConfigured, redirectUri, adminReturnUrl,
  encrypt, decrypt, signState, verifyState,
  authUrl, exchangeCode, refreshAccessToken, listSites, queryAnalytics, SCOPE
};
