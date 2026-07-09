-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 2 · STAP 2 (datafundament)
-- Migration 0011 — table  public.users
-- ───────────────────────────────────────────────────────────────────
-- Echte ADMIN-gebruikers. Vandaag is er één gedeeld wachtwoord en één
-- hardcoded rol (admin-auth.js → ROLE_BY_EMAIL = laurence@…). Deze tabel
-- is het fundament voor STAP 4 (echte accounts + RBAC + MFA): per-gebruiker
-- credentials/rollen i.p.v. één gedeelde sleutel. STAP 2 maakt enkel het
-- schema; de auth-functies gaan er pas in STAP 4 naar lezen.
--
-- Additief + idempotent. Géén wachtwoord-hash hier — credentials/MFA komen
-- in STAP 4 (of via de externe IdP-gate, Cloudflare Access).
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  email       text not null,
  name        text,
  role        text not null default 'viewer'
                check (role in ('admin','editor','viewer')),
  status      text not null default 'active'
                check (status in ('active','paused','disabled')),
  last_seen   timestamptz,
  invited_by  text               -- e-mail van wie uitnodigde
);

create unique index if not exists idx_users_email_uniq on public.users (lower(email));

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- Seed: de huidige enige beheerder (matcht ROLE_BY_EMAIL in admin-auth.js).
-- Idempotent via NOT EXISTS — herhaald draaien voegt niets dubbel toe.
insert into public.users (email, name, role, status)
select 'laurence@montisoro.com', 'Laurence Van den Bergh', 'admin', 'active'
where not exists (select 1 from public.users where lower(email) = 'laurence@montisoro.com');

-- RLS aan, geen publieke policies: alleen de service-role.
alter table public.users enable row level security;
