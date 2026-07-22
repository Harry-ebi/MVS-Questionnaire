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
  function buildGuidance(me, target, labels) {
    const meD = meDims(me);
    const themD = targetDims(target);
    const themBlend = themD.length > 1;
    const style = (d) => CONTENT.commsGuide.communicationStyles[d];
    const dc = (d) => CONTENT.dimensionContent[d];
    const idx = CONTENT.dimensionOrder.indexOf(themD[0]);
    const overlap = meD.filter((d) => themD.indexOf(d) !== -1);
    const label = targetLabel(target, labels);

    // How to approach THEM — combine each of their priorities. For a
    // blended person, give each priority its own line so two longer focus
    // phrases don't run together.
    let approach;
    if (themBlend) {
      approach = themD.map(
        (d, i) => `${i === 0 ? "Lead with" : "and also"} ${dc(d).quickReference.focus}.`
      );
      approach.push(`Steer clear of ${joinAnd(themD.map((d) => dc(d).quickReference.avoid))}.`);
      approach.push(`They blend two styles — opening with ${joinOr(themD.map((d) => style(d).opensWith))}.`);
    } else {
      approach = [
        `Lead with ${dc(themD[0]).quickReference.focus}.`,
        `Steer clear of ${dc(themD[0]).quickReference.avoid}.`,
        `They tend to open a conversation with ${style(themD[0]).opensWith}.`,
      ];
    }

    const themRespondsTo = joinAnd(themD.map((d) => style(d).respondsTo));
    const themPushBack = joinAnd(themD.map((d) => style(d).pushBack));

    // What YOU bring — blended across the reader's leading priorities.
    const myStrengths = meD.map((d) => {
      const list = dc(d).strengths;
      return lowerFirst(list[idx % list.length]);
    });
    const strength =
      meD.length === 1
        ? `Coming from a ${meBlendLabel(me, labels)} pattern yourself, your instinct here is ${myStrengths[0]} — worth leaning on, since they respond well to ${themRespondsTo}.`
        : `Coming from a ${meBlendLabel(me, labels)} blend, you bring ${joinAnd(
            myStrengths
          )} — a versatile mix to draw on here, and they respond well to ${themRespondsTo}.`;

    // Watch for — the reader's own overuse risk(s).
    const myRisks = meD.map((d) => {
      const list = dc(d).overuseRisks;
      return lowerFirst(list[idx % list.length]);
    });
    const watchFor =
      meD.length === 1
        ? `Your own overuse risk to keep in view here: ${myRisks[0]}.`
        : `Your blend's overuse risks to keep in view here: ${joinAnd(myRisks)}.`;

    // Reminder line — shared lean vs. bridging a gap.
    let reminder;
    if (overlap.length) {
      const otherDims = CONTENT.dimensionOrder.filter((d) => meD.indexOf(d) === -1);
      const bringIn = otherDims.length
        ? joinAnd(otherDims.map((d) => dc(d).quickReference.focus))
        : joinAnd(themD.map((d) => dc(d).quickReference.focus));
      reminder = `You overlap on ${joinAnd(overlap.map((d) => labels[d]))}, so you'll connect quickly there — but shared strengths can become shared blind spots. Deliberately bring in ${bringIn}.`;
    } else {
      reminder = `They tend to push back ${themPushBack}, and respond fastest to ${themRespondsTo}. ${cap(
        style(themD[0]).underGap
      )}.`;
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
    return list.map((target) => buildGuidance(me, target, labels));
  }

  const CommsGuidance = { buildGuidance, buildAllGuidance, meBlendLabel, meDims };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CommsGuidance;
  } else {
    global.CommsGuidance = CommsGuidance;
  }
})(typeof window !== "undefined" ? window : globalThis);
