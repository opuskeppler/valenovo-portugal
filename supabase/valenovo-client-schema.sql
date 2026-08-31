-- Valenovo Client Area: private client data and documents.
-- Apply through the Supabase SQL Editor. Public browser clients only receive
-- the publishable key; Row Level Security enforces each client's boundary.

create table if not exists public.client_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_name text not null,
  contact_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles (id) on delete cascade,
  title text not null,
  description text,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

alter table public.client_profiles enable row level security;
alter table public.client_documents enable row level security;

create policy "Clients can read their own profile"
  on public.client_profiles for select to authenticated
  using (id = auth.uid());

create policy "Clients can read their own documents"
  on public.client_documents for select to authenticated
  using (client_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false)
on conflict (id) do nothing;

create policy "Clients can read their own stored documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'client-documents'
    and exists (
      select 1
      from public.client_documents document
      where document.storage_path = name
        and document.client_id = auth.uid()
    )
  );
