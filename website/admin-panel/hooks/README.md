# /admin-panel/hooks

**Not applicable.** This project uses vanilla JavaScript — there is no React or any framework with a hook system.

This folder is reserved for a future framework migration. If/when the admin moves to React, custom hooks would live here:

```
useAdminData()       // wraps localStorage CRUD with React state
useView(id)          // routing hook
useDrawer()          // drawer open/close state + content
useToast()           // toast trigger
useDebounce(val, ms) // debounced value
```

For now: see `../utils/helpers.js` for the closest equivalent (small reusable functions).
