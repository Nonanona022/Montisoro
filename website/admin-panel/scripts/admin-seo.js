/* ═══════════════════════════════════════════════════════════════════
   admin-seo.js — SEO-beheer (titel + meta-description per pagina, NL+EN)
   Publiceert naar Supabase (key 'seo') via publishToSite().
   Site past het toe via site-content.js (direct op <head>).
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  if (window.__seoLoaded) return;
  window.__seoLoaded = true;

  var KEY = 'montisoro_seo';
  var PAGES = [
    { slug:'Home',        label:'Home' },
    { slug:'about',       label:'About' },
    { slug:'aanpak',      label:'Onze aanpak' },
    { slug:'technologie', label:'Technologie' },
    { slug:'calculator',  label:'Calculator' },
    { slug:'fit-check',   label:'Fit check' },
    { slug:'contact',     label:'Contact' },
    { slug:'privacy',     label:'Privacy' },
    { slug:'disclaimer',  label:'Disclaimer' }
  ];

  function load(){ try { return JSON.parse(localStorage.getItem(KEY)||'{}') || {}; } catch(e){ return {}; } }
  function save(d){ try { localStorage.setItem(KEY, JSON.stringify(d)); } catch(e){} }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  var data;
  function f(slug, field, val, ph){
    var len = (val||'').length;
    return '<div class="u-mb-9"><label class="seo-count"><span>'+ph+'</span><span data-seo-count="'+slug+'-'+field+'">'+len+'</span></label>'+
      '<input type="text" data-seo-slug="'+slug+'" data-seo-field="'+field+'" value="'+esc(val)+'" class="a-input-w"></div>';
  }

  function render(){
    var host = document.getElementById('seo-body');
    if (!host) return;
    data = load();
    host.innerHTML = PAGES.map(function(p){
      var s = data[p.slug] || {};
      return '<div class="panel u-mb-14"><div class="panel-body a-card-pad">'+
        '<h4 class="seo-h">'+esc(mtT('seo_page_'+p.slug.replace(/-/g,'_')))+'</h4>'+
        f(p.slug,'title_nl', s.title_nl, mtT('seo_f_title_nl'))+
        f(p.slug,'desc_nl', s.desc_nl, mtT('seo_f_desc_nl'))+
        f(p.slug,'title_en', s.title_en, mtT('seo_f_title_en'))+
        f(p.slug,'desc_en', s.desc_en, mtT('seo_f_desc_en'))+
      '</div></div>';
    }).join('');
    host.querySelectorAll('[data-seo-slug]').forEach(function(el){
      el.addEventListener('input', function(){
        var slug=el.dataset.seoSlug, field=el.dataset.seoField;
        data[slug]=data[slug]||{}; data[slug][field]=el.value; save(data);
        var c=host.querySelector('[data-seo-count="'+slug+'-'+field+'"]'); if(c) c.textContent=el.value.length;
      });
    });
  }

  window.init_seo = function(){
    render();
    var pub = document.getElementById('seo-publish');
    if (pub) pub.onclick = function(){
      data=load();
      if (window.publishToSite){
        pub.disabled=true; pub.textContent=mtT('btn_publishing');
        window.publishToSite('seo', data, function(){ pub.disabled=false; pub.innerHTML='<i class="ti ti-cloud-upload"></i> ' + mtT('btn_publish'); });
      }
    };
  };
})();
