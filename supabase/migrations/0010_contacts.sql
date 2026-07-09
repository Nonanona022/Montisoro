-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 2 · STAP 2 (datafundament)
-- Migration 0010 — table  public.contacts
-- ───────────────────────────────────────────────────────────────────
-- Eerste-klas CONTACT-entiteit (de persoon). Eén rij per uniek e-mailadres,
-- gekoppeld aan een organisatie (0009). Vervangt de losse name/email-tekst
-- die vandaag per inzending herhaald wordt. leads/submissions verwijzen er
-- straks naar (zie 0013); de bestaande tekstvelden blijven als fallback.
--
-- Additief + idempotent. Afhankelijk van 0009 (FK → organisations).
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  org_id      uuid references public.organisations(id) on delete set null,

  name        text,
  email       text,              -- dedup-sleutel (lowercase)
  phone       text,
  role        text,              -- functie / jobtitel
  notes       text
);

-- Eén contact per e-mailadres (partieel uniek: NULL-e-mails toegestaan).
create unique index if not exists idx_contact_email_uniq on public.contacts (lower(email)) where email is not null;
create index if not exists idx_contact_org        on public.contacts (org_id);
create index if not exists idx_contact_created_at  on public.contacts (created_at desc);

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute procedure public.set_updated_at();

-- RLS aan, geen publieke policies: alleen de service-role.
alter table public.contacts enable row level security;
