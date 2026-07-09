/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — Global config
   ───────────────────────────────────────────────────────────────────
   Web3Forms verwijderd (formulieren lopen via de Netlify-backend).
═══════════════════════════════════════════════════════════════════ */

// Public site URL — gebruikt voor legal-links, About-preview, "terug naar de site".
window.SITE_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? '../../website/pages'
  : 'https://montisoro.com/pages';

// ── Auth: demo/dev-inlog-fallback ───────────────────────────────────────────
// Het hardgecodeerde demo-wachtwoord mag UITSLUITEND werken op een lokale
// loopback-machine (echte ontwikkeling). Loopback (localhost/127.0.0.1/::1) is
// niet publiek bereikbaar → onbereikbaar voor aanvallers. Previews, staging en
// productie draaien op PUBLIEKE hosts → daar is dit false en telt enkel de
// server-side /api/admin-auth. Zet dit NOOIT hard op true voor een publiek
// bereikbare host (dat heropent het gat uit pre-launch-audit P1).
window.ADMIN_DEV_LOGIN = (
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.hostname === '[::1]' ||
  location.hostname === '::1' ||
  location.hostname === ''
);

// Build-label (audit P30) — één bron voor het versienummer in de zijbalk-voet.
window.ADMIN_BUILD = 'v1.1 · build 2026.07';
