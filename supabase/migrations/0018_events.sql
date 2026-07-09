-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 3 · Analyse-module
-- Migration 0018 — table  public.events  (cookieloze event-stroom, Optie A)
-- ───────────────────────────────────────────────────────────────────
-- Eén generieke event-stroom voor de Analyse-module. Kolomnamen matchen
-- netlify/functions/event.js (insertEvent). GEEN cookies, GEEN IP, GEEN
-- fingerprint. `session_id` = kortstondig first-party id (client). De
-- `visitor_hash` wordt server-side dagelijks-roterend berekend (nooit het
-- ruwe IP opgeslagen) → "unieke bezoekers per dag" zonder de bezoeker over
-- dagen te volgen. `meta` bevat event-specifieke, PII-vrije details.
-- Idempotent (CREATE … IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.events (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),

  session_id    text,                 -- kortstondig, first-party (weg bij tab-sluit)
  visitor_hash  text,                 -- dagelijks roterende hash (server) — GEEN IP

  name          text not null,        -- page_view | page_exit | button_click | form_* | *_step_N | *_completed | report_* | contact_sent | demo_requested | web_vital
  path          text,

  -- herkomst / kanaal
  referrer      text,                 -- externe verwijzer-host (bv. google.com)
  source        text,                 -- utm_source
  medium        text,                 -- utm_medium
  campaign      text,                 -- utm_campaign

  -- context
  lang          text,
  device        text,                 -- mobile | tablet | desktop
  browser       text,                 -- Chrome | Safari | Edge | Firefox | overige (server-afgeleid, grof)
  country       text,                 -- ISO-land (edge-geo, land-niveau)

  -- event-specifieke, PII-vrije details (dwell_ms, scroll_pct, step, id, label, metric, value…)
  meta          jsonb not null default '{}'::jsonb
);

-- Dashboard-indexen: dagreeks, filter op event, sessie-reconstructie, dag-uniques, pagina.
create index if not exists idx_events_created_at   on public.events (created_at desc);
create index if not exists idx_events_name         on public.events (name);
create index if not exists idx_events_name_created on public.events (name, created_at desc);
create index if not exists idx_events_session      on public.events (session_id);
create index if not exists idx_events_visitor_day  on public.events (visitor_hash, created_at desc);
create index if not exists idx_events_path         on public.events (path);

-- RLS aan, geen public policy → enkel de server (service-role) leest/schrijft.
alter table public.events enable row level security;
