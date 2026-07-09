/* ═══════════════════════════════════════════════════════════════════
   health.js — Netlify Function (GET)
   ───────────────────────────────────────────────────────────────────
   Public health endpoint — safe for uptime monitors (no secrets exposed).
   Returns a JSON report of every configured service so ops/monitoring
   tools know exactly which integrations are live vs inert.

   Response shape:
   {
     ok: true | false,          // false = at least one CRITICAL service down
     ts: "ISO timestamp",
     services: {
       supabase:  { ok, configured, latency_ms? },
       resend:    { ok, configured },
       graph:     { ok, configured },
       site:      { ok }
     }
   }

   Endpoint: /api/health  (alias in netlify.toml)
   Cache: no-store (uptime monitors need fresh data every call)
═══════════════════════════════════════════════════════════════════ */
'use strict';
const store = require('./_lib/supabase.js');

const RESEND_CONFIGURED = !!(process.env.RESEND_API_KEY);
const GRAPH_CONFIGURED  = !!(
  process.env.MS_TENANT_ID &&
  process.env.MS_CLIENT_ID &&
  process.env.MS_CLIENT_SECRET
);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function res(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res(204, {});
  if (event.httpMethod !== 'GET') return res(405, { ok: false, error: 'method_not_allowed' });

  const ts = new Date().toISOString();
  const services = {};

  /* ── Supabase ── */
  if (!store.isConfigured()) {
    services.supabase = { ok: false, configured: false, note: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing' };
  } else {
    const t0 = Date.now();
    try {
      /* Lightweight ping: count rows in site_content (tiny table) */
      await store.getSiteContent();
      services.supabase = { ok: true, configured: true, latency_ms: Date.now() - t0 };
    } catch (e) {
      services.supabase = { ok: false, configured: true, latency_ms: Date.now() - t0, error: e.message };
    }
  }

  /* ── Resend ── */
  services.resend = {
    ok: RESEND_CONFIGURED,
    configured: RESEND_CONFIGURED,
    note: RESEND_CONFIGURED ? 'API key present' : 'RESEND_API_KEY missing — email delivery inert'
  };

  /* ── Microsoft Graph ── */
  services.graph = {
    ok: GRAPH_CONFIGURED,
    configured: GRAPH_CONFIGURED,
    note: GRAPH_CONFIGURED
      ? 'Tenant/client/secret present'
      : 'MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET missing — calendar inert'
  };

  /* ── Site (static, always ok if function runs) ── */
  services.site = { ok: true, note: 'Static site served by Netlify CDN' };

  /* ── Admin-auth env (alleen aanwezigheid — NOOIT de waarden) ── */
  const AUTH_OK = !!(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
  services.auth = {
    ok: AUTH_OK,
    admin_password_set: !!process.env.ADMIN_PASSWORD,
    session_secret_set: !!process.env.ADMIN_SESSION_SECRET,
    note: AUTH_OK
      ? 'ADMIN_PASSWORD + ADMIN_SESSION_SECRET aanwezig'
      : 'ADMIN_PASSWORD of ADMIN_SESSION_SECRET ontbreekt — admin-login geeft 503'
  };

  /* Overall: critical = Supabase (leads lost without it). Resend + Graph = degraded, not down. */
  const criticalOk = services.supabase.ok;
  const degraded   = !services.resend.ok || !services.graph.ok;

  const statusCode = criticalOk ? (degraded ? 200 : 200) : 503;
  return res(statusCode, {
    ok: criticalOk,
    degraded,
    ts,
    services,
    summary: criticalOk
      ? (degraded ? 'Degraded — email/calendar inert (K1 keys missing)' : 'All systems operational')
      : 'Critical — Supabase unreachable, leads at risk'
  });
};
