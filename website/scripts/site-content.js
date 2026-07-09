/* ═══════════════════════════════════════════════════════════════════
   site-content.js — Website ↔ dashboard read-bridge (CLIENT)
   ───────────────────────────────────────────────────────────────────
   Fallback-first hydration. The page renders its hardcoded data files
   (window.MONTISORO_TRUSTED / _TESTIMONIALS) IMMEDIATELY, so there is never
   a blank state. This script then asks /api/site-content for the
   dashboard-managed version and — ONLY if real content comes back — swaps
   it in via the render hooks the page exposes (__reTrusted / __reTestimonials).

   Inert-safe: if the endpoint says { configured:false } (no Supabase yet) or
   the fetch fails, nothing happens → the hardcoded fallback stays. Same-origin
   call, so CSP connect-src 'self' already covers it.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Feature-flag kill-switches (Audit P11) ───────────────────
     Per-flow wiring. Default = enabled; only an explicit `false` disables a
     flow. Fully additive: with all flags on (or absent), killFlow is never
     called and the page is untouched. When a flow is OFF we:
       (a) add the body class shell.css keys the kill CSS on,
       (b) stamp data-ff on entry CTAs so dangling links vanish site-wide
           (shell.css hides [data-ff="…"]),
       (c) drop a short "temporarily unavailable" notice in place of the flow
           on its own page — never a silent blank gap.                        */
  var FF_FLOWS = {
    booking: {
      cssKey: 'ff-booking-off',
      // booking is a wizard inside contact.html; its CTAs point at the whole
      // contact page (also home to the plain contact form + channels), so we
      // do NOT hide them — we only replace the wizard itself with a notice.
      ctas: [],
      containerSel: '#bfFlow',
      title: { nl: 'Online inplannen is tijdelijk niet beschikbaar', en: 'Online booking is temporarily unavailable' },
      body:  { nl: 'Neem gerust rechtstreeks contact op — we plannen dan samen een moment in.', en: 'Please reach out directly and we will find a moment together.' }
    },
    fitcheck: {
      cssKey: 'ff-fitcheck-off',
      ctas: ['a[href$="fit-check.html"]', 'a[href$="fit-check-en.html"]', 'button[onclick*="FitCheck.open"]'],
      containerSel: '.hero-statement .hs-cta-row',
      onlyIf: 'button[onclick*="FitCheck.open"]',   // only inject on the fit-check page itself
      title: { nl: 'De fit check is tijdelijk niet beschikbaar', en: 'The fit check is temporarily unavailable' },
      body:  { nl: 'Ze komt binnenkort terug. Neem intussen gerust contact op.', en: 'It will be back soon. Feel free to get in touch in the meantime.' }
    },
    calculator: {
      cssKey: 'ff-calculator-off',
      ctas: ['a[href$="calculator.html"]', 'a[href$="calculator-en.html"]', 'a[href="#bMain"]'],
      containerSel: '#bMain',
      title: { nl: 'De verzuimcalculator is tijdelijk niet beschikbaar', en: 'The absence calculator is temporarily unavailable' },
      body:  { nl: 'Ze komt binnenkort terug. Neem intussen gerust contact op voor een inschatting.', en: 'It will be back soon. Get in touch for an estimate in the meantime.' }
    }
  };
  function killFlow(kind) {
    var cfg = FF_FLOWS[kind];
    if (!cfg) return;
    try { document.body.classList.add(cfg.cssKey); } catch (e) {}
    (cfg.ctas || []).forEach(function (sel) {
      try { document.querySelectorAll(sel).forEach(function (el) { el.setAttribute('data-ff', kind); }); } catch (e) {}
    });
    try {
      if (cfg.onlyIf && !document.querySelector(cfg.onlyIf)) return;
      var host = cfg.containerSel && document.querySelector(cfg.containerSel);
      if (!host || document.getElementById('ff-notice-' + kind)) return;
      var EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
      var n = document.createElement('div');
      n.id = 'ff-notice-' + kind;
      n.className = 'ff-notice';
      n.setAttribute('role', 'status');
      n.innerHTML = '<strong>' + (EN ? cfg.title.en : cfg.title.nl) + '</strong>' +
                    '<span>' + (EN ? cfg.body.en : cfg.body.nl) + '</span>';
      host.parentNode.insertBefore(n, host);
    } catch (e) {}
  }

  function apply(content) {
    if (!content || typeof content !== 'object') return;
    // Trusted-by logos
    if (Array.isArray(content.trusted_by) && content.trusted_by.length) {
      window.MONTISORO_TRUSTED = content.trusted_by;
      if (typeof window.__reTrusted === 'function') { try { window.__reTrusted(); } catch (e) {} }
    }
    // Testimonials
    if (Array.isArray(content.testimonials) && content.testimonials.length) {
      window.MONTISORO_TESTIMONIALS = content.testimonials;
      if (typeof window.__reTestimonials === 'function') { try { window.__reTestimonials(); } catch (e) {} }
      if (typeof window.__reReferences === 'function') { try { window.__reReferences(); } catch (e) {} }
    }
    // Calculator params (consumed by calculator.js on its own page, if present)
    if (content.calc_params && typeof content.calc_params === 'object') {
      window.MONTISORO_CALC_PARAMS = content.calc_params;
      if (typeof window.__reCalcParams === 'function') { try { window.__reCalcParams(); } catch (e) {} }
    }
    // Feature flags — kill-switches (Audit P11). Default = enabled; only an
    // explicit `false` disables a flow (see FF_FLOWS / killFlow above).
    if (content.feature_flags && typeof content.feature_flags === 'object') {
      var f = content.feature_flags;
      if (f.booking_enabled === false)    killFlow('booking');
      if (f.fitcheck_enabled === false)   killFlow('fitcheck');
      if (f.calculator_enabled === false) killFlow('calculator');
    }
    // Booking schedule — expose for contact.html TEMPLATES override
    if (content.booking_schedule && typeof content.booking_schedule === 'object') {
      window.MONTISORO_BOOKING_SCHEDULE = content.booking_schedule;
    }
    // FAQ — per pagina ({aanpak:[{q_nl,a_nl,q_en,a_en}], fitcheck:[...]})
    if (content.faq && typeof content.faq === 'object') {
      window.MONTISORO_FAQ = content.faq;
      if (typeof window.__reFaq === 'function') { try { window.__reFaq(); } catch (e) {} }
    }
    // SEO — per pagina ({slug:{title_nl,desc_nl,title_en,desc_en}}). Direct toegepast.
    if (content.seo && typeof content.seo === 'object') {
      window.MONTISORO_SEO = content.seo;
      try {
        var EN = (document.documentElement.lang||'').toLowerCase().indexOf('en')===0;
        var file = (location.pathname.split('/').pop()||'Home.html');
        var slug = file.replace(/\.html$/i,'').replace(/-en$/i,'') || 'Home';
        var s = content.seo[slug] || content.seo[file];
        if (s) {
          var t = EN ? (s.title_en||s.title_nl) : (s.title_nl||s.title_en);
          var d = EN ? (s.desc_en||s.desc_nl) : (s.desc_nl||s.desc_en);
          if (t) { document.title = t; var ogt=document.querySelector('meta[property="og:title"]'); if(ogt) ogt.setAttribute('content', t); }
          if (d) { var md=document.querySelector('meta[name="description"]'); if(md) md.setAttribute('content', d); var ogd=document.querySelector('meta[property="og:description"]'); if(ogd) ogd.setAttribute('content', d); }
        }
      } catch (e) {}
      if (typeof window.__reSeo === 'function') { try { window.__reSeo(); } catch (e) {} }
    }
    // Microcopy — losse zinnen ({key:{nl,en}}). Toegepast op [data-mc="key"].
    if (content.microcopy && typeof content.microcopy === 'object') {
      window.MONTISORO_MICROCOPY = content.microcopy;
      try {
        var mcEN = (document.documentElement.lang||'').toLowerCase().indexOf('en')===0;
        document.querySelectorAll('[data-mc]').forEach(function(el){
          var m = content.microcopy[el.getAttribute('data-mc')];
          if (!m) return;
          var v = mcEN ? (m.en||m.nl) : (m.nl||m.en);
          if (v) el.textContent = v;
        });
      } catch (e) {}
      if (typeof window.__reMicrocopy === 'function') { try { window.__reMicrocopy(); } catch (e) {} }
    }
  }
  function run() {
    try {
      fetch('/api/site-content', { method: 'GET', headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j && j.ok && j.configured && j.content) apply(j.content); })
        .catch(function () { /* keep fallback */ });
    } catch (e) { /* keep fallback */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
