# /admin-panel/layouts

**The admin shell layout is inlined in `pages/admin.html`** — not a separate layout file.

This folder is documentation-only, kept for symmetry with `/website/layouts/` and to host the canonical shell markup for reference.

---

## The shell

`pages/admin.html` is built around a 2×2 CSS grid:

```
┌────────────────────────────────────────────┐
│  TOPBAR        (grid-column: 1 / -1)       │
├────────┬───────────────────────────────────┤
│ SIDE-  │  MAIN                              │
│ BAR    │  (the active <section class="view  │
│        │   is-active">)                     │
└────────┴───────────────────────────────────┘
```

CSS:

```css
.app {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 64px 1fr;
  height: 100vh;
}
.app.is-collapsed { grid-template-columns: 64px 1fr; }
```

## Where each shell piece lives in admin.html

| Piece | Selector | Line range (approx) |
|---|---|---|
| Topbar | `<header class="topbar">…</header>` | 18–60 |
| Sidebar | `<aside class="sidebar">…</aside>` | 62–93 |
| Main + all view templates | `<main class="main">…</main>` | 95–510 |
| Drawer (slide-in panel) | `<div class="drawer">` | 515 |
| Drawer backdrop | `<div class="drawer-backdrop">` | 516 |
| Toast (bottom-right confirm) | `<div class="toast">` | 519 |

## Responsive

- `≤ 1024px` — sidebar collapses (`is-collapsed`)
- `≤ 600px` — sidebar becomes a slide-out drawer (`is-mobile-open`)
- `≤ 880px` — admin-login.html splits switches to stacked (login form only, no atmosphere panel)

## Future migration

If the admin moves to a framework later, `/layouts/` becomes the natural home for:

- `AdminShell.tsx` — the grid + topbar + sidebar + outlet
- `LoginShell.tsx` — the editorial split layout

For now, this folder stays empty except for this README.
