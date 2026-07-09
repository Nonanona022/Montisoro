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
