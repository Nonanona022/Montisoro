# /website/pages

All HTML pages — one file per route. Each is a complete, self-contained document with its own inline `<style>` block (page-specific CSS) and `<script>` block (page-specific JS).

## Files

| File | URL | Lang | Purpose |
|---|---|---|---|
| `Home.html` | `/pages/Home.html` | NL | Landing — hero, KPIs, 3 strengths, Casey banner, founder |
| `Home-en.html` | `/pages/Home-en.html` | EN | English mirror of Home |
| `about.html` / `about-en.html` | … | NL/EN | Mission, origin story, 5 principles, team grid |
| `aanpak.html` / `aanpak-en.html` | … | NL/EN | Methodology |
| `technologie.html` / `technologie-en.html` | … | NL/EN | Storm + Casey AI. Contains Casey waitlist form. |
| `calculator.html` / `calculator-en.html` | … | NL/EN | 5-step ROI calculator. Premium report form. |
| `fit-check.html` / `fit-check-en.html` | … | NL/EN | 4-question diagnostic. Routes to one of 6 recommendations. Email-gate form. |
| `contact.html` / `contact-en.html` | … | NL/EN | 3 channels + calendar modal. Diagnostic call form. |
| `privacy.html` / `privacy-en.html` | … | NL/EN | GDPR statement |
| `disclaimer.html` / `disclaimer-en.html` | … | NL/EN | Liability, IP, third parties |
| `404.html` | `/pages/404.html` | both | Custom error page (NL/EN auto-detect via referrer) |

## Conventions

- Filenames are exactly the routes (`/pages/Home.html` etc.).
- Every NL file has an EN twin with `-en` suffix.
- Each page references shared resources via relative paths:
  - `../stylesheets/motion.css`
  - `../scripts/motion.js`
  - `../config/config.js` (only on form pages)
  - `../assets/laurence.jpg` (only Home + About)
- Tabler Icons CDN is pinned to `@2.40.0` (was `@latest` in legacy root — fixed during restructure).

## Adding a new page

1. Create `new-page.html` here
2. Create `new-page-en.html` for the EN mirror
3. Update `EN_PAGES` array in `../scripts/motion.js` (line ~217) — language switcher needs this whitelist
4. Add nav link in every page's `<nav>` (NL and EN versions)
5. Add the page to the sitemap.xml (when one exists)

## Editing content

- **In-file:** edit the HTML directly. Save. Refresh.
- **Via admin:** the admin's `#content` view shows pages NL/EN side-by-side, but **does not currently write to these files** (saves to localStorage only). When a backend exists, that pipeline will write here.
