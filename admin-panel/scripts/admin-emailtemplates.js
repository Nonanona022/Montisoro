/* ═══════════════════════════════════════════════════════════════════
   admin-emailtemplates.js — E-mail onderwerpsregels beheren
   Publiceert key 'email_templates' naar Supabase via publishToSite().
   De mailer (_lib/mailer.js) leest deze override server-side; zonder
   override blijft de hardcoded merktekst staan (fallback-veilig).
   Scope = de onderwerpsregels van de 3 bevestigingsmails (NL+EN).
   De volledige mail-LAYOUT + PDF-body blijven bewust in code.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  if (window.__etLoaded) return;
  window.__etLoaded = true;

  var KEY = 'montisoro_email_templates';
  var TYPES = [
    { key:'contact',  lblK:'et_contact_label',      nl:'We hebben uw bericht ontvangen — Montisoro',        en:'We received your message — Montisoro' },
    { key:'fitcheck', lblK:'et_fitcheck_label',  nl:'Uw fit check-resultaat — Montisoro',                en:'Your fit check result — Montisoro' },
    { key:'casey',    lblK:'et_casey_label',       nl:'U staat op de Casey-wachtlijst — Montisoro',        en:'You are on the Casey waitlist — Montisoro' }
  ];

  function load(){ try { return JSON.parse(localStorage.getItem(KEY)||'{}') || {}; } catch(e){ return {}; } }
  function save(d){ try { localStorage.setItem(KEY, JSON.stringify(d)); } catch(e){} }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  var data;
  function render(){
    var host = document.getElementById('et-body');
    if (!host) return;
    data = load();
    host.innerHTML = TYPES.map(function(t){
      var v = data[t.key] || {};
      return '<div class="panel u-mb-14"><div class="panel-body a-card-pad">'+
        '<h4 class="et-h">'+esc(mtT(t.lblK))+'</h4>'+
        '<div class="et-sub">'+mtT('et_subject_hint')+'</div>'+
        '<div class="u-mb-9"><label class="form-sublabel">'+mtT('et_subject_nl')+'</label>'+
          '<input type="text" data-et-key="'+t.key+'" data-et-lang="subject_nl" value="'+esc(v.subject_nl)+'" placeholder="'+esc(t.nl)+'" class="a-input-w"></div>'+
        '<div><label class="form-sublabel">'+mtT('et_subject_en')+'</label>'+
          '<input type="text" data-et-key="'+t.key+'" data-et-lang="subject_en" value="'+esc(v.subject_en)+'" placeholder="'+esc(t.en)+'" class="a-input-w"></div>'+
      '</div></div>';
    }).join('');
    host.querySelectorAll('[data-et-key]').forEach(function(el){
      el.addEventListener('input', function(){
        var k=el.dataset.etKey, f=el.dataset.etLang;
        data[k]=data[k]||{}; data[k][f]=el.value; save(data);
      });
    });
  }

  window.init_emailtemplates = function(){
    render();
    var pub = document.getElementById('et-publish');
    if (pub) pub.onclick = function(){
      data = load();
      var clean = {};
      Object.keys(data).forEach(function(k){
        var o={}; if(data[k].subject_nl) o.subject_nl=data[k].subject_nl; if(data[k].subject_en) o.subject_en=data[k].subject_en;
        if(o.subject_nl||o.subject_en) clean[k]=o;
      });
      if (window.publishToSite){
        pub.disabled=true; pub.textContent=mtT('btn_publishing');
        window.publishToSite('email_templates', clean, function(){ pub.disabled=false; pub.innerHTML='<i class="ti ti-cloud-upload"></i> ' + mtT('btn_publish'); });
      }
    };
  };
})();
