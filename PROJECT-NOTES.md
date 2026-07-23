# Conversa — Project Notes & Handoff

Live site: https://harry-ebi.github.io/MVS-Questionnaire/ (served from `main`, GitHub Pages)
Repo: `harry-ebi/MVS-Questionnaire` (default branch `main`)

**Conversa** is an original self-reflection tool positioned as a **workplace communication** aid
(*"Better workplace communication."*). It helps people understand how their working priorities
lean across three dimensions — **Drive**, **Connection**, **Clarity** — through an "Everyday" and
an "Under Pressure" lens. Static HTML/CSS/JS, no build step, hand-written Supabase `fetch()`
client. Built for a **non-technical owner** (Harry, harry.hitchcock@ebi.co.uk), so changes are
made directly in plain files, no framework/tooling layer.

> **Naming note:** previously branded **ebi** and called **"Ways of Working" / MVS**, then
> de-branded and rebranded to **Conversa**. The Drive/Connection/Clarity model, questions,
> scoring and reports are unchanged — only branding/labels moved. Internal code keys are
> `drive`/`connection`/`clarity`.

---

## ⚠️ READ FIRST — operational state a new session must know (as of 2026-07-23)

**The database schema NOW matches the code.** For a long time it silently didn't, and every
cloud save was failing. This was found and fixed this session:

- The live Supabase `submissions` (and `guesses`) tables originally used the pre-rebrand column
  names `people` / `performance` / `process` / `category` / `shift_score` / `shift_band` /
  `everyday_*`. The app saves/reads `connection` / `drive` / `clarity` / `pattern` /
  `change_score` / `change_band`. **Mapping: performance→drive, people→connection,
  process→clarity.**
- The rename migration (`db/migrate-columns-to-conversa.sql`) **has been run** in Supabase.
  Columns are now renamed, values relabelled (`moderate`→`noticeable`; largest-change dims
  remapped), and every historical row's `pattern` recomputed. **Do not run it again** unless the
  DB is reset — it's guarded/idempotent but there's no reason to.
- Also run this session: `db/fix-anon-submissions.sql` (anon INSERT policy + `grant insert` on
  submissions/guesses). Anonymous saves confirmed working (HTTP 201 test).

**Supabase Auth email confirmation is ON and configured:**
- `js/auth.js` `register()` passes `emailRedirectTo` = the live `confirm.html` page (derived from
  `window.location`), via `SupabaseClient.signUp(..., redirectTo)`.
- Dashboard → Authentication → URL Configuration: **Site URL** = `https://harry-ebi.github.io/MVS-Questionnaire/`,
  and **Redirect URLs** allow-list includes `https://harry-ebi.github.io/MVS-Questionnaire/**`.
- Confirmation links land on **`confirm.html`**, which calls `Auth.completeSessionFromHash()` to
  adopt the session from the URL hash and shows an "Email confirmed — you're signed in" screen.
- Signup → confirm → signed-in flow was tested end-to-end and works.
- **Caveat:** Supabase's *built-in* email is rate-limited (~a few/hour). For real signup volume,
  add custom SMTP (Authentication → Emails/SMTP). Not yet done.

**Admin model (important):**
- Two separate concepts. (1) **Organisation admin** — the `handle_new_user` trigger gives every
  new user a personal organisation and makes them `org_admin` of it. So *everyone* is "admin" of
  their own private workspace-of-one (harmless; the Organisation dashboard link is hidden for
  personal orgs). (2) **Platform/system admin** — the `profiles.is_platform_admin` boolean
  (defaults `false`, never set automatically), which unlocks `admin.html` (all users/orgs/data).
- A domain-wide setup query had accidentally flagged **all `@ebi`/`@ebip` accounts** as platform
  admins. Fixed this session:
  `update profiles set is_platform_admin = false where email <> 'harry.hitchcock@ebi.co.uk';`
  **Only `harry.hitchcock@ebi.co.uk` is a platform admin now.** New signups default to non-admin,
  and nothing flips the flag automatically, so this won't recur.

**Sandbox limitation:** this environment **cannot reach Supabase** (outbound to `*.supabase.co`
is blocked; browser tests hit `ERR_TUNNEL`). To verify anything DB-related, run a `fetch` in the
DevTools console **on the live site**, or drive Claude-in-Chrome **if the extension is connected**
(it often isn't). Give the owner copy-paste console snippets / SQL rather than trying to hit the
DB from here.

---

## Session log — 2026-07-23 (all live on `main`)

Commits (newest first), all pushed to `main` / live on GitHub Pages:

- `7d7cf42` — **db: guarded column-rename migration** file (`db/migrate-columns-to-conversa.sql`).
  The real fix for saves never landing (schema/code column-name mismatch). Owner ran it in
  Supabase.
- `c788de2` — **Auth: email-confirmation links → live landing page.** `signUp` passes
  `redirect_to`; new `confirm.html` + `Auth.completeSessionFromHash()`; copy under
  `CONTENT.auth.confirm`. Also added `db/fix-anon-submissions.sql`.
- `33b9453` — **Team Insights = your organisation, not a team code.** `team.js` rewritten:
  org-member auto-load (memberships + profiles + everyday submissions for the active org) for
  **org admins**; status banner (members shown + count not-yet-completed); graceful signed-out /
  personal-workspace / non-admin / error states. File-upload kept as a **fallback** for ad-hoc /
  outside-org people. Team-code path removed. Copy reworked in `CONTENT.team` (org* keys).
- `c23c943` — **Pressure report made shift-aware** (`pressure.js`). Replaced "lead on whichever
  priority still dominates" with `classifyShift()` → one of **steady / flip / edge / intensify**.
  Fixes the case where a still-dominant priority (e.g. Clarity) hid the real movement (a rising
  Drive "edge"): now leads the body on the *emerging* dimension while naming the unchanged leader
  as the anchor. New `pressureResults.summaryFor` + `headline.edge`; `EDGE_RISE_MIN = 5`. No
  scoring/`computeChange`/triangle changes.
- `83a076a` — **Guide variety pass** (`commsGuidance.js`). Expanded SHARED/GAP/BLEND_INTRO/BALANCED
  pools (6→10) and retuned meeting-pool reader windowing (`rank*2 + salt*5`) so cross-pairing
  sentence reuse across the 49-card matrix drops to max 3× (was 5×), 0 identical cards, fully
  deterministic.
- (earlier this session) `f3f2296`, `1301db1` — Guide copy rewritten as hand-written executive-coach
  guidance (deterministic, no randomness); homepage guided-journey redesign; nav "Profile"
  dropdown; etc.

**Phase 2 (accounts/auth/orgs/roles/RLS) is LIVE** (milestones from prior sessions —
`9aaae88`, `dfdabc6`, `d9f345b`, `f13b9e4`): Supabase Auth (email+password), `profiles`,
`organisations`, `memberships`, `audit_log`; personal org auto-provisioned per user;
role-based nav; org dashboard (`organisation.html`); expanded system-admin dashboard
(`admin.html`); RLS enforced in DB. SQL lives in `db/phase2-setup.sql` + `db/phase2-milestone2.sql`
(both already run in Supabase).

---

## User-facing label map (Conversa copy → internal name)

- Solo reflection → **Communication profile**; Team overlay → **Team insights**;
  Blind-spot → **Perception check** (`guess.html`); Guide → **"Communicating across different
  priorities"** (`guide.html`); Everyday Priorities → **Everyday Communication**; Priorities
  Under Pressure → **Communication Under Pressure** (`pressure.js`).
- Banned framing (personality/psychometric/assessment/test) is swept from user-facing copy;
  disclaimers say "clinical or diagnostic" and keep the not-for-hiring/HR/performance protection.

## Architecture at a glance

- `index.html` — home page; `reflection.html` — main app shell (`<main id="app">`, JS-rendered);
  `admin.html`, `guide.html`, `team.html`, `guess.html`, `account.html`, `organisation.html`,
  `login.html`, `register.html`, `reset-password.html`, **`confirm.html`** — pages.
- `js/content.js` — **all copy lives here**; nothing else hardcodes strings.
- `js/scoring.js` — scoring, pattern classification, `computeChange()`. DOM-free, `require()`-able.
- `js/chart.js` — all SVG chart rendering.
- `js/pressure.js` — Under-Pressure flow + `renderResults()` (+ `classifyShift()`).
- `js/commsGuidance.js` — deterministic guide-card generation (hand-written coaching pools).
- `js/guess.js` — Perception check. `js/admin.js` — admin/platform dashboard.
- `js/auth.js` — session (localStorage `conversa_session_v1`/`conversa_active_org_v1`), refresh,
  page guards, `loadContext()` (profile/orgs/role), `register()`/`signIn()`,
  `completeSessionFromHash()`, `identityForSave()`.
- `js/supabaseClient.js` — fetch wrapper (`SUPABASE_URL`, publishable key, `select`/`insert`/`rpc`/
  `signUp`/`signIn`/`getUser`/`refresh`). Fail-soft.
- `js/nav.js` — unified header; reveals Organisation link (org admin of non-personal org) and
  Admin item (platform admin) after `loadContext()`.
- `js/account.js`, `js/organisation.js`, `js/aggregate.js`, `js/app.js`, `css/styles.css`.

Key constants (`scoring.js`): `DIMENSIONS = ["drive","connection","clarity"]`,
`FOCUSED_GAP_THRESHOLD=10`, `DUAL_TIGHTNESS_THRESHOLD=9`, `DUAL_LOW_GAP_THRESHOLD=8`,
`CHANGE_UNCHANGED_THRESHOLD=5`, `CHANGE_TIE_TOLERANCE=4`. Chart series triad is functional
(Drive=amber, Connection=purple, Clarity=teal-green), not branding.

## DB / SQL files (in `db/`)

- `phase2-setup.sql` — accounts/orgs/memberships/audit, helper fns (`is_platform_admin`,
  `is_org_member`, `is_org_admin`), `handle_new_user` trigger, RLS policies. **Run.**
- `phase2-milestone2.sql` — `is_org_owner()` + widened org select/insert policies. **Run.**
- `fix-anon-submissions.sql` — anon INSERT policy + table grant on submissions/guesses. **Run.**
- `migrate-columns-to-conversa.sql` — the People/Performance/Process → Connection/Drive/Clarity
  column rename + value relabel + pattern recompute. **Run.** (Don't re-run without reason.)
- The RLS submissions read policy: a row is readable by its owner (`user_id = auth.uid()`), the
  org admin of its `organisation_id`, or a platform admin. This is why **Team Insights auto-load
  is org-admin-only** — standard members can't read other members' rows. (Future option: a
  SECURITY DEFINER aggregate so members can see team-level insights without row access.)

## Working in the sandbox (gotchas)

- **Ephemeral sandbox** — discarded at session end. `git clone` fresh; `main` is the only durable
  copy. Cannot reach Supabase (see READ FIRST).
- **Git commits:** set `git config user.email noreply@anthropic.com && git config user.name Claude`
  before committing, or the stop-hook flags "Unverified". End commit messages with the
  Co-Authored-By / Claude-Session trailers.
- **Pushing:** the environment `GH_TOKEN` is **invalid for write**. Harry supplies a fine-grained
  PAT; push via `https://x-access-token:<PAT>@github.com/Harry-ebi/MVS-Questionnaire.git`, redact
  the token from any printed output (`sed`), then `git remote set-url origin <clean https>`.
  Never write the PAT into a file or this doc.
- Local serving: `python3 -m http.server 8934` (start backgrounded on its own; ~2s before curl;
  chained one-liners spuriously exit 144 — run steps separately).
- Playwright: Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`,
  `NODE_PATH=/opt/node-tools/node_modules`. Stub Supabase via `page.route`, inject a fake
  `conversa_session_v1` into localStorage via `addInitScript` to simulate signed-in.
- `scoring.js` and `content.js` are `require()`-able in Node for pure-logic tests. No `jsdom`.

## Open / pending items (nothing blocking; all core flows work)

1. **Custom SMTP** for signup emails — built-in Supabase email is rate-limited (~few/hour); needed
   before any real signup volume.
2. **Team Insights for standard members** (optional) — currently org-admin-only by RLS. Would need
   a SECURITY DEFINER function returning org-level aggregates so non-admin members can view their
   team without reading individual rows.
3. **Delete the `__anon test__` diagnostic row** from the admin centre if not already done (a test
   insert used to confirm anonymous saves work).
4. Optional: delete the stale `standalone-debrand` remote branch if it still exists.
5. If more copy work: keep all strings in `content.js`; smoke-test all pages light/dark for JS
   errors before pushing.
