/**
 * chart.js
 * -----------------------------------------------------------------------
 * All chart rendering for the tool:
 *   - renderResultsChart        single-person result: horizontal score
 *                                bars, one per dimension (not a triangle)
 *   - renderPriorityShiftChart  Everyday Priorities vs. Priorities Under
 *                                Pressure: a three-lane visual, one lane
 *                                per dimension (not a triangle or arrow)
 *   - renderOverlayChart        many people's real results on one triangle
 *   - renderPerceptionChart     one person's guesses vs. their actual result
 *   - createInteractiveTriangle  draggable input, used by the blind-spot
 *                                guessing exercise to let someone place a
 *                                guess
 *
 * The triangle remains only for the multi-person/guessing charts, where
 * plotting several people's positions on one shared plane is genuinely
 * useful; it is an original geometric design — a plain equilateral
 * triangle with position markers, no regions, no proprietary labels or
 * layout. The single-person result and the Priorities Under Pressure
 * comparison deliberately avoid a triangle or arrow-based layout — see
 * README.md for the reasoning.
 * -----------------------------------------------------------------------
 */

// Colour mapping (validated for contrast + colour-vision-deficiency
// separation — see the --series-* custom properties in styles.css for
// the exact figures):
//   Drive      -> amber
//   Connection -> purple
//   Clarity    -> teal
const CHART_COLORS = {
  drive: { light: "#8a5300", dark: "#e3a640" },
  connection: { light: "#6b3fa0", dark: "#c4a3ec" },
  clarity: { light: "#0f7a6c", dark: "#4fd1c5" },
};

const TRIANGLE_VERTICES = {
  connection: { x: 150, y: 26 }, // top
  drive: { x: 34, y: 224 }, // bottom left
  clarity: { x: 266, y: 224 }, // bottom right
};
const TRIANGLE_VIEWBOX = { minX: 0, minY: 0, width: 300, height: 260 };
const DIMS = ["drive", "connection", "clarity"];

function prefersDark() {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function colorFor(dimension) {
  const mode = prefersDark() ? "dark" : "light";
  return CHART_COLORS[dimension][mode];
}

function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

// Every SVG on a page needs its own gradient/clip-path IDs — two triangles
// on one page (e.g. several people on the blind-spot reveal) would
// otherwise both resolve url(#mvs-tri-grad-connection) to whichever
// element happened to be first in the document.
let chartInstanceCounter = 0;

/** percentages ({drive, connection, clarity}, summing ~100) -> {x,y} */
function barycentricPoint(percentages) {
  const d = percentages.drive / 100;
  const c = percentages.connection / 100;
  const cl = percentages.clarity / 100;
  const { connection: top, drive: bl, clarity: br } = TRIANGLE_VERTICES;
  return {
    x: c * top.x + d * bl.x + cl * br.x,
    y: c * top.y + d * bl.y + cl * br.y,
  };
}

/**
 * Inverse of barycentricPoint: given a point (possibly outside the
 * triangle, e.g. from a stray drag), return the closest valid
 * {drive, connection, clarity} percentage split summing to 100.
 */
function pointToPercentages(point) {
  const A = TRIANGLE_VERTICES.connection;
  const B = TRIANGLE_VERTICES.drive;
  const C = TRIANGLE_VERTICES.clarity;

  const denom = (B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y);
  let a = ((B.y - C.y) * (point.x - C.x) + (C.x - B.x) * (point.y - C.y)) / denom;
  let b = ((C.y - A.y) * (point.x - C.x) + (A.x - C.x) * (point.y - C.y)) / denom;
  let c = 1 - a - b;

  // Clamp to the triangle (handles drags outside the edges) then
  // renormalise so the three always sum to exactly 1.
  a = Math.max(0, a);
  b = Math.max(0, b);
  c = Math.max(0, c);
  const sum = a + b + c || 1;
  a /= sum;
  b /= sum;
  c /= sum;

  return roundToPercentages({ connection: a * 100, drive: b * 100, clarity: c * 100 });
}

/**
 * Largest-remainder rounding so three fractional shares always become
 * whole numbers summing to exactly 100.
 */
function roundToPercentages(raw) {
  const floored = DIMS.map((d) => ({ d, exact: raw[d], floor: Math.floor(raw[d]) }));
  let allocated = floored.reduce((s, r) => s + r.floor, 0);
  let remainder = Math.round(100 - allocated);
  const byRemainder = [...floored].sort((x, y) => (y.exact - y.floor) - (x.exact - x.floor));
  const result = {};
  floored.forEach((r) => (result[r.d] = r.floor));
  for (let i = 0; i < remainder; i++) {
    result[byRemainder[i % byRemainder.length].d] += 1;
  }
  return result;
}

/**
 * Fills the triangle with a soft colour wash: each vertex's brand colour
 * at full strength right at the corner, fading inward — and, because the
 * three washes are composited with the "screen" blend mode (the same
 * maths as mixing coloured light) rather than simply layered on top of
 * each other, wherever two or three colours overlap they naturally
 * lighten and blend, brightening all the way to a pale, near-white
 * centre where all three meet. This is the standard technique for an
 * additive colour-mixing diagram — an original wash built from our own
 * geometry and colours, not a reproduction of any third-party triangle
 * graphic. Always renders in its own light "wash" regardless of the
 * app's light/dark theme (like a printed chart would), so the vertex
 * colours stay true and legible either way.
 */
function drawTriangleColorWash(svg, uid) {
  const { connection: top, drive: bl, clarity: br } = TRIANGLE_VERTICES;
  const vertices = { connection: top, drive: bl, clarity: br };
  const washColor = {
    connection: CHART_COLORS.connection.light,
    drive: CHART_COLORS.drive.light,
    clarity: CHART_COLORS.clarity.light,
  };
  const reach = 210; // how far each vertex's colour extends toward/past the centre

  const defs = svgEl("defs", {});
  const clipId = `mvs-tri-clip-${uid}`;
  defs.appendChild(
    svgEl("clipPath", { id: clipId })
  ).appendChild(
    svgEl("polygon", { points: `${top.x},${top.y} ${bl.x},${bl.y} ${br.x},${br.y}` })
  );

  DIMS.forEach((dim) => {
    const v = vertices[dim];
    const gradient = svgEl("radialGradient", {
      id: `mvs-tri-grad-${dim}-${uid}`,
      gradientUnits: "userSpaceOnUse",
      cx: v.x,
      cy: v.y,
      r: reach,
    });
    // The middle stop sits roughly at the triangle's centre (~63% of
    // `reach`) and stays fairly strong there — with three colours all
    // still near-full-strength at the point where they overlap, the
    // screen blend pushes that overlap all the way to a pale, near-white
    // tone rather than a muddy grey.
    gradient.appendChild(svgEl("stop", { offset: "0%", "stop-color": washColor[dim], "stop-opacity": "0.95" }));
    gradient.appendChild(svgEl("stop", { offset: "63%", "stop-color": washColor[dim], "stop-opacity": "0.72" }));
    gradient.appendChild(svgEl("stop", { offset: "100%", "stop-color": washColor[dim], "stop-opacity": "0" }));
    defs.appendChild(gradient);
  });
  svg.appendChild(defs);

  const washGroup = svgEl("g", { "clip-path": `url(#${clipId})`, style: "isolation:isolate" });
  // Black canvas so the screen-blended colours above composite correctly
  // (screen-blending onto black leaves each colour true; onto white it
  // would just stay white) — this is local to the clipped triangle only,
  // not the page, so nothing outside the shape is affected.
  washGroup.appendChild(
    svgEl("polygon", { points: `${top.x},${top.y} ${bl.x},${bl.y} ${br.x},${br.y}`, fill: "#000000" })
  );
  DIMS.forEach((dim) => {
    const v = vertices[dim];
    washGroup.appendChild(
      svgEl("circle", {
        cx: v.x,
        cy: v.y,
        r: reach,
        fill: `url(#mvs-tri-grad-${dim}-${uid})`,
        style: "mix-blend-mode:screen",
      })
    );
  });
  svg.appendChild(washGroup);
}

function drawTriangleSkeleton(svg) {
  const { connection: top, drive: bl, clarity: br } = TRIANGLE_VERTICES;

  drawTriangleColorWash(svg, chartInstanceCounter++);

  [0.33, 0.66].forEach((f) => {
    const ringPoints = [
      { x: top.x + (bl.x - top.x) * f, y: top.y + (bl.y - top.y) * f },
      { x: bl.x + (br.x - bl.x) * f, y: bl.y + (br.y - bl.y) * f },
      { x: br.x + (top.x - br.x) * f, y: br.y + (top.y - br.y) * f },
    ];
    svg.appendChild(
      svgEl("polygon", {
        points: ringPoints.map((p) => `${p.x},${p.y}`).join(" "),
        class: "mvs-triangle-guide",
      })
    );
  });

  svg.appendChild(
    svgEl("polygon", {
      points: `${top.x},${top.y} ${bl.x},${bl.y} ${br.x},${br.y}`,
      class: "mvs-triangle-outline",
    })
  );
}

function drawVertexLabels(svg, dimensionNames, percentages) {
  const vertexLabels = [
    { x: 150, y: 12, anchor: "middle", dim: "connection" },
    { x: 34, y: 244, anchor: "start", dim: "drive" },
    { x: 266, y: 244, anchor: "end", dim: "clarity" },
  ];
  vertexLabels.forEach((v) => {
    const label = svgEl("text", {
      x: v.x,
      y: v.y,
      "text-anchor": v.anchor,
      class: "mvs-triangle-vertex-label",
      style: `fill:${colorFor(v.dim)}`,
    });
    label.textContent = percentages
      ? `${dimensionNames[v.dim]} ${percentages[v.dim]}%`
      : dimensionNames[v.dim];
    svg.appendChild(label);
  });
}

// ------------------------------------------------------------------
// Single-person results chart — horizontal score bars
// ------------------------------------------------------------------

/**
 * The primary single-person results chart: one horizontal bar per
 * dimension, each showing its own percentage independently (rather than
 * one shared 100%-stacked bar, and rather than a triangle position).
 * This makes the three scores directly, individually comparable.
 */
function renderResultsChart(container, percentages, dimensionNames) {
  container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "mvs-scorebars";
  wrap.setAttribute("role", "img");
  wrap.setAttribute(
    "aria-label",
    `Score bars: ${DIMS.map((d) => `${dimensionNames[d]} ${percentages[d]}%`).join(", ")}`
  );

  DIMS.forEach((d) => {
    const row = document.createElement("div");
    row.className = "mvs-scorebar-row";

    const label = document.createElement("span");
    label.className = "mvs-scorebar-label";
    label.textContent = dimensionNames[d];

    const track = document.createElement("span");
    track.className = "mvs-scorebar-track";
    const fill = document.createElement("span");
    fill.className = "mvs-scorebar-fill";
    fill.style.width = `${percentages[d]}%`;
    fill.style.background = colorFor(d);
    track.appendChild(fill);

    const value = document.createElement("span");
    value.className = "mvs-scorebar-value";
    value.textContent = `${percentages[d]}%`;

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    wrap.appendChild(row);
  });

  container.appendChild(wrap);
}

// ------------------------------------------------------------------
// Priority Shift chart — three horizontal lanes (one per dimension),
// each with an Everyday Priorities marker and a Priorities Under
// Pressure marker along a 0-100 track, joined by a plain connecting
// bar. Deliberately not a triangle or an arrow: this is a separate,
// original visual built for this comparison specifically.
// ------------------------------------------------------------------

/**
 * everydayPercentages / pressurePercentages: {drive, connection, clarity}
 * legendLabels: { everyday: string, pressure: string, tableProfileHeading?: string }
 */
function renderPriorityShiftChart(container, everydayPercentages, pressurePercentages, dimensionNames, legendLabels) {
  container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "mvs-priority-shift";
  wrap.setAttribute("role", "img");
  wrap.setAttribute(
    "aria-label",
    `Priority Shift: ${DIMS.map(
      (d) => `${dimensionNames[d]} — ${legendLabels.everyday} ${everydayPercentages[d]}%, ${legendLabels.pressure} ${pressurePercentages[d]}%`
    ).join("; ")}`
  );

  DIMS.forEach((d) => {
    const everydayPct = everydayPercentages[d];
    const pressurePct = pressurePercentages[d];
    const delta = pressurePct - everydayPct;
    const deltaText = delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta}pp`;

    const lane = document.createElement("div");
    lane.className = "mvs-priority-lane";

    const header = document.createElement("div");
    header.className = "mvs-priority-lane-header";
    const laneLabel = document.createElement("span");
    laneLabel.className = "mvs-priority-lane-label";
    laneLabel.style.color = colorFor(d);
    laneLabel.textContent = dimensionNames[d];
    const laneDelta = document.createElement("span");
    laneDelta.className = "mvs-priority-lane-delta";
    laneDelta.textContent = deltaText;
    header.appendChild(laneLabel);
    header.appendChild(laneDelta);

    const track = document.createElement("div");
    track.className = "mvs-priority-lane-track";

    const lo = Math.min(everydayPct, pressurePct);
    const hi = Math.max(everydayPct, pressurePct);
    const connector = document.createElement("span");
    connector.className = "mvs-priority-lane-connector";
    connector.style.left = `${lo}%`;
    connector.style.width = `${Math.max(hi - lo, 0)}%`;
    connector.style.background = colorFor(d);
    track.appendChild(connector);

    const everydayMarker = document.createElement("span");
    everydayMarker.className = "mvs-priority-lane-marker mvs-priority-lane-marker--everyday";
    everydayMarker.style.left = `${everydayPct}%`;
    everydayMarker.style.borderColor = colorFor(d);
    everydayMarker.title = `${legendLabels.everyday}: ${everydayPct}%`;
    track.appendChild(everydayMarker);

    const pressureMarker = document.createElement("span");
    pressureMarker.className = "mvs-priority-lane-marker mvs-priority-lane-marker--pressure";
    pressureMarker.style.left = `${pressurePct}%`;
    pressureMarker.style.background = colorFor(d);
    pressureMarker.style.borderColor = colorFor(d);
    pressureMarker.title = `${legendLabels.pressure}: ${pressurePct}%`;
    track.appendChild(pressureMarker);

    lane.appendChild(header);
    lane.appendChild(track);
    wrap.appendChild(lane);
  });

  container.appendChild(wrap);

  // Legend — shape-coded, not colour-coded, so it reads correctly in
  // greyscale print and for colour-vision-deficient readers.
  const legend = document.createElement("div");
  legend.className = "mvs-legend mvs-shift-legend";
  legend.innerHTML = `
    <div class="mvs-legend-item">
      <span class="mvs-shift-legend-swatch mvs-shift-legend-swatch--everyday" aria-hidden="true"></span>
      <span>${escapeHtmlLocal(legendLabels.everyday)}</span>
    </div>
    <div class="mvs-legend-item">
      <span class="mvs-shift-legend-swatch mvs-shift-legend-swatch--pressure" aria-hidden="true"></span>
      <span>${escapeHtmlLocal(legendLabels.pressure)}</span>
    </div>
  `;
  container.appendChild(legend);

  // Accessible text-based fallback: exact splits for both results, side
  // by side (also what ends up on narrow screens / in print).
  const table = document.createElement("table");
  table.className = "mvs-overlay-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>${escapeHtmlLocal(legendLabels.tableProfileHeading || "Result")}</th>
        <th>${dimensionNames.drive}</th>
        <th>${dimensionNames.connection}</th>
        <th>${dimensionNames.clarity}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtmlLocal(legendLabels.everyday)}</td>
        <td>${everydayPercentages.drive}%</td>
        <td>${everydayPercentages.connection}%</td>
        <td>${everydayPercentages.clarity}%</td>
      </tr>
      <tr>
        <td>${escapeHtmlLocal(legendLabels.pressure)}</td>
        <td>${pressurePercentages.drive}%</td>
        <td>${pressurePercentages.connection}%</td>
        <td>${pressurePercentages.clarity}%</td>
      </tr>
    </tbody>
  `;
  container.appendChild(table);
}

// ------------------------------------------------------------------
// Overlay chart — many people on one triangle
// ------------------------------------------------------------------

function initialsFor(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * participants: Array<{ name: string, percentages: {drive,connection,clarity} }>
 * options: { showAverage?: boolean }
 */
function renderOverlayChart(container, participants, dimensionNames, options) {
  options = options || { showAverage: true };
  container.innerHTML = "";

  const markerInk = "#0b0b0b" /* fixed: this dot sits on the marker ring's fixed-white knockout fill, not the app's theme */;
  const svg = svgEl("svg", {
    viewBox: "0 0 300 300",
    class: "mvs-triangle mvs-triangle--overlay",
    role: "img",
    "aria-label": `Triangle overlay showing ${participants.length} team members' positions`,
  });

  drawTriangleSkeleton(svg);
  drawVertexLabels(svg, dimensionNames, null);

  let average = null;
  if (participants.length) {
    const sums = participants.reduce(
      (acc, p) => ({
        drive: acc.drive + p.percentages.drive,
        connection: acc.connection + p.percentages.connection,
        clarity: acc.clarity + p.percentages.clarity,
      }),
      { drive: 0, connection: 0, clarity: 0 }
    );
    average = roundToPercentages({
      drive: sums.drive / participants.length,
      connection: sums.connection / participants.length,
      clarity: sums.clarity / participants.length,
    });
  }

  // Individual markers, each labelled with initials directly on the chart
  // (never colour alone) and numbered to match the table underneath.
  participants.forEach((p, i) => {
    const point = barycentricPoint(p.percentages);
    const g = svgEl("g", { class: "mvs-overlay-marker-group" });
    g.appendChild(
      svgEl("circle", {
        cx: point.x,
        cy: point.y,
        r: 8,
        class: "mvs-overlay-marker",
      })
    );
    const label = svgEl("text", {
      x: point.x,
      y: point.y - 12,
      "text-anchor": "middle",
      class: "mvs-overlay-marker-label",
    });
    label.textContent = initialsFor(p.name) || String(i + 1);
    g.appendChild(label);
    svg.appendChild(g);
  });

  // Team-average marker: larger, hollow, distinct style.
  if (options.showAverage && average && participants.length > 1) {
    const avgPoint = barycentricPoint(average);
    svg.appendChild(
      svgEl("circle", {
        cx: avgPoint.x,
        cy: avgPoint.y,
        r: 12,
        class: "mvs-overlay-average-ring",
      })
    );
    svg.appendChild(
      svgEl("circle", {
        cx: avgPoint.x,
        cy: avgPoint.y,
        r: 4,
        fill: markerInk,
        class: "mvs-overlay-average-dot",
      })
    );
    const avgLabel = svgEl("text", {
      x: avgPoint.x,
      y: avgPoint.y + 24,
      "text-anchor": "middle",
      class: "mvs-overlay-average-label",
    });
    avgLabel.textContent = "Team average";
    svg.appendChild(avgLabel);
  }

  const triangleWrap = document.createElement("div");
  triangleWrap.className = "mvs-triangle-wrap";
  triangleWrap.appendChild(svg);
  container.appendChild(triangleWrap);

  // Accessible table fallback: every participant's exact split.
  const table = document.createElement("table");
  table.className = "mvs-overlay-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>${dimensionNames.drive}</th>
        <th>${dimensionNames.connection}</th>
        <th>${dimensionNames.clarity}</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");
  participants.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="mvs-overlay-table-badge">${initialsFor(p.name)}</span> ${escapeHtmlLocal(p.name)}</td>
      <td>${p.percentages.drive}%</td>
      <td>${p.percentages.connection}%</td>
      <td>${p.percentages.clarity}%</td>
    `;
    tbody.appendChild(tr);
  });
  if (average && participants.length > 1) {
    const tr = document.createElement("tr");
    tr.className = "mvs-overlay-table-average-row";
    tr.innerHTML = `
      <td><em>Team average</em></td>
      <td>${average.drive}%</td>
      <td>${average.connection}%</td>
      <td>${average.clarity}%</td>
    `;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}

function escapeHtmlLocal(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

// ------------------------------------------------------------------
// Perception ("blind-spot reveal") chart — one person's actual result
// plus every guess made about them (including their own self-guess),
// so a team can see how perception compared to reality.
// ------------------------------------------------------------------

/**
 * guesses: Array<{ label: string, percentages: {drive,connection,clarity} }>
 * actual: {drive,connection,clarity} | null
 */
function renderPerceptionChart(container, dimensionNames, actual, guesses) {
  container.innerHTML = "";
  const markerInk = "#0b0b0b" /* fixed: this dot sits on the marker ring's fixed-white knockout fill, not the app's theme */;

  const svg = svgEl("svg", {
    viewBox: "0 0 300 280",
    class: "mvs-triangle mvs-triangle--overlay",
    role: "img",
    "aria-label": "Triangle showing guesses about this person compared to their actual result",
  });

  drawTriangleSkeleton(svg);
  drawVertexLabels(svg, dimensionNames, null);

  guesses.forEach((g, i) => {
    const point = barycentricPoint(g.percentages);
    const marker = svgEl("circle", { cx: point.x, cy: point.y, r: 7, class: "mvs-overlay-marker mvs-overlay-marker--guess" });
    const label = svgEl("text", {
      x: point.x,
      y: point.y - 11,
      "text-anchor": "middle",
      class: "mvs-overlay-marker-label",
    });
    label.textContent = String(i + 1);
    svg.appendChild(marker);
    svg.appendChild(label);
  });

  if (actual) {
    const point = barycentricPoint(actual);
    svg.appendChild(svgEl("circle", { cx: point.x, cy: point.y, r: 11, class: "mvs-perception-actual-ring" }));
    svg.appendChild(svgEl("circle", { cx: point.x, cy: point.y, r: 5, fill: markerInk, class: "mvs-perception-actual-dot" }));
    const label = svgEl("text", {
      x: point.x,
      y: point.y + 22,
      "text-anchor": "middle",
      class: "mvs-overlay-average-label",
    });
    label.textContent = "Actual";
    svg.appendChild(label);
  }

  const wrap = document.createElement("div");
  wrap.className = "mvs-triangle-wrap";
  wrap.appendChild(svg);
  container.appendChild(wrap);

  const table = document.createElement("table");
  table.className = "mvs-overlay-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Guess</th>
        <th>${dimensionNames.drive}</th>
        <th>${dimensionNames.connection}</th>
        <th>${dimensionNames.clarity}</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");
  guesses.forEach((g, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="mvs-overlay-table-badge">${i + 1}</span> ${escapeHtmlLocal(g.label)}</td>
      <td>${g.percentages.drive}%</td>
      <td>${g.percentages.connection}%</td>
      <td>${g.percentages.clarity}%</td>
    `;
    tbody.appendChild(tr);
  });
  if (actual) {
    const tr = document.createElement("tr");
    tr.className = "mvs-overlay-table-average-row";
    tr.innerHTML = `
      <td><em>Actual</em></td>
      <td>${actual.drive}%</td>
      <td>${actual.connection}%</td>
      <td>${actual.clarity}%</td>
    `;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}

// ------------------------------------------------------------------
// Interactive triangle input (for the blind-spot guessing exercise)
// ------------------------------------------------------------------

/**
 * Renders a draggable triangle into `container` and returns a handle:
 *   { getPercentages(), setPercentages(pct), destroy() }
 * `onChange(percentages)` fires on every drag update.
 */
function createInteractiveTriangle(container, dimensionNames, initialPercentages, onChange) {
  container.innerHTML = "";
  let current = initialPercentages || { drive: 33, connection: 34, clarity: 33 };

  const svg = svgEl("svg", {
    viewBox: "0 0 300 260",
    class: "mvs-triangle mvs-triangle--interactive",
    role: "img",
    "aria-label": "Draggable triangle — tap or click inside to place your guess",
  });

  drawTriangleSkeleton(svg);
  const labelsGroup = svgEl("g", {});
  svg.appendChild(labelsGroup);

  const markerColor = "#0b0b0b" /* fixed: this dot sits on the marker ring's fixed-white knockout fill, not the app's theme */;
  const marker = svgEl("circle", { cx: 0, cy: 0, r: 10, class: "mvs-triangle-marker-ring mvs-triangle-marker-ring--interactive" });
  const markerDot = svgEl("circle", { cx: 0, cy: 0, r: 6, fill: markerColor, class: "mvs-triangle-marker" });
  svg.appendChild(marker);
  svg.appendChild(markerDot);

  function redrawLabels() {
    labelsGroup.innerHTML = "";
    drawVertexLabels(labelsGroup, dimensionNames, current);
  }

  function redrawMarker() {
    const p = barycentricPoint(current);
    marker.setAttribute("cx", p.x);
    marker.setAttribute("cy", p.y);
    markerDot.setAttribute("cx", p.x);
    markerDot.setAttribute("cy", p.y);
  }

  function setFromClientPoint(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const scaleX = TRIANGLE_VIEWBOX.width / rect.width;
    const scaleY = TRIANGLE_VIEWBOX.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    current = pointToPercentages({ x, y });
    redrawLabels();
    redrawMarker();
    if (typeof onChange === "function") onChange(current);
  }

  let dragging = false;
  svg.addEventListener("pointerdown", (e) => {
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    setFromClientPoint(e.clientX, e.clientY);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setFromClientPoint(e.clientX, e.clientY);
  });
  svg.addEventListener("pointerup", () => {
    dragging = false;
  });
  svg.addEventListener("pointercancel", () => {
    dragging = false;
  });

  redrawLabels();
  redrawMarker();
  container.appendChild(svg);

  const hint = document.createElement("p");
  hint.className = "mvs-triangle-hint";
  hint.textContent = "Tap or drag inside the triangle to place your guess.";
  container.appendChild(hint);

  return {
    getPercentages: () => ({ ...current }),
    setPercentages: (pct) => {
      current = pct;
      redrawLabels();
      redrawMarker();
    },
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    renderResultsChart,
    renderOverlayChart,
    renderPerceptionChart,
    renderPriorityShiftChart,
    createInteractiveTriangle,
    CHART_COLORS,
    pointToPercentages,
    barycentricPoint,
    roundToPercentages,
  };
}
