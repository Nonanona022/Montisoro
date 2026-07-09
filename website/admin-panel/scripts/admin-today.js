/* ═══════════════════════════════════════════════════════════════════
   admin-today.js — FASE 2 · STAP 7 (schaal-UX)
   ───────────────────────────────────────────────────────────────────
   Een actiegerichte "Vandaag"-startpagina: wachtende taken i.p.v. enkel
   KPI-tegels. Volledig ADDITIEF — injecteert een nav-item + view en leest
   de bestaande AdminData; raakt geen enkele werkende view aan. Click-through
   navigeert naar de juiste context (Leads / Inbox).

   Volgt het injectie-patroon van admin-pro.js. NL + EN via een lokale i18n.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function esc(s) { var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; }
  function whenReady(fn) {
    if (window.AdminData && window.Admin && window.MONTISORO_ADMIN_I18N) fn();
    else setTimeout(function () { whenReady(fn); }, 60);
  }
  function lang() { try { return window.MONTISORO_ADMIN_I18N.getLang(); } catch (e) { return 'nl'; } }
  function TT(nl, en) { return lang() === 'en' ? en : nl; }

  whenReady(function () {
    if (window.__adminTodayInjected) return;
    window.__adminTodayInjected = true;

    // 1. nav-item onder Dashboard, direct na "Overzicht"
    var overviewNav = document.querySelector('.nav-item[data-view="overview"]');
    if (overviewNav && !document.querySelector('.nav-item[data-view="today"]')) {
      var nav = document.createElement('div');
      nav.className = 'nav-item';
      nav.setAttribute('data-view', 'today');
      nav.innerHTML = '<i class="ti ti-sunrise"></i><span class="label" data-today-label>' + esc(TT('Vandaag', 'Today')) + '</span><span class="badge" id="nav-badge-today" style="display:none;">0</span>';
      overviewNav.parentNode.insertBefore(nav, overviewNav.nextSibling);
      nav.addEventListener('click', function () { window.Admin.showView('today'); try { window.init_today(); } catch (e) {} });
    }

    // 2. view-sectie
    var main = document.querySelector('.main');
    if (main && !document.getElementById('view-today')) {
      var v = document.createElement('section');
      v.className = 'view';
      v.id = 'view-today';
      v.innerHTML =
        '<div class="page-head"><div>' +
          '<div class="eyebrow">' + esc(TT('Vandaag', 'Today')) + '</div>' +
          '<h1 data-today-h1></h1>' +
          '<p data-today-sub></p>' +
        '</div></div>' +
        '<div id="today-body"></div>';
      main.appendChild(v);
    }

    function stageLabel(s) {
      var m = { 'new': TT('Nieuw', 'New'), qualified: TT('Gekwalificeerd', 'Qualified'), diagnostic: TT('Diagnose', 'Diagnosis'), proposal: TT('Voorstel', 'Proposal'), won: TT('Gewonnen', 'Won'), cold: TT('Koud', 'Cold') };
      return m[s] || s || '';
    }

    function bucket(iconClass, title, items, count, goto, fmt) {
      var rows = items.length
        ? items.slice(0, 6).map(function (it) {
            return '<div class="td-task">' +
              '<i class="ti ti-circle-filled td-dot"></i><span>' + esc(fmt(it)) + '</span></div>';
          }).join('')
        : '<div class="td-note">' + esc(TT('Niets openstaand.', 'Nothing pending.')) + '</div>';
      return '<div class="panel td-card">' +
        '<div class="td-cardhead">' +
          '<h class="td-title"3>' +
            '<i class="' + iconClass + ' td-ico"></i>' + esc(title) +
            ' <span class="td-count">' + count + '</span></h3>' +
          (items.length ? '<button class="btn btn-ghost td-btn" data-goto="' + goto + '">' + esc(TT('Bekijk alle', 'View all')) + ' →</button>' : '') +
        '</div>' + rows +
      '</div>';
    }

    // 3. renderer
    window.init_today = function () {
      var D = window.AdminData.load();
      var leads = Array.isArray(D.leads) ? D.leads : [];
      var subs = D.submissions || {};
      var allSubs = [].concat(subs.calculator || [], subs.fitcheck || [], subs.contact || [], subs.casey || [], subs.booking || []);

      var newLeads = leads.filter(function (l) { return l.stage === 'new'; });
      var followLeads = leads.filter(function (l) { return l.stage === 'qualified' || l.stage === 'diagnostic' || l.stage === 'proposal'; });
      var recentSubs = allSubs.slice().sort(function (a, b) { return String(b.ts || '').localeCompare(String(a.ts || '')); }).slice(0, 6);

      var total = newLeads.length + followLeads.length;

      var h1 = document.querySelector('[data-today-h1]');
      var sub = document.querySelector('[data-today-sub]');
      if (h1) h1.innerHTML = TT('Wat wacht er <em>vandaag?</em>', 'What needs <em>you today?</em>');
      if (sub) sub.textContent = total
        ? TT(total + ' open acties — begin hier.', total + ' open actions — start here.')
        : TT('Niets dringends. Goed bezig.', 'Nothing urgent. Well done.');

      var badge = document.getElementById('nav-badge-today');
      if (badge) { if (total) { badge.textContent = total; badge.style.display = ''; } else { badge.style.display = 'none'; } }

      var body = document.getElementById('today-body');
      if (!body) return;
      body.innerHTML =
        bucket('ti ti-user-plus', TT('Nieuwe leads — te contacteren', 'New leads — to contact'), newLeads, newLeads.length, 'leads', function (l) { return (l.name || l.email || '—') + (l.org ? (' · ' + l.org) : ''); }) +
        bucket('ti ti-refresh', TT('In opvolging', 'In follow-up'), followLeads, followLeads.length, 'leads', function (l) { return (l.name || l.email || '—') + ' · ' + stageLabel(l.stage); }) +
        bucket('ti ti-inbox', TT('Recente aanvragen', 'Recent submissions'), recentSubs, allSubs.length, 'forms', function (s) { return (s.email || '—') + (s.ts ? (' · ' + s.ts) : ''); });

      body.querySelectorAll('[data-goto]').forEach(function (el) {
        el.addEventListener('click', function () { window.Admin.showView(el.getAttribute('data-goto')); });
      });
    };

    document.addEventListener('admin:langchange', function () {
      var v = document.getElementById('view-today');
      if (v && v.classList.contains('is-active')) { try { window.init_today(); } catch (e) {} }
      var lbl = document.querySelector('[data-today-label]');
      if (lbl) lbl.textContent = TT('Vandaag', 'Today');
    });

    // Initiele render → vult ook de nav-badge.
    try { window.init_today(); } catch (e) {}
  });
})();
