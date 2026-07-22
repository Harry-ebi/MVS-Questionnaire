/**
 * auth.js
 * -----------------------------------------------------------------------
 * The signed-in-user layer for Conversa (Phase 2). Sits on top of
 * supabaseClient.js and does three jobs:
 *
 *   1. Holds the session   — the access + refresh tokens, kept in the
 *      browser's localStorage so a person stays signed in across pages
 *      and visits. Refreshes the access token automatically before it
 *      expires. (localStorage is standard for a hosted web app; it has
 *      nothing to do with the tool's anonymous local-file saves.)
 *
 *   2. Knows who you are   — loads your profile, your memberships and
 *      your organisations once signed in, and works out your "active"
 *      organisation and role.
 *
 *   3. Guards pages        — requireAuth() sends anyone not signed in to
 *      the login page; identityForSave() hands app.js / pressure.js the
 *      user + org to stamp on a saved result.
 *
 * Like the rest of this codebase it FAILS SOFT: every method resolves to
 * a plain result or null, and never throws into the page around it. It
 * relies on Row Level Security in the database for real enforcement —
 * nothing here is a security boundary on its own.
 * -----------------------------------------------------------------------
 */

const Auth = (function () {
  const SESSION_KEY = "conversa_session_v1";
  const ACTIVE_ORG_KEY = "conversa_active_org_v1";
  const REFRESH_SKEW_SECONDS = 60; // refresh this many seconds before expiry

  // In-memory cache of the loaded context, so pages don't refetch on
  // every call within a single page view.
  let context = null; // { profile, memberships, organisations, activeOrg, role }

  // ---- session storage ------------------------------------------------

  function getSession() {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function setSession(session) {
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (err) {
      /* private mode / storage disabled — the user just won't stay signed in */
    }
  }

  function clearSession() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch (err) {
      /* ignore */
    }
    context = null;
  }

  /** Normalise the various Supabase auth responses into our stored shape. */
  function storeFromAuthResponse(data) {
    if (!data || !data.access_token) return null;
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      // expires_at is unix seconds; derive from expires_in if absent.
      expires_at:
        data.expires_at ||
        Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    };
    setSession(session);
    context = null; // force a reload of profile/org next time
    return session;
  }

  // ---- token freshness ------------------------------------------------

  function isExpired(session) {
    if (!session || !session.expires_at) return true;
    return Math.floor(Date.now() / 1000) >= session.expires_at - REFRESH_SKEW_SECONDS;
  }

  /**
   * Return a currently-valid access token, refreshing it first if needed.
   * Returns null (and clears the session) if there's no valid session and
   * refresh fails.
   */
  async function getAccessToken() {
    let session = getSession();
    if (!session) return null;
    if (!isExpired(session)) return session.access_token;
    if (!session.refresh_token) {
      clearSession();
      return null;
    }
    const refreshed = await SupabaseClient.refresh(session.refresh_token);
    const stored = storeFromAuthResponse(refreshed);
    if (!stored) {
      clearSession();
      return null;
    }
    return stored.access_token;
  }

  function isSignedIn() {
    return !!getSession();
  }

  /** The basic identity (id + email) with no network call, or null. */
  function currentUser() {
    const s = getSession();
    return s && s.user ? s.user : null;
  }

  // ---- auth actions ---------------------------------------------------

  async function signIn(email, password) {
    const data = await SupabaseClient.signIn(email, password);
    if (!data || !data.access_token) {
      return { ok: false, error: "Those sign-in details weren't recognised." };
    }
    const session = storeFromAuthResponse(data);
    touchLastLogin(session); // fire and forget
    return { ok: true };
  }

  async function register(fields) {
    const meta = {
      first_name: (fields.firstName || "").trim(),
      last_name: (fields.lastName || "").trim(),
    };
    const res = await SupabaseClient.signUp(fields.email, fields.password, meta);
    if (!res.ok) return { ok: false, error: res.error };

    // If email confirmation is OFF (our current setup), the response
    // carries a session and we're signed straight in. If it's ON later,
    // there's a user but no session — signal that instead.
    const data = res.data || {};
    const sessionData = data.access_token ? data : data.session;
    if (sessionData && sessionData.access_token) {
      const session = storeFromAuthResponse(sessionData);
      touchLastLogin(session);
      return { ok: true, signedIn: true };
    }
    return { ok: true, signedIn: false, needsConfirmation: true };
  }

  async function signOut() {
    const s = getSession();
    if (s && s.access_token) await SupabaseClient.signOut(s.access_token);
    clearSession();
  }

  async function requestPasswordReset(email) {
    // Placeholder flow — see supabaseClient.resetPassword(). We always
    // report success so an attacker can't probe which emails exist.
    await SupabaseClient.resetPassword(email);
    return { ok: true };
  }

  async function updatePassword(newPassword) {
    const token = await getAccessToken();
    if (!token) return { ok: false, error: "Please sign in again." };
    return SupabaseClient.updateUser(token, { password: newPassword });
  }

  function touchLastLogin(session) {
    try {
      if (!session || !session.user) return;
      SupabaseClient.update(
        "profiles",
        `id=eq.${session.user.id}`,
        { last_login_at: new Date().toISOString() },
        session.access_token
      );
    } catch (err) {
      /* best effort only */
    }
  }

  // ---- context (profile / orgs / role) --------------------------------

  /**
   * Load and cache the signed-in user's profile, memberships and
   * organisations. Returns the context object, or null if not signed in
   * or unreachable. Pass force=true to bypass the in-memory cache.
   */
  async function loadContext(force) {
    if (context && !force) return context;
    const token = await getAccessToken();
    const user = currentUser();
    if (!token || !user) return null;

    const profileRes = await SupabaseClient.select("profiles", `id=eq.${user.id}`, token);
    const memRes = await SupabaseClient.select("memberships", "order=created_at.asc", token);
    const orgRes = await SupabaseClient.select("organisations", "order=created_at.asc", token);

    const profile = profileRes.ok && profileRes.data[0] ? profileRes.data[0] : null;
    const memberships = memRes.ok ? memRes.data : [];
    const organisations = orgRes.ok ? orgRes.data : [];

    // Active organisation: a remembered choice (if still a member), else
    // the personal workspace, else the first.
    const storedId = getActiveOrgId();
    let activeOrg =
      (storedId && organisations.find((o) => o.id === storedId)) ||
      organisations.find((o) => o.is_personal) ||
      organisations[0] ||
      null;
    let role = "member";
    if (activeOrg) {
      const m = memberships.find((mm) => mm.organisation_id === activeOrg.id);
      if (m) role = m.role;
    }

    context = { profile, memberships, organisations, activeOrg, role };
    return context;
  }

  function getActiveOrgId() {
    try {
      return window.localStorage.getItem(ACTIVE_ORG_KEY) || null;
    } catch (err) {
      return null;
    }
  }

  /** Remember which organisation is "active" and clear the cached context. */
  function setActiveOrg(orgId) {
    try {
      if (orgId) window.localStorage.setItem(ACTIVE_ORG_KEY, orgId);
      else window.localStorage.removeItem(ACTIVE_ORG_KEY);
    } catch (err) {
      /* ignore */
    }
    context = null;
  }

  /**
   * Create a new organisation owned by the current user and make them its
   * admin, then switch to it. Returns { ok, org } or { ok:false, error }.
   */
  async function createOrganisation(name) {
    const token = await getAccessToken();
    const user = currentUser();
    if (!token || !user) return { ok: false, error: "Please sign in again." };
    const clean = (name || "").trim();
    if (!clean) return { ok: false, error: "Please enter an organisation name." };

    const orgId =
      window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : "org-" + Date.now() + "-" + Math.floor(Math.random() * 1e6);
    const slug =
      clean
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) +
      "-" +
      Math.random().toString(36).slice(2, 6);

    const orgOk = await SupabaseClient.insert(
      "organisations",
      { id: orgId, name: clean, slug: slug, owner_id: user.id, is_personal: false },
      token
    );
    if (!orgOk) return { ok: false, error: "Couldn't create the organisation. Please try again." };

    const memOk = await SupabaseClient.insert(
      "memberships",
      { user_id: user.id, organisation_id: orgId, role: "org_admin" },
      token
    );
    if (!memOk) return { ok: false, error: "Organisation created, but adding you as admin failed. Please refresh." };

    setActiveOrg(orgId);
    return { ok: true, org: { id: orgId, name: clean, slug: slug, is_personal: false, owner_id: user.id } };
  }

  /**
   * The bundle app.js / pressure.js need to stamp a saved result:
   * { userId, organisationId, accessToken }, or null when not signed in.
   * Never throws; if anything is missing it returns null and the caller
   * simply saves anonymously as before.
   */
  async function identityForSave() {
    try {
      const token = await getAccessToken();
      const user = currentUser();
      if (!token || !user) return null;
      const ctx = await loadContext();
      const orgId = ctx && ctx.activeOrg ? ctx.activeOrg.id : null;
      return { userId: user.id, organisationId: orgId, accessToken: token };
    } catch (err) {
      return null;
    }
  }

  // ---- page guard -----------------------------------------------------

  /**
   * Ensure the visitor is signed in (refreshing the token if needed).
   * If not, redirect to the login page carrying a ?next= back-link so
   * they return here afterwards. Resolves with an access token when
   * signed in; otherwise it has already navigated away.
   */
  async function requireAuth(loginPage) {
    const token = await getAccessToken();
    if (token) return token;
    const here = window.location.pathname.split("/").pop() + window.location.search;
    const dest = (loginPage || "login.html") + "?next=" + encodeURIComponent(here);
    window.location.replace(dest);
    return null;
  }

  return {
    getSession,
    clearSession,
    isSignedIn,
    currentUser,
    getAccessToken,
    signIn,
    register,
    signOut,
    requestPasswordReset,
    updatePassword,
    loadContext,
    identityForSave,
    requireAuth,
    getActiveOrgId,
    setActiveOrg,
    createOrganisation,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { Auth };
}
