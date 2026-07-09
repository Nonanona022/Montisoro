# /admin-panel/contexts

**Not applicable.** This project uses vanilla JavaScript — there is no React Context or any framework context system.

The closest concept in the current codebase is the **`window.AdminData` global** plus the **`showView` dispatcher** — these effectively serve as the project's "providers":

| Vanilla pattern | React equivalent |
|---|---|
| `window.AdminData.load() / .save()` | `<DataContext.Provider>` + `useData()` |
| `window.Admin.showView(id)` | `<RouterContext>` + `useNavigate()` |
| `sessionStorage.admin.session` | `<AuthContext>` + `useAuth()` |
| `localStorage.admin.section.collapsed.*` | `<UiPrefsContext>` |

This folder is reserved for a future framework migration. For now, see `../services/admin-data.js` and `../scripts/admin.js` for how the equivalent state-sharing is done.
