/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — Enterprise module (final production layer)
   - GDPR data request workflow
   - Klant onboarding flow
   - Executive dashboard
   - Cookie consent log
   - Document hub
═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__adminEnterpriseLoaded) return;
  window.__adminEnterpriseLoaded = true;

  document.addEventListener('DOMContentLoaded', function(){
    if (!sessionStorage.getItem('admin.session')) return;
    setTimeout(init, 80);
  });

  function init(){
    var DATA = window.AdminData.load();
    var $  = function(s,r){return (r||document).querySelector(s);};
    var $$ = function(s,r){return Array.from((r||document).querySelectorAll(s));};
    var esc = function(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML;};

    /* ─── i18n (follows MONTISORO_ADMIN_I18N) ─── */
    function aLang(){ return window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.getLang() : (DATA.adminLang||'nl'); }
    var STR = {
      nl: {
        fb_help:'Hier beheert u alle berekeningen die de admin én de publieke calculator gebruiken. Wijzigingen worden direct toegepast. <b>Pas alleen aan als u weet wat de impact is.</b>',
        m_title:'Marges per <em>productlijn</em>', m_sub:'Gebruikt voor lead scoring · marge-gewogen waarde',
        m_th_line:'Productlijn', m_th_min:'Min %', m_th_max:'Max %', m_th_avg:'Gemiddeld (avg) %',
        ml_service:'Service', ml_cocc:'COCC / opleiding', ml_storm:'Storm SaaS', ml_mixed:'Mixed (default)', m_save:'Marges opslaan',
        sc_title:'Lead scoring <em>thresholds</em>', sc_sub:'Bij welke effectieve marge krijgt een lead extra punten',
        sc_prem:'Premium deal — effectieve marge ≥ €X duizend (+30 punten)', sc_strong:'Sterke deal — effectieve marge ≥ €X duizend (+20 punten)', sc_base:'Basis deal — effectieve marge ≥ €X duizend (+10 punten)',
        sc_def:'Standaard:', sc_save:'Thresholds opslaan',
        cf_title:'Verzuimcalculator <em>formules</em>', cf_sub:'Waardes voor de publieke ROI calculator op de website',
        cf_cost:'Gemiddelde kost per verzuimdag (€)', cf_cost_h:'Default: €250', cf_days:'Werkdagen per medewerker (jaar)', cf_days_h:'Default: 220 - 16 absence = 204',
        cf_load:'Loonkost-laag (sociale lasten %)', cf_load_h:'Default: 30%', cf_short:'SD Worx · Kort verzuim sectorgemiddelde %', cf_short_h:'Default: 2.1%',
        cf_mid:'SD Worx · Middellang verzuim %', cf_mid_h:'Default: 1.4%', cf_long:'SD Worx · Langdurig verzuim %', cf_long_h:'Default: 1.8%',
        cf_warn:'Wijzigingen aan deze formules worden in productie automatisch toegepast op <em>calculator.html</em>. Ze sturen wat klanten zien op de website.', cf_save:'Calculator formule opslaan',
        toast_margins:'Marges opgeslagen', toast_thresholds:'Score thresholds opgeslagen', toast_formula:'Calculator formule opgeslagen',
        sb_enterprise:'Enterprise', sb_executive:'Executive', sb_documents:'Documenten', sb_gdpr:'GDPR verzoeken', sb_cookies:'Cookie log',
        ex_eyebrow:'Executive cockpit', ex_h1:'Goedemiddag, <em>Laurence</em>', ex_p:'De gezondheid van Montisoro in één scherm — voor strategische beslissingen.', ex_print:'Print rapport',
        ex_arr_sub:'Annual recurring · gewonnen', ex_pipe:'Pipeline', ex_pipe_sub:'Open opportunities', ex_win:'Win rate', ex_win_sub:'Last 90 dagen', ex_won:'Won deals', ex_won_sub:'This quarter',
        ex_pipe_t:'Pipeline per <em>fase</em>', ex_pipe_s:'Verwachte omzet per stage', st_qualified:'Gekwalificeerd', st_diagnostic:'Diagnose', st_proposal:'Voorstel', leads_word:'leads',
        ex_ind_t:'Omzet per <em>sector</em>', ex_ind_s:'Gewonnen deals geanalyseerd', ex_ind_none:'Nog geen sector data.',
        ex_a_onb:'Actieve onboardings', ex_a_onb_s:'Klanten in onboarding flow', ex_a_gdpr:'Openstaande GDPR verzoeken', ex_a_gdpr_s1:'Vereist actie · wettelijke deadline', ex_a_gdpr_s0:'Geen actieve verzoeken', ex_a_lead:'Top lead deze week', ex_a_lead_s:'Hoogste score',
        ob_eyebrow:'Klant onboarding', ob_h1:'Van <em>gewonnen</em> naar <em>operationeel</em>', ob_p:'Elke gewonnen deal start een onboarding-traject. Volg checklists, stuur klanten door fases, voorkom dat dingen blijven liggen.', ob_start:'Start onboarding',
        ob_won_deals:'gewonnen deals', ob_active:'actieve onboardings', ob_help_post:'Klanten zonder onboarding hieronder zichtbaar.',
        stg_kickoff:'Kickoff', stg_delivery:'Levering', stg_review:'Review', stg_completed:'Afgerond', ob_tasks_done:'taken voltooid', ob_start_label:'Start:',
        ob_empty_t:'Nog geen onboardings', ob_empty_b:'Start een onboarding wanneer een lead gewonnen is.', ob_no_won:'Geen gewonnen leads',
        ob_d1_eyebrow:'Start onboarding', ob_d1_h1:'Nieuwe <em>klant</em>', ob_which:'Voor welke klant?', ob_pkg_label:'Pakket', ob_startdate:'Startdatum', ob_cancel:'Annuleer', ob_started:'Onboarding gestart voor',
        ob_d2_eyebrow:'Onboarding', ob_contact:'Contactpersoon', ob_start2:'Start', ob_phase:'Fase', ob_checklist:'Onboarding checklist', ob_newtask:'Nieuwe taak…', ob_save:'Opslaan', ob_close:'Sluiten', ob_updated:'Onboarding bijgewerkt',
        doc_eyebrow:'Documenthub', doc_h1:'Alle <em>documenten</em> op één plek', doc_p:"Voorstellen, contracten, audits — gekoppeld aan leads met versie-historie. Geen losse PDF's in mailboxen meer.", doc_upload:'Document uploaden',
        dt_proposal:'Voorstel', dt_contract:'Contract', dt_audit:'Audit', dt_invoice:'Factuur', doc_k_prop:'Voorstellen', doc_k_contr:'Contracten', doc_k_audit:'Audits', doc_k_total:'Totaal',
        doc_recent:'Recent <em>opgeslagen</em>', doc_th_doc:'Document', doc_th_type:'Type', doc_th_client:'Klant', doc_th_version:'Versie', doc_th_date:'Datum',
        gt_erasure:'Recht op vergetelheid', gt_access:'Inzageverzoek', gt_rect:'Rectificatie', gt_port:'Dataportabiliteit', gs_open:'Open', gs_busy:'Bezig', gs_done:'Afgerond',
        gdpr_eyebrow:'GDPR verzoeken', gdpr_h1:'Wettelijke <em>data-verzoeken</em>', gdpr_p:'Wanneer iemand vraagt om inzage, rectificatie of "vergeet mij" — hier komt het verzoek terecht. Wettelijk: 30 dagen om af te handelen.', gdpr_new:'Nieuw verzoek',
        gdpr_help:'<b>GDPR vereiste:</b> data-verzoeken moeten binnen 30 dagen na ontvangst worden afgehandeld. Boetes tot 4% van wereldwijde omzet bij niet-naleving.',
        gdpr_k_open:'Open', gdpr_k_busy:'Bezig', gdpr_k_done:'Afgerond', gdpr_k_deadline:'Deadline binnen 7d', gdpr_all:'Alle <em>verzoeken</em>',
        gdpr_th_email:'E-mail', gdpr_th_type:'Type', gdpr_th_received:'Ontvangen', gdpr_th_deadline:'Deadline', gdpr_th_status:'Status', gdpr_days_over:'dagen over tijd!', gdpr_days:'dagen',
        gdpr_new_eyebrow:'Nieuw verzoek', gdpr_new_h1:'GDPR <em>data-verzoek</em>', gdpr_f_email:'E-mailadres van betrokkene', gdpr_f_type:'Type verzoek', gdpr_f_received:'Ontvangen op',
        gdpr_new_help:'De deadline wordt automatisch op <b>30 dagen</b> na ontvangst gezet (wettelijk minimum).', gdpr_register:'Registreer', gdpr_email_req:'E-mail vereist', gdpr_registered:'Verzoek geregistreerd · deadline',
        g_type:'Type', g_received:'Ontvangen', g_deadline:'Deadline', g_status:'Status', g_notes:'Notities / acties ondernomen',
        gdpr_steps_pre:'Stappen bij', gdpr_step1:'Identiteit verifiëren', gdpr_step2:'Data lokaliseren in alle systemen', gdpr_step3_e:'Verwijderen + bevestigen aan betrokkene', gdpr_step3_o:'Aanleveren in machine-leesbaar formaat', gdpr_step4:'Bevestigingsmail sturen', gdpr_step5:'Status op "Afgerond" zetten',
        gdpr_updated:'Verzoek bijgewerkt',
        ck_eyebrow:'Cookie consent log', ck_h1:'Wettelijk <em>bewijs</em> van toestemming', ck_p:'Elke bezoeker die op de cookie banner reageert wordt hier gelogd. GDPR-bewijs in geval van controle.', ck_export:'Export CSV',
        ck_accepted:'Geaccepteerd', ck_rejected:'Afgewezen', ck_ratio:'Acceptatie ratio', ck_total:'Totaal (60d)', ck_recent:'Recente <em>toestemmingen</em>', ck_recent_s:'Volledige log van laatste 60 dagen',
        ck_th_when:'Wanneer', ck_th_choice:'Keuze', ck_th_ip:'IP (anoniem)', ck_th_browser:'Browser', ck_exported:'Cookie log geëxporteerd'
      },
      en: {
        fb_help:'Here you manage all calculations the admin and the public calculator use. Changes apply immediately. <b>Only change this if you know the impact.</b>',
        m_title:'Margins per <em>product line</em>', m_sub:'Used for lead scoring · margin-weighted value',
        m_th_line:'Product line', m_th_min:'Min %', m_th_max:'Max %', m_th_avg:'Average (avg) %',
        ml_service:'Service', ml_cocc:'COCC / training', ml_storm:'Storm SaaS', ml_mixed:'Mixed (default)', m_save:'Save margins',
        sc_title:'Lead scoring <em>thresholds</em>', sc_sub:'At what effective margin does a lead get extra points',
        sc_prem:'Premium deal — effective margin ≥ €X thousand (+30 points)', sc_strong:'Strong deal — effective margin ≥ €X thousand (+20 points)', sc_base:'Base deal — effective margin ≥ €X thousand (+10 points)',
        sc_def:'Default:', sc_save:'Save thresholds',
        cf_title:'Absence calculator <em>formulas</em>', cf_sub:'Values for the public ROI calculator on the website',
        cf_cost:'Average cost per absence day (€)', cf_cost_h:'Default: €250', cf_days:'Working days per employee (year)', cf_days_h:'Default: 220 - 16 absence = 204',
        cf_load:'Wage on-cost (social charges %)', cf_load_h:'Default: 30%', cf_short:'SD Worx · Short absence sector average %', cf_short_h:'Default: 2.1%',
        cf_mid:'SD Worx · Medium absence %', cf_mid_h:'Default: 1.4%', cf_long:'SD Worx · Long-term absence %', cf_long_h:'Default: 1.8%',
        cf_warn:'Changes to these formulas are applied automatically in production to <em>calculator.html</em>. They drive what clients see on the website.', cf_save:'Save calculator formula',
        toast_margins:'Margins saved', toast_thresholds:'Score thresholds saved', toast_formula:'Calculator formula saved',
        sb_enterprise:'Enterprise', sb_executive:'Executive', sb_documents:'Documents', sb_gdpr:'GDPR requests', sb_cookies:'Cookie log',
        ex_eyebrow:'Executive cockpit', ex_h1:'Good afternoon, <em>Laurence</em>', ex_p:'The health of Montisoro on one screen — for strategic decisions.', ex_print:'Print report',
        ex_arr_sub:'Annual recurring · won', ex_pipe:'Pipeline', ex_pipe_sub:'Open opportunities', ex_win:'Win rate', ex_win_sub:'Last 90 days', ex_won:'Won deals', ex_won_sub:'This quarter',
        ex_pipe_t:'Pipeline per <em>stage</em>', ex_pipe_s:'Expected revenue per stage', st_qualified:'Qualified', st_diagnostic:'Diagnosis', st_proposal:'Proposal', leads_word:'leads',
        ex_ind_t:'Revenue per <em>sector</em>', ex_ind_s:'Won deals analysed', ex_ind_none:'No sector data yet.',
        ex_a_onb:'Active onboardings', ex_a_onb_s:'Clients in onboarding flow', ex_a_gdpr:'Open GDPR requests', ex_a_gdpr_s1:'Action required · legal deadline', ex_a_gdpr_s0:'No active requests', ex_a_lead:'Top lead this week', ex_a_lead_s:'Highest score',
        ob_eyebrow:'Client onboarding', ob_h1:'From <em>won</em> to <em>operational</em>', ob_p:'Every won deal starts an onboarding track. Follow checklists, move clients through stages, stop things from slipping.', ob_start:'Start onboarding',
        ob_won_deals:'won deals', ob_active:'active onboardings', ob_help_post:'Clients without onboarding visible below.',
        stg_kickoff:'Kickoff', stg_delivery:'Delivery', stg_review:'Review', stg_completed:'Completed', ob_tasks_done:'tasks completed', ob_start_label:'Start:',
        ob_empty_t:'No onboardings yet', ob_empty_b:'Start an onboarding when a lead is won.', ob_no_won:'No won leads',
        ob_d1_eyebrow:'Start onboarding', ob_d1_h1:'New <em>client</em>', ob_which:'For which client?', ob_pkg_label:'Package', ob_startdate:'Start date', ob_cancel:'Cancel', ob_started:'Onboarding started for',
        ob_d2_eyebrow:'Onboarding', ob_contact:'Contact', ob_start2:'Start', ob_phase:'Stage', ob_checklist:'Onboarding checklist', ob_newtask:'New task…', ob_save:'Save', ob_close:'Close', ob_updated:'Onboarding updated',
        doc_eyebrow:'Document hub', doc_h1:'All <em>documents</em> in one place', doc_p:'Proposals, contracts, audits — linked to leads with version history. No more loose PDFs in mailboxes.', doc_upload:'Upload document',
        dt_proposal:'Proposal', dt_contract:'Contract', dt_audit:'Audit', dt_invoice:'Invoice', doc_k_prop:'Proposals', doc_k_contr:'Contracts', doc_k_audit:'Audits', doc_k_total:'Total',
        doc_recent:'Recently <em>saved</em>', doc_th_doc:'Document', doc_th_type:'Type', doc_th_client:'Client', doc_th_version:'Version', doc_th_date:'Date',
        gt_erasure:'Right to erasure', gt_access:'Access request', gt_rect:'Rectification', gt_port:'Data portability', gs_open:'Open', gs_busy:'In progress', gs_done:'Completed',
        gdpr_eyebrow:'GDPR requests', gdpr_h1:'Statutory <em>data requests</em>', gdpr_p:'When someone asks for access, rectification or "forget me" — the request lands here. By law: 30 days to handle it.', gdpr_new:'New request',
        gdpr_help:'<b>GDPR requirement:</b> data requests must be handled within 30 days of receipt. Fines up to 4% of global turnover for non-compliance.',
        gdpr_k_open:'Open', gdpr_k_busy:'In progress', gdpr_k_done:'Completed', gdpr_k_deadline:'Deadline within 7d', gdpr_all:'All <em>requests</em>',
        gdpr_th_email:'Email', gdpr_th_type:'Type', gdpr_th_received:'Received', gdpr_th_deadline:'Deadline', gdpr_th_status:'Status', gdpr_days_over:'days overdue!', gdpr_days:'days',
        gdpr_new_eyebrow:'New request', gdpr_new_h1:'GDPR <em>data request</em>', gdpr_f_email:'Email of the data subject', gdpr_f_type:'Request type', gdpr_f_received:'Received on',
        gdpr_new_help:'The deadline is set automatically to <b>30 days</b> after receipt (legal minimum).', gdpr_register:'Register', gdpr_email_req:'Email required', gdpr_registered:'Request registered · deadline',
        g_type:'Type', g_received:'Received', g_deadline:'Deadline', g_status:'Status', g_notes:'Notes / actions taken',
        gdpr_steps_pre:'Steps for', gdpr_step1:'Verify identity', gdpr_step2:'Locate data across all systems', gdpr_step3_e:'Delete + confirm to the data subject', gdpr_step3_o:'Provide in machine-readable format', gdpr_step4:'Send confirmation email', gdpr_step5:'Set status to "Completed"',
        gdpr_updated:'Request updated',
        ck_eyebrow:'Cookie consent log', ck_h1:'Legal <em>proof</em> of consent', ck_p:'Every visitor who responds to the cookie banner is logged here. GDPR proof in case of an audit.', ck_export:'Export CSV',
        ck_accepted:'Accepted', ck_rejected:'Rejected', ck_ratio:'Acceptance ratio', ck_total:'Total (60d)', ck_recent:'Recent <em>consents</em>', ck_recent_s:'Full log of the last 60 days',
        ck_th_when:'When', ck_th_choice:'Choice', ck_th_ip:'IP (anonymised)', ck_th_browser:'Browser', ck_exported:'Cookie log exported'
      }
    };
    function T(k){ return (STR[aLang()]||STR.nl)[k] || k; }

    /* Init formulas tab */
    window.renderFormulas = function(){
      var pane = $('#formulas-pane'); if (!pane) return;
      DATA.margins = DATA.margins || { service:{min:20,max:25,avg:23}, cocc:{min:45,max:55,avg:50}, storm:{min:60,max:75,avg:68}, mixed:{min:35,max:50,avg:42} };
      DATA.score_thresholds = DATA.score_thresholds || { premium:50, strong:25, base:10 };
      DATA.calculator_formula = DATA.calculator_formula || {
        avg_cost_per_day: 250,
        sd_worx_short_pct: 2.1,
        sd_worx_mid_pct: 1.4,
        sd_worx_long_pct: 1.8,
        salary_load_pct: 30,
        absence_days_per_employee_year: 16
      };
      var m = DATA.margins;
      var st = DATA.score_thresholds;
      var f = DATA.calculator_formula;

      pane.innerHTML =
        '<div class="help-banner"><i class="ti ti-info-circle"></i><p>'+T('fb_help')+'</p></div>' +

        // MARGES
        '<div class="panel u-mb-20">' +
          '<div class="panel-head"><h3>'+T('m_title')+'</h3><div class="panel-sub">'+T('m_sub')+'</div></div>' +
          '<div class="panel-body">' +
            '<table class="tbl u-mb-20"><thead><tr><th>'+esc(T('m_th_line'))+'</th><th>'+esc(T('m_th_min'))+'</th><th>'+esc(T('m_th_max'))+'</th><th>'+esc(T('m_th_avg'))+'</th></tr></thead><tbody>' +
              ['service','cocc','storm','mixed'].map(function(k){
                var labels = { service:T('ml_service'), cocc:T('ml_cocc'), storm:T('ml_storm'), mixed:T('ml_mixed') };
                return '<tr>' +
                  '<td><b class="u-c-off">'+labels[k]+'</b></td>' +
                  '<td><input class="en-num" data-margin="'+k+'.min" type="number" value="'+m[k].min+'" min="0" max="100"> %</td>' +
                  '<td><input class="en-num" data-margin="'+k+'.max" type="number" value="'+m[k].max+'" min="0" max="100"> %</td>' +
                  '<td><input class="en-num is-hl" data-margin="'+k+'.avg" type="number" value="'+m[k].avg+'" min="0" max="100"> %</td>' +
                '</tr>';
              }).join('') +
            '</tbody></table>' +
            '<button class="btn btn-primary" id="save-margins"><i class="ti ti-check"></i>'+esc(T('m_save'))+'</button>' +
          '</div>' +
        '</div>' +

        // SCORE THRESHOLDS
        '<div class="panel u-mb-20">' +
          '<div class="panel-head"><h3>'+T('sc_title')+'</h3><div class="panel-sub">'+T('sc_sub')+'</div></div>' +
          '<div class="panel-body">' +
            '<div class="field"><label>'+esc(T('sc_prem'))+'</label><input class="en-w140" id="th-premium" type="number" value="'+st.premium+'"><div class="hint">'+esc(T('sc_def'))+' 50</div></div>' +
            '<div class="field"><label>'+esc(T('sc_strong'))+'</label><input class="en-w140" id="th-strong" type="number" value="'+st.strong+'"><div class="hint">'+esc(T('sc_def'))+' 25</div></div>' +
            '<div class="field"><label>'+esc(T('sc_base'))+'</label><input class="en-w140" id="th-base" type="number" value="'+st.base+'"><div class="hint">'+esc(T('sc_def'))+' 10</div></div>' +
            '<button class="btn btn-primary" id="save-thresholds"><i class="ti ti-check"></i>'+esc(T('sc_save'))+'</button>' +
          '</div>' +
        '</div>' +

        // CALCULATOR FORMULA
        '<div class="panel">' +
          '<div class="panel-head"><h3>'+T('cf_title')+'</h3><div class="panel-sub">'+T('cf_sub')+'</div></div>' +
          '<div class="panel-body">' +
            '<div class="en-grid2">' +
              '<div class="field"><label>'+esc(T('cf_cost'))+'</label><input id="f-cost" type="number" value="'+f.avg_cost_per_day+'"><div class="hint">'+esc(T('cf_cost_h'))+'</div></div>' +
              '<div class="field"><label>'+esc(T('cf_days'))+'</label><input id="f-days" type="number" value="'+(220-f.absence_days_per_employee_year)+'"><div class="hint">'+esc(T('cf_days_h'))+'</div></div>' +
              '<div class="field"><label>'+esc(T('cf_load'))+'</label><input id="f-load" type="number" value="'+f.salary_load_pct+'"><div class="hint">'+esc(T('cf_load_h'))+'</div></div>' +
              '<div class="field"><label>'+esc(T('cf_short'))+'</label><input id="f-short" type="number" step="0.1" value="'+f.sd_worx_short_pct+'"><div class="hint">'+esc(T('cf_short_h'))+'</div></div>' +
              '<div class="field"><label>'+esc(T('cf_mid'))+'</label><input id="f-mid" type="number" step="0.1" value="'+f.sd_worx_mid_pct+'"><div class="hint">'+esc(T('cf_mid_h'))+'</div></div>' +
              '<div class="field"><label>'+esc(T('cf_long'))+'</label><input id="f-long" type="number" step="0.1" value="'+f.sd_worx_long_pct+'"><div class="hint">'+esc(T('cf_long_h'))+'</div></div>' +
            '</div>' +
            '<div class="help-banner is-amber"><i class="ti ti-bulb u-c-amber"></i><p>'+T('cf_warn')+'</p></div>' +
            '<button class="btn btn-primary u-mt-14" id="save-formula"><i class="ti ti-check"></i>'+esc(T('cf_save'))+'</button>' +
          '</div>' +
        '</div>';

      $('#save-margins').onclick = function(){
        $$('[data-margin]').forEach(function(inp){
          var path = inp.dataset.margin.split('.');
          var v = parseFloat(inp.value);
          if (!isNaN(v)) m[path[0]][path[1]] = v;
        });
        window.AdminData.save(DATA);
        window.Admin.showToast(T('toast_margins'));
        if (window.Admin.logActivity) window.Admin.logActivity('Marges aangepast in Formules', 'math-function');
      };
      $('#save-thresholds').onclick = function(){
        st.premium = parseFloat($('#th-premium').value) || 50;
        st.strong  = parseFloat($('#th-strong').value)  || 25;
        st.base    = parseFloat($('#th-base').value)    || 10;
        window.AdminData.save(DATA);
        window.Admin.showToast(T('toast_thresholds'));
        if (window.Admin.logActivity) window.Admin.logActivity('Score thresholds aangepast', 'math-function');
      };
      $('#save-formula').onclick = function(){
        f.avg_cost_per_day = parseInt($('#f-cost').value,10);
        f.salary_load_pct  = parseFloat($('#f-load').value);
        f.sd_worx_short_pct = parseFloat($('#f-short').value);
        f.sd_worx_mid_pct   = parseFloat($('#f-mid').value);
        f.sd_worx_long_pct  = parseFloat($('#f-long').value);
        f.absence_days_per_employee_year = 220 - parseInt($('#f-days').value,10);
        window.AdminData.save(DATA);
        window.Admin.showToast(T('toast_formula'));
        if (window.Admin.logActivity) window.Admin.logActivity('Calculator formule aangepast', 'calculator');
      };
    };

    /* Hook into settings tab switching — event delegation works regardless of when admin.js binds */
    document.addEventListener('click', function(e){
      var t = e.target.closest('.set-tab');
      if (!t) return;
      if (t.dataset.tab === 'formulas') setTimeout(window.renderFormulas, 30);
    });
    setTimeout(function(){
      var pane = $('#set-formulas');
      if (pane && pane.style.display !== 'none' && pane.offsetParent !== null){
        window.renderFormulas();
      }
    }, 200);
    var fmt = function(n){return new Intl.NumberFormat('nl-BE').format(n);};
    var eur = function(n){return '€' + fmt(n);};
    var drawer = $('#drawer'), bd = $('#drawer-backdrop');

    /* ═══ Data seed ═══ */
    DATA.gdpr_requests = DATA.gdpr_requests || [];
    DATA.onboardings = DATA.onboardings || [];
    DATA.cookie_log = DATA.cookie_log || generateCookieLog();
    DATA.documents = DATA.documents || [];
    // Eenmalige opschoning van eerder geseede demo-data (LyondellBasell e.d.)
    if (!DATA.__entCleanV2){
      DATA.onboardings   = (DATA.onboardings||[]).filter(function(o){ return !(o && typeof o.id==='string' && o.id.indexOf('ob-00')===0); });
      DATA.gdpr_requests = (DATA.gdpr_requests||[]).filter(function(g){ return !(g && typeof g.id==='string' && /^g-00\d$/.test(g.id)); });
      DATA.documents     = (DATA.documents||[]).filter(function(d){ return !(d && typeof d.id==='string' && /^d-00\d$/.test(d.id)); });
      DATA.__entCleanV2 = true;
    }
    window.AdminData.save(DATA);

    function generateCookieLog(){
      var log = [];
      var now = Date.now();
      for (var i = 0; i < 45; i++){
        var ts = new Date(now - Math.random()*60*86400000).toISOString().slice(0,16).replace('T',' ');
        log.push({
          id:'c-'+(1000+i),
          ip:'185.107.'+Math.floor(Math.random()*256)+'.'+Math.floor(Math.random()*256),
          choice: Math.random() > 0.3 ? 'accept' : 'reject',
          ts: ts,
          ua: Math.random() > 0.5 ? 'Chrome 124 · Mac' : 'Safari 17 · iPhone'
        });
      }
      return log.sort(function(a,b){return b.ts.localeCompare(a.ts);});
    }

    /* ═══ Sidebar additions ═══ */
    var sidebar = $('.sidebar');
    if (sidebar && !$('.nav-item[data-view="executive"]')){
      var beheerSection = $$('.sidebar-section').filter(function(s){return s.textContent.trim()==='Beheer';})[0];
      var html = ''
        + '<div class="sidebar-section sidebar-collapsible" id="enterprise-section" data-section="tools"><span><span class="toggle-mark">+</span><span data-ent-lbl="sb_enterprise">'+esc(aLang()==='en'?'Tools / Advanced':'Tools / Geavanceerd')+'</span></span></div>'
        + '<div class="nav-item" data-view="executive" data-section="tools"><i class="ti ti-crown"></i><span class="label" data-ent-lbl="sb_executive">'+esc(T('sb_executive'))+'</span></div>'
        + '<div class="nav-item" data-view="documents" data-section="tools"><i class="ti ti-files"></i><span class="label" data-ent-lbl="sb_documents">'+esc(T('sb_documents'))+'</span></div>'
        + '<div class="nav-item" data-view="gdpr" data-section="tools"><i class="ti ti-shield-lock"></i><span class="label" data-ent-lbl="sb_gdpr">'+esc(T('sb_gdpr'))+'</span></div>'
        + '<div class="nav-item" data-view="cookies" data-section="tools"><i class="ti ti-cookie"></i><span class="label" data-ent-lbl="sb_cookies">'+esc(T('sb_cookies'))+'</span></div>'
        + '<div class="nav-item" data-view="onboarding" data-section="tools"><i class="ti ti-rocket"></i><span class="label">'+(aLang()==='en'?'Onboarding':'Onboarding')+'</span></div>';
      var anchor = beheerSection || sidebar.querySelector('.sidebar-foot') || null;
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      while (tmp.firstChild){
        if (anchor) sidebar.insertBefore(tmp.firstChild, anchor);
        else sidebar.appendChild(tmp.firstChild);
      }
      sidebar.querySelectorAll('.nav-item[data-view]').forEach(function(n){
        if (n.__entWired) return;
        n.__entWired = true;
        n.addEventListener('click', function(){ window.Admin && window.Admin.showView(n.dataset.view); });
      });
      /* Wire de injected "Tools / Geavanceerd"-kop als inklapbare sectie (default ingeklapt) */
      var thead = sidebar.querySelector('.sidebar-collapsible[data-section="tools"]');
      if (thead && !thead.__wired){
        thead.__wired = true;
        var titems = function(){ return sidebar.querySelectorAll('.nav-item[data-section="tools"]'); };
        var tkey = 'admin.section.collapsed.tools';
        var apply = function(coll){
          thead.classList.toggle('is-collapsed', coll);
          var mk = thead.querySelector('.toggle-mark'); if (mk) mk.textContent = coll ? '+' : '\u2212';
          titems().forEach(function(it){ it.classList.toggle('is-hidden', coll); });
        };
        var st = localStorage.getItem(tkey);
        apply(st === null ? true : (st !== '0'));
        thead.addEventListener('click', function(){
          var now = !thead.classList.contains('is-collapsed');
          apply(now); localStorage.setItem(tkey, now ? '1' : '0');
        });
      }
    }

    var main = $('.main');
    if (main && !$('#view-executive')){
      ['executive','onboarding','documents','gdpr','cookies'].forEach(function(id){
        var s = document.createElement('section');
        s.className = 'view';
        s.id = 'view-'+id;
        main.appendChild(s);
      });
    }

    /* ═══ EXECUTIVE DASHBOARD ═══ */
    window.init_executive = function(){
      var v = $('#view-executive');
      var leads = DATA.leads || [];
      var won = leads.filter(function(l){return l.stage==='won';});
      var pipeline = leads.filter(function(l){return l.stage!=='won'&&l.stage!=='cold';});
      var pipelineVal = pipeline.reduce(function(a,l){return a + (parseInt(String(l.value).replace(/\D/g,''),10)||0);},0);
      var mrr = won.reduce(function(a,l){return a + (parseInt(String(l.value).replace(/\D/g,''),10)||0);},0);
      var arr = mrr * 4;
      var wonThisQ = won.length;
      var winRate = leads.length ? Math.round(won.length/leads.length*100) : 0;
      var openGDPR = (DATA.gdpr_requests||[]).filter(function(g){return g.status!=='completed';}).length;
      var activeClients = (DATA.onboardings||[]).filter(function(o){return o.stage!=='completed';}).length;

      // Industry breakdown
      var byIndustry = {};
      won.forEach(function(l){
        var ind = l.industry || 'Other';
        byIndustry[ind] = (byIndustry[ind]||0) + (parseInt(String(l.value).replace(/\D/g,''),10)||0);
      });
      var industryList = Object.keys(byIndustry).map(function(k){return {label:k, val:byIndustry[k]};}).sort(function(a,b){return b.val-a.val;});

      v.innerHTML =
        '<div class="page-head"><div><div class="eyebrow"><i class="ti ti-crown u-mr-6"></i>'+esc(T('ex_eyebrow'))+'</div><h1>'+T('ex_h1')+'</h1><p>'+esc(T('ex_p'))+'</p></div>' +
        '<div class="page-head-actions"><button class="btn btn-ghost"><i class="ti ti-printer"></i>'+esc(T('ex_print'))+'</button></div></div>' +

        '<div class="kpi-row u-mb-24">' +
          kpiBig('ARR', eur(arr), T('ex_arr_sub'), '#5ABF7E') +
          kpiBig(T('ex_pipe'), eur(pipelineVal)+'K', T('ex_pipe_sub'), '#E8592B') +
          kpiBig(T('ex_win'), winRate+'%', T('ex_win_sub'), '#E8B45C') +
          kpiBig(T('ex_won'), wonThisQ, T('ex_won_sub'), '#5ABF7E') +
        '</div>' +

        '<div class="grid-2 u-mb-24">' +
          // Pipeline by stage
          '<div class="panel"><div class="panel-head"><h3>'+T('ex_pipe_t')+'</h3><div class="panel-sub">'+T('ex_pipe_s')+'</div></div><div class="panel-body">' +
            ['qualified','diagnostic','proposal'].map(function(stage){
              var s = leads.filter(function(l){return l.stage===stage;});
              var val = s.reduce(function(a,l){return a + (parseInt(String(l.value).replace(/\D/g,''),10)||0);},0);
              var pct = pipelineVal ? Math.round(val/pipelineVal*100) : 0;
              var labels = { qualified:T('st_qualified'), diagnostic:T('st_diagnostic'), proposal:T('st_proposal') };
              return '<div class="u-mb-16"><div class="en-split"><span class="a-t13">'+labels[stage]+' · <span class="u-c-muted2">'+s.length+' '+esc(T('leads_word'))+'</span></span><span class="en-accent">'+eur(val)+'K</span></div><div class="stat-bar"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#E8592B,#C8824A);"></div></div></div>';
            }).join('') +
          '</div></div>' +

          // Industry revenue
          '<div class="panel"><div class="panel-head"><h3>'+T('ex_ind_t')+'</h3><div class="panel-sub">'+T('ex_ind_s')+'</div></div><div class="panel-body">' +
            (industryList.length ? industryList.map(function(it){
              var pct = mrr ? Math.round(it.val/mrr*100) : 0;
              return '<div class="u-mb-14"><div class="en-split"><span class="a-t13">'+esc(it.label)+'</span><span class="en-accent">'+eur(it.val)+'K <span class="en-cap">('+pct+'%)</span></span></div><div class="stat-bar"><div style="width:'+pct+'%;height:100%;background:#5ABF7E;"></div></div></div>';
            }).join('') : '<div class="en-empty">'+esc(T('ex_ind_none'))+'</div>') +
          '</div></div>' +
        '</div>' +

        // Action alerts row
        '<div class="grid-3">' +
          alertCard(T('ex_a_onb'), activeClients, 'arrow-guide', T('ex_a_onb_s'), 'onboarding') +
          alertCard(T('ex_a_gdpr'), openGDPR, 'shield-lock', openGDPR>0?T('ex_a_gdpr_s1'):T('ex_a_gdpr_s0'), 'gdpr') +
          alertCard(T('ex_a_lead'), leads.sort(function(a,b){return (b.score||0)-(a.score||0);})[0]?.name||'—', 'flame', T('ex_a_lead_s'), 'leads') +
        '</div>';
    };

    function kpiBig(label, val, sub, color){
      return '<div class="kpi-card"><div class="kpi-label"><span class="ico" style="background:'+color+'1a;color:'+color+';"><i class="ti ti-chart-bar"></i></span>'+esc(label)+'</div>' +
        '<div class="kpi-value" style="color:'+color+';">'+esc(val)+'</div>' +
        '<div class="kpi-trend">'+esc(sub)+'</div></div>';
    }
    function alertCard(label, val, icon, sub, view){
      return '<div class="panel en-card" onmouseenter="this.style.borderColor=\'rgba(232,89,43,0.30)\';this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'\';this.style.transform=\'\'" onclick="window.Admin.showView(\''+view+'\')">' +
        '<div class="en-row12"><i class="ti ti-'+icon+' en-ico"></i><span class="en-klabel">'+esc(label)+'</span></div>' +
        '<div class="en-big">'+esc(val)+'</div>' +
        '<div class="en-sub">'+esc(sub)+'</div></div>';
    }

    /* ═══ ONBOARDING ═══ */
    window.init_onboarding = function(){
      var v = $('#view-onboarding');
      var won = (DATA.leads||[]).filter(function(l){return l.stage==='won';});
      var ob = DATA.onboardings;

      v.innerHTML =
        '<div class="page-head"><div><div class="eyebrow">'+esc(T('ob_eyebrow'))+'</div><h1>'+T('ob_h1')+'</h1><p>'+esc(T('ob_p'))+'</p></div>' +
        '<div class="page-head-actions"><button class="btn btn-primary" id="ob-start"><i class="ti ti-plus"></i>'+esc(T('ob_start'))+'</button></div></div>' +

        '<div class="help-banner"><i class="ti ti-info-circle"></i><p><b>'+won.length+' '+esc(T('ob_won_deals'))+'</b>, <b>'+ob.length+' '+esc(T('ob_active'))+'</b>. '+esc(T('ob_help_post'))+'</p></div>' +

        (ob.length ?
          '<div class="grid-2">'+ob.map(function(o){
            var doneCount = o.checklist.filter(function(t){return t.done;}).length;
            var pct = Math.round(doneCount/o.checklist.length*100);
            var stages = { kickoff:T('stg_kickoff'), delivery:T('stg_delivery'), review:T('stg_review'), completed:T('stg_completed') };
            return '<div class="panel en-card2" data-ob-open="'+esc(o.id)+'" onmouseenter="this.style.borderColor=\'rgba(232,89,43,0.30)\'" onmouseleave="this.style.borderColor=\'\'">' +
              '<div class="en-cardhead"><div><h class="en-h17"4>'+esc(o.client)+'</h4><div class="a-t115m">'+esc(o.contact)+' · '+esc(o.email)+'</div></div><div class="a-flex8"><span class="tag wait">'+esc(stages[o.stage]||o.stage)+'</span><button class="en-xbtn" data-ob-del="'+esc(o.id)+'" title="Verwijderen" onmouseenter="this.style.color=\'#d8654f\'" onmouseleave="this.style.color=\'\'"><i class="ti ti-trash"></i></button></div></div>' +
              '<div class="en-meterhead"><span>'+doneCount+'/'+o.checklist.length+' '+esc(T('ob_tasks_done'))+'</span><b class="en-accent13">'+pct+'%</b></div>' +
              '<div class="stat-bar"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#E8592B,#5ABF7E);transition:width .8s var(--a-ease);"></div></div>' +
              '<div class="en-metafoot"><span><i class="ti ti-package u-mr-4"></i>'+esc(o.package)+'</span><span><i class="ti ti-calendar u-mr-4"></i>'+esc(T('ob_start_label'))+' '+esc(o.start)+'</span></div>' +
            '</div>';
          }).join('')+'</div>' :
          '<div class="empty"><div class="ico"><i class="ti ti-arrow-guide"></i></div><h4>'+esc(T('ob_empty_t'))+'</h4><p>'+esc(T('ob_empty_b'))+'</p></div>'
        );

      $$('[data-ob-open]').forEach(function(c){c.addEventListener('click', function(){openOnboardingDrawer(c.dataset.obOpen);});});
      $$('[data-ob-del]').forEach(function(b){b.addEventListener('click', function(e){
        e.stopPropagation();
        var id = b.dataset.obDel;
        var o = (DATA.onboardings||[]).find(function(x){return x.id===id;});
        var EN = aLang()==='en';
        window.Admin.confirmDelete({ name:(o&&o.client)||'', title: EN?'Delete onboarding?':'Onboarding verwijderen?' }).then(function(ok){
          if(!ok) return;
          var arr = (DATA.onboardings||[]); var i = arr.findIndex(function(x){return x.id===id;}); var removed = arr[i];
          DATA.onboardings = arr.filter(function(x){return x.id!==id;});
          window.AdminData.save(DATA);
          window.init_onboarding();
          window.Admin.undoToast(EN?'Onboarding deleted':'Onboarding verwijderd', function(){
            (DATA.onboardings = DATA.onboardings || []).splice(i<0?0:i, 0, removed); window.AdminData.save(DATA); window.init_onboarding(); window.Admin.showToast(EN?'Onboarding restored':'Onboarding hersteld');
          });
        });
      });});
      $('#ob-start').onclick = function(){
        var leadsOpts = won.map(function(l){return '<option value="'+l.id+'">'+esc(l.name)+' · '+esc(l.org)+'</option>';}).join('');
        if (!leadsOpts){ window.Admin.showToast(T('ob_no_won'), 'alert-triangle'); return; }
        drawer.innerHTML =
          '<div class="drawer-head"><div><div class="eyebrow">'+esc(T('ob_d1_eyebrow'))+'</div><h3>'+T('ob_d1_h1')+'</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
          '<div class="drawer-body">' +
            '<div class="field"><label>'+esc(T('ob_which'))+'</label><select id="ob-lead" class="a-input">'+leadsOpts+'</select></div>' +
            '<div class="field"><label>'+esc(T('ob_pkg_label'))+'</label><select id="ob-pkg" class="a-input"><option>Capability Building</option><option>Human Reintegration</option><option>Operating System</option><option>Strategy & Governance</option><option>Culture of Care</option></select></div>' +
            '<div class="field"><label>'+esc(T('ob_startdate'))+'</label><input class="a-input" id="ob-start-date" type="date"></div>' +
          '</div>' +
          '<div class="drawer-foot"><button class="btn btn-primary" id="ob-create"><i class="ti ti-check"></i>'+esc(T('ob_start'))+'</button><button class="btn btn-ghost" data-close>'+esc(T('ob_cancel'))+'</button></div>';
        drawer.classList.add('is-open'); bd.classList.add('is-open');
        drawer.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click', function(){drawer.classList.remove('is-open');bd.classList.remove('is-open');});});
        $('#ob-create').onclick = function(){
          var leadId = $('#ob-lead').value;
          var l = DATA.leads.find(function(x){return x.id===leadId;});
          var newOB = { id:'ob-'+Date.now(), client:l.org, contact:l.name, email:l.email, package:$('#ob-pkg').value, start:$('#ob-start-date').value||new Date().toISOString().slice(0,10), stage:'kickoff',
            checklist:[
              { task:'Kickoff meeting plannen', done:false },
              { task:'Storm-toegang activeren', done:false },
              { task:'KB RIT 3.0 audit aanvragen', done:false },
              { task:'Capability baseline meting', done:false },
              { task:'Training plannen leidinggevenden', done:false },
              { task:'30-dagen review', done:false }
            ]};
          DATA.onboardings.push(newOB);
          window.AdminData.save(DATA);
          drawer.classList.remove('is-open'); bd.classList.remove('is-open');
          window.Admin.showToast(T('ob_started')+' '+l.name);
          if (window.Admin.logActivity) window.Admin.logActivity('Onboarding gestart · '+l.org, 'arrow-guide');
          window.init_onboarding();
        };
      };
    };

    function openOnboardingDrawer(id){
      var o = DATA.onboardings.find(function(x){return x.id===id;}); if (!o) return;
      var stages = ['kickoff','delivery','review','completed'];
      var stageLabels = { kickoff:T('stg_kickoff'), delivery:T('stg_delivery'), review:T('stg_review'), completed:T('stg_completed') };
      drawer.innerHTML =
        '<div class="drawer-head"><div><div class="eyebrow">'+esc(T('ob_d2_eyebrow'))+'</div><h3>'+esc(o.client)+'</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
        '<div class="drawer-body">' +
          '<div class="drawer-row"><div class="k">'+esc(T('ob_contact'))+'</div><div class="v">'+esc(o.contact)+'<br><a class="en-link" href="mailto:'+esc(o.email)+'">'+esc(o.email)+'</a></div></div>' +
          '<div class="drawer-row"><div class="k">'+esc(T('ob_pkg_label'))+'</div><div class="v">'+esc(o.package)+'</div></div>' +
          '<div class="drawer-row"><div class="k">'+esc(T('ob_start2'))+'</div><div class="v">'+esc(o.start)+'</div></div>' +
          '<div class="drawer-row"><div class="k">'+esc(T('ob_phase'))+'</div><div class="v"><select class="a-select-sm" id="ob-stage">'+stages.map(function(s){return '<option value="'+s+'"'+(o.stage===s?' selected':'')+'>'+esc(stageLabels[s])+'</option>';}).join('')+'</select></div></div>' +
          '<div class="en-sect">' +
            '<div class="en-kicker"><i class="ti ti-list-check u-mr-6"></i>'+esc(T('ob_checklist'))+'</div>' +
            '<div id="ob-checklist">'+o.checklist.map(function(t,i){
              return '<div class="en-task'+(t.done?' is-done':'')+'">' +
                '<input class="en-check" type="checkbox" data-task="'+i+'" '+(t.done?'checked':'')+'>' +
                '<span class="en-task-label'+(t.done?' is-done':'')+'">'+esc(t.task)+'</span>' +
              '</div>';
            }).join('')+'</div>' +
            '<div class="en-row14"><input class="en-in" id="new-ob-task" placeholder="'+esc(T('ob_newtask'))+'"><button class="btn btn-primary btn-md" id="add-ob-task"><i class="ti ti-plus"></i></button></div>' +
          '</div>' +
        '</div>' +
        '<div class="drawer-foot"><button class="btn btn-primary" data-save><i class="ti ti-check"></i>'+esc(T('ob_save'))+'</button><button class="btn btn-ghost" data-close>'+esc(T('ob_close'))+'</button></div>';
      drawer.classList.add('is-open'); bd.classList.add('is-open');
      drawer.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click', function(){drawer.classList.remove('is-open');bd.classList.remove('is-open');});});
      $$('[data-task]').forEach(function(cb){
        cb.addEventListener('change', function(){
          var i = parseInt(cb.dataset.task,10);
          o.checklist[i].done = cb.checked;
        });
      });
      $('#add-ob-task').onclick = function(){
        var t = $('#new-ob-task').value.trim(); if (!t) return;
        o.checklist.push({task:t, done:false});
        openOnboardingDrawer(id);
      };
      drawer.querySelector('[data-save]').onclick = function(){
        o.stage = $('#ob-stage').value;
        window.AdminData.save(DATA);
        drawer.classList.remove('is-open'); bd.classList.remove('is-open');
        window.Admin.showToast(T('ob_updated'));
        window.init_onboarding();
      };
    }

    /* ═══ DOCUMENTS ═══ */
    window.init_documents = function(){
      var v = $('#view-documents');
      var typeIcons = { proposal:'file-text', contract:'file-certificate', audit:'file-search', invoice:'receipt' };
      var typeLabels = { proposal:T('dt_proposal'), contract:T('dt_contract'), audit:T('dt_audit'), invoice:T('dt_invoice') };

      v.innerHTML =
        '<div class="page-head"><div><div class="eyebrow">'+esc(T('doc_eyebrow'))+'</div><h1>'+T('doc_h1')+'</h1><p>'+esc(T('doc_p'))+'</p></div>' +
        '<div class="page-head-actions"><button class="btn btn-primary"><i class="ti ti-upload"></i>'+esc(T('doc_upload'))+'</button></div></div>' +

        '<div class="kpi-row u-mb-24">' +
          kpiCard(T('doc_k_prop'), DATA.documents.filter(function(d){return d.type==='proposal';}).length, 'file-text') +
          kpiCard(T('doc_k_contr'), DATA.documents.filter(function(d){return d.type==='contract';}).length, 'file-certificate') +
          kpiCard(T('doc_k_audit'), DATA.documents.filter(function(d){return d.type==='audit';}).length, 'file-search') +
          kpiCard(T('doc_k_total'), DATA.documents.length, 'files') +
        '</div>' +

        '<div class="panel"><div class="panel-head"><h3>'+T('doc_recent')+'</h3></div><div class="panel-body is-flush">' +
          '<table class="tbl"><thead><tr><th>'+esc(T('doc_th_doc'))+'</th><th>'+esc(T('doc_th_type'))+'</th><th>'+esc(T('doc_th_client'))+'</th><th>'+esc(T('doc_th_version'))+'</th><th>'+esc(T('doc_th_date'))+'</th></tr></thead><tbody>' +
            DATA.documents.map(function(d){
              return '<tr><td><i class="ti ti-'+(typeIcons[d.type]||'file')+' u-c-orange u-mr-8"></i><span class="name">'+esc(d.title)+'</span></td><td><span class="tag cold">'+esc(typeLabels[d.type]||d.type)+'</span></td><td>'+esc(d.lead)+' · <span class="sub">'+esc(d.org)+'</span></td><td><code class="en-code">'+esc(d.version)+'</code></td><td><span class="sub">'+esc(d.ts)+'</span></td></tr>';
            }).join('') +
          '</tbody></table>' +
        '</div></div>';
    };

    /* ═══ GDPR ═══ */
    window.init_gdpr = function(){
      var v = $('#view-gdpr');
      var typeLabels = { erasure:T('gt_erasure'), access:T('gt_access'), rectification:T('gt_rect'), portability:T('gt_port') };
      var statusTag = { pending:'<span class="tag wait">'+esc(T('gs_open'))+'</span>', 'in-progress':'<span class="tag is-amber">'+esc(T('gs_busy'))+'</span>', completed:'<span class="tag done">'+esc(T('gs_done'))+'</span>' };

      v.innerHTML =
        '<div class="page-head"><div><div class="eyebrow"><i class="ti ti-shield-lock u-mr-6"></i>'+esc(T('gdpr_eyebrow'))+'</div><h1>'+T('gdpr_h1')+'</h1><p>'+esc(T('gdpr_p'))+'</p></div>' +
        '<div class="page-head-actions"><button class="btn btn-primary" id="gdpr-new"><i class="ti ti-plus"></i>'+esc(T('gdpr_new'))+'</button></div></div>' +

        '<div class="help-banner"><i class="ti ti-alert-triangle u-c-amber"></i><p>'+T('gdpr_help')+'</p></div>' +

        '<div class="kpi-row u-mb-24">' +
          kpiCard(T('gdpr_k_open'), DATA.gdpr_requests.filter(function(g){return g.status==='pending';}).length, 'mail-opened') +
          kpiCard(T('gdpr_k_busy'), DATA.gdpr_requests.filter(function(g){return g.status==='in-progress';}).length, 'clock') +
          kpiCard(T('gdpr_k_done'), DATA.gdpr_requests.filter(function(g){return g.status==='completed';}).length, 'circle-check') +
          kpiCard(T('gdpr_k_deadline'), DATA.gdpr_requests.filter(function(g){return g.status!=='completed' && daysUntil(g.deadline)<=7;}).length, 'alert-circle', '#E85C5C') +
        '</div>' +

        '<div class="panel"><div class="panel-head"><h3>'+T('gdpr_all')+'</h3></div><div class="panel-body is-flush">' +
          '<table class="tbl"><thead><tr><th>'+esc(T('gdpr_th_email'))+'</th><th>'+esc(T('gdpr_th_type'))+'</th><th>'+esc(T('gdpr_th_received'))+'</th><th>'+esc(T('gdpr_th_deadline'))+'</th><th>'+esc(T('gdpr_th_status'))+'</th></tr></thead><tbody>' +
            DATA.gdpr_requests.map(function(g){
              var days = daysUntil(g.deadline);
              var deadlineTag = days < 0 ? '<span class="u-danger-b">'+Math.abs(days)+' '+esc(T('gdpr_days_over'))+'</span>' :
                                days <= 7 ? '<span class="u-amber-b">'+days+' '+esc(T('gdpr_days'))+'</span>' :
                                '<span class="sub">'+days+' '+esc(T('gdpr_days'))+'</span>';
              return '<tr data-gdpr-open="'+esc(g.id)+'"><td><span class="name">'+esc(g.email)+'</span></td><td>'+esc(typeLabels[g.type]||g.type)+'</td><td><span class="sub">'+esc(g.received)+'</span></td><td>'+esc(g.deadline)+'<br>'+(g.status!=='completed'?deadlineTag:'')+'</td><td>'+statusTag[g.status]+'</td></tr>';
            }).join('') +
          '</tbody></table>' +
        '</div></div>';

      $$('[data-gdpr-open]').forEach(function(r){r.addEventListener('click', function(){openGDPRDrawer(r.dataset.gdprOpen);});});
      $('#gdpr-new').onclick = function(){
        drawer.innerHTML =
          '<div class="drawer-head"><div><div class="eyebrow">'+esc(T('gdpr_new_eyebrow'))+'</div><h3>'+T('gdpr_new_h1')+'</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
          '<div class="drawer-body">' +
            '<div class="field"><label>'+esc(T('gdpr_f_email'))+'</label><input id="g-email" type="email" placeholder="naam@bedrijf.be"></div>' +
            '<div class="field"><label>'+esc(T('gdpr_f_type'))+'</label><select id="g-type" class="a-input"><option value="erasure">'+esc(T('gt_erasure'))+'</option><option value="access">'+esc(T('gt_access'))+'</option><option value="rectification">'+esc(T('gt_rect'))+'</option><option value="portability">'+esc(T('gt_port'))+'</option></select></div>' +
            '<div class="field"><label>'+esc(T('gdpr_f_received'))+'</label><input id="g-date" type="date" value="'+new Date().toISOString().slice(0,10)+'"></div>' +
            '<div class="help-banner"><i class="ti ti-info-circle"></i><p>'+T('gdpr_new_help')+'</p></div>' +
          '</div>' +
          '<div class="drawer-foot"><button class="btn btn-primary" id="g-create"><i class="ti ti-check"></i>'+esc(T('gdpr_register'))+'</button><button class="btn btn-ghost" data-close>'+esc(T('ob_cancel'))+'</button></div>';
        drawer.classList.add('is-open'); bd.classList.add('is-open');
        drawer.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click', function(){drawer.classList.remove('is-open');bd.classList.remove('is-open');});});
        $('#g-create').onclick = function(){
          var email = $('#g-email').value.trim();
          if (!email){ window.Admin.showToast(T('gdpr_email_req'), 'alert-triangle'); return; }
          var d = new Date($('#g-date').value);
          var deadline = new Date(d.getTime()+30*86400000).toISOString().slice(0,10);
          DATA.gdpr_requests.unshift({id:'g-'+Date.now(),email:email,type:$('#g-type').value,received:$('#g-date').value,deadline:deadline,status:'pending',notes:''});
          window.AdminData.save(DATA);
          drawer.classList.remove('is-open'); bd.classList.remove('is-open');
          window.Admin.showToast(T('gdpr_registered')+' '+deadline);
          if (window.Admin.logActivity) window.Admin.logActivity('GDPR verzoek geregistreerd · '+email, 'shield-lock');
          window.init_gdpr();
        };
      };
    };

    function openGDPRDrawer(id){
      var g = DATA.gdpr_requests.find(function(x){return x.id===id;}); if (!g) return;
      var typeLabels = { erasure:T('gt_erasure'), access:T('gt_access'), rectification:T('gt_rect'), portability:T('gt_port') };
      drawer.innerHTML =
        '<div class="drawer-head"><div><div class="eyebrow">'+(aLang()==='en'?'GDPR request':'GDPR verzoek')+'</div><h3>'+esc(g.email)+'</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
        '<div class="drawer-body">' +
          '<div class="drawer-row"><div class="k">'+esc(T('g_type'))+'</div><div class="v">'+esc(typeLabels[g.type]||g.type)+'</div></div>' +
          '<div class="drawer-row"><div class="k">'+esc(T('g_received'))+'</div><div class="v">'+esc(g.received)+'</div></div>' +
          '<div class="drawer-row"><div class="k">'+esc(T('g_deadline'))+'</div><div class="v">'+esc(g.deadline)+' · <b style="color:'+(daysUntil(g.deadline)<7?'#E85C5C':'var(--a-orange)')+';">'+daysUntil(g.deadline)+' '+esc(T('gdpr_days'))+'</b></div></div>' +
          '<div class="drawer-row"><div class="k">'+esc(T('g_status'))+'</div><div class="v"><select class="a-select-sm" id="g-status"><option value="pending"'+(g.status==='pending'?' selected':'')+'>'+esc(T('gs_open'))+'</option><option value="in-progress"'+(g.status==='in-progress'?' selected':'')+'>'+esc(T('gs_busy'))+'</option><option value="completed"'+(g.status==='completed'?' selected':'')+'>'+esc(T('gs_done'))+'</option></select></div></div>' +
          '<div class="field u-mt-18"><label>'+esc(T('g_notes'))+'</label><textarea id="g-notes" rows="5">'+esc(g.notes||'')+'</textarea></div>' +
          '<div class="help-banner"><i class="ti ti-list-check u-c-orange"></i><p><b>'+esc(T('gdpr_steps_pre'))+' '+esc(typeLabels[g.type]||g.type)+':</b><br>1. '+esc(T('gdpr_step1'))+'<br>2. '+esc(T('gdpr_step2'))+'<br>3. '+(g.type==='erasure'?esc(T('gdpr_step3_e')):esc(T('gdpr_step3_o')))+'<br>4. '+esc(T('gdpr_step4'))+'<br>5. '+esc(T('gdpr_step5'))+'</p></div>' +
        '</div>' +
        '<div class="drawer-foot"><button class="btn btn-primary" data-save><i class="ti ti-check"></i>'+esc(T('ob_save'))+'</button><button class="btn btn-ghost" data-close>'+esc(T('ob_close'))+'</button></div>';
      drawer.classList.add('is-open'); bd.classList.add('is-open');
      drawer.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click', function(){drawer.classList.remove('is-open');bd.classList.remove('is-open');});});
      drawer.querySelector('[data-save]').onclick = function(){
        g.status = $('#g-status').value;
        g.notes = $('#g-notes').value;
        window.AdminData.save(DATA);
        drawer.classList.remove('is-open'); bd.classList.remove('is-open');
        window.Admin.showToast(T('gdpr_updated'));
        if (window.Admin.logActivity) window.Admin.logActivity('GDPR verzoek bijgewerkt · '+g.email+' → '+g.status, 'shield-lock');
        window.init_gdpr();
      };
    }

    function daysUntil(dateStr){
      var d = new Date(dateStr);
      var now = new Date(); now.setHours(0,0,0,0);
      return Math.round((d-now)/86400000);
    }

    /* ═══ COOKIE LOG ═══ */
    window.init_cookies = function(){
      var v = $('#view-cookies');
      var log = DATA.cookie_log;
      var accepted = log.filter(function(c){return c.choice==='accept';}).length;
      var rejected = log.filter(function(c){return c.choice==='reject';}).length;
      var rate = log.length ? Math.round(accepted/log.length*100) : 0;

      v.innerHTML =
        '<div class="page-head"><div><div class="eyebrow"><i class="ti ti-cookie u-mr-6"></i>'+esc(T('ck_eyebrow'))+'</div><h1>'+T('ck_h1')+'</h1><p>'+esc(T('ck_p'))+'</p></div>' +
        '<div class="page-head-actions"><button class="btn btn-ghost" id="cookie-export"><i class="ti ti-download"></i>'+esc(T('ck_export'))+'</button></div></div>' +

        '<div class="kpi-row u-mb-24">' +
          kpiCard(T('ck_accepted'), accepted, 'circle-check', '#5ABF7E') +
          kpiCard(T('ck_rejected'), rejected, 'x', null) +
          kpiCard(T('ck_ratio'), rate+'%', 'percentage') +
          kpiCard(T('ck_total'), log.length, 'list') +
        '</div>' +

        '<div class="panel"><div class="panel-head"><h3>'+T('ck_recent')+'</h3><div class="panel-sub">'+esc(T('ck_recent_s'))+'</div></div><div class="panel-body is-flush">' +
          '<table class="tbl"><thead><tr><th>'+esc(T('ck_th_when'))+'</th><th>'+esc(T('ck_th_choice'))+'</th><th>'+esc(T('ck_th_ip'))+'</th><th>'+esc(T('ck_th_browser'))+'</th></tr></thead><tbody>' +
            log.slice(0,30).map(function(c){
              var ip = c.ip.split('.').slice(0,2).join('.')+'.xxx.xxx';
              return '<tr><td><span class="sub" style="font-size:12.5px;color:var(--a-off);">'+esc(c.ts)+'</span></td><td><span class="tag '+(c.choice==='accept'?'done':'cold')+'">'+(c.choice==='accept'?esc(T('ck_accepted')):esc(T('ck_rejected')))+'</span></td><td><code class="en-code-m">'+esc(ip)+'</code></td><td><span class="sub">'+esc(c.ua)+'</span></td></tr>';
            }).join('') +
          '</tbody></table>' +
        '</div></div>';

      $('#cookie-export').onclick = function(){
        var csv = 'Timestamp,Choice,IP,UserAgent\n'+log.map(function(c){return '"'+c.ts+'","'+c.choice+'","'+c.ip+'","'+c.ua+'"';}).join('\n');
        var blob = new Blob([csv],{type:'text/csv'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'cookie-consent-log-'+new Date().toISOString().slice(0,10)+'.csv';
        a.click();
        URL.revokeObjectURL(url);
        window.Admin.showToast(T('ck_exported'));
      };
    };

    function kpiCard(label, val, icon, color){
      var col = color || '#E8592B';
      return '<div class="kpi-card"><div class="kpi-label"><span class="ico"' + (color?' style="background:'+col+'1a;color:'+col+';"':'') + '><i class="ti ti-'+esc(icon)+'"></i></span>'+esc(label)+'</div><div class="kpi-value"' + (color?' style="color:'+col+';"':'') + '>'+esc(val)+'</div></div>';
    }

    /* Re-translate injected enterprise chrome + re-render formulas on language switch */
    document.addEventListener('admin:langchange', function(){
      document.querySelectorAll('[data-ent-lbl]').forEach(function(el){ el.textContent = T(el.getAttribute('data-ent-lbl')); });
      var fp = $('#set-formulas');
      if (fp && fp.style.display !== 'none' && fp.offsetParent !== null && window.renderFormulas) window.renderFormulas();
    });
  }
})();
