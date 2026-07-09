# /admin-panel/api

**There is no admin API yet.** All state lives client-side in `localStorage`. This folder is documentation-only — it specifies the **future API contract** that mirrors the current localStorage schema, so when a backend is built, the wire format is already designed.

---

## Authentication

Recommended approach: **JWT in `Authorization: Bearer <token>`** OR cookie-based session set by an IdP gate (Cloudflare Access — see `/project-docs/auth.md`).

Every endpoint below assumes the caller is authenticated. Role enforcement (Admin / Editor / Viewer) happens server-side.

---

## Endpoints (proposed)

### Leads

| Method | Path | Purpose |
|---|---|---|
| `GET`    | `/api/leads`               | List with filters: `?stage=&source=&q=` |
| `POST`   | `/api/leads`               | Create lead |
| `GET`    | `/api/leads/:id`           | Read one |
| `PATCH`  | `/api/leads/:id`           | Update (stage, notes, value, etc.) |
| `DELETE` | `/api/leads/:id`           | Delete (Admin only) |

### Submissions (form inbox)

| Method | Path |
|---|---|
| `POST` | `/api/submissions/contact` |
| `POST` | `/api/submissions/casey` |
| `POST` | `/api/submissions/calculator` |
| `POST` | `/api/submissions/fitcheck` |
| `GET`  | `/api/submissions/:stream` |

`POST` endpoints ingest a submission per stream. Today the **calculator** stream is already live: the `calculator-report` Netlify Function recomputes the report, stores the PDF in Supabase and e-mails it (Resend). The other streams are received by `form-submit` (e-mail only). `GET` returns the inbox view per stream.

### Content (pages)

| Method | Path | Purpose |
|---|---|---|
| `GET`   | `/api/pages` | List page metadata |
| `GET`   | `/api/pages/:slug` | Read full content blocks NL+EN |
| `PATCH` | `/api/pages/:slug` | Save content edits → triggers static-site rebuild |

### Site team (About page)

| Method | Path |
|---|---|
| `GET`    | `/api/site-team` |
| `POST`   | `/api/site-team` |
| `PATCH`  | `/api/site-team/:id` |
| `DELETE` | `/api/site-team/:id` |
| `PUT`    | `/api/site-team/order` (bulk reorder) |

### Admin team (users)

| Method | Path | Notes |
|---|---|---|
| `GET`    | `/api/team` | Admin role required |
| `POST`   | `/api/team` | Invite |
| `PATCH`  | `/api/team/:id` | Update role |
| `DELETE` | `/api/team/:id` | Revoke |

### Meetings (agenda)

| Method | Path |
|---|---|
| `GET`   | `/api/meetings` |
| `POST`  | `/api/meetings` |
| `PATCH` | `/api/meetings/:id` (incl. feedback drawer payload) |

### GDPR

| Method | Path |
|---|---|
| `GET`   | `/api/gdpr` |
| `POST`  | `/api/gdpr` (new request) |
| `PATCH` | `/api/gdpr/:id` (status updates) |

### Audit log

| Method | Path |
|---|---|
| `GET`  | `/api/activity?limit=200` |
| `POST` | `/api/activity` (append — usually internal) |

### Notifications

| Method | Path |
|---|---|
| `GET`   | `/api/notifications` |
| `PATCH` | `/api/notifications/:id/read` |

### Integrations

| Method | Path | Purpose |
|---|---|---|
| `GET`   | `/api/integrations` | Status of each connection |
| `POST`  | `/api/integrations/analytics/oauth/start` | Begin GA OAuth |
| `GET`   | `/api/integrations/analytics/oauth/callback` | Complete GA OAuth |
| `POST`  | `/api/integrations/linkedin/oauth/start` | Begin LinkedIn OAuth |
| `POST`  | `/api/integrations/mailchimp` | Save API key + audience |

---

## Wire format

Mirror the existing types in `../services/admin-data.js`. See `/project-docs/database.md` for full TypeScript-style definitions.

Request/response bodies are JSON. Timestamps as ISO-8601 strings.

---

## Errors

```json
{
  "error": {
    "code":    "VALIDATION",
    "message": "Email is required",
    "field":   "email"
  }
}
```

Status codes: 200/201 OK, 400 validation, 401 unauthenticated, 403 unauthorized (role), 404 not found, 409 conflict, 500 internal.

---

## Migration plan (when backend lands)

1. Build the backend (Node + Express + Postgres recommended, or Go + SQLite, or anything that talks JSON)
2. Implement endpoints in order: leads → submissions → meetings → content → rest
3. In `../services/admin-data.js`, replace `load()` / `save()` internals with `fetch()` calls
4. Keep localStorage as a *write-through cache* for offline-tolerant editing
5. Per-view module code stays unchanged (it only talks to `AdminData`)
