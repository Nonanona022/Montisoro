# /website/documents

Business-side reference: deploy guides, legal templates, content workflows.

## Files (planned)

| File | Purpose |
|---|---|
| `deploy.md` | Step-by-step deploy to Netlify / Vercel / Cloudflare Pages |
| `content-workflow.md` | How to edit page copy + sync NL/EN |
| `gdpr-checklist.md` | What's needed for GDPR compliance |

For now this folder holds a deploy quick-reference. Full docs are at the repo root in `/project-docs/`.

---

## Quick deploy reference

### Pre-deploy checklist

```
[ ] Web3Forms key set in config/config.js
[ ] favicon.svg in assets/
[ ] og-image.jpg (1200×630) in assets/
[ ] Tabler Icons pinned to @2.40.0 in all pages (already done)
[ ] motion.js EN_PAGES whitelist matches all -en.html files
[ ] robots.txt at /website root (one level above pages/)
[ ] sitemap.xml at /website root
[ ] All 4 forms tested end-to-end (calculator, fit-check, contact, casey)
[ ] mailto fallback verified (disable network → submit form → mail client opens)
```

### Netlify (drag-drop)

1. Sign in at https://app.netlify.com
2. Drag-drop the `/website` folder onto the dashboard
3. Site goes live at `<random-name>.netlify.app`
4. Settings → Domain → add `montisoro.com`
5. Settings → Build & deploy → publish directory: `website`

### Netlify (git-connected)

1. Connect the repo
2. Build command: leave empty
3. Publish directory: `website`
4. Deploy

### Recommended Netlify `_redirects` (place at `/website/_redirects`)

```
/                 /pages/Home.html        200
/en               /pages/Home-en.html     200
/about            /pages/about.html       200
/aanpak           /pages/aanpak.html      200
/technologie      /pages/technologie.html 200
/calculator       /pages/calculator.html  200
/fit-check        /pages/fit-check.html   200
/contact          /pages/contact.html     200
/privacy          /pages/privacy.html     200
/disclaimer       /pages/disclaimer.html  200
/en/*             /pages/:splat-en.html   200
/*                /pages/404.html         404
```

### Recommended `_headers`

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```
