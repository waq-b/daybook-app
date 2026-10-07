-- Daybook 0002: the data model.
--
-- Every table: id, user_id (defaults to the signed-in user), created_at,
-- updated_at, archived_at. Nothing is deleted in normal use; rows are
-- archived. The only hard delete is delete_everything() (0004), which removes
-- the auth user and lets user_id's ON DELETE CASCADE take every row with it.
--
-- Parent links are composite (parent_id, user_id) foreign keys onto a
-- (id, user_id) unique key, so a row can only ever point at a parent owned by
-- the same user. The database enforces that, not just the policies.
--
-- Days of the week are ISO: 1 = Monday … 7 = Sunday. Difficulty and
-- intensity are the worksheet's 0–8 scale.

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  at timestamptz not null,
  notes text,
  anything_else text,
  done_at timestamptz,
  unique (id, user_id)
);

create table public.practices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  type public.practice_type not null,
  name text not null,
  session_id uuid,
  settings jsonb not null default '{}'::jsonb,
  unique (id, user_id),
  foreign key (session_id, user_id) references public.sessions (id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  practice_id uuid not null,
  name text not null,
  predicted int not null check (predicted between 0 and 8),
  repeating boolean not null default false,
  reps_per_week int check (reps_per_week between 1 and 7),
  target_date date,
  notes text,
  completed_at timestamptz,
  comments text,
  unique (id, user_id),
  foreign key (practice_id, user_id) references public.practices (id, user_id)
);

create table public.reps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  task_id uuid not null,
  at timestamptz not null default now(),
  -- Nullable: a "started, left early" attempt may not carry scores. 0c decides.
  actual int check (actual between 0 and 8),
  remaining int check (remaining between 0 and 8),
  left_early boolean not null default false,
  coping text[] not null default '{}',
  note text,
  prediction text,
  prediction_likelihood public.prediction_likelihood,
  prediction_outcome public.prediction_outcome,
  flagged boolean not null default false,
  foreign key (task_id, user_id) references public.tasks (id, user_id)
);

create table public.misses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  task_id uuid not null,
  planned_on date not null,
  reasons text[] not null default '{}',
  next_go public.next_go,
  note text,
  flagged boolean not null default false,
  foreign key (task_id, user_id) references public.tasks (id, user_id)
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  practice_id uuid not null,
  at timestamptz not null default now(),
  words text[] not null default '{}',
  intensity int check (intensity between 0 and 8),
  writing text,
  closing text,
  flagged boolean not null default false,
  foreign key (practice_id, user_id) references public.practices (id, user_id)
);

create table public.seeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  practice_id uuid not null,
  text text not null,
  unique (id, user_id),
  foreign key (practice_id, user_id) references public.practices (id, user_id)
);

create table public.gratitude_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  practice_id uuid not null,
  at timestamptz not null default now(),
  seed_id uuid,
  because text not null,
  flagged boolean not null default false,
  foreign key (practice_id, user_id) references public.practices (id, user_id),
  foreign key (seed_id, user_id) references public.seeds (id, user_id)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  practice_id uuid not null,
  enabled boolean not null default true,
  times time[] not null default '{}',
  days int[] not null default '{1,2,3,4,5,6,7}' check (days <@ '{1,2,3,4,5,6,7}'::int[]),
  paused_until date,
  foreign key (practice_id, user_id) references public.practices (id, user_id)
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  endpoint text not null,
  keys jsonb not null,
  unique (user_id, endpoint)
);

-- Indexes: every table is read by user, newest first; every parent link is indexed.
create index sessions_user_at on public.sessions (user_id, at desc);
create index practices_user_created on public.practices (user_id, created_at);
create index practices_session on public.practices (session_id, user_id);
create index tasks_practice on public.tasks (practice_id, user_id);
create index reps_task_at on public.reps (task_id, user_id, at desc);
create index reps_user_at on public.reps (user_id, at desc);
create index misses_task on public.misses (task_id, user_id);
create index misses_user_created on public.misses (user_id, created_at desc);
create index checkins_practice on public.checkins (practice_id, user_id);
create index checkins_user_at on public.checkins (user_id, at desc);
create index seeds_practice on public.seeds (practice_id, user_id);
create index gratitude_practice on public.gratitude_entries (practice_id, user_id);
create index gratitude_seed on public.gratitude_entries (seed_id, user_id);
create index gratitude_user_at on public.gratitude_entries (user_id, at desc);
create index reminders_practice on public.reminders (practice_id, user_id);

-- updated_at on every write.
do $$
declare t text;
begin
  foreach t in array array['sessions', 'practices', 'tasks', 'reps', 'misses', 'checkins',
                           'seeds', 'gratitude_entries', 'reminders', 'push_subscriptions']
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;
