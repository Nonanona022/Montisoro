# /admin-panel/config

Admin configuration.

## Files

| File | Purpose |
|---|---|
| `config.js` | Sets `window.SITE_URL` (public-site base for legal links, About preview, "back to site"). |

## Content

```js
window.SITE_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? '../../website/pages'
  : 'https://montisoro.com/pages';
```

**Web3Forms has been removed.** There is no client-side form key anymore — the site forms and
the calculator run on the Netlify Functions backend (`/api/form-submit` + `/api/calculator-report`,
Resend + Supabase). Backend secrets live in Netlify environment variables, never in static JS
(see `.env.example` and `project-docs/api.md`).

Admin login is also server-side now (`/api/admin-auth`, password + signed token via the
`ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` env vars — see `project-docs/auth.md` and
`admin-panel/documents/security-setup.md`).

## Future config additions

If a richer client config is ever needed, prefer keeping secrets **out of static JS** entirely
(HTTP-only cookies set by the auth gate, or server-side env). Only non-secret values
(e.g. `SITE_URL`, an analytics measurement ID) belong in this file.
