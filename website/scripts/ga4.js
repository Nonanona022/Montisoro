/* Montisoro — GA4 (G-JV1X452NRZ) met Google Consent Mode v2.
   Standaard alles DENIED; schakelt naar GRANTED zodra de bezoeker via de
   bestaande cookiebanner (window.MontisoroConsent) analytische/marketing-
   cookies toestaat. Respecteert Do-Not-Track. Geen dubbele tag. */
(function(){
  var GA_ID = 'G-JV1X452NRZ';
  var KEY = 'montisoro.cookie.v2';

  // Do-Not-Track → GA volledig achterwege laten.
  var dnt = (navigator.doNotTrack == '1' || window.doNotTrack == '1' || navigator.msDoNotTrack == '1');
  if (dnt) return;
  if (window.__ga4Booted) return; window.__ga4Booted = true;

  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // ── Consent Mode v2 — veilige defaults (EEA/België): alles geweigerd tot toestemming.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });

  // ── GA4 laden + basisconfig (stuurt cookieloze pings zolang 'denied').
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });

  // ── Toestemming toepassen op basis van de opgeslagen keuze (los van laadvolgorde).
  function readCats(){
    try { var r = JSON.parse(localStorage.getItem(KEY)); return (r && r.categories) || null; }
    catch(e){ return null; }
  }
  function apply(cats){
    if (!cats) return;
    var analytics = cats.analytics ? 'granted' : 'denied';
    var marketing = cats.marketing ? 'granted' : 'denied';
    gtag('consent', 'update', {
      analytics_storage: analytics,
      ad_storage: marketing,
      ad_user_data: marketing,
      ad_personalization: marketing
    });
  }

  // Bestaande keuze meteen toepassen.
  apply(readCats());

  // Op wijzigingen reageren zodra de banner-API beschikbaar is (retry i.v.m. defer-volgorde).
  var tries = 0;
  (function hook(){
    if (window.MontisoroConsent && typeof window.MontisoroConsent.onChange === 'function'){
      window.MontisoroConsent.onChange(function(rec){ apply(rec && rec.categories); });
      return;
    }
    if (tries++ < 40) setTimeout(hook, 150);
  })();
})();
