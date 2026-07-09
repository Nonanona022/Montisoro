/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — Pro tools module
   Adds: Conversion funnel · Pipeline forecast · Notes thread ·
         E-mail outbox · Site healthcheck · SEO dashboard ·
         A/B tests · Quote builder · AI assist · Lead scoring ·
         Geo/Industry tags · Last login · Page versions ·
         Agenda · Export center
═══════════════════════════════════════════════════════════════════ */
(function(){
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  'use strict';
  if (window.__adminToolsLoaded) return;
  window.__adminToolsLoaded = true;

  document.addEventListener('DOMContentLoaded', function(){
    if (!sessionStorage.getItem('admin.session')) return;
    init();
  });

  function init(){
    var DATA = window.AdminData.load();
    var $ = function(s,r){return (r||document).querySelector(s);};
    var $$ = function(s,r){return Array.from((r||document).querySelectorAll(s));};
    var esc = function(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML;};
    var fmt = function(n){return new Intl.NumberFormat('nl-BE').format(n);};

    /* ─── Data seeding ─── */
    DATA.margins = DATA.margins || {
      service: { min:20, max:25, avg:23 },
      cocc:    { min:45, max:55, avg:50 },
      storm:   { min:60, max:75, avg:68 },
      mixed:   { min:35, max:50, avg:42 }   // weighted blend — pas aan in Instellingen
    };
    DATA.leads.forEach(function(l){
      if (!l.notes_thread) l.notes_thread = l.notes ? [{ ts:l.ts, who:'Laurence', text:l.notes }] : [];
      if (!l.industry) l.industry = inferIndustry(l.org);
      if (!l.country) l.country = 'BE';
      if (!l.product_type){
        // Smart defaults based on source + value
        var src = l.source||'';
        if (src === 'casey-waitlist') l.product_type = 'storm';
        else if (src === 'fit-check') l.product_type = 'cocc';
        else if (src === 'calculator') l.product_type = 'service';
        else l.product_type = 'mixed';
      }
      l.score = computeScore(l);
    });
    DATA.team.forEach(function(u){
      u.last_login = u.last_login || (u.lastSeen === 'nu actief' ? new Date().toISOString().slice(0,16).replace('T',' ') :
                       u.lastSeen === '2u geleden' ? '2026-05-22 06:30' :
                       u.lastSeen === 'gisteren'   ? '2026-05-21 14:20' :
                                                      '2026-05-19 09:15');
      u.login_count = u.login_count || Math.floor(Math.random()*40+5);
    });
    DATA.outbox = DATA.outbox || [];
    if (!DATA.__outboxCleanV1){ DATA.outbox = (DATA.outbox||[]).filter(function(o){ return !(o && typeof o.id==='string' && /^o-00\d$/.test(o.id)); }); DATA.__outboxCleanV1 = true; }
    DATA.ab_tests = DATA.ab_tests || [
      { id:'ab-001', name:'Hero CTA · Home',     status:'running',  variants:[{label:'A · Plan een gesprek',views:1240,clicks:84},{label:'B · Boek diagnose',views:1198,clicks:112}], started:'2026-05-12' },
      { id:'ab-002', name:'ROI banner · Aanpak', status:'completed',variants:[{label:'A · Sticker stat',views:840,clicks:62},{label:'B · Inline question',views:835,clicks:48}], started:'2026-04-20' }
    ];
    DATA.health = DATA.health || {
      last_check: '2026-05-22 08:00',
      issues: [
        { id:'h-001', sev:'warning', area:'SEO',   what:'og:image ontbreekt op 3 pagina\'s', pages:['Home','about','contact'] },
        { id:'h-002', sev:'info',    area:'Speed', what:'Hero photo About kan compacter (2.1 MB → 480 KB)', pages:['about'] },
        { id:'h-003', sev:'ok',      area:'Links', what:'Alle interne links werken' },
        { id:'h-004', sev:'ok',      area:'SSL',   what:'Geldig tot 14 augustus 2026' },
        { id:'h-005', sev:'ok',      area:'Forms', what:'Formulieren via Netlify-backend (Resend)' }
      ]
    };
    DATA.seo = DATA.seo || {
      total_impressions: 28430,
      total_clicks: 1247,
      ctr: 4.4,
      avg_position: 12.8,
      top_queries: [
        { q:'verzuim capability', impr:4120, clicks:312, pos:3.2 },
        { q:'reintegratie consultancy', impr:3850, clicks:248, pos:4.1 },
        { q:'casey ai verzuim', impr:2410, clicks:184, pos:2.8 },
        { q:'storm verzuim platform', impr:1890, clicks:148, pos:5.5 },
        { q:'kb rit 3.0 belgië', impr:1640, clicks:88, pos:7.2 }
      ]
    };
    DATA.quotes = DATA.quotes || [];
    DATA.page_versions = DATA.page_versions || {};

    window.AdminData.save(DATA);

    /* ─── New sidebar items + views ─── */
    var sidebar = $('.sidebar');
    if (sidebar && !$('#tools-section')){
      var teamFoot = $('.sidebar-foot');
      var insertBefore = teamFoot || null;
      var html = ''
        + '<div class="sidebar-section sidebar-collapsible" id="tools-section" data-section="protools"><span><span class="toggle-mark">+</span><span>Pro tools</span></span></div>'
        + '<div class="nav-item" data-view="outbox" data-section="protools"><i class="ti ti-send"></i><span class="label">E-mail outbox</span></div>'
        + '<div class="nav-item" data-view="funnel" data-section="protools"><i class="ti ti-filter-stats"></i><span class="label">Conversie funnel</span></div>'
        + '<div class="nav-item" data-view="quotes" data-section="protools"><i class="ti ti-file-invoice"></i><span class="label">Offertes</span></div>';
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      while (tmp.firstChild){
        if (insertBefore) sidebar.insertBefore(tmp.firstChild, insertBefore);
        else sidebar.appendChild(tmp.firstChild);
      }
      // Re-wire newly inserted nav items
      sidebar.querySelectorAll('.nav-item[data-view]').forEach(function(n){
        n.addEventListener('click', function(){
          if (window.Admin && window.Admin.showView) window.Admin.showView(n.dataset.view);
        });
      });
    }

    /* ─── Insert new views ─── */
    var main = $('.main');
    if (main && !$('#view-outbox')){
      var v = document.createElement('div');
      v.innerHTML =
        '<section class="view" id="view-outbox"></section>' +
        '<section class="view" id="view-funnel"></section>' +
        '<section class="view" id="view-seo"></section>' +
        '<section class="view" id="view-health"></section>' +
        '<section class="view" id="view-abtests"></section>' +
        '<section class="view" id="view-quotes"></section>';
      while (v.firstChild) main.appendChild(v.firstChild);
    }

    /* ─── Render functions for new views ─── */

    window.init_outbox = function(){
      var v = $('#view-outbox');
      v.innerHTML =
        '<div class="help-banner is-amber" style="margin-bottom:14px"><i class="ti ti-flask u-mr-6"></i>'+mtT('tl_demo_notice')+'</div><div class="page-head"><div><div class="eyebrow">E-mail</div><h1>Outbox · <em>verzonden en wachtend</em></h1><p>Alle e-mails die u via de admin verstuurt. Stuur direct een nieuwe mail of bekijk de geschiedenis.</p></div>' +
        '<div class="page-head-actions"><button class="btn btn-primary" id="ob-new"><i class="ti ti-pencil"></i>Nieuwe e-mail</button></div></div>' +

        '<div class="kpi-row u-mb-24">' +
          kpiCard(mtT('tl_sent'), DATA.outbox.filter(function(o){return o.status==='sent';}).length, 'mail-check') +
          kpiCard(mtT('tl_queued'), DATA.outbox.filter(function(o){return o.status==='queued';}).length, 'clock') +
          kpiCard('Gefaald', DATA.outbox.filter(function(o){return o.status==='failed';}).length, 'alert-triangle') +
          kpiCard(mtT('tl_thisweek'), DATA.outbox.length, 'calendar-week') +
        '</div>' +

        '<div class="panel"><div class="panel-head"><h3>Outbox</h3></div><div class="panel-body is-flush">' +
          '<table class="tbl"><thead><tr><th>'+mtT('tl_h_to')+'</th><th>'+mtT('tl_h_subject')+'</th><th>'+mtT('tl_h_status')+'</th><th>'+mtT('tl_h_when')+'</th></tr></thead><tbody>' +
            DATA.outbox.map(function(o){
              var tag = o.status==='sent' ? '<span class="tag done">Verzonden</span>' :
                        o.status==='queued' ? '<span class="tag wait">'+mtT('tl_queued')+'</span>' :
                        '<span class="tag cold">'+mtT('tl_failed')+'</span>';
              return '<tr data-ob="'+esc(o.id)+'"><td><span class="name">'+esc(o.to)+'</span><span class="sub">'+esc(o.preview)+'</span></td><td>'+esc(o.subject)+'</td><td>'+tag+'</td><td><span class="sub">'+esc(o.ts)+'</span></td></tr>';
            }).join('') +
          '</tbody></table>' +
        '</div></div>';

      $('#ob-new').onclick = function(){ openComposeDrawer(); };
    };

    function openComposeDrawer(prefill){
      prefill = prefill || {};
      var drawer = $('#drawer'); var bd = $('#drawer-backdrop');
      drawer.innerHTML =
        '<div class="drawer-head"><div><div class="eyebrow">Nieuwe e-mail</div><h3>Verstuur een <em>bericht</em></h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
        '<div class="drawer-body">' +
          '<div class="field"><label>Aan</label><input id="ob-to" value="'+esc(prefill.to||'')+'" placeholder="naam@bedrijf.be"></div>' +
          '<div class="field"><label>Onderwerp</label><input id="ob-subj" value="'+esc(prefill.subject||'')+'"></div>' +
          '<div class="field"><label>Bericht</label><textarea class="tls-body" id="ob-body" rows="10">'+esc(prefill.body||'')+'</textarea></div>' +
          '<div class="help-banner"><i class="ti ti-info-circle"></i><p>In productie wordt deze e-mail via de Netlify-backend (Resend) verstuurd. In demo voegen we hem toe aan de outbox.</p></div>' +
        '</div>' +
        '<div class="drawer-foot"><button class="btn btn-primary" data-send><i class="ti ti-send"></i>Versturen</button><button class="btn btn-ghost" data-close><i class="ti ti-x"></i>Annuleer</button></div>';
      drawer.classList.add('is-open'); bd.classList.add('is-open');
      drawer.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click', function(){drawer.classList.remove('is-open');bd.classList.remove('is-open');});});
      drawer.querySelector('[data-send]').addEventListener('click', function(){
        var to = $('#ob-to').value.trim(), subj = $('#ob-subj').value.trim(), body = $('#ob-body').value.trim();
        if (!to || !subj){ window.Admin.showToast(mtT('toast_email_fields_required'), 'alert-triangle'); return; }
        DATA.outbox.unshift({ id:'o-'+Date.now(), to:to, subject:subj, preview:body.slice(0,80), ts:new Date().toISOString().slice(0,16).replace('T',' '), status:'sent', from:'hello@montisoro.com' });
        window.AdminData.save(DATA);
        drawer.classList.remove('is-open'); bd.classList.remove('is-open');
        window.Admin.showToast(mtT('toast_email_sent'));
        if (window.Admin.logActivity) window.Admin.logActivity('E-mail verstuurd · '+to, 'send');
        if (window.init_outbox) window.init_outbox();
      });
    }

    window.init_funnel = function(){
      var v = $('#view-funnel');
      var calc = DATA.submissions.calculator.length;
      var fit = DATA.submissions.fitcheck.length;
      var contact = DATA.submissions.contact.length;
      var won = DATA.leads.filter(function(l){return l.stage==='won';}).length;

      var stages = [
        { label:'Calculator', val:calc, w:100 },
        { label:'Fit check', val:fit, w:Math.round(fit/calc*100)||0 },
        { label:'Contact', val:contact, w:Math.round(contact/calc*100)||0 },
        { label:mtT('tl_won'), val:won, w:Math.round(won/calc*100)||0 }
      ];
      var convFitContact = fit ? Math.round(contact/fit*100) : 0;
      var convCalcWin = calc ? Math.round(won/calc*100) : 0;

      v.innerHTML =
        '<div class="help-banner is-amber" style="margin-bottom:14px"><i class="ti ti-flask u-mr-6"></i>'+mtT('tl_demo_notice')+'</div><div class="page-head"><div><div class="eyebrow">Conversie</div><h1>Hoe stroomt verkeer door uw <em>funnel?</em></h1><p>Van eerste klik tot gewonnen deal. Identificeer waar gebruikers afhaken.</p></div></div>' +

        '<div class="kpi-row u-mb-24">' +
          kpiCard('Calculator → Fit', (calc?Math.round(fit/calc*100):0)+'%', 'arrow-right') +
          kpiCard('Fit → Contact', convFitContact+'%', 'arrow-right') +
          kpiCard('Contact → Win', (contact?Math.round(won/contact*100):0)+'%', 'arrow-right') +
          kpiCard('Calc → Win', convCalcWin+'%', 'trending-up') +
        '</div>' +

        '<div class="panel"><div class="panel-head"><h3>Funnel <em>visualisatie</em></h3><div class="panel-sub">Elke stap toont % t.o.v. de start</div></div><div class="panel-body">' +
          '<div class="tls-col20">' +
          stages.map(function(s,i){
            return '<div>' +
              '<div class="tls-head">' +
                '<span class="tls-h15">'+(i+1)+'. '+esc(s.label)+'</span>' +
                '<span style="font-family:var(--a-serif);font-weight:900;font-size:22px;color:var(--a-orange);font-feature-settings:\'tnum\';">'+s.val+' <span class="tls-cap">('+s.w+'%)</span></span>' +
              '</div>' +
              '<div class="tls-bar">' +
                '<div style="width:'+s.w+'%;height:100%;background:linear-gradient(90deg, #E8592B, #C8824A);transition:width 1s var(--a-ease);"></div>' +
              '</div>' +
            '</div>';
          }).join('') +
          '</div>' +
        '</div></div>';
    };

    window.init_seo = function(){
      var v = $('#view-seo');
      var s = DATA.seo;
      v.innerHTML =
        '<div class="help-banner is-amber" style="margin-bottom:14px"><i class="ti ti-flask u-mr-6"></i>'+mtT('tl_demo_notice')+'</div><div class="page-head"><div><div class="eyebrow">SEO performance</div><h1>Wat brengt <em>verkeer?</em></h1><p>Google Search Console data — top zoekwoorden, impressies, klikken en positie.</p></div>' +
        '<div class="page-head-actions"><button class="btn btn-ghost"><i class="ti ti-refresh"></i>Vernieuw</button><button class="btn btn-ghost"><i class="ti ti-download"></i>Export</button></div></div>' +

        '<div class="kpi-row u-mb-24">' +
          kpiCard(mtT('tl_impr28'), fmt(s.total_impressions), 'eye') +
          kpiCard(mtT('tl_clicks28'), fmt(s.total_clicks), 'click') +
          kpiCard('CTR', s.ctr+'%', 'percentage') +
          kpiCard(mtT('an_avgpos'), s.avg_position, 'arrows-vertical') +
        '</div>' +

        '<div class="panel"><div class="panel-head"><h3>Top zoekwoorden</h3><div class="panel-sub">Waarvoor wordt u gevonden</div></div><div class="panel-body is-flush">' +
          '<table class="tbl"><thead><tr><th>'+mtT('tl_h_keyword')+'</th><th>'+mtT('an_impressions')+'</th><th>'+mtT('an_clicks')+'</th><th>'+mtT('an_ctr')+'</th><th>'+mtT('tl_h_position')+'</th></tr></thead><tbody>' +
          s.top_queries.map(function(q){
            return '<tr><td><span class="name">'+esc(q.q)+'</span></td><td>'+fmt(q.impr)+'</td><td>'+fmt(q.clicks)+'</td><td>'+(q.impr?(q.clicks/q.impr*100).toFixed(1):'0')+'%</td><td><span class="tag '+(q.pos<5?'done':q.pos<10?'wait':'cold')+'">'+q.pos.toFixed(1)+'</span></td></tr>';
          }).join('') +
          '</tbody></table>' +
        '</div></div>';
    };

    window.init_health = function(){
      var v = $('#view-health');
      var h = DATA.health;
      var sevColor = { warning:'wait', info:'cold', ok:'new', error:'cold' };
      v.innerHTML =
        '<div class="help-banner is-amber" style="margin-bottom:14px"><i class="ti ti-flask u-mr-6"></i>'+mtT('tl_demo_notice')+'</div><div class="page-head"><div><div class="eyebrow">Site healthcheck</div><h1>Hoe gezond is de <em>website?</em></h1><p>Laatste check: '+esc(h.last_check)+'. We scannen automatisch op dode links, SEO-issues, SSL, en form-status.</p></div>' +
        '<div class="page-head-actions"><button class="btn btn-primary" id="run-check"><i class="ti ti-refresh"></i>Run check</button></div></div>' +

        '<div class="kpi-row u-mb-24">' +
          kpiCard(mtT('tl_issues'), h.issues.filter(function(i){return i.sev==='warning'||i.sev==='error';}).length, 'alert-circle') +
          kpiCard('Info', h.issues.filter(function(i){return i.sev==='info';}).length, 'info-circle') +
          kpiCard('OK', h.issues.filter(function(i){return i.sev==='ok';}).length, 'circle-check') +
          kpiCard(mtT('tl_score'), '8.7', 'medal') +
        '</div>' +

        '<div class="panel"><div class="panel-head"><h3>Bevindingen</h3></div><div class="panel-body is-flush"><div class="feed">' +
          h.issues.map(function(i){
            return '<div class="feed-item"><div class="feed-icon '+(i.sev==='warning'?'fit':i.sev==='ok'?'cal':'')+'"><i class="ti ti-'+(i.sev==='warning'?'alert-triangle':i.sev==='ok'?'circle-check':'info-circle')+'"></i></div>' +
              '<div class="feed-meta"><div class="feed-title"><b>'+esc(i.area)+'</b> · '+esc(i.what)+'</div>'+(i.pages?'<div class="feed-sub">Pagina\'s: '+esc(i.pages.join(', '))+'</div>':'')+'</div>' +
              '<span class="tag '+sevColor[i.sev]+'">'+(i.sev==='ok'?'OK':i.sev==='warning'?mtT('tl_warning'):mtT('tl_info'))+'</span></div>';
          }).join('') +
        '</div></div></div>';

      $('#run-check').onclick = function(){
        h.last_check = new Date().toISOString().slice(0,16).replace('T',' ');
        window.AdminData.save(DATA);
        window.Admin.showToast(mtT('toast_healthcheck_done'));
        window.init_health();
      };
    };

    window.init_abtests = function(){
      var v = $('#view-abtests');
      v.innerHTML =
        '<div class="help-banner is-amber" style="margin-bottom:14px"><i class="ti ti-flask u-mr-6"></i>'+mtT('tl_demo_notice')+'</div><div class="page-head"><div><div class="eyebrow">A/B tests</div><h1>Welke versie <em>wint?</em></h1><p>Test varianten van hero CTA\'s, banners en headers. Conversie wordt automatisch gemeten.</p></div>' +
        '<div class="page-head-actions"><button class="btn btn-primary" id="ab-new"><i class="ti ti-plus"></i>Nieuwe test</button></div></div>' +

        '<div class="grid-2">' +
          DATA.ab_tests.map(function(t){
            var typeLabel = t.type==='banner' ? mtT('tl_banner_bg') : (t.type==='cta' ? mtT('tl_hero_cta') : mtT('tl_element'));
            var ctx = t.page ? '<div class="u-mb-12"><span class="tag tls-pill"><i class="ti ti-'+(t.type==='banner'?'photo':'click')+' u-mr-5"></i>'+esc(typeLabel)+' \u00b7 '+esc(t.page)+'</span></div>' : '';
            return '<div class="panel"><div class="panel-head"><div><h3>'+esc(t.name)+'</h3><div class="panel-sub">Gestart: '+esc(t.started)+'</div></div><span class="tag '+(t.status==='running'?'new':'done')+'">'+(t.status==='running'?'Lopend':'Afgerond')+'</span></div>' +
              '<div class="panel-body">' + ctx +
              t.variants.map(function(v){
                var ctr = v.views ? (v.clicks/v.views*100).toFixed(1) : '0';
                var best = v.views && t.variants.indexOf(v) === t.variants.reduce(function(bi,vv,i){return (vv.views && (vv.clicks/vv.views) > (t.variants[bi].clicks/(t.variants[bi].views||1))) ? i : bi;}, 0);
                var swatch = v.swatch ? '<span style="display:inline-block;width:14px;height:14px;border-radius:4px;border:1px solid rgba(29,29,31,0.25);background:'+esc(v.swatch)+';vertical-align:-2px;margin-right:7px;"></span>' : '';
                return '<div style="margin-bottom:14px;padding:14px;background:rgba(29,29,31,0.03);border:1px solid '+(best?'rgba(232,89,43,0.30)':'var(--a-div)')+';border-radius:10px;">' +
                  '<div class="tls-split"><b class="a-t13">'+swatch+esc(v.label)+'</b>'+(best?'<span class="tag done">Winnaar</span>':'')+'</div>' +
                  '<div class="tls-legend"><span><b class="u-c-off">'+fmt(v.views)+'</b> views</span><span><b class="u-c-off">'+fmt(v.clicks)+'</b> clicks</span><span><b class="u-c-orange">'+ctr+'%</b> CTR</span></div>' +
                '</div>';
              }).join('') +
              '</div></div>';
          }).join('') +
        '</div>';
      var newBtn = $('#ab-new');
      if (newBtn) newBtn.onclick = openAbDrawer;
      updateAbBadge();
    };

    function updateAbBadge(){
      var badge = document.getElementById('abNavBadge');
      if (!badge) return;
      var probs = (DATA.ab_tests || []).filter(function(t){
        if (t.status !== 'running') return false;
        var a = t.variants[0], b = t.variants[1];
        if (!a || !b || !a.views || !b.views) return false;
        return (b.clicks / b.views) > (a.clicks / a.views); // variant B verslaat de huidige live A
      }).length;
      if (probs > 0){ badge.textContent = probs; badge.style.display = ''; }
      else { badge.style.display = 'none'; }
    }

    var BANNER_SWATCHES = [['#13100D',mtT('tl_sw_black')],['#0D0905',mtT('tl_sw_deep')],['#1A1410',mtT('tl_sw_warm')],['#1C1814',mtT('tl_sw_charcoal')]];

    function openAbDrawer(){
      var drawer = $('#drawer'); var bd = $('#drawer-backdrop');
      var pages = DATA.pages || [];
      var state = { pageIdx:0, type:'cta' };
      var pickedSwatch = null;
      function curPage(){ return pages[state.pageIdx]; }

      function variantBlock(){
        var p = curPage(); if (!p) return '';
        if (state.type === 'cta'){
          var aLabel = (p.hero && p.hero.cta_primary && (p.hero.cta_primary.nl || p.hero.cta_primary.label)) || 'Plan een gesprek \u2192';
          return '<div class="field"><label>Variant A \u00b7 huidige CTA (controle)</label>' +
              '<input class="u-op7" type="text" value="'+esc(aLabel)+'" disabled></div>' +
            '<div class="field"><label>Variant B \u00b7 nieuwe CTA-tekst</label>' +
              '<input type="text" id="ab-vb" placeholder="Bijv. Boek een diagnose \u2192"></div>';
        }
        var curColor = (p.banner && p.banner.color) || '#13100D';
        var aName = (BANNER_SWATCHES.filter(function(s){return s[0].toLowerCase()===curColor.toLowerCase();})[0]||['',curColor])[1] || curColor;
        var sw = BANNER_SWATCHES.map(function(s){
          var on = s[0].toLowerCase()===curColor.toLowerCase();
          return '<button type="button" class="bnr-sw" data-ab-sw="'+s[0]+'" title="'+s[1]+'" style="background:'+s[0]+';opacity:'+(on?'.4':'1')+';" '+(on?'disabled':'')+'></button>';
        }).join('');
        return '<div class="field"><label>Variant A \u00b7 huidige banner (controle)</label>' +
            '<div class="a-flex10"><span style="display:inline-block;width:22px;height:22px;border-radius:6px;border:1px solid rgba(29,29,31,0.25);background:'+esc(curColor)+';"></span><b class="a-t13">'+esc(aName)+'</b></div></div>' +
          '<div class="field"><label>Variant B \u00b7 andere achtergrondkleur</label><div class="tls-flex9" id="ab-swwrap">'+sw+'</div>' +
            '<div class="tls-note8">Kies een kleur die verschilt van de huidige. De grijze is de huidige (controle).</div></div>';
      }

      function html(){
        var pageOpts = pages.map(function(p,i){ return '<option value="'+i+'"'+(i===state.pageIdx?' selected':'')+'>'+esc(p.slug)+'</option>'; }).join('');
        return '<div class="drawer-head"><div><div class="eyebrow">A/B test</div><h3>Nieuwe <em>test</em></h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
          '<div class="drawer-body">' +
            '<div class="field"><label>Pagina</label><select id="ab-page" class="a-input">'+pageOpts+'</select></div>' +
            '<div class="field"><label>Wat test je?</label><div class="tabs tls-plainbtn">' +
              '<button type="button" class="tab'+(state.type==='cta'?' is-active':'')+' tls-minw120" data-ab-type="cta"><i class="ti ti-click u-mr-6"></i>Hero CTA</button>' +
              '<button type="button" class="tab'+(state.type==='banner'?' is-active':'')+' tls-minw120" data-ab-type="banner"><i class="ti ti-photo u-mr-6"></i>Banner</button>' +
            '</div></div>' +
            '<div id="ab-variants">'+variantBlock()+'</div>' +
            '<div class="help-banner"><i class="ti ti-info-circle"></i><p>Variant A is altijd de <b>huidige</b> live-instelling van deze pagina (uit Content \u2192 Pagina\'s). De test verdeelt het verkeer 50/50 en meet welke variant meer clicks haalt. <b>Demo:</b> metingen starten op 0; bij echte koppeling wordt het verkeer automatisch gemeten.</p></div>' +
          '</div>' +
          '<div class="drawer-foot"><button class="btn btn-primary" data-create><i class="ti ti-flask"></i>Test starten</button><button class="btn btn-ghost" data-close><i class="ti ti-x"></i>Annuleer</button></div>';
      }

      function wireVariant(){
        pickedSwatch = null;
        drawer.querySelectorAll('[data-ab-sw]').forEach(function(sw){
          sw.addEventListener('click', function(){
            pickedSwatch = sw.dataset.abSw;
            drawer.querySelectorAll('[data-ab-sw]').forEach(function(x){ x.style.outline=''; });
            sw.style.outline = '2px solid var(--a-orange)'; sw.style.outlineOffset='2px';
          });
        });
      }

      function wire(){
        drawer.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', function(){ drawer.classList.remove('is-open'); bd.classList.remove('is-open'); }); });
        var pageSel = $('#ab-page');
        if (pageSel) pageSel.addEventListener('change', function(){ state.pageIdx = parseInt(pageSel.value,10); $('#ab-variants').innerHTML = variantBlock(); wireVariant(); });
        drawer.querySelectorAll('[data-ab-type]').forEach(function(t){
          t.addEventListener('click', function(){ state.type = t.dataset.abType; drawer.innerHTML = html(); wire(); });
        });
        wireVariant();
        drawer.querySelector('[data-create]').addEventListener('click', createTest);
      }

      function createTest(){
        var p = curPage(); if (!p) return;
        var test;
        if (state.type === 'cta'){
          var aLabel = (p.hero && p.hero.cta_primary && (p.hero.cta_primary.nl || p.hero.cta_primary.label)) || 'Plan een gesprek \u2192';
          var bInput = $('#ab-vb'); var bLabel = bInput ? bInput.value.trim() : '';
          if (!bLabel){ window.Admin.showToast(mtT('toast_ab_text_required')); return; }
          test = { id:'ab-'+Date.now(), name:'Hero CTA \u00b7 '+p.slug, type:'cta', page:p.slug, status:'running', started:new Date().toISOString().slice(0,10),
            variants:[ {label:'A \u00b7 '+aLabel, views:0, clicks:0}, {label:'B \u00b7 '+bLabel, views:0, clicks:0} ] };
        } else {
          var curColor = (p.banner && p.banner.color) || '#13100D';
          if (!pickedSwatch){ window.Admin.showToast(mtT('toast_ab_color_required')); return; }
          function nm(c){ return (BANNER_SWATCHES.filter(function(s){return s[0].toLowerCase()===c.toLowerCase();})[0]||['',c])[1] || c; }
          test = { id:'ab-'+Date.now(), name:'Banner \u00b7 '+p.slug, type:'banner', page:p.slug, status:'running', started:new Date().toISOString().slice(0,10),
            variants:[ {label:'A \u00b7 '+nm(curColor), swatch:curColor, views:0, clicks:0}, {label:'B \u00b7 '+nm(pickedSwatch), swatch:pickedSwatch, views:0, clicks:0} ] };
        }
        DATA.ab_tests.unshift(test);
        window.AdminData.save(DATA);
        drawer.classList.remove('is-open'); bd.classList.remove('is-open');
        window.Admin.showToast(mtT('toast_ab_started')+test.name);
        if (window.Admin.logActivity) window.Admin.logActivity('A/B test gestart \u00b7 '+test.name, 'flask');
        window.init_abtests();
      }

      drawer.innerHTML = html();
      drawer.classList.add('is-open'); bd.classList.add('is-open');
      wire();
    }

    window.init_quotes = function(){
      var v = $('#view-quotes');
      v.innerHTML =
        '<div class="help-banner is-amber" style="margin-bottom:14px"><i class="ti ti-flask u-mr-6"></i>'+mtT('tl_demo_notice')+'</div><div class="page-head"><div><div class="eyebrow">Offertes</div><h1>Voorstellen <em>genereren</em></h1><p>Maak in 60 seconden een gebrand voorstel op basis van een lead en hun fit check antwoord.</p></div>' +
        '<div class="page-head-actions"><button class="btn btn-primary" id="q-new"><i class="ti ti-plus"></i>Nieuwe offerte</button></div></div>' +
        (DATA.quotes.length === 0 ?
          '<div class="empty"><div class="ico"><i class="ti ti-file-invoice"></i></div><h4>Nog geen offertes</h4><p>Klik op "Nieuwe offerte" om vanuit een lead een voorstel te genereren met fit check data, ROI cijfer en aanbevolen route.</p></div>' :
          '<div class="grid-3">'+DATA.quotes.map(function(q){
            return '<div class="panel a-p22"><h class="tls-h16"4>'+esc(q.lead)+'</h4><div class="tls-sub14">'+esc(q.org)+' · '+esc(q.value)+'</div><button class="btn btn-ghost u-w100"><i class="ti ti-eye"></i>Bekijken</button></div>';
          }).join('')+'</div>'
        );

      $('#q-new').onclick = function(){
        var drawer = $('#drawer'); var bd = $('#drawer-backdrop');
        var leads = DATA.leads.filter(function(l){return l.stage==='diagnostic'||l.stage==='qualified';});
        drawer.innerHTML =
          '<div class="drawer-head"><div><div class="eyebrow">Offerte genereren</div><h3>Nieuwe <em>offerte</em></h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
          '<div class="drawer-body">' +
            '<div class="field"><label>Voor welke lead?</label><select id="q-lead" class="a-input">'+leads.map(function(l){return '<option value="'+l.id+'">'+esc(l.name)+' · '+esc(l.org)+'</option>';}).join('')+'</select></div>' +
            '<div class="field"><label>Pakket</label><select id="q-pkg" class="a-input">' +
              '<option value="Capability Building">Capability Building · €40-80K</option>' +
              '<option value="Human Reintegration">Human Reintegration · €60-100K</option>' +
              '<option value="Operating System">Operating System (Storm) · €80-150K</option>' +
              '<option value="Strategy & Governance">Strategy & Governance · €50-90K</option>' +
              '<option value="Culture of Care">Culture of Care · €40-70K</option>' +
            '</select></div>' +
            '<div class="help-banner"><i class="ti ti-bulb"></i><p>De offerte wordt automatisch gegenereerd met de fit check data, ROI cijfer en aanbevolen route van deze lead.</p></div>' +
          '</div>' +
          '<div class="drawer-foot"><button class="btn btn-primary" data-gen><i class="ti ti-file-plus"></i>Offerte genereren</button><button class="btn btn-ghost" data-close><i class="ti ti-x"></i>Annuleer</button></div>';
        drawer.classList.add('is-open'); bd.classList.add('is-open');
        drawer.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click', function(){drawer.classList.remove('is-open');bd.classList.remove('is-open');});});
        drawer.querySelector('[data-gen]').addEventListener('click', function(){
          var leadId = $('#q-lead').value;
          var pkg = $('#q-pkg').value;
          var l = DATA.leads.find(function(x){return x.id===leadId;});
          if (!l) return;
          DATA.quotes.unshift({ id:'q-'+Date.now(), lead:l.name, org:l.org, value:l.value, pkg:pkg, ts:new Date().toISOString().slice(0,10) });
          window.AdminData.save(DATA);
          drawer.classList.remove('is-open'); bd.classList.remove('is-open');
          window.Admin.showToast(mtT('toast_quote_generated')+l.name);
          if (window.Admin.logActivity) window.Admin.logActivity('Offerte gegenereerd · '+l.name, 'file-plus');
          window.init_quotes();
        });
      };
    };

    /* ─── Lead enhancements ─── */
    // Hook into existing lead drawer by patching openLeadDrawer if accessible
    // Since we cannot replace, we add a global helper and wire on lead card click
    var origInit = window.init_leads;
    if (origInit){
      window.init_leads = function(){
        origInit();
        // Re-attach extra info onto pipeline cards
        $$('.pipe-card[data-lead-id]').forEach(function(card){
          var leadId = card.dataset.leadId;
          var l = DATA.leads.find(function(x){return x.id===leadId;});
          if (!l) return;
          // Add score badge
          if (!card.querySelector('.pc-score')){
            var score = l.score;
            var scoreColor = score >= 80 ? '#5ABF7E' : score >= 50 ? '#E8B45C' : '#6b7280';
            var badge = document.createElement('div');
            badge.className = 'pc-score';
            badge.style.cssText = 'position:absolute;top:10px;right:10px;font-size:10px;font-weight:700;color:'+scoreColor+';background:rgba(0,0,0,0.30);border:1px solid '+scoreColor+';border-radius:4px;padding:2px 6px;letter-spacing:.04em;';
            badge.textContent = score;
            card.style.position = 'relative';
            card.appendChild(badge);
          }
        });
      };
      if ($('#view-leads.is-active')) window.init_leads();
    }

    /* ─── Lead score helper (margin-weighted, range-based) ─── */
    function computeScore(l){
      var score = 30;
      var v = parseInt(String(l.value).replace(/\D/g,''),10) || 0;
      // Use AVG MARGIN of range — conservative midpoint
      var mConf = (DATA.margins && DATA.margins[l.product_type||'mixed']) || { avg:42 };
      var marginPct = typeof mConf === 'number' ? mConf : mConf.avg;
      var marginValue = v * marginPct / 100;
      // Score on margin-value
      if (marginValue >= 50)      score += 30;  // €50K+ marge
      else if (marginValue >= 25) score += 20;  // €25-50K marge
      else if (marginValue >= 10) score += 10;  // €10-25K marge
      // Source weight
      if (l.source === 'fit-check') score += 20;
      else if (l.source === 'casey-waitlist') score += 15;
      else if (l.source === 'calculator') score += 10;
      else if (l.source === 'referral') score += 25;
      // Stage weight
      if (l.stage === 'qualified' || l.stage === 'diagnostic') score += 10;
      if (l.stage === 'proposal') score += 15;
      if (l.stage === 'cold') score = 10;
      return Math.min(100, score);
    }

    /* ─── Industry inferrer ─── */
    function inferIndustry(org){
      var s = String(org).toLowerCase();
      if (/volvo|alcon|lyondell|lonza|emeis|legend|rockwool|vaillant|novartis|axa|howden/.test(s)){
        if (/novartis|alcon|legend|lonza/.test(s)) return 'Pharma';
        if (/volvo|lyondell|rockwool|vaillant|howden/.test(s)) return 'Industry';
        if (/axa/.test(s)) return 'Insurance';
        if (/emeis/.test(s)) return 'Healthcare';
      }
      return 'Other';
    }

    /* ─── Team last login extension ─── */
    var origTeamInit = window.init_team;
    if (origTeamInit){
      window.init_team = function(){
        origTeamInit();
        $$('#team-grid .panel').forEach(function(card, idx){
          var u = DATA.team[idx];
          if (!u || card.querySelector('.last-login')) return;
          var info = document.createElement('div');
          info.className = 'last-login';
          info.style.cssText = 'font-size:11px;color:var(--a-muted-3);margin-top:6px;text-align:center;font-feature-settings:"tnum";letter-spacing:.02em;';
          info.innerHTML = '<i class="ti ti-clock-hour-3 tls-ico-mut"></i>Laatst ingelogd: '+esc(u.last_login)+' · '+u.login_count+' sessies';
          card.appendChild(info);
        });
      };
      if ($('#view-team.is-active')) window.init_team();
    }

    /* ─── Helper UI ─── */
    function kpiCard(label, val, icon){
      return '<div class="kpi-card">' +
        '<div class="kpi-label"><span class="ico"><i class="ti ti-'+esc(icon)+'"></i></span>'+esc(label)+'</div>' +
        '<div class="kpi-value">'+esc(val)+'</div>' +
      '</div>';
    }

    /* ─── Overview: add conversion funnel mini chart ─── */
    var origOverview = window.init_overview;
    if (origOverview){
      window.init_overview = function(){
        origOverview();
        // Mini funnel widget removed at user request — see Conversie funnel page instead
        return;
        if (!$('#mini-funnel')){
          var view = $('#view-overview');
          if (view){
            var calc = DATA.submissions.calculator.length;
            var fit = DATA.submissions.fitcheck.length;
            var contact = DATA.submissions.contact.length;
            var won = DATA.leads.filter(function(l){return l.stage==='won';}).length;
            var panel = document.createElement('div');
            panel.className = 'panel';
            panel.id = 'mini-funnel';
            panel.style.cssText = 'margin-top:24px;';
            panel.innerHTML =
              '<div class="panel-head"><div><h3>Conversie <em>funnel</em></h3><div class="panel-sub">Van eerste interactie tot deal</div></div><a class="panel-link" data-go-funnel>Volledig dashboard →</a></div>' +
              '<div class="panel-body">' +
                '<div class="tls-stats4">' +
                  [['Calculator',calc,'calculator'],['Fit check',fit,'compass'],['Contact',contact,'mail'],[mtT('tl_won'),won,'check']].map(function(s){
                    return '<div class="tls-stat">' +
                      '<i class="ti ti-'+s[2]+' tls-stat-ico"></i>' +
                      '<div class="tls-stat-num">'+s[1]+'</div>' +
                      '<div class="tls-stat-lbl">'+s[0]+'</div>' +
                    '</div>';
                  }).join('') +
                '</div>' +
              '</div>';
            view.appendChild(panel);
            panel.querySelector('[data-go-funnel]')?.addEventListener('click', function(){ window.Admin.showView('funnel'); });
          }
        }
      };
      if ($('#view-overview.is-active')) window.init_overview();
    }

    /* ─── Done ─── */
    updateAbBadge();
    if (window.Admin && window.Admin.logActivity){
      // Don't log on every init — leave silent
    }
  }
})();
