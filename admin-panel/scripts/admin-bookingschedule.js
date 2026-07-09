/* ═══════════════════════════════════════════════════════════════════
   admin-bookingschedule.js — Booking availability schedule editor
   Allows admin to set which days/times are bookable for online/onsite.
   Saves to localStorage, publishes to Supabase via publishToSite().
   The booking-availability.js function reads from Supabase if configured.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  var aLang = function(){ return window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.getLang() : 'nl'; };
  if (window.__bsLoaded) return;
  window.__bsLoaded = true;

  var SKEY = 'montisoro_booking_schedule';
  var DAYS = [
    { idx: 1, nl: 'Maandag',   en: 'Monday'    },
    { idx: 2, nl: 'Dinsdag',   en: 'Tuesday'   },
    { idx: 3, nl: 'Woensdag',  en: 'Wednesday' },
    { idx: 4, nl: 'Donderdag', en: 'Thursday'  },
    { idx: 5, nl: 'Vrijdag',   en: 'Friday'    }
  ];

  var DEFAULT = {
    onsite: { 2: ['9:30'], 4: ['13:00'] },
    online: { 1: ['13:00','14:00','15:00','16:00'], 3: ['11:00','12:00','13:00'], 5: ['11:00','12:00','13:00'] }
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(SKEY) || 'null') || JSON.parse(JSON.stringify(DEFAULT)); }
    catch(e) { return JSON.parse(JSON.stringify(DEFAULT)); }
  }
  function save(s) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch(e) {} }

  function typePanel(type, label, sched) {
    return '<div class="panel u-mb-18">' +
      '<div class="panel-head"><div><h3>' + label + '</h3>' +
        '<div class="panel-sub">' + (type==='online'?mtT('bs_online_sub'):mtT('bs_onsite_sub')) + '</div>' +
      '</div></div>' +
      '<div class="panel-body">' +
        '<table class="tbl"><thead><tr><th>'+mtT('bs_th_day')+'</th><th>'+mtT('bs_th_active')+'</th><th>'+mtT('bs_th_slots')+'</th></tr></thead><tbody>' +
        DAYS.map(function(d) {
          var slots = (sched[type]||{})[d.idx] || [];
          var active = slots.length > 0;
          return '<tr>' +
            '<td class="u-fw-600">' + (d[aLang()]||d.nl) + '</td>' +
            '<td><input type="checkbox" data-bs-type="'+type+'" data-bs-day="'+d.idx+'" class="bs-active a-check"' + (active?' checked':'') + '></td>' +
            '<td><input type="text" data-bs-slots="'+type+'-'+d.idx+'" value="' + slots.join(', ') + '" placeholder="'+mtT('bs_slots_ph')+'"' +
              (active?'':' disabled') +
              ' class="bs-input"></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>' +
      '</div>' +
    '</div>';
  }

  window.init_bookingschedule = function() {
    var host = document.getElementById('bs-body');
    if (!host) return;
    var sched = load();
    host.innerHTML = typePanel('online', mtT('bk_online_teams'), sched) + typePanel('onsite', mtT('bk_onsite'), sched);

    /* Toggle active/disabled on checkbox change */
    host.querySelectorAll('.bs-active').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var inp = host.querySelector('[data-bs-slots="'+cb.dataset.bsType+'-'+cb.dataset.bsDay+'"]');
        if (inp) inp.disabled = !cb.checked;
        saveCurrent();
      });
    });

    /* Save on input change */
    host.querySelectorAll('[data-bs-slots]').forEach(function(inp) {
      inp.addEventListener('change', saveCurrent);
    });

    function saveCurrent() {
      var s = { online: {}, onsite: {} };
      host.querySelectorAll('.bs-active').forEach(function(cb) {
        if (!cb.checked) return;
        var inp = host.querySelector('[data-bs-slots="'+cb.dataset.bsType+'-'+cb.dataset.bsDay+'"]');
        var slots = inp ? inp.value.split(',').map(function(x){return x.trim();}).filter(Boolean) : [];
        if (slots.length) s[cb.dataset.bsType][cb.dataset.bsDay] = slots;
      });
      save(s);
    }

    /* Publish button */
    var pub = document.getElementById('bs-publish');
    if (pub) pub.onclick = function() {
      var s = load();
      if (window.publishToSite) {
        pub.disabled = true; pub.textContent = mtT('btn_publishing');
        window.publishToSite('booking_schedule', s, function() {
          pub.disabled = false; pub.innerHTML = '<i class="ti ti-cloud-upload"></i> ' + mtT('btn_publish');
        });
      }
    };
  };
})();
