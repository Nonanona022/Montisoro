/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin, "Referenties" module (case-detailpagina's CRUD)
   Beheert de volledige case-pagina van banner tot quote.
   Datavorm (DATA.cases[]), één case:
   { id, slug, order, active, company, sector, logo,
     hero_title_nl/en, card_nl/en, hero_sum_nl/en,
     about_title_nl/en, fact_sector_nl/en, fact_scope_nl/en,
     foot_loc, foot_mdw, tech,                         // footprint getallen + platform
     photo_about, photo_approach, quote_photo,          // data-URL of ''
     chal_title_nl/en, chal_nl[], chal_en[],            // max 5
     appr_title_nl/en, appr_nl[], appr_en[],            // max 6
     res_title_nl/en, results[]{t_nl,t_en,d_nl,d_en},   // max 5 · d ≤70
     glance[]{t_nl,t_en,d_nl,d_en},                     // 4 · d ≤80
     quote_nl/en, quote_role_nl/en }
   Export → cases.js (single source, tot een backend het rechtstreeks schrijft).
═══════════════════════════════════════════════════════════════════ */
window.initCases = function(DATA, $, $$, esc, openDrawer, closeDrawer, drawer, drawerBackdrop, showToast){
  var grid = $('#cases-grid');
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  if (!grid) return;

  var LOGOS = [
    { v:'', l:'\u2014 Geen logo (toon bedrijfsnaam) \u2014' },
    { v:'../assets/logos/volvo.svg', l:'Volvo' },
    { v:'../assets/logos/alcon.svg', l:'Alcon' },
    { v:'../assets/logos/lonza.svg', l:'Lonza' },
    { v:'../assets/logos/novartis.png', l:'Novartis' },
    { v:'../assets/logos/axa.png', l:'AXA' },
    { v:'../assets/logos/securitas.png', l:'Securitas' },
    { v:'../assets/logos/vaillant.png', l:'Vaillant' }
  ];
  var TECHS = ['Storm','Casey'];
  function adminLogoSrc(v){ return v ? String(v).replace('../assets/', '../../website/assets/') : ''; }
  function logoPreview(v){
    if (!v) return '';
    return '<div class="cs-logo-box"><img class="cs-logo-img" src="' + esc(adminLogoSrc(v)) + '" alt=""></div>';
  }

  /* ── Seed: de 3 bestaande cases (illustratieve blokken bewust gedeeld) ── */
  var SHARED_CHAL_NL = ['Stijgend ziekteverzuim en complexe dossiers','Gebrek aan een uniforme en duidelijke aanpak','Beperkte interne capaciteit en expertise','Nood aan meer betrokkenheid van leidinggevenden','Vraag naar duurzame en mensgerichte re-integratie'];
  var SHARED_CHAL_EN = ['Rising absence and complex cases','No uniform, clear approach','Limited internal capacity and expertise','A need for more manager involvement','Demand for sustainable, people-centred return-to-work'];
  var SHARED_APPR_NL = ['Analyse van de bestaande situatie','Workshops met sleutelstakeholders','Ontwikkeling van een duidelijke re-integratieaanpak','Coaching en training van leidinggevenden','Implementatie en begeleiding op de werkvloer','Opvolging, bijsturing en evaluatie'];
  var SHARED_APPR_EN = ['Analysis of the current situation','Workshops with key stakeholders','Development of a clear return-to-work approach','Coaching and training for managers','Implementation and guidance on the floor','Follow-up, adjustment and evaluation'];
  var SHARED_RES = [
    { t_nl:'Meer duidelijkheid', t_en:'More clarity', d_nl:'Duidelijke rollen en processen voor alle betrokkenen.', d_en:'Clear roles and processes for everyone involved.' },
    { t_nl:'Betere samenwerking', t_en:'Better collaboration', d_nl:'Sterkere samenwerking tussen HR, leiding en medewerkers.', d_en:'Stronger collaboration between HR, managers and staff.' },
    { t_nl:'Snellere opvolging', t_en:'Faster follow-up', d_nl:'Kortere doorlooptijden in re-integratietrajecten.', d_en:'Shorter lead times in return-to-work journeys.' },
    { t_nl:'Hogere betrokkenheid', t_en:'Higher engagement', d_nl:'Meer begrip en engagement bij medewerkers en leiding.', d_en:'More understanding and engagement across the board.' },
    { t_nl:'Duurzame verankering', t_en:'Lasting embedding', d_nl:'Re-integratie is een vast onderdeel van het HR-beleid.', d_en:'Return-to-work is now a fixed part of HR policy.' }
  ];
  var SHARED_GLANCE = [
    { t_nl:'Uitdaging', t_en:'Challenge', d_nl:'Stijgend verzuim, complexe dossiers en gebrek aan uniforme aanpak.', d_en:'Rising absence, complex cases and no uniform approach.' },
    { t_nl:'Aanpak', t_en:'Approach', d_nl:'Analyse, workshops, aanpak op maat, coaching en begeleiding.', d_en:'Analysis, workshops, tailored approach, coaching and guidance.' },
    { t_nl:'Resultaat', t_en:'Result', d_nl:'Meer grip, snellere opvolging en duurzame verankering.', d_en:'More grip, faster follow-up and lasting embedding.' },
    { t_nl:'Duur', t_en:'Duration', d_nl:'Het traject liep over 6 maanden met blijvende impact.', d_en:'The programme ran over 6 months with lasting impact.' }
  ];
  function clone(a){ return JSON.parse(JSON.stringify(a)); }
  function seed(){
    return [
      { id:'case-volvo', slug:'referentie-case', order:1, active:true, company:'Volvo Group', sector:'Productie & industrie', logo:'../assets/logos/volvo.svg',
        hero_title_nl:'Van versnipperde opvolging naar één *onderbouwde* aanpak.', hero_title_en:'From fragmented follow-up to one *evidence-based* approach.',
        card_nl:'Van versnipperde opvolging naar één systeem van inzicht, structuur en opvolging.', card_en:'From fragmented follow-up to one system of insight, structure and follow-through.',
        hero_sum_nl:'In een industriële omgeving met meerdere ploegen bracht Montisoro verzuim opnieuw onder controle, met één systeem dat inzicht, structuur en opvolging samenbrengt.', hero_sum_en:'In an industrial, multi-shift environment, Montisoro brought absence back under control, with one system that unites insight, structure and follow-through.',
        about_title_nl:'Wereldwijd sterk in *transport en industrie.*', about_title_en:'A global force in *transport and industry.*',
        fact_sector_nl:'Productie & industrie', fact_sector_en:'Manufacturing & industry', fact_scope_nl:'Kort- en langdurig verzuim, re-integratie en inzetbaarheid.', fact_scope_en:'Short- and long-term absence, return-to-work and employability.',
        foot_loc:'', foot_mdw:'', foot_txt_nl:'Meerdere sites · ploegenarbeid', foot_txt_en:'Multiple sites · shift work', tech:'Storm',
        photo_about:'', photo_approach:'none', quote_photo:'',
        chal_title_nl:'Stijgend verzuim, steeds *minder grip*.', chal_title_en:'Rising absence, less and less *grip*.', chal_nl:clone(SHARED_CHAL_NL), chal_en:clone(SHARED_CHAL_EN),
        appr_title_nl:'Eén traject in *zes* stappen.', appr_title_en:'One journey in *six* steps.', appr_nl:clone(SHARED_APPR_NL), appr_en:clone(SHARED_APPR_EN),
        res_title_nl:'Wat de samenwerking *opleverde.*', res_title_en:'What the collaboration *delivered.*', results:clone(SHARED_RES), glance_sub_nl:'De hele case in *vier* punten.', glance_sub_en:'The whole case in *four* points.', glance:clone(SHARED_GLANCE),
        quote_nl:'Montisoro bracht rust en structuur in complexe dossiers. We hebben nu een aanpak die uitlegbaar is, naar onze mensen én naar de organisatie.', quote_en:'Montisoro brought calm and structure to complex cases. We now have an approach that is explainable, to our people and to the organisation.', quote_role_nl:'HR-directeur', quote_role_en:'HR Director' },
      { id:'case-alcon', slug:'referentie-case-alcon', order:2, active:true, company:'Alcon', sector:'Farmaceutische industrie', logo:'../assets/logos/alcon.svg',
        hero_title_nl:'Mens én data in *één* beweging.', hero_title_en:'People and data in *one* motion.',
        card_nl:'Mens en data samengebracht tot één re-integratietraject met een duidelijke richting.', card_en:'People and data brought together into one return-to-work journey with a clear direction.',
        hero_sum_nl:'In een sterk gereguleerde, kennisintensieve omgeving bracht Montisoro menselijke begeleiding en heldere data samen, re-integratie als één traject met een duidelijke richting.', hero_sum_en:'In a highly regulated, knowledge-intensive environment, Montisoro brought human guidance and clear data together, return-to-work as one journey with a clear direction.',
        about_title_nl:'Wereldwijd marktleider in *oogzorg.*', about_title_en:'Global leader in *eye care.*',
        fact_sector_nl:'Farmaceutische industrie', fact_sector_en:'Pharmaceutical industry', fact_scope_nl:'Kort- en langdurig verzuim, re-integratie en inzetbaarheid.', fact_scope_en:'Short- and long-term absence, return-to-work and employability.',
        foot_loc:'2', foot_mdw:'500', foot_txt_nl:'', foot_txt_en:'', tech:'Storm',
        photo_about:'', photo_approach:'none', quote_photo:'',
        chal_title_nl:'Stijgend verzuim, steeds *minder grip*.', chal_title_en:'Rising absence, less and less *grip*.', chal_nl:clone(SHARED_CHAL_NL), chal_en:clone(SHARED_CHAL_EN),
        appr_title_nl:'Eén traject in *zes* stappen.', appr_title_en:'One journey in *six* steps.', appr_nl:clone(SHARED_APPR_NL), appr_en:clone(SHARED_APPR_EN),
        res_title_nl:'Wat de samenwerking *opleverde.*', res_title_en:'What the collaboration *delivered.*', results:clone(SHARED_RES), glance_sub_nl:'De hele case in *vier* punten.', glance_sub_en:'The whole case in *four* points.', glance:clone(SHARED_GLANCE),
        quote_nl:'Montisoro bracht structuur, rust en expertise. Dankzij hun begeleiding hebben we een aanpak die werkt voor onze mensen én voor onze organisatie.', quote_en:'Montisoro brought structure, calm and expertise. Thanks to their guidance we have an approach that works for our people and our organisation.', quote_role_nl:'HR-directeur', quote_role_en:'HR Director' },
      { id:'case-lonza', slug:'referentie-case-lonza', order:3, active:true, company:'Lonza', sector:'Life sciences', logo:'../assets/logos/lonza.svg',
        hero_title_nl:'Rust en onderbouwing als *basis*.', hero_title_en:'Calm and evidence as the *foundation*.',
        card_nl:'Rust en onderbouwing als basis, elke stap uitlegbaar, met een meetbaar resultaat.', card_en:'Calm and evidence as the foundation, every step explainable, with a measurable result.',
        hero_sum_nl:'In een complexe, veeleisende productieomgeving koos Montisoro voor rust en bewijs, elke stap uitlegbaar, naar de leiding én naar de medewerker.', hero_sum_en:'In a complex, demanding production environment, Montisoro led with calm and evidence, every step explainable, to management and to the employee alike.',
        about_title_nl:'Toonaangevend in *life sciences.*', about_title_en:'A leader in *life sciences.*',
        fact_sector_nl:'Life sciences', fact_sector_en:'Life sciences', fact_scope_nl:'Kort- en langdurig verzuim, re-integratie en inzetbaarheid.', fact_scope_en:'Short- and long-term absence, return-to-work and employability.',
        foot_loc:'', foot_mdw:'', foot_txt_nl:'Meerdere sites', foot_txt_en:'Multiple sites', tech:'Storm',
        photo_about:'', photo_approach:'none', quote_photo:'',
        chal_title_nl:'Stijgend verzuim, steeds *minder grip*.', chal_title_en:'Rising absence, less and less *grip*.', chal_nl:clone(SHARED_CHAL_NL), chal_en:clone(SHARED_CHAL_EN),
        appr_title_nl:'Eén traject in *zes* stappen.', appr_title_en:'One journey in *six* steps.', appr_nl:clone(SHARED_APPR_NL), appr_en:clone(SHARED_APPR_EN),
        res_title_nl:'Wat de samenwerking *opleverde.*', res_title_en:'What the collaboration *delivered.*', results:clone(SHARED_RES), glance_sub_nl:'De hele case in *vier* punten.', glance_sub_en:'The whole case in *four* points.', glance:clone(SHARED_GLANCE),
        quote_nl:'Montisoro gaf ons onderbouwing waar eerder aannames waren. Elke stap is vandaag helder en gedragen, door leiding én medewerker.', quote_en:'Montisoro gave us evidence where there used to be assumptions. Every step today is clear and supported, by management and employee alike.', quote_role_nl:'HR-directeur', quote_role_en:'HR Director' }
    ];
  }

  if (!Array.isArray(DATA.cases) || !DATA.cases.length){ DATA.cases = seed(); window.AdminData.save(DATA); }

  function byOrder(a,b){ return (a.order||0)-(b.order||0); }
  function reindex(){ DATA.cases.sort(byOrder).forEach(function(c,i){ c.order = i+1; }); }
  var list = DATA.cases.slice().sort(byOrder);

  /* ── Overzichtskaarten ── */
  grid.innerHTML = list.map(function(c, i){
    var badge = c.active !== false
      ? '<span class="tag new"><i class="ti ti-circle-filled a-ico8"></i>Actief</span>'
      : '<span class="tag wait"><i class="ti ti-eye-off a-ico11"></i>Verborgen</span>';
    return '<div class="panel cs-case-card' + (c.active!==false?'':' is-off') + '">' +
      '<div class="cs-badge-pos">' + badge + '</div>' +
      '<div class="cs-card-logo">' +
        (c.logo ? '<div class="cs-logo-chip"><img class="cs-logo-chip-img" src="' + esc(adminLogoSrc(c.logo)) + '" alt=""></div>' : '') +
        '<div class="cs-logo-name">' + esc(c.company || mtT('ui_unnamed')) + '</div>' +
        '<div class="cs-sub">' + esc(c.sector||'') + '</div>' +
      '</div>' +
      '<div class="cs-card-title">' + esc(c.hero_title_nl||'') + '</div>' +
      '<div class="cs-meta"><i class="ti ti-link u-mr-4"></i>' + esc(c.slug||'') + '.html</div>' +
      '<div class="cs-cardfoot">' +
        '<button class="btn btn-ghost btn-sm" data-cs-up="' + esc(c.id) + '"' + (i===0?' disabled':'') + ' title="Omhoog"><i class="ti ti-arrow-up"></i></button>' +
        '<button class="btn btn-ghost btn-sm" data-cs-down="' + esc(c.id) + '"' + (i===list.length-1?' disabled':'') + ' title="Omlaag"><i class="ti ti-arrow-down"></i></button>' +
        '<button class="btn btn-ghost btn-md is-grow" data-cs-edit="' + esc(c.id) + '"><i class="ti ti-edit"></i>'+mtT('act_edit')+'</button>' +
      '</div>' +
    '</div>';
  }).join('');

  $$('[data-cs-edit]').forEach(function(b){ b.onclick = function(){ openEditor(b.dataset.csEdit); }; });
  $$('[data-cs-up]').forEach(function(b){ b.onclick = function(){ move(b.dataset.csUp, -1); }; });
  $$('[data-cs-down]').forEach(function(b){ b.onclick = function(){ move(b.dataset.csDown, 1); }; });

  var addBtn = $('#cases-add-btn'); if (addBtn) addBtn.onclick = function(){ openEditor(null); };
  var prev = $('#cases-preview'); if (prev) prev.onclick = function(){ window.open(((window.SITE_URL||'../../website/pages').replace(/\/$/,'')) + '/Referentie.html', '_blank', 'noopener'); };
  var exp = $('#cases-export'); if (exp) exp.onclick = exportFile;

  function move(id, dir){
    DATA.cases.sort(byOrder);
    var idx = DATA.cases.findIndex(function(x){ return x.id===id; });
    var j = idx + dir; if (idx<0 || j<0 || j>=DATA.cases.length) return;
    var t = DATA.cases[idx]; DATA.cases[idx] = DATA.cases[j]; DATA.cases[j] = t;
    reindex(); window.AdminData.save(DATA); window.init_cases();
  }

  function exportFile(){
    reindex();
    var file = '/* Montisoro, Referentie-cases · single source of truth.\n' +
      '   Gegenereerd door het admin panel op ' + new Date().toISOString() + '.\n' +
      '   Plaats dit bestand in /website/data/cases.js */\n' +
      'window.MONTISORO_CASES = ' + JSON.stringify(DATA.cases.slice().sort(byOrder), null, 2) + ';\n';
    var blob = new Blob([file], { type:'application/javascript' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'cases.js';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
    showToast(mtT('toast_exported_cases'), 'download');
  }

  /* ── kleine bouwstenen voor het formulier ── */
  function secTitle(icon, txt){ return '<div class="drawer-section-label"><i class="ti ti-' + icon + ' u-mr-6"></i>' + txt + '</div>'; }
  function secTitleTop(icon, txt){ return '<div class="drawer-section-label is-first"><i class="ti ti-' + icon + ' u-mr-6"></i>' + txt + '</div>'; }
  function fText(id, label, val, ph, extra){ return '<div class="field"><label>' + label + '</label><input id="' + id + '" value="' + esc(val||'') + '" placeholder="' + esc(ph||'') + '"' + (extra||'') + '></div>'; }
  function fArea(id, label, val, max){ return '<div class="field"><label>' + label + '</label><textarea class="cs-textarea" id="' + id + '" rows="3"' + (max?(' maxlength="'+max+'"'):'') + '>' + esc(val||'') + '</textarea></div>'; }
  function pair(idBase, labelNL, labelEN, vNL, vEN, max, area){
    var fn = area ? fArea : fText;
    return '<div class="cs-grid2">' + fn(idBase+'-nl', labelNL, vNL, '', max) + fn(idBase+'-en', labelEN, vEN, '', max) + '</div>';
  }
  function listBlock(kind, labelNL, labelEN, arrNL, arrEN, maxItems){
    function rows(arr, pfx){
      return (arr||[]).map(function(v,i){
        return '<div class="cs-row"><span class="cs-num">' + (i+1) + '</span><input class="is-grow" data-' + pfx + '="' + i + '" value="' + esc(v) + '"><button class="btn btn-ghost cs-b1" data-del-' + pfx + '="' + i + '" title="Verwijder"><i class="ti ti-x"></i></button></div>';
      }).join('');
    }
    var full = (arrNL||[]).length >= maxItems;
    return '<div class="cs-grid2-16">' +
      '<div><div class="cs-flabel">' + labelNL + ' <span class="u-c-muted3">· max ' + maxItems + '</span></div>' + rows(arrNL, kind+'nl') + (full?'':'<button class="btn btn-ghost cs-b2" data-add-' + kind + '="nl"><i class="ti ti-plus"></i>Regel</button>') + '</div>' +
      '<div><div class="cs-flabel">' + labelEN + '</div>' + rows(arrEN, kind+'en') + '</div>' +
    '</div>';
  }
  function photoField(id, label, val, hint){
    return '<div class="field">' +
      (val ? '<div class="cs-ok-banner"><i class="ti ti-photo-check cs-ok-ico"></i><b class="u-fw-600">Foto ingesteld</b><button class="btn btn-ghost cs-b3" data-photoclear="' + id + '"><i class="ti ti-trash"></i></button></div>' : '') +
      '<label>' + label + '</label><input type="file" id="' + id + '" accept="image/*" style="background:rgba(29,29,31,0.04);border:1px solid var(--a-div);border-radius:10px;padding:11px 14px;color:var(--a-off);font:inherit;font-size:13px;cursor:pointer;"><div class="hint">' + hint + '</div></div>';
  }

  function openEditor(id){
    var isNew = (id === null);
    var c = isNew
      ? { id:'case-new', slug:'', order:99, active:true, company:'', sector:'', logo:'',
          hero_title_nl:'', hero_title_en:'', card_nl:'', card_en:'', hero_sum_nl:'', hero_sum_en:'',
          about_title_nl:'', about_title_en:'', fact_sector_nl:'', fact_sector_en:'', fact_scope_nl:'', fact_scope_en:'',
          foot_loc:'', foot_mdw:'', foot_txt_nl:'', foot_txt_en:'', tech:'Storm', photo_about:'', photo_approach:'none', quote_photo:'',
          chal_title_nl:'', chal_title_en:'', chal_nl:[''], chal_en:[''], appr_title_nl:'', appr_title_en:'', appr_nl:[''], appr_en:[''],
          res_title_nl:'', res_title_en:'', results:[{t_nl:'',t_en:'',d_nl:'',d_en:''}], glance_sub_nl:'', glance_sub_en:'',
          glance:[{t_nl:'',t_en:'',d_nl:'',d_en:''},{t_nl:'',t_en:'',d_nl:'',d_en:''},{t_nl:'',t_en:'',d_nl:'',d_en:''},{t_nl:'',t_en:'',d_nl:'',d_en:''}],
          quote_nl:'', quote_en:'', quote_name:'', quote_role_nl:'', quote_role_en:'' }
      : DATA.cases.find(function(x){ return x.id===id; });
    if (!c) return;
    (function(){ var GL=[['Uitdaging','Challenge'],['Aanpak','Approach'],['Resultaat','Result'],['Duur','Duration']]; c.glance=(c.glance&&c.glance.length)?c.glance:[{},{},{},{}]; for(var gi=0;gi<4;gi++){ if(!c.glance[gi])c.glance[gi]={d_nl:'',d_en:''}; c.glance[gi].t_nl=GL[gi][0]; c.glance[gi].t_en=GL[gi][1]; } })();

    function resultRows(){
      var full = (c.results||[]).length >= 5;
      return (c.results||[]).map(function(r,i){
        return '<div class="panel cs-subpanel"><div class="cs-subhead"><span class="cs-accent-serif">'+mtT('cs_card_n')+(i+1)+'</span><button class="btn btn-ghost cs-b4" data-del-res="' + i + '"><i class="ti ti-trash"></i></button></div>' +
          '<div class="cs-grid2-9"><input data-restnl="' + i + '" value="' + esc(r.t_nl) + '" placeholder="'+mtT('cs_ph_title_nl')+'"><input data-resten="' + i + '" value="' + esc(r.t_en) + '" placeholder="'+mtT('cs_ph_title_en')+'"></div>' +
          '<div class="cs-grid2-9 u-mt-8"><input data-resdnl="' + i + '" value="' + esc(r.d_nl) + '" maxlength="70" placeholder="'+mtT('cs_ph_expl70_nl')+'"><input data-resden="' + i + '" value="' + esc(r.d_en) + '" maxlength="70" placeholder="'+mtT('cs_ph_expl70_en')+'"></div></div>';
      }).join('') + (full?'':'<button class="btn btn-ghost cs-b2" data-add-res><i class="ti ti-plus"></i>'+mtT('cs_resultcard_btn')+'</button>');
    }
    function glanceRows(){
      var GL = [['Uitdaging','Challenge'],['Aanpak','Approach'],['Resultaat','Result'],['Duur','Duration']];
      return (c.glance||[]).map(function(g,i){
        var lbl = GL[i] ? GL[i][0] : (mtT('cs_cell') + (i+1));
        return '<div class="panel cs-subpanel"><div class="cs-subhead2"><span class="cs-dash"></span><span class="cs-step-title">' + lbl + '</span><span class="cs-step-tag">'+mtT('cs_fixed_title')+'</span></div>' +
          '<div class="cs-grid2-9"><input data-gdnl="' + i + '" value="' + esc(g.d_nl) + '" maxlength="80" placeholder="'+mtT('cs_ph_expl80_nl')+'"><input data-gden="' + i + '" value="' + esc(g.d_en) + '" maxlength="80" placeholder="'+mtT('cs_ph_expl80_en')+'"></div></div>';
      }).join('');
    }

    function html(){
      return '<div class="drawer-head"><div><div class="eyebrow">' + (isNew?mtT('cs_add'):mtT('cs_edit')) + '</div><h3>' + esc(isNew?mtT('cs_new'):c.company) + '</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
      '<div class="drawer-body">' +
        secTitleTop('id-badge-2',mtT('cs_s1')) +
        '<div class="cs-grid2">' + fText('cs-company',mtT('tb_companyname'), c.company, mtT('cs_ph_company')) + fText('cs-sector',mtT('cs_sector'), c.sector, mtT('cs_ph_sector')) + '</div>' +
        fText('cs-slug',mtT('cs_slug'), c.slug, 'referentie-case-alcon', ' style="font-family:monospace;font-size:12px;"') +
        pair('cs-card',mtT('cs_card_nl'),mtT('cs_card_en'), c.card_nl, c.card_en, 160, true) +

        secTitle('layout-navbar',mtT('cs_s2')) +
        '<div class="hint cs-hint-tight">'+mtT('cs_tip_accent')+'</div>' +
        pair('cs-herotitle',mtT('cs_herotitle_nl'),mtT('cs_title_en'), c.hero_title_nl, c.hero_title_en, 60) +
        pair('cs-herosum',mtT('cs_herosum_nl'),mtT('cs_herosum_en'), c.hero_sum_nl, c.hero_sum_en, 240, true) +

        secTitle('building',mtT('cs_s3')) +
        pair('cs-abouttitle',mtT('cs_sectitle_nl'),mtT('cs_sectitle_en'), c.about_title_nl, c.about_title_en) +
        pair('cs-factsector',mtT('cs_sector_nl'),mtT('cs_sector_en'), c.fact_sector_nl, c.fact_sector_en) +
        pair('cs-factscope',mtT('cs_scope_nl'),mtT('cs_scope_en'), c.fact_scope_nl, c.fact_scope_en) +
        '<div class="field"><label>'+mtT('cs_footprint')+' <span class="a-note">'+mtT('cs_footprint_note')+'</span></label>' +
          '<div class="cs-flex8"><input class="cs-w80" id="cs-footloc" value="' + esc(c.foot_loc) + '" inputmode="numeric" placeholder="2"><span class="a-t13-muted">'+mtT('cs_locations')+'</span><input class="cs-w90" id="cs-footmdw" value="' + esc(c.foot_mdw) + '" inputmode="numeric" placeholder="500"><span class="a-t13-muted">'+mtT('cs_employees')+'</span></div>' +
          '<div class="hint">'+mtT('cs_footprint_hint')+'</div>' +
          '<div class="cs-grid2-9 u-mt-8"><input id="cs-foottxt-nl" value="' + esc(c.foot_txt_nl) + '" placeholder="'+mtT('cs_freetext_nl')+'"><input id="cs-foottxt-en" value="' + esc(c.foot_txt_en) + '" placeholder="'+mtT('cs_freetext_en')+'"></div>' +
        '</div>' +
        '<div class="field"><label>'+mtT('cs_tech')+' <span class="a-note">'+mtT('cs_tech_note')+'</span></label><div class="cs-flex8"><span class="a-t13-muted">SaaS-platform</span>' + TECHS.map(function(t){ return '<label class="cs-check-label"><input class="a-accent" type="radio" name="cs-tech" value="' + t + '"' + (c.tech===t?' checked':'') + '> ' + t + '</label>'; }).join('') + '</div></div>' +
        secTitle('alert-triangle',mtT('cs_s4')) +
        pair('cs-chaltitle',mtT('cs_title_nl'),mtT('cs_title_en'), c.chal_title_nl, c.chal_title_en) +
        listBlock('chal',mtT('cs_lines_nl'),mtT('cs_lines_en'), c.chal_nl, c.chal_en, 5) +

        secTitle('route',mtT('cs_s5')) +
        pair('cs-apprtitle',mtT('cs_title_nl'),mtT('cs_title_en'), c.appr_title_nl, c.appr_title_en) +
        listBlock('appr',mtT('cs_steps_nl'),mtT('cs_steps_en'), c.appr_nl, c.appr_en, 6) +
        secTitle('trophy',mtT('cs_s6')) +
        pair('cs-restitle',mtT('cs_title_nl'),mtT('cs_title_en'), c.res_title_nl, c.res_title_en) +
        '<div id="cs-results">' + resultRows() + '</div>' +

        secTitle('layout-grid',mtT('cs_s7')) +
        pair('cs-glancesub',mtT('cs_glancesub_nl'),mtT('cs_glancesub_en'), c.glance_sub_nl, c.glance_sub_en) +
        '<div class="hint u-mb-10">'+mtT('cs_glance_hint')+'</div>' +
        '<div id="cs-glance">' + glanceRows() + '</div>' +

        secTitle('quote',mtT('cs_s8')) +
        '<div class="hint cs-hint-tight">'+mtT('cs_quote_hint')+'</div>' +
        pair('cs-quote',mtT('cs_quote_nl'),mtT('cs_quote_en'), c.quote_nl, c.quote_en, 180, true) +
        fText('cs-quote-name',mtT('cs_quote_name'), c.quote_name, mtT('cs_ph_name')) +
        '<div class="cs-grid2">' + fText('cs-role-nl',mtT('cs_role_nl'), c.quote_role_nl, mtT('cs_ph_role_nl')) + fText('cs-role-en',mtT('cs_role_en'), c.quote_role_en, mtT('cs_ph_role_en')) + '</div>' +
        secTitle('photo',mtT('cs_s_images')) +
        '<div class="field"><label>'+mtT('cs_logo_label')+' <span class="a-note">'+mtT('cs_req')+'</span></label><select id="cs-logo" style="background:rgba(29,29,31,0.04);border:1px solid var(--a-div);border-radius:10px;padding:11px 14px;color:var(--a-off);font:inherit;font-size:13px;cursor:pointer;width:100%;">' + LOGOS.map(function(o){ return '<option value="' + esc(o.v) + '"' + ((o.v===(c.logo||''))?' selected':'') + '>' + esc(o.l) + '</option>'; }).join('') + '</select><div class="hint">'+mtT('cs_logo_hint')+'</div></div>' +
        '<div id="cs-logo-preview">' + logoPreview(c.logo) + '</div>' +
        photoField('cs-photo-about',mtT('cs_photo_about_label')+' <span style=\"color:var(--a-muted-2);font-weight:400;\">'+mtT('cs_req')+'</span>', c.photo_about, mtT('cs_photo_about_hint')) +
        photoField('cs-photo-quote',mtT('cs_photo_quote_label')+' <span style=\"color:var(--a-muted-2);font-weight:400;\">'+mtT('cs_optional')+'</span>', c.quote_photo, mtT('cs_photo_quote_hint')) +

        secTitle('toggle-right',mtT('ui_visibility')) +
        '<label class="cs-check-card"><input class="cs-check-lg" type="checkbox" id="cs-active" ' + (c.active!==false?'checked':'') + '><div><div class="a-val-b">'+mtT('cs_active_show')+'</div><div class="a-caption">'+mtT('cs_active_desc')+'</div></div></label>' +
        '<div class="help-banner u-mt-22"><i class="ti ti-info-circle"></i><p>Na wijzigingen: klik op het overzicht op <b>Exporteer cases.js</b> en plaats het bestand in <code>/website/data/</code>.</p></div>' +
      '</div>' +
      '<div class="drawer-foot">' +
        '<button class="btn btn-primary" data-save><i class="ti ti-check"></i>' + (isNew?mtT('act_add'):mtT('act_save')) + '</button>' +
        '<button class="btn btn-ghost" data-close><i class="ti ti-x"></i>'+mtT('ui_cancel_imp')+'</button>' +
        (isNew ? '' : '<button class="btn btn-ghost is-danger u-ml-auto" data-delete><i class="ti ti-trash"></i>'+mtT('ui_delete_imp')+'</button>') +
      '</div>';
    }

    function sync(){
      var g = function(s){ var e = drawer.querySelector(s); return e ? e.value : undefined; };
      var map = { 'cs-company':'company','cs-sector':'sector','cs-slug':'slug',
        'cs-card-nl':'card_nl','cs-card-en':'card_en','cs-herotitle-nl':'hero_title_nl','cs-herotitle-en':'hero_title_en',
        'cs-herosum-nl':'hero_sum_nl','cs-herosum-en':'hero_sum_en','cs-abouttitle-nl':'about_title_nl','cs-abouttitle-en':'about_title_en',
        'cs-factsector-nl':'fact_sector_nl','cs-factsector-en':'fact_sector_en','cs-factscope-nl':'fact_scope_nl','cs-factscope-en':'fact_scope_en',
        'cs-footloc':'foot_loc','cs-footmdw':'foot_mdw','cs-foottxt-nl':'foot_txt_nl','cs-foottxt-en':'foot_txt_en',
        'cs-chaltitle-nl':'chal_title_nl','cs-chaltitle-en':'chal_title_en','cs-apprtitle-nl':'appr_title_nl','cs-apprtitle-en':'appr_title_en',
        'cs-restitle-nl':'res_title_nl','cs-restitle-en':'res_title_en','cs-glancesub-nl':'glance_sub_nl','cs-glancesub-en':'glance_sub_en','cs-quote-nl':'quote_nl','cs-quote-en':'quote_en','cs-quote-name':'quote_name','cs-role-nl':'quote_role_nl','cs-role-en':'quote_role_en' };
      Object.keys(map).forEach(function(k){ var v = g('#'+k); if (v!==undefined) c[map[k]] = v; });
      var logo = g('#cs-logo'); if (logo!==undefined) c.logo = logo;
      var tech = drawer.querySelector('input[name="cs-tech"]:checked'); if (tech) c.tech = tech.value;
      var act = drawer.querySelector('#cs-active'); if (act) c.active = act.checked;
      // lists
      ['chal','appr'].forEach(function(kind){
        ['nl','en'].forEach(function(lg){
          var arr = []; drawer.querySelectorAll('[data-'+kind+lg+']').forEach(function(inp){ arr[+inp.getAttribute('data-'+kind+lg)] = inp.value; });
          if (drawer.querySelector('[data-'+kind+lg+']')) c[kind+'_'+lg] = arr;
        });
      });
      // results
      if (drawer.querySelector('[data-restnl]')){
        (c.results||[]).forEach(function(r,i){
          var q=function(s){var e=drawer.querySelector(s);return e?e.value:r[arguments[1]];};
          var tn=drawer.querySelector('[data-restnl="'+i+'"]'), te=drawer.querySelector('[data-resten="'+i+'"]'), dn=drawer.querySelector('[data-resdnl="'+i+'"]'), de=drawer.querySelector('[data-resden="'+i+'"]');
          if(tn) r.t_nl=tn.value; if(te) r.t_en=te.value; if(dn) r.d_nl=dn.value; if(de) r.d_en=de.value;
        });
      }
      // glance
      (c.glance||[]).forEach(function(gg,i){
        var tn=drawer.querySelector('[data-gtnl="'+i+'"]'), te=drawer.querySelector('[data-gten="'+i+'"]'), dn=drawer.querySelector('[data-gdnl="'+i+'"]'), de=drawer.querySelector('[data-gden="'+i+'"]');
        if(tn) gg.t_nl=tn.value; if(te) gg.t_en=te.value; if(dn) gg.d_nl=dn.value; if(de) gg.d_en=de.value;
      });
    }

    function rerender(){ sync(); drawer.innerHTML = html(); wire(); }

    function readPhoto(inputId, field){
      var pf = drawer.querySelector('#'+inputId);
      if (!pf) return;
      pf.addEventListener('change', function(e){
        var f = e.target.files[0]; if (!f) return;
        if (f.size > 4*1024*1024){ showToast(mtT('toast_photo_too_big_4'), 'alert-triangle'); return; }
        var r = new FileReader();
        r.onload = function(ev){ sync(); c[field] = ev.target.result; drawer.innerHTML = html(); wire(); showToast(mtT('toast_photo_added'), 'photo'); };
        r.readAsDataURL(f);
      });
    }

    function wire(){
      drawer.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', closeDrawer); });
      var lg = drawer.querySelector('#cs-logo');
      if (lg) lg.addEventListener('change', function(){ c.logo = lg.value; var pv = drawer.querySelector('#cs-logo-preview'); if (pv) pv.innerHTML = logoPreview(c.logo); });
      // footprint + numbers: strip non-digits
      ['#cs-footloc','#cs-footmdw'].forEach(function(s){ var el=drawer.querySelector(s); if(el) el.addEventListener('input', function(){ el.value = el.value.replace(/[^0-9]/g,''); }); });
      // list add/del
      ['chal','appr'].forEach(function(kind){
        var maxN = kind==='chal'?5:6;
        var addBtn = drawer.querySelector('[data-add-'+kind+']');
        if (addBtn) addBtn.addEventListener('click', function(){ sync(); c[kind+'_nl']=c[kind+'_nl']||[]; c[kind+'_en']=c[kind+'_en']||[]; if(c[kind+'_nl'].length<maxN){ c[kind+'_nl'].push(''); c[kind+'_en'].push(''); } drawer.innerHTML=html(); wire(); });
        drawer.querySelectorAll('[data-del-'+kind+'nl]').forEach(function(b){ b.addEventListener('click', function(){ sync(); var i=+b.getAttribute('data-del-'+kind+'nl'); c[kind+'_nl'].splice(i,1); c[kind+'_en'].splice(i,1); drawer.innerHTML=html(); wire(); }); });
      });
      // results add/del
      var addRes = drawer.querySelector('[data-add-res]');
      if (addRes) addRes.addEventListener('click', function(){ sync(); c.results=c.results||[]; if(c.results.length<5){ c.results.push({t_nl:'',t_en:'',d_nl:'',d_en:''}); } drawer.innerHTML=html(); wire(); });
      drawer.querySelectorAll('[data-del-res]').forEach(function(b){ b.addEventListener('click', function(){ sync(); c.results.splice(+b.getAttribute('data-del-res'),1); drawer.innerHTML=html(); wire(); }); });
      // photos
      readPhoto('cs-photo-about','photo_about'); readPhoto('cs-photo-quote','quote_photo');
      drawer.querySelectorAll('[data-photoclear]').forEach(function(b){ b.addEventListener('click', function(){ sync(); c[b.getAttribute('data-photoclear').replace('cs-photo-about','photo_about').replace('cs-photo-approach','photo_approach').replace('cs-photo-quote','quote_photo')]=''; drawer.innerHTML=html(); wire(); }); });
      // save / delete
      drawer.querySelector('[data-save]').addEventListener('click', function(){
        sync();
        if (!c.company){ showToast(mtT('toast_company_required'), 'alert-triangle'); return; }
        var hasQuote = (c.quote_nl && c.quote_nl.trim()) || (c.quote_en && c.quote_en.trim());
        if (hasQuote && (!c.quote_name || !c.quote_name.trim())){ showToast(mtT('toast_person_required'), 'alert-triangle'); return; }
        if (hasQuote && !(c.quote_role_nl && c.quote_role_nl.trim())){ showToast(mtT('toast_role_required'), 'alert-triangle'); return; }
        if (!c.slug){ c.slug = 'referentie-case-' + c.company.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
        if (isNew){ c.id = 'case-' + Date.now(); c.order = (DATA.cases.length + 1); DATA.cases.push(c); }
        window.AdminData.save(DATA); closeDrawer(); showToast(isNew ? c.company + mtT('toast_added') : mtT('toast_changes_saved')); window.init_cases();
      });
      var del = drawer.querySelector('[data-delete]');
      if (del) del.addEventListener('click', function(){
        window.Admin.confirmDelete({ name:c.company }).then(function(ok){
          if (!ok) return;
          var i = DATA.cases.findIndex(function(x){ return x.id===c.id; });
          var removed = DATA.cases[i];
          DATA.cases = DATA.cases.filter(function(x){ return x.id!==c.id; });
          window.AdminData.save(DATA); closeDrawer(); window.init_cases();
          window.Admin.undoToast(c.company + mtT('ui_deleted_suffix'), function(){
            DATA.cases.splice(i<0?0:i, 0, removed); window.AdminData.save(DATA); window.init_cases(); window.Admin.showToast(c.company + mtT('toast_restored'));
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
