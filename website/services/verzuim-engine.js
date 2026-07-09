/* ═══════════════════════════════════════════════════════════════════
   Montisoro — Verzuim Calculation Engine  (v1)
   ───────────────────────────────────────────────────────────────────
   SINGLE SOURCE OF TRUTH for all absence-cost math.
   Used by:
     • website/pages/calculator.html  + calculator-en.html  (browser UI)
     • Netlify Function (server-side PDF + e-mail)            [FASE 2 backend]
     • website/documents/verzuimrapport.html                 (PDF report)
     • admin-panel  (Calculator-parameters live preview)

   Works in BOTH environments:
     - Browser : window.VerzuimEngine
     - Node    : module.exports

   ───────────────────────────────────────────────────────────────────
   PUBLIC API
     VerzuimEngine.compute(input)        -> raw numeric results
     VerzuimEngine.format(results, lang) -> formatted {{template}} vars
     VerzuimEngine.report(input, lang)   -> { input, results, vars }
     VerzuimEngine.SECTOR                -> benchmark constants
     VerzuimEngine.ASSUMPTIONS           -> documented assumption values

   lang ∈ {'nl','en'}  (default 'nl')
═══════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // Node
  if (root) root.VerzuimEngine = api;                                        // Browser
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     CONSTANTS & DOCUMENTED ASSUMPTIONS
     Every "new" assumption (FASE 2) is centralised here so it can be
     reviewed/tuned in ONE place and cited in the PDF disclaimer.
  ───────────────────────────────────────────────────────────────── */

  // ── Ingebouwde standaardwaarden (overschrijfbaar via config) ──
  // Belgisch sectorgemiddelde per categorie — SD Worx Verzuimbarometer 2025
  var DEFAULTS = {
    employerLoad: 1.30,                    // +30% patronale lasten (RSZ)
    sector: { K: 3.18, M: 3.10, L: 3.86 },    // sectorgemiddelde per categorie (%)
    vervangFactor: 30,                     // vervangingskosten = % van directe loonkost
    orgFactor: 50,                         // organisatorische (indirecte) impact = % van directe loonkost
    savingSteps: [0.5, 1, 2],              // besparingsscenario's (procentpunt verzuim)
    risk: { lowMax: -0.5, avgMax: 1.0, elevatedMax: 3.0 }  // drempels (pp t.o.v. sector)
  };

  // Live config = diepe kopie van defaults; in-place gemuteerd door applyConfig()
  var CFG = {
    employerLoad: DEFAULTS.employerLoad,
    sector: { K: DEFAULTS.sector.K, M: DEFAULTS.sector.M, L: DEFAULTS.sector.L },
    vervangFactor: DEFAULTS.vervangFactor,
    orgFactor: DEFAULTS.orgFactor,
    savingSteps: DEFAULTS.savingSteps.slice(),
    risk: { lowMax: DEFAULTS.risk.lowMax, avgMax: DEFAULTS.risk.avgMax, elevatedMax: DEFAULTS.risk.elevatedMax }
  };

  function sectorTotal() { return CFG.sector.K + CFG.sector.M + CFG.sector.L; }

  // Merge overrides in-place (validates numbers; ignores junk). Returns CFG.
  function applyConfig(o) {
    if (!o || typeof o !== 'object') return CFG;
    var setNum = function (host, key, v) { var n = parseFloat(v); if (isFinite(n)) host[key] = n; };
    if (o.employerLoad != null) setNum(CFG, 'employerLoad', o.employerLoad);
    if (o.vervangFactor != null) setNum(CFG, 'vervangFactor', o.vervangFactor);
    if (o.orgFactor != null) setNum(CFG, 'orgFactor', o.orgFactor);
    if (o.sector) { ['K', 'M', 'L'].forEach(function (k) { if (o.sector[k] != null) setNum(CFG.sector, k, o.sector[k]); }); }
    if (Array.isArray(o.savingSteps) && o.savingSteps.length === 3) {
      CFG.savingSteps = o.savingSteps.map(function (x) { var n = parseFloat(x); return isFinite(n) ? n : 0; });
    }
    if (o.risk) { ['lowMax', 'avgMax', 'elevatedMax'].forEach(function (k) { if (o.risk[k] != null) setNum(CFG.risk, k, o.risk[k]); }); }
    return CFG;
  }
  function getConfig() {
    return { employerLoad: CFG.employerLoad, sector: { K: CFG.sector.K, M: CFG.sector.M, L: CFG.sector.L },
      vervangFactor: CFG.vervangFactor, orgFactor: CFG.orgFactor,
      savingSteps: CFG.savingSteps.slice(), risk: { lowMax: CFG.risk.lowMax, avgMax: CFG.risk.avgMax, elevatedMax: CFG.risk.elevatedMax },
      sectorTotal: sectorTotal() };
  }
  function getDefaults() { return JSON.parse(JSON.stringify(DEFAULTS)); }

  // back-compat aliases (live references)
  var SECTOR = CFG.sector;
  var ASSUMPTIONS = CFG;

  /* ─────────────────────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────────────────────────── */
  function num(v, fallback) {
    var n = (typeof v === 'string') ? parseFloat(String(v).replace(/[^\d.,-]/g, '').replace(',', '.')) : v;
    return (isFinite(n) && !isNaN(n)) ? n : (fallback || 0);
  }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function round(v) { return Math.round(v); }

  /* ─────────────────────────────────────────────────────────────
     COMPUTE — pure math, returns raw numbers (no formatting)
     input keys mirror the calculator state object exactly:
       fte, splitA, salary, voordelen, groepsv, hospv, andereverz,
       days, k, m, l
  ───────────────────────────────────────────────────────────────── */
  function compute(input) {
    input = input || {};
    var fte        = clamp(round(num(input.fte, 250)), 1, 100000);
    var splitA     = clamp(num(input.splitA, 60), 0, 100);
    var salary     = clamp(num(input.salary, 45000), 0, 5000000);
    var voordelen  = Math.max(0, num(input.voordelen, 50));
    var firmawagen = Math.max(0, num(input.firmawagen, 700));
    var groepsv    = Math.max(0, num(input.groepsv, 600));
    var hospv      = Math.max(0, num(input.hospv, 400));
    var andereverz = Math.max(0, num(input.andereverz, 200));
    var days       = clamp(round(num(input.days, 220)), 1, 366);
    // verzuim per groep (val terug op enkelvoudige k/m/l voor oude records)
    var kA = Math.max(0, num(input.kA, num(input.k, 3.18)));
    var mA = Math.max(0, num(input.mA, num(input.m, 3.10)));
    var lA = Math.max(0, num(input.lA, num(input.l, 3.86)));
    var kB = Math.max(0, num(input.kB, num(input.k, 3.18)));
    var mB = Math.max(0, num(input.mB, num(input.m, 3.10)));
    var lB = Math.max(0, num(input.lB, num(input.l, 3.86)));

    // ── Aantallen per groep ──
    var nArb = round(fte * (splitA / 100));
    var nBed = fte - nArb;
    var totVerzA = kA + mA + lA;
    var totVerzB = kB + mB + lB;

    // ── Core: verloren dagen per groep, samengeteld ──
    var lostDaysA = round(nArb * days * (totVerzA / 100));
    var lostDaysB = round(nBed * days * (totVerzB / 100));
    var lostDays  = lostDaysA + lostDaysB;                       // {{lost_workdays}}

    // ── Samengevoegd (headcount-gewogen) voor dashboard + benchmark ──
    var k = fte > 0 ? (nArb * kA + nBed * kB) / fte : 0;
    var m = fte > 0 ? (nArb * mA + nBed * mB) / fte : 0;
    var l = fte > 0 ? (nArb * lA + nBed * lB) / fte : 0;
    var totVerz = k + m + l;                                     // {{absence_rate}}
    var dailyLoon = days > 0 ? salary / days : 0;
    var costPerDay = round(dailyLoon * ASSUMPTIONS.employerLoad); // {{cost_per_lost_day}}
    var loonKost  = lostDays * costPerDay;

    // ── per-kost toewijzing arbeider/bediende/beide → gewogen naar de juiste groep ──
    var fracArb = splitA / 100;
    var fracBed = 1 - fracArb;
    function grpW(g){ return g === 'arbeider' ? fracArb : g === 'bediende' ? fracBed : 1; }
    var voordelenPerEmpYr = (voordelen * grpW(input.grpVoordelen) + firmawagen * grpW(input.grpFirmawagen)) * 12;
    var verzPerEmp        = groepsv * grpW(input.grpGroepsv) + hospv * grpW(input.grpHospv) + andereverz * grpW(input.grpAndereverz);
    var voordelenKost     = days > 0 ? (voordelenPerEmpYr / days) * lostDays : 0;
    var verzekeringKost   = days > 0 ? (verzPerEmp        / days) * lostDays : 0;

    // ── Factoren op de directe loonkost (FASE 3) ──
    var vervangFactor = clamp(num(input.vervangFactor, CFG.vervangFactor), 0, 500); // % van directe loonkost
    var orgFactor     = clamp(num(input.orgFactor,     CFG.orgFactor),     0, 500); // % van directe loonkost
    var vervangingKost = loonKost * (vervangFactor / 100);
    var orgImpactKost  = loonKost * (orgFactor / 100);
    var doorlopendKost = voordelenKost + verzekeringKost;

    // Werkgeverslast = factureerbare kost (directe loon + doorlopende + vervanging) — hét hero-cijfer
    var werkgeverslast = loonKost + doorlopendKost + vervangingKost;  // {{annual_absence_cost}}
    // Totale kost = werkgeverslast + ingeschatte (niet-gefactureerde) organisatorische impact
    var totaleKost     = werkgeverslast + orgImpactKost;

    var total  = werkgeverslast;                                 // hero
    var perEmp = fte > 0 ? total / fte : 0;                      // werkgeverslast per medewerker

    // ── Breakdown (op werkgeverslast) ──
    var ptL = total > 0 ? (loonKost / total) * 100 : 0;
    var ptDoorlopend = total > 0 ? (doorlopendKost / total) * 100 : 0;
    var ptVervang = total > 0 ? (vervangingKost / total) * 100 : 0;

    // ── FTE-equivalent : verloren dagen omgerekend naar voltijdse equivalenten ──
    var fteEquivalent = days > 0 ? lostDays / days : 0;          // {{fte_equivalent}}

    // ── Benchmark ──
    var sectorAverage     = sectorTotal();                      // {{sector_average}}
    var differenceVsSector = totVerz - sectorAverage;           // {{difference_vs_sector}} (procentpunt, getekend)

    // ── Risiconiveau (drempels instelbaar via config) ──
    var riskKey;
    if (differenceVsSector < CFG.risk.lowMax)        riskKey = 'low';
    else if (differenceVsSector <= CFG.risk.avgMax)  riskKey = 'avg';
    else if (differenceVsSector <= CFG.risk.elevatedMax) riskKey = 'elevated';
    else                                             riskKey = 'high';

    // ── Organisatorische (indirecte) impact ── zie orgImpactKost hierboven (factor × directe loonkost)

    // ── Besparingsscenario's (NIEUW — lineair: kost ∝ verzuim%) ──
    //   Een reductie van X procentpunt verzuim levert: total × (X / totVerz)
    //   (afgekapt zodat reductie nooit groter is dan het huidige verzuim)
    function saving(pp) {
      if (totVerz <= 0) return 0;
      var eff = Math.min(pp, totVerz);
      return total * (eff / totVerz);
    }
    var savingHalf = saving(CFG.savingSteps[0]);   // {{saving_half_percent}}
    var savingOne  = saving(CFG.savingSteps[1]);   // {{saving_one_percent}}
    var savingTwo  = saving(CFG.savingSteps[2]);   // {{saving_two_percent}}

    // ── Prioriteiten (NIEUW — regelgebaseerd) ──
    //   Rangschik categorieën op afwijking t.o.v. hun sectorbenchmark.
    var cats = [
      { key: 'K', label: 'kort',       mine: k, avg: SECTOR.K, diff: k - SECTOR.K },
      { key: 'M', label: 'middellang', mine: m, avg: SECTOR.M, diff: m - SECTOR.M },
      { key: 'L', label: 'langdurig',  mine: l, avg: SECTOR.L, diff: l - SECTOR.L }
    ];
    var ranked = cats.slice().sort(function (a, b) { return b.diff - a.diff; });

    return {
      // echo input (handig voor opslag/audit)
      input: { fte: fte, splitA: splitA, salary: salary, voordelen: voordelen,
               firmawagen: firmawagen,
               grpVoordelen: input.grpVoordelen||'beide', grpFirmawagen: input.grpFirmawagen||'bediende',
               grpGroepsv: input.grpGroepsv||'bediende', grpHospv: input.grpHospv||'beide', grpAndereverz: input.grpAndereverz||'beide',
               groepsv: groepsv, hospv: hospv, andereverz: andereverz,
               days: days, k: k, m: m, l: l,
               kA: kA, mA: mA, lA: lA, kB: kB, mB: mB, lB: lB,
               vervangFactor: vervangFactor, orgFactor: orgFactor },
      // core
      totVerz: totVerz, lostDays: lostDays, dailyLoon: dailyLoon,
      costPerDay: costPerDay, loonKost: loonKost,
      voordelenPerEmpYr: voordelenPerEmpYr, verzPerEmp: verzPerEmp,
      voordelenKost: voordelenKost, verzekeringKost: verzekeringKost,
      doorlopendKost: doorlopendKost,
      vervangFactor: vervangFactor, orgFactor: orgFactor,
      vervangingKost: vervangingKost, orgImpactKost: orgImpactKost,
      werkgeverslast: werkgeverslast, totaleKost: totaleKost,
      total: total, perEmp: perEmp,
      fte: fte,
      breakdown: { loonPct: ptL, doorlopendPct: ptDoorlopend, vervangPct: ptVervang,
                   loonKost: loonKost, doorlopendKost: doorlopendKost, vervangingKost: vervangingKost },
      // derived / new
      fteEquivalent: fteEquivalent,
      sectorAverage: sectorAverage,
      differenceVsSector: differenceVsSector,
      riskKey: riskKey,
      savingHalf: savingHalf, savingOne: savingOne, savingTwo: savingTwo,
      categories: cats, rankedCategories: ranked,
      arbeiders: round(fte * splitA / 100),
      bedienden: fte - round(fte * splitA / 100),
      totVerzA: totVerzA, totVerzB: totVerzB,
      lostDaysA: lostDaysA, lostDaysB: lostDaysB
    };
  }

  /* ─────────────────────────────────────────────────────────────
     TEXT BANK (NL + EN) — risico-uitleg & prioriteiten
  ───────────────────────────────────────────────────────────────── */
  var RISK_LABELS = {
    nl: { low: 'Laag', avg: 'Gemiddeld', elevated: 'Verhoogd', high: 'Hoog' },
    en: { low: 'Low',  avg: 'Average',   elevated: 'Elevated', high: 'High' }
  };
  var RISK_EXPLAIN = {
    nl: {
      low:      'Uw verzuim ligt onder het Belgische sectorgemiddelde. Het risico op structurele uitval is beperkt, maar blijvende aandacht voorkomt terugval.',
      avg:      'Uw verzuim ligt rond het sectorgemiddelde. Er is geen acuut alarm, maar gerichte opvolging houdt de kosten beheersbaar en voorkomt verschuiving naar langdurig verzuim.',
      elevated: 'Uw verzuim ligt merkbaar boven het sectorgemiddelde. Dit duidt op een verhoogd risico op productiviteitsverlies en oplopende vervangingskosten. Structurele opvolging is aangewezen.',
      high:     'Uw verzuim ligt sterk boven het sectorgemiddelde. Dit wijst op een hoog risico voor continuïteit, werkdruk en kosten. Een gestructureerde aanpak is dringend aanbevolen.'
    },
    en: {
      low:      'Your absence rate is below the Belgian sector average. The risk of structural absence is limited, but continued attention prevents relapse.',
      avg:      'Your absence rate is around the sector average. There is no acute alarm, but targeted follow-up keeps costs manageable and prevents a shift toward long-term absence.',
      elevated: 'Your absence rate is noticeably above the sector average. This indicates an elevated risk of productivity loss and rising replacement costs. Structural follow-up is advised.',
      high:     'Your absence rate is well above the sector average. This signals a high risk to continuity, workload and cost. A structured approach is urgently recommended.'
    }
  };
  // Prioriteit-teksten per categorie (wanneer die categorie het meest afwijkt)
  var PRIORITY_TEXT = {
    nl: {
      K: 'Kort en frequent verzuim aanpakken: versterk leidinggevenden in het voeren van terugkeer- en verzuimgesprekken en maak patronen vroeg zichtbaar.',
      M: 'Middellang verzuim begeleiden: zet gestructureerd casemanagement op zodat dossiers tussen 1 maand en 1 jaar niet evolueren naar langdurige uitval.',
      L: 'Langdurig verzuim en re-integratie: voer externe regie op slepende dossiers in om terugkeer te versnellen en de zwaarste kostenpost te beheersen.',
      generic_data:  'Verzuimdata zichtbaar maken: bouw een eenvoudig dashboard dat verzuim per categorie, dienst en evolutie toont zodat u tijdig kunt bijsturen.',
      generic_policy:'Verzuimbeleid verankeren: leg afspraken, rollen en opvolging vast zodat de aanpak niet persoonsafhankelijk is maar structureel.'
    },
    en: {
      K: 'Address short, frequent absence: strengthen managers in conducting return-to-work and absence conversations, and surface patterns early.',
      M: 'Guide medium-term absence: set up structured case management so cases between 1 month and 1 year do not evolve into long-term absence.',
      L: 'Long-term absence and reintegration: introduce external direction on protracted cases to speed up return and control the heaviest cost driver.',
      generic_data:  'Make absence data visible: build a simple dashboard showing absence by category, department and trend so you can intervene in time.',
      generic_policy:'Anchor your absence policy: define agreements, roles and follow-up so the approach is structural rather than person-dependent.'
    }
  };

  /* ─────────────────────────────────────────────────────────────
     FORMATTING
  ───────────────────────────────────────────────────────────────── */
  function locale(lang) { return lang === 'en' ? 'en-IE' : 'nl-BE'; } // en-IE = euro + EN

  function fmtInt(n, lang) {
    return Math.round(n).toLocaleString(locale(lang), { maximumFractionDigits: 0 });
  }
  function fmtDec(n, lang, d) {
    d = (d == null) ? 1 : d;
    return n.toLocaleString(locale(lang), { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  // Geld, kort: € 1,13 M / € 280K / € 4.500
  function fmtMoney(n, lang) {
    var abs = Math.abs(n);
    if (abs >= 1000000) return '€ ' + (n / 1000000).toLocaleString(locale(lang), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' M';
    if (abs >= 1000)    return '€ ' + (n / 1000).toLocaleString(locale(lang), { maximumFractionDigits: 0 }) + 'K';
    return '€ ' + Math.round(n).toLocaleString(locale(lang));
  }
  // Geld, volledig: € 1.134.000
  function fmtMoneyFull(n, lang) {
    return '€ ' + Math.round(n).toLocaleString(locale(lang), { maximumFractionDigits: 0 });
  }
  function fmtPct(n, lang, d) { return fmtDec(n, lang, d == null ? 1 : d) + '%'; }
  function fmtPP(n, lang) {
    var s = (n >= 0 ? '+' : '−') + fmtDec(Math.abs(n), lang, 1);
    return s + ' pp';
  }

  /* format() → builds the {{template}} variable bag (strings, both langs supported) */
  function format(r, lang) {
    lang = (lang === 'en') ? 'en' : 'nl';
    var unitDays = lang === 'en' ? ' working days' : ' werkdagen';

    // Prioriteiten samenstellen
    var pr = PRIORITY_TEXT[lang];
    var priorities = [];
    r.rankedCategories.forEach(function (c) {
      if (c.diff > 0.05 && priorities.length < 3) priorities.push(pr[c.key]);
    });
    // Aanvullen tot 3 met generieke prioriteiten
    if (priorities.length < 3) priorities.push(pr.generic_data);
    if (priorities.length < 3) priorities.push(pr.generic_policy);
    // Als er nog te weinig zijn (alles onder benchmark), neem grootste categorie
    while (priorities.length < 3) priorities.push(pr[r.rankedCategories[0].key]);

    return {
      // bestaand
      annual_absence_cost: fmtMoneyFull(r.total, lang),
      annual_absence_cost_short: fmtMoney(r.total, lang),
      lost_workdays: fmtInt(r.lostDays, lang) + unitDays,
      lost_workdays_num: fmtInt(r.lostDays, lang),
      cost_per_employee: fmtMoneyFull(r.perEmp, lang),
      cost_per_lost_day: fmtMoneyFull(r.costPerDay, lang),
      absence_rate: fmtPct(r.totVerz, lang),
      // benchmark
      sector_average: fmtPct(r.sectorAverage, lang),
      difference_vs_sector: fmtPP(r.differenceVsSector, lang),
      // risico
      risk_level: RISK_LABELS[lang][r.riskKey],
      risk_explanation: RISK_EXPLAIN[lang][r.riskKey],
      // fte
      fte_equivalent: fmtDec(r.fteEquivalent, lang, 1),
      // werkgeverslast & totale kost
      werkgeverslast: fmtMoneyFull(r.werkgeverslast, lang),
      werkgeverslast_short: fmtMoney(r.werkgeverslast, lang),
      totale_kost: fmtMoneyFull(r.totaleKost, lang),
      totale_kost_short: fmtMoney(r.totaleKost, lang),
      // kost per medewerker (afgeleid)
      direct_per_employee: fmtMoneyFull(r.fte>0 ? r.loonKost/r.fte : 0, lang),
      werkgeverslast_per_employee: fmtMoneyFull(r.perEmp, lang),
      org_per_employee: fmtMoneyFull(r.fte>0 ? r.orgImpactKost/r.fte : 0, lang),
      totale_per_employee: fmtMoneyFull(r.fte>0 ? r.totaleKost/r.fte : 0, lang),
      // factoren
      vervang_factor: fmtInt(r.vervangFactor, lang) + '%',
      org_factor: fmtInt(r.orgFactor, lang) + '%',
      // organisatorische (indirecte) impact
      org_impact_cost: fmtMoneyFull(r.orgImpactKost, lang),
      // besparingen
      saving_half_percent: fmtMoneyFull(r.savingHalf, lang),
      saving_one_percent: fmtMoneyFull(r.savingOne, lang),
      saving_two_percent: fmtMoneyFull(r.savingTwo, lang),
      // prioriteiten
      priority_1: priorities[0],
      priority_2: priorities[1],
      priority_3: priorities[2],
      // breakdown (handig voor PDF)
      loon_cost: fmtMoneyFull(r.breakdown.loonKost, lang),
      doorlopend_cost: fmtMoneyFull(r.breakdown.doorlopendKost, lang),
      vervanging_cost: fmtMoneyFull(r.breakdown.vervangingKost, lang)
    };
  }

  function report(input, lang) {
    var r = compute(input);
    return { input: r.input, results: r, vars: format(r, lang) };
  }

  // Apply any config provided by the host page (set before this script loads)
  try {
    var _g = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : null);
    if (_g && _g.MONTISORO_CALC_CONFIG) applyConfig(_g.MONTISORO_CALC_CONFIG);
  } catch (e) {}

  return {
    compute: compute,
    format: format,
    report: report,
    applyConfig: applyConfig,
    getConfig: getConfig,
    getDefaults: getDefaults,
    SECTOR: SECTOR,
    ASSUMPTIONS: ASSUMPTIONS,
    RISK_LABELS: RISK_LABELS
  };
});
