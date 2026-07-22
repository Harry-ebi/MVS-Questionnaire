/**
 * authForms.js
 * -----------------------------------------------------------------------
 * Renders and wires the three unauthenticated screens — Sign in, Create
 * account, and Password reset — into <main id="app">. Each HTML shell
 * calls the matching AuthForms.render*() function.
 *
 * All copy comes from CONTENT.auth. All real work is delegated to the
 * Auth module (auth.js); this file is just the forms and their handlers.
 * Nothing here is a security boundary — the database's Row Level Security
 * is. This layer only decides which screen to show.
 * -----------------------------------------------------------------------
 */

const AuthForms = (function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  const root = () => document.getElementById("app");

  function nextTarget() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    // Only allow same-site relative targets (no protocol / no leading //).
    if (next && !/^https?:|^\/\//i.test(next)) return next;
    return "account.html";
  }

  function showMessage(id, kind, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = "mvs-message mvs-message--" + kind;
    el.textContent = text;
    el.hidden = false;
  }
  function hide(id) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }

  // If already signed in, there's no point showing sign-in/register.
  async function bounceIfSignedIn() {
    if (typeof Auth !== "undefined" && Auth.isSignedIn()) {
      const token = await Auth.getAccessToken();
      if (token) {
        window.location.replace(nextTarget());
        return true;
      }
    }
    return false;
  }

  // ---- Sign in --------------------------------------------------------
  async function renderLogin() {
    if (await bounceIfSignedIn()) return;
    const c = CONTENT.auth;
    root().innerHTML = `
      <div class="mvs-screen">
        <h1>${esc(c.login.title)}</h1>
        <p class="mvs-lead">${esc(c.login.body)}</p>
        <p class="mvs-message" id="mvs-auth-msg" hidden></p>
        <form class="mvs-auth-form" id="mvs-login-form" novalidate>
          <div class="mvs-form-row">
            <label class="mvs-field-label" for="mvs-login-email">${esc(c.emailLabel)}</label>
            <input type="email" id="mvs-login-email" class="mvs-text-input" autocomplete="email" required />
          </div>
          <div class="mvs-form-row">
            <label class="mvs-field-label" for="mvs-login-password">${esc(c.passwordLabel)}</label>
            <input type="password" id="mvs-login-password" class="mvs-text-input" autocomplete="current-password" required />
          </div>
          <button type="submit" class="mvs-btn mvs-btn--primary" id="mvs-login-submit">${esc(c.login.cta)}</button>
        </form>
        <p class="mvs-auth-alt"><a href="reset-password.html">${esc(c.login.forgot)}</a></p>
        <p class="mvs-auth-alt">${esc(c.login.noAccount)} <a href="register.html">${esc(c.login.registerLink)}</a></p>
      </div>
    `;
    document.getElementById("mvs-login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      hide("mvs-auth-msg");
      const email = document.getElementById("mvs-login-email").value.trim();
      const password = document.getElementById("mvs-login-password").value;
      if (!email || !password) {
        showMessage("mvs-auth-msg", "error", c.fillBoth);
        return;
      }
      const btn = document.getElementById("mvs-login-submit");
      btn.disabled = true;
      btn.textContent = c.login.working;
      const res = await Auth.signIn(email, password);
      if (res.ok) {
        window.location.href = nextTarget();
      } else {
        showMessage("mvs-auth-msg", "error", res.error || c.genericError);
        btn.disabled = false;
        btn.textContent = c.login.cta;
      }
    });
  }

  // ---- Create account -------------------------------------------------
  async function renderRegister() {
    if (await bounceIfSignedIn()) return;
    const c = CONTENT.auth;
    root().innerHTML = `
      <div class="mvs-screen">
        <h1>${esc(c.register.title)}</h1>
        <p class="mvs-lead">${esc(c.register.body)}</p>
        <p class="mvs-message" id="mvs-auth-msg" hidden></p>
        <form class="mvs-auth-form" id="mvs-register-form" novalidate>
          <div class="mvs-form-split">
            <div class="mvs-form-row">
              <label class="mvs-field-label" for="mvs-reg-first">${esc(c.firstNameLabel)}</label>
              <input type="text" id="mvs-reg-first" class="mvs-text-input" autocomplete="given-name" />
            </div>
            <div class="mvs-form-row">
              <label class="mvs-field-label" for="mvs-reg-last">${esc(c.lastNameLabel)}</label>
              <input type="text" id="mvs-reg-last" class="mvs-text-input" autocomplete="family-name" />
            </div>
          </div>
          <div class="mvs-form-row">
            <label class="mvs-field-label" for="mvs-reg-email">${esc(c.emailLabel)}</label>
            <input type="email" id="mvs-reg-email" class="mvs-text-input" autocomplete="email" required />
          </div>
          <div class="mvs-form-row">
            <label class="mvs-field-label" for="mvs-reg-password">${esc(c.passwordLabel)}</label>
            <input type="password" id="mvs-reg-password" class="mvs-text-input" autocomplete="new-password" required />
            <p class="mvs-field-hint">${esc(c.register.passwordHint)}</p>
          </div>
          <button type="submit" class="mvs-btn mvs-btn--primary" id="mvs-reg-submit">${esc(c.register.cta)}</button>
        </form>
        <p class="mvs-auth-alt">${esc(c.register.haveAccount)} <a href="login.html">${esc(c.register.loginLink)}</a></p>
      </div>
    `;
    document.getElementById("mvs-register-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      hide("mvs-auth-msg");
      const firstName = document.getElementById("mvs-reg-first").value.trim();
      const lastName = document.getElementById("mvs-reg-last").value.trim();
      const email = document.getElementById("mvs-reg-email").value.trim();
      const password = document.getElementById("mvs-reg-password").value;
      if (!email || !password) {
        showMessage("mvs-auth-msg", "error", c.fillBoth);
        return;
      }
      if (password.length < 6) {
        showMessage("mvs-auth-msg", "error", c.register.passwordTooShort);
        return;
      }
      const btn = document.getElementById("mvs-reg-submit");
      btn.disabled = true;
      btn.textContent = c.register.working;
      const res = await Auth.register({ firstName, lastName, email, password });
      if (res.ok && res.signedIn) {
        window.location.href = nextTarget();
      } else if (res.ok && res.needsConfirmation) {
        showMessage("mvs-auth-msg", "success", c.register.confirmNote);
        btn.textContent = c.register.cta;
      } else {
        showMessage("mvs-auth-msg", "error", res.error || c.genericError);
        btn.disabled = false;
        btn.textContent = c.register.cta;
      }
    });
  }

  // ---- Password reset -------------------------------------------------
  // Two modes: request a reset (dormant until email/SMTP is configured),
  // or — if arriving from a recovery link that put a token in the URL
  // hash — set a new password.
  function recoveryTokenFromHash() {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return null;
    const p = new URLSearchParams(hash);
    if (p.get("type") === "recovery" && p.get("access_token")) {
      return {
        access_token: p.get("access_token"),
        refresh_token: p.get("refresh_token"),
        expires_in: parseInt(p.get("expires_in") || "3600", 10),
      };
    }
    return null;
  }

  function renderReset() {
    const c = CONTENT.auth;
    const recovery = recoveryTokenFromHash();

    if (recovery) {
      // Store the recovery session so updatePassword() can authenticate.
      const session = {
        access_token: recovery.access_token,
        refresh_token: recovery.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + recovery.expires_in,
        user: null,
      };
      try {
        window.localStorage.setItem("conversa_session_v1", JSON.stringify(session));
      } catch (err) {}
      history.replaceState(null, "", window.location.pathname); // strip token from the URL

      root().innerHTML = `
        <div class="mvs-screen">
          <h1>${esc(c.reset.setTitle)}</h1>
          <p class="mvs-lead">${esc(c.reset.setBody)}</p>
          <p class="mvs-message" id="mvs-auth-msg" hidden></p>
          <form class="mvs-auth-form" id="mvs-setpw-form" novalidate>
            <div class="mvs-form-row">
              <label class="mvs-field-label" for="mvs-setpw">${esc(c.reset.newPasswordLabel)}</label>
              <input type="password" id="mvs-setpw" class="mvs-text-input" autocomplete="new-password" required />
            </div>
            <button type="submit" class="mvs-btn mvs-btn--primary" id="mvs-setpw-submit">${esc(c.reset.setCta)}</button>
          </form>
        </div>
      `;
      document.getElementById("mvs-setpw-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        hide("mvs-auth-msg");
        const pw = document.getElementById("mvs-setpw").value;
        if (pw.length < 6) {
          showMessage("mvs-auth-msg", "error", c.register.passwordTooShort);
          return;
        }
        const btn = document.getElementById("mvs-setpw-submit");
        btn.disabled = true;
        btn.textContent = c.reset.working;
        const res = await Auth.updatePassword(pw);
        if (res.ok) {
          showMessage("mvs-auth-msg", "success", c.reset.setDone);
          setTimeout(() => (window.location.href = "login.html"), 1500);
        } else {
          showMessage("mvs-auth-msg", "error", res.error || c.genericError);
          btn.disabled = false;
          btn.textContent = c.reset.setCta;
        }
      });
      return;
    }

    // Request mode.
    root().innerHTML = `
      <div class="mvs-screen">
        <h1>${esc(c.reset.title)}</h1>
        <p class="mvs-lead">${esc(c.reset.body)}</p>
        <p class="mvs-field-hint">${esc(c.reset.dormantNote)}</p>
        <p class="mvs-message" id="mvs-auth-msg" hidden></p>
        <form class="mvs-auth-form" id="mvs-reset-form" novalidate>
          <div class="mvs-form-row">
            <label class="mvs-field-label" for="mvs-reset-email">${esc(c.emailLabel)}</label>
            <input type="email" id="mvs-reset-email" class="mvs-text-input" autocomplete="email" required />
          </div>
          <button type="submit" class="mvs-btn mvs-btn--primary" id="mvs-reset-submit">${esc(c.reset.cta)}</button>
        </form>
        <p class="mvs-auth-alt"><a href="login.html">${esc(c.reset.backToLogin)}</a></p>
      </div>
    `;
    document.getElementById("mvs-reset-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      hide("mvs-auth-msg");
      const email = document.getElementById("mvs-reset-email").value.trim();
      if (!email) {
        showMessage("mvs-auth-msg", "error", c.reset.needEmail);
        return;
      }
      const btn = document.getElementById("mvs-reset-submit");
      btn.disabled = true;
      btn.textContent = c.reset.working;
      await Auth.requestPasswordReset(email);
      showMessage("mvs-auth-msg", "success", c.reset.requestDone);
      btn.textContent = c.reset.cta;
    });
  }

  return { renderLogin, renderRegister, renderReset };
})();
