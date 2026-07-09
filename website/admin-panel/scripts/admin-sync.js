/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — admin-sync.js  ·  FASE 2 · STAP 3 (staatslaag)
   ───────────────────────────────────────────────────────────────────
   De data-service-naad tussen de admin en Supabase. Doet TWEE dingen:

   1) SOURCE-besef — bepaalt of de admin op LIVE (Supabase bereikbaar) of
      LOKALE (localStorage) data draait, zet een body-class + een eerlijke
      status-badge in de sidebar (consistent met de stap 1-eerlijkheid).

   2) WRITE-THROUGH seam — één plek waar mutaties naar de HMAC-functies gaan.
      Optimistic: de aanroeper schrijft eerst lokaal (AdminData.save) en roept
      dan MontisoroSync.write() aan. Zonder sessie/Supabase → resolve({ok:false})
      en de lokale staat blijft staan. Géén big-bang: domeinen migreren één
      voor één naar deze seam (leads = beta).

   INERT-SAFE: zonder sessie of zonder Supabase blijft alles op localStorage —
   exact het huidige gedrag. Laadt NA admin-data.js (window.AdminData).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function sess() { try { return JSON.parse(sessionStorage.getItem('admin.session') || '{}'); } catch (e) { return {}; } }
  function lang() { try { return (window.MONTISORO_ADMIN_I18N && window.MONTISORO_ADMIN_I18N.getLang()) || 'nl'; } catch (e) { return 'nl'; } }
  function TT(nl, en) { return lang() === 'en' ? en : nl; }

  function setSource(src) {
    src = (src === 'live') ? 'live' : 'local';
    window.MONTISORO_DATA_SOURCE = src;
    if (window.AdminData && window.AdminData.setSource) window.AdminData.setSource(src);
    try {
      document.body.classList.toggle('data-source-live', src === 'live');
      document.body.classList.toggle('data-source-local', src !== 'live');
    } catch (e) {}
    renderBadge(src);
    refreshSyncBanners(src === 'live');
  }

  // STAP 5: maak de preview-banners eerlijk per bron (live = gekoppeld, met rollback).
  function refreshSyncBanners(live) {
    var key = live ? 'sync_live' : 'sync_preview';
    try {
      document.querySelectorAll('.sync-banner p[data-i18n-html]').forEach(function (p) { p.setAttribute('data-i18n-html', key); });
      if (window.MONTISORO_ADMIN_I18N) window.MONTISORO_ADMIN_I18N.apply(document);
    } catch (e) {}
  }

  // Eerlijke status-badge onderaan de sidebar.
  function renderBadge(src) {
    var foot = document.querySelector('.sidebar-foot');
    if (!foot) return;
    var el = document.getElementById('data-source-badge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'data-source-badge';
      el.style.cssText = 'margin:10px 12px 0;padding:7px 10px;border-radius:8px;font-size:11px;font-weight:500;display:flex;align-items:center;gap:7px;line-height:1.35;';
      foot.appendChild(el);
    }
    var live = src === 'live';
    el.style.background = live ? 'rgba(79,164,122,.12)' : 'rgba(214,162,58,.12)';
    el.style.color = live ? '#9fd4b8' : '#e8cd92';
    el.style.border = '1px solid ' + (live ? 'rgba(79,164,122,.30)' : 'rgba(214,162,58,.30)');
    el.title = live
      ? TT('Data komt live uit Supabase en is gedeeld over apparaten.', 'Data is live from Supabase and shared across devices.')
      : TT('Data staat lokaal in deze browser. Niet gedeeld, nog niet live.', 'Data is local to this browser. Not shared, not live yet.');
    el.innerHTML =
      '<span class="a-status-dot ' + (live ? 'is-live' : 'is-idle') + '"></span>' +
      '<span>' + (live ? TT('Live · Supabase', 'Live · Supabase') : TT('Lokaal · preview', 'Local · preview')) + '</span>';
  }

  /* write(path, payload) — write-through naar een HMAC-endpoint.
     Resolve {ok:true,...} bij 200+ok; anders {ok:false,reason}. Werpt nooit. */
  function write(path, payload) {
    var s = sess();
    if (!s || !s.token) return Promise.resolve({ ok: false, reason: 'no-session' });
    return fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ token: s.token }, payload || {}))
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.status === 200 && d && d.ok, status: r.status, data: d }; }); })
      .catch(function () { return { ok: false, reason: 'network' }; });
  }

  window.MontisoroSync = { write: write, setSource: setSource, source: function () { return window.MONTISORO_DATA_SOURCE || 'local'; } };

  function init() {
    setSource('local'); // eerlijke default tot live bewezen is
    var s = sess();
    if (!s || !s.token) return;            // inert: blijft lokaal
    // Probe het echte fundament; live ALLEEN als Supabase bereikbaar is.
    fetch('/api/health', { method: 'GET' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (h) { if (h && h.services && h.services.supabase && h.services.supabase.ok) setSource('live'); })
      .catch(function () { /* health onbereikbaar → blijf lokaal */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
