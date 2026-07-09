/* ═══════════════════════════════════════════════════════════════════
   admin-gsc.js — Google Search Console koppeling (HMAC-beveiligd).
   Elke ingelogde rol mag lezen; disconnect vereist geen extra rang
   (koppeling is site-breed, geen persoonsdata).
   ───────────────────────────────────────────────────────────────────
   Acties (body.action):
     status       → { configured, connected, siteUrl, connectedAt, connectedBy }
     auth-url     → { url }               (start OAuth-consent, signed state)
     sites        → { sites:[{url,level}], siteUrl }
     select-site  → { siteUrl }           (kies actieve property)
     data         → { totals, queries[], pages[], byDate[], range }
     disconnect   → { connected:false }
   Inert-safe: 503 zonder DB; { configured:false } zonder OAuth-app.
═══════════════════════════════════════════════════════════════════ */
'use strict';
const store = require('./_lib/supabase.js');
const gsc = require('./_lib/gsc.js');
const { requireAuth } = require('./_lib/auth.js');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function res(statusCode, body){
  return { statusCode, headers:{ 'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS' }, body: JSON.stringify(body) };
}

/* Geef een geldig access-token terug; ververs + bewaar bij verval. */
async function freshToken(conn){
  const now = Date.now();
  const exp = conn.token_expiry ? new Date(conn.token_expiry).getTime() : 0;
  const access = gsc.decrypt(conn.access_token);
  if (access && exp - now > 60000) return access;           // nog > 1 min geldig
  const refresh = gsc.decrypt(conn.refresh_token);
  if (!refresh) throw new Error('no-refresh-token');
  const t = await gsc.refreshAccessToken(refresh);
  const newExpiry = new Date(now + (t.expires_in || 3600) * 1000).toISOString();
  await store.setGscConnection({ access_token: gsc.encrypt(t.access_token), token_expiry: newExpiry });
  return t.access_token;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res(204, {});
  if (event.httpMethod !== 'POST') return res(405, { error:'method' });

  const auth = requireAuth(event);                 // elke ingelogde rol
  if (!auth.ok) return res(auth.status, { error: auth.error });
  if (!store.isConfigured()) return res(503, { error:'db-not-configured' });

  let body = {}; try { body = JSON.parse(event.body || '{}'); } catch (e) {}
  const action = body.action || 'status';

  /* Geen OAuth-app ingesteld → frontend toont "niet ingesteld". */
  if (!gsc.isConfigured()) return res(200, { configured:false, connected:false });

  try {
    if (action === 'auth-url'){
      const state = gsc.signState({ email: auth.claims.email, exp: Date.now() + 15*60*1000 });
      return res(200, { configured:true, url: gsc.authUrl(state) });
    }

    const conn = await store.getGscConnection();
    const connected = !!(conn && conn.refresh_token);

    if (action === 'status'){
      return res(200, { configured:true, connected, siteUrl: conn ? conn.site_url : null, connectedAt: conn ? conn.connected_at : null, connectedBy: conn ? conn.connected_by : null });
    }
    if (action === 'disconnect'){
      await store.clearGscConnection();
      return res(200, { configured:true, connected:false });
    }
    if (!connected) return res(200, { configured:true, connected:false });

    if (action === 'sites'){
      const token = await freshToken(conn);
      return res(200, { configured:true, connected:true, sites: await gsc.listSites(token), siteUrl: conn.site_url });
    }
    if (action === 'select-site'){
      const url = String(body.siteUrl || '');
      if (!url) return res(400, { error:'no-site' });
      await store.setGscConnection({ site_url: url });
      return res(200, { configured:true, connected:true, siteUrl: url });
    }
    if (action === 'data'){
      if (!conn.site_url) return res(200, { configured:true, connected:true, siteUrl:null, needsSite:true });
      const token = await freshToken(conn);
      const days = Math.max(1, Math.min(480, parseInt(body.days, 10) || 28));
      const offsetDays = Math.max(0, parseInt(body.offsetDays, 10) || 0);
      const end = new Date(Date.now() - offsetDays * 86400000);
      const start = new Date(end.getTime() - (days - 1) * 86400000);
      const fmt = (d) => d.toISOString().slice(0, 10);
      const range = { startDate: fmt(start), endDate: fmt(end) };
      const [byQuery, byPage, totals, byDate] = await Promise.all([
        gsc.queryAnalytics(token, conn.site_url, Object.assign({ dimensions:['query'], rowLimit:25 }, range)),
        gsc.queryAnalytics(token, conn.site_url, Object.assign({ dimensions:['page'],  rowLimit:15 }, range)),
        gsc.queryAnalytics(token, conn.site_url, Object.assign({ dimensions:[],         rowLimit:1  }, range)),
        gsc.queryAnalytics(token, conn.site_url, Object.assign({ dimensions:['date'],   rowLimit:480 }, range))
      ]);
      const mapRow = (r) => ({ key:r.keys[0], clicks:r.clicks, impressions:r.impressions, ctr:r.ctr, position:r.position });
      return res(200, {
        configured:true, connected:true, siteUrl: conn.site_url, range,
        totals: (totals.rows && totals.rows[0]) ? totals.rows[0] : { clicks:0, impressions:0, ctr:0, position:0 },
        queries: (byQuery.rows || []).map(mapRow),
        pages:   (byPage.rows  || []).map(mapRow),
        byDate:  (byDate.rows  || []).map(function(r){ return { date:r.keys[0], clicks:r.clicks, impressions:r.impressions }; })
      });
    }
    return res(400, { error:'unknown-action' });
  } catch (e) {
    /* Fout bij verversen/ophalen → koppeling blijft bekend, frontend toont melding. */
    return res(200, { configured:true, error: String(e.message || e) });
  }
};
