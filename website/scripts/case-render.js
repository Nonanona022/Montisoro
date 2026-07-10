/* Montisoro — case-render.js
   Rendert een volledige case-detailpagina (hero → quote) uit window.MONTISORO_CASES.
   De shell-pagina bevat <main id="cs2-root" data-slug="..." data-lang="nl|en"></main>;
   dit script vult die met exact dezelfde markup/classes als de statische pagina's,
   zodat de bestaande CSS + scroll-engine ongewijzigd blijven werken.
   Titelvelden: *tekst* → <em>tekst</em> (oranje serif-accent). */
(function(){
  var root = document.getElementById('cs2-root');
  if (!root) return;
  var qs = new URLSearchParams(location.search);
  var slug = root.getAttribute('data-slug') || qs.get('c') || '';
  var lang = (root.getAttribute('data-lang') || (/-en\.html/.test(location.pathname) ? 'en' : 'nl')) === 'en' ? 'en' : 'nl';
  var cases = window.MONTISORO_CASES || [];
  var c = cases.filter(function(x){ return x.slug === slug; })[0];
  if (!c){
    if (root.hasAttribute('data-generic')){
      root.innerHTML = '<section class="chapter dark" style="padding-top:clamp(128px,17vh,188px) !important;min-height:60vh;"><div class="chapter-inner"><a class="case-back" href="' + (lang==='en'?'Referentie-en.html':'Referentie.html') + '"><span aria-hidden="true">\u2190</span> ' + (lang==='en'?'All references':'Alle referenties') + '</a><h1 class="title h-large on-dark">' + (lang==='en'?'Reference not found':'Referentie niet gevonden') + '</h1><p class="cs2-hero-sum">' + (lang==='en'?'This case is unavailable. Return to the references overview.':'Deze case is niet beschikbaar. Ga terug naar het referentie-overzicht.') + '</p></div></section>';
    }
    return;
  }

  if (!document.getElementById('cs2-img-fill')){
    var st = document.createElement('style'); st.id = 'cs2-img-fill';
    st.textContent = '.cs2-photo img,.cs2-quote-photo img{width:100%;height:100%;object-fit:cover;display:block;}';
    document.head.appendChild(st);
  }

  function esc(s){ var d = document.createElement('div'); d.textContent = (s==null?'':String(s)); return d.innerHTML; }
  function emph(s){ return esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>'); }
  function L(nl, en){ return lang === 'en' ? en : nl; }
  function f(key){ return c[key + '_' + lang]; }
  function plain(s){ return String(s||'').replace(/\*/g, ''); }

  // Generieke pagina: kop/canonical/og dynamisch uit de case
  if (root.hasAttribute('data-generic')){
    var pageFile = (lang==='en' ? 'case-en.html' : 'case.html') + '?c=' + encodeURIComponent(slug);
    var baseUrl = 'https://montisoro.com/' + pageFile;
    var t = plain(f('hero_title')) + ' \u2014 Montisoro';
    document.title = t;
    document.documentElement.lang = (lang==='en'?'en':'nl');
    function setMeta(sel, attr, val){ var e=document.querySelector(sel); if(e) e.setAttribute(attr, val); }
    setMeta('link[rel="canonical"]','href', baseUrl);
    setMeta('meta[name="description"]','content', plain(f('hero_sum')).slice(0,158));
    setMeta('meta[property="og:title"]','content', t);
    setMeta('meta[property="og:description"]','content', plain(f('hero_sum')).slice(0,158));
    setMeta('meta[property="og:url"]','content', baseUrl);
    setMeta('meta[name="twitter:title"]','content', t);
    setMeta('meta[name="twitter:description"]','content', plain(f('hero_sum')).slice(0,158));
  }

  var T = {
    back:     L('\u2190 Alle referenties', '\u2190 All references'),
    about:    L('Over het bedrijf', 'About the company'),
    kSector:  L('Sector', 'Sector'),
    kFoot:    L('Footprint', 'Footprint'),
    kScope:   L('Scope', 'Scope'),
    kTech:    L('Technologie', 'Technology'),
    challenge:L('De uitdaging', 'The challenge'),
    approach: L('Onze aanpak', 'Our approach'),
    results:  L('De resultaten', 'The results'),
    glance:   L('Project in \u00e9\u00e9n oogopslag', 'Project at a glance'),
    photoAbout: L('Sleep hier een sfeerfoto', 'Drop an ambiance photo'),
    lbAbout:  L('02 Over het bedrijf', '02 About the company'),
    lbCa:     L('03 Uitdaging & aanpak', '03 Challenge & approach'),
    lbRes:    L('04 Resultaten', '04 Results'),
    lbGla:    L('05 In \u00e9\u00e9n oogopslag', '05 At a glance'),
    lbQuote:  L('06 Klantreactie', '06 Testimonial'),
    resNote:  L('Cijfers gemeten op klantdata (Storm-platform), ten opzichte van de nulmeting bij aanvang van de samenwerking.', 'Figures measured on client data (Storm platform), versus the baseline at the start of the engagement.')
  };

  function footprint(){
    if (c.foot_loc && c.foot_mdw){
      return esc(c.foot_loc) + ' ' + L('locaties', 'locations') + ' \u00b7 ' + esc(c.foot_mdw) + ' ' + L('medewerkers', 'employees');
    }
    return esc(f('foot_txt') || '');
  }
  function backHref(){ return lang === 'en' ? 'Referentie-en.html' : 'Referentie.html'; }
  function photo(id, cls, shape, radius, placeholder, val){
    if (val){ return '<div class="' + cls + '"><img src="' + esc(val) + '" alt=""></div>'; }
    var attr = 'id="' + esc(c.slug + '-' + id) + '" shape="' + shape + '"' + (radius ? ' radius="' + radius + '"' : '') + ' placeholder="' + esc(placeholder) + '"';
    return '<div class="' + cls + '"><image-slot ' + attr + '></image-slot></div>';
  }

  var chal = f('chal') || [], appr = f('appr') || [];
  var html = '';

  /* 01 HERO */
  html += '<section class="chapter dark" data-screen-label="01 Hero" style="padding-top:clamp(128px,17vh,188px) !important;">' +
    '<div class="chapter-inner">' +
      '<a class="case-back" href="' + backHref() + '"><span aria-hidden="true">\u2190</span> ' + L('Alle referenties','All references') + '</a>' +
      (c.logo ? '<img class="cs2-hero-logo" src="' + esc(c.logo) + '" alt="' + esc(c.company) + '">' : '') +
      '<span class="eyebrow on-dark">' + esc(f('eyebrow') || f('fact_sector') || c.sector || '') + '</span>' +
      '<h1 class="title h-large on-dark">' + emph(f('hero_title')) + '</h1>' +
      '<p class="cs2-hero-sum">' + esc(f('hero_sum')) + '</p>' +
    '</div></section>';

  /* 02 OVER HET BEDRIJF */
  html += '<section class="chapter light" data-screen-label="' + esc(T.lbAbout) + '">' +
    '<div class="chapter-inner">' +
      '<span class="eyebrow on-light">' + T.about + '</span>' +
      '<h2 class="title h-section on-light">' + emph(f('about_title')) + '</h2>' +
      '<div class="cs2-about">' +
        '<div class="cs2-facts">' +
          '<div class="cs2-fact"><div><div class="cs2-fact-k">' + T.kSector + '</div><div class="cs2-fact-v">' + esc(f('fact_sector')) + '</div></div></div>' +
          '<div class="cs2-fact"><div><div class="cs2-fact-k">' + T.kFoot + '</div><div class="cs2-fact-v">' + footprint() + '</div></div></div>' +
          '<div class="cs2-fact"><div><div class="cs2-fact-k">' + T.kScope + '</div><div class="cs2-fact-v">' + esc(f('fact_scope')) + '</div></div></div>' +
          '<div class="cs2-fact"><div><div class="cs2-fact-k">' + T.kTech + '</div><div class="cs2-fact-v">SaaS-platform ' + esc(c.tech || '') + '</div></div></div>' +
        '</div>' +
        '<div class="cs2-photo rv">' + photoInner('about', 'rounded', 16, T.photoAbout, c.photo_about) + '</div>' +
      '</div>' +
    '</div></section>';

  /* 03 UITDAGING & AANPAK */
  var hasApprPhoto = c.photo_approach !== 'none';
  html += '<section class="chapter light" data-screen-label="' + esc(T.lbCa) + '" style="background:var(--bg-card);">' +
    '<div class="chapter-inner"><div class="cs2-ca3' + (hasApprPhoto ? '' : ' cs2-ca3-2col') + '">' +
      '<div>' +
        '<span class="eyebrow on-light">' + T.challenge + '</span>' +
        '<h2 class="title h-section on-light">' + emph(f('chal_title')) + '</h2>' +
        '<ul class="cs2-list">' + chal.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '</div>' +
      (hasApprPhoto ? '<div class="cs2-ca-photo-col rv">' + photoInner('approach', 'rounded', 16, T.photoAbout, c.photo_approach) + '</div>' : '') +
      '<div>' +
        '<span class="eyebrow on-light">' + T.approach + '</span>' +
        '<h2 class="title h-section on-light">' + emph(f('appr_title')) + '</h2>' +
        '<ol class="cs2-steps">' + appr.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      '</div>' +
    '</div></div></section>';

  /* 04 RESULTATEN */
  var results = c.results || [];
  html += '<section class="chapter light" data-screen-label="' + esc(T.lbRes) + '">' +
    '<div class="chapter-inner">' +
      '<span class="eyebrow on-light">' + T.results + '</span>' +
      '<h2 class="title h-section on-light">' + emph(f('res_title')) + '</h2>' +
      '<div class="cs2-results">' + results.map(function(r, i){
        var d = i === 0 ? '' : ' style="--d:' + (i*80) + 'ms"';
        var num = ('0' + (i+1)).slice(-2);
        return '<div class="cs2-rcard rv"' + d + '><div class="cs2-rcard-num">' + num + '</div><h3>' + esc(L(r.t_nl, r.t_en)) + '</h3><p>' + esc(L(r.d_nl, r.d_en)) + '</p></div>';
      }).join('') + '</div>' +
      (results.length ? '<p class="cs2-res-note" style="margin-top:22px;font-size:12px;line-height:1.5;color:#6b7280;max-width:56ch;">' + T.resNote + '</p>' : '') +
    '</div></section>';

  /* 05 IN \u00c9\u00c9N OOGOPSLAG */
  var glance = c.glance || [];
  html += '<section class="chapter light" data-screen-label="' + esc(T.lbGla) + '">' +
    '<div class="chapter-inner"><div class="cs2-glance-band">' +
      '<span class="eyebrow on-light">' + T.glance + '</span>' +
      (f('glance_sub') ? '<h2 class="title h-section on-light" style="font-size:clamp(21px,2.3vw,28px);margin-top:14px;">' + emph(f('glance_sub')) + '</h2>' : '') +
      '<div class="cs2-glance">' + glance.map(function(g, i){
        var gt = (lang === 'en' ? ['Challenge','Approach','Result','Duration'] : ['Uitdaging','Aanpak','Resultaat','Duur'])[i] || L(g.t_nl, g.t_en);
        return '<div class="cs2-gcell"><h3>' + esc(gt) + '</h3><p>' + esc(L(g.d_nl, g.d_en)) + '</p></div>';
      }).join('') + '</div>' +
    '</div></div></section>';

  /* 06 KLANTREACTIE — optioneel: alleen tonen als er een citaat is */
  if (f('quote')){
    var qname = esc(c.quote_name || f('quote_name') || '');
    var qrole = esc(f('quote_role') || '');
    var qco = qrole ? qrole + ' \u00b7 ' + esc(c.company) : esc(c.company);
    var qphoto = c.quote_photo ? '<div class="cs2-quote-photo"><img src="' + esc(c.quote_photo) + '" alt=""></div>' : '';
    html += '<section class="chapter light" data-screen-label="' + esc(T.lbQuote) + '">' +
      '<div class="chapter-inner"><div class="cs2-quote' + (qphoto ? '' : ' cs2-quote-nophoto') + '">' +
        '<div><div class="cs2-quote-mark">\u201c</div><p class="cs2-quote-txt">' + esc(f('quote')) + '</p></div>' +
        '<div class="cs2-quote-author">' +
          qphoto +
          '<div>' + (qname ? '<div class="cs2-quote-name">' + qname + '</div>' : '') + '<div class="cs2-quote-co">' + qco + '</div></div>' +
        '</div>' +
      '</div></div></section>';
  }

  root.innerHTML = html;

  function photoInner(id, shape, radius, placeholder, val, wrapCls){
    // returns the inner element(s) for a photo container; caller wraps except quote
    if (wrapCls){
      if (val){ return '<div class="' + wrapCls + '"><img src="' + esc(val) + '" alt=""></div>'; }
      return '<div class="' + wrapCls + '"><image-slot id="' + esc(c.slug + '-' + id) + '" shape="' + shape + '" placeholder="' + esc(placeholder) + '"></image-slot></div>';
    }
    if (val){ return '<img src="' + esc(val) + '" alt="">'; }
    var attr = 'id="' + esc(c.slug + '-' + id) + '" shape="' + shape + '"' + (radius ? ' radius="' + radius + '"' : '') + ' placeholder="' + esc(placeholder) + '"';
    return '<image-slot ' + attr + '></image-slot>';
  }
})();
