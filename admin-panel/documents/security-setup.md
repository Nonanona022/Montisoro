# Admin Security Setup — K2 remediation

> Het admin-panel is een statische SPA. **Echte beveiliging = de buitenste toegangspoort.**
> De server-side wachtwoordcontrole hieronder is hardening (defense-in-depth), geen vervanging
> voor de poort.

## Twee lagen

### Laag 1 — Externe toegangspoort (VERPLICHT vóór publieke URL)
Zet het hele admin-panel achter **Cloudflare Access** (of een gelijkwaardige IdP-gate).

1. Cloudflare Zero Trust → **Access → Applications → Add application** (Self-hosted).
2. Application domain: `admin.montisoro.com` (of het pad waarop admin draait).
3. **Policy**: Allow · Include → *Emails* → de 4 admin-adressen
   (`laurence@`, `jeroen@`, `glenn@`, `reza@montisoro.com`), of een Google-Workspace-groep.
4. Identity provider: Google Workspace of One-time PIN.
5. Sessieduur: 8–24u.

Effect: niemand bereikt zelfs de loginpagina zonder geverifieerde identiteit. Dit dicht K2.

### Laag 2 — Server-side wachtwoord (deze repo)
`netlify/functions/admin-auth.js` controleert het wachtwoord server-side en geeft een
**HMAC-ondertekend sessietoken** terug. Het wachtwoord staat **niet meer in de client-broncode**.

**Env-variabelen (Netlify → Site settings → Environment):**

| Variabele | Doel |
|---|---|
| `ADMIN_PASSWORD` | Het admin-wachtwoord (server-side gecontroleerd) |
| `ADMIN_SESSION_SECRET` | Random secret (32+ tekens) voor tokenondertekening |
| `ALLOWED_ORIGIN` | Bv. `https://admin.montisoro.com` (CORS) |

Zonder deze env's antwoordt de functie `503 auth_not_configured` → **geen toegang in productie**
(veilige default). De demo-fallback (`montisoro`) is sinds de pre-launch-audit (P1) **uitsluitend op een
lokale loopback-machine** actief (`localhost`/`127.0.0.1`/`::1`), nooit op een publiek bereikbare host —
ook niet op een Netlify-preview of staging-URL. Daar telt enkel het server-pad; faalt dat, dan faalt de
login **dicht**.

### Laag 0 — Client-gate (UX, geen beveiliging)
De auth-gate in `admin.js` weigert sinds de audit (P2) op een **publieke host** elke sessie die niet
`mode:'server'` + token + geldige `exp` is — een zelf-geïnjecteerde demo-sessie wordt geweigerd en de
sessie wordt bij tab-focus herbewaakt. Zo komt de rol daar uit een server-ondertekend token (koppelt aan
P3). Dit is comfort/afscherming, géén vervanging voor Laag 1.

## Rol = server-side bron van waarheid
`admin-auth.js` bepaalt de rol (admin/consultant/sales/viewer) op basis van het e-mailadres en zet
die in het ondertekende token. De client-side `admin-roles.js` blijft de UI gaten (gemak), maar is
**geen** beveiliging — dat is bewust gedocumenteerd. Het volledige server-side afdwingingscontract
(capability→endpoint-matrix, default-deny, admin-only deletes) staat in `admin-panel/api/README.md` (P3).

## Sessie-verloop
Het token bevat `exp` (8u). De auth-gate in `admin.js` wist een verlopen sessie en stuurt terug
naar de login.

## Verificatie — bewijs dat de poort dicht is (na deploy)
Voer deze checks uit op de productiehost; elk moet het verwachte resultaat geven:

1. **Access-gate actief** — open het admin-pad in een incognitovenster zónder IdP-login.
   Verwacht: Cloudflare's Access-loginscherm, niet de admin-loginpagina.
2. **Geen shell zonder identiteit** — `curl -I https://admin.montisoro.com/` (geen Access-cookie).
   Verwacht: `302`/`401` van Cloudflare Access, nooit `200` met admin-HTML.
3. **API weigert zonder token** — `curl -i https://admin.montisoro.com/api/admin-submissions`.
   Verwacht: `401` (HMAC-verificatie faalt zonder geldig token).
4. **Demo-fallback dicht** — log op de productiehost in met een demo-adres + `montisoro`.
   Verwacht: “Authenticatie is niet beschikbaar op deze omgeving” — géén toegang.
5. **Client-gate** — plak een verzonnen `admin.session` (mode:'demo') in sessionStorage en herlaad.
   Verwacht: meteen terug naar de login (publieke host eist een server-uitgegeven sessie).

## P3 — Rol-verificatie (na de server-side implementatie)
Test met één account per rol dat de **server** de matrix afdwingt (niet enkel de UI verbergt):
- **viewer / sales** → een `PATCH`/`DELETE` op bv. `/api/admin-content` of een lead moet **`403`** geven.
- **consultant** → `content:edit` / `leads:edit` lukt (`200`), maar een **delete** en `calc_params:edit` → **`403`**.
- **admin** → alles `200`.
- Elke geslaagde destructieve delete staat in de **audit-log** (actor + tijdstip) vóór de rij weg is.
- Rol NOOIT uit request-body/query vertrouwen — enkel uit het geverifieerde HMAC-token.

Volledige capability→endpoint-matrix + default-deny-regels: **`admin-panel/api/README.md`** (sectie "Authorization").

## Checklist vóór livegang (K2)
- [ ] Admin achter Cloudflare Access (Laag 1)
- [ ] `ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET` + `ALLOWED_ORIGIN` gezet (Laag 2)
- [ ] Eén login end-to-end getest op de productiehost (server-pad, geen demo-fallback)
- [ ] Bevestigd dat de demo-fallback op de productiehost **niet** werkt
- [ ] Verificatie 1–5 hierboven doorlopen (elk het verwachte resultaat)
