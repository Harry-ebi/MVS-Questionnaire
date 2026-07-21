/**
 * chart.js
 * -----------------------------------------------------------------------
 * All triangle/chart rendering for the tool:
 *   - renderResultsChart      single-person result (triangle + bar/legend)
 *   - renderOverlayChart      many people's real results on one triangle
 *   - createInteractiveTriangle  draggable input, used by the blind-spot
 *                             guessing exercise to let someone place a guess
 *
 * This is an original geometric design: a plain equilateral triangle
 * with position markers, no regions, no proprietary labels or layout —
 * it is not a reproduction of any third-party assessment's triangle
 * graphic.
 * -----------------------------------------------------------------------
 */

// Colour mapping (validated for contrast + colour-vision-deficiency
// separation with the dataviz skill's palette validator):
//   People      -> blue
//   Performance -> red
//   Process     -> green
const CHART_COLORS = {
  people: { light: "#2a6fdb", dark: "#4a8ce8" },
  performance: { light: "#d1453b", dark: "#e35d52" },
  process: { light: "#1f9254", dark: "#2aa868" },
};

const TRIANGLE_VERTICES = {
  people: { x: 150, y: 26 }, // top
  performance: { x: 34, y: 224 }, // bottom left
  process: { x: 266, y: 224 }, // bottom right
};
const TRIANGLE_VIEWBOX = { minX: 0, minY: 0, width: 300, height: 260 };

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
// otherwise both resolve url(#mvs-tri-grad-people) to whichever element
// happened to be first in the document.
let chartInstanceCounter = 0;

/** percentages ({people, performance, process}, summing ~100) -> {x,y} */
function barycentricPoint(percentages) {
  const p = percentages.people / 100;
  const pf = percentages.performance / 100;
  const pr = percentages.process / 100;
  const { people: top, performance: bl, process: br } = TRIANGLE_VERTICES;
  return {
    x: p * top.x + pf * bl.x + pr * br.x,
    y: p * top.y + pf * bl.y + pr * br.y,
  };
}

/**
 * Inverse of barycentricPoint: given a point (possibly outside the
 * triangle, e.g. from a stray drag), return the closest valid
 * {people, performance, process} percentage split summing to 100.
 */
function pointToPercentages(point) {
  const A = TRIANGLE_VERTICES.people;
  const B = TRIANGLE_VERTICES.performance;
  const C = TRIANGLE_VERTICES.process;

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

  return roundToPercentages({ people: a * 100, performance: b * 100, process: c * 100 });
}

/**
 * Largest-remainder rounding so three fractional shares always become
 * whole numbers summing to exactly 100.
 */
function roundToPercentages(raw) {
  const dims = ["people", "performance", "process"];
  const floored = dims.map((d) => ({ d, exact: raw[d], floor: Math.floor(raw[d]) }));
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
 * maths as mixing red/green/blue light) rather than simply layered on
 * top of each other, wherever two or three colours overlap they
 * naturally lighten and blend, brightening all the way to a pale, near-
 * white centre where all three meet. This is the standard technique for
 * an RGB colour-mixing diagram — an original wash built from our own
 * geometry and colours, not a reproduction of any third-party triangle
 * graphic. Always renders in its own light "wash" regardless of the
 * app's light/dark theme (like a printed chart would), so the vertex
 * colours stay true and legible either way.
 */
function drawTriangleColorWash(svg, uid) {
  const { people: top, performance: bl, process: br } = TRIANGLE_VERTICES;
  const vertices = { people: top, performance: bl, process: br };
  const washColor = {
    people: CHART_COLORS.people.light,
    performance: CHART_COLORS.performance.light,
    process: CHART_COLORS.process.light,
  };
  const reach = 210; // how far each vertex's colour extends toward/past the centre

  const defs = svgEl("defs", {});
  const clipId = `mvs-tri-clip-${uid}`;
  defs.appendChild(
    svgEl("clipPath", { id: clipId })
  ).appendChild(
    svgEl("polygon", { points: `${top.x},${top.y} ${bl.x},${bl.y} ${br.x},${br.y}` })
  );

  const dims = ["people", "performance", "process"];
  dims.forEach((dim) => {
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
  dims.forEach((dim) => {
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
  const { people: top, performance: bl, process: br } = TRIANGLE_VERTICES;

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
    { x: 150, y: 12, anchor: "middle", dim: "people" },
    { x: 34, y: 244, anchor: "start", dim: "performance" },
    { x: 266, y: 244, anchor: "end", dim: "process" },
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
// Single-person results chart
// ------------------------------------------------------------------

function renderTriangle(percentages, dimensionNames) {
  const marker = barycentricPoint(percentages);
  const markerColor = "#0b0b0b" /* fixed: this dot sits on the marker ring's fixed-white knockout fill, not the app's theme */;

  const svg = svgEl("svg", {
    viewBox: "0 0 300 260",
    class: "mvs-triangle",
    role: "img",
    "aria-label": `Triangle chart showing People ${percentages.people}%, Performance ${percentages.performance}%, Process ${percentages.process}%`,
  });

  drawTriangleSkeleton(svg);
  drawVertexLabels(svg, dimensionNames, percentages);

  Object.values(TRIANGLE_VERTICES).forEach((v) => {
    svg.appendChild(
      svgEl("line", {
        x1: marker.x,
        y1: marker.y,
        x2: v.x,
        y2: v.y,
        class: "mvs-triangle-connector",
      })
    );
  });

  svg.appendChild(svgEl("circle", { cx: marker.x, cy: marker.y, r: 9, class: "mvs-triangle-marker-ring" }));
  svg.appendChild(
    svgEl("circle", { cx: marker.x, cy: marker.y, r: 6, fill: markerColor, class: "mvs-triangle-marker" })
  );

  return svg;
}

function renderStackedBar(percentages, dimensionNames) {
  const wrap = document.createElement("div");
  wrap.className = "mvs-bar";

  const dims = ["people", "performance", "process"];
  const track = document.createElement("div");
  track.className = "mvs-bar-track";
  track.setAttribute("role", "img");
  track.setAttribute(
    "aria-label",
    `Bar breakdown: ${dims.map((d) => `${dimensionNames[d]} ${percentages[d]}%`).join(", ")}`
  );

  dims.forEach((d) => {
    const seg = document.createElement("div");
    seg.className = "mvs-bar-segment";
    seg.style.width = `${percentages[d]}%`;
    seg.style.background = colorFor(d);
    track.appendChild(seg);
  });
  wrap.appendChild(track);

  const legend = document.createElement("div");
  legend.className = "mvs-legend";
  dims.forEach((d) => {
    const item = document.createElement("div");
    item.className = "mvs-legend-item";
    const swatch = document.createElement("span");
    swatch.className = "mvs-legend-swatch";
    swatch.style.background = colorFor(d);
    const text = document.createElement("span");
    text.textContent = `${dimensionNames[d]} — ${percentages[d]}%`;
    item.appendChild(swatch);
    item.appendChild(text);
    legend.appendChild(item);
  });
  wrap.appendChild(legend);

  return wrap;
}

function renderResultsChart(container, percentages, dimensionNames) {
  container.innerHTML = "";
  const triangleWrap = document.createElement("div");
  triangleWrap.className = "mvs-triangle-wrap";
  triangleWrap.appendChild(renderTriangle(percentages, dimensionNames));
  container.appendChild(triangleWrap);
  container.appendChild(renderStackedBar(percentages, dimensionNames));
}

// ------------------------------------------------------------------
// Motivational Shift chart — Everyday point, Pressure point, and an
// arrow between them (spec: "How You Respond Under Pressure" report).
// Reuses the exact same pixel-space triangle/vertices as the single-
// person results chart above, so it looks visually consistent with it
// rather than introducing a second, incompatible coordinate system.
// ------------------------------------------------------------------

function drawArrowBetween(svg, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  // Stop the line short of the pressure marker so the arrowhead doesn't
  // disappear underneath it.
  const shrink = 13;
  const endX = to.x - ux * shrink;
  const endY = to.y - uy * shrink;

  svg.appendChild(
    svgEl("line", { x1: from.x, y1: from.y, x2: endX, y2: endY, class: "mvs-shift-arrow-line" })
  );

  const headLen = 11;
  const headWidth = 7;
  const backX = endX - ux * headLen;
  const backY = endY - uy * headLen;
  const perpX = -uy;
  const perpY = ux;
  const tip = { x: endX, y: endY };
  const left = { x: backX + perpX * headWidth, y: backY + perpY * headWidth };
  const right = { x: backX - perpX * headWidth, y: backY - perpY * headWidth };
  svg.appendChild(
    svgEl("polygon", {
      points: `${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`,
      class: "mvs-shift-arrowhead",
    })
  );
}

function drawDiamondMarker(svg, point, r, className) {
  const pts = [
    { x: point.x, y: point.y - r },
    { x: point.x + r, y: point.y },
    { x: point.x, y: point.y + r },
    { x: point.x - r, y: point.y },
  ];
  svg.appendChild(
    svgEl("polygon", { points: pts.map((p) => `${p.x},${p.y}`).join(" "), class: className })
  );
}

/**
 * everydayPercentages / pressurePercentages: {people, performance, process}
 * legendLabels: { everyday: string, pressure: string }
 */
function renderShiftChart(container, everydayPercentages, pressurePercentages, dimensionNames, legendLabels) {
  container.innerHTML = "";
  const markerInk = "#14101a";

  const everydayPoint = barycentricPoint(everydayPercentages);
  const pressurePoint = barycentricPoint(pressurePercentages);

  const svg = svgEl("svg", {
    viewBox: "0 0 300 260",
    class: "mvs-triangle mvs-triangle--shift",
    role: "img",
    "aria-label": `Triangle showing your everyday profile (People ${everydayPercentages.people}%, Performance ${everydayPercentages.performance}%, Process ${everydayPercentages.process}%) and your pressure profile (People ${pressurePercentages.people}%, Performance ${pressurePercentages.performance}%, Process ${pressurePercentages.process}%), with an arrow from one to the other`,
  });

  drawTriangleSkeleton(svg);
  drawVertexLabels(svg, dimensionNames, null);

  drawArrowBetween(svg, everydayPoint, pressurePoint);

  // Everyday: solid circular marker (same convention as the single-
  // person results chart).
  svg.appendChild(
    svgEl("circle", { cx: everydayPoint.x, cy: everydayPoint.y, r: 9, class: "mvs-shift-marker-ring" })
  );
  svg.appendChild(
    svgEl("circle", {
      cx: everydayPoint.x,
      cy: everydayPoint.y,
      r: 6,
      fill: markerInk,
      class: "mvs-shift-marker mvs-shift-marker--everyday",
    })
  );

  // Pressure: outlined diamond marker — distinguishable from the
  // Everyday marker by shape, not just colour (accessible to colour-
  // vision-deficient readers and to print/greyscale).
  drawDiamondMarker(svg, pressurePoint, 10, "mvs-shift-marker-ring mvs-shift-marker-ring--pressure");
  drawDiamondMarker(svg, pressurePoint, 4.5, "mvs-shift-marker mvs-shift-marker--pressure");

  const triangleWrap = document.createElement("div");
  triangleWrap.className = "mvs-triangle-wrap";
  triangleWrap.appendChild(svg);
  container.appendChild(triangleWrap);

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

  // Accessible text-based fallback: exact splits for both profiles,
  // side by side (also what ends up on narrow screens / in print).
  const table = document.createElement("table");
  table.className = "mvs-overlay-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>${escapeHtmlLocal(legendLabels.tableProfileHeading || "Profile")}</th>
        <th>${dimensionNames.people}</th>
        <th>${dimensionNames.performance}</th>
        <th>${dimensionNames.process}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtmlLocal(legendLabels.everyday)}</td>
        <td>${everydayPercentages.people}%</td>
        <td>${everydayPercentages.performance}%</td>
        <td>${everydayPercentages.process}%</td>
      </tr>
      <tr>
        <td>${escapeHtmlLocal(legendLabels.pressure)}</td>
        <td>${pressurePercentages.people}%</td>
        <td>${pressurePercentages.performance}%</td>
        <td>${pressurePercentages.process}%</td>
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
 * participants: Array<{ name: string, percentages: {people,performance,process} }>
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
        people: acc.people + p.percentages.people,
        performance: acc.performance + p.percentages.performance,
        process: acc.process + p.percentages.process,
      }),
      { people: 0, performance: 0, process: 0 }
    );
    average = roundToPercentages({
      people: sums.people / participants.length,
      performance: sums.performance / participants.length,
      process: sums.process / participants.length,
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
        <th>${dimensionNames.people}</th>
        <th>${dimensionNames.performance}</th>
        <th>${dimensionNames.process}</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");
  participants.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="mvs-overlay-table-badge">${initialsFor(p.name)}</span> ${escapeHtmlLocal(p.name)}</td>
      <td>${p.percentages.people}%</td>
      <td>${p.percentages.performance}%</td>
      <td>${p.percentages.process}%</td>
    `;
    tbody.appendChild(tr);
  });
  if (average && participants.length > 1) {
    const tr = document.createElement("tr");
    tr.className = "mvs-overlay-table-average-row";
    tr.innerHTML = `
      <td><em>Team average</em></td>
      <td>${average.people}%</td>
      <td>${average.performance}%</td>
      <td>${average.process}%</td>
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
 * guesses: Array<{ label: string, percentages: {people,performance,process} }>
 * actual: {people,performance,process} | null
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
        <th>${dimensionNames.people}</th>
        <th>${dimensionNames.performance}</th>
        <th>${dimensionNames.process}</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");
  guesses.forEach((g, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="mvs-overlay-table-badge">${i + 1}</span> ${escapeHtmlLocal(g.label)}</td>
      <td>${g.percentages.people}%</td>
      <td>${g.percentages.performance}%</td>
      <td>${g.percentages.process}%</td>
    `;
    tbody.appendChild(tr);
  });
  if (actual) {
    const tr = document.createElement("tr");
    tr.className = "mvs-overlay-table-average-row";
    tr.innerHTML = `
      <td><em>Actual</em></td>
      <td>${actual.people}%</td>
      <td>${actual.performance}%</td>
      <td>${actual.process}%</td>
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
  let current = initialPercentages || { people: 34, performance: 33, process: 33 };

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
    renderShiftChart,
    createInteractiveTriangle,
    CHART_COLORS,
    pointToPercentages,
    barycentricPoint,
    roundToPercentages,
  };
}
