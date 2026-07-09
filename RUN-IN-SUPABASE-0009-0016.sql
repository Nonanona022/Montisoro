-- Montisoro — migraties 0009 t/m 0016 (in volgorde, idempotent)
-- Plak dit hele blok in Supabase SQL Editor en klik Run. Verwacht: Success.

-- ===================== 0009_organisations =====================
create extension if not exists pgcrypto;  -- gen_random_uuid() (no-op op Supabase)
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
  product_id  text,              -- prep Storm / Casey (multi-product)
  site_id     text               -- prep multi-site / multi-brand
);
create index if not exists idx_org_domain on public.organisations (lower(domain));
create index if not exists idx_org_name       on public.organisations (lower(name));
create index if not exists idx_org_created_at  on public.organisations (created_at desc);
drop trigger if exists organisations_set_updated_at on public.organisations;
create trigger organisations_set_updated_at
  before update on public.organisations
  for each row execute procedure public.set_updated_at();
alter table public.organisations enable row level security;

-- ===================== 0010_contacts =====================
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
create unique index if not exists idx_contact_email_uniq on public.contacts (lower(email)) where email is not null;
create index if not exists idx_contact_org        on public.contacts (org_id);
create index if not exists idx_contact_created_at  on public.contacts (created_at desc);
drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute procedure public.set_updated_at();
alter table public.contacts enable row level security;

-- ===================== 0011_users =====================
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
insert into public.users (email, name, role, status)
select 'laurence@montisoro.com', 'Laurence Van den Bergh', 'admin', 'active'
where not exists (select 1 from public.users where lower(email) = 'laurence@montisoro.com');
alter table public.users enable row level security;

-- ===================== 0012_content_versions =====================
create extension if not exists pgcrypto;
create table if not exists public.content_versions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  key           text not null,     -- de site_content-key (trusted_by, testimonials, …)
  data          jsonb not null,    -- volledige snapshot van de gepubliceerde payload
  published_by  text,              -- e-mail van de admin
  note          text               -- optionele toelichting bij de publish
);
create index if not exists idx_contentver_key_created on public.content_versions (key, created_at desc);
alter table public.content_versions enable row level security;

-- ===================== 0013_link_leads_submissions =====================
alter table public.leads add column if not exists org_id     uuid references public.organisations(id) on delete set null;
alter table public.leads add column if not exists contact_id uuid references public.contacts(id)      on delete set null;
alter table public.leads add column if not exists product_id text;   -- prep multi-product (Storm/Casey)
alter table public.leads add column if not exists site_id    text;   -- prep multi-site / multi-brand
create index if not exists idx_leads_org     on public.leads (org_id);
create index if not exists idx_leads_contact on public.leads (contact_id);
alter table public.calculator_submissions add column if not exists org_id     uuid references public.organisations(id) on delete set null;
alter table public.calculator_submissions add column if not exists contact_id uuid references public.contacts(id)      on delete set null;
create index if not exists idx_calcsub_org     on public.calculator_submissions (org_id);
create index if not exists idx_calcsub_contact on public.calculator_submissions (contact_id);
alter table public.form_submissions add column if not exists org_id     uuid references public.organisations(id) on delete set null;
alter table public.form_submissions add column if not exists contact_id uuid references public.contacts(id)      on delete set null;
create index if not exists idx_formsub_org     on public.form_submissions (org_id);
create index if not exists idx_formsub_contact on public.form_submissions (contact_id);

-- ===================== 0014_backfill_org_contacts =====================
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

-- ===================== 0015_users_auth =====================
alter table public.users add column if not exists password_hash text;        -- scrypt$N$salt$hash · NULL = gebruik gedeeld ADMIN_PASSWORD
alter table public.users add column if not exists mfa_enabled   boolean not null default false;
alter table public.users add column if not exists mfa_secret    text;         -- gereserveerd (TOTP) — poort = Cloudflare Access
alter table public.users add column if not exists last_login    timestamptz;

-- ===================== 0016_site_content_keys =====================
alter table public.site_content drop constraint if exists site_content_key_check;
alter table public.site_content add constraint site_content_key_check
  check (key in (
    'trusted_by', 'testimonials', 'calc_params',
    'feature_flags', 'booking_schedule',
    'faq', 'seo', 'microcopy', 'email_templates'
  ));
