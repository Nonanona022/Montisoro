/* ═══════════════════════════════════════════════════════════════════
   admin-faq.js — FAQ-beheer (Aanpak NL+EN)
   Bewerkt window FAQ-data en publiceert naar Supabase (key 'faq') via
   publishToSite(). Site leest het via site-content.js → __reFaq.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__faqLoaded) return;
  window.__faqLoaded = true;
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});

  var KEY = 'montisoro_faq';

  // Standaard = de hardcoded FAQ op de Aanpak-pagina (zodat het scherm niet leeg start)
  var DEFAULT = { aanpak: [
    { q_nl:'Hoe verloopt een eerste gesprek?', a_nl:'Een vrijblijvend diagnosegesprek van 30 à 45 minuten — online of bij u op locatie. U brengt uw situatie, wij luisteren en schetsen waar de grootste hefbomen zitten.', q_en:'How does a first conversation work?', a_en:'A no-obligation diagnostic conversation of 30 to 45 minutes — online or at your location. You bring your situation, we listen and outline where the biggest levers are.' },
    { q_nl:'Wat kost een traject?', a_nl:'Dat hangt af van omvang en ambitie. We werken met heldere, vaste scopes — geen open einde. Na het eerste gesprek krijgt u een concreet voorstel met verwachte terugverdientijd.', q_en:'What does a programme cost?', a_en:'That depends on scope and ambition. We work with clear, fixed scopes — no open end. After the first conversation you get a concrete proposal with expected payback time.' },
    { q_nl:'Hoe snel zien we resultaat?', a_nl:'De eerste inzichten zijn er binnen weken. Een structurele daling volgt doorgaans binnen één tot twee kwartalen.', q_en:'How fast do we see results?', a_en:'The first insights arrive within weeks. A structural decline usually follows within one to two quarters.' },
    { q_nl:'Werkt dit ook voor onze sector of kmo?', a_nl:'Ja. De methode is sector-agnostisch en schaalt van kmo tot grote organisatie.', q_en:'Does this work for our sector or SME?', a_en:'Yes. The method is sector-agnostic and scales from SME to large organisation.' }
  ] };

  function load(){
    try { var s = JSON.parse(localStorage.getItem(KEY)||'null'); if (s && s.aanpak) return s; } catch(e){}
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  function save(d){ try { localStorage.setItem(KEY, JSON.stringify(d)); } catch(e){} }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  var data;

  function render(){
    var host = document.getElementById('faq-body');
    if (!host) return;
    data = load();
    var list = data.aanpak || [];
    host.innerHTML = list.map(function(it,i){
      return '<div class="panel u-mb-14"><div class="panel-body a-card-pad">'+
        '<div class="faq-head">'+
          '<span class="faq-cat">Vraag '+(i+1)+'</span>'+
          '<div class="faq-actions">'+
            '<button data-faq-up="'+i+'" title="Omhoog" class="a-icon-btn">↑</button>'+
            '<button data-faq-down="'+i+'" title="Omlaag" class="a-icon-btn">↓</button>'+
            '<button data-faq-del="'+i+'" title="Verwijderen" class="a-icon-btn is-danger"><i class="ti ti-trash"></i></button>'+
          '</div>'+
        '</div>'+
        fld('NL · vraag', i, 'q_nl', it.q_nl, false)+
        fld('NL · antwoord', i, 'a_nl', it.a_nl, true)+
        fld('EN · question', i, 'q_en', it.q_en, false)+
        fld('EN · answer', i, 'a_en', it.a_en, true)+
      '</div></div>';
    }).join('') || '<p class="a-t13-muted">Geen vragen. Klik "Vraag toevoegen".</p>';

    host.querySelectorAll('[data-faq-f]').forEach(function(el){
      el.addEventListener('input', function(){
        var i=+el.dataset.faqI, f=el.dataset.faqF;
        data.aanpak[i][f]=el.value; save(data);
      });
    });
    host.querySelectorAll('[data-faq-del]').forEach(function(b){ b.addEventListener('click', function(){ var idx=+b.dataset.faqDel; window.Admin.confirmDelete({title:'Vraag verwijderen?'}).then(function(ok){ if(!ok) return; var removed=data.aanpak[idx]; data.aanpak.splice(idx,1); save(data); render(); window.Admin.undoToast('Vraag verwijderd', function(){ data.aanpak.splice(idx,0,removed); save(data); render(); window.Admin.showToast(mtT('toast_question_restored')); }); }); }); });
    host.querySelectorAll('[data-faq-up]').forEach(function(b){ b.addEventListener('click', function(){ var i=+b.dataset.faqUp; if(i>0){ var a=data.aanpak; var t=a[i];a[i]=a[i-1];a[i-1]=t; save(data); render(); } }); });
    host.querySelectorAll('[data-faq-down]').forEach(function(b){ b.addEventListener('click', function(){ var i=+b.dataset.faqDown; var a=data.aanpak; if(i<a.length-1){ var t=a[i];a[i]=a[i+1];a[i+1]=t; save(data); render(); } }); });
  }

  function fld(label, i, f, val, area){
    var input = area
      ? '<textarea data-faq-f data-faq-i="'+i+'" data-faq-f="'+f+'" rows="2" class="a-textarea-w">'+esc(val)+'</textarea>'
      : '<input type="text" data-faq-f data-faq-i="'+i+'" data-faq-f="'+f+'" value="'+esc(val)+'" class="a-input-w">';
    return '<div class="u-mb-9"><label class="form-sublabel">'+label+'</label>'+input+'</div>';
  }

  window.init_faq = function(){
    render();
    var add = document.getElementById('faq-add');
    if (add) add.onclick = function(){ data=load(); data.aanpak.push({q_nl:'',a_nl:'',q_en:'',a_en:''}); save(data); render(); };
    var pub = document.getElementById('faq-publish');
    if (pub) pub.onclick = function(){
      data=load();
      if (window.publishToSite){
        pub.disabled=true; pub.textContent=mtT('btn_publishing');
        window.publishToSite('faq', data, function(){ pub.disabled=false; pub.innerHTML='<i class="ti ti-cloud-upload"></i> ' + mtT('btn_publish'); });
      }
    };
  };
})();
