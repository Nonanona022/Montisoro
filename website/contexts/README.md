# /website/contexts

**Not applicable.** This project uses vanilla JavaScript — there is no React Context or any framework with a context system.

This folder is reserved for a future framework migration. If/when the project moves to React, providers like `LangContext`, `MotionContext` would live here.

For now: shared state is read from the DOM (`<html lang="...">` for language) or from window globals (e.g. `window.MONTISORO_CONFIG` for non-secret client config).
