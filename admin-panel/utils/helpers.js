/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — Shared helpers
   Tiny utility library used across admin modules. Already inlined inside
   each module today — this file is the canonical extraction for the
   future refactor where modules import from a single source.

   Globals exposed: window.A.{$, $$, esc, fmt, eur, debounce, on, off}
═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.A) return;

  function $ (s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return Array.from((r || document).querySelectorAll(s)); }

  function esc(s){
    var d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
  }

  function fmt(n){ return new Intl.NumberFormat('nl-BE').format(n); }
  function eur(n){ return '€' + fmt(n); }

  function debounce(fn, ms){
    var t;
    return function(){
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(ctx, args); }, ms);
    };
  }

  function on(el, ev, fn, opts){
    if (!el) return;
    el.addEventListener(ev, fn, opts);
  }
  function off(el, ev, fn){
    if (!el) return;
    el.removeEventListener(ev, fn);
  }

  // Build a Tabler-icon span
  function icon(name){
    return '<i class="ti ti-' + esc(name) + '"></i>';
  }

  // Build a status pill
  function pill(text, kind){
    return '<span class="pill pill-' + esc(kind || 'default') + '">' + esc(text) + '</span>';
  }

  // Get currently-logged-in admin user from sessionStorage
  function currentUser(){
    try {
      var s = JSON.parse(sessionStorage.getItem('admin.session') || '{}');
      return { email: s.email || '', ts: s.ts || 0 };
    } catch(e){
      return { email: '', ts: 0 };
    }
  }

  window.A = {
    $: $, $$: $$, esc: esc, fmt: fmt, eur: eur,
    debounce: debounce, on: on, off: off,
    icon: icon, pill: pill, currentUser: currentUser
  };
})();
