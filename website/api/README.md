# /website/api

**There is no in-site API server**, but the site is backed by **Netlify Functions** (FASE 2)
for the forms and the calculator. This folder is documentation-only — the full contract lives
in `/project-docs/api.md`.

---

## Backend endpoints (Netlify Functions)

| Endpoint (alias) | Function | Purpose |
|---|---|---|
| `POST /api/form-submit` | `netlify/functions/form-submit.js` | Contact · fit check · Casey waitlist → internal e-mail (Resend). E-mail only. |
| `POST /api/calculator-report` | `netlify/functions/calculator-report.js` | Calculator → PDF report + client mail + storage (Resend + Supabase). |
| `POST /api/admin-auth` | `netlify/functions/admin-auth.js` | Server-side admin login. |

Aliases are defined in `netlify.toml`; raw paths are `/.netlify/functions/<name>`.
**Web3Forms has been removed** — no page POSTs to `api.web3forms.com` and there is no
client-side key. Every form keeps a `mailto:` fallback while the backend env keys are unset (K1).

## Other external resources

| Service | Endpoint | Purpose |
|---|---|---|
| Google Fonts | `https://fonts.googleapis.com/...` | Web fonts (CDN) |
| Tabler Icons | `https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.40.0/...` | Icon font (CDN) |

## Request shape (form-submit)

```http
POST /api/form-submit
Content-Type: application/json

{
  "type":   "contact" | "fitcheck" | "casey",
  "lang":   "nl" | "en",
  "fields": { "email": "...", ...type-specific... },
  "botcheck": ""        // honeypot
}
```

Response: `{ "ok": true, "mail_status": "sent" }`. See `/project-docs/api.md` for the
calculator-report shape, field keys, validation and the e-mail templates.
