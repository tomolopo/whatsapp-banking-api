create extension if not exists pgcrypto;

create table if not exists public.qr_registrations (
  id uuid primary key default gen_random_uuid(),
  qr_token text not null unique,
  phone_number text not null unique,
  attendee_id text,
  email text,
  first_name text not null,
  last_name text not null,
  job_title text not null,
  mda_sector text not null,
  confirmation_status text,
  registration_status text not null,
  organization text not null,
  checked_in boolean not null default false,
  check_in_time timestamptz,
  scanned_at timestamptz,
  last_scanned_at timestamptz,
  scan_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.qr_registrations add column if not exists attendee_id text;
alter table public.qr_registrations add column if not exists email text;
alter table public.qr_registrations add column if not exists confirmation_status text;
alter table public.qr_registrations add column if not exists checked_in boolean not null default false;
alter table public.qr_registrations add column if not exists check_in_time timestamptz;
alter table public.qr_registrations add column if not exists scanned_at timestamptz;
alter table public.qr_registrations add column if not exists last_scanned_at timestamptz;
alter table public.qr_registrations add column if not exists scan_count integer not null default 0;
alter table public.qr_registrations add column if not exists created_at timestamptz not null default now();
alter table public.qr_registrations add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_qr_registrations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_qr_registrations_updated_at on public.qr_registrations;

create trigger trg_qr_registrations_updated_at
before update on public.qr_registrations
for each row
execute function public.set_qr_registrations_updated_at();

create or replace function public.record_qr_registration_scan(p_qr_token text, p_scanned_at timestamptz default now())
returns public.qr_registrations
language plpgsql
as $$
declare
  updated_row public.qr_registrations;
begin
  update public.qr_registrations
  set scanned_at = coalesce(scanned_at, p_scanned_at),
      last_scanned_at = p_scanned_at,
      scan_count = scan_count + 1
  where qr_token = p_qr_token
  returning * into updated_row;

  return updated_row;
end;
$$;

create or replace function public.record_qr_registration_check_in(p_qr_token text, p_checked_in_at timestamptz default now())
returns public.qr_registrations
language plpgsql
as $$
declare
  updated_row public.qr_registrations;
begin
  update public.qr_registrations
  set checked_in = true,
      check_in_time = coalesce(check_in_time, p_checked_in_at)
  where qr_token = p_qr_token
  returning * into updated_row;

  return updated_row;
end;
$$;
