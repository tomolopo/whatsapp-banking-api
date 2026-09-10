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
