# /admin-panel/pages

The entire admin cockpit ships as **two HTML files**.

## Files

| File | Purpose |
|---|---|
| `admin-login.html` | Login form. Demo whitelist + plain password check. On success, sets `sessionStorage.admin.session` and redirects to `admin.html`. |
| `admin.html` | The cockpit. Shell + sidebar + topbar + 16 `<section class="view">` templates inlined. Loads all admin scripts at end of body. |

## Why two files

- `admin-login.html` is intentionally separate so the bulk of admin code never loads for unauthenticated users.
- `admin.html` is a single-page app. Navigation between views is hash-based (`#leads`, `#forms`, etc.) — no full page reloads.

## Views inside admin.html

All views live as `<section class="view" id="view-<id>">…</section>`. The active view has class `is-active`. `showView(id)` toggles classes and updates the URL hash.

| Hash | View id | Module that handles it |
|---|---|---|
| `#overview` | `view-overview` | `admin.js` |
| `#leads` | `view-leads` | `admin.js` |
| `#calendar` | `view-calendar` | `admin-agenda.js` |
| `#forms` | `view-forms` | `admin.js` |
| `#onboarding` | `view-onboarding` | `admin-enterprise.js` |
| `#content` | `view-content` | `admin.js` |
| `#siteteam` | `view-siteteam` | `admin-siteteam.js` |
| `#languages` | `view-languages` | `admin.js` |
| `#team` | `view-team` | `admin.js` |
| `#seo` | `view-seo` | `admin-tools.js` |
| `#health` | `view-health` | `admin-tools.js` |
| `#abtests` | `view-abtests` | `admin-tools.js` |
| `#gdpr` | `view-gdpr` | `admin-enterprise.js` |
| `#activity` | `view-activity` | `admin.js` |
| `#settings` | `view-settings` | `admin.js` |
| `#analytics` | `view-analytics` | `admin.js` |

## Script load order (bottom of admin.html)

```html
<script src="../services/admin-data.js"></script>
<script src="../scripts/admin-siteteam.js"></script>
<script src="../scripts/admin-pro.js"></script>
<script src="../scripts/admin.js"></script>            <!-- auth gate runs here -->
<script src="../scripts/admin-tools.js"></script>
<script src="../scripts/admin-final.js"></script>
<script src="../scripts/admin-agenda.js"></script>
<script src="../scripts/admin-enterprise.js"></script>
```

**Note:** the legacy root version of `admin.html` had a duplicate `admin-pro.js` include — that has been removed in this delivery. Modules guard against double-init anyway, but cleaner is cleaner.

## Adding a new view

1. Add `<section class="view" id="view-<id>">…</section>` inside `<main class="main">`
2. Add sidebar nav item: `<div class="nav-item" data-view="<id>"><i class="ti ti-…"></i><span class="label">…</span></div>`
3. (Optional) define `window.init_<id> = function(){ … }` in the appropriate module
4. (Optional) make KPI cards or panel links jump to it: `data-jump="<id>"`
