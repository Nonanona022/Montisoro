/* Montisoro — Microsoft Clarity (xmf5h83z44), consent-gated.
   De tag wordt alleen op het productiedomein en pas na analytische toestemming
   geladen. Consent V2 houdt latere wijzigingen bij. Advertentie-opslag blijft
   uitgeschakeld. Respecteert Do-Not-Track. Geen dubbele tag. */
(function(){
  'use strict';
  var CLARITY_ID = 'xmf5h83z44';
  var KEY = 'montisoro.cookie.v2';

  var dnt = (navigator.doNotTrack == '1' || window.doNotTrack == '1' || navigator.msDoNotTrack == '1');
  if (dnt) return;

  function readCats(){
    try { var r = JSON.parse(localStorage.getItem(KEY)); return (r && r.categories) || null; }
    catch(e){ return null; }
  }
  function productionHost(){
    var host=(window.location.hostname||'').toLowerCase();
    return host==='montisoro.com' || host==='www.montisoro.com';
  }
  function allowed(cats){ return !!(cats && cats.analytics); }

  function applyConsent(cats){
    if (!window.__clarityBooted || typeof window.clarity !== 'function') return;
    window.clarity('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: allowed(cats) ? 'granted' : 'denied'
    });
  }

  function loadClarity(cats){
    if (!window.__clarityBooted){
      window.__clarityBooted = true;
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", CLARITY_ID);
    }
    applyConsent(cats);
  }

  // Geen heatmaps of sessies op lokale, Netlify- of ontwerppreviews.
  if (!productionHost()) return;

  // Al toestemming? Meteen laden.
  var initial = readCats();
  if (allowed(initial)) loadClarity(initial);

  // Anders wachten op een 'ja' via de banner-API (retry i.v.m. defer-volgorde).
  var tries = 0;
  (function hook(){
    if (window.MontisoroConsent && typeof window.MontisoroConsent.onChange === 'function'){
      window.MontisoroConsent.onChange(function(rec){
        var cats = rec && rec.categories;
        if (allowed(cats)) loadClarity(cats);
        else applyConsent(cats);
      });
      return;
    }
    if (tries++ < 40) setTimeout(hook, 150);
  })();
})();
