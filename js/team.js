/**
 * team.js
 * -----------------------------------------------------------------------
 * Team insights — the team is your organisation. When an organisation
 * administrator opens this page, everyone in their active organisation who
 * has completed a communication profile is loaded automatically (straight
 * from the account/organisation setup, via Row Level Security) and shown on
 * the overlay. There is no "team code" to agree or type any more.
 *
 * A file-load fallback is kept for ad-hoc groups or people outside the
 * organisation who don't have accounts: their saved result-*.json files are
 * read locally in the browser and added to the overlay. Nothing loaded that
 * way is uploaded anywhere.
 * -----------------------------------------------------------------------
 */

(function () {
  "use strict";

  const root = document.getElementById("app");
  const c = CONTENT.team;
  const dimNames = CONTENT.results.dimensionNames;

  const PAIR_ORDER = CONTENT.dimensionOrder;

  // A saved result file/database row only stores the pattern *key* (e.g.
  // "focused_drive", "dual_drive_clarity", "balanced"); reconstruct the
  // full {type, primary, secondary} object from it so contentForPattern()
  // can be reused, the same way admin.js does.
  function patternFromKey(key) {
    if (!key) return null;
    if (key === "balanced") return { type: PATTERN.BALANCED, primary: null, secondary: null, key };
    const parts = key.split("_");
    if (parts[0] === "focused") return { type: PATTERN.FOCUSED, primary: parts[1], secondary: null, key };
    if (parts[0] === "dual") return { type: PATTERN.DUAL, primary: parts[1], secondary: parts[2], key };
    return null;
  }

  function contentForPattern(pattern) {
    if (pattern.type === PATTERN.FOCUSED) return CONTENT.dimensionContent[pattern.primary];
    if (pattern.type === PATTERN.DUAL) return CONTENT.dualContent[orderedPairKey(pattern.primary, pattern.secondary)];
    return CONTENT.balancedContent;
  }

  /**
   * A participant's own saved `pattern` key is the richest data already
   * sitting in their result — fall back to re-deriving it from their
   * percentages only if it's missing or invalid (e.g. a hand-edited or
   * older file).
   */
  function resolvePattern(participant) {
    const fromKey = patternFromKey(participant.pattern);
    if (fromKey) return fromKey;
    return derivePattern(rankDimensions(participant.percentages));
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
    const counts = { drive: 0, connection: 0, clarity: 0 };
    participants.forEach((p) => {
      counts[primaryDimension(p)]++;
    });
    return counts;
  }

  /**
   * Auto-generated, plain-English observations about the loaded group,
   * assembled entirely from data already on the page (each participant's
   * saved pattern and percentages) plus the existing per-dimension
   * reference text — nothing here is new copy invented about a specific
   * team.
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
      const risk = CONTENT.dimensionContent[topDim].overuseRisks[0];
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
          const focus = CONTENT.dimensionContent[d].quickReference.focus;
          takeaways.push(c.analysisGap(dimNames[d], focus));
        }
      });
    } else {
      takeaways.push(c.analysisNoGap);
    }

    const focusedCount = participants.filter((p) => resolvePattern(p).type === PATTERN.FOCUSED).length;
    takeaways.push(c.analysisBlendSplit(focusedCount, total - focusedCount, total));

    const patternCounts = {};
    participants.forEach((p) => {
      const key = resolvePattern(p).key;
      patternCounts[key] = (patternCounts[key] || 0) + 1;
    });
    const breakdownRows = Object.keys(patternCounts)
      .sort((a, b) => patternCounts[b] - patternCounts[a])
      .map((key) => c.analysisBreakdownLine(contentForPattern(patternFromKey(key)).label, patternCounts[key], total));

    const rosterRows = participants
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => {
        const label = contentForPattern(resolvePattern(p)).label;
        return `
          <tr>
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(label)}</td>
            <td>${escapeHtml(p.percentages.drive)}%</td>
            <td>${escapeHtml(p.percentages.connection)}%</td>
            <td>${escapeHtml(p.percentages.clarity)}%</td>
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
                <th scope="col">${escapeHtml(c.colDrive)}</th>
                <th scope="col">${escapeHtml(c.colConnection)}</th>
                <th scope="col">${escapeHtml(c.colClarity)}</th>
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
  // Page state — the org's members (loaded automatically) plus any ad-hoc
  // result files loaded through the fallback. The overlay renders the
  // union of the two.
  // ------------------------------------------------------------------
  const state = {
    bannerTitle: "",
    bannerBody: "",
    bannerCta: null,
    bannerHref: null,
    orgParticipants: [],
    orgPending: [],
    fileParticipants: [],
    skipped: [],
  };

  function participants() {
    return state.orgParticipants.concat(state.fileParticipants);
  }

  // ------------------------------------------------------------------
  // Org team load — the members of the reader's active organisation and
  // their latest everyday communication profile, read straight from the
  // database (Row Level Security only returns rows the org admin may see).
  // ------------------------------------------------------------------
  async function loadOrgTeam(org, token) {
    const memRes = await SupabaseClient.select(
      "memberships",
      `organisation_id=eq.${org.id}&order=created_at.asc`,
      token
    );
    const members = memRes.ok ? memRes.data : [];
    const ids = members.map((m) => m.user_id);

    let profilesById = {};
    if (ids.length) {
      const profRes = await SupabaseClient.select("profiles", `id=in.(${ids.join(",")})`, token);
      if (profRes.ok) profRes.data.forEach((p) => (profilesById[p.id] = p));
    }

    const subRes = await SupabaseClient.select(
      "submissions",
      `organisation_id=eq.${org.id}&record_type=eq.everyday&order=created_at.desc`,
      token
    );
    const subs = subRes.ok ? subRes.data : [];

    // Latest everyday profile per member.
    const latestByUser = {};
    subs.forEach((s) => {
      if (s.user_id && !latestByUser[s.user_id]) latestByUser[s.user_id] = s;
    });

    const parts = [];
    const pending = [];
    members.forEach((m) => {
      const prof = profilesById[m.user_id] || {};
      const displayName = prof.display_name || prof.first_name || prof.email || "Team member";
      const s = latestByUser[m.user_id];
      if (
        s &&
        Number.isFinite(s.drive) &&
        Number.isFinite(s.connection) &&
        Number.isFinite(s.clarity)
      ) {
        parts.push({
          name: s.name || displayName,
          percentages: { drive: s.drive, connection: s.connection, clarity: s.clarity },
          pattern: s.pattern,
        });
      } else {
        pending.push(displayName);
      }
    });

    state.orgParticipants = parts;
    state.orgPending = pending;
    state.bannerTitle = org.name;
    state.bannerBody =
      (parts.length ? c.orgLoadedNote(parts.length) : c.orgEmptyNote) +
      (pending.length ? " " + c.orgPendingNote(pending.length) : "");
    render();
  }

  // ------------------------------------------------------------------
  // File fallback — ad-hoc / outside-the-org people, read locally.
  // ------------------------------------------------------------------
  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const parsed = await Promise.all(files.map(readFileAsJson));
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
        state.fileParticipants.push({ name: data.name, percentages: data.percentages, pattern: data.pattern });
      } else {
        state.skipped.push(file.name);
      }
    });

    render();
  }

  function bannerHtml() {
    if (!state.bannerTitle && !state.bannerBody) return "";
    const cta = state.bannerCta
      ? `<a class="mvs-btn mvs-btn--primary" href="${state.bannerHref}">${escapeHtml(state.bannerCta)}</a>`
      : "";
    return `
      <section class="mvs-section mvs-print-hide">
        <div class="mvs-callout">
          ${state.bannerTitle ? `<p><strong>${escapeHtml(state.bannerTitle)}</strong></p>` : ""}
          ${state.bannerBody ? `<p>${escapeHtml(state.bannerBody)}</p>` : ""}
          ${cta}
        </div>
      </section>
    `;
  }

  function fileFallbackHtml() {
    return `
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
    `;
  }

  function render() {
    const parts = participants();
    const warningHtml = state.skipped.length
      ? `<div class="mvs-callout mvs-print-hide"><p>${state.skipped
          .map((n) => escapeHtml(c.invalidFileNote(n)))
          .join("<br>")}</p></div>`
      : "";

    root.innerHTML = `
      <div class="mvs-screen">
        <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
        <h1>${escapeHtml(c.title)}</h1>
        <a href="index.html" class="mvs-meta-line mvs-print-hide">&larr; Back to home</a>

        ${bannerHtml()}

        <section class="mvs-section">
          <h2 class="mvs-section-title">${escapeHtml(c.overlayHeading)}</h2>
          ${
            parts.length
              ? '<div id="mvs-overlay-chart"></div>'
              : `<p class="mvs-lead">${escapeHtml(c.overlayEmpty)}</p>`
          }
        </section>

        ${
          parts.length
            ? `<section class="mvs-section"><p class="mvs-note">${escapeHtml(c.privacyNote)}</p></section>`
            : ""
        }

        ${renderTeamAnalysisSection(parts)}

        ${
          parts.length
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

        ${fileFallbackHtml()}
        ${warningHtml}
      </div>
    `;

    if (parts.length) {
      renderOverlayChart(document.getElementById("mvs-overlay-chart"), parts, dimNames);
      const exportBtn = document.getElementById("mvs-team-export-pdf");
      if (exportBtn) exportBtn.addEventListener("click", () => window.print());
    }

    wireFileInput();
  }

  function wireFileInput() {
    const input = document.getElementById("mvs-file-input");
    const chooseBtn = document.getElementById("mvs-choose-files-btn");
    const dropzone = document.getElementById("mvs-dropzone");
    if (!input || !chooseBtn || !dropzone) return;

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

  // ------------------------------------------------------------------
  // Boot — work out the reader's context and load their org team, or show
  // the appropriate note (with the file fallback always available).
  // ------------------------------------------------------------------
  (async function boot() {
    const signedIn = typeof Auth !== "undefined" && Auth.isSignedIn();

    if (!signedIn) {
      state.bannerTitle = c.orgSignedOutHeading;
      state.bannerBody = c.orgSignedOutBody;
      state.bannerCta = c.signInCta;
      state.bannerHref = "login.html";
      render();
      return;
    }

    // Loading placeholder while we resolve the account context.
    root.innerHTML = `
      <div class="mvs-screen">
        <p class="mvs-eyebrow">${CONTENT.meta.shortName}</p>
        <h1>${escapeHtml(c.title)}</h1>
        <p class="mvs-lead">${escapeHtml(c.orgLoading)}</p>
      </div>
    `;

    let ctx = null;
    try {
      ctx = await Auth.loadContext(true);
    } catch (e) {
      ctx = null;
    }
    const org = ctx && ctx.activeOrg;

    if (!ctx) {
      state.bannerTitle = c.orgHeading;
      state.bannerBody = c.orgErrorNote;
      render();
      return;
    }
    if (!org || org.is_personal) {
      state.bannerTitle = c.orgHeading;
      state.bannerBody = c.orgPersonalBody;
      render();
      return;
    }
    if (ctx.role !== "org_admin") {
      state.bannerTitle = org.name;
      state.bannerBody = c.orgNotAdminBody;
      render();
      return;
    }

    const token = await Auth.getAccessToken();
    try {
      await loadOrgTeam(org, token);
    } catch (e) {
      state.bannerTitle = org.name;
      state.bannerBody = c.orgErrorNote;
      render();
    }
  })();
})();
