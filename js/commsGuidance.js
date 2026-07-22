/**
 * commsGuidance.js
 * -----------------------------------------------------------------------
 * Generates the "communicating across different priorities" guidance.
 *
 * This is written to read like an executive coach, not like software
 * filling variables. Rather than slot short building-block phrases into a
 * fixed sentence skeleton, it draws on hand-written pools of complete,
 * second-person, *actionable* coaching sentences — one set per priority
 * (Drive / Connection / Clarity) — and composes each card by selecting,
 * ordering and shaping a few of them.
 *
 * The behavioural model is unchanged: these sentences express exactly the
 * same communication preferences, strengths and risks defined in
 * content.js, just written as advice. Selection is a deterministic hash of
 * the card's own dimensions, so the same card always reads the same, but
 * different cards genuinely differ in wording, structure and length —
 * there is no randomness.
 *
 * The reader's own strengths and risks continue to be shown in the
 * "Your result, in a nutshell" overview at the top of the guide page, so
 * nothing from the model is lost by making the cards pure coaching.
 * -----------------------------------------------------------------------
 */

(function (global) {
  "use strict";

  // ---- small deterministic helpers -----------------------------------
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }
  // Choose `n` distinct items from `pool`, deterministically from hash `h`,
  // walking the pool with a coprime step so the picks are well spread.
  function chooseN(pool, h, n) {
    const len = pool.length;
    if (!len) return [];
    n = Math.min(n, len);
    let i = Math.abs(h) % len;
    let step = len === 1 ? 1 : 1 + (Math.abs(Math.floor(h / 7)) % (len - 1));
    while (gcd(step, len) !== 1) step = (step % len) + 1;
    const out = [];
    for (let k = 0; k < n; k++) {
      out.push(pool[i]);
      i = (i + step) % len;
    }
    return out;
  }

  function meDims(me) {
    if (typeof me === "string") return [me];
    if (!me) return [];
    if (me.type === "dual") return [me.primary, me.secondary];
    if (me.type === "balanced") return CONTENT.dimensionOrder.slice();
    return [me.primary];
  }
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
  function meBlendLabel(me, labels) {
    const dims = meDims(me);
    if (dims.length === 1) return labels[dims[0]] + "-led";
    if (dims.length >= 3) return "balanced";
    return labels[dims[0]] + " & " + labels[dims[1]];
  }

  // ---- the coaching library ------------------------------------------
  // MEETING[dim] — advice for communicating WITH someone who leads on that
  // priority. Each line stands alone and is written as practical guidance.
  const MEETING = {
    drive: [
      "Get to the point quickly. They've often worked out where a conversation needs to go before you've finished your opening line, and a slow build-up will lose them.",
      "Lead with the outcome you're after and the very next step. If they want the background they'll ask — and they usually will.",
      "If you need a yes, make the ask unambiguous and show that things are already moving; momentum reassures them far more than detail does.",
      "They're quietly asking one question: what are we doing, and by when? Answer it early and you'll have their full attention.",
      "When they challenge you it'll be head-on, and they'll think more of you for meeting it the same way rather than softening it.",
      "Resist the urge to caveat everything. Say the thing, then explain it — doing it the other way round tends to frustrate them.",
      "If a call is genuinely close, say so and hand it to them. Sitting on the fence reads to them as a lack of grip.",
      "Turn discussion into a decision before you leave the room where you can. Open loops sit badly with them.",
    ],
    connection: [
      "Spend the first minute on the person, not the task. A genuine check-in isn't a nicety to them — it's how they get ready to engage.",
      "Before you push for anything, show you've thought about who it affects. If people feel like an afterthought, you'll lose them quietly.",
      "Bring them in early. Being consulted before a decision matters far more to them than being told about it afterwards.",
      "Ask for their view directly, then actually let it land — a pause, a nod, a 'that's useful' — before you move on.",
      "Their disagreement is quiet. If they agree a little too easily, assume there's a concern they haven't voiced and gently make room for it.",
      "A blunt, context-free ask will read as cold even when you don't mean it to. A sentence of who and why, first, changes the whole tone.",
      "When the message is hard, lead with the relationship and your intent. They can take the substance; what they can't take is feeling ambushed.",
      "If harmony and the deadline are pulling against each other, name it openly rather than steamrolling — they'll help you solve it if they feel trusted.",
    ],
    clarity: [
      "Give them your reasoning before you ask for a decision. A conclusion with no visible logic behind it makes them uneasy, however right it happens to be.",
      "Hand them a clear framework up front — what, why, and how it fits together. It saves you both a lot of circling back later.",
      "Make your case, then give them a moment to sit with it. Pressing for an answer on the spot rarely gets you their real one.",
      "Vagueness is the quickest way to lose them. If the ask is fuzzy or rushed, they'll stall until it isn't.",
      "When they push back it'll usually be a question about the rationale rather than a flat no. Treat that as engagement, not obstruction.",
      "If you're changing something, show your working. 'Because I said so' or 'because it's urgent' meets quiet resistance every time.",
      "They're weighing whether this holds together. Anticipate the obvious gaps and close them before they have to point them out.",
      "Where you're tempted to rush the opening, slow it by a beat and lay out the structure — counter-intuitively, you'll get there faster.",
    ],
  };

  // SHARED[dim] — you and they both lead here: name the easy rapport, then
  // the shared blind spot, and nudge toward what you'll both skip.
  const SHARED = {
    drive: [
      "You'll click here — you both want to move, and decisions will come fast. The risk is that you egg each other on and leave the people and the detail in your wake, so make someone responsible for pumping the brakes.",
      "Two of you driving for momentum is a real force, but it can mean nobody's asking whether you're right, only whether you're quick. Build in one deliberate pause before the big calls.",
      "The pace between you will feel great — until something important gets skipped. Every so often, one of you needs to be the person who says 'wait, who and what are we missing?'",
    ],
    connection: [
      "You'll understand each other almost without trying — you both read the room and protect the relationship. Just watch that a shared instinct for harmony doesn't quietly leave the difficult conversation unhad.",
      "The rapport will be genuine, which is a gift. The trap is mutual conflict-avoidance, so agree early that raising a concern is a kindness here, not an attack.",
      "You'll both work hard to keep things comfortable, which is lovely right up until a hard call needs making. Give each other explicit permission to be blunt when it matters.",
    ],
    clarity: [
      "You'll speak the same language of evidence and structure, which makes the thinking easy. The danger is a shared perfectionism that keeps polishing long after 'good enough' has arrived — give yourselves a line for when to stop.",
      "Two careful minds can analyse each other into a corner. Put a deadline on the thinking so the rigour serves the decision instead of replacing it.",
      "You'll enjoy getting it right together, but 'right' can quietly become 'endless'. Agree what 'done' looks like before you start, or you'll both keep finding one more thing to check.",
    ],
  };

  // GAP[dim] — you lead differently from them; a short line acknowledging
  // the stretch toward what this person needs.
  const GAP = {
    drive: [
      "Matching their pace won't be your instinct, but here decisiveness is the courtesy — give them a clear call even when you'd naturally take longer over it.",
      "You may want more time to weigh things than they'll offer. Meet them where they are: decide out loud, and refine as you go rather than before you start.",
      "Where you'd naturally add nuance, they'll want a headline. Give them the bottom line first — you can always add the shading once they know where you're heading.",
    ],
    connection: [
      "The relationship-first opening can feel like a detour when you just want to get on. For them it's the on-ramp to everything else, so build it in even when the clock is running.",
      "Slowing down to check how people are landing may not come naturally. Do it anyway — with them, that's not softness, it's what makes the rest possible.",
      "You might be ready to talk task while they're still reading the room. Let them; a minute spent on the human side buys you a far easier conversation.",
    ],
    clarity: [
      "Showing your full reasoning can feel like overkill when you can already see the answer. To them it's the difference between trust and doubt, so spell it out even so.",
      "You may be ready to move before they're ready to agree. Give them the structure and a moment to think, and you'll spend less time revisiting it later.",
      "Your confidence won't be enough for them on its own — they'll want the workings behind it. Show the path, not just the destination.",
    ],
  };

  // BLEND intro templates (label slots) for a two-priority target.
  const BLEND_INTRO = [
    "This is someone who genuinely holds {a} and {b} at once, so you can't lean on just one register — speak to both.",
    "They carry {a} and {b} together, which means the thing that satisfies one instinct can leave the other cold. Cover both.",
    "You're dealing with a real blend of {a} and {b} here; read which one is in the driving seat today, and make sure the other still gets a nod.",
  ];

  // BALANCED target — flexes across all three.
  const BALANCED = [
    "They move between all three registers depending on the moment, so open with a little of each — the point, the people, and the reasoning — and follow whichever one they pick up.",
    "Because they flex, the worst assumption you can make is that they're 'like you'. Read which mode they're in today rather than defaulting to your own.",
    "Their strength is adaptability, so they'll meet you halfway if you're clear about what this particular conversation needs from them.",
  ];

  /**
   * Build one card: { heading, dims, note: [paragraph, ...] }.
   * `take(poolKey, pool, hash, n)` draws n items NOT yet used elsewhere in
   * this run (so a sentence isn't repeated across a reader's cards until its
   * pool is exhausted). Falls back to chooseN when no coordinator is given.
   */
  function buildGuidance(me, target, labels, seed, take) {
    const meD = meDims(me);
    const themD = targetDims(target);
    const overlap = meD.filter((d) => themD.indexOf(d) !== -1);
    const label = targetLabel(target, labels);
    if (!take) take = (key, pool, hash, n) => chooseN(pool, hash, n);

    // Deterministic hash of (card position + target dimensions).
    let h = typeof seed === "number" ? seed : CONTENT.dimensionOrder.indexOf(themD[0]);
    themD.forEach((d) => {
      h = h * 31 + CONTENT.dimensionOrder.indexOf(d) + 7;
    });
    // Well-mixed, per-field hashes (odd multipliers so short pools don't
    // collapse to a single entry). Distinct salts decorrelate the fields.
    const mix = (salt) => Math.abs(h * 131 + salt * 977 + 17);
    // The card's *structure* is driven off its position so the shape itself
    // varies from card to card (not just the words).
    const pos = typeof seed === "number" ? seed : Math.abs(h);

    const dynamic = overlap.length
      ? take("shared_" + overlap[0], SHARED[overlap[0]], mix(5), 1)[0]
      : take(
          "gap_" + (themD.length > 2 ? themD[Math.abs(h) % 3] : themD[0]),
          GAP[themD.length > 2 ? themD[Math.abs(h) % 3] : themD[0]],
          mix(5),
          1
        )[0];

    let note;
    if (themD.length === 1) {
      // Single-priority target.
      const meet = take("meet_" + themD[0], MEETING[themD[0]], mix(1), 2);
      const shape = pos % 4;
      if (shape === 0) note = [meet[0] + " " + meet[1], dynamic];
      else if (shape === 1) note = [dynamic + " " + meet[0]];
      else if (shape === 2) note = [meet[0], meet[1] + " " + dynamic];
      else note = [meet[0] + " " + dynamic, meet[1]];
    } else if (themD.length >= 3) {
      // Balanced target.
      const b = take("balanced", BALANCED, mix(1), 2);
      const shape = pos % 2;
      note = shape === 0 ? [b[0] + " " + b[1], dynamic] : [b[0], b[1] + " " + dynamic];
    } else {
      // Two-priority (blend) target.
      const intro = take("blendintro", BLEND_INTRO, mix(4), 1)[0]
        .replace("{a}", labels[themD[0]])
        .replace("{b}", labels[themD[1]]);
      const m1 = take("meet_" + themD[0], MEETING[themD[0]], mix(2), 1)[0];
      const m2 = take("meet_" + themD[1], MEETING[themD[1]], mix(3), 1)[0];
      const shape = pos % 3;
      if (shape === 0) note = [intro, m1 + " " + m2, dynamic];
      else if (shape === 1) note = [intro + " " + m1, m2 + " " + dynamic];
      else note = [m1 + " " + m2, intro + " " + dynamic];
    }

    // Heading.
    const fullyShared = themD.every((d) => meD.indexOf(d) !== -1) && themD.length === meD.length;
    let heading;
    if (fullyShared) {
      heading =
        themD.length === 1
          ? CONTENT.commsGuide.selfPairLabel(label)
          : CONTENT.commsGuide.sharedPairLabel(label);
    } else {
      heading = label;
    }

    return { heading, dims: themD.slice(), note: note, isSelf: overlap.length > 0 };
  }

  function buildAllGuidance(me, targets, labels) {
    if (labels === undefined && targets && !Array.isArray(targets)) {
      labels = targets;
      targets = null;
    }
    const list = targets && targets.length ? targets : CONTENT.dimensionOrder.slice();
    // Coordinate selection across the whole set: a sentence isn't reused
    // until its pool is exhausted, so no reader sees the same line twice
    // while any fresh one remains.
    const used = {};
    const take = (key, pool, hash, n) => {
      const set = used[key] || (used[key] = new Set());
      let avail = pool.filter((x) => !set.has(x));
      if (avail.length < n) {
        set.clear();
        avail = pool.slice();
      }
      const chosen = chooseN(avail, hash, n);
      chosen.forEach((x) => set.add(x));
      return chosen;
    };
    return list.map((target, i) => buildGuidance(me, target, labels, i, take));
  }

  const CommsGuidance = { buildGuidance, buildAllGuidance, meBlendLabel, meDims };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CommsGuidance;
  } else {
    global.CommsGuidance = CommsGuidance;
  }
})(typeof window !== "undefined" ? window : globalThis);
