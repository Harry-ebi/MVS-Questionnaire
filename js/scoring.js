/**
 * scoring.js
 * -----------------------------------------------------------------------
 * Original scoring logic for the questionnaire. This is NOT the SDI /
 * Crucial Learning algorithm — it's a simple, transparent points +
 * threshold model:
 *
 *   1. Every answer gives exactly 1 point to one of three dimensions:
 *      drive, connection, clarity.
 *   2. Points are converted to a percentage split that sums to 100
 *      (using largest-remainder rounding so the three numbers always
 *      add up cleanly).
 *   3. Rather than sorting a result into one of a fixed set of named
 *      "personality boxes," the three percentages are reported as
 *      continuous scores, with an optional plain-English *pattern*
 *      description of their shape — Focused (one dimension clearly
 *      leads), Dual-led (two lead together) or Balanced (all three are
 *      close) — generated from the gaps between them. See derivePattern()
 *      below.
 * -----------------------------------------------------------------------
 */

const DIMENSIONS = ["drive", "connection", "clarity"];

const PATTERN = {
  FOCUSED: "focused",
  DUAL: "dual",
  BALANCED: "balanced",
};

// Thresholds (in percentage points) driving the pattern description.
// These are our own, original cut points — not derived from any
// third-party assessment's scoring rules — and deliberately kept as
// named constants so they're easy to retune later.
const FOCUSED_GAP_THRESHOLD = 10; // top vs 2nd gap needed to call it "Focused"
const DUAL_TIGHTNESS_THRESHOLD = 9; // top vs 2nd gap allowed for a "Dual-led" pair
const DUAL_LOW_GAP_THRESHOLD = 8; // how far the 3rd needs to sit below the pair for "Dual-led"
const BALANCED_RANGE_THRESHOLD = 9; // max-min spread that still reads as "Balanced" (informational; Balanced is really just the fallback when neither of the above match)

/**
 * Tally raw answers into a { drive, connection, clarity } point object.
 * @param {Array<{questionId: string, dimension: string}>} answers
 */
function tallyAnswers(answers) {
  const totals = { drive: 0, connection: 0, clarity: 0 };
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
 * A stable key for a pattern result, e.g. "focused_drive",
 * "dual_drive_clarity", "balanced" — for storage/lookup, kept internal
 * (never shown to a user directly; see dimensionLabel()/patternSentence()
 * in content.js for the actual display text).
 */
function orderedPairKey(a, b) {
  return DIMENSIONS.filter((d) => d === a || d === b).join("_");
}

/**
 * Describe the *shape* of a ranked result — Focused / Dual-led /
 * Balanced — rather than sorting it into one of a fixed set of named
 * personality types. Returns { type, primary, secondary, key }; primary/
 * secondary are always the top two dimensions regardless of pattern
 * (a "Focused" result still has a secondary — it's just not emphasised).
 */
function derivePattern(ranked) {
  const [top, mid, low] = ranked;
  const gapTopMid = top.pct - mid.pct;
  const gapMidLow = mid.pct - low.pct;

  if (gapTopMid >= FOCUSED_GAP_THRESHOLD) {
    return {
      type: PATTERN.FOCUSED,
      primary: top.dimension,
      secondary: mid.dimension,
      key: `focused_${top.dimension}`,
    };
  }

  if (gapTopMid <= DUAL_TIGHTNESS_THRESHOLD && gapMidLow >= DUAL_LOW_GAP_THRESHOLD) {
    return {
      type: PATTERN.DUAL,
      primary: top.dimension,
      secondary: mid.dimension,
      key: `dual_${orderedPairKey(top.dimension, mid.dimension)}`,
    };
  }

  return {
    type: PATTERN.BALANCED,
    primary: top.dimension,
    secondary: mid.dimension,
    key: "balanced",
  };
}

/**
 * Full scoring pipeline: answers -> result summary.
 * @param {Array<{questionId: string, dimension: string}>} answers
 */
function scoreAnswers(answers) {
  const totals = tallyAnswers(answers);
  const percentages = toPercentages(totals);
  const ranked = rankDimensions(percentages);
  const pattern = derivePattern(ranked);

  return {
    totals,
    percentages,
    ranked,
    primary: ranked[0].dimension,
    secondary: ranked[1].dimension,
    pattern,
  };
}

/**
 * -----------------------------------------------------------------------
 * PRIORITIES UNDER PRESSURE scoring
 * -----------------------------------------------------------------------
 * Original scoring logic for the optional "Priorities Under Pressure"
 * add-on (see content.js's CONTENT.pressureQuestions/pressureResults).
 * Each of the 18 questions is a *ranked-choice* answer rather than a
 * single pick: the respondent orders the three responses, and each
 * response's dimension is awarded 2 (most like me), 1 (next most like
 * me) or 0 (least like me) points. Points are summed across all 18
 * questions (max 54 per dimension-set) and converted to percentages the
 * same way as the Everyday scoring above — toPercentages/rankDimensions/
 * derivePattern are fully reused as-is for the pressure result's own
 * pattern description.
 * -----------------------------------------------------------------------
 */

const PRESSURE_QUESTION_COUNT = 18;
const PRESSURE_MAX_POINTS = PRESSURE_QUESTION_COUNT * 3; // 2+1+0 per question

/**
 * Tally ranked pressure answers into a { drive, connection, clarity }
 * point total (each out of 54).
 * @param {Array<{questionId: string, points: {drive:number, connection:number, clarity:number}}>} answers
 */
function tallyPressureAnswers(answers) {
  const totals = { drive: 0, connection: 0, clarity: 0 };
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
  const pattern = derivePattern(ranked);

  return {
    totals,
    percentages,
    ranked,
    primary: ranked[0].dimension,
    secondary: ranked[1].dimension,
    pattern,
  };
}

/**
 * -----------------------------------------------------------------------
 * DEGREE OF CHANGE
 * -----------------------------------------------------------------------
 * How far the Priorities Under Pressure result sits from the Everyday
 * Priorities result. This uses its own abstract coordinate system
 * (independent of chart.js's pixel-space layouts used for on-screen
 * rendering) so this module stays a plain, testable, DOM-free scoring
 * library. It measures the *degree* to which someone's reported
 * priorities differ under sustained pressure — not anger, aggression,
 * emotional stability or conflict-management skill.
 * -----------------------------------------------------------------------
 */

const CHANGE_VERTICES = {
  drive: { x: 1, y: 0 },
  connection: { x: -0.5, y: 0.8660254 },
  clarity: { x: -0.5, y: -0.8660254 },
};
const MAX_TRIANGLE_DISTANCE = Math.sqrt(3); // greatest possible distance between two vertices

// How far apart two percentages need to be before we stop calling the
// difference "broadly unchanged" in narrative copy.
const CHANGE_UNCHANGED_THRESHOLD = 5;
// How close two dimensions' deltas need to be before we treat them as a
// tie (a "combination" move) rather than one clear direction.
const CHANGE_TIE_TOLERANCE = 4;

const CHANGE_BANDS = [
  { key: "limited", min: 0, max: 14, label: "Limited change" },
  { key: "noticeable", min: 15, max: 29, label: "Noticeable change" },
  { key: "significant", min: 30, max: 49, label: "Significant change" },
  { key: "marked", min: 50, max: 100, label: "Marked change" },
];

function changeBandFor(score) {
  const band = CHANGE_BANDS.find((b) => score >= b.min && score <= b.max);
  return band ? band.key : CHANGE_BANDS[CHANGE_BANDS.length - 1].key;
}

/** percentages ({drive, connection, clarity}, summing ~100) -> abstract {x,y} */
function percentagesToChangePoint(percentages) {
  const d = percentages.drive / 100;
  const c = percentages.connection / 100;
  const cl = percentages.clarity / 100;
  const { drive, connection, clarity } = CHANGE_VERTICES;
  return {
    x: d * drive.x + c * connection.x + cl * clarity.x,
    y: d * drive.y + c * connection.y + cl * clarity.y,
  };
}

/**
 * Compute the full Degree of Change between an Everyday Priorities
 * result and a Priorities Under Pressure result (both {drive,
 * connection, clarity} percentage splits summing to ~100).
 */
function computeChange(everydayPercentages, pressurePercentages) {
  const everydayPoint = percentagesToChangePoint(everydayPercentages);
  const pressurePoint = percentagesToChangePoint(pressurePercentages);
  const dx = pressurePoint.x - everydayPoint.x;
  const dy = pressurePoint.y - everydayPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const changeScore = Math.round((distance / MAX_TRIANGLE_DISTANCE) * 100);
  const changeBand = changeBandFor(changeScore);

  const deltas = {};
  DIMENSIONS.forEach((d) => {
    deltas[d] = pressurePercentages[d] - everydayPercentages[d];
  });

  const byDeltaDesc = DIMENSIONS.slice().sort((a, b) => deltas[b] - deltas[a]);
  const largestIncreaseDim = byDeltaDesc[0];
  const maxDelta = deltas[largestIncreaseDim];
  // Every dimension within CHANGE_TIE_TOLERANCE of the top increase (and
  // itself a genuine increase) — length > 1 means a real tie, e.g.
  // "moves away from Connection towards a combination of Drive and
  // Clarity."
  const tiedIncreaseDims = DIMENSIONS.filter((d) => maxDelta - deltas[d] <= CHANGE_TIE_TOLERANCE && deltas[d] > 0);

  const byDeltaAsc = DIMENSIONS.slice().sort((a, b) => deltas[a] - deltas[b]);
  const largestDecreaseDim = byDeltaAsc[0];
  const minDelta = deltas[largestDecreaseDim];
  const tiedDecreaseDims = DIMENSIONS.filter((d) => deltas[d] - minDelta <= CHANGE_TIE_TOLERANCE && deltas[d] < 0);

  const everydayRanked = rankDimensions(everydayPercentages);
  const pressureRanked = rankDimensions(pressurePercentages);
  const everydayPrimary = everydayRanked[0].dimension;
  const pressurePrimary = pressureRanked[0].dimension;

  // No dimension moves more than the "broadly unchanged" threshold in
  // either direction -- treat the whole picture as settled, regardless
  // of which one nudged up or down slightly.
  const isBalancedMovement = DIMENSIONS.every((d) => Math.abs(deltas[d]) <= CHANGE_UNCHANGED_THRESHOLD);

  return {
    everydayPoint,
    pressurePoint,
    distance,
    changeScore,
    changeBand,
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
    PATTERN,
    FOCUSED_GAP_THRESHOLD,
    DUAL_TIGHTNESS_THRESHOLD,
    DUAL_LOW_GAP_THRESHOLD,
    BALANCED_RANGE_THRESHOLD,
    scoreAnswers,
    tallyAnswers,
    toPercentages,
    rankDimensions,
    derivePattern,
    PRESSURE_QUESTION_COUNT,
    PRESSURE_MAX_POINTS,
    tallyPressureAnswers,
    scorePressureAnswers,
    CHANGE_VERTICES,
    MAX_TRIANGLE_DISTANCE,
    CHANGE_UNCHANGED_THRESHOLD,
    CHANGE_TIE_TOLERANCE,
    CHANGE_BANDS,
    computeChange,
  };
}
