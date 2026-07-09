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
