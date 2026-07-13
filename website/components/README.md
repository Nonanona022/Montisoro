# /website/components

**Components in this project are CSS classes**, not JS components. There is no framework (React/Vue/Svelte/Web Components).

This folder is documentation-only — it catalogs the reusable primitives so devs can find them.

---

## Site primitives

### Layout

| Class | Role | Defined in |
|---|---|---|
| `.m-nav` | Fixed top nav | Per-page inline `<style>` |
| `.m-nav.scrolled` | Scrolled state | Per-page |
| `.chapter.dark` / `.chapter.light` | Full-width section | Per-page |
| `.chapter-inner` (`.wide`, `.narrow`) | Content max-width container | Per-page |

### Typography

| Class | Role |
|---|---|
| `.eyebrow` (`.on-dark`/`.on-light`/`.centered`) | Kicker label with orange rule |
| `.title.h-section` (`.on-dark`/`.on-light`) | Section title, Playfair |
| `.title em` | **Italic orange accent — brand DNA** |
| `.sub` (`.on-dark`/`.on-light`) | Body subtitle |

### Buttons

| Class | Variant |
|---|---|
| `.btn.btn-primary` | Solid orange |
| `.btn.btn-ghost` | Outline on dark |
| `.btn.btn-ghost-light` | Outline on light |
| `.btn.btn-calc` | Tinted orange (calculator only) |

### Motion attributes (auto-applied by `../scripts/motion.js`)

| Attribute | Effect |
|---|---|
| `data-reveal="fade"` | Fade-in on viewport entry |
| `data-cascade` | Children reveal in sequence |
| `data-reveal-group` | Grid stagger |
| `.line-reveal` | Headline mask reveal per `<br>` |

---

## Page-specific components (inline)

| Component | Lives in | Purpose |
|---|---|---|
| Hero (split layout) | `Home.html` lines ~100–250 | 54/46 grid, headline, KPIs |
| ROI calculator engine | `calculator.html` lines ~700–1100 | 5-step wizard |
| Fit-check engine | `fit-check.html` lines ~600–1200 | 4-question routing |
| Contact calendar modal | `contact.html` lines ~500–800 | Date/time/location picker |
| Casey waitlist form | `technologie.html` lines ~600–660 | Email signup |

These are not (yet) extracted into shared components. If you migrate to a framework, this list shows where they live.

---

## Adding a new component

For now, the pattern is:

1. Define CSS classes inline in the page where they're first used
2. If used 2+ times across pages, extract to `../stylesheets/motion.css` (or a new shared file)
3. Document the class here

When the project gets a framework later, this folder becomes the home for `.jsx`/`.vue`/`.svelte` files.
