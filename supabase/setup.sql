-- Morrowlane Service Request Portal: database setup.
-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.
-- It is safe to re-run: it drops and recreates the table, which ERASES all requests.

drop table if exists public.requests;

create table public.requests (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  requester_name text not null check (btrim(requester_name) <> ''),
  location       text not null check (location in ('Minneapolis', 'Chicago', 'Denver', 'Austin')),
  description    text not null check (btrim(description) <> '' and char_length(description) <= 500),
  priority       text not null check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  status         text not null default 'New' check (status in ('New', 'In Progress', 'Complete'))
);

-- The app talks to Supabase with the anon key from the server only (it is never
-- sent to the browser). Row Level Security is on, and the policies below allow
-- exactly what the app does: read every request, add one, and change status.
alter table public.requests enable row level security;

create policy "Anyone can read requests"
  on public.requests for select to anon using (true);

create policy "Anyone can add a request"
  on public.requests for insert to anon with check (status = 'New');

create policy "Anyone can update a request"
  on public.requests for update to anon using (true) with check (true);

-- Column-level limits: on insert, ids and timestamps are assigned by the
-- database; on update, only the status column can change. No deletes.
revoke all on public.requests from anon;
grant select on public.requests to anon;
grant insert (requester_name, location, description, priority, status) on public.requests to anon;
grant update (status) on public.requests to anon;

-- Seed data: the 22 requests from data/seed-requests.csv, oldest first so ids run 1-22.
insert into public.requests (created_at, requester_name, location, description, priority, status) values
  ('2026-07-16T14:20:00Z', 'Dana Whitfield', 'Minneapolis', 'HVAC making noise in suite 400', 'High', 'Complete'),
  ('2026-07-17T16:05:00Z', 'Marcus Ellery', 'Chicago', 'Replace lobby badge printer', 'Medium', 'Complete'),
  ('2026-07-20T13:38:00Z', 'Priya Raghunathan', 'Denver', 'Standing desk request — new hire starts Aug 3', 'Medium', 'Complete'),
  ('2026-07-22T18:47:00Z', 'Tomas Beckley', 'Austin', 'Conference room B projector will not connect to laptops', 'High', 'Complete'),
  ('2026-07-24T15:11:00Z', 'Alison Vo', 'Minneapolis', 'Schedule quarterly fire-safety inspection', 'Medium', 'Complete'),
  ('2026-07-27T21:02:00Z', 'Devon Ruiz', 'Chicago', 'Water leak under the breakroom sink, floor 6', 'Urgent', 'Complete'),
  ('2026-07-29T14:55:00Z', 'Hannah Sorensen', 'Denver', 'Order two ergonomic chairs for the finance team', 'Low', 'Complete'),
  ('2026-07-31T17:26:00Z', 'Curtis Nakamura', 'Austin', 'Badge access not working for the fourth floor stairwell', 'High', 'Complete'),
  ('2026-08-03T13:15:00Z', 'Renata Oyelaran', 'Minneapolis', 'Coffee machine in the north kitchen keeps shutting off', 'Low', 'Complete'),
  ('2026-08-04T19:40:00Z', 'Grant Pemberton', 'Chicago', 'Move six workstations from 12A to 12C before Friday', 'Medium', 'Complete'),
  ('2026-08-06T14:08:00Z', 'Sofia Marchetti', 'Denver', 'Elevator 2 stopped between floors, riders freed by building staff', 'Urgent', 'Complete'),
  ('2026-08-07T16:33:00Z', 'Isaac Fontaine', 'Austin', 'Restock the first aid cabinets on all three floors', 'Low', 'Complete'),
  ('2026-08-10T15:47:00Z', 'Dana Whitfield', 'Minneapolis', 'Replace burned out lights above the reception desk', 'Low', 'Complete'),
  ('2026-08-12T13:52:00Z', 'Marcus Ellery', 'Chicago', 'Quote needed for repainting the 8th floor corridor', 'Medium', 'In Progress'),
  ('2026-08-14T20:19:00Z', 'Priya Raghunathan', 'Denver', 'Server room temperature alarm went off twice overnight', 'Urgent', 'In Progress'),
  ('2026-08-17T14:41:00Z', 'Tomas Beckley', 'Austin', 'Set up two extra monitors in the training room', 'Medium', 'In Progress'),
  ('2026-08-19T18:07:00Z', 'Nadia Kowalski', 'Minneapolis', 'Loading dock door closes only halfway', 'High', 'In Progress'),
  ('2026-08-21T15:24:00Z', 'Curtis Nakamura', 'Austin', 'Add visitor parking signage at the south entrance', 'Low', 'In Progress'),
  ('2026-08-24T13:36:00Z', 'Renata Oyelaran', 'Minneapolis', 'Quarterly deep clean for the client meeting suites', 'Medium', 'In Progress'),
  ('2026-08-26T16:58:00Z', 'Grant Pemberton', 'Chicago', 'Front entrance card reader is slow to respond, sometimes needs three taps', 'High', 'New'),
  ('2026-08-27T14:12:00Z', 'Sofia Marchetti', 'Denver', 'Request a second recycling pickup each week', 'Low', 'New'),
  ('2026-08-28T17:45:00Z', 'Alison Vo', 'Minneapolis', 'Air conditioning in suite 220 is not cooling, staff moved to the open area', 'Urgent', 'New');
