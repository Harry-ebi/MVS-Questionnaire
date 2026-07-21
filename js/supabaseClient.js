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

  /** Insert one row into `table`. Returns true/false, never throws. */
  async function insert(table, record) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { ...restHeaders(), Prefer: "return=minimal" },
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

  return { insert, rpc, signIn, selectAll, remove };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SupabaseClient };
}
