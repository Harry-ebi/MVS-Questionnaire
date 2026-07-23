-- =====================================================================
-- Fix: anonymous (not-signed-in) result saves aren't reaching the database
-- =====================================================================
--
-- Symptom: someone completes a communication profile WITHOUT an account and
-- hits save, but their result never appears in the admin centre.
--
-- Cause: for an anonymous save to succeed, the anonymous ("anon") database
-- role needs BOTH (a) a Row Level Security policy that permits the insert,
-- and (b) the plain table-level INSERT privilege. The Phase 2 security
-- tightening can leave one of these missing, so the insert is silently
-- rejected and the result is lost.
--
-- This script restores both, for the submissions table AND the guesses
-- table (the perception-check tool saves anonymously the same way). It is
-- safe to run more than once.
--
-- HOW TO RUN: Supabase dashboard -> SQL Editor -> New query -> paste all of
-- this -> Run. It doesn't touch or delete any existing rows.
-- ---------------------------------------------------------------------

-- 1. SUBMISSIONS -------------------------------------------------------
alter table submissions enable row level security;

-- (a) RLS policy: anyone (anon) may insert a result row.
drop policy if exists "Anyone can submit a result" on submissions;
create policy "Anyone can submit a result"
  on submissions for insert to anon
  with check (true);

-- Signed-in inserts stay restricted to the person's own row (unchanged;
-- re-created here so this file is self-contained and safe to re-run).
drop policy if exists submissions_insert_auth on submissions;
create policy submissions_insert_auth
  on submissions for insert to authenticated
  with check (user_id = auth.uid());

-- (b) Table privilege: the anon and authenticated roles must actually hold
--     INSERT on the table, or the policy above never even gets evaluated.
grant insert on table submissions to anon, authenticated;

-- 2. GUESSES (perception check saves anonymously too) ------------------
--    Wrapped so the script still succeeds if the table isn't present.
do $$
begin
  if to_regclass('public.guesses') is not null then
    execute 'alter table guesses enable row level security';
    execute 'drop policy if exists "Anyone can submit a guess" on guesses';
    execute 'create policy "Anyone can submit a guess" on guesses for insert to anon with check (true)';
    execute 'grant insert on table guesses to anon, authenticated';
  end if;
end $$;

-- 3. CHECK -------------------------------------------------------------
-- After running, this should list the anon INSERT policies you just set:
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('submissions', 'guesses')
  and cmd = 'INSERT'
order by tablename, policyname;
