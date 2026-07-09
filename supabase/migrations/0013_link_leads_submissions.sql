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
