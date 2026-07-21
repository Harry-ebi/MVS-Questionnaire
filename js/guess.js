/**
 * guess.js
 * -----------------------------------------------------------------------
 * Blind-spot exercise — entirely local, no server, no accounts:
 *
 *   1. Each person types the roster + picks their own name, guesses
 *      (via the interactive triangle) where they and every teammate
 *      sit, then saves a small guesses-*.json file.
 *   2. Once everyone's guesses file AND everyone's real result file
 *      (from the solo reflection) are in one place (a shared folder),
 *      anyone loads them all here to reveal guesses vs. reality — the
 *      manual "go collect the files" step is what keeps this hidden
 *      until someone actually chooses to load them, no PIN needed.
 * -----------------------------------------------------------------------
 */

(function () {
  "use strict";

  const root = document.getElementById("app");
  const c = CONTENT.guessExercise;
  const dimNames = CONTENT.results.dimensionNames;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function parseRoster(text) {
    return text
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
  }

  function slugForFilename(name) {
    return (
      String(name)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "you"
    );
  }

  function downloadJson(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
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
  // "Enter your guesses" section
  // ------------------------------------------------------------------

  function renderGuessSetup(container) {
    container.innerHTML = `
      <h2 class="mvs-section-title">${escapeHtml(c.guessSectionHeading)}</h2>
      <ol class="mvs-list" style="padding-left:20px;">
        ${c.howItWorksGuessSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
      </ol>
      <form id="mvs-guess-setup-form">
        <label class="mvs-field-label" for="mvs-guess-roster">${escapeHtml(c.rosterLabel)}</label>
        <textarea id="mvs-guess-roster" class="mvs-text-input" rows="6" placeholder="${escapeHtml(
          c.rosterPlaceholder
        )}"></textarea>
        <div id="mvs-who-are-you-wrap" hidden>
          <label class="mvs-field-label" for="mvs-who-are-you">${escapeHtml(c.yourNameLabel)}</label>
          <select id="mvs-who-are-you" class="mvs-text-input"></select>
          <label class="mvs-field-label" for="mvs-guess-team-code">${escapeHtml(c.guessCodeLabel)}</label>
          <input type="text" id="mvs-guess-team-code" class="mvs-text-input" placeholder="${escapeHtml(
            c.guessCodePlaceholder
          )}" autocomplete="off" />
        </div>
        <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-parse-roster-btn">Continue</button>
        <button type="submit" class="mvs-btn mvs-btn--primary" id="mvs-start-guessing-btn" hidden>${escapeHtml(
          c.startGuessingCta
        )}</button>
      </form>
    `;

    const rosterInput = document.getElementById("mvs-guess-roster");
    const whoWrap = document.getElementById("mvs-who-are-you-wrap");
    const whoSelect = document.getElementById("mvs-who-are-you");
    const parseBtn = document.getElementById("mvs-parse-roster-btn");
    const startBtn = document.getElementById("mvs-start-guessing-btn");

    parseBtn.addEventListener("click", () => {
      const roster = parseRoster(rosterInput.value);
      if (roster.length < 2) {
        alert("Add at least two names (including yourself) before continuing."); // eslint-disable-line no-alert
        return;
      }
      whoSelect.innerHTML = roster.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
      whoWrap.hidden = false;
      parseBtn.hidden = true;
      startBtn.hidden = false;
    });

    document.getElementById("mvs-guess-setup-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const roster = parseRoster(rosterInput.value);
      const me = whoSelect.value;
      const teamCode = document.getElementById("mvs-guess-team-code").value.trim();
      startGuessingFlow(container, roster, me, teamCode);
    });
  }

  function startGuessingFlow(container, roster, me, teamCode) {
    const targets = [me, ...roster.filter((n) => n !== me)];
    let index = 0;
    const collected = []; // { target, percentages }
    let interactiveHandle = null;

    function renderStep() {
      const target = targets[index];
      const isSelf = index === 0;
      const pct = Math.round((index / targets.length) * 100);

      container.innerHTML = `
        <h2 class="mvs-section-title">${escapeHtml(c.guessSectionHeading)}</h2>
        <div class="mvs-progress-wrap" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
          <div class="mvs-progress-track"><div class="mvs-progress-fill" style="width:${pct}%"></div></div>
          <p class="mvs-progress-label">Guessing ${index + 1} of ${targets.length}</p>
        </div>
        <h3 class="mvs-guess-target-heading">${escapeHtml(isSelf ? c.guessSelfIntro : c.guessOtherIntro(target))}</h3>
        <div id="mvs-guess-triangle"></div>
        <p class="mvs-guess-readout" id="mvs-guess-readout"></p>
        <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-save-guess">${escapeHtml(c.saveGuessCta)}</button>
      `;

      const readout = document.getElementById("mvs-guess-readout");
      function updateReadout(p) {
        readout.textContent = `${dimNames.people} ${p.people}% · ${dimNames.performance} ${p.performance}% · ${dimNames.process} ${p.process}%`;
      }

      interactiveHandle = createInteractiveTriangle(
        document.getElementById("mvs-guess-triangle"),
        dimNames,
        { people: 34, performance: 33, process: 33 },
        updateReadout
      );
      updateReadout(interactiveHandle.getPercentages());

      document.getElementById("mvs-save-guess").addEventListener("click", () => {
        collected.push({ target, percentages: interactiveHandle.getPercentages() });
        index += 1;
        if (index < targets.length) {
          renderStep();
        } else {
          renderAllDone();
        }
      });
    }

    function renderAllDone() {
      container.innerHTML = `
        <h2 class="mvs-section-title">${escapeHtml(c.allDoneHeading)}</h2>
        <p class="mvs-lead">${escapeHtml(c.allDoneBody)}</p>
        <p class="mvs-note" id="mvs-cloud-save-guesses-note" hidden></p>
        <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-download-guesses">${escapeHtml(
          c.saveGuessFileCta
        )}</button>
        <p class="mvs-note" id="mvs-download-guesses-status" hidden></p>
      `;

      // Best-effort save to the shared database, same "never block the
      // screen" spirit as the solo reflection's auto-save. Only happens
      // when a team code was given — without one there's no team for
      // these guesses to join, so the file below is the only copy.
      if (teamCode) {
        saveGuessesToCloud(teamCode, me, collected);
      }

      document.getElementById("mvs-download-guesses").addEventListener("click", () => {
        const payload = {
          type: "wow-guesses",
          guesser: me,
          guesses: collected,
          exportedAt: new Date().toISOString(),
        };
        const filename = `guesses-${slugForFilename(me)}.json`;
        downloadJson(payload, filename);
        const status = document.getElementById("mvs-download-guesses-status");
        status.hidden = false;
        status.textContent = `Saved. Put "${filename}" in your team's shared folder, alongside your real result file.`;
      });
    }

    renderStep();
  }

  /**
   * Best-effort: insert one row per guess into the shared `guesses`
   * table. Never throws or blocks the page — see supabaseClient.js.
   */
  async function saveGuessesToCloud(teamCode, guesserName, collected) {
    const note = document.getElementById("mvs-cloud-save-guesses-note");
    if (typeof SupabaseClient === "undefined") {
      if (note) {
        note.hidden = false;
        note.textContent = c.cloudSaveFailNote;
      }
      return;
    }
    const results = await Promise.all(
      collected.map((g) =>
        SupabaseClient.insert("guesses", {
          team_code: teamCode,
          guesser_name: guesserName,
          target_name: g.target,
          people: g.percentages.people,
          performance: g.percentages.performance,
          process: g.percentages.process,
        })
      )
    );
    if (!note) return;
    note.hidden = false;
    note.textContent = results.every(Boolean) ? c.cloudSaveOkNote(teamCode) : c.cloudSaveFailNote;
  }

  // ------------------------------------------------------------------
  // "Reveal" section
  // ------------------------------------------------------------------

  function renderRevealSetup(container) {
    container.innerHTML = `
      <div class="mvs-print-hide">
        <h2 class="mvs-section-title">${escapeHtml(c.revealSectionHeading)}</h2>
        <ol class="mvs-list" style="padding-left:20px;">
          ${c.howItWorksRevealSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
        </ol>

        <h3 class="mvs-subheading">${escapeHtml(c.revealCodeHeading)}</h3>
        <form id="mvs-reveal-code-form" novalidate>
          <label class="mvs-field-label" for="mvs-reveal-code-input">${escapeHtml(c.revealCodeLabel)}</label>
          <input type="text" id="mvs-reveal-code-input" class="mvs-text-input" placeholder="${escapeHtml(
            c.revealCodePlaceholder
          )}" autocomplete="off" />
          <p class="mvs-note" id="mvs-reveal-code-status" hidden></p>
          <button type="submit" class="mvs-btn mvs-btn--primary">${escapeHtml(c.revealCodeCta)}</button>
        </form>

        <h3 class="mvs-subheading">${escapeHtml(c.loadFilesHeading)}</h3>
        <p class="mvs-lead">${escapeHtml(c.revealIntro)}</p>
        <div class="mvs-dropzone" id="mvs-reveal-dropzone">
          <input type="file" id="mvs-reveal-file-input" accept="application/json,.json" multiple style="display:none" />
          <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-reveal-choose-btn">Choose all files (results + guesses)…</button>
          <p class="mvs-note">Select every result-*.json and guesses-*.json file at once (hold Ctrl/Cmd to multi-select).</p>
          <p class="mvs-note">or drag files here</p>
        </div>
      </div>
      <div id="mvs-reveal-warnings" class="mvs-print-hide"></div>
      <div id="mvs-reveal-output"></div>
    `;

    document.getElementById("mvs-reveal-code-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("mvs-reveal-code-input");
      const status = document.getElementById("mvs-reveal-code-status");
      const code = input.value.trim();
      if (!code) {
        status.hidden = false;
        status.textContent = c.revealCodeEmptyError;
        return;
      }
      status.hidden = false;
      status.textContent = "…";
      await handleRevealByCode(code, status);
    });

    const input = document.getElementById("mvs-reveal-file-input");
    const chooseBtn = document.getElementById("mvs-reveal-choose-btn");
    const dropzone = document.getElementById("mvs-reveal-dropzone");

    chooseBtn.addEventListener("click", () => input.click());
    input.addEventListener("change", () => handleRevealFiles(input.files));

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
      handleRevealFiles(e.dataTransfer.files);
    });
  }

  async function handleRevealByCode(code, status) {
    if (typeof SupabaseClient === "undefined") {
      status.hidden = false;
      status.textContent = c.revealCodeErrorNote;
      return;
    }
    const [submissionsResult, guessesResult] = await Promise.all([
      SupabaseClient.rpc("get_team_submissions", { code }),
      SupabaseClient.rpc("get_team_guesses", { code }),
    ]);
    if (!submissionsResult.ok || !guessesResult.ok) {
      status.hidden = false;
      status.textContent = c.revealCodeErrorNote;
      return;
    }
    if (!submissionsResult.data.length && !guessesResult.data.length) {
      status.hidden = false;
      status.textContent = c.revealCodeNoResultsNote(code);
      return;
    }
    status.hidden = true;
    const results = submissionsResult.data.map((row) => ({
      name: row.name,
      percentages: { people: row.people, performance: row.performance, process: row.process },
      category: row.category,
    }));
    const guesses = guessesResult.data.map((row) => ({
      guesser: row.guesser_name,
      target: row.target_name,
      percentages: { people: row.people, performance: row.performance, process: row.process },
    }));
    renderRevealOutput(results, guesses);
  }

  async function handleRevealFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const parsed = await Promise.all(files.map(readFileAsJson));

    const results = []; // { name, percentages, category }
    const guesses = []; // { guesser, target, percentages }
    const skipped = [];

    parsed.forEach(({ file, data }) => {
      if (data && data.type === "wow-result" && typeof data.name === "string" && data.percentages) {
        results.push({ name: data.name, percentages: data.percentages, category: data.category });
      } else if (data && data.type === "wow-guesses" && typeof data.guesser === "string" && Array.isArray(data.guesses)) {
        data.guesses.forEach((g) => {
          if (g && typeof g.target === "string" && g.percentages) {
            guesses.push({ guesser: data.guesser, target: g.target, percentages: g.percentages });
          }
        });
      } else {
        skipped.push(file.name);
      }
    });

    const warningsEl = document.getElementById("mvs-reveal-warnings");
    warningsEl.innerHTML = skipped.length
      ? `<div class="mvs-callout"><p>${skipped
          .map((n) => `Skipped "${escapeHtml(n)}" — it doesn't look like a result or guesses file.`)
          .join("<br>")}</p></div>`
      : "";

    renderRevealOutput(results, guesses);
  }

  function renderRevealOutput(results, guesses) {
    const outputEl = document.getElementById("mvs-reveal-output");
    if (!results.length && !guesses.length) {
      outputEl.innerHTML = "";
      return;
    }

    // Everyone we know about, from either a real result or being someone's guess target.
    const names = new Set();
    results.forEach((r) => names.add(r.name));
    guesses.forEach((g) => names.add(g.target));

    const resultsByName = {};
    results.forEach((r) => (resultsByName[r.name] = r));

    outputEl.innerHTML = `<h3 class="mvs-section-title" style="margin-top:20px;">${escapeHtml(
      c.revealedHeading
    )}</h3><p class="mvs-lead">${escapeHtml(c.revealedIntro)}</p>`;

    Array.from(names)
      .sort()
      .forEach((name) => {
        const section = document.createElement("section");
        section.className = "mvs-section";

        const heading = document.createElement("h3");
        heading.className = "mvs-section-title";
        heading.textContent = name;
        section.appendChild(heading);

        const actualRecord = resultsByName[name];
        if (!actualRecord) {
          const note = document.createElement("p");
          note.className = "mvs-note";
          note.textContent = c.missingActualNote;
          section.appendChild(note);
        }

        const relevantGuesses = guesses
          .filter((g) => g.target === name)
          .map((g) => ({
            label: g.guesser === name ? "Self-guess" : `${g.guesser}'s guess`,
            percentages: g.percentages,
          }));

        const chartDiv = document.createElement("div");
        section.appendChild(chartDiv);
        outputEl.appendChild(section);

        renderPerceptionChart(chartDiv, dimNames, actualRecord ? actualRecord.percentages : null, relevantGuesses);
      });

    const exportWrap = document.createElement("div");
    exportWrap.className = "mvs-btn-row mvs-print-hide";
    exportWrap.innerHTML = `<button type="button" class="mvs-btn mvs-btn--primary" id="mvs-reveal-export-pdf">${escapeHtml(
      c.revealExportCta
    )}</button>`;
    outputEl.appendChild(exportWrap);

    const exportNote = document.createElement("p");
    exportNote.className = "mvs-note mvs-print-hide";
    exportNote.textContent = c.revealExportNote;
    outputEl.appendChild(exportNote);

    document.getElementById("mvs-reveal-export-pdf").addEventListener("click", () => window.print());
  }

  // ------------------------------------------------------------------
  // Page assembly
  // ------------------------------------------------------------------

  function renderPage() {
    root.innerHTML = `
      <div class="mvs-screen">
        <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
        <h1>${escapeHtml(c.title)}</h1>
        <p class="mvs-lead mvs-print-hide">${escapeHtml(c.intro)}</p>
        <a href="index.html" class="mvs-meta-line mvs-print-hide">&larr; Back to home</a>

        <section class="mvs-section mvs-print-hide" id="mvs-guess-section"></section>
        <section class="mvs-section" id="mvs-reveal-section"></section>
      </div>
    `;
    renderGuessSetup(document.getElementById("mvs-guess-section"));
    renderRevealSetup(document.getElementById("mvs-reveal-section"));
  }

  renderPage();
})();
