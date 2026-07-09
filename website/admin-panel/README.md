# /admin-panel

Internal intelligence cockpit for Laurence. Hash-routing SPA. Static HTML/CSS/JS. **localStorage-driven (no real DB), demo-auth (no real auth).**

⚠️ **Do NOT deploy publicly without replacing the demo auth gate.** Anyone can read the password from `pages/admin-login.html` source.

---

## Folder structure

```
admin-panel/
├── pages/            admin.html (shell + all view templates) + admin-login.html
├── layouts/          README — shell layout is inlined in admin.html
├── components/       README — admin CSS primitives (defined in stylesheets/admin.css)
├── stylesheets/      admin.css (design system for the admin)
├── scripts/          admin.js + 6 feature modules (admin-pro/tools/final/agenda/enterprise/siteteam)
├── services/         admin-data.js (data layer — localStorage CRUD + KPI calc)
├── utils/            helpers.js ($, $$, esc, fmt, eur, debounce, currentUser)
├── api/              README — future API contract documented here
├── config/           config.js (sets SITE_URL · Web3Forms removed — forms run on the Netlify backend)
├── hooks/            README — N/A for vanilla
├── contexts/         README — N/A for vanilla
├── assets/           (currently empty — avatar fallback is initial-gradient CSS)
└── documents/        Operator manual, role permissions, future API design
```

---

## Run locally

```bash
cd admin-panel
python3 -m http.server 8000
# → http://localhost:8000/pages/admin-login.html
```

Demo credentials: `hello@montisoro.com` / `montisoro` (also: jeroen@, glenn@, reza@).

---

## Deploy (recommended)

Subdomain (e.g. `admin.montisoro.com`) behind **Cloudflare Access** (free up to 50 users):

1. Deploy `/admin-panel/` to Cloudflare Pages (or Netlify, Vercel)
2. Cloudflare Zero Trust → Access → Applications → add the subdomain
3. Policy: whitelist the 4 admin emails
4. IdP: Google Workspace OR one-time PIN email
5. Once Access is in front, the demo login is the second factor (or remove it entirely)

See `/project-docs/auth.md` for full migration options.

---

## Architecture

- **Single HTML file** (`pages/admin.html`) contains all 16 views as `<section class="view" id="view-<id>">`
- **Hash-routing:** `location.hash` → `showView(id)` toggles `is-active` class
- **All state** in `localStorage` (`montisoro.admin.data.v7` key)
- **Auth state** in `sessionStorage` (`admin.session`)
- **Module pattern:** IIFE with double-init guards
- **Globals (intentional):** `window.Admin`, `window.AdminData`, `window.init_<viewId>`

See `/project-docs/architecture.md` for the full picture.
