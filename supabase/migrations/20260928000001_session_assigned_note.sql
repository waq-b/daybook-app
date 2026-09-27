-- Daybook 0b.1: the edit screen's "Anything else, not a practice yet" line
-- (plan 0b, D1). sessions.anything_else stays for Prepare's "Anything else to
-- raise?" (0d). RLS and grants already cover the whole row.

alter table public.sessions add column assigned_note text;
