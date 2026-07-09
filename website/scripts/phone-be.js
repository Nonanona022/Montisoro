/* ═══════════════════════════════════════════════════════════════════
   phone-be.js — Belgische telefoonnummer-validatie (gedeeld, site-breed)
   ───────────────────────────────────────────────────────────────────
   Valideert ALLE telefoonvelden (input[type="tel"]) op Belgisch formaat:
     +32 … / 0032 … / 0 …  gevolgd door 8–9 cijfers.
   Toont een inline foutmelding onder het veld bij blur/change/submit.
   Wist de melding zodra het veld geldig OF leeg is (ook bij autofill).
   Taal volgt <html lang>. Idempotent, géén dubbele foutmeldingen.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var isEN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  var MSG = isEN
    ? 'Enter a valid Belgian phone number (e.g. +32 477 12 34 56 or 0477 12 34 56).'
    : 'Vul een geldig Belgisch telefoonnummer in (bijv. +32 477 12 34 56 of 0477 12 34 56).';

  /* Belgisch nummer: +32 / 0032 / 0, dan 8–9 cijfers (spaties/punten/streepjes toegestaan) */
  function validBE(raw) {
    if (!raw) return false;
    var s = String(raw).replace(/[\s./()-]/g, '');
    return /^(\+32|0032|0)[1-9]\d{7,8}$/.test(s);
  }

  /* Eén foutmelding-element per input — bewaard op het input zelf → géén duplicaten. */
  function ensureErrEl(input) {
    if (input._beErr && input._beErr.isConnected) return input._beErr;
    var anchor = (input.closest('.f-input') || input.closest('.fcg-input') || input.closest('.field') || input);
    var sib = anchor.nextElementSibling;
    if (sib && sib.classList && sib.classList.contains('phone-be-err')) { input._beErr = sib; return sib; }
    var el = document.createElement('div');
    el.className = 'phone-be-err';
    el.style.cssText = 'color:#c0392b;font-size:12px;margin-top:5px;display:none;line-height:1.4;';
    if (anchor.parentNode) anchor.parentNode.insertBefore(el, anchor.nextSibling);
    input._beErr = el;
    return el;
  }

  function attach(input) {
    if (input.dataset.beWired) return;
    input.dataset.beWired = '1';
    var err = ensureErrEl(input);

    function hide() {
      err.style.display = 'none';
      err.textContent = '';
      input.setCustomValidity('');
      input.style.borderColor = '';
    }
    function check() {
      var v = input.value.trim();
      if (v === '') { hide(); return true; }          // leeg → nooit foutmelding
      var ok = validBE(v);
      if (ok) { hide(); return true; }
      err.textContent = MSG;
      err.style.display = 'block';
      input.setCustomValidity(MSG);
      input.style.borderColor = '#c0392b';
      return false;
    }

    input.addEventListener('blur', check);
    input.addEventListener('change', check);   // vangt browser-autofill
    input.addEventListener('input', function () {
      /* tijdens typen niet zeuren; maar zodra leeg of geldig → melding meteen weg */
      if (input.value.trim() === '' || validBE(input.value)) { hide(); }
      else if (err.style.display === 'block') { check(); }
    });
  }

  /* Eén submit-guard per formulier */
  function guardForm(form) {
    if (!form || form.dataset.bePhoneGuard) return;
    form.dataset.bePhoneGuard = '1';
    form.addEventListener('submit', function (e) {
      var bad = false;
      form.querySelectorAll('input[type="tel"]').forEach(function (t) {
        if (t.value.trim() !== '' && !validBE(t.value)) {
          bad = true;
          var ev = ensureErrEl(t);
          ev.textContent = MSG; ev.style.display = 'block';
          t.style.borderColor = '#c0392b';
        }
      });
      if (bad) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  function scan() {
    document.querySelectorAll('input[type="tel"]').forEach(function (input) {
      attach(input);
      guardForm(input.closest('form'));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  /* her-scan voor dynamisch ingevoegde velden (boekingsflow + fit check gate) */
  setTimeout(scan, 1200);
  try {
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].addedNodes && muts[i].addedNodes.length) { scan(); break; }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}

  /* Expose voor formulieren met eigen validatie (calculator/booking) */
  window.MONTISORO_validBEPhone = validBE;
})();
