/* Montisoro — first-party pageview-beacon.
   Wordt pas actief na expliciete toestemming voor analytische cookies.
   Geen fingerprinting of PII; respecteert Do-Not-Track. */
(function(){
  'use strict';
  var KEY = 'montisoro.cookie.v2';
  var sent = false;

  function dnt(){
    return navigator.doNotTrack==='1' || window.doNotTrack==='1' || navigator.msDoNotTrack==='1';
  }
  function readCats(){
    try { var r=JSON.parse(localStorage.getItem(KEY)); return (r&&r.categories)||null; }
    catch(e){ return null; }
  }
  function allowed(cats){ return !!(cats && cats.analytics); }
  function track(){
    if(sent || dnt() || !allowed(readCats())) return;
    sent = true;
    try{
      var w = window.innerWidth || (screen && screen.width) || 0;
      var device = w<=600 ? 'mobile' : (w<=1024 ? 'tablet' : 'desktop');
      var ref = null;
      try{ if(document.referrer){ var u=new URL(document.referrer); if(u.host && u.host!==location.host) ref=u.host; } }catch(e){}
      var payload = JSON.stringify({ p:location.pathname, r:ref, l:(document.documentElement.lang||'').slice(0,8), d:device, w:w });
      var url='/api/track';
      if(navigator.sendBeacon) navigator.sendBeacon(url,new Blob([payload],{type:'application/json'}));
      else fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true}).catch(function(){});
    }catch(e){}
  }

  if(allowed(readCats())) track();
  var tries=0;
  (function hook(){
    if(window.MontisoroConsent && typeof window.MontisoroConsent.onChange==='function'){
      window.MontisoroConsent.onChange(function(rec){ if(allowed(rec&&rec.categories)) track(); });
      return;
    }
    if(tries++<40) setTimeout(hook,150);
  })();
})();
