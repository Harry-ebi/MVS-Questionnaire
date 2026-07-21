/**
 * app.js
 * -----------------------------------------------------------------------
 * Main single-page app logic: screen state machine, rendering, and
 * event wiring. No framework/build step required — plain DOM.
 * -----------------------------------------------------------------------
 */

(function () {
  "use strict";

  const root = document.getElementById("app");

  const state = {
    screen: "landing", // landing | privacy | name | questionnaire | results
    questionOrder: [], // shuffled option order per question, built once per run
    currentIndex: 0,
    answers: [], // { questionId, dimension }
    consentGiven: false,
    respondentName: "",
    lastScoreResult: null,
  };

  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildQuestionOrder() {
    state.questionOrder = CONTENT.questions.map((q) => ({
      ...q,
      options: shuffle(q.options),
    }));
  }

  function resetRun() {
    state.currentIndex = 0;
    state.answers = [];
    state.consentGiven = false;
    state.respondentName = "";
    state.lastScoreResult = null;
    buildQuestionOrder();
  }

  function goTo(screen) {
    state.screen = screen;
    render();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  // ------------------------------------------------------------------
  // Screen renderers
  // ------------------------------------------------------------------

  function renderLanding() {
    const c = CONTENT.landing;
    root.innerHTML = `
      <div class="mvs-screen mvs-screen--landing">
        <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
        <a href="index.html" class="mvs-meta-line">&larr; Back to home</a>
        <h1>${escapeHtml(c.title)}</h1>
        <p class="mvs-lead">${escapeHtml(c.intro)}</p>
        <div class="mvs-callout">
          <p>${escapeHtml(c.disclaimer)}</p>
        </div>
        <p class="mvs-meta-line">Takes about ${CONTENT.meta.estimatedMinutes}. No account needed.</p>
        <p class="mvs-meta-line">Looking for the <a href="team.html">team overlay</a> or <a href="guess.html">blind-spot exercise</a> instead?</p>
        <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-start-btn">${escapeHtml(c.startCta)}</button>
      </div>
    `;
    document.getElementById("mvs-start-btn").addEventListener("click", () => {
      resetRun();
      goTo("privacy");
    });
  }

  function renderPrivacy() {
    const c = CONTENT.privacy;
    root.innerHTML = `
      <div class="mvs-screen mvs-screen--privacy">
        <a href="index.html" class="mvs-meta-line">&larr; Back to home</a>
        <h1>${escapeHtml(c.title)}</h1>
        <p class="mvs-lead">${escapeHtml(c.body)}</p>
        <ul class="mvs-list">
          ${c.points.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
        </ul>
        <label class="mvs-checkbox-row">
          <input type="checkbox" id="mvs-consent-checkbox" />
          <span>${escapeHtml(c.consentLabel)}</span>
        </label>
        <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-consent-continue" disabled>
          ${escapeHtml(c.continueCta)}
        </button>
      </div>
    `;
    const checkbox = document.getElementById("mvs-consent-checkbox");
    const continueBtn = document.getElementById("mvs-consent-continue");
    checkbox.addEventListener("change", () => {
      state.consentGiven = checkbox.checked;
      continueBtn.disabled = !checkbox.checked;
    });
    continueBtn.addEventListener("click", () => {
      if (!state.consentGiven) return;
      goTo("name");
    });
  }

  function renderNameCapture() {
    const c = CONTENT.nameCapture;
    root.innerHTML = `
      <div class="mvs-screen mvs-screen--name">
        <a href="index.html" class="mvs-meta-line">&larr; Back to home</a>
        <h1>${escapeHtml(c.title)}</h1>
        <p class="mvs-lead">${escapeHtml(c.body)}</p>
        <form id="mvs-name-form" novalidate>
          <label class="mvs-field-label" for="mvs-name-input">${escapeHtml(c.label)}</label>
          <input type="text" id="mvs-name-input" class="mvs-text-input" placeholder="${escapeHtml(
            c.placeholder
          )}" value="${escapeHtml(state.respondentName)}" autocomplete="name" />
          <p class="mvs-note" id="mvs-name-error" hidden></p>
          <button type="submit" class="mvs-btn mvs-btn--primary" id="mvs-name-continue">${escapeHtml(
            c.continueCta
          )}</button>
        </form>
      </div>
    `;

    document.getElementById("mvs-name-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("mvs-name-input");
      const errorNote = document.getElementById("mvs-name-error");
      const name = input.value.trim();
      if (!name) {
        errorNote.hidden = false;
        errorNote.textContent = c.errorNote;
        return;
      }
      state.respondentName = name;
      goTo("questionnaire");
    });
  }

  function currentQuestion() {
    return state.questionOrder[state.currentIndex];
  }

  function renderQuestionnaire() {
    const total = state.questionOrder.length;
    const q = currentQuestion();
    const pct = Math.round((state.currentIndex / total) * 100);

    root.innerHTML = `
      <div class="mvs-screen mvs-screen--question">
        <a href="index.html" class="mvs-meta-line">&larr; Back to home</a>
        <div class="mvs-progress-wrap" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
          <div class="mvs-progress-track">
            <div class="mvs-progress-fill" style="width:${pct}%"></div>
          </div>
          <p class="mvs-progress-label">${escapeHtml(
            CONTENT.progress.questionLabel(state.currentIndex + 1, total)
          )}</p>
        </div>
        <h2 class="mvs-question-prompt">${escapeHtml(q.prompt)}</h2>
        <div class="mvs-options" role="group" aria-label="Answer options">
          ${q.options
            .map(
              (opt, i) => `
            <button type="button" class="mvs-option-btn" data-dimension="${opt.dimension}" data-index="${i}">
              <span class="mvs-option-letter">${String.fromCharCode(65 + i)}</span>
              <span class="mvs-option-text">${escapeHtml(opt.text)}</span>
            </button>
          `
            )
            .join("")}
        </div>
        ${
          state.currentIndex > 0
            ? `<button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-back-btn">Back</button>`
            : ""
        }
      </div>
    `;

    root.querySelectorAll(".mvs-option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dimension = btn.getAttribute("data-dimension");
        state.answers[state.currentIndex] = {
          questionId: q.id,
          dimension,
        };
        if (state.currentIndex + 1 < total) {
          state.currentIndex += 1;
          render();
        } else {
          goTo("results");
        }
      });
    });

    const backBtn = document.getElementById("mvs-back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        state.currentIndex = Math.max(0, state.currentIndex - 1);
        render();
      });
    }
  }

  function renderResults() {
    const answers = state.answers.filter(Boolean);
    const scoreResult = scoreAnswers(answers);
    state.lastScoreResult = scoreResult;
    submitAnonymisedResult(scoreResult);

    const cat = CONTENT.categoryContent[scoreResult.category];
    const rc = CONTENT.results;
    const dimNames = rc.dimensionNames;

    root.innerHTML = `
      <div class="mvs-screen mvs-screen--results" id="mvs-results-capture">
        <a href="index.html" class="mvs-meta-line mvs-print-hide">&larr; Back to home</a>
        <p class="mvs-eyebrow">${escapeHtml(rc.headerEyebrow(state.respondentName))}</p>
        <h1>${escapeHtml(cat.label)}</h1>

        <div class="mvs-result-summary-grid">
          <div class="mvs-result-summary-card">
            <p class="mvs-summary-label">${escapeHtml(rc.primaryLabel)}</p>
            <p class="mvs-summary-value">${escapeHtml(dimNames[scoreResult.primary])}</p>
          </div>
          <div class="mvs-result-summary-card">
            <p class="mvs-summary-label">${escapeHtml(rc.secondaryLabel)}</p>
            <p class="mvs-summary-value">${escapeHtml(dimNames[scoreResult.secondary])}</p>
          </div>
          <div class="mvs-result-summary-card mvs-result-summary-card--wide">
            <p class="mvs-summary-label">${escapeHtml(rc.blendLabel)}</p>
            <p class="mvs-summary-value">${escapeHtml(cat.label)}</p>
          </div>
        </div>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtml(rc.chartTitle)}</h2>
          <div id="mvs-chart-container"></div>
        </section>

        <section class="mvs-section">
          <p class="mvs-interpretation">${escapeHtml(cat.interpretation)}</p>
        </section>

        ${renderResultListSection("Potential strengths", cat.strengths)}
        ${renderResultListSection("Possible overuse risks", cat.overuseRisks)}
        ${renderOveruseArrowsSection(cat.overuseArrows)}
        ${renderResultListSection("Communication tips", cat.communicationTips)}
        ${renderQuickReferenceSection(cat.quickReference)}
        ${renderResultListSection("How others may best work with you", cat.howOthersCanWork)}
        ${renderWorkingWithGuideSection(scoreResult.category, cat.label)}

        <p class="mvs-footer-note">${escapeHtml(rc.footerNote)}</p>

        <section class="mvs-section" id="mvs-save-file-section">
          <h2 class="mvs-section-title">${escapeHtml(rc.saveFileHeading)}</h2>
          <p class="mvs-note">${escapeHtml(rc.saveFileNote)}</p>
          <div class="mvs-btn-row">
            <input type="text" id="mvs-save-file-name" class="mvs-text-input" placeholder="${escapeHtml(
              rc.saveFileNamePlaceholder
            )}" value="${escapeHtml(state.respondentName)}" style="margin-bottom:0;flex:1;" />
            <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-save-file-btn">${escapeHtml(
              rc.saveFileCta
            )}</button>
          </div>
          <p class="mvs-note" id="mvs-save-file-status" hidden></p>
        </section>

        <div class="mvs-btn-row mvs-btn-row--results">
          <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-export-pdf">${escapeHtml(
            rc.exportCta
          )}</button>
          <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-restart">${escapeHtml(
            rc.restartCta
          )}</button>
        </div>
        <p class="mvs-note mvs-print-hide">${escapeHtml(rc.exportNote)}</p>
      </div>
    `;

    const chartContainer = document.getElementById("mvs-chart-container");
    renderResultsChart(chartContainer, scoreResult.percentages, dimNames);

    document.getElementById("mvs-restart").addEventListener("click", () => {
      resetRun();
      goTo("landing");
    });

    document.getElementById("mvs-export-pdf").addEventListener("click", () => {
      exportResultsAsPdf();
    });

    document.getElementById("mvs-save-file-btn").addEventListener("click", () => {
      const nameInput = document.getElementById("mvs-save-file-name");
      const status = document.getElementById("mvs-save-file-status");
      const name = nameInput.value.trim();
      if (!name) {
        status.hidden = false;
        status.textContent = "Type your name first, so your teammates can tell whose result this is.";
        return;
      }
      downloadResultFile(name, scoreResult);
      status.hidden = false;
      status.textContent = `Saved. Put "${resultFileName(name)}" in your team's shared folder.`;
    });
  }

  function slugForFilename(name) {
    return String(name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "you";
  }

  function resultFileName(name) {
    return `result-${slugForFilename(name)}.json`;
  }

  function downloadResultFile(name, scoreResult) {
    const payload = {
      type: "wow-result",
      name: name.trim(),
      percentages: scoreResult.percentages,
      category: scoreResult.category,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resultFileName(name);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function renderResultListSection(title, items) {
    return `
      <section class="mvs-section">
        <h2 class="mvs-section-title">${escapeHtml(title)}</h2>
        <ul class="mvs-list">
          ${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  function renderOveruseArrowsSection(arrows) {
    if (!arrows || !arrows.length) return "";
    return `
      <section class="mvs-section">
        <div class="mvs-arrow-row">
          ${arrows
            .map(
              (a) => `
            <span class="mvs-arrow-tag"><strong>${escapeHtml(a.strength)}</strong> &rarr; ${escapeHtml(
                a.overuse
              )}</span>
          `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderQuickReferenceSection(ref) {
    if (!ref) return "";
    return `
      <section class="mvs-section">
        <div class="mvs-quick-reference">
          <p><strong>Focus on:</strong> ${escapeHtml(ref.focus)}</p>
          <p><strong>Avoid:</strong> ${escapeHtml(ref.avoid)}</p>
        </div>
      </section>
    `;
  }

  function renderWorkingWithGuideSection(ownCategoryId, ownLabel) {
    const rc = CONTENT.results;
    const guide = CONTENT.workingWithGuide;
    const order = CONTENT.categoryOrder;
    const others = order.filter((id) => id !== ownCategoryId);

    return `
      <section class="mvs-section">
        <h2 class="mvs-section-title">${escapeHtml(rc.workingGuideHeading)}</h2>
        <p class="mvs-note">${escapeHtml(rc.workingGuideIntro(ownLabel))}</p>
        <div class="mvs-wwd-grid">
          ${others
            .map((id) => {
              const entry = guide[id];
              const label = CONTENT.categoryContent[id].label;
              return `
              <div class="mvs-wwd-card">
                <div class="mvs-wwd-swatch mvs-wwd-swatch--${id}"></div>
                <h3>${escapeHtml(label)}</h3>
                <p class="mvs-wwd-tagline">${escapeHtml(entry.tagline)}</p>
                <ul class="mvs-list">
                  ${entry.tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
                </ul>
              </div>
            `;
            })
            .join("")}
        </div>
      </section>
    `;
  }

  function exportResultsAsPdf() {
    // Uses the browser's own print engine (via a dedicated @media print
    // stylesheet in styles.css) rather than a canvas-rasterising library.
    // We tried html2canvas/html2pdf.js here previously, but it's known to
    // mishandle exactly the things this page needs: it can produce a
    // blank leading page, fail to rasterise the SVG triangle chart, crop
    // content that's wider than its internal canvas assumptions, and
    // slice text across page breaks mid-sentence. The browser's native
    // print-to-PDF avoids all of that because it lays the page out for
    // real instead of screenshotting it. Choosing "Save as PDF" as the
    // destination in the print dialog produces the file.
    window.print();
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function render() {
    switch (state.screen) {
      case "landing":
        renderLanding();
        break;
      case "privacy":
        renderPrivacy();
        break;
      case "name":
        renderNameCapture();
        break;
      case "questionnaire":
        renderQuestionnaire();
        break;
      case "results":
        renderResults();
        break;
      default:
        renderLanding();
    }
  }

  // Initial paint
  render();
})();
