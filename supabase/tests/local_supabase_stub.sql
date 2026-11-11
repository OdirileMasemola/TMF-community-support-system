-- =============================================================================
-- LOCAL TEST DATABASE ONLY. Never run this against the live Supabase project.
--
-- A minimal stand-in for the Supabase-managed parts the migrations reference
-- (roles, auth.users, auth.uid(), storage, a Vault view) so the migrations and
-- email_domain_management_test.sql can run on a plain PostgreSQL 17 server.
-- See run_local_tests.sh.
-- =============================================================================
-- Roles are cluster-wide, so only create the missing ones.
do $$
declare
  r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role', 'supabase_auth_admin'] loop
    if not exists (select 1 from pg_roles where rolname = r) then
      execute format('create role %I nologin', r);
    end if;
  end loop;
end;
$$;
alter role service_role bypassrls;
create schema auth;
create table auth.users (
  instance_id uuid, id uuid primary key, aud text, role text, email text, encrypted_password text,
  email_confirmed_at timestamptz, raw_app_meta_data jsonb default '{}'::jsonb,
  raw_user_meta_data jsonb default '{}'::jsonb, created_at timestamptz default now(), updated_at timestamptz default now()
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
grant usage on schema auth, storage, public to anon, authenticated, service_role, supabase_auth_admin;
grant execute on function auth.uid() to anon, authenticated, service_role;
-- Vault stand-in (live has supabase_vault): name/decrypted_secret view.
create schema vault;
create table vault.secrets_store (name text primary key, secret text not null);
create view vault.decrypted_secrets as select name, secret as decrypted_secret from vault.secrets_store;
