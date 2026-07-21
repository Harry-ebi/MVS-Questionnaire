/**
 * aggregate.js
 * -----------------------------------------------------------------------
 * Stub for storing ANONYMISED aggregate results (percentage split + the
 * resulting category, no name/email/IP or other identifying detail).
 *
 * This v1 build is a static, client-only site, so this stub writes to
 * the browser's localStorage purely as a working demonstration of the
 * mechanism and a place to plug in real aggregation later.
 *
 * TO WIRE THIS UP TO A REAL BACKEND LATER:
 *   Replace the body of `submitAnonymisedResult` with a fetch() call to
 *   your own endpoint, e.g.:
 *
 *     function submitAnonymisedResult(record) {
 *       fetch("https://your-api.example.com/aggregate", {
 *         method: "POST",
 *         headers: { "Content-Type": "application/json" },
 *         body: JSON.stringify(record),
 *       }).catch(() => {}); // fail silently — never block the results screen
 *     }
 *
 *   Make sure whatever endpoint you use only ever receives the
 *   percentage split, category and a timestamp — never the
 *   respondent's name or email, to keep this in line with the GDPR
 *   notice shown in the privacy step.
 * -----------------------------------------------------------------------
 */

const AGGREGATE_STORAGE_KEY = "mvs_aggregate_results_v1";

function submitAnonymisedResult(scoreResult) {
  try {
    const record = {
      timestamp: new Date().toISOString(),
      percentages: scoreResult.percentages,
      category: scoreResult.category,
      // Deliberately no name, email, IP address or user-agent captured.
    };
    const existingRaw = window.localStorage.getItem(AGGREGATE_STORAGE_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    existing.push(record);
    window.localStorage.setItem(AGGREGATE_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    // Never let aggregate logging break the user's results screen.
    console.warn("Could not store anonymised aggregate result:", err);
  }
}

/** Convenience for admins testing locally: read back everything stored. */
function readAnonymisedResults() {
  try {
    const raw = window.localStorage.getItem(AGGREGATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { submitAnonymisedResult, readAnonymisedResults };
}
