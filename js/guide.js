/**
 * guide.js
 * -----------------------------------------------------------------------
 * "Working with other colours" — the communication guide, reachable
 * directly from the home page rather than only after completing the full
 * solo reflection. Three ways to tell the page your own starting point:
 *   (a) pick your result directly,
 *   (b) place yourself on the interactive triangle, or
 *   (c) load a previously-saved result-*.json file.
 * Once a starting point is set, it shows a directional guide to working
 * with each of the other six results, plus what to expect meeting someone
 * who shares your own. Entirely local — nothing is uploaded anywhere.
 * -----------------------------------------------------------------------
 */

(function () {
  "use strict";

  const root = document.getElementById("app");
  const c = CONTENT.commsGuide;
  const order = CONTENT.categoryOrder;
  const dimNames = CONTENT.results.dimensionNames;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function readFileAsJson(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve({ file, data: JSON.parse(reader.result) });
        } catch (err) {
          resolve({ file, data: null });
        }
      };
      reader.onerror = () => resolve({ file, data: null });
      reader.readAsText(file);
    });
  }

  function renderSelector() {
    root.innerHTML = `
      <div class="mvs-screen">
        <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
        <h1>${escapeHtml(c.pageTitle)}</h1>
        <p class="mvs-lead">${escapeHtml(c.intro)}</p>
        <a href="index.html" class="mvs-meta-line">&larr; Back to home</a>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtml(c.methodsHeading)}</h2>

          <div class="mvs-method-block">
            <h3>${escapeHtml(c.methodPickTitle)}</h3>
            <p class="mvs-note">${escapeHtml(c.methodPickBody)}</p>
            <div class="mvs-type-grid" id="mvs-type-grid"></div>
          </div>

          <div class="mvs-method-block">
            <h3>${escapeHtml(c.methodTriangleTitle)}</h3>
            <p class="mvs-note">${escapeHtml(c.methodTriangleBody)}</p>
            <div id="mvs-guide-triangle"></div>
            <p class="mvs-guess-readout" id="mvs-triangle-readout"></p>
            <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-triangle-confirm">${escapeHtml(
              c.methodTriangleCta
            )}</button>
          </div>

          <div class="mvs-method-block">
            <h3>${escapeHtml(c.methodUploadTitle)}</h3>
            <p class="mvs-note">${escapeHtml(c.methodUploadBody)}</p>
            <input type="file" id="mvs-guide-file-input" accept="application/json,.json" style="display:none" />
            <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-guide-choose-file-btn">${escapeHtml(
              c.methodUploadButtonLabel
            )}</button>
            <p class="mvs-note mvs-guide-upload-error" id="mvs-guide-upload-error" hidden></p>
          </div>
        </section>
      </div>
    `;

    wireMethodPick();
    wireMethodTriangle();
    wireMethodUpload();
  }

  function wireMethodPick() {
    const typeGrid = document.getElementById("mvs-type-grid");
    typeGrid.innerHTML = order
      .map((id) => {
        const cat = CONTENT.categoryContent[id];
        const tagline = CONTENT.workingWithGuide[id].tagline;
        return `
          <button type="button" class="mvs-type-btn" data-category="${id}">
            <span class="mvs-wwd-swatch mvs-wwd-swatch--${id}"></span>
            <span class="mvs-type-btn-label">${escapeHtml(cat.label)}</span>
            <span class="mvs-type-btn-tagline">${escapeHtml(tagline)}</span>
          </button>
        `;
      })
      .join("");

    typeGrid.querySelectorAll(".mvs-type-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        renderGuide(btn.getAttribute("data-category"), c.sourcePick);
      });
    });
  }

  function wireMethodTriangle() {
    const readout = document.getElementById("mvs-triangle-readout");

    function updateReadout(pct) {
      const category = deriveCategory(rankDimensions(pct));
      const label = CONTENT.categoryContent[category].label;
      readout.textContent = `${dimNames.people} ${pct.people}% · ${dimNames.performance} ${pct.performance}% · ${dimNames.process} ${pct.process}% — ${c.methodTriangleReadoutPrefix} ${label}`;
    }

    const handle = createInteractiveTriangle(
      document.getElementById("mvs-guide-triangle"),
      dimNames,
      { people: 34, performance: 33, process: 33 },
      updateReadout
    );
    updateReadout(handle.getPercentages());

    document.getElementById("mvs-triangle-confirm").addEventListener("click", () => {
      const pct = handle.getPercentages();
      const category = deriveCategory(rankDimensions(pct));
      renderGuide(category, c.sourceTriangle(pct.people, pct.performance, pct.process));
    });
  }

  function wireMethodUpload() {
    const fileInput = document.getElementById("mvs-guide-file-input");
    const chooseBtn = document.getElementById("mvs-guide-choose-file-btn");
    const errorNote = document.getElementById("mvs-guide-upload-error");

    chooseBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const { data } = await readFileAsJson(file);
      const looksValid =
        data && data.type === "wow-result" && typeof data.category === "string" && CONTENT.categoryContent[data.category];
      if (!looksValid) {
        errorNote.textContent = c.methodUploadInvalid;
        errorNote.hidden = false;
        fileInput.value = "";
        return;
      }
      errorNote.hidden = true;
      renderGuide(data.category, c.sourceUpload(data.name));
    });
  }

  /**
   * Renders the directional guide for `categoryId` (the reader's own
   * result): one card per category in CONTENT.categoryOrder, including a
   * card for meeting someone who shares the reader's own result. Each
   * card's "best approach" / "what you bring" / "watch for" text is
   * composed at render time from the existing per-category reference
   * fields via the templates in CONTENT.commsGuide; the closing one-line
   * reminder is the bespoke per-pair text from CONTENT.commsGuide.reminders.
   */
  function renderGuide(categoryId, sourceLine) {
    const me = CONTENT.categoryContent[categoryId];
    const meLabel = me.label;

    const cards = order
      .map((themId, index) => {
        const them = CONTENT.categoryContent[themId];
        const isSelf = themId === categoryId;
        const heading = isSelf ? c.selfPairLabel(meLabel) : them.label;
        const approach = c.approachTemplate(them.quickReference.focus, them.quickReference.avoid);
        // Cycle through "my" own strengths/overuse-risks by column position
        // rather than always using entry 0 — keeps the seven cards from
        // reading as identical repeats of the same two sentences, while
        // still drawing only on the reader's own already-reviewed content.
        const strength = c.strengthTemplate(meLabel, me.strengths[index % me.strengths.length], them.quickReference.focus);
        const watchFor = c.watchForTemplate(me.overuseRisks[index % me.overuseRisks.length]);
        const reminder = c.reminders[categoryId][themId];

        return `
          <div class="mvs-wwd-card mvs-commguide-card">
            <div class="mvs-wwd-swatch mvs-wwd-swatch--${themId}"></div>
            <h3>${escapeHtml(heading)}</h3>
            <p class="mvs-commguide-field-label">${escapeHtml(c.approachLabel)}</p>
            <ul class="mvs-list">
              ${approach.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}
            </ul>
            <p class="mvs-commguide-field-label">${escapeHtml(c.strengthLabel)}</p>
            <p class="mvs-commguide-text">${escapeHtml(strength)}</p>
            <p class="mvs-commguide-field-label">${escapeHtml(c.watchForLabel)}</p>
            <p class="mvs-commguide-text">${escapeHtml(watchFor)}</p>
            <p class="mvs-commguide-reminder">${escapeHtml(c.reminderLabel)}: “${escapeHtml(reminder)}”</p>
          </div>
        `;
      })
      .join("");

    root.innerHTML = `
      <div class="mvs-screen">
        <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
        <h1>${escapeHtml(c.resultHeading(meLabel))}</h1>
        <a href="index.html" class="mvs-meta-line mvs-print-hide">&larr; Back to home</a>

        <section class="mvs-section">
          <p class="mvs-note">${escapeHtml(c.resultIntro(meLabel, sourceLine))}</p>
          <button type="button" class="mvs-btn mvs-btn--ghost mvs-print-hide" id="mvs-guide-restart">${escapeHtml(
            c.changeStartCta
          )}</button>
        </section>

        <section class="mvs-section">
          <div class="mvs-wwd-grid">
            ${cards}
          </div>
        </section>

        <div class="mvs-btn-row mvs-print-hide">
          <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-guide-export-pdf">${escapeHtml(c.exportCta)}</button>
        </div>
        <p class="mvs-note mvs-print-hide">${escapeHtml(c.exportNote)}</p>
      </div>
    `;

    document.getElementById("mvs-guide-restart").addEventListener("click", renderSelector);
    document.getElementById("mvs-guide-export-pdf").addEventListener("click", () => window.print());
  }

  renderSelector();
})();
