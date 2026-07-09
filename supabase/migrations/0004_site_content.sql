-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — Website ↔ Dashboard read-bridge
-- Migration 0004 — table  public.site_content
-- ───────────────────────────────────────────────────────────────────
-- Dashboard-managed PUBLIC content that the live website reads at runtime
-- (testimonials, "trusted by" logos, calculator parameters, …). One row
-- per content key; the payload lives in `data` (jsonb) in the exact shape
-- the website data files use today (window.MONTISORO_TRUSTED / _TESTIMONIALS
-- / calc params). The admin writes here; the site reads via the
-- /api/site-content function (service-role, server-side only).
--
-- Idempotent (CREATE … IF NOT EXISTS). Inert until SUPABASE_* env is set —
-- the function returns {configured:false} and the site keeps its hardcoded
-- fallback data, so nothing breaks before this is populated.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create table if not exists public.site_content (
  key         text primary key check (key in ('trusted_by','testimonials','calc_params')),
  data        jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- RLS on, no public policies: only the service-role (functions) reach this table.
-- The public site never talks to Supabase directly — it goes through
-- /api/site-content, which uses the service-role key server-side.
alter table public.site_content enable row level security;
