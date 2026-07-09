-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 3 · Analyse-module · SEO
-- Migration 0022 — table  public.gsc_connection  (Google Search Console)
-- ───────────────────────────────────────────────────────────────────
-- Eén-rij tabel (id = 'default') die de OAuth-koppeling met Google Search
-- Console bewaart. De tokens worden VERSLEUTELD opgeslagen (AES-256-GCM,
-- sleutel uit env GSC_TOKEN_KEY of afgeleid van ADMIN_SESSION_SECRET) — nooit
-- als platte tekst. RLS aan, geen public policy → enkel de server
-- (service-role) leest/schrijft. Idempotent (CREATE … IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.gsc_connection (
  id            text primary key default 'default' check (id = 'default'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  site_url      text,                 -- gekozen GSC-property (bv. sc-domain:montisoro.com)
  scope         text,                 -- toegekende OAuth-scope

  access_token  text,                 -- AES-256-GCM versleuteld (iv:ct:tag, base64)
  refresh_token text,                 -- AES-256-GCM versleuteld
  token_expiry  timestamptz,          -- verval van het access-token

  connected_by  text,                 -- e-mail van de admin die koppelde
  connected_at  timestamptz
);

-- RLS aan, geen public policy → enkel service-role (server) heeft toegang.
alter table public.gsc_connection enable row level security;
