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
        <div class="mvs-callout"><p>${escapeHtml(c.internalUseNotice)}</p></div>
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

  // Look up the write-up for a full pattern object — shared logic with
  // app.js/guide.js/pressure.js's own copies of this small helper.
  function contentForPattern(pattern) {
    if (!pattern) return null;
    if (pattern.type === PATTERN.FOCUSED) return CONTENT.dimensionContent[pattern.primary];
    if (pattern.type === PATTERN.DUAL) return CONTENT.dualContent[orderedPairKey(pattern.primary, pattern.secondary)];
    return CONTENT.balancedContent;
  }

  // Historical rows only ever stored the pattern *key* (e.g.
  // "focused_drive", "dual_drive_clarity", "balanced"), not the full
  // {type, primary, secondary} object — reconstruct that object from the
  // key so contentForPattern() above can be reused here too.
  function patternFromKey(key) {
    if (!key) return null;
    if (key === "balanced") return { type: PATTERN.BALANCED, primary: null, secondary: null, key };
    const parts = key.split("_");
    const type = parts[0];
    if (type === "focused") return { type: PATTERN.FOCUSED, primary: parts[1], secondary: null, key };
    if (type === "dual") return { type: PATTERN.DUAL, primary: parts[1], secondary: parts[2], key };
    return null;
  }

  function resultLabel(r) {
    const pattern = patternFromKey(r.pattern);
    const content = contentForPattern(pattern);
    return content ? content.label : r.pattern;
  }

  function typeLabel(r) {
    return r.recordType === "pressure" ? c.typePressure : c.typeEveryday;
  }

  function shiftLabel(r) {
    if (r.recordType !== "pressure" || !r.changeBand) return c.shiftNone;
    const bandLabel = CONTENT.pressureResults.changeBandLabels[r.changeBand] || r.changeBand;
    return `${bandLabel} (${r.changeScore})`;
  }

  function toCsv(records) {
    const header = [
      c.colName,
      c.colType,
      c.colResult,
      c.colDrive,
      c.colConnection,
      c.colClarity,
      c.colShift,
      c.colTeamCode,
      c.colSubmitted,
    ];
    const escapeCsv = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = records.map((r) => [
      r.name,
      typeLabel(r),
      resultLabel(r),
      r.percentages.drive,
      r.percentages.connection,
      r.percentages.clarity,
      shiftLabel(r),
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

  // ------------------------------------------------------------------
  // Usage summary — computed entirely from the records already loaded
  // (no extra network calls, no new data captured). Reflects whatever
  // team-code filter is currently applied, since it's handed the same
  // `shown` set the table below is.
  // ------------------------------------------------------------------

  /** The dimension a result leans toward most, from its own percentages. */
  function topDimension(pct) {
    if (!pct) return null;
    let best = DIMENSIONS[0];
    DIMENSIONS.forEach((d) => {
      if ((pct[d] || 0) > (pct[best] || 0)) best = d;
    });
    return best;
  }

  /** One horizontal bar row: label · proportional bar · count. */
  function summaryBarRow(label, count, max, color) {
    const pct = max > 0 ? Math.round((count / max) * 100) : 0;
    return `
      <div class="mvs-usage-bar-row">
        <span class="mvs-usage-bar-label">${escapeHtml(label)}</span>
        <span class="mvs-usage-bar-track">
          <span class="mvs-usage-bar-fill" style="width:${pct}%;background:${color};"></span>
        </span>
        <span class="mvs-usage-bar-count">${escapeHtml(count)}</span>
      </div>
    `;
  }

  function renderSummary(shown, teamFilter) {
    const s = c.summary;
    const scope = teamFilter && teamFilter.trim() ? s.scopeTeam(teamFilter.trim()) : s.scopeAll;

    if (!shown.length) {
      return `
        <section class="mvs-section mvs-print-hide">
          <h2 class="mvs-section-title">${escapeHtml(s.heading)}</h2>
          <p class="mvs-note">${escapeHtml(s.empty)}</p>
        </section>
      `;
    }

    const everyday = shown.filter((r) => r.recordType !== "pressure");
    const pressure = shown.filter((r) => r.recordType === "pressure");

    const uniquePeople = new Set(
      shown.map((r) => (r.name || "").trim().toLowerCase()).filter(Boolean)
    ).size;
    const teams = new Set(
      shown.map((r) => (r.teamCode || "").trim().toLowerCase()).filter(Boolean)
    ).size;

    const times = shown.map((r) => (r.exportedAt ? new Date(r.exportedAt).getTime() : 0)).filter((t) => t > 0);
    const lastActivity = times.length ? formatTimestamp(new Date(Math.max(...times)).toISOString()) : "—";

    // Completions per calendar day (all record types), most recent 30 active days.
    const dayCounts = {};
    shown.forEach((r) => {
      if (!r.exportedAt) return;
      const d = new Date(r.exportedAt);
      if (isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      dayCounts[key] = (dayCounts[key] || 0) + 1;
    });
    const allDays = Object.keys(dayCounts).sort();
    const days = allDays.slice(-30);
    const dayMax = days.reduce((m, k) => Math.max(m, dayCounts[k]), 1);
    const dayLabel = (key) =>
      new Date(key + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });
    const byDayBars = days
      .map((k) => summaryBarRow(dayLabel(k), dayCounts[k], dayMax, "var(--accent-soft)"))
      .join("");

    // Leading-priority split across everyday reflections.
    const split = { drive: 0, connection: 0, clarity: 0 };
    everyday.forEach((r) => {
      const top = topDimension(r.percentages);
      if (top) split[top] += 1;
    });
    const splitMax = DIMENSIONS.reduce((m, d) => Math.max(m, split[d]), 1);
    const seriesVar = { drive: "var(--series-drive)", connection: "var(--series-connection)", clarity: "var(--series-clarity)" };
    const splitBars = DIMENSIONS.map((d) =>
      summaryBarRow(dimNames[d], split[d], splitMax, seriesVar[d])
    ).join("");

    const tile = (label, value) => `
      <div class="mvs-result-summary-card">
        <p class="mvs-summary-label">${escapeHtml(label)}</p>
        <p class="mvs-summary-value">${escapeHtml(value)}</p>
      </div>
    `;

    return `
      <section class="mvs-section mvs-print-hide">
        <h2 class="mvs-section-title">${escapeHtml(s.heading)}</h2>
        <p class="mvs-note">${escapeHtml(scope)} · ${escapeHtml(s.lastActivity(lastActivity))}</p>
        <div class="mvs-result-summary-grid mvs-usage-tiles">
          ${tile(s.tileEveryday, everyday.length)}
          ${tile(s.tilePressure, pressure.length)}
          ${tile(s.tilePeople, uniquePeople)}
          ${tile(s.tileTeams, teams)}
        </div>
        <div class="mvs-usage-charts">
          <div class="mvs-usage-chart">
            <h3 class="mvs-usage-chart-title">${escapeHtml(s.byDayHeading)}</h3>
            ${byDayBars}
            <p class="mvs-note">${escapeHtml(s.byDayNote(days.length))}</p>
          </div>
          <div class="mvs-usage-chart">
            <h3 class="mvs-usage-chart-title">${escapeHtml(s.priorityHeading)}</h3>
            ${splitBars}
            <p class="mvs-note">${escapeHtml(s.priorityNote)}</p>
          </div>
        </div>
      </section>
    `;
  }

  function renderTable(records, totalCount) {
    if (!records.length) {
      return `<p class="mvs-lead">${escapeHtml(totalCount ? c.filterNoMatches : c.tableEmpty)}</p>`;
    }

    const sorted = records.slice().sort((a, b) => {
      const ta = a.exportedAt ? new Date(a.exportedAt).getTime() : 0;
      const tb = b.exportedAt ? new Date(b.exportedAt).getTime() : 0;
      return tb - ta;
    });

    const rows = sorted
      .map((r) => {
        const label = resultLabel(r);
        return `
          <tr>
            <td>${escapeHtml(r.name)}</td>
            <td>${escapeHtml(typeLabel(r))}</td>
            <td>${escapeHtml(label)}</td>
            <td>${escapeHtml(r.percentages.drive)}%</td>
            <td>${escapeHtml(r.percentages.connection)}%</td>
            <td>${escapeHtml(r.percentages.clarity)}%</td>
            <td>${escapeHtml(shiftLabel(r))}</td>
            <td>${escapeHtml(r.teamCode || "—")}</td>
            <td>${escapeHtml(formatTimestamp(r.exportedAt))}</td>
            <td class="mvs-print-hide">${
              r.id
                ? `<button type="button" class="mvs-btn mvs-btn--ghost mvs-btn--small mvs-btn--danger mvs-admin-delete-btn" data-id="${escapeHtml(
                    r.id
                  )}" data-name="${escapeHtml(r.name)}">${escapeHtml(c.deleteCta)}</button>`
                : ""
            }</td>
          </tr>
        `;
      })
      .join("");

    return `
      <p class="mvs-note mvs-print-hide">${escapeHtml(
        totalCount ? c.filterCountLabel(records.length, totalCount) : c.tableCountLabel(records.length)
      )}</p>
      <div class="mvs-matrix-scroll">
        <table class="mvs-submissions-table">
          <thead>
            <tr>
              <th scope="col">${escapeHtml(c.colName)}</th>
              <th scope="col">${escapeHtml(c.colType)}</th>
              <th scope="col">${escapeHtml(c.colResult)}</th>
              <th scope="col">${escapeHtml(c.colDrive)}</th>
              <th scope="col">${escapeHtml(c.colConnection)}</th>
              <th scope="col">${escapeHtml(c.colClarity)}</th>
              <th scope="col">${escapeHtml(c.colShift)}</th>
              <th scope="col">${escapeHtml(c.colTeamCode)}</th>
              <th scope="col">${escapeHtml(c.colSubmitted)}</th>
              <th scope="col" class="mvs-print-hide">${escapeHtml(c.colDelete)}</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
      <p class="mvs-note mvs-print-hide">${escapeHtml(c.deleteUnavailableNote)}</p>
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
      // A 401/403 here almost always means the admin sign-in itself has
      // expired (Supabase access tokens are short-lived, and this page
      // never refreshes one automatically) -- not that the database is
      // unreachable. Showing the generic "couldn't reach the database"
      // message in that case is actively misleading, since refreshing
      // the page just re-sends the same expired token and fails again.
      // Clear the stale session and send the person back to sign in.
      if (result.status === 401 || result.status === 403) {
        clearSession();
        renderGate(c.sessionExpiredNotice);
        return;
      }
      renderAdmin([], true);
      return;
    }

    const records = result.data.map((row) => ({
      id: row.id,
      name: row.name,
      recordType: row.record_type || "everyday",
      percentages: { drive: row.drive, connection: row.connection, clarity: row.clarity },
      pattern: row.pattern,
      changeScore: row.change_score,
      changeBand: row.change_band,
      teamCode: row.team_code,
      exportedAt: row.created_at,
    }));
    renderAdmin(records, false);
  }

  function renderAdmin(initialRecords, loadError) {
    let records = initialRecords.slice();
    let teamCodeFilter = "";
    let deleteError = false;
    let focusFilterAfterPaint = false;

    function visibleRecords() {
      const f = teamCodeFilter.trim().toLowerCase();
      if (!f) return records;
      return records.filter((r) => (r.teamCode || "").trim().toLowerCase() === f);
    }

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
      const deleteErrorHtml = deleteError
        ? `<div class="mvs-callout mvs-print-hide"><p>${escapeHtml(c.deleteError)}</p></div>`
        : "";
      const shown = visibleRecords();

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
          <div class="mvs-callout"><p>${escapeHtml(c.internalUseNotice)}</p></div>

          ${loadErrorHtml}
          ${deleteErrorHtml}

          ${renderSummary(shown, teamCodeFilter)}

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

          <section class="mvs-section mvs-print-hide">
            <h2 class="mvs-section-title">${escapeHtml(c.filterHeading)}</h2>
            <label class="mvs-field-label" for="mvs-admin-team-filter">${escapeHtml(c.filterLabel)}</label>
            <input type="text" id="mvs-admin-team-filter" class="mvs-text-input" placeholder="${escapeHtml(
              c.filterPlaceholder
            )}" value="${escapeHtml(teamCodeFilter)}" autocomplete="off" />
            <p class="mvs-note">${escapeHtml(c.filterNote)}</p>
          </section>

          <section class="mvs-section">
            <h2 class="mvs-section-title">${escapeHtml(c.tableHeading)}</h2>
            ${renderTable(shown, teamCodeFilter.trim() ? records.length : 0)}
          </section>

          ${
            shown.length
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

      const filterInput = document.getElementById("mvs-admin-team-filter");
      filterInput.addEventListener("input", () => {
        teamCodeFilter = filterInput.value;
        focusFilterAfterPaint = true;
        paint([]);
      });
      if (focusFilterAfterPaint) {
        focusFilterAfterPaint = false;
        filterInput.focus();
        const caret = filterInput.value.length;
        filterInput.setSelectionRange(caret, caret);
      }

      root.querySelectorAll(".mvs-admin-delete-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const name = btn.getAttribute("data-name");
          if (!window.confirm(c.deleteConfirm(name))) return;
          const session = getSession();
          const accessToken = session && session.access_token;
          btn.disabled = true;
          const result =
            accessToken && typeof SupabaseClient !== "undefined"
              ? await SupabaseClient.remove("submissions", id, accessToken)
              : { ok: false, status: null };
          if (result.ok) {
            records = records.filter((r) => r.id !== id);
            deleteError = false;
          } else if (result.status === 401 || result.status === 403) {
            clearSession();
            renderGate(c.sessionExpiredNotice);
            return;
          } else {
            deleteError = true;
          }
          paint([]);
        });
      });

      if (shown.length) {
        document.getElementById("mvs-admin-export-csv").addEventListener("click", () => downloadCsv(shown));
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
          Number.isFinite(data.percentages.drive) &&
          Number.isFinite(data.percentages.connection) &&
          Number.isFinite(data.percentages.clarity);
        if (looksValid) {
          records.push({
            name: data.name,
            recordType: "everyday", // imported result-*.json files predate the Priorities Under Pressure add-on
            percentages: data.percentages,
            pattern: data.pattern,
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
