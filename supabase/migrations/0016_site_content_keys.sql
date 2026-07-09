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
