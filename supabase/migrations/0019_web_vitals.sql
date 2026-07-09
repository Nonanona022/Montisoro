-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 3 · Analyse-module
-- Migration 0019 — table  public.web_vitals  (Real User Monitoring)
-- ───────────────────────────────────────────────────────────────────
-- Websiteprestaties per pagina, gemeten bij echte bezoekers (cookieloos).
-- Gevoed door events.js (web_vital-events) via /api/event. Aparte tabel
-- houdt perf-queries licht en los van de bredere event-stroom.
-- Idempotent (CREATE … IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.web_vitals (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  path        text,
  metric      text not null,        -- LCP | INP | CLS | TTFB
  value       numeric not null,     -- ms (LCP/INP/TTFB) of score (CLS)
  rating      text,                 -- good | needs-improvement | poor
  device      text                  -- mobile | tablet | desktop
);

create index if not exists idx_vitals_created  on public.web_vitals (created_at desc);
create index if not exists idx_vitals_path      on public.web_vitals (path);
create index if not exists idx_vitals_metric    on public.web_vitals (metric);

alter table public.web_vitals enable row level security;
