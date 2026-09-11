create extension if not exists pgcrypto;

create table if not exists public.qr_registrations (
  id uuid primary key default gen_random_uuid(),
  qr_token text not null unique,
  first_name text not null,
  last_name text not null,
  job_title text not null,
  mda_sector text not null,
  registration_status text not null,
  organization text not null,
  scanned_at timestamptz,
  last_scanned_at timestamptz,
  scan_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
