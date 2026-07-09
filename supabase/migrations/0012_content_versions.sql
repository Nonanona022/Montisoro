-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 2 · STAP 2 (datafundament)
-- Migration 0012 — table  public.content_versions
-- ───────────────────────────────────────────────────────────────────
-- VERSIEGESCHIEDENIS voor admin-gepubliceerde content. site_content (0004)
-- bewaart alleen de HUIDIGE versie per key → een foute publish overschrijft
-- de vorige zonder spoor (audit-bevinding FASE 5/13). Deze tabel bewaart
-- een snapshot bij élke publish, zodat STAP 5 één-klik rollback kan bieden.
--
-- Bewust GÉÉN FK naar site_content: we willen historie behouden ook nadat
-- een key verandert, en de site_content.key-CHECK is (nog) te smal voor alle
-- keys die de admin publiceert (microcopy/faq/seo/feature_flags/booking_
-- schedule) — dat verbreden hoort bij STAP 5, niet hier.
--
-- Additief + idempotent. Append-only (geen updates → geen updated_at-trigger).
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create table if not exists public.content_versions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  key           text not null,     -- de site_content-key (trusted_by, testimonials, …)
  data          jsonb not null,    -- volledige snapshot van de gepubliceerde payload
  published_by  text,              -- e-mail van de admin
  note          text               -- optionele toelichting bij de publish
);

-- Nieuwste versie per key snel ophalen (rollback-lijst).
create index if not exists idx_contentver_key_created on public.content_versions (key, created_at desc);

-- RLS aan, geen publieke policies: alleen de service-role.
alter table public.content_versions enable row level security;
