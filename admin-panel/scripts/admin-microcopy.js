/* ═══════════════════════════════════════════════════════════════════
   admin-microcopy.js — Microcopy-beheer (homepage hero-CTA's + note)
   Publiceert naar Supabase (key 'microcopy') via publishToSite().
   Site past het toe via site-content.js op [data-mc="key"].
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  if (window.__mcLoaded) return;
  window.__mcLoaded = true;

  var KEY = 'montisoro_microcopy';
  var FIELDS = [
    { key:'home_cta_primary',   lblK:'mc_home_cta_primary',        nl:'Plan een gesprek →',                                  en:'Book a call →' },
    { key:'home_cta_secondary', lblK:'mc_home_cta_secondary',      nl:'Bereken uw verzuimkost →',                            en:'Calculate your absence cost →' },
    { key:'home_cta_note',      lblK:'mc_home_cta_note',      nl:'Vrijblijvend gesprek · 30–45 minuten · online of op locatie', en:'No-obligation conversation · 30–45 minutes · online or on-site' }
  ];

  function load(){ try { return JSON.parse(localStorage.getItem(KEY)||'{}') || {}; } catch(e){ return {}; } }
  function save(d){ try { localStorage.setItem(KEY, JSON.stringify(d)); } catch(e){} }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  var data;
  function render(){
    var host = document.getElementById('mc-body');
    if (!host) return;
    data = load();
    host.innerHTML = FIELDS.map(function(fd){
      var v = data[fd.key] || {};
      return '<div class="panel u-mb-14"><div class="panel-body a-card-pad">'+
        '<h4 class="mc-h">'+esc(mtT(fd.lblK))+'</h4>'+
        '<div class="u-mb-9"><label class="form-sublabel">NL</label>'+
          '<input type="text" data-mc-key="'+fd.key+'" data-mc-lang="nl" value="'+esc(v.nl)+'" placeholder="'+esc(fd.nl)+'" class="a-input-w"></div>'+
        '<div><label class="form-sublabel">EN</label>'+
          '<input type="text" data-mc-key="'+fd.key+'" data-mc-lang="en" value="'+esc(v.en)+'" placeholder="'+esc(fd.en)+'" class="a-input-w"></div>'+
      '</div></div>';
    }).join('');
    host.querySelectorAll('[data-mc-key]').forEach(function(el){
      el.addEventListener('input', function(){
        var k=el.dataset.mcKey, lang=el.dataset.mcLang;
        data[k]=data[k]||{}; data[k][lang]=el.value; save(data);
      });
    });
  }

  window.init_microcopy = function(){
    render();
    var pub = document.getElementById('mc-publish');
    if (pub) pub.onclick = function(){
      data=load();
      // lege strings eruit zodat alleen ingevulde velden overschrijven
      var clean={}; Object.keys(data).forEach(function(k){ var o={}; if(data[k].nl) o.nl=data[k].nl; if(data[k].en) o.en=data[k].en; if(o.nl||o.en) clean[k]=o; });
      if (window.publishToSite){
        pub.disabled=true; pub.textContent=mtT('btn_publishing');
        window.publishToSite('microcopy', clean, function(){ pub.disabled=false; pub.innerHTML='<i class="ti ti-cloud-upload"></i> ' + mtT('btn_publish'); });
      }
    };
  };
})();
