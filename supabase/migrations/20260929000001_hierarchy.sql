-- Daybook 0c.1: the activity hierarchy.
--
-- Every rep has both scores, attempts included (D3): "started, left early"
-- still rates how hard it was and how hard it would be now. No reps exist
-- yet, so this can't fail on old rows.
alter table public.reps
  alter column actual set not null,
  alter column remaining set not null;

-- "Before the next one" (D15, only with the prediction check on): written
-- before a rep exists, kept on the task until the next rep copies it.
alter table public.tasks
  add column next_prediction text,
  add column next_prediction_likelihood public.prediction_likelihood;

-- Reps per week only means something for a repeating task.
alter table public.tasks
  add constraint tasks_reps_per_week_only_when_repeating
  check (repeating or reps_per_week is null);
