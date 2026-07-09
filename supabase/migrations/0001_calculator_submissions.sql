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
