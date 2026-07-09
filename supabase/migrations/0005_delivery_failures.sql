-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — Migration 0005 — table public.delivery_failures
-- ───────────────────────────────────────────────────────────────────
-- Persists email/PDF delivery failures so the admin can see alerts
-- and retries can be scheduled. Written by alerting.js server-side.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.delivery_failures (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  type          text not null,       -- email_internal | email_confirm | email_booking | pdf
  recipient     text not null,       -- email address or 'internal'
  subject       text,                -- email subject or pdf name
  error         text,                -- error message (max 500 chars)
  submission_id uuid,                -- FK to form_submissions or calculator_submissions

  resolved      boolean not null default false,
  resolved_at   timestamptz,
  notes         text
);

create index if not exists idx_delfail_created  on public.delivery_failures (created_at desc);
create index if not exists idx_delfail_resolved on public.delivery_failures (resolved);
create index if not exists idx_delfail_type     on public.delivery_failures (type);

-- RLS on, no public read — service-role only
alter table public.delivery_failures enable row level security;
