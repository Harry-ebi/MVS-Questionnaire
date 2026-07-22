-- ============================================================
-- Conversa Phase 2 — accounts & organisations foundation
-- ------------------------------------------------------------
-- WHAT THIS DOES
--   Adds the account / organisation / membership tables, the security
--   (Row Level Security) rules, and a sign-up trigger that gives every
--   new user a profile + a personal organisation automatically.
--   It also adds two optional columns to your existing `submissions`
--   table so a signed-in person's results link to their account, and
--   TIGHTENS who can read `submissions` (see step 8).
--
-- HOW TO RUN
--   1. In Supabase, back up first: Table Editor -> submissions -> Export
--      as CSV (repeat for guesses).
--   2. Open the SQL Editor, paste this whole file, click Run.
--   3. It is SAFE TO RE-RUN — every statement is guarded, so running it
--      twice does nothing harmful (you'll just see "already exists" notes).
--   4. Do step 9 at the bottom AFTER you've signed in once with your own
--      new account (so your profile row exists to flag as platform admin).
--
-- This only ADDS things. Your existing anonymous + team-code flows keep
-- working exactly as before.
-- ============================================================

-- 1. PROFILES ------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text,
  email text,
  company text,
  job_title text,
  country text,
  avatar_url text,
  account_status text not null default 'active',
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table profiles enable row level security;

-- 2. ORGANISATIONS -------------------------------------------
create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  status text not null default 'active',
  owner_id uuid references profiles(id),
  is_personal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table organisations enable row level security;

-- 3. MEMBERSHIPS (user + org + role) -------------------------
create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  organisation_id uuid not null references organisations(id) on delete cascade,
  role text not null default 'member' check (role in ('org_admin','member')),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (user_id, organisation_id)
);
alter table memberships enable row level security;

-- 4. AUDIT LOG (minimal) -------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table audit_log enable row level security;

-- 5. EXTEND SUBMISSIONS (keep everything; add ownership) -----
alter table submissions add column if not exists user_id uuid references profiles(id);
alter table submissions add column if not exists organisation_id uuid references organisations(id);

-- 6. HELPER FUNCTIONS (SECURITY DEFINER -> no RLS recursion) --
create or replace function is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.is_platform_admin);
$$;

create or replace function is_org_member(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m where m.user_id = auth.uid() and m.organisation_id = org);
$$;

create or replace function is_org_admin(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.user_id = auth.uid() and m.organisation_id = org and m.role = 'org_admin'
  ) or is_platform_admin();
$$;

-- 7. AUTO-PROVISION ON SIGN-UP -------------------------------
-- When Supabase Auth creates a user, make their profile, a personal
-- organisation, and an org-admin membership — all in one go.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_org uuid;
  full_name text;
begin
  full_name := trim(coalesce(new.raw_user_meta_data->>'first_name','') || ' ' ||
                    coalesce(new.raw_user_meta_data->>'last_name',''));
  if full_name = '' then full_name := split_part(new.email, '@', 1); end if;

  insert into profiles (id, email, first_name, last_name, display_name)
  values (new.id, new.email,
          new.raw_user_meta_data->>'first_name',
          new.raw_user_meta_data->>'last_name',
          full_name)
  on conflict (id) do nothing;

  insert into organisations (name, owner_id, is_personal)
  values (full_name || ' (Personal)', new.id, true)
  returning id into new_org;

  insert into memberships (user_id, organisation_id, role)
  values (new.id, new_org, 'org_admin');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 8. POLICIES ------------------------------------------------
-- profiles
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated
  using (
    id = auth.uid()
    or is_platform_admin()
    or exists (
      select 1 from memberships me
      join memberships them on them.organisation_id = me.organisation_id
      where me.user_id = auth.uid() and me.role = 'org_admin' and them.user_id = profiles.id
    )
  );
drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles for update to authenticated
  using (id = auth.uid() or is_platform_admin())
  with check (id = auth.uid() or is_platform_admin());

-- organisations
drop policy if exists org_select on organisations;
create policy org_select on organisations for select to authenticated
  using (is_org_member(id) or is_platform_admin());
drop policy if exists org_insert on organisations;
create policy org_insert on organisations for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists org_update on organisations;
create policy org_update on organisations for update to authenticated
  using (is_org_admin(id)) with check (is_org_admin(id));

-- memberships
drop policy if exists mem_select on memberships;
create policy mem_select on memberships for select to authenticated
  using (user_id = auth.uid() or is_org_admin(organisation_id));
drop policy if exists mem_write on memberships;
create policy mem_write on memberships for all to authenticated
  using (is_org_admin(organisation_id)) with check (is_org_admin(organisation_id));

-- submissions  (TIGHTENED read; anon insert preserved)
drop policy if exists "Anyone can submit a result" on submissions;
create policy "Anyone can submit a result" on submissions for insert to anon with check (true);
drop policy if exists submissions_insert_auth on submissions;
create policy submissions_insert_auth on submissions for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "Only signed-in admins can read results" on submissions;
drop policy if exists submissions_select on submissions;
create policy submissions_select on submissions for select to authenticated
  using (user_id = auth.uid() or is_platform_admin() or (organisation_id is not null and is_org_admin(organisation_id)));
drop policy if exists "Only signed-in admins can delete results" on submissions;
drop policy if exists submissions_delete on submissions;
create policy submissions_delete on submissions for delete to authenticated
  using (user_id = auth.uid() or is_platform_admin() or (organisation_id is not null and is_org_admin(organisation_id)));

-- audit_log
drop policy if exists audit_select on audit_log;
create policy audit_select on audit_log for select to authenticated using (is_platform_admin());

-- 9. MAKE YOURSELF THE SYSTEM ADMINISTRATOR ------------------
-- IMPORTANT: run this ONE line AFTER you have registered + signed in once
-- with your own account (so your profile row exists). Without it, admin.html
-- will only show your OWN results, not everyone's, because step 8 tightened
-- reads. Uncomment and run:
--
-- update profiles set is_platform_admin = true where email = 'harry.hitchcock@ebi.co.uk';
