/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — "Klantenquotes" module (Home testimonials CRUD)
   Same data shape as /website/data/testimonials.js:
     { id, company, logo, role_nl, role_en, quote_nl, quote_en, pdf, order, active }
   Export regenerates that file (until a live backend writes it directly).
═══════════════════════════════════════════════════════════════════ */
window.initTestimonials = function(DATA, $, $$, esc, openDrawer, closeDrawer, drawer, drawerBackdrop, showToast){
  var grid = $('#testimonials-grid');
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  if (!grid) return;

  /* Beschikbare logo's in /website/assets/logos/ (site-relatief pad als waarde).
     Worden wit/monochroom getoond op de donkere testimonial-band. */
  var LOGOS = [
    { v:'', l:'\u2014 Geen logo (toon bedrijfsnaam) \u2014' },
    { v:'../assets/logos/volvo.svg', l:'Volvo' },
    { v:'../assets/logos/alcon.svg', l:'Alcon' },
    { v:'../assets/logos/novartis.png', l:'Novartis' },
    { v:'../assets/logos/axa.png', l:'AXA' },
    { v:'../assets/logos/securitas.png', l:'Securitas' },
    { v:'../assets/logos/vaillant.png', l:'Vaillant' },
    { v:'../assets/logos/lonza.svg', l:'Lonza' },
    { v:'../assets/logos/lyondellbasell.png', l:'LyondellBasell' },
    { v:'../assets/logos/rockwool.png', l:'Rockwool' },
    { v:'../assets/logos/rockfon.png', l:'Rockfon' },
    { v:'../assets/logos/emeis.png', l:'Emeis' },
    { v:'../assets/logos/hb.png', l:'HB Accountants' },
    { v:'../assets/logos/legend.png', l:'Legend Biotech' },
    { v:'../assets/logos/howden.png', l:'Howden' },
    { v:'../assets/logos/ams.png', l:'AMS' },
    { v:'../assets/logos/feneko.png', l:'Feneko' },
    { v:'../assets/logos/sortimo.png', l:'Sortimo' },
    { v:'../assets/logos/vanbreda.png', l:'Van Breda Risk & Benefits' }
  ];
  /* Site-relatief pad (../assets/...) -> bruikbaar pad vanuit de admin-pagina. */
  function adminLogoSrc(v){ return v ? String(v).replace('../assets/', '../../website/assets/') : ''; }
  /* Donkere preview-swatch met wit logo (zoals op de site). */
  function logoPreview(v){
    if (!v) return '';
    return '<div class="tm-logo-box"><img class="tm-logo-img" src="' + esc(adminLogoSrc(v)) + '" alt=""></div>';
  }

  DATA.testimonials = DATA.testimonials || [];
  function byOrder(a,b){ return (a.order||0)-(b.order||0); }
  DATA.testimonials_section = DATA.testimonials_section || { enabled:true };
  var togWrap = document.getElementById('tm-section-toggle');
  if(!togWrap){ togWrap=document.createElement('div'); togWrap.id='tm-section-toggle'; grid.parentNode.insertBefore(togWrap, grid); }
  (function renderToggle(){
    var on = DATA.testimonials_section.enabled !== false;
    togWrap.innerHTML = '<div class="panel tm-toolbar">' +
      '<div><div class="tm-h15">Sectie “Wat onze klanten zeggen”</div><div class="tm-sub">' + (on?'Staat <b class="u-c-good">online</b> op de homepage.':'Staat <b class="u-c-amber">offline</b> — niet zichtbaar op de site.') + '</div></div>' +
      '<label class="tm-toggle-label"><input class="tm-check" type="checkbox" id="tm-sec-on" ' + (on?'checked':'') + '><span class="tm-t13b">' + mtT('tm_show_online') + '</span></label>' +
    '</div>';
    var cb=document.getElementById('tm-sec-on');
    if(cb) cb.onchange=function(){ DATA.testimonials_section.enabled = cb.checked; window.AdminData.save(DATA); renderToggle(); showToast(cb.checked?mtT('toast_section_online'):mtT('toast_section_offline')); };
  })();
  var list = DATA.testimonials.slice().sort(byOrder);

  grid.innerHTML = list.map(function(c, i){
    var badge = c.active !== false
      ? '<span class="tag new"><i class="ti ti-circle-filled a-ico8"></i>Actief</span>'
      : '<span class="tag wait"><i class="ti ti-eye-off a-ico11"></i>Verborgen</span>';
    var todo = /wordt aangevuld|to be added/i.test(c.quote_nl||'') ? '<span class="tag wait tm-tag-amber"><i class="ti ti-pencil a-ico10"></i>Placeholder</span>' : '';
    return '<div class="panel cs-case-card' + (c.active!==false?'':' is-off') + '">' +
      '<div class="tm-badges">' + todo + badge + '</div>' +
      '<div class="cs-card-logo">' + (c.logo ? '<div class="tm-logo-chip"><img class="tm-logo-chip-img" src="' + esc(adminLogoSrc(c.logo)) + '" alt=""></div>' : '') + '<div class="tm-logo-name">' + esc(c.company || mtT('ui_unnamed')) + '</div><div class="tm-title">' + esc(c.role_nl||'') + '</div>' + (c.pdf ? '<div class="tm-more"><i class="ti ti-file-download u-mr-4"></i>Case-PDF</div>' : '') + '</div>' +
      '<div class="tm-quote">\u201C' + esc((c.quote_nl||'').slice(0,90)) + ((c.quote_nl||'').length>90?'…':'') + '\u201D</div>' +
      '<div class="cs-cardfoot">' +
        '<button class="btn btn-ghost btn-sm" data-tm-up="' + esc(c.id) + '"' + (i===0?' disabled':'') + ' title="Omhoog"><i class="ti ti-arrow-up"></i></button>' +
        '<button class="btn btn-ghost btn-sm" data-tm-down="' + esc(c.id) + '"' + (i===list.length-1?' disabled':'') + ' title="Omlaag"><i class="ti ti-arrow-down"></i></button>' +
        '<button class="btn btn-ghost btn-md is-grow" data-tm-edit="' + esc(c.id) + '"><i class="ti ti-edit"></i>' + mtT('act_edit') + '</button>' +
      '</div>' +
    '</div>';
  }).join('');

  $$('[data-tm-edit]').forEach(function(b){ b.onclick = function(){ openEditor(b.dataset.tmEdit); }; });
  $$('[data-tm-up]').forEach(function(b){ b.onclick = function(){ move(b.dataset.tmUp, -1); }; });
  $$('[data-tm-down]').forEach(function(b){ b.onclick = function(){ move(b.dataset.tmDown, 1); }; });

  var addBtn = $('#testimonials-add-btn'); if (addBtn) addBtn.onclick = function(){ openEditor(null); };
  var prev = $('#testimonials-preview'); if (prev) prev.onclick = function(){ window.open(((window.SITE_URL||'../../website/pages').replace(/\/$/,'')) + '/Home.html', '_blank', 'noopener'); };
  var exp = $('#testimonials-export'); if (exp) exp.onclick = exportFile;
  /* KRITIEK #1 — write-bridge */
  var pub = $('#testimonials-publish');
  if (pub) pub.onclick = function(){
    if (window.publishToSite) {
      pub.disabled = true; pub.textContent = mtT('btn_publishing');
      var byOrd = function(a,b){ return (a.order||0)-(b.order||0); };
      window.publishToSite('testimonials', DATA.testimonials.slice().sort(byOrd), function(){
        pub.disabled = false; pub.innerHTML = '<i class="ti ti-cloud-upload"></i> ' + mtT('btn_publish');
      });
    }
  };

  function reindex(){ DATA.testimonials.sort(byOrder).forEach(function(c,i){ c.order = i+1; }); }
  function move(id, dir){
    DATA.testimonials.sort(byOrder);
    var idx = DATA.testimonials.findIndex(function(x){ return x.id===id; });
    var j = idx + dir; if (idx<0 || j<0 || j>=DATA.testimonials.length) return;
    var t = DATA.testimonials[idx]; DATA.testimonials[idx] = DATA.testimonials[j]; DATA.testimonials[j] = t;
    reindex(); window.AdminData.save(DATA); window.init_testimonials();
  }

  function exportFile(){
    reindex();
    var rows = DATA.testimonials.slice().sort(byOrder).map(function(c){
      return '  { id:' + JSON.stringify(c.id||'') + ', company:' + JSON.stringify(c.company||'') + ', logo:' + JSON.stringify(c.logo||'') + ', role_nl:' + JSON.stringify(c.role_nl||'') + ', role_en:' + JSON.stringify(c.role_en||'') +
        ', quote_nl:' + JSON.stringify(c.quote_nl||'') + ', quote_en:' + JSON.stringify(c.quote_en||'') + ', pdf:' + JSON.stringify(c.pdf||'') + ', order:' + (c.order||0) + ', active:' + (c.active!==false) + ' }';
    }).join(',\n');
    var secOn = (DATA.testimonials_section && DATA.testimonials_section.enabled !== false);
    var file = '/* Montisoro — Testimonials · single source of truth.\n' +
      '   Gegenereerd door het admin panel op ' + new Date().toISOString() + '.\n' +
      '   Plaats dit bestand in /website/data/testimonials.js */\n' +
      'window.MONTISORO_TESTIMONIALS_SECTION = { enabled: ' + secOn + ' };\n' +
      'window.MONTISORO_TESTIMONIALS = [\n' + rows + '\n];\n';
    var blob = new Blob([file], { type:'application/javascript' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'testimonials.js';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
    showToast(mtT('toast_exported_testimonials'), 'download');
  }

  function openEditor(id){
    var isNew = (id === null);
    var c = isNew ? { id:'tm-new', company:'', logo:'', role_nl:'', role_en:'', quote_nl:'', quote_en:'', pdf:'', order:99, active:true }
                  : DATA.testimonials.find(function(x){ return x.id===id; });
    if (!c) return;

    function html(){
      return '<div class="drawer-head"><div><div class="eyebrow">' + (isNew?mtT('tm_add'):mtT('tm_edit')) + '</div><h3>' + esc(isNew?mtT('tm_new'):c.company) + '</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
        '<div class="drawer-body">' +
          '<div class="drawer-section-label is-first"><i class="ti ti-building u-mr-6"></i>' + mtT('tm_company_role') + '</div>' +
          '<div class="field"><label>' + mtT('tm_company') + '</label><input id="tm-company" value="' + esc(c.company) + '" placeholder="Bijv. Volvo Group"></div>' +
          '<div class="field"><label>' + mtT('tm_role_nl') + '</label><input id="tm-role-nl" value="' + esc(c.role_nl) + '" placeholder="'+mtT('tm_ph_role_nl')+'"></div>' +
          '<div class="field"><label>' + mtT('tm_role_en') + '</label><input id="tm-role-en" value="' + esc(c.role_en) + '" placeholder="'+mtT('tm_ph_role_en')+'"></div>' +
          '<div class="drawer-section-label"><i class="ti ti-photo u-mr-6"></i>' + mtT('ui_logo') + '</div>' +
          '<div class="field"><label>Bedrijfslogo <span class="a-note">· vervangt de naam op de kaart</span></label><select class="a-select10 is-full" id="tm-logo">' + LOGOS.map(function(o){ return '<option value="' + esc(o.v) + '"' + ((o.v===(c.logo||''))?' selected':'') + '>' + esc(o.l) + '</option>'; }).join('') + '</select><div class="hint">Wordt wit/monochroom getoond, net als de “Vertrouwd door”-strip. Geen passend logo? Voeg het bestand toe in <code>/website/assets/logos/</code>.</div></div>' +
          '<div id="tm-logo-preview">' + logoPreview(c.logo) + '</div>' +
          '<div class="drawer-section-label"><i class="ti ti-quote u-mr-6"></i>' + mtT('tm_quote') + '</div>' +
          '<div class="field"><label>Uitleg (NL) <span class="a-note">· max ~160 tekens · toont op Home én Referentie</span></label><textarea class="cs-textarea" id="tm-quote-nl" rows="3" maxlength="160" data-maxlines="4">' + esc(c.quote_nl) + '</textarea></div>' +
          '<div class="field"><label>Uitleg (EN) <span class="a-note">· max ~160 chars · shows on Home & References</span></label><textarea class="cs-textarea" id="tm-quote-en" rows="3" maxlength="160" data-maxlines="4">' + esc(c.quote_en) + '</textarea></div>' +
          '<div class="drawer-section-label"><i class="ti ti-file-download u-mr-6"></i>Case-PDF</div>' +
          '<div class="field">' + (c.pdf ? '<div class="tm-ok-banner"><i class="ti ti-file-text a-ico-org16"></i><b class="u-fw-600">PDF ingesteld</b><button class="btn btn-ghost cs-b3" data-pdf-clear><i class="ti ti-trash"></i></button></div>' : '') + '<label>Upload PDF (optioneel)</label><input class="a-select10" type="file" id="tm-pdf" accept="application/pdf"><div class="hint">Toont een “Download de case”-knop op de kaart. Max 4 MB.</div></div>' +
          '<div class="drawer-section-label"><i class="ti ti-toggle-right u-mr-6"></i>' + mtT('ui_visibility') + '</div>' +
          '<label class="cs-check-card"><input class="cs-check-lg" type="checkbox" id="tm-active" ' + (c.active!==false?'checked':'') + '><div><div class="a-val-b">Actief tonen</div><div class="a-caption">Uitvinken verbergt de quote zonder data te verliezen.</div></div></label>' +
          '<div class="help-banner u-mt-22"><i class="ti ti-info-circle"></i><p>Na wijzigingen: klik op het overzicht op <b>Exporteer testimonials.js</b> en plaats het bestand in <code>/website/data/</code>.</p></div>' +
        '</div>' +
        '<div class="drawer-foot">' +
          '<button class="btn btn-primary" data-save><i class="ti ti-check"></i>' + (isNew?mtT('act_add'):mtT('act_save')) + '</button>' +
          '<button class="btn btn-ghost" data-close><i class="ti ti-x"></i>Annuleer</button>' +
          (isNew ? '' : '<button class="btn btn-ghost is-danger u-ml-auto" data-delete><i class="ti ti-trash"></i>Verwijder</button>') +
        '</div>';
    }
    function sync(){
      var g = function(s){ var e = drawer.querySelector(s); return e ? e.value : undefined; };
      if (g('#tm-company')!==undefined) c.company = g('#tm-company');
      if (g('#tm-role-nl')!==undefined) c.role_nl = g('#tm-role-nl');
      if (g('#tm-role-en')!==undefined) c.role_en = g('#tm-role-en');
      if (g('#tm-quote-nl')!==undefined) c.quote_nl = g('#tm-quote-nl');
      if (g('#tm-quote-en')!==undefined) c.quote_en = g('#tm-quote-en');
      if (g('#tm-logo')!==undefined) c.logo = g('#tm-logo');
      var a = drawer.querySelector('#tm-active'); if (a) c.active = a.checked;
    }
    function wire(){
      drawer.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', closeDrawer); });
      // Logo-select: live preview bijwerken
      var lg = drawer.querySelector('#tm-logo');
      if (lg) lg.addEventListener('change', function(){ c.logo = lg.value; var pv = drawer.querySelector('#tm-logo-preview'); if (pv) pv.innerHTML = logoPreview(c.logo); });
      // Max 3 regels afdwingen op de citaat-velden
      drawer.querySelectorAll('textarea[data-maxlines]').forEach(function(ta){
        var max = parseInt(ta.getAttribute('data-maxlines'),10) || 3;
        function clamp(){ var lines = ta.value.split('\n'); if (lines.length > max){ ta.value = lines.slice(0, max).join('\n'); } }
        ta.addEventListener('keydown', function(e){ if (e.key==='Enter' && ta.value.split('\n').length >= max){ e.preventDefault(); } });
        ta.addEventListener('input', clamp);
      });
      // Case-PDF upload
      var pf = drawer.querySelector('#tm-pdf');
      if (pf) pf.addEventListener('change', function(e){
        var f = e.target.files[0]; if (!f) return;
        if (f.size > 4*1024*1024){ showToast(mtT('toast_pdf_too_big_4'), 'alert-triangle'); return; }
        var r = new FileReader();
        r.onload = function(ev){ sync(); c.pdf = ev.target.result; drawer.innerHTML = html(); wire(); showToast(mtT('toast_pdf_added'), 'file-text'); };
        r.readAsDataURL(f);
      });
      var pclr = drawer.querySelector('[data-pdf-clear]');
      if (pclr) pclr.addEventListener('click', function(){ sync(); c.pdf=''; drawer.innerHTML = html(); wire(); });
      drawer.querySelector('[data-save]').addEventListener('click', function(){
        sync();
        if (!c.company){ showToast(mtT('toast_company_required'), 'alert-triangle'); return; }
        if (isNew){ c.id = 'tm-' + Date.now(); c.order = (DATA.testimonials.length + 1); DATA.testimonials.push(c); }
        window.AdminData.save(DATA); closeDrawer(); showToast(isNew ? c.company + mtT('toast_added') : mtT('toast_changes_saved')); window.init_testimonials();
      });
      var del = drawer.querySelector('[data-delete]');
      if (del) del.addEventListener('click', function(){
        window.Admin.confirmDelete({ name:c.company }).then(function(ok){
          if (!ok) return;
          var i = DATA.testimonials.findIndex(function(x){ return x.id===c.id; });
          var removed = DATA.testimonials[i];
          DATA.testimonials = DATA.testimonials.filter(function(x){ return x.id!==c.id; });
          window.AdminData.save(DATA); closeDrawer(); window.init_testimonials();
          window.Admin.undoToast(c.company + mtT('ui_deleted_suffix'), function(){
            DATA.testimonials.splice(i<0?0:i, 0, removed); window.AdminData.save(DATA); window.init_testimonials(); window.Admin.showToast(c.company + mtT('toast_restored'));
          });
        });
      });
    }
    drawer.innerHTML = html();
    drawer.classList.add('is-open');
    drawerBackdrop.classList.add('is-open');
    wire();
  }
};
