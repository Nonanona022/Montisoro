-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — RUN DIT IN SUPABASE  (alle migraties 0001 t/m 0022, in volgorde)
-- ───────────────────────────────────────────────────────────────────
-- HOE: Supabase → linkermenu "SQL Editor" → "New query" → dit HELE bestand
--      plakken → knop "Run" (rechtsonder). Eén keer. Klaar.
--
-- • Volledig IDEMPOTENT: veilig opnieuw te draaien (geen dubbele data, geen verlies).
--   Ook als je een eerdere (deels mislukte) poging deed: gewoon opnieuw runnen.
-- • Maakt alle tabellen: calculator_submissions, form_submissions,
--   delivery_failures, leads, site_content (+ alle 9 content-keys),
--   audit_log, users, organisations, contacts, content_versions,
--   page_views, events, web_vitals, daily_metrics, gsc_connection.
-- • RLS staat aan; enkel de service-role (server-side) mag erbij.
--
-- ⚠️ STORAGE-BUCKET: 0002 probeert de bucket "verzuimrapporten" te maken.
--    Lukt dat niet via SQL op jouw project, maak hem dan met de hand:
--    Supabase → Storage → New bucket → naam exact  verzuimrapporten  → Private (Public UIT).
-- ═══════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════
-- 0001_calculator_submissions.sql
-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 2 · STAP 4 (DB-laag)
-- Migration 0001 — table  public.calculator_submissions
-- ───────────────────────────────────────────────────────────────────
-- Idempotent: safe to run more than once (CREATE … IF NOT EXISTS).
-- Column names match netlify/functions/calculator-report.js (baseRecord
-- + patchSubmission) EXACTLY — do not rename without updating the function.
-- Run in: Supabase → SQL Editor → New query → paste → Run.
-- ═══════════════════════════════════════════════════════════════════

-- gen_random_uuid() lives in pgcrypto (built-in on Supabase, this is a no-op safety net)
create extension if not exists pgcrypto;

create table if not exists public.calculator_submissions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  lang          text not null check (lang in ('nl','en')),
  source        text not null default 'calculator',

  -- contact
  name          text,
  company       text,
  email         text not null,
  phone         text,
  consent       boolean not null default false,

  -- raw input (audit / recompute)
  input         jsonb not null,

  -- computed key results (dashboard filters without recompute)
  annual_cost           numeric,
  lost_workdays         integer,
  cost_per_employee     numeric,
  cost_per_lost_day     numeric,
  absence_rate          numeric,
  risk_level            text,

  -- statuses (written by the function, read by the admin)
  pdf_status            text not null default 'pending',  -- pending | generated | failed
  pdf_path              text,                             -- path in Storage, NOT a public URL
  mail_status           text not null default 'pending',  -- pending | sent | failed
  internal_mail_status  text not null default 'pending',  -- pending | sent | failed
  lead_status           text not null default 'new',      -- new | viewed | followed_up

  -- free admin notes
  notes         text
);

-- ── Dashboard-helpful indexes (newest-first list, lookup by email, filter by lead state) ──
create index if not exists idx_calcsub_created_at  on public.calculator_submissions (created_at desc);
create index if not exists idx_calcsub_email       on public.calculator_submissions (email);
create index if not exists idx_calcsub_lead_status on public.calculator_submissions (lead_status);

-- ── Row Level Security ──
-- Enable RLS and grant NO public policies. The Netlify function uses the
-- service-role key, which bypasses RLS entirely. The admin must read through
-- a server-side/authenticated channel — never with the anon key in the browser.
alter table public.calculator_submissions enable row level security;

-- (Intentionally no CREATE POLICY statements: anon/authenticated clients get zero access.)


-- ═══════════════════════════════════════════════════════════════════
-- 0002_storage_bucket.sql
-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 2 · STAP 4 (Storage)
-- Migration 0002 — private bucket  verzuimrapporten
-- ───────────────────────────────────────────────────────────────────
-- Idempotent: ON CONFLICT DO NOTHING. Bucket id MUST equal the PDF_BUCKET
-- env var (default 'verzuimrapporten' in netlify/functions/_lib/supabase.js).
-- PDFs are stored at  {year}/{submission_id}/{version}.pdf  and are NEVER public —
-- the admin/customer gets a time-limited signed URL (createSignedUrl). Each
-- (re)generation writes a new versioned object, so history is retained.
-- ═══════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('verzuimrapporten', 'verzuimrapporten', false)
on conflict (id) do nothing;

-- No storage RLS policies required: the function uploads/downloads with the
-- service-role key, which bypasses storage RLS. Keeping the bucket private
-- (public=false) means there is no anonymous read path — exactly what we want
-- for documents that contain personal data.
--
-- If you prefer the Dashboard route instead of this SQL:
--   Supabase → Storage → New bucket → name "verzuimrapporten" → Public = OFF.


-- ═══════════════════════════════════════════════════════════════════
-- 0003_form_submissions.sql
-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 2 · audit-taak 07 (anti-leadverlies)
-- Migration 0003 — table  public.form_submissions
-- ───────────────────────────────────────────────────────────────────
-- Durable storage for the three LIGHT forms (contact / fit-check / Casey),
-- which were e-mail-only. Persisting a row first means a Resend hiccup
-- never loses a lead. Idempotent (CREATE … IF NOT EXISTS).
-- Column names match netlify/functions/form-submit.js (insertFormSubmission
-- + patchFormSubmission). The raw form fields live in the `fields` jsonb.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;  -- gen_random_uuid() (no-op on Supabase)

create table if not exists public.form_submissions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  type          text not null check (type in ('contact','fitcheck','casey')),
  lang          text not null default 'nl' check (lang in ('nl','en')),

  email         text not null,
  name          text,
  company       text,

  -- full raw form payload (datum/tijdstip/route/maturiteit/… — type-dependent)
  fields        jsonb not null default '{}'::jsonb,

  -- delivery statuses (written by the function)
  mail_status     text not null default 'pending',  -- internal notify : pending | sent | failed
  confirm_status  text not null default 'pending',  -- visitor confirm : pending | sent | failed
  lead_status     text not null default 'new',       -- new | viewed | followed_up

  notes         text
);

-- Dashboard-helpful indexes (newest-first list, filter by type / lead state, lookup by email)
create index if not exists idx_formsub_created_at  on public.form_submissions (created_at desc);
create index if not exists idx_formsub_type        on public.form_submissions (type);
create index if not exists idx_formsub_email       on public.form_submissions (email);
create index if not exists idx_formsub_lead_status on public.form_submissions (lead_status);

-- RLS on, no public policies: only the service-role (function) reaches this table.
alter table public.form_submissions enable row level security;


-- ═══════════════════════════════════════════════════════════════════
-- 0004_site_content.sql
-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — Website ↔ Dashboard read-bridge
-- Migration 0004 — table  public.site_content
-- ───────────────────────────────────────────────────────────────────
-- Dashboard-managed PUBLIC content that the live website reads at runtime
-- (testimonials, "trusted by" logos, calculator parameters, …). One row
-- per content key; the payload lives in `data` (jsonb) in the exact shape
-- the website data files use today (window.MONTISORO_TRUSTED / _TESTIMONIALS
-- / calc params). The admin writes here; the site reads via the
-- /api/site-content function (service-role, server-side only).
--
-- Idempotent (CREATE … IF NOT EXISTS). Inert until SUPABASE_* env is set —
-- the function returns {configured:false} and the site keeps its hardcoded
-- fallback data, so nothing breaks before this is populated.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create table if not exists public.site_content (
  key         text primary key check (key in ('trusted_by','testimonials','calc_params')),
  data        jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- RLS on, no public policies: only the service-role (functions) reach this table.
-- The public site never talks to Supabase directly — it goes through
-- /api/site-content, which uses the service-role key server-side.
alter table public.site_content enable row level security;


-- ═══════════════════════════════════════════════════════════════════
-- 0005_delivery_failures.sql
-- ═══════════════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════════════
-- 0006_leads.sql
-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — Migration 0006 — table public.leads
-- ───────────────────────────────────────────────────────────────────
-- CRM leads tabel. Vervangt de localStorage-only mock-data.
-- Geschreven door admin-leads.js (HMAC-beveiligd, service-role).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Contactgegevens
  name          text,
  org           text,
  email         text,
  phone         text,

  -- Pipeline
  stage         text not null default 'new'
                  check (stage in ('new','qualified','diagnostic','proposal','won','cold')),
  source        text default 'contact'
                  check (source in ('fit-check','contact','calculator','casey-waitlist','referral','other')),
  value         text,          -- bijv. "€60K" (vrij veld voor nu)
  value_eur     integer,       -- numeriek voor sortering/som

  -- Opvolging
  notes         text,
  assigned_to   text,          -- e-mail van verantwoordelijke admin

  -- Koppeling met website-flows
  submission_id uuid           -- FK naar form_submissions of calculator_submissions (optioneel)
);

-- Indexes voor dashboard-queries
create index if not exists idx_leads_stage      on public.leads (stage);
create index if not exists idx_leads_created_at on public.leads (created_at desc);
create index if not exists idx_leads_email      on public.leads (email);

-- Automatische updated_at bij elke UPDATE
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute procedure public.set_updated_at();

-- RLS aan, geen publieke policies — alleen service-role (Netlify functions)
alter table public.leads enable row level security;


-- ═══════════════════════════════════════════════════════════════════
-- 0007_read_handled.sql
-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — Migration 0007 — read/handled status op inzendingen
-- ───────────────────────────────────────────────────────────────────
-- Persistente "als gelezen" + "behandeld" markering voor het dashboard.
-- Geldt voor calculator_submissions én form_submissions (contact/fitcheck/casey).
-- ═══════════════════════════════════════════════════════════════════

alter table public.calculator_submissions
  add column if not exists read_at    timestamptz,
  add column if not exists handled_at timestamptz;

alter table public.form_submissions
  add column if not exists read_at    timestamptz,
  add column if not exists handled_at timestamptz,
  add column if not exists lead_status text,
  add column if not exists notes      text;


-- ═══════════════════════════════════════════════════════════════════
-- 0008_audit_log.sql
-- ═══════════════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════════════
-- 0009_organisations.sql
-- ═══════════════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════════════
-- 0010_contacts.sql
-- ═══════════════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════════════
-- 0011_users.sql
-- ═══════════════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════════════
-- 0012_content_versions.sql
-- ═══════════════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════════════
-- 0013_link_leads_submissions.sql
-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 2 · STAP 2 (datafundament)
-- Migration 0013 — koppel leads + submissions aan organisations/contacts
-- ───────────────────────────────────────────────────────────────────
-- Voegt nullable FK-kolommen toe aan de drie bestaande databron-tabellen,
-- plus de toekomst-dimensies (product_id/site_id) op leads. De BESTAANDE
-- tekstvelden (name/company/org/email) blijven onaangeroerd als fallback
-- tijdens de overgang — er wordt niets verwijderd of hernoemd.
--
-- Additief + idempotent (ADD COLUMN IF NOT EXISTS). Afhankelijk van 0009+0010.
-- De feitelijke vulling van deze kolommen gebeurt in 0014 (backfill).
-- ═══════════════════════════════════════════════════════════════════

-- ── leads ──────────────────────────────────────────────────────────
alter table public.leads add column if not exists org_id     uuid references public.organisations(id) on delete set null;
alter table public.leads add column if not exists contact_id uuid references public.contacts(id)      on delete set null;
alter table public.leads add column if not exists product_id text;   -- prep multi-product (Storm/Casey)
alter table public.leads add column if not exists site_id    text;   -- prep multi-site / multi-brand
create index if not exists idx_leads_org     on public.leads (org_id);
create index if not exists idx_leads_contact on public.leads (contact_id);

-- ── calculator_submissions ─────────────────────────────────────────
alter table public.calculator_submissions add column if not exists org_id     uuid references public.organisations(id) on delete set null;
alter table public.calculator_submissions add column if not exists contact_id uuid references public.contacts(id)      on delete set null;
create index if not exists idx_calcsub_org     on public.calculator_submissions (org_id);
create index if not exists idx_calcsub_contact on public.calculator_submissions (contact_id);

-- ── form_submissions ───────────────────────────────────────────────
alter table public.form_submissions add column if not exists org_id     uuid references public.organisations(id) on delete set null;
alter table public.form_submissions add column if not exists contact_id uuid references public.contacts(id)      on delete set null;
create index if not exists idx_formsub_org     on public.form_submissions (org_id);
create index if not exists idx_formsub_contact on public.form_submissions (contact_id);


-- ═══════════════════════════════════════════════════════════════════
-- 0014_backfill_org_contacts.sql
-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 2 · STAP 2 (datafundament)
-- Migration 0014 — backfill: organisations + contacts uit bestaande data
-- ───────────────────────────────────────────────────────────────────
-- Best-effort, IDEMPOTENT. Leidt organisaties + contacten af uit de drie
-- bron-tabellen en koppelt bestaande leads/submissions eraan. Herhaald
-- draaien maakt GEEN duplicaten (alle inserts zijn NOT EXISTS-bewaakt en de
-- bron wordt eerst gededupliceerd; de updates raken alleen nog-NULL rijen).
--
-- Draai NA 0009–0013, en bij voorkeur eerst op staging. Het is een eenmalige
-- migratie van vandaag-bestaande data; nieuwe inzendingen worden vanaf STAP 3+
-- direct gekoppeld door de functies. Geen impact op de live website.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. ORGANISATIES ────────────────────────────────────────────────
-- Naam = bedrijfsnaam indien aanwezig, anders het (niet-generieke) e-maildomein.
with raw as (
  select nullif(trim(company),'') as company, lower(nullif(split_part(email,'@',2),'')) as domain_raw
  from public.calculator_submissions
  union all
  select nullif(trim(company),''), lower(nullif(split_part(email,'@',2),''))
  from public.form_submissions
  union all
  select nullif(trim(org),''),     lower(nullif(split_part(email,'@',2),''))
  from public.leads
),
norm as (
  select company,
         case when domain_raw in (
           'gmail.com','hotmail.com','hotmail.be','outlook.com','live.com','live.be',
           'yahoo.com','icloud.com','me.com','proton.me','telenet.be','skynet.be'
         ) then null else domain_raw end as domain
  from raw
),
orgs as (
  select coalesce(company, domain) as name, domain
  from norm
  where coalesce(company, domain) is not null
),
orgs_dedup as (
  select name, max(domain) as domain from orgs group by name
)
insert into public.organisations (name, domain)
select d.name, d.domain
from orgs_dedup d
where not exists (select 1 from public.organisations o where lower(o.name) = lower(d.name));

-- ── 2. CONTACTEN (één per uniek e-mailadres), gekoppeld aan organisatie ──
with raw as (
  select nullif(lower(trim(email)),'') as email, nullif(trim(name),'') as cname,
         nullif(trim(company),'') as company, lower(nullif(split_part(email,'@',2),'')) as domain_raw
  from public.calculator_submissions
  union all
  select nullif(lower(trim(email)),''), nullif(trim(name),''), nullif(trim(company),''), lower(nullif(split_part(email,'@',2),''))
  from public.form_submissions
  union all
  select nullif(lower(trim(email)),''), nullif(trim(name),''), nullif(trim(org),''), lower(nullif(split_part(email,'@',2),''))
  from public.leads
),
ded as (
  select email, max(cname) as cname, max(company) as company, max(domain_raw) as domain_raw
  from raw where email is not null group by email
)
insert into public.contacts (email, name, org_id)
select d.email, d.cname,
       (select o.id from public.organisations o
        where (d.company is not null and lower(o.name) = lower(d.company))
           or (o.domain is not null and o.domain = d.domain_raw)
        order by (d.company is not null and lower(o.name) = lower(d.company)) desc
        limit 1) as org_id
from ded d
where not exists (select 1 from public.contacts c where lower(c.email) = d.email);

-- ── 3. KOPPEL bestaande rijen (alleen waar nog niet gekoppeld → idempotent) ──
update public.leads l
set contact_id = c.id,
    org_id     = coalesce(l.org_id, c.org_id)
from public.contacts c
where l.contact_id is null and l.email is not null and lower(l.email) = lower(c.email);

update public.calculator_submissions s
set contact_id = c.id,
    org_id     = coalesce(s.org_id, c.org_id)
from public.contacts c
where s.contact_id is null and s.email is not null and lower(s.email) = lower(c.email);

update public.form_submissions s
set contact_id = c.id,
    org_id     = coalesce(s.org_id, c.org_id)
from public.contacts c
where s.contact_id is null and s.email is not null and lower(s.email) = lower(c.email);


-- ═══════════════════════════════════════════════════════════════════
-- 0015_users_auth.sql
-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 2 · STAP 4 (auth / RBAC)
-- Migration 0015 — auth-kolommen op public.users
-- ───────────────────────────────────────────────────────────────────
-- Maakt per-gebruiker credentials mogelijk zonder het bestaande model te
-- breken: zolang een gebruiker GÉÉN password_hash heeft, blijft de login
-- het gedeelde ADMIN_PASSWORD gebruiken (transitie-veilig, geen lockout).
--
-- MFA-kolommen zijn GERESERVEERD. De feitelijke MFA-poort is de externe
-- IdP-gate (Cloudflare Access) — zie security-setup.md; app-niveau TOTP is
-- bewust niet hand-gerold. Additief + idempotent.
-- ═══════════════════════════════════════════════════════════════════

alter table public.users add column if not exists password_hash text;        -- scrypt$N$salt$hash · NULL = gebruik gedeeld ADMIN_PASSWORD
alter table public.users add column if not exists mfa_enabled   boolean not null default false;
alter table public.users add column if not exists mfa_secret    text;         -- gereserveerd (TOTP) — poort = Cloudflare Access
alter table public.users add column if not exists last_login    timestamptz;


-- ═══════════════════════════════════════════════════════════════════
-- 0016_site_content_keys.sql
-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 2 · STAP 5 (content-bridge)
-- Migration 0016 — verbreed de site_content.key-CHECK
-- ───────────────────────────────────────────────────────────────────
-- 0004 stond alleen 'trusted_by'/'testimonials'/'calc_params' toe, maar de
-- admin (admin-content.js ALLOWED_KEYS) publiceert óók feature_flags,
-- booking_schedule, faq, seo, microcopy en email_templates → die writes
-- faalden op de CHECK. Deze migratie trekt de CHECK gelijk met de
-- write-allowlist. Idempotent (drop + add if-exists patroon).
-- ═══════════════════════════════════════════════════════════════════

alter table public.site_content drop constraint if exists site_content_key_check;

alter table public.site_content add constraint site_content_key_check
  check (key in (
    'trusted_by', 'testimonials', 'calc_params',
    'feature_flags', 'booking_schedule',
    'faq', 'seo', 'microcopy', 'email_templates'
  ));


-- ═══════════════════════════════════════════════════════════════════
-- 0017_page_views.sql
-- ═══════════════════════════════════════════════════════════════════
-- 0017_page_views.sql — cookieloze first-party pageview-analytics
-- Geen cookies, geen IP, geen fingerprint. Alleen service-role leest/schrijft.
create table if not exists public.page_views (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  path        text not null,
  referrer    text,
  lang        text,
  device      text,
  screen_w    integer
);
alter table public.page_views enable row level security;
-- geen public policy → enkel de server (service-role) kan lezen/schrijven
create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx    on public.page_views (path);


-- ═══════════════════════════════════════════════════════════════════
-- 0018_events.sql
-- ═══════════════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════════════
-- 0019_web_vitals.sql
-- ═══════════════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════════════
-- 0020_daily_metrics.sql
-- ═══════════════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════════════
-- 0021_form_submissions_booking.sql
-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Montisoro — FASE 3 · Analyse-module
-- Migration 0021 — fix: form_submissions.type CHECK uitbreiden met 'booking'
-- ───────────────────────────────────────────────────────────────────
-- Latente bug: 0003 stond enkel ('contact','fitcheck','casey') toe, terwijl
-- netlify/functions/form-submit.js óók rijen met type='booking' wegschrijft
-- (afspraken). Deze migratie herstelt de CHECK zodat booking-inzendingen
-- niet geweigerd worden. Idempotent: drop-if-exists + opnieuw aanmaken.
-- ═══════════════════════════════════════════════════════════════════

alter table public.form_submissions
  drop constraint if exists form_submissions_type_check;

alter table public.form_submissions
  add constraint form_submissions_type_check
  check (type in ('contact', 'fitcheck', 'casey', 'booking'));


-- ═══════════════════════════════════════════════════════════════════
-- 0022_gsc_connection.sql
-- ═══════════════════════════════════════════════════════════════════
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
