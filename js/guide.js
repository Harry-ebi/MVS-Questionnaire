/**
 * guide.js
 * -----------------------------------------------------------------------
 * "Working with different priorities" — the guidance tool, reachable
 * directly from the home page rather than only after completing the full
 * solo reflection. Three ways to tell the page your own starting point:
 *   (a) pick your leading priority directly,
 *   (b) place yourself on the interactive chart, or
 *   (c) load a previously-saved result-*.json file.
 * Once a starting point is set, it shows a generated guide (see
 * js/commsGuidance.js) to working with each of the three dimensions, plus
 * what to expect meeting someone with a similar pattern to your own.
 * Entirely local — nothing is uploaded anywhere.
 * -----------------------------------------------------------------------
 */

(function () {
  "use strict";

  const root = document.getElementById("app");
  const c = CONTENT.commsGuide;
  const dimOrder = CONTENT.dimensionOrder;
  const dimNames = CONTENT.results.dimensionNames;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function renderQuickReference(ref) {
    if (!ref) return "";
    return `
      <div class="mvs-quick-reference">
        <p><strong>Focus on:</strong> ${escapeHtml(ref.focus)}</p>
        <p><strong>Avoid:</strong> ${escapeHtml(ref.avoid)}</p>
      </div>
    `;
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

  // Look up the write-up for a full pattern object ({type, primary,
  // secondary}) — Focused uses dimensionContent, Dual-led uses
  // dualContent keyed by orderedPairKey, Balanced uses balancedContent.
  function contentForPattern(pattern) {
    if (pattern.type === PATTERN.FOCUSED) return CONTENT.dimensionContent[pattern.primary];
    if (pattern.type === PATTERN.DUAL) return CONTENT.dualContent[orderedPairKey(pattern.primary, pattern.secondary)];
    return CONTENT.balancedContent;
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

    // Single-led options...
    const singleOptions = dimOrder.map((dim) => ({
      swatch: [dim],
      label: `${CONTENT.dimensionContent[dim].label}-led`,
      tagline: CONTENT.workingWithGuide[dim].tagline,
      pattern: { type: PATTERN.FOCUSED, primary: dim, secondary: dim, key: `focused_${dim}` },
    }));

    // ...dual-led blends (like 49 Drive / 48 Clarity)...
    const pairs = [
      ["drive", "connection"],
      ["drive", "clarity"],
      ["connection", "clarity"],
    ];
    const dualOptions = pairs.map(([a, b]) => {
      const key = orderedPairKey(a, b);
      return {
        swatch: [a, b],
        label: (CONTENT.dualContent[key] || {}).label || `${dimNames[a]} & ${dimNames[b]}`,
        tagline: c.dualTagline || "A blend of both",
        pattern: { type: PATTERN.DUAL, primary: a, secondary: b, key: `dual_${key}` },
      };
    });

    // ...and balanced.
    const balancedOption = {
      swatch: dimOrder.slice(),
      label: (CONTENT.balancedContent && CONTENT.balancedContent.label) || "Balanced",
      tagline: c.balancedTagline || "Fairly even across all three",
      pattern: { type: PATTERN.BALANCED, primary: dimOrder[0], secondary: dimOrder[1], key: "balanced" },
    };

    const options = singleOptions.concat(dualOptions, [balancedOption]);

    typeGrid.innerHTML = options
      .map(
        (opt, i) => `
          <button type="button" class="mvs-type-btn" data-index="${i}">
            <span class="mvs-wwd-swatch-row">${opt.swatch
              .map((d) => `<span class="mvs-wwd-swatch mvs-wwd-swatch--${d}"></span>`)
              .join("")}</span>
            <span class="mvs-type-btn-label">${escapeHtml(opt.label)}</span>
            <span class="mvs-type-btn-tagline">${escapeHtml(opt.tagline)}</span>
          </button>
        `
      )
      .join("");

    typeGrid.querySelectorAll(".mvs-type-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const opt = options[parseInt(btn.getAttribute("data-index"), 10)];
        renderGuide(opt.pattern, c.sourcePick);
      });
    });
  }

  function wireMethodTriangle() {
    const readout = document.getElementById("mvs-triangle-readout");

    function currentPattern(pct) {
      return derivePattern(rankDimensions(pct));
    }

    function updateReadout(pct) {
      const pattern = currentPattern(pct);
      const label = contentForPattern(pattern).label;
      readout.textContent = `${dimNames.drive} ${pct.drive}% · ${dimNames.connection} ${pct.connection}% · ${dimNames.clarity} ${pct.clarity}% — ${c.methodTriangleReadoutPrefix} ${label}`;
    }

    const handle = createInteractiveTriangle(
      document.getElementById("mvs-guide-triangle"),
      dimNames,
      { drive: 34, connection: 33, clarity: 33 },
      updateReadout
    );
    updateReadout(handle.getPercentages());

    document.getElementById("mvs-triangle-confirm").addEventListener("click", () => {
      const pct = handle.getPercentages();
      const pattern = currentPattern(pct);
      renderGuide(pattern, c.sourceTriangle(pct.drive, pct.connection, pct.clarity));
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
      const looksValid = data && data.type === "wow-result" && data.percentages && typeof data.percentages.drive === "number";
      if (!looksValid) {
        errorNote.textContent = c.methodUploadInvalid;
        errorNote.hidden = false;
        fileInput.value = "";
        return;
      }
      errorNote.hidden = true;
      const pattern = derivePattern(rankDimensions(data.percentages));
      renderGuide(pattern, c.sourceUpload(data.name));
    });
  }

  /**
   * Renders the directional guide, written from `meDimension`'s
   * perspective (the reader's leading priority) — one card per
   * dimension in CONTENT.dimensionOrder, including a card for meeting
   * someone who shares the reader's own leading priority. `pattern` is
   * the reader's full pattern object, used only for the overview
   * section at the top (so a "Dual-led"/"Balanced" reader still sees
   * their accurate write-up there, even though the pairwise cards below
   * work off their single leading priority for simplicity).
   */
  // The people you might be communicating with: each single priority, each
  // dual-led blend, and a balanced profile — so the guide covers blended
  // people, not just single-driver ones.
  function buildTargets() {
    const singles = dimOrder.map((d) => ({ dims: [d], label: CONTENT.dimensionContent[d].label }));
    const pairs = [
      ["drive", "connection"],
      ["drive", "clarity"],
      ["connection", "clarity"],
    ];
    const duals = pairs.map(([a, b]) => ({
      dims: [a, b],
      label: (CONTENT.dualContent[orderedPairKey(a, b)] || {}).label || `${dimNames[a]} & ${dimNames[b]}`,
    }));
    const balanced = {
      dims: dimOrder.slice(),
      label: (CONTENT.balancedContent && CONTENT.balancedContent.label) || "Balanced",
    };
    return singles.concat(duals, [balanced]);
  }

  function renderGuide(pattern, sourceLine) {
    const overview = contentForPattern(pattern);
    // Blend-aware label: "Drive-led", "Drive & Clarity" or "balanced".
    const meLabel = CommsGuidance.meBlendLabel(pattern, dimNames);
    const cards = CommsGuidance.buildAllGuidance(pattern, buildTargets(), dimNames);

    const cardsHtml = cards
      .map(
        (card) => `
          <div class="mvs-wwd-card mvs-commguide-card">
            <div class="mvs-wwd-swatch-row">${(card.dims || [])
              .map((d) => `<span class="mvs-wwd-swatch mvs-wwd-swatch--${d}"></span>`)
              .join("")}</div>
            <h3>${escapeHtml(card.heading)}</h3>
            <p class="mvs-commguide-field-label">${escapeHtml(c.approachLabel)}</p>
            <ul class="mvs-list">
              ${card.approach.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}
            </ul>
            <p class="mvs-commguide-field-label">${escapeHtml(c.strengthLabel)}</p>
            <p class="mvs-commguide-text">${escapeHtml(card.strength)}</p>
            <p class="mvs-commguide-field-label">${escapeHtml(c.watchForLabel)}</p>
            <p class="mvs-commguide-text">${escapeHtml(card.watchFor)}</p>
            <p class="mvs-commguide-reminder">${escapeHtml(c.reminderLabel)}: “${escapeHtml(card.reminder)}”</p>
          </div>
        `
      )
      .join("");

    root.innerHTML = `
      <div class="mvs-screen">
        <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
        <h1>${escapeHtml(c.resultHeading(meLabel))}</h1>
        <a href="index.html" class="mvs-meta-line mvs-print-hide">&larr; Back to home</a>

        <section class="mvs-section">
          <p class="mvs-note">${escapeHtml(sourceLine)}</p>
          <button type="button" class="mvs-btn mvs-btn--ghost mvs-print-hide" id="mvs-guide-restart">${escapeHtml(
            c.changeStartCta
          )}</button>
        </section>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtml(c.overviewHeading)}</h2>
          <p class="mvs-interpretation">${escapeHtml(overview.interpretation)}</p>

          <h3 class="mvs-subheading">${escapeHtml(c.overviewStrengthsHeading)}</h3>
          <ul class="mvs-list">
            ${overview.strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
          </ul>

          <h3 class="mvs-subheading">${escapeHtml(CONTENT.results.overuseHeading)}</h3>
          <ul class="mvs-list">
            ${overview.overuseRisks.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
          </ul>

          <h3 class="mvs-subheading">${escapeHtml(c.overviewApproachHeading)}</h3>
          ${renderQuickReference(overview.quickReference)}
        </section>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtml(c.cardsHeading)}</h2>
          <p class="mvs-note">${escapeHtml(c.cardsIntro(meLabel))}</p>
          <div class="mvs-wwd-grid">
            ${cardsHtml}
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
