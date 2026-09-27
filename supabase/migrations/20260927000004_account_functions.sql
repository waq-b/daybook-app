-- Daybook 0004: Settings → Export everything, and Delete everything.
-- Both run as the signed-in user over RPC, so no service key is needed
-- anywhere (plan D9).

-- Every row the user owns, archived ones included, as one JSON document.
-- security invoker: RLS decides what it can see.
create function public.export_everything() returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'app', 'Daybook',
    'schema_version', 1,
    'exported_at', now(),
    'user_id', auth.uid(),
    'sessions', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.sessions r), '[]'),
    'practices', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.practices r), '[]'),
    'tasks', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.tasks r), '[]'),
    'reps', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.reps r), '[]'),
    'misses', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.misses r), '[]'),
    'checkins', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.checkins r), '[]'),
    'seeds', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.seeds r), '[]'),
    'gratitude_entries', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.gratitude_entries r), '[]'),
    'reminders', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.reminders r), '[]'),
    'push_subscriptions', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.push_subscriptions r), '[]')
  );
$$;

-- The one hard delete in Daybook (hard line 6). Step 2 of the Settings flow
-- passes the word the user typed; anything but 'delete' is refused. Deleting
-- the auth user cascades through every table's user_id.
-- security definer so it can reach auth.users; it only ever touches the
-- caller's own id.
create function public.delete_everything(confirm text) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if confirm is distinct from 'delete' then
    raise exception 'Type delete to confirm' using errcode = '22023';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.export_everything() from public, anon;
revoke all on function public.delete_everything(text) from public, anon;
grant execute on function public.export_everything() to authenticated;
grant execute on function public.delete_everything(text) to authenticated;
