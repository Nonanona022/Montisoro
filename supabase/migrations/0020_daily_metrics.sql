-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 3 · Analyse-module
-- Migration 0020 — table  public.daily_metrics  (nachtelijke rollup)
-- ───────────────────────────────────────────────────────────────────
-- Voorberekende dagcijfers voor snelle dashboards over lange periodes.
-- Tot gemiddeld verkeer rekent /api/admin-metrics live uit de events-tabel;
-- bij groei vult een (scheduled) rollup-functie deze tabel zodat de KPI's
-- niet telkens duizenden rijen hoeven te scannen. Schema staat klaar; de
-- rollup-job wordt geactiveerd wanneer het volume dat vraagt.
-- Idempotent (CREATE … IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.daily_metrics (
  day             date primary key,
  pageviews       integer not null default 0,
  visitors        integer not null default 0,   -- distinct visitor_hash die dag
  sessions        integer not null default 0,   -- distinct session_id die dag
  bounces         integer not null default 0,   -- sessies met 1 paginabezoek
  avg_session_ms  integer not null default 0,
  conversions     integer not null default 0,
  by_source       jsonb not null default '{}'::jsonb,   -- {kanaal: {sessions, conversions}}
  by_device       jsonb not null default '{}'::jsonb,
  by_country      jsonb not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

alter table public.daily_metrics enable row level security;
