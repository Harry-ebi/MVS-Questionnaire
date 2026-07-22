/**
 * commsGuidance.js
 * -----------------------------------------------------------------------
 * Generates the "communicating across different priorities" guidance.
 *
 * Written to read like an executive coach, and — importantly — to feel
 * freshly written for each pairing rather than reused. It draws on large,
 * hand-written pools of complete, second-person, actionable coaching
 * sentences (one set per priority: Drive / Connection / Clarity), each
 * framed around a different everyday situation — giving feedback, running
 * a meeting, handling disagreement, asking for help, influencing a
 * decision, explaining a change, working under pressure, setting
 * expectations — and using varied imagery so the same behavioural point
 * lands a different way each time.
 *
 * The behavioural model is unchanged: these sentences express exactly the
 * communication preferences, strengths and risks defined in content.js.
 * Selection is a deterministic hash of BOTH the reader's pattern and the
 * target — so a Drive reader's "Clarity" card and a Connection reader's
 * "Clarity" card draw different lines — and within any one reader's set a
 * sentence is never repeated while a fresh one remains. No randomness.
 *
 * The reader's own strengths and risks are shown in the "Your result, in a
 * nutshell" overview at the top of the guide page, so nothing from the
 * model is lost by making the cards pure coaching.
 * -----------------------------------------------------------------------
 */

(function (global) {
  "use strict";

  // ---- deterministic helpers -----------------------------------------
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
  // A stable 0–6 rank for the reader's pattern (3 single + 3 dual + balanced).
  // Used to start each reader in a different region of the sentence pools, so
  // the same target's card reads differently from reader to reader.
  function readerRank(meD) {
    const order = CONTENT.dimensionOrder;
    if (meD.length >= 3) return 6;
    if (meD.length === 1) return order.indexOf(meD[0]);
    const lo = Math.min(order.indexOf(meD[0]), order.indexOf(meD[1]));
    const hi = Math.max(order.indexOf(meD[0]), order.indexOf(meD[1]));
    if (lo === 0 && hi === 1) return 3;
    if (lo === 0 && hi === 2) return 4;
    return 5;
  }

  // ---- the coaching library ------------------------------------------
  // MEETING[dim]: advice for communicating WITH someone who leads on that
  // priority. Each line stands alone, is framed around a different everyday
  // situation, and avoids reusing the same imagery.
  const MEETING = {
    drive: [
      "Open with your conclusion. They'll happily rewind for the detail once they know where you've landed — but make them wait for the point and their attention is already gone.",
      "In a meeting, they're tracking one thing: are we converging or going in circles? Call the progress out loud — 'so we've agreed X, next is Y' — and they'll stay with you.",
      "To win them over to an idea, tie it to a result they already care about. 'This gets us to launch a week sooner' beats three slides of reasoning.",
      "When you give them feedback, be straight and be brief. They would far rather hear 'that landed badly, here's why' than watch you tiptoe around it.",
      "Need something from them? Ask plainly and say when you need it by. A vague, open-ended request drifts quietly to the bottom of their pile.",
      "Disagree with them to their face. They read hedging as either weakness or manoeuvring, whereas a clean 'I see it differently, and here's why' earns real respect.",
      "Selling them a change? Lead with what it unblocks. They'll forgive a lot of disruption if it clearly moves things forward.",
      "Under pressure they speed up rather than slow down. Match the tempo, keep your updates to headlines, and save the nuance for once the fire is out.",
      "Nail down the 'what' and the 'by when' before anyone leaves. To them, an action with no owner and no date is an action that won't happen.",
      "They decide first and refine later, which can look reckless from outside. Give them a clear recommendation to react to, not a menu to weigh up.",
      "Hand them the goal, not the method. Prescribe every step and you'll irritate them; give them the outcome and a deadline and they'll often surprise you.",
      "If you need them to ease off the accelerator, don't ask — show them the cost of speed. 'Ship today and we redo it Friday' works where 'let's be careful' won't.",
      "Keep written notes to them short and top-loaded: the ask in the first line, the background underneath for anyone who wants it.",
      "If you have to offer options, offer your steer alongside them. They don't want a shortlist to evaluate; they want a recommendation to push against.",
      "A quiet objection will sail straight past them. If something matters, say it plainly and early — subtlety is simply wasted here.",
      "Leave with a decision or a next step every time. An unresolved thread nags at them in a way it may not nag at you.",
      "In a one-to-one, skip the throat-clearing. Bring your top item first and you'll have their full focus; save the small talk for people who actually want it.",
      "If you have to say no, say it fast and give the reason in a line. A slow, cushioned no reads as a maybe and wastes everyone's afternoon.",
      "Status updates land best as deltas: what's changed, what's blocked, what's next. Spare them the full history unless they ask for it.",
      "Brainstorming with them, separate the 'generate' from the 'decide' out loud — otherwise they'll try to close the first idea before the second one turns up.",
      "Negotiating, put your real position early. They respect a clear opening line far more than a slow reveal, and they'll tell you straight if it won't fly.",
      "They measure a meeting in decisions made. If yours is for alignment rather than action, flag it up front, or they'll spend the hour hunting for the point.",
    ],
    connection: [
      "Start with the person, not the task. Thirty seconds of genuine 'how are you' isn't a warm-up act — it's the ground the rest of the conversation stands on.",
      "In a meeting they're reading the room as much as the agenda. Notice who hasn't spoken and bring them in; do that and you've earned the connector's trust for good.",
      "To bring them onside, show who benefits. An argument that's all logic and no people will feel cold to them, however watertight it is.",
      "Delivering hard feedback? Anchor it in the fact that you're on their side. They can absorb almost anything once they're sure it isn't an ambush.",
      "When you need their help, let them see that it matters to you personally. They'll move mountains for a person and barely lift a finger for a task.",
      "Their 'yes' isn't always a yes. If they agree a shade too readily or go quiet, there's usually an unspoken worry — coax it out before you press on.",
      "Explaining a change, lead with the human side: who's affected, and how you'll look after them. The logistics matter far less than the care.",
      "Under pressure they'll try to hold everyone together, sometimes at their own cost. Check that they're actually okay, and don't mistake their calm for having no needs.",
      "Frame expectations as a shared agreement rather than an instruction. 'Can we agree that…' travels much further with them than 'I need you to…'.",
      "Loop them in early. Being asked beforehand means far more to them than being told afterwards, even when the answer would have been the same either way.",
      "Mind the tone of your messages. A terse, context-free line can read as irritation to them when none was meant — a warm opening line resets the whole thing.",
      "If a difficult conversation is looming, they'll want to smooth it over. Make it safe to be direct, and reassure them that naming a problem isn't the same as causing one.",
      "They notice effort and remember kindness. A specific, sincere thank-you lands with them far more than a public round of applause.",
      "Made a call they weren't part of? Tell them your reasoning and who you weighed up. Being seen to have thought about people repairs a great deal.",
      "If you need to move quickly, take them with you rather than past them. A quick 'here's the plan — does this sit right with you?' stops them digging in.",
      "They'll voice the concern nobody else will say out loud. Treat that as a gift rather than a delay.",
      "In a one-to-one, ask about them before the work. It isn't indulgence — it's the difference between a check-in they open up in and one they simply perform.",
      "If you have to say no, protect the relationship as you do it. 'I can't take this on, but here's how I can help instead' keeps the door open.",
      "In a status update, mention the people as much as the progress — who pitched in, who's stretched thin. That's the part they'll actually carry away.",
      "Brainstorming works best when you make it safe to be half-formed. They'll sit on a good idea rather than risk looking foolish in front of the group.",
      "Negotiating, they'll give ground to keep things warm. Don't take advantage of that; name it, and make sure the deal is one they'll still feel good about next week.",
      "They read as much into how you say it as what you say. A rushed tone can undo a generous message, so slow down for the ones that count.",
    ],
    clarity: [
      "Show your reasoning before your conclusion. A firm answer with no visible logic behind it makes them uneasy, even when it happens to be the right one.",
      "In a meeting they want the shape of the thing up front. Put the aim and the agenda on the table early and they'll lean in; improvise and they'll quietly check out.",
      "To persuade them, hand over the workings, not just the result. They're far more moved by a path they can trace than by how sure you sound.",
      "Make feedback specific and evidenced. 'This slide lost me here, for this reason' lands cleanly; 'it felt a bit off' just leaves them hunting for what you meant.",
      "Ask them precisely. A crisp, well-scoped request gets a quick answer; a fuzzy one gets a round of clarifying questions first.",
      "When they challenge you it's usually a question, not a refusal. 'Why this and not that?' means they're engaging — so answer it rather than defend against it.",
      "Explaining a change, show your working. 'Because it's urgent' or 'because I said so' meets a wall; the reasoning behind it opens the door.",
      "Under pressure they want structure, not speed. A quick framework — 'here are the three things that matter' — steadies them more than any rallying cry.",
      "Spell out what 'good' looks like in advance. Ambiguity doesn't nudge them to improvise; it nudges them to stall.",
      "Give them thinking time. Press for an answer in the room and you'll get their cautious one; give them the evening and you'll get their real one.",
      "In writing, structure buys their attention: the ask, then the reasoning, then the detail. A wall of text with the point buried in the middle goes unread.",
      "Get ahead of their questions. Name the obvious gap yourself and they'll relax; leave it for them to find and they'll wonder what else you missed.",
      "Changing course? Walk them from the old logic to the new. A reversal with no explanation reads to them as randomness, not agility.",
      "Don't mistake their caution for obstruction. They're stress-testing the idea — which is precisely the thing you'll be grateful for later.",
      "When you need to move and they need to check, meet in the middle: decide now, and name what you'll verify before it becomes irreversible.",
      "Be accurate rather than impressive. One figure that doesn't add up costs you more of their trust than ten that quietly do.",
      "In a one-to-one, come with a rough agenda at least. Unstructured time reads to them as unprepared, and they'll spend it wondering what you actually wanted.",
      "If you have to say no, give them the criteria behind it. 'It doesn't clear the bar because of X' satisfies them where a flat no just invites the follow-up.",
      "Status updates land when they're structured: on track, at risk, or blocked, with the reason attached. A breezy 'all good' makes them trust the report less, not more.",
      "Brainstorming, they'll want a frame before they'll freewheel. Give them the constraints and the goal and they'll fill the space; leave it wide open and they'll go quiet.",
      "Negotiating, they'll want the logic of your offer, not just the number. Show why it's fair and you'll spend far less time haggling over whether it is.",
      "They'd far rather you flag the risk than bury it. 'Here's what could go wrong, and here's the plan' builds more confidence than a tidy story that ignores the obvious.",
    ],
  };

  // SHARED[dim]: you and they both lead here — give the pairing a personality,
  // name the easy rapport, then the shared blind spot.
  const SHARED = {
    drive: [
      "This is the sort of partnership that gets a lot done before lunch. The catch is that speed can feel like agreement — every so often, check you're both racing toward the same finish line.",
      "You'll rarely be the one telling the other to hurry up, which is a relief. The flip side: nobody's naturally playing 'hang on, should we?', so take it in turns.",
      "Two decisive people can turn a maybe into a done in minutes. Just make sure the maybe didn't deserve a little more thought before you buried it.",
      "You'll finish each other's sentences and each other's to-do lists. Guard against the momentum carrying you both past a detail that later turns out to matter.",
      "The energy is genuinely productive — right until you each assume the other checked the thing neither of you checked. Say out loud who owns what.",
      "Left to run, two of you will optimise for pace and quietly deprioritise whoever's caught in the middle. Keep one question on the table: who does this land on?",
      "Two people who'd both rather act than deliberate will clear a backlog fast — and occasionally clear away something that was load-bearing. Once a week, ask what you've dropped on purpose versus by accident.",
      "Neither of you will be the brake, so the car moves quickly. Appoint one anyway for the decisions that are hard to undo, even if it's only for that single meeting.",
      "You share a low tolerance for going round in circles, which keeps things short. The risk is calling something 'decided' when it was really just the last thing anyone said.",
      "Momentum is your shared currency and it compounds nicely. Spend a little of it, now and then, on the question you're both tempted to skip: are we even sure this is the right hill?",
    ],
    connection: [
      "You'll understand each other almost before you speak, and the relationship will feel warm and easy. The risk is that you both work so hard to keep it that way the honest conversation never quite happens.",
      "This is a partnership where everyone feels heard — which is lovely. The blind spot is the unpopular decision you're each quietly hoping the other will make.",
      "You'll read each other's moods effortlessly and protect each other on instinct. Just agree, early, that raising a hard truth is a form of loyalty here, not a breach of it.",
      "Neither of you will steamroll the other, which makes for civilised disagreements — and occasionally for disagreements that never actually resolve. Force the point sometimes.",
      "You'll both spot when someone's struggling and pick up the slack without being asked. Watch that the slack you keep absorbing doesn't become a permanent second job for you both.",
      "The warmth is real and worth protecting. But 'keeping the peace' can slide into avoiding the issue — give each other explicit permission to be blunt when it counts.",
      "You'll each go out of your way to make the other feel valued, which is rare and worth having. The quiet cost is that the thing that needs saying can wait weeks for a moment that never feels kind enough.",
      "Two people this attuned to how everyone's doing rarely leave anyone behind. Just check that your shared reluctance to rock the boat isn't letting a real problem drift downstream.",
      "Harmony comes naturally to you both, which is a genuine strength on a fractious team. Guard against the version where the hard call keeps getting deferred to spare each other's feelings.",
      "You'll instinctively protect each other, which makes this a generous place to work. The trap is a politeness so mutual that neither of you ever says the plainly useful thing.",
    ],
    clarity: [
      "You'll enjoy getting it right together — the reasoning will be tight and the plan will hold. The danger is that 'right' has no natural stopping point, so decide up front when you'll call it done.",
      "Neither of you enjoys hand-waving, which is refreshing — until you analyse each other into a corner where the safe move is always one more check.",
      "This is a partnership that rarely ships something half-baked. It's also one that can polish a good decision into a late one, so put a clock on the thinking.",
      "You'll trust each other's rigour, which lets you move fast on what you've both examined. Just watch for shared certainty: two careful people can be confidently wrong together.",
      "Expect thorough, well-argued disagreements — and the odd standoff where you're both waiting on evidence that isn't coming. Agree what 'enough to decide' looks like.",
      "You'll both want the full picture before committing, which is useful until 'the full picture' becomes a moving target. Name the two or three things that actually change the call.",
      "You'll both want the logic to hold, so what you build tends to survive contact with reality. The trap is treating every decision as if it deserves the same depth of scrutiny — some plainly don't.",
      "Neither of you is satisfied by 'trust me', which makes for honest, well-tested work. It also makes for the occasional loop where you're each waiting on a certainty the situation will never supply.",
      "You share a respect for getting the details right, and it shows in what you ship. Watch for the day 'right' quietly becomes 'perfect', and the deadline turns into the thing that gives.",
      "Two careful thinkers can pressure-test an idea beautifully — or talk each other out of a good-enough answer chasing a flawless one. Settle in advance on what would count as good enough.",
    ],
  };

  // GAP[dim]: you lead differently from them — coaching the stretch toward
  // what this person needs. Used when you don't share their priority.
  const GAP = {
    drive: [
      "Their pace won't be your natural setting, which is exactly why it's worth matching here. Decide out loud, and let yourself refine on the move rather than before you start.",
      "Where your instinct is to add nuance, theirs is to want the headline. Give them the bottom line first — you can layer the subtlety back in once they know where you're heading.",
      "You may feel pushed to commit before you're ready. Offer a clear direction you can adjust rather than a careful 'it depends' — direction is the courtesy they're after.",
      "You might want consensus where they want a call. In the moment, be willing to make it and revisit later; for them, a decision you can improve beats a delay you can't.",
      "Their bluntness isn't coldness, and you needn't soften yours to meet it. Say the thing cleanly and they'll trust you more for it.",
      "Skipping the build-up can feel abrupt to you. To them it's respect for their time — the context you'd normally open with is welcome, just not first.",
      "Their instinct is to move before it's tidy; yours is to tidy first. Meet them by naming a direction out loud, then straightening up as you go rather than beforehand.",
      "You'll want to weigh the options; they'll want the recommendation. Hand them your best call as a starting point and let them argue it — that's the conversation they're actually after.",
      "What feels like healthy caution to you can feel like drag to them. Show them you'll move fast on what's clear, and reserve your reservations for the parts that genuinely aren't.",
      "They'd rather have a decision to improve than a discussion to prolong. Give them something concrete to push against and you'll find them far easier to work alongside.",
    ],
    connection: [
      "The opening chat can feel like a detour when you're keen to get on. For them it's the on-ramp — skip it and the rest of the conversation runs uphill.",
      "You may be ready to talk task while they're still taking the temperature of the room. Let them; a minute on the human side buys you a far smoother hour.",
      "Where you'd send the bare ask, add a line of who and why. It costs you a sentence and completely changes how the message lands.",
      "Their instinct to involve people can feel slow when you can already see the answer. Bring them along rather than presenting the finished thing — being consulted is most of what they want.",
      "You might read their diplomacy as indecision. Usually it isn't; it's them making sure the decision won't quietly cost someone. Ask them who they're worried about.",
      "Getting straight to business can register as brusque even when you don't mean it. A warmer opener isn't wasted time — it's what makes them go the extra mile for you.",
      "You may be ready to crack on while they're still checking everyone's on board. That pause isn't inefficiency — it's them heading off the resentment you'd otherwise inherit later.",
      "Their warmth can read as softness if you're wired for pace. It usually isn't; it's a wider field of view that takes in the people your plan will land on. Ask who they've got in mind.",
      "You might want the decision made; they'll want it made together. Fold them into the how, not just the what, and they'll carry it further than you could ever push it.",
      "What looks like fussing over feelings is often them protecting the working relationship you'll both need next month. Treat the care as strategy, because for them it is.",
    ],
    clarity: [
      "Showing all your working can feel like overkill when you can already see the answer. To them, the workings are the answer — the conclusion alone won't move them.",
      "You may be ready to decide before they're ready to agree. Give them the structure and a beat to think, and you'll spend far less time relitigating it later.",
      "Your confidence won't carry them on its own; they want the path, not just the destination. Walk them along it and the doubt tends to dissolve.",
      "Where you'd move on, they'll want to close the loose end. Naming the gap yourself, before they find it, earns you a surprising amount of trust.",
      "Their questions can feel like foot-dragging when you're keen to go. Reframe them as free quality control — what they catch now is what you'd otherwise fix later.",
      "You might be happy with 'good enough for now'; they'll want to know why it's good enough. Spell out the reasoning and 'for now' becomes something they can back.",
      "You can see where this ends; they need to see how you got there. Lay out the steps, even the ones that feel obvious, and their hesitation tends to melt away.",
      "Where you're comfortable with 'roughly right', they'll want it nailed down. Give them the logic up front and you'll spare yourself three rounds of follow-up questions.",
      "Their appetite for detail can feel like a handbrake when you're ready to go. Treat it as insurance — the gap they close now is the one that would have bitten you later.",
      "You might be content to decide and adjust; they'll want to know the decision holds. Show them what you've already stress-tested and they'll move with you far more readily.",
    ],
  };

  // Two-priority target — intro lines (label slots), each with its own flavour.
  const BLEND_INTRO = [
    "This is someone who genuinely holds {a} and {b} at once — satisfy one instinct and you can still leave the other cold, so you'll need to speak to both.",
    "They carry {a} and {b} together, which makes them harder to read and more rewarding to get right. Notice which of the two is leading today.",
    "A real blend of {a} and {b}: the trick is spotting which hat they're wearing in this conversation, and making sure the other still gets a nod.",
    "With {a} and {b} both in play, the thing that wins on one front can lose on the other. Cover both — leading with whichever matters most right now.",
    "They flex between {a} and {b} depending on what the moment needs. Meet the register they're actually in, not the one you'd default to.",
    "Two priorities in one person: {a} and {b}. Lead with whichever is louder today, but don't let the quieter one feel ignored.",
    "Two priorities live side by side in this person: {a} and {b}. Win only one and you've done half the job — keep an eye on both as the conversation moves.",
    "They're a true mix of {a} and {b}, and which one surfaces depends on the moment. Read the moment first, then pitch to the priority that's actually in the room.",
    "Expect {a} and {b} in the same breath. What satisfies the first can rub the second the wrong way, so watch their reaction and be ready to change gear mid-conversation.",
    "This is a {a}-and-{b} blend, not one wearing the other as a disguise. Give each its due, and lead with the one the situation is asking for right now.",
  ];

  // Balanced target — flexes across all three.
  const BALANCED = [
    "They move fluidly between all three registers, so open with a little of each — the point, the people, and the reasoning — and follow whichever one they pick up.",
    "The worst assumption with them is that they're 'like you'. Read which mode they're in today rather than defaulting to your own home turf.",
    "Their gift is adaptability: they'll meet you halfway on almost anything, as long as you're clear about what this conversation actually needs from them.",
    "Because they can flex, they'll often mirror what you bring. Come with your best register and they'll rise to it; come with your worst and they'll quietly match that too.",
    "Don't be lulled by how easy they are to talk to — easy to talk to isn't the same as agreeing with you. Look for the concern behind the accommodation.",
    "With someone this balanced, the question isn't which button to press but which one the situation calls for. Diagnose first, then adjust.",
    "They can meet you in any register, which is a gift and a trap: the ease of the conversation tells you nothing about whether they're on board. Listen past the accommodation.",
    "Because they flex to fit, they'll often hand you back your own energy. Bring clarity and they'll be clear; bring vagueness and they'll drift with you — so set the tone on purpose.",
    "With someone who holds all three in balance, the skill is diagnosis, not default. Ask what this particular conversation needs — the point, the people, or the proof — and lead there.",
    "They're comfortable across the board, so they won't fight your framing — which means the rigour they'd otherwise force out of you is now yours to supply. Come ready to make your own case airtight.",
  ];

  /**
   * Build one card: { heading, dims, note: [paragraph, ...] }.
   */
  function buildGuidance(me, target, labels, seed, take) {
    const meD = meDims(me);
    const themD = targetDims(target);
    const overlap = meD.filter((d) => themD.indexOf(d) !== -1);
    const label = targetLabel(target, labels);
    if (!take) take = (key, pool, hash, n) => chooseN(pool, hash, n);

    // Hash of BOTH the reader's pattern and the target, so a given target's
    // card reads differently for different readers.
    let h = typeof seed === "number" ? seed : 0;
    meD.forEach((d) => {
      h = h * 37 + CONTENT.dimensionOrder.indexOf(d) + 3;
    });
    themD.forEach((d) => {
      h = h * 31 + CONTENT.dimensionOrder.indexOf(d) + 7;
    });
    const mix = (salt) => Math.abs(h * 131 + salt * 977 + 17);
    // Start meeting-pool selection in a reader-specific window (rank * 3), so
    // e.g. every reader's "Clarity" card draws from a different part of the
    // Clarity pool. Within a reader, `take` still prevents repeats.
    const rank = readerRank(meD);
    const meetHash = (salt) => rank * 2 + salt * 5;
    // Structure varies by card position AND reader, so the shape isn't the
    // same for a given target across every reader.
    const pos =
      (typeof seed === "number" ? seed : 0) +
      meD.reduce((a, d) => a + CONTENT.dimensionOrder.indexOf(d), 0) * 2;

    const dynamic = overlap.length
      ? take("shared_" + overlap[0], SHARED[overlap[0]], mix(5), 1)[0]
      : (function () {
          const gd = themD.length > 2 ? themD[Math.abs(h) % 3] : themD[0];
          return take("gap_" + gd, GAP[gd], mix(5), 1)[0];
        })();

    let note;
    if (themD.length === 1) {
      const meet = take("meet_" + themD[0], MEETING[themD[0]], meetHash(0), 2);
      const shape = pos % 4;
      if (shape === 0) note = [meet[0] + " " + meet[1], dynamic];
      else if (shape === 1) note = [dynamic + " " + meet[0]];
      else if (shape === 2) note = [meet[0], meet[1] + " " + dynamic];
      else note = [meet[0] + " " + dynamic, meet[1]];
    } else if (themD.length >= 3) {
      const b = take("balanced", BALANCED, mix(1), 2);
      const shape = pos % 2;
      note = shape === 0 ? [b[0] + " " + b[1], dynamic] : [b[0], b[1] + " " + dynamic];
    } else {
      const intro = take("blendintro", BLEND_INTRO, mix(4), 1)[0]
        .replace("{a}", labels[themD[0]])
        .replace("{b}", labels[themD[1]]);
      const m1 = take("meet_" + themD[0], MEETING[themD[0]], meetHash(1), 1)[0];
      const m2 = take("meet_" + themD[1], MEETING[themD[1]], meetHash(2), 1)[0];
      const shape = pos % 3;
      if (shape === 0) note = [intro, m1 + " " + m2, dynamic];
      else if (shape === 1) note = [intro + " " + m1, m2 + " " + dynamic];
      else note = [m1 + " " + m2, intro + " " + dynamic];
    }

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
    // Coordinate across the whole set: a sentence isn't reused until its
    // pool is exhausted, so no reader sees the same line twice.
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
