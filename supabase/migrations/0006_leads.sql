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
