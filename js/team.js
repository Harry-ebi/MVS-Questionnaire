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

  const DIMENSION_TO_CATEGORY = {
    performance: "performance_led",
    people: "people_led",
    process: "process_led",
  };

  /**
   * A participant's own saved `category` (one of the 7 blend categories)
   * is the richest data already sitting in their result file — fall back
   * to re-deriving it from their percentages only if it's missing or
   * invalid (e.g. a hand-edited or older file).
   */
  function resolveCategory(participant) {
    if (participant.category && CONTENT.categoryContent[participant.category]) {
      return participant.category;
    }
    return deriveCategory(rankDimensions(participant.percentages));
  }

  function ranked(participant) {
    return rankDimensions(participant.percentages);
  }

  function primaryDimension(participant) {
    return ranked(participant)[0].dimension;
  }

  function secondaryDimension(participant) {
    return ranked(participant)[1].dimension;
  }

  function computeCounts(participants) {
    const counts = { performance: 0, people: 0, process: 0 };
    participants.forEach((p) => {
      counts[primaryDimension(p)]++;
    });
    return counts;
  }

  /**
   * Auto-generated, plain-English observations about the loaded group,
   * assembled entirely from data already on the page (each participant's
   * saved category and percentages) plus the existing per-category
   * reference text — nothing here is new copy invented about a specific
   * team. This used to sit alongside a fixed 3x3 "how the styles
   * communicate" matrix, which was removed as redundant: the
   * communication guide (guide.html) already covers pairwise dynamics in
   * far more depth, so this section now goes deeper on the group itself
   * instead of duplicating a lighter version of that other module.
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

    const topDim = PAIR_ORDER.slice().sort((a, b) => counts[b] - counts[a])[0];
    const tiedForTop = PAIR_ORDER.filter((d) => counts[d] === counts[topDim]).length;

    if (counts[topDim] > 0 && tiedForTop === 1) {
      const label = dimNames[topDim];
      takeaways.push(c.analysisDominant(label, counts[topDim], total));
      const risk = CONTENT.categoryContent[DIMENSION_TO_CATEGORY[topDim]].overuseRisks[0];
      takeaways.push(c.analysisWatchFor(label, risk));
    } else {
      takeaways.push(c.analysisNoDominant);
    }

    const missing = PAIR_ORDER.filter((d) => counts[d] === 0);
    if (missing.length) {
      missing.forEach((d) => {
        const secondaryCount = participants.filter((p) => secondaryDimension(p) === d).length;
        if (secondaryCount > 0) {
          takeaways.push(c.analysisGapSoftened(dimNames[d], secondaryCount));
        } else {
          const focus = CONTENT.categoryContent[DIMENSION_TO_CATEGORY[d]].quickReference.focus;
          takeaways.push(c.analysisGap(dimNames[d], focus));
        }
      });
    } else {
      takeaways.push(c.analysisNoGap);
    }

    const ledCount = participants.filter((p) => resolveCategory(p).endsWith("_led")).length;
    takeaways.push(c.analysisBlendSplit(ledCount, total - ledCount, total));

    // Category breakdown: how many people fall into each of the 7 result
    // categories (not just the 3 primary dimensions above) — richer than
    // the primary-driver counts since it captures blends as their own
    // thing rather than collapsing them into whichever dimension scored
    // highest.
    const categoryCounts = {};
    participants.forEach((p) => {
      const cat = resolveCategory(p);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const breakdownRows = CONTENT.categoryOrder
      .filter((catId) => categoryCounts[catId])
      .sort((a, b) => categoryCounts[b] - categoryCounts[a])
      .map((catId) => c.analysisBreakdownLine(CONTENT.categoryContent[catId].label, categoryCounts[catId], total));

    const rosterRows = participants
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => {
        const cat = resolveCategory(p);
        const label = CONTENT.categoryContent[cat].label;
        return `
          <tr>
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(label)}</td>
            <td>${escapeHtml(p.percentages.people)}%</td>
            <td>${escapeHtml(p.percentages.performance)}%</td>
            <td>${escapeHtml(p.percentages.process)}%</td>
          </tr>
        `;
      })
      .join("");

    return `
      <section class="mvs-section">
        <h2 class="mvs-section-title">${escapeHtml(c.analysisHeading)}</h2>
        <p class="mvs-note">${escapeHtml(c.analysisIntro)}</p>

        <h3 class="mvs-subheading">${escapeHtml(c.analysisBreakdownHeading)}</h3>
        <ul class="mvs-list mvs-analysis-list">
          ${breakdownRows.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
        </ul>

        <ul class="mvs-list mvs-analysis-list">
          ${takeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
        </ul>

        <h3 class="mvs-subheading">${escapeHtml(c.analysisRosterHeading)}</h3>
        <p class="mvs-note">${escapeHtml(c.analysisRosterIntro)}</p>
        <div class="mvs-matrix-scroll">
          <table class="mvs-submissions-table">
            <thead>
              <tr>
                <th scope="col">${escapeHtml(c.colName)}</th>
                <th scope="col">${escapeHtml(c.colResult)}</th>
                <th scope="col">${escapeHtml(c.colPeople)}</th>
                <th scope="col">${escapeHtml(c.colPerformance)}</th>
                <th scope="col">${escapeHtml(c.colProcess)}</th>
              </tr>
            </thead>
            <tbody>
              ${rosterRows}
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

  // ------------------------------------------------------------------
  // Team-code load (primary path) — fetches straight from the shared
  // database via a Postgres function that only returns rows matching the
  // exact code supplied (see README.md "Database setup"). No files to
  // collect; this is what makes the tool "save automatically" end to end.
  // ------------------------------------------------------------------

  function renderCodeLoadSection() {
    return `
      <section class="mvs-section mvs-print-hide">
        <h2 class="mvs-section-title">${escapeHtml(c.codeHeading)}</h2>
        <form id="mvs-code-form" novalidate>
          <label class="mvs-field-label" for="mvs-team-code-input">${escapeHtml(c.codeLabel)}</label>
          <input type="text" id="mvs-team-code-input" class="mvs-text-input" placeholder="${escapeHtml(
            c.codePlaceholder
          )}" autocomplete="off" />
          <p class="mvs-note" id="mvs-code-status" hidden></p>
          <button type="submit" class="mvs-btn mvs-btn--primary">${escapeHtml(c.codeCta)}</button>
        </form>
      </section>
    `;
  }

  function wireCodeForm() {
    const form = document.getElementById("mvs-code-form");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("mvs-team-code-input");
      const status = document.getElementById("mvs-code-status");
      const code = input.value.trim();
      if (!code) {
        status.hidden = false;
        status.textContent = c.codeEmptyError;
        return;
      }
      status.hidden = false;
      status.textContent = "…";

      if (typeof SupabaseClient === "undefined") {
        status.textContent = c.codeErrorNote;
        return;
      }
      const result = await SupabaseClient.rpc("get_team_submissions", { code });
      if (!result.ok) {
        status.hidden = false;
        status.textContent = c.codeErrorNote;
        return;
      }
      if (!result.data.length) {
        status.hidden = false;
        status.textContent = c.codeNoResultsNote(code);
        return;
      }
      const participants = result.data.map((row) => ({
        name: row.name,
        percentages: { people: row.people, performance: row.performance, process: row.process },
        category: row.category,
      }));
      renderOverlay(participants, []);
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

        ${renderCodeLoadSection()}

        <section class="mvs-section mvs-print-hide">
          <h2 class="mvs-section-title">${escapeHtml(c.loadHeading)}</h2>
          <p class="mvs-note">${escapeHtml(c.loadIntro)}</p>
          <div class="mvs-dropzone" id="mvs-dropzone">
            <input type="file" id="mvs-file-input" accept="application/json,.json" multiple style="display:none" />
            <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-choose-files-btn">${escapeHtml(
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

    wireCodeForm();
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

        ${renderCodeLoadSection()}

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtml(c.loadHeading)}</h2>
          <p class="mvs-note">${escapeHtml(c.loadIntro)}</p>
          <div class="mvs-dropzone" id="mvs-dropzone">
            <input type="file" id="mvs-file-input" accept="application/json,.json" multiple style="display:none" />
            <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-choose-files-btn">${escapeHtml(
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
      </div>
    `;
    wireCodeForm();
    wireFileInput();
  }

  renderIntro();
})();
