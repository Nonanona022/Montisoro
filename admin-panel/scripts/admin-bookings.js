/* ═══════════════════════════════════════════════════════════════════
   admin-bookings.js — Agenda-scherm
   Toont alle afspraken die via de website geboekt zijn (form_submissions
   type='booking'), met een duidelijk label Online (Teams) / Ter plaatse.
   Read-only overzicht; data komt uit DATA.submissions.booking (live bridge).
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  if (window.__bookingsLoaded) return;
  window.__bookingsLoaded = true;

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function row(label, val){
    if (!val) return '';
    return '<div class="bk-row">'+
      '<span class="bk-key">'+esc(label)+'</span>'+
      '<span class="bk-val">'+esc(val)+'</span></div>';
  }

  window.init_bookings = function () {
    var host = document.getElementById('bookings-body');
    if (!host) return;
    var DATA = window.DATA || {};
    var subs = (DATA.submissions && DATA.submissions.booking) || [];
    var list = subs.slice().sort(function (a, b) { return String(b.ts || '').localeCompare(String(a.ts || '')); });

    if (!list.length) {
      host.innerHTML = '<div class="panel"><div class="panel-body bk-empty">'+
        '<i class="ti ti-calendar bk-empty-ico"></i>'+
        '' + mtT('bk_empty_appointments') + '</div></div>';
      return;
    }

    host.innerHTML = list.map(function (b) {
      var f = b.fields || {};
      var t = (f.afspraaktype || '').toLowerCase();
      var onsite = t === 'onsite' || /plaatse|locatie|adres/i.test(f.afspraaktype_label || '');
      var badge = onsite
        ? '<span class="bk-badge-o"><i class="ti ti-map-pin"></i> ' + mtT('bk_onsite') + '</span>'
        : '<span class="bk-badge-g"><i class="ti ti-video"></i> ' + mtT('bk_online_teams') + '</span>';
      var tijd = f.tijdstip ? (f.tijdstip + (f.eindtijd ? ' – ' + f.eindtijd : '')) : '';
      var naam = b.name || f.name || '';
      var datum = f.datum || '';
      return '<div class="panel u-mb-14"><div class="panel-body a-pad2022">'+
        '<div class="bk-cardhead">'+
          '<div>'+
            '<div class="bk-title">'+esc(datum || '—')+(tijd?' · '+esc(tijd):'')+'</div>'+
            '<div class="bk-sub">'+esc(naam || b.email || '—')+'</div>'+
          '</div>'+
          badge+
        '</div>'+
        '<div class="bk-foot">'+
          row('E-mail', b.email || f.email)+
          row('Telefoon', f.telefoon || f.phone)+
          row('Organisatie', b.company || f.organisatie)+
          row(onsite ? 'Adres' : 'Locatie', onsite ? (f.adres || f.locatie) : (f.locatie || 'Microsoft Teams'))+
          row('Bericht', f.bericht || f.message)+
          row('Aangevraagd', b.ts)+
        '</div>'+
      '</div></div>';
    }).join('');
  };
})();
