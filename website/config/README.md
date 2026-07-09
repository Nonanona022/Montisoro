# /website/config

Global client-side configuration.

## Files

| File | Purpose |
|---|---|
| `config.js` | Reserved for non-secret client config (`window.MONTISORO_CONFIG`). Sets nothing required today. |
| `calculator-params.js` | Tunable parameters for the absence-cost engine (shared with the Netlify function). |

## Web3Forms has been removed

Since June 2026 **all forms run on the Netlify Functions backend** — there is no client-side
form key anymore:

- `/api/form-submit` — contact · fit check · Casey waitlist (e-mail via Resend)
- `/api/calculator-report` — calculator → PDF + client mail + storage (Resend + Supabase)

Backend secrets (Resend, Supabase, `ALLOWED_ORIGIN`, …) live **server-side only** in Netlify
environment variables — never in this folder. See `.env.example` and `project-docs/api.md`.

## What belongs here

Only **non-secret** client values (e.g. an analytics measurement ID, feature flags). Put them
on `window.MONTISORO_CONFIG`. Anything secret must stay in the backend env.
