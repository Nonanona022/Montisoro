/* Montisoro — GA4 (G-JV1X452NRZ), volledig consent-gated.
   Google wordt niet geladen en ontvangt geen cookieloze ping vóór expliciete
   analytische toestemming. Respecteert Do-Not-Track. */
(function(){
  'use strict';
  var GA_ID='G-JV1X452NRZ';
  var KEY='montisoro.cookie.v2';

  function dnt(){
    return navigator.doNotTrack==='1' || window.doNotTrack==='1' || navigator.msDoNotTrack==='1';
  }
  function productionHost(){
    var host=(window.location.hostname||'').toLowerCase();
    return host==='montisoro.com' || host==='www.montisoro.com';
  }
  function readCats(){
    try { var r=JSON.parse(localStorage.getItem(KEY)); return (r&&r.categories)||null; }
    catch(e){ return null; }
  }
  function allowed(cats){ return !!(cats && cats.analytics); }
  function gtag(){ window.dataLayer.push(arguments); }

  function apply(cats){
    if(!window.__ga4Booted || !window.gtag) return;
    var analytics=allowed(cats)?'granted':'denied';
    var marketing=(cats&&cats.marketing)?'granted':'denied';
    window.gtag('consent','update',{
      analytics_storage:analytics,
      ad_storage:marketing,
      ad_user_data:marketing,
      ad_personalization:marketing
    });
  }

  function boot(cats){
    if(dnt() || !allowed(cats) || window.__ga4Booted) return;
    window.__ga4Booted=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||gtag;
    window.gtag('consent','default',{
      analytics_storage:'granted',
      ad_storage:(cats&&cats.marketing)?'granted':'denied',
      ad_user_data:(cats&&cats.marketing)?'granted':'denied',
      ad_personalization:(cats&&cats.marketing)?'granted':'denied',
      functionality_storage:'granted',
      security_storage:'granted'
    });
    var s=document.createElement('script');
    s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID;
    document.head.appendChild(s);
    window.gtag('js',new Date());
    window.gtag('config',GA_ID,{anonymize_ip:true});
  }

  // Geen analytics op lokale, Netlify- of ontwerppreviews: zo blijft GA4 schoon.
  if(!productionHost()) return;

  boot(readCats());
  var tries=0;
  (function hook(){
    if(window.MontisoroConsent && typeof window.MontisoroConsent.onChange==='function'){
      window.MontisoroConsent.onChange(function(rec){
        var cats=rec&&rec.categories;
        if(allowed(cats)) boot(cats);
        apply(cats);
      });
      return;
    }
    if(tries++<40) setTimeout(hook,150);
  })();
})();
