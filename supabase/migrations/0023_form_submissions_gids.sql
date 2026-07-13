-- 0023_form_submissions_gids.sql
-- Breidt de type-CHECK op form_submissions uit met 'gids' (RIT 3.0-werkgeversgids lead magnet).
-- 0021 voegde 'booking' toe; deze migratie voegt 'gids' toe. Additief, veilig.
alter table public.form_submissions
  drop constraint if exists form_submissions_type_check;
alter table public.form_submissions
  add constraint form_submissions_type_check
  check (type in ('contact', 'fitcheck', 'casey', 'booking', 'gids'));
