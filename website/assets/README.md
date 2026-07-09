# /website/assets

Images, fonts, icons, OG images, favicons.

## Current contents

| File | Purpose |
|---|---|
| `laurence.jpg` | Founder portrait. Used on `Home.html` and `about.html`. |

## Missing files (P0 — see /project-docs/todo.md)

| File | Specification | Used by |
|---|---|---|
| `favicon.svg` | SVG, square, on dark brand background | Every page `<head>` |
| `og-image.png` | 1200×630 JPG/PNG, brand visual | Every page `<meta property="og:image">` |
| `team/jeroen.jpg` | Square portrait, ~800×800 | About page, Site-team admin |
| `team/glenn.jpg` | … | … |
| `team/reza.jpg` | … | … |
| `team/els.jpg` | … | … |
| `team/edith.jpg` | … | … |
| `team/rico.jpg` | … | … |
| `team/astrid.jpg` | … | … |
| `fonts/` (optional) | Self-hosted WOFF2 for Playfair + DM Sans (GDPR) | Loaded via `@font-face` in motion.css |
| `icons/` (optional) | Self-hosted Tabler Icons WOFF2 (GDPR) | Loaded via local CSS |

## Conventions

- Filenames: lowercase, kebab-case (`og-image.png`, not `OG_Image.JPG`)
- Team photos: square, name in lowercase (`jeroen.jpg`, not `Jeroen.JPG`)
- Maximum dimensions for hero images: 2400px on longest edge
- Format priority: WebP > AVIF > JPEG > PNG (for photos); SVG for icons/logos
