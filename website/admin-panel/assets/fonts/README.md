# Self-hosted fonts (GDPR) — wat hier moet komen

CDN-fonts (Google Fonts) loggen EU-IP-adressen → AVG-aandachtspunt. Door de fonts
zelf te hosten verdwijnt die externe call. Het scaffold staat klaar in
`../stylesheets/fonts.css`; alleen de bestanden + de link-omzetting ontbreken nog.

## 1. Plaats deze WOFF2-bestanden in deze map (`website/assets/fonts/`)

| Bestand | Font · gewicht · stijl |
|---|---|
| `playfair-700.woff2` | Playfair Display · 700 · normaal |
| `playfair-900.woff2` | Playfair Display · 900 · normaal |
| `playfair-italic-700.woff2` | Playfair Display · 700 · italic |
| `dmsans-300.woff2` | DM Sans · 300 |
| `dmsans-400.woff2` | DM Sans · 400 |
| `dmsans-500.woff2` | DM Sans · 500 |
| `dmsans-600.woff2` | DM Sans · 600 |
| `dmmono-400.woff2` | DM Mono · 400 *(optioneel — alleen interne docs)* |
| `dmmono-500.woff2` | DM Mono · 500 *(optioneel)* |

**Bron:** download de families via [google-webfonts-helper](https://gwfh.mranftl.com/fonts)
(kies "latin", formaat WOFF2) of via Fontsource. Hernoem naar de namen hierboven —
dan kloppen de paden in `fonts.css` meteen.

## 2. Iconen (Tabler) — zelf hosten in `website/assets/icons/`

1. Download van jsDelivr (`@tabler/icons-webfont@2.40.0`): `tabler-icons.min.css`
   + de bijbehorende `fonts/tabler-icons.woff2` (en `.woff`/`.ttf`).
2. Plaats `tabler-icons.min.css` in `website/assets/icons/` en de fontbestanden in
   `website/assets/icons/fonts/` (pad in de CSS zo nodig bijstellen).

## 3. Omzetten in elke pagina (`website/pages/*.html`)

Vervang in de `<head>` deze twee regels …

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.40.0/tabler-icons.min.css" />
```

… door:

```html
<link rel="stylesheet" href="../stylesheets/fonts.css">
<link rel="stylesheet" href="../assets/icons/tabler-icons.min.css">
```

De `<link rel="preconnect" ...>`-regels naar fonts.googleapis.com/gstatic.com mogen dan weg.

> Zeg het en ik voer stap 3 (de omzetting over alle 18 pagina's + admin) in één keer door
> zodra de bestanden uit stap 1–2 aanwezig zijn. Tot dan blijft de CDN-link actief, zodat
> er niets breekt.
