-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — Migration 0008 — table public.audit_log
-- ───────────────────────────────────────────────────────────────────
-- Onverliesbare, gedeelde audit-trail van admin-acties (wie/wat/wanneer).
-- Vervangt de localStorage-only activity_log. Service-role only (RLS aan).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  actor       text,                 -- e-mail van de admin
  action      text not null,        -- vrije omschrijving van de actie
  icon        text                  -- optioneel UI-icoon
);

create index if not exists idx_audit_log_created_at on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;
