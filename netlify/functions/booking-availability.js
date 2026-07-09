/* ═══════════════════════════════════════════════════════════════════
   booking-availability.js — Netlify Function (POST)
   Geeft de boekbare tijdslots voor één dag + type terug, met vrij/bezet
   uit de Outlook-agenda (via Microsoft Graph).

   Body: { type:'online'|'onsite', date:'YYYY-M-D' }
   Antwoord:
     { configured:true,  slots:[ {t:'13:00', busy:false}, ... ] }   (Graph live)
     { configured:false, slots:[ {t:'13:00', busy:false}, ... ] }   (inert → de
       site gebruikt dan zijn eigen gesimuleerde bezetting als terugval)

   Endpoint: /api/booking-availability  (alias) of /.netlify/functions/booking-availability

   ⚠️ Het vaste weekschema staat (voorlopig) hier én in de frontend hardcoded
   (contact.html / contact-en.html, var TEMPLATES). Later samen te voegen tot
   één instelbaar schema vanuit het admin-dashboard (gebruiker-wens).
═══════════════════════════════════════════════════════════════════ */
'use strict';
const graph = require('./_lib/graph.js');
const store = require('./_lib/supabase.js');
const rl = require('./_lib/rateLimit.js');

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

/* getDay(): zo=0..za=6 — kan overschreven worden via admin booking_schedule */
const DEFAULT_TEMPLATES = {
  onsite: { 2: ['9:30'], 4: ['13:00'] },
  online: { 1: ['13:00', '14:00', '15:00', '16:00'], 3: ['11:00', '12:00', '13:00'], 5: ['11:00', '12:00', '13:00'] }
};
/* Cached schedule (inert-safe — falls back to DEFAULT_TEMPLATES) */
let _scheduleCache = null; let _scheduleCacheTs = 0;
async function getSchedule() {
  if (!store.isConfigured()) return DEFAULT_TEMPLATES;
  if (_scheduleCache && Date.now() - _scheduleCacheTs < 5 * 60 * 1000) return _scheduleCache;
  try {
    const content = await store.getSiteContent();
    if (content && content.booking_schedule) {
      _scheduleCache = content.booking_schedule;
      _scheduleCacheTs = Date.now();
      return _scheduleCache;
    }
  } catch (e) { /* fall through */ }
  return DEFAULT_TEMPLATES;
}

// Keep TEMPLATES for backward-compat (non-async fallback path)
const TEMPLATES = DEFAULT_TEMPLATES;

function res(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res(204, {});
  if (event.httpMethod !== 'POST') return res(405, { error: 'method_not_allowed' });

  const rlHit = rl.hit('avail:' + rl.clientIp(event), 60, 60 * 1000);
  if (!rlHit.ok) return res(429, { error: 'rate_limited' });

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch (e) { return res(400, { error: 'bad_json' }); }

  const type = payload.type === 'onsite' ? 'onsite' : 'online';
  const date = String(payload.date || '');
  if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) return res(400, { error: 'bad_date' });

  const p = date.split('-').map(Number);
  const weekday = new Date(p[0], p[1] - 1, p[2]).getDay();
  const schedule = await getSchedule();
  const slotTimes = (schedule[type] || {})[weekday] || [];

  // Inert: geen sleutels → laat de frontend zijn eigen (gesimuleerde) bezetting tonen
  if (!graph.isConfigured()) {
    return res(200, { configured: false, slots: slotTimes.map((t) => ({ t, busy: false })) });
  }

  try {
    const busy = await graph.busyFor(date, slotTimes);
    return res(200, { configured: true, slots: slotTimes.map((t) => ({ t, busy: busy.has(t) })) });
  } catch (e) {
    console.error('[booking-availability] graph failed:', e.message);
    // Graph faalt (bv. admin-consent nog niet verleend) → NIET alles blokkeren.
    // Terugval naar de gewone beschikbaarheid zodat boeken mogelijk blijft;
    // zodra de Outlook-koppeling echt werkt, neemt de live free/busy het over.
    return res(200, { configured: false, error: 'graph_unavailable', slots: slotTimes.map((t) => ({ t, busy: false })) });
  }
};
