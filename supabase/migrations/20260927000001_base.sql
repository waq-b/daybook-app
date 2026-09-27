-- Daybook 0001: enums and the updated_at trigger shared by every table.

create type public.practice_type as enum ('hierarchy', 'feelings', 'gratitude');
create type public.prediction_likelihood as enum ('not_very', 'fairly', 'very');
create type public.prediction_outcome as enum ('no', 'a_bit', 'yes');
create type public.next_go as enum ('tomorrow', 'a_day', 'leave');

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
