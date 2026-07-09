# /website

Public marketing site. Bilingual (NL + EN). Static HTML/CSS/JS. **No build step.**

---

## Folder structure

```
website/
├── pages/            All HTML pages (NL + EN + 404). One file per route.
├── layouts/          Layout fragments (nav + footer) — currently inlined in each page.
├── components/       Component documentation (CSS classes — primitives in stylesheets/).
├── stylesheets/      Shared CSS — motion.css + per-page inline <style> blocks.
├── scripts/          Shared JS — motion.js (auto-reveal + nav + lang switch).
├── services/         Shared logic — verzuim-engine.js (cost engine) + email-templates.js (server-rendered mail).
├── utils/            Tiny helpers — helpers.js ($, esc, fmt, eur, debounce).
├── api/              README — backend endpoints (Netlify Functions) documented here.
├── config/           Client config — config.js (non-secret) + calculator-params.js. Web3Forms removed.
├── hooks/            README — N/A for vanilla. Reserved for future migration.
├── contexts/         README — N/A for vanilla. Reserved for future migration.
├── assets/           Images, fonts, icons (currently: laurence.jpg only).
└── documents/        README, deploy guide, legal/business reference.
```

---

## Run locally

```bash
cd website
python3 -m http.server 8000
# → http://localhost:8000/pages/Home.html
```

Or use `npx serve .` from this folder.

---

## Deploy

The `/website` folder is the deployable site; `/netlify/functions` is the serverless backend.
Deploy both via Netlify (`netlify.toml` sets `publish = website` + `functions = netlify/functions`).
Set `pages/Home.html` as default index (or rename to `pages/index.html`).

Recommended Netlify `_redirects`:
```
/                 /pages/Home.html        200
/en               /pages/Home-en.html     200
/*                /pages/404.html         404
```

---

## Before going live (P0)

1. Set the backend env vars in Netlify (Resend + Supabase + `ALLOWED_ORIGIN` + base URLs — see `.env.example`). Until then forms are inert and fall back to `mailto:` (K1).
2. Test one calculator lead end-to-end (PDF generated + stored + client mail).
3. (Done) favicon `assets/favicon.svg` + og:image `assets/og-image.png` + `robots.txt` + `sitemap.xml`.
4. (Done) Tabler Icons pinned to `@2.40.0`.

See `/project-docs/todo.md` for the full list.
