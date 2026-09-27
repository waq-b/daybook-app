-- Daybook 0003: row level security. CLAUDE.md hard line 11: every table has
-- RLS on user_id = auth.uid() from day one.
--
-- Signed-in users can read, add and change their own rows. There is no DELETE
-- policy and no DELETE or TRUNCATE grant: nothing is hard-deleted through the
-- API (hard line 6). The signed-out role gets nothing.

do $$
declare t text;
begin
  foreach t in array array['sessions', 'practices', 'tasks', 'reps', 'misses', 'checkins',
                           'seeds', 'gratitude_entries', 'reminders', 'push_subscriptions']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);

    execute format(
      'create policy "read own rows" on public.%I for select to authenticated
         using ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "add own rows" on public.%I for insert to authenticated
         with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "change own rows" on public.%I for update to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;
