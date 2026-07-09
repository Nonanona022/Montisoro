/* ═══════════════════════════════════════════════════════════════════
   shell.js — Sober preset nav.
   Desktop (≥1181px): verplaats de (door motion.js in de pil geïnjecteerde)
   taalknop NAAR BUITEN de witte pil → losse donkere pil rechts (zoals de
   ontwerptool), géén overlap met de CTA.
   Mobiel (<1181px): laat 'm BINNEN de pil staan zodat het hamburger-menu
   de taaloptie blijft tonen.
   Idempotent, wacht op de late injectie door motion.js, reageert op resize.
═══════════════════════════════════════════════════════════════════ */
(function(){
  /* Audit #7 — staging-guard: zet enkel op een *.netlify.app preview-mirror een
     noindex (productie draait op het custom domein montisoro.com → ongemoeid).
     Voorkomt duplicate-content/indexering van de mirror naast canonical. */
  try{
    if(/\.netlify\.app$/i.test(location.hostname||'')){
      if(!document.querySelector('meta[data-staging-noindex]')){
        var m=document.createElement('meta');
        m.name='robots'; m.content='noindex, nofollow';
        m.setAttribute('data-staging-noindex','1');
        (document.head||document.documentElement).appendChild(m);
      }
    }
  }catch(e){}
})();

(function(){
  'use strict';
  var mq = window.matchMedia('(min-width:1181px)');
  function place(){
    var nav = document.getElementById('mNav') || document.querySelector('.m-nav');
    if(!nav) return false;
    var pill = nav.querySelector('.m-nav-links');
    if(!pill) return false;
    var lang = nav.querySelector('li.m-lang');
    if(!lang) return false;                        // nog niet geïnjecteerd
    if(mq.matches){
      if(lang.parentElement !== nav) nav.appendChild(lang);   // buiten de pil
      lang.classList.add('ms-lang-out');
    } else {
      if(lang.parentElement !== pill) pill.appendChild(lang); // terug in de pil (mobiel menu)
      lang.classList.remove('ms-lang-out');
    }
    return true;
  }
  function start(){
    if(!place()){
      var tries = 0;
      var iv = setInterval(function(){ if(place() || ++tries > 50) clearInterval(iv); }, 80);
    }
    (mq.addEventListener ? mq.addEventListener('change', place) : mq.addListener(place));
    window.addEventListener('resize', place);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  /* ── Contrast-bewaking: maak logo + EN zwart zodra de achtergrond áchter de
     nav licht/wit is (anders onzichtbaar wit-op-wit). ── */
  function luminance(c){
    var m = c.match(/rgba?\(([^)]+)\)/); if(!m) return null;
    var p = m[1].split(',').map(parseFloat);
    if(p.length>=4 && p[3]===0) return null;              // transparant → negeer
    return (0.299*p[0] + 0.587*p[1] + 0.114*p[2]) / 255;  // 0=zwart 1=wit
  }
  function bgUnderNav(){
    var nav = document.getElementById('mNav') || document.querySelector('.m-nav');
    if(!nav) return;
    var r = nav.getBoundingClientRect();
    var x = Math.round(r.left + r.width/2), y = Math.round(r.bottom + 8);
    var els = document.elementsFromPoint(x, y) || [];
    for(var i=0;i<els.length;i++){
      if(nav.contains(els[i])) continue;
      var lum = luminance(getComputedStyle(els[i]).backgroundColor);
      if(lum !== null){ document.body.classList.toggle('ms-nav-light', lum > 0.6); return; }
    }
    document.body.classList.remove('ms-nav-light');       // niets gevonden → donker (default)
  }
  var raf;
  function onScrollBg(){ if(raf) return; raf = requestAnimationFrame(function(){ raf=0; bgUnderNav(); }); }
  window.addEventListener('scroll', onScrollBg, { passive:true });
  window.addEventListener('resize', onScrollBg);
  window.addEventListener('load', bgUnderNav);
  bgUnderNav();
})();

/* ═══════════════════════════════════════════════════════════════════
   WCAG 2.4.1 — skip-link + <main> landmark (centraal, alle pagina's).
   Verplaatst de inhoud tussen nav en footer in één <main id="ms-content">.
   Knooppunten verplaatsen behoudt listeners + IntersectionObservers.
   Veilige terugval: lukt het wrappen niet, dan markeert het de hero.
═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  function run(){
    if (document.getElementById('ms-skip')) return;
    var EN = (document.documentElement.lang||'').toLowerCase().indexOf('en')===0;
    var skip = document.createElement('a');
    skip.id='ms-skip'; skip.className='ms-skip'; skip.href='#ms-content';
    skip.textContent = EN ? 'Skip to content' : 'Naar inhoud';
    document.body.insertBefore(skip, document.body.firstChild);

    if (document.getElementById('ms-content')) return;
    var existing = document.querySelector('main');
    if (existing){ existing.id = existing.id||'ms-content'; existing.setAttribute('tabindex','-1'); skip.href='#'+existing.id; return; }

    var nav = document.getElementById('mNav') || document.querySelector('.m-nav');
    var footer = document.querySelector('.ms-footer') || document.querySelector('.m-footer') || document.querySelector('footer');
    if (nav && footer && nav.parentElement===document.body && footer.parentElement===document.body){
      var main = document.createElement('main');
      main.id='ms-content'; main.setAttribute('tabindex','-1');
      document.body.insertBefore(main, nav.nextSibling);
      var node = main.nextSibling;
      while(node && node !== footer){ var next = node.nextSibling; main.appendChild(node); node = next; }
    } else {
      var hero = document.querySelector('header.hero, .hero-statement, .ms-dark-hero header, section.hero');
      if (hero){ hero.id = hero.id||'ms-content'; hero.setAttribute('tabindex','-1'); hero.setAttribute('role','main'); skip.href='#'+hero.id; }
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

/* ═══════════════════════════════════════════════════════════════════
   LAUNCH-POLISH 9,5+ — a11y finishing (centraal, alle pagina's).
   • Nav-landmark een toegankelijke naam geven (WCAG 1.3.1 / 2.4.1).
   • Decoratieve icon-font-glyphs (<i class="ph…">) verbergen voor
     schermlezers, tenzij ze al een rol/label dragen — voorkomt dat
     screenreaders privé-gebruiktekens ("") voorlezen.
   • LCP-hint: nav-logo krijgt fetchpriority=high (blijft eager).
═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  function polish(){
    var EN = (document.documentElement.lang||'').toLowerCase().indexOf('en')===0;
    var nav = document.getElementById('mNav') || document.querySelector('.m-nav');
    if(nav && !nav.getAttribute('aria-label')) nav.setAttribute('aria-label', EN ? 'Main navigation' : 'Hoofdnavigatie');
    try{
      document.querySelectorAll('i.ph,i.ph-light,i.ph-regular,i.ph-fill,i.ph-bold,i[class*="ph-"]').forEach(function(i){
        if(!i.hasAttribute('aria-hidden') && i.getAttribute('role')!=='img' && !i.getAttribute('aria-label')){
          i.setAttribute('aria-hidden','true');
        }
      });
    }catch(e){}
    var logo = nav && nav.querySelector('.m-nav-logo img');
    if(logo && !logo.getAttribute('fetchpriority')){ logo.setAttribute('fetchpriority','high'); logo.setAttribute('decoding','async'); }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', polish);
  else polish();
})();
