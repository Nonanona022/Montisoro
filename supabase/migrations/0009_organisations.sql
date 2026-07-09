-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 2 · STAP 2 (datafundament)
-- Migration 0009 — table  public.organisations
-- ───────────────────────────────────────────────────────────────────
-- Eerste-klas ORGANISATIE-entiteit. Vandaag bestaat een firma los in
-- calculator_submissions, form_submissions én leads (gedupliceerde tekst,
-- geen onderlinge link). Deze tabel wordt de canonieke bron; leads en
-- submissions verwijzen er straks naar (zie 0013). Zonder deze entiteit
-- kan het CRM nooit "alles van dit bedrijf" tonen.
--
-- Additief + idempotent (CREATE … IF NOT EXISTS): niets bestaands wijzigt.
-- Inert tot de SUPABASE_* env gezet is (K1) — tot dan draait de admin op
-- localStorage en raakt deze tabel niets. Run in: Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;  -- gen_random_uuid() (no-op op Supabase)

-- Gedeelde updated_at-trigger (ook in 0006 — create or replace = idempotent)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.organisations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  name        text not null,
  domain      text,              -- e-maildomein, bv. 'volvo.com' (lowercase) — dedup-sleutel
  vat         text,              -- BTW-nummer (optioneel)
  sector      text,              -- prep per-sector benchmarks (Fase C)
  size_band   text,              -- prep org-grootte bucket
  country     text default 'BE',
  region      text,              -- prep multi-vestiging
  notes       text,

  -- Toekomst-dimensies (FASE 12): kosteloos nu, duur later. Nullable, géén gedrag vandaag.
  product_id  text,              -- prep Storm / Casey (multi-product)
  site_id     text               -- prep multi-site / multi-brand
);

-- Index op domein voor snelle lookup/koppeling — NIET uniek: meerdere juridische
-- entiteiten kunnen één domein delen (Volvo Group / Volvo Trucks). De backfill
-- (0014) dedupliceert op NAAM (NOT EXISTS), niet op domein.
create index if not exists idx_org_domain on public.organisations (lower(domain));
create index if not exists idx_org_name       on public.organisations (lower(name));
create index if not exists idx_org_created_at  on public.organisations (created_at desc);

-- updated_at automatisch bij elke UPDATE (drop+create = idempotent)
drop trigger if exists organisations_set_updated_at on public.organisations;
create trigger organisations_set_updated_at
  before update on public.organisations
  for each row execute procedure public.set_updated_at();

-- RLS aan, geen publieke policies: alleen de service-role (Netlify functions) leest/schrijft.
alter table public.organisations enable row level security;
