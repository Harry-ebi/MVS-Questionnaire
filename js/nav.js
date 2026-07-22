/**
 * nav.js
 * -----------------------------------------------------------------------
 * Renders the small navigation row shown under the Conversa brand header,
 * adapting to whether someone is signed in (and, later, to their role).
 *
 * Milestone 1 keeps this deliberately minimal — Home, the reflection, the
 * Guide, and either Account/Sign out (signed in) or Sign in/Create account
 * (signed out). The full role-aware navigation (Dashboard, Organisation,
 * Admin) arrives with the organisation + admin work in the next milestone.
 *
 * All labels come from CONTENT.nav so copy stays in content.js. The links
 * shown are convenience only; the database's Row Level Security is what
 * actually protects data.
 * -----------------------------------------------------------------------
 */

const Nav = (function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function link(href, label, active) {
    return `<a class="mvs-nav-link${active ? " is-active" : ""}" href="${href}">${esc(label)}</a>`;
  }

  /**
   * Render into the element with id `containerId`.
   * options.active — one of: home, reflection, guide, account, login, register.
   */
  async function render(containerId, options) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const c = (typeof CONTENT !== "undefined" && CONTENT.nav) || {};
    const active = (options && options.active) || "";

    const signedIn = typeof Auth !== "undefined" && Auth.isSignedIn();

    const left = [
      link("index.html", c.home || "Home", active === "home"),
      link("reflection.html", c.reflection || "Communication Profile", active === "reflection"),
      link("guide.html", c.guide || "Guide", active === "guide"),
    ].join("");

    let right;
    if (signedIn) {
      const user = Auth.currentUser();
      const who = user && user.email ? user.email : "";
      right = `
        ${link("account.html", c.account || "Account", active === "account")}
        <button type="button" id="mvs-nav-signout" class="mvs-nav-link mvs-nav-link--button">${esc(
          c.signOut || "Sign out"
        )}</button>
        <span class="mvs-nav-who" title="${esc(who)}">${esc(who)}</span>
      `;
    } else {
      right = `
        ${link("login.html", c.signIn || "Sign in", active === "login")}
        <a class="mvs-nav-link mvs-nav-link--cta" href="register.html">${esc(
          c.register || "Create account"
        )}</a>
      `;
    }

    el.innerHTML = `
      <nav class="mvs-nav" aria-label="Main">
        <div class="mvs-nav-left">${left}</div>
        <div class="mvs-nav-right">${right}</div>
      </nav>
    `;

    const signout = document.getElementById("mvs-nav-signout");
    if (signout) {
      signout.addEventListener("click", async function () {
        signout.disabled = true;
        await Auth.signOut();
        window.location.href = "index.html";
      });
    }
  }

  return { render };
})();
