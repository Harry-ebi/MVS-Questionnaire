/**
 * pressure.js
 * -----------------------------------------------------------------------
 * The optional "Priorities Under Pressure" continuation, offered after
 * the Everyday Priorities results screen (see js/app.js's
 * renderResults()). Entirely self-contained: its own mini state machine
 * (offer banner -> transition screen -> 18 ranked-choice questions ->
 * report), driven by app.js's screen switch the same way chart.js's
 * render functions are, so the two features stay cleanly separated in
 * one file each.
 *
 * Depends on (all loaded earlier — see reflection.html's script order):
 *   - CONTENT (content.js) for all copy, questions and narrative snippets
 *   - DIMENSIONS, PATTERN, orderedPairKey, scorePressureAnswers,
 *     computeChange (scoring.js)
 *   - renderPriorityShiftChart, escapeHtmlLocal (chart.js)
 *   - SupabaseClient (supabaseClient.js) for the best-effort cloud save
 * -----------------------------------------------------------------------
 */

const PressureFlow = (function () {
  const pressureState = {
    order: [],
    currentIndex: 0,
    answers: [],
    currentRanks: [],
    lastAutoCompletedDim: null, // the dimension auto-ranked "least like me" once the other two were picked — used to give it a beat's delay before it pops in, so it reads as intentional rather than an abrupt double-change
    everydayScoreResult: null,
    scoreResult: null,
    change: null,
    respondentName: "",
    teamCode: "",
    cloudSaveAttempted: false,
    cloudSaveStatus: null,
  };

  function shuffleArray(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function shufflePressureQuestions() {
    return CONTENT.pressureQuestions.map((q) => ({ ...q, options: shuffleArray(q.options) }));
  }

  /** Reconstruct a question's tap order from its stored {dimension: points} answer. */
  function ranksFromAnswer(answer) {
    if (!answer) return [];
    return DIMENSIONS.slice().sort((a, b) => answer.points[b] - answer.points[a]);
  }

  /** Reset all pressure state for a brand-new run, keyed off the Everyday result just shown. */
  function start(everydayScoreResult, respondentName, teamCode) {
    pressureState.order = shufflePressureQuestions();
    pressureState.currentIndex = 0;
    pressureState.answers = [];
    pressureState.currentRanks = [];
    pressureState.lastAutoCompletedDim = null;
    pressureState.everydayScoreResult = everydayScoreResult;
    pressureState.scoreResult = null;
    pressureState.change = null;
    pressureState.respondentName = respondentName;
    pressureState.teamCode = teamCode;
    pressureState.cloudSaveAttempted = false;
    pressureState.cloudSaveStatus = null;
  }

  // ------------------------------------------------------------------
  // Offer banner — embedded inside the Everyday results screen
  // ------------------------------------------------------------------

  function renderOfferBannerHtml() {
    const c = CONTENT.pressureOffer;
    return `
      <section class="mvs-pressure-offer mvs-print-hide" id="mvs-pressure-offer">
        <p class="mvs-pressure-offer-eyebrow">${escapeHtmlLocal(c.eyebrow)}</p>
        <h2 class="mvs-section-title">${escapeHtmlLocal(c.heading)}</h2>
        <p class="mvs-note">${escapeHtmlLocal(c.body)}</p>
        <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-pressure-offer-cta">${escapeHtmlLocal(
          c.cta
        )}</button>
        <p class="mvs-note mvs-pressure-offer-skip">${escapeHtmlLocal(c.skipNote)}</p>
      </section>
    `;
  }

  function wireOfferBanner(onStart) {
    const btn = document.getElementById("mvs-pressure-offer-cta");
    if (btn) btn.addEventListener("click", onStart);
  }

  // ------------------------------------------------------------------
  // Transition / instructions screen
  // ------------------------------------------------------------------

  function renderIntro(root, handlers) {
    const c = CONTENT.pressureIntro;
    root.innerHTML = `
      <div class="mvs-screen mvs-screen--pressure-intro">
        <a href="index.html" class="mvs-meta-line">&larr; Back to home</a>
        <p class="mvs-eyebrow">${escapeHtmlLocal(CONTENT.pressureProgress.partLabel)}</p>
        <h1>${escapeHtmlLocal(c.heading)}</h1>
        ${c.paragraphs.map((p) => `<p class="mvs-lead">${escapeHtmlLocal(p)}</p>`).join("")}
        <h2 class="mvs-section-title">${escapeHtmlLocal(c.instructionsHeading)}</h2>
        <ul class="mvs-list">
          ${c.instructions.map((i) => `<li>${escapeHtmlLocal(i)}</li>`).join("")}
        </ul>
        <div class="mvs-btn-row">
          <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-pressure-begin">${escapeHtmlLocal(
            c.startCta
          )}</button>
          <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-pressure-back">${escapeHtmlLocal(
            c.backToResultsLink
          )}</button>
        </div>
      </div>
    `;
    document.getElementById("mvs-pressure-begin").addEventListener("click", handlers.onBegin);
    document.getElementById("mvs-pressure-back").addEventListener("click", handlers.onBack);
  }

  // ------------------------------------------------------------------
  // Ranked-choice question screen
  // ------------------------------------------------------------------

  function currentPressureQuestion() {
    return pressureState.order[pressureState.currentIndex];
  }

  const RANK_LABELS = [
    CONTENT.pressureIntro.rankLabels.most,
    CONTENT.pressureIntro.rankLabels.next,
    CONTENT.pressureIntro.rankLabels.least,
  ];

  /**
   * Builds the full question screen exactly once per *question* (first
   * arrival, or a real Back/Continue navigation) — this is the only point
   * that replays the screen's entrance animation, since it's the only
   * point where the question itself has actually changed. Ranking taps
   * within the same question are handled entirely by applyRankState()
   * below, which patches the existing DOM in place rather than rebuilding
   * it — see that function's comment for why.
   */
  function renderQuestion(root, handlers) {
    const total = pressureState.order.length;
    const q = currentPressureQuestion();
    const existingAnswer = pressureState.answers[pressureState.currentIndex];
    if (pressureState.currentRanks.length === 0 && existingAnswer) {
      pressureState.currentRanks = ranksFromAnswer(existingAnswer);
    }
    const pc = CONTENT.pressureProgress;
    const pct = Math.round((pressureState.currentIndex / total) * 100);

    root.innerHTML = `
      <div class="mvs-screen mvs-screen--question mvs-screen--pressure-question">
        <a href="index.html" class="mvs-meta-line">&larr; Back to home</a>
        <p class="mvs-eyebrow">${escapeHtmlLocal(pc.partLabel)}</p>
        <div class="mvs-progress-wrap" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
          <div class="mvs-progress-track">
            <div class="mvs-progress-fill" style="width:${pct}%"></div>
          </div>
          <p class="mvs-progress-label">${escapeHtmlLocal(pc.questionLabel(pressureState.currentIndex + 1, total))}</p>
        </div>
        <h2 class="mvs-question-prompt">${escapeHtmlLocal(q.prompt)}</h2>
        <p class="mvs-note">${escapeHtmlLocal(pc.rankPrompt)}</p>
        <div class="mvs-pressure-options" role="group" aria-label="Rank these responses">
          ${q.options
            .map(
              (opt, i) => `
              <button type="button" class="mvs-pressure-option-btn" data-dimension="${opt.dimension}" data-index="${i}">
                <span class="mvs-pressure-rank-badge-slot"></span>
                <span class="mvs-option-text">${escapeHtmlLocal(opt.text)}</span>
              </button>
            `
            )
            .join("")}
        </div>
        <p class="mvs-note" id="mvs-pressure-error" hidden>${escapeHtmlLocal(pc.incompleteError)}</p>
        <div class="mvs-btn-row">
          <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-pressure-back-btn">Back</button>
          <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-pressure-clear-btn">${escapeHtmlLocal(
            pc.clearCta
          )}</button>
          <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-pressure-continue-btn">Continue</button>
        </div>
      </div>
    `;

    // Paint whatever ranking state already exists for this question (empty
    // on first arrival, restored via Back) without animating the badges in
    // — they're just "already there" as far as this screen is concerned.
    applyRankState(root, { animateBadges: false });

    root.querySelectorAll(".mvs-pressure-option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dim = btn.getAttribute("data-dimension");
        if (pressureState.currentRanks.includes(dim)) return;
        pressureState.currentRanks.push(dim);
        pressureState.lastAutoCompletedDim = null;
        // Once two of the three are ranked, the last one has only one
        // possible position left — complete it automatically rather
        // than asking for a redundant third tap.
        if (pressureState.currentRanks.length === 2) {
          const remaining = q.options.map((o) => o.dimension).find((d) => !pressureState.currentRanks.includes(d));
          pressureState.currentRanks.push(remaining);
          pressureState.lastAutoCompletedDim = remaining;
        }
        // In-place update only — see applyRankState()'s comment for why
        // this deliberately does NOT call renderQuestion() again.
        applyRankState(root, { animateBadges: true });
      });
    });

    document.getElementById("mvs-pressure-clear-btn").addEventListener("click", () => {
      pressureState.currentRanks = [];
      pressureState.lastAutoCompletedDim = null;
      // Also clear any previously stored answer for this question —
      // otherwise the very next render would immediately restore the
      // ranking from it (see the existingAnswer restore logic above),
      // making "Clear" look like a no-op.
      pressureState.answers[pressureState.currentIndex] = undefined;
      applyRankState(root, { animateBadges: false });
    });

    document.getElementById("mvs-pressure-back-btn").addEventListener("click", () => {
      if (pressureState.currentIndex === 0) {
        handlers.onBackToIntro();
        return;
      }
      pressureState.currentIndex -= 1;
      pressureState.currentRanks = [];
      pressureState.lastAutoCompletedDim = null;
      renderQuestion(root, handlers);
    });

    document.getElementById("mvs-pressure-continue-btn").addEventListener("click", () => {
      if (pressureState.currentRanks.length !== 3) {
        const errEl = document.getElementById("mvs-pressure-error");
        if (errEl) errEl.hidden = false;
        return;
      }
      const points = {};
      pressureState.currentRanks.forEach((dim, idx) => {
        points[dim] = 2 - idx; // most=2, next=1, least=0
      });
      pressureState.answers[pressureState.currentIndex] = { questionId: q.id, points };
      if (pressureState.currentIndex + 1 < total) {
        pressureState.currentIndex += 1;
        pressureState.currentRanks = [];
        pressureState.lastAutoCompletedDim = null;
        renderQuestion(root, handlers);
      } else {
        handlers.onComplete();
      }
    });
  }

  /**
   * Patches the already-rendered question screen to reflect the current
   * ranking state — toggling each option's ranked/disabled state and its
   * rank badge, the error note, and the Continue button — without
   * touching anything else in the DOM.
   *
   * This used to be handled by calling renderQuestion() again on every
   * single tap, which tore down and rebuilt the entire screen (replaying
   * its fade-in-up entrance animation each time, on top of the normal
   * cost of destroying/recreating every button and its listeners). Worse,
   * the rank badge used to be inserted as a sibling next to the option
   * text, which narrowed the space available to the text and could push
   * it onto an extra line — changing that button's height and visibly
   * shoving every button below it down the page. Every option button now
   * always reserves a fixed-height badge slot above its text (see
   * .mvs-pressure-rank-badge-slot in styles.css) whether or not it's
   * currently ranked, so filling that slot in never changes the button's
   * own height, and patching state in place (instead of a full rebuild)
   * means a tap only ever changes the handful of pixels that actually
   * changed — no re-animate, no scroll jump, no flash.
   */
  function applyRankState(root, opts) {
    const complete = pressureState.currentRanks.length === 3;

    root.querySelectorAll(".mvs-pressure-option-btn").forEach((btn) => {
      const dim = btn.getAttribute("data-dimension");
      const rankPos = pressureState.currentRanks.indexOf(dim);
      const ranked = rankPos !== -1;
      const isAuto = opts.animateBadges && dim === pressureState.lastAutoCompletedDim;
      btn.classList.toggle("mvs-pressure-option-btn--ranked", ranked);
      btn.disabled = ranked;
      const slot = btn.querySelector(".mvs-pressure-rank-badge-slot");
      if (slot) {
        slot.innerHTML = ranked
          ? `<span class="mvs-pressure-rank-badge${
              isAuto ? " mvs-pressure-rank-badge--auto" : ""
            }">${escapeHtmlLocal(RANK_LABELS[rankPos])}</span>`
          : "";
      }
    });

    // "Please rank all three" only makes sense once someone's part-way
    // through (not on a completely untouched question, and not once
    // they've finished) — hidden in both of those end states.
    const errEl = document.getElementById("mvs-pressure-error");
    if (errEl) errEl.hidden = complete || pressureState.currentRanks.length === 0;

    const continueBtn = document.getElementById("mvs-pressure-continue-btn");
    if (continueBtn) continueBtn.disabled = !complete;
  }

  // ------------------------------------------------------------------
  // Report — "How You Respond Under Pressure"
  // ------------------------------------------------------------------

  function renderListSection(title, items) {
    return `
      <section class="mvs-section">
        <h2 class="mvs-section-title">${escapeHtmlLocal(title)}</h2>
        <ul class="mvs-list">
          ${items.map((i) => `<li>${escapeHtmlLocal(i)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  // Look up the write-up for a full pattern object — shared logic with
  // app.js/guide.js's own copies of this small helper.
  function contentForPattern(pattern) {
    if (pattern.type === PATTERN.FOCUSED) return CONTENT.dimensionContent[pattern.primary];
    if (pattern.type === PATTERN.DUAL) return CONTENT.dualContent[orderedPairKey(pattern.primary, pattern.secondary)];
    return CONTENT.balancedContent;
  }

  // A rise has to clear this (in points) to count as a genuine *emerging
  // edge* rather than noise. Kept in step with scoring.js's
  // CHANGE_UNCHANGED_THRESHOLD (5): a move of 5 or less is "unchanged", so
  // an edge needs to be strictly larger.
  const EDGE_RISE_MIN = 5;

  /**
   * Work out the *story* the shift tells, and — crucially — which
   * dimension the write-up should lead on. This replaces the old
   * "always lead on whichever priority still dominates" rule, which
   * mislabelled results where the top priority never changed but the real
   * movement was a rise in a *different* dimension (e.g. someone heavily
   * Clarity-led who leans towards Drive under pressure — still Clarity on
   * top, but the story is the emerging Drive edge, not more Clarity).
   *
   *   steady    — nothing moves much; priorities hold.
   *   flip      — the leading priority itself changes.
   *   edge      — the leader holds, but another dimension rises enough to
   *               become a real second gear. Lead on that rising edge,
   *               with the unchanged leader named as the anchor (baseDim).
   *   intensify — the same leading priority sharpens (it's the top riser,
   *               or others simply recede around it).
   *
   * Returns { story, leadDim, baseDim, riseDim, decreaseDim }. `leadDim`
   * is always the dimension whose coaching content should lead the report.
   */
  function classifyShift(change) {
    const riseDim = change.largestIncreaseDim;
    const riseAmt = change.deltas[riseDim];
    const primary = change.everydayPrimary;
    const decreaseDim = change.largestDecreaseDim;

    if (change.isBalancedMovement) {
      return { story: "steady", leadDim: primary, baseDim: null, riseDim, decreaseDim };
    }
    if (change.primaryChanged) {
      return { story: "flip", leadDim: change.pressurePrimary, baseDim: null, riseDim, decreaseDim };
    }
    if (riseDim !== primary && riseAmt > EDGE_RISE_MIN) {
      return { story: "edge", leadDim: riseDim, baseDim: primary, riseDim, decreaseDim };
    }
    if (riseDim === primary) {
      // The leader is itself the biggest riser — it genuinely sharpens.
      return { story: "intensify", leadDim: primary, baseDim: null, riseDim, decreaseDim };
    }
    // Leader held, nothing else rose enough to be a real edge: broadly steady
    // (any notable *drop* is still surfaced via the "what recedes" line).
    return { story: "steady", leadDim: primary, baseDim: null, riseDim, decreaseDim };
  }

  function buildHeadline(rc, dimNames, change, cls) {
    // A genuine near-tie between two risers (and a story with real
    // movement) reads best as "towards a combination of A and B".
    if (cls.story !== "steady" && change.tiedIncreaseDims.length > 1) {
      const [a, b] = change.tiedIncreaseDims;
      return rc.headline.towardsCombination(dimNames[change.largestDecreaseDim], dimNames[a], dimNames[b]);
    }
    if (cls.story === "steady") {
      return rc.headline.balanced(dimNames[cls.riseDim] || dimNames[change.everydayPrimary]);
    }
    if (cls.story === "flip") {
      return rc.headline.movement(dimNames[change.everydayPrimary], dimNames[change.pressurePrimary]);
    }
    if (cls.story === "edge") {
      return rc.headline.edge(dimNames[cls.baseDim], dimNames[cls.leadDim]);
    }
    return rc.headline.sameFocusIntensifies(dimNames[cls.leadDim]);
  }

  function changeCell(rc, delta) {
    if (Math.abs(delta) < 5) return rc.changeNoChange;
    return delta > 0 ? `+${delta}` : `${delta}`;
  }

  function renderResults(root, handlers) {
    const everyday = pressureState.everydayScoreResult;
    const answers = pressureState.answers.filter(Boolean);
    const scoreResult = scorePressureAnswers(answers);
    pressureState.scoreResult = scoreResult;
    const change = computeChange(everyday.percentages, scoreResult.percentages);
    pressureState.change = change;
    pressureState.respondentName = handlers.respondentName;
    pressureState.teamCode = handlers.teamCode;

    if (!pressureState.cloudSaveAttempted) {
      pressureState.cloudSaveAttempted = true;
      saveResultToCloud(handlers.respondentName, handlers.teamCode, everyday, scoreResult, change);
    }

    const rc = CONTENT.pressureResults;
    const dimNames = CONTENT.results.dimensionNames;
    const everydayCat = contentForPattern(everyday.pattern);
    const pressureCat = contentForPattern(scoreResult.pattern);

    const bandKey = change.changeBand;
    const bandLabel = rc.changeBandLabels[bandKey];
    const bandDesc = rc.changeBandDescriptions[bandKey];
    const intensityWord = rc.changeIntensityWord[bandKey];

    // Body write-up selection — shift-aware (see classifyShift). The lead
    // voice is the dimension whose *movement* is the actual story: the new
    // leader if it flipped, the emerging edge if the leader held but
    // another dimension rose, or the leader itself when it genuinely
    // sharpens. This fixes results that re-described an unchanged dominant
    // priority while ignoring the real shift (e.g. Clarity-led, leaning
    // Drive under pressure — the story is Drive, not "more Clarity").
    const cls = classifyShift(change);
    const leadDim = cls.leadDim;
    const baseDim = cls.baseDim; // the unchanged anchor in the "edge" story, else null
    const decreaseDim = change.largestDecreaseDim;

    // Secondary thread: the biggest near-tied riser that isn't the lead
    // (null when there's a single clear riser, i.e. no genuine tie).
    const tiedSecondaryDim =
      change.tiedIncreaseDims.length > 1
        ? change.tiedIncreaseDims
            .filter((d) => d !== leadDim)
            .sort((a, b) => change.deltas[b] - change.deltas[a])[0] || null
        : null;

    const leadMovement = CONTENT.pressureMovement[leadDim];
    const secondaryMovement = tiedSecondaryDim ? CONTENT.pressureMovement[tiedSecondaryDim] : null;
    const decreaseMovement = CONTENT.pressureMovement[decreaseDim];

    const headline = buildHeadline(rc, dimNames, change, cls);
    const adjectives = rc.increaseAdjectives[leadDim].join(", ");
    const led = rc.everydayFocusPhrase[change.everydayPrimary];
    const summary = rc.summaryFor(cls.story, {
      everydayLed: led,
      leadDim: leadDim,
      baseDim: baseDim,
      leadLabel: dimNames[leadDim],
      baseLabel: baseDim ? dimNames[baseDim] : "",
      pressureFocus: rc.pressureFocusPhrase[leadDim],
      bandLabel: bandLabel,
      intensityWord: intensityWord,
      adjectives: adjectives,
    });

    // Each section leads with the dominant dimension's content, then folds
    // in one supporting bullet from the tied secondary dimension (if any),
    // keeping the lead voice clearly dominant.
    // The "what recedes" line is only honest when the receding dimension
    // is neither the lead nor the still-dominant anchor — otherwise we'd
    // tell someone their Clarity is fading in the same breath as calling
    // it their anchor.
    const showDecrease = decreaseDim !== leadDim && decreaseDim !== baseDim;
    const noticeBullets = leadMovement.increaseNotice
      .slice(0, secondaryMovement ? 2 : 3)
      .concat(secondaryMovement ? secondaryMovement.increaseNotice.slice(0, 1) : [])
      .concat(showDecrease ? [decreaseMovement.decreaseNotice] : []);
    const valueBullets = leadMovement.increaseValue.concat(
      secondaryMovement ? secondaryMovement.increaseValue.slice(0, 1) : []
    );
    const riskBullets = leadMovement.increaseRisk
      .concat(secondaryMovement ? secondaryMovement.increaseRisk.slice(0, 1) : [])
      .concat([rc.changeAwarenessRisk(bandLabel)]);
    const selfMgmtBullets = leadMovement.increaseSelfManagement
      .concat(secondaryMovement ? secondaryMovement.increaseSelfManagement.slice(0, 1) : [])
      .concat([rc.selfManagementClosing]);

    root.innerHTML = `
      <div class="mvs-screen mvs-screen--results" id="mvs-pressure-results-capture">
        <a href="index.html" class="mvs-meta-line mvs-print-hide">&larr; Back to home</a>
        <p class="mvs-eyebrow">${escapeHtmlLocal(rc.headerEyebrow(handlers.respondentName))}</p>
        <h1>${escapeHtmlLocal(rc.title)}</h1>
        <p class="mvs-lead">${escapeHtmlLocal(rc.subtitle)}</p>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtmlLocal(rc.chartTitle)}</h2>
          <div id="mvs-shift-chart-container"></div>
        </section>

        <div class="mvs-result-summary-grid">
          <div class="mvs-result-summary-card">
            <p class="mvs-summary-label">${escapeHtmlLocal(rc.everydayLabel)}</p>
            <p class="mvs-summary-value">${escapeHtmlLocal(everydayCat.label)}</p>
          </div>
          <div class="mvs-result-summary-card">
            <p class="mvs-summary-label">${escapeHtmlLocal(rc.pressureLabel)}</p>
            <p class="mvs-summary-value">${escapeHtmlLocal(pressureCat.label)}</p>
          </div>
          <div class="mvs-result-summary-card mvs-result-summary-card--wide">
            <p class="mvs-summary-label">${escapeHtmlLocal(rc.changeLabel)}</p>
            <p class="mvs-summary-value">${escapeHtmlLocal(bandLabel)} (${change.changeScore})</p>
          </div>
        </div>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtmlLocal(headline)}</h2>
          <p class="mvs-interpretation">${escapeHtmlLocal(summary)}</p>
          <p class="mvs-note">${escapeHtmlLocal(bandDesc)}</p>
        </section>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtmlLocal(rc.scoreTableHeading)}</h2>
          <div class="mvs-matrix-scroll">
            <table class="mvs-overlay-table">
              <thead>
                <tr>
                  <th>${escapeHtmlLocal(rc.colPriority)}</th>
                  <th>${escapeHtmlLocal(rc.colEveryday)}</th>
                  <th>${escapeHtmlLocal(rc.colPressure)}</th>
                  <th>${escapeHtmlLocal(rc.colChange)}</th>
                </tr>
              </thead>
              <tbody>
                ${DIMENSIONS.map(
                  (d) => `
                  <tr>
                    <td>${escapeHtmlLocal(dimNames[d])}</td>
                    <td>${everyday.percentages[d]}%</td>
                    <td>${scoreResult.percentages[d]}%</td>
                    <td>${escapeHtmlLocal(changeCell(rc, change.deltas[d]))}</td>
                  </tr>
                `
                ).join("")}
              </tbody>
            </table>
          </div>
        </section>

        ${renderListSection(rc.sectionHeadings.whatOthersMayNotice, noticeBullets)}
        ${renderListSection(rc.sectionHeadings.whatRemainsValuable, valueBullets)}
        ${renderListSection(rc.sectionHeadings.risksToWatch, riskBullets)}
        ${renderListSection(rc.sectionHeadings.selfManagement, selfMgmtBullets)}

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtmlLocal(rc.sectionHeadings.howColleaguesCanWork)}</h2>
          <p class="mvs-note">${escapeHtmlLocal(leadMovement.colleaguesGuidance)}</p>
        </section>

        ${renderListSection(rc.sectionHeadings.reflection, rc.reflectionQuestions)}

        <p class="mvs-footer-note">${escapeHtmlLocal(rc.disclaimer)}</p>

        <section class="mvs-section" id="mvs-pressure-cloud-save-section">
          <p class="mvs-note" id="mvs-pressure-cloud-save-note" hidden></p>
        </section>

        <div class="mvs-btn-row mvs-btn-row--results">
          <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-pressure-export-pdf">${escapeHtmlLocal(
            rc.exportCta
          )}</button>
          <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-pressure-restart">${escapeHtmlLocal(
            rc.restartCta
          )}</button>
        </div>
        <p class="mvs-note mvs-print-hide">${escapeHtmlLocal(rc.exportNote)}</p>
      </div>
    `;

    const chartContainer = document.getElementById("mvs-shift-chart-container");
    renderPriorityShiftChart(chartContainer, everyday.percentages, scoreResult.percentages, dimNames, {
      everyday: rc.chartLegendEveryday,
      pressure: rc.chartLegendPressure,
    });

    updateCloudSaveNote();

    document.getElementById("mvs-pressure-export-pdf").addEventListener("click", () => window.print());
    document.getElementById("mvs-pressure-restart").addEventListener("click", handlers.onRestart);
  }

  /**
   * Best-effort save to the shared database (see supabaseClient.js and
   * README's "Database setup"). This extends the same `submissions`
   * table the Everyday Priorities result already saved a row to a
   * moment earlier — rather than updating that row (which would need a
   * new UPDATE RLS policy the anon role doesn't have, and no easy way
   * to re-identify that row client-side), it inserts a second,
   * self-contained row with `record_type: "pressure"` carrying both the
   * pressure scores and a copy of the everyday scores/change data, so
   * nothing needs joining back together later for reporting.
   */
  function saveResultToCloud(name, teamCode, everyday, scoreResult, change) {
    if (typeof SupabaseClient === "undefined") {
      pressureState.cloudSaveStatus = "fail";
      updateCloudSaveNote();
      return;
    }
    const record = {
      name: name.trim(),
      record_type: "pressure",
      drive: scoreResult.percentages.drive,
      connection: scoreResult.percentages.connection,
      clarity: scoreResult.percentages.clarity,
      pattern: scoreResult.pattern.key,
      everyday_drive: everyday.percentages.drive,
      everyday_connection: everyday.percentages.connection,
      everyday_clarity: everyday.percentages.clarity,
      change_score: change.changeScore,
      change_band: change.changeBand,
      largest_increase_dimension: change.largestIncreaseDim,
      largest_decrease_dimension: change.largestDecreaseDim,
      team_code: teamCode && teamCode.trim() ? teamCode.trim() : null,
    };
    const finish = (ok) => {
      pressureState.cloudSaveStatus = ok ? "ok" : "fail";
      updateCloudSaveNote();
    };
    // Phase 2: link to the signed-in account + organisation when present,
    // and send the insert authenticated so Row Level Security accepts it.
    // Not signed in (or no auth layer) -> saves anonymously, as before.
    const doInsert = (identity) => {
      let token;
      if (identity) {
        record.user_id = identity.userId;
        record.organisation_id = identity.organisationId;
        token = identity.accessToken;
      }
      SupabaseClient.insert("submissions", record, token).then(finish);
    };
    if (typeof Auth !== "undefined" && Auth.isSignedIn()) {
      Auth.identityForSave().then(doInsert);
    } else {
      doInsert(null);
    }
  }

  function updateCloudSaveNote() {
    const el = document.getElementById("mvs-pressure-cloud-save-note");
    if (!el || !pressureState.cloudSaveStatus) return;
    const rc = CONTENT.pressureResults;
    el.hidden = false;
    el.textContent =
      pressureState.cloudSaveStatus === "ok" ? rc.cloudSaveOkNote(pressureState.teamCode) : rc.cloudSaveFailNote;
  }

  return {
    start,
    renderOfferBannerHtml,
    wireOfferBanner,
    renderIntro,
    renderQuestion,
    renderResults,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PressureFlow };
}
