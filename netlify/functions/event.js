'use strict';
/* ═══════════════════════════════════════════════════════════════════
   event.js — cookieloze event-ingest (Analyse-module, Optie A).
   ───────────────────────────────────────────────────────────────────
   • Géén cookie, géén IP opgeslagen, géén fingerprint. Inert-safe: zonder
     Supabase gewoon 204.
   • visitor_hash = HMAC(dagelijkse-salt, ip+ua) → dagelijks roterend,
     onomkeerbaar; het ruwe IP wordt NOOIT weggeschreven, enkel de hash.
     Zo tellen we "unieke bezoekers per dag" zonder de bezoeker te volgen.
   • browser + land worden server-side grof afgeleid (UA + edge-geo).
   Endpoint: /api/event
═══════════════════════════════════════════════════════════════════ */
const crypto = require('crypto');
const sb = require('./_lib/supabase');
const rl = require('./_lib/rateLimit');

const SALT_SECRET = process.env.ANALYTICS_SALT || process.env.ADMIN_SESSION_SECRET || 'montisoro-analytics';

/* Dagelijks roterende, onomkeerbare bezoeker-hash. IP wordt NIET opgeslagen. */
function visitorHash(ip, ua) {
  try {
    if (!ip) return null;
    const day = new Date().toISOString().slice(0, 10);              // YYYY-MM-DD (UTC)
    const dailySalt = crypto.createHmac('sha256', SALT_SECRET).update(day).digest('hex');
    return crypto.createHmac('sha256', dailySalt).update(String(ip) + '|' + String(ua || '')).digest('hex').slice(0, 32);
  } catch (e) { return null; }
}

/* Grove browserfamilie uit de user-agent (géén fingerprint). */
function browserOf(ua) {
  ua = ua || '';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return 'overige';
}

/* Land op land-niveau uit de Netlify edge-geo (géén IP-opslag). */
function countryOf(headers) {
  try {
    if (headers['x-country']) return String(headers['x-country']).slice(0, 2).toUpperCase();
    if (headers['x-nf-geo']) {
      const geo = JSON.parse(Buffer.from(headers['x-nf-geo'], 'base64').toString('utf8'));
      if (geo && geo.country && geo.country.code) return String(geo.country.code).slice(0, 2).toUpperCase();
    }
  } catch (e) {}
  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };
  if (!sb.isConfigured()) return { statusCode: 204, body: '' };

  const ip = rl.clientIp(event);
  const r = rl.hit('event:' + ip, 60, 10000);                       // ruimer dan track (meer events/sessie)
  if (!r.ok) return { statusCode: 429, headers: { 'Retry-After': String(r.retryAfter) }, body: '' };

  let b = {};
  try { b = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: '' }; }

  const clip = (v, n) => (typeof v === 'string' && v ? v.slice(0, n) : null);
  const name = clip(b.n, 48);
  if (!name) return { statusCode: 400, body: '' };

  const headers = event.headers || {};
  const ua = headers['user-agent'] || '';
  const meta = (b.meta && typeof b.meta === 'object') ? b.meta : {};
  const utm = (b.u && typeof b.u === 'object') ? b.u : {};

  // ── web_vital → aparte perf-tabel ──
  if (name === 'web_vital') {
    const rec = {
      path: clip(b.p, 256),
      metric: clip(meta.metric, 8) || 'NA',
      value: (typeof meta.value === 'number' && isFinite(meta.value)) ? meta.value : 0,
      rating: clip(meta.rating, 24),
      device: clip(b.d, 16)
    };
    try { await sb.insertWebVital(rec); } catch (e) {}
    return { statusCode: 204, body: '' };
  }

  // ── generiek event ──
  const rec = {
    session_id: clip(b.s, 40),
    visitor_hash: visitorHash(ip, ua),
    name: name,
    path: clip(b.p, 256),
    referrer: clip(b.r, 256),
    source: clip(utm.source, 80),
    medium: clip(utm.medium, 80),
    campaign: clip(utm.campaign, 80),
    lang: clip(b.l, 8),
    device: clip(b.d, 16),
    browser: browserOf(ua),
    country: countryOf(headers),
    meta: meta
  };
  try { await sb.insertEvent(rec); } catch (e) { return { statusCode: 204, body: '' }; }
  return { statusCode: 204, body: '' };
};
