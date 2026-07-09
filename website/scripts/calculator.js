/* ═══════════════════════════════════════════════════════════════════
   Montisoro — Verzuimcalculator BETA  ·  calculator-beta.js
   GEÏSOLEERD. Hergebruikt de PRODUCTIE-engine (ongewijzigde kopie).
   Geen backend-calls — submit is preview-only (inert).
   Werkt voor NL én EN: de pagina zet window.BETA_LANG ('nl'|'en').
═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var LANG = (window.BETA_LANG === 'en') ? 'en' : 'nl';
  var LOC  = LANG === 'en' ? 'en-IE' : 'nl-BE';
  var $ = function(id){ return document.getElementById(id); };

  /* ── kleine UI-tekstbank (alleen dynamische strings; statische tekst staat in HTML) ── */
  var T = {
    nl: {
      workers:'arbeiders', clerks:'bedienden', vsSector:'vs sector',
      days:'verloren werkdagen / jaar',
      nudge:'U werkt nog met de voorbeeldwaarden. Pas minstens uw aantal medewerkers en brutoloon aan voor een cijfer op maat.',
      previewOk:'In productie ontvangt u nu het volledige rapport per e-mail. Dit is een beta-preview — er wordt niets verzonden of opgeslagen.',
      sending:'Rapport wordt aangemaakt… (± 10 sec)',
      successSent:'✓ Uw aanvraag is ontvangen — uw rapport komt per e-mail.',
      successPending:'✓ Uw aanvraag is ontvangen — uw rapport komt per e-mail.',
      submitLabel:'Ontvang rapport →',
      emailErr:'Vul een geldig e-mailadres in.',
      consentErr:'Gelieve akkoord te gaan met de privacyverklaring.',
      riskLbl:'Risiconiveau',
      perEmpSub:function(d,c){return '≈ '+d+' dagen × €'+c;},
      bm:{eq:'± gelijk',up1:'↑ licht hoger',up2:'↑ hoger',dn1:'↓ licht lager',dn2:'↓ lager'},
      stepErr:{1:'Vul het aantal medewerkers in om verder te gaan.',2:'Vul het brutoloon in om verder te gaan.',6:'Vul het verzuim in om het resultaat te zien.'}
    },
    en: {
      workers:'blue-collar', clerks:'white-collar', vsSector:'vs sector',
      days:'lost working days / year',
      nudge:'You are still using the example values. Adjust at least your headcount and gross salary for a figure tailored to you.',
      previewOk:'In production you would now receive the full report by e-mail. This is a beta preview — nothing is sent or stored.',
      sending:'Preparing your report… (± 10 sec)',
      successSent:'✓ Your request has been received — your report will arrive by e-mail.',
      successPending:'✓ Your request has been received — your report will arrive by e-mail.',
      submitLabel:'Receive report →',
      emailErr:'Please enter a valid e-mail address.',
      consentErr:'Please agree to the privacy statement.',
      riskLbl:'Risk level',
      perEmpSub:function(d,c){return '≈ '+d+' days × €'+c;},
      bm:{eq:'± equal',up1:'↑ slightly higher',up2:'↑ higher',dn1:'↓ slightly lower',dn2:'↓ lower'},
      stepErr:{1:'Enter the number of employees to continue.',2:'Enter the gross salary to continue.',6:'Enter the absence figures to see the result.'}
    }
  }[LANG];

  /* ── formatters ── */
  function nf(n,d){ d=d==null?0:d; return Number(n).toLocaleString(LOC,{minimumFractionDigits:d,maximumFractionDigits:d}); }
  /* Belgisch-bewuste integer-invoer: komma = decimaalteken (afkappen),
     punt = duizendtalscheiding (strippen). Voorkomt de stille 10×-fout:
     "50000,75"→"50000" · "12,5"→"12" · "50.000"→"50000". */
  function digitsBE(v){ v=String(v==null?'':v); var ci=v.indexOf(','); if(ci>=0) v=v.slice(0,ci); return v.replace(/[^\d]/g,''); }
  function money(n){
    var a=Math.abs(n);
    if(a>=1e6) return (n/1e6).toLocaleString(LOC,{minimumFractionDigits:2,maximumFractionDigits:2})+' M';
    if(a>=1e3) return (n/1e3).toLocaleString(LOC,{maximumFractionDigits:0})+'K';
    return Math.round(n).toLocaleString(LOC);
  }
  function moneyFull(n){ return '€\u00A0'+Math.round(n).toLocaleString(LOC,{maximumFractionDigits:0}); }

  /* ── state (zelfde defaults als productie → eerlijke vergelijking) ── */
  var CONFIG = window.MONTISORO_CALC_CONFIG || {};
  var SECTOR = CONFIG.sector || {K:3.18,M:3.10,L:3.86};
  var state = {
    fte:0, splitA:0, salary:0,
    voordelen:0, firmawagen:0, groepsv:0, hospv:0, andereverz:0,
    grpVoordelen:'beide', grpFirmawagen:'bediende', grpGroepsv:'bediende', grpHospv:'beide', grpAndereverz:'beide',
    days:220,
    kA:0, mA:0, lA:0, kB:0, mB:0, lB:0,
    vervangFactor: CONFIG.vervangFactor || 30,
    orgFactor: CONFIG.orgFactor || 50
  };
  var edited = { fte:false, salary:false };
  window.__betaState = state;
  /* schone nul-snapshot om naar terug te zetten bij "Opnieuw beginnen" */
  var ZERO = JSON.parse(JSON.stringify(state));

  var SECTOR_TOTAL = SECTOR.K + SECTOR.M + SECTOR.L;

  function setTrack(el,min,max){
    var p=((+el.value-min)/(max-min))*100;
    el.style.setProperty('--p',p+'%');
  }

  /* ─────────────── STATE-PERSISTENTIE (sessie-resume na refresh) ─────────────── */
  var SKEY='montisoro_calc_v1', SMAXAGE=7*24*60*60*1000; /* 7 dagen */
  var __step=1, __saveT=null;
  function saveSnapshot(){
    try{
      if(!(state.fte>0 || state.salary>0)){ localStorage.removeItem(SKEY); return; }
      localStorage.setItem(SKEY, JSON.stringify({t:Date.now(), step:__step, state:state}));
    }catch(e){}
  }
  function scheduleSave(){ clearTimeout(__saveT); __saveT=setTimeout(saveSnapshot,400); }
  var SL_RANGE={fte:[1,2000],salary:[20000,120000],splitRange:[0,100],vervangFactor:[0,100],orgFactor:[0,150],days:[180,240],
    catKA:[0,10],catMA:[0,10],catLA:[0,10],catKB:[0,10],catMB:[0,10],catLB:[0,10]};
  /* zet alle zichtbare controls vanuit de huidige state (zonder events → geen clamp-bijwerking) */
  function applyStateToUI(){
    function sl(id,val){var e=$(id); if(!e)return; e.value=val; var r=SL_RANGE[id]; if(r) setTrack(e,r[0],r[1]);}
    function numR(id,val){var e=$(id); if(!e)return; e.value=val;}
    function numF(id,val){var e=$(id); if(!e)return; e.value=nf(val);}
    sl('fte', state.fte>0?Math.max(1,Math.min(2000,state.fte)):1); numF('fteNum', state.fte);
    sl('salary', state.salary>0?Math.max(20000,Math.min(120000,state.salary)):20000); numF('salaryNum', state.salary);
    sl('splitRange', state.splitA); numR('splitNum', state.splitA);
    ['voordelen','firmawagen','groepsv','hospv','andereverz'].forEach(function(k){ numR(k, state[k]); });
    sl('vervangFactor', state.vervangFactor); numR('vervangFactorNum', state.vervangFactor);
    sl('orgFactor', state.orgFactor); numR('orgFactorNum', state.orgFactor);
    sl('days', state.days); numR('daysNum', state.days);
    [['catKA','kA'],['catMA','mA'],['catLA','lA'],['catKB','kB'],['catMB','mB'],['catLB','lB']].forEach(function(p){ sl(p[0], state[p[1]]); });
    document.querySelectorAll('.b-grp').forEach(function(grp){
      var key=grp.getAttribute('data-grp');
      grp.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-val')===state[key]); });
    });
    compute();
  }
  function resetAll(){
    try{ localStorage.removeItem(SKEY); }catch(e){}
    Object.assign(state, JSON.parse(JSON.stringify(ZERO)));
    edited.fte=false; edited.salary=false;
    applyStateToUI();
    var banner=$('bResumeBar'); if(banner) banner.hidden=true;
    if(window.__betaGo) window.__betaGo(1);
    var ws=$('bMain'); if(ws){ try{ws.scrollTop=0;}catch(e){} window.scrollTo({top:0,behavior:'smooth'}); }
  }
  window.__betaReset = resetAll;

  /* ─────────────── COMPUTE + RENDER ─────────────── */
  function compute(){
    var R = VerzuimEngine.compute(state);
    var V = VerzuimEngine.format(R, LANG);
    window.__betaReport = { input:R.input, results:R, vars:V };

    /* blanco/0-start: zolang er geen organisatie is ingevuld (FTE én brutoloon)
       tonen we geen misleidende sector-vergelijking of risico-oordeel */
    var blank = !(state.fte>0 && state.salary>0);
    var EMPTY = '\u2014'; /* — */
    var outCard=document.querySelector('.b-output'); if(outCard) outCard.classList.toggle('is-empty', blank);

    /* extra kostcategorieën — engine is bron van waarheid (factor × directe loonkost) */
    var vervangKost = R.vervangingKost;
    var orgKost     = R.orgImpactKost;
    var grandTotal  = R.total;                 // = werkgeverslast (incl. vervanging)
    var totaleKost  = R.totaleKost;            // werkgeverslast + organisatorische impact

    /* headline = werkgeverslast (de kost die altijd betaald moet worden) —
       adaptieve eenheid: M boven 1 mln, anders het volledige bedrag (geen "0,05 M") */
    var heroEl=$('bResultNum'), heroUnit=document.querySelector('.b-result .unit'), heroCur=document.querySelector('.b-result .cur');
    /* afgeronde indicatie i.p.v. tot-op-de-euro (weg met valse precisie; "±" = benaderende range, details blijven exact) */
    var ga=Math.abs(grandTotal);
    if(ga>=1e6){
      var mln=grandTotal/1e6;
      heroEl.textContent = mln.toLocaleString(LOC,{minimumFractionDigits:mln<10?1:0,maximumFractionDigits:mln<10?1:0});
      if(heroUnit) heroUnit.textContent='M';
    } else if(ga>=1e5){
      heroEl.textContent = (Math.round(grandTotal/1e4)*10).toLocaleString(LOC,{maximumFractionDigits:0});
      if(heroUnit) heroUnit.textContent='K';
    } else if(ga>=1e4){
      heroEl.textContent = (Math.round(grandTotal/5e3)*5).toLocaleString(LOC,{maximumFractionDigits:0});
      if(heroUnit) heroUnit.textContent='K';
    } else {
      heroEl.textContent = Math.round(grandTotal).toLocaleString(LOC,{maximumFractionDigits:0});
      if(heroUnit) heroUnit.textContent='';
    }
    if(heroCur) heroCur.textContent = ga>=1e4 ? '\u00B1\u00A0\u20AC' : '\u20AC';
    $('bDays').textContent = nf(R.lostDays);
    var d=$('bDelta');
    if(blank){ d.textContent = EMPTY; d.classList.remove('below'); }
    else { d.textContent = V.difference_vs_sector+' '+T.vsSector; d.classList.toggle('below', R.differenceVsSector<0); }
    var vp=$('bVerzPct'); if(vp) vp.textContent=String(V.absence_rate).replace('%','').trim();

    /* CFO-eerlijke breakdown — voordelen + verzekeringen samengevoegd tot doorlopende kosten */
    var doorlopendKost = R.doorlopendKost;
    $('cfoLoon').textContent = moneyFull(R.loonKost);
    $('cfoVoord').textContent = moneyFull(doorlopendKost);
    var cv=$('cfoVerz'); if(cv) cv.textContent = moneyFull(R.verzekeringKost);
    var cfv=$('cfoVervang'); if(cfv) cfv.textContent = moneyFull(vervangKost);
    var vy=$('vervangYr'); if(vy) vy.textContent = nf(Math.round(vervangKost));
    var cfo=$('cfoOrg'); if(cfo) cfo.textContent = moneyFull(orgKost);
    var oy=$('orgYr'); if(oy) oy.textContent = nf(Math.round(orgKost));
    $('cfoTotal').textContent = moneyFull(grandTotal);

    /* segment-balk (op werkgeverslast) */
    var ptL=grandTotal>0?(R.loonKost/grandTotal)*100:0, ptV=grandTotal>0?(doorlopendKost/grandTotal)*100:0, ptZ=grandTotal>0?(vervangKost/grandTotal)*100:0;
    $('segLoon').style.width=ptL+'%'; $('segVoord').style.width=ptV+'%';
    var sv=$('segVerz'); if(sv) sv.style.width=ptZ+'%';

    /* KPI's */
    $('kpiPerEmp').textContent=((state.fte>0?R.loonKost/state.fte:0)/1000).toLocaleString(LOC,{minimumFractionDigits:1,maximumFractionDigits:1});
    $('kpiPerDay').textContent=(grandTotal/(state.fte||1)/1000).toLocaleString(LOC,{minimumFractionDigits:1,maximumFractionDigits:1});
    $('kpiLostDays').textContent=(orgKost/(state.fte||1)/1000).toLocaleString(LOC,{minimumFractionDigits:1,maximumFractionDigits:1});
    $('kpiAddons').textContent=(totaleKost/(state.fte||1)/1000).toLocaleString(LOC,{minimumFractionDigits:1,maximumFractionDigits:1});
    var dpe=state.fte>0?Math.round(R.lostDays/state.fte):0;
    $('kpiPerEmpSub').textContent=T.perEmpSub(nf(dpe),nf(R.costPerDay));

    /* risico-teaser op scherm — kleur op woord + dot, pulse/flash bij niveauwissel */
    $('riskVal').textContent = blank ? EMPTY : V.risk_level;
    var dot=$('riskDot');
    var teaser=document.querySelector('.b-risk-teaser');
    var rKey = blank ? 'neutral' : R.riskKey;
    var riskCol={neutral:'#8a8078',low:'#34A372',avg:'#E8B45C',elevated:'#F0764A',high:'#D62828'}[rKey]||'#F0764A';
    var riskSoft={neutral:'rgba(240,237,232,.12)',low:'rgba(52,163,114,.20)',avg:'rgba(232,180,92,.20)',elevated:'rgba(240,118,74,.20)',high:'rgba(214,40,40,.24)'}[rKey]||'rgba(240,118,74,.20)';
    if(teaser){ teaser.style.setProperty('--risk-col',riskCol); teaser.style.setProperty('--risk-soft',riskSoft); }
    var riskChanged = dot && dot.dataset.risk && dot.dataset.risk!==rKey;
    if(dot) dot.dataset.risk=rKey;
    if(riskChanged){
      if(dot){ dot.classList.remove('pulse'); void dot.offsetWidth; dot.classList.add('pulse'); }
      var rv=$('riskVal'); if(rv){ rv.classList.remove('flash'); void rv.offsetWidth; rv.classList.add('flash'); }
    }

    /* afgeleide tellers / velden — toon de werkelijk ingevoerde FTE (niet de geklemde) */
    var rawFte=state.fte>0?state.fte:0;
    var dispArb=Math.round(rawFte*state.splitA/100);
    $('arbCount').textContent=nf(dispArb);
    $('bedCount').textContent=nf(rawFte-dispArb);
    $('splitPctA').textContent=state.splitA;
    $('splitPctB').textContent=100-state.splitA;

    var verzPerEmp=R.verzPerEmp;
    var addons=R.voordelenPerEmpYr+verzPerEmp;
    $('addonsTotal').textContent=nf(addons);
    $('addonsMonth').textContent=nf(Math.round(addons/12));
    /* uitsplitsing per arbeider / per bediende — kost telt volledig mee als die voor de groep (of beide) geldt */
    (function(){
      function w(g,which){ return (g==='beide'||g===which)?1:0; }
      function addonFor(which){
        return (state.voordelen*w(state.grpVoordelen,which)+state.firmawagen*w(state.grpFirmawagen,which))*12
             + state.groepsv*w(state.grpGroepsv,which)+state.hospv*w(state.grpHospv,which)+state.andereverz*w(state.grpAndereverz,which);
      }
      var arb=addonFor('arbeider'), bed=addonFor('bediende');
      var ea=$('addonsArb'); if(ea) ea.textContent=nf(Math.round(arb));
      var eam=$('addonsArbM'); if(eam) eam.textContent=nf(Math.round(arb/12));
      var eb=$('addonsBed'); if(eb) eb.textContent=nf(Math.round(bed));
      var ebm=$('addonsBedM'); if(ebm) ebm.textContent=nf(Math.round(bed/12));
    })();
    var vt=$('verzTotal'); if(vt) vt.textContent=nf(verzPerEmp);
    var vYr=$('voordelenYr'); if(vYr) vYr.textContent=nf(state.voordelen*12);

    /* verzuim labels — per groep + samengevoegd dashboardcijfer */
    $('catKAv').textContent=nf(state.kA,2); $('catMAv').textContent=nf(state.mA,2); $('catLAv').textContent=nf(state.lA,2);
    $('catKBv').textContent=nf(state.kB,2); $('catMBv').textContent=nf(state.mB,2); $('catLBv').textContent=nf(state.lB,2);
    var totA=state.kA+state.mA+state.lA, totB=state.kB+state.mB+state.lB;
    var eTotA=$('totArb'); if(eTotA) eTotA.textContent=nf(totA,1);
    var eTotB=$('totBed'); if(eTotB) eTotB.textContent=nf(totB,1);
    var eArbN=$('vcArbN'); if(eArbN) eArbN.textContent=nf(dispArb);
    var eBedN=$('vcBedN'); if(eBedN) eBedN.textContent=nf(rawFte-dispArb);
    /* samengevoegd verzuim (alles samen) — headcount-gewogen uit de engine */
    var totEl=$('totVerzuim'); if(totEl) totEl.textContent=nf(R.totVerz,1);

    /* pill-kleur per categorie t.o.v. sectorbenchmark: groen=onder · oranje=op de rand · rood=boven */
    function pillClass(mine,avg){ var d=mine-avg; if(d < -0.2) return 'c-pill ok'; if(d > 0.2) return 'c-pill bad'; return 'c-pill warn'; }
    [['catKAv',state.kA,SECTOR.K],['catMAv',state.mA,SECTOR.M],['catLAv',state.lA,SECTOR.L],
     ['catKBv',state.kB,SECTOR.K],['catMBv',state.mB,SECTOR.M],['catLBv',state.lB,SECTOR.L]].forEach(function(p){
      var span=$(p[0]); if(!span) return;
      var pill=span.closest('.c-pill'); if(pill){ pill.className=pillClass(p[1],p[2]);
        /* use-of-color remediatie: relatie t.o.v. sector ook in tekst voor screenreaders */
        var rel=p[1]-p[2];
        var relTxt = LANG==='en'
          ? (rel<-0.2?'below sector average':rel>0.2?'above sector average':'around sector average')
          : (rel<-0.2?'onder sectorgemiddelde':rel>0.2?'boven sectorgemiddelde':'rond sectorgemiddelde');
        pill.setAttribute('aria-label', nf(p[1],2)+'% — '+relTxt);
      }
    });

    /* beknopte, gedebouncede screenreader-status (vervangt de over-announcing
       aria-live op het volledige paneel) */
    setSrStatus(blank,V);

    renderPreview(R,V);
    updateNudge();
    scheduleSave();
  }

  /* ─────────────── PDF MINI-PREVIEW (live) ─────────────── */
  function renderPreview(R,V){
    if(!$('pvAnnual')) return; /* preview verwijderd (juni 2026) — guard tegen ontbrekende markup */
    $('pvAnnual').textContent=V.annual_absence_cost;
    $('pvLost').textContent=V.lost_workdays_num;
    $('pvPerEmp').textContent=V.cost_per_employee;
    $('pvRate').textContent=V.absence_rate;
    /* benchmark bars */
    var you=R.totVerz, sec=R.sectorAverage, max=Math.max(12,you,sec);
    $('pvYouVal').textContent=V.absence_rate;
    $('pvSecVal').textContent=V.sector_average;
    $('pvYouBar').style.width=Math.min(100,(you/max)*100)+'%';
    $('pvSecBar').style.width=Math.min(100,(sec/max)*100)+'%';
    /* risk band */
    ['low','avg','elevated','high'].forEach(function(k){
      var seg=$('pvRisk_'+k);
      if(seg){ seg.classList.toggle('on', k===R.riskKey); seg.classList.toggle('low', k==='low'); }
    });
    $('pvRiskX').textContent=V.risk_explanation;
  }

  /* ─────────────── SCREENREADER-STATUS (beknopt + gedebounced) ─────────────── */
  function setSrStatus(blank,V){
    var el=$('bSrStatus'); if(!el) return;
    clearTimeout(setSrStatus._t);
    setSrStatus._t=setTimeout(function(){
      if(blank){
        el.textContent = LANG==='en'
          ? 'Enter your figures to see the result.'
          : 'Vul uw cijfers in om het resultaat te zien.';
        return;
      }
      el.textContent = LANG==='en'
        ? ('Estimated total absence cost '+V.annual_absence_cost+'. Absence rate '+V.absence_rate+'. Risk level: '+V.risk_level+'.')
        : ('Geschatte totale verzuimkost '+V.annual_absence_cost+'. Verzuimpercentage '+V.absence_rate+'. Risiconiveau: '+V.risk_level+'.');
    }, 650);
  }

  /* ─────────────── NUDGE ─────────────── */
  function updateNudge(){
    var n=$('bNudge'); if(!n) return;
    n.style.display = (!edited.fte && !edited.salary) ? 'flex' : 'none';
  }

  /* ─────────────── WIRING ─────────────── */
  function wireSliderNum(slId,numId,key,min,max,opts){
    opts=opts||{};
    var sl=$(slId), num=$(numId);
    setTrack(sl,min,max);
    sl.addEventListener('input',function(){
      state[key]=+sl.value;
      if(opts.flag) edited[opts.flag]=true;
      setTrack(sl,min,max);
      if(num && document.activeElement!==num) num.value=opts.fmt?nf(state[key]):state[key];
      compute();
    });
    if(num){
      num.addEventListener('input',function(){
        var raw=digitsBE(num.value);
        var v=Math.min(opts.hardMax||max,Math.max(opts.hardMin!=null?opts.hardMin:min,parseInt(raw,10)|| (opts.hardMin!=null?opts.hardMin:min)));
        state[key]=v;
        if(opts.flag) edited[opts.flag]=true;
        sl.value=Math.min(max,Math.max(min,v));
        setTrack(sl,min,max);
        compute();
      });
      num.addEventListener('blur',function(){ num.value=opts.fmt?nf(state[key]):state[key]; });
    }
  }

  wireSliderNum('fte','fteNum','fte',1,2000,{fmt:true,flag:'fte',hardMin:1,hardMax:25000});
  wireSliderNum('salary','salaryNum','salary',20000,120000,{fmt:true,flag:'salary',hardMin:0,hardMax:500000});

  /* ── Prefill vanuit de homepage-teaser (calculator.html?fte=…&salary=…) ── */
  (function(){
    try{
      var q=new URLSearchParams(location.search);
      function pre(key,slId,numId,min,max){
        if(!q.has(key)) return;
        var v=parseInt(q.get(key),10); if(!isFinite(v)) return;
        v=Math.min(max,Math.max(min,v));
        var sl=$(slId), num=$(numId);
        state[key]=v; edited[key]=true;
        if(sl){ sl.value=v; setTrack(sl,min,max); }
        if(num){ num.value=nf(v); }
      }
      pre('fte','fte','fteNum',1,25000);
      pre('salary','salary','salaryNum',0,500000);
    }catch(e){}
  })();

  /* split — toegankelijke range (0–100 arbeider%) + bewerkbaar % */
  (function(){
    var sl=$('splitRange'), num=$('splitNum');
    setTrack(sl,0,100);
    function apply(v){
      v=Math.min(100,Math.max(0,Math.round(v)));
      state.splitA=v; sl.value=v; setTrack(sl,0,100);
      if(document.activeElement!==num) num.value=v;
      compute();
    }
    sl.addEventListener('input',function(){ apply(+sl.value); });
    num.addEventListener('input',function(){
      var raw=digitsBE(num.value); apply(parseInt(raw,10)||0);
    });
    num.addEventListener('blur',function(){ num.value=state.splitA; });
  })();

  /* vaste kosten — nummervelden */
  ['voordelen','firmawagen','groepsv','hospv','andereverz'].forEach(function(k){
    var el=$(k); if(!el) return;
    el.addEventListener('input',function(){
      state[k]=parseInt(digitsBE(el.value),10)||0;
      compute();
    });
  });

  /* per-kost: arbeider / bediende / beide — weegt mee in de berekening */
  document.querySelectorAll('.b-grp').forEach(function(grp){
    var key=grp.getAttribute('data-grp');
    var btns=grp.querySelectorAll('button');
    function sync(){ btns.forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-val')===state[key]); }); }
    btns.forEach(function(btn){
      btn.addEventListener('click',function(){
        state[key]=btn.getAttribute('data-val');
        sync();
        compute();
      });
    });
    if(state[key]) sync();
  });

  /* verzuim per categorie — apart voor arbeiders en bedienden */
  (function(){
    [['catKA','kA'],['catMA','mA'],['catLA','lA'],['catKB','kB'],['catMB','mB'],['catLB','lB']].forEach(function(p){
      var c=$(p[0]); if(!c) return;
      setTrack(c,0,10);
      c.addEventListener('input',function(){
        state[p[1]]=+c.value; setTrack(c,0,10);
        compute();
      });
    });
  })();

  /* netto werkdagen — in de "verfijn"-disclosure (lage default-impact) */
  (function(){
    var sl=$('days'), num=$('daysNum'); if(!sl) return;
    setTrack(sl,180,240);
    function apply(v){
      v=Math.min(240,Math.max(180, v||220));
      state.days=v; sl.value=v; setTrack(sl,180,240);
      var dv=$('daysVal'); if(dv) dv.textContent=nf(v);
      compute();
    }
    sl.addEventListener('input',function(){
      state.days=+sl.value; setTrack(sl,180,240);
      var dv=$('daysVal'); if(dv) dv.textContent=nf(state.days);
      if(num) num.value=state.days;
      compute();
    });
    if(num){
      num.addEventListener('input',function(){ apply(parseInt(digitsBE(num.value),10)||0); });
      num.addEventListener('blur',function(){ num.value=state.days; });
    }
  })();

  /* vervangingskosten — factor (% van directe kosten) */
  (function(){
    var sl=$('vervangFactor'), num=$('vervangFactorNum'); if(!sl) return;
    setTrack(sl,0,100);
    function apply(v){
      v=Math.min(100,Math.max(0,v||0));
      state.vervangFactor=v;
      sl.value=v; setTrack(sl,0,100);
      if(num && document.activeElement!==num) num.value=v;
      compute();
    }
    sl.addEventListener('input',function(){ apply(+sl.value); });
    if(num){
      num.addEventListener('input',function(){ apply(parseInt(digitsBE(num.value),10)||0); });
      num.addEventListener('blur',function(){ num.value=state.vervangFactor; });
    }
  })();

  /* organisatorische impact — factor (% van directe loonkost) */
  (function(){
    var sl=$('orgFactor'), num=$('orgFactorNum'); if(!sl) return;
    setTrack(sl,0,150);
    function apply(v){
      v=Math.min(150,Math.max(0,v||0));
      state.orgFactor=v;
      sl.value=v; setTrack(sl,0,150);
      if(num && document.activeElement!==num) num.value=v;
      compute();
    }
    sl.addEventListener('input',function(){ apply(+sl.value); });
    if(num){
      num.addEventListener('input',function(){ apply(parseInt(digitsBE(num.value),10)||0); });
      num.addEventListener('blur',function(){ num.value=state.orgFactor; });
    }
  })();

  /* ── lichte inline-validatie: fte & salary moeten > 0 zijn (rest klemt zichzelf) ── */
  (function(){
    var must={fteNum:1,salaryNum:1};
    var MSG = LANG==='en' ? 'Please enter a value greater than 0.' : 'Vul een waarde groter dan 0 in.';
    function msgEl(inp){
      var f=inp.closest('.b-field'); if(!f) return null;
      var e=f.querySelector('.b-field-err');
      if(!e){ e=document.createElement('div'); e.className='b-field-err'; e.textContent=MSG; f.appendChild(e); }
      return e;
    }
    function check(inp){
      var nf=inp.closest('.b-numfield'); if(!nf) return;
      var digits=digitsBE(inp.value);
      var bad=(inp.id in must) && (digits==='' || parseInt(digits,10)<=0);
      nf.classList.toggle('is-error',bad);
      inp.setAttribute('aria-invalid',bad?'true':'false');
      var e=msgEl(inp); if(e) e.classList.toggle('show',bad);
    }
    document.querySelectorAll('.b-numfield input').forEach(function(inp){
      inp.addEventListener('input',function(){ check(inp); });
      inp.addEventListener('blur',function(){ check(inp); });
    });
  })();

  /* ── Cijfervelden: enkel cijfers + leidende nul weg (02 → 2) ── */
  (function(){
    var sel='.b-numfield input,#voordelen,#firmawagen,#groepsv,#hospv,#andereverz';
    function norm(inp){
      var d=digitsBE(inp.value).replace(/^0+(?=\d)/,'');
      if(inp.value!==d){ inp.value=d; }
    }
    document.querySelectorAll(sel).forEach(function(inp){
      inp.setAttribute('inputmode','numeric');
      /* capture-fase: normaliseer vóór de berekening-listeners de waarde lezen */
      inp.addEventListener('input',function(){ norm(inp); },true);
      /* selecteer bestaande waarde bij focus → typen vervangt i.p.v. plakt vóór een bestaand cijfer */
      inp.addEventListener('focus',function(){ requestAnimationFrame(function(){ try{ inp.select(); }catch(e){} }); });
    });
  })();

  /* ─────────────── WIZARD ─────────────── */
  (function(){
    var panels=Array.prototype.slice.call(document.querySelectorAll('.b-panel'));
    var steps=Array.prototype.slice.call(document.querySelectorAll('.b-step'));
    var prev=$('bPrev'), next=$('bNext'), cur=$('bStepCur');
    var total=panels.length, i=1;
    function render(){
      panels.forEach(function(p){ p.classList.toggle('is-active', +p.dataset.step===i); });
      steps.forEach(function(s){
        var n=+s.dataset.step;
        s.classList.toggle('is-done',n<i);
        s.classList.toggle('is-active',n===i);
        var b=s.querySelector('.step-btn'); if(b) b.setAttribute('aria-current', n===i?'step':'false');
      });
      cur.textContent=i;
      /* mobiele progress-bar (vervangt de 6-label-rij <760px) */
      var pb=$('bProgBar'), pc=$('bProgCur'), pn=$('bProgName');
      if(pb) pb.style.width=(i/total*100)+'%';
      if(pc) pc.textContent=i;
      if(pn){ var an=steps[i-1] && steps[i-1].querySelector('.name'); if(an) pn.textContent=an.textContent; }
      requestAnimationFrame(positionActiveLabel);
      prev.disabled=(i===1);
      $('bNextLabel').textContent = (i===total) ? (LANG==='en'?'See result':'Bekijk resultaat') : (LANG==='en'?'Next':'Volgende');
    }
    function stepValid(step){
      if(step===1) return state.fte>0;
      if(step===2) return state.salary>0;
      if(step===6) return (state.kA+state.mA+state.lA+state.kB+state.mB+state.lB)>0;
      return true; /* stappen 3·4·5 zijn optioneel */
    }
    function firstInvalidUpto(target){
      for(var s=1;s<target;s++){ if(!stepValid(s)) return s; }
      return 0;
    }
    var stepErrEl=$('bStepErr');
    function showStepError(step){
      if(stepErrEl){ stepErrEl.textContent=(T.stepErr&&T.stepErr[step])||''; stepErrEl.hidden=false; }
      var fid={1:'fteNum',2:'salaryNum',6:'catKA'}[step];
      if(fid && $(fid)){ try{ $(fid).focus(); }catch(e){} }
    }
    function clearStepError(){ if(stepErrEl){ stepErrEl.hidden=true; stepErrEl.textContent=''; } }
    ['fteNum','fte','salaryNum','salary','catKA','catMA','catLA','catKB','catMB','catLB'].forEach(function(id){
      var el=$(id); if(el) el.addEventListener('input',clearStepError);
    });
    function go(n){
      n=Math.min(total,Math.max(1,n));
      var blockAt = (n>i) ? firstInvalidUpto(n) : 0;   /* alleen bij vooruitgaan blokkeren */
      if(blockAt) n=blockAt;
      i=n;
      __step=i;
      var gate=$('bGate'); if(gate) gate.setAttribute('hidden','');  // verberg rapport bij elke navigatie
      render();
      saveSnapshot();
      if(blockAt){ showStepError(blockAt); return; }
      clearStepError();
      /* Analyse-event: stap bereikt (1× per stap per sessie) */
      try{ if(window.mtrack){ window.__cstep=window.__cstep||{}; if(!window.__cstep[i]){ window.__cstep[i]=1; window.mtrack('calculator_step_'+i,{step:i}); } } }catch(e){}
      /* focus de nieuwe panel-titel voor screenreaders */
      var active=panels[i-1].querySelector('h2'); if(active){ active.setAttribute('tabindex','-1'); try{ active.focus({preventScroll:true}); }catch(e){ } }
    }
    /* zet de actieve-stapnaam exact onder de actieve cirkel (mobiel/tablet),
       geclampt zodat lange namen niet buiten de kaart vallen */
    function positionActiveLabel(){
      var prog=document.querySelector('.b-progress');
      var txt=prog && prog.querySelector('.b-progress-txt');
      var circle=steps[i-1] && steps[i-1].querySelector('.circle');
      if(!prog||!txt||!circle) return;
      if(getComputedStyle(prog).display==='none'){ txt.style.left=''; return; }
      var pr=prog.getBoundingClientRect(); if(pr.width===0) return;
      var cr=circle.getBoundingClientRect();
      var cx=cr.left+cr.width/2-pr.left;
      var half=txt.offsetWidth/2, pad=2;
      var x=Math.max(half+pad, Math.min(cx, pr.width-half-pad));
      txt.style.left=x+'px';
    }
    window.addEventListener('resize',positionActiveLabel);
    /* onderkant van het witte preview-kader uitlijnen met de onderkant van de verzendknop (desktop) */
    function syncPreviewHeight(){
      var frame=$('bPdfFrame'), submit=$('bSubmit');
      if(!frame||!submit) return;
      if(window.innerWidth<760){ frame.style.maxHeight=''; return; }
      frame.style.maxHeight='none';
      var target=submit.getBoundingClientRect().bottom - frame.getBoundingClientRect().top;
      frame.style.maxHeight=Math.max(320, target)+'px';
    }
    window.addEventListener('resize',syncPreviewHeight);
    window.__betaGo=go;
    prev.addEventListener('click',function(){ go(i-1); });
    next.addEventListener('click',function(){
      if(i<total){ go(i+1); return; }
      /* laatste stap → valideer alle verplichte stappen (incl. verzuim) vóór het rapport */
      var bad=firstInvalidUpto(total+1);
      if(bad){ i=bad; var gb=$('bGate'); if(gb) gb.setAttribute('hidden',''); render(); showStepError(bad); return; }
      clearStepError();
      var gate=$('bGate'); gate.removeAttribute('hidden');
      /* Analyse-event: resultaat onthuld = calculator afgerond */
      try{ if(window.mtrack && !window.__ccompleted){ window.__ccompleted=1; var _r=(window.__betaReport&&window.__betaReport.results)||{}; window.mtrack('calculator_completed',{risk:(_r.risk&&_r.risk.level)||null}); } }catch(e){}
      var dw=$('bDefWarn'); if(dw) dw.style.display=(!edited.fte && !edited.salary)?'flex':'none';
      requestAnimationFrame(syncPreviewHeight);
      gate.scrollIntoView({behavior:'smooth',block:'start'});
    });
    steps.forEach(function(s){
      var b=s.querySelector('.step-btn');
      b.addEventListener('click',function(){ go(+s.dataset.step); });
    });
    var defBack=$('bDefBack');
    if(defBack) defBack.addEventListener('click',function(){ go(1); var ws=document.getElementById('bMain'); if(ws) ws.scrollIntoView({behavior:'smooth',block:'start'}); });
    document.addEventListener('keydown',function(e){
      if(e.target.matches('input,textarea,select,button,[contenteditable],summary')) return;
      if(e.key==='ArrowRight' && i<total){ e.preventDefault(); go(i+1); }
      if(e.key==='ArrowLeft'){ e.preventDefault(); go(i-1); }
    });
    render();

    /* ── altijd leeg starten: reset-knoppen wiren + oude sessie wissen ── */
    (function(){
      /* Event-delegatie zodat óók dynamisch geïnjecteerde reset-knoppen
         (bv. de "Opnieuw beginnen" in de focus-overlay) werken. */
      document.addEventListener('click',function(e){
        var btn = e.target && e.target.closest && e.target.closest('.js-calc-reset');
        if(!btn) return;
        var ok = (LANG==='en')
          ? confirm('Start over with a blank calculator? Your current entries will be cleared.')
          : confirm('Opnieuw beginnen met een lege calculator? Uw huidige invoer wordt gewist.');
        if(ok) resetAll();
      });
      /* Sessie-herstel (op verzoek terug, 3 juli 2026): bewaarde invoer < 24u herstellen,
         anders wissen. Verder wissen bij "Opnieuw beginnen" (resetAll) en na verzenden (showDownload). */
      (function(){
        var bar=$('bResumeBar');
        var raw; try{ raw=localStorage.getItem(SKEY); }catch(e){ raw=null; }
        var saved=null; if(raw){ try{ saved=JSON.parse(raw); }catch(e){ saved=null; } }
        var fresh = saved && saved.t && (Date.now()-saved.t < 864e5) && saved.state && (saved.state.fte>0 || saved.state.salary>0);
        if(fresh){
          Object.assign(state, saved.state);
          edited.fte = state.fte>0; edited.salary = state.salary>0;
          applyStateToUI();
          go(saved.step>0 ? saved.step : 1);
          if(bar) bar.hidden=false;
        } else {
          try{ localStorage.removeItem(SKEY); }catch(e){}
          if(bar) bar.hidden=true;
        }
      })();
    })();
  })();

  /* ─────────────── SUBMIT → echte server-side flow (klaar voor de sleutel) ─────────────── */
  (function(){
    var btn=$('bSubmit'); if(!btn) return;
    function showDownload(){
      try{ localStorage.removeItem(SKEY); }catch(e){}
      try{ if(window.mtrack){ window.mtrack('report_generated',{}); } }catch(e){}
      var b=$('bDownloadPdf'); if(!b) return;
      b.style.display='flex';
      var y=b.getBoundingClientRect().top+window.scrollY-130;
      try{ window.scrollTo({top:y,behavior:'smooth'}); }catch(e){ window.scrollTo(0,y); }
      setTimeout(function(){ try{ b.focus({preventScroll:true}); }catch(e){} },420);
    }
    ['cName','cCompany','cMail'].forEach(function(id){var inp=$(id);if(!inp)return;inp.addEventListener('input',function(){var fi=inp.closest('.f-input');if(fi)fi.classList.remove('is-error');inp.setAttribute('aria-invalid','false');var e=$('bFormErr');if(e)e.classList.remove('show');});});
    (function(){var cc=$('cConsent');if(cc)cc.addEventListener('change',function(){var cl=cc.closest('.b-consent');if(cl)cl.classList.remove('is-error');});})();
    btn.addEventListener('click',function(){
      var name=($('cName').value||'').trim();
      var company=($('cCompany').value||'').trim();
      var email=($('cMail').value||'').trim();
      var phone=($('cPhone').value||'').trim();
      var consent=$('cConsent').checked;
      var hp=($('botcheck')&&$('botcheck').value)||'';
      var err=$('bFormErr'); var msg=$('bPreviewMsg');
      function mark(id,bad){var inp=$(id);if(!inp)return;var fi=inp.closest('.f-input');if(fi)fi.classList.toggle('is-error',bad);inp.setAttribute('aria-invalid',bad?'true':'false');}
      var emailOk=/^\S+@\S+\.\S+$/.test(email);
      var bN=!name, bC=!company, bE=!emailOk, bP=false;
      mark('cName',bN); mark('cCompany',bC); mark('cMail',bE); mark('cPhone',bP);
      var cl=$('cConsent').closest('.b-consent'); if(cl) cl.classList.toggle('is-error',!consent);
      if(bN||bC||bE||bP||!consent){
        err.textContent=(!consent&&!(bN||bC||bE||bP)) ? (LANG==='en'?'Please accept the privacy statement to continue.':'Vink het privacy-akkoord aan om verder te gaan.') : (LANG==='en'?'Please complete the highlighted required fields.':'Vul de gemarkeerde verplichte velden in.');
        err.classList.add('show');
        var fb=bN?'cName':bC?'cCompany':bE?'cMail':bP?'cPhone':null; if(fb)$(fb).focus();
        return;
      }
      err.classList.remove('show');

      /* ── guard: calculator-kerninvoer moet geldig zijn vóór verzending ── */
      var s=window.__betaState||{};
      if(!(s.fte>0) || !(s.salary>0)){
        err.textContent = LANG==='en'
          ? 'Please complete your headcount and gross salary before requesting the report.'
          : 'Vul eerst uw aantal medewerkers en brutoloon in voor u het rapport aanvraagt.';
        err.classList.add('show');
        return;
      }

      var rep=window.__betaReport||{};
      var orig=btn.textContent; btn.disabled=true; btn.textContent=T.sending;
      var payload={
        lang:LANG,
        contact:{name:name,company:company,email:email,phone:phone,consent:consent},
        input:window.__betaState||{},
        vars:rep.vars||{},
        botcheck:hp
      };

      fetch('/api/calculator-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){ return r.json(); })
        .then(function(d){
          if(!d || !d.ok){
            // Functie mislukt maar niet fataal — toon pending melding
            btn.disabled=false; btn.textContent=orig;
            if(msg){ msg.textContent = T.successPending; msg.style.display='block'; }
            showDownload();
            return;
          }
          // Eerlijke status: enkel "verzonden" tonen als de mail effectief slaagde
          var sent = (d.mail_status==='sent') || (d.mail_status==null);
          try{ if(window.mtrack && sent){ window.mtrack('report_sent',{}); } }catch(e){}
          btn.textContent='✓';
          if(msg){ msg.textContent = sent ? T.successSent : T.successPending; msg.style.display='block'; }
          showDownload();
          setTimeout(function(){ btn.disabled=false; btn.textContent=orig; }, 5000);
        })
        .catch(function(){
          // Vangnet: toon een vriendelijke melding i.p.v. mailto-fallback
          btn.disabled=false; btn.textContent=orig;
          if(msg){ msg.textContent = T.successPending; msg.style.display='block'; }
          showDownload();
        });
    });
  })();

  /* Download rapport → SERVER-gerenderde PDF (Chromium) = exact het rapport uit
     de e-mail. Betrouwbaar op elk toestel; geen browser-'foto'-truc meer. */
  function openFullReport(){
    var b=$('bDownloadPdf'); if(!b) return;
    var label=b.getAttribute('data-label')||b.textContent; b.setAttribute('data-label',label);
    var busy=(LANG==='en'?'Preparing PDF…':'PDF voorbereiden…');
    var errMsg=(LANG==='en'?'Could not generate the PDF — please try again.':'Kon de PDF niet genereren — probeer het opnieuw.');
    function reset(){ b.disabled=false; b.removeAttribute('aria-busy'); b.textContent=label; }
    b.disabled=true; b.setAttribute('aria-busy','true'); b.textContent=busy;
    var payload={ action:'download', lang:LANG, input:(window.__betaState||state||{}),
      contact:{ name:($('cName')?$('cName').value:'')||'', company:($('cCompany')?$('cCompany').value:'')||'' } };
    fetch('/api/calculator-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){ if(!r.ok) throw new Error('http '+r.status); return r.blob(); })
      .then(function(blob){
        if(!blob || (String(blob.type).indexOf('pdf')===-1 && blob.size<1000)) throw new Error('geen pdf');
        var url=URL.createObjectURL(blob);
        var a=document.createElement('a'); a.href=url; a.download='montisoro-verzuimrapport.pdf';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function(){ try{URL.revokeObjectURL(url);}catch(e){} },5000);
        reset();
      })
      .catch(function(err){
        reset();
        alert(errMsg + (err && err.message ? '\n(' + err.message + ')' : ''));
      });
  }
  (function(){ var b=$('bDownloadPdf'); if(b) b.addEventListener('click', openFullReport); })();

  compute();
})();
