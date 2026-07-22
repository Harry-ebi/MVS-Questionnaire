/**
 * nav.js
 * -----------------------------------------------------------------------
 * THE single navigation header for every page in Conversa. One component,
 * used everywhere, so the app stops "kicking between" different header
 * styles. It renders:
 *
 *   - a top bar: the Conversa brand (links home) on the left, and the
 *     navigation links + account controls on the right;
 *   - a burger (☰) menu that the links collapse into on small screens;
 *   - a discreet breadcrumb row underneath (e.g. Home › Your account).
 *
 * It adapts to whether someone is signed in, and reveals the Admin link
 * only to a platform administrator (checked against the database, not
 * just hidden in the UI — the real protection is Row Level Security).
 *
 * Usage on a page:  Nav.mount({ active: "account", crumbs: [...] });
 * Labels come from CONTENT.nav so all copy stays in content.js.
 * -----------------------------------------------------------------------
 */

const Nav = (function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // The Conversa brand mark, identical to the one used across the site.
  const LOGO = `
    <svg class="mvs-brand-mark" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Conversa logo">
      <path class="cv-arc cv-arc--navy" stroke-width="7" d="M12,26 A21,21 0 0 1 50,21" />
      <path class="cv-arc cv-arc--light" stroke-width="7" d="M53,28 A21,21 0 0 1 51,39" />
      <path class="cv-arc cv-arc--blue" stroke-width="7" d="M47,46 A21,21 0 0 1 15,40" />
      <path class="cv-tail" d="M24,50 L15,60 L31,52 Z" />
      <circle class="cv-dot" cx="23" cy="31" r="3.1" />
      <circle class="cv-dot" cx="32" cy="31" r="3.1" />
      <circle class="cv-dot" cx="41" cy="31" r="3.1" />
    </svg>`;

  // The primary destinations, in order. All of these pages exist and work
  // for both signed-in and anonymous visitors.
  function primaryLinks() {
    const c = (typeof CONTENT !== "undefined" && CONTENT.nav) || {};
    return [
      { key: "home", href: "index.html", label: c.home || "Home" },
      { key: "reflection", href: "reflection.html", label: c.reflection || "Communication Profile" },
      { key: "guess", href: "guess.html", label: c.perception || "Perception Check" },
      { key: "team", href: "team.html", label: c.team || "Team Insights" },
      { key: "guide", href: "guide.html", label: c.guide || "Guide" },
    ];
  }

  function linkHtml(l, active) {
    return `<a class="mvs-nav-link${l.key === active ? " is-active" : ""}" href="${l.href}">${esc(l.label)}</a>`;
  }

  function accountHtml(active) {
    const c = (typeof CONTENT !== "undefined" && CONTENT.nav) || {};
    const signedIn = typeof Auth !== "undefined" && Auth.isSignedIn();
    if (signedIn) {
      return `
        <a class="mvs-nav-link${active === "account" ? " is-active" : ""}" href="account.html">${esc(c.account || "Account")}</a>
        <button type="button" id="mvs-nav-signout" class="mvs-nav-link mvs-nav-link--button">${esc(c.signOut || "Sign out")}</button>
      `;
    }
    return `
      <a class="mvs-nav-link${active === "login" ? " is-active" : ""}" href="login.html">${esc(c.signIn || "Sign in")}</a>
      <a class="mvs-nav-link mvs-nav-link--cta" href="register.html">${esc(c.register || "Create account")}</a>
    `;
  }

  function crumbsHtml(crumbs) {
    if (!crumbs || crumbs.length < 2) return ""; // nothing useful to show on the home page
    const parts = crumbs.map((cr, i) => {
      const last = i === crumbs.length - 1;
      if (last || !cr.href) return `<span aria-current="page">${esc(cr.label)}</span>`;
      return `<a href="${cr.href}">${esc(cr.label)}</a>`;
    });
    return `<nav class="mvs-crumbs" aria-label="Breadcrumb">${parts.join('<span class="mvs-crumb-sep">›</span>')}</nav>`;
  }

  function mount(options) {
    options = options || {};
    const containerId = options.containerId || "mvs-header";
    const el = document.getElementById(containerId);
    if (!el) return;
    const active = options.active || "";
    const c = (typeof CONTENT !== "undefined" && CONTENT.nav) || {};

    const links = primaryLinks().map((l) => linkHtml(l, active)).join("");

    el.innerHTML = `
      <div class="mvs-topbar">
        <a class="mvs-topbar-brand" href="index.html" aria-label="Conversa home">
          ${LOGO}
          <span class="mvs-brand-word"><strong>Conversa</strong><span>Better workplace communication</span></span>
        </a>
        <button type="button" class="mvs-burger" id="mvs-burger" aria-label="${esc(c.menu || "Menu")}" aria-expanded="false" aria-controls="mvs-topnav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <nav class="mvs-topbar-nav" id="mvs-topnav" aria-label="Primary">
          <div class="mvs-nav-primary">${links}</div>
          <div class="mvs-nav-account" id="mvs-nav-account">${accountHtml(active)}</div>
        </nav>
      </div>
      ${crumbsHtml(options.crumbs)}
    `;

    // Burger toggle
    const burger = document.getElementById("mvs-burger");
    const topbar = el.querySelector(".mvs-topbar");
    if (burger && topbar) {
      burger.addEventListener("click", () => {
        const open = topbar.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    // Sign out
    const signout = document.getElementById("mvs-nav-signout");
    if (signout) {
      signout.addEventListener("click", async () => {
        signout.disabled = true;
        if (typeof Auth !== "undefined") await Auth.signOut();
        window.location.href = "index.html";
      });
    }

    // Reveal the Admin link only for a platform administrator (async check).
    if (typeof Auth !== "undefined" && Auth.isSignedIn()) {
      Auth.loadContext()
        .then((ctx) => {
          if (ctx && ctx.profile && ctx.profile.is_platform_admin) {
            const acc = document.getElementById("mvs-nav-account");
            if (acc && !document.getElementById("mvs-nav-admin")) {
              const a = document.createElement("a");
              a.id = "mvs-nav-admin";
              a.className = "mvs-nav-link" + (active === "admin" ? " is-active" : "");
              a.href = "admin.html";
              a.textContent = c.admin || "Admin";
              acc.insertBefore(a, acc.firstChild);
            }
          }
        })
        .catch(() => {});
    }
  }

  return { mount };
})();
