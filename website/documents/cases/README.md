# Case-PDF's — testimonials op de homepage

De kaarten in "Wat onze klanten zeggen" (Home.html / Home-en.html) tonen onderaan
een **PDF-downloadknop**. Die knop is per kaart gekoppeld aan het `pdf:`-veld in:

    /website/data/testimonials.js

## Hoe activeer je een download

1. Leg het PDF-bestand hier neer, bv. `volvo.pdf`.
2. Zet in `testimonials.js` het `pdf:`-veld van die klant op het pad:

       { id:'q1', company:'Volvo Group', logo:'../assets/logos/volvo.svg',
         ... pdf:'../documents/cases/volvo.pdf', ... }

3. Klaar — de knop wordt automatisch de actieve **"Download case (PDF)"**.
   Zolang `pdf:` leeg is toont de kaart de inerte **"Case volgt" / "Case coming soon"**.

## Aanbevolen bestandsnamen (sluiten aan op de huidige klanten)

| Klant                         | id  | bestandsnaam        |
|-------------------------------|-----|---------------------|
| Volvo Group                   | q1  | `volvo.pdf`         |
| Alcon Laboratories Belgium    | q2  | `alcon.pdf`         |
| Novartis Manufacturing        | q3  | `novartis.pdf`      |
| AXA Belgium                   | q4  | `axa.pdf`           |
| Securitas                     | q5  | `securitas.pdf`     |
| Vaillant Group                | q6  | `vaillant.pdf`      |

> Tip: hetzelfde kan via het admin panel (Content → Klantenquotes → kaart bewerken →
> "Case-PDF" uploaden). Dan wordt de PDF in `testimonials.js` mee geëxporteerd.
> Een los bestand hier neerleggen + het pad invullen is lichter (geen base64 in de JS).
