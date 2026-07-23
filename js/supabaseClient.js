/**
 * supabaseClient.js
 * -----------------------------------------------------------------------
 * A small, dependency-free wrapper around Supabase's REST (PostgREST) and
 * Auth HTTP APIs, using plain fetch() — no external library or CDN script
 * needed, in keeping with the rest of this tool (no build step, no
 * frameworks, nothing to install).
 *
 * SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY below are both safe to have
 * here in plain text, committed to the repo and visible in page source:
 * the publishable key can only ever do what the database's own Row Level
 * Security policies allow (see README.md's "Database setup" section for
 * the exact SQL). It is NOT a secret — unlike Supabase's "secret" /
 * "service_role" key, which must never appear in this file or anywhere
 * else client-side, since it bypasses every security rule.
 *
 * Every function here fails soft: a network hiccup, a misconfigured
 * table, or the database being briefly unreachable should never break
 * the page around it (the same "best effort, never block" spirit as the
 * existing local-file auto-save and js/aggregate.js). Callers get back a
 * plain success/failure signal and decide what to show.
 * -----------------------------------------------------------------------
 */

const SUPABASE_URL = "https://jbfzqofhgqlbwmolpglg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_-PJzHj4rRkErbOOUjZqb6g__cgNrUqy";

const SupabaseClient = (function () {
  function restHeaders(accessToken) {
    return {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken || SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Insert one row into `table`. Returns true/false, never throws.
   * Pass `accessToken` to insert AS a signed-in user (so Row Level
   * Security policies that check auth.uid() apply). Omit it and the
   * insert runs as the anonymous role, exactly as before — this keeps
   * the existing anonymous reflection save working unchanged.
   */
  async function insert(table, record, accessToken) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { ...restHeaders(accessToken), Prefer: "return=minimal" },
        body: JSON.stringify(record),
      });
      return res.ok;
    } catch (err) {
      console.warn(`Supabase insert into "${table}" failed:`, err);
      return false;
    }
  }

  /**
   * Call a Postgres function (RPC) that's been granted to the public
   * ("anon") role — used for the team-code-gated reads, where the
   * function itself checks the code and only returns matching rows.
   * Returns { ok, data }; `data` is always an array (empty on failure).
   */
  async function rpc(fnName, args) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
        method: "POST",
        headers: restHeaders(),
        body: JSON.stringify(args || {}),
      });
      if (!res.ok) return { ok: false, data: [] };
      const data = await res.json();
      return { ok: true, data: Array.isArray(data) ? data : [] };
    } catch (err) {
      console.warn(`Supabase rpc "${fnName}" failed:`, err);
      return { ok: false, data: [] };
    }
  }

  /**
   * Admin sign-in via Supabase's own Auth API, using an email/password
   * user created in the Supabase dashboard (Authentication > Users) —
   * a REAL login checked by Supabase's own servers, not by this site's
   * JavaScript the way the old admin passphrase was. Returns the session
   * (with an access_token) on success, or null on failure.
   */
  async function signIn(email, password) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;
      return await res.json(); // { access_token, refresh_token, expires_at, ... }
    } catch (err) {
      console.warn("Supabase sign-in failed:", err);
      return null;
    }
  }

  /**
   * Select every row from `table`, using a signed-in admin's access
   * token. Only returns anything because the table's Row Level Security
   * policy grants `select` to `authenticated` — i.e. someone who actually
   * signed in via signIn() above. Returns { ok, data, status } like rpc()
   * above, so callers can tell "genuinely no rows yet" apart from
   * "couldn't reach the database" apart from "the access token itself was
   * rejected" (status 401/403 — most often an expired sign-in session,
   * not a real outage) using the status code.
   */
  async function selectAll(table, accessToken) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
        headers: restHeaders(accessToken),
      });
      if (!res.ok) return { ok: false, data: [], status: res.status };
      const data = await res.json();
      return { ok: true, data: Array.isArray(data) ? data : [], status: res.status };
    } catch (err) {
      console.warn(`Supabase select from "${table}" failed:`, err);
      return { ok: false, data: [], status: null };
    }
  }

  /**
   * Delete one row from `table` by its `id`, using a signed-in admin's
   * access token. Only works because the table's Row Level Security
   * policy grants `delete` to `authenticated` (see README.md's
   * "Database setup" section) — without that policy this simply fails,
   * the same fail-soft way as every other method here. Returns
   * { ok, status } (rather than a bare boolean) so callers can tell an
   * expired/rejected access token (401/403) apart from any other failure.
   */
  async function remove(table, id, accessToken) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { ...restHeaders(accessToken), Prefer: "return=minimal" },
      });
      return { ok: res.ok, status: res.status };
    } catch (err) {
      console.warn(`Supabase delete from "${table}" failed:`, err);
      return { ok: false, status: null };
    }
  }

  // =========================================================
  // Phase 2 additions — accounts & organisations.
  // All of these fail soft (return null / { ok:false }) exactly like
  // the methods above; a caller should always handle the failure case.
  // =========================================================

  /**
   * Create a new account via Supabase Auth. `metadata` (e.g. first_name,
   * last_name) is stored on the auth user and read by the database
   * sign-up trigger to build the profile + personal organisation.
   * Returns the parsed response (which may contain a session, or just a
   * user awaiting email confirmation, depending on the project's
   * "Confirm email" setting) on success, or null on failure.
   */
  async function signUp(email, password, metadata, redirectTo) {
    try {
      // When email confirmation is on, the confirmation link Supabase emails
      // redirects the browser to `redirect_to` after verifying. We pass our
      // own live confirmation page so links never point at localhost. (The
      // URL must also be on the project's Redirect URLs allow-list, or
      // Supabase falls back to the dashboard Site URL.)
      const url = redirectTo
        ? `${SUPABASE_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`
        : `${SUPABASE_URL}/auth/v1/signup`;
      const res = await fetch(url, {
        method: "POST",
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, data: metadata || {} }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return { ok: false, error: (data && (data.msg || data.error_description || data.message)) || "Sign-up failed" };
      return { ok: true, data };
    } catch (err) {
      console.warn("Supabase sign-up failed:", err);
      return { ok: false, error: "Could not reach the server." };
    }
  }

  /** Sign the current session out (best effort). */
  async function signOut(accessToken) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: restHeaders(accessToken),
      });
      return true;
    } catch (err) {
      console.warn("Supabase sign-out failed:", err);
      return false;
    }
  }

  /** Exchange a refresh token for a fresh session. Returns session or null. */
  async function refresh(refreshToken) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn("Supabase token refresh failed:", err);
      return null;
    }
  }

  /** Fetch the auth user for an access token. Returns user object or null. */
  async function getUser(accessToken) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: restHeaders(accessToken),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn("Supabase getUser failed:", err);
      return null;
    }
  }

  /**
   * Ask Supabase to send a password-reset email. This is intentionally a
   * "placeholder" flow for now: the request is accepted, but no email is
   * actually delivered until SMTP is configured in the Supabase dashboard.
   * We deliberately don't reveal whether the address exists.
   */
  async function resetPassword(email, redirectTo) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: "POST",
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(redirectTo ? { email, gotrue_meta_security: {} , redirect_to: redirectTo } : { email }),
      });
      return res.ok;
    } catch (err) {
      console.warn("Supabase password reset failed:", err);
      return false;
    }
  }

  /**
   * Update the signed-in auth user (used here to change password:
   * updateUser(token, { password: "..." })). Returns { ok, error }.
   */
  async function updateUser(accessToken, attrs) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: restHeaders(accessToken),
        body: JSON.stringify(attrs),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return { ok: false, error: (data && (data.msg || data.error_description || data.message)) || "Update failed" };
      return { ok: true, data };
    } catch (err) {
      console.warn("Supabase updateUser failed:", err);
      return { ok: false, error: "Could not reach the server." };
    }
  }

  /**
   * Authenticated SELECT with a raw PostgREST query string (e.g.
   * "user_id=eq.<id>&order=created_at.desc"). Row Level Security decides
   * what actually comes back. Returns { ok, data, status }; data is
   * always an array.
   */
  async function select(table, query, accessToken) {
    try {
      const qs = query ? `&${query}` : "";
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*${qs}`, {
        headers: restHeaders(accessToken),
      });
      if (!res.ok) return { ok: false, data: [], status: res.status };
      const data = await res.json();
      return { ok: true, data: Array.isArray(data) ? data : [], status: res.status };
    } catch (err) {
      console.warn(`Supabase select from "${table}" failed:`, err);
      return { ok: false, data: [], status: null };
    }
  }

  /**
   * Authenticated UPDATE. `match` is a PostgREST filter (e.g. "id=eq.<id>").
   * Returns { ok, status }. RLS decides whether the row is actually
   * writable by this user.
   */
  async function update(table, match, patch, accessToken) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
        method: "PATCH",
        headers: { ...restHeaders(accessToken), Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      });
      return { ok: res.ok, status: res.status };
    } catch (err) {
      console.warn(`Supabase update on "${table}" failed:`, err);
      return { ok: false, status: null };
    }
  }

  return {
    insert, rpc, signIn, selectAll, remove,
    // Phase 2
    signUp, signOut, refresh, getUser, resetPassword, updateUser, select, update,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SupabaseClient };
}
