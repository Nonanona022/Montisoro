# Montisoro — deploy bundle

Dit is de nieuwe Montisoro-website + calculator/PDF-backend, klaar om naar
Netlify te deployen via GitHub.

## Inhoud
- `website/`      → de statische site (wordt gepubliceerd)
- `netlify/`      → de serverless functions (calculator, formulieren, admin-auth)
- `netlify.toml`  → Netlify-configuratie (publish dir, functions, redirects)
- `package.json`  → backend-dependencies (Netlify installeert ze automatisch)

## Deploy-stappen (kort)
1. Maak een nieuwe (private) repository op github.com.
2. Upload de VOLLEDIGE inhoud van deze map naar de repo (mappen-structuur behouden).
3. In Netlify: Add new site → Import an existing project → kies de repo.
   Netlify leest `netlify.toml` zelf — build laten staan, publish = `website`.
4. Zet de environment variables (zie de aparte sleutel-lijst).
5. Test op het `*.netlify.app`-adres.
6. Pas daarna de DNS aan bij EasyHost om live te gaan.

> De admin-panel (admin.montisoro.com) wordt apart gedeployed — niet in deze bundle.

## Interne bestanden uit de publicatie (deploy-poort)
`.gitignore` houdt alle interne/dev-bestanden (audit-decks, prototypes, briefings,
approval pack, plan-docs, de verzuimrapport-testflow-cluster, dev-stubs) uit de
publicatie — óók als een toekomstige **volledige** re-bundle (verse mirror van de
root-`website/`) ze fysiek terugkopieert. Wie iets bewust wél wil publiceren, haalt
het betreffende pad uit `.gitignore`.

> ⚠️ De runtime PDF-templates blijven WÉL meegaan: `website/documents/`
> `verzuimrapport-test-report{,-en}.html` + `verzuimrapport-test{,-en}.content.js`
> worden server-side gelezen door `netlify/functions/_lib/pdf.js`. Daarom staan ze
> als EXACTE paden in `.gitignore` uitgesloten van uitsluiting — geen glob op
> `verzuimrapport-test*`.

## Analyse-module — database-migraties (VERPLICHT vóór livegang)
De Analyse-module (dashboard-sectie "Analyse") vergt vier nieuwe tabellen. Draai
in de Supabase SQL-editor, in volgorde, de bestanden uit `supabase/migrations/`:

1. `0018_events.sql`           → event-stroom (cookieloos; sessie-id + dagelijkse bezoeker-hash)
2. `0019_web_vitals.sql`       → websiteprestaties (LCP/INP/CLS/TTFB)
3. `0020_daily_metrics.sql`    → rollup-tabel (schema; live-berekening tot volume het vraagt)
4. `0021_form_submissions_booking.sql` → fix: CHECK uitgebreid met 'booking'
5. `0022_gsc_connection.sql`   → Search Console-koppeling (één rij, VERSLEUTELDE OAuth-tokens)

Alle migraties zijn idempotent (veilig te herhalen), hebben RLS aan en zijn enkel
via de service-role toegankelijk. Geen enkel IP, cookie of fingerprint wordt opgeslagen.

### Environment variable (optioneel)
- `ANALYTICS_SALT` — geheime salt voor de dagelijks-roterende bezoeker-hash in
  `/api/event`. Niet gezet? Dan valt de functie terug op `ADMIN_SESSION_SECRET`
  (dat al bestaat). Zetten is netjes (scheidt analytics- van sessie-secret), maar
  niet strikt nodig.

### Nieuwe routes (staan al in `netlify.toml` + `website/_redirects`)
- `POST /api/event`          → cookieloze event-ingest (publiek, rate-limited, PII-vrij)
- `POST /api/admin-metrics`  → aggregaties voor het dashboard (HMAC-beveiligd)

> Zonder de migraties tonen de Analyse-views netjes "Meting nog niet actief" i.p.v.
> te breken. De site zelf (tracker `events.js`) is inert-safe: zonder DB gebeurt er niets.

## Calculator / PDF / e-mail backend (VERPLICHT voor leads, PDF-rapport én mail)
Dit activeert de calculator-inzendingen, het PDF-rapport, de klant- + interne mail
en de admin-modules **"PDF Rapporten"** + **"E-mail log"** (+ regen/resend in de
rapport-drawer). Zonder deze sleutels blijft alles inert-safe: de site valt terug op
het mailto-vangnet en de admin-views tonen "Backend niet geconfigureerd (K1)" —
niets breekt, maar er komen geen leads/PDF's binnen.

### 1. Supabase (database + storage)
- Draai de calculator-migraties in de SQL-editor (idempotent), in volgorde `0001`–`0003`
  (o.a. `calculator_submissions`, `form_submissions`, `delivery_failures`, `leads`,
  `site_content`, `audit_log`) + `0016` (verbreedt de `site_content`-CHECK naar alle
  9 content-keys, incl. `feature_flags` + `booking_schedule`). Het bestand
  `supabase/ALL-migrations-0001-0016.sql` bundelt ze in de juiste volgorde.
- Maak een **private** storage-bucket voor de PDF's, standaardnaam **`verzuimrapporten`**
  (of zet `PDF_BUCKET`). Niet publiek maken — de admin haalt tijdelijke *signed URLs* op.

### 2. Resend (e-mail)
- Resend-account → verifieer het afzenddomein (`montisoro.com`) → maak een API-key.

### 3. Netlify environment variables
| Variabele | Waarde |
|---|---|
| `SUPABASE_URL` | project-URL (Supabase → Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key (server-side only, nooit client) |
| `PDF_BUCKET` | *(optioneel)* bucketnaam; leeg = `verzuimrapporten` |
| `RESEND_API_KEY` | Resend API-key |
| `MAIL_FROM` | *(optioneel)* afzender; leeg = `Montisoro <hello@montisoro.com>` |
| `INTERNAL_NOTIFY_EMAIL` | *(optioneel)* interne ontvanger; leeg = `hello@montisoro.com` |
| `SITE_BASE_URL` | `https://montisoro.com` (asset-base in de mails) |
| `ADMIN_BASE_URL` | admin-URL — voor de "open in dashboard"-link in de interne mail |
| `ALLOWED_ORIGIN` | `https://montisoro.com` (CORS voor de admin-API's) |
| `ADMIN_SESSION_SECRET` | HMAC-secret (bestaat al; gedeeld met de admin-login) |

Optioneel — **Outlook-agenda** (live vrij/bezet in de boekingsflow; zonder deze
sleutels toont de flow het via het dashboard gepubliceerde weekschema met
gesimuleerde bezetting): `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`,
`MS_CALENDAR_USER`.

### 4. Test (op `*.netlify.app`, vóór DNS)
- Vul de calculator in met een echt e-mailadres → check: mail + PDF ontvangen, rij
  verschijnt in het dashboard (Inbox / PDF Rapporten), `pdf_status = generated`.
- Admin → **PDF Rapporten** → Download; en in de rapport-drawer → **Opnieuw genereren** /
  **Opnieuw versturen** (het nieuwe geauthenticeerde action-pad).
- Admin → **E-mail log** → Stuur testmail.
- Daarna mogen de laatste twee **'Preview'-badges** (PDF Rapporten, E-mail log) weg —
  één regel in `admin.js` (zoek `Audit P11`).

## Search Console-koppeling (SEO-view) — OPTIONEEL, later activeerbaar
De SEO-view kan organische zoekprestaties (zoekwoorden, impressies, CTR, positie)
uit Google Search Console tonen. Dit werkt via OAuth 2.0. **Zonder configuratie
toont de view netjes "nog niet ingesteld" — de rest van de module werkt gewoon.**

**Voorwaarde vooraf (eenmalig, niet-technisch):** verifieer de site in Search
Console — `search.google.com/search-console` → property (domein) toevoegen →
eigenaarschap bevestigen (DNS-record of HTML-tag). Data verschijnt na enkele dagen.

**Google Cloud (eenmalig, ~15 min):**
1. `console.cloud.google.com` → nieuw project → **API's & services**.
2. Schakel de **Google Search Console API** in.
3. **OAuth consent screen** → type "Extern", app-naam + support-e-mail; voeg de
   admin-e-mail(s) toe als test-user (of publiceer de app).
4. **Credentials → OAuth client-ID → Webtoepassing**. Zet als
   *Geautoriseerde redirect-URI* exact: `https://<uw-domein>/api/gsc-callback`
   (bv. `https://montisoro.com/api/gsc-callback`; voor staging het staging-domein).
5. Kopieer **Client-ID** en **Client-secret**.

**Environment variables (Netlify, per context):**
- `GSC_CLIENT_ID`      — OAuth-client-ID uit stap 5
- `GSC_CLIENT_SECRET`  — OAuth-client-secret uit stap 5
- `SITE_BASE_URL`      — bv. `https://montisoro.com` (bepaalt de redirect-URI + terugkeer)
- `GSC_TOKEN_KEY`      — (optioneel) aparte sleutel voor token-encryptie; niet gezet →
  valt terug op `ADMIN_SESSION_SECRET`.

Daarna in het dashboard: **Analyse → SEO → "Search Console koppelen"** → eenmalig
met Google inloggen → property kiezen. De (refresh-)tokens worden **AES-256-GCM
versleuteld** in `gsc_connection` bewaard; het IP/wachtwoord van Google zien wij nooit.

### Nieuwe routes (staan al in `netlify.toml` + `website/_redirects`)
- `POST /api/admin-gsc`      → status/koppel-URL/data/property/ontkoppelen (HMAC-beveiligd)
- `GET  /api/gsc-callback`   → OAuth-redirect-doel (publiek; ondertekende state, CSRF-veilig)

## Verhuizen naar het echte domein (bv. netlify.app → montisoro.com)
Wanneer de site van het test-subdomein (`mmontisoro.netlify.app`) naar het
definitieve domein gaat, hoef je NIET alles opnieuw te doen. Wijzig enkel dit:

**Aanbevolen route:** koppel het echte domein als *custom domain* aan DEZELFDE
Netlify-site (Netlify → Domain settings → Add custom domain). Dan blijft het
dezelfde site + dezelfde functions; alleen de punten hieronder wijzigen.

1. **Google Cloud → APIs & Services → Credentials → OAuth-client → Authorized
   redirect URIs:** voeg `https://montisoro.com/api/gsc-callback` toe.
   (Laat de oude netlify-URI erin staan → beide werken tijdens de overstap.)
2. **Netlify → Environment variables → `SITE_BASE_URL`:** wijzig naar
   `https://montisoro.com` (GEEN slash op het einde) → daarna **redeployen**.
   Moet EXACT matchen met de redirect-URI uit stap 1 (anders `redirect_uri_mismatch`).
3. **Google Search Console:** voeg `https://montisoro.com` als NIEUWE property toe
   en verifieer opnieuw (het HTML-bestand `google9543dd8a5d48d45c.html` staat al in
   de site → verifieert doorgaans automatisch). Oude property mag blijven staan.
4. **Dashboard → Analyse → SEO → opnieuw koppelen** en de nieuwe property kiezen.

**Blijft ONgewijzigd (niet domein-gebonden):** `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET`,
`ADMIN_SESSION_SECRET`, `ANALYTICS_SALT`, `GSC_TOKEN_KEY`, alle Supabase-migraties,
de functions en de codebase, het OAuth-consent screen + test-users.
