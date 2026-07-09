# /admin-panel/components

**Admin components are CSS classes**, not JS components. No framework.

This folder is documentation-only — it catalogs the admin's UI primitives so devs can find them.

---

## Shell

| Class | Role |
|---|---|
| `.app` | 2×2 grid shell (topbar / sidebar / main) |
| `.app.is-collapsed` | Sidebar collapsed |
| `.app.is-mobile-open` | Mobile drawer open |
| `.topbar` | Top bar with search + popovers |
| `.sidebar` | Left navigation |
| `.main` | Content area (holds all `<section class="view">`) |

## Topbar

| Class | Role |
|---|---|
| `.topbar-brand` | Logo + Admin pill |
| `.topbar-search` | ⌘K global search input |
| `.search-results` (`.is-open`) | Search dropdown results |
| `.topbar-btn` | Icon button (notif, help) |
| `.topbar-lang` | Language toggle (NL/EN) |
| `.topbar-user` | User pill (avatar + name) |
| `.popover` (`.is-open`) | Dropdown panel |
| `.dot` | Red unread indicator |

## Sidebar

| Class | Role |
|---|---|
| `.sidebar-section` | Group header |
| `.sidebar-collapsible` | Collapsible group with `+/−` toggle |
| `.nav-item` (`.is-active`, `.is-hidden`) | Sidebar link (uses `data-view`) |
| `.badge` | Numeric count badge on nav item |
| `.sidebar-foot` | Bottom collapse button + version label |

## KPI cards

| Class | Role |
|---|---|
| `.kpi-row` | Grid of KPI cards |
| `.kpi-card` | Single KPI (use `data-jump="<view>"` for click-to-jump) |
| `.kpi-label` / `.kpi-value` / `.kpi-trend` | Inner parts |
| `.kpi-trend.up` | Green up arrow |
| `.ico` | Icon container (orange tint by default; override via inline style) |

## Panels

| Class | Role |
|---|---|
| `.panel` | Container card |
| `.panel-head` / `.panel-body` | Inner parts |
| `.panel-body.is-flush` | No padding (for tables) |
| `.panel-link` | "All →" link in panel head |
| `.panel-sub` | Subtitle under panel `<h3>` |

## Data

| Class | Role |
|---|---|
| `.tbl` | Data table |
| `.feed` / `.feed-item` | Activity/inbox list |
| `.feed-icon` / `.feed-meta` / `.feed-title` / `.feed-sub` | Inner parts |
| `.pipeline` | Kanban columns container |
| `.pipeline-col` / `.pipeline-card` | Inner parts |
| `.grid-2` / `.grid-3` | Layout grids |

## Interactive

| Class | Role |
|---|---|
| `.drawer` (`.is-open`) | Slide-in side panel |
| `.drawer-backdrop` (`.is-open`) | Dimmed overlay |
| `.drawer-head` / `.drawer-body` / `.drawer-foot` | Inner parts |
| `.toast` (`.is-shown`) | Bottom-right confirmation (auto-hides 2.8s) |
| `.tabs` | Tab strip |
| `.tab` (`.is-active`) | Single tab |
| `.tab.set-tab` | Settings tab variant |
| `.tab.forms-tab` | Forms inbox tab variant |
| `.help-banner` | Inline tip strip with `ti-info-circle` |
| `.field` | Form field wrapper (label + input + hint) |

## Buttons

| Class | Variant |
|---|---|
| `.btn.btn-primary` | Solid orange |
| `.btn.btn-ghost` | Outline |

## State modifiers (admin-wide convention)

Always prefix with `is-`:
- `.is-active` — active nav item, active tab, active view
- `.is-open` — popovers, drawers, search results
- `.is-shown` — toast
- `.is-collapsed` — sidebar
- `.is-mobile-open` — mobile drawer
- `.is-hidden` — hidden via collapsible group
- `.is-focus` — keyboard focus on search result
- `.is-flush` — panel body without padding

## Adding a new admin component

For now, the pattern is:
1. Add the CSS class to `../stylesheets/admin.css`
2. Render the HTML string in the appropriate module
3. Document the class here

When the admin gets a framework, this folder becomes the home for `.jsx` / `.vue` / `.svelte` files.
