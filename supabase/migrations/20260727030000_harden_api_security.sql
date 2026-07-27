-- Harden the public API surface, tighten host permissions, and remove
-- first-run advisor findings without changing scheduling semantics.

alter extension btree_gist set schema extensions;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;

revoke all on table public.calendar_connections from anon, authenticated;

revoke update on table public.users from authenticated;
grant select on table public.users to authenticated;
grant update (display_name, time_zone) on table public.users to authenticated;

grant select on table public.booking_pages to anon, authenticated;
grant insert, update, delete on table public.booking_pages to authenticated;
grant select on table public.event_types to anon, authenticated;
grant insert, update, delete on table public.event_types to authenticated;
grant select, insert, update, delete on table public.availability_rules to authenticated;
grant select, insert, update, delete on table public.availability_overrides to authenticated;
grant select on table public.appointments to authenticated;
grant select on table public.notifications to authenticated;

drop policy if exists "users can view their profile" on public.users;
drop policy if exists "users can update their profile" on public.users;
drop policy if exists "active booking pages are public" on public.booking_pages;
drop policy if exists "hosts manage their booking page" on public.booking_pages;
drop policy if exists "hosts manage their event types" on public.event_types;
drop policy if exists "hosts manage availability rules" on public.availability_rules;
drop policy if exists "hosts manage availability overrides" on public.availability_overrides;
drop policy if exists "hosts manage calendar connections" on public.calendar_connections;
drop policy if exists "hosts view their appointments" on public.appointments;
drop policy if exists "hosts view their notifications" on public.notifications;

create policy "users can view their profile" on public.users
  for select to authenticated using (id = (select auth.uid()));
create policy "users can update their profile" on public.users
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "booking pages are visible when active or owned" on public.booking_pages
  for select to anon, authenticated using (is_active or host_id = (select auth.uid()));
create policy "hosts create booking pages" on public.booking_pages
  for insert to authenticated with check (host_id = (select auth.uid()));
create policy "hosts update booking pages" on public.booking_pages
  for update to authenticated using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));
create policy "hosts delete booking pages" on public.booking_pages
  for delete to authenticated using (host_id = (select auth.uid()));

create policy "event types are visible when active or owned" on public.event_types
  for select to anon, authenticated using (is_active or host_id = (select auth.uid()));
create policy "hosts create event types" on public.event_types
  for insert to authenticated with check (host_id = (select auth.uid()));
create policy "hosts update event types" on public.event_types
  for update to authenticated using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));
create policy "hosts delete event types" on public.event_types
  for delete to authenticated using (host_id = (select auth.uid()));

create policy "hosts manage availability rules" on public.availability_rules
  for all to authenticated using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));
create policy "hosts manage availability overrides" on public.availability_overrides
  for all to authenticated using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));
create policy "hosts manage calendar connections" on public.calendar_connections
  for all to authenticated using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));
create policy "hosts view their appointments" on public.appointments
  for select to authenticated using (host_id = (select auth.uid()));
create policy "hosts view their notifications" on public.notifications
  for select to authenticated using (
    exists (
      select 1 from public.appointments
      where appointments.id = notifications.appointment_id
        and appointments.host_id = (select auth.uid())
    )
  );

create index appointments_event_type_idx on public.appointments (event_type_id);
