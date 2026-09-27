-- Daybook 0005: index user_id on the three tables that had no index leading
-- with it (Supabase performance advisor: unindexed foreign keys). RLS filters
-- every read on user_id.

create index tasks_user_created on public.tasks (user_id, created_at);
create index seeds_user_created on public.seeds (user_id, created_at);
create index reminders_user_created on public.reminders (user_id, created_at);
