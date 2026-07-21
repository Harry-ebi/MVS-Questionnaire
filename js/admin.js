/**
 * admin.js
 * -----------------------------------------------------------------------
 * "All submissions" admin view. Sign-in is a REAL login, checked by
 * Supabase's own Auth service (see js/supabaseClient.js) against an
 * admin account created in the Supabase dashboard's Authentication >
 * Users screen — not the old passphrase that used to be checked by this
 * site's own JavaScript. Once signed in, every submission across every
 * team code is fetched straight from the database (the same `submissions`
 * table the solo reflection saves to); older result-*.json files from
 * before the database existed can still be imported alongside it below.
 * -----------------------------------------------------------------------
 */

(function () {
  "use strict";

  const root = document.getElementById("app");
  const c = CONTENT.admin;
  const dimNames = CONTENT.results.dimensionNames;

  const SESSION_KEY = "mvs_admin_session_v1";

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function getSession() {
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function setSession(session) {
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (err) {
      // If sessionStorage isn't available, the sign-in form will just be
      // shown again next time — not a big deal.
    }
  }

  function clearSession() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      // Nothing to do.
    }
  }

  function renderGate(errorMessage) {
    root.innerHTML = `
      <div class="mvs-screen">
        <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
        <a href="index.html" class="mvs-meta-line">&larr; Back to home</a>
        <h1>${escapeHtml(c.loginHeading)}</h1>
        <p class="mvs-lead">${escapeHtml(c.loginBody)}</p>
        <form id="mvs-admin-gate-form" novalidate>
          <label class="mvs-field-label" for="mvs-admin-email">${escapeHtml(c.emailLabel)}</label>
          <input type="email" id="mvs-admin-email" class="mvs-text-input" placeholder="${escapeHtml(
            c.emailPlaceholder
          )}" autocomplete="username" />
          <label class="mvs-field-label" for="mvs-admin-password">${escapeHtml(c.passwordLabel)}</label>
          <input type="password" id="mvs-admin-password" class="mvs-text-input" placeholder="${escapeHtml(
            c.passwordPlaceholder
          )}" autocomplete="current-password" />
          <p class="mvs-note" id="mvs-admin-gate-error" hidden></p>
          <button type="submit" class="mvs-btn mvs-btn--primary">${escapeHtml(c.loginCta)}</button>
        </form>
      </div>
    `;

    const errorNote = document.getElementById("mvs-admin-gate-error");
    if (errorMessage) {
      errorNote.hidden = false;
      errorNote.textContent = errorMessage;
    }

    document.getElementById("mvs-admin-gate-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("mvs-admin-email").value.trim();
      const password = document.getElementById("mvs-admin-password").value;
      if (typeof SupabaseClient === "undefined") {
        renderGate("Couldn't reach the shared database just now — try again in a moment.");
        return;
      }
      const session = await SupabaseClient.signIn(email, password);
      if (!session || !session.access_token) {
        renderGate(c.loginError);
        return;
      }
      setSession(session);
      loadAndRenderAdmin(session.access_token);
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
    const header = [c.colName, c.colResult, c.colPeople, c.colPerformance, c.colProcess, c.colTeamCode, c.colSubmitted];
    const escapeCsv = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = records.map((r) => [
      r.name,
      CONTENT.categoryContent[r.category] ? CONTENT.categoryContent[r.category].label : r.category,
      r.percentages.people,
      r.percentages.performance,
      r.percentages.process,
      r.teamCode || "",
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
            <td>${escapeHtml(r.teamCode || "—")}</td>
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
              <th scope="col">${escapeHtml(c.colTeamCode)}</th>
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

  /**
   * Fetch every submission from the database using a signed-in admin's
   * access token, then hand the mapped records to renderAdmin(). Shows a
   * brief loading state first since this is a network round trip (unlike
   * the old file-drop version, which was instant).
   */
  async function loadAndRenderAdmin(accessToken) {
    root.innerHTML = `
      <div class="mvs-screen">
        <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
        <a href="index.html" class="mvs-meta-line">&larr; Back to home</a>
        <h1>${escapeHtml(c.pageTitle)}</h1>
        <p class="mvs-lead">…</p>
      </div>
    `;

    if (typeof SupabaseClient === "undefined") {
      renderAdmin([], true);
      return;
    }

    const result = await SupabaseClient.selectAll("submissions", accessToken);
    if (!result.ok) {
      renderAdmin([], true);
      return;
    }

    const records = result.data.map((row) => ({
      name: row.name,
      percentages: { people: row.people, performance: row.performance, process: row.process },
      category: row.category,
      teamCode: row.team_code,
      exportedAt: row.created_at,
    }));
    renderAdmin(records, false);
  }

  function renderAdmin(initialRecords, loadError) {
    let records = initialRecords.slice();

    function paint(skipped) {
      const warningHtml =
        skipped && skipped.length
          ? `<div class="mvs-callout mvs-print-hide"><p>${skipped
              .map((n) => escapeHtml(c.invalidFileNote(n)))
              .join("<br>")}</p></div>`
          : "";
      const loadErrorHtml = loadError
        ? `<div class="mvs-callout mvs-print-hide"><p>${escapeHtml(c.tableLoadError)}</p></div>`
        : "";

      root.innerHTML = `
        <div class="mvs-screen">
          <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
          <a href="index.html" class="mvs-meta-line mvs-print-hide">&larr; Back to home</a>
          <div class="mvs-btn-row mvs-print-hide" style="justify-content:space-between;align-items:center;margin-bottom:0;">
            <h1 style="margin:0;">${escapeHtml(c.pageTitle)}</h1>
            <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-admin-sign-out">${escapeHtml(
              c.signOutCta
            )}</button>
          </div>
          <p class="mvs-lead mvs-print-hide">${escapeHtml(c.intro)}</p>

          ${loadErrorHtml}

          <section class="mvs-section mvs-print-hide">
            <h2 class="mvs-section-title">${escapeHtml(c.loadHeading)}</h2>
            <p class="mvs-note">${escapeHtml(c.loadIntro)}</p>
            <div class="mvs-dropzone" id="mvs-admin-dropzone">
              <input type="file" id="mvs-admin-file-input" accept="application/json,.json" multiple style="display:none" />
              <button type="button" class="mvs-btn mvs-btn--ghost" id="mvs-admin-choose-btn">${escapeHtml(
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

      document.getElementById("mvs-admin-sign-out").addEventListener("click", () => {
        clearSession();
        renderGate();
      });

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
            teamCode: data.team_code || null,
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

  const existingSession = getSession();
  if (existingSession && existingSession.access_token) {
    loadAndRenderAdmin(existingSession.access_token);
  } else {
    renderGate();
  }
})();
