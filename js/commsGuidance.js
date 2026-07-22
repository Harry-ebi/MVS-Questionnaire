/**
 * commsGuidance.js
 * -----------------------------------------------------------------------
 * Generates the "working with different priorities" pairwise guidance at
 * render time, instead of looking it up from a large static matrix. It
 * combines two small original data sources already defined in content.js:
 *
 *   - CONTENT.dimensionContent[dimension]  (interpretation, strengths,
 *     overuseRisks, quickReference — one entry per dimension)
 *   - CONTENT.commsGuide.communicationStyles[dimension]  (opensWith,
 *     respondsTo, pushBack, underGap — short communication-style
 *     building blocks, one entry per dimension)
 *
 * BLEND-AWARE ON BOTH SIDES:
 *   - "me" (the reader) may be a single priority, a dual-led blend, or
 *     balanced — the "What you bring / Watch for / shared-lean" text
 *     reflects all of the reader's leading priorities.
 *   - "them" (the person being met) may ALSO be a blend — cards are
 *     generated for meeting single-led, dual-led and balanced people, and
 *     a blended target's guidance combines both of its priorities.
 *
 * Both `me` and each `target` are expressed as a set of dimensions, so a
 * 49 Drive / 48 Clarity / 3 Connection reader gets Drive-and-Clarity
 * guidance for meeting, say, a "Connection & Clarity" person.
 * -----------------------------------------------------------------------
 */

(function (global) {
  "use strict";

  function lowerFirst(str) {
    return str ? str.charAt(0).toLowerCase() + str.slice(1) : str;
  }
  function cap(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
  }
  function join(arr, word) {
    arr = arr.filter(Boolean);
    if (arr.length <= 1) return arr[0] || "";
    if (arr.length === 2) return arr[0] + " " + word + " " + arr[1];
    return arr.slice(0, -1).join(", ") + " " + word + " " + arr[arr.length - 1];
  }
  const joinAnd = (a) => join(a, "and");
  const joinOr = (a) => join(a, "or");

  /** Normalise `me` (pattern object or dimension string) to a dimension list. */
  function meDims(me) {
    if (typeof me === "string") return [me];
    if (!me) return [];
    if (me.type === "dual") return [me.primary, me.secondary];
    if (me.type === "balanced") return CONTENT.dimensionOrder.slice();
    return [me.primary]; // focused / single
  }

  /** Normalise a `target` (dimension string, array, or {dims,label}) to a list. */
  function targetDims(target) {
    if (typeof target === "string") return [target];
    if (Array.isArray(target)) return target;
    if (target && target.dims) return target.dims;
    return [];
  }
  function targetLabel(target, labels) {
    if (typeof target === "string") return CONTENT.dimensionContent[target].label;
    if (target && target.label) return target.label;
    return targetDims(target).map((d) => labels[d]).join(" & ");
  }

  /** A natural label for the reader's own pattern. */
  function meBlendLabel(me, labels) {
    const dims = meDims(me);
    if (dims.length === 1) return labels[dims[0]] + "-led";
    if (dims.length >= 3) return "balanced";
    return labels[dims[0]] + " & " + labels[dims[1]];
  }

  /**
   * Build the guidance card for meeting `target`, written from the reader's
   * whole pattern `me`. Returns
   * { heading, dims, approach:string[], strength, watchFor, reminder, isSelf }.
   */
  function buildGuidance(me, target, labels, seed) {
    const meD = meDims(me);
    const themD = targetDims(target);
    const themBlend = themD.length > 1;
    const style = (d) => CONTENT.commsGuide.communicationStyles[d];
    const dc = (d) => CONTENT.dimensionContent[d];
    const overlap = meD.filter((d) => themD.indexOf(d) !== -1);
    const label = targetLabel(target, labels);

    // Deterministic variety. A stable hash of (card position + the target's
    // dimensions) picks a phrasing, so different cards read differently while
    // the same input always produces the same output (no randomness). A
    // per-field "salt" decorrelates the fields, so two cards rarely echo.
    let h = typeof seed === "number" ? seed : CONTENT.dimensionOrder.indexOf(themD[0]);
    themD.forEach((d) => {
      h = h * 31 + CONTENT.dimensionOrder.indexOf(d) + 7;
    });
    const vpick = (arr, salt) => arr[Math.abs(h + (salt || 0) * 13) % arr.length];
    // A second, decorrelated hash for the *other* dimension of a blend, so a
    // blend's two strengths/risks don't move in lockstep (which would leave
    // only three distinct combinations).
    const h2 = Math.abs(h * 2 + 5);
    const vpick2 = (arr, salt) => arr[Math.abs(h2 + (salt || 0) * 13) % arr.length];
    const focus = (d) => dc(d).quickReference.focus;
    const avoid = (d) => dc(d).quickReference.avoid;
    const meBlend = meD.length > 1;

    // ---- Best approach: how to meet THEM ----
    let approach;
    if (themBlend) {
      // Anchor each priority to its label so two comma-heavy phrases stay
      // clearly separated rather than running into one another.
      approach = [
        `On the ${labels[themD[0]]} side they'll want ${focus(themD[0])}; on the ${labels[themD[1]]} side, ${focus(themD[1])}.`,
        `Avoid ${avoid(themD[0])}, and equally ${avoid(themD[1])}.`,
        `They may open on either front — with ${style(themD[0]).opensWith}, or ${style(themD[1]).opensWith}.`,
      ];
    } else {
      approach = [
        `${vpick(["Start with", "Open with", "Put the focus on"], 1)} ${focus(themD[0])}.`,
        `${vpick(["Try to avoid", "Steer clear of", "Don't get bogged down in"], 2)} ${avoid(themD[0])}.`,
        vpick(
          [
            `They'll usually open with ${style(themD[0]).opensWith}.`,
            `Expect them to lead with ${style(themD[0]).opensWith}.`,
            `They tend to start from ${style(themD[0]).opensWith}.`,
          ],
          3
        ),
      ];
    }

    // ---- What you bring: the reader's own strengths, and what lands ----
    // Phrasings that read cleanly whether respondsTo is a noun phrase
    // ("a clear ask…") or a gerund one ("being asked…").
    const respondsClause = vpick(
      [
        `They'll appreciate ${style(themD[0]).respondsTo}.`,
        `They respond best to ${style(themD[0]).respondsTo}.`,
        `What lands with them is ${style(themD[0]).respondsTo}.`,
      ],
      4
    );
    const myStrengths = meD.map((d, i) => lowerFirst((i === 0 ? vpick : vpick2)(dc(d).strengths, 9)));
    let strength;
    if (meBlend) {
      strength = `You bring the best of both here — ${myStrengths[0]}, plus ${myStrengths[1]}. ${respondsClause}`;
    } else {
      const opener = vpick(
        ["One advantage you already bring is", "Your natural strength here is", "You've got a real edge here —"],
        5
      );
      strength = `${opener} ${myStrengths[0]}. ${respondsClause}`;
    }

    // ---- Watch for: the reader's own overuse risk(s) ----
    const myRisks = meD.map((d, i) => lowerFirst((i === 0 ? vpick : vpick2)(dc(d).overuseRisks, 10)));
    const watchFor = meBlend
      ? vpick(
          [
            `Two traps to keep an eye on: ${myRisks[0]}, and ${myRisks[1]}.`,
            `Watch two things in yourself: ${myRisks[0]}, and ${myRisks[1]}.`,
            `A couple of watch-outs here: ${myRisks[0]}, and ${myRisks[1]}.`,
            `Keep two habits in check: ${myRisks[0]}, and ${myRisks[1]}.`,
            `Two things to guard against: ${myRisks[0]}, and ${myRisks[1]}.`,
          ],
          6
        )
      : vpick(
          [
            `The main thing to watch is ${myRisks[0]}.`,
            `Just keep an eye on ${myRisks[0]}.`,
            `Watch out for ${myRisks[0]}.`,
            `The trap to avoid is ${myRisks[0]}.`,
            `Be careful not to slip into ${myRisks[0]}.`,
          ],
          6
        );

    // ---- One line to remember ----
    let reminder;
    if (overlap.length) {
      const sharedLabel = joinAnd(overlap.map((d) => labels[d]));
      const otherDims = CONTENT.dimensionOrder.filter((d) => meD.indexOf(d) === -1);
      // One missing focus reads cleanly in full; two are referenced by
      // label ("the Connection and Clarity sides") to avoid a comma pile-up.
      const missing =
        otherDims.length === 1
          ? focus(otherDims[0])
          : otherDims.length
          ? `the ${otherDims.map((d) => labels[d]).join(" and ")} sides of things`
          : joinAnd(themD.map((d) => focus(d)));
      reminder = vpick(
        [
          `You two already speak the same language on ${sharedLabel} — a real advantage. Just don't let a shared strength turn into a shared blind spot: make a point of bringing in ${missing}.`,
          `You'll click quickly here, since you both lead on ${sharedLabel}. The risk is a shared blind spot — so consciously make room for ${missing}.`,
          `${sharedLabel} is common ground between you, which helps. Just watch it doesn't become a shared blind spot: deliberately bring in ${missing}.`,
        ],
        7
      );
    } else {
      const t0 = themD[0];
      reminder = vpick(
        [
          `Don't read their pushback as resistance — they just approach things differently, pushing back ${style(t0).pushBack}. They respond best to ${style(t0).respondsTo}, so lead with that and you'll get much further. ${cap(style(t0).underGap)}.`,
          `When they push back — ${style(t0).pushBack} — it isn't resistance, just a different lens. They warm to ${style(t0).respondsTo}, so start there and things move faster. ${cap(style(t0).underGap)}.`,
          `Their pushback (${style(t0).pushBack}) is a difference in approach, not a no. What works is ${style(t0).respondsTo} — lean on that and you'll find more common ground. ${cap(style(t0).underGap)}.`,
        ],
        8
      );
    }

    // Heading.
    let heading;
    const fullyShared = themD.every((d) => meD.indexOf(d) !== -1) && themD.length === meD.length;
    if (fullyShared) {
      heading =
        themD.length === 1
          ? CONTENT.commsGuide.selfPairLabel(label)
          : CONTENT.commsGuide.sharedPairLabel(label);
    } else {
      heading = label;
    }

    return {
      heading,
      dims: themD.slice(),
      approach,
      strength,
      watchFor,
      reminder,
      isSelf: overlap.length > 0,
    };
  }

  /**
   * Build guidance cards for every `target` provided (each a dimension
   * string or a {dims,label} blend), from the reader's pattern `me`.
   * If no targets are given, defaults to the three single dimensions.
   */
  function buildAllGuidance(me, targets, labels) {
    // Back-compat: buildAllGuidance(me, labels) with no targets.
    if (labels === undefined && targets && !Array.isArray(targets)) {
      labels = targets;
      targets = null;
    }
    const list = targets && targets.length ? targets : CONTENT.dimensionOrder.slice();
    return list.map((target, i) => buildGuidance(me, target, labels, i));
  }

  const CommsGuidance = { buildGuidance, buildAllGuidance, meBlendLabel, meDims };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CommsGuidance;
  } else {
    global.CommsGuidance = CommsGuidance;
  }
})(typeof window !== "undefined" ? window : globalThis);
