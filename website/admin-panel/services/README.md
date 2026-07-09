# /admin-panel/services

Data layer + future external integrations.

## Files

| File | Purpose |
|---|---|
| `admin-data.js` | **The data layer.** Default seed data (12 leads, 16 submissions, 8 site-team members, 9 pages with NL+EN content). `load()` / `save()` / `reset()` / `kpi()` helpers. Storage key `montisoro.admin.data.v7`. |

## API

```js
window.AdminData = {
  load(): Data       // returns localStorage data or DEFAULT
  save(d: Data): void
  reset(): void      // wipes localStorage key (next load returns DEFAULT)
  kpi(d: Data): Kpi  // derived stats — pipelineValue, conversion, etc.
};
```

See `/project-docs/database.md` for the full type schema.

## Versioning

```js
var KEY = 'montisoro.admin.data.v7';   // line 5
```

**Bump on breaking changes.** When the data shape changes incompatibly (renamed fields, removed entities, changed types), increment the suffix (`v7` → `v8`). The next `load()` for users with `v7` data will find nothing and fall back to `DEFAULT`. Their old data is left orphaned in localStorage (not auto-migrated).

## Default seed data

Stored as the `DEFAULT` constant inside the file. Useful for:
- Demo/screenshot purposes
- Resetting test environments (`AdminData.reset()` + reload restores it)
- Documenting the expected shape for the future real backend

## Future services

When the project moves to a real backend, this folder grows:

```
services/
├── admin-data.js     ← keep as offline cache / dev fallback
├── api.js            ← REST client wrapping fetch() to /api/*
├── auth.js           ← SSO / token management
├── analytics.js      ← Google Analytics or PostHog wrapper
├── linkedin.js       ← LinkedIn Pages API client
└── mailchimp.js      ← Mailchimp audience client
```

See `/project-docs/database.md` § "Migrating to a real backend" for the recommended REST endpoint shape.
