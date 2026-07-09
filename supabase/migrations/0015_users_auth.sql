-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 2 · STAP 4 (auth / RBAC)
-- Migration 0015 — auth-kolommen op public.users
-- ───────────────────────────────────────────────────────────────────
-- Maakt per-gebruiker credentials mogelijk zonder het bestaande model te
-- breken: zolang een gebruiker GÉÉN password_hash heeft, blijft de login
-- het gedeelde ADMIN_PASSWORD gebruiken (transitie-veilig, geen lockout).
--
-- MFA-kolommen zijn GERESERVEERD. De feitelijke MFA-poort is de externe
-- IdP-gate (Cloudflare Access) — zie security-setup.md; app-niveau TOTP is
-- bewust niet hand-gerold. Additief + idempotent.
-- ═══════════════════════════════════════════════════════════════════

alter table public.users add column if not exists password_hash text;        -- scrypt$N$salt$hash · NULL = gebruik gedeeld ADMIN_PASSWORD
alter table public.users add column if not exists mfa_enabled   boolean not null default false;
alter table public.users add column if not exists mfa_secret    text;         -- gereserveerd (TOTP) — poort = Cloudflare Access
alter table public.users add column if not exists last_login    timestamptz;
