/* ═══════════════════════════════════════════════════════════════════
   Montisoro — Shared helpers (vanilla)
   Tiny utility library used across site pages. Self-contained.

   Usage:
     <script src="../utils/helpers.js"></script>
     <script>
       var name = M.esc(userInput);
       var fmt  = M.eur(12500);          // '€12.500'
       var btn  = M.$('#submit');
       M.on(btn, 'click', handler);
     </script>
═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.M) return;

  function $ (s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return Array.from((r || document).querySelectorAll(s)); }

  // HTML-escape user input before string concat
  function esc(s){
    var d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
  }

  // NL-BE number formatting
  function fmt(n){ return new Intl.NumberFormat('nl-BE').format(n); }
  function eur(n){ return '€' + fmt(n); }

  // Debounce
  function debounce(fn, ms){
    var t;
    return function(){
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(ctx, args); }, ms);
    };
  }

  // Event helpers
  function on(el, ev, fn, opts){
    if (!el) return;
    el.addEventListener(ev, fn, opts);
  }
  function off(el, ev, fn){
    if (!el) return;
    el.removeEventListener(ev, fn);
  }

  // Basic email validation
  function validEmail(s){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ''));
  }

  // Detect language from <html lang="..."> attribute (defaults to nl)
  function lang(){
    return (document.documentElement.lang || 'nl').toLowerCase().slice(0, 2);
  }

  window.M = {
    $: $, $$: $$, esc: esc, fmt: fmt, eur: eur,
    debounce: debounce, on: on, off: off,
    validEmail: validEmail, lang: lang
  };
})();
