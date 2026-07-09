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
