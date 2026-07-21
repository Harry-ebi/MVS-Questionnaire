/**
 * team.js
 * -----------------------------------------------------------------------
 * Team overlay — entirely local, no server, no accounts. The facilitator
 * loads everyone's saved result-*.json files (from a shared folder, or
 * emailed to them) straight into the browser via a file picker or
 * drag-and-drop, and this page reads them with the File/FileReader APIs
 * and renders the existing overlay chart. Nothing is uploaded anywhere.
 * -----------------------------------------------------------------------
 */

(function () {
  "use strict";

  const root = document.getElementById("app");
  const c = CONTENT.team;
  const dimNames = CONTENT.results.dimensionNames;

  const PAIR_ORDER = ["performance", "people", "process"];

  function primaryDimension(participant) {
    const pct = participant.percentages || {};
    return PAIR_ORDER.slice()
      .sort((a, b) => (pct[b] || 0) - (pct[a] || 0))
      .shift();
  }

  function pairKey(dimA, dimB) {
    return [dimA, dimB].sort((a, b) => PAIR_ORDER.indexOf(a) - PAIR_ORDER.indexOf(b)).join("_");
  }

  const DIMENSION_TO_CATEGORY = {
    performance: "performance_led",
    people: "people_led",
    process: "process_led",
  };

  function computeCounts(participants) {
    const counts = { performance: 0, people: 0, process: 0 };
    participants.forEach((p) => {
      counts[primaryDimension(p)]++;
    });
    return counts;
  }

  /**
   * Auto-generated, plain-English observations about the loaded group —
   * dominant driver, any missing driver, and a small-sample caveat. Pulled
   * together from data already on the page (each participant's primary
   * driver) plus the existing per-category reference text, so nothing here
   * is new copy invented about a specific team — it's the same category
   * content already used elsewhere, applied at group level.
   */
  function renderTeamAnalysisSection(participants) {
    if (participants.length < 2) {
      return `
        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtml(c.analysisHeading)}</h2>
          <p class="mvs-note">${escapeHtml(c.analysisEmpty)}</p>
        </section>
      `;
    }

    const counts = computeCounts(participants);
    const total = participants.length;
    const takeaways = [];

    if (total < 3) {
      takeaways.push(c.analysisSampleCaveat(total));
    }

    const ranked = PAIR_ORDER.slice().sort((a, b) => counts[b] - counts[a]);
    const top = ranked[0];
    const tiedForTop = ranked.filter((d) => counts[d] === counts[top]).length;

    if (counts[top] > 0 && tiedForTop === 1) {
      const label = dimNames[top];
      takeaways.push(c.analysisDominant(label, counts[top], total));
      const risk = CONTENT.categoryContent[DIMENSION_TO_CATEGORY[top]].overuseRisks[0];
      takeaways.push(c.analysisWatchFor(label, risk));
    } else {
      takeaways.push(c.analysisNoDominant);
    }

    const missing = PAIR_ORDER.filter((d) => counts[d] === 0);
    if (missing.length) {
      missing.forEach((d) => {
        const focus = CONTENT.categoryContent[DIMENSION_TO_CATEGORY[d]].quickReference.focus;
        takeaways.push(c.analysisGap(dimNames[d], focus));
      });
    } else {
      takeaways.push(c.analysisNoGap);
    }

    return `
      <section class="mvs-section">
        <h2 class="mvs-section-title">${escapeHtml(c.analysisHeading)}</h2>
        <p class="mvs-note">${escapeHtml(c.analysisIntro)}</p>
        <ul class="mvs-list mvs-analysis-list">
          ${takeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  /**
   * Communication matrix — a fixed 3x3 reference (every primary driver
   * against every other, including itself) drawn from CONTENT.pairDynamics,
   * the same original-wording pair notes used elsewhere. Always renders in
   * full, even with no files loaded, so it works as a standalone reference;
   * pairings actually present in the loaded group get a small badge rather
   * than the matrix changing shape (a grid that drops cells depending on
   * data is exactly the bug this replaced on the solo results PDF).
   */
  function renderCommunicationMatrixSection(participants) {
    const counts = computeCounts(participants);
    const order = PAIR_ORDER;

    const headerCells = order
      .map((d) => `<th class="mvs-matrix-head mvs-matrix-head--${d}" scope="col">${escapeHtml(dimNames[d])}</th>`)
      .join("");

    const bodyRows = order
      .map((rowDim) => {
        const cells = order
          .map((colDim) => {
            const entry = CONTENT.pairDynamics[pairKey(rowDim, colDim)];
            const isDiagonal = rowDim === colDim;
            const present = isDiagonal ? counts[rowDim] >= 1 : counts[rowDim] > 0 && counts[colDim] > 0;
            const badgeText = isDiagonal ? c.matrixCountLabel(counts[rowDim]) : c.matrixPresentBadge;
            return `
              <td class="mvs-matrix-cell${present ? " mvs-matrix-cell--present" : ""}">
                <p class="mvs-matrix-cell-title">${escapeHtml(entry.title)}</p>
                ${present ? `<span class="mvs-matrix-badge">${escapeHtml(badgeText)}</span>` : ""}
                <p class="mvs-matrix-cell-body">${escapeHtml(entry.body)}</p>
              </td>
            `;
          })
          .join("");
        return `
          <tr>
            <th class="mvs-matrix-head mvs-matrix-head--${rowDim}" scope="row">${escapeHtml(dimNames[rowDim])}</th>
            ${cells}
          </tr>
        `;
      })
      .join("");

    return `
      <section class="mvs-section">
        <h2 class="mvs-section-title">${escapeHtml(c.matrixHeading)}</h2>
        <p class="mvs-note">${escapeHtml(c.matrixIntro)}</p>
        <div class="mvs-matrix-scroll">
          <table class="mvs-comm-matrix">
            <thead>
              <tr>
                <th></th>
                ${headerCells}
              </tr>
            </thead>
            <tbody>
              ${bodyRows}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

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

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const parsed = await Promise.all(files.map(readFileAsJson));
    const valid = [];
    const skipped = [];

    parsed.forEach(({ file, data }) => {
      const looksValid =
        data &&
        data.type === "wow-result" &&
        typeof data.name === "string" &&
        data.percentages &&
        Number.isFinite(data.percentages.people) &&
        Number.isFinite(data.percentages.performance) &&
        Number.isFinite(data.percentages.process);
      if (looksValid) {
        valid.push({ name: data.name, percentages: data.percentages, category: data.category });
      } else {
        skipped.push(file.name);
      }
    });

    renderOverlay(valid, skipped);
  }

  function renderOverlay(participants, skipped) {
    const warningHtml = skipped.length
      ? `<div class="mvs-callout mvs-print-hide"><p>${skipped
          .map((n) => escapeHtml(c.invalidFileNote(n)))
          .join("<br>")}</p></div>`
      : "";

    root.innerHTML = `
      <div class="mvs-screen">
        <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
        <h1>${escapeHtml(c.title)}</h1>
        <a href="index.html" class="mvs-meta-line mvs-print-hide">&larr; Back to home</a>

        <section class="mvs-section mvs-print-hide">
          <h2 class="mvs-section-title">${escapeHtml(c.loadHeading)}</h2>
          <div class="mvs-dropzone" id="mvs-dropzone">
            <input type="file" id="mvs-file-input" accept="application/json,.json" multiple style="display:none" />
            <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-choose-files-btn">${escapeHtml(
              c.loadButtonLabel
            )}</button>
            <p class="mvs-note">${escapeHtml(c.loadHint)}</p>
            <p class="mvs-note">or drag files here</p>
          </div>
        </section>

        ${warningHtml}

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtml(c.overlayHeading)}</h2>
          ${
            participants.length
              ? '<div id="mvs-overlay-chart"></div>'
              : `<p class="mvs-lead">${escapeHtml(c.overlayEmpty)}</p>`
          }
        </section>

        ${
          participants.length
            ? `<section class="mvs-section"><p class="mvs-note">${escapeHtml(c.privacyNote)}</p></section>`
            : ""
        }

        ${renderTeamAnalysisSection(participants)}

        ${renderCommunicationMatrixSection(participants)}

        ${
          participants.length
            ? `
          <div class="mvs-btn-row mvs-print-hide">
            <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-team-export-pdf">${escapeHtml(
              c.exportCta
            )}</button>
          </div>
          <p class="mvs-note mvs-print-hide">${escapeHtml(c.exportNote)}</p>
        `
            : ""
        }
      </div>
    `;

    if (participants.length) {
      renderOverlayChart(document.getElementById("mvs-overlay-chart"), participants, dimNames);
      const exportBtn = document.getElementById("mvs-team-export-pdf");
      if (exportBtn) exportBtn.addEventListener("click", () => window.print());
    }

    wireFileInput();
  }

  function wireFileInput() {
    const input = document.getElementById("mvs-file-input");
    const chooseBtn = document.getElementById("mvs-choose-files-btn");
    const dropzone = document.getElementById("mvs-dropzone");

    chooseBtn.addEventListener("click", () => input.click());
    input.addEventListener("change", () => handleFiles(input.files));

    ["dragover", "dragenter"].forEach((evt) =>
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.add("mvs-dropzone--active");
      })
    );
    ["dragleave", "dragend"].forEach((evt) =>
      dropzone.addEventListener(evt, () => dropzone.classList.remove("mvs-dropzone--active"))
    );
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("mvs-dropzone--active");
      handleFiles(e.dataTransfer.files);
    });
  }

  function renderIntro() {
    root.innerHTML = `
      <div class="mvs-screen">
        <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
        <h1>${escapeHtml(c.title)}</h1>
        <p class="mvs-lead">${escapeHtml(c.intro)}</p>
        <a href="index.html" class="mvs-meta-line">&larr; Back to home</a>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtml(c.howItWorksHeading)}</h2>
          <ol class="mvs-list" style="padding-left:20px;">
            ${c.howItWorksSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
          </ol>
        </section>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtml(c.loadHeading)}</h2>
          <div class="mvs-dropzone" id="mvs-dropzone">
            <input type="file" id="mvs-file-input" accept="application/json,.json" multiple style="display:none" />
            <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-choose-files-btn">${escapeHtml(
              c.loadButtonLabel
            )}</button>
            <p class="mvs-note">${escapeHtml(c.loadHint)}</p>
            <p class="mvs-note">or drag files here</p>
          </div>
        </section>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtml(c.overlayHeading)}</h2>
          <p class="mvs-lead">${escapeHtml(c.overlayEmpty)}</p>
        </section>

        ${renderTeamAnalysisSection([])}

        ${renderCommunicationMatrixSection([])}
      </div>
    `;
    wireFileInput();
  }

  renderIntro();
})();
