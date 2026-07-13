# /website/layouts

**No standalone layout files** in this vanilla project. Each HTML page in `/pages/` is self-contained — it inlines its own `<header>` (nav) and `<footer>`.

---

## Why no layouts/

Vanilla HTML has no native templating. There are 3 ways layouts could work:

1. **Server-side include** (PHP/SSI) — not used, project is fully static
2. **Build-time template** (Eleventy/Nunjucks/Astro) — not used, no build
3. **JS partial loader** — possible but adds a flash-of-unstyled-content

So we live with duplication. Every page has the same nav and footer markup inlined. When updating nav/footer, do find-and-replace across all 18 pages.

---

## Layout fragments (reference)

Below are the canonical nav and footer markup blocks. Use these as the source of truth when editing every page in `/pages/`.

### Top navigation (NL)

```html
<nav class="m-nav">
  <a class="m-nav-logo" href="Home.html">Montisoro<em>.</em></a>
  <ul class="m-nav-links">
    <li><a href="Home.html">Home</a></li>
    <li><a href="aanpak.html">Aanpak</a></li>
    <li><a href="technologie.html">Technologie</a></li>
    <li><a href="calculator.html">Calculator</a></li>
    <li><a href="fit-check.html">Fit check</a></li>
    <li><a href="about.html">About</a></li>
    <li><a href="contact.html" class="m-cta">Plan een gesprek</a></li>
    <li><button class="m-lang" data-lang>EN</button></li>
  </ul>
  <button class="m-hamburger" aria-label="Menu">☰</button>
</nav>
```

### Top navigation (EN)

Same structure with `-en.html` suffixes on every `href`, and the language button label flipped to `NL`.

### Footer

See `Home.html` lines near the bottom — the canonical footer with address, BTW number, contact links, and legal-page links.

---

## Future migration

If the project moves to a templating system later, `/layouts/` becomes the natural home for:
- `default.html` — base shell (head, nav, footer, body slot)
- `narrow.html` — narrow content variant (privacy/disclaimer)
- `landing.html` — hero-led variant (Home)

For now, this folder stays empty except for this README.
