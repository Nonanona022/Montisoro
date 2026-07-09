# /admin-panel/utils

Tiny helpers, framework-free. Single global: `window.A`.

## Files

| File | Purpose |
|---|---|
| `helpers.js` | DOM selection, HTML escaping, number formatting, debounce, Tabler-icon builder, current-user accessor. |

## API

```js
A.$('selector')           // querySelector
A.$$('selector')          // querySelectorAll → array
A.esc(str)                // HTML-escape
A.fmt(12500)              // '12.500'
A.eur(12500)              // '€12.500'
A.debounce(fn, 200)       // debounced function
A.on(el, 'click', fn)     // addEventListener
A.off(el, 'click', fn)    // removeEventListener
A.icon('user')            // '<i class="ti ti-user"></i>'
A.pill('Won', 'good')     // '<span class="pill pill-good">Won</span>'
A.currentUser()           // { email, ts } from sessionStorage.admin.session
```

## Why a utils module

Each admin script currently inlines its own `$`, `$$`, `esc`, etc. This file is the canonical extraction. Modules will be refactored to use it over time.

For now, both patterns coexist:
- Existing modules: inline helpers (left as-is for stability)
- New code: prefer `window.A.*`

## Usage in a new module

```js
(function(){
  'use strict';
  if (window.__newThingLoaded) return;
  window.__newThingLoaded = true;

  var $ = A.$, $$ = A.$$, esc = A.esc;
  var DATA = window.AdminData.load();

  $('#button')?.addEventListener('click', function(){
    DATA.notes.push({ id:'n-' + Date.now(), text: esc(input.value) });
    window.AdminData.save(DATA);
    window.Admin.logActivity('Note toegevoegd', 'note');
  });
})();
```
