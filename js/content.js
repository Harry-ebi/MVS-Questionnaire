/**
 * content.js
 * -----------------------------------------------------------------------
 * ALL editable copy for the questionnaire lives in this one file:
 *   - the 30 questions and their three options
 *   - the copy shown on the landing page
 *   - the privacy / consent wording
 *   - the write-up shown for each of the 7 possible results
 *
 * Anyone comfortable editing a JS/JSON-like file can update the wording
 * here without touching any other file. Each question option must keep
 * its `dimension` field set to one of "people", "performance" or
 * "process" — that field is what drives scoring. See README.md for
 * full editing instructions.
 * -----------------------------------------------------------------------
 */

const CONTENT = {

  meta: {
    toolName: "Ways of Working: a motivation reflection tool",
    shortName: "Ways of Working",
    estimatedMinutes: "5–8 minutes",
  },

  // Canonical display order for the 7 result categories, shared by every
  // screen that lists all of them (solo results' "working with different
  // results" guide, the communication guide, and anywhere else that needs
  // a consistent order rather than each file defining its own).
  categoryOrder: [
    "people_led",
    "performance_led",
    "process_led",
    "people_performance_blend",
    "performance_process_blend",
    "process_people_blend",
    "balanced_blend",
  ],

  home: {
    title: "Ways of Working",
    intro:
      "A short reflection tool on workplace motivation, and three ways to build on it with a team — no accounts, no installs, nothing to set up.",
    whatHeading: "What this is",
    whatBody:
      "Ways of Working is a short, original self-reflection tool built for ebi. It looks at what motivates you day to day across three broad areas — People, Performance and Process — and gives you a plain-English write-up of your own blend, plus a couple of ways to explore that alongside a team.",
    useHeading: "What it's for",
    useBody:
      "Use it to understand your own working style, to see how a team's styles sit alongside each other, or to run a light, low-pressure workshop exercise on perception versus reality. Every result is meant as a starting point for a better conversation, not a final verdict — most people show a blend of all three areas rather than sitting neatly in one box, and that blend can shift with role, team and circumstance.",
    notHeading: "What it isn't",
    notBody:
      "This is not a validated psychometric or clinical assessment, and it isn't affiliated with, endorsed by, or based on the proprietary content of any commercial personality or motivation assessment. It isn't designed or intended for hiring decisions, performance ratings, or any formal HR process — it's an educational reflection tool, and every screen in it says so.",
    cardsHeading: "My apps",
    // Order matters here: solo reflection is the primary/most-used tool
    // (rendered as the larger, featured tile), then team overlay, then
    // the blind-spot exercise. The communication guide isn't in this
    // list at all — it's a different kind of thing (an anytime reference
    // guide, not a run-through-once workflow), so it gets its own
    // separately-styled banner via CONTENT.home.guideCard instead of
    // living in this tile grid alongside the other three.
    cards: [
      {
        title: "Solo reflection",
        body: "The core 5–8 minute questionnaire, just for you. Start here.",
        href: "reflection.html",
        cta: "Start solo reflection",
        accent: "reflection",
        icon: "reflection",
      },
      {
        title: "Team overlay",
        body: "See everyone's results plotted together on one triangle.",
        href: "team.html",
        cta: "View a team overlay",
        accent: "team",
        icon: "team",
      },
      {
        title: "Blind-spot exercise",
        body: "Guess where the team sits, then compare to reality.",
        href: "guess.html",
        cta: "Start a blind-spot exercise",
        accent: "blindspot",
        icon: "blindspot",
      },
    ],
    guideCard: {
      tag: "Reference guide — usable anytime",
      title: "Working with other colours",
      body: "Not a one-off exercise like the tools above — a lookup guide for working with each result, from any starting point (pick your result, drag the triangle, or load a saved file).",
      href: "guide.html",
      cta: "Open the communication guide",
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
    loginHeading: "Admin sign-in",
    loginBody: "Sign in with the admin email and password set up for this tool.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    loginCta: "Sign in",
    loginError: "That email or password wasn't right — double-check them and try again.",
    signOutCta: "Sign out",
    loadHeading: "Import older result files (optional)",
    loadIntro:
      "Submissions saved before the database was set up won't be in the table above automatically — load their result-*.json files here to add them in.",
    loadButtonLabel: "Choose result files…",
    loadHint: "Select all the result-*.json files at once (hold Ctrl/Cmd to multi-select).",
    invalidFileNote: (fileName) => `Skipped "${fileName}" — it doesn't look like a Ways of Working result file.`,
    tableHeading: "Submissions",
    tableEmpty: "No submissions yet.",
    tableLoadError: "Couldn't reach the shared database just now — try refreshing the page in a moment.",
    tableCountLabel: (n) => `${n} submission${n === 1 ? "" : "s"}`,
    colName: "Name",
    colResult: "Result",
    colPeople: "People",
    colPerformance: "Performance",
    colProcess: "Process",
    colTeamCode: "Team code",
    colSubmitted: "Submitted",
    colType: "Type",
    colShift: "Shift",
    typeEveryday: "Everyday",
    typePressure: "Pressure",
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
    title: "Team overlay",
    intro:
      "Each person completes the solo reflection on their own device and enters a shared team code when asked for their name. Come back here, type that same code, and everyone who used it appears on the overlay automatically — no files to collect.",
    howItWorksHeading: "How to run this with your team",
    howItWorksSteps: [
      "Agree a short team code with your group beforehand — anything memorable, e.g. ATLAS7.",
      "Send everyone the solo reflection page (index.html) and ask them to complete it, entering that code when asked for their name.",
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
    overlayHeading: "Team overlay",
    overlayEmpty: "No results loaded yet — enter a team code above, or load result files below, to see the overlay.",
    privacyNote:
      "Everyone whose file you load here can see everyone else's name and result in this overlay, once you show it to them. Make sure your team is comfortable with that before collecting these files — nothing is shared beyond your own browser unless someone chooses to save and hand over a result file. Nothing is uploaded anywhere by this page — the files are only read inside your own browser.",
    invalidFileNote: (fileName) => `Skipped "${fileName}" — it doesn't look like a Ways of Working result file.`,
    analysisHeading: "Team takeaways",
    analysisIntro:
      "A few observations based on the group you've loaded — useful as conversation starters, not conclusions. For a deeper look at how any two results tend to work together, use the communication guide from the home page instead — this section stays focused on the group as a whole.",
    analysisEmpty: "Load at least two result files to see takeaways about this group.",
    analysisSampleCaveat: (n) =>
      `Only ${n} result${n === 1 ? "" : "s"} loaded so far — treat these as early signals rather than settled patterns.`,
    analysisBreakdownHeading: "How the group breaks down",
    analysisBreakdownLine: (label, count, total) => `${label}: ${count} of ${total}`,
    analysisDominant: (label, count, total) =>
      `${label} is the clearest driver in this group — ${count} of ${total} people currently lean that way.`,
    analysisNoDominant:
      "No single driver dominates this group — primary styles are fairly evenly spread across People, Performance and Process.",
    analysisWatchFor: (label, risk) =>
      `With ${label} as the dominant driver, the collective risk worth watching is: ${risk.charAt(0).toLowerCase()}${risk.slice(1)}`,
    analysisGap: (label, focus) =>
      `No one in this group shows ${label} as their primary driver — worth deliberately bringing in a focus on ${focus} before big decisions, since it won't come naturally from the room.`,
    analysisGapSoftened: (label, count) =>
      `No one shows ${label} as their primary driver, though it does show up as a secondary driver for ${count} people — so it's not entirely absent from the room, just not anyone's lead.`,
    analysisNoGap: "All three drivers — People, Performance and Process — are represented as someone's primary style in this group.",
    analysisBlendSplit: (ledCount, blendCount, total) =>
      `${ledCount} of ${total} show one clear, dominant driver; the other ${blendCount} show more of a blend across two or more areas.`,
    analysisRosterHeading: "Who's in the room",
    analysisRosterIntro: "Each person's own result, for reference alongside the takeaways above.",
    colName: "Name",
    colResult: "Result",
    colPeople: "People",
    colPerformance: "Performance",
    colProcess: "Process",
    exportCta: "Download as PDF",
    exportNote: "This opens your browser's print dialog — choose “Save as PDF” as the destination.",
  },

  guessExercise: {
    title: "Blind-spot exercise",
    intro:
      "Before anyone sees real results, each team member guesses where they think they and every teammate sit on the triangle. Enter the same team code your group used for the solo reflection to save and reveal guesses automatically — or share files by hand the old way if you'd rather.",
    howItWorksHeading: "How to run this with your team",
    howItWorksGuessSteps: [
      "Open the “Enter your guesses” section below on your own device.",
      "Type the full list of names taking part (including yourself), then pick which one is you.",
      "If your group is using a team code, enter the same one used on the solo reflection — this saves your guesses automatically, ready for the reveal step.",
      "Place a guess for yourself, then for every teammate, by tapping/dragging on the triangle.",
      "No team code? You can still save a guesses file at the end and add it to your shared folder, alongside everyone's real result files.",
    ],
    howItWorksRevealSteps: [
      "Once everyone has entered their guesses (and completed the solo reflection) using the same team code, open the “Reveal” section below and type that code in.",
      "No team code in use? Load everyone's saved guesses files and result files at once instead.",
      "This page matches everything up by name and shows, for each person, their actual result next to everyone's guesses about them.",
    ],
    guessSectionHeading: "Enter your guesses",
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
      "Save your guesses file below and add it to your team's shared folder, along with your real result file from the solo reflection.",
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
      "Prefer not to use a team code, or working with older files? Load everyone's saved guesses files and everyone's real result files (from the solo reflection) here to see how perception compared to reality. This only happens in your own browser — nothing is uploaded.",
    loadGuessesLabel: "Choose guesses files…",
    loadResultsLabel: "Choose result files…",
    revealCta: "Reveal",
    revealedHeading: "Revealed: guesses vs. reality",
    revealedIntro:
      "For each person: their actual result (the solid marker, from their real reflection) plus every guess made about them, including their own self-guess.",
    missingActualNote:
      "(No real result file loaded for this person yet — ask them to complete the solo reflection and save their result file.)",
    revealExportCta: "Download as PDF",
    revealExportNote: "This opens your browser's print dialog — choose “Save as PDF” as the destination.",
  },

  landing: {
    title: "What motivates you at work?",
    intro:
      "This short reflection tool is designed to help you think about what " +
      "energises you at work, across three broad areas: People, Performance " +
      "and Process. It takes about 5–8 minutes.",
    disclaimer:
      "This is an educational self-reflection tool, not a validated " +
      "psychometric assessment or clinical diagnosis. It is not affiliated " +
      "with, endorsed by, or based on the proprietary content of any " +
      "commercial personality or motivation assessment. Your results are a " +
      "starting point for reflection and conversation, not a fixed label.",
    startCta: "Start reflection",
  },

  privacy: {
    title: "Before you start",
    body:
      "We'd like to be clear about how your information is handled:",
    points: [
      "Your answers are used only to calculate your own result, shown to you at the end.",
      "You'll be asked for your name next, so your own result is clearly yours — no email address is ever asked for.",
      "When you reach your results, a small file with your name and result downloads to your device automatically, and your name and result are also saved to this tool's shared database at the same time — visible to whoever administers this tool for your organisation.",
      "If you enter a team code (optional, only relevant for a team exercise), your name and result also become visible — alongside your teammates' — to anyone who loads that same code on the team overlay or blind-spot exercise. Leave it blank if you're only doing this for yourself.",
      "We may also store an anonymised, aggregated version of results (percentage splits only, with no name or other identifying detail) separately, to help us understand overall patterns and improve this tool. Anonymised data cannot be traced back to you.",
      "You can stop at any point before submitting your answers without anything being saved.",
    ],
    consentLabel:
      "I understand this is a self-reflection tool, not a clinical or psychometric diagnosis, and I'm happy to continue on the basis above.",
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
      "Only fill this in if a facilitator gave you one for a team exercise — it lets your result join that team's shared overlay automatically. Leave it blank for a purely personal reflection.",
    teamCodePlaceholder: "e.g. ATLAS7 — leave blank if you don't have one",
    continueCta: "Continue",
  },

  progress: {
    questionLabel: (current, total) => `Question ${current} of ${total}`,
  },

  results: {
    headerEyebrow: (name) => (name ? `${name}'s reflection result` : "Your reflection result"),
    primaryLabel: "Primary driver",
    secondaryLabel: "Secondary driver",
    blendLabel: "Your blended profile",
    chartTitle: "Your relative weighting",
    dimensionNames: {
      people: "People",
      performance: "Performance",
      process: "Process",
    },
    dimensionShortDescriptions: {
      people: "Support, collaboration, inclusion, relationships",
      performance: "Action, progress, achievement, outcomes",
      process: "Clarity, logic, fairness, structure, independence",
    },
    restartCta: "Start again",
    exportCta: "Download as PDF",
    exportNote: "This opens your browser's print dialog — choose “Save as PDF” as the destination.",
    workingGuideHeading: "A quick guide to working with different results",
    workingGuideIntro: (ownLabel) =>
      `Your own result is ${ownLabel}. Here's a short, practical guide to working with colleagues whose results lean differently — useful in meetings, feedback conversations and delegation.`,
    saveFileHeading: "Contributing to a team overlay or blind-spot exercise?",
    cloudSaveOkNote: (teamCode) =>
      teamCode
        ? `Your result has also been saved automatically under team code "${teamCode}" — anyone who loads that code on the team overlay or blind-spot exercise will see it. No file needs to be collected or shared for that to work.`
        : "You didn't enter a team code, so this result hasn't joined any team's shared overlay — it only exists in the file below, on your own device.",
    cloudSaveFailNote:
      "Couldn't reach the shared database just now, so this result hasn't joined a team overlay automatically. The file below still has everything it needs — hand it over the old way (email, a shared folder) if this keeps happening.",
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
   *   - dimension: "people" | "performance" | "process"
   *
   * Options are shown in a shuffled order at run time (see app.js) so
   * the "People" option isn't always first — you don't need to worry
   * about the order they're written in below.
   * ------------------------------------------------------------------
   */
  questions: [
    {
      id: "q01",
      prompt: "When work is going well, I feel most energised when…",
      options: [
        { text: "I am helping people succeed and grow.", dimension: "people" },
        { text: "I am driving progress and getting results.", dimension: "performance" },
        { text: "I am creating clarity, structure or a better way of working.", dimension: "process" },
      ],
    },
    {
      id: "q02",
      prompt: "In a team meeting, I naturally find myself…",
      options: [
        { text: "Checking in on how people are feeling and making sure everyone's voice is heard.", dimension: "people" },
        { text: "Pushing to agree next steps and who's doing what.", dimension: "performance" },
        { text: "Making sure the agenda, logic and facts are straight before we move on.", dimension: "process" },
      ],
    },
    {
      id: "q03",
      prompt: "I feel most proud of my work when…",
      options: [
        { text: "Someone tells me I made a real difference to them.", dimension: "people" },
        { text: "I hit a target or finished something that mattered.", dimension: "performance" },
        { text: "I built something reliable, fair or well thought-through.", dimension: "process" },
      ],
    },
    {
      id: "q04",
      prompt: "If I could redesign my ideal workday, it would include…",
      options: [
        { text: "Plenty of time connecting with colleagues and supporting each other.", dimension: "people" },
        { text: "A clear list of things to achieve, with visible progress by the end.", dimension: "performance" },
        { text: "Uninterrupted time to think, plan and get things right.", dimension: "process" },
      ],
    },
    {
      id: "q05",
      prompt: "When I give feedback to a colleague, I tend to focus on…",
      options: [
        { text: "How the situation affected them and the people around them.", dimension: "people" },
        { text: "What needs to change to get better results, fast.", dimension: "performance" },
        { text: "Where the process or reasoning could be tightened up.", dimension: "process" },
      ],
    },
    {
      id: "q06",
      prompt: "A new project excites me most when…",
      options: [
        { text: "It's something we'll build together as a team.", dimension: "people" },
        { text: "There's a clear goal and a chance to make things happen quickly.", dimension: "performance" },
        { text: "There's room to design a sound approach from the ground up.", dimension: "process" },
      ],
    },
    {
      id: "q07",
      prompt: "I feel most frustrated at work when…",
      options: [
        { text: "People are being excluded, unsupported or talked over.", dimension: "people" },
        { text: "Things are moving too slowly or nothing is getting done.", dimension: "performance" },
        { text: "Decisions are made without proper thought, evidence or fairness.", dimension: "process" },
      ],
    },
    {
      id: "q08",
      prompt: "Colleagues would probably describe me as someone who…",
      options: [
        { text: "Makes people feel included and looked after.", dimension: "people" },
        { text: "Gets things moving and delivers.", dimension: "performance" },
        { text: "Brings order, logic and consistency.", dimension: "process" },
      ],
    },
    {
      id: "q09",
      prompt: "When I'm handed a vague task, my first instinct is to…",
      options: [
        { text: "Talk to the people involved to understand what they actually need.", dimension: "people" },
        { text: "Just get started and figure it out by doing.", dimension: "performance" },
        { text: "Map out a plan and clarify the requirements first.", dimension: "process" },
      ],
    },
    {
      id: "q10",
      prompt: "I feel most valued at work when…",
      options: [
        { text: "People trust me and confide in me.", dimension: "people" },
        { text: "My results and contribution are recognised.", dimension: "performance" },
        { text: "My judgement and expertise are respected.", dimension: "process" },
      ],
    },
    {
      id: "q11",
      prompt: "In a disagreement about how to approach something, I usually care most about…",
      options: [
        { text: "Keeping the relationship and morale intact.", dimension: "people" },
        { text: "Whichever option gets us to the outcome fastest.", dimension: "performance" },
        { text: "Whichever option is most logical or fair.", dimension: "process" },
      ],
    },
    {
      id: "q12",
      prompt: "The part of my job I'd protect from being cut is…",
      options: [
        { text: "Time spent supporting and developing others.", dimension: "people" },
        { text: "Time spent actually producing and delivering.", dimension: "performance" },
        { text: "Time spent planning, checking and improving how we work.", dimension: "process" },
      ],
    },
    {
      id: "q13",
      prompt: "When onboarding a new team member, I naturally focus on…",
      options: [
        { text: "Making them feel welcome and connected.", dimension: "people" },
        { text: "Getting them productive and contributing quickly.", dimension: "performance" },
        { text: "Making sure they understand the systems and standards properly.", dimension: "process" },
      ],
    },
    {
      id: "q14",
      prompt: "My idea of a successful project is one where…",
      options: [
        { text: "Everyone involved felt supported and worked well together.", dimension: "people" },
        { text: "We hit the target, on time.", dimension: "performance" },
        { text: "It was done properly, with nothing left to chance.", dimension: "process" },
      ],
    },
    {
      id: "q15",
      prompt: "Under time pressure, I'm most likely to…",
      options: [
        { text: "Check in with the team to keep morale up.", dimension: "people" },
        { text: "Cut scope and push hard to get it over the line.", dimension: "performance" },
        { text: "Slow down briefly to make sure we're not cutting corners.", dimension: "process" },
      ],
    },
    {
      id: "q16",
      prompt: "I get the most satisfaction from…",
      options: [
        { text: "Helping someone overcome a challenge.", dimension: "people" },
        { text: "Crossing something big off the list.", dimension: "performance" },
        { text: "Solving a tricky, structural problem elegantly.", dimension: "process" },
      ],
    },
    {
      id: "q17",
      prompt: "When reading a plan someone else wrote, I instinctively check…",
      options: [
        { text: "Whether it considers how people will feel and be affected.", dimension: "people" },
        { text: "Whether it will actually get results, and quickly.", dimension: "performance" },
        { text: "Whether the logic holds up and it's fair to everyone involved.", dimension: "process" },
      ],
    },
    {
      id: "q18",
      prompt: "I'd rather be known for…",
      options: [
        { text: "Being someone people can rely on for support.", dimension: "people" },
        { text: "Being someone who gets things done.", dimension: "performance" },
        { text: "Being someone who gets things right.", dimension: "process" },
      ],
    },
    {
      id: "q19",
      prompt: "In brainstorming sessions, I tend to…",
      options: [
        { text: "Draw out quieter voices and build on others' ideas.", dimension: "people" },
        { text: "Push toward a decision so we can move to action.", dimension: "performance" },
        { text: "Stress-test ideas for gaps, risks or inconsistencies.", dimension: "process" },
      ],
    },
    {
      id: "q20",
      prompt: "The recognition that means the most to me is…",
      options: [
        { text: "A colleague telling me I really helped them.", dimension: "people" },
        { text: "Hitting a number or milestone publicly.", dimension: "performance" },
        { text: "Being asked for my opinion because people trust my judgement.", dimension: "process" },
      ],
    },
    {
      id: "q21",
      prompt: "When starting a new role, what matters most to me early on is…",
      options: [
        { text: "Building genuine relationships with the team.", dimension: "people" },
        { text: "Making a visible impact quickly.", dimension: "performance" },
        { text: "Understanding how things work and why.", dimension: "process" },
      ],
    },
    {
      id: "q22",
      prompt: "I feel uncomfortable when…",
      options: [
        { text: "There's tension in the group or someone feels left out.", dimension: "people" },
        { text: "Momentum stalls and things drift.", dimension: "performance" },
        { text: "Rules are bent or decisions look arbitrary.", dimension: "process" },
      ],
    },
    {
      id: "q23",
      prompt: "Given a choice of two roles paying the same, I'd pick the one that…",
      options: [
        { text: "Involves working closely with people I care about.", dimension: "people" },
        { text: "Has ambitious targets and visible outcomes.", dimension: "performance" },
        { text: "Gives me the autonomy to do things properly, my way.", dimension: "process" },
      ],
    },
    {
      id: "q24",
      prompt: "When something goes wrong, my first reaction is to…",
      options: [
        { text: "Check how everyone involved is doing.", dimension: "people" },
        { text: "Focus on fixing it and moving forward.", dimension: "performance" },
        { text: "Understand exactly why it happened.", dimension: "process" },
      ],
    },
    {
      id: "q25",
      prompt: "I'm most motivated by a manager who…",
      options: [
        { text: "Genuinely cares about me as a person.", dimension: "people" },
        { text: "Sets clear, ambitious goals and gets out of the way.", dimension: "performance" },
        { text: "Is fair, consistent and explains their reasoning.", dimension: "process" },
      ],
    },
    {
      id: "q26",
      prompt: "At the end of a good week, I look back and think…",
      options: [
        { text: "\"I really helped people this week.\"", dimension: "people" },
        { text: "\"I got a lot done this week.\"", dimension: "performance" },
        { text: "\"I made good, well-reasoned decisions this week.\"", dimension: "process" },
      ],
    },
    {
      id: "q27",
      prompt: "When planning a project, I spend the most energy on…",
      options: [
        { text: "Who's involved and how to bring them together.", dimension: "people" },
        { text: "What we need to deliver, and by when.", dimension: "performance" },
        { text: "How the work should be structured and sequenced.", dimension: "process" },
      ],
    },
    {
      id: "q28",
      prompt: "I'm quickest to speak up when…",
      options: [
        { text: "Someone isn't being treated fairly by the group.", dimension: "people" },
        { text: "We're wasting time instead of making progress.", dimension: "performance" },
        { text: "Something doesn't add up logically.", dimension: "process" },
      ],
    },
    {
      id: "q29",
      prompt: "Left entirely to my own devices, I would probably…",
      options: [
        { text: "Spend time strengthening relationships with colleagues.", dimension: "people" },
        { text: "Chase down the next tangible win.", dimension: "performance" },
        { text: "Tidy up or improve a system nobody else has gotten to.", dimension: "process" },
      ],
    },
    {
      id: "q30",
      prompt: "The compliment that would mean the most to me is…",
      options: [
        { text: "\"People really trust you.\"", dimension: "people" },
        { text: "\"You get things done.\"", dimension: "performance" },
        { text: "\"You always think it through properly.\"", dimension: "process" },
      ],
    },
  ],

  /**
   * ------------------------------------------------------------------
   * PRESSURE PROFILE (optional add-on)
   * ------------------------------------------------------------------
   * An optional, separate continuation offered after the Everyday
   * results screen. It measures how the same three motivations —
   * People, Performance, Process — shift when disagreement, opposition
   * or frustration continues despite someone's normal approach.
   *
   * This is original content, written for this product. It is not a
   * reproduction of any commercial assessment's questions, scoring or
   * report text — see README.md for the intellectual-property notes
   * this feature was built against.
   *
   * Terminology used throughout: "Everyday Profile" (the existing
   *30-question result) vs. "Pressure Profile" (this new result) vs.
   * "Motivational Shift" (the difference between the two). Deliberately
   * avoided: "explosiveness", "conflict style", clinical language.
   * ------------------------------------------------------------------
   */

  // Banner shown on the Everyday results screen, offering the
  // continuation. Entirely optional — declining it changes nothing
  // about the Everyday result already shown.
  pressureOffer: {
    heading: "Curious how this shifts under pressure?",
    body:
      "Everything above reflects your everyday working style. There's an optional follow-on set of 18 questions that looks at how your priorities may change when disagreement or frustration continues — a separate \"Pressure Profile\", plotted alongside your everyday result. Takes about 5–7 minutes.",
    cta: "Start the Pressure Profile",
    skipNote: "Entirely optional — your Everyday result above is already complete and saved either way.",
  },

  // Transition screen shown before the pressure questions start
  // (spec section 13.1), followed by the answering instructions
  // (spec section 4.2).
  pressureIntro: {
    heading: "Now consider how you respond when difficulties continue",
    paragraphs: [
      "The next questions concern situations where disagreement, frustration or opposition remains unresolved — where your usual approach hasn't settled things.",
      "Your priorities in these circumstances may be different from your everyday style. That's normal. Answer according to what you genuinely tend to do, not what you think the ideal response would be.",
      "There are no good or bad profiles here. The purpose is to understand which priorities become most important to you when working relationships are under strain.",
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
    startCta: "Begin the Pressure Profile",
    backToResultsLink: "← Back to your Everyday result",
  },

  pressureProgress: {
    partLabel: "Part 2 of 2: Responding under pressure",
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
        { text: "Reaching a clear decision and moving the work forward.", dimension: "performance" },
        { text: "Understanding their concerns and finding an outcome they can support.", dimension: "people" },
        { text: "Testing the decision against the evidence and agreed criteria.", dimension: "process" },
      ],
    },
    {
      id: "p02",
      prompt: "A discussion has gone around in circles and no progress is being made. What do you tend to do?",
      options: [
        { text: "Bring the discussion to a conclusion and assign the next actions.", dimension: "performance" },
        { text: "Check what remains unresolved for the people involved.", dimension: "people" },
        { text: "Restate the issue and work through it in a more structured way.", dimension: "process" },
      ],
    },
    {
      id: "p03",
      prompt: "Someone has not delivered something important that they committed to. What matters most to you initially?",
      options: [
        { text: "Recovering the position and ensuring the required result is delivered.", dimension: "performance" },
        { text: "Understanding what happened before deciding how to respond.", dimension: "people" },
        { text: "Identifying where the plan, controls or responsibilities broke down.", dimension: "process" },
      ],
    },
    {
      id: "p04",
      prompt: "Your recommendation is rejected without an explanation you consider adequate. What are you most likely to do?",
      options: [
        { text: "Challenge the decision directly and argue for the better outcome.", dimension: "performance" },
        { text: "Speak with those involved to understand their concerns and rebuild support.", dimension: "people" },
        { text: "Request the rationale, evidence and decision criteria.", dimension: "process" },
      ],
    },
    {
      id: "p05",
      prompt: "Two colleagues are in a disagreement that is affecting the wider team. Where does your attention go?",
      options: [
        { text: "Stopping the disagreement from disrupting delivery.", dimension: "performance" },
        { text: "Repairing the relationship and ensuring both people feel heard.", dimension: "people" },
        { text: "Establishing the facts and agreeing a fair way to resolve the issue.", dimension: "process" },
      ],
    },
    {
      id: "p06",
      prompt: "A project is falling behind and the team disagrees about what to do next. What do you prioritise?",
      options: [
        { text: "Selecting a course of action quickly and recovering the timetable.", dimension: "performance" },
        { text: "Creating enough agreement that the team can move forward together.", dimension: "people" },
        { text: "Reviewing the causes and producing a realistic revised plan.", dimension: "process" },
      ],
    },
    {
      id: "p07",
      prompt: "Someone criticises your work in a meeting. What response is most natural to you?",
      options: [
        { text: "Address the criticism directly and defend the outcome where necessary.", dimension: "performance" },
        { text: "Consider what has led them to raise it in that way and seek a constructive conversation.", dimension: "people" },
        { text: "Ask for specific examples and examine whether the criticism is supported.", dimension: "process" },
      ],
    },
    {
      id: "p08",
      prompt: "A colleague repeatedly avoids giving you a clear answer. What do you tend to do?",
      options: [
        { text: "Ask for a direct answer and set a deadline for it.", dimension: "performance" },
        { text: "Explore whether something is preventing them from speaking openly.", dimension: "people" },
        { text: "Clarify exactly what information or decision is required from them.", dimension: "process" },
      ],
    },
    {
      id: "p09",
      prompt: "A decision has caused a negative reaction across the team. What do you focus on?",
      options: [
        { text: "Holding the direction where it remains necessary and keeping delivery on track.", dimension: "performance" },
        { text: "Understanding the reaction and addressing its impact on trust and morale.", dimension: "people" },
        { text: "Reviewing whether the decision and its implementation were properly considered.", dimension: "process" },
      ],
    },
    {
      id: "p10",
      prompt: "You believe someone is making an issue unnecessarily complicated. What are you most likely to do?",
      options: [
        { text: "Reduce it to the key decision and press for action.", dimension: "performance" },
        { text: "Ask what concerns are making the issue difficult for them.", dimension: "people" },
        { text: "Separate the facts, assumptions and unresolved questions.", dimension: "process" },
      ],
    },
    {
      id: "p11",
      prompt: "A meeting becomes tense and participants begin talking over one another. What do you naturally try to restore?",
      options: [
        { text: "Direction and control.", dimension: "performance" },
        { text: "Respectful dialogue and participation.", dimension: "people" },
        { text: "Order, clarity and a rational discussion.", dimension: "process" },
      ],
    },
    {
      id: "p12",
      prompt: "You are asked to support a decision you have significant reservations about. What do you tend to do?",
      options: [
        { text: "State your position clearly and push for a different decision.", dimension: "performance" },
        { text: "Discuss your concerns privately and try to preserve collective support.", dimension: "people" },
        { text: "Document the risks and ask for the basis of the decision to be reviewed.", dimension: "process" },
      ],
    },
    {
      id: "p13",
      prompt: "A colleague reacts defensively when you raise a problem. What becomes most important?",
      options: [
        { text: "Ensuring the problem is still confronted and resolved.", dimension: "performance" },
        { text: "Reducing defensiveness so that a productive conversation remains possible.", dimension: "people" },
        { text: "Keeping the discussion focused on specific facts and examples.", dimension: "process" },
      ],
    },
    {
      id: "p14",
      prompt: "An important issue remains unresolved after several conversations. What do you become more inclined to do?",
      options: [
        { text: "Escalate it or make the decision yourself where possible.", dimension: "performance" },
        { text: "Involve someone who can help the parties find common ground.", dimension: "people" },
        { text: "Pause further debate until the necessary information has been assembled.", dimension: "process" },
      ],
    },
    {
      id: "p15",
      prompt: "A colleague continues to work in a way you consider ineffective. How are you most likely to respond?",
      options: [
        { text: "Set clearer expectations and require a change in performance.", dimension: "performance" },
        { text: "Speak with them to understand their perspective and offer support.", dimension: "people" },
        { text: "Show where the approach is failing and agree a more reliable method.", dimension: "process" },
      ],
    },
    {
      id: "p16",
      prompt: "You are under pressure to make a decision before you feel the issue has been properly resolved. What do you tend to protect most strongly?",
      options: [
        { text: "The need to maintain momentum and avoid losing the opportunity.", dimension: "performance" },
        { text: "The need to retain trust and avoid leaving key people behind.", dimension: "people" },
        { text: "The need to make a sound decision with adequate information.", dimension: "process" },
      ],
    },
    {
      id: "p17",
      prompt: "Someone questions your authority or responsibility for an area of work. What response is most natural?",
      options: [
        { text: "Reassert your responsibility and establish who is making the decision.", dimension: "performance" },
        { text: "Seek to understand why the relationship or responsibilities have become unclear.", dimension: "people" },
        { text: "Refer back to the agreed roles, governance and decision rights.", dimension: "process" },
      ],
    },
    {
      id: "p18",
      prompt: "When a difficult working relationship has continued for some time, what do you become most likely to do?",
      options: [
        { text: "Confront the central issue and force a resolution.", dimension: "performance" },
        { text: "Make another attempt to repair the relationship and restore cooperation.", dimension: "people" },
        { text: "Reduce contact, formalise communication and rely more heavily on evidence and procedure.", dimension: "process" },
      ],
    },
  ],

  /**
   * ------------------------------------------------------------------
   * PRESSURE PROFILE — REPORT COPY
   * ------------------------------------------------------------------
   * Copy used to assemble the "How You Respond Under Pressure" report.
   * Rather than one static write-up per dimension, the report is built
   * from whichever dimension increases most and whichever decreases
   * most (see js/pressure.js), so the narrative actually reflects the
   * *movement*, not just the pressure result on its own — as specified.
   * ------------------------------------------------------------------
   */
  pressureResults: {
    headerEyebrow: (name) => (name ? `${name}'s pressure profile` : "Your pressure profile"),
    title: "How You Respond Under Pressure",
    subtitle: "How your priorities may change when disagreement or frustration continues.",
    everydayLabel: "Everyday profile",
    pressureLabel: "Pressure profile",
    shiftLabel: "Motivational Shift",
    chartTitle: "Everyday vs. under pressure",
    chartLegendEveryday: "Everyday profile",
    chartLegendPressure: "Pressure profile",
    scoreTableHeading: "Your scores",
    colMotivation: "Motivation",
    colEveryday: "Everyday",
    colPressure: "Under pressure",
    colChange: "Change",
    changeNoChange: "No material change",
    shiftBandLabels: {
      limited: "Limited shift",
      moderate: "Moderate shift",
      significant: "Significant shift",
      marked: "Marked shift",
    },
    shiftBandDescriptions: {
      limited: "Your priorities remain relatively consistent, whether things are going smoothly or not.",
      moderate: "There's some noticeable adaptation in what you focus on when disagreement continues.",
      significant: "Colleagues are likely to notice a material change in how you come across.",
      marked: "Your pressure response may feel substantially different from your everyday style.",
    },
    shiftIntensityWord: {
      limited: "a little",
      moderate: "somewhat",
      significant: "noticeably",
      marked: "substantially",
    },
    // Short adjectives used in the summary paragraph's closing sentence,
    // describing how someone comes across when this dimension is the
    // one that increases most under pressure.
    increaseAdjectives: {
      performance: ["direct", "decisive", "forceful"],
      people: ["accommodating", "supportive", "relationship-focused"],
      process: ["analytical", "formal", "methodical"],
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
    // dimension — describes what someone is motivated by day to day
    // (everyday) vs. under pressure.
    everydayFocusPhrase: {
      people: "maintaining trust, involving others and creating a supportive environment",
      performance: "driving progress, taking ownership and pushing for visible results",
      process: "gathering evidence, thinking things through carefully and applying a consistent approach",
    },
    pressureFocusPhrase: {
      performance: "achieving a resolution, making a decision and restoring progress",
      people: "repairing relationships, seeking reassurance and preserving cooperation",
      process: "establishing the facts, slowing down and relying on evidence or agreed procedure",
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
    shiftAwarenessRisk: (bandLabel) =>
      `Because this is a ${bandLabel.toLowerCase()}, colleagues who don't expect it may misread the change if you don't name it yourself.`,
    reflectionQuestions: [
      "What are the earliest signs that your priorities are changing?",
      "What does your communication become more like?",
      "What might colleagues misinterpret?",
      "What value does your pressure response bring?",
      "What part of your everyday style should you deliberately retain?",
      "What helps you return to a constructive working relationship?",
    ],
    disclaimer:
      "This profile is intended to support reflection and workplace conversations. It does not measure mental health, emotional stability or a person's ability to manage conflict, and it isn't a validated psychometric or clinical assessment.",
    restartCta: "Start again",
    backToEverydayCta: "← Back to your Everyday result",
    exportCta: "Download as PDF",
    exportNote: "This opens your browser's print dialog — choose “Save as PDF” as the destination.",
    cloudSaveOkNote: (teamCode) =>
      teamCode
        ? `This pressure result has also been saved automatically under team code "${teamCode}".`
        : "This pressure result has been saved to this tool's shared database.",
    cloudSaveFailNote:
      "Couldn't reach the shared database just now, so this pressure result hasn't saved automatically. Your Everyday result from earlier is unaffected.",
  },

  /**
   * Movement-specific content (spec sections 11.1–11.6), keyed by the
   * dimension that moves. `increase*` content is used for whichever
   * dimension increases most under pressure (this drives most of the
   * report); `decreaseNotice` is a single sentence used for whichever
   * dimension decreases most, folded into "What others may notice"
   * alongside the increase-dimension bullets.
   */
  pressureMovement: {
    performance: {
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
    people: {
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
    process: {
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
   * Keyed by category id (see scoring.js CATEGORY constants). Each
   * entry has: label, interpretation, strengths, overuseRisks,
   * communicationTips, howOthersCanWork.
   * ------------------------------------------------------------------
   */
  categoryContent: {
    people_led: {
      label: "People-led",
      interpretation:
        "Your responses suggest you are most motivated by people: by supporting others, building relationships, and helping teams feel included and looked after. You likely do your best work when there's genuine connection with the people around you.",
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
      overuseArrows: [
        { strength: "Warmth", overuse: "can slide into avoiding necessary conflict" },
        { strength: "Inclusiveness", overuse: "can slow a decision while everyone is consulted" },
      ],
      quickReference: {
        focus: "the impact on people, and being involved early",
        avoid: "blunt asks with no context",
      },
    },

    performance_led: {
      label: "Performance-led",
      interpretation:
        "Your responses suggest you are most motivated by performance: by action, visible progress and getting results. You likely feel at your best when there's a clear goal and momentum toward it.",
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
        "Let them see the scoreboard — visible progress keeps them engaged",
      ],
      overuseArrows: [
        { strength: "Decisiveness", overuse: "can tip into steamrolling other views" },
        { strength: "Pace", overuse: "can turn into rushing past important detail" },
      ],
      quickReference: {
        focus: "the outcome and the next concrete step",
        avoid: "a long build-up before the point",
      },
    },

    process_led: {
      label: "Process-led",
      interpretation:
        "Your responses suggest you are most motivated by process: by clarity, logic, fairness, structure and independence. You likely feel at your best when there's a sound approach and time to think things through properly.",
      strengths: [
        "Bringing rigour, consistency and fairness to decisions",
        "Spotting risks, gaps or flawed logic early",
        "Building systems and structures that hold up over time",
        "Working well independently and with sustained focus",
      ],
      overuseRisks: [
        "Taking longer than the situation allows in pursuit of getting it exactly right",
        "Coming across as overly critical or detached from how others feel",
        "Resisting change to a process even when circumstances have shifted",
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
      overuseArrows: [
        { strength: "Rigour", overuse: "can drift into endless refinement" },
        { strength: "Caution", overuse: "can harden into resisting any change" },
      ],
      quickReference: {
        focus: "evidence, structure and time to think it through",
        avoid: "vague or rushed requests",
      },
    },

    people_performance_blend: {
      label: "People / Performance blend",
      interpretation:
        "Your responses suggest a People / Performance blend. You are likely to feel at your best when you are helping others succeed while also seeing clear progress. You may naturally bring energy, encouragement and momentum to teams. Under pressure, you may become frustrated if people disengage or if progress stalls.",
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
      overuseArrows: [
        { strength: "Rallying energy", overuse: "can push the team faster than it can sustain" },
        { strength: "Reading morale", overuse: "can be mistaken for reading a lack of commitment" },
      ],
      quickReference: {
        focus: "both the goal and how the team is coping with it",
        avoid: "treating pace and people-care as competing priorities",
      },
    },

    performance_process_blend: {
      label: "Performance / Process blend",
      interpretation:
        "Your responses suggest a Performance / Process blend. You are likely motivated by getting things done properly: making solid progress without cutting corners. You probably value both pace and rigour, and can get frustrated when either one is missing.",
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
      overuseArrows: [
        { strength: "High standards", overuse: "can stall momentum when 'perfect' competes with 'done'" },
        { strength: "Structured pace", overuse: "can read as impatience with open-ended discussion" },
      ],
      quickReference: {
        focus: "speed or thoroughness, whichever matters more right now",
        avoid: "giving feedback without first explaining the standard behind it",
      },
    },

    process_people_blend: {
      label: "Process / People blend",
      interpretation:
        "Your responses suggest a Process / People blend. You are likely motivated by getting things right in a way that's also fair and considerate of everyone involved. You probably value sound thinking and inclusive decision-making in equal measure.",
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
      overuseArrows: [
        { strength: "Considered judgement", overuse: "can slow a decision that needs to happen now" },
        { strength: "Thoroughness", overuse: "can turn into over-explaining a simple call" },
      ],
      quickReference: {
        focus: "a fair process alongside a timely decision",
        avoid: "waiting for full consensus when the call is already clear enough",
      },
    },

    balanced_blend: {
      label: "Balanced / situational blend",
      interpretation:
        "Your responses suggest a fairly balanced profile across People, Performance and Process. You likely flex your motivation depending on the situation, rather than leaning consistently toward one driver. This can make you adaptable, though it may also mean your priorities shift more visibly depending on context.",
      strengths: [
        "Adapting your approach to what a situation actually needs",
        "Bringing a broad perspective that can bridge different working styles",
        "Being equally comfortable supporting, driving or structuring work",
        "Acting as a natural translator between more single-minded colleagues",
      ],
      overuseRisks: [
        "Being harder for others to predict, since your focus shifts with context",
        "Spreading your energy across all three areas rather than one clear strength",
        "Deferring to whichever driver is loudest in the room, rather than your own view",
      ],
      communicationTips: [
        "Tell people which driver matters most to you in a given situation, since it may not be obvious",
        "Use your range deliberately — notice which mode a moment calls for",
        "Don't assume your flexibility is automatically obvious to more fixed colleagues",
      ],
      howOthersCanWork: [
        "Ask which driver matters most to them on a given piece of work",
        "Use their range to help bridge people-, performance- and process-led colleagues",
        "Don't assume a single fixed style — check in on what this project needs from them",
      ],
      overuseArrows: [
        { strength: "Adaptability", overuse: "can make your priorities look inconsistent to others" },
        { strength: "Range", overuse: "can spread your energy thin across all three areas" },
      ],
      quickReference: {
        focus: "a clear signal of which driver matters most to you right now",
        avoid: "assuming your flexibility is obvious without saying so",
      },
    },
  },

  /**
   * ------------------------------------------------------------------
   * "Working with different results" guide
   * ------------------------------------------------------------------
   * Shown on the solo results page (and included in its PDF export): a
   * compact, practical reference — one entry per result category,
   * covering the three primary corners, the three midpoint blends
   * (People+Performance, Performance+Process, People+Process) and the
   * balanced/situational centre — on how to work well with someone
   * whose result leans that way. Original wording throughout, loosely
   * inspired by general, widely-known workplace-communication ideas
   * (lead with the point vs. lead with context, give time to think vs.
   * match pace, and so on) — not copied from any single source.
   * ------------------------------------------------------------------
   */
  workingWithGuide: {
    performance_led: {
      tagline: "Moving fast toward a clear result",
      tips: [
        "Open with the point and the decision you need — save the background for if they ask.",
        "Give them room to own the call; hovering over small choices lands worse with them than most.",
        "Match their pace, or say plainly why you can't — silence reads as disengagement.",
        "Push back directly on their thinking; a straight \"no\" now beats a polite one later.",
      ],
    },
    people_led: {
      tagline: "Protecting trust and how people are doing",
      tips: [
        "Take a moment for the relationship before the agenda — jumping straight to business can feel cold.",
        "Spell out how a decision affects people, not just what the decision is.",
        "Ask for their view directly; they'll often hold it back rather than risk friction.",
        "Recognise their contribution to morale out loud — it matters to them as much as results do.",
      ],
    },
    process_led: {
      tagline: "Protecting quality and getting it right",
      tips: [
        "Bring evidence and structure, not just urgency — a reasoned case moves them further than pressure.",
        "Give them time to think before asking for a decision; rushed, they'll default to caution.",
        "Explain the reasoning behind a request, not only the request itself.",
        "Treat a considered \"not yet\" as a real answer worth hearing out, not an obstacle.",
      ],
    },
    people_performance_blend: {
      tagline: "Wants the team to win together, not just win",
      tips: [
        "Bring both the goal and the people context — expect them to ask about each.",
        "Don't mistake their check-ins on morale for hesitation; they're pushing pace and care at once.",
        "If you need to slow down, say why — unexplained delay reads to them as a problem building.",
        "Celebrate progress as a team story, not just a number; it's what keeps them energised.",
      ],
    },
    performance_process_blend: {
      tagline: "Wants a result that's both fast and built to last",
      tips: [
        "Say plainly which matters more this time, speed or thoroughness — they'll calibrate to your signal.",
        "Bring a plan, not just a deadline; a vague ask draws more pushback from them than a demanding one.",
        "Their questions are usually stress-testing the idea, not resistance to it.",
        "Give them ownership of both the \"what\" and the \"how\" — splitting the two frustrates them.",
      ],
    },
    process_people_blend: {
      tagline: "Wants the outcome to be fair as well as sound",
      tips: [
        "Give them time to consult and think it through, especially where the decision touches people.",
        "Bring a considered case rather than urgency alone — reasoning moves them further than pressure.",
        "Involve them while a decision is still open; retrofitting their input afterwards won't land the same way.",
        "A well-reasoned \"yes, but not like that\" from them is usually worth taking seriously.",
      ],
    },
    balanced_blend: {
      tagline: "Adapts to whatever the moment actually needs",
      tips: [
        "Ask which mode they're leaning into on this piece of work — their priorities shift more than most.",
        "Use them to translate between more fixed colleagues; it's often where they add the most value.",
        "Ask directly for their own recommendation — their flexibility can make it easy to overlook that they have one.",
        "Give them variety; being held in one mode too long tends to wear on them.",
      ],
    },
  },

  /**
   * ------------------------------------------------------------------
   * Communication guide ("Working with other colours")
   * ------------------------------------------------------------------
   * A directional 7x7 companion to CONTENT.workingWithGuide: instead of
   * one static blurb per category, this looks specifically from YOUR
   * result's perspective at each of the other six (plus meeting another
   * person who shares your own result). Loosely inspired by the general,
   * widely-known idea of a "my style x their style" communication
   * matrix — original wording throughout, not copied from any single
   * source.
   *
   * `reminders[me][them]` is the one piece of genuinely bespoke text per
   * ordered pair (49 short original lines). Everything else shown for a
   * pair (the "best approach" / "what you bring" / "watch for" lines) is
   * assembled at render time from the fields already defined per category
   * above (quickReference, strengths, overuseRisks) using the templates
   * below, so the same well-reviewed source text is reused rather than
   * re-invented per pair.
   * ------------------------------------------------------------------
   */
  commsGuide: {
    pageTitle: "Working with other colours",
    intro:
      "A guide to working with each result, written from the perspective of your own. Tell us your starting point one of three ways, and we'll show you how to approach the other six — plus what to expect meeting someone who shares your own result.",
    methodsHeading: "Tell us your starting point",
    methodPickTitle: "Pick your result",
    methodPickBody: "Already know your result category? Choose it directly.",
    methodTriangleTitle: "Place yourself on the triangle",
    methodTriangleBody: "Not sure, or want to explore? Drag a point and we'll work out the category as you go.",
    methodTriangleReadoutPrefix: "Currently reads as:",
    methodTriangleCta: "Show my guide",
    methodUploadTitle: "Upload a saved result file",
    methodUploadBody: "Used the solo reflection already and saved a result-*.json file? Load it here.",
    methodUploadButtonLabel: "Choose result file…",
    methodUploadInvalid: "That doesn't look like a Ways of Working result file — try another, or use one of the other two options above.",
    resultHeading: (label) => `Working from a ${label} starting point`,
    sourcePick: "You told us your result directly.",
    sourceTriangle: (people, performance, process) =>
      `Based on where you placed yourself (People ${people}% · Performance ${performance}% · Process ${process}%).`,
    sourceUpload: (name) => `Based on the result file you loaded${name ? ` for ${name}` : ""}.`,
    changeStartCta: "Choose a different starting point",
    // Overview section — a short "what your result means" recap shown
    // before the pairwise cards below. Reachable directly from the home
    // page without doing the full solo reflection first, so a reader
    // might be seeing this result's write-up for the first time here.
    overviewHeading: "Your result, in a nutshell",
    overviewStrengthsHeading: "Strengths you bring",
    overviewWatchHeading: "Worth watching for",
    overviewApproachHeading: "How others get the best from you",
    cardsHeading: "Working with each result",
    cardsIntro: (label) =>
      `Here's how to approach each of the other six results, plus what to expect meeting someone who shares your ${label} result.`,
    selfPairLabel: (label) => `Two ${label} people`,
    approachLabel: "Best approach",
    strengthLabel: "What you bring",
    watchForLabel: "Watch for",
    reminderLabel: "One line to remember",
    approachTemplate: (focus, avoid) => [`Lead with ${focus}.`, `Steer clear of ${avoid}.`],
    strengthTemplate: (meLabel, meStrength, themFocus) =>
      `Coming from a ${meLabel} result yourself, your instinct here is ${meStrength.charAt(0).toLowerCase()}${meStrength.slice(
        1
      )} — worth leaning on, since they respond to ${themFocus}.`,
    watchForTemplate: (meRisk) =>
      `Your own overuse risk to keep in view here: ${meRisk.charAt(0).toLowerCase()}${meRisk.slice(1)}.`,
    exportCta: "Download as PDF",
    exportNote: "This opens your browser's print dialog — choose “Save as PDF” as the destination.",
    reminders: {
      performance_led: {
        performance_led:
          "Two of you means twice the pace — agree who owns the final call before you both push at once.",
        people_led: "Slow your opening by ten seconds; it buys you their trust for the rest of the conversation.",
        process_led: "Bring your evidence before your urgency — it's the fastest way to get their yes.",
        people_performance_blend:
          "Match their energy, then anchor it — someone still needs to name the next concrete step.",
        performance_process_blend:
          "You'll agree on the finish line fast; spend the time you save agreeing the standard for getting there.",
        process_people_blend:
          "Your pace and their patience aren't opposites — ask what \"done properly\" means to them before you push.",
        balanced_blend:
          "Tell them plainly which decision you need today; their flexibility can't help you if the ask stays vague.",
      },
      people_led: {
        performance_led: "Open with the outcome, not the context — they'll hear your care once they've heard your point.",
        people_led: "Two of you can talk around a hard topic for a long time — name it early, kindly but directly.",
        process_led: "Bring the human impact, not just the ask; it's the detail they're least likely to weigh on their own.",
        people_performance_blend:
          "Their enthusiasm is genuine — help channel it into a decision before the momentum outruns the plan.",
        performance_process_blend:
          "Show up with your empathy and a timeline; they'll trust your input faster with both in the room.",
        process_people_blend: "You'll both want more time to be sure — agree a deadline for the conversation before you start it.",
        balanced_blend: "Ask directly for their honest view, not their summary of everyone else's.",
      },
      process_led: {
        performance_led: "Give them the recommendation first, the evidence second — they'll ask for the detail if they need it.",
        people_led: "Explain the reasoning behind a change before the change itself, or it can land as cold.",
        process_led: "Two of you can refine a decision past the point it needed refining — set a good-enough line up front.",
        people_performance_blend: "Bring your structure to their energy early, before excitement turns into a plan with gaps.",
        performance_process_blend:
          "You'll agree on rigour faster than on pace — settle which one leads for this particular task.",
        process_people_blend: "Between you, decisions can take longer than the moment allows — agree who breaks the tie.",
        balanced_blend:
          "Ask them to pressure-test your logic against the people it will actually affect, not just its internal consistency.",
      },
      people_performance_blend: {
        performance_led: "Let them own some of the pace-setting too, or they'll read your energy as a takeover.",
        people_led:
          "Your enthusiasm reads as pressure faster than you'd expect — check in on how it's landing, not just where it's heading.",
        process_led: "Give them time to think before you ask for buy-in; your excitement can look like a decision already made.",
        people_performance_blend:
          "Two of you can build a lot of energy around an idea that hasn't been tested yet — pressure-test it before you sell it.",
        performance_process_blend: "They'll want the plan as much as the vision — bring both, not just the pitch.",
        process_people_blend: "Your warmth helps here, but so does patience — let their caution finish its sentence.",
        balanced_blend: "Ask what they're not saying — their adaptability can mean they hold back a view to keep the peace.",
      },
      performance_process_blend: {
        performance_led:
          "Share the plan, not just the deadline — a bare deadline reads as pressure rather than direction to them.",
        people_led: "Lead with why it matters to people, not just why it's correct — the reasoning needs a human frame here.",
        process_led: "You'll agree on the standard quickly; the real conversation is about how fast you get there.",
        people_performance_blend: "Bring the plan and let them bring the energy — resist doing both yourself.",
        performance_process_blend:
          "Two of you can over-engineer a decision that needed to ship yesterday — agree a point where \"good\" beats \"perfect\".",
        process_people_blend: "Your rigour is a shared language here; use it to build trust before you push on pace.",
        balanced_blend: "Give them both the target and the reasoning — they'll translate it for whoever else needs convincing.",
      },
      process_people_blend: {
        performance_led: "State your recommendation before your reservations, or it can sound like resistance instead of care.",
        people_led: "You'll both want consensus — agree who decides if you can't get it in time.",
        process_led: "Your shared instinct for rigour can quietly become two people waiting for the other to finish checking.",
        people_performance_blend: "Bring your steadiness to their momentum — it's the balance they need, not a brake on it.",
        performance_process_blend:
          "They'll move faster than feels safe to you; ask for the guardrails instead of asking for the slowdown.",
        process_people_blend: "Two of you can protect a decision so carefully it never gets made — set a date for the call.",
        balanced_blend: "Ask them to name the trade-off plainly; their balance can blur where you need a clear line.",
      },
      balanced_blend: {
        performance_led: "Give them a decision to make, not a discussion to join — your range is wasted if the moment needs speed.",
        people_led: "Let the relationship lead before the agenda does; trust here is what unlocks the rest.",
        process_led: "Bring the evidence before the ask; your flexibility lands better once they trust your reasoning.",
        people_performance_blend: "Help them separate the goal from the excitement about the goal — you're built to see both.",
        performance_process_blend: "Bring in who else the decision touches; it's the perspective their plan is most likely to miss.",
        process_people_blend:
          "Help them convert care into a decision — your adaptability is most useful here as momentum, not just as balance.",
        balanced_blend: "Two of you can hold every angle open at once — agree who commits to a position first.",
      },
    },
  },
};

// Expose for both the browser (script tag) and any future bundler/tooling.
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONTENT;
}
