-- Just enough of Supabase for the migrations to run on plain Postgres in CI:
-- the API roles, auth.users, and auth.uid() reading the request's JWT claims
-- exactly as Supabase's does. Also Supabase's permissive default grants, so
-- the tests prove the migrations tighten them.

-- Roles are shared by every database on the server and test files run in
-- parallel, so two of them can race to create the same role. Creating it and
-- ignoring "already exists" is safe where check-then-create is not.
do $$
begin
  begin create role anon nologin; exception when duplicate_object or unique_violation then null; end;
  begin create role authenticated nologin; exception when duplicate_object or unique_violation then null; end;
  begin create role service_role nologin bypassrls; exception when duplicate_object or unique_violation then null; end;
end;
$$;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key,
  email text
);

create function auth.uid() returns uuid
language sql stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    ),
    ''
  )::uuid
$$;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
