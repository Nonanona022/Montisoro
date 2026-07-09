/* ═══════════════════════════════════════════════════════════════════
   admin-featureflags.js — Feature Flags view
   Kill-switches for booking / fit-check / calculator.
   Saves to localStorage + publishes to Supabase via publishToSite().
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  if (window.__ffLoaded) return;
  window.__ffLoaded = true;

  var FLAGS_KEY = 'montisoro_feature_flags';

  var DEFS = {
    booking_enabled:    { k:'booking', icon: 'ti-calendar' },
    fitcheck_enabled:   { k:'fitcheck', icon: 'ti-clipboard-text' },
    calculator_enabled: { k:'calculator', icon: 'ti-calculator' }
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(FLAGS_KEY) || 'null') || {}; } catch(e) { return {}; }
  }
  function save(flags) {
    try { localStorage.setItem(FLAGS_KEY, JSON.stringify(flags)); } catch(e) {}
  }

  function toggle(id, val, flags) {
    flags[id] = val;
    save(flags);
    render();
  }

  function render() {
    var host = document.getElementById('ff-body');
    if (!host) return;
    var flags = load();

    host.innerHTML = Object.keys(DEFS).map(function(id) {
      var def = DEFS[id];
      var enabled = flags[id] !== false; // default true
      return '<div class="panel u-mb-14">' +
        '<div class="panel-body ff-row">' +
          '<i class="ti ' + def.icon + ' ff-ico"></i>' +
          '<div class="ff-body">' +
            '<div class="ff-name">' + mtT('ff_'+def.k+'_label') + '</div>' +
            '<div class="ff-desc">' + mtT('ff_'+def.k+'_desc') + '</div>' +
          '</div>' +
          '<label class="ff-toggle" title="' + (enabled?mtT('ff_disable'):mtT('ff_enable')) + '">' +
            '<input type="checkbox" data-ff-id="' + id + '" ' + (enabled ? 'checked' : '') + ' class="a-sr-check">' +
            '<span class="ff-track' + (enabled ? ' on' : '') + '"><span class="ff-thumb"></span></span>' +
            '<span class="ff-state ' + (enabled?'is-on':'is-off') + '">' + (enabled?mtT('ff_on'):mtT('ff_off')) + '</span>' +
          '</label>' +
        '</div>' +
      '</div>';
    }).join('');

    host.querySelectorAll('input[data-ff-id]').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var f = load();
        toggle(cb.dataset.ffId, cb.checked, f);
      });
    });

    var pub = document.getElementById('ff-publish');
    if (pub) pub.onclick = function() {
      var f = load();
      if (window.publishToSite) {
        pub.disabled = true; pub.textContent = mtT('btn_publishing');
        window.publishToSite('feature_flags', f, function() {
          pub.disabled = false; pub.innerHTML = '<i class="ti ti-cloud-upload"></i> ' + mtT('btn_publish');
        });
      }
    };
  }

  window.init_featureflags = render;
})();
