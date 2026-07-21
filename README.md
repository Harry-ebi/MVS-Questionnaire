# Ways of Working — a motivation reflection tool

A small web app for ebi: a ~30-question forced-choice reflection tool that
gives people a sense of whether they're more motivated at work by
**People**, **Performance** or **Process**, inspired by the general idea of
workplace motivational drivers (it is *not* a copy of any commercial
assessment — see "IP notes" below). It also includes three things built on
the same scoring: a **communication guide** to working with each of the
other results, a **team overlay**, and a **blind-spot (perception)
exercise**.

## Architecture: no server, no accounts, no install

This is a **fully static site** — plain HTML, CSS and JavaScript, with no
backend, no database, no build step, and nothing to install. Every page can
be opened straight from a folder, or served by any plain web host.

The team features (overlay and blind-spot exercise) need a way for several
people's separate results to end up in one place. Instead of a shared
server, this app uses a much simpler mechanism: each person's results page
has a **"Save result file"** button that downloads a small `.json` file
(e.g. `result-alice.json`). People drop these files into any shared folder
they already use — OneDrive, Dropbox, Google Drive, a network drive, or
just email — and then load them all at once on the team overlay or
blind-spot reveal page. Nothing is ever uploaded anywhere; every file is
read directly inside the browser using the File/FileReader API, on
whichever computer opens it.

The solo reflection works exactly the same on its own — nothing about a
person's answers leaves their browser unless they choose to save and share
a result file.

## Running it

There's no server process to start. Two ways to use it:

**Simplest — open the files directly.** Open `home.html` in a browser
(double-click it, or File → Open). Everything works from `file://` links.

**If you want a normal web address** (for example to host this on a
company intranet or a simple static file host — Netlify, GitHub Pages, a
shared network drive with web serving turned on, etc.), just upload the
whole folder as-is. There is no build step and nothing to configure.

For local testing during development, any static file server works, e.g.:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/home.html
```

Pages:
- `home.html` — hub linking to all four flows below, with a short "what
  this is / what it's for / what it isn't" explainer above the links.
- `index.html` — the solo reflection.
- `guide.html` — the communication guide ("Working with other colours").
- `team.html` — load everyone's result files and see the team overlay.
- `guess.html` — the blind-spot (perception) exercise: guessing, then reveal.

## The four flows

### 1. Solo reflection

Landing → privacy/consent → ~30 questions → optional email capture →
results (triangle chart, interpretation, strengths, overuse risks,
communication tips, and a short "how others can work with you" section).
Anonymous by default. At the end, there's an optional "Save result file"
step for anyone contributing to a team exercise.

### 2. Communication guide ("Working with other colours")

`guide.html` is reachable directly from the home page — it doesn't require
completing the full solo reflection first. It offers three ways to tell it
your own starting point:

- **Pick your result directly**, from seven swatch-labelled buttons;
- **Place yourself on the interactive triangle** (the same draggable
  triangle used by the blind-spot exercise), with a live readout of the
  category your position currently resolves to;
- **Upload a previously-saved `result-*.json` file** (the same file the
  solo reflection and team overlay use).

Once resolved, it shows a card for each of the other six results plus a
card for meeting someone who shares your own result — seven in total, each
with a "best approach", "what you bring", "watch for", and a one-line
reminder. This is a *directional* guide (framed from your own result's
perspective, not a generic one-size-fits-all blurb), inspired by the
structure of a "my style × their style" communication matrix. See
`CONTENT.commsGuide` below for how the content is put together. Has its
own "Download as PDF" export.

### 3. Team overlay

Each person completes the solo reflection on their own device and saves
their result file. Once those files are collected in one shared folder,
anyone opens `team.html`, selects all of them at once, and sees:

- everyone plotted as a labelled marker on one triangle, plus a "team
  average" marker and a full accessible data table underneath;
- a **"Team takeaways"** section — a handful of auto-generated
  observations about the loaded group: which driver is most common (and
  the collective overuse risk that goes with it), whether any driver has
  nobody representing it, and a small-sample caveat when fewer than three
  files are loaded. These are assembled from the group's actual primary
  drivers plus the same per-category reference text used elsewhere in the
  tool — nothing here is bespoke commentary about named individuals;
- a **"How the styles communicate"** matrix — a fixed 3×3 reference table
  (every primary driver against every other, including itself) built from
  `CONTENT.pairDynamics`. It always shows all nine combinations, even with
  no files loaded, so it's useful as a standalone reference; whichever
  combinations are actually present in the loaded group get a small
  badge (a person/pair count) rather than the table changing shape.

Both sections, plus the chart and data table, are included in this page's
"Download as PDF" export.

This is **named, not anonymous** — the privacy note on this page says so
explicitly, and it's worth confirming your team is comfortable with that
before collecting files.

### 4. Blind-spot (perception) exercise

On `guess.html`, one section lets each person privately guess — by
dragging a point on an interactive triangle — where they think *they* sit,
then where they think *every other named teammate* sits. At the end they
save a small guesses file (e.g. `guesses-alice.json`) the same way as a
result file.

Nobody needs a PIN or code to keep guesses hidden: the act of collecting
files into a shared folder *is* the gate, since nobody can see anyone
else's guesses until someone deliberately loads all the guesses-and-result
files together on the second section of this page ("Reveal"). Once loaded,
it shows, per person: their actual result (solid marker) plus every guess
made about them, including their own self-guess.

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

The home page's banner (`.mvs-hero-band` in `home.html`) is a deliberate
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
earlier version of this page. The four icon colours
(`--tool-reflection` / `--tool-guide` / `--tool-team` / `--tool-blindspot`)
are deliberately varied rather than brand purple/green throughout, so each
tile reads as a distinct app at a glance — the same idea as the varied
icon colours on ebi's own app tiles. The icons themselves are small
hand-drawn inline SVGs (`ICONS` in `home.html`), not a reproduction of
ebi's own icon set, which this app doesn't have access to.

Chart colours (`--series-people` / `--series-performance` / `--series-process`)
are intentionally a separate system from the brand accent colours above —
they're contrast- and colour-vision-deficiency-checked for the triangle
chart, so they stay as they are regardless of brand palette changes.

## Editing content (questions, results copy, all screen text)

Everything editorial lives in **`js/content.js`**:

- `CONTENT.questions` — the ~30 forced-choice questions. Each needs
  exactly 3 options, each option a `text` and a `dimension` of
  `"people"`, `"performance"` or `"process"`.
- `CONTENT.categoryContent` — the write-up for each of the 7 result
  categories: `interpretation`, `strengths`, `overuseRisks`,
  `overuseArrows` (a short "strength → overuse" quick-scan pair),
  `communicationTips`, `quickReference` (a compact "focus on / avoid"
  callout), and `howOthersCanWork`.
- `CONTENT.pairDynamics` — the six "working together" notes behind the
  team overlay's communication matrix (three cross-style pairs, three
  same-style pairs — every cell in that 3×3 matrix maps to one of these).
- `CONTENT.team` — besides the team-overlay screen copy, this holds the
  wording templates for the auto-generated "Team takeaways" section
  (`analysisDominant`, `analysisGap`, etc. — small functions filled in
  with whichever driver/count/category text applies to the group
  actually loaded) and the "How the styles communicate" matrix heading
  and badge text.
- `CONTENT.workingWithGuide` — the "quick guide to working with different
  results" shown near the bottom of the solo results page (and included
  in its PDF export): one entry per category — the three primary corners,
  the three midpoint blends, and the balanced/situational centre — each
  with a short `tagline` and a handful of practical `tips` for working
  with someone whose result leans that way. The results page always shows
  the other six, leaving out whichever one matches the reader's own
  result.
- `CONTENT.commsGuide` — powers `guide.html` ("Working with other
  colours"). The one genuinely bespoke piece is `reminders[me][them]`, a
  49-entry (7×7) grid of short, original one-line reminders written
  specifically for each ordered pair (e.g. `reminders.performance_led.people_led`
  is the reminder shown when a Performance-led reader is looking at the
  People-led card). Everything else shown on a card — "best approach",
  "what you bring", "watch for" — is composed at render time (in
  `js/guide.js`) from the `approachTemplate` / `strengthTemplate` /
  `watchForTemplate` functions here, filled in with fields already defined
  on `CONTENT.categoryContent` (`quickReference`, `strengths`,
  `overuseRisks`) rather than duplicating that text a second time.
- `CONTENT.categoryOrder` — the canonical 7-category display order, shared
  by `app.js` (solo results' working-with-different-results guide) and
  `js/guide.js`, so both stay in sync from one place.
- `CONTENT.home` — the home page's intro, the "what this is / what it's
  for / what it isn't" explainer text, and the `cards` array (title, body,
  link, CTA label, and an `accent` key used to colour each card's left
  edge to match the tool it links to).
- `CONTENT.privacy`, `CONTENT.emailCapture`, `CONTENT.team`,
  `CONTENT.guessExercise` — every other screen's copy, including the
  GDPR-style privacy notices.

The app ships with 30 questions (10 per dimension); you can go anywhere in
the 24–36 range, just keep the three dimensions roughly balanced.

## How scoring works (`js/scoring.js`)

An original, transparent points model — not a reproduction of any
third-party scoring algorithm:

1. Every answer gives 1 point to whichever dimension it's tagged with.
2. Points convert to a percentage split that always sums to 100
   (largest-remainder rounding).
3. The gap between the top and 2nd score, and 2nd and 3rd, decides the
   category: a clear "-led" result if the top score is ≥20 points clear
   of 2nd; otherwise a two-way blend if 2nd is ≥15 points clear of 3rd;
   otherwise "Balanced / situational blend". Both thresholds are plain
   constants at the top of `scoring.js`.

## The charts (`js/chart.js`)

All chart variants share the same original triangle geometry — **not** a
reproduction of any commercial assessment's triangle graphic — with People
at the top vertex, Performance at bottom-left, Process at bottom-right:

- **Colour mapping**: People = blue, Performance = red, Process = green
  (validated for contrast and colour-vision-deficiency separation with the
  dataviz palette validator — see `CHART_COLORS` in `chart.js`).
- **Colour wash**: every triangle is filled with a soft RGB-style wash —
  each vertex's colour at full strength in its corner, fading inward, and
  blending toward a pale near-white where all three overlap near the
  centre (`drawTriangleColorWash` in `chart.js`, shared by all four chart
  functions below). It's built from three SVG radial gradients composited
  with the "screen" blend mode — the same maths as mixing red/green/blue
  light — clipped to the triangle shape; an original wash using our own
  geometry and colours, not a reproduction of any third-party graphic. It
  always renders in its own light wash regardless of the app's light/dark
  theme, the same way a printed chart would, so markers/labels near it use
  fixed, theme-independent tones rather than the usual `var(--text-*)`
  tokens — see the comments in both `chart.js` and the relevant rules in
  `styles.css` if you're customising colours.
- `renderResultsChart` — one person's result: triangle + marker, plus an
  accessible labelled bar/legend underneath.
- `renderOverlayChart` — many people's real results on one triangle: each
  as a small circle labelled with initials, a dashed "team average" ring,
  and a full data table below (name + exact percentages) as the accessible
  fallback.
- `createInteractiveTriangle` — a draggable input (click, or touch-drag on
  mobile) used by the blind-spot guessing UI. Converts the tapped point
  back into a People/Performance/Process percentage split via inverse
  barycentric coordinates.
- `renderPerceptionChart` — the blind-spot reveal: one person's actual
  result (solid ring+dot, labelled "Actual") plus every guess made about
  them (small dashed numbered circles), with a matching table.

## File formats

Two small JSON file types are exchanged between people, always downloaded
by the app itself and never handwritten:

- **Result file** (`result-<name>.json`): `{ type: "wow-result", name,
  percentages: { people, performance, process }, category, exportedAt }`.
- **Guesses file** (`guesses-<name>.json`): `{ type: "wow-guesses",
  guesser, guesses: [{ target, percentages }], exportedAt }`.

`team.html` and the reveal section of `guess.html` both check the `type`
field and skip (with an on-screen warning) any file that doesn't look
right, rather than failing silently.

## PDF export

Four pages have a "Download as PDF" button — the solo results page, the
communication guide (once a starting point is set), the team overlay
(once at least one result file is loaded), and the blind-spot reveal (once
it's showing revealed results). All four call the browser's own
`window.print()`, styled by a dedicated `@media print` block in
`css/styles.css` — choosing "Save as PDF" as the destination in the print
dialog produces the file. Each button only ever prints the
results/guide/overlay/reveal content itself: file pickers, warnings, nav
links, method selectors and the guess-entry tool are all hidden for print
via a shared
`.mvs-print-hide` class.

An earlier version of this button used
[html2pdf.js](https://github.com/eKoopmans/html2pdf.js) (a canvas-based
screenshot-to-PDF library) loaded from a CDN. That approach turned out to
be unreliable in practice: depending on the browser window's width and
scroll position when the button was clicked, it could produce a blank
leading page, fail to render the SVG triangle chart at all, crop content
that ran wider than its internal assumptions, and slice a paragraph in
half across a page break. Handing the job to the browser's native print
engine avoids all of that, since it lays the page out for real instead of
rasterising a screenshot of it — and it also means PDF export no longer
depends on an external CDN being reachable at all.

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
different results" guide's balanced/situational card was silently
disappearing from the results PDF depending on where its grid row
happened to land. Plain block flow and real `<table>` layout both
fragment correctly, so the fix was to force `.mvs-wwd-grid` and
`.mvs-result-summary-grid` to `display: block` under `@media print`
(cards get a `margin-bottom` there instead of `gap`), and to build the
newer communication matrix (below) as an actual `<table>` from the
start rather than a grid. If you add another card grid to a page that's
included in a PDF export, either give it the same print-time
`display: block` override or use a `<table>`, and test the actual PDF
output (via a full print, not just eyeballing the on-screen page) —
`break-inside: avoid` inside a grid container doesn't rescue it.

## Data storage

There is no central data store. Each person's browser only ever holds
their own answers for the length of their own session. The one piece of
local persistence is `js/aggregate.js`, which writes an anonymised
`{ timestamp, percentages, category }` record (no name, email, or file
contents) into that browser's own `localStorage`, to support a future
"how does this compare to everyone else" aggregate view. See that file's
comments for how to wire it to a real analytics endpoint later if useful.

Result files and guesses files only exist as files people choose to save
and share — there's nothing to back up or wipe centrally, and deleting the
files from the shared folder after a workshop removes all record of that
session.

## Email capture

Still a **UI-only stub** — it validates input and shows a message, but
doesn't send or store anything (see `renderEmailCapture` in `js/app.js`).
Wire the submit handler to your own email/CRM service before relying on
it.

## Admin editing

Editing content means editing `js/content.js` directly — there's no
login-gated admin UI for copy, and none is needed since there's no server
to log into.

## Privacy notes (read before using this with real teams)

- **The solo reflection is anonymous by default.** Nothing leaves the
  person's browser unless they explicitly choose to save a result file for
  a team exercise.
- **The team overlay and blind-spot exercise are named, not anonymous, by
  design** — that's the point of the exercise. Anyone who receives the
  shared folder of result/guesses files can see everyone's name alongside
  their result. Make sure your team is comfortable with that before
  collecting files, and see `CONTENT.team.privacyNote` for the wording
  shown on-screen.
- **There's no login or access control on the shared folder** — that's
  managed entirely by whatever folder-sharing tool your team already uses
  (OneDrive, Dropbox, etc.), not by this app. Treat the files the same way
  you'd treat any other document containing named personal reflections.

## Future phase (not built here)

The brief's second phase — a separate section on behaviour under
conflict/pressure (accommodate / push / withdraw / analyse / seek
compromise) — is intentionally not included in this build. It's a distinct
instrument from the motivation reflection above and should ship as its own
section later.

## IP notes

This tool is an original implementation "inspired by similar concepts" to
commercial motivational-style assessments (like the SDI), but it does not
use SDI/Crucial Learning's wording, questions, scoring algorithm, report
text, proprietary category names, or triangle graphic — including the
overlay and blind-spot triangles, which use an original colour scheme and
layout. The "working together" pair notes and the strength/overuse and
focus/avoid quick-reference snippets are similarly original wording,
loosely inspired by the general, widely-used idea that motivational styles
combine predictably in pairs — not copied from any single source. If you
plan to publish this externally, keep the same discipline when editing
content: write your own wording, don't reference "MVS" or "SDI" in any
user-facing copy, and keep the visual designs here rather than recreating
a seven-region triangle graphic.
