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
