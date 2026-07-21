/**
 * commsGuidance.js
 * -----------------------------------------------------------------------
 * Generates the "working with different priorities" pairwise guidance at
 * render time, instead of looking it up from a large static matrix. This
 * combines two small original data sources already defined in content.js:
 *
 *   - CONTENT.dimensionContent[dimension]  (interpretation, strengths,
 *     overuseRisks, quickReference — one entry per dimension)
 *   - CONTENT.commsGuide.communicationStyles[dimension]  (opensWith,
 *     respondsTo, pushBack, underGap — short communication-style
 *     building blocks, one entry per dimension)
 *
 * With only 3 dimensions there are 6 ordered pairs plus 3 self-pairs —
 * small enough that a lookup table would work, but a generator is used
 * deliberately so the guidance reads as assembled from someone's actual
 * pattern rather than a fixed script, and so future dimensions or
 * thresholds don't require hand-writing new pairs.
 * -----------------------------------------------------------------------
 */

(function (global) {
  "use strict";

  function lowerFirst(str) {
    return str ? str.charAt(0).toLowerCase() + str.slice(1) : str;
  }

  /**
   * Build the full guidance block for working with `themDimension`,
   * written from `meDimension`'s perspective.
   * Returns { heading, approach: string[], strength, watchFor, reminder }.
   */
  function buildGuidance(meDimension, themDimension, labels) {
    const me = CONTENT.dimensionContent[meDimension];
    const them = CONTENT.dimensionContent[themDimension];
    const meStyle = CONTENT.commsGuide.communicationStyles[meDimension];
    const themStyle = CONTENT.commsGuide.communicationStyles[themDimension];
    const isSelf = meDimension === themDimension;

    const approach = [
      `Lead with ${them.quickReference.focus}.`,
      `Steer clear of ${them.quickReference.avoid}.`,
      `They tend to open a conversation with ${themStyle.opensWith}.`,
    ];

    // Cycle which of "my" own strengths/risks gets used by dimension
    // index rather than always entry 0, so the small number of cards
    // don't all lean on the exact same sentence.
    const idx = CONTENT.dimensionOrder.indexOf(themDimension);
    const myStrength = me.strengths[idx % me.strengths.length];
    const myRisk = me.overuseRisks[idx % me.overuseRisks.length];

    const strength = `Coming from a ${labels[meDimension]}-led pattern yourself, your instinct here is ${lowerFirst(
      myStrength
    )} — worth leaning on, since they respond well to ${themStyle.respondsTo}.`;

    const watchFor = `Your own overuse risk to keep in view here: ${lowerFirst(myRisk)}.`;

    let reminder;
    if (isSelf) {
      reminder = `Two ${labels[meDimension]}-led people can reinforce the same blind spot rather than balance it out — deliberately bring in ${them.quickReference.focus} from somewhere else.`;
    } else {
      reminder = `They tend to push back ${themStyle.pushBack}, and respond fastest to ${themStyle.respondsTo}. ${
        themStyle.underGap.charAt(0).toUpperCase() + themStyle.underGap.slice(1)
      }.`;
    }

    return {
      heading: isSelf ? CONTENT.commsGuide.selfPairLabel(labels[meDimension]) : them.label,
      approach,
      strength,
      watchFor,
      reminder,
      isSelf,
    };
  }

  /**
   * Build guidance cards for every dimension in CONTENT.dimensionOrder,
   * from `meDimension`'s perspective (including the self-pairing card).
   */
  function buildAllGuidance(meDimension, labels) {
    return CONTENT.dimensionOrder.map((themDimension) => ({
      dimension: themDimension,
      ...buildGuidance(meDimension, themDimension, labels),
    }));
  }

  const CommsGuidance = { buildGuidance, buildAllGuidance };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CommsGuidance;
  } else {
    global.CommsGuidance = CommsGuidance;
  }
})(typeof window !== "undefined" ? window : globalThis);
