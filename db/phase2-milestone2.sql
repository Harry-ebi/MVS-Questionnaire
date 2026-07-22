-- ============================================================
-- Conversa Phase 2 — Milestone 2 (organisations) migration
-- ------------------------------------------------------------
-- Run this ONCE in Supabase → SQL Editor, after phase2-setup.sql.
-- Safe to re-run.
--
-- WHAT IT ADDS / CHANGES
--   Lets a signed-in person create a NEW organisation and add THEMSELVES
--   to it as its administrator. This needs two things beyond the base
--   setup:
--
--   1. is_org_owner(org): a SECURITY DEFINER helper that checks ownership
--      WITHOUT tripping over Row Level Security. (A plain sub-select can't
--      be used in the membership policy below, because the owner can't yet
--      "see" the brand-new org through the normal select policy until they
--      have a membership — the very thing we're trying to create.)
--
--   2. A membership INSERT policy scoped to "yourself, into an org you own".
--
--   It also widens the organisations SELECT policy so an owner can always
--   read their own organisation (not only once they have a membership).
--
--   Everything the organisation dashboard and the expanded admin area read
--   is already permitted by phase2-setup.sql (org admins see their own
--   org's data; platform admins see everything).
-- ============================================================

-- 1. Ownership helper (bypasses RLS safely) ------------------
create or replace function is_org_owner(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from organisations o where o.id = org and o.owner_id = auth.uid());
$$;

-- 2. Owners can always read their own organisation -----------
drop policy if exists org_select on organisations;
create policy org_select on organisations for select to authenticated
  using (is_org_member(id) or owner_id = auth.uid() or is_platform_admin());

-- 3. You may add YOURSELF to an org you OWN, as its admin -----
drop policy if exists mem_insert_self_owner on memberships;
create policy mem_insert_self_owner on memberships
  for insert to authenticated
  with check (user_id = auth.uid() and is_org_owner(organisation_id));
