/* ═══════════════════════════════════════════════════════════════════
   gsc-callback.js — OAuth 2.0 redirect-doel voor Google Search Console.
   PUBLIEK endpoint (Google stuurt de browser hierheen met ?code&state).
   Geen HMAC-body-auth mogelijk (het is een browser-redirect) → in de plaats
   verifiëren we de ONDERTEKENDE state (CSRF-bescherming, 15 min geldig).
   ───────────────────────────────────────────────────────────────────
   Flow: verifieer state → wissel code voor tokens → versleutel + bewaar in
   gsc_connection → auto-selecteer property bij één site → redirect terug
   naar het dashboard (#analyse?gsc=<status>).
═══════════════════════════════════════════════════════════════════ */
'use strict';
const store = require('./_lib/supabase.js');
const gsc = require('./_lib/gsc.js');

function redirect(status){
  return { statusCode:302, headers:{ Location: gsc.adminReturnUrl(status), 'Cache-Control':'no-store' }, body:'' };
}

exports.handler = async (event) => {
  const qs = event.queryStringParameters || {};
  if (qs.error)            return redirect('denied');       // gebruiker weigerde toestemming
  if (!qs.code || !qs.state) return redirect('error');
  if (!gsc.verifyState(qs.state)) return redirect('badstate');
  if (!gsc.isConfigured() || !store.isConfigured()) return redirect('error');

  const claims = gsc.verifyState(qs.state);
  try {
    const t = await gsc.exchangeCode(qs.code);
    const patch = {
      access_token: gsc.encrypt(t.access_token),
      scope: t.scope || gsc.SCOPE,
      token_expiry: new Date(Date.now() + (t.expires_in || 3600) * 1000).toISOString(),
      connected_by: (claims && claims.email) || null,
      connected_at: new Date().toISOString()
    };
    /* refresh_token komt (met prompt=consent) mee; behoud bestaande indien afwezig. */
    if (t.refresh_token) patch.refresh_token = gsc.encrypt(t.refresh_token);
    await store.setGscConnection(patch);

    /* Eén geverifieerde property? → meteen als actief instellen. */
    try {
      const sites = await gsc.listSites(t.access_token);
      if (sites.length === 1) await store.setGscConnection({ site_url: sites[0].url });
    } catch (e) { /* niet fataal */ }

    return redirect('connected');
  } catch (e) {
    return redirect('error');
  }
};
