# /website/stylesheets

Shared CSS. Single file: `motion.css`.

## Files

| File | Purpose |
|---|---|
| `motion.css` | Editorial motion system — shared across ALL pages. 796 lines. Defines reveal animations, easings, headline line-split classes, parallax classes. |

## Where the rest of the CSS lives

**Per-page CSS is inline.** Each HTML file in `/pages/` has its own `<style>` block with page-specific layout + components. This is intentional — keeps each page self-contained.

Tokens (CSS custom properties) are duplicated in each page's `:root`. To change a global token (e.g. the brand orange), you currently need to find/replace across all pages.

**Future refactor candidate:** extract shared tokens into `tokens.css` and have each page `<link>` it.

## Tokens reference

See `/project-docs/styling.md` for the full token list. Highlights:

```css
--bg:#13100D;           /* base dark */
--bg-page:#f9f8f6;      /* light sections */
--orange:#E8592B;       /* signature accent */
--off:#F0EDE8;          /* off-white type on dark */
--serif:'Playfair Display',Georgia,serif;
--sans:'DM Sans',sans-serif;
```

## Motion attributes (auto-applied by motion.js)

| Attribute | Effect |
|---|---|
| `data-reveal="fade"` | Element fades + slides in when entering viewport |
| `data-cascade` | Child elements reveal in sequence |
| `data-reveal-group` | Grid container — children stagger |
| `.line-reveal` | Headline wrapped per `<br>` for line-by-line mask reveal |

Selector lists controlling auto-application are in `../scripts/motion.js` (`SECTION_SELS`, `GROUP_SELS`, `HEADLINE_SELS`, `PARALLAX_SELS`).
