/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — Pro module
   Notifications · Help · i18n · User menu · Activity log · Export
═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function $(s,r){return (r||document).querySelector(s);}
  function $$(s,r){return Array.from((r||document).querySelectorAll(s));}
  function esc(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML;}
  function whenReady(fn){
    if (window.AdminData && window.Admin) fn();
    else setTimeout(function(){whenReady(fn);}, 50);
  }

  whenReady(function(){
    if (window.__adminProInjected) return;
    window.__adminProInjected = true;
    var DATA = window.AdminData.load();

    // ═════════════════════════════ DATA EXTENSIONS ═════════════
    DATA.notifications = (Array.isArray(DATA.notifications) ? DATA.notifications : null) || seedNotifications();
    DATA.activityLog = DATA.activityLog || seedActivityLog();
    DATA.adminLang = DATA.adminLang || 'nl';
    DATA.session = DATA.session || JSON.parse(sessionStorage.getItem('admin.session') || '{}');
    // Eenmalige opschoning van oude demo-seed (Karel Verhaeghe etc.) → echte, lege start
    if (!DATA.__cleanV12){
      DATA.notifications = [];
      DATA.activityLog = [];
      DATA.__cleanV12 = true;
    }
    window.AdminData.save(DATA);

    function seedNotifications(){ return []; }
    function seedActivityLog(){ return []; }

    // ═════════════════════════════ TRANSLATIONS ═════════════════
    var i18n = {
      nl: {
        notifications:'Notificaties', help:'Hulp', markAllRead:'Markeer alles gelezen', allNotifs:'Alle notificaties', empty:'Geen notificaties',
        profile:'Mijn profiel', themePref:'Voorkeur', settings:'Instellingen', logout:'Uitloggen',
        helpTitle:'Hulp & sneltoetsen', shortcuts:'Sneltoetsen', search:'Zoeken openen', closeModal:'Modal/drawer sluiten',
        adminLang:'Admin-taal', supportSubject:'Hulpvraag admin', contactSupport:'Contacteer support',
        activityLog:'Activiteitenlog', export:'Exporteer',
        navResults:'Navigatie zoekresultaten', tipsTitle:'Tips voor dagelijks gebruik',
        tip1t:'Leads sneller bekijken', tip1b:'Druk ⌘K, typ een naam of organisatie, druk ↵ om direct het lead-paneel te openen.',
        tip2t:'Pagina bewerken', tip2b:'Content → klik op een pagina-kaart. Tabs bovenaan wisselen tussen NL en EN.',
        tip3t:'Team op website', tip3b:'Foto, naam, functie en bio per persoon. Iemand op pauze zetten zonder data te verliezen.',
        tip4t:'Integraties activeren', tip4b:'Instellingen → Integraties. Koppel Google Analytics, LinkedIn of Mailchimp aan het dashboard.',
        helpNeedQ:'Hulp nodig?', helpNeedPre:'Stuur een mail naar', helpNeedPost:'— we reageren binnen 24u.',
        close:'Sluiten', profileToast:'Klik op uw kaart om uw profiel te bewerken', logoutConfirm:'Zeker dat u wilt uitloggen?',
        nothingExport:'Niets te exporteren', csvDownloaded:'CSV gedownload',
        searchResultsHint:'Navigatie zoekresultaten'
      },
      en: {
        notifications:'Notifications', help:'Help', markAllRead:'Mark all read', allNotifs:'All notifications', empty:'No notifications',
        profile:'My profile', themePref:'Preferences', settings:'Settings', logout:'Log out',
        helpTitle:'Help & shortcuts', shortcuts:'Shortcuts', search:'Open search', closeModal:'Close modal/drawer',
        adminLang:'Admin language', supportSubject:'Admin support request', contactSupport:'Contact support',
        activityLog:'Activity log', export:'Export',
        navResults:'Navigate search results', tipsTitle:'Tips for daily use',
        tip1t:'View leads faster', tip1b:'Press ⌘K, type a name or organisation, press ↵ to open the lead panel directly.',
        tip2t:'Edit a page', tip2b:'Content → click a page card. Tabs at the top switch between NL and EN.',
        tip3t:'Website team', tip3b:'Photo, name, role and bio per person. Pause someone without losing data.',
        tip4t:'Activate integrations', tip4b:'Settings → Integrations. Connect Google Analytics, LinkedIn or Mailchimp to the dashboard.',
        helpNeedQ:'Need help?', helpNeedPre:'Send an email to', helpNeedPost:'— we reply within 24h.',
        close:'Close', profileToast:'Click your card to edit your profile', logoutConfirm:'Are you sure you want to log out?',
        nothingExport:'Nothing to export', csvDownloaded:'CSV downloaded',
        searchResultsHint:'Navigate search results'
      }
    };
    function curAdminLang(){ return (window.MONTISORO_ADMIN_I18N) ? window.MONTISORO_ADMIN_I18N.getLang() : (DATA.adminLang || 'nl'); }
    function L(key){ return (i18n[curAdminLang()] || i18n.nl)[key] || key; }

    // ═════════════════════════════ STYLES ═════════════════════
    var css = `
.tb-pop{position:absolute;top:calc(100% + 8px);right:0;min-width:340px;max-width:420px;background:var(--a-bg-1);border:1px solid var(--a-div);border-radius:14px;box-shadow:0 20px 50px -10px rgba(0,0,0,0.5);z-index:80;opacity:0;pointer-events:none;transform:translateY(-6px);transition:opacity .22s var(--a-ease), transform .22s var(--a-ease);overflow:hidden;}
.tb-pop.is-open{opacity:1;pointer-events:auto;transform:translateY(0);}
.tb-pop-head{padding:14px 18px;border-bottom:1px solid var(--a-div);display:flex;align-items:center;justify-content:space-between;}
.tb-pop-head h4{font-family:var(--a-serif);font-weight:700;font-size:14px;color:var(--a-off);letter-spacing:-.005em;}
.tb-pop-head .lnk{font-size:11px;font-weight:500;color:var(--a-orange);cursor:pointer;letter-spacing:.04em;}
.tb-pop-head .lnk:hover{text-decoration:underline;}
.tb-pop-body{max-height:420px;overflow-y:auto;}
.tb-pop-foot{padding:10px 16px;border-top:1px solid var(--a-div);background:rgba(29,29,31,0.02);display:flex;justify-content:center;}
.tb-pop-foot button{background:transparent;border:0;color:var(--a-muted);font-size:11.5px;cursor:pointer;font-family:inherit;}
.tb-pop-foot button:hover{color:var(--a-off);}

.notif-item{display:grid;grid-template-columns:32px 1fr auto;gap:12px;padding:12px 18px;border-bottom:1px solid var(--a-div);cursor:pointer;transition:background .15s;align-items:center;position:relative;}
.notif-item:last-child{border-bottom:none;}
.notif-item:hover{background:rgba(232,89,43,0.05);}
.notif-item.unread{background:rgba(232,89,43,0.03);}
.notif-item.unread::before{content:'';position:absolute;left:8px;top:50%;transform:translateY(-50%);width:5px;height:5px;border-radius:50%;background:var(--a-orange);}
.notif-icon{width:32px;height:32px;border-radius:8px;background:rgba(232,89,43,0.10);color:var(--a-orange);display:flex;align-items:center;justify-content:center;font-size:14px;}
.notif-meta .t{font-size:12.5px;font-weight:600;color:var(--a-off);letter-spacing:-.005em;}
.notif-meta .s{font-size:11px;color:var(--a-muted-2);margin-top:1px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;}
.notif-time{font-size:10.5px;color:var(--a-muted-3);font-feature-settings:"tnum";}

.user-menu{min-width:240px;}
.user-menu-head{padding:14px 18px;border-bottom:1px solid var(--a-div);display:flex;align-items:center;gap:10px;}
.user-menu-head .av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#E8592B,#C8824A);display:flex;align-items:center;justify-content:center;font-family:var(--a-serif);font-weight:700;font-size:14px;color:#fff;flex-shrink:0;}
.user-menu-head .n{font-size:13px;font-weight:600;color:var(--a-off);}
.user-menu-head .e{font-size:11px;color:var(--a-muted-2);}
.user-menu-item{display:flex;align-items:center;gap:12px;padding:10px 18px;cursor:pointer;color:var(--a-muted);font-size:13px;transition:background .15s;}
.user-menu-item:hover{background:rgba(232,89,43,0.05);color:var(--a-off);}
.user-menu-item i{font-size:16px;width:18px;text-align:center;}
.user-menu-item.danger{color:#E85C5C;border-top:1px solid var(--a-div);}
.user-menu-item.danger:hover{background:rgba(232,92,92,0.06);}

.lang-menu{min-width:160px;}
.lang-opt{display:flex;align-items:center;gap:10px;padding:10px 18px;cursor:pointer;font-size:13px;color:var(--a-muted);transition:background .15s;}
.lang-opt:hover{background:rgba(232,89,43,0.05);color:var(--a-off);}
.lang-opt.active{color:var(--a-orange);background:rgba(232,89,43,0.06);}
.lang-opt i{font-size:14px;}

.kbd-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--a-div);font-size:13px;}
.kbd-row:last-child{border-bottom:none;}
.kbd-row .k{color:var(--a-muted);}
.kbd-row .v kbd{display:inline-block;background:rgba(29,29,31,0.06);border:1px solid var(--a-div);padding:2px 7px;border-radius:5px;font-family:inherit;font-size:11px;color:var(--a-off);margin-left:4px;}

.log-row{display:grid;grid-template-columns:140px 100px 1fr 1fr 100px;gap:18px;padding:14px 24px;border-bottom:1px solid var(--a-div);align-items:center;font-size:13px;color:var(--a-off);}
.log-row.head{font-size:10.5px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--a-muted-2);background:rgba(29,29,31,0.02);}
.log-row .ts{font-feature-settings:"tnum";color:var(--a-muted-2);font-size:12px;}
.log-row .who-pill{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:500;}
.log-row .who-pill .av{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#E8592B,#C8824A);display:flex;align-items:center;justify-content:center;font-family:var(--a-serif);font-weight:700;font-size:10px;color:#fff;flex-shrink:0;}
.log-row .tg{font-size:10px;font-weight:600;letter-spacing:.06em;padding:3px 9px;border-radius:100px;}
.log-row .tg.create{background:rgba(90,191,126,0.12);color:var(--a-good);border:1px solid rgba(90,191,126,0.22);}
.log-row .tg.edit{background:rgba(232,180,92,0.10);color:var(--a-warn);border:1px solid rgba(232,180,92,0.22);}
.log-row .tg.delete{background:rgba(232,92,92,0.10);color:#E85C5C;border:1px solid rgba(232,92,92,0.22);}
@media(max-width:880px){.log-row{grid-template-columns:1fr;gap:6px;}}
`;
    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // ═════════════════════════════ HELPERS ═════════════════════
    function timeAgo(ts){
      var d = new Date(ts.replace(' ','T'));
      var diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return curAdminLang()==='en' ? 'just now' : 'net nu';
      if (diff < 3600) return Math.floor(diff/60)+'m';
      if (diff < 86400) return Math.floor(diff/3600)+'u';
      if (diff < 604800) return Math.floor(diff/86400)+'d';
      return d.toLocaleDateString(curAdminLang()==='en'?'en-GB':'nl-BE',{day:'numeric',month:'short'});
    }

    function makePop(button, contentHtml){
      // Wrap button parent if needed so we can position relative
      var parent = button.parentElement;
      if (parent && getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
      var pop = document.createElement('div');
      pop.className = 'tb-pop';
      pop.innerHTML = contentHtml;
      button.parentElement.appendChild(pop);
      return pop;
    }

    function closeAllPops(){
      $$('.tb-pop.is-open').forEach(function(p){ p.classList.remove('is-open'); });
    }

    document.addEventListener('click', function(e){
      if (!e.target.closest('.tb-pop') && !e.target.closest('[data-tb-toggle]')) closeAllPops();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') closeAllPops();
    });

    // ═════════════════════════════ 1. NOTIFICATIONS ═════════════
    var bellBtn = $('#btn-notif');
    if (bellBtn){
      bellBtn.setAttribute('data-tb-toggle','notif');
      bellBtn.setAttribute('title', L('notifications'));
      var notifPop = makePop(bellBtn, '');
      renderNotif();

      bellBtn.addEventListener('click', function(e){
        e.stopPropagation();
        var open = notifPop.classList.contains('is-open');
        closeAllPops();
        if (!open) { renderNotif(); notifPop.classList.add('is-open'); }
      });

      function renderNotif(){
        var unread = DATA.notifications.filter(function(n){return !n.read;}).length;
        bellBtn.querySelector('.dot').style.display = unread ? '' : 'none';
        var html =
          '<div class="tb-pop-head">' +
            '<h4>'+esc(L('notifications'))+' · <span class="pr-em">'+unread+'</span></h4>' +
            (unread ? '<span class="lnk" data-mark-all>'+esc(L('markAllRead'))+'</span>' : '') +
          '</div>' +
          '<div class="tb-pop-body">' +
            (DATA.notifications.length === 0
              ? '<div class="pr-empty">'+esc(L('empty'))+'</div>'
              : DATA.notifications.slice(0,8).map(function(n){
                  return '<div class="notif-item '+(n.read?'':'unread')+'" data-notif="'+esc(n.id)+'" data-action="'+esc(n.action)+'">' +
                    '<div class="notif-icon"><i class="ti ti-'+esc(n.icon)+'"></i></div>' +
                    '<div class="notif-meta"><div class="t">'+esc(n.title)+'</div><div class="s">'+esc(n.sub)+'</div></div>' +
                    '<div class="notif-time">'+esc(timeAgo(n.ts))+'</div>' +
                  '</div>';
                }).join('')) +
          '</div>' +
          '<div class="tb-pop-foot"><button data-view-log>'+esc(L('activityLog'))+' →</button></div>';
        notifPop.innerHTML = html;

        var mAll = notifPop.querySelector('[data-mark-all]');
        if (mAll) mAll.addEventListener('click', function(e){
          e.stopPropagation();
          DATA.notifications.forEach(function(n){n.read = true;});
          window.AdminData.save(DATA);
          renderNotif();
        });
        notifPop.querySelectorAll('[data-notif]').forEach(function(el){
          el.addEventListener('click', function(){
            var id = el.dataset.notif;
            var n = DATA.notifications.find(function(x){return x.id===id;});
            if (n) { n.read = true; window.AdminData.save(DATA); }
            closeAllPops();
            if (el.dataset.action) window.Admin.showView(el.dataset.action);
          });
        });
        var logBtn = notifPop.querySelector('[data-view-log]');
        if (logBtn) logBtn.addEventListener('click', function(){
          closeAllPops();
          window.Admin.showView('activitylog');
        });
      }
    }

    // ═════════════════════════════ 2. HELP ═════════════════════
    var helpBtn = $('#btn-help');
    if (helpBtn){
      helpBtn.setAttribute('data-tb-toggle','help');
      helpBtn.setAttribute('title', L('help'));
      helpBtn.addEventListener('click', function(e){
        e.stopPropagation();
        closeAllPops();
        openHelpDrawer();
      });
    }

    function openHelpDrawer(){
      var html =
        '<div class="drawer-head"><div><div class="eyebrow">'+esc(L('help'))+'</div><h3>'+esc(L('helpTitle'))+'</h3></div><button class="drawer-close" data-help-close><i class="ti ti-x"></i></button></div>' +
        '<div class="drawer-body">' +
          '<div class="pr-kicker"><i class="ti ti-keyboard u-mr-6"></i>'+esc(L('shortcuts'))+'</div>' +
          '<div class="kbd-row"><span class="k">'+esc(L('search'))+'</span><span class="v"><kbd>⌘</kbd><kbd>K</kbd></span></div>' +
          '<div class="kbd-row"><span class="k">'+esc(L('closeModal'))+'</span><span class="v"><kbd>esc</kbd></span></div>' +
          '<div class="kbd-row"><span class="k">'+esc(L('navResults'))+'</span><span class="v"><kbd>↑</kbd><kbd>↓</kbd><kbd>↵</kbd></span></div>' +

          '<div class="pr-kicker2"><i class="ti ti-bulb u-mr-6"></i>'+esc(L('tipsTitle'))+'</div>' +
          '<div class="pr-col14">' +
            tipCard('user',L('tip1t'),L('tip1b')) +
            tipCard('file-text',L('tip2t'),L('tip2b')) +
            tipCard('users-group',L('tip3t'),L('tip3b')) +
            tipCard('plug-connected',L('tip4t'),L('tip4b')) +
          '</div>' +

          '<div class="help-banner u-mt-32">' +
            '<i class="ti ti-mail"></i>' +
            '<p><b>'+esc(L('helpNeedQ'))+'</b> '+esc(L('helpNeedPre'))+' <a class="u-c-orange" href="mailto:hello@montisoro.com?subject='+encodeURIComponent(L('supportSubject'))+'">hello@montisoro.com</a> '+esc(L('helpNeedPost'))+'</p>' +
          '</div>' +
        '</div>' +
        '<div class="drawer-foot">' +
          '<button class="btn btn-ghost" data-help-close><i class="ti ti-x"></i>'+esc(L('close'))+'</button>' +
          '<a href="mailto:hello@montisoro.com?subject='+encodeURIComponent(L('supportSubject'))+'" class="btn btn-primary u-ml-auto"><i class="ti ti-mail"></i>'+esc(L('contactSupport'))+'</a>' +
        '</div>';
      window.Admin.openDrawer(html);
      $$('[data-help-close]').forEach(function(b){ b.addEventListener('click', window.Admin.closeDrawer); });
    }
    function tipCard(icon, title, body){
      return '<div class="pr-item">' +
        '<div class="pr-item-ico"><i class="ti ti-'+esc(icon)+'"></i></div>' +
        '<div class="u-minw0"><div class="pr-item-name">'+esc(title)+'</div><div class="pr-item-desc">'+esc(body)+'</div></div>' +
      '</div>';
    }

    // ═════════════════════════════ 3. LANG SWITCH ══════════════
    // Handled centrally by admin.js + MONTISORO_ADMIN_I18N (single source of truth).
    // This legacy block is intentionally inert to avoid a double-wired button / double popover.
    var langBtn = null;
    if (langBtn){
      langBtn.setAttribute('data-tb-toggle','lang');
      langBtn.innerHTML = '<i class="ti ti-language"></i><span data-lang-label>'+DATA.adminLang.toUpperCase()+'</span>';
      var langPop = makePop(langBtn,
        '<div class="lang-menu">' +
          '<div class="tb-pop-head"><h4>'+esc(L('adminLang'))+'</h4></div>' +
          '<div class="tb-pop-body">' +
            '<div class="lang-opt '+(DATA.adminLang==='nl'?'active':'')+'" data-lang="nl"><i class="ti ti-flag"></i>Nederlands<span class="pr-item-meta">NL</span></div>' +
            '<div class="lang-opt '+(DATA.adminLang==='en'?'active':'')+'" data-lang="en"><i class="ti ti-flag"></i>English<span class="pr-item-meta">EN</span></div>' +
          '</div>' +
        '</div>'
      );
      langBtn.addEventListener('click', function(e){
        e.stopPropagation();
        var open = langPop.classList.contains('is-open');
        closeAllPops();
        if (!open) langPop.classList.add('is-open');
      });
      langPop.querySelectorAll('[data-lang]').forEach(function(el){
        el.addEventListener('click', function(){
          DATA.adminLang = el.dataset.lang;
          window.AdminData.save(DATA);
          window.Admin.showToast(el.dataset.lang === 'en' ? 'Admin language: English' : 'Admin-taal: Nederlands');
          langBtn.querySelector('[data-lang-label]').textContent = DATA.adminLang.toUpperCase();
          closeAllPops();
        });
      });
    }

    // ═════════════════════════════ 4. USER MENU ═════════════════
    var userBtn = $('.topbar-user');
    if (userBtn){
      userBtn.setAttribute('data-tb-toggle','user');
      userBtn.style.cursor = 'pointer';
      var s = DATA.session || {};
      var email = s.email || 'hello@montisoro.com';
      var name = email.split('@')[0].split('.').map(function(p){return p.charAt(0).toUpperCase()+p.slice(1);}).join(' ');
      var userPop = makePop(userBtn,
        '<div class="user-menu">' +
          '<div class="user-menu-head"><div class="av">'+esc(name.charAt(0))+'</div><div><div class="n">'+esc(name)+'</div><div class="e">'+esc(email)+'</div></div></div>' +
          '<div class="user-menu-item" data-um="profile"><i class="ti ti-user"></i>'+esc(L('profile'))+'</div>' +
          '<div class="user-menu-item" data-um="settings"><i class="ti ti-settings"></i>'+esc(L('settings'))+'</div>' +
          '<div class="user-menu-item" data-um="activity"><i class="ti ti-history"></i>'+esc(L('activityLog'))+'</div>' +
          '<div class="user-menu-item danger" data-um="logout"><i class="ti ti-logout"></i>'+esc(L('logout'))+'</div>' +
        '</div>'
      );
      userBtn.addEventListener('click', function(e){
        e.stopPropagation();
        var open = userPop.classList.contains('is-open');
        closeAllPops();
        if (!open) userPop.classList.add('is-open');
      });
      userPop.querySelectorAll('[data-um]').forEach(function(el){
        el.addEventListener('click', function(){
          var act = el.dataset.um;
          closeAllPops();
          if (act === 'settings') window.Admin.showView('settings');
          else if (act === 'activity') window.Admin.showView('activitylog');
          else if (act === 'profile') {
            window.Admin.showView('team');
            window.Admin.showToast(L('profileToast'));
          }
          else if (act === 'logout') {
            if (confirm(L('logoutConfirm'))) {
              sessionStorage.removeItem('admin.session');
              location.replace('admin-login.html');
            }
          }
        });
      });
    }

    // ═════════════════════════════ 5. ACTIVITY LOG ═════════════
    // Inject sidebar item
    var beheerSection = $$('.sidebar-section').filter(function(s){return s.textContent.trim()==='Beheer';})[0];
    if (beheerSection && !$('.nav-item[data-view="activitylog"]')){
      var logNav = document.createElement('div');
      logNav.className = 'nav-item';
      logNav.dataset.view = 'activitylog';
      logNav.innerHTML = '<i class="ti ti-history"></i><span class="label" data-i18n="pal_nav">'+esc(L('activityLog'))+'</span>';
      logNav.addEventListener('click', function(){ window.Admin.showView('activitylog'); });
      var teamNav = $('.nav-item[data-view="team"]');
      if (teamNav) teamNav.parentElement.insertBefore(logNav, teamNav);
    }

    // Inject view
    var main = $('.main');
    if (main && !$('#view-activitylog')){
      var view = document.createElement('section');
      view.className = 'view';
      view.id = 'view-activitylog';
      view.innerHTML =
        '<div class="page-head">' +
          '<div>' +
            '<div class="eyebrow" data-i18n="pal_eyebrow">'+esc(L('activityLog'))+'</div>' +
            '<h1 data-i18n-html="pal_h1">Wat is er <em>gewijzigd</em>?</h1>' +
            '<p data-i18n="pal_p">Een audit-trail van alle wijzigingen in de admin. Wie deed wat, wanneer. GDPR-conform bewaard.</p>' +
          '</div>' +
          '<div class="page-head-actions">' +
            '<button class="btn btn-ghost" data-export-log><i class="ti ti-download"></i><span data-i18n="pal_export">Export CSV</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-body is-flush">' +
            '<div class="log-row head"><span data-i18n="pal_th_when">Wanneer</span><span data-i18n="pal_th_who">Wie</span><span data-i18n="pal_th_action">Actie</span><span data-i18n="pal_th_target">Doel</span><span data-i18n="pal_th_type">Type</span></div>' +
            '<div id="log-body"></div>' +
          '</div>' +
        '</div>';
      main.appendChild(view);
    }

    window.init_activitylog = function(){
      var body = $('#log-body'); if (!body) return;
      body.innerHTML = DATA.activityLog.map(function(l){
        var initial = l.who.charAt(0).toUpperCase();
        var bg = l.who === 'Systeem' ? 'background:rgba(29,29,31,0.10);color:var(--a-muted);' : '';
        return '<div class="log-row">' +
          '<span class="ts">'+esc(l.ts)+'</span>' +
          '<span class="who-pill"><span class="av" style="'+bg+'">'+esc(initial)+'</span>'+esc(l.who)+'</span>' +
          '<span>'+esc(l.what)+'</span>' +
          '<span class="u-c-muted">'+esc(l.target)+'</span>' +
          '<span><span class="tg '+esc(l.type)+'">'+esc(l.type)+'</span></span>' +
        '</div>';
      }).join('');
      var exp = $('[data-export-log]');
      if (exp) exp.onclick = function(){ exportCSV('activity-log', DATA.activityLog, ['ts','who','what','target','type']); };
    };

    // ═════════════════════════════ 6. EXPORT CENTER ═════════════
    function exportCSV(filename, rows, cols){
      if (!rows.length){ window.Admin.showToast(L('nothingExport')); return; }
      cols = cols || Object.keys(rows[0]);
      var header = cols.join(',');
      var lines = rows.map(function(r){
        return cols.map(function(c){
          var v = r[c] == null ? '' : String(r[c]);
          if (v.indexOf(',') !== -1 || v.indexOf('"') !== -1 || v.indexOf('\n') !== -1) v = '"' + v.replace(/"/g,'""') + '"';
          return v;
        }).join(',');
      });
      var csv = [header].concat(lines).join('\n');
      var blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename + '-' + new Date().toISOString().slice(0,10) + '.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      window.Admin.showToast(L('csvDownloaded'));
    }
    window.AdminPro = { exportCSV: exportCSV };

    // Wire export buttons that already exist (Leads page CSV button)
    var leadsExportBtn = $$('.page-head-actions .btn-ghost').filter(function(b){return /CSV/.test(b.textContent);})[0];
    if (leadsExportBtn) leadsExportBtn.onclick = function(){
      exportCSV('leads', DATA.leads, ['ts','name','org','email','phone','stage','source','value','notes']);
    };

    // Add export buttons to Analytics page
    var analyticsView = $('#view-analytics .page-head');
    if (analyticsView && !analyticsView.querySelector('[data-export-an]')){
      var actions = analyticsView.querySelector('.page-head-actions');
      if (!actions){
        actions = document.createElement('div');
        actions.className = 'page-head-actions';
        analyticsView.appendChild(actions);
      }
      actions.innerHTML =
        '<button class="btn btn-ghost" data-export-an="calc"><i class="ti ti-download"></i><span data-i18n="pal_export_calc">Calculator CSV</span></button>' +
        '<button class="btn btn-ghost" data-export-an="fit"><i class="ti ti-download"></i><span data-i18n="pal_export_fit">Fit check CSV</span></button>';
      $('[data-export-an="calc"]').onclick = function(){ exportCSV('calculator-submissions', DATA.submissions.calculator, ['ts','email','cost','fte','salary']); };
      $('[data-export-an="fit"]').onclick = function(){ exportCSV('fit-check-submissions', DATA.submissions.fitcheck, ['ts','email','route','maturity','scale']); };
    }

    // Wire forms page CSV export
    var formsView = $('#view-forms .page-head');
    if (formsView && !formsView.querySelector('[data-export-forms]')){
      var fActions = formsView.querySelector('.page-head-actions');
      if (!fActions){
        fActions = document.createElement('div');
        fActions.className = 'page-head-actions';
        formsView.appendChild(fActions);
      }
      fActions.innerHTML = '<button class="btn btn-ghost" data-export-forms><i class="ti ti-download"></i><span data-i18n="pal_export_allforms">Alle inzendingen CSV</span></button>';
      $('[data-export-forms]').onclick = function(){
        var all = [];
        DATA.submissions.contact.forEach(function(r){ all.push({type:'diagnosegesprek', ts:r.ts, email:r.email, name:r.name, detail:r.date+' '+r.time+' · '+r.loc}); });
        DATA.submissions.casey.forEach(function(r){ all.push({type:'casey-waitlist', ts:r.ts, email:r.email, name:'', detail:''}); });
        DATA.submissions.calculator.forEach(function(r){ all.push({type:'roi-calculator', ts:r.ts, email:r.email, name:'', detail:r.cost+' · '+r.fte+' FTE'}); });
        DATA.submissions.fitcheck.forEach(function(r){ all.push({type:'fit-check', ts:r.ts, email:r.email, name:'', detail:r.route}); });
        exportCSV('all-form-submissions', all, ['type','ts','email','name','detail']);
      };
    }

    // Translate everything admin-pro just injected into the DOM (nav, activity view, export buttons)
    if (window.MONTISORO_ADMIN_I18N) window.MONTISORO_ADMIN_I18N.apply(document);

  });
})();
