# Ways of Working — a workplace priorities reflection tool

A small web app for ebi: a ~30-question forced-choice reflection tool that
gives people a sense of whether their working priorities lean toward
**Drive**, **Connection** or **Clarity**, inspired by the general idea of
workplace priorities and how they show up day to day (it is *not* a copy of
any commercial assessment — see "IP notes" below). It also includes three
things built on the same scoring: a **guidance tool** for working with
people whose priorities differ from your own, a **team overlay**, and a
**blind-spot (perception) exercise** — plus an optional **Priorities Under
Pressure** add-on.

This is an educational self-reflection aid, not a validated psychometric or
clinical instrument, and it isn't intended for hiring, promotion,
performance or disciplinary decisions. See "IP notes" and the in-app
disclaimers for more on scope and intended use.

## Architecture: a static site with a small managed database behind it

The site itself is still **plain HTML, CSS and JavaScript, with no build
step, no framework, and nothing to install** — every page can still be
opened straight from a folder, or served by any plain static host (this
is deployed on GitHub Pages). What's changed is *where results end up*:
this now also uses [Supabase](https://supabase.com) — a hosted Postgres
database with a ready-made REST API and login system — as a small,
managed backend, reached from the browser with plain `fetch()` calls (see
`js/supabaseClient.js`). There's still no server of ours to run, patch or
pay for beyond Supabase's own free tier; the "backend" is a database plus
some security rules, not a custom application server.

**How a result gets saved.** The moment someone reaches their results
screen, two things happen automatically, with no button click needed:
a small `.json` file (e.g. `result-alice.json`) downloads to their device
(a personal backup, and a fallback for anyone who wants to share results
the old way), **and** their name, result and (if they entered one) team
code are saved straight to the `submissions` table in the database. A
**"Save again"** button stays on the results page for re-saving the file
under a different name, or in case a browser blocked the automatic
download. The database save is "best effort": if it fails (no internet,
Supabase briefly down), the page says so plainly and the downloaded file
still has everything needed to share the old, file-based way — nothing
about this tool depends on the database being reachable to work.

**Team codes.** Solo reflection, the team overlay and the blind-spot
exercise all accept an optional **team code** — any short string a
facilitator agrees with their group beforehand (e.g. `ATLAS7`). Entering
the same code on the solo reflection and then on the team overlay/reveal
step is what lets several people's results find each other automatically,
without anyone collecting or emailing files, and without different teams
seeing each other's data. That last part is enforced by the *database
itself*, not just by this site's JavaScript: reads are only possible
through two narrow Postgres functions that return rows matching an exact
code (see "Database setup" below) — knowing the code is a real requirement
to read that data back, not a UI convenience that can be bypassed by
calling the API directly.

**File-based loading still works everywhere it used to.** Nobody has to
use a team code — the original file-download-and-load flow (save a
`result-*.json`/`guesses-*.json` file, hand it over, load it on the team
overlay/blind-spot/admin page) is still there on every page as a
"or load from files instead" fallback, unchanged. This matters for anyone
who'd rather not put identified results in a shared database at all, or
for loading older files saved before the database existed.

**Admin sign-in is a real login.** `admin.html` used to be gated by a
passphrase checked in this site's own JavaScript — a soft deterrent, not
real security (anyone could view-source and read it). It's now gated by
Supabase's own Auth service, checked against an admin account created in
the Supabase dashboard, and once signed in it loads every submission
across every team code straight from the database. It also carries a
clear **internal-use notice** (see "Admin: all submissions" below) making
plain this is an educational tool, not a basis for formal decisions about
anyone. See "Database setup" below for how to set the sign-in up.

## Running it

There's no server process to start. Two ways to use it:

**Simplest — open the files directly.** Open `index.html` in a browser
(double-click it, or File → Open). Everything works from `file://` links.

**If you want a normal web address** (for example to host this on a
company intranet or a simple static file host — Netlify, GitHub Pages, a
shared network drive with web serving turned on, etc.), just upload the
whole folder as-is. There is no build step and nothing to configure.

For local testing during development, any static file server works, e.g.:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

Pages:
- `index.html` — hub/home page linking to all the flows below, with a
  short "what this is / what it's for / what it isn't" explainer above the
  links. Named `index.html` (rather than `home.html`) so it's the page
  that loads automatically at the site's root address on any static host,
  including GitHub Pages.
- `reflection.html` — the solo reflection, with the optional Priorities
  Under Pressure add-on offered at the end.
- `guide.html` — the guidance tool ("Working with different priorities").
- `team.html` — enter a team code to load that team's results automatically,
  or load result files by hand, and see the team overlay.
- `guess.html` — the blind-spot (perception) exercise: guessing, then reveal
  (by team code, or by hand).
- `admin.html` — sign in with a real Supabase account to see every
  submission across every team, with CSV and PDF export. Linked from a
  small badge in the top-right corner of the home page's hero band, not
  one of the main tiles. See "Admin: all submissions" below for how it
  works, and "Database setup" for how the sign-in is configured.

## Database setup

This tool uses [Supabase](https://supabase.com)'s free tier as its
database. You only need to do this once:

1. **Create a free Supabase account and project** at supabase.com (signing
   in with GitHub is the quickest option). Creating a project asks for a
   name, a database password (store it somewhere safe — it's rarely
   needed day-to-day) and a region.
2. **Run the setup SQL** — open the project's SQL Editor and paste in the
   script below, then click Run. It's written to be safe to run more than
   once (it won't error or duplicate anything if some of it already
   exists):

   ```sql
   -- 1. Submissions table (solo reflection results)
   create table if not exists submissions (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     drive numeric not null,
     connection numeric not null,
     clarity numeric not null,
     pattern text not null,
     created_at timestamptz default now()
   );

   alter table submissions add column if not exists team_code text;

   -- Priorities Under Pressure columns. A completed Priorities Under
   -- Pressure result is saved as a second, self-contained row
   -- (record_type = 'pressure') rather than updating the original
   -- Everyday Priorities row -- see README's "Data storage" section
   -- below for why.
   alter table submissions add column if not exists record_type text not null default 'everyday';
   alter table submissions add column if not exists everyday_drive numeric;
   alter table submissions add column if not exists everyday_connection numeric;
   alter table submissions add column if not exists everyday_clarity numeric;
   alter table submissions add column if not exists change_score numeric;
   alter table submissions add column if not exists change_band text;
   alter table submissions add column if not exists largest_increase_dimension text;
   alter table submissions add column if not exists largest_decrease_dimension text;

   alter table submissions enable row level security;

   drop policy if exists "Anyone can submit a result" on submissions;
   create policy "Anyone can submit a result"
     on submissions for insert
     to anon
     with check (true);

   drop policy if exists "Only signed-in admins can read results" on submissions;
   create policy "Only signed-in admins can read results"
     on submissions for select
     to authenticated
     using (true);

   drop policy if exists "Only signed-in admins can delete results" on submissions;
   create policy "Only signed-in admins can delete results"
     on submissions for delete
     to authenticated
     using (true);

   -- 2. Guesses table (blind-spot exercise)
   create table if not exists guesses (
     id uuid default gen_random_uuid() primary key,
     team_code text,
     guesser_name text not null,
     target_name text not null,
     drive numeric not null,
     connection numeric not null,
     clarity numeric not null,
     created_at timestamptz default now()
   );

   alter table guesses enable row level security;

   drop policy if exists "Anyone can submit a guess" on guesses;
   create policy "Anyone can submit a guess"
     on guesses for insert
     to anon
     with check (true);

   -- 3. Team-code-gated read functions -- the actual "only your own team
   -- can see your team's data" gate, enforced by the database rather
   -- than by this site's JavaScript. security definer means the function
   -- can read the table even though the anon role has no direct select
   -- grant on it above -- the only way to read rows back out is by
   -- knowing the exact code to pass in.
   create or replace function get_team_submissions(code text)
   returns setof submissions
   language sql
   security definer
   set search_path = public
   as $$
     select * from submissions where team_code = code;
   $$;
   grant execute on function get_team_submissions(text) to anon;

   create or replace function get_team_guesses(code text)
   returns setof guesses
   language sql
   security definer
   set search_path = public
   as $$
     select * from guesses where team_code = code;
   $$;
   grant execute on function get_team_guesses(text) to anon;
   ```

3. **Create the admin account** — in the left sidebar, "Authentication" >
   "Users" > "Add user". Set an email and password; this is what gets
   typed into `admin.html`'s sign-in form, separate from your own
   Supabase account login.
4. **Copy two values into `js/supabaseClient.js`** — in the left sidebar,
   "Project Settings" > "API Keys" gives you the **Publishable key**
   (`sb_publishable_...`), and "Project Settings" > "Data API" gives you
   the **API URL** (use everything before `/rest/v1/`, e.g.
   `https://xxxx.supabase.co`). Both are already set as
   `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` at the top of that file for
   this deployment — only change them if you spin up a different Supabase
   project.

   **Never put Supabase's "Secret key" (`sb_secret_...`, formerly called
   `service_role`) anywhere in this codebase.** The publishable key is
   designed to be public — it can only ever do what the Row Level
   Security policies above allow. The secret key bypasses all of that and
   must never appear in client-side code.

If the database is ever unreachable (no internet, Supabase down, or this
step hasn't been done yet), every page that talks to it fails soft: the
solo reflection still downloads a result file and just notes the shared
save didn't go through; the team overlay and blind-spot reveal fall back
to their "load from files" option; the admin page shows a plain "couldn't
reach the database" note instead of crashing.

### Migrating an existing database (People/Performance/Process → Drive/Connection/Clarity)

If your Supabase project was set up before this rebrand, it still has the
old `people` / `performance` / `process` / `category` / `shift_score` /
`shift_band` columns and real submitted results in them. Run the
migration below **once** to bring it in line with the code in this
repository — it renames the columns, relabels the values that changed
name, and **genuinely recalculates** every historical row's pattern
under the new Focused/Dual-led/Balanced classification rules (not just a
find-and-replace on the old label — a result that used to read
"People-led" might now read "Dual-led," or vice versa, because the
thresholds themselves are new).

**Back up first.** In the Supabase dashboard: Database → Backups (if
available on your plan), or Table Editor → select `submissions` →
"Export as CSV" (repeat for `guesses`). This migration runs real
`ALTER TABLE`/`UPDATE` statements against live data — there's no undo
once it's run, other than restoring from a backup you took yourself.

Open the SQL Editor and run this once new column names in the block
above match what you're moving *to* (skip the `create table` migration
below if you're setting this database up fresh — the block above
already has the new names):

```sql
-- 1. Column renames -- submissions table
alter table submissions rename column people to connection;
alter table submissions rename column performance to drive;
alter table submissions rename column process to clarity;
alter table submissions rename column category to pattern;
alter table submissions rename column shift_score to change_score;
alter table submissions rename column shift_band to change_band;
alter table submissions rename column everyday_people to everyday_connection;
alter table submissions rename column everyday_performance to everyday_drive;
alter table submissions rename column everyday_process to everyday_clarity;

-- 2. Column renames -- guesses table
alter table guesses rename column people to connection;
alter table guesses rename column performance to drive;
alter table guesses rename column process to clarity;

-- 3. Relabel change_band values -- the numeric bands are unchanged,
-- only "moderate" was renamed to "noticeable"
update submissions set change_band = 'noticeable' where change_band = 'moderate';

-- 4. Relabel largest_increase_dimension / largest_decrease_dimension values
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

-- 5. Recalculate `pattern` for every row under the NEW rules. This
-- helper function mirrors js/scoring.js's derivePattern() exactly
-- (same 10/9/8 thresholds), applied here in SQL so it can run once
-- against every existing row without exporting the data anywhere.
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

update submissions set pattern = mvs_derive_pattern(drive, connection, clarity);

-- Optional cleanup once you've spot-checked the results above -- this
-- function isn't needed at runtime (new submissions compute their own
-- pattern in the browser, via js/scoring.js):
-- drop function mvs_derive_pattern(numeric, numeric, numeric);
```

After running it, spot-check a handful of rows in the Table Editor:
`drive`/`connection`/`clarity` should hold the same numbers the old
`performance`/`people`/`process` columns did (just renamed and
reordered), and `pattern` should hold a value like `focused_drive`,
`dual_connection_clarity` or `balanced` rather than the old
`performance_led`/`people_performance_blend`/etc. strings.

## The six flows

### 1. Solo reflection

Landing → privacy/consent → your name (plus an optional team code) → ~30
questions → results (horizontal score bars, interpretation, potential
strengths, a "when your approach goes too far" section, communication
tips, and a short "how others can work with you" section). Your name is
asked up front (so your own results page and any file you export are
clearly labelled) — there's no email step anywhere in this tool. The team
code is only relevant if a facilitator gave you one for a team exercise;
leave it blank for a purely personal reflection. The moment the results
screen loads, two things happen automatically, no click needed: a result
file downloads to your device (a personal backup and a fallback for
sharing the old way), and your name, result and team code (if given) save
straight to the shared database — see "Database setup" and "Data storage"
below for what that means in practice. A "Save again" button stays on the
page if you want to re-save the file under a different name, or if the
automatic download didn't fire. From here, anyone can also continue into
the optional **Priorities Under Pressure** add-on (see flow 6 below).

### 2. Guidance tool ("Working with different priorities")

`guide.html` is reachable directly from the home page — it doesn't require
completing the full solo reflection first. It offers three ways to tell it
your own starting point:

- **Pick your dimension directly**, from three buttons (Drive, Connection,
  Clarity);
- **Place yourself on the interactive triangle** (the same draggable
  triangle used by the blind-spot exercise), with a live readout of the
  pattern your position currently resolves to;
- **Upload a previously-saved `result-*.json` file** (the same file the
  solo reflection and team overlay use).

Once resolved, it first shows a **"Your result, in a nutshell"** overview —
the same interpretation, strengths, "when your approach goes too far" list
and "how others get the best from you" reference already used elsewhere in
the tool, so someone arriving here without having done the full solo
reflection still gets a proper explanation of what their result actually
means before anything else. This overview is pattern-aware, not just
dimension-aware: a Dual-led or Balanced reader sees the accurate write-up
for their actual pattern, not a forced single-dimension summary.

Underneath that, a **"Working with each priority"** section shows a card
for each of the other two dimensions plus a card for meeting someone who
shares your own dimension — three in total, each with an approach, a
strength you bring, something to watch for, and a one-line reminder. This
content isn't a static lookup table: `js/commsGuidance.js` generates it at
render time by combining each dimension's own interpretation/strengths/
overuse-risk content with a small set of building-block phrases
(`CONTENT.commsGuide.communicationStyles`), so the guidance stays specific
to the actual dimension pairing rather than reading like boilerplate. See
`CONTENT.commsGuide` below for how the source content is put together.
Has its own "Download as PDF" export.

### 3. Team overlay

Each person completes the solo reflection on their own device, entering a
shared team code when asked for their name. Anyone opens `team.html`,
types that same code under "Load your team by code," and everyone who
used it appears on the overlay automatically — no files to collect. The
older approach still works underneath, as an "Or load from files instead"
option: each person saves and hands over their result file, and whoever's
running the session loads them all at once. Either way you end up with:

- everyone plotted as a labelled marker on one triangle, plus a "team
  average" marker and a full accessible data table underneath (name and
  Drive/Connection/Clarity percentages);
- an expanded **"Team takeaways"** section — a handful of auto-generated
  observations about the loaded group, assembled entirely from data
  already in the loaded files (nothing here is bespoke commentary about
  named individuals):
  - **"How the group breaks down"** — a count of the group against
    whichever patterns actually appear (Focused-Drive, Dual-led
    combinations, Balanced, and so on), sorted by how common each one is,
    so pairings and balanced results show up as their own thing rather
    than being folded into whichever dimension scored highest;
  - which dimension is most common as a primary, and the collective risk
    that goes with leaning on it too heavily (or a "no clear dominant
    priority" note when it's an even split);
  - whether any dimension has nobody representing it as their *primary* —
    and if it still turns up as somebody's *secondary*, a softer note
    saying so, rather than reporting it as fully absent from the room;
  - a one-line split of how many people show one clear Focused priority
    versus more of a Dual-led or Balanced pattern across two or more
    areas;
  - a small-sample caveat when fewer than three files are loaded;
  - **"Who's in the room"** — a roster table (name, result, and all three
    percentages, sorted alphabetically) for reference alongside the
    takeaways above.

  This replaces an earlier static communication matrix, removed as
  redundant: the guidance tool (`guide.html`) already covers pairwise
  "working with each priority" dynamics in much more depth, so this
  section goes deeper on the group itself instead of duplicating a
  lighter version of that other module. The takeaways section's intro
  links to the guidance tool for that pairwise view.

This section, plus the chart and data table, is included in this page's
"Download as PDF" export.

This is **named, not anonymous** — the privacy note on this page says so
explicitly, and it's worth confirming your team is comfortable with that
before using a shared team code or collecting files.

### 4. Blind-spot (perception) exercise

On `guess.html`, one section lets each person privately guess — by
dragging a point on an interactive triangle — where they think *they* sit,
then where they think *every other named teammate* sits. If the group is
using a team code, entering it here saves each guess straight to the
database, ready for the reveal step; either way, they can also save a
guesses file (e.g. `guesses-alice.json`) at the end, the same way as a
result file.

**Reveal** works the same two ways: type the team code to pull that
team's results and guesses straight from the database, or load everyone's
guesses-and-result files by hand if no code was used. Nobody needs a PIN
to keep guesses hidden in the meantime — without a team code, the act of
collecting files *is* the gate (nobody sees anyone else's guesses until
someone deliberately loads them together); with a team code, the same
team-code-gated database functions used by the team overlay mean only
someone who knows the code can pull the data back out. Once revealed, it
shows, per person: their actual result (solid marker) plus every guess
made about them, including their own self-guess.

### 5. Admin: all submissions

`admin.html` shows every submission across every team code, straight from
the database, as a plain sortable-by-eye table: name, result,
Drive/Connection/Clarity percentages, team code, and when it was
submitted. There's a "Download as CSV" button (for pulling into Excel or
Google Sheets) alongside the usual "Download as PDF." An "Import older
result files" section further down lets you fold in any `result-*.json`
files saved before the database existed, so historical submissions aren't
lost.

Both the sign-in gate and the main table screen show a clear
**internal-use notice**: this data is for internal ebi use only, this
tool is an educational self-reflection aid rather than a validated
assessment, and it shouldn't be used to make hiring, promotion,
performance or disciplinary decisions about anyone, or forwarded outside
the people directly involved without their knowledge (`CONTENT.admin.internalUseNotice`).

A **"Filter by team code"** field narrows the table down to one team's
submissions — type a code and only matching rows show; clear it to see
everyone again. This filter also scopes what "Download as CSV" and
"Download as PDF" export, so you can pull a single team's results without
the rest of the organisation's data mixed in.

Each row loaded from the database (not from an imported file) has a
**"Delete"** button, asking for confirmation before permanently removing
that submission from the shared database — this can't be undone, so use it
deliberately. Submissions folded in from imported files don't have one,
since there's nothing in the database for them to delete.

Signing in is a **real login** — checked by Supabase's own Auth service
against an admin account you create yourself (see "Database setup"
above), not a passphrase checked by this site's own JavaScript the way it
used to be. The page is linked from a small badge in the top-right corner
of the home page's hero band, not one of the main tiles or the nav. A
"Sign out" button next to the page title ends the session.

### 6. Priorities Under Pressure (optional add-on to solo reflection)

An optional continuation offered right at the bottom of the Everyday
Priorities result (`reflection.html`'s results screen) — "Curious how
this shifts under pressure?" It's never required, and declining it
changes nothing about the Everyday result already shown and saved.

If someone starts it: a short transition screen explains the shift in
framing ("Part 2 of 2: Responding under pressure"), followed by 18
original situational questions. Unlike the Everyday questions, each one
asks for a full ranking of all three responses — most like you, next
most like you, least like you (tap in order; the last response completes
itself once the other two are placed) — rather than picking just one, so
someone's *relative* priorities under pressure can be measured rather
than a single pick each time.

The result — "Priorities Under Pressure" — plots the Everyday and
under-pressure points on a three-lane **"Priority Shift"** visual: one
horizontal lane per dimension, a circle marker for the Everyday
Priorities position, a diamond marker for the Priorities Under Pressure
position, and a plain connecting bar between them (deliberately not an
arrow or a triangle, so no reading of "movement toward conflict" is
implied by the shape itself). Alongside that:

- a **Degree of Change** score and band (Limited / Noticeable /
  Significant / Marked), measuring how far the two points sit apart —
  not a measure of anger, aggression, emotional stability or conflict
  skill, just how much someone's stated priorities move;
- a generated headline and summary describing the actual *movement*
  (e.g. "You move from Connection towards Drive under pressure"), not a
  generic write-up of the pressure result on its own;
- a full score table (Everyday / under pressure / change per dimension);
- "What others may notice," "What remains valuable," "Risks to watch,"
  "Practical self-management," "How colleagues can work with you," and
  six reflection questions — all assembled from whichever dimension
  increases and decreases most, so the write-up reflects this person's
  specific shift;
- its own "Download as PDF" export and an explicit disclaimer that this
  is intended to support reflection and workplace conversations, not to
  diagnose or label anyone, and is not a validated psychometric or
  clinical assessment.

Completing it saves a second row to the `submissions` table (see "Data
storage" below for exactly what that row contains) — this is disclosed
alongside the Everyday save on the same privacy/consent screen everyone
already sees before starting the questionnaire.

This is Release 1 of the feature, scoped deliberately: no
comparison-between-two-people report and no team-level "Degree of Change"
dashboard card yet (both were in the original brief, held back for a
later round), and the pattern-classification thresholds reuse the
existing Everyday ones (`FOCUSED_GAP_THRESHOLD`/`DUAL_TIGHTNESS_THRESHOLD`/
`DUAL_LOW_GAP_THRESHOLD` in `js/scoring.js`) rather than introducing a
second set of tunable thresholds.

## Brand (`css/styles.css` `:root`)

Colours and type are taken from ebi's own Style Guide (v1 2021), pixel-checked
against the guide's swatches rather than trusted from its printed hex labels —
the guide's "Brand Colours" page has a couple of mislabelled hex codes
(leftover Bootstrap-default text under the right-looking swatches), so the
values below were sampled directly from the swatch pixels instead:

- `--accent` (`#6b5e8b`, Medium Purple), `--accent-soft` (`#8f72b1`,
  Corporate Purple), `--brand-green` (`#93c467`, Corporate Green),
  `--text-primary` / `--text-secondary` — already matched the guide closely
  from earlier work on this app.
- `--accent-light` (`#a094b7`, Light Purple) and `--accent-deep` (`#4b0f8a`,
  Dark Purple) were added for the home page's hero band (see below).
- Body font is Nunito Sans (loaded via Google Fonts in every page's
  `<head>`), matching the guide's specified "Web Font" exactly. The guide's
  "Corporate Font" (Avenir) is for print/stationery, not relevant here.

The home page's banner (`.mvs-hero-band` in `index.html`) is a deliberate
callback to the Style Guide's own stationery back-cover treatment (business
card and letterhead backs, pages 7-8): a solid Dark Purple panel with a
Light Purple rounded-corner shape overlapping it, white logo on top. Every
other page keeps a plain, functional header — colour and a thin
purple-to-green accent line, nothing bolder — since those are working
screens that need to stay readable (and print cleanly), not a cover page.
Buttons across the app are fully rounded (pill-shaped) rather than
soft-cornered rectangles, a small nod to the organic, curved shapes used
throughout the guide's iconography and stationery.

The home page's "My apps" section (`.mvs-tool-grid` / `.mvs-tool-tile`) is
an icon-tile grid — a colour-coded icon circle, a short title, and a
one-line hint, on a plain white card — matching the app-launcher pattern
used on ebi's other internal tools (e.g. the Vault app hub's "My Apps"
grid), rather than the longer vertical description-cards used in an
earlier version of this page. An earlier pass used a generic, off-brand
Bootstrap-style palette here (orange/pink/blue/teal) purely to match the
*varied-colour look* of those other app launchers; `--tool-reflection` /
`--tool-team` / `--tool-blindspot` / `--tool-guide` now use ebi's own
tones instead — Dark Purple, Medium Purple and Corporate Purple (ranked
darkest-first to match how prominently each tool is placed on the page),
plus a deeper, print-tested shade of Corporate Green for the guide banner
below. The icons themselves are small hand-drawn inline SVGs (`ICONS` in
`index.html`), not a reproduction of ebi's own icon set, which this app
doesn't have access to.

The tile grid is ordered and weighted by how the tools are actually used:
**solo reflection** is the main, most-used entry point, so it renders as a
larger, full-width, horizontal "featured" tile (`.mvs-tool-tile--featured`)
above the smaller **team overlay** and **blind-spot exercise** tiles,
which sit side by side below it. The **guidance tool** ("Working with
different priorities") isn't in this grid at all — it's a different kind
of thing, a reference lookup you can use anytime rather than a one-off
workflow — so it gets its own distinctly-styled banner
(`.mvs-guide-banner`) underneath: full-width, a rounded-square icon
instead of a circle, a small "Reference guide" tag, and the green accent
instead of the purple ramp, so it visually reads as a different category
of tool rather than a fourth equal tile.

The admin entry point (`admin.html`) is a small pill badge in the
top-right corner of the home page's hero band (`.mvs-hero-admin-link`),
not a tile or a footer link — deliberately low-key, matching that it's a
soft-gated page for one person rather than a main flow for everyone. See
"Admin: all submissions" above for what that sign-in does and doesn't
protect against.

The ebi logo in every page's header is a link back to `index.html`
(`.mvs-brand-link`, shared markup across `reflection.html`, `guide.html`,
`guess.html`, `team.html` and `admin.html`) — a small, low-key way to get
home from anywhere without hunting for the explicit "← Back to home" text
links. The home page's own hero-band logo is deliberately left as a plain,
non-clickable mark rather than a self-link — you're already home, so a
link back to the same page would do nothing useful.

Two small consistency fixes on the home page: the tool-tile / featured-tile
/ guide-banner titles are `<h3>`s (not `<h2>`s) since they sit inside the
"My apps" `<h2>`, keeping one clean heading hierarchy down the page instead
of two h2s' worth of siblings-that-aren't-really-siblings; and the "What
this is" / "What it's for" / "What it isn't" section titles use the same
plain dark `.mvs-section-title` colour as every section title on every
other page, rather than a one-off purple tint that only this page had.

**Chart colours** (`--series-drive` / `--series-connection` /
`--series-clarity`) are intentionally a separate system from the brand
accent colours above — they're an original amber/purple/teal palette,
chosen deliberately over the tool's earlier blue/red/green triad because
amber, purple and teal differ in both hue *and* lightness (safer for
colour-vision deficiency) and don't happen to echo any particular
commercial assessment's own colour scheme. Both the light-mode and
dark-mode values were verified against a contrast-ratio check (light
values >4.5:1 against white, dark values >8:1 against near-black) before
being adopted. They stay as they are regardless of brand palette changes,
since their job is chart legibility and colourblind-safety, not brand
matching.

## Editing content (questions, results copy, all screen text)

Everything editorial lives in **`js/content.js`**:

- `CONTENT.questions` — the ~30 forced-choice questions. Each needs
  exactly 3 options, each option a `text` and a `dimension` of
  `"drive"`, `"connection"` or `"clarity"`.
- `CONTENT.dimensionOrder` — the canonical `["drive", "connection",
  "clarity"]` display order, shared by `app.js`, `guide.js`, `pressure.js`,
  `admin.js` and `team.js` so everything stays in sync from one place.
- `CONTENT.dimensionContent` — the write-up for each of the three
  dimensions (`drive`, `connection`, `clarity`): `label`,
  `interpretation`, `strengths`, `overuseRisks` (shown under "When your
  approach goes too far"), `communicationTips`, `howOthersCanWork`, and
  `quickReference` (a compact "focus on / avoid" callout). This is used
  whenever someone's pattern is **Focused** on a single dimension.
- `CONTENT.dualContent` — the write-up for each of the three dimension
  pairings (keyed `drive_connection`, `drive_clarity`,
  `connection_clarity`, always in that dimension order regardless of
  which one is primary), used when someone's pattern is **Dual-led**.
- `CONTENT.balancedContent` — a single write-up used when someone's
  pattern is **Balanced** (no dimension or pair stands out enough to be
  Focused or Dual-led).
- `CONTENT.team` — besides the team-overlay screen copy, this holds the
  wording templates for the auto-generated "Team takeaways" section:
  `analysisDominant`/`analysisWatchFor`/`analysisNoDominant` (most common
  primary dimension), `analysisGap`/`analysisGapSoftened`/`analysisNoGap`
  (a dimension with nobody primary in it, with the softer wording used
  when it still shows up as somebody's secondary), `analysisBlendSplit`
  (Focused vs. Dual-led/Balanced ratio), `analysisBreakdownHeading`/
  `analysisBreakdownLine` (the dynamic pattern-count breakdown list), and
  `analysisRosterHeading`/`analysisRosterIntro` plus `colName`/
  `colResult`/`colDrive`/`colConnection`/`colClarity` (the "Who's in the
  room" roster table). All of it is small functions filled in at render
  time with whichever dimension/count/pattern applies to the group
  actually loaded — there's no bespoke commentary about named individuals
  anywhere in here.
- `CONTENT.workingWithGuide` — the "quick guide to working with different
  priorities" shown near the bottom of the solo results page (and included
  in its PDF export): one entry per dimension (`drive`, `connection`,
  `clarity`), each with a short `tagline` and a handful of practical
  `tips` for working with someone whose result leans that way. The
  results page always shows the other two, leaving out whichever one
  matches the reader's own primary dimension.
- `CONTENT.commsGuide` — powers `guide.html` ("Working with different
  priorities"). The page opens with an **overview section**
  (`overviewHeading`/`overviewStrengthsHeading`/`overviewWatchHeading`/
  `overviewApproachHeading`) that reuses the reader's own pattern content
  (via the same `contentForPattern` lookup used on the results page)
  rather than writing a second copy of that content just for this page,
  since someone can land on `guide.html` without ever having seen their
  own results page. Below that, `cardsHeading`/`cardsIntro` head into the
  three pairwise cards. The genuinely bespoke content here is
  `communicationStyles[dimension]` — one entry per dimension with short,
  original building-block phrases (`opensWith`, `respondsTo`, `pushBack`,
  `underGap`). **`js/commsGuidance.js`** combines these with the relevant
  `CONTENT.dimensionContent` entries at render time to assemble each
  card's "best approach", "what you bring" and "watch for" text — so the
  guidance is generated per pairing rather than a static lookup table of
  pre-written combinations.
- `CONTENT.home` — the home page's intro, the "what this is / what it's
  for / what it isn't" explainer text, and the `cards` array (title, body,
  link, CTA label, and an `accent` key used to colour each card's left
  edge to match the tool it links to).
- `CONTENT.admin.internalUseNotice` — the internal-use-only wording shown
  on both the admin sign-in gate and the main admin table.
- `CONTENT.privacy`, `CONTENT.nameCapture`, `CONTENT.team`,
  `CONTENT.guessExercise`, `CONTENT.pressureQuestions`,
  `CONTENT.pressureMovement`, `CONTENT.pressureResults` — every other
  screen's copy, including the GDPR-style privacy notices and all
  Priorities Under Pressure report text.

The app ships with 30 questions (10 per dimension); you can go anywhere in
the 24–36 range, just keep the three dimensions roughly balanced.

## How scoring works (`js/scoring.js`)

An original, transparent points model — not a reproduction of any
third-party scoring algorithm:

1. Every answer gives 1 point to whichever dimension it's tagged with.
2. Points convert to a percentage split that always sums to 100
   (largest-remainder rounding).
3. The three percentages are ranked, and the gaps between them decide the
   **pattern**, via `derivePattern()`:
   - **Focused** on the top dimension if it's at least
     `FOCUSED_GAP_THRESHOLD` (10 points) clear of the second;
   - otherwise **Dual-led** on the top two dimensions if the gap between
     them is `DUAL_TIGHTNESS_THRESHOLD` (9 points) or less *and* the third
     dimension trails the second by at least `DUAL_LOW_GAP_THRESHOLD` (8
     points);
   - otherwise **Balanced** — no dimension or pair stands out enough to
     call it Focused or Dual-led.

   All three thresholds are plain constants at the top of `scoring.js`,
   deliberately different from (and independently chosen from) any
   commercial assessment's own category boundaries.
4. `contentForPattern()` (duplicated in `app.js`/`guide.js`/`pressure.js`/
   `admin.js`/`team.js`) maps that `{type, primary, secondary}` result to
   the right write-up: `CONTENT.dimensionContent` for Focused,
   `CONTENT.dualContent` (looked up via `orderedPairKey`, always in
   drive/connection/clarity order) for Dual-led, `CONTENT.balancedContent`
   otherwise.

## The charts (`js/chart.js`)

Two chart families, chosen deliberately to avoid a single triangle
graphic doing every job:

- **One person's result** (`renderResultsChart`) is a set of independent
  horizontal **score bars**, one per dimension (`.mvs-scorebars` /
  `.mvs-scorebar-row` / `.mvs-scorebar-track` / `.mvs-scorebar-fill`),
  each showing its own 0–100% fill rather than one stacked bar or a
  triangle — deliberately not a triangular graphic.
- **Priorities Under Pressure movement** (`renderPriorityShiftChart`) is
  a three-lane **"Priority Shift"** visual (`.mvs-priority-shift` /
  `.mvs-priority-lane`), one lane per dimension: a circle marker for the
  Everyday Priorities position, a diamond marker for the Priorities Under
  Pressure position, and a plain connecting bar between the two —
  deliberately not an arrow or a triangle, so the shape itself doesn't
  imply "escalation" or "conflict."
- **Multi-person overlay** (`renderOverlayChart`), the **blind-spot
  reveal** (`renderPerceptionChart`), and the **draggable input**
  (`createInteractiveTriangle`) keep an original triangle layout —
  Connection at the top vertex, Drive at bottom-left, Clarity at
  bottom-right (`TRIANGLE_VERTICES` in `chart.js`) — since plotting
  several people's positions relative to one another, or letting someone
  drag a point to set three percentages at once, is genuinely well served
  by a triangle; this is not a reproduction of any commercial assessment's
  triangle graphic, just an independently laid out geometry using this
  tool's own colours.

Across all of these, **colour mapping** is Drive = amber, Connection =
purple, Clarity = teal (`CHART_COLORS` in `chart.js` — see "Brand" above
for how this palette was chosen and validated). Every triangle-based chart
still uses the original colour-wash fill (`drawTriangleColorWash`) built
from three SVG radial gradients composited with the "screen" blend mode,
clipped to the triangle shape and rendering in a fixed light wash
regardless of the app's light/dark theme, the same way a printed chart
would — markers/labels near it use fixed, theme-independent tones rather
than the usual `var(--text-*)` tokens; see the comments in both
`chart.js` and the relevant rules in `styles.css` if you're customising
colours. Every chart, of either family, also has a full accessible data
table or labelled legend underneath it as a non-visual fallback.

## File formats

Two small JSON file types are exchanged between people, always downloaded
by the app itself and never handwritten:

- **Result file** (`result-<name>.json`): `{ type: "wow-result", name,
  percentages: { drive, connection, clarity }, pattern, exportedAt }`,
  where `pattern` is a key like `"focused_drive"`, `"dual_drive_connection"`
  or `"balanced"`.
- **Guesses file** (`guesses-<name>.json`): `{ type: "wow-guesses",
  guesser, guesses: [{ target, percentages }], exportedAt }`.

`team.html` and the reveal section of `guess.html` both check the `type`
field and skip (with an on-screen warning) any file that doesn't look
right, rather than failing silently.

## PDF export

Four pages have a "Download as PDF" button — the solo results page, the
guidance tool (once a starting point is set), the team overlay (once at
least one result file is loaded), and the blind-spot reveal (once it's
showing revealed results); the Priorities Under Pressure results page has
its own separate PDF export too. All of these call the browser's own
`window.print()`, styled by a dedicated `@media print` block in
`css/styles.css` — choosing "Save as PDF" as the destination in the print
dialog produces the file. Each button only ever prints the
results/guide/overlay/reveal content itself: file pickers, warnings, nav
links, method selectors and the guess-entry tool are all hidden for print
via a shared `.mvs-print-hide` class.

An earlier version of this button used
[html2pdf.js](https://github.com/eKoopmans/html2pdf.js) (a canvas-based
screenshot-to-PDF library) loaded from a CDN. That approach turned out to
be unreliable in practice: depending on the browser window's width and
scroll position when the button was clicked, it could produce a blank
leading page, fail to render the chart at all, crop content that ran
wider than its internal assumptions, and slice a paragraph in half across
a page break. Handing the job to the browser's native print engine avoids
all of that, since it lays the page out for real instead of rasterising a
screenshot of it — and it also means PDF export no longer depends on an
external CDN being reachable at all.

If you're customising `css/styles.css`, keep an eye on the `@media print`
block near the bottom of the file: it forces a light theme (so a system
in dark mode doesn't print white text on a dark background), hides
on-screen-only elements (nav links, file pickers, warnings, the
guess-entry tool, the team-file save step, and every print button/note
via `.mvs-print-hide`), and marks small self-contained blocks — cards,
the chart, table rows, callouts, one person's actual-vs-guesses block —
with `break-inside: avoid` so the browser doesn't split one in half
across a page break. That rule is deliberately scoped to those specific,
small elements rather than the generic `.mvs-section` class: on the team
and blind-spot pages, some outer wrapper containers that also carry that
class are much taller than a single page, and forcing one of those whole
would just push it entirely onto the next page and leave a blank gap
behind it.

**A CSS Grid pitfall worth knowing if you add new multi-item layouts:**
Chromium's print engine doesn't reliably fragment a `display: grid`
container across a page break — a row that doesn't fully fit at the
bottom of a page can be clipped out of the PDF entirely instead of
flowing onto the next page. That's exactly how the "working with
different priorities" guide's balanced-pattern card was silently
disappearing from the results PDF depending on where its grid row
happened to land. Plain block flow and real `<table>` layout both
fragment correctly, so the fix was to force `.mvs-wwd-grid` and
`.mvs-result-summary-grid` to `display: block` under `@media print`
(cards get a `margin-bottom` there instead of `gap`), and to build any
card-grid layouts used in PDF-exported pages as actual `<table>`s from
the start where practical. If you add another card grid to a page that's
included in a PDF export, either give it the same print-time
`display: block` override or use a `<table>`, and test the actual PDF
output (via a full print, not just eyeballing the on-screen page) —
`break-inside: avoid` inside a grid container doesn't rescue it.

## Data storage

Every completed solo reflection is saved to the `submissions` table in the
Supabase database described in "Database setup" above — name, the three
percentages, the pattern, an optional team code, and a timestamp. This
happens automatically, whether or not a team code was entered; it's what
makes `admin.html` show a live, complete list without anyone collecting
files, and it's disclosed on the privacy/consent screen before anyone
starts (`CONTENT.privacy.points`). Guesses from the blind-spot exercise
save the same way, into the `guesses` table, when a team code is used.

Nothing about *how the questions are answered* is stored beyond the final
percentages — there's no record of individual question responses, only
the computed result. The one piece of purely local, anonymised persistence
is `js/aggregate.js`, which writes a `{ timestamp, percentages, pattern }`
record (no name or team code) into that browser's own `localStorage`, to
support a future "how does this compare to everyone else" aggregate view
— unrelated to the Supabase tables above, and never synced anywhere.

If someone completes the optional **Priorities Under Pressure** add-on
(see "The six flows" above), a *second* row is saved to the same
`submissions` table, with `record_type` set to `"pressure"` rather than
the default `"everyday"`. It's a separate row rather than an update to
the original one — there's no reliable way for the page to look its own
earlier row back up (the anon role can only insert, never read or
update, by design — see "Team-code" security note above), so the
pressure row is self-contained instead: alongside its own three
percentages, it carries a copy of that person's Everyday percentages, the
Degree of Change score and band, and which dimension moved most in each
direction. `admin.html`'s table shows a "Type" column so the two kinds of
row are easy to tell apart, and a "Degree of change" column for pressure
rows.

Result files and guesses files still exist too, as a personal backup and a
fallback for anyone not using a team code — deleting them from a shared
folder after a workshop only removes that copy, not the database record
(if one was made). `admin.html` has its own "Delete" button per row for
removing a database record directly (see "Admin: all submissions"
above); you can also do it directly in the Supabase dashboard's Table
Editor if you'd rather.

## Admin editing

Editing content means editing `js/content.js` directly — there's no
in-browser admin UI for copy. (This is a different "admin" from
`admin.html`, which is about viewing participants' submitted results, not
editing the tool's own wording.)

## Privacy notes (read before using this with real teams)

- **Every solo reflection is saved to a shared database automatically**,
  visible to whoever has admin sign-in — name, result and team code (if
  given). This is disclosed up front on the privacy/consent screen before
  anyone starts; make sure your team is genuinely comfortable with that
  before rolling this out, not just aware it's in the small print.
- **The team overlay and blind-spot exercise are named, not anonymous, by
  design** — that's the point of the exercise. Anyone who knows a team's
  code (or receives the shared folder of result/guesses files, for the
  file-based fallback) can see everyone's name alongside their result.
  Make sure your team is comfortable with that before sharing a code or
  collecting files, and see `CONTENT.team.privacyNote` for the wording
  shown on-screen.
- **Team codes are a real database-level gate, not just a UI filter** —
  reading a team's data back out requires the exact code, enforced by the
  Postgres functions in "Database setup," not by this site's JavaScript.
  Treat a team code the same way you'd treat a shared meeting passcode:
  memorable is fine, but don't post it somewhere public.
- **Admin sign-in is a real login**, checked by Supabase's own servers
  against an account you create yourself — a genuine security boundary,
  unlike an old passphrase-based approach this tool used previously. It's
  still worth normal account hygiene (a real password, not shared beyond
  whoever needs admin access).
- **This is not a validated assessment, and results shouldn't drive formal
  decisions.** The admin page's internal-use notice, the results-page
  disclaimer, and the Priorities Under Pressure disclaimer all say this
  explicitly: don't use anything from this tool to make hiring, promotion,
  performance or disciplinary decisions, and don't forward results outside
  the people directly involved without their knowledge.

## IP notes

This tool is an original implementation "inspired by similar concepts" to
commercial workplace-priorities assessments, but it does not use any
commercial assessment's wording, questions, scoring algorithm, report
text, proprietary category or dimension names, or graphic designs. In
particular:

- **Dimensions and pattern model.** "Drive", "Connection" and "Clarity"
  are this product's own names, and results are described in terms of a
  continuous Focused/Dual-led/Balanced pattern (with its own 10/9/8-point
  thresholds) rather than a fixed set of named personality categories.
- **Charts.** The primary results chart is a set of horizontal score
  bars, not a triangle. The Priorities Under Pressure movement chart is a
  three-lane visual with circle/diamond markers and a plain connecting
  bar — deliberately not an arrow-and-triangle graphic. The multi-person
  overlay, blind-spot reveal, and draggable input keep an original
  triangle layout of their own design and colour scheme, used because
  plotting several relative positions or setting a percentage split by
  dragging is genuinely well served by that shape — not because it
  reproduces any other assessment's graphic.
- **Language.** Narrative content avoids "conflict type"/"conflict style"
  framing throughout; the pressure feature is described as "Priorities
  Under Pressure" and "Degree of Change," not any third-party's
  terminology for the same idea. The guidance tool's pairwise content is
  generated at render time from small original building blocks
  (`js/commsGuidance.js` + `CONTENT.commsGuide.communicationStyles`)
  rather than a static, pre-written 49-entry matrix.
- **Internal-use safeguards.** The admin page, the results page and the
  Priorities Under Pressure results page all carry original disclaimer
  wording making clear this is an educational self-reflection aid, not a
  validated psychometric or clinical assessment, and not a basis for
  hiring, promotion, performance or disciplinary decisions.

If you plan to publish this externally, keep the same discipline when
editing content: write your own wording, don't reference any commercial
assessment by name in user-facing copy, and keep the visual designs here
rather than recreating a fixed-region triangle graphic or a third-party's
category system.

One internal, non-user-facing housekeeping note: this project's code
namespace (CSS class prefixes, some internal constant/storage-key names,
the project folder name, and the live GitHub repository name) still uses
an `mvs-`/`MVS_`-style prefix left over from before this rebrand. None of
it is visible to anyone using the tool, but if you want to remove it
entirely at some point, budget it as a separate piece of work — it
touches the live repository name and site URL, so it's worth doing
deliberately rather than as a drive-by rename.
