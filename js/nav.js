/**
 * nav.js
 * -----------------------------------------------------------------------
 * THE single navigation header for every page in Conversa.
 *
 *   - Left: the Conversa brand (links home).
 *   - Middle: the main section links (Home, Communication Profile,
 *     Perception Check, Team Insights, Guide) — collapse into a burger (☰)
 *     menu on small screens.
 *   - Right: an "Account" button that opens a dropdown holding the
 *     account-related items (Your account, Admin, Sign out — or Sign in /
 *     Create account when signed out). These live under the account button
 *     rather than cluttering the main menu.
 *   - A discreet breadcrumb row underneath.
 *
 * The Admin item only appears for a platform administrator (checked
 * against the database). The links shown are convenience only; the real
 * protection is Row Level Security.
 *
 * All labels come from CONTENT.nav.
 * -----------------------------------------------------------------------
 */

const Nav = (function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

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

  // The items inside the account dropdown.
  function accountItems(active) {
    const c = (typeof CONTENT !== "undefined" && CONTENT.nav) || {};
    const signedIn = typeof Auth !== "undefined" && Auth.isSignedIn();
    if (signedIn) {
      return `
        <a class="mvs-account-item${active === "account" ? " is-active" : ""}" href="account.html">${esc(c.account || "Your account")}</a>
        <button type="button" id="mvs-nav-signout" class="mvs-account-item mvs-account-item--button">${esc(c.signOut || "Sign out")}</button>
      `;
    }
    return `
      <a class="mvs-account-item${active === "login" ? " is-active" : ""}" href="login.html">${esc(c.signIn || "Sign in")}</a>
      <a class="mvs-account-item" href="register.html">${esc(c.register || "Create account")}</a>
    `;
  }

  function crumbsHtml(crumbs) {
    if (!crumbs || crumbs.length < 2) return "";
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
    const signedIn = typeof Auth !== "undefined" && Auth.isSignedIn();

    const links = primaryLinks().map((l) => linkHtml(l, active)).join("");
    // Signed in, the button reads "Profile" and drops down Account / Admin /
    // Sign out; signed out it reads "Account" (Sign in / Create account).
    const accountLabel = signedIn ? c.profile || "Profile" : c.account || "Account";

    const personIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`;
    const caret = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;

    el.innerHTML = `
      <div class="mvs-topbar">
        <a class="mvs-topbar-brand" href="index.html" aria-label="Conversa home">
          ${LOGO}
          <span class="mvs-brand-word"><strong>Conversa</strong></span>
        </a>

        <nav class="mvs-topbar-nav" id="mvs-topnav" aria-label="Sections">
          <div class="mvs-nav-primary">${links}</div>
        </nav>

        <button type="button" class="mvs-burger" id="mvs-burger" aria-label="${esc(c.menu || "Menu")}" aria-expanded="false" aria-controls="mvs-topnav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>

        <div class="mvs-account" id="mvs-account">
          <button type="button" class="mvs-account-btn" id="mvs-account-btn" aria-haspopup="true" aria-expanded="false">
            ${personIcon}<span class="mvs-account-btn-label">${esc(accountLabel)}</span>${caret}
          </button>
          <div class="mvs-account-menu" id="mvs-account-menu" role="menu" hidden>
            ${accountItems(active)}
          </div>
        </div>
      </div>
      ${crumbsHtml(options.crumbs)}
    `;

    const topbar = el.querySelector(".mvs-topbar");
    const burger = document.getElementById("mvs-burger");
    const accountBtn = document.getElementById("mvs-account-btn");
    const accountMenu = document.getElementById("mvs-account-menu");

    // Burger toggles the section links on mobile.
    if (burger && topbar) {
      burger.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = topbar.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        closeAccount();
      });
    }

    function openAccount() {
      accountMenu.hidden = false;
      accountBtn.setAttribute("aria-expanded", "true");
    }
    function closeAccount() {
      if (!accountMenu) return;
      accountMenu.hidden = true;
      accountBtn.setAttribute("aria-expanded", "false");
    }
    if (accountBtn && accountMenu) {
      accountBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (accountMenu.hidden) openAccount();
        else closeAccount();
        if (topbar) topbar.classList.remove("is-open");
      });
      // Close on outside click / Escape.
      document.addEventListener("click", (e) => {
        if (!accountMenu.hidden && !el.querySelector(".mvs-account").contains(e.target)) closeAccount();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeAccount();
      });
    }

    // Sign out.
    const signout = document.getElementById("mvs-nav-signout");
    if (signout) {
      signout.addEventListener("click", async () => {
        signout.disabled = true;
        if (typeof Auth !== "undefined") await Auth.signOut();
        window.location.href = "index.html";
      });
    }

    // Once we know the account's role: reveal the Organisation section
    // link (org admins of a real organisation) and the Admin item in the
    // account dropdown (platform admins only).
    if (signedIn && typeof Auth !== "undefined") {
      Auth.loadContext()
        .then((ctx) => {
          if (!ctx) return;
          const primary = el.querySelector(".mvs-nav-primary");
          if (
            primary &&
            ctx.role === "org_admin" &&
            ctx.activeOrg &&
            !ctx.activeOrg.is_personal &&
            !document.getElementById("mvs-nav-org")
          ) {
            const o = document.createElement("a");
            o.id = "mvs-nav-org";
            o.className = "mvs-nav-link" + (active === "organisation" ? " is-active" : "");
            o.href = "organisation.html";
            o.textContent = c.organisation || "Organisation";
            primary.appendChild(o);
          }
          if (ctx.profile && ctx.profile.is_platform_admin && accountMenu && !document.getElementById("mvs-nav-admin")) {
            const a = document.createElement("a");
            a.id = "mvs-nav-admin";
            a.className = "mvs-account-item" + (active === "admin" ? " is-active" : "");
            a.href = "admin.html";
            a.textContent = c.admin || "Admin";
            // Order: Account, Admin, Sign out — so insert before Sign out.
            const signoutBtn = document.getElementById("mvs-nav-signout");
            accountMenu.insertBefore(a, signoutBtn || null);
          }
        })
        .catch(() => {});
    }
  }

  return { mount };
})();
