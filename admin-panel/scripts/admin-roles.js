/* ═══════════════════════════════════════════════════════════════════
   admin-roles.js — 4-rollenmodel + capability-gating  (STAP 6)
   ───────────────────────────────────────────────────────────────────
   Rollen:
     admin       — volledige toegang
     consultant  — operationeel (leads, formulieren, agenda, onboarding,
                   content) bewerken; parameters/instellingen alleen-lezen
     sales       — alleen lezen (+ leads bijwerken)
     viewer      — alleen lezen

   ⚠️  Dit is CLIENT-SIDE demo-afscherming. Echte afdwinging moet
   server-side (zie /admin-panel/api/README.md). De UI-gating voorkomt
   per ongeluk wijzigen; ze is geen beveiliging.

   Formules blijven in code. Beheerbaar (door Admin): benchmarks,
   parameters, drempels — via "Calculator-parameters".
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  if (window.AdminRoles) return;

  // Demo-toewijzing per gebruiker (productie: uit IdP / backend).
  var ROLE_BY_EMAIL = {
    'laurence@montisoro.com': 'admin',
    'jeroen@montisoro.com':   'consultant',
    'glenn@montisoro.com':    'sales',
    'reza@montisoro.com':     'viewer'
  };
  var LABELS = { admin: 'Admin', consultant: 'Consultant', sales: 'Sales', viewer: 'Viewer' };

  // Capability-matrix. 'all' = alles. Anders expliciete caps "view:action".
  var CAPS = {
    admin:      { all: true },
    consultant: { 'leads:edit': 1, 'forms:edit': 1, 'agenda:edit': 1, 'onboarding:edit': 1, 'content:edit': 1, 'gdpr:edit': 1 },
    sales:      { 'leads:edit': 1 },
    viewer:     {}
  };

  function session() {
    try { return JSON.parse(sessionStorage.getItem('admin.session') || '{}'); }
    catch (e) { return {}; }
  }
  function role() {
    var s = session();
    var r = s.role || ROLE_BY_EMAIL[(s.email || '').toLowerCase()];
    return (r && LABELS[r]) ? r : 'viewer';
  }
  function can(cap) { var c = CAPS[role()] || {}; return !!(c.all || c[cap]); }
  function label() { return LABELS[role()] || 'Viewer'; }

  // Alleen-lezen melding (HTML string) voor bovenaan een afgeschermd scherm.
  function readonlyBanner(msg) {
    return '<div class="ro-banner">' +
      '<i class="ti ti-lock"></i>' +
      '<span>' + (msg || mtT('ro_readonly')) +
      ' <b>' + mtT('ro_current_role') + label() + '</b></span></div>';
  }

  // Schakel alle bedien-elementen in een container uit; verberg de opgegeven action-ids.
  function lockContainer(container, hideIds) {
    if (!container) return;
    hideIds = hideIds || [];
    Array.prototype.forEach.call(container.querySelectorAll('input,select,textarea,button'), function (el) {
      if (hideIds.indexOf(el.id) >= 0) { el.style.display = 'none'; return; }
      el.disabled = true;
      el.style.cursor = 'not-allowed';
      el.style.opacity = '0.7';
    });
    hideIds.forEach(function (id) { var b = document.getElementById(id); if (b) b.style.display = 'none'; });
  }

  // Toon de rol in de topbar zodra de DOM klaar is.
  function paintRole() {
    var el = document.getElementById('user-role');
    if (el) el.textContent = label();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', paintRole);
  } else { paintRole(); }

  window.AdminRoles = {
    role: role, can: can, label: label,
    readonlyBanner: readonlyBanner, lockContainer: lockContainer,
    LABELS: LABELS, ROLE_BY_EMAIL: ROLE_BY_EMAIL
  };
  // back-compat: hang ook aan window.A wanneer aanwezig
  if (window.A) { window.A.role = role; window.A.can = can; window.A.roleLabel = label; }
})();
