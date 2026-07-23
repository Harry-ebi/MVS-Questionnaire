-- =====================================================================
-- Bring the database column names in line with the Conversa app
-- (People/Performance/Process  ->  Connection/Drive/Clarity)
-- =====================================================================
--
-- WHY: the live `submissions` (and `guesses`) tables still use the ORIGINAL
-- column names from before the rebrand — people / performance / process /
-- category / shift_score / shift_band. The app now saves and reads
-- connection / drive / clarity / pattern / change_score / change_band, so
-- EVERY cloud save has been failing with a 400 "could not find the
-- 'clarity' column" error and nothing has been reaching the admin centre.
-- This renames the columns to match, relabels the couple of values that
-- changed name, and recomputes each historical row's `pattern` under the
-- current rules. No numbers are changed — a score just moves from (say)
-- `performance` to `drive`.
--
-- MAPPING (confirmed against the app + the README):
--   performance -> drive        people -> connection        process -> clarity
--
-- ⚠️  BACK UP FIRST. This edits live data and there is no undo except
--     restoring your own backup. In the Supabase dashboard: Table Editor ->
--     submissions -> Export as CSV (repeat for guesses). Or Database ->
--     Backups if your plan has it.
--
-- HOW TO RUN: Supabase -> SQL Editor -> New query -> paste ALL of this ->
-- Run. It is safe to run more than once (each rename is guarded, so a
-- second run simply skips anything already done).
-- ---------------------------------------------------------------------

-- 1. Rename the submissions columns (only if the old name is still present)
do $$
declare
  renames text[][] := array[
    ['people','connection'],
    ['performance','drive'],
    ['process','clarity'],
    ['category','pattern'],
    ['shift_score','change_score'],
    ['shift_band','change_band'],
    ['everyday_people','everyday_connection'],
    ['everyday_performance','everyday_drive'],
    ['everyday_process','everyday_clarity']
  ];
  r text[];
begin
  foreach r slice 1 in array renames loop
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='submissions' and column_name=r[1]
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='submissions' and column_name=r[2]
    ) then
      execute format('alter table submissions rename column %I to %I', r[1], r[2]);
    end if;
  end loop;
end $$;

-- 2. Rename the guesses columns too (table may not exist on every project)
do $$
declare
  renames text[][] := array[
    ['people','connection'],
    ['performance','drive'],
    ['process','clarity']
  ];
  r text[];
begin
  if to_regclass('public.guesses') is not null then
    foreach r slice 1 in array renames loop
      if exists (
        select 1 from information_schema.columns
        where table_schema='public' and table_name='guesses' and column_name=r[1]
      ) and not exists (
        select 1 from information_schema.columns
        where table_schema='public' and table_name='guesses' and column_name=r[2]
      ) then
        execute format('alter table guesses rename column %I to %I', r[1], r[2]);
      end if;
    end loop;
  end if;
end $$;

-- 3. Make sure everyday saves (which don't send record_type) keep working.
alter table submissions alter column record_type set default 'everyday';

-- 4. Relabel the one change_band value that was renamed (moderate -> noticeable)
update submissions set change_band = 'noticeable' where change_band = 'moderate';

-- 5. Relabel the pressure "largest change" dimension values
update submissions set largest_increase_dimension = case largest_increase_dimension
  when 'people' then 'connection'
  when 'performance' then 'drive'
  when 'process' then 'clarity'
  else largest_increase_dimension
end;
update submissions set largest_decrease_dimension = case largest_decrease_dimension
  when 'people' then 'connection'
  when 'performance' then 'drive'
  when 'process' then 'clarity'
  else largest_decrease_dimension
end;

-- 6. Recompute `pattern` for every historical row under the CURRENT rules
--    (mirrors js/scoring.js derivePattern(): 10 / 9 / 8 thresholds).
create or replace function mvs_derive_pattern(p_drive numeric, p_connection numeric, p_clarity numeric)
returns text
language plpgsql
as $$
declare
  top_dim text; top_pct numeric;
  mid_dim text; mid_pct numeric;
  low_dim text; low_pct numeric;
  gap_top_mid numeric;
  gap_mid_low numeric;
begin
  select dim, pct into top_dim, top_pct from (
    values ('drive', p_drive, 1), ('connection', p_connection, 2), ('clarity', p_clarity, 3)
  ) as t(dim, pct, idx) order by pct desc, idx asc limit 1;

  select dim, pct into mid_dim, mid_pct from (
    values ('drive', p_drive, 1), ('connection', p_connection, 2), ('clarity', p_clarity, 3)
  ) as t(dim, pct, idx) order by pct desc, idx asc offset 1 limit 1;

  select dim, pct into low_dim, low_pct from (
    values ('drive', p_drive, 1), ('connection', p_connection, 2), ('clarity', p_clarity, 3)
  ) as t(dim, pct, idx) order by pct desc, idx asc offset 2 limit 1;

  gap_top_mid := top_pct - mid_pct;
  gap_mid_low := mid_pct - low_pct;

  if gap_top_mid >= 10 then
    return 'focused_' || top_dim;
  end if;

  if gap_top_mid <= 9 and gap_mid_low >= 8 then
    return 'dual_' || (
      select string_agg(dim, '_' order by idx) from (
        values ('drive', 1), ('connection', 2), ('clarity', 3)
      ) as t(dim, idx) where dim = top_dim or dim = mid_dim
    );
  end if;

  return 'balanced';
end;
$$;

update submissions
set pattern = mvs_derive_pattern(drive, connection, clarity)
where drive is not null and connection is not null and clarity is not null;

-- 7. Nudge Supabase's API layer to pick up the new column names immediately.
notify pgrst, 'reload schema';

-- 8. CHECK — after running, this should list the new column names:
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'submissions'
  and column_name in ('drive','connection','clarity','pattern','change_score','change_band')
order by column_name;
