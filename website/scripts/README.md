# /website/scripts

Shared JavaScript.

## Files

| File | Purpose |
|---|---|
| `motion.js` | Editorial motion runtime. Auto-marks sections/grids/headlines, IntersectionObserver-driven reveals, headline line-splitting, rAF parallax, language switcher, cookie consent banner, nav scroll-state. 304 lines. |

## Architecture

`motion.js` is an IIFE module. Self-guarded against double-init:

```js
(function(){
  if (window.__montisoroMotion) return;
  window.__montisoroMotion = true;
  // ... runtime ...
})();
```

It runs at end of `<body>` on every page. Respects `prefers-reduced-motion: reduce`.

## Per-page JS

Page-specific JS lives inline in each `<script>` block at the bottom of each HTML page. This includes:

- Calculator step engine (`calculator.html`)
- Fit-check questionnaire engine (`fit-check.html`)
- Contact calendar modal (`contact.html`)
- Casey waitlist form (`technologie.html`)

**Future refactor candidate:** extract these into dedicated `scripts/calculator.js`, `scripts/fit-check.js`, etc.

## Language switcher

`motion.js` maintains the `EN_PAGES` whitelist (line ~217). When adding a new translated page, append its filename to this array:

```js
var EN_PAGES = [
  'Home-en.html', 'about-en.html', 'aanpak-en.html',
  // ← add new -en.html files here
];
```

Without this, the switcher routes to the `contact-en.html` fallback.
