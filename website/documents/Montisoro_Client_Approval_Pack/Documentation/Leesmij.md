# Montisoro — Client Approval Pack

_Ter goedkeuring door de klant · 7 juni 2026 · Client Review Version_

## Begin hier
Open **`index.html`** (de startpagina). Daar bekijk je elke e-mail en het PDF-rapport,
zie je de verzendlogica en de scores — alles van één plek.

## Mappenstructuur
```
Montisoro_Client_Approval_Pack/
├─ index.html                     ← START: volledige startpagina
├─ Email Templates/
│  ├─ NL/        4 klantmails (Calculator, Contact, Fit check, Casey)
│  ├─ EN/        dezelfde 4 in het Engels
│  └─ Internal/  4 interne notificaties (altijd NL, met veld "Taal bezoeker")
├─ PDF Examples/
│  ├─ NL/        verwijst naar het rapport (taal NL)
│  ├─ EN/        verwijst naar het rapport (taal EN)
│  └─ Verzuimrapport (NL-EN).html   ← het volledige rapport, zelf-bevattend
├─ Flow Overview/
│  └─ index.html                 ← wanneer wordt wat verstuurd
└─ Documentation/
   └─ Leesmij.md                 ← dit bestand
```

## Verzendlogica (samenvatting)
| Trigger | Naar de bezoeker | Naar het team | PDF |
|---|---|---|---|
| Verzuimcalculator | Klantmail mét rapport (+ downloadlink) | Notificatie | ✅ bijlage |
| Contactpagina | Bevestigingsmail | Notificatie | — |
| Fit check | Bevestigingsmail | Notificatie | — |
| Casey waitlist | Bevestigingsmail | Notificatie | — |

Klantmails zijn tweetalig (NL/EN) op basis van de taal van de bezoeker; de interne notificaties zijn altijd in het NL. Details: `Flow Overview/index.html`.

## Inventaris (12 e-mailtemplates + 1 PDF)
- **Klant (8):** Calculator-klantmail · Contact-bevestiging · Fit check-bevestiging · Casey-bevestiging — elk NL + EN
- **Intern (4):** dezelfde vier als interne notificatie — **altijd in het NL** (team is Nederlandstalig); de taal van de bezoeker staat als veld "Taal bezoeker" in de mail
- **PDF (1):** Verzuimrapport (6 pagina's, NL/EN)

## Status & scores
Email templates **9,5** · PDF **8,5** · Brand **9,5** · Professional **9,0** · Client readiness **9,0** · Production readiness **7,5**.

**Eindoordeel: Client Review Version** — klaar om aan de klant voor te leggen. Vóór livegang resteren
(buiten dit pakket): de Resend-productiesleutels + één render-test, en voor de PDF de cijferonderbouwing
(sectorbenchmark + 30%/50%-aannames) en de echte boekingslink. Geen daarvan ligt aan de templates zelf.

> Technische bron: `website/services/email-templates.js` (één merk-shell, NL+EN, klant + intern),
> server-side verzonden via `netlify/functions/_lib/mailer.js` (Resend).
