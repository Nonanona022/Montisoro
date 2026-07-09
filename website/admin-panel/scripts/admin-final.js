/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — Final delivery module
   Adds: Calendar view · Advanced filters · AI follow-up ·
         Tasks/to-do · Bulk CSV import
═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__adminFinalLoaded) return;
  window.__adminFinalLoaded = true;

  document.addEventListener('DOMContentLoaded', function(){
    if (!sessionStorage.getItem('admin.session')) return;
    setTimeout(init, 30);
  });

  function init(){
    var DATA = window.AdminData.load();
    var $ = function(s,r){return (r||document).querySelector(s);};
    var $$ = function(s,r){return Array.from((r||document).querySelectorAll(s));};
    var esc = function(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML;};

    /* ─── i18n (follows MONTISORO_ADMIN_I18N) ─── */
    function aLang(){ return window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.getLang() : (DATA.adminLang||'nl'); }
    function aLoc(){ return aLang()==='en' ? 'en-GB' : 'nl-BE'; }
    var STR = {
      nl: {
        agenda:'Agenda', cal_h1:'Geplande <em>gesprekken</em>', cal_p:'Visueel overzicht van alle diagnosegesprekken. Klik op een dag om afspraken te zien.',
        today:'Vandaag', export_ics:'Export .ics', appts_month:'afspraken deze maand', appt:'afspraak', appts:'afspraken',
        upcoming:'Aankomende <em>gesprekken</em>', no_up_t:'Geen geplande gesprekken', no_up_b:'Nieuwe gesprekken verschijnen hier automatisch.',
        day_eyebrow:'Afspraken op deze dag', min:'min', email:'E-mail', edit:'Wijzig',
        appt_summary:'Diagnosegesprek', ics_toast:'Agenda geëxporteerd · open .ics in Outlook/Apple Calendar',
        today_w:'vandaag', tomorrow_w:'morgen', in_w:'over', d_w:'d', w_w:'w',
        f_search:'Zoek op naam, organisatie of e-mail…', f_sources:'Alle bronnen', f_industries:'Alle sectoren', f_scores:'Alle scores',
        f_hot:'Hot (80+)', f_warm:'Warm (50+)', f_cold:'Cold (30+)', f_reset:'Reset',
        t_tasks:'Taken', t_none:'Nog geen taken voor deze lead.', t_new:'Nieuwe taak (bv. Bel maandag)',
        ai_title:'AI follow-up assistent', ai_desc:'Laat AI een follow-up e-mail schrijven op basis van deze lead, hun bron en huidige stage.',
        ai_gen:'Genereer follow-up e-mail', ai_writing:'Aan het schrijven…', ai_wait:'Even geduld…',
        ai_copy:'Kopiëren', ai_open:'Open in e-mail', t_added:'Taak toegevoegd', ai_copied:'E-mail gekopieerd',
        ai_unavail:'AI niet beschikbaar in deze omgeving.', ai_err:'AI niet beschikbaar',
        ai_prompt_lang:'in het Nederlands', ai_greeting:'Beste',
        b_bulk:'Bulk import', b_h1:'Leads <em>importeren</em>',
        b_help_pre:'Upload een <b>CSV</b> met de kolommen:', b_help_post:'Eerste rij = headers.',
        b_file:'CSV bestand', b_or:'Of plak CSV-tekst hieronder:', b_paste:'Of plak CSV tekst',
        b_import:'Importeer', b_cancel:'Annuleer', b_sample:'Voorbeeld',
        b_prev:'Voorbeeld', b_leads:'leads', b_th_name:'Naam', b_th_org:'Organisatie', b_th_email:'E-mail',
        b_and:'… en', b_more:'meer', b_confirm_pre:'Importeer', b_confirm_post:'leads in de pipeline?',
        b_sample_toast:'Voorbeeld gedownload', b_imported:'leads geïmporteerd', nav_cal:'Agenda'
      },
      en: {
        agenda:'Calendar', cal_h1:'Scheduled <em>consultations</em>', cal_p:'Visual overview of all diagnosis consultations. Click a day to see appointments.',
        today:'Today', export_ics:'Export .ics', appts_month:'appointments this month', appt:'appointment', appts:'appointments',
        upcoming:'Upcoming <em>consultations</em>', no_up_t:'No scheduled consultations', no_up_b:'New consultations appear here automatically.',
        day_eyebrow:'Appointments on this day', min:'min', email:'Email', edit:'Edit',
        appt_summary:'Diagnosis consultation', ics_toast:'Calendar exported · open the .ics in Outlook/Apple Calendar',
        today_w:'today', tomorrow_w:'tomorrow', in_w:'in', d_w:'d', w_w:'w',
        f_search:'Search by name, organisation or email…', f_sources:'All sources', f_industries:'All sectors', f_scores:'All scores',
        f_hot:'Hot (80+)', f_warm:'Warm (50+)', f_cold:'Cold (30+)', f_reset:'Reset',
        t_tasks:'Tasks', t_none:'No tasks for this lead yet.', t_new:'New task (e.g. Call Monday)',
        ai_title:'AI follow-up assistant', ai_desc:'Let AI write a follow-up email based on this lead, their source and current stage.',
        ai_gen:'Generate follow-up email', ai_writing:'Writing…', ai_wait:'One moment…',
        ai_copy:'Copy', ai_open:'Open in email', t_added:'Task added', ai_copied:'Email copied',
        ai_unavail:'AI not available in this environment.', ai_err:'AI not available',
        ai_prompt_lang:'in English', ai_greeting:'Dear',
        b_bulk:'Bulk import', b_h1:'Import <em>leads</em>',
        b_help_pre:'Upload a <b>CSV</b> with the columns:', b_help_post:'First row = headers.',
        b_file:'CSV file', b_or:'Or paste CSV text below:', b_paste:'Or paste CSV text',
        b_import:'Import', b_cancel:'Cancel', b_sample:'Sample',
        b_prev:'Preview', b_leads:'leads', b_th_name:'Name', b_th_org:'Organisation', b_th_email:'Email',
        b_and:'… and', b_more:'more', b_confirm_pre:'Import', b_confirm_post:'leads into the pipeline?',
        b_sample_toast:'Sample downloaded', b_imported:'leads imported', nav_cal:'Calendar'
      }
    };
    function T(k){ return (STR[aLang()]||STR.nl)[k] || k; }

    /* ─── Data seeding ─── */
    DATA.leads.forEach(function(l){
      if (!l.tasks) l.tasks = [];
    });
    window.AdminData.save(DATA);

    /* ─── Re-wire showView to include dynamic views ─── */
    var origShowView = window.Admin && window.Admin.showView;
    if (origShowView){
      var NEW_VIEWS = ['calendar','outbox','funnel','seo','health','abtests','quotes','activity','siteteam'];
      window.Admin.showView = function(id){
        // Hide all views (incl. dynamic ones)
        document.querySelectorAll('.view').forEach(function(v){ v.classList.remove('is-active'); });
        document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.toggle('is-active', n.dataset.view === id); });
        var target = document.querySelector('#view-' + id);
        if (target) target.classList.add('is-active');
        if (location.hash !== '#'+id) history.replaceState(null,'','#'+id);
        var app = document.querySelector('.app');
        if (app && app.classList.contains('is-mobile-open')) app.classList.remove('is-mobile-open');
        var initFn = window['init_'+id];
        if (typeof initFn === 'function') initFn();
      };
      // If currently on a dynamic view (via hash), re-run init
      var initialHash = (location.hash||'').replace('#','');
      if (NEW_VIEWS.indexOf(initialHash) >= 0){
        setTimeout(function(){ window.Admin.showView(initialHash); }, 50);
      }
    }

    // Audit P6 — legacy 'calendar' nav-item verwijderd: was dubbel met de actieve
    // 'Agenda' (data-view="bookings", admin-bookings.js). De legacy kalender-VIEW +
    // init_calendar blijven bestaan (enkel niet meer in de nav) zodat niets breekt.
    var sidebar = $('.sidebar');

    var main = $('.main');
    if (main && !$('#view-calendar')){
      var v = document.createElement('div');
      v.innerHTML = '<section class="view" id="view-calendar"></section>';
      while (v.firstChild) main.appendChild(v.firstChild);
    }

    /* ═══════════ CALENDAR VIEW ═══════════ */
    window.init_calendar = function(){
      var v = $('#view-calendar');
      var now = new Date();
      var viewMonth = now.getMonth();
      var viewYear = now.getFullYear();

      function render(){
        var MONTHS = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
        var DAYS = aLang()==='en' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['Ma','Di','Wo','Do','Vr','Za','Zo'];

        var meetings = DATA.submissions.contact.map(function(c){
          // parse "donderdag 22 mei 2026" → Date
          var m = String(c.date).match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
          if (!m) return null;
          var monthIdx = MONTHS.indexOf(m[2].toLowerCase());
          if (monthIdx < 0) return null;
          return { date: new Date(parseInt(m[3],10), monthIdx, parseInt(m[1],10)), time:c.time, name:c.name, email:c.email, loc:c.loc, id:c.id };
        }).filter(Boolean);

        var first = new Date(viewYear, viewMonth, 1);
        var firstDow = (first.getDay()+6)%7;
        var daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
        var today = new Date(); today.setHours(0,0,0,0);

        var upcoming = meetings.filter(function(m){ return m.date >= today; }).sort(function(a,b){ return a.date - b.date; }).slice(0,5);

        v.innerHTML =
          '<div class="page-head"><div><div class="eyebrow">'+esc(T('agenda'))+'</div><h1>'+T('cal_h1')+'</h1><p>'+esc(T('cal_p'))+'</p></div>' +
          '<div class="page-head-actions"><button class="btn btn-ghost" id="cal-today">'+esc(T('today'))+'</button><button class="btn btn-ghost" id="cal-export"><i class="ti ti-download"></i>'+esc(T('export_ics'))+'</button></div></div>' +

          '<div class="grid-2 lf-grid">' +

            // CALENDAR GRID
            '<div class="panel">' +
              '<div class="panel-head">' +
                '<div class="lf-cal-head">' +
                  '<button class="btn btn-ghost btn-icon btn-icon-sm" id="cal-prev"><i class="ti ti-chevron-left"></i></button>' +
                  '<h class="lf-cal-title"3>'+new Date(viewYear, viewMonth, 1).toLocaleDateString(aLoc(),{month:'long'})+' '+viewYear+'</h3>' +
                  '<button class="btn btn-ghost btn-icon btn-icon-sm" id="cal-next"><i class="ti ti-chevron-right"></i></button>' +
                '</div>' +
                '<span class="panel-sub">'+meetings.filter(function(m){return m.date.getMonth()===viewMonth&&m.date.getFullYear()===viewYear;}).length+' '+esc(T('appts_month'))+'</span>' +
              '</div>' +
              '<div class="panel-body">' +
                '<div class="lf-cal-grid is-head">' +
                  DAYS.map(function(d){return '<div class="lf-cal-wd">'+d+'</div>';}).join('') +
                '</div>' +
                '<div class="lf-cal-grid" id="cal-grid">' +
                  Array(firstDow).fill('<div></div>').join('') +
                  Array.from({length:daysInMonth}, function(_,i){
                    var d = i+1;
                    var dateObj = new Date(viewYear, viewMonth, d);
                    var isToday = dateObj.getTime() === today.getTime();
                    var dayMeetings = meetings.filter(function(m){return m.date.getDate()===d&&m.date.getMonth()===viewMonth&&m.date.getFullYear()===viewYear;});
                    var hasMeetings = dayMeetings.length>0;
                    return '<div class="lf-day'+(isToday?' is-today':'')+(hasMeetings?' has-meet':'')+'" '+(hasMeetings?'data-cal-day="'+d+'"':'')+'>' +
                      '<div class="lf-day-num'+(isToday?' is-today':'')+'">'+d+'</div>' +
                      (hasMeetings ? '<div class="lf-day-meet"><i class="ti ti-circle-filled a-ico6"></i>'+dayMeetings.length+' '+esc(dayMeetings.length>1?T('appts'):T('appt'))+'</div>' : '') +
                    '</div>';
                  }).join('') +
                '</div>' +
              '</div>' +
            '</div>' +

            // UPCOMING SIDEBAR
            '<div class="panel">' +
              '<div class="panel-head"><h3>'+T('upcoming')+'</h3></div>' +
              '<div class="panel-body is-flush">' +
                (upcoming.length ? '<div class="feed">'+upcoming.map(function(m){
                  return '<div class="feed-item">' +
                    '<div class="feed-icon cal"><i class="ti ti-calendar-event"></i></div>' +
                    '<div class="feed-meta"><div class="feed-title"><b>'+esc(m.name)+'</b></div>' +
                    '<div class="feed-sub">'+esc(m.date.toLocaleDateString(aLoc(),{day:'numeric',month:'long'}))+' · '+esc(m.time)+' · '+esc(m.loc)+'</div></div>' +
                    '<div class="feed-time">'+daysAway(m.date)+'</div>' +
                  '</div>';
                }).join('')+'</div>' :
                '<div class="empty"><div class="ico"><i class="ti ti-calendar-x"></i></div><h4>'+esc(T('no_up_t'))+'</h4><p>'+esc(T('no_up_b'))+'</p></div>') +
              '</div>' +
            '</div>' +

          '</div>';

        // Wire navigation
        $('#cal-prev').onclick = function(){ viewMonth--; if(viewMonth<0){viewMonth=11;viewYear--;} render(); };
        $('#cal-next').onclick = function(){ viewMonth++; if(viewMonth>11){viewMonth=0;viewYear++;} render(); };
        $('#cal-today').onclick = function(){ viewMonth=new Date().getMonth(); viewYear=new Date().getFullYear(); render(); };
        $('#cal-export').onclick = exportICS;
        $$('[data-cal-day]').forEach(function(cell){
          cell.addEventListener('click', function(){
            var d = parseInt(cell.dataset.calDay,10);
            var dayMeetings = meetings.filter(function(m){return m.date.getDate()===d&&m.date.getMonth()===viewMonth&&m.date.getFullYear()===viewYear;});
            openDayDrawer(d, viewMonth, viewYear, dayMeetings);
          });
        });
      }

      function daysAway(d){
        var today = new Date(); today.setHours(0,0,0,0);
        var diff = Math.round((d - today)/86400000);
        if (diff === 0) return T('today_w');
        if (diff === 1) return T('tomorrow_w');
        if (diff < 7) return T('in_w')+' '+diff+' '+T('d_w');
        return T('in_w')+' '+Math.ceil(diff/7)+T('w_w');
      }

      function exportICS(){
        var ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Montisoro//Admin//NL\n';
        DATA.submissions.contact.forEach(function(c){
          var MONTHS = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
          var m = String(c.date).match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
          if (!m) return;
          var monthIdx = MONTHS.indexOf(m[2].toLowerCase());
          if (monthIdx < 0) return;
          var d = new Date(parseInt(m[3],10), monthIdx, parseInt(m[1],10));
          var t = c.time.split(':');
          d.setHours(parseInt(t[0],10), parseInt(t[1],10), 0);
          var dtstart = d.toISOString().replace(/[-:]/g,'').slice(0,15);
          var dend = new Date(d.getTime()+45*60000).toISOString().replace(/[-:]/g,'').slice(0,15);
          ics += 'BEGIN:VEVENT\nSUMMARY:'+T('appt_summary')+' · '+c.name+'\nDESCRIPTION:'+c.email+' · '+c.loc+'\nDTSTART:'+dtstart+'00\nDTEND:'+dend+'00\nEND:VEVENT\n';
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

      function openDayDrawer(d, mo, yr, meetings){
        var drawer = $('#drawer'); var bd = $('#drawer-backdrop');
        var dt = new Date(yr, mo, d);
        drawer.innerHTML =
          '<div class="drawer-head"><div><div class="eyebrow">'+esc(T('day_eyebrow'))+'</div><h3>'+dt.toLocaleDateString(aLoc(),{weekday:'long',day:'numeric',month:'long'})+'</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
          '<div class="drawer-body">' +
            meetings.map(function(m){
              return '<div class="lf-next">' +
                '<div class="lf-next-head"><i class="ti ti-clock u-c-orange"></i><b class="lf-t15">'+esc(m.time)+'</b><span class="lf-t115">· 45 '+esc(T('min'))+'</span></div>' +
                '<div class="lf-h17">'+esc(m.name)+'</div>' +
                '<div class="lf-sub">'+esc(m.email)+' · '+esc(m.loc)+'</div>' +
                '<div class="lf-btnrow">' +
                  '<a href="mailto:'+esc(m.email)+'" class="btn btn-ghost lf-b1"><i class="ti ti-mail"></i>'+esc(T('email'))+'</a>' +
                  '<button class="btn btn-ghost lf-b1"><i class="ti ti-edit"></i>'+esc(T('edit'))+'</button>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>';
        drawer.classList.add('is-open'); bd.classList.add('is-open');
        drawer.querySelector('[data-close]').addEventListener('click', function(){
          drawer.classList.remove('is-open'); bd.classList.remove('is-open');
        });
      }

      render();
    };

    /* ═══════════ ADVANCED LEAD FILTERS ═══════════ */
    var origInitLeads = window.init_leads;
    if (origInitLeads){
      window.init_leads = function(){
        origInitLeads();
        injectFilters();
      };
      if ($('#view-leads.is-active')) injectFilters();
    } else {
      // Wait until init_leads is defined
      setTimeout(function(){
        var fn = window.init_leads;
        if (fn){
          window.init_leads = function(){ fn(); injectFilters(); };
          if ($('#view-leads.is-active')) injectFilters();
        }
      }, 200);
    }

    var filters = { search:'', source:'', industry:'', minScore:0, minValue:0 };

    function injectFilters(){
      var view = $('#view-leads');
      if (!view) return;
      var existingBar = view.querySelector('.lead-filter-bar');
      var wasOpen = !!(existingBar && existingBar.style.display !== 'none'); // audit P8 — bewaar open/dicht over rebuilds
      if (existingBar) existingBar.remove();

      var pipeline = $('#leads-pipeline');
      if (!pipeline) return;

      var bar = document.createElement('div');
      bar.className = 'lead-filter-bar panel';
      bar.style.cssText = 'margin-bottom:18px;padding:14px 18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;';

      var sources = ['', ...new Set(DATA.leads.map(function(l){return l.source;}))];
      var industries = ['', ...new Set(DATA.leads.map(function(l){return l.industry||'Other';}))];

      bar.innerHTML =
        '<div class="lf-search">' +
          '<i class="ti ti-search lf-search-ico"></i>' +
          '<input class="lf-search-in" id="lf-search" placeholder="'+esc(T('f_search'))+'">' +
        '</div>' +
        '<select id="lf-source" class="a-input-sm">' +
          sources.map(function(s){return '<option value="'+esc(s)+'">'+(s?esc(s):esc(T('f_sources')))+'</option>';}).join('') +
        '</select>' +
        '<select id="lf-industry" class="a-input-sm">' +
          industries.map(function(s){return '<option value="'+esc(s)+'">'+(s?esc(s):esc(T('f_industries')))+'</option>';}).join('') +
        '</select>' +
        '<select id="lf-score" class="a-input-sm">' +
          '<option value="0">'+esc(T('f_scores'))+'</option><option value="80">'+esc(T('f_hot'))+'</option><option value="50">'+esc(T('f_warm'))+'</option><option value="30">'+esc(T('f_cold'))+'</option>' +
        '</select>' +
        '<button class="btn btn-ghost lf-b2" id="lf-reset"><i class="ti ti-rotate"></i>'+esc(T('f_reset'))+'</button>';

      pipeline.parentNode.insertBefore(bar, pipeline);
      bar.style.display = wasOpen ? 'flex' : 'none'; // audit P8 — standaard verborgen; tonen via de "Filter"-knop (geen dubbele zoekbalk)

      // Restore current selections after a (re)build so a language switch keeps state
      $('#lf-search').value = filters.search || '';
      $('#lf-source').value = filters.source || '';
      $('#lf-industry').value = filters.industry || '';
      $('#lf-score').value = String(filters.minScore || 0);

      function apply(){
        var q = filters.search.toLowerCase();
        $$('.pipe-card[data-lead-id]').forEach(function(card){
          var leadId = card.dataset.leadId;
          var l = DATA.leads.find(function(x){return x.id===leadId;});
          if (!l) return;
          var matchQ = !q || l.name.toLowerCase().includes(q) || l.org.toLowerCase().includes(q) || (l.email||'').toLowerCase().includes(q);
          var matchSrc = !filters.source || l.source === filters.source;
          var matchInd = !filters.industry || (l.industry || 'Other') === filters.industry;
          var matchSc = (l.score||0) >= filters.minScore;
          card.style.display = (matchQ && matchSrc && matchInd && matchSc) ? '' : 'none';
        });
        // Update counts in column headers
        $$('.pipe-col').forEach(function(col){
          var visible = col.querySelectorAll('.pipe-card:not([style*="display: none"])').length;
          var countEl = col.querySelector('.count');
          if (countEl) countEl.textContent = visible;
        });
      }

      $('#lf-search').addEventListener('input', function(e){ filters.search = e.target.value; apply(); });
      $('#lf-source').addEventListener('change', function(e){ filters.source = e.target.value; apply(); });
      $('#lf-industry').addEventListener('change', function(e){ filters.industry = e.target.value; apply(); });
      $('#lf-score').addEventListener('change', function(e){ filters.minScore = parseInt(e.target.value,10); apply(); });
      $('#lf-reset').addEventListener('click', function(){
        filters = { search:'', source:'', industry:'', minScore:0, minValue:0 };
        $('#lf-search').value=''; $('#lf-source').value=''; $('#lf-industry').value=''; $('#lf-score').value='0';
        apply();
      });
    }

    /* ═══════════ AI FOLLOW-UP + TASKS — extend lead drawer ═══════════ */
    // Observe drawer to inject AI + Tasks panels when lead drawer opens
    var drawer = $('#drawer');
    if (drawer){
      var observer = new MutationObserver(function(){
        if (drawer.classList.contains('is-open') && drawer.querySelector('.eyebrow') && drawer.querySelector('.eyebrow').textContent.trim() === 'Lead'){
          injectAITasksIntoLeadDrawer();
        }
      });
      observer.observe(drawer, { childList:true, subtree:false, attributes:true, attributeFilter:['class'] });
    }

    function injectAITasksIntoLeadDrawer(){
      var body = drawer.querySelector('.drawer-body');
      if (!body || body.querySelector('.lead-ai-tasks')) return;

      // Find which lead by matching name in drawer head h3
      var name = drawer.querySelector('h3')?.textContent.trim();
      var lead = DATA.leads.find(function(l){return l.name===name;});
      if (!lead) return;

      var section = document.createElement('div');
      section.className = 'lead-ai-tasks';
      section.style.cssText = 'margin-top:24px;padding-top:24px;border-top:1px solid var(--a-div);';

      // Tasks
      var tasksHtml = (lead.tasks||[]).map(function(t,i){
        return '<div class="lf-task'+(t.done?' is-done':'')+'">' +
          '<input class="lf-check" type="checkbox" data-task-idx="'+i+'" '+(t.done?'checked':'')+'>' +
          '<span class="lf-task-label'+(t.done?' is-done':'')+'">'+esc(t.text)+'</span>' +
          '<span class="lf-task-time">'+esc(t.due||'')+'</span>' +
          '<button class="lf-task-x" data-task-del="'+i+'"><i class="ti ti-x"></i></button>' +
        '</div>';
      }).join('');

      section.innerHTML =
        '<div class="lf-kicker"><i class="ti ti-list-check u-mr-6"></i>'+esc(T('t_tasks'))+'</div>' +
        '<div id="lead-tasks-list">'+(tasksHtml||'<div class="lf-empty-line">'+esc(T('t_none'))+'</div>')+'</div>' +
        '<div class="lf-row10">' +
          '<input class="lf-in" id="new-task" placeholder="'+esc(T('t_new'))+'">' +
          '<input class="lf-in-date" id="new-task-due" type="date">' +
          '<button class="btn btn-primary btn-md" id="task-add"><i class="ti ti-plus"></i></button>' +
        '</div>' +

        '<div class="lf-kicker u-mt-24"><i class="ti ti-sparkles u-mr-6"></i>'+esc(T('ai_title'))+'</div>' +
        '<div class="lf-ai-box">' +
          '<div class="lf-ai-sub">'+esc(T('ai_desc'))+'</div>' +
          '<button class="btn btn-primary lf-b3" id="ai-gen"><i class="ti ti-sparkles"></i>'+esc(T('ai_gen'))+'</button>' +
          '<div id="ai-output" style="margin-top:12px;display:none;"></div>' +
        '</div>';

      body.appendChild(section);

      // Wire tasks
      $('#task-add').onclick = function(){
        var text = $('#new-task').value.trim();
        var due = $('#new-task-due').value;
        if (!text) return;
        lead.tasks = lead.tasks || [];
        lead.tasks.push({ text:text, due:due, done:false, ts:new Date().toISOString().slice(0,10) });
        window.AdminData.save(DATA);
        window.Admin.showToast(T('t_added'));
        if (window.Admin.logActivity) window.Admin.logActivity('Taak toegevoegd · '+lead.name+': '+text, 'list-check');
        injectAITasksIntoLeadDrawer(); // rerender
      };
      $$('[data-task-idx]').forEach(function(cb){
        cb.addEventListener('change', function(){
          var idx = parseInt(cb.dataset.taskIdx,10);
          lead.tasks[idx].done = cb.checked;
          window.AdminData.save(DATA);
        });
      });
      $$('[data-task-del]').forEach(function(b){
        b.addEventListener('click', function(){
          var idx = parseInt(b.dataset.taskDel,10);
          lead.tasks.splice(idx,1);
          window.AdminData.save(DATA);
          injectAITasksIntoLeadDrawer();
        });
      });

      $('#ai-gen').onclick = function(){
        var btn = $('#ai-gen');
        var out = $('#ai-output');
        btn.disabled = true;
        btn.innerHTML = '<i class="ti ti-loader"></i>'+esc(T('ai_writing'));
        out.style.display = 'block';
        out.innerHTML = '<div class="lf-note"><i class="ti ti-loader ti-spin u-mr-6"></i>'+esc(T('ai_wait'))+'</div>';

        var prompt = 'Schrijf een professionele follow-up e-mail in het Nederlands voor deze lead. Houd het kort (max 120 woorden), persoonlijk, en zonder verkooppraat. Eindig met een concrete vraag of next step. NIET ondertekend.\n\n' +
          'Lead: '+lead.name+' van '+lead.org+'\n' +
          'Stage: '+lead.stage+'\n' +
          'Bron: '+lead.source+'\n' +
          'Industry: '+(lead.industry||'onbekend')+'\n' +
          'Waarde indicatie: '+lead.value+'\n' +
          'Laatste notitie: '+(lead.notes||'geen')+'\n\n' +
          'Begin de e-mail met "Beste '+(lead.name.split(' ')[0])+'," en sluit af met een open vraag voor next step.';

        if (window.claude && window.claude.complete){
          window.claude.complete(prompt).then(function(text){
            out.innerHTML =
              '<div class="lf-mailprev">'+esc(text)+'</div>' +
              '<div class="lf-row10">' +
                '<button class="btn btn-primary btn-md is-grow" id="ai-copy"><i class="ti ti-copy"></i>'+esc(T('ai_copy'))+'</button>' +
                '<button class="btn btn-ghost btn-md is-grow" id="ai-send"><i class="ti ti-mail"></i>'+esc(T('ai_open'))+'</button>' +
                '<button class="btn btn-ghost btn-md" id="ai-regen"><i class="ti ti-rotate"></i></button>' +
              '</div>';
            btn.disabled = false;
            btn.innerHTML = '<i class="ti ti-sparkles"></i>'+T('ai_gen');
            $('#ai-copy').onclick = function(){
              navigator.clipboard.writeText(text).then(function(){ window.Admin.showToast(T('ai_copied')); });
            };
            $('#ai-send').onclick = function(){
              location.href = 'mailto:'+lead.email+'?subject='+encodeURIComponent('Re: gesprek')+'&body='+encodeURIComponent(text);
            };
            $('#ai-regen').onclick = function(){ $('#ai-gen').click(); };
            if (window.Admin.logActivity) window.Admin.logActivity('AI follow-up gegenereerd · '+lead.name, 'sparkles');
          }).catch(function(err){
            out.innerHTML = '<div class="lf-err">'+esc(T('ai_err'))+': '+esc(String(err))+'.</div>';
            btn.disabled = false;
            btn.innerHTML = '<i class="ti ti-sparkles"></i>'+T('ai_gen');
          });
        } else {
          out.innerHTML = '<div class="lf-muted-note">'+esc(T('ai_unavail'))+'</div>';
          btn.disabled = false;
          btn.innerHTML = '<i class="ti ti-sparkles"></i>'+T('ai_gen');
        }
      };
    }

    /* ═══════════ BULK CSV IMPORT ═══════════ */
    // Add "Bulk import" button to leads page-head
    setTimeout(function(){
      var view = $('#view-leads');
      if (!view) return;
      var actions = view.querySelector('.page-head-actions');
      if (!actions || actions.querySelector('#leads-bulk-import')) return;
      var btn = document.createElement('button');
      btn.className = 'btn btn-ghost';
      btn.id = 'leads-bulk-import';
      btn.innerHTML = '<i class="ti ti-upload"></i>'+esc(T('b_bulk'));
      actions.insertBefore(btn, actions.firstChild);
      btn.addEventListener('click', openBulkImport);
    }, 400);

    /* ─── Re-translate injected-once chrome on language switch ─── */
    document.addEventListener('admin:langchange', function(){
      var navLbl = document.getElementById('nav-calendar-lbl');
      if (navLbl) navLbl.textContent = T('nav_cal');
      var bulkBtn = document.getElementById('leads-bulk-import');
      if (bulkBtn) bulkBtn.innerHTML = '<i class="ti ti-upload"></i>'+esc(T('b_bulk'));
    });

    function openBulkImport(){
      var drawer = $('#drawer'); var bd = $('#drawer-backdrop');
      drawer.innerHTML =
        '<div class="drawer-head"><div><div class="eyebrow">'+esc(T('b_bulk'))+'</div><h3>'+T('b_h1')+'</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
        '<div class="drawer-body">' +
          '<div class="help-banner"><i class="ti ti-info-circle"></i><p>'+T('b_help_pre')+' <code class="u-c-orange">name, org, email, phone, source, value, stage, notes</code>. '+esc(T('b_help_post'))+'</p></div>' +
          '<div class="field"><label>'+esc(T('b_file'))+'</label>' +
            '<input type="file" id="csv-file" accept=".csv,text/csv" style="background:rgba(29,29,31,0.04);border:1px dashed var(--a-div-2);border-radius:10px;padding:14px;color:var(--a-off);font:inherit;font-size:13px;cursor:pointer;width:100%;">' +
            '<div class="hint">'+esc(T('b_or'))+'</div>' +
          '</div>' +
          '<div class="field"><label>'+esc(T('b_paste'))+'</label><textarea id="csv-text" rows="8" placeholder="name,org,email,phone,source,value,stage,notes\nJan Janssens,Acme Corp,jan@acme.be,+32 477 12 34 56,fit-check,€50K,new,Eerste contact" style="font-family:monospace;font-size:11.5px;line-height:1.5;"></textarea></div>' +
          '<div id="csv-preview" style="margin-top:12px;display:none;"></div>' +
        '</div>' +
        '<div class="drawer-foot"><button class="btn btn-primary" id="csv-import" disabled><i class="ti ti-upload"></i>'+esc(T('b_import'))+'</button><button class="btn btn-ghost" data-close><i class="ti ti-x"></i>'+esc(T('b_cancel'))+'</button><button class="btn btn-ghost u-ml-auto" id="csv-sample"><i class="ti ti-download"></i>'+esc(T('b_sample'))+'</button></div>';
      drawer.classList.add('is-open'); bd.classList.add('is-open');
      drawer.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click', function(){drawer.classList.remove('is-open');bd.classList.remove('is-open');});});

      var parsedLeads = [];

      function parseCSV(text){
        var lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        var headers = lines[0].split(',').map(function(h){return h.trim().toLowerCase();});
        return lines.slice(1).map(function(line){
          var cols = parseLine(line);
          var row = {};
          headers.forEach(function(h,i){ row[h] = (cols[i]||'').trim(); });
          return row;
        });
      }
      function parseLine(line){
        var result = [], cur = '', inQ = false;
        for (var i = 0; i < line.length; i++){
          var c = line[i];
          if (c === '"' && !inQ){ inQ = true; }
          else if (c === '"' && inQ){
            if (line[i+1] === '"'){ cur += '"'; i++; } else { inQ = false; }
          }
          else if (c === ',' && !inQ){ result.push(cur); cur = ''; }
          else { cur += c; }
        }
        result.push(cur);
        return result;
      }

      function preview(text){
        parsedLeads = parseCSV(text);
        var prev = $('#csv-preview');
        if (parsedLeads.length === 0){
          prev.style.display = 'none';
          $('#csv-import').disabled = true;
          return;
        }
        prev.style.display = 'block';
        prev.innerHTML =
          '<div class="lf-kicker2"><i class="ti ti-eye u-mr-6"></i>'+esc(T('b_prev'))+' · '+parsedLeads.length+' '+esc(T('b_leads'))+'</div>' +
          '<div class="lf-scroll">' +
            '<table class="lf-tbl"><thead><tr><th class="lf-th">'+esc(T('b_th_name'))+'</th><th class="lf-th">'+esc(T('b_th_org'))+'</th><th class="lf-th">'+esc(T('b_th_email'))+'</th></tr></thead><tbody>' +
            parsedLeads.slice(0,8).map(function(r){
              return '<tr class="lf-tr"><td class="lf-td">'+esc(r.name||r.naam||'—')+'</td><td class="lf-td-m">'+esc(r.org||r.organisatie||'—')+'</td><td class="lf-td-m">'+esc(r.email||'—')+'</td></tr>';
            }).join('') +
            '</tbody></table>' +
          '</div>' +
          (parsedLeads.length > 8 ? '<div class="lf-foot-note">'+esc(T('b_and'))+' '+(parsedLeads.length-8)+' '+esc(T('b_more'))+'</div>' : '');
        $('#csv-import').disabled = false;
      }

      $('#csv-file').addEventListener('change', function(e){
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev){
          $('#csv-text').value = ev.target.result;
          preview(ev.target.result);
        };
        reader.readAsText(file);
      });
      $('#csv-text').addEventListener('input', function(e){ preview(e.target.value); });

      $('#csv-sample').addEventListener('click', function(){
        var sample = 'name,org,email,phone,source,value,stage,notes\nJan Janssens,Acme Corp,jan@acme.be,+32 477 12 34 56,fit-check,€50K,new,Eerste contact via LinkedIn\nMaria Peeters,Beta Industries,m.peeters@beta.com,+32 478 90 12 34,referral,€80K,qualified,Doorverwezen via Tom';
        var blob = new Blob([sample],{type:'text/csv'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'leads-voorbeeld.csv';
        a.click();
        URL.revokeObjectURL(url);
        window.Admin.showToast(T('b_sample_toast'));
      });

      $('#csv-import').addEventListener('click', function(){
        if (!confirm(T('b_confirm_pre')+' '+parsedLeads.length+' '+T('b_confirm_post'))) return;
        var added = 0;
        parsedLeads.forEach(function(r){
          var name = r.name || r.naam;
          if (!name) return;
          DATA.leads.push({
            id: 'l-'+Date.now()+'-'+(added++),
            name: name,
            org: r.org || r.organisatie || '—',
            email: r.email || '',
            phone: r.phone || r.telefoon || '',
            source: r.source || 'imported',
            value: r.value || r.waarde || '€0',
            stage: r.stage || 'new',
            notes: r.notes || r.notities || '',
            ts: new Date().toISOString().slice(0,16).replace('T',' '),
            score: 30,
            industry: 'Other',
            country: 'BE'
          });
        });
        window.AdminData.save(DATA);
        drawer.classList.remove('is-open'); bd.classList.remove('is-open');
        window.Admin.showToast(added+' '+T('b_imported'));
        if (window.Admin.logActivity) window.Admin.logActivity(added+' leads geïmporteerd via CSV', 'upload');
        if (window.init_leads) window.init_leads();
      });
    }
  }
})();
