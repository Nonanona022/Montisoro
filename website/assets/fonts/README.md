# Self-hosted fonts (GDPR) — ✅ ACTIEF sinds 7 juni 2026

De Google Fonts CDN is volledig vervangen door lokale WOFF2-bestanden. Geen externe
font-call meer → geen EU-IP-logging → AVG-conform. De `@font-face`-regels staan in
`../stylesheets/fonts.css`, dat in elke pagina-`<head>` geladen wordt.

## Bestanden in deze map (latin-subset WOFF2, ~14 stuks, ±253 KB totaal)

| Bestand | Font · gewicht · stijl |
|---|---|
| `playfair-400.woff2` · `-500` · `-700` · `-900` | Playfair Display · normaal |
| `playfair-italic-400.woff2` · `-500` · `-700` | Playfair Display · italic |
| `dmsans-300.woff2` · `-400` · `-500` · `-600` · `-700` | DM Sans |
| `dmmono-400.woff2` · `-500` | DM Mono |

**Herkomst:** [Fontsource](https://fontsource.org) (`@fontsource/playfair-display`,
`@fontsource/dm-sans`, `@fontsource/dm-mono`, latin-subset) — dit is exact de Google-fontdata,
**SIL Open Font License 1.1**. Identieke glyph-outlines → géén visueel verschil t.o.v. de
vorige CDN-latin-subset. De gewichtenset = exact wat de live CDN-links serveerden (geen
weight-synthese, dus geen subtiele afwijkingen).

## Hoe het geladen wordt (per pagina)

```html
<link rel="preload" href="../assets/fonts/dmsans-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../assets/fonts/playfair-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../stylesheets/fonts.css">
```

De twee `<link rel="preconnect">`-regels naar googleapis/gstatic zijn verwijderd. De
`@import` van Google Fonts in `montisoro-v2.css` is verwijderd. `font-display:swap` voorkomt
onzichtbare tekst tijdens laden. De admin (`/admin-panel`) heeft een eigen kopie van deze
map + `fonts.css` (self-contained, aparte infra).

## Iconen — ✅ óók self-hosted (sinds 7 juni 2026)

- **Iconen** (Tabler + Phosphor) staan nu lokaal in `website/assets/icons/` (woff2 + herschreven CSS).
  Geen externe icon-CDN meer. De admin heeft een eigen Tabler-kopie in `admin-panel/assets/icons/`.
- **CSP** (`_headers`): `font-src 'self'` dekt zowel tekst- als icoonfonts. De resterende
  `fonts.googleapis.com`/`gstatic.com`/`jsdelivr`-allowances zijn nu ongebruikt op productpagina's maar
  ongevaarlijk (CSP verstuurt zelf geen request); mogen later opgeruimd worden.
