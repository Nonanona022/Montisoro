# /admin-panel/documents

Operator-facing reference: how to use the cockpit, role permissions, future API design.

## Files (planned)

| File | Audience | Purpose |
|---|---|---|
| `operator-manual.md` | Laurence & team | How to use each admin view |
| `role-permissions.md` | Future maintainer | Matrix of who can do what (after roles are enforced) |
| `api-design.md` | Backend dev | Full REST contract (currently lives in `../api/README.md`) |

For now this folder holds the operator quick-start.

---

## Operator quick-start

### Logging in

1. Navigate to `<admin-host>/pages/admin-login.html`
2. Enter credentials (default: `hello@montisoro.com` / `montisoro`)
3. Check "Onthoud mij" to remember the email next time

### Daily flow

1. **Overview** — scan KPIs + activity feed for the day
2. **Inbox** (`#forms`) — process new form submissions (4 streams)
3. **Leads** (`#leads`) — drag/click leads through pipeline stages
4. **Gesprekken** (`#calendar`) — confirm upcoming meetings; fill feedback drawer post-meeting (mandatory)
5. **GDPR** (`#gdpr`) — check the < 7-day deadline flag; respond to requests

### Content edits (current state)

The `#content` view lets you edit page copy NL + EN side-by-side. **But it currently only saves to localStorage** — the live `.html` files are NOT updated. For real edits, edit the file in `/website/pages/<page>.html` directly.

This will change when the backend ships (see `../api/README.md` § Migration plan).

### Reset state (dev only)

In the browser console on `admin.html`:

```js
window.AdminData.reset();
location.reload();
```

Clears `localStorage.montisoro.admin.data.v7` and reloads with default seed data.

### Search (⌘K / Ctrl+K)

The topbar search indexes:
- Leads (by name, org, email)
- Form submissions (by email)
- Pages (by slug)
- Activity log entries

Type any keyword → arrow keys to navigate → Enter to jump.

### Notifications

Bell icon in topbar. Red dot if any unread. Click an item to jump to its source view (lead, inbox stream, etc.).

### Logout

Click your name/avatar in the topbar → Logout. Clears `sessionStorage.admin.session`. The "Remember me" email in localStorage is preserved for next login.

---

## Permissions matrix (target — currently NOT enforced)

| Action | Admin | Editor | Viewer |
|---|---|---|---|
| Read all views | ✅ | ✅ | ✅ |
| Edit lead status / notes | ✅ | ✅ | ❌ |
| Add / invite team member | ✅ | ❌ | ❌ |
| Edit page content | ✅ | ✅ | ❌ |
| Edit site team (About page) | ✅ | ✅ | ❌ |
| Manage integrations | ✅ | ❌ | ❌ |
| Handle GDPR requests | ✅ | ❌ | ❌ |
| Edit notification templates | ✅ | ❌ | ❌ |
| Reset all data | ✅ | ❌ | ❌ |

**Current code does not enforce these.** Every logged-in user can do everything. Enforcement is a P2 item — see `/project-docs/todo.md`.
