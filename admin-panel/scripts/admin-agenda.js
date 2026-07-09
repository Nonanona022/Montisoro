/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — Gespreks-CRM module
   Replaces simple calendar with full meeting management:
   - Tabs: Calendar · List · Analytics
   - Filters: period, status, outcome, location, person
   - Feedback drawer (mandatory post-meeting form)
   - Auto-flag "Te beoordelen" if past + no feedback
   - Win-rate, pijnpunten heatmap, industry conversion
   - AI summary via window.claude.complete
═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__adminAgendaLoaded) return;
  window.__adminAgendaLoaded = true;

  document.addEventListener('DOMContentLoaded', function(){
    if (!sessionStorage.getItem('admin.session')) return;
    setTimeout(init, 60);
  });

  function init(){
    var DATA = window.AdminData.load();
    var $ = function(s,r){return (r||document).querySelector(s);};
    var $$ = function(s,r){return Array.from((r||document).querySelectorAll(s));};
    var esc = function(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML;};
    var fmt = function(n){return new Intl.NumberFormat('nl-BE').format(n);};
    var MONTHS_NL = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
    var DAYS_NL = ['Ma','Di','Wo','Do','Vr','Za','Zo'];

    /* ─── i18n (follows MONTISORO_ADMIN_I18N) ─── */
    function aLang(){ return window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.getLang() : (DATA.adminLang||'nl'); }
    function aLoc(){ return aLang()==='en' ? 'en-GB' : 'nl-BE'; }
    var STR = {
      nl: {
        crm:'Gespreks-CRM', crm_h1:'Diagnose <em>gesprekken</em>', crm_p:'Volledige cyclus: voorbereiding · gesprek · feedback · analyse. Elke afspraak vraagt na afloop een korte evaluatie zodat we patronen herkennen.',
        export_ics:'Export .ics', k_upcoming:'Aankomend', k_review:'Te beoordelen', k_done:'Afgerond', k_total:'Totaal',
        b_overdue:'Overdue feedback', o_strong:'Sterke match', o_possible:'Mogelijk match', o_wait:'Match niet nu', o_nomatch:'Geen match',
        da_today:'vandaag', da_tomorrow:'morgen', da_yesterday:'gisteren', da_in:'over', da_d:'d', da_w:'w', da_ago:'geleden',
        banner_one:'afgelopen afspraak wacht op feedback.', banner_many:'afgelopen afspraken wachten op feedback.', banner_post:'Klik op de afspraak om de evaluatie in te vullen.',
        tab_list:'Lijst', tab_cal:'Kalender', tab_an:'Analyse',
        f_all_status:'Alle statussen', f_overdue:'Overdue', f_all_outcome:'Alle uitkomsten', f_possible:'Mogelijk', f_notnow:'Niet nu',
        f_all_loc:'Alle locaties', loc_online:'Online', loc_onsite:'Bij klant', f_all_person:'Alle personen', f_reset:'Reset',
        empty_appts_t:'Geen afspraken', empty_appts_b:'Pas filters aan om meer resultaten te tonen.',
        cal_today:'Vandaag', cal_appts:'afspraken', cal_appt:'afspraak', cal_upcoming:'Aankomend',
        empty_up_t:'Geen aankomend', empty_up_b:'Nieuwe gesprekken verschijnen hier.',
        an_winrate:'Win rate', an_pains:'Top <em>pijnpunten</em>', an_pains_sub:'Wat hoorden we het vaakst?', an_nodata:'Nog geen feedback data.',
        an_winperson:'Win rate per <em>persoon</em>', an_winperson_sub:'Wie heeft de hoogste conversie?',
        an_strongmatches:'sterke matches', an_outof:'uit', an_convos:'gesprekken',
        an_locimpact:'Locatie <em>impact</em>', an_locimpact_sub:'Verschil online vs on-site',
        d_eyebrow_done:'Afgerond', d_eyebrow_review:'Te beoordelen', d_eyebrow_up:'Aankomende afspraak',
        d_when:'Wanneer', d_loc:'Locatie', d_email:'E-mail', d_leader:'Gespreksleider', d_status:'Status',
        d_fbtitle:'Feedback van het gesprek', d_outcome:'UITKOMST',
        ro_strong:'\uD83D\uDFE2 Sterke match', ro_possible:'\uD83D\uDFE0 Mogelijk match', ro_wait:'\uD83D\uDFE1 Niet nu', ro_nomatch:'\uD83D\uDD34 Geen match',
        d_nextstep:'Volgende stap', d_choose:'— Kies —', d_pains:'PIJNPUNTEN GENOTEERD',
        d_insights:'Insights / context', d_insights_ph:'Wat hoorde u? Wie waren aanwezig? Wat speelt er in hun sector?',
        d_aisum:'AI samenvatting', d_aisum_none:'Nog geen samenvatting. Klik op "Genereer" om Claude te laten samenvatten.',
        d_gen_regen:'Genereer / hergenereer', d_prep:'Voorbereiding',
        d_prep_pre:'Aankomende afspraak met', d_prep_post:'. Na het gesprek wordt automatisch om feedback gevraagd — dat voedt onze pijnpunten-analyse en win-rate per persoon.',
        d_savefb:'Feedback opslaan', d_close:'Sluiten', d_mail:'Mail',
        ai_need_insights:'Vul eerst insights in', ai_busy:'Bezig…', ai_wait:'Even geduld…',
        ai_regen:'Hergenereer', ai_gen:'Genereer', ai_unavail2:'AI niet beschikbaar — vul handmatig in.', ai_unavail:'AI niet beschikbaar in deze omgeving.',
        sv_outcome:'Kies een uitkomst', sv_insights:'Vul insights in', sv_saved_pre:'Feedback opgeslagen voor',
        ics_summary:'Diagnosegesprek', ics_toast:'Agenda geëxporteerd'
      },
      en: {
        crm:'Consultation CRM', crm_h1:'Diagnosis <em>consultations</em>', crm_p:'Full cycle: preparation · consultation · feedback · analysis. Each appointment asks for a short evaluation afterwards so we recognise patterns.',
        export_ics:'Export .ics', k_upcoming:'Upcoming', k_review:'To review', k_done:'Completed', k_total:'Total',
        b_overdue:'Overdue feedback', o_strong:'Strong match', o_possible:'Possible match', o_wait:'Not right now', o_nomatch:'No match',
        da_today:'today', da_tomorrow:'tomorrow', da_yesterday:'yesterday', da_in:'in', da_d:'d', da_w:'w', da_ago:'ago',
        banner_one:'past appointment is awaiting feedback.', banner_many:'past appointments are awaiting feedback.', banner_post:'Click an appointment to fill in the evaluation.',
        tab_list:'List', tab_cal:'Calendar', tab_an:'Analytics',
        f_all_status:'All statuses', f_overdue:'Overdue', f_all_outcome:'All outcomes', f_possible:'Possible', f_notnow:'Not now',
        f_all_loc:'All locations', loc_online:'Online', loc_onsite:'At client', f_all_person:'All people', f_reset:'Reset',
        empty_appts_t:'No appointments', empty_appts_b:'Adjust filters to show more results.',
        cal_today:'Today', cal_appts:'appointments', cal_appt:'appointment', cal_upcoming:'Upcoming',
        empty_up_t:'Nothing upcoming', empty_up_b:'New consultations appear here.',
        an_winrate:'Win rate', an_pains:'Top <em>pain points</em>', an_pains_sub:'What did we hear most?', an_nodata:'No feedback data yet.',
        an_winperson:'Win rate per <em>person</em>', an_winperson_sub:'Who has the highest conversion?',
        an_strongmatches:'strong matches', an_outof:'out of', an_convos:'consultations',
        an_locimpact:'Location <em>impact</em>', an_locimpact_sub:'Difference online vs on-site',
        d_eyebrow_done:'Completed', d_eyebrow_review:'To review', d_eyebrow_up:'Upcoming appointment',
        d_when:'When', d_loc:'Location', d_email:'Email', d_leader:'Consultation lead', d_status:'Status',
        d_fbtitle:'Consultation feedback', d_outcome:'OUTCOME',
        ro_strong:'\uD83D\uDFE2 Strong match', ro_possible:'\uD83D\uDFE0 Possible match', ro_wait:'\uD83D\uDFE1 Not now', ro_nomatch:'\uD83D\uDD34 No match',
        d_nextstep:'Next step', d_choose:'— Choose —', d_pains:'PAIN POINTS NOTED',
        d_insights:'Insights / context', d_insights_ph:'What did you hear? Who attended? What is happening in their sector?',
        d_aisum:'AI summary', d_aisum_none:'No summary yet. Click "Generate" to let Claude summarise.',
        d_gen_regen:'Generate / regenerate', d_prep:'Preparation',
        d_prep_pre:'Upcoming appointment with', d_prep_post:'. After the consultation feedback is requested automatically — this feeds our pain-point analysis and win rate per person.',
        d_savefb:'Save feedback', d_close:'Close', d_mail:'Email',
        ai_need_insights:'Enter insights first', ai_busy:'Working…', ai_wait:'One moment…',
        ai_regen:'Regenerate', ai_gen:'Generate', ai_unavail2:'AI not available — fill in manually.', ai_unavail:'AI not available in this environment.',
        sv_outcome:'Choose an outcome', sv_insights:'Enter insights', sv_saved_pre:'Feedback saved for',
        ics_summary:'Diagnosis consultation', ics_toast:'Calendar exported'
      }
    };
    function T(k){ return (STR[aLang()]||STR.nl)[k] || k; }
    function dayNames(){ return aLang()==='en' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : DAYS_NL; }

    /* ─── Seed feedback structure on appointments ─── */
    DATA.submissions = DATA.submissions || {};
    DATA.submissions.contact = DATA.submissions.contact || [];
    DATA.submissions.contact.forEach(function(c, i){
      if (!c.feedback) c.feedback = null;
      if (!c.assigned) c.assigned = 'Laurence';
    });
    // Demo-seed uitgeschakeld + eenmalige opschoning van eerder geseede demo-gesprekken
    if (!DATA.__agendaCleanV12){
      if (DATA.submissions && Array.isArray(DATA.submissions.contact)){
        DATA.submissions.contact = DATA.submissions.contact.filter(function(m){
          return !(m && typeof m.id==='string' && m.id.indexOf('co-d')===0);
        });
      }
      DATA.__agendaCleanV12 = true;
      DATA.__demoSeeded = true;
      window.AdminData.save(DATA);
    }

    /* ─── Boekingen van de website tonen als afspraken in de agenda ───
       Boekingen komen binnen als type 'booking' (DATA.submissions.booking).
       We mappen ze naar het afspraak-formaat en voegen ze toe aan de
       agenda-lijst. Idempotent (dedup op id); zelfherstellend bij refresh. */
    (function mergeBookings(){
      var bk = (DATA.submissions && DATA.submissions.booking) || [];
      if (!bk.length) return;
      var seen = {};
      DATA.submissions.contact.forEach(function(c){ if (c && c.id) seen[c.id] = 1; });
      bk.forEach(function(b){
        if (!b || !b.id || seen[b.id]) return;
        var f = b.fields || {};
        DATA.submissions.contact.push({
          id: b.id,
          name: b.name || f.name || '',
          email: b.email || f.email || '',
          date: f.datum || '',
          time: f.tijdstip || '',
          loc: f.afspraaktype_label || f.locatie || '',
          ts: b.ts || '',
          assigned: 'Laurence',
          feedback: null,
          _booking: true
        });
      });
    })();
    if (false && !DATA.__demoSeeded){
      var samples = [
        { id:'co-d01', name:'Tom Lambrechts', email:'t.lambrechts@lyb.com', date:'maandag 12 mei 2026', time:'10:00', loc:'Online', ts:'2026-05-08 14:00', assigned:'Laurence',
          feedback:{ outcome:'strong', next_step:'voorstel', pains:['Verzuim kost','Capability gap','Storm interesse'], insights:'CFO + HR director aanwezig. Sterke buy-in. Beslissen Q3.', ai_summary:'Sterke fit: financiële drijver + operationele pijn. Beslissen Q3. Pilot Storm voor Q4.', ts:'2026-05-12 11:30' } },
        { id:'co-d02', name:'Karel Verhaeghe', email:'k.verhaeghe@volvogroup.com', date:'donderdag 8 mei 2026', time:'14:30', loc:'Online', ts:'2026-05-01 09:00', assigned:'Laurence',
          feedback:{ outcome:'possible', next_step:'2e gesprek', pains:['HR overload','Compliance KB RIT 3.0'], insights:'Interesse aanwezig maar budget niet rond. Wachten op directie buy-in.', ai_summary:'Lauwwarm: pijn is reëel maar timing en budget vragen geduld. 2e gesprek met directie.', ts:'2026-05-08 16:00' } },
        { id:'co-d03', name:'Eva Vermeulen', email:'e.vermeulen@hb.be', date:'dinsdag 22 april 2026', time:'11:00', loc:'Online', ts:'2026-04-18 12:00', assigned:'Jeroen',
          feedback:{ outcome:'no-match', next_step:'geen', pains:['Budget zorgen'], insights:'Te klein voor onze aanpak. Doorverwezen naar partner.', ai_summary:'Geen fit: schaal te beperkt. Sluiten en doorverwijzen.', ts:'2026-04-22 12:00' } },
        { id:'co-d04', name:'Bart Goossens', email:'b.goossens@lonza.com', date:'vrijdag 16 mei 2026', time:'09:00', loc:'Bij u op kantoor', ts:'2026-05-10 15:00', assigned:'Laurence',
          feedback:{ outcome:'strong', next_step:'voorstel', pains:['Compliance KB RIT 3.0','Directie buy-in nodig','Verzuim kost'], insights:'Pharma operations. KB RIT 3.0 audit is hun trigger.', ai_summary:'Sterke compliance-trigger. Voorstel met audit + Strategy & Governance route.', ts:'2026-05-16 14:00' } },
        { id:'co-d05', name:'Sofie Vandenberg', email:'s.vandenberg@rockwool.com', date:'woensdag 14 mei 2026', time:'15:00', loc:'Bij u op kantoor', ts:'2026-05-09 11:00', assigned:'Laurence',
          feedback:{ outcome:'strong', next_step:'voorstel', pains:['Capability gap','Storm interesse','HR overload'], insights:'Industriële operatie 750 FTE. Storm pilot kandidaat. Sterk team.', ai_summary:'Hot lead: schaal + pijn + buy-in. Voorstel Capability + Storm pilot.', ts:'2026-05-14 16:30' } },
        { id:'co-d06', name:'Caroline Peeters', email:'c.peeters@emeis.com', date:'vrijdag 9 mei 2026', time:'11:30', loc:'Online', ts:'2026-05-05 10:00', assigned:'Reza',
          feedback:{ outcome:'possible', next_step:'wachten op input klant', pains:['Capability gap'], insights:'Healthcare 480 FTE. Interesse maar wacht op nieuwe directeur.', ai_summary:'Geblokkeerd door interne reorganisatie. Opvolgen in 6 weken.', ts:'2026-05-09 13:00' } }
      ];
      DATA.submissions.contact = DATA.submissions.contact.concat(samples);
      DATA.__demoSeeded = true;
      window.AdminData.save(DATA);
    }

    /* ─── Helpers ─── */
    function parseDateNL(dateStr){
      var m = String(dateStr).match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
      if (!m) return null;
      var monthIdx = MONTHS_NL.indexOf(m[2].toLowerCase());
      if (monthIdx < 0) return null;
      return new Date(parseInt(m[3],10), monthIdx, parseInt(m[1],10));
    }
    function fullDate(c){
      var d = parseDateNL(c.date);
      if (!d) return null;
      if (c.time){
        var t = c.time.split(':');
        d.setHours(parseInt(t[0],10)||0, parseInt(t[1],10)||0, 0);
      }
      return d;
    }
    function status(c){
      var d = fullDate(c);
      if (!d) return 'unknown';
      var now = new Date();
      if (d > now) return 'upcoming';
      if (c.feedback) return 'done';
      var hoursAgo = (now - d)/3600000;
      if (hoursAgo > 48) return 'overdue'; // afgelopen + geen feedback >48u
      return 'review'; // afgelopen, wacht op feedback
    }
    function statusBadge(s){
      if (s === 'upcoming') return '<span class="tag wait"><i class="ti ti-calendar-event a-ico11"></i>'+esc(T('k_upcoming'))+'</span>';
      if (s === 'done')     return '<span class="tag done"><i class="ti ti-circle-check a-ico11"></i>'+esc(T('k_done'))+'</span>';
      if (s === 'review')   return '<span class="tag is-amber"><i class="ti ti-pencil a-ico11"></i>'+esc(T('k_review'))+'</span>';
      if (s === 'overdue')  return '<span class="tag is-red"><i class="ti ti-alert-triangle a-ico11"></i>'+esc(T('b_overdue'))+'</span>';
      return '<span class="tag cold">—</span>';
    }
    function outcomeBadge(o){
      var m = {
        strong:    ['#5ABF7E',T('o_strong')],
        possible:  ['#E8B45C',T('o_possible')],
        wait:      ['#E8B45C',T('o_wait')],
        'no-match':['#6b7280',T('o_nomatch')]
      }[o];
      if (!m) return '';
      return '<span class="tag" style="background:'+m[0]+'1a;color:'+m[0]+';border:1px solid '+m[0]+'59;">'+esc(m[1])+'</span>';
    }
    function daysAway(d){
      var today = new Date(); today.setHours(0,0,0,0);
      var c = new Date(d); c.setHours(0,0,0,0);
      var diff = Math.round((c - today)/86400000);
      if (diff === 0) return T('da_today');
      if (diff === 1) return T('da_tomorrow');
      if (diff === -1) return T('da_yesterday');
      if (diff > 0) return diff < 7 ? T('da_in')+' '+diff+T('da_d') : T('da_in')+' '+Math.ceil(diff/7)+T('da_w');
      return Math.abs(diff)+T('da_d')+' '+T('da_ago');
    }

    /* ─── State ─── */
    var state = {
      tab: 'list',  // calendar | list | analytics
      filters: { status:'', outcome:'', loc:'', person:'' },
      viewMonth: new Date().getMonth(),
      viewYear: new Date().getFullYear()
    };

    /* ─── Override init_calendar ─── */
    window.init_calendar = function(){
      var v = $('#view-calendar');
      if (!v) return;

      // Boekingen altijd vers mee in de agenda (live-bridge kan contact overschreven hebben)
      (function(){
        var bk = (DATA.submissions && DATA.submissions.booking) || [];
        if (!bk.length) return;
        var have = {}; (DATA.submissions.contact||[]).forEach(function(c){ if(c&&c.id) have[c.id]=1; });
        bk.forEach(function(b){
          if (!b || !b.id || have[b.id]) return;
          var f = b.fields || {};
          DATA.submissions.contact.push({ id:b.id, name:b.name||f.name||'', email:b.email||f.email||'',
            date:f.datum||'', time:f.tijdstip||'', loc:f.afspraaktype_label||f.locatie||'',
            ts:b.ts||'', assigned:'Laurence', feedback:null, _booking:true });
        });
      })();

      var meetings = DATA.submissions.contact.map(function(c){
        return Object.assign({}, c, { _date: fullDate(c), _status: status(c) });
      }).filter(function(m){ return m._date; });

      // Counts
      var counts = {
        all: meetings.length,
        upcoming: meetings.filter(function(m){return m._status==='upcoming';}).length,
        review: meetings.filter(function(m){return m._status==='review' || m._status==='overdue';}).length,
        done: meetings.filter(function(m){return m._status==='done';}).length
      };

      v.innerHTML =
        '<div class="page-head"><div><div class="eyebrow">'+esc(T('crm'))+'</div><h1>'+T('crm_h1')+'</h1><p>'+esc(T('crm_p'))+'</p></div>' +
        '<div class="page-head-actions"><button class="btn btn-ghost" id="ag-export"><i class="ti ti-download"></i>'+esc(T('export_ics'))+'</button></div></div>' +

        // KPI strip
        '<div class="kpi-row u-mb-24">' +
          kpiCard(T('k_upcoming'), counts.upcoming, 'calendar-event', null, 'upcoming') +
          kpiCard(T('k_review'), counts.review, 'pencil', counts.review>0?'#E8B45C':null, 'review') +
          kpiCard(T('k_done'), counts.done, 'circle-check', null, 'done') +
          kpiCard(T('k_total'), counts.all, 'calendar-stats', null, '') +
        '</div>' +

        (counts.review > 0 ? '<div class="help-banner ag-warnbanner"><i class="ti ti-alert-circle u-c-amber"></i><p><b>'+counts.review+' '+esc(counts.review===1?T('banner_one'):T('banner_many'))+'</b> '+esc(T('banner_post'))+'</p></div>' : '') +

        // Tab switcher
        '<div class="tabs u-mb-18">' +
          '<button class="tab ag-tab' + (state.tab==='list'?' is-active':'') + '" data-ag-tab="list"><i class="ti ti-list u-mr-6"></i>'+esc(T('tab_list'))+'</button>' +
          '<button class="tab ag-tab' + (state.tab==='calendar'?' is-active':'') + '" data-ag-tab="calendar"><i class="ti ti-calendar u-mr-6"></i>'+esc(T('tab_cal'))+'</button>' +
          '<button class="tab ag-tab' + (state.tab==='analytics'?' is-active':'') + '" data-ag-tab="analytics"><i class="ti ti-chart-arcs u-mr-6"></i>'+esc(T('tab_an'))+'</button>' +
        '</div>' +

        '<div id="ag-content"></div>';

      $('#ag-export').onclick = exportICS;
      $$('.ag-tab').forEach(function(t){
        t.addEventListener('click', function(){
          state.tab = t.dataset.agTab;
          window.init_calendar();
        });
      });
      // Make KPI cards clickable to filter list
      $$('[data-kpi-filter]').forEach(function(card){
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(){
          state.tab = 'list';
          state.filters.status = card.dataset.kpiFilter;
          window.init_calendar();
        });
      });

      var content = $('#ag-content');
      if (state.tab === 'list')      renderList(content, meetings);
      else if (state.tab === 'calendar') renderCalendar(content, meetings);
      else if (state.tab === 'analytics') renderAnalytics(content, meetings);
    };

    /* ─── LIST view ─── */
    function renderList(container, meetings){
      var people = ['', ...new Set(meetings.map(function(m){return m.assigned;}))];

      container.innerHTML =
        '<div class="panel ag-filterbar">' +
          '<select id="ag-status" class="a-input-sm">' +
            '<option value="">'+esc(T('f_all_status'))+'</option><option value="upcoming">'+esc(T('k_upcoming'))+'</option><option value="review">'+esc(T('k_review'))+'</option><option value="overdue">'+esc(T('f_overdue'))+'</option><option value="done">'+esc(T('k_done'))+'</option>' +
          '</select>' +
          '<select id="ag-outcome" class="a-input-sm">' +
            '<option value="">'+esc(T('f_all_outcome'))+'</option><option value="strong">'+esc(T('o_strong'))+'</option><option value="possible">'+esc(T('f_possible'))+'</option><option value="wait">'+esc(T('f_notnow'))+'</option><option value="no-match">'+esc(T('o_nomatch'))+'</option>' +
          '</select>' +
          '<select id="ag-loc" class="a-input-sm">' +
            '<option value="">'+esc(T('f_all_loc'))+'</option><option value="Online">'+esc(T('loc_online'))+'</option><option value="Bij u op kantoor">'+esc(T('loc_onsite'))+'</option>' +
          '</select>' +
          '<select id="ag-person" class="a-input-sm">' +
            people.map(function(p){return '<option value="'+esc(p)+'">'+(p?esc(p):esc(T('f_all_person')))+'</option>';}).join('') +
          '</select>' +
          '<button class="btn btn-ghost lf-b2 u-ml-auto" id="ag-reset"><i class="ti ti-rotate"></i>'+esc(T('f_reset'))+'</button>' +
        '</div>' +
        '<div class="panel"><div class="panel-body is-flush"><div id="ag-list-body"></div></div></div>';

      function apply(){
        var f = state.filters;
        var rows = meetings.filter(function(m){
          if (f.status === 'review' && m._status !== 'review' && m._status !== 'overdue') return false;
          if (f.status && f.status !== 'review' && m._status !== f.status) return false;
          if (f.outcome && (!m.feedback || m.feedback.outcome !== f.outcome)) return false;
          if (f.loc){ var ml=String(m.loc||'').toLowerCase(); var isOnline=ml.indexOf('online')>-1||ml.indexOf('teams')>-1||ml.indexOf('video')>-1; if(f.loc==='Online'? !isOnline : isOnline) return false; }
          if (f.person && m.assigned !== f.person) return false;
          return true;
        }).sort(function(a,b){ return b._date - a._date; });

        $('#ag-list-body').innerHTML = rows.length ? rows.map(function(m){
          return '<div class="feed-item ag-item" data-ag-open="'+esc(m.id)+'">' +
            '<div class="feed-icon ' + (m._status==='upcoming'?'wait':m._status==='done'?'cal':'fit') + '"><i class="ti ti-' + (m._status==='upcoming'?'calendar-event':m._status==='done'?'circle-check':'pencil') + '"></i></div>' +
            '<div class="feed-meta">' +
              '<div class="feed-title"><b>'+esc(m.name)+'</b><span class="a-note"> · '+esc(m.email)+'</span></div>' +
              '<div class="feed-sub">'+esc(m.date)+' · '+esc(m.time)+' · '+esc(m.loc)+' · '+esc(m.assigned)+(m.feedback?' · '+esc(m.feedback.insights.slice(0,80)):'')+'</div>' +
            '</div>' +
            '<div class="ag-right">' + statusBadge(m._status) + (m.feedback?outcomeBadge(m.feedback.outcome):'') + '</div>' +
            '<div class="feed-time">'+daysAway(m._date)+'</div>' +
          '</div>';
        }).join('') : '<div class="empty"><div class="ico"><i class="ti ti-filter-off"></i></div><h4>'+esc(T('empty_appts_t'))+'</h4><p>'+esc(T('empty_appts_b'))+'</p></div>';

        $$('[data-ag-open]').forEach(function(row){
          row.addEventListener('click', function(){ openMeetingDrawer(row.dataset.agOpen); });
        });
      }

      $('#ag-status').addEventListener('change', function(e){ state.filters.status = e.target.value; apply(); });
      $('#ag-outcome').addEventListener('change', function(e){ state.filters.outcome = e.target.value; apply(); });
      $('#ag-loc').addEventListener('change', function(e){ state.filters.loc = e.target.value; apply(); });
      $('#ag-person').addEventListener('change', function(e){ state.filters.person = e.target.value; apply(); });
      $('#ag-reset').addEventListener('click', function(){
        state.filters = { status:'', outcome:'', loc:'', person:'' };
        $('#ag-status').value=''; $('#ag-outcome').value=''; $('#ag-loc').value=''; $('#ag-person').value='';
        apply();
      });

      // Init filter values
      $('#ag-status').value = state.filters.status;
      $('#ag-outcome').value = state.filters.outcome;
      $('#ag-loc').value = state.filters.loc;
      $('#ag-person').value = state.filters.person;
      apply();
    }

    /* ─── CALENDAR view ─── */
    function renderCalendar(container, meetings){
      var first = new Date(state.viewYear, state.viewMonth, 1);
      var firstDow = (first.getDay()+6)%7;
      var daysInMonth = new Date(state.viewYear, state.viewMonth+1, 0).getDate();
      var today = new Date(); today.setHours(0,0,0,0);
      var inMonth = meetings.filter(function(m){return m._date.getMonth()===state.viewMonth&&m._date.getFullYear()===state.viewYear;});

      container.innerHTML =
        '<div class="grid-2 lf-grid">' +
          '<div class="panel">' +
            '<div class="panel-head">' +
              '<div class="lf-cal-head">' +
                '<button class="btn btn-ghost btn-icon btn-icon-sm" id="cal-prev"><i class="ti ti-chevron-left"></i></button>' +
                '<h class="lf-cal-title"3>'+new Date(state.viewYear, state.viewMonth, 1).toLocaleDateString(aLoc(),{month:'long'})+' '+state.viewYear+'</h3>' +
                '<button class="btn btn-ghost btn-icon btn-icon-sm" id="cal-next"><i class="ti ti-chevron-right"></i></button>' +
                '<button class="btn btn-ghost ag-b1" id="cal-today">'+esc(T('cal_today'))+'</button>' +
              '</div>' +
              '<span class="panel-sub">'+inMonth.length+' '+esc(T('cal_appts'))+'</span>' +
            '</div>' +
            '<div class="panel-body">' +
              '<div class="lf-cal-grid is-head">' +
                dayNames().map(function(d){return '<div class="lf-cal-wd">'+d+'</div>';}).join('') +
              '</div>' +
              '<div class="lf-cal-grid">' +
                Array(firstDow).fill('<div></div>').join('') +
                Array.from({length:daysInMonth},function(_,i){
                  var d = i+1;
                  var dateObj = new Date(state.viewYear, state.viewMonth, d);
                  var isToday = dateObj.getTime() === today.getTime();
                  var dayMeetings = meetings.filter(function(m){return m._date.getDate()===d&&m._date.getMonth()===state.viewMonth&&m._date.getFullYear()===state.viewYear;});
                  var n = dayMeetings.length;
                  var color = !n ? '' : dayMeetings.some(function(m){return m._status==='review'||m._status==='overdue';}) ? 'rgba(232,180,92,0.10)' : 'rgba(232,89,43,0.06)';
                  return '<div class="ag-day'+(isToday?' is-today':'')+(n?' is-click':'')+'" style="background:'+color+';" '+(n?'data-cal-day="'+d+'"':'')+'>' +
                    '<div class="lf-day-num'+(isToday?' is-today':'')+'">'+d+'</div>' +
                    (n ? '<div class="lf-day-meet"><i class="ti ti-circle-filled a-ico6"></i>'+n+' '+esc(n>1?T('cal_appts'):T('cal_appt'))+'</div>' : '') +
                  '</div>';
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="panel"><div class="panel-head"><h3>'+esc(T('cal_upcoming'))+'</h3></div><div class="panel-body is-flush">' +
            (function(){
              var up = meetings.filter(function(m){return m._date >= new Date();}).sort(function(a,b){return a._date-b._date;}).slice(0,5);
              return up.length ? '<div class="feed">'+up.map(function(m){
                return '<div class="feed-item" data-ag-open="'+esc(m.id)+'">' +
                  '<div class="feed-icon cal"><i class="ti ti-calendar-event"></i></div>' +
                  '<div class="feed-meta"><div class="feed-title"><b>'+esc(m.name)+'</b></div><div class="feed-sub">'+esc(m._date.toLocaleDateString(aLoc(),{day:'numeric',month:'long'}))+' · '+esc(m.time)+' · '+esc(m.loc)+'</div></div>' +
                  '<div class="feed-time">'+daysAway(m._date)+'</div>' +
                '</div>';
              }).join('')+'</div>' : '<div class="empty"><div class="ico"><i class="ti ti-calendar-x"></i></div><h4>'+esc(T('empty_up_t'))+'</h4><p>'+esc(T('empty_up_b'))+'</p></div>';
            })() +
          '</div></div>' +
        '</div>';

      $('#cal-prev').onclick = function(){ state.viewMonth--; if(state.viewMonth<0){state.viewMonth=11;state.viewYear--;} renderCalendar(container, meetings); };
      $('#cal-next').onclick = function(){ state.viewMonth++; if(state.viewMonth>11){state.viewMonth=0;state.viewYear++;} renderCalendar(container, meetings); };
      $('#cal-today').onclick = function(){ state.viewMonth=new Date().getMonth(); state.viewYear=new Date().getFullYear(); renderCalendar(container, meetings); };
      $$('[data-cal-day]').forEach(function(cell){
        cell.addEventListener('click', function(){
          var d = parseInt(cell.dataset.calDay,10);
          var first = meetings.find(function(m){return m._date.getDate()===d&&m._date.getMonth()===state.viewMonth&&m._date.getFullYear()===state.viewYear;});
          if (first) openMeetingDrawer(first.id);
        });
      });
      $$('[data-ag-open]').forEach(function(row){
        row.addEventListener('click', function(){ openMeetingDrawer(row.dataset.agOpen); });
      });
    }

    /* ─── ANALYTICS view ─── */
    function renderAnalytics(container, meetings){
      var done = meetings.filter(function(m){return m.feedback;});
      var strong = done.filter(function(m){return m.feedback.outcome==='strong';}).length;
      var possible = done.filter(function(m){return m.feedback.outcome==='possible';}).length;
      var noMatch = done.filter(function(m){return m.feedback.outcome==='no-match';}).length;
      var winRate = done.length ? Math.round(strong/done.length*100) : 0;

      // Pain points heatmap
      var painCounts = {};
      done.forEach(function(m){
        (m.feedback.pains||[]).forEach(function(p){ painCounts[p] = (painCounts[p]||0) + 1; });
      });
      var painSorted = Object.keys(painCounts).map(function(k){return {label:k, count:painCounts[k]};}).sort(function(a,b){return b.count-a.count;});
      var maxPain = painSorted[0] ? painSorted[0].count : 1;

      // Location split
      var online = done.filter(function(m){return m.loc==='Online';}).length;
      var onsite = done.filter(function(m){return m.loc==='Bij u op kantoor';}).length;

      // Per person
      var perPerson = {};
      done.forEach(function(m){
        perPerson[m.assigned] = perPerson[m.assigned] || { total:0, strong:0 };
        perPerson[m.assigned].total++;
        if (m.feedback.outcome === 'strong') perPerson[m.assigned].strong++;
      });

      container.innerHTML =
        '<div class="kpi-row u-mb-24">' +
          kpiCard(T('an_winrate'), winRate+'%', 'trending-up') +
          kpiCard(T('o_strong'), strong, 'circle-check') +
          kpiCard(T('f_possible'), possible, 'help-circle') +
          kpiCard(T('o_nomatch'), noMatch, 'x') +
        '</div>' +

        '<div class="grid-2 u-mb-20">' +
          '<div class="panel">' +
            '<div class="panel-head"><h3>'+T('an_pains')+'</h3><div class="panel-sub">'+esc(T('an_pains_sub'))+'</div></div>' +
            '<div class="panel-body">' +
              (painSorted.length ? painSorted.map(function(p){
                var pct = Math.round(p.count/maxPain*100);
                return '<div class="u-mb-14">' +
                  '<div class="ag-split"><span class="a-t13">'+esc(p.label)+'</span><span class="ag-accent">'+p.count+'</span></div>' +
                  '<div class="stat-bar"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#E8592B,#C8824A);transition:width .8s var(--a-ease);"></div></div>' +
                '</div>';
              }).join('') : '<div class="en-empty">'+esc(T('an_nodata'))+'</div>') +
            '</div>' +
          '</div>' +

          '<div class="panel">' +
            '<div class="panel-head"><h3>'+T('an_winperson')+'</h3><div class="panel-sub">'+esc(T('an_winperson_sub'))+'</div></div>' +
            '<div class="panel-body">' +
              (Object.keys(perPerson).length ? Object.keys(perPerson).map(function(name){
                var p = perPerson[name];
                var pct = p.total ? Math.round(p.strong/p.total*100) : 0;
                return '<div class="u-mb-14">' +
                  '<div class="ag-split"><span class="a-t13"><b>'+esc(name)+'</b></span><span class="ag-accent">'+pct+'%</span></div>' +
                  '<div class="seo-count"><span>'+p.strong+' '+esc(T('an_strongmatches'))+'</span><span>'+esc(T('an_outof'))+' '+p.total+' '+esc(T('an_convos'))+'</span></div>' +
                  '<div class="stat-bar"><div style="width:'+pct+'%;height:100%;background:#5ABF7E;transition:width .8s var(--a-ease);"></div></div>' +
                '</div>';
              }).join('') : '<div class="en-empty">'+esc(T('an_nodata'))+'</div>') +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="panel">' +
          '<div class="panel-head"><h3>'+T('an_locimpact')+'</h3><div class="panel-sub">'+esc(T('an_locimpact_sub'))+'</div></div>' +
          '<div class="panel-body">' +
            '<div class="en-grid2">' +
              '<div class="ag-stat">' +
                '<i class="ti ti-video ag-stat-ico"></i>' +
                '<div class="ag-stat-num">'+online+'</div>' +
                '<div class="ag-stat-lbl">'+esc(T('loc_online'))+'</div>' +
              '</div>' +
              '<div class="ag-stat">' +
                '<i class="ti ti-map-pin ag-stat-ico"></i>' +
                '<div class="ag-stat-num">'+onsite+'</div>' +
                '<div class="ag-stat-lbl">'+esc(T('loc_onsite'))+'</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    /* ─── MEETING DRAWER (feedback form) ─── */
    function openMeetingDrawer(id){
      var c = DATA.submissions.contact.find(function(x){return x.id===id;});
      if (!c) return;
      var drawer = $('#drawer'); var bd = $('#drawer-backdrop');
      var d = fullDate(c);
      var st = status(c);
      var isPast = d && d < new Date();

      var fb = c.feedback || { outcome:'', next_step:'', pains:[], insights:'', ai_summary:'', ts:'' };
      var PAINS = ['Verzuim kost','Compliance KB RIT 3.0','Capability gap','Storm interesse','Casey interesse','HR overload','Directie buy-in nodig','Budget zorgen'];
      var NEXTS = ['Voorstel uitwerken','2e gesprek inplannen','Wachten op input klant','Geen vervolg'];

      drawer.innerHTML =
        '<div class="drawer-head">' +
          '<div>' +
            '<div class="eyebrow">'+esc(isPast?(c.feedback?T('d_eyebrow_done'):T('d_eyebrow_review')):T('d_eyebrow_up'))+'</div>' +
            '<h3>'+esc(c.name)+'</h3>' +
          '</div>' +
          '<button class="drawer-close" data-close><i class="ti ti-x"></i></button>' +
        '</div>' +
        '<div class="drawer-body">' +
          // Meta
          '<div class="drawer-row"><div class="k">'+esc(T('d_when'))+'</div><div class="v">'+esc(c.date)+' · '+esc(c.time)+'</div></div>' +
          '<div class="drawer-row"><div class="k">'+esc(T('d_loc'))+'</div><div class="v">'+esc(c.loc)+'</div></div>' +
          '<div class="drawer-row"><div class="k">'+esc(T('d_email'))+'</div><div class="v"><a class="u-c-orange" href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a></div></div>' +
          '<div class="drawer-row"><div class="k">'+esc(T('d_leader'))+'</div><div class="v"><select class="a-select-sm" id="fb-assigned">'+['Laurence','Jeroen','Glenn','Reza'].map(function(n){return '<option'+(c.assigned===n?' selected':'')+'>'+n+'</option>';}).join('')+'</select></div></div>' +
          '<div class="drawer-row"><div class="k">'+esc(T('d_status'))+'</div><div class="v">'+statusBadge(st)+'</div></div>' +

          (isPast ?
            // FEEDBACK FORM (after meeting)
            '<div class="en-sect">' +
              '<div class="en-kicker"><i class="ti ti-clipboard-text u-mr-6"></i>'+esc(T('d_fbtitle'))+'</div>' +

              '<div class="ag-sublabel">'+esc(T('d_outcome'))+'</div>' +
              '<div class="ag-grid2-8">' +
                ['strong','possible','wait','no-match'].map(function(k){
                  var labels = { strong:T('ro_strong'), possible:T('ro_possible'), wait:T('ro_wait'), 'no-match':T('ro_nomatch') };
                  var on = fb.outcome === k;
                  return '<label class="ag-opt'+(on?' is-on':'')+'"><input class="a-accent" type="radio" name="fb-outcome" value="'+k+'" '+(on?'checked':'')+'>'+labels[k]+'</label>';
                }).join('') +
              '</div>' +

              '<div class="field"><label>'+esc(T('d_nextstep'))+'</label><select class="ag-in" id="fb-next"><option value="">'+esc(T('d_choose'))+'</option>'+NEXTS.map(function(n){var v=n.toLowerCase();return '<option value="'+v+'"'+(fb.next_step===v?' selected':'')+'>'+esc(n)+'</option>';}).join('')+'</select></div>' +

              '<div class="ag-sublabel">'+esc(T('d_pains'))+'</div>' +
              '<div class="ag-chips">' +
                PAINS.map(function(p){
                  var on = (fb.pains||[]).indexOf(p) >= 0;
                  return '<label class="fb-pain ag-chip'+(on?' is-on':'')+'" data-pain="'+esc(p)+'"><input type="checkbox" '+(on?'checked':'')+' style="display:none;">'+esc(p)+'</label>';
                }).join('') +
              '</div>' +

              '<div class="field"><label>'+esc(T('d_insights'))+'</label><textarea id="fb-insights" rows="3" placeholder="'+esc(T('d_insights_ph'))+'">'+esc(fb.insights||'')+'</textarea></div>' +

              '<div class="ag-preview">' +
                '<div class="ag-kicker8"><i class="ti ti-sparkles u-mr-6"></i>'+esc(T('d_aisum'))+'</div>' +
                '<div class="ag-prevtext" id="fb-summary">'+(fb.ai_summary ? esc(fb.ai_summary) : '<span class="ag-hint-i">'+esc(T('d_aisum_none'))+'</span>')+'</div>' +
                '<button class="btn btn-ghost lf-b1 u-mt-10" id="fb-ai"><i class="ti ti-sparkles"></i>'+esc(T('d_gen_regen'))+'</button>' +
              '</div>' +
            '</div>'

            // UPCOMING — pre-meeting brief
            : '<div class="en-sect">' +
              '<div class="en-kicker"><i class="ti ti-clipboard u-mr-6"></i>'+esc(T('d_prep'))+'</div>' +
              '<div class="ag-notice">' +
                esc(T('d_prep_pre'))+' <b class="u-c-off">'+esc(c.name)+'</b>'+esc(T('d_prep_post')) +
              '</div>' +
            '</div>') +

        '</div>' +

        '<div class="drawer-foot">' +
          (isPast ? '<button class="btn btn-primary" data-save-fb><i class="ti ti-check"></i>'+esc(T('d_savefb'))+'</button>' : '') +
          '<button class="btn btn-ghost is-warnred" data-cancel-appt><i class="ti ti-trash"></i>'+(aLang()==='en'?'Cancel appointment':'Afspraak annuleren')+'</button>' +
          '<button class="btn btn-ghost" data-close><i class="ti ti-x"></i>'+esc(T('d_close'))+'</button>' +
          '<a href="mailto:'+esc(c.email)+'" class="btn btn-ghost u-ml-auto"><i class="ti ti-mail"></i>'+esc(T('d_mail'))+'</a>' +
        '</div>';

      drawer.classList.add('is-open'); bd.classList.add('is-open');
      drawer.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click', function(){drawer.classList.remove('is-open');bd.classList.remove('is-open');});});

      // Pain toggles
      $$('.fb-pain').forEach(function(el){
        el.addEventListener('click', function(e){
          if (e.target.tagName === 'INPUT') return;
          var input = el.querySelector('input');
          input.checked = !input.checked;
          var on = input.checked;
          el.style.background = on ? 'rgba(232,89,43,0.14)' : 'rgba(29,29,31,0.04)';
          el.style.borderColor = on ? 'rgba(232,89,43,0.40)' : 'var(--a-div)';
          el.style.color = on ? 'var(--a-orange)' : 'var(--a-off)';
          el.style.fontWeight = on ? '600' : '500';
        });
      });

      // AI summary
      var fbAiBtn = drawer.querySelector('#fb-ai');
      if (fbAiBtn) fbAiBtn.addEventListener('click', function(){
        var insights = $('#fb-insights').value.trim();
        if (!insights){ window.Admin.showToast(T('ai_need_insights'), 'alert-triangle'); return; }
        var outcome = (drawer.querySelector('input[name="fb-outcome"]:checked')||{}).value || 'onbekend';
        var pains = $$('.fb-pain input:checked').map(function(i){return i.parentElement.dataset.pain;});
        fbAiBtn.disabled = true;
        fbAiBtn.innerHTML = '<i class="ti ti-loader ti-spin"></i>'+esc(T('ai_busy'));
        $('#fb-summary').innerHTML = '<span class="u-c-muted3">'+esc(T('ai_wait'))+'</span>';

        var prompt = 'Vat in 2-3 zinnen samen (in het Nederlands, zakelijk en bondig) wat de uitkomst van dit diagnosegesprek is. Geen ondertekening, geen begroeting.\n\n' +
          'Lead: '+c.name+'\nUitkomst: '+outcome+'\nPijnpunten: '+(pains.join(', ')||'geen')+'\n\nInsights van gespreksleider:\n'+insights;

        if (window.claude && window.claude.complete){
          window.claude.complete(prompt).then(function(text){
            $('#fb-summary').textContent = text.trim();
            fbAiBtn.disabled = false;
            fbAiBtn.innerHTML = '<i class="ti ti-sparkles"></i>'+esc(T('ai_regen'));
          }).catch(function(){
            $('#fb-summary').innerHTML = '<span class="u-c-red">'+esc(T('ai_unavail2'))+'</span>';
            fbAiBtn.disabled = false;
            fbAiBtn.innerHTML = '<i class="ti ti-sparkles"></i>'+esc(T('ai_gen'));
          });
        } else {
          $('#fb-summary').innerHTML = '<span class="u-c-muted2">'+esc(T('ai_unavail'))+'</span>';
          fbAiBtn.disabled = false;
        }
      });

      // Save feedback
      var saveBtn = drawer.querySelector('[data-save-fb]');
      var cancelBtn = drawer.querySelector('[data-cancel-appt]');
      if (cancelBtn) cancelBtn.addEventListener('click', function(){
        var EN = aLang()==='en';
        window.Admin.confirmDelete({
          title: EN?'Cancel appointment?':'Afspraak annuleren?',
          message: EN?('This deletes the appointment for '+(c.name||'')+'. The slot frees up again on the website (once Outlook is connected).'):('Dit verwijdert de afspraak van '+(c.name||'')+'. Het tijdslot komt weer vrij op de website (zodra Outlook gekoppeld is).'),
          confirmLabel: EN?'Yes, cancel':'Ja, annuleren'
        }).then(function(ok){
          if (!ok) return;
          DATA.submissions.contact = (DATA.submissions.contact||[]).filter(function(x){return x.id!==id;});
          DATA.submissions.booking = (DATA.submissions.booking||[]).filter(function(x){return x.id!==id;});
          window.AdminData.save(DATA);
          try { var sess=JSON.parse(sessionStorage.getItem('admin.session')||'{}'); if(sess&&sess.token){ fetch('/api/admin-delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:sess.token,table:'form_submissions',id:id})}).catch(function(){}); } } catch(e){}
          drawer.classList.remove('is-open'); bd.classList.remove('is-open');
          if (window.Admin && window.Admin.showToast) window.Admin.showToast(EN?'Appointment cancelled':'Afspraak geannuleerd','trash');
          if (window.init_calendar) try{window.init_calendar();}catch(e){}
          if (window.Admin && window.Admin.updateInboxCounts) try{window.Admin.updateInboxCounts();}catch(e){}
        });
      });
      if (saveBtn) saveBtn.addEventListener('click', function(){
        var outcome = (drawer.querySelector('input[name="fb-outcome"]:checked')||{}).value;
        if (!outcome){ window.Admin.showToast(T('sv_outcome'), 'alert-triangle'); return; }
        var insights = $('#fb-insights').value.trim();
        if (!insights){ window.Admin.showToast(T('sv_insights'), 'alert-triangle'); return; }

        c.assigned = $('#fb-assigned').value;
        c.feedback = {
          outcome: outcome,
          next_step: $('#fb-next').value,
          pains: $$('.fb-pain input:checked').map(function(i){return i.parentElement.dataset.pain;}),
          insights: insights,
          ai_summary: (function(){ var t=$('#fb-summary').textContent.trim(); return (t===T('ai_wait') || /samenvatting|summary|AI niet|AI not/i.test(t)) ? '' : t; })(),
          ts: new Date().toISOString().slice(0,16).replace('T',' ')
        };
        window.AdminData.save(DATA);
        drawer.classList.remove('is-open'); bd.classList.remove('is-open');
        window.Admin.showToast(T('sv_saved_pre')+' '+c.name);
        if (window.Admin.logActivity) window.Admin.logActivity('Feedback ingevuld · '+c.name+' ('+outcome+')', 'clipboard-check');
        window.init_calendar();
      });
    }

    /* ─── ICS export ─── */
    function exportICS(){
      var ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Montisoro//Admin//NL\n';
      DATA.submissions.contact.forEach(function(c){
        var d = fullDate(c); if (!d) return;
        var dtstart = d.toISOString().replace(/[-:]/g,'').slice(0,15);
        var dend = new Date(d.getTime()+45*60000).toISOString().replace(/[-:]/g,'').slice(0,15);
        ics += 'BEGIN:VEVENT\nSUMMARY:'+T('ics_summary')+' · '+c.name+'\nDESCRIPTION:'+c.email+' · '+c.loc+'\nDTSTART:'+dtstart+'00\nDTEND:'+dend+'00\nEND:VEVENT\n';
      });
      ics += 'END:VCALENDAR';
      var blob = new Blob([ics],{type:'text/calendar'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'montisoro-agenda.ics';
      a.click();
      URL.revokeObjectURL(url);
      window.Admin.showToast(T('ics_toast'));
    }

    /* ─── Helper ─── */
    function kpiCard(label, val, icon, color, filterStatus){
      var attr = filterStatus !== undefined ? ' data-kpi-filter="'+esc(filterStatus)+'"' : '';
      var hover = filterStatus !== undefined ? ' onmouseenter="this.style.borderColor=\'rgba(232,89,43,0.30)\';this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'\';this.style.transform=\'\'"' : '';
      return '<div class="kpi-card"'+attr+hover+'>' +
        '<div class="kpi-label"><span class="ico"' + (color?' style="background:'+color+'1a;color:'+color+';"':'') + '><i class="ti ti-'+esc(icon)+'"></i></span>'+esc(label)+'</div>' +
        '<div class="kpi-value"' + (color?' style="color:'+color+';"':'') + '>'+esc(val)+'</div>' +
      '</div>';
    }
  }
})();
