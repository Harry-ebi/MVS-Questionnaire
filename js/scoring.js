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

/**
 * -----------------------------------------------------------------------
 * PRESSURE PROFILE scoring
 * -----------------------------------------------------------------------
 * Original scoring logic for the optional "Pressure Profile" add-on
 * (see content.js's CONTENT.pressureQuestions/pressureResults). Each of
 * the 18 questions is a *ranked-choice* answer rather than a single pick:
 * the respondent orders the three responses, and each response's
 * dimension is awarded 2 (most like me), 1 (next most like me) or 0
 * (least like me) points. Points are summed across all 18 questions (max
 * 54 per dimension-set) and converted to percentages the same way as the
 * Everyday scoring above — toPercentages/rankDimensions/deriveCategory
 * are fully reused as-is for the pressure profile's own classification,
 * per the brief's "apply the existing profile-classification rules
 * where possible."
 * -----------------------------------------------------------------------
 */

const PRESSURE_QUESTION_COUNT = 18;
const PRESSURE_MAX_POINTS = PRESSURE_QUESTION_COUNT * 3; // 2+1+0 per question

/**
 * Tally ranked pressure answers into a { people, performance, process }
 * point total (each out of 54).
 * @param {Array<{questionId: string, points: {people:number, performance:number, process:number}}>} answers
 */
function tallyPressureAnswers(answers) {
  const totals = { people: 0, performance: 0, process: 0 };
  answers.forEach((a) => {
    DIMENSIONS.forEach((d) => {
      if (a.points && typeof a.points[d] === "number") {
        totals[d] += a.points[d];
      }
    });
  });
  return totals;
}

/** Full pressure scoring pipeline: ranked answers -> result summary. */
function scorePressureAnswers(answers) {
  const totals = tallyPressureAnswers(answers);
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

/**
 * -----------------------------------------------------------------------
 * MOTIVATIONAL SHIFT
 * -----------------------------------------------------------------------
 * How far the Pressure Profile point sits from the Everyday Profile
 * point, on an equilateral triangle. This uses its own abstract
 * coordinate system (independent of chart.js's pixel-space triangle
 * used for on-screen rendering) so this module stays a plain, testable,
 * DOM-free scoring library — chart.js's shift chart plots the same two
 * percentage splits in its own pixel space for display, but the actual
 * Shift score below is computed here, geometrically, exactly as
 * specified.
 * -----------------------------------------------------------------------
 */

const PRESSURE_VERTICES = {
  performance: { x: 1, y: 0 },
  people: { x: -0.5, y: 0.8660254 },
  process: { x: -0.5, y: -0.8660254 },
};
const MAX_TRIANGLE_DISTANCE = Math.sqrt(3); // greatest possible distance between two vertices

// How far apart two percentages need to be before we stop calling the
// difference "broadly unchanged" in narrative copy (spec 8.4).
const SHIFT_UNCHANGED_THRESHOLD = 5;
// How close two dimensions' deltas need to be before we treat them as a
// tie (a "combination" move) rather than one clear direction (spec 9).
const SHIFT_TIE_TOLERANCE = 4;

const SHIFT_BANDS = [
  { key: "limited", min: 0, max: 14 },
  { key: "moderate", min: 15, max: 29 },
  { key: "significant", min: 30, max: 49 },
  { key: "marked", min: 50, max: 100 },
];

function shiftBandFor(score) {
  const band = SHIFT_BANDS.find((b) => score >= b.min && score <= b.max);
  return band ? band.key : SHIFT_BANDS[SHIFT_BANDS.length - 1].key;
}

/** percentages ({people, performance, process}, summing ~100) -> abstract {x,y} */
function percentagesToShiftPoint(percentages) {
  const p = percentages.performance / 100;
  const pe = percentages.people / 100;
  const pr = percentages.process / 100;
  const { performance, people, process } = PRESSURE_VERTICES;
  return {
    x: p * performance.x + pe * people.x + pr * process.x,
    y: p * performance.y + pe * people.y + pr * process.y,
  };
}

/**
 * Compute the full Motivational Shift between an Everyday result and a
 * Pressure result (both {people, performance, process} percentage
 * splits summing to ~100).
 */
function computeShift(everydayPercentages, pressurePercentages) {
  const everydayPoint = percentagesToShiftPoint(everydayPercentages);
  const pressurePoint = percentagesToShiftPoint(pressurePercentages);
  const dx = pressurePoint.x - everydayPoint.x;
  const dy = pressurePoint.y - everydayPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const shiftScore = Math.round((distance / MAX_TRIANGLE_DISTANCE) * 100);
  const shiftBand = shiftBandFor(shiftScore);

  const deltas = {};
  DIMENSIONS.forEach((d) => {
    deltas[d] = pressurePercentages[d] - everydayPercentages[d];
  });

  const byDeltaDesc = DIMENSIONS.slice().sort((a, b) => deltas[b] - deltas[a]);
  const largestIncreaseDim = byDeltaDesc[0];
  const maxDelta = deltas[largestIncreaseDim];
  // Every dimension within SHIFT_TIE_TOLERANCE of the top increase (and
  // itself a genuine increase) — length > 1 means a real tie, e.g.
  // "moves away from People towards a combination of Performance and
  // Process."
  const tiedIncreaseDims = DIMENSIONS.filter((d) => maxDelta - deltas[d] <= SHIFT_TIE_TOLERANCE && deltas[d] > 0);

  const byDeltaAsc = DIMENSIONS.slice().sort((a, b) => deltas[a] - deltas[b]);
  const largestDecreaseDim = byDeltaAsc[0];
  const minDelta = deltas[largestDecreaseDim];
  const tiedDecreaseDims = DIMENSIONS.filter((d) => deltas[d] - minDelta <= SHIFT_TIE_TOLERANCE && deltas[d] < 0);

  const everydayRanked = rankDimensions(everydayPercentages);
  const pressureRanked = rankDimensions(pressurePercentages);
  const everydayPrimary = everydayRanked[0].dimension;
  const pressurePrimary = pressureRanked[0].dimension;

  // No dimension moves more than the "broadly unchanged" threshold in
  // either direction -- treat the whole picture as balanced/settled,
  // regardless of which one nudged up or down slightly.
  const isBalancedMovement = DIMENSIONS.every((d) => Math.abs(deltas[d]) <= SHIFT_UNCHANGED_THRESHOLD);

  return {
    everydayPoint,
    pressurePoint,
    distance,
    shiftScore,
    shiftBand,
    deltas,
    largestIncreaseDim,
    largestDecreaseDim,
    tiedIncreaseDims,
    tiedDecreaseDims,
    everydayPrimary,
    pressurePrimary,
    primaryChanged: everydayPrimary !== pressurePrimary,
    isBalancedMovement,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DIMENSIONS,
    CATEGORY,
    scoreAnswers,
    tallyAnswers,
    toPercentages,
    rankDimensions,
    deriveCategory,
    PRESSURE_QUESTION_COUNT,
    PRESSURE_MAX_POINTS,
    tallyPressureAnswers,
    scorePressureAnswers,
    PRESSURE_VERTICES,
    MAX_TRIANGLE_DISTANCE,
    SHIFT_UNCHANGED_THRESHOLD,
    SHIFT_TIE_TOLERANCE,
    SHIFT_BANDS,
    computeShift,
  };
}
