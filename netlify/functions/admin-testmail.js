/* ═══════════════════════════════════════════════════════════════════
   admin-testmail.js — Netlify Function (POST)  ·  FIX 5
   ───────────────────────────────────────────────────────────────────
   Sends a test email of the requested type so the admin can verify
   the email template + Resend delivery without needing a real lead.
   HMAC-protected (admin role only). Endpoint: /api/admin-testmail
═══════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');
const mailer = require('./_lib/mailer.js');

const SECRET         = process.env.ADMIN_SESSION_SECRET || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const ALLOWED_TYPES  = ['calculator_internal', 'contact_confirm', 'fitcheck_confirm', 'booking_confirm'];

function res(sc, body) {
  return { statusCode: sc, headers: { 'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS' }, body: JSON.stringify(body) };
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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res(200, {});
  if (event.httpMethod !== 'POST') return res(405, { error: 'method_not_allowed' });
  if (!SECRET) return res(503, { error: 'auth_not_configured' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch(e) { return res(400, { error: 'bad_json' }); }

  const payload = verify(body.token);
  if (!payload) return res(401, { error: 'unauthorized' });
  if (!['admin'].includes(payload.role || '')) return res(403, { error: 'admin_only' });

  const type = body.type;
  const to   = body.to || payload.email;
  const lang = body.lang || 'nl';

  if (!ALLOWED_TYPES.includes(type)) return res(400, { error: 'invalid_type', allowed: ALLOWED_TYPES });

  const TEST_META = { name: 'Test Gebruiker', email: to };
  const TEST_BOOKING = { type: 'online', date: 'maandag 1 juli 2026', time: '14:00', endTime: '14:30', location: 'Online via Teams' };

  try {
    if (type === 'contact_confirm') {
      await mailer.sendCustomerConfirm({ lang, type: 'contact', meta: TEST_META });
    } else if (type === 'fitcheck_confirm') {
      await mailer.sendCustomerConfirm({ lang, type: 'fitcheck', meta: TEST_META });
    } else if (type === 'booking_confirm') {
      await mailer.sendBookingConfirm({ lang, meta: TEST_META, booking: TEST_BOOKING });
    } else if (type === 'calculator_internal') {
      await mailer.sendFormNotify({
        lang: 'nl',
        subject: '[TEST] ROI rapport aangevraagd',
        title: 'Test: ROI rapport aangevraagd',
        intro: 'Dit is een testmail van het admin-panel.',
        rows: [
          { label: 'Naam', value: 'Test Gebruiker' },
          { label: 'E-mail', value: to },
          { label: 'Organisatie', value: 'Test Corp' },
          { label: 'Verzuimkost', value: '€280.000' }
        ],
        replyTo: to
      });
    }
    return res(200, { ok: true, type, to, lang, sent_at: new Date().toISOString() });
  } catch(e) {
    return res(500, { error: 'send_failed', detail: e.message });
  }
};
