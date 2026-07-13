/* ═══════════════════════════════════════════════════════════════════
   Montisoro motion — editorial cinematic runtime
   - Auto-cascade: chapter sections orchestrate child reveals in order
   - Auto stagger: grid containers
   - Headline line-splitting: big editorial titles reveal line-by-line
   - rAF parallax: SVG canvases & images drift slowly on scroll
   - IntersectionObserver triggers .is-in
═══════════════════════════════════════════════════════════════════ */
(function(){
  if (window.__montisoroMotion) return;
  window.__montisoroMotion = true;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ──── Selectors ────
  var SECTION_SELS = [
    '.chapter', '.hero', '.hero-statement', '.calc-banner', '.workspace',
    '.premium-section', '.method-note', '.action-chapter', '.logos-wrap'
  ];
  var GROUP_SELS = [
    '.strengths-grid', '.testimonial-grid', '.foundation-grid', '.stats-grid',
    '.origin-grid', '.method-grid', '.pillars-grid', '.feature-grid', '.team-grid',
    '.role-grid', '.principles-list', '.contrast-grid', '.channels-grid', '.kpi-grid',
    '.tone-grid', '.trust-strip'
  ];
  var TIGHT_SELS = ['.storm-pillrow', '.casey-pills', '.access-bullets', '.pillars-tagline'];
  var HEADLINE_SELS = [
    '.hero-headline', '.hs-headline', '.banner-headline', '.reintegrate',
    '.manifesto-statement', '.mission-statement'
  ];
  var PARALLAX_SELS = [
    '.hs-canvas', '.calc-banner-canvas', '.right-canvas', '.hero-canvas',
    '.s-card-bg', '.casey-bg', '.content-bg', '.right-canvas', '.manifesto-bg',
    '.output-bg', '.premium-bg', '.office-bg', '.channel-svg-bg',
    '.founder-photo img', '.hero-photo img', '.photo-side img'
  ];

  // ──── Headline line splitting ────
  // Splits text content by <br> into <span class="line"><span class="line-inner">...</span></span>
  // Preserves inline children like <em>.
  function splitHeadline(el){
    if (el.dataset.lineSplit === 'done') return;
    var children = Array.from(el.childNodes);
    var lines = [[]];
    children.forEach(function(node){
      if (node.nodeName === 'BR'){
        lines.push([]);
      } else {
        lines[lines.length-1].push(node);
      }
    });
    if (lines.length < 2) return; // no <br>, skip
    el.innerHTML = '';
    lines.forEach(function(parts){
      if (parts.length === 0) return;
      var lineSpan = document.createElement('span');
      lineSpan.className = 'line';
      var innerSpan = document.createElement('span');
      innerSpan.className = 'line-inner';
      parts.forEach(function(p){ innerSpan.appendChild(p); });
      lineSpan.appendChild(innerSpan);
      el.appendChild(lineSpan);
    });
    el.classList.add('line-reveal');
    el.dataset.lineSplit = 'done';
  }

  function autoMark(){
    // Chapter-level: cascade
    SECTION_SELS.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if (!el.hasAttribute('data-cascade')) el.setAttribute('data-cascade', '');
        if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', 'fade');
      });
    });
    // Grid containers: stagger group
    GROUP_SELS.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if (!el.hasAttribute('data-reveal-group')) el.setAttribute('data-reveal-group', '');
      });
    });
    // Tight inline groups
    TIGHT_SELS.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if (!el.hasAttribute('data-reveal-group')) el.setAttribute('data-reveal-group', 'tight');
      });
    });
    // Headline line splitting
    HEADLINE_SELS.forEach(function(sel){
      document.querySelectorAll(sel).forEach(splitHeadline);
    });
    // Parallax-able backgrounds — SVG canvases get standard speed,
    // founder/hero photos get a slower, more cinematic drift
    PARALLAX_SELS.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if (!el.hasAttribute('data-parallax')){
          // Images drift slower than SVG canvases — feels like depth, not motion
          var isImage = el.tagName === 'IMG';
          el.setAttribute('data-parallax', isImage ? '0.045' : '0.08');
        }
      });
    });
  }

  // ──── Intersection ────
  function observe(){
    var targets = document.querySelectorAll('[data-reveal], [data-reveal-group], [data-cascade], .line-reveal');
    if (!targets.length) return;

    if (reduced){
      targets.forEach(function(el){ el.classList.add('is-in'); });
      return;
    }
    if (!('IntersectionObserver' in window)){
      targets.forEach(function(el){ el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(function(el){
      // If already mostly above the fold, reveal immediately (no flash)
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92){
        // small delay so initial paint completes
        setTimeout(function(){ el.classList.add('is-in'); }, 30);
      } else {
        io.observe(el);
      }
    });
  }

  // ──── Parallax — rAF, scroll-linked ────
  function parallax(){
    if (reduced) return;
    var pxEls = Array.from(document.querySelectorAll('[data-parallax]'));
    if (!pxEls.length) return;

    var vh = window.innerHeight;
    var ticking = false;

    function update(){
      vh = window.innerHeight;
      pxEls.forEach(function(el){
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.08;
        var rect = el.getBoundingClientRect();
        // Only animate when near viewport
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        var center = rect.top + rect.height / 2 - vh / 2;
        var off = -center * speed;
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    function onScroll(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function(){
      vh = window.innerHeight;
      onScroll();
    }, { passive: true });
    update();
  }

  // ──── Init ────
  function init(){
    autoMark();
    observe();
    parallax();
    founderReveal();
    calendarWizard();
    localizeNavLinks();
    mobileNav();
    accordion();
    langSwitcher();
    activeNav();
    countUp();
    stickyCta();
    cookieBanner();
  }

  // ──── EN nav/footer taal-vangnet ────
  // Op een EN-pagina (-en.html) krijgt elke statische nav-/logo-/footer-link die
  // naar een NL-pagina wijst automatisch z'n -en-equivalent. Zo kan een EN-pagina
  // de bezoeker nooit terug naar Nederlands sturen, ook als de HTML het mis heeft
  // (zoals contact-en eerder). De taalknop wijst bewust NL → uitgesloten; draait
  // vóór langSwitcher (die de knop pas erna injecteert) en is idempotent.
  function localizeNavLinks(){
    var path = location.pathname.split('/').pop() || '';
    if (!/-en(?:\.html)?$/i.test(path)) return;                 // alleen EN-pagina's
    var NL2EN = {'Home':'home-en','about':'about-en','aanpak':'approach-en','technologie':'technology-en','calculator':'calculator-en','fit-check':'fit-check-en','contact':'contact-en','privacy':'privacy-en','disclaimer':'disclaimer-en','FAQ':'faq-en','Referentie':'references-en','referentie-case':'reference-case-en','referentie-case-alcon':'reference-case-alcon-en','referentie-case-feneko':'reference-case-feneko-en','referentie-case-lonza':'reference-case-lonza-en','referentie-case-novartis':'reference-case-novartis-en'};
    document.querySelectorAll('.m-nav-links a, a.m-nav-logo, .m-footer a, .ms-footer a').forEach(function(a){
      if (a.classList.contains('m-lang-btn') || a.classList.contains('m-lang-opt') || (a.closest && a.closest('.m-lang'))) return;
      var href = a.getAttribute('href');
      if (!href) return;
      var m = href.match(/^([A-Za-z-]+)\.html(#.*)?$/);     // kale paginalink, bv about.html#x
      if (!m || !NL2EN[m[1]]) return;                       // geen bekende NL-paginalink
      a.setAttribute('href', NL2EN[m[1]] + '.html' + (m[2] || ''));
    });
  }

  // ──── Active nav state (L4) ────
  // Marks the nav link for the current page so users always know where
  // they are. Uses the existing .m-active style + aria-current.
  function activeNav(){
    function norm(p){
      p = (p || '').split('#')[0].split('?')[0].split('/').pop().toLowerCase();
      p = p.replace(/\.html$/, '');
      if (p === '' || p === 'index') p = 'home';
      return p;
    }
    function isHome(k){ return k === 'home' || k === 'home-en'; }
    var path = norm(location.pathname);
    document.querySelectorAll('.m-nav-links a').forEach(function(a){
      if (a.classList.contains('m-cta') || a.classList.contains('m-lang-btn') || a.classList.contains('m-lang-opt')) return;
      var href = norm(a.getAttribute('href'));
      if (href && (href === path || (isHome(path) && isHome(href)))){
        a.classList.add('m-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  // ──── Count-up (L1) ────
  // Any element with [data-countup] animates from 0 to its target the
  // first time it enters view. Optional attributes:
  //   data-countup="1240"      explicit target (else parsed from text)
  //   data-countup-prefix="€"  data-countup-suffix="%"  data-countup-dec="1"
  function countUp(){
    var els = document.querySelectorAll('[data-countup]');
    if (!els.length) return;

    function run(el){
      var raw = el.getAttribute('data-countup');
      var target = parseFloat(raw);
      if (isNaN(target)){
        target = parseFloat((el.textContent || '').replace(/[^0-9.,]/g,'').replace(',', '.'));
      }
      if (isNaN(target)) return;
      var dec = parseInt(el.getAttribute('data-countup-dec') || '0', 10);
      var pre = el.getAttribute('data-countup-prefix') || '';
      var suf = el.getAttribute('data-countup-suffix') || '';
      var dur = 1400, start = null;
      function fmt(v){
        var s = dec > 0 ? v.toFixed(dec).replace('.', ',') : Math.round(v).toLocaleString('nl-BE');
        return pre + s + suf;
      }
      function step(ts){
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = fmt(target);
      }
      requestAnimationFrame(step);
    }

    if (reduced || !('IntersectionObserver' in window)){ return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    els.forEach(function(el){ io.observe(el); });
  }

  // ──── Sticky mobile CTA bar (M4) ────
  // Content pages only — the tool/utility/legal pages have their own
  // primary action and shouldn't be covered.
  function stickyCta(){
    /* Uitgeschakeld op verzoek — geen zwevende mobiele CTA-balk meer. */
    return;
    var path = (location.pathname.split('/').pop() || 'Home.html').toLowerCase();
    var EXCLUDE = ['contact.html','contact-en.html','calculator.html','calculator-en.html',
                   'fit-check.html','fit-check-en.html','privacy.html','privacy-en.html',
                   'disclaimer.html','disclaimer-en.html','404.html'];
    if (EXCLUDE.indexOf(path) >= 0) return;
    if (document.querySelector('.m-sticky-cta')) return;

    var isEN = /-en(?:\.html)?$/i.test(path);
    var target = isEN ? 'contact-en.html#channels' : 'contact.html#channels';
    var label = isEN ? 'Book a conversation' : 'Plan een gesprek';

    var bar = document.createElement('div');
    bar.className = 'm-sticky-cta';
    bar.innerHTML = '<a href="' + target + '"><i class="ph-light ph-calendar-check"></i>' + label + ' <span aria-hidden="true">→</span></a>';
    document.body.appendChild(bar);
    document.body.classList.add('has-sticky-cta');

    // Reveal once the user has scrolled past the hero
    function onScroll(){
      if (window.scrollY > window.innerHeight * 0.6){ bar.classList.add('is-shown'); }
      else { bar.classList.remove('is-shown'); }
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
  }

  // ──── Inline form feedback (M2) — global helper, replaces alert() ────
  // MForm.invalid(input, msg)  → red ring + inline message under the field
  // MForm.notify(msg, ok)      → branded top notice (form-level)
  // MForm.clear(scope)         → remove invalid states/messages
  var MForm = (function(){
    var noticeEl = null, noticeTimer = null;
    function clear(scope){
      var root = scope || document;
      root.querySelectorAll('[aria-invalid="true"]').forEach(function(el){
        el.removeAttribute('aria-invalid');
      });
      root.querySelectorAll('.m-field-msg').forEach(function(el){ el.remove(); });
    }
    function invalid(input, msg){
      if (!input) { notify(msg); return; }
      input.setAttribute('aria-invalid', 'true');
      // place message after the input's field wrapper if present, else after input
      var anchor = input.closest('.field') || input;
      var existing = anchor.parentNode && anchor.parentNode.querySelector(':scope > .m-field-msg');
      var m = document.createElement('div');
      m.className = 'm-field-msg';
      m.textContent = msg || 'Controleer dit veld.';
      if (anchor.parentNode){ anchor.parentNode.insertBefore(m, anchor.nextSibling); }
      var onFix = function(){
        input.removeAttribute('aria-invalid');
        if (m.parentNode) m.remove();
        input.removeEventListener('input', onFix);
        input.removeEventListener('change', onFix);
      };
      input.addEventListener('input', onFix);
      input.addEventListener('change', onFix);
      try { input.focus({ preventScroll:false }); } catch(e){ input.focus(); }
    }
    function notify(msg, ok){
      if (!noticeEl){
        noticeEl = document.createElement('div');
        noticeEl.className = 'm-notify';
        noticeEl.setAttribute('role', 'alert');
        document.body.appendChild(noticeEl);
      }
      noticeEl.className = 'm-notify' + (ok ? ' is-ok' : '');
      noticeEl.innerHTML = '<i class="m-notify-ic ' + (ok ? 'ph-light ph-check-circle' : 'ph-light ph-warning') + '"></i><div>' + msg + '</div>';
      // force reflow then show
      void noticeEl.offsetWidth;
      noticeEl.classList.add('is-shown');
      if (noticeTimer) clearTimeout(noticeTimer);
      noticeTimer = setTimeout(function(){ noticeEl.classList.remove('is-shown'); }, 5200);
    }
    return { invalid:invalid, notify:notify, clear:clear };
  })();
  window.MForm = MForm;

  // ──── Accordion / expandable content ────
  var __accId = 0;
  function accordion(){
    document.querySelectorAll('.m-accordion .m-acc-head').forEach(function(head){
      if (head.__accordionBound) return;
      head.__accordionBound = true;
      var item = head.closest('.m-accordion');
      var body = item ? item.querySelector('.m-acc-body') : null;
      // ARIA-koppeling head ↔ body (a11y-audit F-2): screenreader weet welk paneel
      // de knop bestuurt, en het paneel krijgt een regio-rol met de knop als label.
      if (body){
        __accId++;
        var hid = head.id || ('m-acc-h-' + __accId);
        var bid = body.id || ('m-acc-b-' + __accId);
        head.id = hid; body.id = bid;
        head.setAttribute('aria-controls', bid);
        if (!body.hasAttribute('role')) body.setAttribute('role', 'region');
        body.setAttribute('aria-labelledby', hid);
      }
      head.setAttribute('aria-expanded', item.classList.contains('is-open') ? 'true' : 'false');
      head.addEventListener('click', function(){
        var willOpen = !item.classList.contains('is-open');
        item.classList.toggle('is-open', willOpen);
        head.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
    });
  }

  // ──── Language switcher — site-wide, same position everywhere ────
  function langSwitcher(){
    var nav = document.querySelector('.m-nav-links');
    if (!nav) return;
    if (nav.querySelector('.m-lang')) return; // idempotent

    var path = location.pathname.split('/').pop() || '';
    if (!path || path === '/') path = 'Home.html';
    var isEN = /-en(?:\.html)?$/i.test(path);

    var labelShort = isEN ? 'NL' : 'EN';
    var labelLong  = isEN ? 'Nederlands' : 'English';

    // Canonieke basis per pagina + het NL/EN schone-URL-paar (EN-slugs zijn Engels).
    var PAIRS = {
      'home':{nl:'/',en:'/home-en'},
      'about':{nl:'/about',en:'/about-en'},
      'aanpak':{nl:'/aanpak',en:'/approach-en'},
      'technologie':{nl:'/technologie',en:'/technology-en'},
      'calculator':{nl:'/calculator',en:'/calculator-en'},
      'fit-check':{nl:'/fit-check',en:'/fit-check-en'},
      'contact':{nl:'/contact',en:'/contact-en'},
      'privacy':{nl:'/privacy',en:'/privacy-en'},
      'disclaimer':{nl:'/disclaimer',en:'/disclaimer-en'},
      'faq':{nl:'/faq',en:'/faq-en'},
      'referentie':{nl:'/referentie',en:'/references-en'},
      'referentie-case':{nl:'/referentie-case',en:'/reference-case-en'},
      'referentie-case-alcon':{nl:'/referentie-case-alcon',en:'/reference-case-alcon-en'},
      'referentie-case-feneko':{nl:'/referentie-case-feneko',en:'/reference-case-feneko-en'},
      'referentie-case-lonza':{nl:'/referentie-case-lonza',en:'/reference-case-lonza-en'},
      'referentie-case-novartis':{nl:'/referentie-case-novartis',en:'/reference-case-novartis-en'}
    };
    // elke mogelijke slug (NL, oud-EN, nieuw-EN) → canonieke basis
    var KEYMAP = {
      'home':'home','home-en':'home','index':'home',
      'about':'about','about-en':'about',
      'aanpak':'aanpak','aanpak-en':'aanpak','approach-en':'aanpak','approach':'aanpak',
      'technologie':'technologie','technologie-en':'technologie','technology-en':'technologie','technology':'technologie',
      'calculator':'calculator','calculator-en':'calculator',
      'fit-check':'fit-check','fit-check-en':'fit-check',
      'contact':'contact','contact-en':'contact',
      'privacy':'privacy','privacy-en':'privacy',
      'disclaimer':'disclaimer','disclaimer-en':'disclaimer',
      'faq':'faq','faq-en':'faq',
      'referentie':'referentie','referentie-en':'referentie','references-en':'referentie','references':'referentie',
      'referentie-case':'referentie-case','referentie-case-en':'referentie-case','reference-case-en':'referentie-case',
      'referentie-case-alcon':'referentie-case-alcon','referentie-case-alcon-en':'referentie-case-alcon','reference-case-alcon-en':'referentie-case-alcon',
      'referentie-case-feneko':'referentie-case-feneko','referentie-case-feneko-en':'referentie-case-feneko','reference-case-feneko-en':'referentie-case-feneko',
      'referentie-case-lonza':'referentie-case-lonza','referentie-case-lonza-en':'referentie-case-lonza','reference-case-lonza-en':'referentie-case-lonza',
      'referentie-case-novartis':'referentie-case-novartis','referentie-case-novartis-en':'referentie-case-novartis','reference-case-novartis-en':'referentie-case-novartis'
    };
    var key = path.replace(/\.html$/i, '').toLowerCase();
    var baseKey = KEYMAP[key] || 'home';
    var pair = PAIRS[baseKey] || PAIRS['home'];
    var target = isEN ? pair.nl : pair.en;

    // 1) Home — first item (mobile overlay only; hidden on desktop via CSS).
    //    activeNav() runs next and marks it .m-active on the Home page.
    if (!nav.querySelector('.m-home-only')){
      var homeLi = document.createElement('li');
      homeLi.className = 'm-home-only';
      var homeA = document.createElement('a');
      homeA.href = isEN ? '/home-en' : '/';
      homeA.textContent = 'Home';
      homeLi.appendChild(homeA);
      nav.insertBefore(homeLi, nav.firstChild);
    }

    // (2) CTA eyebrow removed per design — the mobile CTA stands on its own.

    // 3) Language switch — desktop single toggle + mobile two-option, one <li>.
    var li = document.createElement('li');
    li.className = 'm-lang';

    var a = document.createElement('a');                 // desktop (unchanged)
    a.className = 'm-lang-btn';
    a.href = target;
    a.setAttribute('aria-label', 'Switch language to ' + labelLong);
    a.innerHTML = '<i class="ph-light ph-globe"></i><span class="lang-short">' + labelShort + '</span><span class="lang-long">' + labelLong + '</span>';
    li.appendChild(a);

    var mob = document.createElement('span');            // mobile overlay
    mob.className = 'm-lang-mob';
    mob.setAttribute('role', 'group');
    mob.setAttribute('aria-label', isEN ? 'Choose language' : 'Taal kiezen');
    var nlOpt = isEN
      ? '<a class="m-lang-opt" href="' + target + '" aria-label="Nederlands" hreflang="nl">NL</a>'
      : '<span class="m-lang-opt on" aria-current="true" aria-label="Nederlands">NL</span>';
    var enOpt = isEN
      ? '<span class="m-lang-opt on" aria-current="true" aria-label="English">EN</span>'
      : '<a class="m-lang-opt" href="' + target + '" aria-label="English" hreflang="en">EN</a>';
    mob.innerHTML = nlOpt + '<span class="m-lang-dot" aria-hidden="true">\u00b7</span>' + enOpt;
    li.appendChild(mob);

    nav.appendChild(li);
  }

  // ──── Mobile nav drawer ────
  function mobileNav(){
    var hamburger = document.querySelector('.m-hamburger');
    var navLinks  = document.querySelector('.m-nav-links');
    if (!hamburger || !navLinks) return;
    if (!navLinks.id) navLinks.id = 'm-nav-links';
    hamburger.setAttribute('aria-controls', navLinks.id);
    hamburger.setAttribute('aria-haspopup', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    var lastFocus = null;

    function setIcon(open){ var i = hamburger.querySelector('i'); if (i) i.className = open ? 'ph ph-x' : 'ph ph-list'; }
    function focusables(){
      return [hamburger].concat(Array.prototype.slice.call(navLinks.querySelectorAll('a[href],button:not([disabled])')))
        .filter(function(el){ return el.offsetParent !== null; });
    }
    function openMenu(){
      lastFocus = document.activeElement;
      navLinks.classList.add('m-open');
      hamburger.classList.add('is-open');
      document.body.classList.add('m-menu-open');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Menu sluiten');
      setIcon(true);
      // Move focus to the close control (the hamburger now shows ×) — reliable,
      // good a11y, and avoids putting a visible focus/hover state on a nav item.
      setTimeout(function(){ hamburger.focus(); }, 80);
    }
    function closeMenu(restore){
      navLinks.classList.remove('m-open');
      hamburger.classList.remove('is-open');
      document.body.classList.remove('m-menu-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Menu');
      setIcon(false);
      if (restore !== false && lastFocus && lastFocus.focus) lastFocus.focus();
    }

    hamburger.addEventListener('click', function(){
      if (navLinks.classList.contains('m-open')) closeMenu(); else openMenu();
    });
    // Close on link click (event delegation) or a click on the empty backdrop.
    navLinks.addEventListener('click', function(e){
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (a && navLinks.contains(a)) { closeMenu(false); }      // navigation moves focus
      else if (e.target === navLinks) { closeMenu(); }          // click outside the items
    });
    // ESC closes; Tab is trapped while open.
    document.addEventListener('keydown', function(e){
      if (!navLinks.classList.contains('m-open')) return;
      if (e.key === 'Escape' || e.keyCode === 27){ closeMenu(); return; }
      if (e.key === 'Tab' || e.keyCode === 9){
        var f = focusables(); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    });
  }

  // ──── Cookie consent — GDPR, granular, two-step (intro ↔ preferences) ────
  // Storage: localStorage['montisoro.cookie.v2'] =
  //   { v:2, choice:'accept'|'custom'|'reject', categories:{functional,analytics,marketing,performance}, ts }
  // Public API: window.MontisoroConsent { get, has(cat), open(), reset(), onChange(cb) }
  // Gate future tags like:  if (MontisoroConsent.has('analytics')) { /* load GA */ }
  function cookieBanner(){
    var KEY = 'montisoro.cookie.v2';
    var listeners = [];
    var isEN = /-en\.html$/i.test((location.pathname.split('/').pop() || ''));

    var CATS = [
      { id:'functional',  locked:true  },
      { id:'analytics',   locked:false },
      { id:'marketing',   locked:false },
      { id:'performance', locked:false }
    ];

    var T = isEN ? {
      eyebrow:'Privacy', title:'We respect your privacy.',
      intro:'We use functional cookies so the site works. Other cookies are only used with your consent. ',
      policy:'Privacy policy', acceptAll:'Accept all', manage:'Manage preferences',
      panelTitle:'Cookie preferences', panelIntro:'Choose which cookies we may use. You can change this at any time.',
      saveSel:'Save selection', rejectAll:'Reject all', always:'Always on', reopen:'Cookie preferences',
      cats:{
        functional:['Functional cookies','Essential for the basic operation of the site.'],
        analytics:['Analytics cookies','Help us understand anonymously how the site is used.'],
        marketing:['Marketing cookies','Used to tailor relevant content and campaigns.'],
        performance:['Performance cookies','Measure load time and stability to improve the site.']
      }
    } : {
      eyebrow:'Privacy', title:'Wij respecteren uw privacy.',
      intro:'Functionele cookies zijn nodig om de site te laten werken. Andere cookies gebruiken we alleen met uw toestemming. ',
      policy:'Privacybeleid', acceptAll:'Accepteer alle', manage:'Voorkeuren beheren',
      panelTitle:'Cookievoorkeuren', panelIntro:'Kies welke cookies we mogen gebruiken. U kunt dit altijd aanpassen.',
      saveSel:'Selectie opslaan', rejectAll:'Alles weigeren', always:'Altijd actief', reopen:'Cookievoorkeuren',
      cats:{
        functional:['Functionele cookies','Noodzakelijk voor de basiswerking van de site.'],
        analytics:['Analytische cookies','Helpen ons anoniem te begrijpen hoe de site gebruikt wordt.'],
        marketing:['Marketingcookies','Gebruikt om relevante content en campagnes af te stemmen.'],
        performance:['Prestatiecookies','Meten laadtijd en stabiliteit om de site te verbeteren.']
      }
    };
    var POLICY = isEN ? 'https://www.montisoro.com/en/privacy_statement'
                      : 'https://www.montisoro.com/nl/privacy_statement';

    function read(){ try { return JSON.parse(localStorage.getItem(KEY)); } catch(e){ return null; } }
    function persist(choice, cats){
      var rec = { v:2, choice:choice, categories:cats, ts:new Date().toISOString() };
      try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch(e){}
      if (window.dataLayer) window.dataLayer.push({ event:'cookie_consent', choice:choice, cookie_categories:cats });
      listeners.forEach(function(cb){ try { cb(rec); } catch(e){} });
      return rec;
    }
    function allCats(v){ var o={}; CATS.forEach(function(c){ o[c.id] = c.locked ? true : v; }); return o; }

    var el = null;

    function toggles(prefs){
      return CATS.map(function(c){
        var on = c.locked ? true : !!(prefs && prefs[c.id]);
        var lbl = T.cats[c.id];
        var name = lbl[0];
        var right = c.locked
          ? '<span class="m-cookie-lock"><i class="ph-light ph-lock-simple"></i>' + T.always + '</span>'
          : '<span class="m-cookie-switch">' +
              '<input type="checkbox" data-cat="' + c.id + '"' + (on ? ' checked' : '') + '>' +
              '<span class="m-cookie-track"></span>' +
            '</span>';
        return '<label class="m-cookie-cat' + (c.locked ? ' is-locked' : '') + '">' +
            '<span class="m-cookie-cat-txt">' +
              '<span class="cc-name">' + name + '</span>' +
              '<span class="cc-desc">' + lbl[1] + '</span>' +
            '</span>' +
            right +
          '</label>';
      }).join('');
    }

    function markup(prefs){
      return '<div class="m-cookie-view" data-view="intro">' +
          '<span class="m-cookie-eyebrow">' + T.eyebrow + '</span>' +
          '<h4>' + T.title + '</h4>' +
          '<p>' + T.intro + '<a href="' + POLICY + '" target="_blank" rel="noopener">' + T.policy + '</a></p>' +
          '<div class="m-cookie-row">' +
            '<button class="m-cookie-btn" data-act="acceptAll">' + T.acceptAll + '</button>' +
            '<button class="m-cookie-btn m-cookie-btn-soft" data-act="manage">' + T.manage + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="m-cookie-view" data-view="panel">' +
          '<span class="m-cookie-eyebrow">' + T.eyebrow + '</span>' +
          '<h4>' + T.panelTitle + '</h4>' +
          '<p>' + T.panelIntro + '</p>' +
          '<div class="m-cookie-cats">' + toggles(prefs) + '</div>' +
          '<div class="m-cookie-row">' +
            '<button class="m-cookie-btn" data-act="acceptAll">' + T.acceptAll + '</button>' +
            '<button class="m-cookie-btn m-cookie-btn-soft" data-act="saveSel">' + T.saveSel + '</button>' +
            '<button class="m-cookie-btn m-cookie-btn-soft" data-act="rejectAll">' + T.rejectAll + '</button>' +
          '</div>' +
        '</div>';
    }

    function collect(){
      var cats = { functional:true };
      if (el) el.querySelectorAll('input[data-cat]').forEach(function(i){ cats[i.dataset.cat] = i.checked; });
      cats.functional = true;
      return cats;
    }
    function close(){
      if (!el) return;
      el.classList.remove('is-shown');
      var node = el; el = null;
      setTimeout(function(){ if (node && node.parentNode) node.parentNode.removeChild(node); }, 500);
    }

    function show(startPanel){
      if (el){ if (startPanel) el.classList.add('show-panel'); return; }
      var prefs = (read() || {}).categories;
      el = document.createElement('div');
      el.className = 'm-cookie' + (startPanel ? ' show-panel' : '');
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', T.panelTitle);
      el.innerHTML = markup(prefs);
      document.body.appendChild(el);
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ if (el) el.classList.add('is-shown'); }); });
      el.addEventListener('click', function(e){
        var btn = e.target.closest('[data-act]'); if (!btn) return;
        var act = btn.getAttribute('data-act');
        if (act === 'manage'){ el.classList.add('show-panel'); return; }
        if (act === 'acceptAll'){ persist('accept', allCats(true)); close(); return; }
        if (act === 'rejectAll'){ persist('reject', allCats(false)); close(); return; }
        if (act === 'saveSel'){
          var cats = collect();
          var anyOn = CATS.some(function(c){ return !c.locked && cats[c.id]; });
          persist(anyOn ? 'custom' : 'reject', cats); close();
        }
      });
    }

    function injectFooterLink(){
      var links = document.querySelector('.m-footer-links');
      if (!links || links.querySelector('[data-cookie-open]')) return;
      var a = document.createElement('a');
      a.href = '#';
      a.setAttribute('data-cookie-open', '');
      a.textContent = T.reopen;
      a.addEventListener('click', function(e){ e.preventDefault(); show(true); });
      links.appendChild(a);
    }

    // Public API — script-gating + reopening consent
    window.MontisoroConsent = {
      get: read,
      has: function(cat){ var c = read(); return !!(c && c.categories && c.categories[cat]); },
      open: function(){ show(true); },
      reset: function(){ try { localStorage.removeItem(KEY); } catch(e){} },
      onChange: function(cb){ if (typeof cb === 'function') listeners.push(cb); }
    };

    injectFooterLink();

    // First visit → show intro after a beat. Returning visitor → silent (API still available).
    if (!read()) setTimeout(function(){ show(false); }, 800);
  }

  // ──── Founder storytelling reveal (Home) — photo settles, then the story opens ────
  function founderReveal(){
    var sec = document.querySelector('.founder-section');
    if (!sec) return;
    if (reduced){ return; }                 // reduced-motion → leave fully visible
    sec.setAttribute('data-fr','');
    var mob = window.matchMedia && window.matchMedia('(max-width:960px)').matches;
    if (!('IntersectionObserver' in window)){ sec.classList.add('fr-photo','fr-text'); return; }
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        sec.classList.add('fr-photo');
        setTimeout(function(){ sec.classList.add('fr-text'); }, mob ? 180 : 650);
        io.unobserve(e.target);
      });
    }, { threshold:0.25, rootMargin:'0px 0px -10% 0px' });
    io.observe(sec);
  }

  // ──── Mobile calendar wizard — one step per screen (additive; desktop unchanged) ────
  function calendarWizard(){
    var main = document.getElementById('calMain');
    var t = document.getElementById('calTimeStep');
    var f = document.getElementById('calFormStep');
    var grid = document.getElementById('calGrid');
    if (!main || !t || !f || !grid) return;
    function set(s){ main.setAttribute('data-step', String(s)); }
    set(1);
    grid.addEventListener('click', function(e){
      var d = e.target.closest && e.target.closest('.cal-day');
      if (d && !d.classList.contains('is-disabled') && !d.classList.contains('is-empty')) setTimeout(function(){ set(2); }, 20);
    });
    main.querySelectorAll('.cal-loc-btn').forEach(function(b){
      b.addEventListener('click', function(){ setTimeout(function(){ set(3); }, 20); });
    });
    [[t,1],[f,2]].forEach(function(pair){
      var step = pair[0];
      if (step.querySelector('.cal-back')) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'cal-back';
      b.innerHTML = '<i class="ph ph-arrow-left"></i> Terug';
      b.addEventListener('click', function(){ set(pair[1]); });
      step.insertBefore(b, step.firstChild);
    });
    document.querySelectorAll('[data-cal-close]').forEach(function(c){
      c.addEventListener('click', function(){ set(1); });
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ──── Back-to-top circle — injected above the footer on every page ──── */
(function(){
  function init(){
    var footer = document.querySelector('.m-footer');
    if (!footer || document.querySelector('.m-backtotop')) return;
    var isEN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
    var wrap = document.createElement('div');
    wrap.className = 'm-backtotop';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'm-btt';
    btn.setAttribute('aria-label', isEN ? 'Back to top' : 'Naar boven');
    btn.innerHTML = '<span class="m-btt-arrow" aria-hidden="true">\u2192</span>';
    btn.addEventListener('click', function(){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    wrap.appendChild(btn);
    footer.parentNode.insertBefore(wrap, footer);
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
