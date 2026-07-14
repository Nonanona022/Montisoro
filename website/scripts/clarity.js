/* Montisoro — Microsoft Clarity (xmf5h83z44), consent-gated.
   Clarity kent geen eigen consent-mode → we laden de tag PAS wanneer de
   bezoeker via de bestaande cookiebanner (window.MontisoroConsent) analytische
   of performance-cookies toestaat. Respecteert Do-Not-Track. Geen dubbele tag. */
(function(){
  var CLARITY_ID = 'xmf5h83z44';
  var KEY = 'montisoro.cookie.v2';

  var dnt = (navigator.doNotTrack == '1' || window.doNotTrack == '1' || navigator.msDoNotTrack == '1');
  if (dnt) return;

  function readCats(){
    try { var r = JSON.parse(localStorage.getItem(KEY)); return (r && r.categories) || null; }
    catch(e){ return null; }
  }
  function allowed(cats){ return !!(cats && (cats.analytics || cats.performance)); }

  function loadClarity(){
    if (window.__clarityBooted) return; window.__clarityBooted = true;
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  // Al toestemming? Meteen laden.
  if (allowed(readCats())) loadClarity();

  // Anders wachten op een 'ja' via de banner-API (retry i.v.m. defer-volgorde).
  var tries = 0;
  (function hook(){
    if (window.MontisoroConsent && typeof window.MontisoroConsent.onChange === 'function'){
      window.MontisoroConsent.onChange(function(rec){ if (allowed(rec && rec.categories)) loadClarity(); });
      return;
    }
    if (tries++ < 40) setTimeout(hook, 150);
  })();
})();
