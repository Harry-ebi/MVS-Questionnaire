/**
 * admin.js
 * -----------------------------------------------------------------------
 * "All submissions" admin view — entirely local, no server, no accounts,
 * same as every other page in this tool. It reads the same result-*.json
 * files people already save from the solo reflection (the ones the team
 * overlay and blind-spot exercise also use) and shows them as a plain
 * table instead of plotted on a triangle.
 *
 * The passphrase gate below is a soft deterrent, not real security — see
 * the long comment above CONTENT.admin in content.js for why, and what a
 * genuine access-controlled version of this page would require instead.
 * -----------------------------------------------------------------------
 */

(function () {
  "use strict";

  const root = document.getElementById("app");
  const c = CONTENT.admin;
  const dimNames = CONTENT.results.dimensionNames;

  const UNLOCK_KEY = "mvs_admin_unlocked_v1";

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function isUnlocked() {
    try {
      return window.sessionStorage.getItem(UNLOCK_KEY) === "1";
    } catch (err) {
      return false;
    }
  }

  function setUnlocked() {
    try {
      window.sessionStorage.setItem(UNLOCK_KEY, "1");
    } catch (err) {
      // If sessionStorage isn't available, the passphrase form will just
      // be shown again next time — not a big deal for a soft gate.
    }
  }

  function renderGate() {
    root.innerHTML = `
      <div class="mvs-screen">
        <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
        <a href="index.html" class="mvs-meta-line">&larr; Back to home</a>
        <h1>${escapeHtml(c.passphraseHeading)}</h1>
        <p class="mvs-lead">${escapeHtml(c.passphraseBody)}</p>
        <form id="mvs-admin-gate-form" novalidate>
          <label class="mvs-field-label" for="mvs-admin-passphrase">${escapeHtml(c.passphraseLabel)}</label>
          <input type="password" id="mvs-admin-passphrase" class="mvs-text-input" placeholder="${escapeHtml(
            c.passphrasePlaceholder
          )}" autocomplete="off" />
          <p class="mvs-note" id="mvs-admin-gate-error" hidden></p>
          <button type="submit" class="mvs-btn mvs-btn--primary">${escapeHtml(c.passphraseCta)}</button>
        </form>
        <p class="mvs-note" style="margin-top:16px;">${escapeHtml(c.securityNote)}</p>
      </div>
    `;

    document.getElementById("mvs-admin-gate-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("mvs-admin-passphrase");
      const errorNote = document.getElementById("mvs-admin-gate-error");
      if (input.value === c.passphrase) {
        setUnlocked();
        renderAdmin([]);
        return;
      }
      errorNote.hidden = false;
      errorNote.textContent = c.passphraseError;
    });
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

  function formatTimestamp(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function toCsv(records) {
    const header = [c.colName, c.colResult, c.colPeople, c.colPerformance, c.colProcess, c.colSubmitted];
    const escapeCsv = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = records.map((r) => [
      r.name,
      CONTENT.categoryContent[r.category] ? CONTENT.categoryContent[r.category].label : r.category,
      r.percentages.people,
      r.percentages.performance,
      r.percentages.process,
      r.exportedAt || "",
    ]);
    return [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  }

  function downloadCsv(records) {
    const csv = toCsv(records);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ways-of-working-submissions.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function renderTable(records) {
    if (!records.length) {
      return `<p class="mvs-lead">${escapeHtml(c.tableEmpty)}</p>`;
    }

    const sorted = records.slice().sort((a, b) => {
      const ta = a.exportedAt ? new Date(a.exportedAt).getTime() : 0;
      const tb = b.exportedAt ? new Date(b.exportedAt).getTime() : 0;
      return tb - ta;
    });

    const rows = sorted
      .map((r) => {
        const label = CONTENT.categoryContent[r.category] ? CONTENT.categoryContent[r.category].label : r.category;
        return `
          <tr>
            <td>${escapeHtml(r.name)}</td>
            <td>${escapeHtml(label)}</td>
            <td>${escapeHtml(r.percentages.people)}%</td>
            <td>${escapeHtml(r.percentages.performance)}%</td>
            <td>${escapeHtml(r.percentages.process)}%</td>
            <td>${escapeHtml(formatTimestamp(r.exportedAt))}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <p class="mvs-note mvs-print-hide">${escapeHtml(c.tableCountLabel(records.length))}</p>
      <div class="mvs-matrix-scroll">
        <table class="mvs-submissions-table">
          <thead>
            <tr>
              <th scope="col">${escapeHtml(c.colName)}</th>
              <th scope="col">${escapeHtml(c.colResult)}</th>
              <th scope="col">${escapeHtml(c.colPeople)}</th>
              <th scope="col">${escapeHtml(c.colPerformance)}</th>
              <th scope="col">${escapeHtml(c.colProcess)}</th>
              <th scope="col">${escapeHtml(c.colSubmitted)}</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderAdmin(initialRecords) {
    let records = initialRecords.slice();

    function paint(skipped) {
      const warningHtml =
        skipped && skipped.length
          ? `<div class="mvs-callout mvs-print-hide"><p>${skipped
              .map((n) => escapeHtml(c.invalidFileNote(n)))
              .join("<br>")}</p></div>`
          : "";

      root.innerHTML = `
        <div class="mvs-screen">
          <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
          <a href="index.html" class="mvs-meta-line mvs-print-hide">&larr; Back to home</a>
          <h1>${escapeHtml(c.pageTitle)}</h1>
          <p class="mvs-lead mvs-print-hide">${escapeHtml(c.intro)}</p>

          <section class="mvs-section mvs-print-hide">
            <h2 class="mvs-section-title">${escapeHtml(c.loadHeading)}</h2>
            <div class="mvs-dropzone" id="mvs-admin-dropzone">
              <input type="file" id="mvs-admin-file-input" accept="application/json,.json" multiple style="display:none" />
              <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-admin-choose-btn">${escapeHtml(
                c.loadButtonLabel
              )}</button>
              <p class="mvs-note">${escapeHtml(c.loadHint)}</p>
              <p class="mvs-note">or drag files here</p>
            </div>
          </section>

          ${warningHtml}

          <section class="mvs-section">
            <h2 class="mvs-section-title">${escapeHtml(c.tableHeading)}</h2>
            ${renderTable(records)}
          </section>

          ${
            records.length
              ? `
            <div class="mvs-btn-row mvs-print-hide">
              <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-admin-export-csv">${escapeHtml(
                c.exportCsvCta
              )}</button>
              <button type="button" class="mvs-btn mvs-btn--primary" id="mvs-admin-export-pdf">${escapeHtml(
                c.exportCta
              )}</button>
            </div>
            <p class="mvs-note mvs-print-hide">${escapeHtml(c.exportNote)}</p>
          `
              : ""
          }
        </div>
      `;

      wireFileInput();

      if (records.length) {
        document.getElementById("mvs-admin-export-csv").addEventListener("click", () => downloadCsv(records));
        document.getElementById("mvs-admin-export-pdf").addEventListener("click", () => window.print());
      }
    }

    async function handleFiles(fileList) {
      const files = Array.from(fileList || []);
      if (!files.length) return;

      const parsed = await Promise.all(files.map(readFileAsJson));
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
          records.push({
            name: data.name,
            percentages: data.percentages,
            category: data.category,
            exportedAt: data.exportedAt,
          });
        } else {
          skipped.push(file.name);
        }
      });

      paint(skipped);
    }

    function wireFileInput() {
      const input = document.getElementById("mvs-admin-file-input");
      const chooseBtn = document.getElementById("mvs-admin-choose-btn");
      const dropzone = document.getElementById("mvs-admin-dropzone");

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

    paint([]);
  }

  if (isUnlocked()) {
    renderAdmin([]);
  } else {
    renderGate();
  }
})();
