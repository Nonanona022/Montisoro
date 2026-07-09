-- 0017_page_views.sql — cookieloze first-party pageview-analytics
-- Geen cookies, geen IP, geen fingerprint. Alleen service-role leest/schrijft.
create table if not exists public.page_views (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  path        text not null,
  referrer    text,
  lang        text,
  device      text,
  screen_w    integer
);
alter table public.page_views enable row level security;
-- geen public policy → enkel de server (service-role) kan lezen/schrijven
create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx    on public.page_views (path);
