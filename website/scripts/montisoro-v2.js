/* ═══════════════════════════════════════════════════════════════════
   MONTISORO · v2 — ICOON-RUNTIME (productie)
   Zet de Tabler-glyphs om naar de Phosphor-set (monoline). Vangt ook
   dynamisch ingevoegde/gewijzigde iconen (calculator, fit-check, agenda).
   Géén content/copy/logica gewijzigd.
   NB: iconen draaien voorlopig via CDN; bij aanlevering van de Phosphor
   WOFF2-bestanden wordt enkel de <head>-verwijzing lokaal gemaakt.
═══════════════════════════════════════════════════════════════════ */
(function(){
  var MAP = {
    'ti-menu-2':'ph ph-list','ti-x':'ph ph-x','ti-check':'ph ph-check',
    'ti-circle-check':'ph-light ph-check-circle','ti-point-filled':'ph-light ph-dot-outline',
    'ti-arrow-left':'ph ph-arrow-left','ti-arrow-right':'ph ph-arrow-right','ti-arrow-up-right':'ph ph-arrow-up-right',
    'ti-chevron-left':'ph ph-caret-left','ti-chevron-right':'ph ph-caret-right',
    'ti-info-circle':'ph-light ph-info','ti-printer':'ph-light ph-printer','ti-lock':'ph-light ph-lock-simple',
    'ti-mail':'ph-light ph-envelope-simple','ti-mail-opened':'ph-light ph-envelope-open','ti-at':'ph-light ph-at',
    'ti-phone':'ph-light ph-phone','ti-phone-call':'ph-light ph-phone-call','ti-clock':'ph-light ph-clock',
    'ti-clock-hour-4':'ph-light ph-clock-countdown','ti-calendar-event':'ph-light ph-calendar-check',
    'ti-map-pin':'ph-light ph-map-pin','ti-map-2':'ph-light ph-map-trifold','ti-user':'ph-light ph-user',
    'ti-users':'ph-light ph-users-three','ti-video':'ph-light ph-video-camera','ti-brand-linkedin':'ph ph-linkedin-logo',
    'ti-shield-check':'ph-light ph-shield-check','ti-eye':'ph-light ph-eye','ti-message-off':'ph-light ph-chat-circle',
    'ti-message-2':'ph-light ph-chat-circle','ti-handshake':'ph-light ph-link-simple-horizontal',
    'ti-clipboard-data':'ph-light ph-clipboard-text','ti-cloud-lock':'ph-light ph-shield-check',
    'ti-sparkles':'ph ph-circles-three','ti-scale':'ph-light ph-scales','ti-copyright':'ph-light ph-copyright',
    'ti-link':'ph-light ph-link','ti-world':'ph-light ph-globe','ti-coin-euro':'ph-light ph-coins',
    'ti-briefcase':'ph-light ph-briefcase','ti-calendar-stats':'ph-light ph-calendar-dots',
    'ti-building':'ph-light ph-buildings','ti-building-skyscraper':'ph-light ph-buildings',
    'ti-circle-x':'ph-light ph-x-circle','ti-alert-triangle':'ph-light ph-warning',
    'ti-file-download':'ph ph-file-pdf','ti-download':'ph ph-download-simple',
    'ti-checks':'ph ph-checks','ti-chevron-down':'ph ph-caret-down','ti-adjustments-horizontal':'ph-light ph-sliders-horizontal'
  };
  function swap(el){
    if(!el.classList || !el.classList.contains('ti')) return;
    var ti=null; el.classList.forEach(function(c){ if(c.indexOf('ti-')===0 && !ti) ti=c; });
    if(!ti || !MAP[ti]) return;
    var keep=[]; el.classList.forEach(function(c){ if(c!=='ti' && c.indexOf('ti-')!==0) keep.push(c); });
    el.setAttribute('class', MAP[ti] + (keep.length ? ' '+keep.join(' ') : ''));
  }
  function swapAll(root){ (root||document).querySelectorAll('i.ti, span.ti').forEach(swap); }
  function init(){
    swapAll(document);
    /* Site-brede nav-standaard: de goedgekeurde "Kader +"-navigatie (gecentreerde
       witte pil + logo vrij links). Eén bron in montisoro-v2.css; hier overal geactiveerd.
       Uitzondering: Home gebruikt de donkere glas-editorial-nav (verbeterde hero-compositie). */
    document.body.classList.remove('nav-boxed2');
    var pg=(location.pathname.split('/').pop()||'').toLowerCase();
    var isHome=/^home(-en)?\.html$/.test(pg);
    if(isHome){
      document.body.classList.add('ad-home');
      var inner=document.querySelector('.hero-inner');
      if(inner && !inner.querySelector('.ad-index')){
        var idx=document.createElement('div'); idx.className='ad-index';
        idx.innerHTML='<span>Montisoro — 2026</span><span class="s">/</span><span>Re-integrate what matters</span>';
        inner.insertBefore(idx, inner.firstChild);
      }
    }
    if(/^about(-en)?\.html$/.test(pg)) document.body.classList.add('ad-about');
    if('MutationObserver' in window){
      var mo=new MutationObserver(function(muts){
        muts.forEach(function(m){
          if(m.type==='attributes'){ if(m.target && m.target.classList && m.target.classList.contains('ti')) swap(m.target); return; }
          m.addedNodes && m.addedNodes.forEach(function(n){
            if(n.nodeType!==1) return;
            if(n.matches && n.matches('i.ti, span.ti')) swap(n);
            if(n.querySelectorAll) swapAll(n);
          });
        });
      });
      mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
