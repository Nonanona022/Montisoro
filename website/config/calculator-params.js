/* ═══════════════════════════════════════════════════════════════════
   Montisoro — Verzuimcalculator PARAMETERS
   ───────────────────────────────────────────────────────────────────
   DIT BESTAND MAG AANGEPAST WORDEN als de wet of de sectorcijfers wijzigen.
   Beheer bij voorkeur via het admin-panel → "Calculator-parameters"
   (knop "Exporteer config" genereert exact dit bestand).

   Laad dit bestand VÓÓR verzuim-engine.js. De engine neemt deze waarden over.
   Eén bron van waarheid: calculator (UI), PDF-rapport én e-mail gebruiken dit.

   Laatst bijgewerkt: 2026-06-14
═══════════════════════════════════════════════════════════════════ */
(function (root) {
  var CONFIG = {
    // Patronale lasten (RSZ) — factor op het brutoloon. 1.30 = +30%.
    employerLoad: 1.30,

    // Belgisch sectorgemiddelde per verzuimcategorie (% van werkdagen).
    // Bron: SD Worx Verzuimbarometer 2025 (nationaal, alle sectoren). Jaarlijks bijwerken.
    sector: { K: 3.18, M: 3.10, L: 3.86 },   // kort · middellang · langdurig

    // Standaardaandelen op de directe loonkost (de bezoeker kan deze in de
    // calculator zelf bijstellen; dit zijn de uitgangswaarden + server-fallback).
    vervangFactor: 30,    // vervangingskosten = % van directe loonkost
    orgFactor: 50,        // organisatorische (indirecte) impact = % van directe loonkost

    // Besparingsscenario's: reductie in procentpunt verzuim.
    savingSteps: [0.5, 1, 2],

    // Risicodrempels = verschil (procentpunt) t.o.v. het sectorgemiddelde.
    //   diff < lowMax        → Laag
    //   diff ≤ avgMax        → Gemiddeld
    //   diff ≤ elevatedMax   → Verhoogd
    //   anders               → Hoog
    risk: { lowMax: -0.5, avgMax: 1.0, elevatedMax: 3.0 }
  };

  if (root) root.MONTISORO_CALC_CONFIG = CONFIG;
  if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
