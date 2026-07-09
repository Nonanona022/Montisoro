'use strict';
/* track.js — cookieloze pageview-beacon. Geen PII (geen IP opgeslagen),
   geen cookies. Inert-safe: zonder Supabase gewoon 204. */
const sb = require('./_lib/supabase');
const rl = require('./_lib/rateLimit');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };
  if (!sb.isConfigured()) return { statusCode: 204, body: '' };
  const ip = rl.clientIp(event);
  const r = rl.hit('track:' + ip, 30, 10000);
  if (!r.ok) return { statusCode: 429, headers: { 'Retry-After': String(r.retryAfter) }, body: '' };
  let b = {};
  try { b = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: '' }; }
  const clip = (v, n) => (typeof v === 'string' && v ? v.slice(0, n) : null);
  const path = clip(b.p, 256);
  if (!path) return { statusCode: 400, body: '' };
  const rec = {
    path: path,
    referrer: clip(b.r, 256),
    lang: clip(b.l, 8),
    device: clip(b.d, 16),
    screen_w: (typeof b.w === 'number' && b.w > 0 && b.w < 10000) ? Math.round(b.w) : null
  };
  try { await sb.insertPageView(rec); } catch (e) { return { statusCode: 204, body: '' }; }
  return { statusCode: 204, body: '' };
};
