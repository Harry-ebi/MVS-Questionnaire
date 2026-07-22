/**
 * content.js
 * -----------------------------------------------------------------------
 * ALL editable copy for the questionnaire lives in this one file:
 *   - the 30 questions and their three options
 *   - the copy shown on the landing page
 *   - the privacy / consent wording
 *   - the write-up shown for each dimension and pattern combination
 *
 * Anyone comfortable editing a JS/JSON-like file can update the wording
 * here without touching any other file. Each question option must keep
 * its `dimension` field set to one of "drive", "connection" or
 * "clarity" — that field is what drives scoring. Results are no longer
 * looked up from a fixed set of named categories: every result is a
 * continuous score across the three dimensions, described using a
 * "pattern" (Focused / Dual-led / Balanced — see js/scoring.js) plus
 * whichever dimension(s) that pattern points to. See README.md for
 * full editing instructions, and for the notes on why this tool avoids
 * any resemblance to commercial products in this space.
 * -----------------------------------------------------------------------
 */

const CONTENT = {

  meta: {
    toolName: "Conversa — Better workplace communication",
    shortName: "Conversa",
    estimatedMinutes: "5–8 minutes",
  },

  // Canonical display order for the three dimensions, shared by every
  // screen that lists all of them (solo results' "working with different
  // priorities" guide, the guidance generator, and anywhere else that
  // needs a consistent order rather than each file defining its own).
  dimensionOrder: ["drive", "connection", "clarity"],

  home: {
    title: "Conversa",
    intro:
      "Better workplace communication. Conversa helps you and your team understand your communication preferences and work together more effectively — no accounts, no installs, nothing to set up.",
    whatHeading: "What this is",
    whatBody:
      "Conversa is a communication tool for individuals and teams. It starts by helping you understand how you naturally communicate across three broad areas — Drive, Connection and Clarity — then turns that into practical, plain-English guidance for better conversations, plus a couple of ways to explore how a team communicates together.",
    useHeading: "What it's for",
    useBody:
      "Use it to understand your own communication style, to see how a team's communication preferences fit together, or to run a light, low-pressure workshop on how well colleagues read each other. Every result is a starting point for a better conversation, not a verdict — most people draw on all three areas rather than sitting neatly in one box, and the balance shifts with role, team and circumstance.",
    notHeading: "What it isn't",
    notBody:
      "Conversa is a practical communication tool, not a clinical or diagnostic one. It isn't affiliated with, endorsed by, or based on any commercial test, and it isn't designed or intended for hiring decisions, performance ratings, or any formal HR process — it's here to help people communicate more effectively, and every screen reflects that.",
    cardsHeading: "My apps",
    // Order matters here: communication profile is the primary/most-used tool
    // (rendered as the larger, featured tile), then team insights, then
    // the perception check. The communication guide isn't in this
    // list at all — it's a different kind of thing (an anytime reference
    // guide, not a run-through-once workflow), so it gets its own
    // separately-styled banner via CONTENT.home.guideCard instead of
    // living in this tile grid alongside the other three.
    cards: [
      {
        title: "Communication profile",
        body: "Discover how you naturally communicate — a quick 5–8 minute step, just for you. Start here.",
        href: "reflection.html",
        cta: "Discover your profile",
        accent: "reflection",
        icon: "reflection",
      },
      {
        title: "Team insights",
        body: "See how your team's communication preferences fit together on a single view.",
        href: "team.html",
        cta: "Open team insights",
        accent: "team",
        icon: "team",
      },
      {
        title: "Perception check",
        body: "Guess how your teammates communicate, then compare with reality — a quick way to surface assumptions.",
        href: "guess.html",
        cta: "Start a perception check",
        accent: "blindspot",
        icon: "blindspot",
      },
    ],
    guideCard: {
      tag: "Reference guide — usable anytime",
      title: "Communicating across different priorities",
      body: "Not a one-off exercise like the tools above — a practical guide to communicating with someone whose priorities lean differently from your own, from any starting point (pick your style, place yourself on the chart, or load a saved file).",
      href: "guide.html",
      cta: "Open the guide",
      icon: "guide",
    },
    adminLinkLabel: "Admin: view all submissions",
    adminLinkShort: "Admin",
    adminLinkHref: "admin.html",
  },

  /**
   * ------------------------------------------------------------------
   * Admin: all submissions
   * ------------------------------------------------------------------
   * Sign-in here is a REAL login, checked by Supabase's own Auth service
   * (see js/supabaseClient.js and js/admin.js) — not the old passphrase
   * that used to be checked by this site's own JavaScript. The admin
   * account itself is created in the Supabase dashboard (Authentication
   * > Users), not anywhere in this codebase, so there's nothing sensitive
   * to protect in this file any more.
   * ------------------------------------------------------------------
   */
  admin: {
    pageTitle: "Admin: all submissions",
    intro:
      "Every result anyone has saved — across every team code — shown together as a table. Sign in with the admin account set up in Supabase to see it.",
    summary: {
      heading: "Usage summary",
      scopeAll: "across all team codes",
      scopeTeam: (code) => `for team code “${code}”`,
      empty: "No submissions yet — this fills in as people complete the tool.",
      tileEveryday: "Communication profiles",
      tilePressure: "Under-pressure add-ons",
      tilePeople: "People",
      tileTeams: "Teams",
      lastActivity: (when) => `Most recent activity: ${when}`,
      byDayHeading: "Completions by day",
      byDayNote: (n) => `Showing the last ${n} day${n === 1 ? "" : "s"} with activity.`,
      priorityHeading: "Leading priority (communication profiles)",
      priorityNote: "Which area each person's everyday result leans toward most.",
    },
    internalUseNotice:
      "For internal use only. This tool is an educational communication aid, not a diagnostic tool — please don't use anything in this table to make hiring, promotion, performance or disciplinary decisions, and don't forward it outside the people directly involved without their knowledge.",
    loginHeading: "Admin sign-in",
    loginBody: "Sign in with the admin email and password set up for this tool.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    loginCta: "Sign in",
    loginError: "That email or password wasn't right — double-check them and try again.",
    sessionExpiredNotice: "Your admin sign-in has expired — please sign in again.",
    signOutCta: "Sign out",
    loadHeading: "Import older result files (optional)",
    loadIntro:
      "Submissions saved before the database was set up won't be in the table above automatically — load their result-*.json files here to add them in.",
    loadButtonLabel: "Choose result files…",
    loadHint: "Select all the result-*.json files at once (hold Ctrl/Cmd to multi-select).",
    invalidFileNote: (fileName) => `Skipped "${fileName}" — it doesn't look like a Conversa result file.`,
    tableHeading: "Submissions",
    tableEmpty: "No submissions yet.",
    tableLoadError: "Couldn't reach the shared database just now — try refreshing the page in a moment.",
    tableCountLabel: (n) => `${n} submission${n === 1 ? "" : "s"}`,
    colName: "Name",
    colResult: "Result",
    colDrive: "Drive",
    colConnection: "Connection",
    colClarity: "Clarity",
    colTeamCode: "Team code",
    colSubmitted: "Submitted",
    colType: "Type",
    colShift: "Degree of change",
    typeEveryday: "Everyday Communication",
    typePressure: "Communication Under Pressure",
    shiftNone: "—",
    colDelete: "",
    exportCsvCta: "Download as CSV",
    exportCta: "Download as PDF",
    exportNote: "This opens your browser's print dialog — choose “Save as PDF” as the destination.",
    filterHeading: "Filter by team code",
    filterLabel: "Team code",
    filterPlaceholder: "e.g. ATLAS7 — leave blank to show everyone",
    filterNote: "Filtering also scopes what the CSV and PDF buttons below export — clear the filter to include everyone again.",
    filterCountLabel: (shown, total) => `Showing ${shown} of ${total} submission${total === 1 ? "" : "s"}.`,
    filterNoMatches: "No submissions match that team code.",
    deleteCta: "Delete",
    deleteConfirm: (name) => `Delete ${name}'s submission? This can't be undone.`,
    deleteError: "Couldn't delete that submission just now — try again in a moment.",
    deleteUnavailableNote: "Submissions imported from a file (rather than loaded from the database) can't be deleted here — there's nothing in the database for them to delete.",
  },

  team: {
    title: "Team insights",
    intro:
      "Each person completes the communication profile on their own device and enters a shared team code when asked for their name. Come back here, type that same code, and everyone who used it appears on the overlay automatically — no files to collect.",
    howItWorksHeading: "How to run this with your team",
    howItWorksSteps: [
      "Agree a short team code with your group beforehand — anything memorable, e.g. ATLAS7.",
      "Send everyone the communication profile page (index.html) and ask them to complete it, entering that code when asked for their name.",
      "Come back to this page, type the same code below, and click “Load team” — everyone who used it appears on the overlay automatically.",
      "Didn't use a team code, or prefer the old way? Everyone can still save and share a result file instead — see “Load from files” further down.",
    ],
    codeHeading: "Load your team by code",
    codeLabel: "Team code",
    codePlaceholder: "e.g. ATLAS7",
    codeCta: "Load team",
    codeEmptyError: "Type the team code your facilitator shared with you.",
    codeErrorNote:
      "Couldn't reach the shared database just now — try again in a moment, or use “Load from files” below instead.",
    codeNoResultsNote: (code) =>
      `No results found yet for team code "${code}". Double-check the code, or ask your teammates to make sure they entered it when they saved their result.`,
    loadHeading: "Or load from files instead",
    loadIntro:
      "Prefer not to use a team code, or working with older result files? Load everyone's saved result-*.json files here the same way as before.",
    loadButtonLabel: "Choose result files…",
    loadHint: "Select all the result-*.json files at once (hold Ctrl/Cmd to multi-select).",
    overlayHeading: "Team insights",
    overlayEmpty: "No results loaded yet — enter a team code above, or load result files below, to see the overlay.",
    privacyNote:
      "Everyone whose file you load here can see everyone else's name and result in this overlay, once you show it to them. Make sure your team is comfortable with that before collecting these files — nothing is shared beyond your own browser unless someone chooses to save and hand over a result file. Nothing is uploaded anywhere by this page — the files are only read inside your own browser.",
    invalidFileNote: (fileName) => `Skipped "${fileName}" — it doesn't look like a Conversa result file.`,
    analysisHeading: "Team takeaways",
    analysisIntro:
      "A few observations based on the group you've loaded — useful as conversation starters, not conclusions. For a deeper look at how any two results tend to work together, use the guidance tool from the home page instead — this section stays focused on the group as a whole.",
    analysisEmpty: "Load at least two result files to see takeaways about this group.",
    analysisSampleCaveat: (n) =>
      `Only ${n} result${n === 1 ? "" : "s"} loaded so far — treat these as early signals rather than settled patterns.`,
    analysisBreakdownHeading: "How the group breaks down",
    analysisBreakdownLine: (label, count, total) => `${label}: ${count} of ${total}`,
    analysisDominant: (label, count, total) =>
      `${label} is the clearest priority in this group — ${count} of ${total} people currently lean that way.`,
    analysisNoDominant:
      "No single priority dominates this group — primary patterns are fairly evenly spread across Drive, Connection and Clarity.",
    analysisWatchFor: (label, risk) =>
      `With ${label} as the dominant priority, the collective risk worth watching is: ${risk.charAt(0).toLowerCase()}${risk.slice(1)}`,
    analysisGap: (label, focus) =>
      `No one in this group shows ${label} as their primary priority — worth deliberately bringing in a focus on ${focus} before big decisions, since it won't come naturally from the room.`,
    analysisGapSoftened: (label, count) =>
      `No one shows ${label} as their primary priority, though it does show up as a secondary priority for ${count} people — so it's not entirely absent from the room, just not anyone's lead.`,
    analysisNoGap: "All three priorities — Drive, Connection and Clarity — are represented as someone's primary pattern in this group.",
    analysisBlendSplit: (ledCount, blendCount, total) =>
      `${ledCount} of ${total} show one clear, dominant priority; the other ${blendCount} show more of a mix across two or more areas.`,
    analysisRosterHeading: "Who's in the room",
    analysisRosterIntro: "Each person's own result, for reference alongside the takeaways above.",
    colName: "Name",
    colResult: "Result",
    colDrive: "Drive",
    colConnection: "Connection",
    colClarity: "Clarity",
    exportCta: "Download as PDF",
    exportNote: "This opens your browser's print dialog — choose “Save as PDF” as the destination.",
  },

  guessExercise: {
    title: "Perception check",
    intro:
      "Before anyone sees real results, each team member guesses where they think they and every teammate sit on the triangle. Enter the same team code your group used for the communication profile to save and reveal guesses automatically — or share files by hand the old way if you'd rather.",
    howItWorksHeading: "How to run this with your team",
    howItWorksGuessSteps: [
      "Open the “Enter your guesses” section below on your own device.",
      "Enter the team code your group used for the communication profile to load everyone's names automatically (or type them in yourself), then pick which one is you.",
      "If your group is using a team code, enter the same one used on the communication profile — this saves your guesses automatically, ready for the reveal step.",
      "Place a guess for yourself, then for every teammate, by tapping/dragging on the triangle.",
      "No team code? You can still save a guesses file at the end and add it to your shared folder, alongside everyone's real result files.",
    ],
    howItWorksRevealSteps: [
      "Once everyone has entered their guesses (and completed the communication profile) using the same team code, open the “Reveal” section below and type that code in.",
      "No team code in use? Load everyone's saved guesses files and result files at once instead.",
      "This page matches everything up by name and shows, for each person, their actual result next to everyone's guesses about them.",
    ],
    guessSectionHeading: "Enter your guesses",
    teamLookupHeading: "Load your team by code",
    teamLookupLabel: "Team code",
    teamLookupPlaceholder: "e.g. ATLAS7",
    teamLookupCta: "Load names",
    teamLookupEmptyError: "Type the team code your group used for the communication profile.",
    teamLookupErrorNote:
      "Couldn't reach the shared database just now — try again in a moment, or type the names in manually below.",
    teamLookupNoNamesNote: (code) =>
      `No names found yet for team code "${code}" — check the code, or make sure teammates have completed the communication profile with it. You can also type the names in manually below.`,
    teamLookupLoadedNote: (count, code) =>
      `Loaded ${count} ${count === 1 ? "name" : "names"} from team code "${code}". Pick which one is you, then start guessing.`,
    manualRosterHeading: "Or type the names yourself",
    rosterLabel: "Everyone taking part (one name per line, including you)",
    rosterPlaceholder: "Alice\nBob\nPriya\nSam\nJordan",
    yourNameLabel: "Which one is you?",
    guessCodeLabel: "Team code (optional)",
    guessCodePlaceholder: "e.g. ATLAS7 — leave blank to only save a file",
    startGuessingCta: "Start guessing",
    guessSelfIntro: "First, place where you think you sit:",
    guessOtherIntro: (name) => `Now place where you think ${name} sits:`,
    saveGuessCta: "Save and continue",
    allDoneHeading: "All your guesses are in",
    allDoneBody:
      "Save your guesses file below and add it to your team's shared folder, along with your real result file from the communication profile.",
    cloudSaveOkNote: (teamCode) =>
      `Your guesses have also been saved automatically under team code "${teamCode}" — they'll show up on the reveal step once results are ready, no file needed.`,
    cloudSaveFailNote:
      "Couldn't reach the shared database just now, so these guesses haven't saved automatically. The file below still has everything — hand it over the old way if this keeps happening.",
    saveGuessFileCta: "Save guesses file",
    revealSectionHeading: "Reveal: guesses vs. reality",
    revealCodeHeading: "Reveal by team code",
    revealCodeLabel: "Team code",
    revealCodePlaceholder: "e.g. ATLAS7",
    revealCodeCta: "Reveal",
    revealCodeEmptyError: "Type the team code your facilitator shared with you.",
    revealCodeErrorNote:
      "Couldn't reach the shared database just now — try again in a moment, or use the file-based option below instead.",
    revealCodeNoResultsNote: (code) =>
      `Nothing found yet for team code "${code}" — check the code, or make sure your teammates entered it when saving their guesses and results.`,
    loadFilesHeading: "Or load from files instead",
    revealIntro:
      "Prefer not to use a team code, or working with older files? Load everyone's saved guesses files and everyone's real result files (from the communication profile) here to see how perception compared to reality. This only happens in your own browser — nothing is uploaded.",
    loadGuessesLabel: "Choose guesses files…",
    loadResultsLabel: "Choose result files…",
    revealCta: "Reveal",
    revealedHeading: "Revealed: guesses vs. reality",
    revealedIntro:
      "For each person: their actual result (the solid marker, from their real communication profile) plus every guess made about them, including their own self-guess.",
    missingActualNote:
      "(No real result file loaded for this person yet — ask them to complete the communication profile and save their result file.)",
    revealExportCta: "Download as PDF",
    revealExportNote: "This opens your browser's print dialog — choose “Save as PDF” as the destination.",
  },

  landing: {
    title: "How do you naturally communicate at work?",
    intro:
      "Conversa helps you understand how you naturally communicate at work, " +
      "across three broad areas: Drive, Connection and Clarity. It takes " +
      "about 5–8 minutes.",
    disclaimer:
      "This is an educational communication tool, not a clinical or " +
      "diagnostic one. It isn't affiliated with, endorsed by, or based on " +
      "any commercial test. Your results are a starting point for better " +
      "conversations, not a fixed label, and shouldn't be used for hiring, " +
      "performance or other formal decisions about you or anyone else.",
    startCta: "Start",
  },

  privacy: {
    title: "Before you start",
    body:
      "We'd like to be clear about how your information is handled:",
    points: [
      "Your answers are used only to calculate your own result, shown to you at the end.",
      "You'll be asked for your name next, so your own result is clearly yours — no email address is ever asked for.",
      "When you reach your results, a small file with your name and result downloads to your device automatically, and your name and result are also saved to this tool's shared database at the same time — visible to whoever administers this tool for your organisation.",
      "If you enter a team code (optional, only relevant for a team exercise), your name and result also become visible — alongside your teammates' — to anyone who loads that same code on the team insights or perception check. Leave it blank if you're only doing this for yourself.",
      "We may also store an anonymised, aggregated version of results (percentage splits only, with no name or other identifying detail) separately, to help us understand overall patterns and improve this tool. Anonymised data cannot be traced back to you.",
      "You can stop at any point before submitting your answers without anything being saved.",
    ],
    consentLabel:
      "I understand this is a communication tool, not a clinical or diagnostic one, and I'm happy to continue on the basis above.",
    continueCta: "I understand, continue",
  },

  nameCapture: {
    title: "What's your name?",
    body:
      "This is so your own results page is clearly yours, and so it's ready to go if you save a result file for a team exercise later. It stays on your own device unless you choose to save or print your results.",
    label: "Your name",
    placeholder: "e.g. Alex Smith",
    errorNote: "Please type your name to continue.",
    teamCodeLabel: "Team code (optional)",
    teamCodeBody:
      "Only fill this in if a facilitator gave you one for a team exercise — it lets your result join that team's shared overlay automatically. Leave it blank for purely personal use.",
    teamCodePlaceholder: "e.g. ATLAS7 — leave blank if you don't have one",
    continueCta: "Continue",
  },

  progress: {
    questionLabel: (current, total) => `Question ${current} of ${total}`,
  },

  results: {
    headerEyebrow: (name) => (name ? `${name}'s communication profile` : "Your communication profile"),
    primaryLabel: "Primary priority",
    secondaryLabel: "Secondary priority",
    patternLabel: "Your communication style",
    chartTitle: "Your communication priorities",
    dimensionNames: {
      drive: "Drive",
      connection: "Connection",
      clarity: "Clarity",
    },
    dimensionShortDescriptions: {
      drive: "Momentum, ownership, visible progress, action",
      connection: "Trust, collaboration, inclusion, relationships",
      clarity: "Evidence, structure, fairness, sound reasoning",
    },
    // Short tag shown next to the pattern name, keyed by scoring.js's
    // PATTERN enum ("focused" | "dual" | "balanced").
    patternTag: {
      focused: "Focused",
      dual: "Dual-led",
      balanced: "Balanced",
    },
    // Builds the one-line pattern headline shown at the top of a result.
    // `p` is the object scoring.js's scoreAnswers() returns: { pattern,
    // primary, secondary }. Dimension names are looked up from
    // dimensionNames above by the caller before interpolating here, so
    // this only deals with sentence shape, not vocabulary.
    patternHeadline: {
      focused: (primaryLabel) => `Your communication is clearly ${primaryLabel}-led.`,
      dual: (primaryLabel, secondaryLabel) =>
        `Your communication is led by a combination of ${primaryLabel} and ${secondaryLabel}.`,
      balanced: () => "Your communication draws fairly evenly on all three areas.",
    },
    restartCta: "Start again",
    exportCta: "Download as PDF",
    exportNote: "This opens your browser's print dialog — choose “Save as PDF” as the destination.",
    strengthsHeading: "Communication strengths",
    overuseHeading: "Communication watch-outs",
    communicationTipsHeading: "Ways to communicate more effectively",
    howOthersCanWorkHeading: "How others can communicate with you",
    workingGuideHeading: "A quick guide to communicating across different priorities",
    workingGuideIntro: (ownLabel) =>
      `Your own communication style is ${ownLabel}. Here's a short, practical guide to communicating with colleagues whose priorities lean differently — useful in meetings, feedback conversations and delegation.`,
    saveFileHeading: "Contributing to team insights or a perception check?",
    cloudSaveOkNote: (teamCode) =>
      teamCode
        ? `Your result has also been saved automatically under team code "${teamCode}" — anyone who loads that code on the team insights or perception check will see it. No file needs to be collected or shared for that to work.`
        : "You didn't enter a team code, so this result hasn't joined any team's shared overlay — it only exists in the file below, on your own device.",
    cloudSaveFailNote:
      "Couldn't reach the shared database just now, so this result hasn't joined team insights automatically. The file below still has everything it needs — hand it over the old way (email, a shared folder) if this keeps happening.",
    saveFileAutoNote: (filename) =>
      `A result file (${filename}) has also started downloading to your device automatically — you don't need to click anything for that part. This only ever goes to your own downloads; nothing is sent anywhere by this tool.`,
    saveFileNote:
      "This file is mainly a personal backup now, and a fallback way to share your result if you didn't use a team code: email it, or put it in a shared folder. We've filled in the name you gave earlier below — change it and click the button if you'd rather save it again under a different name, or if the automatic download didn't work.",
    saveFileNamePlaceholder: "Your name",
    saveFileCta: "Save again",
    footerNote:
      "Remember: this reflects how you answered today, in this context. " +
      "Motivation can shift with role, team and circumstance — treat this as " +
      "a conversation starter, not a fixed label.",
  },

  /**
   * ------------------------------------------------------------------
   * QUESTIONS
   * ------------------------------------------------------------------
   * Each question has an id, a prompt, and exactly three options.
   * Each option has:
   *   - text: what the respondent reads
   *   - dimension: "drive" | "connection" | "clarity"
   *
   * Options are shown in a shuffled order at run time (see app.js) so
   * the "Connection" option isn't always first — you don't need to worry
   * about the order they're written in below.
   * ------------------------------------------------------------------
   */
  questions: [
    {
      id: "q01",
      prompt: "When work is going well, I feel most energised when…",
      options: [
        { text: "I am helping people succeed and grow.", dimension: "connection" },
        { text: "I am driving progress and getting results.", dimension: "drive" },
        { text: "I am creating clarity, structure or a better way of working.", dimension: "clarity" },
      ],
    },
    {
      id: "q02",
      prompt: "In a team meeting, I naturally find myself…",
      options: [
        { text: "Checking in on how people are feeling and making sure everyone's voice is heard.", dimension: "connection" },
        { text: "Pushing to agree next steps and who's doing what.", dimension: "drive" },
        { text: "Making sure the agenda, logic and facts are straight before we move on.", dimension: "clarity" },
      ],
    },
    {
      id: "q03",
      prompt: "I feel most proud of my work when…",
      options: [
        { text: "Someone tells me I made a real difference to them.", dimension: "connection" },
        { text: "I hit a target or finished something that mattered.", dimension: "drive" },
        { text: "I built something reliable, fair or well thought-through.", dimension: "clarity" },
      ],
    },
    {
      id: "q04",
      prompt: "If I could redesign my ideal workday, it would include…",
      options: [
        { text: "Plenty of time connecting with colleagues and supporting each other.", dimension: "connection" },
        { text: "A clear list of things to achieve, with visible progress by the end.", dimension: "drive" },
        { text: "Uninterrupted time to think, plan and get things right.", dimension: "clarity" },
      ],
    },
    {
      id: "q05",
      prompt: "When I give feedback to a colleague, I tend to focus on…",
      options: [
        { text: "How the situation affected them and the people around them.", dimension: "connection" },
        { text: "What needs to change to get better results, fast.", dimension: "drive" },
        { text: "Where the process or reasoning could be tightened up.", dimension: "clarity" },
      ],
    },
    {
      id: "q06",
      prompt: "A new project excites me most when…",
      options: [
        { text: "It's something we'll build together as a team.", dimension: "connection" },
        { text: "There's a clear goal and a chance to make things happen quickly.", dimension: "drive" },
        { text: "There's room to design a sound approach from the ground up.", dimension: "clarity" },
      ],
    },
    {
      id: "q07",
      prompt: "I feel most frustrated at work when…",
      options: [
        { text: "People are being excluded, unsupported or talked over.", dimension: "connection" },
        { text: "Things are moving too slowly or nothing is getting done.", dimension: "drive" },
        { text: "Decisions are made without proper thought, evidence or fairness.", dimension: "clarity" },
      ],
    },
    {
      id: "q08",
      prompt: "Colleagues would probably describe me as someone who…",
      options: [
        { text: "Makes people feel included and looked after.", dimension: "connection" },
        { text: "Gets things moving and delivers.", dimension: "drive" },
        { text: "Brings order, logic and consistency.", dimension: "clarity" },
      ],
    },
    {
      id: "q09",
      prompt: "When I'm handed a vague task, my first instinct is to…",
      options: [
        { text: "Talk to the people involved to understand what they actually need.", dimension: "connection" },
        { text: "Just get started and figure it out by doing.", dimension: "drive" },
        { text: "Map out a plan and clarify the requirements first.", dimension: "clarity" },
      ],
    },
    {
      id: "q10",
      prompt: "I feel most valued at work when…",
      options: [
        { text: "People trust me and confide in me.", dimension: "connection" },
        { text: "My results and contribution are recognised.", dimension: "drive" },
        { text: "My judgement and expertise are respected.", dimension: "clarity" },
      ],
    },
    {
      id: "q11",
      prompt: "In a disagreement about how to approach something, I usually care most about…",
      options: [
        { text: "Keeping the relationship and morale intact.", dimension: "connection" },
        { text: "Whichever option gets us to the outcome fastest.", dimension: "drive" },
        { text: "Whichever option is most logical or fair.", dimension: "clarity" },
      ],
    },
    {
      id: "q12",
      prompt: "The part of my job I'd protect from being cut is…",
      options: [
        { text: "Time spent supporting and developing others.", dimension: "connection" },
        { text: "Time spent actually producing and delivering.", dimension: "drive" },
        { text: "Time spent planning, checking and improving how we work.", dimension: "clarity" },
      ],
    },
    {
      id: "q13",
      prompt: "When onboarding a new team member, I naturally focus on…",
      options: [
        { text: "Making them feel welcome and connected.", dimension: "connection" },
        { text: "Getting them productive and contributing quickly.", dimension: "drive" },
        { text: "Making sure they understand the systems and standards properly.", dimension: "clarity" },
      ],
    },
    {
      id: "q14",
      prompt: "My idea of a successful project is one where…",
      options: [
        { text: "Everyone involved felt supported and worked well together.", dimension: "connection" },
        { text: "We hit the target, on time.", dimension: "drive" },
        { text: "It was done properly, with nothing left to chance.", dimension: "clarity" },
      ],
    },
    {
      id: "q15",
      prompt: "Under time pressure, I'm most likely to…",
      options: [
        { text: "Check in with the team to keep morale up.", dimension: "connection" },
        { text: "Cut scope and push hard to get it over the line.", dimension: "drive" },
        { text: "Slow down briefly to make sure we're not cutting corners.", dimension: "clarity" },
      ],
    },
    {
      id: "q16",
      prompt: "I get the most satisfaction from…",
      options: [
        { text: "Helping someone overcome a challenge.", dimension: "connection" },
        { text: "Crossing something big off the list.", dimension: "drive" },
        { text: "Solving a tricky, structural problem elegantly.", dimension: "clarity" },
      ],
    },
    {
      id: "q17",
      prompt: "When reading a plan someone else wrote, I instinctively check…",
      options: [
        { text: "Whether it considers how people will feel and be affected.", dimension: "connection" },
        { text: "Whether it will actually get results, and quickly.", dimension: "drive" },
        { text: "Whether the logic holds up and it's fair to everyone involved.", dimension: "clarity" },
      ],
    },
    {
      id: "q18",
      prompt: "I'd rather be known for…",
      options: [
        { text: "Being someone people can rely on for support.", dimension: "connection" },
        { text: "Being someone who gets things done.", dimension: "drive" },
        { text: "Being someone who gets things right.", dimension: "clarity" },
      ],
    },
    {
      id: "q19",
      prompt: "In brainstorming sessions, I tend to…",
      options: [
        { text: "Draw out quieter voices and build on others' ideas.", dimension: "connection" },
        { text: "Push toward a decision so we can move to action.", dimension: "drive" },
        { text: "Stress-test ideas for gaps, risks or inconsistencies.", dimension: "clarity" },
      ],
    },
    {
      id: "q20",
      prompt: "The recognition that means the most to me is…",
      options: [
        { text: "A colleague telling me I really helped them.", dimension: "connection" },
        { text: "Hitting a number or milestone publicly.", dimension: "drive" },
        { text: "Being asked for my opinion because people trust my judgement.", dimension: "clarity" },
      ],
    },
    {
      id: "q21",
      prompt: "When starting a new role, what matters most to me early on is…",
      options: [
        { text: "Building genuine relationships with the team.", dimension: "connection" },
        { text: "Making a visible impact quickly.", dimension: "drive" },
        { text: "Understanding how things work and why.", dimension: "clarity" },
      ],
    },
    {
      id: "q22",
      prompt: "I feel uncomfortable when…",
      options: [
        { text: "There's tension in the group or someone feels left out.", dimension: "connection" },
        { text: "Momentum stalls and things drift.", dimension: "drive" },
        { text: "Rules are bent or decisions look arbitrary.", dimension: "clarity" },
      ],
    },
    {
      id: "q23",
      prompt: "Given a choice of two roles paying the same, I'd pick the one that…",
      options: [
        { text: "Involves working closely with people I care about.", dimension: "connection" },
        { text: "Has ambitious targets and visible outcomes.", dimension: "drive" },
        { text: "Gives me the autonomy to do things properly, my way.", dimension: "clarity" },
      ],
    },
    {
      id: "q24",
      prompt: "When something goes wrong, my first reaction is to…",
      options: [
        { text: "Check how everyone involved is doing.", dimension: "connection" },
        { text: "Focus on fixing it and moving forward.", dimension: "drive" },
        { text: "Understand exactly why it happened.", dimension: "clarity" },
      ],
    },
    {
      id: "q25",
      prompt: "I'm most motivated by a manager who…",
      options: [
        { text: "Genuinely cares about me as a person.", dimension: "connection" },
        { text: "Sets clear, ambitious goals and gets out of the way.", dimension: "drive" },
        { text: "Is fair, consistent and explains their reasoning.", dimension: "clarity" },
      ],
    },
    {
      id: "q26",
      prompt: "At the end of a good week, I look back and think…",
      options: [
        { text: "\"I really helped people this week.\"", dimension: "connection" },
        { text: "\"I got a lot done this week.\"", dimension: "drive" },
        { text: "\"I made good, well-reasoned decisions this week.\"", dimension: "clarity" },
      ],
    },
    {
      id: "q27",
      prompt: "When planning a project, I spend the most energy on…",
      options: [
        { text: "Who's involved and how to bring them together.", dimension: "connection" },
        { text: "What we need to deliver, and by when.", dimension: "drive" },
        { text: "How the work should be structured and sequenced.", dimension: "clarity" },
      ],
    },
    {
      id: "q28",
      prompt: "I'm quickest to speak up when…",
      options: [
        { text: "Someone isn't being treated fairly by the group.", dimension: "connection" },
        { text: "We're wasting time instead of making progress.", dimension: "drive" },
        { text: "Something doesn't add up logically.", dimension: "clarity" },
      ],
    },
    {
      id: "q29",
      prompt: "Left entirely to my own devices, I would probably…",
      options: [
        { text: "Spend time strengthening relationships with colleagues.", dimension: "connection" },
        { text: "Chase down the next tangible win.", dimension: "drive" },
        { text: "Tidy up or improve a system nobody else has gotten to.", dimension: "clarity" },
      ],
    },
    {
      id: "q30",
      prompt: "The compliment that would mean the most to me is…",
      options: [
        { text: "\"People really trust you.\"", dimension: "connection" },
        { text: "\"You get things done.\"", dimension: "drive" },
        { text: "\"You always think it through properly.\"", dimension: "clarity" },
      ],
    },
  ],

  /**
   * ------------------------------------------------------------------
   * PRIORITIES UNDER PRESSURE (optional add-on)
   * ------------------------------------------------------------------
   * An optional, separate continuation offered after the Everyday
   * Priorities results screen. It measures how the same three
   * priorities — Drive, Connection, Clarity — change when disagreement,
   * opposition or frustration continues despite someone's normal
   * approach.
   *
   * This is original content, written for this product. It is not a
   * reproduction of any commercial product's questions, scoring or
   * report text — see README.md for the intellectual-property notes
   * this feature was built against.
   *
   * Terminology used throughout: "Everyday Communication" (the existing
   * 30-question result) vs. "Communication Under Pressure" (this new
   * result) vs. "Degree of Change" (the size of the difference between
   * the two) vs. "Priority Shift" (the visual comparing them).
   * Deliberately avoided: "explosiveness", "conflict style"/"conflict
   * type", clinical language.
   * ------------------------------------------------------------------
   */

  // Banner shown on the Everyday Communication results screen, offering the
  // continuation. Entirely optional — declining it changes nothing
  // about the Everyday result already shown.
  pressureOffer: {
    eyebrow: "Part 2 of your profile",
    heading: "Now see how this shifts under pressure",
    body:
      "The result above is your everyday working priorities. Part 2 takes that further: 18 more questions on how your priorities change when disagreement or frustration continues, plotted alongside the result above so you can see the shift. Most people find this the more revealing half — it takes about 5–7 minutes.",
    cta: "Continue to Part 2",
    skipNote: "Optional — your Everyday Communication result above is already complete and saved either way, so there's no pressure to continue right now.",
  },

  // Transition screen shown before the pressure questions start,
  // followed by the answering instructions.
  pressureIntro: {
    heading: "Now consider how you respond when difficulties continue",
    paragraphs: [
      "The next questions concern situations where disagreement, frustration or opposition remains unresolved — where your usual approach hasn't settled things.",
      "Your priorities in these circumstances may be different from your everyday communication. That's normal. Answer according to what you genuinely tend to do, not what you think the ideal response would be.",
      "There's no good or bad result here. The purpose is to understand which priorities become most important to you when working relationships are under strain.",
    ],
    instructionsHeading: "How to answer",
    instructions: [
      "Each question describes a workplace situation and three possible responses.",
      "Rank all three from most like you to least like you — every question needs a full ranking, with no ties.",
      "You can change your ranking, or go back to an earlier question, at any point before you finish.",
    ],
    rankLabels: {
      most: "Most like me",
      next: "Next most like me",
      least: "Least like me",
    },
    startCta: "Begin Communication Under Pressure",
    backToResultsLink: "← Back to your Everyday Communication result",
  },

  pressureProgress: {
    partLabel: "Part 2 of 2: Communication under pressure",
    questionLabel: (current, total) => `Question ${current} of ${total}`,
    rankPrompt: "Rank these three responses from most like you to least like you.",
    tapToRankHint: "Tap in order: most like you first, least like you last.",
    incompleteError: "Please rank all three responses before continuing.",
    clearCta: "Clear my ranking",
  },

  /**
   * ------------------------------------------------------------------
   * PRESSURE QUESTIONS
   * ------------------------------------------------------------------
   * 18 questions, each with exactly three options (one per dimension).
   * Unlike the Everyday questions above, respondents rank all three
   * options (most/next/least like me = 2/1/0 points) rather than
   * picking just one — see js/pressure.js for the ranking UI and
   * js/scoring.js's tallyPressureAnswers() for how that's scored.
   * Options are shown in a shuffled order at run time, same as above.
   * ------------------------------------------------------------------
   */
  pressureQuestions: [
    {
      id: "p01",
      prompt: "A colleague continues to challenge a decision you believe needs to be made. What are you most likely to focus on?",
      options: [
        { text: "Reaching a clear decision and moving the work forward.", dimension: "drive" },
        { text: "Understanding their concerns and finding an outcome they can support.", dimension: "connection" },
        { text: "Testing the decision against the evidence and agreed criteria.", dimension: "clarity" },
      ],
    },
    {
      id: "p02",
      prompt: "A discussion has gone around in circles and no progress is being made. What do you tend to do?",
      options: [
        { text: "Bring the discussion to a conclusion and assign the next actions.", dimension: "drive" },
        { text: "Check what remains unresolved for the people involved.", dimension: "connection" },
        { text: "Restate the issue and work through it in a more structured way.", dimension: "clarity" },
      ],
    },
    {
      id: "p03",
      prompt: "Someone has not delivered something important that they committed to. What matters most to you initially?",
      options: [
        { text: "Recovering the position and ensuring the required result is delivered.", dimension: "drive" },
        { text: "Understanding what happened before deciding how to respond.", dimension: "connection" },
        { text: "Identifying where the plan, controls or responsibilities broke down.", dimension: "clarity" },
      ],
    },
    {
      id: "p04",
      prompt: "Your recommendation is rejected without an explanation you consider adequate. What are you most likely to do?",
      options: [
        { text: "Challenge the decision directly and argue for the better outcome.", dimension: "drive" },
        { text: "Speak with those involved to understand their concerns and rebuild support.", dimension: "connection" },
        { text: "Request the rationale, evidence and decision criteria.", dimension: "clarity" },
      ],
    },
    {
      id: "p05",
      prompt: "Two colleagues are in a disagreement that is affecting the wider team. Where does your attention go?",
      options: [
        { text: "Stopping the disagreement from disrupting delivery.", dimension: "drive" },
        { text: "Repairing the relationship and ensuring both people feel heard.", dimension: "connection" },
        { text: "Establishing the facts and agreeing a fair way to resolve the issue.", dimension: "clarity" },
      ],
    },
    {
      id: "p06",
      prompt: "A project is falling behind and the team disagrees about what to do next. What do you prioritise?",
      options: [
        { text: "Selecting a course of action quickly and recovering the timetable.", dimension: "drive" },
        { text: "Creating enough agreement that the team can move forward together.", dimension: "connection" },
        { text: "Reviewing the causes and producing a realistic revised plan.", dimension: "clarity" },
      ],
    },
    {
      id: "p07",
      prompt: "Someone criticises your work in a meeting. What response is most natural to you?",
      options: [
        { text: "Address the criticism directly and defend the outcome where necessary.", dimension: "drive" },
        { text: "Consider what has led them to raise it in that way and seek a constructive conversation.", dimension: "connection" },
        { text: "Ask for specific examples and examine whether the criticism is supported.", dimension: "clarity" },
      ],
    },
    {
      id: "p08",
      prompt: "A colleague repeatedly avoids giving you a clear answer. What do you tend to do?",
      options: [
        { text: "Ask for a direct answer and set a deadline for it.", dimension: "drive" },
        { text: "Explore whether something is preventing them from speaking openly.", dimension: "connection" },
        { text: "Clarify exactly what information or decision is required from them.", dimension: "clarity" },
      ],
    },
    {
      id: "p09",
      prompt: "A decision has caused a negative reaction across the team. What do you focus on?",
      options: [
        { text: "Holding the direction where it remains necessary and keeping delivery on track.", dimension: "drive" },
        { text: "Understanding the reaction and addressing its impact on trust and morale.", dimension: "connection" },
        { text: "Reviewing whether the decision and its implementation were properly considered.", dimension: "clarity" },
      ],
    },
    {
      id: "p10",
      prompt: "You believe someone is making an issue unnecessarily complicated. What are you most likely to do?",
      options: [
        { text: "Reduce it to the key decision and press for action.", dimension: "drive" },
        { text: "Ask what concerns are making the issue difficult for them.", dimension: "connection" },
        { text: "Separate the facts, assumptions and unresolved questions.", dimension: "clarity" },
      ],
    },
    {
      id: "p11",
      prompt: "A meeting becomes tense and participants begin talking over one another. What do you naturally try to restore?",
      options: [
        { text: "Direction and control.", dimension: "drive" },
        { text: "Respectful dialogue and participation.", dimension: "connection" },
        { text: "Order, clarity and a rational discussion.", dimension: "clarity" },
      ],
    },
    {
      id: "p12",
      prompt: "You are asked to support a decision you have significant reservations about. What do you tend to do?",
      options: [
        { text: "State your position clearly and push for a different decision.", dimension: "drive" },
        { text: "Discuss your concerns privately and try to preserve collective support.", dimension: "connection" },
        { text: "Document the risks and ask for the basis of the decision to be reviewed.", dimension: "clarity" },
      ],
    },
    {
      id: "p13",
      prompt: "A colleague reacts defensively when you raise a problem. What becomes most important?",
      options: [
        { text: "Ensuring the problem is still confronted and resolved.", dimension: "drive" },
        { text: "Reducing defensiveness so that a productive conversation remains possible.", dimension: "connection" },
        { text: "Keeping the discussion focused on specific facts and examples.", dimension: "clarity" },
      ],
    },
    {
      id: "p14",
      prompt: "An important issue remains unresolved after several conversations. What do you become more inclined to do?",
      options: [
        { text: "Escalate it or make the decision yourself where possible.", dimension: "drive" },
        { text: "Involve someone who can help the parties find common ground.", dimension: "connection" },
        { text: "Pause further debate until the necessary information has been assembled.", dimension: "clarity" },
      ],
    },
    {
      id: "p15",
      prompt: "A colleague continues to work in a way you consider ineffective. How are you most likely to respond?",
      options: [
        { text: "Set clearer expectations and require a change in performance.", dimension: "drive" },
        { text: "Speak with them to understand their perspective and offer support.", dimension: "connection" },
        { text: "Show where the approach is failing and agree a more reliable method.", dimension: "clarity" },
      ],
    },
    {
      id: "p16",
      prompt: "You are under pressure to make a decision before you feel the issue has been properly resolved. What do you tend to protect most strongly?",
      options: [
        { text: "The need to maintain momentum and avoid losing the opportunity.", dimension: "drive" },
        { text: "The need to retain trust and avoid leaving key people behind.", dimension: "connection" },
        { text: "The need to make a sound decision with adequate information.", dimension: "clarity" },
      ],
    },
    {
      id: "p17",
      prompt: "Someone questions your authority or responsibility for an area of work. What response is most natural?",
      options: [
        { text: "Reassert your responsibility and establish who is making the decision.", dimension: "drive" },
        { text: "Seek to understand why the relationship or responsibilities have become unclear.", dimension: "connection" },
        { text: "Refer back to the agreed roles, governance and decision rights.", dimension: "clarity" },
      ],
    },
    {
      id: "p18",
      prompt: "When a difficult working relationship has continued for some time, what do you become most likely to do?",
      options: [
        { text: "Confront the central issue and force a resolution.", dimension: "drive" },
        { text: "Make another attempt to repair the relationship and restore cooperation.", dimension: "connection" },
        { text: "Reduce contact, formalise communication and rely more heavily on evidence and procedure.", dimension: "clarity" },
      ],
    },
  ],

  /**
   * ------------------------------------------------------------------
   * PRIORITIES UNDER PRESSURE — REPORT COPY
   * ------------------------------------------------------------------
   * Copy used to assemble the "Communication Under Pressure" report.
   * Rather than one static write-up per dimension, the report is built
   * from whichever dimension increases most and whichever decreases
   * most (see js/pressure.js), so the narrative actually reflects the
   * *change*, not just the pressure result on its own. Deliberately
   * avoids "conflict type"/"conflict style" framing throughout — this
   * describes a shift in priorities, not a category of person.
   * ------------------------------------------------------------------
   */
  pressureResults: {
    headerEyebrow: (name) => (name ? `${name}'s result: Communication Under Pressure` : "Your result: Communication Under Pressure"),
    title: "Communication Under Pressure",
    subtitle: "How your priorities may change when disagreement or frustration continues.",
    everydayLabel: "Everyday Communication",
    pressureLabel: "Communication Under Pressure",
    changeLabel: "Degree of Change",
    chartTitle: "Priority Shift",
    chartLegendEveryday: "Everyday Communication",
    chartLegendPressure: "Communication Under Pressure",
    scoreTableHeading: "Your scores",
    colPriority: "Priority",
    colEveryday: "Everyday",
    colPressure: "Under pressure",
    colChange: "Change",
    changeNoChange: "No material change",
    changeBandLabels: {
      limited: "Limited change",
      noticeable: "Noticeable change",
      significant: "Significant change",
      marked: "Marked change",
    },
    changeBandDescriptions: {
      limited: "Your priorities remain relatively consistent, whether things are going smoothly or not.",
      noticeable: "There's some noticeable adaptation in what you focus on when disagreement continues.",
      significant: "Colleagues are likely to notice a material change in how you come across.",
      marked: "Your pressure response may feel substantially different from your everyday communication.",
    },
    changeIntensityWord: {
      limited: "a little",
      noticeable: "somewhat",
      significant: "noticeably",
      marked: "substantially",
    },
    // Short adjectives used in the summary paragraph's closing sentence,
    // describing how someone comes across when this dimension is the
    // one that increases most under pressure.
    increaseAdjectives: {
      drive: ["direct", "decisive", "forceful"],
      connection: ["accommodating", "supportive", "relationship-focused"],
      clarity: ["analytical", "formal", "methodical"],
    },
    headline: {
      movement: (fromLabel, toLabel) => `You move from ${fromLabel} towards ${toLabel} under pressure.`,
      sameFocusIntensifies: (label) =>
        `You remain primarily ${label}-led, but become more strongly ${label}-focused under pressure.`,
      balanced: (label) => `Your priorities remain broadly balanced, with a modest increase in ${label} focus.`,
      towardsCombination: (fromLabel, aLabel, bLabel) =>
        `You move away from ${fromLabel} towards a combination of ${aLabel} and ${bLabel}.`,
    },
    // Opening/closing clauses for the summary paragraph, keyed by
    // dimension — describes what someone prioritises day to day
    // (everyday) vs. under pressure.
    everydayFocusPhrase: {
      connection: "maintaining trust, involving others and creating a supportive environment",
      drive: "driving progress, taking ownership and pushing for visible results",
      clarity: "gathering evidence, thinking things through carefully and applying a consistent approach",
    },
    pressureFocusPhrase: {
      drive: "achieving a resolution, making a decision and restoring progress",
      connection: "repairing relationships, seeking reassurance and preserving cooperation",
      clarity: "establishing the facts, slowing down and relying on evidence or agreed procedure",
    },
    sectionHeadings: {
      whatOthersMayNotice: "What others may notice",
      whatRemainsValuable: "What remains valuable",
      risksToWatch: "Risks to watch",
      selfManagement: "Practical self-management",
      howColleaguesCanWork: "How colleagues can work with you",
      reflection: "Questions for reflection",
    },
    selfManagementClosing:
      "Once the issue is resolved, check back in on how your communication came across — it's an easy step to skip.",
    changeAwarenessRisk: (bandLabel) =>
      `Because this is a ${bandLabel.toLowerCase()}, colleagues who don't expect it may misread it if you don't name it yourself.`,
    reflectionQuestions: [
      "What are the earliest signs that your priorities are changing?",
      "What does your communication become more like?",
      "What might colleagues misinterpret?",
      "What value does your pressure response bring?",
      "What part of your everyday communication should you deliberately retain?",
      "What helps you return to a constructive working relationship?",
    ],
    // Original wording — not a reproduction of any commercial
    // assessment's disclaimer text. If your organisation requires a
    // specific mandated form of words here, replace this string.
    disclaimer:
      "This result is intended to support better workplace conversations, not to diagnose or label anyone. It does not measure mental health, emotional stability, or a person's ability to manage disagreement, and it is not a clinical or diagnostic tool. It should not be used for hiring, performance, disciplinary or any other formal decision.",
    restartCta: "Start again",
    backToEverydayCta: "← Back to your Everyday Communication result",
    exportCta: "Download as PDF",
    exportNote: "This opens your browser's print dialog — choose “Save as PDF” as the destination.",
    cloudSaveOkNote: (teamCode) =>
      teamCode
        ? `This result has also been saved automatically under team code "${teamCode}".`
        : "This result has been saved to this tool's shared database.",
    cloudSaveFailNote:
      "Couldn't reach the shared database just now, so this result hasn't saved automatically. Your Everyday Communication result from earlier is unaffected.",
  },

  /**
   * Movement-specific content, keyed by the dimension that changes.
   * `increase*` content is used for whichever dimension increases most
   * under pressure (this drives most of the report); `decreaseNotice`
   * is a single sentence used for whichever dimension decreases most,
   * folded into "What others may notice" alongside the increase-
   * dimension bullets.
   */
  pressureMovement: {
    drive: {
      increaseNotice: [
        "You may become more direct and quicker to challenge things you disagree with.",
        "You may move more quickly towards a decision, rather than continuing to discuss.",
        "You may focus more on ownership, delivery and who is accountable for what.",
        "You may show less patience for repeated or circular discussion.",
      ],
      increaseValue: [
        "You help restore momentum when things have stalled.",
        "You're willing to confront problems that have been left unresolved.",
        "You establish clear direction when a team needs it most.",
        "You help protect delivery and the required result.",
      ],
      increaseRisk: [
        "You may come across as abrupt to people expecting your usual pace.",
        "You may close down discussion before others feel ready.",
        "You may overlook emotional or procedural concerns in the push for an outcome.",
        "Your directness can be experienced as more forceful than you intend.",
      ],
      increaseSelfManagement: [
        "Say plainly when you're becoming concerned about progress, rather than letting it build silently.",
        "Separate the decision that needs making from your reaction to the delay.",
        "Keep acknowledging people-related concerns, even once they're no longer your main focus.",
        "Give people a moment to respond before moving straight to the next action.",
      ],
      colleaguesGuidance:
        "When you're under pressure, colleagues should be clear, concise and ready to address the issue directly — bringing options and recommendations rather than reopening broad discussion. It also helps if they flag any relationship implications you might be at risk of overlooking.",
      decreaseNotice:
        "You may step back from pushing a preferred outcome and become less willing to force an immediate decision.",
    },
    connection: {
      increaseNotice: [
        "You may become more concerned with preserving cooperation than with resolving the issue quickly.",
        "You may seek more reassurance and check more often how others are feeling.",
        "You may invest noticeably more effort in repairing the relationship.",
        "You may try to reduce tension before addressing the substance of the issue.",
      ],
      increaseValue: [
        "You help lower hostility and keep people talking to each other.",
        "You protect trust at a point where it could easily be damaged.",
        "You draw out concerns other people haven't said out loud.",
        "You keep the door open for a constructive resolution.",
      ],
      increaseRisk: [
        "You may avoid a confrontation that genuinely needs to happen.",
        "You may accommodate too much, at the expense of a firm decision.",
        "You may delay a necessary call while trying to keep everyone comfortable.",
        "You may take the disagreement more personally than the situation warrants.",
      ],
      increaseSelfManagement: [
        "Notice when reassurance-seeking is delaying a decision that needs to be made.",
        "Separate \"keeping the peace\" from actually resolving the issue.",
        "Set yourself a point at which you'll raise the difficult point directly, rather than waiting for the right moment.",
        "Ask a trusted colleague to tell you if they think you're avoiding something.",
      ],
      colleaguesGuidance:
        "When you're under pressure, colleagues should expect you to focus more on how the situation is affecting people and relationships. It helps if they're patient, acknowledge the relationship impact explicitly, and gently keep the conversation moving towards a decision rather than assuming you'll push for one yourself.",
      decreaseNotice:
        "You may become less diplomatic and spend less time checking how a decision will land with the people affected by it.",
    },
    clarity: {
      increaseNotice: [
        "You may become noticeably more analytical and want to see the evidence before responding.",
        "You may slow the decision down until the facts are clearer.",
        "You may rely more heavily on agreed rules, procedure or precedent.",
        "You may formalise communication — more in writing, less in passing conversation.",
      ],
      increaseValue: [
        "You help prevent an impulsive or poorly-evidenced decision.",
        "You bring objectivity when a situation is otherwise running on emotion.",
        "You identify gaps or inconsistencies other people have missed.",
        "You create a resolution that can be defended and explained later.",
      ],
      increaseRisk: [
        "You may withdraw from the direct, human side of the conversation.",
        "You may come across as cold or detached at the point people want reassurance.",
        "You may over-analyse a situation that needs a faster response.",
        "You may use process as a way to avoid a difficult conversation rather than resolve it.",
      ],
      increaseSelfManagement: [
        "Say out loud that you're taking time to think it through, so it doesn't read as avoidance.",
        "Set yourself a deadline for analysis, rather than letting it extend indefinitely.",
        "Pair your evidence with an explicit acknowledgement of how people are feeling.",
        "Check whether the level of analysis actually matches how serious the issue is.",
      ],
      colleaguesGuidance:
        "When you're under pressure, colleagues should bring clear evidence and a specific ask rather than a vague or emotional appeal. It helps if they're patient with the time you need to think it through, while also gently checking in so analysis doesn't become a way of avoiding the conversation altogether.",
      decreaseNotice:
        "You may rely less on detailed analysis and become more willing to act before you have complete information.",
    },
  },

  /**
   * ------------------------------------------------------------------
   * RESULT WRITE-UPS
   * ------------------------------------------------------------------
   * Rather than a fixed set of named categories, results
   * are assembled dynamically from a continuous score and a pattern
   * description (see js/scoring.js's derivePattern): a "Focused" result
   * (one dimension clearly leads) uses `dimensionContent[primary]`
   * alone; a "Dual-led" result (two dimensions lead together) uses
   * `dualContent[pairKey]`, where pairKey is scoring.js's
   * orderedPairKey(primary, secondary) — e.g. "drive_connection"; a
   * "Balanced" result uses `balancedContent`. This keeps the *content*
   * grounded in three dimensions plus a shape descriptor, rather than
   * a rigid enumerated typology.
   *
   * Each entry has: label, interpretation, strengths, overuseRisks
   * (shown under the "When your approach goes too far" heading),
   * communicationTips, howOthersCanWork, quickReference.
   * ------------------------------------------------------------------
   */
  dimensionContent: {
    connection: {
      label: "Connection",
      interpretation:
        "Your responses suggest Connection is what leads your priorities day to day: supporting others, building relationships, and helping teams feel included and looked after. You likely do your best work when there's genuine trust with the people around you.",
      strengths: [
        "Building trust quickly and making people feel heard",
        "Reading the room and noticing when someone needs support",
        "Bringing warmth and inclusion to a team",
        "Encouraging collaboration rather than competition",
      ],
      overuseRisks: [
        "Avoiding necessary but difficult conversations to protect harmony",
        "Prioritising group comfort over hard deadlines or tough calls",
        "Taking on too much emotional labour for the team",
      ],
      communicationTips: [
        "Say plainly when you need support, not just when offering it",
        "Practice giving direct feedback, not just kind feedback",
        "It's fine to let a little short-term discomfort happen for a longer-term gain",
      ],
      howOthersCanWork: [
        "Involve them early and let them know how decisions affect people",
        "Give them space to check in with the team, not just the task",
        "Recognise their contribution to morale, not only to output",
      ],
      quickReference: {
        focus: "the impact on people, and being involved early",
        avoid: "blunt asks with no context",
      },
    },

    drive: {
      label: "Drive",
      interpretation:
        "Your responses suggest Drive is what leads your priorities day to day: action, visible progress and getting results. You likely feel at your best when there's a clear goal and momentum toward it.",
      strengths: [
        "Driving things forward and creating urgency",
        "Turning ambiguity into action",
        "Staying focused on outcomes rather than getting stuck in discussion",
        "Bringing energy and pace to a team",
      ],
      overuseRisks: [
        "Moving so fast that people or details get left behind",
        "Becoming impatient with process, caution or reflection",
        "Prioritising speed over the quality or fairness of a decision",
      ],
      communicationTips: [
        "Slow down enough to check others are still with you",
        "Ask before assuming everyone shares your sense of urgency",
        "Explain the 'why', not just the 'what', when pushing for pace",
      ],
      howOthersCanWork: [
        "Give them a clear goal and get out of their way",
        "Bring them concrete next steps rather than open-ended discussion",
        "Let them see visible progress — it keeps their energy up",
      ],
      quickReference: {
        focus: "the outcome and the next concrete step",
        avoid: "a long build-up before the point",
      },
    },

    clarity: {
      label: "Clarity",
      interpretation:
        "Your responses suggest Clarity is what leads your priorities day to day: logic, fairness, structure and sound reasoning. You likely feel at your best when there's a sound approach and time to think things through properly.",
      strengths: [
        "Bringing rigour, consistency and fairness to decisions",
        "Spotting risks, gaps or flawed logic early",
        "Building systems and structures that hold up over time",
        "Working well independently and with sustained focus",
      ],
      overuseRisks: [
        "Taking longer than the situation allows in pursuit of getting it exactly right",
        "Coming across as overly critical or detached from how others feel",
        "Resisting a change to a process even when circumstances have shifted",
      ],
      communicationTips: [
        "Share your reasoning out loud — others can't always see the logic you're following",
        "Check in on how a decision affects people, not just whether it's correct",
        "Set yourself a 'good enough' point rather than an endless refinement",
      ],
      howOthersCanWork: [
        "Give them time and information before asking for a decision",
        "Explain the reasoning behind requests, not just the request itself",
        "Respect their need for autonomy and focused, uninterrupted time",
      ],
      quickReference: {
        focus: "evidence, structure and time to think it through",
        avoid: "vague or rushed requests",
      },
    },
  },

  // "Dual-led" write-ups, keyed by scoring.js's orderedPairKey(primary,
  // secondary) — the two dimensions that lead together.
  dualContent: {
    drive_connection: {
      label: "Drive & Connection",
      interpretation:
        "Your responses suggest Drive and Connection lead together. You likely feel at your best when you're helping others succeed while also seeing clear progress — bringing energy, encouragement and momentum to a team at the same time. When progress stalls or people disengage, both halves of this pattern can feel frustrated at once.",
      strengths: [
        "Rallying a team around a shared goal",
        "Combining encouragement with a push for results",
        "Noticing both morale and momentum at the same time",
        "Making progress feel like a team win, not just a personal one",
      ],
      overuseRisks: [
        "Pushing people toward pace faster than they're ready for",
        "Reading disengagement as a lack of commitment rather than a signal to slow down",
        "Overcommitting the team to keep both people and results happy",
      ],
      communicationTips: [
        "Name the trade-off out loud when speed and people-care pull in different directions",
        "Check whether the team needs support before pushing harder for pace",
        "Celebrate progress in a way that includes everyone, not just the outcome",
      ],
      howOthersCanWork: [
        "Bring them both the goal and the people context around it",
        "Expect them to notice if the team is flagging, and to act on it",
        "Give them visible progress to point to — it keeps their energy up",
      ],
      quickReference: {
        focus: "both the goal and how the team is coping with it",
        avoid: "treating pace and people-care as competing priorities",
      },
    },

    drive_clarity: {
      label: "Drive & Clarity",
      interpretation:
        "Your responses suggest Drive and Clarity lead together. You likely feel motivated by getting things done properly: making solid progress without cutting corners. You probably value both pace and rigour, and can get frustrated when either one is missing.",
      strengths: [
        "Delivering results that are also built to last",
        "Balancing urgency with due diligence",
        "Spotting shortcuts that will cause problems later",
        "Bringing structure to fast-moving situations",
      ],
      overuseRisks: [
        "Getting stuck between wanting to move fast and wanting to get it exactly right",
        "Becoming impatient with people who need more discussion or reassurance",
        "Undervaluing the relational side of a project in favour of the plan and the outcome",
      ],
      communicationTips: [
        "Be explicit about which matters more right now: speed or thoroughness",
        "Make space for the human side of a project, not just the plan and the metrics",
        "Explain your standards so others don't read rigour as criticism",
      ],
      howOthersCanWork: [
        "Bring them a clear goal and the reasoning behind constraints",
        "Expect high standards paired with genuine drive — use both",
        "Give them ownership over how the work gets structured and delivered",
      ],
      quickReference: {
        focus: "speed or thoroughness, whichever matters more right now",
        avoid: "giving feedback without first explaining the standard behind it",
      },
    },

    connection_clarity: {
      label: "Connection & Clarity",
      interpretation:
        "Your responses suggest Connection and Clarity lead together. You likely feel motivated by getting things right in a way that's also fair and considerate of everyone involved — valuing sound thinking and inclusive decision-making in equal measure.",
      strengths: [
        "Making decisions that are both well-reasoned and well-received",
        "Bringing calm, considered judgement to group situations",
        "Ensuring processes work fairly for everyone, not just efficiently",
        "Building trust through consistency and care",
      ],
      overuseRisks: [
        "Slowing decisions down while seeking both the right answer and full agreement",
        "Struggling when a fast, imperfect call is what's actually needed",
        "Over-explaining reasoning when others just want a decision",
      ],
      communicationTips: [
        "Notice when 'good enough, now' beats 'perfect, later'",
        "Be willing to make the call even without full consensus",
        "Keep explanations concise — thoroughness doesn't have to mean length",
      ],
      howOthersCanWork: [
        "Give them time to think things through and consult where needed",
        "Involve them in decisions that affect people directly",
        "Trust their judgement on what's fair, consistent and sound",
      ],
      quickReference: {
        focus: "a fair process alongside a timely decision",
        avoid: "waiting for full consensus when the call is already clear enough",
      },
    },
  },

  balancedContent: {
    label: "Balanced",
    interpretation:
      "Your responses suggest a fairly balanced spread across Drive, Connection and Clarity. You likely flex your priorities depending on the situation, rather than leaning consistently toward one. This can make you adaptable, though it may also mean your focus shifts more visibly depending on context.",
    strengths: [
      "Adapting your approach to what a situation actually needs",
      "Bringing a broad perspective that can bridge different working styles",
      "Being equally comfortable supporting, driving or structuring work",
      "Acting as a natural translator between more single-minded colleagues",
    ],
    overuseRisks: [
      "Being harder for others to predict, since your focus shifts with context",
      "Spreading your energy across all three areas rather than one clear strength",
      "Deferring to whichever priority is loudest in the room, rather than your own view",
    ],
    communicationTips: [
      "Tell people which priority matters most to you in a given situation, since it may not be obvious",
      "Use your range deliberately — notice which mode a moment calls for",
      "Don't assume your flexibility is automatically obvious to more fixed colleagues",
    ],
    howOthersCanWork: [
      "Ask which priority matters most to them on a given piece of work",
      "Use their range to help bridge Drive-, Connection- and Clarity-led colleagues",
      "Don't assume a single fixed style — check in on what this project needs from them",
    ],
    quickReference: {
      focus: "a clear signal of which priority matters most to you right now",
      avoid: "assuming your flexibility is obvious without saying so",
    },
  },

  /**
   * ------------------------------------------------------------------
   * "Working with different priorities" guide
   * ------------------------------------------------------------------
   * Shown on the solo results page (and included in its PDF export): a
   * compact, practical reference covering the three dimensions — on how
   * to work well with a colleague whose priorities lean that way. The
   * page shows one card per dimension other than the reader's own
   * primary (generated at render time — see js/app.js — rather than a
   * separate lookup per possible pair). Original wording throughout,
   * loosely inspired by general, widely-known workplace-communication
   * ideas (lead with the point vs. lead with context, give time to
   * think vs. match pace, and so on) — not copied from any single
   * source.
   * ------------------------------------------------------------------
   */
  workingWithGuide: {
    drive: {
      tagline: "Moving fast toward a clear result",
      tips: [
        "Open with the point and the decision you need — save the background for if they ask.",
        "Give them room to own the call; hovering over small choices lands worse with them than most.",
        "Match their pace, or say plainly why you can't — silence reads as disengagement.",
        "Push back directly on their thinking; a straight \"no\" now beats a polite one later.",
      ],
    },
    connection: {
      tagline: "Protecting trust and how people are doing",
      tips: [
        "Take a moment for the relationship before the agenda — jumping straight to business can feel cold.",
        "Spell out how a decision affects people, not just what the decision is.",
        "Ask for their view directly; they'll often hold it back rather than risk friction.",
        "Recognise their contribution to morale out loud — it matters to them as much as results do.",
      ],
    },
    clarity: {
      tagline: "Protecting quality and getting it right",
      tips: [
        "Bring evidence and structure, not just urgency — a reasoned case moves them further than pressure.",
        "Give them time to think before asking for a decision; rushed, they'll default to caution.",
        "Explain the reasoning behind a request, not only the request itself.",
        "Treat a considered \"not yet\" as a real answer worth hearing out, not an obstacle.",
      ],
    },
  },

  /**
   * ------------------------------------------------------------------
   * Guidance tool ("Working with different priorities")
   * ------------------------------------------------------------------
   * Looks specifically from YOUR pattern's perspective at working with
   * someone else's. Rather than a static 7x7 matrix of pre-written pairs,
   * the actual pairwise guidance is generated at render time by
   * js/commsGuidance.js, combining the `communicationStyles` building
   * blocks below (one per dimension: how that dimension tends to
   * communicate, what it responds well to, what to watch for) with
   * gap-aware adaptation logic — so the guidance reflects the two
   * people's actual scores rather than being pulled from a fixed lookup
   * table. See js/commsGuidance.js for the generator itself.
   * ------------------------------------------------------------------
   */
  commsGuide: {
    pageTitle: "Working with different priorities",
    intro:
      "A guide to working with someone whose priorities differ from your own. Tell us your starting point one of three ways, and we'll generate guidance based on both patterns — plus what to expect meeting someone with a similar pattern to yours.",
    methodsHeading: "Tell us your starting point",
    methodPickTitle: "Pick your pattern",
    methodPickBody: "Already know your result? Choose it directly.",
    methodTriangleTitle: "Place yourself on the chart",
    methodTriangleBody: "Not sure, or want to explore? Adjust the scores and we'll work out the pattern as you go.",
    methodTriangleReadoutPrefix: "Currently reads as:",
    methodTriangleCta: "Show my guide",
    methodUploadTitle: "Upload a saved result file",
    methodUploadBody: "Used the communication profile already and saved a result-*.json file? Load it here.",
    methodUploadButtonLabel: "Choose result file…",
    methodUploadInvalid: "That doesn't look like a Conversa result file — try another, or use one of the other two options above.",
    resultHeading: (label) => `Working from a ${label} starting point`,
    sourcePick: "You told us your result directly.",
    sourceTriangle: (drive, connection, clarity) =>
      `Based on where you placed yourself (Drive ${drive}% · Connection ${connection}% · Clarity ${clarity}%).`,
    sourceUpload: (name) => `Based on the result file you loaded${name ? ` for ${name}` : ""}.`,
    changeStartCta: "Choose a different starting point",
    // Overview section — a short "what your result means" recap shown
    // before the generated guidance below. Reachable directly from the
    // home page without doing the full communication profile first, so a
    // reader might be seeing this write-up for the first time here.
    overviewHeading: "Your result, in a nutshell",
    overviewStrengthsHeading: "Strengths you bring",
    overviewWatchHeading: "Worth watching for",
    overviewApproachHeading: "How others get the best from you",
    cardsHeading: "Working with each pattern",
    cardsIntro: (label) =>
      `Here's how to approach each of the other patterns, plus what to expect meeting someone with a similar ${label} pattern to yours.`,
    selfPairLabel: (label) => `Two ${label} people`,
    approachLabel: "Best approach",
    strengthLabel: "What you bring",
    watchForLabel: "Watch for",
    reminderLabel: "One line to remember",
    approachTemplate: (focus, avoid) => [`Lead with ${focus}.`, `Steer clear of ${avoid}.`],
    strengthTemplate: (meLabel, meStrength, themFocus) =>
      `Coming from a ${meLabel} pattern yourself, your instinct here is ${meStrength.charAt(0).toLowerCase()}${meStrength.slice(
        1
      )} — worth leaning on, since they respond to ${themFocus}.`,
    watchForTemplate: (meRisk) =>
      `Your own overuse risk to keep in view here: ${meRisk.charAt(0).toLowerCase()}${meRisk.slice(1)}.`,
    exportCta: "Download as PDF",
    exportNote: "This opens your browser's print dialog — choose “Save as PDF” as the destination.",
    // Per-dimension communication building blocks, combined at render
    // time by js/commsGuidance.js rather than looked up as a static
    // pair. `opensWith` describes how this dimension tends to start a
    // conversation; `respondsTo` is what earns them fastest; `pushBack`
    // is how they tend to disagree; `underGap` is a short adaptation
    // note used when the two people's scores on this dimension differ
    // by a wide margin.
    communicationStyles: {
      drive: {
        opensWith: "the decision or outcome they need, before any background",
        respondsTo: "a clear ask and visible momentum",
        pushBack: "directly, and expects the same in return",
        underGap: "when their Drive score sits well above someone else's, slow the opening slightly and name the next concrete step explicitly",
      },
      connection: {
        opensWith: "a moment for the relationship before the agenda",
        respondsTo: "being asked directly for their view, and having it heard",
        pushBack: "gently, often holding a concern back rather than risking friction",
        underGap: "when their Connection score sits well above someone else's, spell out how a decision affects the people involved, not just what it is",
      },
      clarity: {
        opensWith: "the reasoning or evidence behind a request",
        respondsTo: "a considered case and time to think it through",
        pushBack: "by asking for the rationale, rather than stating a flat objection",
        underGap: "when their Clarity score sits well above someone else's, bring structure and evidence before urgency",
      },
    },
  },
};

// Expose for both the browser (script tag) and any future bundler/tooling.
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONTENT;
}
