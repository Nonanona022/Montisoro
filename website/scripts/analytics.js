/* Montisoro — cookieloze, first-party pageview-beacon.
   Geen cookies, geen fingerprint, geen externe scripts. Respecteert Do-Not-Track. */
(function(){
  try{
    if (navigator.doNotTrack==='1' || window.doNotTrack==='1' || navigator.msDoNotTrack==='1') return;
    var w = window.innerWidth || (screen && screen.width) || 0;
    var device = w<=600 ? 'mobile' : (w<=1024 ? 'tablet' : 'desktop');
    var ref = null;
    try{ if(document.referrer){ var u=new URL(document.referrer); if(u.host && u.host!==location.host) ref=u.host; } }catch(e){}
    var payload = JSON.stringify({ p: location.pathname, r: ref, l: (document.documentElement.lang||'').slice(0,8), d: device, w: w });
    var url='/api/track';
    if (navigator.sendBeacon){ navigator.sendBeacon(url, new Blob([payload],{type:'application/json'})); }
    else { fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true}).catch(function(){}); }
  }catch(e){}
})();
