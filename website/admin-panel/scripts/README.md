# /admin-panel/scripts

All admin runtime code. Each file is an IIFE-wrapped module with a double-init guard.

## Files

| File | Lines | Owns |
|---|---|---|
| `admin.js` | 1306 | **Core runtime.** Auth gate, sidebar nav, hash-routing (`showView`), drawer/toast, popovers, global search (⌘K), per-view renderers: overview/leads/forms/content/languages/team/activity/settings/analytics. Defines `window.Admin`. |
| `admin-pro.js` | 471 | Notifications dropdown + dot, help center, i18n labels NL/EN, user menu (logout/profile), full activity log feed, CSV export helper. Guard: `__adminProLoaded`. |
| `admin-tools.js` | 486 | Conversion funnel, pipeline forecast, lead notes thread, email outbox, site healthcheck (mock), SEO dashboard, A/B test UI, quote builder, AI assist hooks, lead scoring, geo/industry tags, page versions. |
| `admin-final.js` | 585 | Calendar view (legacy — superseded by admin-agenda), advanced filters, AI follow-up suggestions, tasks/to-do list, bulk CSV import. Guard: `__adminFinalLoaded`. |
| `admin-agenda.js` | 588 | **Gespreks-CRM** — replaces simple calendar. Tabs (Calendar / List / Analytics), filters (period/status/outcome/location/person), mandatory feedback drawer post-meeting, "Te beoordelen" auto-flag, win-rate analytics. |
| `admin-enterprise.js` | 562 | GDPR data-request workflow (<7d deadline tracker), client onboarding flow, executive dashboard, cookie consent log, document hub. |
| `admin-siteteam.js` | 169 | About-page team CRUD. Add / edit / pause / delete personen with photo + initial fallback. NL+EN role + bio. Drag-reorder via `order` field. |

## Module pattern

```js
(function(){
  'use strict';
  if (window.__myModuleLoaded) return;
  window.__myModuleLoaded = true;

  var DATA = window.AdminData.load();
  // ... code ...
})();
```

## Globals exposed

- `window.Admin.showView(id)` — switch view
- `window.Admin.logActivity(what, icon)` — append audit entry
- `window.init_<viewId>` — per-view init hooks (admin.js calls these on `showView`)

All other state goes through `window.AdminData.load() / .save() / .reset()` (see `../services/admin-data.js`).

## Load order (set in admin.html)

```
1. admin-data.js        ← MUST be first (defines window.AdminData)
2. admin-siteteam.js
3. admin-pro.js         ← notifications, exports
4. admin.js             ← auth gate + core runtime
5. admin-tools.js
6. admin-final.js
7. admin-agenda.js
8. admin-enterprise.js
```

Modifying this order will break things. The auth gate is in `admin.js` and must run before any view init.
