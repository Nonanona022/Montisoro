/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — runtime
═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // ── Auth gate (incl. server-token-expiry) ────────────────────
  //  ⚠️ Client-side, defense-in-depth — GEEN volwaardige beveiliging. De echte
  //     poort staat server-side: Cloudflare Access vóór /admin-panel + tokenvalidatie
  //     op elke /api/*-call. Deze gate voorkomt dat (a) de shell laadt zonder geldige
  //     sessie en dat (b) iemand met een zelf-geïnjecteerde demo-sessie binnenkomt op
  //     een publiek bereikbare host. Een DEMO-sessie wordt UITSLUITEND op een lokale
  //     loopback-machine aanvaard; op elke publieke host telt enkel een server-
  //     uitgegeven sessie (mode:'server' + token + geldige exp). Zo komt de rol
  //     (s.role) op een publieke host uit een server-ondertekend token en is die niet
  //     zelf toe te kennen (koppelt mee aan audit P3).
  var AUTH = (function(){
    var VALID_ROLES = { admin:1, consultant:1, sales:1, viewer:1 };
    var h = location.hostname;
    var LOOPBACK = (h==='localhost'||h==='127.0.0.1'||h==='[::1]'||h==='::1'||h==='');
    var DEV = (window.ADMIN_DEV_LOGIN === true) || (window.ADMIN_DEV_LOGIN !== false && LOOPBACK);
    function read(){ try { return JSON.parse(sessionStorage.getItem('admin.session') || 'null'); } catch(e){ return null; } }
    function invalidReason(s){
      if (!s || typeof s !== 'object')      return 'nosession';
      if (!s.email || !VALID_ROLES[s.role]) return 'malformed';
      if (s.exp && Date.now() > s.exp)      return 'expired';
      if (!DEV) {                            // publieke host → server-sessie verplicht
        if (s.mode !== 'server' || !s.token) return 'notserver';
        if (!s.exp)                          return 'notoken';
      }
      return null; // geldig
    }
    return { read:read, invalidReason:invalidReason, DEV:DEV };
  })();
  window.AdminAuth = AUTH;
  var _authBad = AUTH.invalidReason(AUTH.read());
  if (_authBad) {
    try { sessionStorage.removeItem('admin.session'); } catch(e){}
    var _q = (_authBad === 'expired') ? '?expired=1'
           : (_authBad === 'notserver' || _authBad === 'notoken') ? '?auth=1' : '';
    location.replace('admin-login.html' + _q);
    return;
  }
  // Sessie-integriteit herbewaken wanneer het tabblad weer focus krijgt
  // (verlopen/gewist token → terug naar login zonder handmatige refresh).
  document.addEventListener('visibilitychange', function(){
    if (document.visibilityState !== 'visible') return;
    if (AUTH.invalidReason(AUTH.read())) location.replace('admin-login.html?expired=1');
  });

  var DATA = window.AdminData.load();

  // ── Helpers ──────────────────────────────────────────────────
  function $(s, r){return (r||document).querySelector(s);}
  function $$(s, r){return Array.from((r||document).querySelectorAll(s));}
  function esc(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML;}
  function fmt(n){return new Intl.NumberFormat('nl-BE').format(n);}
  function eur(n){return '€' + fmt(n);}
  function debounce(fn,ms){var t;return function(){var a=arguments,c=this;clearTimeout(t);t=setTimeout(function(){fn.apply(c,a);},ms);};}

  // ── i18n shorthand (single source of truth: MONTISORO_ADMIN_I18N) ──
  function T(key, fallback){ return (window.MONTISORO_ADMIN_I18N) ? window.MONTISORO_ADMIN_I18N.t(key) : (fallback!=null?fallback:key); }
  function stageLabel(key){ return T('dyn_stage_'+key, key); }
  function aLang(){ try { return (window.MONTISORO_ADMIN_I18N && window.MONTISORO_ADMIN_I18N.getLang && window.MONTISORO_ADMIN_I18N.getLang()) || 'nl'; } catch(e){ return 'nl'; } }
  function TT(nl, en){ return aLang()==='en' ? en : nl; }
  var SOURCE_KEYS = { 'fit-check':'dyn_src_fitcheck','contact':'dyn_src_contact','calculator':'dyn_src_calculator','casey-waitlist':'dyn_src_casey','referral':'dyn_src_referral' };
  function sourceLabel(key){ return SOURCE_KEYS[key] ? T(SOURCE_KEYS[key]) : (SOURCES[key]||key); }

  // ── Sidebar / nav ────────────────────────────────────────────
  var app = $('.app');
  var navItems = $$('.nav-item');
  var views = $$('.view');

  var viewHistory = [];
  var currentView = null;
  function showView(id, isBack){
    if (!isBack && currentView && currentView !== id) viewHistory.push(currentView);
    currentView = id;
    $$('.view').forEach(function(v){ v.classList.toggle('is-active', v.id === 'view-' + id); });
    navItems.forEach(function(n){ n.classList.toggle('is-active', n.dataset.view === id); });
    if (location.hash !== '#'+id) history.replaceState(null,'','#'+id);
    if (app.classList.contains('is-mobile-open')) app.classList.remove('is-mobile-open');
    var bb = document.getElementById('admin-back-btn');
    if (bb) bb.style.display = viewHistory.length ? 'inline-flex' : 'none';
    // Per-view init
    var initFn = window['init_'+id];
    if (typeof initFn === 'function') initFn();
    applyRoleGate(id); setTimeout(function(){ applyRoleGate(id); }, 180); // Audit P3 — rol-gate (defense-in-depth; server blijft de echte gate)
  }
  // Audit P3 — toon read-only banner + vergrendel primaire (muterende) knoppen op views
  // die de huidige rol niet mag bewerken. Puur UI-afscherming; de echte afdwinging is server-side.
  var VIEW_CAP = {
    leads:'leads:edit', forms:'forms:edit', content:'content:edit', siteteam:'content:edit',
    trustedby:'content:edit', testimonials:'content:edit', cases:'content:edit', faq:'content:edit',
    seo:'content:edit', microcopy:'content:edit', emailtemplates:'content:edit', languages:'content:edit',
    bookings:'agenda:edit', onboarding:'onboarding:edit', gdpr:'gdpr:edit',
    team:'__admin', calcparams:'calc_params:edit', settings:'__admin', bookingschedule:'__admin', featureflags:'__admin'
  };
  function applyRoleGate(id){
    if (!window.AdminRoles || !window.AdminRoles.can) return;
    var cap = VIEW_CAP[id]; if (!cap) return;
    var isAdmin = !!(window.AdminRoles.role && window.AdminRoles.role()==='admin');
    var can = (cap==='__admin') ? isAdmin : window.AdminRoles.can(cap);
    var view = document.getElementById('view-'+id); if (!view) return;
    var existing = view.querySelector('.ro-banner-auto');
    if (can){
      if (existing) existing.remove();
      view.querySelectorAll('.btn-primary[data-rgate]').forEach(function(b){ b.removeAttribute('disabled'); b.style.opacity=''; b.style.pointerEvents=''; b.removeAttribute('data-rgate'); });
      return;
    }
    if (!existing){
      var w = document.createElement('div'); w.className = 'ro-banner-auto';
      w.innerHTML = window.AdminRoles.readonlyBanner(aLang()==='en'?'Read-only \u2014 your role has no edit rights on this screen.':'Alleen-lezen \u2014 uw rol heeft geen bewerkrechten op dit scherm.');
      view.insertAdjacentElement('afterbegin', w);
    }
    view.querySelectorAll('.btn-primary').forEach(function(b){ if(!b.hasAttribute('data-rgate')){ b.setAttribute('data-rgate','1'); b.setAttribute('disabled','disabled'); b.style.opacity='.5'; b.style.pointerEvents='none'; } });
  }
  // Audit P3 — trigger de rol-gate ongeacht welke showView-implementatie de view wisselt
  //  (admin-final.js overschrijft window.Admin.showView; een observer is daarvoor immuun).
  (function(){
    var _main = document.querySelector('.main') || document.body;
    if (!window.MutationObserver || !_main) return;
    new MutationObserver(function(muts){
      for (var i=0;i<muts.length;i++){
        var t = muts[i].target;
        if (t && t.classList && t.classList.contains('view') && t.classList.contains('is-active') && t.id){
          applyRoleGate(t.id.replace(/^view-/,''));
        }
      }
    }).observe(_main, { subtree:true, attributes:true, attributeFilter:['class'] });
  })();

  // ── Audit P13 — klik-divs toetsenbord-bereikbaar maken (Enter/Space + focus) ──
  function kbdActivable(el, label){
    if (!el || el.dataset.kbd) return;
    el.dataset.kbd = '1';
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    if (!el.getAttribute('role')) el.setAttribute('role','button');
    if (label && !el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
  }
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var el = document.activeElement;
    if (!el || el.getAttribute('data-kbd') !== '1') return;
    var tag = el.tagName;
    if (tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||tag==='BUTTON'||tag==='A') return;
    e.preventDefault(); el.click();
  });

  navItems.forEach(function(n){
    kbdActivable(n);
    n.addEventListener('click', function(){ showView(n.dataset.view); });
  });

  // ── Audit P11 — 'Preview'-badge op modules waarvan de backend nog niet live is ──
  ['pdfmanagement','emaillog'].forEach(function(v){
    var pn = document.querySelector('.nav-item[data-view="'+v+'"]');
    if (pn && !pn.querySelector('.nav-preview')){
      var pb = document.createElement('span'); pb.className = 'nav-preview'; pb.textContent = 'Preview'; pn.appendChild(pb);
    }
  });

  // ── Terug-knop in de topbar (links, naast het logo) ──
  (function(){
    var bb = document.createElement('button');
    bb.id = 'admin-back-btn';
    bb.type = 'button';
    bb.innerHTML = '<i class="ti ti-arrow-left"></i> Terug';
    bb.style.cssText = 'display:none;align-items:center;gap:6px;background:rgba(29,29,31,.06);border:1px solid var(--a-div,rgba(29,29,31,.16));color:var(--a-off,#D8D3CC);border-radius:100px;padding:7px 16px;margin-right:14px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;';
    bb.addEventListener('click', function(){ var prev = viewHistory.pop(); if (prev) showView(prev, true); });
    var tb = document.querySelector('.topbar');
    var brand = tb && tb.querySelector('.topbar-brand');
    if (brand && brand.parentNode) brand.parentNode.insertBefore(bb, brand.nextSibling);
    else if (tb) tb.insertBefore(bb, tb.firstChild);
    else document.body.appendChild(bb);
  })();

  // ── KPI-kaarten klikbaar → navigeer naar het bijhorende scherm ──
  $$('.kpi-card[data-jump]').forEach(function(c){
    var t = c.getAttribute('data-jump');
    if (!navItems.some(function(n){ return n.dataset.view === t; })) { c.removeAttribute('data-jump'); return; }
    c.style.cursor = 'pointer';
    kbdActivable(c);
    c.addEventListener('click', function(){ showView(t); });
  });

  // Deeplink support: hash may be "#forms?submission=<id>" (internal-mail dashboard link).
  var rawHash = (location.hash || '#overview').replace(/^#/, '');
  var deeplinkSubmission = (function(){ var m = rawHash.match(/submission=([^&]+)/); return m ? decodeURIComponent(m[1]) : null; })();
  var initialView = rawHash.split('?')[0] || 'overview';
  if (!navItems.some(function(n){return n.dataset.view===initialView;})) initialView = 'overview';
  showView(initialView);
  function tryOpenDeeplink(){
    if (!deeplinkSubmission || initialView !== 'forms') return;
    if (window.Admin && typeof window.Admin.openCalcDrawer === 'function') window.Admin.openCalcDrawer(deeplinkSubmission);
  }
  tryOpenDeeplink();

  // Sidebar collapse
  $('.sidebar-collapse')?.addEventListener('click', function(){
    app.classList.toggle('is-collapsed');
    localStorage.setItem('admin.sidebar.collapsed', app.classList.contains('is-collapsed') ? '1' : '0');
  });
  if (localStorage.getItem('admin.sidebar.collapsed') === '1') app.classList.add('is-collapsed');

  // Mobile menu
  $('.topbar-mobile')?.addEventListener('click', function(){ app.classList.toggle('is-mobile-open'); });

  // ── Drawer ───────────────────────────────────────────────────
  var drawer = $('#drawer');
  var drawerBackdrop = $('#drawer-backdrop');
  function openDrawer(html){
    drawer.innerHTML = html;
    drawer.classList.add('is-open');
    drawerBackdrop.classList.add('is-open');
    drawer.querySelector('[data-close]')?.addEventListener('click', closeDrawer);
  }
  function closeDrawer(){
    drawer.classList.remove('is-open');
    drawerBackdrop.classList.remove('is-open');
  }
  drawerBackdrop?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function(e){ if (e.key==='Escape') closeDrawer(); });

  // ── Toast ────────────────────────────────────────────────────
  var toast = $('#toast');
  var toastTimer;
  // Audit P25 — gestapelde toasts: elke melding is een eigen item met eigen timer.
  function _pushToast(html, opts){
    opts = opts || {};
    if (!toast) return null;
    var item = document.createElement('div');
    item.className = 'toast-item';
    item.innerHTML = html;
    toast.appendChild(item);
    while (toast.children.length > 4) toast.removeChild(toast.firstChild);
    requestAnimationFrame(function(){ item.classList.add('is-shown'); });
    var timer = setTimeout(dismiss, opts.duration || 2800);
    function dismiss(){ clearTimeout(timer); item.classList.remove('is-shown'); setTimeout(function(){ if(item.parentNode) item.parentNode.removeChild(item); }, 260); }
    if (opts.onUndo){
      var b = item.querySelector('.toast-undo');
      if (b) b.addEventListener('click', function(){ dismiss(); try{ opts.onUndo(); }catch(e){} });
    }
    return item;
  }
  function showToast(msg, icon){
    _pushToast('<i class="ti ti-' + (icon || 'check') + '"></i><span>' + esc(msg) + '</span>');
  }

  $('#btn-activitylog')?.addEventListener('click', function(){
    showView('activity');
  });

  // ── Logout ───────────────────────────────────────────────────
  function doLogout(){
    if (confirm('Zeker dat u wilt uitloggen?')){
      logActivity('Uitloggen op admin','logout');
      sessionStorage.removeItem('admin.session');
      location.replace('admin-login.html');
    }
  }
  $('[data-logout]')?.addEventListener('click', doLogout);

  // ── Idle auto-logout (30 min) — wist sessie + gevoelige CRM-cache ──
  //    Beschermt een onbeheerd, ingelogd scherm (gedeeld/gestolen toestel).
  //    Activiteit reset de timer; bij time-out → login-scherm (dat de
  //    localStorage-cache ook leegt). Belt-and-suspenders: hier ook al wissen.
  (function(){
    var IDLE_MS = 30 * 60 * 1000, t;
    function purgeData(){
      try { Object.keys(localStorage).forEach(function(k){ if (k.indexOf('montisoro.admin.data.') === 0) localStorage.removeItem(k); }); } catch(e){}
    }
    function onTimeout(){
      purgeData();
      try { sessionStorage.removeItem('admin.session'); } catch(e){}
      location.replace('admin-login.html');
    }
    function reset(){ clearTimeout(t); t = setTimeout(onTimeout, IDLE_MS); }
    ['click','keydown','mousemove','scroll','touchstart'].forEach(function(ev){
      document.addEventListener(ev, reset, { passive:true });
    });
    reset();
  })();

  // ── Activity log helper ──────────────────────────────────────
  DATA.activity_log = DATA.activity_log || [];
  function logActivity(what, icon){
    var sess = JSON.parse(sessionStorage.getItem('admin.session') || '{}');
    var who = (sess.email || 'onbekend').split('@')[0];
    who = who.charAt(0).toUpperCase() + who.slice(1);
    DATA.activity_log.unshift({
      id:'a-'+Date.now(), who:who, what:what, ts:new Date().toISOString().replace('T',' ').slice(0,16),
      icon:icon||'circle'
    });
    if (DATA.activity_log.length > 200) DATA.activity_log = DATA.activity_log.slice(0,200);
    window.AdminData.save(DATA);
    /* 2c: schrijf ook naar de onverliesbare Supabase audit-trail (best-effort) */
    try{
      if (sess && sess.token) {
        fetch('/api/admin-audit', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ token: sess.token, action:'add', what: what, icon: icon||'circle' }) }).catch(function(){});
      }
    }catch(e){}
  }
  window.Admin = window.Admin || {};
  window.Admin.logActivity = logActivity;

  // ── Popover helpers ──────────────────────────────────────────
  var openPop = null;
  function togglePop(id, builder){
    var el = $('#'+id);
    if (!el) return;
    if (openPop === el){ el.classList.remove('is-open'); openPop = null; return; }
    if (openPop) openPop.classList.remove('is-open');
    if (builder) builder(el);
    el.classList.add('is-open');
    openPop = el;
  }
  document.addEventListener('click', function(e){
    if (!openPop) return;
    if (e.target.closest('.popover')) return;
    if (e.target.closest('#btn-notif, #btn-help, #btn-lang, #btn-user')) return;
    openPop.classList.remove('is-open');
    openPop = null;
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && openPop){ openPop.classList.remove('is-open'); openPop = null; }
  });

  // ── Notifications dropdown (handled by admin-pro.js) ─────────
  DATA.notifications_inbox = DATA.notifications_inbox || [];
  // (no-op: bell/help/lang/user popovers are wired in admin-pro.js)
  function unreadCount(){ return DATA.notifications_inbox.filter(function(n){return !n.read;}).length; }
  function updateNotifDot(){ /* handled by admin-pro.js */ }
  updateNotifDot();

  // (legacy popover handler removed — admin-pro.js owns this)

  // ── Activity log view ───────────────────────────────────────
  window.init_activity = function(){
    var feed = $('#activity-feed');
    function paint(items){
      feed.innerHTML = items.length ? items.map(function(a){
        return '<div class="feed-item">' +
          '<div class="feed-icon"><i class="ti ti-' + (a.icon||'circle') + '"></i></div>' +
          '<div class="feed-meta"><div class="feed-title"><b>' + esc(a.who) + '</b> · ' + esc(a.what) + '</div><div class="feed-sub">' + esc(a.ts) + '</div></div>' +
          '<div class="feed-time">' + esc(timeAgo(a.ts)) + '</div>' +
        '</div>';
      }).join('') : '<div class="empty"><div class="ico"><i class="ti ti-history"></i></div><h4>Nog geen activiteit</h4><p>Hier verschijnt elke wijziging die admins maken.</p></div>';
    }
    var items = (DATA.activity_log || []).slice(0,100);
    paint(items);
    /* 2c: laad de gedeelde, onverliesbare audit-trail uit Supabase indien beschikbaar */
    try{
      var sess = JSON.parse(sessionStorage.getItem('admin.session') || '{}');
      if (sess && sess.token) {
        fetch('/api/admin-audit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token: sess.token, action:'list', limit:100 }) })
          .then(function(r){ return r.ok ? r.json() : null; })
          .then(function(out){
            if (!out || !out.ok || !Array.isArray(out.log) || !out.log.length) return;
            items = out.log.map(function(r){ return { who:(r.actor||'admin').split('@')[0], what:r.action, ts:String(r.created_at||'').replace('T',' ').slice(0,16), icon:r.icon||'circle' }; });
            paint(items);
          }).catch(function(){});
      }
    }catch(e){}

    $('#activity-export')?.addEventListener('click', function(){
      var csv = 'Wie,Wat,Wanneer\n' + items.map(function(a){
        return '"'+a.who+'","'+a.what.replace(/"/g,'""')+'","'+a.ts+'"';
      }).join('\n');
      var blob = new Blob([csv],{type:'text/csv'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'montisoro-activity-' + new Date().toISOString().slice(0,10) + '.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Activity log geëxporteerd');
    });
  };

  // ── Notifications popover ──────────────────────────────────
  // ── Notifications popover — eigenaar = admin-pro.js (dubbele handler verwijderd) ──
  // (admin-pro.js wired #btn-notif al; deze legacy-handler las een andere array
  //  (notifications_inbox) en veroorzaakte het "blijft ongelezen"-conflict.)
  if (false) $('#btn-notif')?.addEventListener('click', function(e){
    e.stopPropagation();
    togglePop('pop-notif', function(el){
      var items = DATA.notifications_inbox.slice(0,10);
      el.innerHTML =
        '<div class="pop-head"><h4>Notificaties</h4><span class="small">' + unreadCount() + ' nieuw</span></div>' +
        '<div class="pop-body">' +
          (items.length ? items.map(function(n){
            return '<div class="pop-item' + (n.read?'':' is-unread') + '" data-notif-id="' + n.id + '" data-view="' + n.view + '">' +
              '<div class="ico"><i class="ti ti-' + n.icon + '"></i></div>' +
              '<div class="body"><div class="t">' + esc(n.title) + '</div><div class="s">' + esc(n.sub) + '</div></div>' +
              '<div class="ts">' + esc(timeAgo(n.ts)) + '</div>' +
            '</div>';
          }).join('') : '<div class="pop-empty">Geen notificaties. Hier verschijnt alles wat via de website binnenkomt.</div>') +
        '</div>' +
        '<div class="pop-foot"><a data-mark-read>Markeer alles als gelezen</a><a data-go-forms>Naar formulieren →</a></div>';

      el.querySelectorAll('[data-notif-id]').forEach(function(it){
        it.addEventListener('click', function(){
          var n = DATA.notifications_inbox.find(function(x){return x.id===it.dataset.notifId;});
          if (n){ n.read = true; window.AdminData.save(DATA); updateNotifDot(); }
          openPop && openPop.classList.remove('is-open');
          openPop = null;
          if (it.dataset.view) showView(it.dataset.view);
        });
      });
      el.querySelector('[data-mark-read]')?.addEventListener('click', function(){
        DATA.notifications_inbox.forEach(function(n){n.read=true;});
        window.AdminData.save(DATA);
        updateNotifDot();
        openPop && openPop.classList.remove('is-open');
        openPop = null;
        showToast('Alle notificaties gemarkeerd als gelezen');
      });
      el.querySelector('[data-go-forms]')?.addEventListener('click', function(){
        openPop && openPop.classList.remove('is-open');
        openPop = null;
        showView('forms');
      });
    });
  });

  // ── Help dropdown ────────────────────────────────────────────
  $('#btn-help')?.addEventListener('click', function(e){
    e.stopPropagation();
    togglePop('pop-help', function(el){
      el.innerHTML =
        '<div class="pop-head"><h4>Hulp & shortcuts</h4></div>' +
        '<div class="pop-body">' +
          '<div class="help-section">' +
            '<h5>Sneltoetsen</h5>' +
            '<div class="help-kbd"><span>Zoek</span><span><kbd>⌘</kbd><kbd>K</kbd></span></div>' +
            '<div class="help-kbd"><span>Sluit drawer/popup</span><span><kbd>Esc</kbd></span></div>' +
            '<div class="help-kbd"><span>Navigeer zoekresultaten</span><span><kbd>↑</kbd><kbd>↓</kbd></span></div>' +
          '</div>' +
          '<div class="help-section">' +
            '<h5>Snel naar</h5>' +
            '<div class="pop-row" data-help-view="overview"><i class="ti ti-layout-dashboard"></i>Overzicht</div>' +
            '<div class="pop-row" data-help-view="leads"><i class="ti ti-users"></i>Leads pipeline</div>' +
            '<div class="pop-row" data-help-view="forms"><i class="ti ti-mail"></i>Formulier inzendingen</div>' +
            '<div class="pop-row" data-help-view="settings"><i class="ti ti-settings"></i>Instellingen</div>' +
          '</div>' +
          '<div class="help-section">' +
            '<h5>Contact support</h5>' +
            '<a href="mailto:support@montisoro.com?subject=Admin%20support" class="pop-row"><i class="ti ti-mail-fast"></i>support@montisoro.com</a>' +
          '</div>' +
        '</div>';
      el.querySelectorAll('[data-help-view]').forEach(function(r){
        r.addEventListener('click', function(){
          openPop && openPop.classList.remove('is-open');
          openPop = null;
          showView(r.dataset.helpView);
        });
      });
    });
  });

  // ── Language switcher (single source of truth: MONTISORO_ADMIN_I18N) ──
  var I18N = window.MONTISORO_ADMIN_I18N || null;
  DATA.profile = DATA.profile || { ui_lang:'nl' };
  function curLang(){ return I18N ? I18N.getLang() : (DATA.profile.ui_lang || 'nl'); }
  function applyUILang(){
    var lbl = $('#lang-label'); if (lbl) lbl.textContent = curLang().toUpperCase();
  }
  function setUILang(lang){
    lang = (lang === 'en') ? 'en' : 'nl';
    if (I18N) I18N.setLang(lang);            // persists + sets <html lang> + swaps every [data-i18n*]
    DATA.profile.ui_lang = lang;
    DATA.adminLang = lang;                   // keep admin-pro.js dynamic strings (notifs/help) in sync
    window.AdminData.save(DATA);
    applyUILang();
    showToast('Admin taal · ' + (lang==='nl'?'Nederlands':'English'));
  }
  // On load: adopt the persisted i18n language as canonical, sync DATA, translate static chrome.
  (function initLang(){
    var lang = curLang();
    DATA.profile.ui_lang = lang;
    DATA.adminLang = lang;
    document.documentElement.setAttribute('lang', lang);
    if (I18N) I18N.apply(document);
    applyUILang();
  })();
  $('#btn-lang')?.addEventListener('click', function(e){
    e.stopPropagation();
    togglePop('pop-lang', function(el){
      var cur = curLang();
      el.innerHTML =
        '<div class="pop-head"><h4>' + (I18N ? I18N.t('tb_lang') : 'Admin taal') + '</h4></div>' +
        '<div class="lang-opt' + (cur==='nl'?' is-active':'') + '" data-lang="nl"><span><span class="flag">🇧🇪</span>&nbsp;&nbsp;Nederlands</span>' + (cur==='nl'?'<i class="ti ti-check"></i>':'') + '</div>' +
        '<div class="lang-opt' + (cur==='en'?' is-active':'') + '" data-lang="en"><span><span class="flag">🇬🇧</span>&nbsp;&nbsp;English</span>' + (cur==='en'?'<i class="ti ti-check"></i>':'') + '</div>';
      el.querySelectorAll('[data-lang]').forEach(function(r){
        r.addEventListener('click', function(){
          setUILang(r.dataset.lang);
          openPop && openPop.classList.remove('is-open');
          openPop = null;
        });
      });
    });
  });

  // ── User menu ────────────────────────────────────────────────
  (function initUser(){
    var sess = JSON.parse(sessionStorage.getItem('admin.session') || '{}');
    var u = DATA.team.find(function(x){return x.email===sess.email;}) || DATA.team[0];
    if (u){
      $('#user-name').textContent = u.name.split(' ')[0];
      $('#user-role').textContent = u.role;
      $('#user-avatar').textContent = u.initial || u.name.charAt(0);
    }
  })();
  $('#btn-user')?.addEventListener('click', function(e){
    e.stopPropagation();
    togglePop('pop-user', function(el){
      var sess = JSON.parse(sessionStorage.getItem('admin.session') || '{}');
      var u = DATA.team.find(function(x){return x.email===sess.email;}) || DATA.team[0];
      el.innerHTML =
        '<div class="pop-head" style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;">' +
          '<h4 style="font-size:14px;">' + esc(u ? u.name : 'Gebruiker') + '</h4>' +
          '<span class="small">' + esc(u ? u.email : '') + ' · ' + esc(u ? u.role : '') + '</span>' +
        '</div>' +
        '<div class="pop-row" data-go="team"><i class="ti ti-user"></i>Mijn profiel & team</div>' +
        '<div class="pop-row" data-go="settings"><i class="ti ti-settings"></i>Instellingen</div>' +
        '<div class="pop-row" data-go="activity"><i class="ti ti-history"></i>Activity log</div>' +
        '<div class="pop-row danger" data-do="logout"><i class="ti ti-logout"></i>Uitloggen</div>';
      el.querySelectorAll('[data-go]').forEach(function(r){
        r.addEventListener('click', function(){
          openPop && openPop.classList.remove('is-open');
          openPop = null;
          showView(r.dataset.go);
        });
      });
      el.querySelector('[data-do="logout"]')?.addEventListener('click', function(){
        openPop && openPop.classList.remove('is-open');
        openPop = null;
        doLogout();
      });
    });
  });

  // ── Search (Cmd/Ctrl+K) ──────────────────────────────────────
  var searchInput = $('#globalSearch');
  var searchResults = $('#searchResults');
  var searchFocusIdx = -1;
  var searchHits = [];

  document.addEventListener('keydown', function(e){
    if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); searchInput?.focus(); searchInput?.select(); }
    if (e.key === 'Escape' && document.activeElement === searchInput) { searchInput.blur(); closeSearch(); }
  });

  function closeSearch(){
    searchResults.classList.remove('is-open');
    searchFocusIdx = -1;
  }

  function highlight(text, q){
    if (!q) return esc(text);
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')','ig');
    return esc(text).replace(re, '<mark style="background:rgba(232,89,43,0.30);color:var(--a-off);padding:0 2px;border-radius:2px;">$1</mark>');
  }

  function runSearch(q){
    q = q.trim().toLowerCase();
    if (q.length < 1) { closeSearch(); return; }
    searchHits = [];

    // Leads
    DATA.leads.forEach(function(l){
      if (l.name.toLowerCase().includes(q) || l.org.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)){
        searchHits.push({ type:'lead', icon:'user', title:l.name, sub:l.org + ' · ' + l.email, tag:l.stage, action:function(){ showView('leads'); setTimeout(function(){ openLeadDrawer(l.id); }, 350); } });
      }
    });
    // Form submissions
    DATA.submissions.calculator.forEach(function(s){
      if (s.email.toLowerCase().includes(q)) searchHits.push({ type:'sub', icon:'report-money', title:s.email, sub:'ROI calculator · ' + s.cost, tag:'rapport', action:function(){ showView('forms'); } });
    });
    DATA.submissions.fitcheck.forEach(function(s){
      if (s.email.toLowerCase().includes(q) || s.route.toLowerCase().includes(q)) searchHits.push({ type:'sub', icon:'compass', title:s.email, sub:'Fit check · ' + s.route, tag:'fit check', action:function(){ showView('forms'); } });
    });
    DATA.submissions.casey.forEach(function(s){
      if (s.email.toLowerCase().includes(q)) searchHits.push({ type:'sub', icon:'sparkles', title:s.email, sub:'Casey waitlist', tag:'waitlist', action:function(){ showView('forms'); } });
    });
    DATA.submissions.contact.forEach(function(s){
      if (s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)) searchHits.push({ type:'sub', icon:'calendar-event', title:s.name, sub:'Diagnosegesprek · ' + s.date + ' · ' + s.time, tag:'gesprek', action:function(){ showView('forms'); } });
    });
    // Admin team
    DATA.team.forEach(function(u){
      if (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)){
        searchHits.push({ type:'team', icon:'user-circle', title:u.name, sub:u.email + ' · ' + u.role, tag:'admin', action:function(){ showView('team'); } });
      }
    });
    // Site team
    (DATA.siteTeam || []).forEach(function(p){
      if (p.name && (p.name.toLowerCase().includes(q) || (p.role_nl || '').toLowerCase().includes(q) || (p.bio_nl || '').toLowerCase().includes(q))){
        searchHits.push({ type:'siteteam', icon:'users-group', title:p.name, sub:p.role_nl, tag:'website team', action:function(){ showView('siteteam'); } });
      }
    });
    // Pages
    DATA.pages.forEach(function(pg, idx){
      var pageMatch = pg.slug.toLowerCase().includes(q);
      // Search in hero title NL+EN
      var heroMatch = ((pg.hero?.title?.nl||'') + ' ' + (pg.hero?.title?.en||'') + ' ' + (pg.hero?.body?.nl||'') + ' ' + (pg.hero?.body?.en||'')).toLowerCase().includes(q);
      if (pageMatch || heroMatch){
        searchHits.push({ type:'page', icon:'file-text', title:pg.slug, sub:'Pagina · NL/EN · ' + pg.nl, tag:'content', action:function(){ showView('content'); setTimeout(function(){ openPageEditor(idx); }, 350); } });
      }
    });

    renderSearch(q);
  }

  function renderSearch(q){
    if (searchHits.length === 0){
      var _en = aLang()==='en';
      // Audit P17 — onderscheid "nog geen data geladen" van een echte lege treffer
      var noData = !window.__leadsBridgeActive && (DATA.leads||[]).length===0 &&
        ['calculator','fitcheck','casey','contact'].every(function(k){ return !((DATA.submissions||{})[k]||[]).length; });
      searchResults.innerHTML = noData
        ? '<div class="sr-empty"><b>' + (_en?'Data is still loading':'Data laadt nog') + '</b>' + (_en?'Search works as soon as leads and submissions have loaded from the server.':'Zoeken werkt zodra leads en inzendingen van de server geladen zijn.') + '</div>'
        : '<div class="sr-empty"><b>' + (_en?'Nothing found for ':'Niets gevonden voor ') + '"<em>' + esc(q) + '</em>"</b>' + (_en?'Try a name, email, organisation or page title.':'Probeer een naam, e-mail, organisatie of pagina-titel.') + '</div>';
      searchResults.classList.add('is-open');
      return;
    }
    var grouped = {};
    var labels = { lead:'Leads', sub:'Formulier-inzendingen', team:'Admin team', siteteam:'Team op website', page:'Pagina\'s' };
    searchHits.forEach(function(h){ grouped[h.type] = grouped[h.type] || []; grouped[h.type].push(h); });

    var html = '';
    ['lead','sub','team','siteteam','page'].forEach(function(type){
      if (!grouped[type]) return;
      html += '<div class="sr-section">' + labels[type] + ' · ' + grouped[type].length + '</div>';
      grouped[type].forEach(function(h){
        var globalIdx = searchHits.indexOf(h);
        html += '<div class="sr-item" data-idx="' + globalIdx + '">' +
          '<div class="sr-icon"><i class="ti ti-' + h.icon + '"></i></div>' +
          '<div class="sr-meta"><div class="sr-title">' + highlight(h.title, q) + '</div><div class="sr-sub">' + highlight(h.sub, q) + '</div></div>' +
          (h.tag ? '<div class="sr-tag">' + esc(h.tag) + '</div>' : '') +
        '</div>';
      });
    });
    html += '<div class="sr-hint"><kbd>↑↓</kbd> navigeer · <kbd>↵</kbd> open · <kbd>esc</kbd> sluit</div>';
    searchResults.innerHTML = html;
    searchResults.classList.add('is-open');

    $$('.sr-item').forEach(function(el){
      kbdActivable(el);
      el.addEventListener('click', function(){
        var idx = parseInt(el.dataset.idx, 10);
        var hit = searchHits[idx];
        if (hit) {
          closeSearch();
          searchInput.value = '';
          hit.action();
        }
      });
    });
  }

  function setFocus(idx){
    var items = $$('.sr-item');
    if (items.length === 0) return;
    if (idx < 0) idx = items.length - 1;
    if (idx >= items.length) idx = 0;
    items.forEach(function(it,i){ it.classList.toggle('is-focus', i === idx); });
    items[idx].scrollIntoView({block:'nearest'});
    searchFocusIdx = idx;
  }

  if (searchInput){
    searchInput.addEventListener('input', debounce(function(e){ runSearch(e.target.value); }, 100));
    searchInput.addEventListener('focus', function(){
      if (searchInput.value.trim()) runSearch(searchInput.value);
    });
    searchInput.addEventListener('keydown', function(e){
      if (e.key === 'ArrowDown'){ e.preventDefault(); setFocus(searchFocusIdx + 1); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); setFocus(searchFocusIdx - 1); }
      else if (e.key === 'Enter' && searchFocusIdx >= 0){
        e.preventDefault();
        var hit = searchHits[searchFocusIdx];
        if (hit){ closeSearch(); searchInput.value = ''; hit.action(); }
      }
    });
    document.addEventListener('click', function(e){
      if (!e.target.closest('.topbar-search')) closeSearch();
    });
  }

  // ── STAGES ───────────────────────────────────────────────────
  var STAGES = [
    {key:'new',        label:'Nieuw',         tip:'Nog niet gecontacteerd'},
    {key:'qualified',  label:'Gekwalificeerd',tip:'Gesprek + interesse'},
    {key:'diagnostic', label:'Diagnose',      tip:'Diagnostic call gepland'},
    {key:'proposal',   label:'Voorstel',      tip:'Offerte verstuurd'},
    {key:'won',        label:'Gewonnen',      tip:'Getekend'}
  ];
  var SOURCES = {
    'fit-check':'Fit check', 'contact':'Contact formulier', 'calculator':'ROI calculator',
    'casey-waitlist':'Casey waitlist', 'referral':'Doorverwezen'
  };

  // ═══════════════════════════════════════ VIEW INITS ══

  // ── Overview ─────────────────────────────────────────────────
  window.init_overview = function(){
    var k = window.AdminData.kpi(DATA);
    $('#kpi-pipeline').textContent = fmt(k.pipelineValue); /* audit P5 — 'K' staat al in de HTML (<small>K</small>) */
    $('#kpi-leads').textContent = fmt(k.totalLeads);
    $('#kpi-subs').textContent = fmt(k.totalSubs);
    $('#kpi-meetings').textContent = fmt(k.meetings);

    // Second KPI row — Action required
    try {
      // Te beoordelen: meetings past + no feedback
      var now = new Date();
      var reviewCount = (DATA.submissions.contact||[]).filter(function(c){
        if (c.feedback) return false;
        var m = String(c.date||'').match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
        if (!m) return false;
        var months = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
        var mIdx = months.indexOf(m[2].toLowerCase());
        if (mIdx<0) return false;
        var d = new Date(parseInt(m[3],10), mIdx, parseInt(m[1],10));
        return d < now;
      }).length;
      $('#kpi-review') && ($('#kpi-review').textContent = fmt(reviewCount));
      if (reviewCount > 0 && $('#kpi-review-wrap')) $('#kpi-review-wrap').style.color = '#E8B45C';

      // Onboardings actief
      var onbCount = (DATA.onboardings||[]).filter(function(o){return o.stage!=='completed';}).length;
      $('#kpi-onb') && ($('#kpi-onb').textContent = fmt(onbCount));

      // GDPR <7d
      var gdprUrgent = (DATA.gdpr_requests||[]).filter(function(g){
        if (g.status==='completed') return false;
        var deadline = new Date(g.deadline);
        var days = Math.round((deadline - now)/86400000);
        return days <= 7;
      }).length;
      $('#kpi-gdpr') && ($('#kpi-gdpr').textContent = fmt(gdprUrgent));
      if (gdprUrgent > 0 && $('#kpi-gdpr-wrap')) $('#kpi-gdpr-wrap').style.color = '#E85C5C';

      // Nieuwe leads deze week
      var weekAgo = new Date(now.getTime() - 7*86400000);
      var newLeads = (DATA.leads||[]).filter(function(l){
        var d = new Date(String(l.ts).replace(' ','T'));
        return d >= weekAgo;
      }).length;
      $('#kpi-newleads') && ($('#kpi-newleads').textContent = fmt(newLeads));
    } catch(e){}

    // Activity feed
    var activities = [];
    DATA.submissions.contact.forEach(function(c){ activities.push({type:'cal', title:'<b>'+esc(c.name)+'</b> '+esc(T('dyn_ov_planned')), sub:c.date+' · '+c.time+' · '+c.loc, ts:c.ts, icon:'calendar-event'}); });
    DATA.submissions.fitcheck.forEach(function(f){ activities.push({type:'fit', title:esc(T('dyn_ov_fit')), sub:f.email+' · '+f.route, ts:f.ts, icon:'compass'}); });
    DATA.submissions.calculator.forEach(function(c){ activities.push({type:'rep', title:esc(T('dyn_ov_roi')), sub:c.email+' · '+c.cost+esc(T('dyn_ov_cost_suffix')), ts:c.ts, icon:'report-money'}); });
    DATA.submissions.casey.forEach(function(w){ activities.push({type:'wait', title:esc(T('dyn_ov_casey')), sub:w.email, ts:w.ts, icon:'sparkles'}); });
    activities.sort(function(a,b){return b.ts.localeCompare(a.ts);});

    var feed = $('#overview-feed');
    feed.innerHTML = activities.slice(0,4).map(function(a){
      return '<div class="feed-item">' +
        '<div class="feed-icon ' + a.type + '"><i class="ti ti-' + a.icon + '"></i></div>' +
        '<div class="feed-meta"><div class="feed-title">' + a.title + '</div><div class="feed-sub">' + esc(a.sub) + '</div></div>' +
        '<div class="feed-time">' + esc(timeAgo(a.ts)) + '</div>' +
      '</div>';
    }).join('');

    // Pipeline chart (last 14 days)
    drawTrendChart('#overview-chart', activities);

    // Conversion stats
    $('#kpi-won').textContent = fmt(k.won);
    $('#kpi-conv').textContent = ((k.won / k.totalLeads * 100) || 0).toFixed(0) + '%';
  };

  function timeAgo(ts){
    var d = new Date(ts.replace(' ','T'));
    var diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return T('dyn_time_now');
    if (diff < 3600) return Math.floor(diff/60)+T('dyn_time_min');
    if (diff < 86400) return Math.floor(diff/3600)+T('dyn_time_hour');
    if (diff < 604800) return Math.floor(diff/86400)+T('dyn_time_day');
    return d.toLocaleDateString(curLang()==='en'?'en-GB':'nl-BE',{day:'numeric',month:'short'});
  }

  function drawTrendChart(sel, activities){
    var svg = $(sel); if (!svg) return;
    var W = svg.clientWidth || 600, H = 140;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    // Bucket activities per day for last 14 days
    var buckets = {};
    for (var i=13;i>=0;i--){
      var d = new Date(); d.setDate(d.getDate()-i);
      var key = d.toISOString().slice(0,10);
      buckets[key] = 0;
    }
    activities.forEach(function(a){
      var key = a.ts.slice(0,10);
      if (key in buckets) buckets[key]++;
    });
    var values = Object.values(buckets);
    var max = Math.max.apply(null, values.concat([3]));
    var pts = values.map(function(v,i){
      var x = (i / (values.length-1)) * (W-20) + 10;
      var y = H - 20 - (v / max) * (H - 40);
      return [x,y];
    });
    var path = pts.map(function(p,i){ return (i===0?'M':'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = path + ' L ' + (W-10) + ' ' + (H-20) + ' L 10 ' + (H-20) + ' Z';

    svg.innerHTML =
      '<defs>' +
        '<linearGradient id="trendGrad" x1="0" x2="0" y1="0" y2="1">' +
          '<stop offset="0%" stop-color="#E8592B" stop-opacity="0.35"/>' +
          '<stop offset="100%" stop-color="#E8592B" stop-opacity="0"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<path d="' + area + '" fill="url(#trendGrad)"/>' +
      '<path d="' + path + '" fill="none" stroke="#E8592B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      pts.map(function(p,i){
        if (i % 2 !== 0 && i !== pts.length-1) return '';
        return '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="2.5" fill="#E8592B"/>';
      }).join('');
  }

  // ── Leads ────────────────────────────────────────────────────
  window.init_leads = function(){
    var container = $('#leads-pipeline');
    /* FIX 6 — search + filter logic */
    var searchQ  = ($('#lead-search')  ? $('#lead-search').value  : '').toLowerCase();
    var stageQ   = ($('#lead-stage-filter') ? $('#lead-stage-filter').value : '');
    var filtered = DATA.leads.filter(function(l){
      var matchSearch = !searchQ ||
        (l.name  || '').toLowerCase().includes(searchQ) ||
        (l.org   || '').toLowerCase().includes(searchQ) ||
        (l.email || '').toLowerCase().includes(searchQ);
      var matchStage = !stageQ || l.stage === stageQ;
      return matchSearch && matchStage;
    });

    /* Wire search inputs (idempotent — only add once) */
    var srch = $('#lead-search'), sf = $('#lead-stage-filter');
    if (srch && !srch.dataset.wired) {
      srch.dataset.wired = '1';
      srch.addEventListener('input', function(){ window.init_leads(); });
    }
    if (sf && !sf.dataset.wired) {
      sf.dataset.wired = '1';
      sf.addEventListener('change', function(){ window.init_leads(); });
    }

    container.innerHTML = STAGES.map(function(s){
      var leads = filtered.filter(function(l){return l.stage===s.key;});
      var sumVal = leads.reduce(function(a,l){return a + parseInt(String(l.value).replace(/\D/g,''),10);},0);
      return '<div class="pipe-col" data-stage="' + s.key + '">' +
        '<div class="pipe-col-head"><h4>' + esc(stageLabel(s.key)) + '</h4><span class="count">' + leads.length + '</span></div>' +
        leads.map(function(l){
          return '<div class="pipe-card" draggable="true" data-lead-id="' + l.id + '">' +
            '<div class="pc-name">' + esc(l.name) + '</div>' +
            '<div class="pc-org">' + esc(l.org) + '</div>' +
            '<div class="pc-meta"><span class="pc-tag">' + esc(l.value) + '</span><span>' + esc(sourceLabel(l.source)) + '</span></div>' +
          '</div>';
        }).join('') +
        (leads.length===0 ? '<div style="text-align:center;font-size:11.5px;color:rgba(29,29,31,0.30);padding:20px 8px;">' + esc(T('dyn_no_leads')) + '</div>' : '') +
      '</div>';
    }).join('');

    $$('.pipe-card').forEach(function(card){
      var nm = card.querySelector('.pc-name'); kbdActivable(card, nm ? nm.textContent : 'Lead');
      card.addEventListener('click', function(){ openLeadDrawer(card.dataset.leadId); });
    });

    // Audit P26 — echte drag-and-drop tussen fasen (met rol-check; server blijft de gate)
    (function wireDnD(){
      var dragId = null;
      $$('.pipe-card').forEach(function(card){
        card.addEventListener('dragstart', function(e){ dragId = card.dataset.leadId; card.classList.add('is-dragging'); try{ e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed='move'; }catch(_){} });
        card.addEventListener('dragend', function(){ card.classList.remove('is-dragging'); dragId=null; $$('.pipe-col').forEach(function(c){ c.classList.remove('is-dropzone'); }); });
      });
      $$('.pipe-col').forEach(function(col){
        col.addEventListener('dragover', function(e){ e.preventDefault(); try{ e.dataTransfer.dropEffect='move'; }catch(_){} col.classList.add('is-dropzone'); });
        col.addEventListener('dragleave', function(e){ if(e.target===col) col.classList.remove('is-dropzone'); });
        col.addEventListener('drop', function(e){
          e.preventDefault(); col.classList.remove('is-dropzone');
          if (window.AdminRoles && window.AdminRoles.can && !window.AdminRoles.can('leads:edit')){ showToast(aLang()==='en'?'Read-only role — cannot move leads.':'Alleen-lezen rol — leads verplaatsen mag niet.', 'alert-triangle'); return; }
          var id = dragId || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
          var stage = col.getAttribute('data-stage');
          if(!id || !stage) return;
          var lead = DATA.leads.find(function(x){return x.id===id;});
          if(!lead || lead.stage===stage) return;
          lead.stage = stage;
          window.AdminData.save(DATA);
          if (lead.id && window.__leadsBridgeActive && window.MontisoroSync){ window.MontisoroSync.write('/api/admin-leads', { action:'update', id:lead.id, patch:{ stage:stage } }); }
          if (window.Admin && window.Admin.logActivity) window.Admin.logActivity(TT('Lead verplaatst: ','Lead moved: ')+(lead.name||'')+' \u2192 '+stageLabel(stage), 'arrows-move');
          window.init_leads();
          showToast(TT('Verplaatst naar ','Moved to ')+stageLabel(stage));
        });
      });
    })();

    // Wire page-head buttons once (Filter + Nieuwe lead were dead) ──────────
    var head = document.querySelector('#view-leads .page-head-actions');
    if (head && !head.dataset.wired){
      head.dataset.wired = '1';
      var newBtn = head.querySelector('.btn-primary');
      if (newBtn) newBtn.addEventListener('click', openNewLeadDrawer);
      var fBtn = $$('.btn', head).filter(function(b){ return b.querySelector('i.ti-filter'); })[0];
      if (fBtn) fBtn.addEventListener('click', function(){
        var bar = document.querySelector('#view-leads .lead-filter-bar');
        if (!bar){ showToast('Filters worden geladen…'); return; }
        var willShow = (bar.style.display === 'none');
        bar.style.display = willShow ? 'flex' : 'none';
        if (willShow){ var s = bar.querySelector('#lf-search'); if (s) s.focus(); }
      });
    }
    updateSidebarBadges();
  };

  function openLeadDrawer(id){
    var l = DATA.leads.find(function(x){return x.id===id;}); if (!l) return;
    openDrawer(
      '<div class="drawer-head"><div><div class="eyebrow">' + esc(T('dyn_lead_eyebrow')) + '</div><h3>' + esc(l.name) + '</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
      '<div class="drawer-body">' +
        row(T('dyn_row_org'), esc(l.org)) +
        row(T('dyn_row_email'), '<a class="u-c-orange" href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a>') +
        row(T('dyn_row_phone'), '<a class="u-c-orange" href="tel:' + esc(l.phone.replace(/\s/g,'')) + '">' + esc(l.phone) + '</a>') +
        row(T('dyn_row_source'), esc(sourceLabel(l.source))) +
        row(T('dyn_row_value'), esc(l.value)) +
        row(T('dyn_row_status'), '<select class="a-select-sm" id="lead-stage">' +
          STAGES.map(function(s){return '<option value="'+s.key+'"'+(s.key===l.stage?' selected':'')+'>'+esc(stageLabel(s.key))+'</option>';}).join('') + '</select>') +
        row(T('dyn_row_notes'), '<textarea class="a-textarea-v" id="lead-notes" rows="5">' + esc(l.notes) + '</textarea>') +
        row(T('dyn_row_added'), esc(l.ts)) +
      '</div>' +
      '<div class="drawer-foot">' +
        '<button class="btn btn-primary" data-save><i class="ti ti-check"></i>' + esc(T('dyn_btn_save')) + '</button>' +
        '<a class="btn btn-ghost" href="mailto:' + esc(l.email) + '"><i class="ti ti-mail"></i>' + esc(T('dyn_btn_email')) + '</a>' +
      '</div>'
    );
    $('[data-save]').addEventListener('click', function(){
      l.stage = $('#lead-stage').value;
      l.notes = $('#lead-notes').value;
      window.AdminData.save(DATA);
      /* STAP 3 · write-through via de gecentraliseerde data-service seam (inert-safe).
         Alleen wanneer de live leads-bridge actief is; zonder sessie/Supabase = no-op. */
      if (l.id && window.__leadsBridgeActive && window.MontisoroSync) {
        window.MontisoroSync.write('/api/admin-leads', { action: 'update', id: l.id, patch: { stage: l.stage, notes: l.notes } });
      }
      closeDrawer();
      showToast(T('dyn_toast_lead_saved'));
      window.init_leads();
    });
  }
  function row(k,v){ return '<div class="drawer-row"><div class="k">'+esc(k)+'</div><div class="v">'+v+'</div></div>'; }

  // ── Sidebar badges: live counts (waren hardgecodeerd 12/16) ──────────────
  function updateSidebarBadges(){
    try{
      var lb = document.querySelector('.nav-item[data-view="leads"] .badge');
      if (lb){ var n=(DATA.leads||[]).filter(function(l){return l.stage!=='won';}).length; lb.textContent=n; lb.style.display=n?'':'none'; }
      var ib = document.querySelector('.nav-item[data-view="forms"] .badge');
      if (ib){ var s=DATA.submissions||{}; var t=((s.calculator||[]).length)+((s.fitcheck||[]).length)+((s.casey||[]).length)+((s.contact||[]).length); ib.textContent=t; ib.style.display=t?'':'none'; }
    }catch(e){}
  }
  window.Admin = window.Admin || {};
  window.Admin.updateSidebarBadges = updateSidebarBadges;

  // ── Nieuwe lead aanmaken (knop was dood) ─────────────────────────────────
  function openNewLeadDrawer(){
    var selStyle = 'background:rgba(29,29,31,0.04);border:1px solid var(--a-div);border-radius:8px;padding:8px 11px;color:var(--a-off);font:inherit;font-size:13px;';
    var l = { id:'lead-'+Date.now(), name:'', org:'', email:'', phone:'', source:'referral', value:'€ 0', stage:'new', notes:'', score:50, industry:'Other', ts:new Date().toISOString().slice(0,10) };
    function inp(id, val, ph){ return '<input id="'+id+'" value="'+esc(val||'')+'" placeholder="'+esc(ph||'')+'" style="width:100%;'+selStyle+'">'; }
    var srcSel = '<select id="nl-source" style="'+selStyle+'">'+Object.keys(SOURCES).map(function(k){return '<option value="'+k+'"'+(k==='referral'?' selected':'')+'>'+esc(sourceLabel(k))+'</option>';}).join('')+'</select>';
    var stgSel = '<select id="nl-stage" style="'+selStyle+'">'+STAGES.map(function(s){return '<option value="'+s.key+'">'+esc(stageLabel(s.key))+'</option>';}).join('')+'</select>';
    openDrawer(
      '<div class="drawer-head"><div><div class="eyebrow">'+esc(T('dyn_lead_eyebrow'))+'</div><h3>'+esc(TT('Nieuwe lead','New lead'))+'</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
      '<div class="drawer-body">' +
        row(TT('Naam','Name'), inp('nl-name','', TT('Voor- en achternaam','First and last name'))) +
        row(T('dyn_row_org'), inp('nl-org','', '')) +
        row(T('dyn_row_email'), inp('nl-email','', TT('naam@bedrijf.be','name@company.com'))) +
        row(T('dyn_row_phone'), inp('nl-phone','', '+32 …')) +
        row(T('dyn_row_value'), inp('nl-value','€ 0', '€ 0')) +
        row(T('dyn_row_source'), srcSel) +
        row(T('dyn_row_status'), stgSel) +
      '</div>' +
      '<div class="drawer-foot"><button class="btn btn-primary" data-save><i class="ti ti-check"></i>'+esc(TT('Toevoegen','Add'))+'</button><button class="btn btn-ghost" data-close><i class="ti ti-x"></i>'+esc(TT('Annuleer','Cancel'))+'</button></div>'
    );
    drawer.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', closeDrawer); });
    $('[data-save]').addEventListener('click', function(){
      var name=($('#nl-name').value||'').trim(), email=($('#nl-email').value||'').trim();
      if(!name || !/^\S+@\S+\.\S+$/.test(email)){ showToast(TT('Vul een naam en geldig e-mailadres in','Enter a name and a valid email address'), 'alert-triangle'); return; }
      l.name=name; l.email=email;
      l.org=($('#nl-org').value||'').trim(); l.phone=($('#nl-phone').value||'').trim();
      l.value=($('#nl-value').value||'').trim()||'€ 0'; l.source=$('#nl-source').value; l.stage=$('#nl-stage').value;
      DATA.leads.unshift(l); window.AdminData.save(DATA);
      /* Nr 3: persist new lead to Supabase */
      (function() {
        var sess; try { sess = JSON.parse(sessionStorage.getItem('admin.session') || '{}'); } catch(e){ sess = {}; }
        if (sess && sess.token) {
          fetch('/api/admin-leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: sess.token, action: 'create', data: { name: l.name, email: l.email, org: l.org, phone: l.phone, value: l.value, source: l.source, stage: l.stage } })
          })
            .then(function(r){ return r.ok ? r.json() : null; })
            .then(function(d){ if (d && d.ok && d.lead && d.lead.id) { l.id = d.lead.id; window.AdminData.save(DATA); } })
            .catch(function(){});
        }
      })();
      if(window.Admin && window.Admin.logActivity) window.Admin.logActivity(TT('Nieuwe lead toegevoegd','New lead added')+' · '+l.name, 'user-plus');
      closeDrawer(); showToast(TT('Lead toegevoegd','Lead added')+' · '+l.name); window.init_leads();
    });
  }

  // ── Analytics ────────────────────────────────────────────────
  window.init_analytics = function(){
    var subs = DATA.submissions;
    $('#an-calc-count').textContent = subs.calculator.length;
    $('#an-fit-count').textContent = subs.fitcheck.length;
    $('#an-casey-count').textContent = subs.casey.length;
    $('#an-contact-count').textContent = subs.contact.length;

    var avgCost = subs.calculator.reduce(function(s,c){return s+parseInt(c.cost.replace(/\D/g,''),10);},0) / Math.max(subs.calculator.length,1);
    $('#an-avg-cost').textContent = '€' + fmt(Math.round(avgCost)) + 'K';

    var tbl = $('#an-calc-table tbody');
    tbl.innerHTML = subs.calculator.map(function(c){
      return '<tr><td><span class="name">' + esc(c.email) + '</span></td><td>' + esc(c.cost) + '</td><td>' + fmt(c.fte) + ' FTE</td><td>' + eur(c.salary) + '</td><td><span class="sub">' + esc(c.ts) + '</span></td></tr>';
    }).join('');

    var ftbl = $('#an-fit-table tbody');
    ftbl.innerHTML = subs.fitcheck.map(function(f){
      var mat = (f.maturity>=1 && f.maturity<=4) ? T('dyn_mat_'+f.maturity) : '—';
      return '<tr><td><span class="name">' + esc(f.email) + '</span></td><td>' + esc(f.route) + '</td><td>' + esc(mat) + '</td><td>' + esc(f.scale) + '</td><td><span class="sub">' + esc(f.ts) + '</span></td></tr>';
    }).join('');

    /* HOOG #4 — Route breakdown bar chart */
    var routeCounts = {}; var routeTotal = subs.fitcheck.length || 1;
    subs.fitcheck.forEach(function(f){ if(f.route) routeCounts[f.route] = (routeCounts[f.route]||0)+1; });
    var rb = $('#an-route-breakdown');
    if (rb) {
      if (!Object.keys(routeCounts).length) { rb.innerHTML = '<div class="sh-help-line">Nog geen fit check resultaten.</div>'; }
      else {
        var sorted = Object.keys(routeCounts).sort(function(a,b){ return routeCounts[b]-routeCounts[a]; });
        rb.innerHTML = sorted.map(function(r){
          var pct = Math.round((routeCounts[r]/routeTotal)*100);
          return '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="flex:0 0 200px;font-size:12px;font-weight:600;color:var(--a-off);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="'+esc(r)+'">'+esc(r)+'</div>' +
            '<div style="flex:1;height:8px;background:rgba(29,29,31,.08);border-radius:4px;overflow:hidden;"><div style="height:100%;width:'+pct+'%;background:var(--a-orange);border-radius:4px;"></div></div>' +
            '<div style="flex:0 0 60px;text-align:right;font-size:12px;color:var(--a-muted-2);">'+routeCounts[r]+' ('+pct+'%)</div>' +
          '</div>';
        }).join('');
      }
    }
  };

  // ── Forms ────────────────────────────────────────────────────
  /* Persistente read/handled-markering → Supabase (optimistische UI). */
  window.markSub = function(table, id, patch){
    var sess; try { sess = JSON.parse(sessionStorage.getItem('admin.session')||'{}'); } catch(e){ sess={}; }
    if(!sess||!sess.token) return;
    fetch('/api/admin-mark',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(Object.assign({token:sess.token,table:table,id:id},patch))}).catch(function(){});
  };
  window.init_forms = function(){
    var tabs = $$('.forms-tab');

    var RISK = { low:{t:T('dyn_risk_low'),c:'var(--a-good)'}, avg:{t:T('dyn_risk_avg'),c:'var(--a-muted-2)'}, elevated:{t:T('dyn_risk_elevated'),c:'var(--a-orange)'}, high:{t:T('dyn_risk_high'),c:'#d8654f'} };
    var LEAD = { 'new':{t:T('dyn_lead_new'),c:'var(--a-orange)'}, viewed:{t:T('dyn_lead_viewed'),c:'var(--a-muted-2)'}, followed_up:{t:T('dyn_lead_followed'),c:'var(--a-good)'} };
    var LEAD_NEXT = { 'new':'viewed', viewed:'followed_up', followed_up:'new' };

    function chip(txt, color){ return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:600;letter-spacing:.02em;padding:3px 9px;border-radius:100px;color:'+color+';border:1px solid '+color+';background:transparent;white-space:nowrap;">'+txt+'</span>'; }
    function eur(c){ return (c.annual_cost!=null) ? '€ '+Number(c.annual_cost).toLocaleString('nl-BE') : (c.cost||'—'); }
    function emptyHtml(){ return '<div class="empty"><div class="ico"><i class="ti ti-inbox"></i></div><h4>'+esc(T('dyn_empty_subs_title'))+'</h4><p>'+esc(T('dyn_empty_subs_body'))+'</p></div>'; }
    function feedItem(x){ return '<div class="feed-item"><div class="feed-icon"><i class="ti ti-inbox"></i></div><div class="feed-meta"><div class="feed-title">' + x.t + '</div><div class="feed-sub">' + x.s + '</div></div><div class="feed-time">' + esc(timeAgo(x.ts)) + '</div></div>'; }

    function calcCard(c){
      var risk = RISK[c.risk_level] || null;
      var lead = LEAD[c.lead_status||'new'] || LEAD['new'];
      var title = esc(c.name || c.company || c.email);
      var sub = [esc(c.email)]; if (c.company && c.name) sub.push(esc(c.company)); if (c.phone) sub.push(esc(c.phone));
      var pdfChip = c.pdf_status==='generated' ? chip('PDF \u2713','var(--a-good)')
                  : c.pdf_status==='failed'    ? chip('PDF \u2717','#d8654f')
                  : chip('PDF \u2026','var(--a-muted-2)');
      var dl = (c.pdf_status==='generated' && c.pdf_url) ? '<a href="'+esc(c.pdf_url)+'" target="_blank" rel="noopener" class="btn btn-ghost" style="padding:6px 10px;font-size:10.5px;"><i class="ti ti-download"></i>PDF</a>' : '';
      return '<div class="feed-item" data-calc-id="'+esc(c.id)+'" style="align-items:flex-start;cursor:pointer;">' +
        '<div class="feed-icon"><i class="ti ti-report-money"></i></div>' +
        '<div class="feed-meta u-flex1-min0">' +
          '<div class="feed-title">'+title+'</div>' +
          '<div class="feed-sub">'+sub.join(' \u00b7 ')+'</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;">' +
            chip(eur(c)+T('dyn_per_year'),'var(--a-orange)') +
            (risk?chip(T('dyn_risk_prefix')+risk.t,risk.c):'') +
            chip(String(c.lang||'nl').toUpperCase(),'var(--a-muted-2)') +
            pdfChip +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;">' +
          '<div class="a-flex10">' +
            '<div class="feed-time">'+esc(timeAgo(c.ts))+'</div>' +
            '<button type="button" class="fi-del-btn a-iconbtn2" data-calc-del="'+esc(c.id)+'" data-calc-email="'+esc(c.email||'')+'" title="Verwijder (GDPR)" aria-label="Verwijder"><i class="ti ti-trash u-fs16"></i></button>' +
          '</div>' +
          '<button type="button" title="'+esc(T('dyn_lead_status_title'))+'" data-lead-id="'+esc(c.id)+'" style="cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:600;padding:4px 11px;border-radius:100px;color:'+lead.c+';border:1px solid '+lead.c+';background:transparent;">'+lead.t+'</button>' +
          dl +
        '</div>' +
      '</div>';
    }

    // ── Rapportbeheer: detail-drawer + PDF regen/resend ───────────────
    function logAct(m,i){ if(window.Admin && window.Admin.logActivity) window.Admin.logActivity(m, i||'report-money'); }
    // Roept de bestaande backend-contract aan (/api/calculator-report). Inert tot K1 → demo-fallback.
    function reportApi(action, c){
      var s; try { s = JSON.parse(sessionStorage.getItem('admin.session')||'{}'); } catch(e){ s={}; }
      return fetch('/api/calculator-report', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:action, id:c.id, email:c.email, lang:c.lang||'nl', token: s.token })
      }).then(function(r){ if(!r.ok) throw new Error('http '+r.status); return r.json().catch(function(){return {};}); });
    }
    function afterPdf(c, msg){ window.AdminData.save(DATA); logAct(TT('Rapport opnieuw gegenereerd','Report regenerated')+' · '+(c.company||c.email), 'refresh'); showToast(msg, 'check'); render('calculator'); openCalcDrawer(c.id); }
    function doRegen(c){
      var b = drawer.querySelector('[data-regen]'); if(b){ b.disabled=true; b.innerHTML='<i class="ti ti-loader-2"></i>'+TT('Genereren…','Generating…'); }
      reportApi('regenerate', c).then(function(res){
        c.pdf_status='generated'; c.pdf_url = (res && res.pdf_url) ? res.pdf_url : (c.pdf_url || '#');
        afterPdf(c, TT('PDF opnieuw gegenereerd','PDF regenerated'));
      }).catch(function(){
        c.pdf_status='generated'; c.pdf_url = (c.pdf_url && c.pdf_url!=='') ? c.pdf_url : '#';
        afterPdf(c, TT('PDF opnieuw gegenereerd (demo — backend inert)','PDF regenerated (demo — backend inert)'));
      });
    }
    function afterSend(c, msg){
      if (Array.isArray(DATA.outbox)) DATA.outbox.unshift({ id:'ob-'+Date.now(), to:c.email, subject:'Uw verzuimrapport van Montisoro', type:'report_customer', ts:new Date().toISOString().slice(0,16).replace('T',' ') });
      window.AdminData.save(DATA); logAct(TT('Rapport opnieuw verstuurd','Report resent')+' · '+c.email, 'send'); showToast(msg, 'mail'); render('calculator'); openCalcDrawer(c.id);
    }
    function doResend(c){
      if (c.pdf_status!=='generated'){ showToast(TT('Genereer eerst de PDF','Generate the PDF first'), 'alert-triangle'); return; }
      var b = drawer.querySelector('[data-resend]'); if(b){ b.disabled=true; b.innerHTML='<i class="ti ti-loader-2"></i>'+TT('Versturen…','Sending…'); }
      reportApi('resend', c).then(function(){ afterSend(c, TT('Rapport opnieuw verstuurd naar ','Report resent to ')+c.email); })
        .catch(function(){ afterSend(c, TT('Rapport opnieuw verstuurd naar ','Report resent to ')+c.email+TT(' (demo — backend inert)',' (demo — backend inert)')); });
    }
    function openCalcDrawer(id){
      var c = (DATA.submissions.calculator||[]).find(function(x){return x.id===id;}); if(!c) return;
      var risk = RISK[c.risk_level] || null;
      var lead = LEAD[c.lead_status||'new'] || LEAD['new'];
      function money(n){ return (n==null||n==='') ? '—' : '€ '+Number(n).toLocaleString(aLang()==='en'?'en-IE':'nl-BE'); }
      function r2(k,v){ return '<div class="drawer-row"><div class="k">'+esc(k)+'</div><div class="v">'+v+'</div></div>'; }
      function sect(t){ return '<div class="a-drawer-label2">'+esc(t)+'</div>'; }
      var pdfBadge = c.pdf_status==='generated' ? chip('PDF ✓','var(--a-good)') : c.pdf_status==='failed' ? chip('PDF ✗','#d8654f') : chip('PDF …','var(--a-muted-2)');
      var failBanner = (c.pdf_status==='failed')
        ? '<div class="help-banner" style="background:rgba(216,101,79,0.08);border-color:rgba(216,101,79,0.3);margin-bottom:4px;"><i class="ti ti-alert-triangle u-c-warnred"></i><p>'+TT('PDF-generatie is <b>mislukt</b>. Klik <b>Opnieuw genereren</b> om te herstellen; daarna kunt u het rapport versturen.','PDF generation <b>failed</b>. Click <b>Regenerate</b> to recover; then you can send the report.')+'</p></div>'
        : '';
      var leadBtn = '<button type="button" data-lead-cycle style="cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:5px 13px;border-radius:100px;color:'+lead.c+';border:1px solid '+lead.c+';background:transparent;">'+lead.t+' ↻</button>';
      var canResend = (c.pdf_status==='generated');
      var canDl = (c.pdf_status==='generated');
      openDrawer(
        '<div class="drawer-head"><div><div class="eyebrow">'+esc(TT('Verzuimrapport · inzending','Absence report · submission'))+'</div><h3>'+esc(c.name || c.company || c.email)+'</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
        '<div class="drawer-body">' +
          failBanner +
          '<div class="a-chips4">'+pdfBadge+chip(String(c.lang||'nl').toUpperCase(),'var(--a-muted-2)')+(risk?chip(T('dyn_risk_prefix')+risk.t,risk.c):'')+'</div>' +
          sect(TT('Contact','Contact')) +
          r2(TT('Naam','Name'), esc(c.name||'—')) +
          r2(TT('Bedrijf','Company'), esc(c.company||'—')) +
          r2(T('dyn_row_email','E-mail'), '<a class="u-c-orange" href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a>') +
          r2(T('dyn_row_phone','Telefoon'), c.phone ? '<a class="u-c-orange" href="tel:'+esc(String(c.phone).replace(/\s/g,''))+'">'+esc(c.phone)+'</a>' : '—') +
          r2(TT('Toestemming','Consent'), c.consent ? TT('✓ Ja','✓ Yes') : '—') +
          r2(TT('Aangevraagd','Requested'), esc(c.ts)) +
          sect(TT('Rapportcijfers','Report figures')) +
          r2(TT('Jaarlijkse verzuimkost','Annual absence cost'), '<b class="u-c-off">'+money(c.annual_cost)+'</b>') +
          r2(TT('Kost per medewerker','Cost per employee'), money(c.cost_per_employee)) +
          r2(TT('Kost per verloren dag','Cost per lost day'), money(c.cost_per_lost_day)) +
          r2(TT('Verzuimpercentage','Absence rate'), (c.absence_rate!=null? String(c.absence_rate).replace('.',',')+'%':'—')) +
          r2(TT('Verloren werkdagen','Lost working days'), (c.lost_workdays!=null? fmt(c.lost_workdays):'—')) +
          r2(TT('Medewerkers (FTE)','Employees (FTE)'), (c.fte!=null? fmt(c.fte):'—')) +
          r2(TT('Gem. brutoloon','Avg. gross salary'), money(c.salary)) +
          r2(TT('Risiconiveau','Risk level'), risk ? chip(risk.t, risk.c) : '—') +
          sect(TT('Opvolging','Follow-up')) +
          r2(TT('Status','Status'), '<div class="lf-btnrow">'+
            '<button type="button" data-calc-read style="cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;border:1px solid '+(c.read?'var(--a-good)':'var(--a-div)')+';background:transparent;color:'+(c.read?'var(--a-good)':'var(--a-muted-2)')+';">'+(c.read?'✓ '+TT('Gelezen','Read'):TT('Markeer gelezen','Mark read'))+'</button>'+
            '<button type="button" data-calc-handled style="cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;border:1px solid '+(c.handled?'var(--a-orange)':'var(--a-div)')+';background:transparent;color:'+(c.handled?'var(--a-orange)':'var(--a-muted-2)')+';">'+(c.handled?'✓ '+TT('Behandeld','Handled'):TT('Markeer behandeld','Mark handled'))+'</button>'+
          '</div>') +
          r2(TT('Lead-status','Lead status'), leadBtn) +
          r2(TT('Notitie','Note'), '<textarea class="a-textarea-v" id="calc-notes" rows="3">'+esc(c.notes||'')+'</textarea><button class="btn btn-ghost" data-notes-save style="margin-top:8px;padding:6px 12px;font-size:11px;"><i class="ti ti-check"></i>'+TT('Bewaar notitie','Save note')+'</button>') +
        '</div>' +
        '<div class="drawer-foot">' +
          '<button class="btn btn-ghost is-warnred" data-calc-delete><i class="ti ti-trash"></i>'+TT('Verwijderen','Delete')+'</button>' +
          (canDl ? '<a class="btn btn-ghost" href="'+esc(c.pdf_url||'#')+'" target="_blank" rel="noopener"><i class="ti ti-download"></i>PDF</a>' : '') +
          '<button class="btn btn-ghost u-ml-auto" data-close><i class="ti ti-x"></i>'+TT('Sluiten','Close')+'</button>' +
        '</div>'
      );
      drawer.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', closeDrawer); });
      var dlt = drawer.querySelector('[data-calc-delete]');
      if(dlt) dlt.addEventListener('click', function(){
        window.Admin.confirmDelete({ name:(c.email||c.id), title:TT('Permanent verwijderen?','Delete permanently?'), message:TT('Dit verwijdert de inzending onherroepelijk (ook server-side, GDPR Art. 17).','This permanently deletes the submission (also server-side, GDPR Art. 17).'), requireType:(c.email||'VERWIJDER'), confirmLabel:TT('Verwijder','Delete') }).then(function(ok){
          if(!ok) return;
          DATA.submissions.calculator = (DATA.submissions.calculator||[]).filter(function(x){return x.id!==c.id;});
          window.AdminData.save(DATA); closeDrawer(); render('calculator');
          if(window.Admin&&window.Admin.updateSidebarBadges) try{window.Admin.updateSidebarBadges();}catch(err){}
          if(window.gdprDeleteSilent) window.gdprDeleteSilent('calculator_submissions', c.id, c.email);
          showToast(TT('Inzending verwijderd','Submission deleted'), 'check');
        });
      });
      var lc = drawer.querySelector('[data-lead-cycle]'); if(lc) lc.addEventListener('click', function(){ c.lead_status = LEAD_NEXT[c.lead_status||'new']||'new'; window.AdminData.save(DATA); logAct(T('dyn_log_leadstatus')+' · '+(c.company||c.email)+' → '+(LEAD[c.lead_status]||{}).t, 'report-money'); render('calculator'); openCalcDrawer(id); });
      var ns = drawer.querySelector('[data-notes-save]'); if(ns) ns.addEventListener('click', function(){ c.notes = drawer.querySelector('#calc-notes').value; window.AdminData.save(DATA); showToast(TT('Notitie bewaard','Note saved'), 'check'); });
      function calcMark(btn, field, col, onTxt, offTxt){
        if(!btn) return;
        btn.addEventListener('click', function(){
          var nv=!c[field]; c[field]=nv;
          var arr=DATA.submissions.calculator; var s=Array.isArray(arr)?arr.find(function(z){return z.id===c.id;}):null; if(s) s[field]=nv;
          window.AdminData.save(DATA);
          btn.textContent=nv?('✓ '+onTxt):('Markeer '+offTxt);
          btn.style.borderColor=nv?col:'var(--a-div)'; btn.style.color=nv?col:'var(--a-muted-2)';
          if(window.markSub){ var p={}; p[field]=nv; window.markSub('calculator_submissions', c.id, p); }
        });
      }
      calcMark(drawer.querySelector('[data-calc-read]'), 'read', 'var(--a-good)', TT('Gelezen','Read'), TT('gelezen','read'));
      calcMark(drawer.querySelector('[data-calc-handled]'), 'handled', 'var(--a-orange)', TT('Behandeld','Handled'), TT('behandeld','handled'));
    }
    // Expose for the internal-mail deeplink (#forms?submission=<id>) + live-data bridge.
    try { window.Admin = window.Admin || {}; window.Admin.openCalcDrawer = openCalcDrawer; } catch(e){}

    // ── Unified inbox detail-drawer (Contact / Casey / Fit check) ──
    // Zelfde drawer-layout als Verzuim rapport → overal consequent.
    var subCache = {};
    function openSubDrawer(id){
      var entry = subCache[id]; if(!entry) return;
      var x = entry.x, all = entry.all, key = entry.key;
      var arr = DATA.submissions[key]; var rec = Array.isArray(arr)?arr.find(function(z){return z.id===id;}):null;
      var read = rec ? !!rec.read : !!x.read;
      var handled = rec ? !!rec.handled : !!x.handled;
      function sect(t){ return '<div class="a-drawer-label2">'+esc(t)+'</div>'; }
      function r2(k,v){ return '<div class="drawer-row"><div class="k">'+esc(k)+'</div><div class="v">'+v+'</div></div>'; }
      var rows = all.filter(function(d){return d[1];}).map(function(d){
        var label=String(d[0]), val=String(d[1]);
        var vh = /^e-?mail$/i.test(label) ? '<a class="u-c-orange" href="mailto:'+esc(val)+'">'+esc(val)+'</a>'
               : /tel|gsm|fo+n/i.test(label) ? '<a class="u-c-orange" href="tel:'+esc(val.replace(/\s/g,''))+'">'+esc(val)+'</a>'
               : esc(val);
        return r2(label, vh);
      }).join('');
      function statusBtn(on,onTxt,offTxt,col,attr){ return '<button type="button" '+attr+' style="cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;border:1px solid '+(on?col:'var(--a-div)')+';background:transparent;color:'+(on?col:'var(--a-muted-2)')+';">'+(on?('✓ '+onTxt):('Markeer '+offTxt))+'</button>'; }
      openDrawer(
        '<div class="drawer-head"><div><div class="eyebrow">'+esc(x.t)+'</div><h3>'+esc(x.name||x.email||'Inzending')+'</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
        '<div class="drawer-body">' +
          (handled?'<div class="a-chips4">'+chip('✓ '+TT('Behandeld','Handled'),'var(--a-orange)')+'</div>':'') +
          sect(TT('Ingevulde gegevens','Submitted details')) + rows +
          r2(TT('Ontvangen','Received'), esc(x.ts)) +
          sect(TT('Opvolging','Follow-up')) +
          r2(TT('Status','Status'), '<div class="lf-btnrow">'+
            statusBtn(read, TT('Gelezen','Read'), TT('gelezen','read'),'var(--a-good)','data-sub-read')+
            statusBtn(handled, TT('Behandeld','Handled'), TT('behandeld','handled'),'var(--a-orange)','data-sub-handled')+
          '</div>') +
          r2(TT('Lead-status','Lead status'), (function(){ var ls=(rec&&rec.lead_status)||x.lead_status||'new'; var l=LEAD[ls]||LEAD['new']; return '<button type="button" data-sub-lead title="'+esc(TT('Klik om te wijzigen','Click to change'))+'" style="cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:5px 13px;border-radius:100px;border:1px solid '+l.c+';background:transparent;color:'+l.c+';"><span style="width:6px;height:6px;border-radius:50%;background:'+l.c+';"></span>'+esc(l.t)+'</button>'; })()) +
          '<div class="u-mt-14"><div style="font-size:11px;font-weight:600;letter-spacing:.04em;color:var(--a-muted-2);margin-bottom:6px;">'+esc(TT('Notitie','Note'))+'</div>'+
            '<textarea id="sub-notes" rows="3" placeholder="'+esc(TT('Interne notitie over deze aanvraag…','Internal note about this request…'))+'" style="width:100%;box-sizing:border-box;font-family:inherit;font-size:13px;line-height:1.5;color:var(--a-off);background:rgba(29,29,31,.04);border:1px solid var(--a-div);border-radius:10px;padding:10px 12px;resize:vertical;">'+esc((rec&&rec.notes)||x.notes||'')+'</textarea>'+
            '<button type="button" class="btn btn-ghost" data-sub-notes-save style="margin-top:8px;font-size:11px;padding:6px 14px;"><i class="ti ti-device-floppy"></i>'+TT('Notitie bewaren','Save note')+'</button>'+
          '</div>' +
        '</div>' +
        '<div class="drawer-foot">' +
          '<button class="btn btn-ghost is-warnred" data-sub-delete><i class="ti ti-trash"></i>'+TT('Verwijderen','Delete')+'</button>' +
          (x.email ? '<a class="btn btn-ghost" href="mailto:'+esc(x.email)+'"><i class="ti ti-mail"></i>'+TT('Beantwoorden','Reply')+'</a>' : '') +
          '<button class="btn btn-ghost u-ml-auto" data-close><i class="ti ti-x"></i>'+TT('Sluiten','Close')+'</button>' +
        '</div>'
      );
      drawer.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', closeDrawer); });
      function mark(btn, field, col, onTxt, offTxt){
        if(!btn) return;
        btn.addEventListener('click', function(){
          var s=Array.isArray(arr)?arr.find(function(z){return z.id===id;}):null;
          var nv=!(s&&s[field]); if(s){ s[field]=nv; } x[field]=nv;
          try{window.AdminData.save(DATA);}catch(err){}
          btn.textContent=nv?('✓ '+onTxt):('Markeer '+offTxt);
          btn.style.borderColor=nv?col:'var(--a-div)'; btn.style.color=nv?col:'var(--a-muted-2)';
          if(window.markSub){ var p={}; p[field]=nv; window.markSub('form_submissions', id, p); }
          if(window.Admin&&window.Admin.updateSidebarBadges) try{window.Admin.updateSidebarBadges();}catch(e){}
          render(key);
        });
      }
      mark(drawer.querySelector('[data-sub-read]'),'read','var(--a-good)',TT('Gelezen','Read'),TT('gelezen','read'));
      mark(drawer.querySelector('[data-sub-handled]'),'handled','var(--a-orange)',TT('Behandeld','Handled'),TT('behandeld','handled'));
      var leadBtn = drawer.querySelector('[data-sub-lead]');
      if(leadBtn) leadBtn.addEventListener('click', function(){
        var s=Array.isArray(arr)?arr.find(function(z){return z.id===id;}):null;
        var cur=(s&&s.lead_status)||x.lead_status||'new';
        var nv=LEAD_NEXT[cur]||'new'; if(s){s.lead_status=nv;} x.lead_status=nv;
        var l=LEAD[nv]||LEAD['new'];
        leadBtn.style.borderColor=l.c; leadBtn.style.color=l.c;
        leadBtn.innerHTML='<span style="width:6px;height:6px;border-radius:50%;background:'+l.c+';"></span>'+esc(l.t);
        try{window.AdminData.save(DATA);}catch(e){}
        if(window.markSub) window.markSub('form_submissions', id, {lead_status:nv});
        render(key);
      });
      var notesSave = drawer.querySelector('[data-sub-notes-save]');
      if(notesSave) notesSave.addEventListener('click', function(){
        var v=(drawer.querySelector('#sub-notes')||{}).value||'';
        var s=Array.isArray(arr)?arr.find(function(z){return z.id===id;}):null;
        if(s){s.notes=v;} x.notes=v;
        try{window.AdminData.save(DATA);}catch(e){}
        if(window.markSub) window.markSub('form_submissions', id, {notes:v});
        showToast(TT('Notitie bewaard','Note saved'),'check');
      });
      var del = drawer.querySelector('[data-sub-delete]');
      if(del) del.addEventListener('click', function(){
        var sess; try{sess=JSON.parse(sessionStorage.getItem('admin.session')||'{}');}catch(e){sess={};}
        if(!sess||sess.role!=='admin'){ showToast('Alleen Admin-rol kan verwijderen.','warn'); return; }
        window.Admin.confirmDelete({ name:(x.email||id), title:TT('Permanent verwijderen?','Delete permanently?'), message:TT('Dit verwijdert de inzending onherroepelijk (ook server-side, GDPR Art. 17).','This permanently deletes the submission (also server-side, GDPR Art. 17).'), requireType:(x.email||'VERWIJDER'), confirmLabel:TT('Verwijder','Delete') }).then(function(ok){
          if(!ok) return;
          if(Array.isArray(arr)){ DATA.submissions[key]=arr.filter(function(it){return it.id!==id;}); }
          try{window.AdminData.save(DATA);}catch(e){}
          closeDrawer(); render(key);
          if(window.Admin&&window.Admin.updateSidebarBadges) try{window.Admin.updateSidebarBadges();}catch(e){}
          if(window.gdprDeleteSilent) window.gdprDeleteSilent('form_submissions', id, x.email);
          showToast(TT('Inzending verwijderd','Submission deleted'),'check');
        });
      });
      // openen = automatisch als gelezen markeren (persistent)
      if(rec && !rec.read){ rec.read=true; x.read=true; try{window.AdminData.save(DATA);}catch(e){}
        if(window.markSub) window.markSub('form_submissions', id, {read:true});
        if(window.Admin&&window.Admin.updateSidebarBadges) try{window.Admin.updateSidebarBadges();}catch(e){}
        if(window.Admin&&window.Admin.updateInboxCounts) try{window.Admin.updateInboxCounts();}catch(e){}
        var rb=drawer.querySelector('[data-sub-read]'); if(rb){ rb.textContent='✓ '+TT('Gelezen','Read'); rb.style.borderColor='var(--a-good)'; rb.style.color='var(--a-good)'; }
      }
    }
    try { window.Admin = window.Admin || {}; window.Admin.openSubDrawer = openSubDrawer; } catch(e){}

    function render(key){
      var host = $('#forms-list');
      if (key === 'calculator'){
        var clist = (DATA.submissions.calculator||[]).slice().sort(function(a,b){return String(b.ts).localeCompare(String(a.ts));});
        host.innerHTML = clist.length ? clist.map(calcCard).join('') : emptyHtml();
        $$('#forms-list [data-calc-id]').forEach(function(card){
          card.addEventListener('click', function(e){
            if (e.target.closest('[data-lead-id]') || e.target.closest('[data-calc-del]') || e.target.closest('a')) return;
            openCalcDrawer(card.dataset.calcId);
          });
        });
        $$('#forms-list [data-calc-del]').forEach(function(btn){
          btn.addEventListener('mouseenter', function(){ btn.style.color='#d8654f'; });
          btn.addEventListener('mouseleave', function(){ btn.style.color='var(--a-muted-2)'; });
          btn.addEventListener('click', function(e){
            e.stopPropagation();
            var id = btn.dataset.calcDel, email = btn.dataset.calcEmail;
            window.Admin.confirmDelete({ name:(email||id), title:TT('Permanent verwijderen?','Delete permanently?'), message:TT('Dit verwijdert de inzending onherroepelijk (ook server-side, GDPR Art. 17).','This permanently deletes the submission (also server-side, GDPR Art. 17).'), requireType:(email||'VERWIJDER'), confirmLabel:TT('Verwijder','Delete') }).then(function(ok){
              if(!ok) return;
              DATA.submissions.calculator = (DATA.submissions.calculator||[]).filter(function(x){return x.id!==id;});
              window.AdminData.save(DATA);
              var card = btn.closest('.feed-item'); if(card) card.remove();
              if(!(DATA.submissions.calculator||[]).length) $('#forms-list').innerHTML = emptyHtml();
              if(window.Admin&&window.Admin.updateSidebarBadges) try{window.Admin.updateSidebarBadges();}catch(err){}
              if(window.gdprDeleteSilent) window.gdprDeleteSilent('calculator_submissions', id, email);
            });
          });
        });
        $$('#forms-list [data-lead-id]').forEach(function(btn){
          btn.addEventListener('click', function(){
            var item = (DATA.submissions.calculator||[]).find(function(x){return x.id===btn.dataset.leadId;});
            if (!item) return;
            item.lead_status = LEAD_NEXT[item.lead_status||'new'] || 'new';
            window.AdminData.save(DATA);
            if (window.Admin && window.Admin.logActivity) window.Admin.logActivity(T('dyn_log_leadstatus')+' \u00b7 '+(item.company||item.email)+' \u2192 '+(LEAD[item.lead_status]||{}).t, 'report-money');
            render('calculator');
          });
        });
        return;
      }
      var streams = {
        contact: DATA.submissions.contact.filter(function(c){return !c._booking;}).map(function(c){ return {id:c.id, email:c.email, ts:c.ts, raw:c.fields, read:c.read, handled:c.handled, t:T('dyn_feed_contact'), s:esc(c.name)+' \u00b7 '+esc(c.email)+' \u00b7 '+esc(c.date||'')+' '+esc(c.time||''),
          detail:[['Naam',c.name],['E-mail',c.email],['Telefoon',c.telefoon||c.phone],['Organisatie',c.organisatie||c.company],['Datum',c.date],['Tijd',c.time],['Locatie',c.loc||c.locatie],['Bericht',c.bericht||c.message]]}; }),
        casey: DATA.submissions.casey.map(function(c){ return {id:c.id, email:c.email, ts:c.ts, raw:c.fields, read:c.read, handled:c.handled, t:T('dyn_feed_casey'), s:esc(c.email),
          detail:[['E-mail',c.email],['Naam',c.name],['Organisatie',c.organisatie||c.company]]}; }),
        fitcheck: DATA.submissions.fitcheck.map(function(c){ return {id:c.id, email:c.email, ts:c.ts, raw:c.fields, read:c.read, handled:c.handled, t:T('dyn_feed_fit'), s:esc(c.email)+' \u00b7 '+esc(c.route),
          detail:[['Naam',c.name],['E-mail',c.email],['Telefoon',c.telefoon||c.phone],['Organisatie',c.organisatie||c.company],['Route',c.route],['Combinatie',c.combination],['Maturiteit',c.maturiteit||c.maturity],['Schaal',c.schaal||c.scale],['Herkenning',c.herkenning],['Aanpak',c.aanpak]]}; }),
        booking: (DATA.submissions.booking||[]).map(function(c){ var f=c.fields||{}; return {id:c.id, email:c.email, ts:c.ts, raw:f, read:c.read, handled:c.handled, t:T('dyn_feed_contact'), s:esc(c.name||f.name)+' \u00b7 '+esc(f.datum||'')+(f.tijdstip?' '+esc(f.tijdstip):''),
          detail:[['Naam',c.name||f.name],['E-mail',c.email||f.email],['Telefoon',f.telefoon],['Organisatie',f.organisatie],['Type',f.afspraaktype_label||f.afspraaktype],['Datum',f.datum],['Tijd',f.tijdstip?(f.tijdstip+(f.eindtijd?' – '+f.eindtijd:'')):''],['Locatie',f.locatie],['Bericht',f.bericht]]}; })
      };
      /* mooie labels voor ruwe veldnamen uit het formulier */
      var FIELD_LABELS = {name:'Naam',voornaam:'Voornaam',achternaam:'Achternaam',email:'E-mail','e-mail':'E-mail',telefoon:'Telefoon',phone:'Telefoon',gsm:'Telefoon',organisatie:'Organisatie',company:'Organisatie',bedrijf:'Organisatie',functie:'Functie',role:'Functie',bericht:'Bericht',message:'Bericht',vraag:'Vraag',onderwerp:'Onderwerp',subject:'Onderwerp',datum:'Datum',date:'Datum',tijd:'Tijd',time:'Tijd',tijdstip:'Tijd',locatie:'Locatie',loc:'Locatie',adres:'Adres',straat:'Straat',postcode:'Postcode',gemeente:'Gemeente',stad:'Stad',land:'Land',route:'Route',combination:'Combinatie',combinatie:'Combinatie',maturiteit:'Maturiteit',maturity:'Maturiteit',schaal:'Schaal',scale:'Schaal',herkenning:'Herkenning',aanpak:'Aanpak',sector:'Sector',medewerkers:'Medewerkers',aantal:'Aantal',consent:'Toestemming',lang:'Taal',type:'Type',afspraaktype:'Afspraaktype',afspraaktype_label:'Afspraaktype'};
      function prettyLabel(k){ return FIELD_LABELS[String(k).toLowerCase()] || (String(k).charAt(0).toUpperCase()+String(k).slice(1).replace(/_/g,' ')); }
      var list = (streams[key]||[]).slice();
      list.sort(function(a,b){return String(b.ts).localeCompare(String(a.ts));});
      if (!list.length){ host.innerHTML = emptyHtml(); return; }
      host.innerHTML = list.map(function(x, i){
        var curated = (x.detail||[]).filter(function(d){return d[1];});
        var shownVals = {}; curated.forEach(function(d){ shownVals[String(d[1]).trim().toLowerCase()]=1; });
        var SKIP = {botcheck:1,token:1,id:1,ts:1,created_at:1,consent:1,lang:1,type:1,afspraaktype_label:1};
        var extra = [];
        if (x.raw && typeof x.raw==='object') {
          Object.keys(x.raw).forEach(function(k){
            var val = x.raw[k];
            if (val==null || val==='' || typeof val==='object') return;
            if (SKIP[String(k).toLowerCase()]) return;
            if (shownVals[String(val).trim().toLowerCase()]) return; // al getoond
            extra.push([prettyLabel(k), val]);
          });
        }
        var all = curated.concat(extra);
        if(x.id) subCache[x.id]={x:x,all:all,key:key};
        var rows = all.map(function(d){
          return '<div style="display:flex;gap:10px;padding:4px 0;font-size:12.5px;"><span style="color:var(--a-muted-2);min-width:110px;flex-shrink:0;">'+esc(d[0])+'</span><span class="bk-val">'+esc(d[1])+'</span></div>';
        }).join('');
        var markRow = x.id ? ('<div style="display:flex;gap:8px;margin-bottom:12px;">'+
          '<button type="button" class="mk-read" data-mk-id="'+esc(x.id)+'" style="cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;border:1px solid '+(x.read?'var(--a-good)':'var(--a-div)')+';background:transparent;color:'+(x.read?'var(--a-good)':'var(--a-muted-2)')+';">'+(x.read?'✓ Gelezen':'Markeer gelezen')+'</button>'+
          '<button type="button" class="mk-handled" data-mk-id="'+esc(x.id)+'" style="cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;border:1px solid '+(x.handled?'var(--a-orange)':'var(--a-div)')+';background:transparent;color:'+(x.handled?'var(--a-orange)':'var(--a-muted-2)')+';">'+(x.handled?'✓ Behandeld':'Markeer behandeld')+'</button>'+
        '</div>') : '';
        return '<div class="feed-item'+(x.read?' is-read':'')+'" data-fi="'+i+'" style="cursor:pointer;align-items:flex-start;'+(x.read?'opacity:.72;':'')+'">'+
          (x.id ? '<input type="checkbox" class="fi-cb" data-bulk-cb="'+esc(x.id)+'" title="Selecteer" style="margin:3px 10px 0 0;width:16px;height:16px;flex-shrink:0;cursor:pointer;accent-color:var(--a-orange);">' : '<span style="width:26px;flex-shrink:0;"></span>')+
          '<div class="feed-icon"><i class="ti ti-inbox"></i></div>'+
          '<div class="u-flex1-min0">'+
            '<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;">'+
              '<div><div style="font-weight:600;font-size:13.5px;color:var(--a-off);">'+x.t+(x.handled?' <span style="font-size:10px;color:var(--a-orange);font-weight:600;">· behandeld</span>':'')+'</div>'+
              '<div style="font-size:12.5px;color:var(--a-muted-2);margin-top:2px;">'+x.s+'</div></div>'+
              '<div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">'+
                '<span style="font-size:11px;color:var(--a-muted-2);white-space:nowrap;">'+esc(x.ts)+'</span>'+
                (x.id ? '<button class="fi-del-btn a-iconbtn2" data-fi-del="'+esc(x.id)+'" data-fi-email="'+esc(x.email||'')+'" title="Verwijder (GDPR)" aria-label="Verwijder"><i class="ti ti-trash u-fs16"></i></button>' : '')+
              '</div>'+
            '</div>'+
            '<div class="fi-detail" data-fid="'+i+'" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid var(--a-div);">'+markRow+rows+
              (x.id ? '' : '<div style="margin-top:10px;font-size:11px;color:var(--a-muted-2);font-style:italic;">Verbind Supabase om te verwijderen</div>')+
            '</div>'+
          '</div>'+
        '</div>';
      }).join('');
      // Click → open detail-drawer (zelfde layout als Verzuim rapport)
      $$('#forms-list .feed-item').forEach(function(card){
        card.addEventListener('click', function(e){
          if (e.target.closest('[data-fi-del]') || e.target.closest('[data-mk-id]') || e.target.closest('[data-bulk-cb]')) return;
          var idx = card.getAttribute('data-fi');
          var item = (streams[key]||[])[idx];
          if(item && item.id) openSubDrawer(item.id);
        });
      });
      // Markeer gelezen / behandeld (persistent)
      $$('#forms-list [data-mk-id]').forEach(function(btn){
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          var id=btn.dataset.mkId, isHandled=btn.classList.contains('mk-handled');
          var arr=DATA.submissions[key]; var s=Array.isArray(arr)?arr.find(function(z){return z.id===id;}):null;
          var field=isHandled?'handled':'read';
          var nv=!(s&&s[field]);
          if(s){ s[field]=nv; try{window.AdminData.save(DATA);}catch(err){} }
          var col=isHandled?'var(--a-orange)':'var(--a-good)';
          btn.textContent=nv?('✓ '+(isHandled?'Behandeld':'Gelezen')):('Markeer '+(isHandled?'behandeld':'gelezen'));
          btn.style.borderColor=nv?col:'var(--a-div)'; btn.style.color=nv?col:'var(--a-muted-2)';
          if(window.markSub){ var p={}; p[field]=nv; window.markSub('form_submissions', id, p); }
        });
      });
      // Delete → optimistic removal (verdwijnt meteen) + GDPR delete op de server
      $$('#forms-list [data-fi-del]').forEach(function(btn){
        btn.addEventListener('mouseenter', function(){ btn.style.color='#d8654f'; });
        btn.addEventListener('mouseleave', function(){ btn.style.color='var(--a-muted-2)'; });
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          var id=btn.dataset.fiDel, email=btn.dataset.fiEmail;
          var sess; try{sess=JSON.parse(sessionStorage.getItem('admin.session')||'{}');}catch(err){sess={};}
          if(!sess||sess.role!=='admin'){ showToast('Alleen Admin-rol kan verwijderen.','warn'); return; }
          window.Admin.confirmDelete({ name:(email||id), title:TT('Permanent verwijderen?','Delete permanently?'), message:TT('Dit verwijdert de inzending onherroepelijk (ook server-side, GDPR Art. 17).','This permanently deletes the submission (also server-side, GDPR Art. 17).'), requireType:(email||'VERWIJDER'), confirmLabel:TT('Verwijder','Delete') }).then(function(ok){
            if(!ok) return;
            var arr=DATA.submissions[key];
            if(Array.isArray(arr)){ DATA.submissions[key]=arr.filter(function(it){return it.id!==id;}); }
            try{ window.AdminData.save(DATA); }catch(err){}
            render(key);
            if(window.Admin&&window.Admin.updateSidebarBadges) try{window.Admin.updateSidebarBadges();}catch(err){}
            if(window.gdprDeleteSilent) window.gdprDeleteSilent('form_submissions', id, email);
          });
        });
      });

      // ── Bulk-acties ──────────────────────────────────────────────
      (function setupBulk(){
        var host = $('#forms-list');
        var cbs = $$('#forms-list [data-bulk-cb]');
        var bar = document.getElementById('forms-bulkbar');
        if (!bar){
          bar = document.createElement('div'); bar.id='forms-bulkbar';
          bar.style.cssText='display:none;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px;padding:10px 14px;background:var(--a-surface-2,rgba(232,89,43,.06));border:1px solid var(--a-div);border-radius:10px;';
          host.parentNode.insertBefore(bar, host);
        }
        function selected(){ return $$('#forms-list [data-bulk-cb]:checked').map(function(c){return c.dataset.bulkCb;}); }
        function refresh(){
          var sel = selected();
          if (!sel.length){ bar.style.display='none'; return; }
          bar.style.display='flex';
          bar.innerHTML =
            '<span style="font-size:12.5px;font-weight:600;color:var(--a-off);">'+sel.length+' '+TT('geselecteerd','selected')+'</span>'+
            '<button data-bulk="read" style="cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;border:1px solid var(--a-good);background:transparent;color:var(--a-good);">'+TT('Markeer gelezen','Mark read')+'</button>'+
            '<button data-bulk="handled" style="cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;border:1px solid var(--a-orange);background:transparent;color:var(--a-orange);">'+TT('Markeer behandeld','Mark handled')+'</button>'+
            '<button data-bulk="delete" style="cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;border:1px solid rgba(216,101,79,.5);background:transparent;color:#d8654f;">'+TT('Verwijderen','Delete')+'</button>'+
            '<button data-bulk="clear" style="cursor:pointer;font-family:inherit;font-size:11px;font-weight:500;padding:5px 10px;border:none;background:none;color:var(--a-muted-2);margin-left:auto;">'+TT('Selectie wissen','Clear')+'</button>';
          bar.querySelectorAll('[data-bulk]').forEach(function(b){
            b.addEventListener('click', function(){
              var act=b.dataset.bulk, ids=selected();
              if (act==='clear'){ cbs.forEach(function(c){c.checked=false;}); refresh(); return; }
              var arr=DATA.submissions[key]||[];
              if (act==='delete'){
                var sess; try{sess=JSON.parse(sessionStorage.getItem('admin.session')||'{}');}catch(e){sess={};}
                if(!sess||sess.role!=='admin'){ showToast(TT('Alleen Admin-rol kan verwijderen.','Admin role only.'),'warn'); return; }
                window.Admin.confirmDelete({ title:TT('Permanent verwijderen? (GDPR Art. 17)','Delete permanently? (GDPR Art. 17)'), message:ids.length+' '+TT('inzendingen worden onherroepelijk verwijderd (ook server-side).',' submissions will be permanently deleted (also server-side).'), requireType:TT('VERWIJDER','DELETE'), confirmLabel:TT('Verwijder','Delete') }).then(function(ok){
                  if(!ok) return;
                  DATA.submissions[key]=arr.filter(function(it){return ids.indexOf(it.id)<0;});
                  try{window.AdminData.save(DATA);}catch(e){}
                  ids.forEach(function(id){ if(window.gdprDeleteSilent) window.gdprDeleteSilent('form_submissions', id, ''); });
                  if(window.Admin&&window.Admin.logActivity) window.Admin.logActivity(TT('Bulk verwijderd: ','Bulk deleted: ')+ids.length+' '+key, 'trash');
                  render(key);
                  if(window.Admin&&window.Admin.updateSidebarBadges) try{window.Admin.updateSidebarBadges();}catch(e){}
                  if(window.Admin&&window.Admin.updateInboxCounts) try{window.Admin.updateInboxCounts();}catch(e){}
                });
                return;
              }
              var field = act==='handled'?'handled':'read';
              ids.forEach(function(id){
                var s=arr.find(function(z){return z.id===id;});
                if(s){ s[field]=true; if(window.markSub){ var p={}; p[field]=true; window.markSub('form_submissions', id, p); } }
              });
              try{window.AdminData.save(DATA);}catch(e){}
              if(window.Admin&&window.Admin.logActivity) window.Admin.logActivity(TT('Bulk ','Bulk ')+field+': '+ids.length+' '+key, field==='handled'?'check':'eye');
              render(key);
              if(window.Admin&&window.Admin.updateInboxCounts) try{window.Admin.updateInboxCounts();}catch(e){}
            });
          });
        }
        cbs.forEach(function(c){ c.addEventListener('change', refresh); });
        refresh();
      })();
    }

    function updateTabCounts(){
      var subs = DATA.submissions || {};
      var map = { contact:(subs.contact||[]).filter(function(c){return !c._booking;}), casey:subs.casey||[], calculator:subs.calculator||[], fitcheck:subs.fitcheck||[], booking:subs.booking||[] };
      tabs.forEach(function(t){
        var arr = map[t.dataset.stream] || [];
        var unread = arr.filter(function(c){return !c.read;}).length;
        var b = t.querySelector('.tab-badge');
        if (!b){ b = document.createElement('span'); b.className='tab-badge'; b.style.cssText='display:none;margin-left:7px;min-width:18px;height:18px;padding:0 5px;border-radius:100px;background:var(--a-orange);color:#fff;font-size:10.5px;font-weight:700;line-height:18px;text-align:center;vertical-align:middle;'; t.appendChild(b); }
        if (unread>0){ b.textContent=unread; b.style.display='inline-block'; } else { b.style.display='none'; }
      });
    }
    window.Admin = window.Admin || {}; window.Admin.updateInboxCounts = updateTabCounts;

    tabs.forEach(function(t){
      t.addEventListener('click', function(){
        tabs.forEach(function(x){x.classList.remove('is-active');});
        t.classList.add('is-active');
        render(t.dataset.stream);
      });
    });
    render('contact');
    updateTabCounts();
  };

  // ── Content ──────────────────────────────────────────────────
  window.init_content = function(){
    var grid = $('#content-grid');
    grid.innerHTML = DATA.pages.map(function(p, idx){
      return '<div class="panel" style="padding:20px;display:flex;flex-direction:column;gap:10px;cursor:pointer;transition:border-color .25s var(--a-ease), transform .25s var(--a-ease);" data-page-edit="' + idx + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
          '<h class="st-name"4>' + esc(p.slug) + '</h4>' +
          '<span class="tag done" style="font-size:9.5px;font-weight:600;letter-spacing:.08em;padding:3px 8px;border-radius:100px;background:rgba(90,191,126,0.12);color:var(--a-good);border:1px solid rgba(90,191,126,0.22);flex-shrink:0;">' + esc(T('dyn_live')) + '</span>' +
        '</div>' +
        '<div class="lf-t115">' + esc(T('dyn_updated_prefix')) + esc(p.updated) + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:6px;">' +
          '<button class="btn btn-primary btn-md is-grow" data-edit="' + idx + '"><i class="ti ti-edit"></i>' + esc(T('dyn_edit')) + '</button>' +
          '<a href="' + esc(p.nl) + '" target="_blank" class="btn btn-ghost btn-sm" title="' + esc(T('dyn_open_nl')) + '"><i class="ti ti-external-link"></i></a>' +
        '</div>' +
      '</div>';
    }).join('');

    // Hover lift
    $$('[data-page-edit]').forEach(function(c){
      c.addEventListener('mouseenter', function(){ c.style.borderColor = 'rgba(232,89,43,0.30)'; c.style.transform = 'translateY(-2px)'; });
      c.addEventListener('mouseleave', function(){ c.style.borderColor = ''; c.style.transform = ''; });
    });

    // Open editor on whole-card click OR on button click
    $$('[data-edit]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        openPageEditor(parseInt(btn.dataset.edit, 10));
      });
    });
    $$('[data-page-edit]').forEach(function(card){
      card.addEventListener('click', function(e){
        // Ignore clicks on the open-tab anchor
        if (e.target.closest('a[target="_blank"]')) return;
        openPageEditor(parseInt(card.dataset.pageEdit, 10));
      });
    });
  };

  function openPageEditor(idx){
    var p = DATA.pages[idx]; if (!p) return;
    var activeLang = 'nl';
    p.banner = p.banner || { color:'#13100D', overlay:62, image:'' };

    function bannerSection(){
      var b = p.banner;
      var swatches = [
        ['#13100D',T('sw_black')],
        ['#0D0905',T('sw_deep')],
        ['#1A1410',T('sw_warm')],
        ['#1C1814',T('sw_charcoal')]
      ];
      var sw = swatches.map(function(s){
        var on = (b.color||'').toLowerCase() === s[0].toLowerCase();
        return '<button type="button" class="bnr-sw' + (on?' is-on':'') + '" data-bnr-color="' + s[0] + '" title="' + s[1] + '" style="background:' + s[0] + ';"></button>';
      }).join('');
      var preview = b.image
        ? 'background-image:linear-gradient(rgba(19,16,13,'+(b.overlay/100)+'),rgba(19,16,13,'+(b.overlay/100)+')),url(' + b.image + ');background-size:cover;background-position:center;'
        : 'background:' + (b.color||'#13100D') + ';';
      return (
        '<div class="drawer-section-label"><i class="ti ti-photo u-mr-6"></i>' + esc(T('pe_banner_bg')) + '</div>' +
        '<div class="bnr-prev" data-bnr-prev style="height:74px;border-radius:10px;border:1px solid var(--a-div);margin-bottom:14px;display:flex;align-items:center;justify-content:center;' + preview + '">' +
          '<span style="font-family:var(--a-serif);font-style:italic;color:rgba(29,29,31,.85);font-size:15px;text-shadow:0 1px 8px rgba(0,0,0,.5);">' + esc(T('pe_banner_preview')) + '</span>' +
        '</div>' +
        '<div class="field"><label>' + esc(T('pe_bg_color')) + '</label><div class="tls-flex9" data-bnr-swwrap>' + sw + '</div></div>' +
        '<div class="field"><label>' + esc(T('pe_overlay')) + ' · <b data-bnr-ovval>' + b.overlay + '%</b></label>' +
          '<input type="range" min="0" max="85" value="' + b.overlay + '" data-bnr-overlay style="width:100%;accent-color:var(--a-orange);"></div>' +
        '<div class="field"><label>' + esc(T('pe_image_opt')) + '</label>' +
          '<input type="file" accept="image/png,image/jpeg,image/webp" data-bnr-file style="background:rgba(29,29,31,0.04);border:1px solid var(--a-div);border-radius:8px;padding:9px;font-size:12px;width:100%;color:var(--a-off);">' +
          (b.image ? '<button type="button" class="btn btn-ghost" data-bnr-clear style="padding:6px 12px;font-size:11px;margin-top:8px;"><i class="ti ti-trash"></i>' + esc(T('pe_image_remove')) + '</button>' : '') +
        '</div>' +
        '<div style="font-size:11.5px;color:var(--a-muted-2);line-height:1.6;margin-top:2px;">' + esc(T('pe_banner_note')) + '</div>'
      );
    }

    function renderField(field, fieldId){
      var lang = activeLang;
      var val = field[lang] || '';
      var label = '<label>' + esc(field.label) + '</label>';
      if (field.type === 'textarea'){
        return '<div class="field" data-field-id="' + fieldId + '">' + label +
          '<textarea data-field-input rows="' + (val.length > 100 ? 4 : 2) + '">' + esc(val) + '</textarea></div>';
      }
      return '<div class="field" data-field-id="' + fieldId + '">' + label +
        '<input type="text" data-field-input value="' + esc(val) + '"></div>';
    }

    function renderBlock(block, bIdx){
      var fieldsHtml = Object.keys(block.fields).map(function(key){
        return renderField(block.fields[key], 'b-' + bIdx + '-' + key);
      }).join('');
      return (
        '<div class="drawer-section-label">' +
          '<i class="ti ti-square-rounded-letter-b u-mr-6"></i>' + esc(block.label) +
        '</div>' +
        fieldsHtml
      );
    }

    function html(){
      var metaFields = renderField(p.meta.title, 'meta-title') + renderField(p.meta.desc, 'meta-desc');
      var heroFields =
        renderField(p.hero.eyebrow, 'hero-eyebrow') +
        renderField(p.hero.title, 'hero-title') +
        renderField(p.hero.body, 'hero-body') +
        renderField(p.hero.cta_primary, 'hero-cta-primary') +
        renderField(p.hero.cta_secondary, 'hero-cta-secondary');
      var blocksHtml = (p.blocks || []).map(renderBlock).join('');

      return (
        '<div class="drawer-head">' +
          '<div>' +
            '<div class="eyebrow">' + esc(T('pe_eyebrow')) + '</div>' +
            '<h3>' + esc(p.slug) + '</h3>' +
          '</div>' +
          '<button class="drawer-close" data-close><i class="ti ti-x"></i></button>' +
        '</div>' +
        '<div style="padding:0 28px;border-bottom:1px solid var(--a-div);background:var(--a-bg-2);">' +
          '<div class="tabs" style="margin:14px 0 14px;background:transparent;border:0;padding:0;gap:8px;">' +
            '<button class="tab' + (activeLang==='nl'?' is-active':'') + ' st-minw96" data-lang="nl">Nederlands</button>' +
            '<button class="tab' + (activeLang==='en'?' is-active':'') + ' st-minw96" data-lang="en">English</button>' +
            '<a href="' + esc(activeLang==='nl'?p.nl:p.en) + '" target="_blank" class="btn btn-ghost" style="padding:7px 14px;font-size:11px;margin-left:auto;"><i class="ti ti-external-link"></i>' + esc(T('pe_preview_live')) + '</a>' +
          '</div>' +
        '</div>' +
        '<div class="drawer-body">' +
          '<div class="drawer-section-label is-first"><i class="ti ti-info-circle u-mr-6"></i>' + esc(T('pe_meta_seo')) + '</div>' +
          metaFields +
          '<div class="drawer-section-label"><i class="ti ti-typography u-mr-6"></i>' + esc(T('pe_hero')) + '</div>' +
          heroFields +
          bannerSection() +
          blocksHtml +
          '<div class="help-banner" style="margin-top:32px;margin-bottom:0;">' +
            '<i class="ti ti-info-circle"></i>' +
            '<p>' + T('pe_demo_a') + esc(activeLang==='nl'?p.nl:p.en) + T('pe_demo_b') + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="drawer-foot">' +
          '<button class="btn btn-primary" data-save><i class="ti ti-check"></i>' + esc(T('pe_save')) + ' (' + activeLang.toUpperCase() + ')</button>' +
          '<button class="btn btn-ghost" data-close><i class="ti ti-x"></i>' + esc(T('pe_cancel')) + '</button>' +
          '<a href="' + esc(activeLang==='nl'?p.nl:p.en) + '" target="_blank" class="btn btn-ghost u-ml-auto"><i class="ti ti-eye"></i>' + esc(T('pe_preview')) + '</a>' +
        '</div>'
      );
    }

    function saveCurrent(){
      drawer.querySelectorAll('[data-field-id]').forEach(function(wrap){
        var id = wrap.dataset.fieldId;
        var input = wrap.querySelector('[data-field-input]');
        if (!input) return;
        var val = input.value;
        if (id === 'meta-title') p.meta.title[activeLang] = val;
        else if (id === 'meta-desc') p.meta.desc[activeLang] = val;
        else if (id === 'hero-eyebrow') p.hero.eyebrow[activeLang] = val;
        else if (id === 'hero-title') p.hero.title[activeLang] = val;
        else if (id === 'hero-body') p.hero.body[activeLang] = val;
        else if (id === 'hero-cta-primary') p.hero.cta_primary[activeLang] = val;
        else if (id === 'hero-cta-secondary') p.hero.cta_secondary[activeLang] = val;
        else if (id.indexOf('b-') === 0){
          // b-{idx}-{key}
          var parts = id.split('-');
          var bIdx = parseInt(parts[1], 10);
          var key = parts.slice(2).join('-');
          if (p.blocks[bIdx] && p.blocks[bIdx].fields[key]){
            p.blocks[bIdx].fields[key][activeLang] = val;
          }
        }
      });
    }

    function wireUp(){
      // ── Banner controls (lang-onafhankelijk) ──
      var prev = drawer.querySelector('[data-bnr-prev]');
      function refreshPrev(){
        var b = p.banner;
        if (b.image){
          prev.style.backgroundImage = 'linear-gradient(rgba(19,16,13,'+(b.overlay/100)+'),rgba(19,16,13,'+(b.overlay/100)+')),url(' + b.image + ')';
          prev.style.backgroundSize = 'cover'; prev.style.backgroundPosition = 'center'; prev.style.background = prev.style.background;
        } else {
          prev.style.backgroundImage = 'none';
          prev.style.background = b.color || '#13100D';
        }
      }
      drawer.querySelectorAll('[data-bnr-color]').forEach(function(sw){
        sw.addEventListener('click', function(){
          p.banner.color = sw.dataset.bnrColor;
          drawer.querySelectorAll('[data-bnr-color]').forEach(function(x){ x.classList.toggle('is-on', x===sw); });
          if (!p.banner.image) refreshPrev();
        });
      });
      var ov = drawer.querySelector('[data-bnr-overlay]');
      if (ov) ov.addEventListener('input', function(){
        p.banner.overlay = parseInt(ov.value,10);
        var lbl = drawer.querySelector('[data-bnr-ovval]'); if (lbl) lbl.textContent = p.banner.overlay + '%';
        if (p.banner.image) refreshPrev();
      });
      var file = drawer.querySelector('[data-bnr-file]');
      if (file) file.addEventListener('change', function(){
        var f = file.files && file.files[0]; if (!f) return;
        var r = new FileReader();
        r.onload = function(){ p.banner.image = r.result; drawer.innerHTML = html(); wireUp(); };
        r.readAsDataURL(f);
      });
      var clr = drawer.querySelector('[data-bnr-clear]');
      if (clr) clr.addEventListener('click', function(){ p.banner.image = ''; drawer.innerHTML = html(); wireUp(); });

      drawer.querySelectorAll('[data-lang]').forEach(function(t){
        t.addEventListener('click', function(){
          saveCurrent();
          activeLang = t.dataset.lang;
          drawer.innerHTML = html();
          wireUp();
        });
      });
      drawer.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', closeDrawer); });
      drawer.querySelectorAll('[data-save]').forEach(function(b){
        b.addEventListener('click', function(){
          saveCurrent();
          window.AdminData.save(DATA);
          p.updated = new Date().toISOString().slice(0,10);
          closeDrawer();
          showToast('"' + p.slug + '" (' + activeLang.toUpperCase() + ') opgeslagen');
          window.init_content();
        });
      });
    }

    drawer.innerHTML = html();
    drawer.classList.add('is-open');
    drawerBackdrop.classList.add('is-open');
    wireUp();
  }

  // ── Languages ────────────────────────────────────────────────
  window.init_languages = function(){
    var grid = $('#lang-grid');
    grid.innerHTML = DATA.pages.map(function(p){
      return '<tr><td><span class="name">' + esc(p.slug) + '</span></td>' +
        '<td><a class="u-c-orange" href="' + esc(p.nl) + '" target="_blank">' + esc(p.nl) + '</a></td>' +
        '<td><a class="u-c-orange" href="' + esc(p.en) + '" target="_blank">' + esc(p.en) + '</a></td>' +
        '<td><span class="tag done">' + esc(T('dyn_synced')) + '</span></td>' +
        '<td><span class="sub">' + esc(p.updated) + '</span></td></tr>';
    }).join('');
  };

  // ── Site Team (About page) ──────────────────────────────────
  window.init_siteteam = function(){ window.initSiteTeam && window.initSiteTeam(DATA, $, $$, esc, openDrawer, closeDrawer, drawer, drawerBackdrop, showToast); };

  // ── Vertrouwd door (Home logo strip) ────────────────────────
  window.init_trustedby = function(){ window.initTrustedBy && window.initTrustedBy(DATA, $, $$, esc, openDrawer, closeDrawer, drawer, drawerBackdrop, showToast); };

  // ── Klantenquotes (Home testimonials) ──────────────────────
  window.init_testimonials = function(){ window.initTestimonials && window.initTestimonials(DATA, $, $$, esc, openDrawer, closeDrawer, drawer, drawerBackdrop, showToast); };

  // ── Referenties (case-detailpagina's) ──────────────────────
  window.init_cases = function(){ window.initCases && window.initCases(DATA, $, $$, esc, openDrawer, closeDrawer, drawer, drawerBackdrop, showToast); };

  // ── Team (Admin users) ─────────────────────────────────────
  window.init_team = function(){
    var grid = $('#team-grid');
    grid.innerHTML = DATA.team.map(function(u, idx){
      return '<div class="panel" style="padding:24px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;position:relative;cursor:pointer;transition:border-color .25s var(--a-ease), transform .25s var(--a-ease);" data-team-edit="' + idx + '">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#E8592B,#C8824A);display:flex;align-items:center;justify-content:center;font-family:var(--a-serif);font-weight:700;font-size:22px;color:#fff;">' + esc(u.initial) + '</div>' +
        '<div><div style="font-family:var(--a-serif);font-weight:700;font-size:16px;color:var(--a-off);">' + esc(u.name) + '</div><div style="font-size:11.5px;color:var(--a-muted-2);margin-top:2px;">' + esc(u.email) + '</div></div>' +
        '<div style="display:flex;gap:8px;margin-top:6px;align-items:center;">' +
          '<span class="tag ' + (u.role==='Admin'?'done':(u.role==='Editor'?'wait':'cold')) + '">' + esc(u.role) + '</span>' +
          '<span style="font-size:11px;color:var(--a-muted-3);">' + esc(u.lastSeen) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    // Hover lift + click to edit
    $$('[data-team-edit]').forEach(function(card){
      card.addEventListener('mouseenter', function(){ card.style.borderColor = 'rgba(232,89,43,0.30)'; card.style.transform = 'translateY(-2px)'; });
      card.addEventListener('mouseleave', function(){ card.style.borderColor = ''; card.style.transform = ''; });
      card.addEventListener('click', function(){ openTeamEditor(parseInt(card.dataset.teamEdit, 10)); });
    });

    // Wire "Uitnodig" button (in page-head)
    var inviteBtn = $('#team-invite-btn');
    if (inviteBtn){
      inviteBtn.onclick = function(){ openTeamEditor(-1); };
    }
  };

  function openTeamEditor(idx){
    var isNew = (idx === -1);
    var u = isNew ? { id:'u-new', name:'', role:'Editor', email:'', initial:'', lastSeen:'nooit ingelogd' } : DATA.team[idx];
    if (!u) return;

    openDrawer(
      '<div class="drawer-head">' +
        '<div>' +
          '<div class="eyebrow">' + esc(isNew ? T('te_invite') : T('te_edit')) + '</div>' +
          '<h3>' + esc(isNew ? T('te_new') : u.name) + '</h3>' +
        '</div>' +
        '<button class="drawer-close" data-close><i class="ti ti-x"></i></button>' +
      '</div>' +
      '<div class="drawer-body">' +
        '<div class="field"><label>' + esc(T('te_fullname')) + '</label><input id="tm-name" value="' + esc(u.name) + '" placeholder="' + esc(T('te_name_ph')) + '"></div>' +
        '<div class="field"><label>' + esc(T('te_email')) + '</label><input id="tm-email" type="email" value="' + esc(u.email) + '" placeholder="sofie@montisoro.com"><div class="hint">' + esc(T('te_email_hint')) + '</div></div>' +
        '<div class="field"><label>' + esc(T('te_role')) + '</label>' +
          '<select class="ag-in" id="tm-role">' +
            '<option value="Admin"' + (u.role==='Admin'?' selected':'') + '>' + esc(T('te_role_admin')) + '</option>' +
            '<option value="Editor"' + (u.role==='Editor'?' selected':'') + '>' + esc(T('te_role_editor')) + '</option>' +
            '<option value="Viewer"' + (u.role==='Viewer'?' selected':'') + '>' + esc(T('te_role_viewer')) + '</option>' +
          '</select>' +
        '</div>' +
        '<div style="margin:24px 0 12px;padding-top:18px;border-top:1px solid var(--a-div);font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--a-muted-2);">' + esc(T('te_roledesc')) + '</div>' +
        '<div id="tm-role-desc" style="padding:16px 18px;background:rgba(29,29,31,0.03);border:1px solid var(--a-div);border-radius:10px;font-size:12.5px;color:var(--a-muted);line-height:1.7;"></div>' +
        (isNew ? '' :
          '<div class="help-banner st-danger">' +
            '<i class="ti ti-alert-triangle u-c-red"></i>' +
            '<p class="st-ink85">' + T('te_delwarn') + '</p>' +
          '</div>') +
      '</div>' +
      '<div class="drawer-foot">' +
        '<button class="btn btn-primary" data-save><i class="ti ti-check"></i>' + esc(isNew ? T('te_send_invite') : T('te_save')) + '</button>' +
        '<button class="btn btn-ghost" data-close><i class="ti ti-x"></i>' + esc(T('te_cancel')) + '</button>' +
        (isNew ? '' : '<button class="btn btn-ghost is-danger u-ml-auto" data-delete><i class="ti ti-trash"></i>' + esc(T('te_delete')) + '</button>') +
      '</div>'
    );

    var roleDescs = {
      Admin:  T('te_desc_admin'),
      Editor: T('te_desc_editor'),
      Viewer: T('te_desc_viewer')
    };
    function updateRoleDesc(){ $('#tm-role-desc').innerHTML = roleDescs[$('#tm-role').value] || ''; }
    updateRoleDesc();
    $('#tm-role').addEventListener('change', updateRoleDesc);

    $('[data-save]').addEventListener('click', function(){
      var name = $('#tm-name').value.trim();
      var email = $('#tm-email').value.trim();
      var role = $('#tm-role').value;
      if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)){
        showToast(T('te_name_req'), 'alert-triangle');
        return;
      }
      if (isNew){
        DATA.team.push({
          id: 'u-' + Date.now(),
          name: name,
          email: email,
          role: role,
          initial: name.charAt(0).toUpperCase(),
          lastSeen: 'uitgenodigd, niet aanvaard'
        });
        window.AdminData.save(DATA);
        closeDrawer();
        showToast(T('te_invited') + ' · ' + email);
      } else {
        u.name = name;
        u.email = email;
        u.role = role;
        u.initial = name.charAt(0).toUpperCase();
        window.AdminData.save(DATA);
        closeDrawer();
        showToast(T('te_saved'));
      }
      window.init_team();
    });

    var delBtn = drawer.querySelector('[data-delete]');
    if (delBtn) delBtn.addEventListener('click', function(){
      window.Admin.confirmDelete({ name:u.name }).then(function(ok){
        if(!ok) return;
        var removed = DATA.team[idx];
        DATA.team.splice(idx, 1);
        window.AdminData.save(DATA);
        closeDrawer();
        window.init_team();
        window.Admin.undoToast(u.name + ' · ' + T('te_deleted'), function(){
          DATA.team.splice(idx, 0, removed); window.AdminData.save(DATA); window.init_team(); window.Admin.showToast(u.name + ' hersteld');
        });
      });
    });
  }

  // ── Settings ─────────────────────────────────────────────────
  window.init_settings = function(){
    var tabs = $$('.set-tab');
    var panes = $$('.set-pane');
    tabs.forEach(function(t){
      t.addEventListener('click', function(){
        tabs.forEach(function(x){x.classList.remove('is-active');});
        panes.forEach(function(p){p.style.display='none';});
        t.classList.add('is-active');
        var pane = $('#set-'+t.dataset.tab);
        if (pane) pane.style.display='block';
        if (t.dataset.tab === 'integrations') renderIntegrations();
        if (t.dataset.tab === 'forms') renderNotifications();
        if (t.dataset.tab === 'formulas' && window.renderFormulas) window.renderFormulas();
      });
    });
    $$('[data-save-setting]').forEach(function(b){
      b.addEventListener('click', function(){ showToast('Instelling bijgewerkt'); });
    });
    renderIntegrations();
    renderNotifications();

    /* Nr 5: GDPR delete button wiring */
    var gdprBtn = document.getElementById('gdpr-delete-btn');
    var gdprResult = document.getElementById('gdpr-result');
    if (gdprBtn && !gdprBtn.dataset.wired) {
      gdprBtn.dataset.wired = '1';
      gdprBtn.addEventListener('click', function() {
        var email = (document.getElementById('gdpr-email') || {}).value || '';
        var table = (document.getElementById('gdpr-table') || {}).value || 'form_submissions';
        if (!email) { if(gdprResult) gdprResult.innerHTML = '<span class="u-c-warnred">Vul een e-mailadres in.</span>'; return; }
        /* Look up the submission ID by email in local data */
        var subs = DATA.submissions || {};
        var found = null;
        var allSubs = (subs.contact||[]).concat(subs.fitcheck||[]).concat(subs.casey||[]).concat(subs.booking||[]).concat(subs.calculator||[]);
        found = allSubs.find(function(s){ return (s.email||'').toLowerCase() === email.toLowerCase(); });
        if (!found || !found.id) {
          if(gdprResult) gdprResult.innerHTML = '<span class="u-c-warnred">Geen inzending gevonden voor dit e-mailadres in de huidige dataset. Controleer of Supabase geconfigureerd is (K1).</span>';
          return;
        }
        window.gdprDelete(table, found.id, email, function() {
          if(gdprResult) gdprResult.innerHTML = '<span class="u-c-good2">✓ Gegevens verwijderd.</span>';
        });
      });
    }
  };

  // ── Notifications (email destination + templates) ────────────
  var NOTIF_DEFS = [
    { key:'diagnose', icon:'calendar-event', title:'E-mail bij diagnosegesprek', sub:'Wanneer iemand een afspraak boekt via Contact', source:'Contact pagina · agenda modal' },
    { key:'casey',    icon:'sparkles',       title:'E-mail bij Casey waitlist',   sub:'Wanneer iemand zich inschrijft op de wachtlijst', source:'Technologie pagina · Casey waitlist' },
    { key:'report',   icon:'report-money',   title:'Interne mail bij calculator-aanvraag', sub:'Wanneer iemand de verzuimcalculator invult en een rapport aanvraagt', source:'Calculator pagina · rapport-gate' },
    { key:'report_customer', icon:'file-text', title:'Klantmail: verzuimrapport (PDF)', sub:'De e-mail met het PDF-rapport die de bezoeker zelf ontvangt (NL/EN, server-side)', source:'Calculator · backend (email-templates.js)' },
    { key:'fitcheck', icon:'compass',        title:'E-mail bij fit check resultaat', sub:'Wanneer iemand de fit check voltooit', source:'Fit check pagina · email-gate' },
    { key:'daily',    icon:'sun',            title:'Dagelijks overzicht',        sub:'Eén e-mail om 08:00 met wat er gisteren gebeurde', source:'Automatisch · uit alle bronnen' },
    { key:'weekly',   icon:'calendar-stats', title:'Wekelijkse rapportage',      sub:'Maandag 09:00 — pipeline + leads + conversies', source:'Automatisch · uit alle bronnen' }
  ];

  function renderNotifications(){
    var container = $('#notif-toggles');
    if (!container) return;
    DATA.notif_config = DATA.notif_config || { email:'hello@montisoro.com', cc:'', reply_to:'hello@montisoro.com', flags:{}, templates:{} };
    var n = DATA.notif_config;

    // Sync email fields
    var emailIn = $('#notif-email'); if (emailIn) emailIn.value = n.email || '';
    var ccIn = $('#notif-cc'); if (ccIn) ccIn.value = n.cc || '';
    var replyIn = $('#notif-reply'); if (replyIn) replyIn.value = n.reply_to || '';

    container.innerHTML = NOTIF_DEFS.map(function(d){
      var on = n.flags && n.flags[d.key];
      var hasTemplate = !!(n.templates && n.templates[d.key]);
      return '<div class="toggle-row" style="align-items:flex-start;">' +
        '<div class="toggle-info">' +
          '<b><i class="ti ti-' + d.icon + ' u-c-orange u-mr-8"></i>' + esc(d.title) + '</b>' +
          '<span>' + esc(d.sub) + '</span>' +
          '<div style="display:flex;gap:10px;margin-top:10px;align-items:center;">' +
            '<span style="font-size:10.5px;color:var(--a-muted-3);letter-spacing:.06em;text-transform:uppercase;">Bron: ' + esc(d.source) + '</span>' +
            (hasTemplate ? '<button class="btn btn-ghost" style="padding:5px 10px;font-size:11px;" data-preview-mail="' + d.key + '"><i class="ti ti-eye"></i>Bekijk e-mail</button>' : '') +
          '</div>' +
        '</div>' +
        '<label class="toggle">' +
          '<input type="checkbox" data-notif-flag="' + d.key + '"' + (on?' checked':'') + '>' +
          '<span class="toggle-track"></span>' +
        '</label>' +
      '</div>';
    }).join('');

    // Add save button at bottom
    container.innerHTML += '<button class="btn btn-primary u-mt-20" id="notif-flags-save"><i class="ti ti-check"></i>Notificaties opslaan</button>';

    // Wire up
    $$('[data-preview-mail]').forEach(function(btn){
      btn.addEventListener('click', function(){ openEmailPreview(btn.dataset.previewMail); });
    });

    $('#notif-flags-save').onclick = function(){
      $$('[data-notif-flag]').forEach(function(cb){
        n.flags[cb.dataset.notifFlag] = cb.checked;
      });
      window.AdminData.save(DATA);
      showToast('Notificaties bijgewerkt');
    };

    var saveEmailBtn = $('#notif-save');
    if (saveEmailBtn) saveEmailBtn.onclick = function(){
      var email = $('#notif-email').value.trim();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)){
        showToast('Vul een geldig e-mailadres in', 'alert-triangle');
        return;
      }
      n.email = email;
      n.cc = $('#notif-cc').value.trim();
      n.reply_to = $('#notif-reply').value.trim() || email;
      window.AdminData.save(DATA);
      showToast('E-mailadres opgeslagen — alle notificaties gaan nu naar ' + email);
    };
  }

  function openEmailPreview(key){
    var n = DATA.notif_config;
    var def = NOTIF_DEFS.find(function(x){return x.key===key;});
    var tpl = n.templates && n.templates[key];
    if (!def || !tpl) return;

    // Demo sample replacements
    var sample = {
      name:'Sofie Vandenberg', email:'s.vandenberg@rockwool.com', org:'Rockwool Benelux',
      date:'donderdag 22 mei 2026', time:'14:00', loc:'Bij u op kantoor', address:'Tisseltstraat 25, 1880 Ramsdonk',
      note:'Graag een diagnostic call over hoe Storm bij ons kan landen.',
      cost:'€280K', fte:'180', salary:'€48.000',
      company:'Rockwool Benelux', phone:'+32 472 19 55 02',
      annual_absence_cost:'€ 1.477.368', lost_workdays:'3.960 werkdagen', cost_per_employee:'€ 5.909',
      cost_per_lost_day:'€ 266', absence_rate:'7,2%', risk_level:'Gemiddeld',
      pdf_status:'gegenereerd', lead_status:'nieuw',
      route:'Capability Building', tension:'Operationele overload', maturity:'Niveau 2 · Operationeel', scale:'enterprise',
      absence_type:'kort + middellang gemengd',
      recommendation:'• Stap 1: Storm pilot binnen 1 afdeling\n• Stap 2: 3 case managers trainen\n• Stap 3: KB RIT 3.0 audit afsluiten'
    };
    function fill(s){
      s = s.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, function(_, key, body){ return sample[key] ? body : ''; });
      return s.replace(/\{\{(\w+)\}\}/g, function(_, k){ return sample[k] || ''; });
    }
    var rendered = {
      from: 'Montisoro website <noreply@montisoro.com>',
      to: n.email || 'hello@montisoro.com',
      cc: n.cc || '',
      reply: n.reply_to || n.email,
      subject: fill(tpl.subject),
      body: fill(tpl.body)
    };

    var fields = Object.keys(sample).filter(function(k){ return tpl.subject.indexOf('{{'+k+'}}') >= 0 || tpl.body.indexOf('{{'+k+'}}') >= 0 || tpl.body.indexOf('{{#'+k+'}}') >= 0; });

    openDrawer(
      '<div class="drawer-head"><div><div class="eyebrow">Voorbeeld e-mail</div><h3><i class="ti ti-' + def.icon + ' u-c-orange u-mr-8"></i>' + esc(def.title) + '</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
      '<div class="drawer-body">' +
        '<div class="drawer-section-label is-first"><i class="ti ti-eye u-mr-6"></i>Hoe ziet het eruit?</div>' +
        '<div style="border:1px solid var(--a-div);border-radius:12px;overflow:hidden;background:var(--a-bg-2);">' +
          '<div style="padding:14px 18px;border-bottom:1px solid var(--a-div);background:rgba(29,29,31,0.02);">' +
            '<div style="display:grid;grid-template-columns:80px 1fr;gap:6px 16px;font-size:12px;line-height:1.6;">' +
              '<div class="a-eyebrow10">Van</div><div class="u-c-muted">' + esc(rendered.from) + '</div>' +
              '<div class="a-eyebrow10">Aan</div><div style="color:var(--a-off);font-weight:500;">' + esc(rendered.to) + '</div>' +
              (rendered.cc ? '<div class="a-eyebrow10">CC</div><div class="u-c-muted">' + esc(rendered.cc) + '</div>' : '') +
              '<div class="a-eyebrow10">Onderwerp</div><div style="color:var(--a-off);font-weight:600;">' + esc(rendered.subject) + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="padding:20px 22px;font-size:13.5px;color:var(--a-off);line-height:1.75;white-space:pre-wrap;font-family:var(--a-sans);">' + esc(rendered.body) + '</div>' +
        '</div>' +
        '<div class="help-banner" style="margin-top:16px;background:rgba(232,180,92,0.06);border-color:rgba(232,180,92,0.22);">' +
          '<i class="ti ti-bulb u-c-amber"></i>' +
          '<p>Dit is een <b>voorbeeld met dummy data</b>. De echte e-mail bevat de gegevens van de persoon die het formulier invulde.</p>' +
        '</div>' +

        '<div class="drawer-section-label"><i class="ti ti-edit u-mr-6"></i>Sjabloon bewerken</div>' +
        '<div class="field"><label>Onderwerp</label><input id="tpl-subject" value="' + esc(tpl.subject) + '"></div>' +
        '<div class="field"><label>E-mail tekst</label><textarea class="tls-body" id="tpl-body" rows="10">' + esc(tpl.body) + '</textarea></div>' +

        '<div style="margin-top:16px;padding:14px 18px;background:rgba(29,29,31,0.02);border:1px solid var(--a-div);border-radius:10px;">' +
          '<div style="font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--a-muted-2);margin-bottom:10px;">Beschikbare variabelen</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
            fields.map(function(k){ return '<code style="font-size:11px;background:rgba(232,89,43,0.10);color:var(--a-orange);padding:3px 8px;border-radius:5px;font-family:inherit;">{{'+k+'}}</code>'; }).join('') +
          '</div>' +
          '<div style="font-size:11.5px;color:var(--a-muted-3);margin-top:10px;line-height:1.6;">Tip: <code style="font-size:11px;color:var(--a-orange);">{{name}}</code> wordt vervangen door de echte naam van de persoon. Plaats deze variabelen overal in onderwerp of tekst.</div>' +
        '</div>' +
      '</div>' +
      '<div class="drawer-foot">' +
        '<button class="btn btn-primary" data-tpl-save><i class="ti ti-check"></i>Sjabloon opslaan</button>' +
        '<button class="btn btn-ghost" data-close><i class="ti ti-x"></i>Annuleer</button>' +
        '<button class="btn btn-ghost u-ml-auto" data-tpl-reset><i class="ti ti-rotate"></i>Standaard herstellen</button>' +
      '</div>'
    );

    $('[data-tpl-save]').addEventListener('click', function(){
      tpl.subject = $('#tpl-subject').value;
      tpl.body = $('#tpl-body').value;
      window.AdminData.save(DATA);
      closeDrawer();
      showToast('Sjabloon opgeslagen');
    });
    $('[data-tpl-reset]').addEventListener('click', function(){
      if (!confirm('Sjabloon terugzetten naar standaard? Uw aanpassingen gaan verloren.')) return;
      window.AdminData.reset();
      closeDrawer();
      showToast('Standaard hersteld — pagina herlaadt');
      setTimeout(function(){ location.reload(); }, 600);
    });
  }

  // ── Integrations ─────────────────────────────────────────────
  var INTEGRATIONS = [
    { key:'analytics', name:'Google Analytics',   icon:'brand-google-analytics', color:'#F9AB00',
      desc:'Bezoekersstatistieken voor uw website. Zie welke pagina\'s werken.',
      fields:[ { key:'id', label:'Measurement ID', type:'text', placeholder:'G-XXXXXXXXXX', hint:'Begint met G- en is te vinden in Google Analytics → Admin → Data streams.' } ],
      docLink:'https://analytics.google.com' },
    { key:'linkedin',  name:'LinkedIn Insight',    icon:'brand-linkedin',         color:'#0A66C2',
      desc:'Retargeting via LinkedIn campagnes en conversie-tracking.',
      fields:[ { key:'id', label:'Partner ID', type:'text', placeholder:'1234567', hint:'Te vinden in LinkedIn Campaign Manager → Account Assets → Insight Tag.' } ],
      docLink:'https://www.linkedin.com/campaignmanager/' },
    { key:'mailchimp', name:'Mailchimp',           icon:'mail-fast',              color:'#FFE01B',
      desc:'Nieuwsbrief automatisering. Stuur leads naar uw mailing list.',
      fields:[
        { key:'apiKey', label:'API Key', type:'text', placeholder:'abc123-us21', hint:'Account → Profile → Extras → API keys.' },
        { key:'listId', label:'Audience (List) ID', type:'text', placeholder:'a1b2c3d4e5', hint:'In Mailchimp: Audience → Settings → Audience name and defaults.' }
      ],
      docLink:'https://mailchimp.com' }
  ];

  function renderIntegrations(){
    var grid = $('#integrations-grid');
    if (!grid) return;
    DATA.integrations = DATA.integrations || { analytics:{connected:false,id:''}, linkedin:{connected:false,id:''}, mailchimp:{connected:false,apiKey:'',listId:''} };

    var connected = INTEGRATIONS.filter(function(i){ return DATA.integrations[i.key] && DATA.integrations[i.key].connected; });
    var notConnected = INTEGRATIONS.filter(function(i){ return !DATA.integrations[i.key] || !DATA.integrations[i.key].connected; });

    grid.innerHTML = '';
    grid.innerHTML += '<div class="help-banner u-mb-20"><i class="ti ti-info-circle"></i><p>' + T('int_soon_notice') + '</p></div>';
    if (connected.length){
      grid.innerHTML += '<div style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--a-good);"><i class="ti ti-circle-check u-mr-6"></i>Verbonden · ' + connected.length + '</div>';
      grid.innerHTML += '<div class="grid-3 u-mb-24">' + connected.map(intCard).join('') + '</div>';
    }
    if (notConnected.length){
      grid.innerHTML += '<div style="margin:' + (connected.length?'8px':'0') + ' 0 14px;font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--a-muted-2);"><i class="ti ti-plug u-mr-6"></i>' + T('int_soon_section') + ' · ' + notConnected.length + '</div>';
      grid.innerHTML += '<div class="grid-3">' + notConnected.map(intCard).join('') + '</div>';
    }

    $$('[data-int-open]').forEach(function(card){
      card.addEventListener('click', function(){ openIntegrationDrawer(card.dataset.intOpen); });
    });
  }

  function intCard(i){
    var cfg = DATA.integrations[i.key] || {};
    var isConnected = cfg.connected;
    /* Stap 1 · eerlijk: niet-verbonden kaarten zijn niet-interactief + 'Binnenkort' (geen schijn-koppeling) */
    var wrapAttrs = isConnected
      ? ' style="padding:22px;cursor:pointer;transition:border-color .25s var(--a-ease), transform .25s var(--a-ease);" data-int-open="' + i.key + '" onmouseenter="this.style.borderColor=\'rgba(232,89,43,0.30)\';this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'\';this.style.transform=\'\'"'
      : ' style="padding:22px;opacity:.7;"';
    return '<div class="panel"' + wrapAttrs + '>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">' +
        '<i class="ti ti-' + i.icon + '" style="font-size:26px;color:' + i.color + ';"></i>' +
        (isConnected
          ? '<span class="tag" style="font-size:10px;font-weight:600;letter-spacing:.06em;padding:3px 10px;border-radius:100px;background:rgba(90,191,126,0.12);color:var(--a-good);border:1px solid rgba(90,191,126,0.30);"><i class="ti ti-circle-filled" style="font-size:7px;margin-right:5px;"></i>Verbonden</span>'
          : '<span class="tag" style="font-size:10px;font-weight:600;letter-spacing:.06em;padding:3px 10px;border-radius:100px;background:rgba(214,162,58,0.12);color:var(--a-warn,#D6A23A);border:1px solid rgba(214,162,58,0.30);">' + esc(T('int_soon_tag')) + '</span>') +
      '</div>' +
      '<h4 style="font-family:var(--a-serif);font-size:16px;font-weight:700;color:var(--a-off);letter-spacing:-.01em;margin-bottom:6px;">' + esc(i.name) + '</h4>' +
      '<p style="font-size:12px;color:var(--a-muted);line-height:1.6;margin-bottom:16px;">' + esc(i.desc) + '</p>' +
      '<button class="btn btn-ghost u-w100"' + (isConnected ? '' : ' disabled') + '>' +
        (isConnected ? '<i class="ti ti-settings"></i>Instellingen' : '<i class="ti ti-clock"></i>' + esc(T('int_soon_btn'))) +
      '</button>' +
    '</div>';
  }

  function openIntegrationDrawer(key){
    var i = INTEGRATIONS.find(function(x){return x.key===key;}); if (!i) return;
    var cfg = DATA.integrations[i.key] || {};

    var fieldsHtml = i.fields.map(function(f){
      var val = cfg[f.key] || '';
      return '<div class="field"><label>' + esc(f.label) + '</label>' +
        '<input data-int-field="' + esc(f.key) + '" type="' + f.type + '" value="' + esc(val) + '" placeholder="' + esc(f.placeholder) + '">' +
        '<div class="hint">' + esc(f.hint) + '</div></div>';
    }).join('');

    openDrawer(
      '<div class="drawer-head"><div><div class="eyebrow" style="color:' + i.color + ';">Integratie · ' + (cfg.connected ? 'verbonden' : 'koppelen') + '</div><h3><i class="ti ti-' + i.icon + '" style="color:' + i.color + ';margin-right:8px;"></i>' + esc(i.name) + '</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
      '<div class="drawer-body">' +
        '<p style="font-size:13px;color:var(--a-muted);line-height:1.7;margin-bottom:24px;">' + esc(i.desc) + '</p>' +
        '<div style="margin:0 0 16px;padding-top:18px;border-top:1px solid var(--a-div);font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--a-orange);"><i class="ti ti-key u-mr-6"></i>Toegangsgegevens</div>' +
        fieldsHtml +
        '<div class="help-banner u-mt-20">' +
          '<i class="ti ti-info-circle"></i>' +
          '<p><b>Hulp nodig?</b> Lees de officiële documentatie op <a class="u-c-orange" href="' + esc(i.docLink) + '" target="_blank">' + esc(i.docLink.replace('https://','')) + '</a> om uw gegevens te vinden.</p>' +
        '</div>' +
      '</div>' +
      '<div class="drawer-foot">' +
        '<button class="btn btn-primary" data-int-connect><i class="ti ti-' + (cfg.connected ? 'check' : 'plug-connected') + '"></i>' + (cfg.connected ? 'Opslaan' : 'Verbinden') + '</button>' +
        '<button class="btn btn-ghost" data-close><i class="ti ti-x"></i>Annuleer</button>' +
        (cfg.connected ? '<button class="btn btn-ghost is-danger u-ml-auto" data-int-disconnect><i class="ti ti-plug-off"></i>Ontkoppelen</button>' : '') +
      '</div>'
    );

    $('[data-int-connect]').addEventListener('click', function(){
      var newCfg = { connected:true };
      var allFilled = true;
      i.fields.forEach(function(f){
        var input = drawer.querySelector('[data-int-field="' + f.key + '"]');
        var val = input ? input.value.trim() : '';
        newCfg[f.key] = val;
        if (!val) allFilled = false;
      });
      if (!allFilled){ showToast('Vul alle velden in', 'alert-triangle'); return; }
      DATA.integrations[i.key] = newCfg;
      window.AdminData.save(DATA);
      closeDrawer();
      showToast(i.name + ' verbonden');
      renderIntegrations();
    });

    var disBtn = drawer.querySelector('[data-int-disconnect]');
    if (disBtn) disBtn.addEventListener('click', function(){
      if (!confirm('Ontkoppel "' + i.name + '"?\n\nDe verbinding wordt verbroken. Uw gegevens worden bewaard zodat u snel opnieuw kunt koppelen.')) return;
      DATA.integrations[i.key].connected = false;
      window.AdminData.save(DATA);
      closeDrawer();
      showToast(i.name + ' ontkoppeld');
      renderIntegrations();
    });
  }

  // ── Reset demo data ──────────────────────────────────────────
  $('[data-reset-demo]')?.addEventListener('click', function(){
    if (confirm('Demo-data terugzetten naar oorspronkelijke staat?')) {
      window.AdminData.reset();
      location.reload();
    }
  });

  // ── Re-render the active view's dynamic content when admin language changes ──
  document.addEventListener('admin:langchange', function(){
    try {
      var active = document.querySelector('.view.is-active');
      if (active){
        var id = active.id.replace('view-','');
        var fn = window['init_'+id];
        if (typeof fn === 'function') fn();
      }
    } catch(e){}
  });

  // ── Expose ───────────────────────────────────────────────────
  window.Admin = { showView:showView, openDrawer:openDrawer, closeDrawer:closeDrawer, showToast:showToast };

  /* ── Audit P12 — gedeelde bevestig-modal + undo-toast voor destructieve acties ──
     confirmDelete(opts) → Promise<bool>: gestylede modal i.p.v. kale confirm().
       opts: { name, title, message, confirmLabel, requireType }  (requireType = typ-woord voor extra-gevoelige deletes)
     undoToast(msg, onUndo) → toast met "Ongedaan maken" (7s) i.p.v. onherstelbaar verlies. */
  function confirmDelete(opts){
    opts = opts || {};
    var EN = aLang()==='en';
    // Audit P3 — deletes zijn admin-only (defense-in-depth; server is de echte gate).
    if (window.AdminRoles && window.AdminRoles.role && window.AdminRoles.role() !== 'admin'){
      showToast(EN?'Only an admin can delete this.':'Alleen een admin mag dit verwijderen.', 'alert-triangle');
      return Promise.resolve(false);
    }
    return new Promise(function(resolve){
      var title = opts.title || (EN ? 'Delete?' : 'Verwijderen?');
      var msg = opts.message || (EN
        ? 'You can undo this for a few seconds afterwards.'
        : 'U kunt dit daarna enkele seconden ongedaan maken.');
      var confirmLabel = opts.confirmLabel || (EN?'Delete':'Verwijder');
      var cancelLabel = EN?'Cancel':'Annuleer';
      var typeWord = opts.requireType || '';
      var back = document.createElement('div');
      back.className = 'cd-backdrop';
      back.innerHTML =
        '<div class="cd-modal" role="dialog" aria-modal="true" aria-labelledby="cd-title">' +
          '<div class="cd-ic"><i class="ti ti-alert-triangle"></i></div>' +
          '<h3 id="cd-title">'+esc(title)+'</h3>' +
          '<p>'+esc(msg)+(opts.name?(' <b>'+esc(opts.name)+'</b>'):'')+'</p>' +
          (typeWord ? '<label class="cd-type">'+(EN?'Type ':'Typ ')+'<b>'+esc(typeWord)+'</b>'+(EN?' to confirm':' om te bevestigen')+'<input type="text" id="cd-input" autocomplete="off" spellcheck="false"></label>' : '') +
          '<div class="cd-actions">' +
            '<button type="button" class="btn btn-ghost" data-cd-cancel>'+esc(cancelLabel)+'</button>' +
            '<button type="button" class="btn cd-danger" data-cd-ok'+(typeWord?' disabled':'')+'>'+esc(confirmLabel)+'</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(back);
      requestAnimationFrame(function(){ back.classList.add('is-open'); });
      var okBtn = back.querySelector('[data-cd-ok]');
      var input = back.querySelector('#cd-input');
      if (input){ input.focus(); input.addEventListener('input', function(){ okBtn.disabled = (input.value.trim() !== typeWord); }); }
      else { okBtn.focus(); }
      function close(val){ back.classList.remove('is-open'); document.removeEventListener('keydown', onKey); setTimeout(function(){ if(back.parentNode) back.parentNode.removeChild(back); }, 200); resolve(val); }
      back.querySelector('[data-cd-cancel]').addEventListener('click', function(){ close(false); });
      okBtn.addEventListener('click', function(){ if(okBtn.disabled) return; close(true); });
      back.addEventListener('click', function(e){ if(e.target===back) close(false); });
      function onKey(e){ if(e.key==='Escape'){ close(false); } else if(e.key==='Enter' && !okBtn.disabled){ close(true); } }
      document.addEventListener('keydown', onKey);
    });
  }
  function undoToast(message, onUndo, ms){
    var EN = aLang()==='en';
    _pushToast('<i class="ti ti-trash"></i><span>'+esc(message)+'</span><button type="button" class="toast-undo">'+(EN?'Undo':'Ongedaan maken')+'</button>', { duration: ms||7000, onUndo: onUndo });
  }
  window.Admin.confirmDelete = confirmDelete;
  window.Admin.undoToast = undoToast;
  window.Admin.kbdActivable = kbdActivable;

  /* ── publishToSite(key, data, onDone) — write-bridge to Supabase (KRITIEK #1) ──
     Sends content to /api/admin-content (HMAC-protected). Falls back gracefully
     if backend is inert (dev mode / K1 not configured). */
  window.publishToSite = function(key, data, onDone) {
    var sess; try { sess = JSON.parse(sessionStorage.getItem('admin.session') || '{}'); } catch(e){ sess = {}; }
    if (!sess || !sess.token) {
      showToast(T('pub_toast_noauth'), 'warn');
      if (typeof onDone === 'function') onDone(false);
      return;
    }
    fetch('/api/admin-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sess.token, key: key, data: data })
    })
      .then(function(r){ return r.json().then(function(d){ return { status: r.status, d: d }; }); })
      .then(function(x){
        if (x.status === 200 && x.d && x.d.ok) {
          showToast(T('pub_toast_saved'), 'ok');
          /* Stap 1 · eerlijke status: opgeslagen in de content-store; live zodra de read-bridge actief is */
          var banners = document.querySelectorAll('.sync-banner');
          banners.forEach(function(b){
            var view = b.closest('.view');
            if (view && view.classList.contains('is-active')) {
              b.style.background = 'rgba(214,162,58,.10)';
              b.style.borderColor = 'rgba(214,162,58,.35)';
              var ts = new Date().toLocaleTimeString(aLang()==='en'?'en-GB':'nl-BE',{hour:'2-digit',minute:'2-digit'});
              b.innerHTML = '<i class="ti ti-clock" style="color:#D6A23A;font-size:16px;"></i><p><strong>' + T('pub_banner_pre') + ts + '</strong>' + T('pub_banner_post') + '</p>';
            }
          });
          if (typeof onDone === 'function') onDone(true, x.d);
        } else if (x.status === 503) {
          showToast(T('pub_toast_inert'), 'warn');
          if (typeof onDone === 'function') onDone(false, x.d);
        } else {
          showToast(T('pub_toast_error') + (x.d && x.d.error || x.status), 'error');
          if (typeof onDone === 'function') onDone(false, x.d);
        }
      })
      .catch(function(){ showToast(T('pub_toast_offline'), 'warn'); if (typeof onDone === 'function') onDone(false); });
  };

  /* ── Nr 3: Live LEADS bridge (CRM Supabase) ── */
  (function leadsDataBridge(){
    var sess; try { sess = JSON.parse(sessionStorage.getItem('admin.session') || '{}'); } catch(e){ sess = {}; }
    if (!sess || !sess.token) return;
    fetch('/api/admin-leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sess.token, action: 'list', limit: 500 })
    })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(out){
        if (!out || !out.ok || !Array.isArray(out.leads)) return;
        window.__leadsBridgeActive = true;
        DATA.leads = out.leads.map(function(l){
          return {
            id: l.id, name: l.name||'', org: l.org||'', email: l.email||'',
            phone: l.phone||'', stage: l.stage||'new', source: l.source||'contact',
            value: l.value||'', notes: l.notes||'',
            ts: l.created_at ? String(l.created_at).replace('T',' ').slice(0,16) : ''
          };
        });
        window.AdminData.save(DATA);
        var cur = (location.hash || '#overview').replace(/^#/, '').split('?')[0] || 'overview';
        if (cur === 'leads') { try { window.init_leads(); } catch(e){} }
        if (cur === 'overview') { try { window.init_overview(); } catch(e){} }
        if (window.Admin && window.Admin.updateSidebarBadges) window.Admin.updateSidebarBadges();
      })
      .catch(function(){});
  })();

  /* ── #A/#B: Health check → system alert banner ── */
  (function healthCheck(){
    fetch('/api/health', { method: 'GET' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(h){
        if (!h) return;
        var banner = document.getElementById('system-alert');
        var msg    = document.getElementById('system-alert-msg');
        if (!banner || !msg) return;
        var issues = [];
        if (h.services && h.services.supabase && !h.services.supabase.ok)
          issues.push('<b>Supabase onbereikbaar</b> — leads worden NIET opgeslagen. Check de env-variabelen.');
        if (h.services && h.services.resend && !h.services.resend.configured)
          issues.push('<b>E-mail inert</b> — RESEND_API_KEY ontbreekt. Bezoekers ontvangen geen bevestigingen.');
        if (h.services && h.services.graph && !h.services.graph.configured)
          issues.push('<b>Agenda inert</b> — MS Graph-sleutels ontbreken. Boekingen worden niet in Outlook aangemaakt.');
        if (issues.length) {
          msg.innerHTML = issues.join(' &nbsp;·&nbsp; ');
          banner.style.display = 'flex';
        }
      })
      .catch(function(){ /* health endpoint unreachable — skip */ });
  })();

  /* ── window.gdprDeleteSilent — stille server-delete (UI is al bijgewerkt) ── */
  window.gdprDeleteSilent = function(table, id, email) {
    var sess; try { sess = JSON.parse(sessionStorage.getItem('admin.session') || '{}'); } catch(e){ sess = {}; }
    if (!sess || !sess.token) return;
    fetch('/api/admin-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sess.token, table: table, id: id, reason: 'GDPR Art. 17 — right to erasure — initiated by ' + (sess.email||'admin') })
    })
      .then(function(r){ return r.json().then(function(d){ return { status: r.status, d: d }; }); })
      .then(function(x){
        if (x.status === 200 && x.d.ok) { showToast('✓ Verwijderd.', 'ok'); }
        else if (x.status === 503) { /* inert: lokaal al weg, niets doen */ }
        else { showToast('Serverfout bij verwijderen — herlaad om te controleren.', 'warn'); }
      })
      .catch(function(){ showToast('Netwerk fout — herlaad om te controleren.', 'warn'); });
  };

  /* ── window.gdprDelete — GDPR Art. 17 data erasure helper ── */
  window.gdprDelete = function(table, id, email, onSuccess) {
    var sess; try { sess = JSON.parse(sessionStorage.getItem('admin.session') || '{}'); } catch(e){ sess = {}; }
    if (!sess || !sess.token) { showToast('Niet ingelogd.', 'warn'); return; }
    if (sess.role !== 'admin') { showToast('Alleen Admin-rol kan data permanent verwijderen.', 'warn'); return; }
    window.Admin.confirmDelete({ name:(email||id), title:'GDPR Art. 17 — permanent verwijderen', message:'Dit verwijdert álle data van deze persoon onherroepelijk (server-side).', requireType:(email||'VERWIJDER'), confirmLabel:'Permanent verwijderen' }).then(function(ok){
      if(!ok) return;
      fetch('/api/admin-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sess.token, table: table, id: id, reason: 'GDPR Art. 17 — right to erasure — initiated by ' + (sess.email||'admin') })
      })
        .then(function(r){ return r.json().then(function(d){ return { status: r.status, d: d }; }); })
        .then(function(x){
          if (x.status === 200 && x.d.ok) {
            showToast('✓ Gegevens van ' + (x.d.deleted.email||id) + ' permanent verwijderd.', 'ok');
            if (typeof onSuccess === 'function') onSuccess();
          } else if (x.status === 503) {
            showToast('Backend inert — Supabase niet geconfigureerd.', 'warn');
          } else if (x.status === 403) {
            showToast('Alleen Admin-rol mag data verwijderen.', 'warn');
          } else {
            showToast('Fout: ' + (x.d && x.d.error || x.status), 'error');
          }
        })
        .catch(function(){ showToast('Netwerk fout bij verwijderen.', 'error'); });
    });
  };

  // ── Live data bridge (FASE 2 · taak 04) ──────────────────────
  // Reads REAL calculator submissions from Supabase via /api/admin-submissions
  // (server-side, token-gated). Any non-200 (backend inert / local dev) → keep mock data.
  (function liveDataBridge(){
    var sess; try { sess = JSON.parse(sessionStorage.getItem('admin.session') || '{}'); } catch(e){ sess = {}; }
    if (!sess || !sess.token) return;
    fetch('/api/admin-submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sess.token })
    })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(out){
        if (!out || !out.ok || !Array.isArray(out.submissions)) return; // inert → mock stays
        DATA.submissions = DATA.submissions || {};
        DATA.submissions.calculator = out.submissions;
        // Re-render the currently active view so live leads show immediately.
        var cur = (location.hash || '#overview').replace(/^#/, '').split('?')[0] || 'overview';
        var initFn = window['init_' + cur];
        if (typeof initFn === 'function') { try { initFn(); } catch(e){} }
        try { tryOpenDeeplink(); } catch(e){}
      })
      .catch(function(){ /* network/inert → keep mock */ });

    /* ── HOOG #3: Live form-submissions bridge (fitcheck / contact / casey) ── */
    fetch('/api/admin-form-submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sess.token })
    })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(out){
        if (!out || !out.ok) return; // inert → mock stays
        DATA.submissions = DATA.submissions || {};
        if (Array.isArray(out.submissions.fitcheck))  DATA.submissions.fitcheck  = out.submissions.fitcheck;
        if (Array.isArray(out.submissions.contact))   DATA.submissions.contact   = out.submissions.contact;
        if (Array.isArray(out.submissions.casey))     DATA.submissions.casey     = out.submissions.casey;
        if (Array.isArray(out.submissions.booking))   DATA.submissions.booking   = out.submissions.booking;
        var cur = (location.hash || '#overview').replace(/^#/, '').split('?')[0] || 'overview';
        var initFn = window['init_' + cur];
        if (typeof initFn === 'function') { try { initFn(); } catch(e){} }
      })
      .catch(function(){ /* inert → keep mock */ });

    /* ── MEDIUM #5: CSV export helper (global) ── */
    window.exportCsv = function(rows, filename) {
      if (!rows || !rows.length) return;
      var headers = Object.keys(rows[0]);
      var csv = [headers.join(',')].concat(rows.map(function(r){
        return headers.map(function(h){
          var val = String(r[h] == null ? '' : r[h]).replace(/"/g, '""');
          return val.includes(',') || val.includes('\n') || val.includes('"') ? '"'+val+'"' : val;
        }).join(',');
      })).join('\n');
      var blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename || 'export.csv';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
    };
  })();
})();
