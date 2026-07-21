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

  function renderQuestion(root, handlers) {
    const total = pressureState.order.length;
    const q = currentPressureQuestion();
    const existingAnswer = pressureState.answers[pressureState.currentIndex];
    if (pressureState.currentRanks.length === 0 && existingAnswer) {
      pressureState.currentRanks = ranksFromAnswer(existingAnswer);
    }
    const pc = CONTENT.pressureProgress;
    const rankLabels = [
      CONTENT.pressureIntro.rankLabels.most,
      CONTENT.pressureIntro.rankLabels.next,
      CONTENT.pressureIntro.rankLabels.least,
    ];
    const pct = Math.round((pressureState.currentIndex / total) * 100);
    const complete = pressureState.currentRanks.length === 3;

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
            .map((opt, i) => {
              const rankPos = pressureState.currentRanks.indexOf(opt.dimension);
              const ranked = rankPos !== -1;
              const isAuto = opt.dimension === pressureState.lastAutoCompletedDim;
              return `
              <button type="button" class="mvs-pressure-option-btn${
                ranked ? " mvs-pressure-option-btn--ranked" : ""
              }" data-dimension="${opt.dimension}" data-index="${i}" ${ranked ? "disabled" : ""}>
                ${
                  ranked
                    ? `<span class="mvs-pressure-rank-badge${
                        isAuto ? " mvs-pressure-rank-badge--auto" : ""
                      }">${escapeHtmlLocal(rankLabels[rankPos])}</span>`
                    : ""
                }
                <span class="mvs-option-text">${escapeHtmlLocal(opt.text)}</span>
              </button>
            `;
            })
            .join("")}
        </div>
        <p class="mvs-note" id="mvs-pressure-error" ${complete ? "hidden" : ""}>${escapeHtmlLocal(
      pc.incompleteError
    )}</p>
        <div class="mvs-btn-row">
          <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-pressure-back-btn">Back</button>
          <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-pressure-clear-btn">${escapeHtmlLocal(
            pc.clearCta
          )}</button>
          <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-pressure-continue-btn" ${
            complete ? "" : "disabled"
          }>Continue</button>
        </div>
      </div>
    `;

    // Initial paint shouldn't show the "rank all three" error before
    // anyone's touched anything.
    if (!pressureState.currentRanks.length) {
      const errEl = document.getElementById("mvs-pressure-error");
      if (errEl) errEl.hidden = true;
    }

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
        renderQuestion(root, handlers);
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
      renderQuestion(root, handlers);
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

  function buildHeadline(rc, dimNames, change) {
    if (change.isBalancedMovement) {
      return rc.headline.balanced(dimNames[change.largestIncreaseDim] || dimNames[change.everydayPrimary]);
    }
    if (!change.primaryChanged) {
      return rc.headline.sameFocusIntensifies(dimNames[change.everydayPrimary]);
    }
    if (change.tiedIncreaseDims.length > 1) {
      const [a, b] = change.tiedIncreaseDims;
      return rc.headline.towardsCombination(dimNames[change.largestDecreaseDim], dimNames[a], dimNames[b]);
    }
    return rc.headline.movement(dimNames[change.everydayPrimary], dimNames[change.pressurePrimary]);
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

    const increaseDim = change.largestIncreaseDim;
    const decreaseDim = change.largestDecreaseDim;
    const movement = CONTENT.pressureMovement[increaseDim];
    const decreaseMovement = CONTENT.pressureMovement[decreaseDim];

    const headline = buildHeadline(rc, dimNames, change);
    const adjectives = rc.increaseAdjectives[increaseDim].join(", ");
    const summary =
      `In everyday working relationships, your priorities are led by ${rc.everydayFocusPhrase[change.everydayPrimary]}. ` +
      `When disagreement continues, your priorities shift towards ${rc.pressureFocusPhrase[increaseDim]}. ` +
      `This is a ${bandLabel.toLowerCase()}, meaning colleagues may experience you as ${intensityWord} more ${adjectives} than they normally expect.`;

    const noticeBullets = movement.increaseNotice.slice(0, 3).concat(decreaseDim !== increaseDim ? [decreaseMovement.decreaseNotice] : []);
    const valueBullets = movement.increaseValue;
    const riskBullets = movement.increaseRisk.concat([rc.changeAwarenessRisk(bandLabel)]);
    const selfMgmtBullets = movement.increaseSelfManagement.concat([rc.selfManagementClosing]);

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
          <p class="mvs-note">${escapeHtmlLocal(movement.colleaguesGuidance)}</p>
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
    SupabaseClient.insert("submissions", record).then((ok) => {
      pressureState.cloudSaveStatus = ok ? "ok" : "fail";
      updateCloudSaveNote();
    });
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
