/**
 * account.js
 * -----------------------------------------------------------------------
 * The signed-in person's own area: their organisation, a snapshot of
 * their activity, their assessment history, editable personal details,
 * and a change-password form.
 *
 * This page is guarded by Auth.requireAuth() — anyone not signed in is
 * sent to the login screen. What actually comes back from the database is
 * decided by Row Level Security, so this page can only ever show the
 * signed-in person their own rows (a standard user), regardless of what
 * the JavaScript asks for.
 *
 * All copy lives in CONTENT.account.
 * -----------------------------------------------------------------------
 */

(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  const root = () => document.getElementById("app");
  const c = () => CONTENT.account;

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (err) {
      return iso.slice(0, 10);
    }
  }

  function patternLabel(key) {
    const map = c().patternLabels || {};
    return map[key] || key || "—";
  }

  function scoreCell(row) {
    if (row.drive == null) return "—";
    return `${Math.round(row.drive)} / ${Math.round(row.connection)} / ${Math.round(row.clarity)}`;
  }

  function renderHistory(submissions) {
    const cc = c();
    if (!submissions.length) {
      return `<p class="mvs-history-empty">${esc(cc.historyEmpty)}</p>`;
    }
    const rows = submissions
      .map((s) => {
        const type =
          s.record_type === "pressure" ? cc.typePressure : cc.typeEveryday;
        return `
          <tr>
            <td>${esc(fmtDate(s.created_at))}</td>
            <td>${esc(type)}</td>
            <td>${esc(patternLabel(s.pattern))}</td>
            <td>${esc(scoreCell(s))}</td>
          </tr>`;
      })
      .join("");
    return `
      <table class="mvs-history-table">
        <thead>
          <tr>
            <th>${esc(cc.colDate)}</th>
            <th>${esc(cc.colType)}</th>
            <th>${esc(cc.colStyle)}</th>
            <th>${esc(cc.colScores)}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function render(ctx, submissions) {
    const cc = c();
    const p = ctx.profile || {};
    const org = ctx.activeOrg;
    const everyday = submissions.filter((s) => s.record_type !== "pressure").length;
    const pressure = submissions.filter((s) => s.record_type === "pressure").length;
    const lastActivity = submissions.length ? submissions[0].created_at : null;
    const roleLabel =
      ctx.role === "org_admin" ? cc.roleOrgAdmin : cc.roleMember;

    root().innerHTML = `
      <div class="mvs-screen">
        <h1>${esc(cc.title)}${p.display_name ? ", " + esc(p.display_name) : ""}</h1>

        <section class="mvs-section" style="border-top:none;padding-top:4px;">
          <h2 class="mvs-section-title">${esc(cc.orgHeading)}</h2>
          <p>
            <span class="mvs-org-chip">${esc(org ? org.name : "—")}
              <span class="mvs-role-tag">${esc(roleLabel)}</span>
            </span>
          </p>
        </section>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${esc(cc.activityHeading)}</h2>
          <div class="mvs-stat-row">
            <div class="mvs-stat"><div class="mvs-stat-value">${everyday}</div><div class="mvs-stat-label">${esc(cc.statReflections)}</div></div>
            <div class="mvs-stat"><div class="mvs-stat-value">${pressure}</div><div class="mvs-stat-label">${esc(cc.statPressure)}</div></div>
            <div class="mvs-stat"><div class="mvs-stat-value" style="font-size:1rem;padding-top:6px;">${esc(fmtDate(lastActivity))}</div><div class="mvs-stat-label">${esc(cc.statLast)}</div></div>
          </div>
          <p class="mvs-note"><a class="mvs-share-link" href="reflection.html">${esc(cc.startCta)}</a></p>
        </section>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${esc(cc.historyHeading)}</h2>
          ${renderHistory(submissions)}
        </section>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${esc(cc.detailsHeading)}</h2>
          <p class="mvs-message" id="mvs-acc-msg" hidden></p>
          <form class="mvs-auth-form" id="mvs-details-form" novalidate>
            <div class="mvs-form-split">
              <div class="mvs-form-row">
                <label class="mvs-field-label" for="mvs-first">${esc(cc.firstName)}</label>
                <input type="text" id="mvs-first" class="mvs-text-input" value="${esc(p.first_name || "")}" />
              </div>
              <div class="mvs-form-row">
                <label class="mvs-field-label" for="mvs-last">${esc(cc.lastName)}</label>
                <input type="text" id="mvs-last" class="mvs-text-input" value="${esc(p.last_name || "")}" />
              </div>
            </div>
            <div class="mvs-form-row">
              <label class="mvs-field-label" for="mvs-display">${esc(cc.displayName)}</label>
              <input type="text" id="mvs-display" class="mvs-text-input" value="${esc(p.display_name || "")}" />
            </div>
            <div class="mvs-form-row">
              <label class="mvs-field-label" for="mvs-email">${esc(cc.email)}</label>
              <input type="email" id="mvs-email" class="mvs-text-input" value="${esc(p.email || "")}" disabled />
              <p class="mvs-field-hint">${esc(cc.emailHint)}</p>
            </div>
            <div class="mvs-form-split">
              <div class="mvs-form-row">
                <label class="mvs-field-label" for="mvs-company">${esc(cc.company)}</label>
                <input type="text" id="mvs-company" class="mvs-text-input" value="${esc(p.company || "")}" />
              </div>
              <div class="mvs-form-row">
                <label class="mvs-field-label" for="mvs-job">${esc(cc.jobTitle)}</label>
                <input type="text" id="mvs-job" class="mvs-text-input" value="${esc(p.job_title || "")}" />
              </div>
            </div>
            <div class="mvs-form-row">
              <label class="mvs-field-label" for="mvs-country">${esc(cc.country)}</label>
              <input type="text" id="mvs-country" class="mvs-text-input" value="${esc(p.country || "")}" />
            </div>
            <button type="submit" class="mvs-btn mvs-btn--primary" id="mvs-details-save">${esc(cc.saveDetails)}</button>
          </form>
        </section>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${esc(cc.passwordHeading)}</h2>
          <p class="mvs-message" id="mvs-pw-msg" hidden></p>
          <form class="mvs-auth-form" id="mvs-pw-form" novalidate>
            <div class="mvs-form-row">
              <label class="mvs-field-label" for="mvs-newpw">${esc(cc.newPassword)}</label>
              <input type="password" id="mvs-newpw" class="mvs-text-input" autocomplete="new-password" />
            </div>
            <button type="submit" class="mvs-btn mvs-btn--ghost" id="mvs-pw-save">${esc(cc.changePassword)}</button>
          </form>
        </section>
      </div>
    `;

    wireDetails(ctx);
    wirePassword();
  }

  function msg(id, kind, text) {
    const el = document.getElementById(id);
    el.className = "mvs-message mvs-message--" + kind;
    el.textContent = text;
    el.hidden = false;
  }

  function wireDetails(ctx) {
    const cc = c();
    document.getElementById("mvs-details-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const patch = {
        first_name: document.getElementById("mvs-first").value.trim(),
        last_name: document.getElementById("mvs-last").value.trim(),
        display_name: document.getElementById("mvs-display").value.trim(),
        company: document.getElementById("mvs-company").value.trim(),
        job_title: document.getElementById("mvs-job").value.trim(),
        country: document.getElementById("mvs-country").value.trim(),
        updated_at: new Date().toISOString(),
      };
      const btn = document.getElementById("mvs-details-save");
      btn.disabled = true;
      btn.textContent = cc.saving;
      const token = await Auth.getAccessToken();
      const user = Auth.currentUser();
      const res = await SupabaseClient.update("profiles", `id=eq.${user.id}`, patch, token);
      if (res.ok) {
        msg("mvs-acc-msg", "success", cc.detailsSaved);
      } else {
        msg("mvs-acc-msg", "error", cc.detailsFailed);
      }
      btn.disabled = false;
      btn.textContent = cc.saveDetails;
    });
  }

  function wirePassword() {
    const cc = c();
    document.getElementById("mvs-pw-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const pw = document.getElementById("mvs-newpw").value;
      if (pw.length < 6) {
        msg("mvs-pw-msg", "error", cc.passwordTooShort);
        return;
      }
      const btn = document.getElementById("mvs-pw-save");
      btn.disabled = true;
      btn.textContent = cc.saving;
      const res = await Auth.updatePassword(pw);
      if (res.ok) {
        msg("mvs-pw-msg", "success", cc.passwordChanged);
        document.getElementById("mvs-newpw").value = "";
      } else {
        msg("mvs-pw-msg", "error", res.error || cc.passwordFailed);
      }
      btn.disabled = false;
      btn.textContent = cc.changePassword;
    });
  }

  // ---- boot -----------------------------------------------------------
  (async function boot() {
    root().textContent = "";
    const token = await Auth.requireAuth("login.html");
    if (!token) return; // requireAuth has already redirected

    const ctx = await Auth.loadContext(true);
    if (!ctx) {
      root().innerHTML = `<div class="mvs-screen"><p class="mvs-message mvs-message--error">${esc(
        c().loadFailed
      )}</p></div>`;
      return;
    }
    const user = Auth.currentUser();
    const subRes = await SupabaseClient.select(
      "submissions",
      `user_id=eq.${user.id}&order=created_at.desc`,
      token
    );
    render(ctx, subRes.ok ? subRes.data : []);
    if (typeof Nav !== "undefined") Nav.mount({ active: "account", crumbs: [{ label: "Home", href: "index.html" }, { label: "Your account" }] });
  })();
})();
