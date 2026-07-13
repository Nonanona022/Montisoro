/* ═══════════════════════════════════════════════════════════════════
   Montisoro — Verzuim Engine · TEST SPEC
   ───────────────────────────────────────────────────────────────────
   Zero-dependency golden-master + invariant tests for verzuim-engine.js.
   Locks the current (correct) behaviour so a future change cannot
   silently shift a CFO-facing number.

   Runs in the browser via "Calculator Engine Tests.html".
   Assumes the engine's BUILT-IN defaults (SD Worx 2025: 3,18 / 3,10 / 3,86
   → sector 10,14%). Load ONLY the engine (not calculator-params.js) so
   the defaults are under test.

   Usage: window.VerzuimEngineSpec(VerzuimEngine, expect) -> [[name, fn], …]
═══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  function spec(E, expect) {
    var tests = [];
    function t(name, fn) { tests.push([name, fn]); }

    /* Reference scenario A — golden master (captured from the live engine). */
    var A = {
      fte: 200, splitA: 55, salary: 48000,
      voordelen: 50, firmawagen: 700, groepsv: 600, hospv: 400, andereverz: 200,
      grpVoordelen: 'beide', grpFirmawagen: 'bediende', grpGroepsv: 'bediende',
      grpHospv: 'beide', grpAndereverz: 'beide',
      days: 220, kA: 4, mA: 3, lA: 3, kB: 2, mB: 2, lB: 2,
      vervangFactor: 30, orgFactor: 50
    };
    var RA = E.compute(A);

    /* ── Config & benchmark (SD Worx 2025) ── */
    t('Sectorbenchmark = 10,14% (3,18 + 3,10 + 3,86)', function () {
      var c = E.getConfig();
      expect(c.sector.K).close(3.18, 0.001);
      expect(c.sector.M).close(3.10, 0.001);
      expect(c.sector.L).close(3.86, 0.001);
      expect(c.sectorTotal).close(10.14, 0.001);
    });
    t('compute().sectorAverage = 10,14', function () {
      expect(RA.sectorAverage).close(10.14, 0.001);
    });

    /* ── Core invariants ── */
    t('Hero-cijfer: total === werkgeverslast', function () {
      expect(RA.total).toBe(RA.werkgeverslast);
    });
    t('Werkgeverslast = loon + doorlopend + vervanging', function () {
      expect(RA.werkgeverslast).close(RA.loonKost + RA.doorlopendKost + RA.vervangingKost, 1);
    });
    t('Totale kost = werkgeverslast + organisatorische impact', function () {
      expect(RA.totaleKost).close(RA.werkgeverslast + RA.orgImpactKost, 1);
    });
    t('Kost per medewerker = total / FTE', function () {
      expect(RA.perEmp).close(RA.total / RA.fte, 0.01);
    });
    t('Verloren dagen = arbeiders-dagen + bedienden-dagen', function () {
      expect(RA.lostDays).toBe(RA.lostDaysA + RA.lostDaysB);
    });
    t('Headcount: arbeiders + bedienden === FTE', function () {
      expect(RA.arbeiders + RA.bedienden).toBe(RA.fte);
    });

    /* ── Golden master (exacte cijfers van scenario A) ── */
    t('Golden: total ≈ € 1.418.174', function () { expect(RA.total).close(1418173.6, 1); });
    t('Golden: verloren dagen = 3.608', function () { expect(RA.lostDays).toBe(3608); });
    t('Golden: kost per verloren dag = € 284', function () { expect(RA.costPerDay).toBe(284); });
    t('Golden: verzuimpercentage = 8,2%', function () { expect(RA.totVerz).close(8.2, 0.001); });
    t('Golden: risiconiveau = low', function () { expect(RA.riskKey).toBe('low'); });
    t('Golden: organisatorische impact = € 512.336', function () { expect(RA.orgImpactKost).close(512336, 1); });
    t('Golden: 110 arbeiders / 90 bedienden', function () {
      expect(RA.arbeiders).toBe(110); expect(RA.bedienden).toBe(90);
    });

    /* ── Kostenmechanica ── */
    t('costPerDay = round(salaris / dagen × 1,30 RSZ)', function () {
      expect(RA.costPerDay).toBe(Math.round(48000 / 220 * 1.30));
    });
    t('Vervangingskost = loonkost × vervangfactor%', function () {
      expect(RA.vervangingKost).close(RA.loonKost * 0.30, 1);
    });
    t('Organisatorische impact = loonkost × orgfactor%', function () {
      expect(RA.orgImpactKost).close(RA.loonKost * 0.50, 1);
    });

    /* ── Randgevallen ── */
    t('Edge: 0 FTE wordt geklemd naar 1 (geen deling door nul)', function () {
      var r = E.compute({ fte: 0, salary: 40000 });
      expect(r.fte).toBe(1);
      expect(r.total).notNaN();
      expect(r.perEmp).notNaN();
    });
    t('Edge: split 0% → alle medewerkers bedienden', function () {
      var r = E.compute({ fte: 100, splitA: 0, salary: 40000 });
      expect(r.arbeiders).toBe(0);
      expect(r.bedienden).toBe(100);
    });
    t('Edge: split 100% → alle medewerkers arbeiders', function () {
      var r = E.compute({ fte: 100, splitA: 100, salary: 40000 });
      expect(r.arbeiders).toBe(100);
      expect(r.bedienden).toBe(0);
    });
    t('Edge: nul verzuim → € 0, 0 dagen, risico low', function () {
      var r = E.compute({ fte: 100, salary: 40000, kA: 0, mA: 0, lA: 0, kB: 0, mB: 0, lB: 0 });
      expect(r.total).toBe(0);
      expect(r.lostDays).toBe(0);
      expect(r.riskKey).toBe('low');
      expect(r.differenceVsSector).less(0);
    });
    t('Edge: extreem salaris klemt op 5.000.000', function () {
      var r = E.compute({ fte: 10, salary: 99999999 });
      expect(r.input.salary).toBe(5000000);
    });
    t('Edge: string-invoer wordt geparseerd (zoals de UI ze levert: kale cijfers)', function () {
      // De UI strijkt scheidingstekens weg vóór de engine ("45.000" → "45000").
      var r = E.compute({ fte: '100', salary: '45000', splitA: '50' });
      expect(r.fte).toBe(100);
      expect(r.input.salary).toBe(45000);
    });
    t('Contract: num() leest "." als decimaal — UI moet duizendtal-punt strippen', function () {
      // Gedocumenteerd gedrag: "45.000" wordt 45 (punt = decimaal). Daarom MOET de UI
      // scheidingstekens verwijderen vóór verzending; deze test borgt die aanname.
      expect(E.compute({ salary: '45.000' }).input.salary).toBe(45);
    });

    /* ── Risico-drempels (split 100% → totVerz === kA) ── */
    function riskFor(rate) {
      return E.compute({ fte: 100, splitA: 100, salary: 40000, kA: rate, mA: 0, lA: 0 }).riskKey;
    }
    t('Risico: 8% verzuim (onder sector) → low', function () { expect(riskFor(8)).toBe('low'); });
    t('Risico: 10,14% (op sector) → avg', function () { expect(riskFor(10.14)).toBe('avg'); });
    t('Risico: 12,14% (≈ +2 pp) → elevated', function () { expect(riskFor(12.14)).toBe('elevated'); });
    t('Risico: 15% (sterk boven sector) → high', function () { expect(riskFor(15)).toBe('high'); });

    /* ── Formattering NL ↔ EN ── */
    var nlA = E.format(RA, 'nl');
    var enA = E.format(RA, 'en');
    t('NL bedrag: punt als duizendtal → "€ 1.418.174"', function () {
      expect(nlA.annual_absence_cost).toBe('€ 1.418.174');
    });
    t('EN bedrag: komma als duizendtal → "€ 1,418,174"', function () {
      expect(enA.annual_absence_cost).toBe('€ 1,418,174');
    });
    t('Risicolabel: NL "Laag" · EN "Low"', function () {
      expect(nlA.risk_level).toBe('Laag');
      expect(enA.risk_level).toBe('Low');
    });
    t('Verzuimpercentage eindigt op "%"', function () {
      expect(nlA.absence_rate).match(/%$/);
    });
    t('Verschil vs sector: getekend en eindigt op "pp"', function () {
      expect(nlA.difference_vs_sector).match(/pp$/);
      expect(nlA.difference_vs_sector).match(/^−/); // scenario A ligt onder sector → minteken
    });
    t('format() vult alle kern-variabelen (geen undefined)', function () {
      ['annual_absence_cost', 'lost_workdays', 'cost_per_employee', 'absence_rate',
       'sector_average', 'difference_vs_sector', 'risk_level', 'risk_explanation',
       'org_impact_cost', 'totale_kost', 'priority_1', 'priority_2', 'priority_3'
      ].forEach(function (k) {
        expect(nlA[k] != null && nlA[k] !== '').truthy();
        expect(enA[k] != null && enA[k] !== '').truthy();
      });
    });

    /* ── report() koppeling ── */
    t('report() levert {input, results, vars} consistent', function () {
      var rep = E.report(A, 'nl');
      expect(rep.results.total).toBe(RA.total);
      expect(rep.vars.annual_absence_cost).toBe(nlA.annual_absence_cost);
    });

    return tests;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = spec;
  if (root) root.VerzuimEngineSpec = spec;
})(typeof window !== 'undefined' ? window : null);
