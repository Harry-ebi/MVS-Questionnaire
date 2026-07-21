/**
 * scoring.js
 * -----------------------------------------------------------------------
 * Original scoring logic for the questionnaire. This is NOT the SDI /
 * Crucial Learning algorithm — it's a simple, transparent points +
 * threshold model:
 *
 *   1. Every answer gives exactly 1 point to one of three dimensions:
 *      people, performance, process.
 *   2. Points are converted to a percentage split that sums to 100
 *      (using largest-remainder rounding so the three numbers always
 *      add up cleanly).
 *   3. The gap between the top score and the 2nd, and between the 2nd
 *      and 3rd, decides which of 7 categories the result falls into.
 * -----------------------------------------------------------------------
 */

const DIMENSIONS = ["people", "performance", "process"];

const CATEGORY = {
  PEOPLE_LED: "people_led",
  PERFORMANCE_LED: "performance_led",
  PROCESS_LED: "process_led",
  PEOPLE_PERFORMANCE_BLEND: "people_performance_blend",
  PERFORMANCE_PROCESS_BLEND: "performance_process_blend",
  PROCESS_PEOPLE_BLEND: "process_people_blend",
  BALANCED_BLEND: "balanced_blend",
};

// Thresholds (in percentage points) driving category selection.
// These are our own, original cut points — not derived from any
// third-party assessment's scoring rules.
const LED_GAP_THRESHOLD = 20; // top vs 2nd gap needed to call it a single "-led" driver
const BLEND_GAP_THRESHOLD = 15; // 2nd vs 3rd gap needed to call it a clean two-way blend

/**
 * Tally raw answers into a { people, performance, process } point object.
 * @param {Array<{questionId: string, dimension: string}>} answers
 */
function tallyAnswers(answers) {
  const totals = { people: 0, performance: 0, process: 0 };
  answers.forEach((a) => {
    if (totals.hasOwnProperty(a.dimension)) {
      totals[a.dimension] += 1;
    }
  });
  return totals;
}

/**
 * Convert raw point totals into whole-number percentages that sum to 100,
 * using the largest-remainder method (avoids the "49 + 49 + 49 = 147"
 * style rounding bug you get from naive Math.round on each value).
 */
function toPercentages(totals) {
  const total = DIMENSIONS.reduce((sum, d) => sum + totals[d], 0) || 1;
  const raw = DIMENSIONS.map((d) => ({
    dimension: d,
    exact: (totals[d] / total) * 100,
  }));

  const floored = raw.map((r) => ({ ...r, floor: Math.floor(r.exact) }));
  let allocated = floored.reduce((sum, r) => sum + r.floor, 0);
  let remainder = 100 - allocated;

  // Distribute leftover percentage points to the dimensions with the
  // largest fractional remainder first.
  const byRemainder = [...floored].sort(
    (a, b) => b.exact - b.floor - (a.exact - a.floor)
  );
  const result = {};
  floored.forEach((r) => {
    result[r.dimension] = r.floor;
  });
  for (let i = 0; i < remainder; i++) {
    const d = byRemainder[i % byRemainder.length].dimension;
    result[d] += 1;
  }
  return result;
}

/**
 * Given a percentage map, return an array sorted descending by score:
 * [{ dimension, pct }, ...]
 */
function rankDimensions(percentages) {
  return DIMENSIONS.map((d) => ({ dimension: d, pct: percentages[d] })).sort(
    (a, b) => b.pct - a.pct
  );
}

/**
 * Decide which of the 7 categories a ranked result falls into.
 */
function deriveCategory(ranked) {
  const [top, mid, low] = ranked;
  const gapTopMid = top.pct - mid.pct;
  const gapMidLow = mid.pct - low.pct;

  if (gapTopMid >= LED_GAP_THRESHOLD) {
    return {
      people: CATEGORY.PEOPLE_LED,
      performance: CATEGORY.PERFORMANCE_LED,
      process: CATEGORY.PROCESS_LED,
    }[top.dimension];
  }

  if (gapMidLow >= BLEND_GAP_THRESHOLD) {
    // Two-way blend of the top two dimensions. Name is fixed by the
    // *pair*, in the cyclic order People -> Performance -> Process ->
    // People, matching the brief's category list, regardless of which
    // of the two scored slightly higher.
    const pair = new Set([top.dimension, mid.dimension]);
    if (pair.has("people") && pair.has("performance")) {
      return CATEGORY.PEOPLE_PERFORMANCE_BLEND;
    }
    if (pair.has("performance") && pair.has("process")) {
      return CATEGORY.PERFORMANCE_PROCESS_BLEND;
    }
    return CATEGORY.PROCESS_PEOPLE_BLEND;
  }

  return CATEGORY.BALANCED_BLEND;
}

/**
 * Full scoring pipeline: answers -> result summary.
 * @param {Array<{questionId: string, dimension: string}>} answers
 */
function scoreAnswers(answers) {
  const totals = tallyAnswers(answers);
  const percentages = toPercentages(totals);
  const ranked = rankDimensions(percentages);
  const category = deriveCategory(ranked);

  return {
    totals,
    percentages,
    ranked,
    primary: ranked[0].dimension,
    secondary: ranked[1].dimension,
    category,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DIMENSIONS, CATEGORY, scoreAnswers, tallyAnswers, toPercentages, rankDimensions, deriveCategory };
}
