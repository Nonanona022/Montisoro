# /website/utils

Tiny helpers, framework-free. Single global: `window.M`.

## Files

| File | Purpose |
|---|---|
| `helpers.js` | DOM selection, HTML escaping, number formatting, debounce, email validation, language detection. |

## API

```js
M.$('selector')           // querySelector
M.$$('selector')          // querySelectorAll → array
M.esc(str)                // HTML-escape
M.fmt(12500)              // '12.500'
M.eur(12500)              // '€12.500'
M.debounce(fn, 200)       // debounced function
M.on(el, 'click', fn)     // addEventListener
M.off(el, 'click', fn)    // removeEventListener
M.validEmail(str)         // → boolean
M.lang()                  // → 'nl' | 'en' (from <html lang="...">)
```

## Usage

```html
<script src="../utils/helpers.js"></script>
<script>
  var input = M.$('#email');
  M.on(input, 'input', M.debounce(function(){
    if (!M.validEmail(input.value)) {
      // ...
    }
  }, 300));
</script>
```

## Why a utils module

Same logic was previously duplicated inline in many pages (`$`, `$$`, `esc`, etc.). This file is the canonical extraction. Pages will be refactored over time to use it.
