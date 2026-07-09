/* ═══════════════════════════════════════════════════════════════════
   admin-calcparams.js — "Calculator-parameters" view
   Beheer de instelbare aannames van de verzuimcalculator.
   Bewaart in DATA.calc_params (localStorage) + exporteert een kant-en-klaar
   website/config/calculator-params.js. Live preview via VerzuimEngine.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__calcParamsLoaded) return;
  window.__calcParamsLoaded = true;

  var E = window.VerzuimEngine;
  function defaults() { return E ? E.getDefaults() : { employerLoad:1.30, sector:{K:3.29,M:3.25,L:3.75}, vervangFactor:30, orgFactor:50, savingSteps:[0.5,1,2], risk:{lowMax:-0.5,avgMax:1.0,elevatedMax:3.0} }; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function nl(n, d) { return Number(n).toLocaleString('nl-BE', { minimumFractionDigits: d == null ? 0 : d, maximumFractionDigits: d == null ? 0 : d }); }
  function eur(n) { return '€ ' + Math.round(n).toLocaleString('nl-BE'); }

  /* ─── i18n (follows MONTISORO_ADMIN_I18N) ─── */
  function aLang(){ return window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.getLang() : 'nl'; }
  var STR = {
    nl: {
      p1_t:'Patronale lasten (RSZ)', p1_s:'Wettelijke werkgeverslast bovenop het brutoloon.', f_rsz:'Extra last op brutoloon', f_rsz_h:'Standaard 30%. Verhoog/verlaag bij gewijzigde RSZ-tarieven.',
      p2_t:'Sectorgemiddelde — SD&nbsp;Worx', p2_s:'Belgisch gemiddelde per verzuimcategorie (% van werkdagen). Jaarlijks bijwerken.', f_sK:'Kort verzuim (≤ 1 maand)', f_sM:'Middellang (1 mnd – 1 jr)', f_sL:'Langdurig (> 1 jaar)',
      p3_t:'Vervangings- &amp; organisatorische kost', p3_s:'Standaardaandeel op de directe loonkost. De bezoeker kan dit in de calculator zelf bijstellen — dit is de uitgangswaarde &eacute;n de server-fallback.', f_vervang:'Vervangingskosten — standaard', f_org:'Organisatorische impact — standaard', suf_direct:'% van direct',
      p4_t:'Besparingsscenario’s', p4_s:'Reductie in procentpunt verzuim (3 scenario’s).', f_s:'Scenario',
      p5_t:'Risicodrempels', p5_s:'Verschil (procentpunt) t.o.v. het sectorgemiddelde. Onder ondergrens = Laag, daarboven oplopend.', f_rLow:'Laag — tot', f_rAvg:'Gemiddeld — tot', f_rElev:'Verhoogd — tot',
      prev_t:'Live voorbeeld', prev_s:'Effect op een voorbeeldbedrijf (250 FTE · € 45.000 · 220 dagen · 10,3% verzuim)',
      b_save:'Opslaan', b_export:'Exporteer calculator-params.js', b_reset:'Herstel standaardwaarden', saved:'Opgeslagen',
      note:'Na opslaan: klik <b>Exporteer</b> en plaats het bestand in <code class="cp-code">website/config/calculator-params.js</code>. De calculator, het PDF-rapport en de e-mails nemen de nieuwe waarden dan automatisch over. (Met de Supabase-backend leest de site deze later rechtstreeks.)',
      pc_annual:'Jaarlijkse kost', pc_perday:'Kost / dag', pc_sector:'Sector', pc_risk:'Risico', engine_off:'Engine niet geladen.',
      ro_banner:'Calculator-parameters zijn alleen bewerkbaar door een Admin. U kunt de waarden bekijken, niet wijzigen.',
      reset_confirm:'Alle parameters terugzetten naar de ingebouwde standaardwaarden?'
    },
    en: {
      p1_t:'Employer charges (RSZ)', p1_s:'Statutory employer load on top of gross salary.', f_rsz:'Extra load on gross salary', f_rsz_h:'Default 30%. Increase/decrease when RSZ rates change.',
      p2_t:'Sector average — SD&nbsp;Worx', p2_s:'Belgian average per absence category (% of working days). Update yearly.', f_sK:'Short absence (≤ 1 month)', f_sM:'Medium (1 mo – 1 yr)', f_sL:'Long-term (> 1 year)',
      p3_t:'Replacement &amp; organisational cost', p3_s:'Default share of the direct wage cost. The visitor can adjust this in the calculator — this is the starting value and the server fallback.', f_vervang:'Replacement cost — default', f_org:'Organisational impact — default', suf_direct:'% of direct',
      p4_t:'Saving scenarios', p4_s:'Reduction in percentage points of absence (3 scenarios).', f_s:'Scenario',
      p5_t:'Risk thresholds', p5_s:'Difference (percentage points) vs the sector average. Below the lower bound = Low, rising above it.', f_rLow:'Low — up to', f_rAvg:'Average — up to', f_rElev:'Elevated — up to',
      prev_t:'Live preview', prev_s:'Effect on a sample company (250 FTE · € 45,000 · 220 days · 10.3% absence)',
      b_save:'Save', b_export:'Export calculator-params.js', b_reset:'Restore default values', saved:'Saved',
      note:'After saving: click <b>Export</b> and place the file in <code class="cp-code">website/config/calculator-params.js</code>. The calculator, the PDF report and the emails then take the new values automatically. (With the Supabase backend the site reads these directly later.)',
      pc_annual:'Annual cost', pc_perday:'Cost / day', pc_sector:'Sector', pc_risk:'Risk', engine_off:'Engine not loaded.',
      ro_banner:'Calculator parameters can only be edited by an Admin. You can view the values, not change them.',
      reset_confirm:'Reset all parameters to the built-in default values?'
    }
  };
  function T(k){ return (STR[aLang()]||STR.nl)[k] || k; }

  // build config object from the form inputs
  function readForm() {
    var v = function (id) { var el = document.getElementById(id); return el ? parseFloat(String(el.value).replace(',', '.')) : NaN; };
    return {
      employerLoad: 1 + (isFinite(v('cp_rsz')) ? v('cp_rsz') : 30) / 100,
      sector: { K: v('cp_sK'), M: v('cp_sM'), L: v('cp_sL') },
      vervangFactor: (isFinite(v('cp_vervang')) ? v('cp_vervang') : 30),
      orgFactor: (isFinite(v('cp_org')) ? v('cp_org') : 50),
      savingSteps: [v('cp_s0'), v('cp_s1'), v('cp_s2')],
      risk: { lowMax: v('cp_rLow'), avgMax: v('cp_rAvg'), elevatedMax: v('cp_rElev') }
    };
  }

  // generate the downloadable website/config/calculator-params.js
  function exportFile(cfg) {
    var date = new Date().toISOString().slice(0, 10);
    var body =
'/* ═══════════════════════════════════════════════════════════════════\n' +
'   Montisoro — Verzuimcalculator PARAMETERS\n' +
'   Gegenereerd via admin-panel → Calculator-parameters op ' + date + '.\n' +
'   Plaats dit bestand in website/config/calculator-params.js\n' +
'   en laad het VÓÓR verzuim-engine.js.\n' +
'═══════════════════════════════════════════════════════════════════ */\n' +
'(function (root) {\n' +
'  var CONFIG = {\n' +
'    employerLoad: ' + cfg.employerLoad + ',\n' +
'    sector: { K: ' + cfg.sector.K + ', M: ' + cfg.sector.M + ', L: ' + cfg.sector.L + ' },\n' +
'    vervangFactor: ' + cfg.vervangFactor + ',\n' +
'    orgFactor: ' + cfg.orgFactor + ',\n' +
'    savingSteps: [' + cfg.savingSteps.join(', ') + '],\n' +
'    risk: { lowMax: ' + cfg.risk.lowMax + ', avgMax: ' + cfg.risk.avgMax + ', elevatedMax: ' + cfg.risk.elevatedMax + ' }\n' +
'  };\n' +
'  if (root) root.MONTISORO_CALC_CONFIG = CONFIG;\n' +
'  if (typeof module !== "undefined" && module.exports) module.exports = CONFIG;\n' +
'})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));\n';
    var blob = new Blob([body], { type: 'application/javascript' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'calculator-params.js';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function field(id, label, val, opts) {
    opts = opts || {};
    return '<label class="a-col6">' +
      '<span class="a-label-b">' + label + '</span>' +
      '<span class="cp-field">' +
        (opts.pre ? '<span class="a-t13-muted">' + opts.pre + '</span>' : '') +
        '<input id="' + id + '" type="number" step="' + (opts.step || '0.1') + '" value="' + val + '" ' +
          'style="flex:1;border:0;outline:0;background:transparent;color:var(--a-off);font:inherit;font-weight:600;font-feature-settings:\'tnum\';min-width:0;">' +
        (opts.suf ? '<span class="cp-fieldsuffix">' + opts.suf + '</span>' : '') +
      '</span>' +
      (opts.help ? '<span class="cp-hint">' + opts.help + '</span>' : '') +
    '</label>';
  }

  function panel(title, sub, inner) {
    return '<div class="panel u-mb-18">' +
      '<div class="panel-head"><div><h3>' + title + '</h3>' + (sub ? '<div class="panel-sub">' + sub + '</div>' : '') + '</div></div>' +
      '<div class="panel-body"><div class="cp-grid3">' + inner + '</div></div>' +
    '</div>';
  }

  window.init_calcparams = function () {
    var DATA = window.AdminData.load();
    var cfg = DATA.calc_params ? clone(DATA.calc_params) : defaults();
    var host = document.getElementById('calcparams-body');
    if (!host) return;

    var rszPct = Math.round((cfg.employerLoad - 1) * 1000) / 10;

    host.innerHTML =
      panel(T('p1_t'), T('p1_s'),
        field('cp_rsz', T('f_rsz'), rszPct, { suf: '%', step: '0.5', help: T('f_rsz_h') })) +
      panel(T('p2_t'), T('p2_s'),
        field('cp_sK', T('f_sK'), cfg.sector.K, { suf: '%' }) +
        field('cp_sM', T('f_sM'), cfg.sector.M, { suf: '%' }) +
        field('cp_sL', T('f_sL'), cfg.sector.L, { suf: '%' })) +
      panel(T('p3_t'), T('p3_s'),
        field('cp_vervang', T('f_vervang'), cfg.vervangFactor != null ? cfg.vervangFactor : 30, { suf: T('suf_direct'), step: '1' }) +
        field('cp_org', T('f_org'), cfg.orgFactor != null ? cfg.orgFactor : 50, { suf: T('suf_direct'), step: '1' })) +
      panel(T('p4_t'), T('p4_s'),
        field('cp_s0', T('f_s')+' 1', cfg.savingSteps[0], { suf: 'pp', step: '0.1' }) +
        field('cp_s1', T('f_s')+' 2', cfg.savingSteps[1], { suf: 'pp', step: '0.1' }) +
        field('cp_s2', T('f_s')+' 3', cfg.savingSteps[2], { suf: 'pp', step: '0.1' })) +
      panel(T('p5_t'), T('p5_s'),
        field('cp_rLow', T('f_rLow'), cfg.risk.lowMax, { suf: 'pp', step: '0.1' }) +
        field('cp_rAvg', T('f_rAvg'), cfg.risk.avgMax, { suf: 'pp', step: '0.1' }) +
        field('cp_rElev', T('f_rElev'), cfg.risk.elevatedMax, { suf: 'pp', step: '0.1' })) +
      // live preview + actions
      '<div class="panel u-mb-18">' +
        '<div class="panel-head"><div><h3>' + T('prev_t') + '</h3><div class="panel-sub">' + T('prev_s') + '</div></div></div>' +
        '<div class="panel-body"><div class="cp-grid4" id="cp_preview"></div></div>' +
      '</div>' +
      '<div class="cp-actions">' +
        '<button class="btn btn-primary" id="cp_save"><i class="ti ti-device-floppy"></i>' + T('b_save') + '</button>' +
        '<button class="btn btn-primary cp-primary" id="cp_publish"><i class="ti ti-cloud-upload"></i> ' + (aLang()==='en'?'Publish to site':'Publiceer naar site') + '</button>' +
        '<button class="btn btn-ghost" id="cp_export"><i class="ti ti-download"></i>' + T('b_export') + '</button>' +
        '<button class="btn btn-ghost" id="cp_reset"><i class="ti ti-rotate"></i>' + T('b_reset') + '</button>' +
        '<span class="cp-saved" id="cp_saved"><i class="ti ti-check"></i> ' + T('saved') + '</span>' +
      '</div>' +
      '<p class="cp-note">' +
        T('note') +
      '</p>';

    function preview() {
      var cf = readForm();
      if (E) E.applyConfig(clone(defaults())), E.applyConfig(cf); // reset then apply edited
      var r = E ? E.report({}, aLang()) : null;
      var box = document.getElementById('cp_preview');
      if (!box) return;
      if (!r) { box.innerHTML = '<div class="u-c-muted2">' + T('engine_off') + '</div>'; return; }
      var card = function (lbl, val) {
        return '<div class="cp-statcard">' +
          '<div class="cp-stat-lbl">' + lbl + '</div>' +
          '<div class="cp-stat-num">' + val + '</div></div>';
      };
      box.innerHTML =
        card(T('pc_annual'), r.vars.annual_absence_cost) +
        card(T('pc_perday'), r.vars.cost_per_lost_day) +
        card(T('pc_sector'), r.vars.sector_average) +
        card(T('pc_risk'), r.vars.risk_level);
    }

    host.addEventListener('input', function (e) { if (e.target && e.target.id && e.target.id.indexOf('cp_') === 0) preview(); });

    // ── STAP 6 — rolafscherming: alleen Admin mag parameters wijzigen ──
    if (window.AdminRoles && !window.AdminRoles.can('calc_params:edit')) {
      preview();
      host.insertAdjacentHTML('afterbegin', window.AdminRoles.readonlyBanner(
        T('ro_banner')));
      window.AdminRoles.lockContainer(host, ['cp_save', 'cp_export', 'cp_reset']);
      return;
    }

    document.getElementById('cp_save').addEventListener('click', function () {
      var cf = readForm();
      DATA.calc_params = cf;
      window.AdminData.save(DATA);
      if (E) E.applyConfig(cf);
      if (window.Admin && window.Admin.logActivity) window.Admin.logActivity('Calculator-parameters aangepast', 'calculator');
      var s = document.getElementById('cp_saved'); s.style.opacity = '1'; setTimeout(function () { s.style.opacity = '0'; }, 2200);
    });
    document.getElementById('cp_export').addEventListener('click', function () { exportFile(readForm()); });
    /* KRITIEK #1 — write-bridge */
    var cpPub = document.getElementById('cp_publish');
    if (cpPub) cpPub.addEventListener('click', function () {
      var cfg = readForm();
      DATA.calc_params = cfg;
      window.AdminData.save(DATA);
      if (window.publishToSite) {
        cpPub.disabled = true; cpPub.textContent = aLang()==='en'?'Publishing…':'Publiceren…';
        window.publishToSite('calc_params', cfg, function(){
          cpPub.disabled = false; cpPub.innerHTML = '<i class="ti ti-cloud-upload"></i> ' + (aLang()==='en'?'Publish to site':'Publiceer naar site');
        });
      }
    });
    document.getElementById('cp_reset').addEventListener('click', function () {
      if (!confirm(T('reset_confirm'))) return;
      DATA.calc_params = defaults();
      window.AdminData.save(DATA);
      window.init_calcparams();
    });

    preview();
  };
})();
