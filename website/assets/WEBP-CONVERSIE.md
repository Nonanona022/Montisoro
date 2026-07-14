# WebP-conversie — recept (lokaal draaien)

De online-omgeving kan géén WebP encoderen (canvas valt terug op PNG), dus dit draai je
één keer op je eigen checkout. Alle originelen blijven staan; er komt per beeld een `.webp`
naast met exact dezelfde naam. Daarna doet Claude de `<picture>`-rewire in de HTML, en commit
je de nieuwe `.webp`-assets + de gewijzigde HTML **samen** via GitHub Desktop (zo breekt live
nooit tussenin).

**Niet omzetten** (bewust): `og-image.jpg` (social scrapers slikken WebP niet betrouwbaar),
`favicon.png` / `favicon.ico` / `favicon.svg`, en de `email-*`-beelden (mailclients ondersteunen
WebP slecht). Die blijven zoals ze zijn.

---

## Optie A — Node + sharp (aanbevolen, batch, reproduceerbaar)

Vereist Node.js. Voer uit in de map `website/` (of pas `ROOT` aan).

```bash
npm install sharp glob
node webp-convert.mjs
```

`webp-convert.mjs` (zet dit bestand in `website/`):

```js
import sharp from 'sharp';
import { glob } from 'glob';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = 'assets';
// beelden die NIET omgezet worden
const SKIP = [/favicon\./i, /og-image\./i, /email-/i];
// kwaliteit: foto's 80, PNG-logo's/line-art hoger voor scherpe randen
const q = f => /logo|wordmark|favicon/i.test(f) ? 92 : 80;

const files = await glob(`${ROOT}/**/*.{png,jpg,jpeg}`, { nocase: true });
let saved = 0, before = 0, after = 0;
for (const f of files) {
  if (SKIP.some(re => re.test(path.basename(f)))) continue;
  const out = f.replace(/\.(png|jpe?g)$/i, '.webp');
  await sharp(f).webp({ quality: q(f) }).toFile(out);
  const b = fs.statSync(f).size, a = fs.statSync(out).size;
  before += b; after += a; saved++;
  console.log(`${out}  ${(b/1024).toFixed(0)}KB → ${(a/1024).toFixed(0)}KB`);
}
console.log(`\n${saved} beelden · ${(before/1024/1024).toFixed(2)}MB → ${(after/1024/1024).toFixed(2)}MB`);
```

## Optie B — cwebp (Google WebP-tools, geen Node)

Installeer `cwebp` (libwebp). Dan, in `website/assets/`:

```bash
# macOS / Linux
find . -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) \
  ! -iname 'favicon*' ! -iname 'og-image*' ! -iname 'email-*' \
  -exec sh -c 'cwebp -q 82 "$1" -o "${1%.*}.webp"' _ {} \;
```

```powershell
# Windows PowerShell
Get-ChildItem -Recurse -Include *.jpg,*.jpeg,*.png |
  Where-Object { $_.Name -notmatch 'favicon|og-image|email-' } |
  ForEach-Object { cwebp -q 82 $_.FullName -o ($_.FullName -replace '\.(jpg|jpeg|png)$','.webp') }
```

## Optie C — geen installatie: squoosh.app

Sleep de beelden op https://squoosh.app, kies **WebP**, quality ~80, download.
Prima voor een handvol beelden; voor de hele set is A of B sneller.

---

## Daarna

1. Kopieer de gegenereerde `.webp`'s ook naar de twee deploy-trees:
   `deploy-bundle/website/assets/` en `deploy-bundle/website/admin-panel/…` (als daar assets staan).
   (Claude kan dit ook doen zodra de `.webp`'s in het project staan.)
2. Laat Claude de `<picture>`-rewire doen (NL+EN, 3 trees).
3. Commit `.webp` + HTML **samen** en deploy.
