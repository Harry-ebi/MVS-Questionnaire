/**
 * organisation.js
 * -----------------------------------------------------------------------
 * The organisation-administrator dashboard: a view of one organisation
 * (the reader's active one), scoped strictly to that organisation by Row
 * Level Security. Shows the organisation name, headline counts, recent
 * activity and a table of its users.
 *
 * Guarded by Auth.requireAuth(). What comes back is decided by the
 * database policies — an org admin only ever sees their own org's rows,
 * and someone who isn't an admin of a (non-personal) organisation is
 * shown a friendly pointer back to their account instead.
 *
 * All copy lives in CONTENT.organisation.
 * -----------------------------------------------------------------------
 */

(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  const root = () => document.getElementById("app");
  const c = () => CONTENT.organisation;

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch (err) {
      return String(iso).slice(0, 10);
    }
  }

  function renderNoOrg() {
    const cc = c();
    root().innerHTML = `
      <div class="mvs-screen">
        <h1>${esc(cc.title)}</h1>
        <p class="mvs-lead">${esc(cc.noOrgBody)}</p>
        <a class="mvs-btn mvs-btn--primary" href="account.html">${esc(cc.toAccountCta)}</a>
      </div>
    `;
    if (typeof Nav !== "undefined") Nav.mount({ active: "organisation", crumbs: crumbs() });
  }

  function crumbs() {
    return [{ label: "Home", href: "index.html" }, { label: CONTENT.nav.organisation || "Organisation" }];
  }

  function usersTable(members, profilesById) {
    const cc = c();
    if (!members.length) return `<p class="mvs-history-empty">${esc(cc.noUsers)}</p>`;
    const rows = members
      .map((m) => {
        const p = profilesById[m.user_id] || {};
        const roleLabel = m.role === "org_admin" ? cc.roleOrgAdmin : cc.roleMember;
        return `
          <tr>
            <td>${esc(p.display_name || "—")}</td>
            <td>${esc(p.email || "—")}</td>
            <td>${esc(roleLabel)}</td>
            <td>${esc(fmtDate(m.created_at))}</td>
          </tr>`;
      })
      .join("");
    return `
      <table class="mvs-history-table">
        <thead><tr>
          <th>${esc(cc.colName)}</th><th>${esc(cc.colEmail)}</th><th>${esc(cc.colRole)}</th><th>${esc(cc.colJoined)}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function recentList(subs) {
    const cc = c();
    if (!subs.length) return `<p class="mvs-history-empty">${esc(cc.noActivity)}</p>`;
    return `<ul class="mvs-list">${subs
      .slice(0, 8)
      .map((s) => {
        const kind = s.record_type === "pressure" ? cc.typePressure : cc.typeEveryday;
        return `<li>${esc(fmtDate(s.created_at))} — ${esc(s.name || "—")} (${esc(kind)})</li>`;
      })
      .join("")}</ul>`;
  }

  function render(org, members, profilesById, subs) {
    const cc = c();
    const everyday = subs.filter((s) => s.record_type !== "pressure").length;
    const pressure = subs.filter((s) => s.record_type === "pressure").length;
    const last = subs.length ? subs[0].created_at : null;

    root().innerHTML = `
      <div class="mvs-screen">
        <h1>${esc(org.name)}</h1>
        <p class="mvs-lead">${esc(cc.subtitle)}</p>
        <div class="mvs-callout"><p>${esc(cc.internalNotice)}</p></div>

        <section class="mvs-section">
          <div class="mvs-stat-row">
            <div class="mvs-stat"><div class="mvs-stat-value">${members.length}</div><div class="mvs-stat-label">${esc(cc.statUsers)}</div></div>
            <div class="mvs-stat"><div class="mvs-stat-value">${everyday}</div><div class="mvs-stat-label">${esc(cc.statProfiles)}</div></div>
            <div class="mvs-stat"><div class="mvs-stat-value">${pressure}</div><div class="mvs-stat-label">${esc(cc.statPressure)}</div></div>
            <div class="mvs-stat"><div class="mvs-stat-value" style="font-size:1rem;padding-top:6px;">${esc(fmtDate(last))}</div><div class="mvs-stat-label">${esc(cc.statLast)}</div></div>
          </div>
        </section>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${esc(cc.recentHeading)}</h2>
          ${recentList(subs)}
        </section>

        <section class="mvs-section">
          <h2 class="mvs-section-title">${esc(cc.usersHeading)}</h2>
          ${usersTable(members, profilesById)}
        </section>
      </div>
    `;
    if (typeof Nav !== "undefined") Nav.mount({ active: "organisation", crumbs: crumbs() });
  }

  (async function boot() {
    root().textContent = "";
    const token = await Auth.requireAuth("login.html");
    if (!token) return;

    const ctx = await Auth.loadContext(true);
    const org = ctx && ctx.activeOrg;
    // Only a non-personal organisation you administer has a dashboard.
    if (!org || org.is_personal || ctx.role !== "org_admin") {
      renderNoOrg();
      return;
    }

    const memRes = await SupabaseClient.select("memberships", `organisation_id=eq.${org.id}&order=created_at.asc`, token);
    const members = memRes.ok ? memRes.data : [];
    const ids = members.map((m) => m.user_id);

    let profilesById = {};
    if (ids.length) {
      const profRes = await SupabaseClient.select("profiles", `id=in.(${ids.join(",")})`, token);
      if (profRes.ok) profRes.data.forEach((p) => (profilesById[p.id] = p));
    }

    const subRes = await SupabaseClient.select("submissions", `organisation_id=eq.${org.id}&order=created_at.desc`, token);
    const subs = subRes.ok ? subRes.data : [];

    render(org, members, profilesById, subs);
  })();
})();
