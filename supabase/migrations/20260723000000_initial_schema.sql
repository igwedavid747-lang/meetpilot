-- MeetPilot's Supabase schema. Apply with `supabase db reset` locally or
-- `supabase db push` to a linked project. Review before applying to production.

create extension if not exists btree_gist;

create type public.appointment_status as enum ('confirmed', 'cancelled', 'rescheduled');
create type public.calendar_provider as enum ('google', 'outlook');
create type public.notification_status as enum ('queued', 'sent', 'failed');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email varchar(320) not null unique,
  display_name varchar(120) not null,
  time_zone varchar(64) not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booking_pages (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null unique references public.users (id) on delete cascade,
  slug varchar(80) not null unique,
  headline varchar(160),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users (id) on delete cascade,
  title varchar(120) not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  location varchar(500),
  buffer_before_minutes integer not null default 0 check (buffer_before_minutes >= 0),
  buffer_after_minutes integer not null default 0 check (buffer_after_minutes >= 0),
  minimum_notice_minutes integer not null default 120 check (minimum_notice_minutes >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index event_types_host_idx on public.event_types (host_id);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users (id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  time_zone varchar(64) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time)
);

create index availability_rules_host_day_idx on public.availability_rules (host_id, weekday);

create table public.availability_overrides (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users (id) on delete cascade,
  date date not null,
  is_available boolean not null,
  start_time time,
  end_time time,
  reason varchar(200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (is_available = false and start_time is null and end_time is null)
    or (is_available = true and start_time is not null and end_time is not null and start_time < end_time)
  )
);

create index availability_overrides_host_date_idx on public.availability_overrides (host_id, date);

create table public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users (id) on delete cascade,
  provider public.calendar_provider not null,
  calendar_id varchar(512) not null,
  encrypted_refresh_token text not null,
  scopes text[] not null default '{}',
  sync_status varchar(32) not null default 'active',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (host_id, provider)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users (id) on delete cascade,
  event_type_id uuid not null references public.event_types (id),
  invitee_name varchar(120) not null,
  invitee_email varchar(320) not null,
  invitee_time_zone varchar(64) not null,
  note text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'confirmed',
  provider_event_id varchar(512),
  cancellation_token uuid not null default gen_random_uuid() unique,
  reschedule_token uuid not null default gen_random_uuid() unique,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index appointments_host_starts_idx on public.appointments (host_id, starts_at);

alter table public.appointments
  add constraint appointments_no_confirmed_overlap
  exclude using gist (
    host_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'confirmed');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  type varchar(64) not null,
  recipient varchar(320) not null,
  provider_message_id varchar(256),
  status public.notification_status not null default 'queued',
  retry_count integer not null default 0 check (retry_count >= 0),
  failure_reason text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, type, recipient)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger booking_pages_set_updated_at before update on public.booking_pages for each row execute function public.set_updated_at();
create trigger event_types_set_updated_at before update on public.event_types for each row execute function public.set_updated_at();
create trigger availability_rules_set_updated_at before update on public.availability_rules for each row execute function public.set_updated_at();
create trigger availability_overrides_set_updated_at before update on public.availability_overrides for each row execute function public.set_updated_at();
create trigger calendar_connections_set_updated_at before update on public.calendar_connections for each row execute function public.set_updated_at();
create trigger appointments_set_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger notifications_set_updated_at before update on public.notifications for each row execute function public.set_updated_at();

-- The auth schema is managed by Supabase. This creates the matching profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- The server route calls this once, which makes the appointment insert and
-- notification enqueue atomic. The exclusion constraint is the final guard.
create or replace function public.create_booking(
  p_host_id uuid,
  p_event_type_id uuid,
  p_invitee_name varchar,
  p_invitee_email varchar,
  p_invitee_time_zone varchar,
  p_note text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_host_email varchar
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  appointment_id uuid;
begin
  insert into public.appointments (
    host_id, event_type_id, invitee_name, invitee_email, invitee_time_zone,
    note, starts_at, ends_at
  ) values (
    p_host_id, p_event_type_id, p_invitee_name, p_invitee_email, p_invitee_time_zone,
    p_note, p_starts_at, p_ends_at
  ) returning id into appointment_id;

  insert into public.notifications (appointment_id, type, recipient)
  values
    (appointment_id, 'booking_confirmation', p_invitee_email),
    (appointment_id, 'booking_confirmation', p_host_email);

  return appointment_id;
end;
$$;

revoke all on function public.create_booking(uuid, uuid, varchar, varchar, varchar, text, timestamptz, timestamptz, varchar) from public, anon, authenticated;
grant execute on function public.create_booking(uuid, uuid, varchar, varchar, varchar, text, timestamptz, timestamptz, varchar) to service_role;

alter table public.users enable row level security;
alter table public.booking_pages enable row level security;
alter table public.event_types enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_overrides enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;

create policy "users can view their profile" on public.users for select to authenticated using (id = auth.uid());
create policy "users can update their profile" on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "active booking pages are public" on public.booking_pages for select using (is_active = true or host_id = auth.uid());
create policy "hosts manage their booking page" on public.booking_pages for all to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "hosts manage their event types" on public.event_types for all to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "hosts manage availability rules" on public.availability_rules for all to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "hosts manage availability overrides" on public.availability_overrides for all to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "hosts manage calendar connections" on public.calendar_connections for all to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "hosts view their appointments" on public.appointments for select to authenticated using (host_id = auth.uid());
create policy "hosts view their notifications" on public.notifications for select to authenticated using (
  exists (select 1 from public.appointments where appointments.id = notifications.appointment_id and appointments.host_id = auth.uid())
);
