# /admin-panel/assets

Static assets for the admin UI.

## Current contents

**Empty.** The admin uses no images today — all avatars are rendered as initial-gradients via CSS (Playfair Display 700 on an orange-gradient circle).

## When to add assets here

| File | Purpose |
|---|---|
| `favicon.svg` | Admin tab icon (could be a variant of the site favicon) |
| `logo-admin.svg` | If the brand wants a different mark in the cockpit |
| Avatar uploads | When `siteTeam[].photo` paths point here (currently they reference `../assets/laurence.jpg` via the site) |
| User-uploaded files | Document hub (`admin-enterprise.js`) — when a backend exists |

For now, the only photo in the project is the founder portrait at `/website/assets/laurence.jpg`.

## Conventions

- Lowercase, kebab-case filenames
- SVG for icons/logos; WebP/JPEG for photos
- Avatars: square, 800×800 max
