-- ============================================================
--  TWO COVERS — Database setup
--  Paste this whole file into the Supabase SQL Editor and run it.
--  It creates the restaurants table and the seed entries.
-- ============================================================

create table if not exists restaurants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text not null,
  cuisine     text,
  visit_date  date,
  notes       text,
  -- scores: a JSON object, e.g. {"vibes":9.5,"food":10,"drinks":null}
  -- a null value means "n/a" and is excluded from the total
  scores      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Row Level Security: the public may READ, but writes go only
-- through our server (which checks the shared password).
alter table restaurants enable row level security;

-- Anyone may read the rankings.
create policy "public can read"
  on restaurants for select
  using (true);

-- No one may write using the public key. All inserts/updates/deletes
-- happen on the server with the service key, which bypasses RLS.
-- (So we deliberately add NO insert/update/delete policy here.)

-- ------------------------------------------------------------
--  Seed data — your first two real entries
-- ------------------------------------------------------------
insert into restaurants (name, city, cuisine, visit_date, notes, scores) values
  ('Carbone', 'London, UK', 'Italian-American', '2025-10-09', '',
   '{"vibes":9.5,"food":10,"menu":9,"drinks":10,"service":9,"bathroom":10}'::jsonb),
  ('Imoto', 'Palm Beach, USA', 'Japanese', '2026-01-20', '',
   '{"vibes":8,"food":10,"menu":10,"drinks":null,"service":7.5,"bathroom":8}'::jsonb);
