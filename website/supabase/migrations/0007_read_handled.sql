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
