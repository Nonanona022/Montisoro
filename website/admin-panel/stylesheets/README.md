# /admin-panel/stylesheets

Admin design system.

## Files

| File | Purpose |
|---|---|
| `admin.css` | All admin styling — tokens, shell layout, topbar, sidebar, panels, KPI cards, tables, drawer, toast, popovers, motion. 408 lines. |

## Tokens

Defined in `:root` at top of `admin.css`. Prefix: `--a-*` (to avoid clashing with site tokens).

```css
--a-bg:#0E0B08;
--a-bg-1:#13100D; --a-bg-2:#1A1410;
--a-bg-3:#1C1814; --a-bg-4:#221C16;
--a-orange:#E8592B;
--a-orange-hover:#d04d22;
--a-off:#F0EDE8;
--a-muted: rgba(240,237,232,0.62);
--a-good:#5ABF7E;  --a-warn:#E8B45C;  --a-bad:#E85C5C;
--a-serif:'Playfair Display',Georgia,serif;
--a-sans:'DM Sans',sans-serif;
--a-ease: cubic-bezier(0.16, 1.0, 0.3, 1.0);
--a-fast:.35s;  --a-base:.55s;
```

## Categories of styles

1. **Shell** — `.app`, `.topbar`, `.sidebar`, `.main`
2. **Topbar** — search, popovers, user pill, language toggle
3. **Sidebar** — nav items, collapsible groups, footer
4. **KPI cards** — `.kpi-row`, `.kpi-card`, `.kpi-value`
5. **Panels** — `.panel`, `.panel-head`, `.panel-body`
6. **Tables** — `.tbl`
7. **Feeds** — `.feed`, `.feed-item`
8. **Pipeline** — `.pipeline`, `.pipeline-col`, `.pipeline-card`
9. **Drawer + toast** — slide-in detail, bottom-right confirmation
10. **Tabs** — `.tabs`, `.tab.is-active`, `.tab.set-tab`/`.forms-tab`
11. **Forms** — `.field`, inputs, hints
12. **Help banner** — `.help-banner`
13. **Motion** — fade-ins on view-switch

## State modifiers

Always prefix with `is-`: `.is-active`, `.is-open`, `.is-shown`, `.is-collapsed`, `.is-mobile-open`, `.is-hidden`, `.is-focus`, `.is-flush`.

## Rule

Never override site tokens (`--bg`, `--orange`, etc.) from admin. Use only `--a-*` here. Admin extends, doesn't replace.
