/* ═══════════════════════════════════════════════════════════════════
   Montisoro — events.js · cookieloze, first-party event-tracker (Optie A)
   ───────────────────────────────────────────────────────────────────
   • GEEN cookies, GEEN persistente id, GEEN fingerprint. Respecteert DNT.
   • Sessie-id leeft in sessionStorage (weg bij sluiten tab) → sessies,
     sessieduur, pagina's/sessie, bounce, funnels — zonder de bezoeker
     over dagen te volgen.
   • De server (/api/event) berekent een DAGELIJKS roterende, nooit-
     opgeslagen bezoeker-hash voor "unieke bezoekers per dag" en leidt
     browser + land af. Deze client stuurt NOOIT PII (geen e-mail/naam).
   • Naast automatische page_view / page_exit / button_click biedt dit
     window.mtrack(name, meta) voor handmatige events (formulieren,
     wizard-stappen, conversies).
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    // ── Do-Not-Track respecteren (net als analytics.js) ──
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1') {
      window.mtrack = function () {}; // no-op zodat aanroepen nergens breken
      return;
    }

    var ENDPOINT = '/api/event';

    // ── Sessie-id (kortstondig, first-party, géén cookie) ──
    var SID_KEY = 'ms.sid', T0_KEY = 'ms.t0';
    var sid, t0;
    try {
      sid = sessionStorage.getItem(SID_KEY);
      if (!sid) {
        sid = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
        sessionStorage.setItem(SID_KEY, sid);
        sessionStorage.setItem(T0_KEY, String(Date.now()));
      }
      t0 = parseInt(sessionStorage.getItem(T0_KEY), 10) || Date.now();
    } catch (e) {
      // sessionStorage geblokkeerd → sessie-loos, maar events blijven werken
      sid = 'nostore';
      t0 = Date.now();
    }

    // ── Context (eenmalig bepaald) ──
    var w = window.innerWidth || (screen && screen.width) || 0;
    var device = w <= 600 ? 'mobile' : (w <= 1024 ? 'tablet' : 'desktop');
    var lang = (document.documentElement.lang || '').slice(0, 8);

    var refHost = null;
    try { if (document.referrer) { var u = new URL(document.referrer); if (u.host && u.host !== location.host) refHost = u.host; } } catch (e) {}

    // UTM-parameters (first-touch, enkel als aanwezig)
    var utm = {};
    try {
      var qs = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
        var v = qs.get(k); if (v) utm[k.slice(4)] = v.slice(0, 80);
      });
    } catch (e) {}

    var pageStart = Date.now();
    var maxScroll = 0;

    // ── Verzenden ──
    function send(name, meta) {
      var payload = {
        s: sid,
        n: name,
        p: location.pathname,
        r: refHost,
        u: utm,
        l: lang,
        d: device,
        w: w,
        meta: meta || {}
      };
      window.__msLast = payload; // debug/verificatie-haak (geen PII)
      try {
        var body = JSON.stringify(payload);
        if (navigator.sendBeacon) {
          navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
        } else {
          fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
        }
      } catch (e) {}
    }
    // Publieke API voor handmatige events (forms, wizard-stappen, conversies)
    // Onderschept form_submit om abandon-detectie sluitend te maken.
    window.mtrack = function (name, meta) {
      try {
        if (name === 'form_submit' && meta && meta.form) {
          formSubmitted[meta.form] = 1;
          // #10 invultijd meesturen (focus → verzenden)
          if (formStartAt[meta.form] && (meta.fill_ms == null)) { meta.fill_ms = Date.now() - formStartAt[meta.form]; }
        }
      } catch (e) {}
      send(name, meta);
    };

    // ── form_start / form_abandon (gecentraliseerd) ──
    var formStarted = {}, formSubmitted = {};
    function formIdOf(form) {
      if (!form) return 'form';
      return (form.getAttribute('data-form') || form.id || form.getAttribute('name') || 'form').slice(0, 40);
    }
    var formStartAt = {};                 // #10 invultijd: eerste focus-tijdstip per form
    document.addEventListener('focusin', function (ev) {
      var f = ev.target && ev.target.closest ? ev.target.closest('form') : null;
      if (!f) return;
      var id = formIdOf(f);
      if (!formStarted[id]) { formStarted[id] = 1; formStartAt[id] = Date.now(); send('form_start', { form: id }); }
    }, { capture: true });

    // ── #10 Validatiefouten (geen PII: enkel veldnaam/type/reden) ──
    document.addEventListener('invalid', function (ev) {
      try {
        var el = ev.target; if (!el || !el.form) return;
        var v = el.validity || {};
        var reason = v.valueMissing ? 'leeg' : v.typeMismatch ? 'type' : v.patternMismatch ? 'patroon' : v.tooShort ? 'te_kort' : v.tooLong ? 'te_lang' : v.rangeUnderflow || v.rangeOverflow ? 'bereik' : 'ongeldig';
        send('form_error', { form: formIdOf(el.form), field: (el.name || el.id || el.type || 'veld').slice(0, 40), type: (el.type || 'text').slice(0, 20), reason: reason });
      } catch (e) {}
    }, { capture: true });

    // ── Scroll-diepte bijhouden (voor page_exit) ──
    function onScroll() {
      try {
        var doc = document.documentElement;
        var scrollable = (doc.scrollHeight - doc.clientHeight);
        var pct = scrollable > 0 ? Math.round((doc.scrollTop || document.body.scrollTop) / scrollable * 100) : 100;
        if (pct > maxScroll) maxScroll = Math.min(100, Math.max(0, pct));
      } catch (e) {}
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ── Automatische CTA-kliks via [data-ev] + herkende CTA-patronen ──
    // Stabiele id-afleiding zodat we geen 60 pagina's hoeven te taggen.
    var CTA_MAP = [
      { sel: '.m-cta', id: 'nav_cta' },              // nav-pil (Plan een gesprek)
      { sel: '.ms-foot-btn', id: 'footer_cta' },     // footer-band CTA
      { sel: '.hs-cta .btn-primary, .hs-cta-primary', id: 'hero_primary' },
      { sel: '.hs-cta .btn-ghost, .hs-cta-ghost', id: 'hero_secondary' },
      { sel: '.js-calc-start, [href*="calculator"]', id: 'start_calculator' },
      { sel: '.js-fitcheck-start, [href*="fit-check"]', id: 'start_fitcheck' },
      { sel: '.t-more, .t-readmore', id: 'case_read_more' },
      { sel: '[href*="contact"]', id: 'to_contact' }
    ];
    function ctaIdFor(el) {
      for (var k = 0; k < CTA_MAP.length; k++) {
        try { if (el.closest(CTA_MAP[k].sel)) return CTA_MAP[k].id; } catch (e) {}
      }
      return null;
    }
    // ── #9 Viewability: stuur één button_view per CTA wanneer die in beeld komt ──
    // Zo is CTR = kliks / weergaven berekenbaar. Géén PII, één keer per element per pagina.
    try {
      if (window.IntersectionObserver) {
        var CTA_VIEW_SEL = '[data-ev], ' + CTA_MAP.map(function (m) { return m.sel; }).join(', ');
        var seenView = {};
        var vObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var el = en.target;
            var id = el.getAttribute('data-ev') || ctaIdFor(el);
            if (!id) { vObs.unobserve(el); return; }
            if (seenView[id]) { vObs.unobserve(el); return; }
            seenView[id] = 1;
            send('button_view', { id: id.slice(0, 60) });
            vObs.unobserve(el);
          });
        }, { threshold: 0.5 });
        var startObserve = function () { try { document.querySelectorAll(CTA_VIEW_SEL).forEach(function (el) { vObs.observe(el); }); } catch (e) {} };
        if (document.readyState === 'complete' || document.readyState === 'interactive') startObserve();
        else document.addEventListener('DOMContentLoaded', startObserve);
      }
    } catch (e) {}

    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      var explicit = t.closest('[data-ev]');
      if (explicit) {
        var id = explicit.getAttribute('data-ev') || 'cta';
        var label = explicit.getAttribute('data-ev-label') || (explicit.textContent || '').trim().slice(0, 60);
        send('button_click', { id: id.slice(0, 60), label: label });
        return;
      }
      // val terug op herkende CTA-patronen (link of knop)
      var actionable = t.closest('a, button');
      if (!actionable) return;
      var autoId = ctaIdFor(actionable);
      if (autoId) send('button_click', { id: autoId, label: (actionable.textContent || '').trim().slice(0, 60) });
    }, { capture: true });

    // ── page_exit (één keer): dwell + scroll-diepte ──
    var exited = false;
    function pageExit() {
      if (exited) return; exited = true;
      onScroll();
      flushVitals();
      // Gestarte maar niet-verzonden formulieren → abandon
      try {
        Object.keys(formStarted).forEach(function (id) {
          if (!formSubmitted[id]) send('form_abandon', { form: id });
        });
      } catch (e) {}
      send('page_exit', { dwell_ms: Date.now() - pageStart, scroll_pct: maxScroll });
    }
    window.addEventListener('pagehide', pageExit, { capture: true });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') pageExit();
    });

    // ── Web Vitals (lichtgewicht, hand-rolled) ──
    var vitals = {}; // metric → {value, rating}
    function rate(metric, v) {
      var t = { LCP: [2500, 4000], CLS: [0.1, 0.25], INP: [200, 500], TTFB: [800, 1800] }[metric];
      if (!t) return 'na';
      return v <= t[0] ? 'good' : (v <= t[1] ? 'needs-improvement' : 'poor');
    }
    function setVital(metric, v) { vitals[metric] = { value: v, rating: rate(metric, v) }; }
    var vitalsFlushed = false;
    function flushVitals() {
      if (vitalsFlushed) return; vitalsFlushed = true;
      try {
        var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
        if (nav) {
          if (nav.responseStart) setVital('TTFB', Math.round(nav.responseStart));
        }
      } catch (e) {}
      Object.keys(vitals).forEach(function (m) {
        send('web_vital', { metric: m, value: vitals[m].value, rating: vitals[m].rating });
      });
    }
    try {
      if (window.PerformanceObserver) {
        // LCP — laatste is de definitieve
        try {
          new PerformanceObserver(function (list) {
            var es = list.getEntries(); var last = es[es.length - 1];
            if (last) setVital('LCP', Math.round(last.renderTime || last.loadTime || last.startTime));
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {}
        // CLS — som van layout-shifts zonder recente input
        try {
          var cls = 0;
          new PerformanceObserver(function (list) {
            list.getEntries().forEach(function (en) { if (!en.hadRecentInput) cls += en.value; });
            setVital('CLS', Math.round(cls * 1000) / 1000);
          }).observe({ type: 'layout-shift', buffered: true });
        } catch (e) {}
        // INP-benadering — grootste event-duur
        try {
          var maxDur = 0;
          new PerformanceObserver(function (list) {
            list.getEntries().forEach(function (en) { if (en.duration > maxDur) maxDur = en.duration; });
            setVital('INP', Math.round(maxDur));
          }).observe({ type: 'event', buffered: true, durationThreshold: 40 });
        } catch (e) {}
      }
    } catch (e) {}

    // ── page_view (bij load) ──
    if (document.readyState === 'complete' || document.readyState === 'interactive') send('page_view', {});
    else document.addEventListener('DOMContentLoaded', function () { send('page_view', {}); });

  } catch (e) {
    window.mtrack = window.mtrack || function () {};
  }
})();
