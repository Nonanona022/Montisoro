# /website/services

Reusable service modules — logic shared across pages and with the Netlify Functions backend.

> **`web3forms.js` has been removed.** Forms no longer talk to Web3Forms; they POST to the
> Netlify Functions backend (`/api/form-submit`, `/api/calculator-report`). See
> `/website/api/README.md` and `/project-docs/api.md`.

## Files

| File | Purpose |
|---|---|
| `verzuim-engine.js` | The absence-cost engine. Pure functions (employer cost, org impact, replacement cost, risk/priority). **Single source** — loaded by the calculator page *and* `require()`d by the `calculator-report` Netlify Function (and synced into the admin). |
| `email-templates.js` | NL + EN e-mail templates (client report mail + internal notification), rendered **server-side** in the Montisoro brand shell. Used by `netlify/functions/_lib/mailer.js` via Resend. |

## How the calculator submit works

```html
<!-- calculator page -->
<script src="../config/calculator-params.js"></script>
<script src="../services/verzuim-engine.js"></script>
<script>
  // ...wizard collects input, engine computes window.__verzuimReport...
  fetch('/api/calculator-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang, consent, fields, report })
  })
  .then(r => r.json())
  .then(res => { if (res && res.ok) showSuccess(); else fallbackMailto(); })
  .catch(() => fallbackMailto());
</script>
```

The light forms (contact / fit check / Casey) POST to `/api/form-submit` in the same pattern.
Both keep a `mailto:` fallback so leads still arrive while the backend env keys are unset (K1).
