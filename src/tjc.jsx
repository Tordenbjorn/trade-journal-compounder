import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// Palette: Hyperion personal pack. Warm grey paper, near-black blue ink, muted bronze accent.
const C = {
  paper: "#ECE9E2",
  card: "#F6F4EF",
  ink: "#171C26",
  mutedInk: "#5D6470",
  hairline: "rgba(23,28,38,0.14)",
  bronze: "#A5804C",
  brick: "#8A3B2E",
  green: "#3E5C46",
  level: "#5E8A96",
};

const MONO = "'IBM Plex Mono', monospace";
const monoNum = { fontFamily: MONO, fontVariantNumeric: "tabular-nums" };

const GRADES = ["A", "B", "C", "D"];
const GRADE_TIPS = {
  A: "A: all conditions present, the grade that justifies larger size",
  B: "B: standard conditions met, normal size",
  C: "C: marginal, a small probe position at most",
  D: "D: pass, do not trade it",
};
const gradeColor = (g) =>
  g === "A" ? C.bronze : g === "B" ? C.ink : g === "C" ? C.mutedInk : C.brick;

const rankColor = (r) => (r === "take" ? C.green : r === "ok" ? C.bronze : C.brick);
const rankLabel = (r) => (r === "take" ? "take" : r === "ok" ? "second choice" : "pass");

// Pre-trade protocol: bias, day frame, trigger, management.
const CHECKLIST = [
  { id: "macro", stage: "Bias", label: "Macro context framed: cycle phase, Fed lens, positioning" },
  { id: "profile", stage: "Bias", label: "Profile zones marked: acceleration and reaction levels" },
  { id: "heatmap", stage: "Bias", label: "Heatmap read: magnets nearby, fresh large orders noted" },
  { id: "gex", stage: "Bias", label: "Net gamma read: positive favours mean reversion, negative favours trend" },
  { id: "daytype", stage: "Day frame", label: "Day type called: trend following or mean reversion" },
  { id: "zone", stage: "Day frame", label: "Zone defined: aggression for continuation, or failed auction and business zone" },
  { id: "trigger", stage: "Trigger", label: "Trigger present: initiative, absorption, path of least resistance, or exhaustion" },
  { id: "effort", stage: "Trigger", label: "Effort versus result supports the direction" },
  { id: "exit", stage: "Management", label: "Exit plan set: trail behind aggression zones, or fixed target at the contrarian zone" },
];
const STAGES = ["Bias", "Day frame", "Trigger", "Management"];

// Chart quality playbook: what separates the tradeable variant from the lookalikes.
const PLAYBOOK = [
  {
    id: "orb",
    layers: { gate: "session", frame: "continuation", trigger: "flow", stop: "range" },
    name: "Opening range break",
    group: "setup",
    source: "Lance",
    principle:
      "The open is where overnight information reprices and everyone decides at once whether the new range is too high, too low or just right. The first 30 minutes compress that repricing into a range, wick to wick, and the break of it on an in-play name is acceptance of new prices turning into trend. Three contexts pay best: the exhaustion gap that fails its range after a vertical run, day-one catalyst continuation while institutions are still scaling in, and macro fear or euphoria days when everyone watches the same level and the move feeds itself.",
    exit:
      "Enter on the confirmed break with volume expansion, stop back inside the range. The failed break is the reverse trade, not a reason to re-enter the same way. Attempt limits, day stop and sizing per the Risk tab; repeated re-entries after failures destroy the edge.",
    variants: [
      {
        label: "A",
        rank: "take",
        note: "Exhaustion gap after a vertical run fails the range: trapped longs, waterfall",
        chart: {
          level: { y: 27, x1: 33, x2: 78 },
          bars: [
            [10, 70, 14, "g"], [18, 58, 14, "g"], [26, 44, 16, "g"], [36, 20, 6, "g"],
            [43, 22, 5, "r"], [50, 21, 5, "g"], [57, 23, 5, "r"], [64, 30, 14, "r"],
            [72, 44, 18, "r"],
          ],
          rings: [[68, 32]],
        },
      },
      {
        label: "B",
        rank: "take",
        note: "Day-one catalyst gap consolidates, breaks higher: the launchpad",
        chart: {
          level: { y: 42, x1: 31, x2: 76 },
          bars: [
            [10, 74, 10, "g"], [17, 72, 9, "r"], [24, 73, 9, "g"], [34, 46, 10, "g"],
            [41, 48, 7, "r"], [48, 46, 7, "g"], [55, 47, 6, "r"], [62, 36, 12, "g"],
            [70, 24, 16, "g"],
          ],
          rings: [[66, 38]],
        },
      },
      {
        label: "C",
        rank: "pass",
        note: "No catalyst, no fuel: the break drifts and chops back",
        chart: {
          level: { y: 50, x1: 10, x2: 90 },
          bars: [
            [14, 46, 8, "g"], [22, 52, 8, "r"], [30, 47, 7, "g"], [38, 53, 8, "r"],
            [46, 48, 7, "g"], [54, 54, 7, "r"], [62, 45, 6, "g"],
          ],
          rings: [[72, 48]],
        },
      },
    ],
    quality: [
      { id: "q1", label: "In play: catalyst, exceptional volume, real participation. The range needs fuel" },
      { id: "q2", label: "Clean consolidation inside the range: orderly, not noisy chop" },
      { id: "q3", label: "Volume expands on the break: institutional footprints, not a drift through" },
      { id: "q4", label: "Market context aligned: the break trades with the tape, not into a steady counter-trend" },
      { id: "q5", label: "Range defined wick to wick and the level obvious to everyone watching" },
    ],
    flags: [
      { id: "f1", label: "Inactive ticker, no catalyst: random movement and accumulating costs, whatever the pattern looks like" },
      { id: "f2", label: "Weak volume poke through the level: the failure may be the better trade" },
      { id: "f3", label: "Predicting the break before it confirms: entries in the middle of the range, away from any level" },
      { id: "f4", label: "Re-entering the same way after a failed break: emotional repetition, not a setup" },
    ],
  },
  {
    id: "capfade",
    name: "Capitulation fade",
    group: "setup",
    source: "Lance",
    ready: true,
    principle:
      "Capitulation is emotion, margin calls and offside positioning producing one final exhaustion move; the trade is the right side of the V after the turn, never the fall or the rise itself. Ten variables identify it and they stack: the more that align, the higher the grade, and the setup scores on a spectrum rather than a switch. Nearly everything is efficient; this is the rare case where price has divorced from value, so most candidates fail and the correct answer is usually no trade.",
    layers: { gate: "reversal", frame: "reversal", trigger: "turn", stop: "exact-extreme" },
    execution: {
      entryV1:
        "v1 test, daily bars, mechanical: the turn is the next day trading through the climax day's extreme (below its low after a blow-off top for a short, above its high after a flush for a long). Enter on that break, in that session.",
      entryBook:
        "Discretionary book: the intraday turn, any of a trendline break of the final leg, a prior bar extreme broken, an intraday capitulation turn, or the forced buyer or seller breaking on the tape. The right side of the V, never the fall.",
      stop:
        "Beyond the climax bar's extreme, exact, resting from fill: a new extreme means the climax was not the climax. Width is logged in ATR. The 1 ADTR skip does not apply to this card; the reward floor does.",
      target:
        "The 20-day average (or the band midline) is the reward, measured before entry and at least 2R from it. Half off halfway back to the average, the remainder at the average or trailed on prior bar extremes while the position keeps scoring. After several legs the retracement of the whole move is on the table.",
      time:
        "One to two days expected. Beyond five days only while the trade keeps earning points, with the remainder on a trailing stop. Sell or cover into the counter-flushes.",
      sides:
        "Long and short are judged separately: if only one side carries expectancy, that is where the edge lives. Re-entry after a stop-out when the turn re-forms, twice at most.",
    },
    variants: [
      {
        label: "A",
        rank: "take",
        note: "Bars accelerate into the extreme on climax volume, far from the average, then the turn",
        chart: {
          level: { y: 30, x1: 8, x2: 92 },
          bars: [
            [10, 20, 8, "r"], [18, 26, 9, "r"], [26, 33, 11, "r"], [34, 42, 14, "r"],
            [42, 54, 18, "r"], [50, 68, 24, "r"], [60, 70, 22, "g"], [70, 52, 18, "g"],
          ],
          rings: [[60, 80]],
        },
      },
      {
        label: "B",
        rank: "pass",
        note: "Linear grind at a constant slope: the sustainable kind of move, never faded",
        chart: {
          level: { y: 24, x1: 8, x2: 92 },
          bars: [
            [10, 26, 9, "r"], [18, 33, 9, "r"], [26, 40, 9, "r"], [34, 47, 9, "r"],
            [42, 54, 9, "r"], [50, 61, 9, "r"], [58, 68, 9, "r"],
          ],
          rings: [[68, 74]],
        },
      },
      {
        label: "C",
        rank: "pass",
        note: "Day one of fresh news, first leg out of a range: repricing, not exhaustion",
        chart: {
          level: { y: 46, x1: 8, x2: 60 },
          bars: [
            [10, 40, 8, "g"], [18, 42, 8, "r"], [26, 40, 8, "g"], [34, 43, 8, "r"],
            [44, 58, 18, "r"], [52, 64, 10, "r"],
          ],
          rings: [[60, 68]],
        },
      },
    ],
    quality: [
      { id: "v1", label: "V1 Acceleration: the slope steepens into the extreme (the asymptote shape); a linear move is the sustainable kind and is never faded. Measured as the slope of the last 3 to 5 days against the prior two weeks" },
      { id: "v2", label: "V2 Multiple days in the same direction, three or more; up, down, up, down is not a waterfall" },
      { id: "v3", label: "V3 Far outside the Bollinger band and far from the 20-day average: that distance to equilibrium is the reward. Measured one of three ways, chosen in the build period: standard deviations from the 20-day, ATRs from the 50-day (10 starts the trimming, 15 is climax), or the 3 to 5 day move in units of the stock's own volatility" },
      { id: "v4", label: "V4 No fresh news driving this leg: the move is days past its catalyst and running on price alone" },
      { id: "v5", label: "V5 Volume multiples above average, ideally one bar that dwarfs the rest; morning volume already multiples of the prior day's elevated morning" },
      { id: "v6", label: "V6 Several legs in the same direction: on the third leg the chasers arrive and the reward becomes the whole move, not the last leg" },
      { id: "v7", label: "V7 Minimal consolidation during the move: no price acceptance on the way" },
      { id: "v8", label: "V8 Extreme sentiment in print: uninvestable, new paradigm, cheap at any price, cannot afford to miss it" },
      { id: "v9", label: "V9 Boring instrument: large cap, diversified, a metal, an index. Value does not halve over a weekend; narrative does" },
      { id: "v10", label: "V10 Market structure magnifying the move: margin hikes, forced liquidation, a forced buyer or seller visible on the tape" },
      { id: "v11", label: "V11 Location: the climax prints at a level (a prior swing extreme, a range edge, a 52-week extreme) with at least 2R of room back to the 20-day average. Every trade needs an address, a fade included" },
    ],
    flags: [
      { id: "f1", label: "Day one of fresh news: a fundamental repricing, and mean reversion bets that the old equilibrium was right" },
      { id: "f2", label: "First leg out of a range: a breakout, not an exhaustion; the crowd still wants that pullback" },
      { id: "f3", label: "Linear slope with no acceleration: steady moves are the sustainable ones" },
      { id: "f4", label: "Low-quality instrument on the long side: a microcap biotech or a memecoin has no equilibrium to return to" },
      { id: "f5", label: "Not in play: no volume, no range, no emotion" },
    ],
  },
  {
    id: "breakout",
    layers: { gate: "filter", frame: "continuation", trigger: "candle", stop: "structural" },
    source: "Lance",
    name: "Breakout long",
    principle:
      "Drive higher, tighten under a clean level that every timeframe can see, then break while everyone is watching the same line.",
    variants: [
      {
        label: "A",
        rank: "take",
        note: "Tight higher lows under one clean line",
        chart: {
          level: { y: 30, x1: 18, x2: 96 },
          bars: [
            [10, 68, 24, "g"], [18, 50, 26, "g"], [26, 32, 26, "g"], [34, 34, 18, "r"],
            [42, 44, 14, "g"], [50, 36, 12, "r"], [57, 42, 10, "g"], [64, 34, 9, "g"],
            [71, 36, 8, "r"], [78, 32, 7, "g"], [85, 33, 6, "g"],
          ],
          rings: [[92, 26]],
        },
      },
      {
        label: "B",
        rank: "pass",
        note: "Deep pullback, a lower low, then ground covered too fast",
        chart: {
          level: { y: 30, x1: 18, x2: 92 },
          bars: [
            [10, 70, 22, "g"], [18, 48, 26, "g"], [26, 32, 22, "g"], [34, 34, 26, "r"],
            [42, 52, 24, "r"], [50, 68, 20, "r"], [58, 58, 22, "g"], [66, 44, 24, "g"],
            [74, 32, 26, "g"],
          ],
          rings: [[82, 26]],
        },
      },
      {
        label: "C",
        rank: "pass",
        note: "Crosses the level repeatedly in both directions: no clean line to break",
        chart: {
          level: { y: 34, x1: 16, x2: 94 },
          bars: [
            [8, 72, 20, "g"], [16, 54, 22, "g"], [24, 38, 20, "g"], [32, 28, 18, "g"],
            [40, 34, 16, "r"], [48, 24, 16, "g"], [56, 32, 14, "r"], [64, 26, 12, "g"],
            [72, 34, 12, "r"], [80, 28, 10, "g"],
          ],
          rings: [[88, 24]],
        },
      },
    ],
    quality: [
      { id: "q1", label: "Clean opening drive with momentum" },
      { id: "q2", label: "Higher lows tightening into the level" },
      { id: "q3", label: "Level is clean and obvious, one uniform line" },
      { id: "q4", label: "Consolidation stays close to the resistance" },
      { id: "q5", label: "Volume builds at the level" },
    ],
    flags: [
      { id: "f1", label: "Deep pullback or a lower low before the break" },
      { id: "f2", label: "Price chops above and below the level repeatedly" },
      { id: "f3", label: "Covered a lot of ground fast just to reach the level" },
    ],
  },
  {
    id: "trendbreak",
    layers: { gate: "reversal", frame: "reversal", trigger: "turn", stop: "exact-extreme" },
    source: "Lance",
    name: "Trend-break bounce",
    principle:
      "Clean trends beget clean counter-trends; the steadier the fall and the harder the final waterfall, the better the bounce pays.",
    variants: [
      {
        label: "A",
        rank: "ok",
        note: "Clean steady trend, playable on the confirmed turn",
        chart: {
          bars: [
            [10, 10, 14, "r"], [18, 20, 14, "r"], [26, 30, 14, "r"], [34, 40, 14, "r"],
            [42, 50, 14, "r"], [50, 60, 14, "r"], [62, 62, 16, "g"], [70, 48, 18, "g"],
            [78, 34, 18, "g"],
          ],
          rings: [[57, 78]],
        },
      },
      {
        label: "B",
        rank: "pass",
        note: "Grindy, repeated failed bounces on the way down",
        chart: {
          bars: [
            [10, 12, 12, "r"], [17, 24, 10, "r"], [24, 20, 10, "g"], [31, 30, 12, "r"],
            [38, 26, 10, "g"], [45, 38, 12, "r"], [52, 34, 10, "g"], [59, 46, 14, "r"],
            [71, 52, 12, "g"], [79, 40, 14, "g"],
          ],
          rings: [[66, 64]],
        },
      },
      {
        label: "C",
        rank: "take",
        note: "A steady decline that accelerates sharply at the end: the strongest bounce candidate of the three",
        chart: {
          bars: [
            [10, 8, 10, "r"], [18, 16, 11, "r"], [26, 25, 13, "r"], [34, 37, 18, "r"],
            [42, 55, 28, "r"], [55, 62, 26, "g"], [63, 40, 24, "g"],
          ],
          rings: [[50, 86]],
        },
      },
    ],
    quality: [
      { id: "q1", label: "Prior downtrend is clean and orderly" },
      { id: "q2", label: "Rate of fall accelerates sharply at the end" },
      { id: "q3", label: "Move covered enough ground to pay for the bounce" },
      { id: "q4", label: "Turn confirmed: prior bar highs or trendline break" },
    ],
    flags: [
      { id: "f1", label: "Grindy decline with repeated failed bounce attempts" },
      { id: "f2", label: "Entering before any turn confirms" },
    ],
  },
  {
    id: "flush",
    layers: { gate: "reversal", frame: "reversal", trigger: "turn", stop: "exact-extreme" },
    source: "Lance",
    name: "Flush reversal",
    principle:
      "Price expands into the lows, the last longs get flushed below support on heavy volume, then it reverses hard back through.",
    variants: [
      {
        label: "A",
        rank: "pass",
        note: "Acceptance bars shrinking at the lows",
        chart: {
          level: { y: 78, x1: 30, x2: 92 },
          bars: [
            [10, 10, 16, "r"], [18, 26, 18, "r"], [26, 44, 18, "r"], [34, 60, 10, "r"],
            [42, 68, 7, "r"], [50, 70, 5, "g"], [58, 72, 4, "r"], [66, 73, 4, "g"],
          ],
          rings: [[74, 70]],
        },
      },
      {
        label: "B",
        rank: "pass",
        note: "Dojis at support and no bounce at all off it",
        chart: {
          level: { y: 70, x1: 26, x2: 88 },
          bars: [
            [10, 12, 14, "r"], [18, 28, 14, "r"], [26, 44, 12, "r"], [34, 58, 5, "g"],
            [42, 60, 5, "r"], [50, 64, 14, "r"], [58, 60, 12, "g"],
          ],
          rings: [[66, 56]],
        },
      },
      {
        label: "C",
        rank: "take",
        note: "Expansion into the lows, flush, hard reverse: needs the volume",
        chart: {
          level: { y: 66, x1: 24, x2: 84 },
          bars: [
            [10, 10, 12, "r"], [18, 22, 16, "r"], [26, 38, 20, "r"], [34, 44, 10, "g"],
            [42, 50, 24, "r"], [52, 48, 28, "g"],
          ],
          rings: [[60, 42]],
        },
      },
    ],
    quality: [
      { id: "q1", label: "Price expanding into the lows, bars getting bigger" },
      { id: "q2", label: "Failed bounce then flush below the support" },
      { id: "q3", label: "Heavy volume turnover on the flush" },
      { id: "q4", label: "Hard reversal back through the broken level" },
      { id: "q5", label: "Higher timeframe overextended the same way" },
    ],
    flags: [
      { id: "f1", label: "Small price acceptance bars shrinking at the lows" },
      { id: "f2", label: "No bounce attempt at all off the support" },
    ],
  },
  {
    id: "continuation",
    layers: { gate: "filter", frame: "continuation", trigger: "candle", stop: "structural" },
    source: "Lance",
    name: "Continuation long",
    principle:
      "Strength holds near the level: a shallow, light rest close to resistance, enough time to consolidate, then the range break.",
    variants: [
      {
        label: "A",
        rank: "pass",
        note: "Retraced the whole leg, then recovered it quickly: the holders were weak and the base is unreliable",
        chart: {
          level: { y: 26, x1: 20, x2: 92 },
          bars: [
            [10, 72, 22, "g"], [18, 46, 26, "g"], [26, 28, 22, "g"], [34, 32, 26, "r"],
            [42, 56, 24, "r"], [50, 52, 28, "g"], [58, 30, 24, "g"],
          ],
          rings: [[66, 22]],
        },
      },
      {
        label: "B",
        rank: "take",
        note: "Shallow, light rest near the level, then the range break",
        chart: {
          level: { y: 26, x1: 20, x2: 92 },
          bars: [
            [10, 72, 24, "g"], [18, 44, 28, "g"], [26, 28, 20, "g"], [34, 32, 10, "r"],
            [42, 38, 8, "r"], [50, 36, 8, "g"], [57, 32, 8, "g"],
          ],
          rings: [[65, 22]],
        },
      },
      {
        label: "C",
        rank: "pass",
        note: "One deep shakeout bar as the only rest",
        chart: {
          level: { y: 24, x1: 20, x2: 84 },
          bars: [
            [10, 70, 24, "g"], [18, 42, 28, "g"], [26, 26, 20, "g"], [34, 30, 32, "r"],
            [42, 28, 26, "g"],
          ],
          rings: [[50, 20]],
        },
      },
    ],
    quality: [
      { id: "q1", label: "Strong opening drive" },
      { id: "q2", label: "Pullback shallow and light, stays near the level" },
      { id: "q3", label: "Enough time consolidating before the break" },
      { id: "q4", label: "Entry at the range break, not in the middle of the range" },
    ],
    flags: [
      { id: "f1", label: "Retraced most or all of the original leg" },
      { id: "f2", label: "One deep shakeout bar as the only rest" },
    ],
  },
  {
    id: "bouncyball",
    layers: { gate: "session", frame: "continuation", trigger: "candle", stop: "structural" },
    source: "Lance",
    name: "Bouncy ball short",
    principle:
      "Each bounce weaker with lower highs, bars going tight against the floor; the tightness is the selling pressure, and the stop stays close.",
    variants: [
      {
        label: "A",
        rank: "pass",
        note: "Latest bounce stronger and higher: not a bouncy ball",
        chart: {
          level: { y: 56, x1: 8, x2: 90 },
          bars: [
            [10, 8, 16, "r"], [18, 24, 16, "r"], [26, 30, 10, "g"], [34, 32, 14, "r"],
            [42, 26, 18, "g"], [50, 38, 16, "r"],
          ],
          rings: [[58, 60]],
        },
      },
      {
        label: "B",
        rank: "pass",
        note: "One strong bounce, big retrace, not enough rest",
        chart: {
          level: { y: 54, x1: 8, x2: 88 },
          bars: [
            [10, 8, 18, "r"], [18, 26, 20, "r"], [26, 30, 16, "g"], [34, 16, 14, "g"],
            [42, 26, 18, "r"], [50, 42, 10, "r"],
          ],
          rings: [[58, 58]],
        },
      },
      {
        label: "C",
        rank: "take",
        note: "Weaker bounces, lower highs, tight bars into the floor",
        chart: {
          level: { y: 54, x1: 8, x2: 92 },
          bars: [
            [10, 6, 16, "r"], [18, 22, 16, "r"], [26, 26, 10, "g"], [34, 30, 12, "r"],
            [42, 36, 7, "g"], [50, 40, 8, "r"], [58, 44, 4, "g"], [66, 46, 4, "r"],
            [74, 47, 3, "g"],
          ],
          rings: [[82, 58]],
        },
      },
    ],
    quality: [
      { id: "q1", label: "Each bounce weaker, lower highs in sequence" },
      { id: "q2", label: "Bars go tight right against the support" },
      { id: "q3", label: "Leg lower came on news or a clear technical break" },
      { id: "q4", label: "Stop plan tight: trail prior bar highs after the break" },
    ],
    flags: [
      { id: "f1", label: "Latest bounce stronger and higher than the last" },
      { id: "f2", label: "Big retrace of the whole move before the break" },
      { id: "f3", label: "No consolidation relative to the size of the leg" },
    ],
  },
  {
    id: "masurf",
    layers: { gate: "filter", frame: "continuation", trigger: "candle", stop: "structural" },
    source: "Qullamaggie",
    name: "MA surf breakout",
    group: "trend",
    principle:
      "An in-play leader advances in steps while holding the rising 10 and 20 day averages as support; higher lows tighten into the step's resistance, and the entry is the exact moment the next step forms.",
    exit:
      "Stop at the breakout bar's low. Sell a third to half on day three to five, stop to breakeven, then trail the 10 day on fast movers or the 20 day on steadier trends, out on the first close below.",
    variants: [
      {
        label: "A",
        rank: "take",
        note: "Tight higher lows on a rising line, next step breaking",
        chart: {
          tline: { x1: 6, y1: 84, x2: 94, y2: 40 },
          level: { y: 44, x1: 58, x2: 96 },
          bars: [
            [10, 72, 14, "g"], [18, 64, 12, "g"], [26, 68, 8, "r"], [34, 56, 14, "g"],
            [42, 60, 8, "r"], [50, 48, 14, "g"], [58, 52, 8, "r"], [66, 46, 10, "g"],
            [74, 47, 7, "g"], [82, 42, 8, "g"],
          ],
          rings: [[90, 38]],
        },
      },
      {
        label: "B",
        rank: "pass",
        note: "Extended far above the lines: chasing; wait for the next rest on the averages",
        chart: {
          tline: { x1: 6, y1: 82, x2: 82, y2: 62 },
          bars: [
            [12, 70, 12, "g"], [22, 60, 14, "g"], [32, 46, 16, "g"], [42, 30, 18, "g"],
            [52, 16, 16, "g"],
          ],
          rings: [[62, 12]],
        },
      },
      {
        label: "C",
        rank: "pass",
        note: "Flat line with price crossing it repeatedly: no trend to follow",
        chart: {
          tline: { x1: 6, y1: 56, x2: 92, y2: 54 },
          bars: [
            [12, 48, 14, "g"], [20, 52, 12, "r"], [28, 46, 12, "g"], [36, 54, 14, "r"],
            [44, 48, 10, "g"], [52, 56, 12, "r"], [60, 50, 10, "g"],
          ],
          rings: [[70, 52]],
        },
      },
    ],
    quality: [
      { id: "q1", label: "Stock in play and trending: big move, high volume, leader behaviour" },
      { id: "q2", label: "10 and 20 day rising, price holding them as support" },
      { id: "q3", label: "Higher lows tightening into the step's resistance" },
      { id: "q4", label: "Market filter on: daily 10 above 20, both pointing up" },
      { id: "q5", label: "Entry at the step break, stop at the breakout bar's low" },
    ],
    flags: [
      { id: "f1", label: "Price extended far above the lines: the low-risk entry has passed" },
      { id: "f2", label: "Lines flat or intertwined, price crossing them repeatedly" },
      { id: "f3", label: "Market filter off: 10 below 20 or sloping down" },
    ],
  },
  {
    id: "mabreak",
    layers: { gate: "reversal", frame: "reversal", trigger: "turn", stop: "structural" },
    source: "Lance",
    name: "MA break reversal",
    group: "trend",
    principle:
      "A steady decline is capped by the line at every rally attempt; one strong bar breaks and closes through it, the line flips to support, and the retracement pays back the move.",
    exit:
      "In on the break and close through the line after the reversal bar; ride the flip while it holds as support, out on a clean close back below.",
    variants: [
      {
        label: "A",
        rank: "take",
        note: "Decline capped by the line, then a strong bar closes above and flips it to support",
        chart: {
          tline: { x1: 6, y1: 20, x2: 64, y2: 66 },
          bars: [
            [10, 14, 12, "r"], [18, 24, 12, "r"], [26, 32, 12, "r"], [34, 42, 12, "r"],
            [42, 52, 10, "r"], [50, 58, 14, "g"], [58, 48, 16, "g"], [68, 38, 14, "g"],
          ],
          rings: [[54, 70]],
        },
      },
      {
        label: "B",
        rank: "pass",
        note: "Weak poke through a flat line mid range",
        chart: {
          tline: { x1: 8, y1: 50, x2: 88, y2: 48 },
          bars: [
            [14, 44, 10, "r"], [22, 52, 10, "g"], [30, 46, 8, "r"], [38, 54, 10, "g"],
            [46, 48, 8, "r"], [54, 44, 8, "g"],
          ],
          rings: [[64, 46]],
        },
      },
      {
        label: "C",
        rank: "ok",
        note: "Deep flush then reclaim: the V needs the volume",
        chart: {
          tline: { x1: 8, y1: 26, x2: 60, y2: 64 },
          bars: [
            [12, 18, 14, "r"], [20, 30, 16, "r"], [28, 44, 20, "r"], [36, 58, 24, "r"],
            [46, 56, 22, "g"], [54, 40, 18, "g"],
          ],
          rings: [[62, 48]],
        },
      },
    ],
    quality: [
      { id: "q1", label: "The decline respected the line as resistance repeatedly on the way down" },
      { id: "q2", label: "Strong reversal bar, then a break and close through the line" },
      { id: "q3", label: "Line flips: the first pullback holds it as support" },
      { id: "q4", label: "Volume expands on the reversal itself, not merely at the end of the decline" },
    ],
    flags: [
      { id: "f1", label: "Line flat and already pierced both ways: no leash to break" },
      { id: "f2", label: "Entry on the poke without the close through" },
    ],
  },
  {
    id: "mastretch",
    layers: { gate: "reversal", frame: "reversal", trigger: "turn", stop: "exact-extreme" },
    source: "Lance",
    name: "Stretch to the mean",
    group: "trend",
    principle:
      "Price gaps or runs unsustainably far from the daily 20; the trade is the reversion toward the average, and the line itself is the target, measured before entry.",
    exit:
      "Fixed target at the moving average: the edge expires at the line, so exit there rather than hoping the move extends.",
    variants: [
      {
        label: "A",
        rank: "take",
        note: "Exhaustion gap far from the line: short the failure, target the line",
        chart: {
          tline: { x1: 8, y1: 78, x2: 90, y2: 62 },
          bars: [
            [14, 60, 14, "g"], [22, 44, 16, "g"], [30, 26, 18, "g"], [38, 12, 14, "g"],
            [46, 16, 12, "r"], [54, 28, 16, "r"],
          ],
          rings: [[62, 40]],
        },
      },
      {
        label: "B",
        rank: "pass",
        note: "Modest distance, steady trend: no stretch, no snap",
        chart: {
          tline: { x1: 8, y1: 72, x2: 88, y2: 48 },
          bars: [
            [14, 62, 10, "g"], [24, 58, 10, "g"], [34, 52, 10, "g"], [44, 48, 10, "g"],
            [54, 42, 10, "g"],
          ],
          rings: [[64, 40]],
        },
      },
    ],
    quality: [
      { id: "q1", label: "Distance to the daily 20 is historically extreme for the name" },
      { id: "q2", label: "Exhaustion signature: gap or vertical bars into the high" },
      { id: "q3", label: "Failure trigger first: reversal bar or break of the vertical's base" },
      { id: "q4", label: "Target set at the line, reward measured before entry" },
    ],
    flags: [
      { id: "f1", label: "Steady sustainable slope: trending, not stretched" },
      { id: "f2", label: "No failure trigger: shorting strength on distance alone" },
    ],
  },
  {
    id: "scalp-mr",
    layers: { gate: "scalp", frame: "reversal", trigger: "tape", stop: "structural" },
    source: "Lance",
    name: "Mean reversion scalp",
    group: "scalp",
    principle:
      "Price stretches too far too fast into a big level; the tape stalls, sellers stop pressing, you buy at the offer just ahead of the large bids and sell the rebound.",
    variants: [
      {
        label: "Shape",
        rank: "take",
        note: "Sharp stretch into large bids, hitting stalls, then the pop",
        chart: {
          level: { y: 71, x1: 8, x2: 80 },
          bars: [
            [12, 10, 12, "r"], [20, 22, 14, "r"], [28, 36, 18, "r"], [36, 54, 14, "r"],
            [44, 64, 5, "r"], [50, 66, 4, "r"], [58, 60, 10, "g"], [66, 46, 14, "g"],
          ],
          rings: [[54, 67]],
        },
      },
    ],
    quality: [
      { id: "q1", label: "Sharp, fast move into the level; the sharper the better" },
      { id: "q2", label: "Large bids (or offers) sitting at the level on the book" },
      { id: "q3", label: "Tape stalls: hitting slows and volume pauses at the level" },
      { id: "q4", label: "Aggression shifts: prints flip to your side" },
      { id: "q5", label: "Stop defined right behind the level's size" },
    ],
    flags: [
      { id: "f1", label: "Slow grind into the level, no stretch to revert" },
      { id: "f2", label: "The size at the level thins or pulls as price arrives" },
    ],
  },
  {
    id: "scalp-cont",
    layers: { gate: "scalp", frame: "continuation", trigger: "tape", stop: "structural" },
    source: "Lance",
    name: "Continuation scalp",
    group: "scalp",
    principle:
      "Coil tight under a clean level with a large offer; buyers lift into it, the offer shrinks and goes, you buy the break and sell into the surge of urgent buying that follows.",
    variants: [
      {
        label: "Shape",
        rank: "take",
        note: "Tight coil under the level, dips bought higher, break with urgency",
        chart: {
          level: { y: 32, x1: 24, x2: 88 },
          bars: [
            [12, 68, 22, "g"], [20, 48, 24, "g"], [28, 36, 16, "g"], [36, 40, 12, "r"],
            [44, 36, 10, "g"], [52, 38, 8, "r"], [60, 34, 7, "g"], [68, 35, 6, "g"],
          ],
          rings: [[76, 28]],
        },
      },
    ],
    quality: [
      { id: "q1", label: "Clean, obvious level, ideally aligned across timeframes" },
      { id: "q2", label: "Shallow pullbacks, each dip bought higher than the last" },
      { id: "q3", label: "Buyers aggressively lifting into the offer" },
      { id: "q4", label: "Offer shrinking on refills, then taken in one shot" },
      { id: "q5", label: "Burst through with urgency and immediate follow-through" },
    ],
    flags: [
      { id: "f1", label: "Drifts through the level and stalls, tape slows" },
      { id: "f2", label: "Sellers hitting bids just above the break" },
      { id: "f3", label: "Offer keeps refreshing at full size" },
    ],
  },
  {
    id: "scalp-spread",
    layers: { gate: "scalp", frame: "continuation", trigger: "tape", stop: "structural" },
    source: "Lance",
    name: "Spread making",
    group: "scalp",
    principle:
      "In a thin but liquid-enough name near equilibrium, rest orders ahead of large bids and offers and let urgent participants cross the spread to you; microstructure, not direction.",
    variants: [
      {
        label: "Shape",
        rank: "take",
        note: "Two-sided flow crossing a wide spread; queue at the bid, sell at the offer",
        chart: {
          level: { y: 38, x1: 12, x2: 88 },
          bars: [
            [16, 44, 14, "g"], [24, 46, 12, "r"], [32, 44, 14, "g"], [40, 46, 12, "r"],
            [48, 44, 14, "g"], [56, 46, 12, "r"],
          ],
          rings: [[68, 40], [68, 60]],
        },
      },
    ],
    quality: [
      { id: "q1", label: "Spread wide relative to the tick: real edge to capture" },
      { id: "q2", label: "Large visible bids and offers to lean on" },
      { id: "q3", label: "Two-sided urgent flow crossing the spread" },
      { id: "q4", label: "Queue position understood: order types, priority, hidden size" },
    ],
    flags: [
      { id: "f1", label: "Spread compresses: the edge is gone" },
      { id: "f2", label: "Flow turns one-sided: you are just catching the falling side" },
    ],
  },
  {
    id: "s1-ep",
    layers: { gate: "composite", frame: "continuation", trigger: "candle", stop: "adtr" },
    name: "S1 · Episodic pivot long",
    group: "composite",
    source: "Kullamägi",
    principle:
      "News forces the market to re-price the whole company: a neglected name gaps at least 10 percent on volume pacing 10x, and the crowd spends weeks catching up. Nearly every scan hit should fail qualification.",
    exit:
      "Buy the break of the first 5 minute high on huge opening volume, or the 60 minute high when volume needs confirming; strength only, no limits waiting below. Stop at the low of day, resting from fill. Partial days 3 to 5, breakeven, trail the 10 day close (20 day when extended). No discretionary exits: the documented failure ran 800 percent in two weeks after a feelings exit.",
    quality: [
      { id: "q1", label: "S1.C1 Repricing news: earnings surprise, guidance reset, approval, strategic event. Promotional or immaterial news excluded" },
      { id: "q2", label: "S1.C2 Volume pacing at least 10x the 14 day average, evident from the open" },
      { id: "q3", label: "S1.C3 Neglected before the gap: months of sideways base, no large prior run" },
      { id: "q4", label: "S1.C4 Right type: tech, biotech or small cap, never a slow-repricing utility" },
    ],
    flags: [
      { id: "f1", label: "Already extended before the gap, or buying weakness into it" },
      { id: "f2", label: "Volume pace short of 10x: a gapper, not an episodic pivot" },
    ],
  },
  {
    id: "s2-leader",
    layers: { gate: "composite", frame: "continuation", trigger: "candle", stop: "adtr" },
    name: "S2 · Leader breakout long",
    group: "composite",
    source: "Kullamägi · Fröhlich · Sharkness",
    principle:
      "A top 1 to 2 percent gainer over 1, 3 and 6 months rests sideways for 1 to 3 weeks on contracting volume, price holding the upper half of the range; the trade is the range break while the gate allows it (G1 full, G2 reduced and deep pullbacks only).",
    exit:
      "Enter the opening range high break on the breakout day (5, 30 or 60 minutes: longer is later but truer); it must be green fast, one pullback tolerated, two reduce, three exit. Stop at the low of day, resting. Adds only at points that qualify as fresh setups, total open risk under profit already earned, and a failed add kills the whole position. Partial days 3 to 5, trail the 10/20 day close; the index 10 day turning down means reduce and come off margin.",
    quality: [
      { id: "q1", label: "S2.C1 Prior uptrend, then a 1 to 3 week sideways consolidation" },
      { id: "q2", label: "S2.C2 Volume contracting inside the consolidation" },
      { id: "q3", label: "S2.C3 Price in the upper half of the range" },
      { id: "q4", label: "S2.C4 Stop width: entry to low of day within 1 ADTR, wider is a skip" },
    ],
    flags: [
      { id: "f1", label: "Gate G3 or G4: never buy breakouts in a quiet range or volatile chop" },
      { id: "f2", label: "Not green fast: the third pullback is the exit, not a discount" },
      { id: "f3", label: "A day 3 winner about to become a loss" },
    ],
  },
  {
    id: "s3-parabolic",
    layers: { gate: "composite", frame: "reversal", trigger: "turn", stop: "exact-extreme" },
    name: "S3 · Parabolic exhaustion short",
    group: "composite",
    source: "Kullamägi · Russo · Goedeker · Fröhlich",
    principle:
      "A low-quality small cap rises vertically for 3 or 4 straight days on a promotional catalyst, up 300 percent or more, with filings full of latent supply; the short is the break of the parabola, never the strength. Day one gap fades are a different trade and out of scope.",
    exit:
      "Entry on the break only: opening range low, first red 5 minute candle, or loss of VWAP; first entry half size, completed only when it works. Stop at the exact high of day, resting: a new high is the exit, no debate. Cover into capitulation flushes, 1 to 3 days expected and longer is a red flag. Three failed attempts ends the name for the day; a trading halt means exit on the reopen.",
    quality: [
      { id: "q1", label: "S3.C1 Up 3 or 4 consecutive days, cumulative gain at least 300 percent" },
      { id: "q2", label: "S3.C2 Catalyst is promotional: sounds bullish, changes nothing about the business" },
      { id: "q3", label: "S3.C3 Filings read first: cash position, converts and warrants, financier history" },
      { id: "q4", label: "S3.C4 Day three to five preferred, day two rarely, day one never" },
      { id: "q5", label: "S3.C5 Borrow located and cost known before the open" },
    ],
    flags: [
      { id: "f1", label: "Real news: a true profit inflection or trial result disqualifies permanently" },
      { id: "f2", label: "Grinding up instead of vertical, every dip bought: broken short, possible long flip" },
      { id: "f3", label: "Adding to a losing short: the minus 40 percent in hours lesson" },
    ],
  },
  {
    id: "s4-capit",
    layers: { gate: "composite", frame: "reversal", trigger: "turn", stop: "structural" },
    name: "S4 · Capitulation reversal long",
    group: "composite",
    source: "Breitstein",
    principle:
      "A multi-day accelerating decline, extreme against the instrument's own history, on huge panic volume, driven by flows rather than news: forced selling, margin cascades, a carry unwind. The trade is the turn, never the fall.",
    exit:
      "Enter after a V-bottom forms on the intraday chart. Stop at the low of day, resting; once moving, trail below the prior day's low, keeping a fraction on the daily trail for the larger recovery. Re-entry after a stop-out when the turn re-forms, twice at most.",
    quality: [
      { id: "q1", label: "S4.C1 Decline extreme against the instrument's own history: among the largest 3 day moves ever" },
      { id: "q2", label: "S4.C2 Huge volume on the panic day" },
      { id: "q3", label: "S4.C3 Cause is flows: forced selling, margin cascade, carry unwind" },
      { id: "q4", label: "S4.C4 Daily and intraday charts agree on the read" },
    ],
    flags: [
      { id: "f1", label: "A real negative news driver: that crash is not for buying" },
      { id: "f2", label: "No V-turn formed yet: buying before the turn is catching the decline, not trading the reversal" },
    ],
  },
  {
    id: "s5-catalyst",
    layers: { gate: "composite", frame: "event", trigger: "card", stop: "card" },
    name: "S5 · Catalyst reaction",
    group: "composite",
    source: "Berry · Bandazian · Breitstein",
    principle:
      "A finished card names the branches before the open: if X then A, if a fraction of X then B, cross-market impacts written down. The trade is the divergence between the market's first reaction and the card's prepared fair response, in the direction of price, never the opinion of the news.",
    exit:
      "Enter seconds to minutes after the release, exactly per card; late entry only when the card says the move has much more room. Stop per card plus a 3 to 4 minute time stop: not working within a minute or two, out. Trail the prior 2 minute bar and leave while the crowd is arriving: first-mover edge decays from near 98 percent toward 50.",
    quality: [
      { id: "q1", label: "S5.C1 A finished card exists with branches and relative impacts written down" },
      { id: "q2", label: "S5.C2 Research complete: an unfinished card disqualifies the event" },
      { id: "q3", label: "S5.C3 The first reaction diverges from the card's prepared fair response" },
    ],
    flags: [
      { id: "f1", label: "No card, or someone else's card" },
      { id: "f2", label: "Analysing after the release instead of before it" },
    ],
  },
];

// Trendlines across timeframes: construction, top-down workflow, execution, application.
const TL_DRAW = [
  "Uptrend lines connect higher lows, drawn along the wicks of the lows, never the closes",
  "Downtrend lines connect lower highs, drawn along the highs",
  "Three touches make a line real; two is a guess",
  "A line pierced repeatedly is invalid: delete it, do not bend it",
  "A line running through the middle of bars is noise, not structure",
];

const TL_LADDER = [
  { id: "monthly", tf: "Monthly", job: "Primary lines drawn; direction of the primary trend named" },
  { id: "weekly", tf: "Weekly", job: "Anchors refined to fresh lows or highs; fan updated, old point B becomes new point A" },
  { id: "daily", tf: "Daily", job: "Alignment checked: the daily agrees with the direction you want to trade" },
  { id: "exec", tf: "Execution", job: "Entry structure set on 15 minute and 1 minute; trailing rule chosen: the line, or prior bar highs and lows" },
];

const TL_TRADE = [
  "Buy near an uptrend line as support, or short its break; short near a downtrend line as resistance, or buy its break",
  "Trail the stop along the line as the move works; the break of the line is the exit and the profit rule is explicit",
  "Never buy just above a downtrend line: the stop chases lower and risk grows as it moves against you",
  "More touches make a line more relevant, and price that keeps pressing it without pushing away is loading to break it",
];

const TL_APPLY = [
  "In-play instruments only: fresh news or a standout daily setup. Efficient markets pay nothing for lines alone",
  "Alignment across timeframes puts every player on your side: a long should be a long on the daily and the intraday",
  "Never short a clean uptrend unless it capitulates in both price and volume",
];

const TL_SKETCHES = [
  {
    title: "Trail the line",
    note: "Ride the uptrend, stop follows the line, exit on the break",
    chart: {
      tline: { x1: 8, y1: 80, x2: 88, y2: 32 },
      bars: [
        [12, 62, 12, "g"], [20, 58, 13, "g"], [28, 62, 9, "r"], [36, 48, 14, "g"],
        [44, 52, 9, "r"], [52, 38, 14, "g"], [60, 42, 9, "r"], [68, 30, 12, "g"],
        [78, 38, 18, "r"],
      ],
      rings: [[28, 74], [80, 60]],
    },
  },
  {
    title: "Right side of the V",
    note: "Volume flush at the lows, then buy the break of the downtrend line",
    chart: {
      tline: { x1: 10, y1: 14, x2: 74, y2: 58 },
      bars: [
        [14, 20, 12, "r"], [22, 28, 12, "r"], [30, 36, 14, "r"], [38, 46, 16, "r"],
        [46, 58, 20, "r"], [54, 56, 20, "g"], [64, 40, 18, "g"],
      ],
      rings: [[66, 46]],
    },
  },
];

// Moving averages: defaults, market filter, trailing rules. Reference, not a signal generator.
const MA_LINES = [
  "Defaults only: 10, 20, 50 simple on the daily, 200 for the majors. Everyone watches the same lines, which is half the point",
  "A moving average is equilibrium: hold above it and the trend's rate continues, close through it and the rate has changed",
  "Fractal: the daily for swings, intraday frames for legs. Match the line to the frame you are trading",
  "Leaders do not close below the 10 and 20 day for long stretches; that persistence is the signal",
];

const MA_FILTER = [
  "10 above 20, both rising: breakouts on",
  "10 below 20, or the 10 sloping down: caution, half interest",
  "Both sloping down and the 10 under the 20: no breakouts at all",
  "Bear markets happen below the 200 day: it is the guardrail, and exposure goes toward zero beneath it",
];

const MA_TRAIL = [
  "Match trail speed to slope: the sharper the move, the faster the line, 10 day over 20",
  "Higher timeframe swings: wait for the close below, undercuts of the line happen constantly",
  "Intraday: act on the break itself, the reaction at the line is the trade",
  "Crossovers: understood, not used. The lines are support, resistance and trend, not a signal generator",
  "Sell into strength by extension: 10 ATR above the 50 day starts the trimming, 15 is climax territory (outsized candles, gaps in a row, 8 to 12 weeks out of a base)",
];

const MA_APPLY = [
  "Trending, in-play names only: in a rangebound chop the lines are decoration",
  "The line works as support in uptrends and resistance in downtrends, and flips roles when broken",
];

// Qullamaggie file: numbers from the 3,000-trade deep dive (2014 to 2022), not the stream vibe.
const QM_SIZING = [
  "Positions run 5 to 25 percent of the account, most under 15; shorts sized larger than longs",
  "7 of 10 trades risk under 0.25 percent of the account, 9 of 10 under 0.75: nobody at this level risks 1 percent per trade",
  "Small account: four to five positions when fully invested, sized so the risk numbers above still hold",
];

const QM_DISTRIBUTION = [
  "A third of trades makes two thirds of the profits; most trades cluster near zero",
  "You never know which trade is the big one, so every valid setup gets taken: the take rate in Opportunity is the point",
  "Diminishing returns on hunting the perfect setup; the edge is in showing up for all of them",
];

const QM_TEMPO = [
  "17 percent of days: no net position change at all. Two thirds of days: two or fewer entries",
  "Progressive exposure: pilot first, add as the market proves it; the exposure curve follows the index, never leads it",
  "Most of the time trading is uneventful; the public stream overstates activity, and the measured tempo is the reality",
];

const QM_DRAWDOWN = [
  "In drawdown roughly 80 percent of the time on cumulative profits, even in triple digit years",
  "A ten month drawdown happened inside a profitable career: plan for it before it arrives",
  "Severe losses happen even to the best: plus 75k one day, minus 125k two days later. The automated off switch is not optional",
];

// State and gate, per the composite spec (Thanos): H4 breadth, H3 tactical, gamma sign.
// Set by hand pre-open; the gate row derives from the matrix and is stamped on every trade.
const STATE_DIMS = [
  {
    key: "h4",
    label: "H4 breadth",
    opts: [
      { v: "advance", label: "Advance" },
      { v: "mixed", label: "Mixed" },
      { v: "decline", label: "Decline" },
    ],
  },
  {
    key: "h3",
    label: "H3 tactical",
    opts: [
      { v: "quiet trend", label: "Quiet trend" },
      { v: "vol trend", label: "Vol trend" },
      { v: "quiet range", label: "Quiet range" },
      { v: "vol chop", label: "Vol chop" },
      { v: "unclassified", label: "Unclassified" },
    ],
  },
  {
    key: "gamma",
    label: "Gamma",
    opts: [
      { v: "neg", label: "Neg" },
      { v: "flat", label: "Flat" },
      { v: "pos", label: "Pos" },
    ],
  },
];

const deriveGate = (m) => {
  const h4 = m.h4;
  const h3 = m.h3;
  if (!h3 || h3 === "unclassified")
    return {
      row: "G7",
      permitted: "Nothing",
      forbidden: "Everything. No classification, no trade.",
    };
  if (h3 === "vol chop")
    return {
      row: "G4",
      permitted: "S4 at climax only; S5 per card",
      forbidden: "All other directional trades",
    };
  if (h4 === "decline")
    return {
      row: "G5",
      permitted: "S3, S4; index short per card",
      forbidden: "Longs in S1 and S2",
    };
  if (h3 === "quiet range")
    return {
      row: "G3",
      permitted: "S5 per card; build S3 watchlists",
      forbidden: "Breakout anticipation",
    };
  if (h4 === "advance" && h3 === "quiet trend")
    return { row: "G1", permitted: "S1, S2 full; S5 per card", forbidden: "Fading strength" };
  if (h4 === "advance" && h3 === "vol trend")
    return {
      row: "G2",
      permitted: "S1, S2 reduced, deep pullbacks only; S5 per card",
      forbidden: "Breakout chasing; tight stops",
    };
  return {
    row: "G7",
    permitted: "Nothing",
    forbidden: "Combination outside the matrix: no trade.",
  };
};

// Layer profile: how each dimension of the tool applies to a given setup. No dimension is one-sided.
const GATE_ROWS = {
  "s1-ep": { G1: "full size", G2: "reduced size, deep pullbacks only" },
  "s2-leader": { G1: "full size", G2: "reduced size, deep pullbacks only" },
  "s3-parabolic": { G5: "permitted, borrow located and priced" },
  "s4-capit": { G4: "at the climax only", G5: "permitted" },
  "s5-catalyst": { G1: "per card", G2: "per card", G3: "per card", G4: "per card" },
};

const LAYER_TEXT = {
  frame: {
    continuation: "Continuation: the entry frame leads and higher frames should agree; disagreement costs grade and size",
    reversal: "Reversal: the entry frame's trend runs against the trade by design; the turn is the trigger and higher frames only set the room",
    event: "Event: the card sets the frame; the release is the clock",
  },
  trigger: {
    turn: "The turn is required: a trendline break, a prior bar extreme broken, an intraday capitulation turn, or the forced participant breaking. A candle pattern with its confirming close is one way it prints; the shape alone is never the trigger",
    candle: "Candle confirmation is additive: a confirmed candle adds conviction, a missing one changes nothing",
    flow: "Order flow gate at the level: outsized print, delta with price, clean lift; three for A, two for B",
    tape: "The book decides: size at the level, hitting that stalls or urgency that lifts",
    card: "Entry exactly per the event card, seconds to minutes after the release",
  },
  stop: {
    "exact-extreme": "Beyond the climax extreme, exact; a new extreme is the exit. Width logged in ATR; the reward floor (target at least 2R away) replaces the 1 ADTR skip",
    structural: "Behind the level on the frame that produced the trade, resting from fill; never widened from adverse excursion",
    adtr: "Low of day, resting; entry to stop within 1 ADTR or the order is skipped (composite risk engine)",
    range: "Back inside the opening range; the day stop and attempt limits govern",
    card: "Per card, plus a 3 to 4 minute time stop",
  },
};

const gateFor = (setup, mode) => {
  const L = setup.layers || {};
  const anySet = mode && Object.values(mode).filter(Boolean).length > 0;
  const g = deriveGate(mode || {});
  if (L.gate === "composite") {
    if (!anySet) return { ok: null, text: "Composite card: classify the state first; no row, no trade" };
    if (g.row === "G7") return { ok: false, text: "G7: nothing permitted" };
    const rows = GATE_ROWS[setup.id] || {};
    return rows[g.row]
      ? { ok: true, text: g.row + ": " + rows[g.row] }
      : { ok: false, text: g.row + ": forbidden for this card" };
  }
  if (L.gate === "reversal") {
    if (!anySet) return { ok: null, text: "Reversal card: eligible in every classified row; classify the state first" };
    if (g.row === "G7") return { ok: false, text: "G7: nothing permitted" };
    if ((mode || {}).gamma === "neg")
      return { ok: true, text: g.row + " with negative gamma: permitted after the confirmed turn only, never anticipatory" };
    return { ok: true, text: g.row + ": permitted; the state is context, the trade is idiosyncratic" };
  }
  if (L.gate === "filter")
    return { ok: null, text: "Not gated by the matrix: the daily 10 and 20 day market filter decides (both rising, breakouts on)" };
  if (L.gate === "scalp")
    return { ok: null, text: "Not gated by the matrix: in play and the book decide; session guardrails apply" };
  return { ok: null, text: "Not gated by the matrix: session guardrails apply, and the index needs range and a driver" };
};

const stateChipColor = (v) =>
  v === "decline" || v === "vol chop" || v === "unclassified" || v === "neg"
    ? C.brick
    : v === "mixed" || v === "vol trend" || v === "quiet range"
    ? C.bronze
    : C.ink;

const EXIT_REASONS = [
  { v: "stop", label: "Stop" },
  { v: "target", label: "Target" },
  { v: "trail", label: "Trail" },
  { v: "time", label: "Time" },
  { v: "discretionary", label: "Discretionary" },
];

// Point values for the contracts calculator.
const INSTRUMENTS = [
  { id: "MNQ", ppt: 2 },
  { id: "MES", ppt: 5 },
  { id: "NQ", ppt: 20 },
  { id: "ES", ppt: 50 },
];

// AI read: what a screenshot cannot verify, the human ticks; unticked counts as missing.
const AI_CONTEXT = [
  { id: "inplay", label: "In play: catalyst, volume, real range today" },
  { id: "volume", label: "Volume elevated vs the 14 day average (10x pace for S1)" },
  { id: "realnews", label: "Catalyst is real repricing news" },
  { id: "fluff", label: "Catalyst is promotional: sounds bullish, changes nothing material" },
  { id: "neglect", label: "Neglected base before the move: months sideways" },
  { id: "borrow", label: "Borrow located and priced (shorts)" },
  { id: "card", label: "A finished event card exists (S5)" },
];

// In play: the broken slot machines. Three ways in, one bar to clear, and the list stays short.
const WATCH_CATS = [
  { v: "news", label: "News" },
  { v: "tech", label: "Tech" },
  { v: "vol", label: "Vol" },
];

const INPLAY_YES = [
  "A catalyst forcing funds to reprice: earnings, approvals, buyouts, contracts, trial data, with price and volume actually responding",
  "A technical event with velocity: a multi-month level breaking, a breakdown, a squeeze, a parabolic extension on surging volume",
  "Range expansion: moving multiple times its normal daily range with clean levels; fresh IPO price discovery counts",
  "Character over pattern: a linear trender, liquid, high daily range (4 percent plus), in an institutionally demanded theme. The setup does not create the move; the characteristics do",
];

const INPLAY_NO = [
  "News without movement is not in play: no volume, no volatility, no trade",
  "Choppy, illiquid or random movement fails the cut, whatever the story",
  "Maybe 25 tickers a day carry positive expectancy and fewer than five will move the P&L: the list stays short",
  "5 to 10 stocks make 90 percent of a firm's month: concentration is normal, not a flaw in the scan",
];

// Candle confirmation: the trigger layer. Four patterns, strict definitions, location before shape.
// Additive only: a confirmed candle upgrades timing conviction; a missing one never vetoes a setup.
const CANDLE_CHECK = [
  { id: "strict", label: "One of the four, by the strict definition" },
  { id: "location", label: "Location earned: at a zone, range extreme or defended level, not mid-chop" },
  { id: "extreme", label: "At the exact extreme: nothing beyond it to the left on this frame" },
  { id: "confirm", label: "Confirmation close printed beyond the pattern's extreme (mandatory for a doji)" },
  { id: "frames", label: "Frames agree: entry frame or higher, and the higher frame does not contradict" },
];

const CANDLE_RULES = [
  "The body shows who won; the wick is the failed move, and failed moves are the most honest information on a chart: a large participant stepped in against it",
  "Location beats shape: the same hammer on a defended level is a signal, in the middle of chop it is noise",
  "Trade the confirmation, not the pattern: the next close beyond the pattern's extreme, mandatory for dojis",
  "Higher timeframe outranks lower: the close is the verdict, not the touch",
  "A full body with no wicks is conviction: continuation, not reversal",
  "The horizon is three to five candles: a trigger tool, never a thesis",
];

const CANDLE_PATTERN_SKETCHES = [
  {
    title: "Hammer",
    note: "Long lower wick, green close, at the exact low; the next close above its high confirms",
    chart: {
      level: { y: 72, x1: 8, x2: 92 },
      wicks: [[46, 67, 88]],
      bars: [
        [10, 28, 11, "r"], [18, 38, 11, "r"], [26, 48, 11, "r"], [34, 58, 10, "r"],
        [46, 60, 7, "g"], [58, 46, 14, "g"], [68, 34, 13, "g"],
      ],
      rings: [[46, 78]],
    },
  },
  {
    title: "Shooting star",
    note: "Long upper wick, weak close, at the exact high; the follow-through close seals it",
    chart: {
      wicks: [[46, 8, 26]],
      bars: [
        [10, 62, 12, "g"], [18, 50, 12, "g"], [26, 38, 12, "g"], [34, 28, 10, "g"],
        [46, 26, 6, "r"], [58, 34, 14, "r"], [68, 46, 12, "r"],
      ],
      rings: [[46, 14]],
    },
  },
  {
    title: "Bullish engulfing",
    note: "Trades below the prior low AND closes above the prior high; the loose close-only version has no edge",
    chart: {
      wicks: [[40, 36, 60], [52, 28, 66]],
      bars: [
        [14, 24, 11, "r"], [26, 33, 10, "r"], [40, 40, 16, "r"], [52, 32, 30, "g"],
        [64, 24, 11, "g"],
      ],
      rings: [[52, 47]],
    },
  },
  {
    title: "Bearish engulfing",
    note: "Trades above the prior high AND closes below the prior low; the mirror rule, same strictness",
    chart: {
      wicks: [[40, 40, 64], [52, 34, 72]],
      bars: [
        [14, 66, 11, "g"], [26, 56, 10, "g"], [40, 44, 16, "g"], [52, 38, 30, "r"],
        [64, 62, 11, "r"],
      ],
      rings: [[52, 53]],
    },
  },
  {
    title: "Doji",
    note: "Indecision only: nothing until the next close beyond its extreme, here the break lower",
    chart: {
      wicks: [[48, 26, 66]],
      bars: [
        [14, 60, 11, "g"], [26, 48, 11, "g"], [36, 38, 10, "g"], [48, 44, 3, "r"],
        [60, 52, 18, "r"],
      ],
      rings: [[60, 62]],
    },
  },
];

// Exit law: the family follows the thesis; the ledger sets the parameters.
const EXIT_FAMILY = [
  "Bounded-structure bets (mean reversion, fades, business zones) carry their exit inside the model: the far side of the structure, or the average, is where the edge is declared spent. The target is written before entry and taken there; trailing such a trade trades against its own thesis with open profit",
  "Persistence bets (breakouts, continuation, the surf, episodic pivots) have no interior level where the move is finished, so the exit is discovered from price as it unfolds: prior bar extremes, the 10 or 20 day close, the trendline. That is what a trailing stop is",
  "Expiring edges (catalyst reactions, scalps, the opening drive) exit on the clock; the favourable excursion concentrates early, and a time stop is the honest exit",
  "The hybrid banks a portion at the model boundary and trails the remainder: it thins the left tail, lowers variance, and often raises the permissible size even when its expectancy per trade sits below the pure trail",
];

const EXIT_STOP = [
  "On the frame that produced the trade, just behind the level that defines it, resting from fill. A daily trade gets the daily bar's low; it is never choked with an intraday stop",
  "Exact for parabolics and capitulations: beyond the climax extreme, and a new extreme is the exit, no debate",
  "Width is a parameter, not a convention: logged in ATR, and the winners' MAE distribution decides whether it can be tighter. Widening is never justified from MAE, because what a trade would have done beyond the tested stop was never observed",
  "The 1 ADTR skip belongs to the breakout cards. Reversal cards replace it with the reward floor: the target at least 2R from the stop",
];

const EXIT_TARGET = [
  "Measured before entry, at the nearest opposing level or the average for a fade; the floor is 2R, and under twenty samples the floor is the rule",
  "Partials at the model boundary or on day 3 to 5, stop to entry after the partial; never let a day 3 winner become a loss",
  "Trail width set from the give-back of continuing winners, above the 75th percentile of their pullbacks, in ATR or structure. Too tight converts the runners into many small exits; too wide returns the tail",
  "A trail is licensed only by evidence: under a driftless walk it is mean-neutral before costs and negative after, so fat mass in winners' MFE beyond the target has to be there first",
  "Extension sells into strength: 10 ATR above the 50 day starts the trimming, 15 is climax territory",
];

const EXIT_VALIDATE = [
  "e-ratio first: mean MFE over mean MAE in ATR units across horizons. Pinned near 1.0, the entry grows nothing and returns to development",
  "Then the exact recomputation inside the tested bracket: E(s) for a tighter stop from winners' MAE, E(T) for a lower target from losers' MFE, both with bootstrap intervals",
  "A hundred trades per cell for hit rates and central moments, two to three hundred for the tails; the redesigned bracket is a new strategy and earns a fresh sample before it is trusted",
];

const CANDLE_LOCATION = [
  {
    title: "On the defended level",
    note: "At the exact low, level held: the wick is the failed move, the close is the signal",
    chart: {
      level: { y: 70, x1: 8, x2: 92 },
      wicks: [[54, 68, 88]],
      bars: [
        [12, 26, 12, "r"], [20, 36, 12, "r"], [28, 46, 12, "r"], [36, 56, 12, "r"],
        [44, 62, 8, "r"], [54, 62, 6, "g"], [64, 54, 12, "g"], [72, 42, 14, "g"],
      ],
      rings: [[54, 78]],
    },
  },
  {
    title: "Middle of chop",
    note: "Same candle, no location: noise, not a trade",
    chart: {
      wicks: [[46, 56, 74]],
      bars: [
        [12, 48, 10, "g"], [20, 54, 10, "r"], [28, 46, 9, "g"], [36, 55, 10, "r"],
        [46, 50, 6, "g"], [56, 52, 9, "r"], [64, 46, 9, "g"], [72, 54, 9, "r"],
      ],
      rings: [[46, 66]],
    },
  },
];

// Timeframes: alignment stacks participants; the entry frame carries the decision and owns the stop.
const MTF_LAW = [
  "Each timeframe has its own participants: 1 and 2 minute scalpers, 5 and 15 minute momentum traders, daily-chart swing traders and institutions. Alignment means those groups act in the same direction after your entry, and a small trader can position ahead of the larger flows",
  "When frames agree, win rate rises on confirmation, reward rises because bigger players drive bigger moves, and risk stays the same behind the same level: expected value compounds, not adds",
  "The best longs are obvious longs on the intraday and the daily; the best shorts the same. If one frame needs convincing, it is not alignment",
  "The frame that holds the trade leads the decision. Lance's 80 percent weighting reflects a practice that was mostly intraday; the principle underneath is narrower: never trade against the entry frame's own steady movement, whatever a higher frame says",
  "Weighting shifts with the holding period: for an intraday trade the daily is context; for a swing trade the daily decides and the intraday only times the entry; for a position the weekly leads. Higher-frame disagreement does not veto, it costs grade and size",
  "The stop lives on the frame that generated the trade: a daily-chart trade gets the daily bar's low and trails prior daily bars, never a tight intraday stop; an intraday trade gets an intraday stop",
  "Start every read from the daily for context, then earn the entry on the frame you actually trade",
  "Reversal cards invert the question: the entry frame is against the trade by design, so alignment is replaced by stretch, turn and room, and higher frames only set how far the target can be",
];

const MTF_SKETCHES = [
  {
    title: "Aligned",
    note: "Daily level, intraday trigger, same direction: participants across frames acting together",
    chart: {
      level: { y: 68, x1: 8, x2: 92 },
      wicks: [[46, 66, 84]],
      bars: [
        [12, 30, 12, "r"], [20, 40, 12, "r"], [28, 50, 12, "r"], [36, 58, 10, "r"],
        [46, 60, 7, "g"], [56, 50, 13, "g"], [66, 38, 14, "g"],
      ],
      rings: [[46, 76]],
    },
  },
  {
    title: "Fighting the grind",
    note: "The daily leans short, the intraday grinds steadily higher: never trade against the entry frame\u2019s own movement",
    chart: {
      tline: { x1: 8, y1: 78, x2: 90, y2: 34 },
      bars: [
        [14, 68, 10, "g"], [24, 62, 9, "g"], [34, 54, 10, "g"], [44, 48, 9, "g"],
        [54, 40, 10, "g"], [64, 34, 9, "g"],
      ],
      rings: [[78, 28]],
    },
  },
];

// Confluence instrument: frames weighted by holding period; the entry frame leads and can veto.
const MTF_FRAMES = [
  { id: "monthly", label: "Monthly" },
  { id: "weekly", label: "Weekly" },
  { id: "daily", label: "Daily" },
  { id: "hourly", label: "Hourly (4h to 1h)" },
  { id: "exec", label: "Execution (15m to 5m)" },
];

const MTF_HORIZONS = {
  intraday: {
    label: "Intraday",
    anchor: "exec",
    weights: { exec: 45, hourly: 25, daily: 20, weekly: 7, monthly: 3 },
  },
  swing: {
    label: "Swing",
    anchor: "daily",
    weights: { daily: 45, weekly: 20, hourly: 20, monthly: 10, exec: 5 },
  },
  position: {
    label: "Position",
    anchor: "weekly",
    weights: { weekly: 35, monthly: 25, daily: 25, hourly: 10, exec: 5 },
  },
};

// Reversal mode: alignment is the wrong question for a fade; stretch, turn and room are the right ones.
const MTF_REVERSAL = [
  { id: "against", label: "The entry frame's trend runs against the trade: that stretch is the setup, not a veto" },
  { id: "turn", label: "The turn has printed on the entry frame: a trendline break, a prior bar extreme broken, the climax extreme broken on the next bar, or the forced participant breaking" },
  { id: "room", label: "Room: the entry frame's 20-day average (or the band midline) sits at least 2R from the entry" },
  { id: "context", label: "Higher frames read as context only: a weekly still in trend caps the target at the first opposing level, it does not forbid the trade" },
];

// Operating order: the day's sequence, the per-trade ladder, and what leads for which type of trade.
const FLOW_DAY = [
  "Brief: read your subscribed research, then write three lines on what matters today (levels, catalysts, direction lean)",
  "In play: list the few tickers that genuinely qualify today; if one moved on news, check which related names move with it",
  "Market state: classify breadth (H4), the tactical band (H3) and the gamma sign; the resulting gate row decides which setups are allowed today",
  "Zones: write down the exact price levels you would trade, each with the setup and quality grade you expect there, and set a matching price alarm in the platform",
  "Risk check: tick the five items and write down the total loss if every stop gets hit today; only then is the first entry allowed",
  "During the session: act only when an alarm fires at a level you wrote down, then follow the per-trade sequence on the right",
  "End of day: mark every level as taken, passed or not reached; log any trade still missing from the journal; grade your process A to D; do the weekly or monthly review if one is due",
];

const FLOW_TRADE = [
  "Gate: check the setup is allowed under today's gate row; if it is not, there is no trade",
  "Timeframe: name the chart that holds the trade; it leads the decision and defines where the stop goes, with the weighting shifting by holding period",
  "Setup: name it and tick its conditions; one warning sign caps the grade at C, two mean no trade",
  "Candle: run the trigger check for extra confirmation; a good candle adds conviction, a missing one changes nothing",
  "Size: position size follows the grade and the caps; an entry closer to the level means a bigger position at the same risk",
  "Log: enter it in the journal with its stop, target and, at the close, MFE, MAE and exit reason; the grade is now locked and the day's market state is saved with it",
];

const FLOW_WEIGHTS = [
  {
    title: "Intraday futures (ORB, scalps)",
    lines: [
      "The intraday chart leads the decision; the daily chart is context, not a veto",
      "The session rules (day stop, attempt limits, entry cutoff) are the gate; order flow and the candle are the trigger",
      "Risk the same amount on every trade; log fast rather than completely",
    ],
  },
  {
    title: "Swing stock (S1, S2, surf)",
    lines: [
      "The daily chart decides; the intraday chart only times the entry",
      "Stop at the daily bar's low, then trail prior daily lows or the 10/20 day close",
      "The gate row and the market filter can veto the trade, and check the earnings date leaves room for the move",
    ],
  },
  {
    title: "Reversals and shorts (capitulation fade, S3, S4, flush, stretch)",
    lines: [
      "Location and over-extension are the setup; without the stretch there is no trade. For the capitulation fade, count the ten variables: they stack, and fewer than four is a pass",
      "The turn must print before entry: a trendline break, a prior bar extreme broken, an intraday capitulation turn, or the forced participant breaking; a candle pattern is one way it prints. First entry half size",
      "The chart that spotted the exhaustion defines the stop; for parabolic shorts it is the exact high of day",
    ],
  },
];

// No man's land: the space between levels where risk-reward collapses. Three questions identify it.
const NML_CHECK = [
  { id: "frame", label: "Frame first: this check runs on the chart that produced the trade. A daily mid-range can be a clean 15 minute level; the entry frame decides" },
  { id: "level", label: "The level was written down before the session and has been defended before: price turned there, wicks rejected it. A line drawn after you wanted the trade is rationalising, not analysis" },
  { id: "distance", label: "Entry sits within about 1 ATR of that level on the trade's frame; beyond that you are in the middle, whatever the level's quality" },
  { id: "numbers", label: "Three exact numbers exist before the click: entry price, stop price just behind the level, target price at the next opposing level" },
  { id: "room", label: "At least 2R to the NEAREST opposing level (not the furthest one you can find), and participation is normal or better for this hour" },
];

const NML_LAW = [
  { mark: "x", color: "brick", text: "Comfort is the warning: by the time a move feels safe to join, the level is behind you. The paying entries at levels feel early and uncomfortable" },
  { mark: "x", color: "brick", text: "Chasing an extended move fails the distance question by definition: the stop is either arbitrary or enormous" },
  { mark: "x", color: "brick", text: "The clock creates its own no man's land: from roughly 11:30 to 14:00 New York participation drains, and a perfect level with nobody trading at it is still a poor trade" },
  { mark: "+", color: "green", text: "Exception one, trend pullbacks: in a strong trend, VWAP, the prior breakout point or a rising average is a real level. The vertical stretch between them is not" },
  { mark: "+", color: "green", text: "Exception two, fresh repricing: on a true catalyst day the old level map is suspended; the opening range and the day's own levels become the map" },
  { mark: "+", color: "green", text: "Exception three, the order book: for scalps, large resting size on the book is itself the level, and the check runs against it" },
];

// Scalping: the tape is the other 30 percent, and the discipline rules that keep it viable.
const SCALP_TAPE = [
  "The chart is 70 percent of the setup; the tape is the other 30 or more",
  "The chart is the rearview mirror: two orders must meet before anything prints, so the book is the windshield",
  "Watch thickness and disparity on the book: which side is heavy, which side is aggressive",
  "Time and sales tells you who is urgent: offers being lifted or bids being smashed",
  "Offer behaviour at the level: refreshing at size says wait, shrinking then taken in one shot says go",
  "Walls: bids stacking behind a large offer while someone chips at it is the break loading, and the absorbed volume is the fuel",
  "A pause in the hitting at a stretched level is often the turn",
];

const SCALP_RULES = [
  "In-play names only: range, volume and a catalyst. Inactive tickers produce random movement and a slow accumulation of small losses",
  "Small targets make costs first-order: hesitation, slippage, routing and fees eat the edge",
  "A few quality scalps beat a hyperactive day; a slipping win rate means you were not selective enough",
  "Size degrades the edge: slippage grows with size, so keep scalps sized for clean fills",
];

// Risk management: the daily check runs before the first entry; the rest is standing law.
const RISK_CHECK = [
  { id: "mental", label: "Mental temp check passed: slept, calm, focused. If off, cut limits now" },
  { id: "limit", label: "Daily loss limit armed on the platform: minus 2R and the day is over" },
  { id: "stops", label: "Stop known before every entry, no exceptions" },
  { id: "goals", label: "No external number being chased today: trade the chart, not the goal" },
  { id: "overnight", label: "Anything exposed to halts or held past the close sized at half or a third" },
  { id: "rebar", label: "Balance at risk known: if every stop hits today, the total is a number written down, not a surprise" },
];

const GUARDRAILS = [
  { label: "Day stop", value: "-2R", sub: "enforced, no override" },
  { label: "Attempts", value: "2 / side", sub: "then done" },
  { label: "Last entry", value: "11:30", sub: "New York time" },
  { label: "Close", value: "Flat", sub: "no overnight" },
];

const RISK_SIZING = [
  "Risk constant in R, not in contracts: a wider stop means fewer contracts",
  "Size to the exit, not the entry: the resting bids behind your stop are the real stop, and if the book cannot absorb your size close by, the position is too big",
  "Never size so large it changes how you trade the position; if it does, you are trading P&L, not the setup",
  "Never risk an amount that would damage confidence and momentum: ordinary losses are acceptable, destabilising ones are not",
  "Skew size to the best setups: A trades carry the year, and the grade table shows whether yours do",
  "Halve or third the size for anything exposed to halts or held past the close",
];

const RISK_SURVIVAL = [
  "One bad day is what ends traders: automate the off switch, willpower fails under pressure",
  "Never expose the account to ruin: withdraw profits regularly and keep reserves; wealth only needs to be made once",
  "Build the drawdown protocol before it is needed: cut risk automatically, never trade larger to recover losses",
  "Growth compounds only if you survive: the Projection tab is the argument for staying small enough",
  "Shorting adds layers: unbounded loss, squeezes, halts, borrow fees. Respect it",
  "Risk never disappears; there are only trade-offs, chosen in advance",
];

// Yearly plan: goals in three buckets, and the review cadence that keeps the plan honest.
const PLAN_BUCKETS = [
  { key: "process", label: "Process", hint: "In your control" },
  { key: "results", label: "Results", hint: "Outcomes" },
  { key: "growth", label: "Growth", hint: "Skills and range" },
];

const REVIEWS = [
  {
    key: "weekly",
    label: "Weekly",
    days: 7,
    questions: [
      "Expectancy this week against the running baseline?",
      "Any rule breach: day stop, attempts, entry window?",
      "Best and worst trade: one lesson each, in the ledger?",
      "Missed A or B in Opportunity, and why?",
      "One adjustment for next week, written into the zones prep.",
    ],
  },
  {
    key: "monthly",
    label: "Monthly",
    days: 31,
    questions: [
      "Results by grade: are A trades still beating B?",
      "Take rate trend: filtering, or flinching?",
      "Which playbook variant paid and which failed: retire or refine?",
      "Risk parameters still fit the account size?",
      "Goal buckets: tick what moved, flag what stalled.",
    ],
  },
  {
    key: "quarterly",
    label: "Quarterly",
    days: 92,
    questions: [
      "Is the edge intact after costs, or decaying?",
      "Playbook: one addition earned, one retirement due?",
      "Sizing step-up justified by the numbers, or by ego?",
      "Growth goal milestone hit, and what made it possible?",
    ],
  },
  {
    key: "yearly",
    label: "Yearly",
    days: 366,
    questions: [
      "Rewrite the plan: are these still the right goals?",
      "Survival audit: reserves intact, drawdown protocol ever fired?",
      "What compounded this year: skill, capital, or both?",
      "Next year's three buckets, drafted before January.",
    ],
  },
];

const GROUND_RULES = [
  "In-play names only: catalysts, volume, volatility, real price discovery. Without them the patterns carry no edge.",
  "Patterns are fractal: the same read applies on 2 minute, 15 minute or daily bars. Name the frame you are reading.",
  "Multi-timeframe alignment upgrades a marginal read; a strong daily can justify a weaker intraday variant.",
  "Consolidation needed grows with the size of the prior leg: the bigger the move, the more acceptance it must earn.",
  "The cleaner a stock trends one way, the cleaner the counter-trend tends to be.",
  "Confirmation is a close, not a touch: wicks are failed moves, the close is the verdict, and location beats shape everywhere.",
  "Every trade needs an address: a pre-marked, previously defended level within about 1 ATR on the trade's frame, a stop just behind it, and at least 2R to the nearest opposing level, all written as exact prices before the click. Missing any one of these is no man's land, whatever the conviction.",
];

const STORAGE_KEY = "journal-trades-v1";
const REPORT_KEY = "journal-report-v1";
const PASS_KEY = "journal-passes-v1";
const ZONE_KEY = "journal-zones-v1";
const PLAN_KEY = "journal-plan-v1";
const BRIEF_KEY = "journal-brief-v1";
const imgKey = (id, slot) => "journal-img:" + id + ":" + slot;

const fmtMoney = (v) =>
  v >= 1000000
    ? "$" + (v / 1000000).toFixed(2) + "m"
    : "$" +
      v.toLocaleString("en-US", {
        maximumFractionDigits: v < 100 ? 2 : 0,
      });

const fmtPct = (v, dp = 2) => {
  const s = (v * 100).toFixed(dp);
  return (v >= 0 ? "+" : "") + s + "%";
};

const fmtR = (v, dp = 2) => (v >= 0 ? "+" : "") + v.toFixed(dp) + "R";

const today = () => new Date().toISOString().slice(0, 10);

// Downscale and re-encode a screenshot so it fits comfortably in a storage key.
const processImage = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const render = (maxDim, quality) => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      return canvas.toDataURL("image/jpeg", quality);
    };
    img.onload = () => {
      URL.revokeObjectURL(url);
      let d = render(1600, 0.82);
      if (d.length > 4500000) d = render(1000, 0.68);
      if (d.length > 4500000) reject(new Error("too-big"));
      else resolve(d);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("read-failed"));
    };
    img.src = url;
  });

// ---------- shared UI ----------

const eyebrowStyle = (color) => ({
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: color || C.mutedInk,
});

function CardBox({ children, style }) {
  return (
    <div
      style={{
        background: C.card,
        border: "1px solid " + C.hairline,
        borderRadius: 6,
        padding: 18,
        marginBottom: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Collapsible card for reference content: closed by default, one tap to open.
function Disclosure({ title, meta, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: C.card,
        border: "1px solid " + C.hairline,
        borderRadius: 6,
        marginBottom: 20,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        title={(open ? "Hide: " : "Show: ") + title}
        style={{
          width: "100%",
          minHeight: 48,
          padding: "12px 16px",
          textAlign: "left",
          fontSize: 14,
          fontWeight: 500,
          color: C.ink,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span>
          {title}
          {meta && (
            <span style={{ ...monoNum, fontSize: 12, color: C.mutedInk, marginLeft: 8 }}>
              {meta}
            </span>
          )}
        </span>
        <span style={{ ...monoNum, fontSize: 12, color: C.mutedInk }}>
          {open ? "hide" : "show"}
        </span>
      </button>
      {open && <div style={{ padding: "0 18px 18px 18px" }}>{children}</div>}
    </div>
  );
}

function CheckRow({ checked, onToggle, children, accent }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: 13,
        color: checked ? C.ink : C.mutedInk,
        cursor: "pointer",
        padding: "6px 0",
        lineHeight: 1.45,
        minHeight: 32,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        style={{
          accentColor: accent || C.bronze,
          marginTop: 2,
          flexShrink: 0,
          width: 17,
          height: 17,
        }}
      />
      <span>{children}</span>
    </label>
  );
}

function RuleLine({ mark, color, children }) {
  return (
    <div
      style={{
        fontSize: 13,
        color: C.ink,
        lineHeight: 1.5,
        marginBottom: 7,
        display: "flex",
        gap: 8,
      }}
    >
      <span style={{ color, fontFamily: MONO }}>{mark}</span>
      <span>{children}</span>
    </div>
  );
}

// Whiteboard-style variant sketch.
function MiniChart({ chart }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ width: "100%", height: 110, display: "block" }}
    >
      {chart.level && (
        <line
          x1={chart.level.x1}
          y1={chart.level.y}
          x2={chart.level.x2}
          y2={chart.level.y}
          stroke={C.level}
          strokeWidth="1.6"
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {chart.tline && (
        <line
          x1={chart.tline.x1}
          y1={chart.tline.y1}
          x2={chart.tline.x2}
          y2={chart.tline.y2}
          stroke={C.level}
          strokeWidth="1.6"
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {(chart.wicks || []).map((w, i) => (
        <line
          key={"w" + i}
          x1={w[0]}
          y1={w[1]}
          x2={w[0]}
          y2={w[2]}
          stroke={C.ink}
          strokeWidth="1.1"
          vectorEffect="non-scaling-stroke"
          opacity="0.75"
        />
      ))}
      {chart.bars.map((b, i) => (
        <rect
          key={i}
          x={b[0] - 1.8}
          y={b[1]}
          width="3.6"
          height={b[2]}
          rx="0.8"
          fill={b[3] === "g" ? C.green : C.brick}
        />
      ))}
      {(chart.rings || []).map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="4" fill="none" stroke={C.ink} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          <line x1={p[0] - 2.2} y1={p[1] - 2.2} x2={p[0] + 2.2} y2={p[1] + 2.2} stroke={C.ink} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <line x1={p[0] - 2.2} y1={p[1] + 2.2} x2={p[0] + 2.2} y2={p[1] - 2.2} stroke={C.ink} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
}

function Field({ label, suffix, value, onChange, min, max, step, slider }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <label style={eyebrowStyle()}>{label}</label>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{
              width: 80,
              padding: "6px 6px",
              ...monoNum,
              fontSize: 14,
              color: C.ink,
              background: "transparent",
              border: "1px solid " + C.hairline,
              borderRadius: 4,
              textAlign: "right",
            }}
          />
          {suffix && <span style={{ fontSize: 12, color: C.mutedInk }}>{suffix}</span>}
        </div>
      </div>
      {slider && (
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: C.bronze }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone }) {
  return (
    <div style={{ borderTop: "1px solid " + C.hairline, paddingTop: 10, minWidth: 0 }}>
      <div style={{ ...eyebrowStyle(), marginBottom: 4 }}>{label}</div>
      <div
        style={{
          ...monoNum,
          fontSize: 22,
          fontWeight: 500,
          color: tone || C.ink,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: C.mutedInk, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function GradeBadge({ g, size = 20 }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 3,
        fontFamily: MONO,
        fontSize: size * 0.6,
        fontWeight: 500,
        background: g ? gradeColor(g) : "transparent",
        color: g ? C.card : C.mutedInk,
        border: g ? "none" : "1px solid " + C.hairline,
        flexShrink: 0,
      }}
    >
      {g || "-"}
    </span>
  );
}

// Screenshot slot used in the entry form: empty picker or thumbnail with clear.
function FormShot({ label, dataUrl, onPick, onClear, onView }) {
  return (
    <div>
      <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 5 }}>{label}</div>
      {dataUrl ? (
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            src={dataUrl}
            alt={label}
            onClick={onView}
            style={{
              height: 56,
              borderRadius: 4,
              border: "1px solid " + C.hairline,
              cursor: "zoom-in",
              display: "block",
            }}
          />
          <button
            onClick={onClear}
            title="Remove screenshot"
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 22,
              height: 22,
              lineHeight: "20px",
              fontSize: 12,
              padding: 0,
              background: C.ink,
              color: C.card,
              border: "none",
              borderRadius: 11,
              cursor: "pointer",
            }}
          >
            x
          </button>
        </div>
      ) : (
        <label
          title="Attach a screenshot; pasting into the page also works"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 44,
            padding: "0 14px",
            fontSize: 12,
            color: C.mutedInk,
            border: "1px dashed " + C.hairline,
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Add image
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files && e.target.files[0];
              if (f) onPick(f);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

// ---------- main ----------

export default function TradeJournalCompounder() {
  const [view, setView] = useState("journal"); // journal | playbook | risk | project
  const [mode, setMode] = useState("stats"); // projection: stats | fixed
  const [logScale, setLogScale] = useState(false);

  // Journal state
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageOk, setStorageOk] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");

  // Screenshots
  const [expandedId, setExpandedId] = useState(null);
  const [pendingPb, setPendingPb] = useState(null); // {setupId, conds} carried from playbook to the next log
  const [imgCache, setImgCache] = useState({}); // key -> undefined | "loading" | false | dataUrl
  const [lightbox, setLightbox] = useState(null);

  // Entry form
  const [fDate, setFDate] = useState(today());
  const [fTicker, setFTicker] = useState("MNQ");
  const [fSetup, setFSetup] = useState("");
  const [fGrade, setFGrade] = useState(""); // graded before entry; reset after each log
  const [fR, setFR] = useState("");
  const [fEntryImg, setFEntryImg] = useState(null);
  const [fExitImg, setFExitImg] = useState(null);
  const [fChecks, setFChecks] = useState([]); // pre-trade checklist ids
  const [showChecklist, setShowChecklist] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [fStop, setFStop] = useState(""); // stop price, optional
  const [fTarget, setFTarget] = useState(""); // target price, optional
  const [fMfe, setFMfe] = useState(""); // max favourable excursion in R, optional
  const [fMae, setFMae] = useState(""); // max adverse excursion in R, optional (positive number)
  const [fExitReason, setFExitReason] = useState(""); // stop | target | trail | time | discretionary

  // Playbook state
  const [pbSetup, setPbSetup] = useState(PLAYBOOK[0].id);
  const [pbQuality, setPbQuality] = useState([]);
  const [pbFlags, setPbFlags] = useState([]);
  const [tlChecks, setTlChecks] = useState([]); // top-down trendline pass
  const [candleChecks, setCandleChecks] = useState([]); // trigger check, per read
  const [nmlChecks, setNmlChecks] = useState([]); // location check, per read
  const [mtfDir, setMtfDir] = useState("long"); // confluence: intended direction
  const [mtfHorizon, setMtfHorizon] = useState("intraday"); // confluence: holding period
  const [mtfStates, setMtfStates] = useState({}); // confluence: frameId -> up | range | down
  const [mtfMode, setMtfMode] = useState("continuation"); // continuation | reversal, follows the selected card
  const [mtfRev, setMtfRev] = useState([]); // reversal mode ticks
  const [pendingZone, setPendingZone] = useState(false); // set when a zone resolves as taken, cleared at log

  // Risk state
  const [riskChecks, setRiskChecks] = useState([]); // daily risk check, per session
  const [reports, setReports] = useState([]); // report card entries {date, grade, note}
  const [rGrade, setRGrade] = useState("");
  const [rNote, setRNote] = useState("");

  // Opportunity: valid setups that appeared but were not taken.
  const [passes, setPasses] = useState([]); // {id, date, setup, grade}
  const [pGrade, setPGrade] = useState("");
  const [pSetup, setPSetup] = useState("");

  // Zones of interest: the pre-market plan of record. Alarms live in the platform.
  const [zones, setZones] = useState([]); // {id, date, ticker, level, side, setup, grade, status}
  const [zTicker, setZTicker] = useState("MNQ");
  const [zLevel, setZLevel] = useState("");
  const [zSide, setZSide] = useState("long");
  const [zSetup, setZSetup] = useState("");
  const [zGrade, setZGrade] = useState("");
  const [zStop, setZStop] = useState(""); // stop price for the zone, optional
  const [zTarget, setZTarget] = useState(""); // target price for the zone, optional

  // Yearly plan: mission, goals in three buckets, review cadence timestamps.
  const [plan, setPlan] = useState({ mission: "", goals: [], reviews: {} });
  const [newGoal, setNewGoal] = useState({ process: "", results: "", growth: "" });
  const [expandedReview, setExpandedReview] = useState(null);

  // Pre-market brief: publication checklist, day note, and an auto brief pulled via the Slack connector.
  const [brief, setBrief] = useState({
    sources: [
      { id: 1, name: "Macro42" },
      { id: 2, name: "Steno Research" },
      { id: 3, name: "Kuppy / Praetorian" },
      { id: 4, name: "The Quant Stack" },
    ],
    query: "macro42",
    days: {},
  });
  const [newSource, setNewSource] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState("");

  // AI read: screenshot plus ticked context in, setup resemblance and verdict out. Abstention default.
  const [aiShots, setAiShots] = useState([]); // up to two dataURLs: execution frame, higher timeframe
  const [aiTicks, setAiTicks] = useState([]);
  const [aiNote, setAiNote] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState(null);

  // In play today: the short list, kept per day with the brief.
  const [wTicker, setWTicker] = useState("");
  const [wCat, setWCat] = useState("news");
  const [wNote, setWNote] = useState("");

  // Scan: candidate generation via web search or pasted scanner output; candidates are vetted, never auto-added.
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanCands, setScanCands] = useState([]);
  const [scanPaste, setScanPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [gTicker, setGTicker] = useState(""); // group map seed ticker

  // Projection: from trade stats
  const [startEquity, setStartEquity] = useState(10000);
  const [weeks, setWeeks] = useState(50);
  const [riskPct, setRiskPct] = useState(0.5);
  const [rr, setRr] = useState(2);
  const [winRate, setWinRate] = useState(45);
  const [tradesPerSession, setTradesPerSession] = useState(2);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(5);

  // Projection: fixed rate
  const [fixedRate, setFixedRate] = useState(5);
  const [periodLabel, setPeriodLabel] = useState("week");

  // Kelly sizing: buckets by grade or setup, quarter Kelly as the working default.
  const [kellyDim, setKellyDim] = useState("grade"); // grade | setup
  const [kEquity, setKEquity] = useState(10000);
  const [kRisk, setKRisk] = useState(0.25); // percent of equity risked per trade
  const [kStop, setKStop] = useState(20); // stop distance in points
  const [kInstr, setKInstr] = useState("MNQ");

  const flashError = (msg) => {
    setFormError(msg);
    setTimeout(() => setFormError(""), 5000);
  };
  const flashNotice = (msg) => {
    setFormNotice(msg);
    setTimeout(() => setFormNotice(""), 6000);
  };

  const toggleIn = (list, setList, id) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const switchPbSetup = (id) => {
    setPbSetup(id);
    setPbQuality([]);
    setPbFlags([]);
    const nxt = PLAYBOOK.find((x) => x.id === id);
    if (nxt && nxt.layers) setMtfMode(nxt.layers.frame === "reversal" ? "reversal" : "continuation");
  };

  // Load journal and report card once.
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) setTrades(JSON.parse(res.value));
      } catch (e) {
        // Key absent or storage unavailable; start empty either way.
      }
      try {
        const rep = await window.storage.get(REPORT_KEY);
        if (rep && rep.value) setReports(JSON.parse(rep.value));
      } catch (e) {}
      try {
        const ps = await window.storage.get(PASS_KEY);
        if (ps && ps.value) setPasses(JSON.parse(ps.value));
      } catch (e) {}
      try {
        const zs = await window.storage.get(ZONE_KEY);
        if (zs && zs.value) setZones(JSON.parse(zs.value));
      } catch (e) {}
      try {
        const pl = await window.storage.get(PLAN_KEY);
        if (pl && pl.value) setPlan(JSON.parse(pl.value));
      } catch (e) {}
      try {
        const br = await window.storage.get(BRIEF_KEY);
        if (br && br.value) setBrief(JSON.parse(br.value));
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  // Paste a screenshot anywhere on the journal view: first paste fills entry, second fills exit.
  useEffect(() => {
    if (view !== "journal") return;
    const onPaste = async (e) => {
      const items = e.clipboardData ? Array.from(e.clipboardData.items) : [];
      const item = items.find((i) => i.type && i.type.startsWith("image/"));
      if (!item) return;
      const file = item.getAsFile();
      if (!file) return;
      try {
        const d = await processImage(file);
        if (!fEntryImg) setFEntryImg(d);
        else setFExitImg(d);
      } catch (err) {
        flashError("That screenshot could not be read or is too large.");
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [view, fEntryImg, fExitImg]);

  // Close the lightbox on escape.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  // Fetch stored screenshots when a row is expanded.
  useEffect(() => {
    if (!expandedId) return;
    const t = trades.find((x) => x.id === expandedId);
    if (!t) return;
    ["entry", "exit"].forEach((slot) => {
      const flag = slot === "entry" ? t.hasEntry : t.hasExit;
      const key = imgKey(t.id, slot);
      if (flag && imgCache[key] === undefined) {
        setImgCache((p) => ({ ...p, [key]: "loading" }));
        (async () => {
          try {
            const res = await window.storage.get(key);
            setImgCache((p) => ({ ...p, [key]: res && res.value ? res.value : false }));
          } catch (e) {
            setImgCache((p) => ({ ...p, [key]: false }));
          }
        })();
      }
    });
  }, [expandedId, trades]);

  const persist = async (next) => {
    setTrades(next);
    try {
      const res = await window.storage.set(STORAGE_KEY, JSON.stringify(next));
      setStorageOk(!!res);
    } catch (e) {
      setStorageOk(false);
    }
  };

  const pickFormShot = async (file, slot) => {
    try {
      const d = await processImage(file);
      if (slot === "entry") setFEntryImg(d);
      else setFExitImg(d);
    } catch (e) {
      flashError("That screenshot could not be read or is too large.");
    }
  };

  const addTrade = async () => {
    const r = parseFloat(fR);
    if (isNaN(r)) return;
    const id = Date.now();
    let hasEntry = false;
    let hasExit = false;
    if (fEntryImg) {
      try {
        await window.storage.set(imgKey(id, "entry"), fEntryImg);
        hasEntry = true;
        setImgCache((p) => ({ ...p, [imgKey(id, "entry")]: fEntryImg }));
      } catch (e) {
        flashError("Entry screenshot could not be saved; trade logged without it.");
      }
    }
    if (fExitImg) {
      try {
        await window.storage.set(imgKey(id, "exit"), fExitImg);
        hasExit = true;
        setImgCache((p) => ({ ...p, [imgKey(id, "exit")]: fExitImg }));
      } catch (e) {
        flashError("Exit screenshot could not be saved; trade logged without it.");
      }
    }
    const next = [
      ...trades,
      {
        id,
        date: fDate || today(),
        ticker: fTicker.trim().toUpperCase() || "?",
        setup: fSetup.trim(),
        grade: fGrade || null,
        checks: [...fChecks],
        r,
        hasEntry,
        hasExit,
        mode:
          briefDay.mode && Object.values(briefDay.mode).filter(Boolean).length > 0
            ? { ...briefDay.mode, gate: deriveGate(briefDay.mode).row }
            : null,
        pbChecks: pendingPb ? { ...pendingPb } : null,
        path: pendingZone ? "zone" : pendingPb ? "playbook" : "unplanned",
        stopPx: fStop.trim() || null,
        targetPx: fTarget.trim() || null,
        mfe: fMfe !== "" && !isNaN(parseFloat(fMfe)) ? Math.abs(parseFloat(fMfe)) : null,
        mae: fMae !== "" && !isNaN(parseFloat(fMae)) ? Math.abs(parseFloat(fMae)) : null,
        exitReason: fExitReason || null,
      },
    ];
    await persist(next);
    setPendingPb(null);
    setPendingZone(false);
    setFR("");
    setFSetup("");
    setFGrade("");
    setFChecks([]);
    setFEntryImg(null);
    setFExitImg(null);
    setFStop("");
    setFTarget("");
    setFMfe("");
    setFMae("");
    setFExitReason("");
  };

  const attachImage = async (tradeId, slot, file) => {
    try {
      const d = await processImage(file);
      await window.storage.set(imgKey(tradeId, slot), d);
      setImgCache((p) => ({ ...p, [imgKey(tradeId, slot)]: d }));
      const flagName = slot === "entry" ? "hasEntry" : "hasExit";
      persist(trades.map((t) => (t.id === tradeId ? { ...t, [flagName]: true } : t)));
    } catch (e) {
      flashError("That screenshot could not be saved.");
    }
  };

  const removeImage = async (tradeId, slot) => {
    try {
      await window.storage.delete(imgKey(tradeId, slot));
    } catch (e) {}
    setImgCache((p) => ({ ...p, [imgKey(tradeId, slot)]: undefined }));
    const flagName = slot === "entry" ? "hasEntry" : "hasExit";
    persist(trades.map((t) => (t.id === tradeId ? { ...t, [flagName]: false } : t)));
  };

  const removeTrade = async (id) => {
    const t = trades.find((x) => x.id === id);
    if (t) {
      for (const slot of ["entry", "exit"]) {
        const flag = slot === "entry" ? t.hasEntry : t.hasExit;
        if (flag) {
          try {
            await window.storage.delete(imgKey(id, slot));
          } catch (e) {}
        }
      }
    }
    if (expandedId === id) setExpandedId(null);
    persist(trades.filter((x) => x.id !== id));
  };

  const clearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    try {
      const res = await window.storage.list("journal-img:");
      if (res && res.keys) {
        for (const k of res.keys) {
          try {
            await window.storage.delete(k);
          } catch (e) {}
        }
      }
    } catch (e) {}
    setImgCache({});
    setExpandedId(null);
    persist([]);
    setConfirmClear(false);
  };

  const saveReport = async () => {
    if (!rGrade) return;
    const entry = { date: today(), grade: rGrade, note: rNote.trim() };
    const next = [...reports.filter((r) => r.date !== entry.date), entry].sort(
      (a, b) => (a.date < b.date ? -1 : 1)
    );
    setReports(next);
    try {
      await window.storage.set(REPORT_KEY, JSON.stringify(next));
    } catch (e) {
      setStorageOk(false);
    }
    setRGrade("");
    setRNote("");
  };

  const savePass = async (setupName, grade) => {
    const next = [
      ...passes,
      { id: Date.now(), date: today(), setup: (setupName || "").trim(), grade: grade || null },
    ];
    setPasses(next);
    try {
      await window.storage.set(PASS_KEY, JSON.stringify(next));
    } catch (e) {
      setStorageOk(false);
    }
    flashNotice(
      "Pass logged: grade " + (grade || "-") + (setupName ? ", " + setupName : "") + "."
    );
  };

  const deletePass = async (id) => {
    const next = passes.filter((p) => p.id !== id);
    setPasses(next);
    try {
      await window.storage.set(PASS_KEY, JSON.stringify(next));
    } catch (e) {
      setStorageOk(false);
    }
  };

  const persistZones = async (next) => {
    setZones(next);
    try {
      await window.storage.set(ZONE_KEY, JSON.stringify(next));
    } catch (e) {
      setStorageOk(false);
    }
  };

  const saveZone = async () => {
    if (!zLevel.trim()) return;
    const next = [
      ...zones,
      {
        id: Date.now(),
        date: today(),
        ticker: zTicker.trim().toUpperCase() || "?",
        level: zLevel.trim(),
        side: zSide,
        setup: zSetup.trim(),
        grade: zGrade || null,
        stopPx: zStop.trim() || null,
        targetPx: zTarget.trim() || null,
        status: "armed",
      },
    ];
    await persistZones(next);
    setZLevel("");
    setZSetup("");
    setZGrade("");
    setZStop("");
    setZTarget("");
  };

  const resolveZone = async (id, status) => {
    const z = zones.find((x) => x.id === id);
    if (!z) return;
    if (status === "triggered-passed") {
      await savePass(z.setup || z.ticker + " " + z.level, z.grade || null);
    }
    if (status === "triggered-taken") {
      setFTicker(z.ticker);
      if (z.setup) setFSetup(z.setup);
      if (z.grade) setFGrade(z.grade);
      if (z.stopPx) setFStop(z.stopPx);
      if (z.targetPx) setFTarget(z.targetPx);
      if (z.stopPx || z.targetPx) setShowExit(true);
      setPendingZone(true);
      flashNotice("Zone taken: " + z.ticker + " " + z.level + ". Fill the R and log the trade.");
    }
    await persistZones(
      zones.map((x) => (x.id === id ? { ...x, status, resolvedAt: today() } : x))
    );
  };

  const deleteZone = async (id) => {
    await persistZones(zones.filter((x) => x.id !== id));
  };

  const persistPlan = async (next) => {
    setPlan(next);
    try {
      await window.storage.set(PLAN_KEY, JSON.stringify(next));
    } catch (e) {
      setStorageOk(false);
    }
  };

  const addGoal = (bucket) => {
    const text = (newGoal[bucket] || "").trim();
    if (!text) return;
    persistPlan({
      ...plan,
      goals: [...plan.goals, { id: Date.now(), bucket, text, done: false }],
    });
    setNewGoal({ ...newGoal, [bucket]: "" });
  };

  const toggleGoal = (id) =>
    persistPlan({
      ...plan,
      goals: plan.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    });

  const deleteGoal = (id) =>
    persistPlan({ ...plan, goals: plan.goals.filter((g) => g.id !== id) });

  const markReview = (key) =>
    persistPlan({ ...plan, reviews: { ...plan.reviews, [key]: today() } });

  const reviewDue = (key, days) => {
    const last = plan.reviews[key];
    if (!last) return { text: "not yet", color: C.bronze, due: true };
    const diff = Math.floor((new Date(today()) - new Date(last)) / 86400000);
    if (diff >= days) return { text: "due", color: C.brick, due: true };
    return { text: "in " + (days - diff) + "d", color: C.mutedInk, due: false };
  };

  const persistBrief = async (next) => {
    setBrief(next);
    try {
      await window.storage.set(BRIEF_KEY, JSON.stringify(next));
    } catch (e) {
      setStorageOk(false);
    }
  };

  const briefDay = (brief.days && brief.days[today()]) || {
    read: [],
    note: "",
    auto: "",
    watch: [],
  };

  // Patch today's brief entry; keeps only the last 14 days.
  const setBriefDay = (patch, save) => {
    const days = { ...(brief.days || {}), [today()]: { ...briefDay, ...patch } };
    const pruned = {};
    Object.keys(days)
      .sort()
      .slice(-14)
      .forEach((k) => (pruned[k] = days[k]));
    const next = { ...brief, days: pruned };
    if (save) persistBrief(next);
    else setBrief(next);
  };

  const toggleSourceRead = (id) =>
    setBriefDay(
      {
        read: briefDay.read.includes(id)
          ? briefDay.read.filter((x) => x !== id)
          : [...briefDay.read, id],
      },
      true
    );

  const addSource = () => {
    const name = newSource.trim();
    if (!name) return;
    persistBrief({ ...brief, sources: [...brief.sources, { id: Date.now(), name }] });
    setNewSource("");
  };

  const deleteSource = (id) =>
    persistBrief({ ...brief, sources: brief.sources.filter((s) => s.id !== id) });

  const addWatch = () => {
    const t = wTicker.trim().toUpperCase();
    if (!t) return;
    setBriefDay(
      {
        watch: [
          ...(briefDay.watch || []),
          { id: Date.now(), ticker: t, cat: wCat, note: wNote.trim() },
        ],
      },
      true
    );
    setWTicker("");
    setWNote("");
  };

  const delWatch = (id) =>
    setBriefDay({ watch: (briefDay.watch || []).filter((w) => w.id !== id) }, true);

  // Two candidate sources, one contract: web-searched movers, or a pasted scanner dump structured.
  const runScan = async (mode) => {
    if (window.__standalone) {
      setScanError("AI features run only inside the Claude.ai artifact; everything else works here.");
      return;
    }
    setScanLoading(true);
    setScanError("");
    try {
      const base =
        'Return ONLY this JSON, no markdown fences, no preamble: {"candidates":[{"ticker":<US-listed symbol>,"cat":"news"|"tech"|"vol","note":<why in play, max 12 words>}]}. Max 10 candidates, liquid US names only, no OTC or microcaps unless the move is extraordinary. In play means: a catalyst forcing repricing with real price and volume response, a technical break with velocity, or range expansion in multiples of normal. News without movement does not qualify.';
      const text =
        mode === "paste"
          ? "Structure this scanner or watchlist dump into in-play candidates for today (" +
            today() +
            "). Dump follows:\n" +
            scanPaste.slice(0, 4000) +
            "\n\n" +
            base
          : mode === "group"
          ? "Today is " +
            today() +
            ". Map the trading group for the US-listed ticker " +
            gTicker.trim().toUpperCase() +
            ": search the web for its dominant theme, current group composition and any fresh catalysts, then list up to 8 liquid US-listed peers that trade with it. The note for each should say why it belongs to the group and whether anything makes it in play right now; 50 percent of a stock's move is the group. " +
            base
          : "Today is " +
            today() +
            ". Search the web for today's US stock market movers: premarket and intraday gappers on news, unusual volume names, and major technical breakouts (search several angles). Then shortlist the genuinely in-play tickers. " +
            base;
      const body = {
        model: "claude-sonnet-4-6",
        max_tokens: 900,
        messages: [{ role: "user", content: text }],
      };
      if (mode !== "paste") {
        body.tools = [{ type: "web_search_20250305", name: "web_search" }];
      }
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      const out = (data.content || [])
        .filter((i) => i.type === "text")
        .map((i) => i.text)
        .join("\n")
        .replace(/```json|```/g, "")
        .trim();
      const jsonStart = out.indexOf("{");
      const parsed = JSON.parse(out.slice(jsonStart));
      const existing = new Set((briefDay.watch || []).map((w) => w.ticker));
      setScanCands(
        (parsed.candidates || []).filter((c) => c.ticker && !existing.has(c.ticker.toUpperCase()))
      );
      if ((parsed.candidates || []).length === 0) setScanError("Nothing qualified today.");
    } catch (e) {
      setScanError("Scan failed: try again or paste the scanner output instead.");
    }
    setScanLoading(false);
  };

  const addCandidate = (c) => {
    const t = (c.ticker || "").toUpperCase();
    if (!t) return;
    if (!(briefDay.watch || []).some((w) => w.ticker === t)) {
      setBriefDay(
        {
          watch: [
            ...(briefDay.watch || []),
            {
              id: Date.now(),
              ticker: t,
              cat: ["news", "tech", "vol"].includes(c.cat) ? c.cat : "news",
              note: (c.note || "").slice(0, 90),
            },
          ],
        },
        true
      );
    }
    setScanCands(scanCands.filter((x) => x !== c));
  };

  // Claude call through the Slack connector: condenses the latest transcript posts into a brief.
  const runAutoBrief = async () => {
    if (window.__standalone) {
      setBriefError("AI features run only inside the Claude.ai artifact; everything else works here.");
      return;
    }
    setBriefLoading(true);
    setBriefError("");
    try {
      const names = brief.sources.map((s) => s.name).join(", ");
      const q = (brief.query || "").trim() || "macro42";
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content:
                "Search the connected Slack workspace (search hint: " +
                q +
                ") for the most recent messages from the last 24 hours containing transcripts or summaries of these publications: " +
                names +
                ". Write a pre-market brief for a US index futures trader (MNQ, ES): for each source found, one to three terse lines on what matters for today's session, levels and catalysts first. Skip sources with nothing recent. If nothing is found at all, reply exactly: No fresh transcripts found. Plain text only, no headers, no preamble.",
            },
          ],
          mcp_servers: [{ type: "url", url: "https://mcp.slack.com/mcp", name: "slack" }],
        }),
      });
      const data = await response.json();
      const text = (data.content || [])
        .filter((i) => i.type === "text")
        .map((i) => i.text)
        .join("\n")
        .trim();
      if (!text) throw new Error("empty");
      setBriefDay({ auto: text }, true);
    } catch (e) {
      setBriefError("Auto brief failed: check the Slack connector and try again.");
    }
    setBriefLoading(false);
  };

  const addAiShot = async (file) => {
    try {
      const d = await processImage(file);
      setAiShots((prev) => (prev.length >= 2 ? prev : [...prev, d]));
    } catch (e) {
      setAiError("That screenshot could not be read or is too large.");
    }
  };

  // Claude vision call: classify resemblance against the playbook, enforce the gate, default to no trade.
  const runAiRead = async () => {
    if (aiShots.length === 0) return;
    if (window.__standalone) {
      setAiError("AI features run only inside the Claude.ai artifact; everything else works here.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setAiResult(null);
    try {
      const gate = deriveGate(briefDay.mode || {});
      const stamp = briefDay.mode
        ? Object.entries(briefDay.mode)
            .filter(([, v]) => v)
            .map(([k, v]) => k + "=" + v)
            .join(", ")
        : "not classified";
      const library = PLAYBOOK.map(
        (s) =>
          s.id +
          " [" +
          (s.group || "setup") +
          "] " +
          s.name +
          ": " +
          s.principle +
          " Conditions: " +
          s.quality.map((q) => q.label).join("; ") +
          ". Walk away: " +
          s.flags.map((f) => f.label).join("; ") +
          "."
      ).join("\n");
      const ticked = AI_CONTEXT.filter((c) => aiTicks.includes(c.id))
        .map((c) => c.label)
        .join("; ");
      const content = [
        ...aiShots.map((d) => ({
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: d.split(",")[1],
          },
        })),
        {
          type: "text",
          text:
            "You are the setup classifier for a discretionary trading tool. Abstention is the default: most charts deserve no trade, and you must say so plainly.\n\n" +
            "Today's state stamp: " +
            stamp +
            ". Gate row " +
            gate.row +
            ". Permitted: " +
            gate.permitted +
            ". Forbidden: " +
            gate.forbidden +
            ". Composite setups S1 to S5 obey the gate strictly; other setups are forbidden under G7 and judged conservatively under G4 and G5.\n\n" +
            "Setup library:\n" +
            library +
            "\n\nHuman-verified context (anything NOT listed here is unverified and counts as missing): " +
            (ticked || "none") +
            (aiNote.trim() ? ". Note: " + aiNote.trim() : "") +
            "\n\nTask: from the chart image(s), judge which setup the geometry most resembles, if any. Grade A only when the geometry is textbook, every non-visual condition for that setup is human-verified, and the gate permits it. One missing, unverified, or contrary element caps the grade at C. Two or more, a walk-away flag, a forbidden setup, or gate G7: verdict is no trade. Grade D is always no trade. Weight the entry-frame image most heavily: a contradicting higher-timeframe shot caps the grade, and alignment across both upgrades conviction.\n\n" +
            'Reply with ONLY this JSON, no markdown fences, no preamble: {"setup": <library id or null>, "setupName": <name or null>, "grade": "A"|"B"|"C"|"D"|null, "verdict": "trade"|"no trade", "reasons": [<max 4 terse strings>], "missing": [<unverified or absent conditions, terse>]}',
        },
      ];
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1200,
          messages: [{ role: "user", content }],
        }),
      });
      const data = await response.json();
      const text = (data.content || [])
        .filter((i) => i.type === "text")
        .map((i) => i.text)
        .join("\n")
        .replace(/```json|```/g, "")
        .trim();
      const parsed = JSON.parse(text);
      setAiResult(parsed);
    } catch (e) {
      setAiError("Read failed: try again, or with a cleaner screenshot.");
    }
    setAiLoading(false);
  };

  const useAiInJournal = () => {
    if (!aiResult || aiResult.verdict !== "trade") return;
    if (aiResult.setupName) setFSetup(aiResult.setupName);
    if (aiResult.grade) setFGrade(aiResult.grade);
    flashNotice(
      "AI read applied: " + (aiResult.setupName || "setup") + ", grade " + (aiResult.grade || "-") + ". Your eyes decide; this is a second opinion."
    );
  };

  // Journal stats: EV = win rate x avg win, minus loss rate x avg loss.
  const journal = useMemo(() => {
    const sorted = [...trades].sort(
      (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id)
    );
    const wins = sorted.filter((t) => t.r > 0);
    const losses = sorted.filter((t) => t.r < 0);
    const scratches = sorted.filter((t) => t.r === 0);
    const decided = wins.length + losses.length;
    const winRateJ = decided > 0 ? wins.length / decided : 0;
    const avgWinR = wins.length > 0 ? wins.reduce((s, t) => s + t.r, 0) / wins.length : 0;
    const avgLossR =
      losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.r, 0) / losses.length) : 0;
    const evR = sorted.length > 0 ? sorted.reduce((s, t) => s + t.r, 0) / sorted.length : 0;
    let cum = 0;
    const curve = [{ n: 0, cumR: 0 }];
    sorted.forEach((t, i) => {
      cum += t.r;
      curve.push({ n: i + 1, cumR: cum });
    });
    return {
      sorted,
      wins: wins.length,
      losses: losses.length,
      scratches: scratches.length,
      winRateJ,
      avgWinR,
      avgLossR,
      evR,
      totalR: cum,
      curve,
    };
  }, [trades]);

  // Results by grade: the rubric only counts if A trades outperform B trades over a sample.
  const byGrade = useMemo(() => {
    const rows = GRADES.map((g) => {
      const gt = trades.filter((t) => t.grade === g);
      const wins = gt.filter((t) => t.r > 0).length;
      const losses = gt.filter((t) => t.r < 0).length;
      const decided = wins + losses;
      const total = gt.reduce((s, t) => s + t.r, 0);
      return {
        g,
        n: gt.length,
        wr: decided > 0 ? wins / decided : 0,
        ev: gt.length > 0 ? total / gt.length : 0,
        total,
      };
    }).filter((r) => r.n > 0);
    const ungraded = trades.filter((t) => !t.grade).length;
    const a = rows.find((r) => r.g === "A");
    const b = rows.find((r) => r.g === "B");
    let verdict = null;
    if (a && b && a.n >= 5 && b.n >= 5) {
      verdict =
        a.ev > b.ev
          ? "A trades are outperforming B over this sample; the rubric holds and sizing up on A is justified."
          : "A trades are not outperforming B over this sample; the grading criteria need revisiting.";
    }
    return { rows, ungraded, verdict, verdictGood: a && b && a.ev > b.ev };
  }, [trades]);

  // Opportunity: trades count as taken; passes are the setups let go.
  const opp = useMemo(() => {
    const seen = trades.length + passes.length;
    const takeRate = seen > 0 ? trades.length / seen : 0;
    const missed = passes.filter((p) => p.grade === "A" || p.grade === "B");
    const disciplined = passes.filter((p) => p.grade === "C" || p.grade === "D").length;
    const evFor = (g) => {
      const row = byGrade.rows.find((r) => r.g === g && r.n > 0);
      if (row) return row.ev;
      return trades.length > 0 ? journal.evR : 0;
    };
    const missedR = missed.reduce((s, p) => s + Math.max(evFor(p.grade), 0), 0);
    return { seen, takeRate, missedCount: missed.length, disciplined, missedR };
  }, [trades, passes, byGrade, journal]);

  // Kelly per bucket: p minus (1-p)/payoff, expressed as the fraction of equity lost at the stop.
  const kellyData = useMemo(() => {
    const bucketize = (list) => {
      const wins = list.filter((t) => t.r > 0);
      const losses = list.filter((t) => t.r < 0);
      const decided = wins.length + losses.length;
      const p = decided > 0 ? wins.length / decided : 0;
      const avgW = wins.length > 0 ? wins.reduce((s, t) => s + t.r, 0) / wins.length : 0;
      const avgL =
        losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.r, 0) / losses.length) : 0;
      const payoff = avgL > 0 ? avgW / avgL : 0;
      const evR = list.length > 0 ? list.reduce((s, t) => s + t.r, 0) / list.length : 0;
      const kelly = payoff > 0 && decided > 0 ? p - (1 - p) / payoff : null;
      return { n: list.length, decided, p, payoff, evR, kelly };
    };
    let rows = [];
    if (kellyDim === "grade") {
      rows = GRADES.map((g) => ({
        label: g,
        isGrade: true,
        ...bucketize(trades.filter((t) => t.grade === g)),
      })).filter((r) => r.n > 0);
    } else {
      const counts = {};
      trades.forEach((t) => {
        if (t.setup) counts[t.setup] = (counts[t.setup] || 0) + 1;
      });
      rows = Object.keys(counts)
        .sort((a, b) => counts[b] - counts[a])
        .slice(0, 8)
        .map((s) => ({ label: s, ...bucketize(trades.filter((t) => t.setup === s)) }));
    }
    return { all: { label: "All trades", ...bucketize(trades) }, rows };
  }, [trades, kellyDim]);

  const canApply = journal.wins > 0 && journal.losses > 0;

  // Excursions: the ledger designs the exits. e-ratio first, then stop and target design points per setup.
  const excursions = useMemo(() => {
    const withX = trades.filter((t) => t.mfe != null && t.mae != null);
    const pct = (arr, p) => {
      if (!arr.length) return null;
      const a = [...arr].sort((x, y) => x - y);
      const idx = (a.length - 1) * p;
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      return a[lo] + (a[hi] - a[lo]) * (idx - lo);
    };
    const bucketize = (list) => {
      const n = list.length;
      const winners = list.filter((t) => t.r > 0);
      const losers = list.filter((t) => t.r <= 0);
      const meanMfe = n ? list.reduce((a, t) => a + t.mfe, 0) / n : 0;
      const meanMae = n ? list.reduce((a, t) => a + t.mae, 0) / n : 0;
      const eRatio = n && meanMae > 0 ? meanMfe / meanMae : null;
      const winMaeP75 = pct(winners.map((t) => t.mae), 0.75);
      const loseMfeMed = pct(losers.map((t) => t.mfe), 0.5);
      const giveback = winners.length
        ? winners.reduce((a, t) => a + Math.max(t.mfe - t.r, 0), 0) / winners.length
        : null;
      const disc = n ? list.filter((t) => t.exitReason === "discretionary").length / n : 0;
      return { n, winners: winners.length, eRatio, winMaeP75, loseMfeMed, giveback, disc };
    };
    const names = {};
    withX.forEach((t) => {
      if (t.setup) names[t.setup] = (names[t.setup] || 0) + 1;
    });
    const rows = Object.keys(names)
      .sort((a, b) => names[b] - names[a])
      .slice(0, 10)
      .map((nm) => ({ label: nm, ...bucketize(withX.filter((t) => t.setup === nm)) }));
    return { total: withX.length, all: { label: "All trades", ...bucketize(withX) }, rows };
  }, [trades]);

  const applyJournalStats = () => {
    if (!canApply) return;
    setWinRate(Math.round(journal.winRateJ * 1000) / 10);
    setRr(Math.round((journal.avgWinR / journal.avgLossR) * 10) / 10);
    setMode("stats");
    setView("project");
  };

  // Playbook verdict: red flags cap the grade, quality fraction sets it.
  const pb = useMemo(() => {
    const setup = PLAYBOOK.find((s) => s.id === pbSetup) || PLAYBOOK[0];
    const total = setup.quality.length;
    const q = pbQuality.length;
    const f = pbFlags.length;
    const touched = q > 0 || f > 0;
    let grade = null;
    if (touched) {
      const frac = q / total;
      grade = frac >= 0.99 ? "A" : frac >= 0.7 ? "B" : frac >= 0.4 ? "C" : "D";
      if (f === 1 && (grade === "A" || grade === "B")) grade = "C";
      if (f >= 2) grade = "D";
    }
    const text =
      grade === "A"
        ? "All conditions present: the grade that justifies larger size."
        : grade === "B"
        ? "Standard conditions met. Normal size."
        : grade === "C"
        ? "Marginal: a small probe position at most, a fraction of normal size."
        : grade === "D"
        ? "Pass. Wait for a cleaner instance."
        : "Tick what the chart is actually showing.";
    return { setup, grade, text, q, f, total };
  }, [pbSetup, pbQuality, pbFlags]);

  const sendPbToJournal = () => {
    if (!pb.grade) return;
    setFSetup(pb.setup.name);
    setFGrade(pb.grade);
    setPendingPb({ setupId: pb.setup.id, conds: [...pbQuality] });
    flashNotice("Playbook read applied: " + pb.setup.name + ", grade " + pb.grade + ".");
    setPbQuality([]);
    setPbFlags([]);
    setView("journal");
  };

  // Projection maths
  const calc = useMemo(() => {
    if (mode === "stats") {
      const w = winRate / 100;
      const expectancyR = w * rr - (1 - w);
      const perTrade = (riskPct / 100) * expectancyR;
      const perSession = Math.pow(1 + perTrade, tradesPerSession) - 1;
      const perWeek = Math.pow(1 + perSession, sessionsPerWeek) - 1;
      const breakevenWR = 1 / (1 + rr);
      const data = [];
      for (let i = 0; i <= weeks; i++) {
        data.push({ x: i, equity: startEquity * Math.pow(1 + perWeek, i) });
      }
      const final = data[data.length - 1].equity;
      return {
        expectancyR,
        perTrade,
        perSession,
        perWeek,
        breakevenWR,
        data,
        final,
        multiple: final / startEquity,
        horizon: weeks,
        unit: "week",
      };
    } else {
      const r = fixedRate / 100;
      const data = [];
      for (let i = 0; i <= weeks; i++) {
        data.push({ x: i, equity: startEquity * Math.pow(1 + r, i) });
      }
      const final = data[data.length - 1].equity;
      return {
        perPeriod: r,
        data,
        final,
        multiple: final / startEquity,
        horizon: weeks,
        unit: periodLabel,
      };
    }
  }, [mode, riskPct, rr, winRate, tradesPerSession, sessionsPerWeek, startEquity, weeks, fixedRate, periodLabel]);

  const negative = mode === "stats" ? calc.expectancyR < 0 : fixedRate < 0;

  const milestones = useMemo(() => {
    const n = calc.horizon;
    const pts = [0.25, 0.5, 0.75, 1]
      .map((f) => Math.round(n * f))
      .filter((v, i, a) => v > 0 && a.indexOf(v) === i);
    return pts.map((p) => ({ period: p, equity: calc.data[p]?.equity ?? 0 }));
  }, [calc]);

  const tabStyle = (active) => ({
    padding: "12px 14px",
    minHeight: 44,
    fontSize: 13,
    letterSpacing: "0.02em",
    cursor: "pointer",
    background: "transparent",
    color: active ? C.ink : C.mutedInk,
    fontWeight: active ? 600 : 400,
    border: "none",
    borderBottom: "2px solid " + (active ? C.bronze : "transparent"),
    borderRadius: 0,
    flexShrink: 0,
  });

  const smallInput = {
    padding: "9px 8px",
    minHeight: 40,
    ...monoNum,
    fontSize: 13,
    color: C.ink,
    background: "transparent",
    border: "1px solid " + C.hairline,
    borderRadius: 4,
    boxSizing: "border-box",
  };

  const canLog = !isNaN(parseFloat(fR));

  // One stored screenshot inside an expanded row.
  const renderStoredShot = (trade, slot) => {
    const flag = slot === "entry" ? trade.hasEntry : trade.hasExit;
    const key = imgKey(trade.id, slot);
    const cached = imgCache[key];
    return (
      <div>
        <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 6 }}>{slot}</div>
        {flag ? (
          cached === "loading" || cached === undefined ? (
            <div style={{ fontSize: 12, color: C.mutedInk }}>Loading...</div>
          ) : cached === false ? (
            <div style={{ fontSize: 12, color: C.brick }}>Screenshot could not be loaded.</div>
          ) : (
            <div>
              <img
                src={cached}
                alt={slot + " screenshot"}
                onClick={() => setLightbox(cached)}
                style={{
                  maxWidth: "100%",
                  maxHeight: 340,
                  borderRadius: 4,
                  border: "1px solid " + C.hairline,
                  cursor: "zoom-in",
                  display: "block",
                }}
              />
              <button
                onClick={() => removeImage(trade.id, slot)}
                title="Delete this screenshot from the trade"
                style={{
                  marginTop: 6,
                  padding: "6px 10px",
                  minHeight: 32,
                  fontSize: 11,
                  cursor: "pointer",
                  background: "transparent",
                  color: C.mutedInk,
                  border: "1px solid " + C.hairline,
                  borderRadius: 4,
                }}
              >
                Remove
              </button>
            </div>
          )
        ) : (
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              padding: "0 14px",
              fontSize: 12,
              color: C.mutedInk,
              border: "1px dashed " + C.hairline,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Add image
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                if (f) attachImage(trade.id, slot, f);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.paper,
        color: C.ink,
        fontFamily: "'Archivo', sans-serif",
        padding: "28px 16px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .cc-grid { display: grid; grid-template-columns: 300px 1fr; gap: 24px; }
        .cc-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .cc-second { display: grid; grid-template-columns: 136px 90px 1fr; gap: 10px; }
        .cc-grade-row { display: grid; grid-template-columns: 56px 64px 84px 104px 84px; gap: 10px; align-items: center; }
        .cc-shots { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cc-checks { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 24px; }
        .cc-pb { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .cc-plan { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .cc-variants { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
        @media (max-width: 860px) {
          .cc-grid { grid-template-columns: 1fr; }
          .cc-stats { grid-template-columns: repeat(2, 1fr); }
          .cc-second { grid-template-columns: 1fr 1fr; }
          .cc-setup { grid-column: 1 / -1; }
          .cc-grade-row { grid-template-columns: 36px 52px 66px 88px 66px; }
          .cc-shots { grid-template-columns: 1fr; }
          .cc-checks { grid-template-columns: 1fr; }
          .cc-pb { grid-template-columns: 1fr; }
          .cc-plan { grid-template-columns: 1fr; }
          .cc-variants { grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 6px; }
          .cc-hide-m { display: none; }
        }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ ...eyebrowStyle(C.bronze), letterSpacing: "0.14em", marginBottom: 6 }}>
          Personal trading
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 18px 0", letterSpacing: "-0.01em" }}>
          Trade journal and compounder
        </h1>

        <div
          style={{
            display: "flex",
            gap: 2,
            marginBottom: 22,
            borderBottom: "1px solid " + C.hairline,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <button title="Log trades, prepare the day, review results" style={tabStyle(view === "journal")} onClick={() => setView("journal")}>
            Journal
          </button>
          <button title="Setup cards, grading, and the reference library" style={tabStyle(view === "playbook")} onClick={() => setView("playbook")}>
            Playbook
          </button>
          <button title="Daily risk check, session rules, report card" style={tabStyle(view === "risk")} onClick={() => setView("risk")}>
            Risk
          </button>
          <button title="Yearly goals and the review cadence" style={tabStyle(view === "plan")} onClick={() => setView("plan")}>
            Plan
          </button>
          <button title="Compounding projections and Kelly sizing" style={tabStyle(view === "project")} onClick={() => setView("project")}>
            Projection
          </button>
        </div>

        {!storageOk && (
          <div style={{ fontSize: 13, color: C.brick, marginBottom: 12 }}>
            Storage is unavailable, so entries will not persist beyond this session.
          </div>
        )}
        {formError && (
          <div style={{ fontSize: 13, color: C.brick, marginBottom: 12 }}>{formError}</div>
        )}
        {formNotice && (
          <div style={{ fontSize: 13, color: C.green, marginBottom: 12 }}>{formNotice}</div>
        )}

        {/* ============ JOURNAL ============ */}
        {view === "journal" && (
          <div>
            {/* Operating order: the sequence and the weights */}
            <Disclosure title="Operating order" meta="the sequence">
              <div className="cc-pb" style={{ marginBottom: 14 }}>
                <div>
                  <div style={{ ...eyebrowStyle(C.bronze), marginBottom: 8 }}>The day</div>
                  {FLOW_DAY.map((r, i) => (
                    <RuleLine key={i} mark={i + 1} color={C.bronze}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(C.green), marginBottom: 8 }}>
                    At a level, in this order
                  </div>
                  {FLOW_TRADE.map((r, i) => (
                    <RuleLine key={i} mark={i + 1} color={C.green}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
              </div>
              <div style={{ ...eyebrowStyle(), marginBottom: 8 }}>What leads, by trade type</div>
              <div className="cc-plan">
                {FLOW_WEIGHTS.map((w) => (
                  <div key={w.title}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      {w.title}
                    </div>
                    {w.lines.map((r, i) => (
                      <RuleLine key={i} mark="+" color={C.mutedInk}>
                        {r}
                      </RuleLine>
                    ))}
                  </div>
                ))}
              </div>
            </Disclosure>

            {/* Entry form: primary row first, detail second */}
            <CardBox>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  alignItems: "flex-end",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 5 }}>
                    Grade (pre-entry)
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    {GRADES.map((g) => (
                      <button
                        key={g}
                        onClick={() => setFGrade(fGrade === g ? "" : g)}
                        title={GRADE_TIPS[g]}
                        style={{
                          width: 44,
                          height: 44,
                          padding: 0,
                          fontFamily: MONO,
                          fontSize: 15,
                          cursor: "pointer",
                          background: fGrade === g ? gradeColor(g) : "transparent",
                          color: fGrade === g ? C.card : gradeColor(g),
                          border: "1px solid " + (fGrade === g ? gradeColor(g) : C.hairline),
                          borderRadius: 4,
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 5 }}>
                    Result (R)
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={fR}
                    placeholder="+1.7 or -1"
                    onChange={(e) => setFR(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTrade()}
                    style={{ ...smallInput, width: 110, minHeight: 44, textAlign: "right", fontSize: 15 }}
                  />
                </div>
                <button
                  onClick={addTrade}
                  title="Save the trade: the grade locks and today's market state is stamped on it"
                  disabled={!canLog}
                  style={{
                    flex: "1 1 130px",
                    minHeight: 44,
                    padding: "0 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: canLog ? "pointer" : "default",
                    background: canLog ? C.ink : "transparent",
                    color: canLog ? C.card : C.mutedInk,
                    border: "1px solid " + (canLog ? C.ink : C.hairline),
                    borderRadius: 4,
                  }}
                >
                  Log trade
                </button>
              </div>

              <div className="cc-second" style={{ marginBottom: 12 }}>
                <input
                  type="date"
                  value={fDate}
                  onChange={(e) => setFDate(e.target.value)}
                  aria-label="Date"
                  style={{ ...smallInput, width: "100%" }}
                />
                <input
                  type="text"
                  value={fTicker}
                  onChange={(e) => setFTicker(e.target.value)}
                  aria-label="Ticker"
                  style={{ ...smallInput, width: "100%" }}
                />
                <input
                  type="text"
                  className="cc-setup"
                  value={fSetup}
                  placeholder="Setup (optional)"
                  onChange={(e) => setFSetup(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTrade()}
                  aria-label="Setup"
                  style={{ ...smallInput, width: "100%", fontFamily: "'Archivo', sans-serif" }}
                />
              </div>

              {/* Pre-trade checklist strip */}
              <button
                onClick={() => setShowChecklist(!showChecklist)}
                title="Show or hide the nine pre-trade checks; the ticked count saves with the trade"
                style={{
                  width: "100%",
                  minHeight: 44,
                  padding: "0 14px",
                  fontSize: 13,
                  cursor: "pointer",
                  background: "transparent",
                  color: fChecks.length === CHECKLIST.length ? C.bronze : C.ink,
                  border:
                    "1px solid " +
                    (fChecks.length === CHECKLIST.length ? C.bronze : C.hairline),
                  borderRadius: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: showChecklist ? 12 : 12,
                }}
              >
                <span>
                  Pre-trade checklist{" "}
                  <span style={{ ...monoNum, fontSize: 12 }}>
                    {fChecks.length}/{CHECKLIST.length}
                  </span>
                </span>
                <span style={{ ...monoNum, fontSize: 12, color: C.mutedInk }}>
                  {showChecklist ? "hide" : "show"}
                </span>
              </button>

              {showChecklist && (
                <div
                  style={{
                    padding: "12px 14px 8px 14px",
                    border: "1px solid " + C.hairline,
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                >
                  <div className="cc-checks">
                    {STAGES.map((stage) => (
                      <div key={stage} style={{ marginBottom: 8 }}>
                        <div style={{ ...eyebrowStyle(C.bronze), marginBottom: 2 }}>{stage}</div>
                        {CHECKLIST.filter((c) => c.stage === stage).map((c) => (
                          <CheckRow
                            key={c.id}
                            checked={fChecks.includes(c.id)}
                            onToggle={() => toggleIn(fChecks, setFChecks, c.id)}
                          >
                            {c.label}
                          </CheckRow>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid " + C.hairline,
                      paddingTop: 8,
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 12, color: C.mutedInk }}>
                      Saves with the trade, resets after logging.
                    </span>
                    {fChecks.length > 0 && (
                      <button
                        onClick={() => setFChecks([])}
                        title="Untick all nine"
                        style={{
                          padding: "6px 10px",
                          minHeight: 32,
                          fontSize: 11,
                          cursor: "pointer",
                          background: "transparent",
                          color: C.mutedInk,
                          border: "1px solid " + C.hairline,
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Exit detail strip: stop, target, excursions, exit reason */}
              {(() => {
                const filled = [fStop, fTarget, fMfe, fMae, fExitReason].filter((x) => x !== "").length;
                return (
                  <button
                    onClick={() => setShowExit(!showExit)}
                    title="Stop and target prices, the furthest the trade went for and against you in R, and why it ended; all optional, all feed the Excursions panel"
                    style={{
                      width: "100%",
                      minHeight: 44,
                      padding: "0 14px",
                      fontSize: 13,
                      cursor: "pointer",
                      background: "transparent",
                      color: filled === 5 ? C.bronze : C.ink,
                      border: "1px solid " + (filled === 5 ? C.bronze : C.hairline),
                      borderRadius: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <span>
                      Exit detail{" "}
                      <span style={{ ...monoNum, fontSize: 12 }}>{filled}/5</span>
                    </span>
                    <span style={{ ...monoNum, fontSize: 12, color: C.mutedInk }}>
                      {showExit ? "hide" : "show"}
                    </span>
                  </button>
                );
              })()}

              {showExit && (
                <div
                  style={{
                    padding: "12px 14px 10px 14px",
                    border: "1px solid " + C.hairline,
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", marginBottom: 10 }}>
                    {[
                      { k: "Stop", v: fStop, set: setFStop, ph: "price", w: 96, title: "Initial stop price, behind the level on the trade's frame" },
                      { k: "Target", v: fTarget, set: setFTarget, ph: "price", w: 96, title: "Target price measured before entry: the nearest opposing level, or the average for a fade" },
                      { k: "MFE (R)", v: fMfe, set: setFMfe, ph: "+2.1", w: 80, title: "The furthest the trade went in your favour while open, in R" },
                      { k: "MAE (R)", v: fMae, set: setFMae, ph: "0.4", w: 80, title: "The furthest the trade went against you while open, in R, as a positive number" },
                    ].map((f) => (
                      <div key={f.k}>
                        <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 5 }}>{f.k}</div>
                        <input
                          type="text"
                          value={f.v}
                          placeholder={f.ph}
                          title={f.title}
                          onChange={(e) => f.set(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addTrade()}
                          style={{ ...smallInput, width: f.w, minHeight: 40, textAlign: "right" }}
                        />
                      </div>
                    ))}
                    <div>
                      <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 5 }}>Exit reason</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {EXIT_REASONS.map((r) => (
                          <button
                            key={r.v}
                            onClick={() => setFExitReason(fExitReason === r.v ? "" : r.v)}
                            title={
                              r.v === "stop"
                                ? "The initial stop was hit"
                                : r.v === "target"
                                ? "The fixed target was reached"
                                : r.v === "trail"
                                ? "A trailing stop took you out"
                                : r.v === "time"
                                ? "The time limit ended it"
                                : "You chose to exit: logged as such, by design"
                            }
                            style={{
                              minHeight: 40,
                              padding: "0 11px",
                              fontSize: 12,
                              cursor: "pointer",
                              background: fExitReason === r.v ? (r.v === "discretionary" ? C.brick : C.ink) : "transparent",
                              color: fExitReason === r.v ? C.card : C.mutedInk,
                              border: "1px solid " + (fExitReason === r.v ? (r.v === "discretionary" ? C.brick : C.ink) : C.hairline),
                              borderRadius: 4,
                            }}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.mutedInk, lineHeight: 1.5 }}>
                    Optional, but each one feeds the Excursions panel: MFE and MAE let the ledger
                    design the stop and target instead of convention. Discretionary exits are
                    counted, not forbidden; their share is a process number.
                  </div>
                </div>
              )}

              {/* Screenshots */}
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
                <FormShot
                  label="Entry shot"
                  dataUrl={fEntryImg}
                  onPick={(f) => pickFormShot(f, "entry")}
                  onClear={() => setFEntryImg(null)}
                  onView={() => setLightbox(fEntryImg)}
                />
                <FormShot
                  label="Exit shot"
                  dataUrl={fExitImg}
                  onPick={(f) => pickFormShot(f, "exit")}
                  onClear={() => setFExitImg(null)}
                  onView={() => setLightbox(fExitImg)}
                />
                <div style={{ fontSize: 11, color: C.mutedInk, flex: "1 1 200px", lineHeight: 1.5 }}>
                  Paste fills entry first, exit second. A is size up, B standard, C feeler, D pass.
                  Grades lock at logging.
                </div>
              </div>
            </CardBox>

            {/* Pre-market brief: publications, day note, auto pull */}
            <Disclosure
              title="Pre-market brief"
              meta={briefDay.read.length + "/" + brief.sources.length + " read"}
            >
              <div style={{ fontSize: 12, color: C.mutedInk, marginBottom: 10, lineHeight: 1.5 }}>
                Read each source, tick it off, and write what matters today in your own words. Those
                notes feed the levels you mark below.
              </div>

              {brief.sources.map((s) => (
                <div
                  key={s.id}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <div style={{ flex: 1 }}>
                    <CheckRow
                      checked={briefDay.read.includes(s.id)}
                      onToggle={() => toggleSourceRead(s.id)}
                    >
                      {s.name}
                    </CheckRow>
                  </div>
                  <button
                    onClick={() => deleteSource(s.id)}
                    title="Remove source"
                    style={{
                      width: 28,
                      height: 28,
                      background: "transparent",
                      border: "none",
                      color: C.mutedInk,
                      cursor: "pointer",
                      fontSize: 13,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    x
                  </button>
                </div>
              ))}

              <div style={{ display: "flex", gap: 6, marginTop: 4, marginBottom: 14 }}>
                <input
                  type="text"
                  value={newSource}
                  placeholder="Add publication"
                  onChange={(e) => setNewSource(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSource()}
                  style={{
                    ...smallInput,
                    flex: 1,
                    minHeight: 40,
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: 12,
                  }}
                />
                <button
                  onClick={addSource}
                  title="Add this publication to the daily reading list"
                  disabled={!newSource.trim()}
                  style={{
                    minHeight: 40,
                    padding: "0 12px",
                    fontSize: 12,
                    cursor: newSource.trim() ? "pointer" : "default",
                    background: "transparent",
                    color: newSource.trim() ? C.bronze : C.mutedInk,
                    border: "1px solid " + (newSource.trim() ? C.bronze : C.hairline),
                    borderRadius: 4,
                  }}
                >
                  Add
                </button>
              </div>

              <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 5 }}>
                What matters today
              </div>
              <textarea
                value={briefDay.note}
                placeholder="What matters today: levels, catalysts, the lean"
                onChange={(e) => setBriefDay({ note: e.target.value }, false)}
                onBlur={() => persistBrief(brief)}
                rows={3}
                style={{
                  ...smallInput,
                  width: "100%",
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: 13,
                  lineHeight: 1.5,
                  resize: "vertical",
                  marginBottom: 14,
                }}
              />

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: briefDay.auto || briefError ? 10 : 0,
                }}
              >
                <input
                  type="text"
                  value={brief.query}
                  placeholder="Slack search hint"
                  onChange={(e) => setBrief({ ...brief, query: e.target.value })}
                  onBlur={() => persistBrief(brief)}
                  style={{
                    ...smallInput,
                    flex: "1 1 140px",
                    minHeight: 40,
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: 12,
                  }}
                />
                <button
                  onClick={runAutoBrief}
                  title="Ask Claude to search your connected Slack for the latest transcript posts and condense them"
                  disabled={briefLoading}
                  style={{
                    minHeight: 40,
                    padding: "0 14px",
                    fontSize: 12,
                    cursor: briefLoading ? "default" : "pointer",
                    background: briefLoading ? "transparent" : C.ink,
                    color: briefLoading ? C.mutedInk : C.card,
                    border: "1px solid " + (briefLoading ? C.hairline : C.ink),
                    borderRadius: 4,
                  }}
                >
                  {briefLoading ? "Pulling..." : "Pull auto brief"}
                </button>
                <span style={{ fontSize: 11, color: C.mutedInk, flex: "1 1 160px" }}>
                  Searches your connected Slack for the latest transcript posts and condenses
                  them.
                </span>
              </div>
              {briefError && (
                <div style={{ fontSize: 12, color: C.brick, marginBottom: 6 }}>{briefError}</div>
              )}
              {briefDay.auto && (
                <div
                  style={{
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: C.ink,
                    whiteSpace: "pre-wrap",
                    borderTop: "1px solid " + C.hairline,
                    paddingTop: 10,
                  }}
                >
                  {briefDay.auto}
                </div>
              )}
            </Disclosure>

            {/* In play today: the short list of broken slot machines */}
            <Disclosure
              title="In play today"
              meta={(briefDay.watch || []).length + " named"}
            >
              <div style={{ fontSize: 12, color: C.mutedInk, marginBottom: 12, lineHeight: 1.5 }}>
                The short list of tickers where conditions favour the trader today. Three ways in:
                news, technicals, or range. If it fails the bar below, it does not go on the
                list. For the futures book, in play means the index has range and a driver; the
                state card is that call.
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "flex-end",
                  marginBottom: 12,
                }}
              >
                <input
                  type="text"
                  value={wTicker}
                  placeholder="Ticker"
                  onChange={(e) => setWTicker(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWatch()}
                  style={{ ...smallInput, width: 90, minHeight: 44 }}
                />
                <div style={{ display: "flex", gap: 5 }}>
                  {WATCH_CATS.map((c) => (
                    <button
                      key={c.v}
                      onClick={() => setWCat(c.v)}
                      title={c.v === "news" ? "In play because of a news catalyst" : c.v === "tech" ? "In play because of a technical event" : "In play because of range expansion"}
                      style={{
                        minHeight: 44,
                        padding: "0 12px",
                        fontSize: 12,
                        cursor: "pointer",
                        background: wCat === c.v ? C.ink : "transparent",
                        color: wCat === c.v ? C.card : C.mutedInk,
                        border: "1px solid " + (wCat === c.v ? C.ink : C.hairline),
                        borderRadius: 4,
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={wNote}
                  placeholder="Why it is in play (one line)"
                  onChange={(e) => setWNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWatch()}
                  style={{
                    ...smallInput,
                    flex: "1 1 170px",
                    minHeight: 44,
                    fontFamily: "'Archivo', sans-serif",
                  }}
                />
                <button
                  onClick={addWatch}
                  title="Add the ticker to today's in-play list"
                  disabled={!wTicker.trim()}
                  style={{
                    minHeight: 44,
                    padding: "0 16px",
                    fontSize: 13,
                    cursor: wTicker.trim() ? "pointer" : "default",
                    background: wTicker.trim() ? C.ink : "transparent",
                    color: wTicker.trim() ? C.card : C.mutedInk,
                    border: "1px solid " + (wTicker.trim() ? C.ink : C.hairline),
                    borderRadius: 4,
                  }}
                >
                  Add
                </button>
              </div>

              {(briefDay.watch || []).length > 5 && (
                <div style={{ fontSize: 12, color: C.brick, marginBottom: 8 }}>
                  {(briefDay.watch || []).length} names: fewer than five usually move the P&L.
                  Cut to the ones that matter.
                </div>
              )}

              {/* Scan the news or structure a pasted dump */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: showPaste || scanCands.length > 0 || scanError ? 10 : 12,
                }}
              >
                <button
                  onClick={() => runScan("web")}
                  title="Search the web for today's movers and shortlist candidates for you to vet"
                  disabled={scanLoading}
                  style={{
                    minHeight: 40,
                    padding: "0 14px",
                    fontSize: 12,
                    cursor: scanLoading ? "default" : "pointer",
                    background: "transparent",
                    color: scanLoading ? C.mutedInk : C.bronze,
                    border: "1px solid " + (scanLoading ? C.hairline : C.bronze),
                    borderRadius: 4,
                  }}
                >
                  {scanLoading ? "Scanning..." : "Scan the news"}
                </button>
                <button
                  onClick={() => setShowPaste(!showPaste)}
                  title="Paste output from your platform scanner and have it structured into candidates"
                  style={{
                    minHeight: 40,
                    padding: "0 12px",
                    fontSize: 12,
                    cursor: "pointer",
                    background: "transparent",
                    color: C.mutedInk,
                    border: "1px solid " + C.hairline,
                    borderRadius: 4,
                  }}
                >
                  Paste scan output
                </button>
                <input
                  type="text"
                  value={gTicker}
                  placeholder="Ticker"
                  onChange={(e) => setGTicker(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && gTicker.trim() && runScan("group")}
                  aria-label="Group map ticker"
                  style={{ ...smallInput, width: 76, minHeight: 40 }}
                />
                <button
                  onClick={() => runScan("group")}
                  disabled={scanLoading || !gTicker.trim()}
                  title="Map the theme and peers that trade with this ticker"
                  style={{
                    minHeight: 40,
                    padding: "0 12px",
                    fontSize: 12,
                    cursor: scanLoading || !gTicker.trim() ? "default" : "pointer",
                    background: "transparent",
                    color: scanLoading || !gTicker.trim() ? C.mutedInk : C.bronze,
                    border:
                      "1px solid " +
                      (scanLoading || !gTicker.trim() ? C.hairline : C.bronze),
                    borderRadius: 4,
                  }}
                >
                  Map the group
                </button>
                <span style={{ fontSize: 11, color: C.mutedInk, flex: "1 1 160px" }}>
                  Candidates only: you vet, nothing is added for you. The real scanner runs in
                  the platform.
                </span>
              </div>

              {showPaste && (
                <div style={{ marginBottom: 10 }}>
                  <textarea
                    value={scanPaste}
                    placeholder="Paste any scanner or watchlist dump; it gets structured into candidates"
                    onChange={(e) => setScanPaste(e.target.value)}
                    rows={3}
                    style={{
                      ...smallInput,
                      width: "100%",
                      fontFamily: "'Archivo', sans-serif",
                      fontSize: 12,
                      lineHeight: 1.5,
                      resize: "vertical",
                      marginBottom: 6,
                    }}
                  />
                  <button
                    onClick={() => runScan("paste")}
                    title="Turn the pasted dump into candidate rows"
                    disabled={scanLoading || !scanPaste.trim()}
                    style={{
                      minHeight: 36,
                      padding: "0 12px",
                      fontSize: 12,
                      cursor: scanLoading || !scanPaste.trim() ? "default" : "pointer",
                      background: "transparent",
                      color: scanLoading || !scanPaste.trim() ? C.mutedInk : C.bronze,
                      border:
                        "1px solid " +
                        (scanLoading || !scanPaste.trim() ? C.hairline : C.bronze),
                      borderRadius: 4,
                    }}
                  >
                    Structure the list
                  </button>
                </div>
              )}

              {scanError && (
                <div style={{ fontSize: 12, color: C.brick, marginBottom: 8 }}>{scanError}</div>
              )}

              {scanCands.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ ...eyebrowStyle(C.bronze), fontSize: 10 }}>
                      Candidates ({scanCands.length})
                    </span>
                    <button
                      onClick={() => setScanCands([])}
                      title="Dismiss all candidates"
                      style={{
                        minHeight: 28,
                        padding: "0 8px",
                        fontSize: 11,
                        cursor: "pointer",
                        background: "transparent",
                        color: C.mutedInk,
                        border: "1px solid " + C.hairline,
                        borderRadius: 4,
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  {scanCands.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 0",
                        borderTop: "1px dashed " + C.hairline,
                      }}
                    >
                      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500, width: 56 }}>
                        {(c.ticker || "").toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: C.bronze,
                          width: 38,
                        }}
                      >
                        {c.cat}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 12,
                          color: C.mutedInk,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.note || ""}
                      </span>
                      <button
                        onClick={() => addCandidate(c)}
                        title="Add to today's in-play list"
                        style={{
                          minHeight: 32,
                          padding: "0 12px",
                          fontSize: 11,
                          cursor: "pointer",
                          background: "transparent",
                          color: C.green,
                          border: "1px solid " + C.green,
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setScanCands(scanCands.filter((x) => x !== c))}
                        title="Dismiss"
                        style={{
                          width: 32,
                          height: 32,
                          background: "transparent",
                          border: "none",
                          color: C.mutedInk,
                          cursor: "pointer",
                          fontSize: 14,
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(briefDay.watch || []).map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderTop: "1px solid " + C.hairline,
                  }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500, width: 56 }}>
                    {w.ticker}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: C.bronze,
                      width: 38,
                    }}
                  >
                    {w.cat}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: w.note ? C.ink : C.mutedInk,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {w.note || "-"}
                  </span>
                  <button
                    onClick={() => setZTicker(w.ticker)}
                    title="Prefill the zone form with this ticker"
                    style={{
                      minHeight: 32,
                      padding: "0 10px",
                      fontSize: 11,
                      cursor: "pointer",
                      background: "transparent",
                      color: C.bronze,
                      border: "1px solid " + C.bronze,
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  >
                    To zone
                  </button>
                  <button
                    onClick={() => delWatch(w.id)}
                    title="Remove from the list"
                    style={{
                      width: 32,
                      height: 32,
                      background: "transparent",
                      border: "none",
                      color: C.mutedInk,
                      cursor: "pointer",
                      fontSize: 14,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    x
                  </button>
                </div>
              ))}

              <div
                style={{
                  borderTop: "1px solid " + C.hairline,
                  marginTop: (briefDay.watch || []).length > 0 ? 4 : 0,
                  paddingTop: 12,
                }}
              >
                <div className="cc-pb">
                  <div>
                    <div style={{ ...eyebrowStyle(C.green), marginBottom: 8 }}>What qualifies</div>
                    {INPLAY_YES.map((r, i) => (
                      <RuleLine key={i} mark="+" color={C.green}>
                        {r}
                      </RuleLine>
                    ))}
                  </div>
                  <div>
                    <div style={{ ...eyebrowStyle(C.brick), marginBottom: 8 }}>The bar</div>
                    {INPLAY_NO.map((r, i) => (
                      <RuleLine key={i} mark="x" color={C.brick}>
                        {r}
                      </RuleLine>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ ...eyebrowStyle(C.bronze), marginBottom: 8 }}>Lead-ins</div>
                  {[
                    "Overnight commodity and sector moves are catalysts for the equities that must reprice; confirm with the ETF flow (GDX, XLE, XOP), never the commodity alone",
                    "Analyst actions from institutional-flow banks are catalysts; retail-broker calls are not",
                    "Updates buried in scheduled releases surface as next-day broker actions: the flow arrives a day late, which is the trade",
                  ].map((r, i) => (
                    <RuleLine key={i} mark={i + 1} color={C.bronze}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ ...eyebrowStyle(C.green), marginBottom: 8 }}>
                    Leaders in corrections
                  </div>
                  {[
                    "Corrections reveal the leaders: relative strength line at new highs before price, higher lows against the index's lower lows, holding the 50 and 200 while the index loses them",
                    "The watchlist built during the correction is the buy list when the pressure lifts",
                    "Rotation between leadership groups is the lifeblood of an uptrend; money leaving a leader for defensives with no new group picking it up is distribution",
                  ].map((r, i) => (
                    <RuleLine key={i} mark="+" color={C.green}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: C.mutedInk, marginTop: 6 }}>
                  Sources: scanners, news aggregators, unusual volume, plus Reddit, Stocktwits
                  and X with their small cap bias priced in.
                </div>
              </div>
            </Disclosure>

            {/* State and gate: hand-set states, derived gate row, stamped on every trade */}
            <CardBox>
              <div style={{ ...eyebrowStyle(), marginBottom: 6 }}>State and gate</div>
              <div style={{ fontSize: 12, color: C.mutedInk, marginBottom: 12, lineHeight: 1.5 }}>
                Classified by hand pre-open per the composite spec: breadth band, tactical band,
                gamma sign. The gate row derives from the matrix, governs which setups are
                permitted, and is stamped on every trade.
              </div>
              {STATE_DIMS.map((dim) => {
                const cur = (briefDay.mode || {})[dim.key];
                return (
                  <div
                    key={dim.key}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ ...eyebrowStyle(), fontSize: 10, width: 88, flexShrink: 0 }}>
                      {dim.label}
                    </span>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {dim.opts.map((o) => {
                        const active = cur === o.v;
                        const col = stateChipColor(o.v);
                        return (
                          <button
                            key={o.v}
                            title={dim.label + ": " + o.label}
                            onClick={() =>
                              setBriefDay(
                                {
                                  mode: {
                                    ...(briefDay.mode || {}),
                                    [dim.key]: active ? undefined : o.v,
                                  },
                                },
                                true
                              )
                            }
                            style={{
                              minHeight: 40,
                              padding: "0 12px",
                              fontSize: 12,
                              cursor: "pointer",
                              background: active ? col : "transparent",
                              color: active ? C.card : C.mutedInk,
                              border: "1px solid " + (active ? col : C.hairline),
                              borderRadius: 4,
                            }}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {(() => {
                const gate = deriveGate(briefDay.mode || {});
                const anySet =
                  briefDay.mode && Object.values(briefDay.mode).filter(Boolean).length > 0;
                const gammaNeg = (briefDay.mode || {}).gamma === "neg";
                return (
                  <div
                    style={{
                      borderTop: "1px solid " + C.hairline,
                      paddingTop: 10,
                      marginTop: 4,
                    }}
                  >
                    {anySet ? (
                      <>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 10,
                            flexWrap: "wrap",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              ...monoNum,
                              fontSize: 15,
                              fontWeight: 600,
                              color: gate.row === "G7" ? C.brick : C.ink,
                            }}
                          >
                            {gate.row}
                          </span>
                          <span style={{ fontSize: 12.5, color: C.green }}>
                            Permitted: {gate.permitted}
                          </span>
                          <span style={{ fontSize: 12.5, color: C.brick }}>
                            Forbidden: {gate.forbidden}
                          </span>
                        </div>
                        {gammaNeg && (
                          <div style={{ fontSize: 12, color: C.bronze }}>
                            G6 overlay: momentum entries, wider stops, smaller size; no anticipatory
                            fades. Reversal cards trade only after the confirmed turn.
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: C.mutedInk, marginTop: 4 }}>
                          The row governs the composite cards. Reversal cards are eligible in every
                          classified row; trend cards answer to the 10 and 20 day market filter;
                          futures and scalps answer to the session guardrails. Each playbook card
                          shows its own reading of today's state.
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 12.5, color: C.mutedInk }}>
                        Classify before the first entry. No classification, no trade.
                      </span>
                    )}
                  </div>
                );
              })()}
            </CardBox>

            {/* AI read: screenshot in, resemblance and verdict out */}
            <Disclosure title="AI read" meta="second opinion, abstains by default">
              <div style={{ fontSize: 12, color: C.mutedInk, marginBottom: 12, lineHeight: 1.5 }}>
                Add the execution-frame shot (and optionally the higher timeframe), tick what you
                can verify off-chart, and the read classifies resemblance against the full
                playbook, checks it against today's gate, and grades or abstains. A screenshot
                cannot verify volume pace, filings or borrow: unticked counts as missing and caps
                the grade. Expect no trade most of the time.
              </div>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
                {aiShots.map((d, i) => (
                  <div key={i} style={{ position: "relative", display: "inline-block" }}>
                    <img
                      src={d}
                      alt={"AI shot " + (i + 1)}
                      onClick={() => setLightbox(d)}
                      style={{
                        height: 64,
                        borderRadius: 4,
                        border: "1px solid " + C.hairline,
                        cursor: "zoom-in",
                        display: "block",
                      }}
                    />
                    <button
                      onClick={() => setAiShots(aiShots.filter((_, j) => j !== i))}
                      title="Remove this shot"
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        width: 22,
                        height: 22,
                        lineHeight: "20px",
                        fontSize: 12,
                        padding: 0,
                        background: C.ink,
                        color: C.card,
                        border: "none",
                        borderRadius: 11,
                        cursor: "pointer",
                      }}
                    >
                      x
                    </button>
                  </div>
                ))}
                {aiShots.length < 2 && (
                  <label
                    title={aiShots.length === 0 ? "Upload the entry-frame chart" : "Upload the higher timeframe for context"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 44,
                      padding: "0 14px",
                      fontSize: 12,
                      color: C.mutedInk,
                      border: "1px dashed " + C.hairline,
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    {aiShots.length === 0 ? "Add chart shot" : "Add higher timeframe"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files && e.target.files[0];
                        if (f) addAiShot(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="cc-checks" style={{ marginBottom: 10 }}>
                {AI_CONTEXT.map((c) => (
                  <CheckRow
                    key={c.id}
                    checked={aiTicks.includes(c.id)}
                    onToggle={() => toggleIn(aiTicks, setAiTicks, c.id)}
                  >
                    {c.label}
                  </CheckRow>
                ))}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  value={aiNote}
                  placeholder="Anything else verified (optional)"
                  onChange={(e) => setAiNote(e.target.value)}
                  style={{
                    ...smallInput,
                    flex: "1 1 200px",
                    minHeight: 44,
                    fontFamily: "'Archivo', sans-serif",
                  }}
                />
                <button
                  onClick={runAiRead}
                  title="Send the shots and ticks to Claude for a resemblance read; it abstains by default"
                  disabled={aiLoading || aiShots.length === 0}
                  style={{
                    minHeight: 44,
                    padding: "0 16px",
                    fontSize: 13,
                    cursor: aiLoading || aiShots.length === 0 ? "default" : "pointer",
                    background: aiLoading || aiShots.length === 0 ? "transparent" : C.ink,
                    color: aiLoading || aiShots.length === 0 ? C.mutedInk : C.card,
                    border:
                      "1px solid " +
                      (aiLoading || aiShots.length === 0 ? C.hairline : C.ink),
                    borderRadius: 4,
                  }}
                >
                  {aiLoading ? "Reading..." : "Read the chart"}
                </button>
              </div>

              {aiError && (
                <div style={{ fontSize: 12, color: C.brick, marginBottom: 8 }}>{aiError}</div>
              )}

              {aiResult && (
                <div
                  style={{
                    borderTop: "1px solid " + C.hairline,
                    paddingTop: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: aiResult.verdict === "trade" ? C.green : C.brick,
                      }}
                    >
                      {aiResult.verdict === "trade" ? "Trade" : "No trade"}
                    </span>
                    {aiResult.setupName && (
                      <span style={{ fontSize: 13, color: C.ink }}>{aiResult.setupName}</span>
                    )}
                    {aiResult.grade && <GradeBadge g={aiResult.grade} size={22} />}
                    {aiResult.verdict === "trade" && (
                      <button
                        onClick={useAiInJournal}
                        title="Prefill the entry form with this setup and grade; your eyes still decide"
                        style={{
                          minHeight: 36,
                          padding: "0 12px",
                          fontSize: 12,
                          cursor: "pointer",
                          background: "transparent",
                          color: C.bronze,
                          border: "1px solid " + C.bronze,
                          borderRadius: 4,
                        }}
                      >
                        Use in journal
                      </button>
                    )}
                  </div>
                  {(aiResult.reasons || []).map((r, i) => (
                    <RuleLine key={"r" + i} mark={i + 1} color={C.bronze}>
                      {r}
                    </RuleLine>
                  ))}
                  {(aiResult.missing || []).length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      {(aiResult.missing || []).map((m, i) => (
                        <RuleLine key={"m" + i} mark="x" color={C.brick}>
                          {m}
                        </RuleLine>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: C.mutedInk, marginTop: 8 }}>
                    A second opinion on resemblance, not a signal. Your eyes and the gate decide;
                    the grade still locks at logging.
                  </div>
                </div>
              )}
            </Disclosure>

            {/* Location check: three questions that identify no man's land */}
            <Disclosure title="No man's land check" meta="the three questions">
              <div style={{ fontSize: 12, color: C.mutedInk, marginBottom: 10, lineHeight: 1.5 }}>
                No man's land is any entry more than about 1 ATR from the nearest significant
                level on the chart that produced the trade: the same idea that pays at a level
                loses money in the middle. Five answers before any click that did not come from
                one of your marked levels; one missing answer means the middle.
              </div>
              <div className="cc-pb">
                <div>
                  <div style={{ ...eyebrowStyle(C.bronze), marginBottom: 4 }}>
                    The five questions {nmlChecks.length}/{NML_CHECK.length}
                  </div>
                  {NML_CHECK.map((c) => (
                    <CheckRow
                      key={c.id}
                      checked={nmlChecks.includes(c.id)}
                      onToggle={() => toggleIn(nmlChecks, setNmlChecks, c.id)}
                    >
                      {c.label}
                    </CheckRow>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid " + C.hairline,
                      marginTop: 8,
                      paddingTop: 8,
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        lineHeight: 1.4,
                        color:
                          nmlChecks.length === NML_CHECK.length
                            ? C.green
                            : nmlChecks.length > 0
                            ? C.brick
                            : C.mutedInk,
                      }}
                    >
                      {nmlChecks.length === NML_CHECK.length
                        ? "Located: entry, stop and target are three written numbers at a defended level."
                        : nmlChecks.length > 0
                        ? "No man's land: one missing answer means the middle. Write the level, set the alarm, let price come to it."
                        : "Answer the five before the click."}
                    </span>
                    {nmlChecks.length > 0 && (
                      <button
                        onClick={() => setNmlChecks([])}
                        title="Untick the five questions"
                        style={{
                          padding: "6px 10px",
                          minHeight: 32,
                          fontSize: 11,
                          cursor: "pointer",
                          background: "transparent",
                          color: C.mutedInk,
                          border: "1px solid " + C.hairline,
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(), marginBottom: 8 }}>The law</div>
                  {NML_LAW.map((r, i) => (
                    <RuleLine
                      key={i}
                      mark={r.mark}
                      color={r.color === "brick" ? C.brick : C.green}
                    >
                      {r.text}
                    </RuleLine>
                  ))}
                  <div style={{ fontSize: 11, color: C.mutedInk, marginTop: 8 }}>
                    Structural defence: trades entered from an armed zone or a playbook read carry
                    that path on the ledger; anything else is stamped unplanned, in red, to be
                    answered for at the end of the day.
                  </div>
                </div>
              </div>
            </Disclosure>

            {/* Zones of interest: pre-market plan, resolved by the close */}
            <CardBox>
              <div style={{ ...eyebrowStyle(), marginBottom: 6 }}>Zones of interest</div>
              <div style={{ fontSize: 12, color: C.mutedInk, marginBottom: 12, lineHeight: 1.5 }}>
                Pre-market: write each level here and set the matching price alarm in the platform
                (TradingView, Volumetrica, TWS). By the close, every level must be marked taken,
                passed or not reached; passes count into the Opportunity statistics automatically.
              </div>

              {/* Add zone */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "flex-end",
                  marginBottom: 14,
                }}
              >
                <input
                  type="text"
                  value={zTicker}
                  onChange={(e) => setZTicker(e.target.value)}
                  aria-label="Zone ticker"
                  style={{ ...smallInput, width: 78, minHeight: 44 }}
                />
                <input
                  type="text"
                  value={zLevel}
                  placeholder="Level or zone"
                  onChange={(e) => setZLevel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveZone()}
                  aria-label="Zone level"
                  style={{ ...smallInput, flex: "1 1 110px", minHeight: 44 }}
                />
                <div style={{ display: "flex", gap: 5 }}>
                  {[
                    { k: "long", label: "L", color: C.green },
                    { k: "short", label: "S", color: C.brick },
                  ].map((s) => (
                    <button
                      key={s.k}
                      onClick={() => setZSide(s.k)}
                      title={s.k === "long" ? "Long: buying at or through the level" : "Short: selling at or through the level"}
                      style={{
                        width: 44,
                        height: 44,
                        padding: 0,
                        fontFamily: MONO,
                        fontSize: 14,
                        cursor: "pointer",
                        background: zSide === s.k ? s.color : "transparent",
                        color: zSide === s.k ? C.card : s.color,
                        border: "1px solid " + (zSide === s.k ? s.color : C.hairline),
                        borderRadius: 4,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setZGrade(zGrade === g ? "" : g)}
                      title={"Expected quality " + g}
                      style={{
                        width: 44,
                        height: 44,
                        padding: 0,
                        fontFamily: MONO,
                        fontSize: 14,
                        cursor: "pointer",
                        background: zGrade === g ? gradeColor(g) : "transparent",
                        color: zGrade === g ? C.card : gradeColor(g),
                        border: "1px solid " + (zGrade === g ? gradeColor(g) : C.hairline),
                        borderRadius: 4,
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={zStop}
                  placeholder="Stop"
                  title="Stop price for this level, just behind it (optional)"
                  onChange={(e) => setZStop(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveZone()}
                  aria-label="Zone stop"
                  style={{ ...smallInput, width: 84, minHeight: 44 }}
                />
                <input
                  type="text"
                  value={zTarget}
                  placeholder="Target"
                  title="Target price: the nearest opposing level, or the average for a fade (optional)"
                  onChange={(e) => setZTarget(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveZone()}
                  aria-label="Zone target"
                  style={{ ...smallInput, width: 84, minHeight: 44 }}
                />
                <input
                  type="text"
                  value={zSetup}
                  placeholder="Expected setup (optional)"
                  onChange={(e) => setZSetup(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveZone()}
                  aria-label="Zone setup"
                  style={{
                    ...smallInput,
                    flex: "1 1 170px",
                    minHeight: 44,
                    fontFamily: "'Archivo', sans-serif",
                  }}
                />
                <button
                  onClick={saveZone}
                  title="Save the level; set the matching price alarm in your platform"
                  disabled={!zLevel.trim()}
                  style={{
                    minHeight: 44,
                    padding: "0 16px",
                    fontSize: 13,
                    cursor: zLevel.trim() ? "pointer" : "default",
                    background: zLevel.trim() ? C.ink : "transparent",
                    color: zLevel.trim() ? C.card : C.mutedInk,
                    border: "1px solid " + (zLevel.trim() ? C.ink : C.hairline),
                    borderRadius: 4,
                  }}
                >
                  Arm zone
                </button>
              </div>

              {/* Armed zones */}
              {(() => {
                const armed = zones.filter((z) => z.status === "armed");
                const resolvedToday = zones.filter(
                  (z) => z.status !== "armed" && z.resolvedAt === today()
                );
                const counts = {
                  taken: resolvedToday.filter((z) => z.status === "triggered-taken").length,
                  passed: resolvedToday.filter((z) => z.status === "triggered-passed").length,
                  none: resolvedToday.filter((z) => z.status === "untriggered").length,
                };
                return (
                  <>
                    {armed.length === 0 && (
                      <div style={{ fontSize: 12, color: C.mutedInk }}>
                        No zones yet. Write the levels before the open.
                      </div>
                    )}
                    {armed.map((z) => (
                      <div
                        key={z.id}
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 0",
                          borderTop: "1px solid " + C.hairline,
                        }}
                      >
                        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500 }}>
                              {z.ticker}
                            </span>
                            <span
                              style={{
                                fontFamily: MONO,
                                fontSize: 11,
                                color: z.side === "long" ? C.green : C.brick,
                              }}
                            >
                              {z.side === "long" ? "L" : "S"}
                            </span>
                            <span style={{ ...monoNum, fontSize: 13 }}>{z.level}</span>
                            {(z.stopPx || z.targetPx) && (
                              <span style={{ ...monoNum, fontSize: 11, color: C.mutedInk }}>
                                {z.stopPx ? "stop " + z.stopPx : ""}
                                {z.stopPx && z.targetPx ? " · " : ""}
                                {z.targetPx ? "target " + z.targetPx : ""}
                              </span>
                            )}
                            <GradeBadge g={z.grade} size={18} />
                            {z.date !== today() && (
                              <span style={{ ...monoNum, fontSize: 10, color: C.brick }}>
                                {z.date}
                              </span>
                            )}
                          </div>
                          {z.setup && (
                            <div
                              style={{
                                fontSize: 11,
                                color: C.mutedInk,
                                marginTop: 2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {z.setup}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            onClick={() => resolveZone(z.id, "triggered-taken")}
                            title="It triggered and you took it: prefills the entry form"
                            style={{
                              minHeight: 36,
                              padding: "0 10px",
                              fontSize: 11,
                              cursor: "pointer",
                              background: "transparent",
                              color: C.green,
                              border: "1px solid " + C.green,
                              borderRadius: 4,
                            }}
                          >
                            Took it
                          </button>
                          <button
                            onClick={() => resolveZone(z.id, "triggered-passed")}
                            title="It triggered and you let it go: logs a pass into Opportunity"
                            style={{
                              minHeight: 36,
                              padding: "0 10px",
                              fontSize: 11,
                              cursor: "pointer",
                              background: "transparent",
                              color: C.bronze,
                              border: "1px solid " + C.bronze,
                              borderRadius: 4,
                            }}
                          >
                            Passed
                          </button>
                          <button
                            onClick={() => resolveZone(z.id, "untriggered")}
                            title="Price never reached it: retired without counting against you"
                            style={{
                              minHeight: 36,
                              padding: "0 10px",
                              fontSize: 11,
                              cursor: "pointer",
                              background: "transparent",
                              color: C.mutedInk,
                              border: "1px solid " + C.hairline,
                              borderRadius: 4,
                            }}
                          >
                            No trigger
                          </button>
                          <button
                            onClick={() => deleteZone(z.id)}
                            title="Delete zone"
                            style={{
                              width: 36,
                              height: 36,
                              background: "transparent",
                              border: "none",
                              color: C.mutedInk,
                              cursor: "pointer",
                              fontSize: 14,
                              lineHeight: 1,
                            }}
                          >
                            x
                          </button>
                        </div>
                      </div>
                    ))}
                    {resolvedToday.length > 0 && (
                      <div
                        style={{
                          fontSize: 12,
                          color: C.mutedInk,
                          borderTop: "1px solid " + C.hairline,
                          paddingTop: 8,
                          marginTop: armed.length === 0 ? 10 : 0,
                        }}
                      >
                        Resolved today:{" "}
                        <span style={monoNum}>
                          {counts.taken} taken · {counts.passed} passed · {counts.none} no trigger
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardBox>

            {/* Stats */}
            <CardBox>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                  gap: 12,
                }}
              >
                <div style={eyebrowStyle()}>Edge</div>
                <button
                  onClick={applyJournalStats}
                  disabled={!canApply}
                  title={canApply ? "" : "Needs at least one win and one loss"}
                  style={{
                    padding: "6px 12px",
                    minHeight: 32,
                    fontSize: 12,
                    cursor: canApply ? "pointer" : "default",
                    background: "transparent",
                    color: canApply ? C.bronze : C.mutedInk,
                    border: "1px solid " + (canApply ? C.bronze : C.hairline),
                    borderRadius: 4,
                  }}
                >
                  Project forward
                </button>
              </div>
              <div className="cc-stats">
                <Stat
                  label="Expectancy / trade"
                  value={fmtR(journal.evR)}
                  sub={
                    trades.length > 0
                      ? fmtMoney(journal.evR * 100).replace("$-", "-$") + " per $100 risked"
                      : "no trades yet"
                  }
                  tone={trades.length === 0 ? C.mutedInk : journal.evR < 0 ? C.brick : C.green}
                />
                <Stat
                  label="Win rate"
                  value={(journal.winRateJ * 100).toFixed(1) + "%"}
                  sub={
                    journal.wins +
                    "W / " +
                    journal.losses +
                    "L" +
                    (journal.scratches ? " / " + journal.scratches + " scratch" : "")
                  }
                />
                <Stat
                  label="Avg win / avg loss"
                  value={
                    journal.losses > 0 && journal.wins > 0
                      ? (journal.avgWinR / journal.avgLossR).toFixed(2) + "R"
                      : "n/a"
                  }
                  sub={fmtR(journal.avgWinR, 2) + " vs -" + journal.avgLossR.toFixed(2) + "R"}
                />
                <Stat
                  label="Total"
                  value={fmtR(journal.totalR)}
                  sub={trades.length + " trades"}
                  tone={journal.totalR < 0 ? C.brick : C.ink}
                />
              </div>
            </CardBox>

            {/* Ledger */}
            <CardBox>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={eyebrowStyle()}>Ledger</div>
                {trades.length > 0 && (
                  <button
                    onClick={clearAll}
                    title="Delete every trade and screenshot; asks once to confirm"
                    style={{
                      padding: "6px 10px",
                      minHeight: 32,
                      fontSize: 12,
                      cursor: "pointer",
                      background: "transparent",
                      color: confirmClear ? C.brick : C.mutedInk,
                      border: "1px solid " + (confirmClear ? C.brick : C.hairline),
                      borderRadius: 4,
                    }}
                  >
                    {confirmClear ? "Confirm clear all" : "Clear all"}
                  </button>
                )}
              </div>

              {loading ? (
                <div style={{ fontSize: 13, color: C.mutedInk }}>Loading journal...</div>
              ) : trades.length === 0 ? (
                <div style={{ fontSize: 13, color: C.mutedInk }}>
                  No trades yet. Log the first one above.
                </div>
              ) : (
                (() => {
                  let cum = 0;
                  const withCum = journal.sorted.map((t) => {
                    cum += t.r;
                    return { ...t, cum };
                  });
                  return withCum.reverse().map((t) => (
                    <div key={t.id}>
                      <div
                        onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                        title="Show details"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto 36px",
                          gap: 10,
                          alignItems: "center",
                          minHeight: 54,
                          padding: "8px 0",
                          borderBottom: expandedId === t.id ? "none" : "1px solid " + C.hairline,
                          cursor: "pointer",
                          background:
                            expandedId === t.id ? "rgba(165,128,76,0.06)" : "transparent",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 500 }}>
                              {t.ticker}
                            </span>
                            <GradeBadge g={t.grade} />
                            {(t.hasEntry || t.hasExit) && (
                              <span style={{ ...monoNum, fontSize: 10, color: C.bronze }}>
                                {t.hasEntry && t.hasExit ? "E+X" : t.hasEntry ? "E" : "X"}
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: C.mutedInk,
                              marginTop: 3,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            <span style={monoNum}>{t.date}</span>
                            {t.setup ? " · " + t.setup : ""}
                            {t.checks ? " · " + t.checks.length + "/" + CHECKLIST.length : ""}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              ...monoNum,
                              fontSize: 15,
                              fontWeight: 500,
                              color: t.r > 0 ? C.green : t.r < 0 ? C.brick : C.mutedInk,
                            }}
                          >
                            {fmtR(t.r, 1)}
                          </div>
                          <div style={{ ...monoNum, fontSize: 11, color: C.mutedInk, marginTop: 3 }}>
                            {fmtR(t.cum, 1)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrade(t.id);
                          }}
                          title="Delete trade"
                          style={{
                            width: 36,
                            height: 36,
                            background: "transparent",
                            border: "none",
                            color: C.mutedInk,
                            cursor: "pointer",
                            fontSize: 15,
                            lineHeight: 1,
                          }}
                        >
                          x
                        </button>
                      </div>
                      {expandedId === t.id && (
                        <div
                          style={{
                            padding: "6px 0 16px 0",
                            borderBottom: "1px solid " + C.hairline,
                            background: "rgba(165,128,76,0.06)",
                          }}
                        >
                          <div style={{ padding: "4px 10px 14px 10px" }}>
                            {t.path && (
                              <div style={{ fontSize: 12, marginBottom: 6, color: t.path === "unplanned" ? C.brick : C.mutedInk }}>
                                Entry path:{" "}
                                <span style={monoNum}>
                                  {t.path === "zone"
                                    ? "from a zone"
                                    : t.path === "playbook"
                                    ? "playbook read"
                                    : "unplanned"}
                                </span>
                              </div>
                            )}
                            {(t.stopPx || t.targetPx || t.mfe != null || t.mae != null || t.exitReason) && (
                              <div style={{ fontSize: 12, color: C.mutedInk, marginBottom: 6 }}>
                                Exit:{" "}
                                <span style={monoNum}>
                                  {[
                                    t.stopPx ? "stop " + t.stopPx : null,
                                    t.targetPx ? "target " + t.targetPx : null,
                                    t.mfe != null ? "MFE +" + t.mfe.toFixed(1) + "R" : null,
                                    t.mae != null ? "MAE -" + t.mae.toFixed(1) + "R" : null,
                                    t.exitReason || null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              </div>
                            )}
                            {t.mode && (
                              <div style={{ fontSize: 12, color: C.mutedInk, marginBottom: 8 }}>
                                State:{" "}
                                <span style={monoNum}>
                                  {["gate", "h4", "h3", "gamma", "filter", "lean", "vol"]
                                    .map((k) => t.mode[k])
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              </div>
                            )}
                            {t.pbChecks &&
                              (() => {
                                const ps = PLAYBOOK.find((s) => s.id === t.pbChecks.setupId);
                                if (!ps) return null;
                                return (
                                  <div style={{ marginBottom: 10 }}>
                                    <div
                                      style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 6 }}
                                    >
                                      Setup conditions ({ps.name}){" "}
                                      {t.pbChecks.conds.length}/{ps.quality.length}
                                    </div>
                                    {ps.quality.map((q) => {
                                      const done = t.pbChecks.conds.includes(q.id);
                                      return (
                                        <div
                                          key={q.id}
                                          style={{
                                            fontSize: 12,
                                            lineHeight: 1.5,
                                            color: done ? C.ink : C.mutedInk,
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontFamily: MONO,
                                              color: done ? C.green : C.brick,
                                              marginRight: 6,
                                            }}
                                          >
                                            {done ? "+" : "x"}
                                          </span>
                                          {q.label}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 6 }}>
                              Checklist{" "}
                              {t.checks ? t.checks.length + "/" + CHECKLIST.length : ""}
                            </div>
                            {t.checks ? (
                              <div className="cc-checks">
                                {CHECKLIST.map((c) => {
                                  const done = t.checks.includes(c.id);
                                  return (
                                    <div
                                      key={c.id}
                                      style={{
                                        fontSize: 12,
                                        lineHeight: 1.5,
                                        color: done ? C.ink : C.mutedInk,
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontFamily: MONO,
                                          color: done ? C.green : C.brick,
                                          marginRight: 6,
                                        }}
                                      >
                                        {done ? "+" : "x"}
                                      </span>
                                      {c.label}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: C.mutedInk }}>
                                No pre-trade checklist logged.
                              </div>
                            )}
                          </div>
                          <div className="cc-shots" style={{ padding: "0 10px" }}>
                            {renderStoredShot(t, "entry")}
                            {renderStoredShot(t, "exit")}
                          </div>
                        </div>
                      )}
                    </div>
                  ));
                })()
              )}
            </CardBox>

            {/* Results by grade */}
            {byGrade.rows.length > 0 && (
              <CardBox>
                <div style={{ ...eyebrowStyle(), marginBottom: 12 }}>Results by grade</div>
                <div
                  className="cc-grade-row"
                  style={{
                    ...eyebrowStyle(),
                    fontSize: 10,
                    paddingBottom: 8,
                    borderBottom: "1px solid " + C.hairline,
                  }}
                >
                  <div>Grade</div>
                  <div style={{ textAlign: "right" }}>Trades</div>
                  <div style={{ textAlign: "right" }}>Win rate</div>
                  <div style={{ textAlign: "right" }}>Exp / trade</div>
                  <div style={{ textAlign: "right" }}>Total R</div>
                </div>
                {byGrade.rows.map((r) => (
                  <div
                    key={r.g}
                    className="cc-grade-row"
                    style={{
                      padding: "9px 0",
                      borderBottom: "1px solid " + C.hairline,
                      ...monoNum,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ color: gradeColor(r.g), fontWeight: 500 }}>{r.g}</div>
                    <div style={{ textAlign: "right", color: C.mutedInk }}>{r.n}</div>
                    <div style={{ textAlign: "right" }}>{(r.wr * 100).toFixed(0)}%</div>
                    <div
                      style={{
                        textAlign: "right",
                        color: r.ev > 0 ? C.green : r.ev < 0 ? C.brick : C.ink,
                      }}
                    >
                      {fmtR(r.ev)}
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        color: r.total > 0 ? C.green : r.total < 0 ? C.brick : C.ink,
                      }}
                    >
                      {fmtR(r.total, 1)}
                    </div>
                  </div>
                ))}
                {byGrade.ungraded > 0 && (
                  <div style={{ fontSize: 12, color: C.mutedInk, marginTop: 8 }}>
                    {byGrade.ungraded} ungraded trade{byGrade.ungraded > 1 ? "s" : ""} excluded.
                  </div>
                )}
                {byGrade.verdict && (
                  <div
                    style={{
                      fontSize: 13,
                      color: byGrade.verdictGood ? C.green : C.brick,
                      marginTop: 10,
                    }}
                  >
                    {byGrade.verdict}
                  </div>
                )}
              </CardBox>
            )}

            {/* Opportunity: seen versus taken */}
            <CardBox>
              <div style={{ ...eyebrowStyle(), marginBottom: 6 }}>Opportunity</div>
              <div style={{ fontSize: 12, color: C.mutedInk, marginBottom: 12, lineHeight: 1.5 }}>
                Every logged trade counts as taken. Log the valid setups you let go, from the
                playbook or here, so the take rate means something.
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  alignItems: "flex-end",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", gap: 5 }}>
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setPGrade(pGrade === g ? "" : g)}
                      title={GRADE_TIPS[g]}
                      style={{
                        width: 44,
                        height: 44,
                        padding: 0,
                        fontFamily: MONO,
                        fontSize: 15,
                        cursor: "pointer",
                        background: pGrade === g ? gradeColor(g) : "transparent",
                        color: pGrade === g ? C.card : gradeColor(g),
                        border: "1px solid " + (pGrade === g ? gradeColor(g) : C.hairline),
                        borderRadius: 4,
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={pSetup}
                  placeholder="Setup (optional)"
                  onChange={(e) => setPSetup(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && pGrade) {
                      savePass(pSetup, pGrade);
                      setPGrade("");
                      setPSetup("");
                    }
                  }}
                  style={{
                    ...smallInput,
                    flex: "1 1 160px",
                    minHeight: 44,
                    fontFamily: "'Archivo', sans-serif",
                  }}
                />
                <button
                  onClick={() => {
                    if (!pGrade) return;
                    savePass(pSetup, pGrade);
                    setPGrade("");
                    setPSetup("");
                  }}
                  title="Record a valid setup you let go, so the take rate stays honest"
                  disabled={!pGrade}
                  style={{
                    minHeight: 44,
                    padding: "0 16px",
                    fontSize: 13,
                    cursor: pGrade ? "pointer" : "default",
                    background: "transparent",
                    color: pGrade ? C.bronze : C.mutedInk,
                    border: "1px solid " + (pGrade ? C.bronze : C.hairline),
                    borderRadius: 4,
                  }}
                >
                  Log pass
                </button>
              </div>

              <div className="cc-stats" style={{ marginBottom: passes.length > 0 ? 14 : 0 }}>
                <Stat
                  label="Setups seen"
                  value={String(opp.seen)}
                  sub={trades.length + " taken / " + passes.length + " passed"}
                  tone={opp.seen === 0 ? C.mutedInk : C.ink}
                />
                <Stat
                  label="Take rate"
                  value={opp.seen > 0 ? (opp.takeRate * 100).toFixed(0) + "%" : "n/a"}
                />
                <Stat
                  label="Missed A + B"
                  value={String(opp.missedCount)}
                  sub={
                    opp.missedCount > 0
                      ? "about " + fmtR(opp.missedR, 1) + " forgone"
                      : "none logged"
                  }
                  tone={opp.missedCount > 0 ? C.brick : C.ink}
                />
                <Stat
                  label="Passes held"
                  value={String(opp.disciplined)}
                  sub="C and D let go"
                  tone={opp.disciplined > 0 ? C.green : C.mutedInk}
                />
              </div>

              {passes.length > 0 &&
                [...passes]
                  .slice(-5)
                  .reverse()
                  .map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "7px 0",
                        borderTop: "1px solid " + C.hairline,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ ...monoNum, color: C.mutedInk }}>{p.date}</span>
                      <GradeBadge g={p.grade} size={18} />
                      <span
                        style={{
                          color: p.setup ? C.ink : C.mutedInk,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {p.setup || "-"}
                      </span>
                      <button
                        onClick={() => deletePass(p.id)}
                        title="Delete pass"
                        style={{
                          width: 32,
                          height: 32,
                          background: "transparent",
                          border: "none",
                          color: C.mutedInk,
                          cursor: "pointer",
                          fontSize: 14,
                          lineHeight: 1,
                        }}
                      >
                        x
                      </button>
                    </div>
                  ))}
            </CardBox>

            {/* Excursions: stop and target design from the ledger */}
            {excursions.total > 0 && (
              <CardBox>
                <div style={{ ...eyebrowStyle(), marginBottom: 6 }}>Excursions</div>
                <div style={{ fontSize: 12, color: C.mutedInk, marginBottom: 12, lineHeight: 1.5 }}>
                  From trades logged with MFE and MAE. The e-ratio asks whether the entry grows
                  anything for an exit to harvest: near 1.0 it does not, and no bracket fixes that.
                  Winners' MAE at the 75th percentile is where a stop keeps three quarters of the
                  winners; losers' median MFE is the profit offered on the way to failing, the floor
                  for a target. Give-back is what a trail costs. Under twenty trades a row is a
                  direction, not a result; the memo's floor is a hundred per cell.
                </div>
                <div style={{ overflowX: "auto" }}>
                  <div style={{ minWidth: 640 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(90px,1.3fr) 44px 64px 92px 92px 80px 72px",
                        gap: 8,
                        ...eyebrowStyle(),
                        fontSize: 10,
                        paddingBottom: 8,
                        borderBottom: "1px solid " + C.hairline,
                      }}
                    >
                      <div>Setup</div>
                      <div style={{ textAlign: "right" }}>n</div>
                      <div style={{ textAlign: "right" }}>e-ratio</div>
                      <div style={{ textAlign: "right" }}>Stop p75 W</div>
                      <div style={{ textAlign: "right" }}>Target floor</div>
                      <div style={{ textAlign: "right" }}>Give-back</div>
                      <div style={{ textAlign: "right" }}>Discr.</div>
                    </div>
                    {[excursions.all, ...excursions.rows].map((r, idx) => (
                      <div
                        key={idx + r.label}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(90px,1.3fr) 44px 64px 92px 92px 80px 72px",
                          gap: 8,
                          alignItems: "center",
                          padding: "9px 0",
                          borderBottom: "1px solid " + C.hairline,
                          ...monoNum,
                          fontSize: 13,
                          color: r.n < 20 ? C.mutedInk : C.ink,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'Archivo', sans-serif",
                            fontWeight: idx === 0 ? 600 : 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.label}
                          {r.n < 20 && (
                            <span style={{ fontSize: 10, color: C.mutedInk, marginLeft: 6 }}>directional</span>
                          )}
                        </div>
                        <div style={{ textAlign: "right", color: C.mutedInk }}>{r.n}</div>
                        <div
                          style={{
                            textAlign: "right",
                            color:
                              r.eRatio === null
                                ? C.mutedInk
                                : r.eRatio >= 1.3
                                ? C.green
                                : r.eRatio <= 1.1
                                ? C.brick
                                : C.ink,
                          }}
                        >
                          {r.eRatio === null ? "-" : r.eRatio.toFixed(2)}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {r.winMaeP75 === null ? "-" : "-" + r.winMaeP75.toFixed(2) + "R"}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {r.loseMfeMed === null ? "-" : "+" + r.loseMfeMed.toFixed(2) + "R"}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {r.giveback === null ? "-" : r.giveback.toFixed(2) + "R"}
                        </div>
                        <div style={{ textAlign: "right", color: r.disc > 0.2 ? C.brick : C.mutedInk }}>
                          {(r.disc * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.mutedInk, marginTop: 8 }}>
                  Rules the table enforces: a stop is never widened from MAE (beyond the tested stop
                  is a counterfactual); a trail is licensed only by fat mass in winners' MFE beyond
                  the target; redesign is done in ATR units and validated on a fresh sample.
                </div>
              </CardBox>
            )}

            {/* Cumulative R curve */}
            {trades.length > 0 && (
              <CardBox style={{ padding: "18px 12px 8px 0" }}>
                <div style={{ ...eyebrowStyle(), padding: "0 0 10px 20px" }}>Cumulative R</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={journal.curve} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid stroke={C.hairline} vertical={false} />
                    <XAxis
                      dataKey="n"
                      tick={{ fontSize: 11, fill: C.mutedInk, fontFamily: MONO }}
                      tickLine={false}
                      axisLine={{ stroke: C.hairline }}
                    />
                    <YAxis
                      tickFormatter={(v) => v + "R"}
                      tick={{ fontSize: 11, fill: C.mutedInk, fontFamily: MONO }}
                      tickLine={false}
                      axisLine={false}
                      width={54}
                    />
                    <Tooltip
                      formatter={(v) => [fmtR(v), "Cumulative"]}
                      labelFormatter={(l) => "trade " + l}
                      contentStyle={{
                        background: C.card,
                        border: "1px solid " + C.hairline,
                        borderRadius: 4,
                        fontFamily: MONO,
                        fontSize: 12,
                      }}
                    />
                    <ReferenceLine y={0} stroke={C.bronze} strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="cumR"
                      stroke={journal.totalR < 0 ? C.brick : C.ink}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardBox>
            )}
          </div>
        )}

        {/* ============ PLAYBOOK ============ */}
        {view === "playbook" && (
          <div>
            {[
              { key: "setup", label: "Setups" },
              { key: "trend", label: "Trend" },
              { key: "composite", label: "Composite" },
              { key: "scalp", label: "Scalps" },
            ].map((grp) => (
              <div
                key={grp.key}
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: grp.key === "scalp" ? 18 : 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span style={{ ...eyebrowStyle(), fontSize: 10, width: 66, flexShrink: 0 }}>
                  {grp.label}
                </span>
                {PLAYBOOK.filter((s) => (s.group || "setup") === grp.key).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => switchPbSetup(s.id)}
                    title={"Open the " + s.name + " card" + (s.ready ? " (finalised)" : "")}
                    style={{
                      padding: "9px 12px",
                      minHeight: 40,
                      fontSize: 12,
                      cursor: "pointer",
                      background: pbSetup === s.id ? C.bronze : "transparent",
                      color: pbSetup === s.id ? C.card : C.mutedInk,
                      border: "1px solid " + (pbSetup === s.id ? C.bronze : C.hairline),
                      borderRadius: 4,
                    }}
                  >
                    {s.name}
                    {s.ready ? " \u2022" : ""}
                  </button>
                ))}
              </div>
            ))}

            <CardBox style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{pb.setup.name}</div>
                {pb.setup.source && (
                  <span style={{ ...eyebrowStyle(), fontSize: 10 }}>{pb.setup.source}</span>
                )}
                {pb.setup.ready && (
                  <span
                    title="A finalised setup: identification variables, disqualifiers and execution are complete and tested against the source material"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: C.card,
                      background: C.green,
                      borderRadius: 3,
                      padding: "2px 6px",
                    }}
                  >
                    Finalised
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 10, lineHeight: 1.5 }}>
                {pb.setup.principle}
              </div>

              {/* Layer strip: how gate, frame, trigger and stop apply to this card */}
              {pb.setup.layers && (() => {
                const L = pb.setup.layers;
                const gate = gateFor(pb.setup, briefDay.mode || {});
                const rows = [
                  { k: "Gate", v: gate.text, color: gate.ok === false ? C.brick : gate.ok === true ? C.green : C.mutedInk },
                  { k: "Frame", v: LAYER_TEXT.frame[L.frame] || L.frame, color: C.ink },
                  { k: "Trigger", v: LAYER_TEXT.trigger[L.trigger] || L.trigger, color: C.ink },
                  { k: "Stop", v: LAYER_TEXT.stop[L.stop] || L.stop, color: C.ink },
                ];
                return (
                  <div
                    style={{
                      border: "1px solid " + C.hairline,
                      borderRadius: 5,
                      padding: "8px 12px",
                      marginBottom: 14,
                    }}
                  >
                    {rows.map((r) => (
                      <div key={r.k} style={{ display: "flex", gap: 10, fontSize: 12, lineHeight: 1.45, padding: "3px 0" }}>
                        <span style={{ ...eyebrowStyle(), fontSize: 10, width: 52, flexShrink: 0, paddingTop: 2 }}>{r.k}</span>
                        <span style={{ color: r.color }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {pb.setup.execution ? (
                <div
                  style={{
                    border: "1px solid " + C.hairline,
                    borderRadius: 5,
                    padding: "8px 12px",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ ...eyebrowStyle(C.bronze), marginBottom: 4 }}>Execution</div>
                  {[
                    ["Entry, v1", pb.setup.execution.entryV1],
                    ["Entry, book", pb.setup.execution.entryBook],
                    ["Stop", pb.setup.execution.stop],
                    ["Target", pb.setup.execution.target],
                    ["Time", pb.setup.execution.time],
                    ["Sides", pb.setup.execution.sides],
                  ]
                    .filter((r) => r[1])
                    .map((r) => (
                      <div key={r[0]} style={{ display: "flex", gap: 10, fontSize: 12.5, lineHeight: 1.5, padding: "3px 0", color: C.ink }}>
                        <span style={{ ...eyebrowStyle(), fontSize: 10, width: 72, flexShrink: 0, paddingTop: 3 }}>{r[0]}</span>
                        <span>{r[1]}</span>
                      </div>
                    ))}
                </div>
              ) : pb.setup.exit ? (
                <div style={{ fontSize: 12.5, color: C.mutedInk, marginBottom: 16, lineHeight: 1.5 }}>
                  <span style={{ ...eyebrowStyle(C.bronze), fontSize: 10, marginRight: 6 }}>
                    Exit
                  </span>
                  {pb.setup.exit}
                </div>
              ) : null}

              {pb.setup.variants && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ ...eyebrowStyle(), marginBottom: 8 }}>Spot the difference</div>
                  <div className="cc-variants">
                    {pb.setup.variants.map((v) => (
                      <div
                        key={v.label}
                        style={{
                          border:
                            v.rank === "take" ? "1.5px solid " + C.green : "1px solid " + C.hairline,
                          borderRadius: 5,
                          padding: "8px 8px 6px 8px",
                          background: v.rank === "take" ? "rgba(62,92,70,0.05)" : "transparent",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            marginBottom: 2,
                          }}
                        >
                          <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500 }}>
                            {v.label}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: rankColor(v.rank),
                            }}
                          >
                            {rankLabel(v.rank)}
                          </span>
                        </div>
                        <MiniChart chart={v.chart} />
                        <div style={{ fontSize: 11, color: C.mutedInk, lineHeight: 1.4, marginTop: 4 }}>
                          {v.note}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pb.setup.group === "scalp" && (
                <div
                  style={{
                    marginBottom: 18,
                    padding: "12px 14px",
                    border: "1px solid " + C.hairline,
                    borderRadius: 5,
                  }}
                >
                  <div style={{ ...eyebrowStyle(C.bronze), marginBottom: 8 }}>Reading the tape</div>
                  {SCALP_TAPE.map((r, i) => (
                    <RuleLine key={i} mark={i + 1} color={C.bronze}>
                      {r}
                    </RuleLine>
                  ))}
                  <div style={{ borderTop: "1px solid " + C.hairline, marginTop: 10, paddingTop: 10 }}>
                    <div style={{ ...eyebrowStyle(C.brick), marginBottom: 8 }}>Scalp discipline</div>
                    {SCALP_RULES.map((r, i) => (
                      <RuleLine key={i} mark="x" color={C.brick}>
                        {r}
                      </RuleLine>
                    ))}
                  </div>
                </div>
              )}

              <div className="cc-pb">
                <div>
                  <div style={{ ...eyebrowStyle(C.green), marginBottom: 4 }}>Want to see</div>
                  {pb.setup.quality.map((c) => (
                    <CheckRow
                      key={c.id}
                      checked={pbQuality.includes(c.id)}
                      onToggle={() => toggleIn(pbQuality, setPbQuality, c.id)}
                      accent={C.green}
                    >
                      {c.label}
                    </CheckRow>
                  ))}
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(C.brick), marginBottom: 4 }}>Walk away when</div>
                  {pb.setup.flags.map((c) => (
                    <CheckRow
                      key={c.id}
                      checked={pbFlags.includes(c.id)}
                      onToggle={() => toggleIn(pbFlags, setPbFlags, c.id)}
                      accent={C.brick}
                    >
                      {c.label}
                    </CheckRow>
                  ))}
                </div>
              </div>

              {/* Verdict */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  flexWrap: "wrap",
                  borderTop: "1px solid " + C.hairline,
                  marginTop: 14,
                  paddingTop: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: MONO,
                    fontSize: 18,
                    fontWeight: 500,
                    background: pb.grade ? gradeColor(pb.grade) : "transparent",
                    color: pb.grade ? C.card : C.mutedInk,
                    border: "1px solid " + (pb.grade ? gradeColor(pb.grade) : C.hairline),
                    borderRadius: 4,
                  }}
                >
                  {pb.grade || "-"}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: pb.grade === "D" ? C.brick : C.ink,
                    flex: 1,
                    minWidth: 180,
                  }}
                >
                  {pb.text}
                  {pb.grade && (
                    <span style={{ color: C.mutedInk }}>
                      {" "}
                      ({pb.q}/{pb.total} quality, {pb.f} flag{pb.f === 1 ? "" : "s"})
                    </span>
                  )}
                </div>
                <button
                  onClick={sendPbToJournal}
                  title="Prefill the entry form with this setup and grade; the ticked conditions travel with the trade"
                  disabled={!pb.grade}
                  style={{
                    padding: "0 16px",
                    minHeight: 44,
                    fontSize: 13,
                    cursor: pb.grade ? "pointer" : "default",
                    background: pb.grade ? C.ink : "transparent",
                    color: pb.grade ? C.card : C.mutedInk,
                    border: "1px solid " + (pb.grade ? C.ink : C.hairline),
                    borderRadius: 4,
                  }}
                >
                  Use in journal
                </button>
                <button
                  onClick={() => {
                    if (!pb.grade) return;
                    savePass(pb.setup.name, pb.grade);
                    setPbQuality([]);
                    setPbFlags([]);
                  }}
                  disabled={!pb.grade}
                  title="Count it as seen, not taken"
                  style={{
                    padding: "0 16px",
                    minHeight: 44,
                    fontSize: 13,
                    cursor: pb.grade ? "pointer" : "default",
                    background: "transparent",
                    color: pb.grade ? C.bronze : C.mutedInk,
                    border: "1px solid " + (pb.grade ? C.bronze : C.hairline),
                    borderRadius: 4,
                  }}
                >
                  Log pass
                </button>
              </div>
              <div style={{ fontSize: 11, color: C.mutedInk, marginTop: 8 }}>
                One flag caps the grade at C; two or more is a pass, whatever the quality count.
              </div>
            </CardBox>

            <Disclosure title="Timeframes" meta="alignment and the 80 percent rule">
              <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 14, lineHeight: 1.5 }}>
                Alignment means the participants of several timeframes acting in the same direction. The
                best trades are obvious on every frame; the entry frame still decides, and it owns
                the stop.
              </div>
              <div className="cc-shots" style={{ marginBottom: 16 }}>
                {MTF_SKETCHES.map((s) => (
                  <div
                    key={s.title}
                    style={{
                      border: "1px solid " + C.hairline,
                      borderRadius: 5,
                      padding: "8px 8px 6px 8px",
                    }}
                  >
                    <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 2 }}>
                      {s.title}
                    </div>
                    <MiniChart chart={s.chart} />
                    <div style={{ fontSize: 11, color: C.mutedInk, lineHeight: 1.4, marginTop: 4 }}>
                      {s.note}
                    </div>
                  </div>
                ))}
              </div>
              {(() => {
                const hz = MTF_HORIZONS[mtfHorizon];
                const rel = (id) => {
                  const st = mtfStates[id];
                  if (!st || st === "range") return st === "range" ? 0 : null;
                  const withTrade =
                    (mtfDir === "long" && st === "up") || (mtfDir === "short" && st === "down");
                  return withTrade ? 1 : -1;
                };
                const score = MTF_FRAMES.reduce(
                  (acc, f) => acc + (rel(f.id) === null ? 0 : rel(f.id) * hz.weights[f.id]),
                  0
                );
                const anchorRel = rel(hz.anchor);
                const verdict =
                  anchorRel === null
                    ? { text: "Mark the entry frame first: it leads, and it can veto.", color: C.mutedInk }
                    : anchorRel === -1
                    ? {
                        text:
                          "The entry frame itself is against the trade: stand aside. No higher-frame story overrides the chart you trade on.",
                        color: C.brick,
                      }
                    : score >= 60
                    ? { text: "Confluence: the frames that matter agree. Full grade available.", color: C.green }
                    : score >= 25
                    ? {
                        text: "Partial: acceptable when the entry frame leads; expect friction from the frames against.",
                        color: C.bronze,
                      }
                    : score > -25
                    ? {
                        text: "Mixed context: the setup must carry the trade on its own frame, at reduced size.",
                        color: C.mutedInk,
                      }
                    : {
                        text: "Fighting the structure: higher frames lean against. Cap the grade, cut the size, or wait for alignment.",
                        color: C.brick,
                      };
                return (
                  <div
                    style={{
                      border: "1px solid " + C.hairline,
                      borderRadius: 5,
                      padding: "12px 14px",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <div style={eyebrowStyle(C.bronze)}>
                        Confluence check
                        <span style={{ ...monoNum, fontSize: 10, color: C.mutedInk, marginLeft: 8, textTransform: "none", letterSpacing: 0 }}>
                          follows {pb.setup.name}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {[
                          { v: "continuation", label: "Continuation" },
                          { v: "reversal", label: "Reversal" },
                        ].map((m) => (
                          <button
                            key={m.v}
                            onClick={() => setMtfMode(m.v)}
                            title={m.v === "reversal" ? "The entry frame's trend is against the trade by design; score stretch, turn and room" : "Frames should agree; score alignment"}
                            style={{
                              minHeight: 32,
                              padding: "0 10px",
                              fontSize: 11,
                              cursor: "pointer",
                              background: mtfMode === m.v ? C.ink : "transparent",
                              color: mtfMode === m.v ? C.card : C.mutedInk,
                              border: "1px solid " + (mtfMode === m.v ? C.ink : C.hairline),
                              borderRadius: 4,
                            }}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {mtfMode === "reversal" ? (
                      <div>
                        <div style={{ fontSize: 12, color: C.mutedInk, marginBottom: 6, lineHeight: 1.5 }}>
                          Alignment is the wrong question for a reversal: the chart you trade on is
                          supposed to be against you. Three things replace it, and all three are required.
                        </div>
                        {MTF_REVERSAL.map((c) => (
                          <CheckRow
                            key={c.id}
                            checked={mtfRev.includes(c.id)}
                            onToggle={() => toggleIn(mtfRev, setMtfRev, c.id)}
                          >
                            {c.label}
                          </CheckRow>
                        ))}
                        {(() => {
                          const need = ["against", "turn", "room"];
                          const have = need.filter((k) => mtfRev.includes(k)).length;
                          const v =
                            have === 3
                              ? { text: "Reversal located: stretch, turn and room all present. Grade from the card.", color: C.green }
                              : !mtfRev.includes("turn") && mtfRev.length > 0
                              ? { text: "No turn yet: this is fading the fall. Wait for the break.", color: C.brick }
                              : mtfRev.length > 0
                              ? { text: "Not yet: " + (3 - have) + " of the three required answers missing.", color: C.bronze }
                              : { text: "Tick what the chart is actually showing.", color: C.mutedInk };
                          return (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                                borderTop: "1px solid " + C.hairline,
                                marginTop: 8,
                                paddingTop: 8,
                              }}
                            >
                              <span style={{ fontSize: 12.5, lineHeight: 1.4, color: v.color }}>{v.text}</span>
                              {mtfRev.length > 0 && (
                                <button
                                  onClick={() => setMtfRev([])}
                                  title="Untick the reversal checks"
                                  style={{
                                    padding: "6px 10px",
                                    minHeight: 32,
                                    fontSize: 11,
                                    cursor: "pointer",
                                    background: "transparent",
                                    color: C.mutedInk,
                                    border: "1px solid " + C.hairline,
                                    borderRadius: 4,
                                    flexShrink: 0,
                                  }}
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                    <div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: "flex", gap: 5 }}>
                        {[
                          { v: "long", label: "Long", color: C.green },
                          { v: "short", label: "Short", color: C.brick },
                        ].map((d) => (
                          <button
                            key={d.v}
                            onClick={() => setMtfDir(d.v)}
                            title="The direction of the trade being checked"
                            style={{
                              minHeight: 40,
                              padding: "0 14px",
                              fontSize: 12,
                              cursor: "pointer",
                              background: mtfDir === d.v ? d.color : "transparent",
                              color: mtfDir === d.v ? C.card : d.color,
                              border: "1px solid " + (mtfDir === d.v ? d.color : C.hairline),
                              borderRadius: 4,
                            }}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {Object.entries(MTF_HORIZONS).map(([k, h]) => (
                          <button
                            key={k}
                            onClick={() => setMtfHorizon(k)}
                            title={"Entry frame: " + h.anchor}
                            style={{
                              minHeight: 40,
                              padding: "0 12px",
                              fontSize: 12,
                              cursor: "pointer",
                              background: mtfHorizon === k ? C.ink : "transparent",
                              color: mtfHorizon === k ? C.card : C.mutedInk,
                              border: "1px solid " + (mtfHorizon === k ? C.ink : C.hairline),
                              borderRadius: 4,
                            }}
                          >
                            {h.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {MTF_FRAMES.map((f) => {
                      const st = mtfStates[f.id];
                      const isAnchor = hz.anchor === f.id;
                      return (
                        <div
                          key={f.id}
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: isAnchor ? C.ink : C.mutedInk,
                              fontWeight: isAnchor ? 600 : 400,
                              width: 150,
                              flexShrink: 0,
                            }}
                          >
                            {f.label}
                            <span style={{ ...monoNum, fontSize: 10, color: C.mutedInk, marginLeft: 6 }}>
                              {hz.weights[f.id]}%{isAnchor ? " · entry" : ""}
                            </span>
                          </span>
                          <div style={{ display: "flex", gap: 4 }}>
                            {[
                              { v: "up", label: "Up" },
                              { v: "range", label: "Range" },
                              { v: "down", label: "Down" },
                            ].map((o) => (
                              <button
                                key={o.v}
                                title={f.label + " trend: " + o.label.toLowerCase()}
                                onClick={() =>
                                  setMtfStates({
                                    ...mtfStates,
                                    [f.id]: st === o.v ? undefined : o.v,
                                  })
                                }
                                style={{
                                  minHeight: 34,
                                  padding: "0 11px",
                                  fontSize: 11,
                                  cursor: "pointer",
                                  background: st === o.v ? C.ink : "transparent",
                                  color: st === o.v ? C.card : C.mutedInk,
                                  border: "1px solid " + (st === o.v ? C.ink : C.hairline),
                                  borderRadius: 4,
                                }}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Confluence bar: one segment per frame, width by weight, colour by relation */}
                    <div
                      style={{
                        display: "flex",
                        height: 10,
                        borderRadius: 5,
                        overflow: "hidden",
                        border: "1px solid " + C.hairline,
                        margin: "10px 0 8px 0",
                      }}
                    >
                      {MTF_FRAMES.map((f) => {
                        const r = rel(f.id);
                        return (
                          <div
                            key={f.id}
                            title={f.label}
                            style={{
                              width: hz.weights[f.id] + "%",
                              background:
                                r === 1
                                  ? C.green
                                  : r === -1
                                  ? C.brick
                                  : r === 0
                                  ? "rgba(23,28,38,0.18)"
                                  : "transparent",
                              borderRight: "1px solid " + C.card,
                            }}
                          />
                        );
                      })}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 12.5, lineHeight: 1.4, color: verdict.color }}>
                        <span style={{ ...monoNum, marginRight: 8 }}>
                          {anchorRel === null ? "-" : (score > 0 ? "+" : "") + score}
                        </span>
                        {verdict.text}
                      </span>
                      {Object.keys(mtfStates).length > 0 && (
                        <button
                          onClick={() => setMtfStates({})}
                          title="Clear the frame reads"
                          style={{
                            padding: "6px 10px",
                            minHeight: 32,
                            fontSize: 11,
                            cursor: "pointer",
                            background: "transparent",
                            color: C.mutedInk,
                            border: "1px solid " + C.hairline,
                            borderRadius: 4,
                            flexShrink: 0,
                          }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    </div>
                    )}
                  </div>
                );
              })()}

              {MTF_LAW.map((r, i) => (
                <RuleLine key={i} mark={i + 1} color={C.bronze}>
                  {r}
                </RuleLine>
              ))}
            </Disclosure>

            <Disclosure title="Trendlines across timeframes">
              <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 16, lineHeight: 1.5 }}>
                Top down: monthly sets the primary trend, weekly refines the anchors, daily
                confirms alignment, the execution frame trades the line. The line is structure,
                the trailing rule is the system.
              </div>

              <div className="cc-shots" style={{ marginBottom: 18 }}>
                {TL_SKETCHES.map((s) => (
                  <div
                    key={s.title}
                    style={{ border: "1px solid " + C.hairline, borderRadius: 5, padding: "8px 8px 6px 8px" }}
                  >
                    <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 2 }}>{s.title}</div>
                    <MiniChart chart={s.chart} />
                    <div style={{ fontSize: 11, color: C.mutedInk, lineHeight: 1.4, marginTop: 4 }}>
                      {s.note}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...eyebrowStyle(C.bronze), marginBottom: 4 }}>
                Top-down pass {tlChecks.length}/{TL_LADDER.length}
              </div>
              <div style={{ marginBottom: 14 }}>
                {TL_LADDER.map((r) => (
                  <CheckRow
                    key={r.id}
                    checked={tlChecks.includes(r.id)}
                    onToggle={() => toggleIn(tlChecks, setTlChecks, r.id)}
                  >
                    <span style={{ fontFamily: MONO, fontSize: 12, marginRight: 6 }}>{r.tf}</span>
                    {r.job}
                  </CheckRow>
                ))}
                {tlChecks.length > 0 && (
                  <button
                    onClick={() => setTlChecks([])}
                    title="Untick the top-down pass"
                    style={{
                      padding: "6px 10px",
                      minHeight: 32,
                      fontSize: 11,
                      cursor: "pointer",
                      background: "transparent",
                      color: C.mutedInk,
                      border: "1px solid " + C.hairline,
                      borderRadius: 4,
                    }}
                  >
                    Reset pass
                  </button>
                )}
              </div>

              <div className="cc-pb">
                <div>
                  <div style={{ ...eyebrowStyle(C.green), marginBottom: 8 }}>Drawing the line</div>
                  {TL_DRAW.map((r, i) => (
                    <RuleLine key={i} mark="+" color={C.green}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(), marginBottom: 8 }}>Trading the line</div>
                  {TL_TRADE.map((r, i) => (
                    <RuleLine key={i} mark={i + 1} color={C.bronze}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid " + C.hairline, marginTop: 10, paddingTop: 12 }}>
                <div style={{ ...eyebrowStyle(C.brick), marginBottom: 8 }}>When to apply</div>
                {TL_APPLY.map((r, i) => (
                  <RuleLine key={i} mark="x" color={C.brick}>
                    {r}
                  </RuleLine>
                ))}
              </div>
            </Disclosure>

            <Disclosure title="Moving averages">
              <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 14, lineHeight: 1.5 }}>
                Equilibrium lines: they define the trend's rate, act as support and resistance in
                trends, and gate whether breakouts are on at all. The three trend setups above run
                on them.
              </div>
              <div className="cc-pb">
                <div>
                  <div style={{ ...eyebrowStyle(C.green), marginBottom: 8 }}>The lines</div>
                  {MA_LINES.map((r, i) => (
                    <RuleLine key={i} mark="+" color={C.green}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(C.bronze), marginBottom: 8 }}>
                    Market filter (daily 10 and 20)
                  </div>
                  {MA_FILTER.map((r, i) => (
                    <RuleLine key={i} mark={i + 1} color={C.bronze}>
                      {r}
                    </RuleLine>
                  ))}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ ...eyebrowStyle(), marginBottom: 8 }}>Where they work</div>
                    {MA_APPLY.map((r, i) => (
                      <RuleLine key={i} mark="+" color={C.mutedInk}>
                        {r}
                      </RuleLine>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid " + C.hairline, marginTop: 10, paddingTop: 12 }}>
                <div style={{ ...eyebrowStyle(C.brick), marginBottom: 8 }}>Trailing and exits</div>
                {MA_TRAIL.map((r, i) => (
                  <RuleLine key={i} mark={i + 1} color={C.brick}>
                    {r}
                  </RuleLine>
                ))}
              </div>
            </Disclosure>

            <Disclosure title="Candle confirmation" meta="four patterns, not forty">
              <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 14, lineHeight: 1.5 }}>
                The trigger layer. For continuation setups it is additive: a confirmed candle adds
                conviction at a level the setup, the state and the zone have already earned, and a
                missing one changes nothing. For reversal setups the turn is required, and a
                pattern with its confirming close is one way the turn prints (the close above a
                hammer's high is a prior bar break); the shape alone is never the trigger. Each
                setup card states which applies.
              </div>

              <div className="cc-variants" style={{ marginBottom: 14 }}>
                {CANDLE_PATTERN_SKETCHES.map((s) => (
                  <div
                    key={s.title}
                    style={{
                      border: "1px solid " + C.hairline,
                      borderRadius: 5,
                      padding: "8px 8px 6px 8px",
                    }}
                  >
                    <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 2 }}>
                      {s.title}
                    </div>
                    <MiniChart chart={s.chart} />
                    <div style={{ fontSize: 11, color: C.mutedInk, lineHeight: 1.4, marginTop: 4 }}>
                      {s.note}
                    </div>
                  </div>
                ))}
              </div>

              <div className="cc-shots" style={{ marginBottom: 18 }}>
                {CANDLE_LOCATION.map((s) => (
                  <div
                    key={s.title}
                    style={{
                      border: "1px solid " + C.hairline,
                      borderRadius: 5,
                      padding: "8px 8px 6px 8px",
                    }}
                  >
                    <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 2 }}>
                      {s.title}
                    </div>
                    <MiniChart chart={s.chart} />
                    <div style={{ fontSize: 11, color: C.mutedInk, lineHeight: 1.4, marginTop: 4 }}>
                      {s.note}
                    </div>
                  </div>
                ))}
              </div>

              <div className="cc-pb">
                <div>
                  <div style={{ ...eyebrowStyle(C.bronze), marginBottom: 4 }}>
                    Trigger check {candleChecks.length}/{CANDLE_CHECK.length}
                  </div>
                  {CANDLE_CHECK.map((c) => (
                    <CheckRow
                      key={c.id}
                      checked={candleChecks.includes(c.id)}
                      onToggle={() => toggleIn(candleChecks, setCandleChecks, c.id)}
                    >
                      {c.label}
                    </CheckRow>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid " + C.hairline,
                      marginTop: 8,
                      paddingTop: 8,
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        lineHeight: 1.4,
                        color:
                          candleChecks.length === CANDLE_CHECK.length
                            ? C.green
                            : candleChecks.length >= 3
                            ? C.bronze
                            : C.mutedInk,
                      }}
                    >
                      {candleChecks.length === CANDLE_CHECK.length
                        ? "Trigger confirmed: adds conviction to an entry the setup already earned."
                        : candleChecks.length >= 3
                        ? "Partial: wait for the close before leaning on it."
                        : candleChecks.length > 0
                        ? "Not a trigger yet: the setup stands or falls on its own rules."
                        : "Tick what the chart is actually showing."}
                    </span>
                    {candleChecks.length > 0 && (
                      <button
                        onClick={() => setCandleChecks([])}
                        title="Untick the trigger check"
                        style={{
                          padding: "6px 10px",
                          minHeight: 32,
                          fontSize: 11,
                          cursor: "pointer",
                          background: "transparent",
                          color: C.mutedInk,
                          border: "1px solid " + C.hairline,
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(C.green), marginBottom: 8 }}>Reading rules</div>
                  {CANDLE_RULES.map((r, i) => (
                    <RuleLine key={i} mark="+" color={C.green}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
              </div>
            </Disclosure>

            <Disclosure title="Exit law" meta="the family follows the thesis">
              <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 14, lineHeight: 1.5 }}>
                Stops and targets are not conventions. The exit family is entailed by what the
                entry bets on, the placement by the frame and the level, and the parameters by the
                ledger. Each setup card states its own family; this card states the law.
              </div>
              <div className="cc-pb" style={{ marginBottom: 14 }}>
                <div>
                  <div style={{ ...eyebrowStyle(C.bronze), marginBottom: 8 }}>The family</div>
                  {EXIT_FAMILY.map((r, i) => (
                    <RuleLine key={i} mark={i + 1} color={C.bronze}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(C.brick), marginBottom: 8 }}>The stop</div>
                  {EXIT_STOP.map((r, i) => (
                    <RuleLine key={i} mark="x" color={C.brick}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
              </div>
              <div className="cc-pb">
                <div>
                  <div style={{ ...eyebrowStyle(C.green), marginBottom: 8 }}>The target and the trail</div>
                  {EXIT_TARGET.map((r, i) => (
                    <RuleLine key={i} mark="+" color={C.green}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(), marginBottom: 8 }}>Validation</div>
                  {EXIT_VALIDATE.map((r, i) => (
                    <RuleLine key={i} mark={i + 1} color={C.mutedInk}>
                      {r}
                    </RuleLine>
                  ))}
                  <div style={{ fontSize: 11, color: C.mutedInk, marginTop: 8 }}>
                    The Excursions panel in the Journal computes the first two design points from
                    trades logged with MFE and MAE.
                  </div>
                </div>
              </div>
            </Disclosure>

            <Disclosure title="Qullamaggie file" meta="3,000 trades, 2014 to 2022">
              <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 14, lineHeight: 1.5 }}>
                Numbers from the deep dive of his actual positions, not the stream vibe. The
                surprise is how small the risk is and how slow the tempo is; the returns come from
                the distribution, not the sizing.
              </div>
              <div className="cc-pb" style={{ marginBottom: 14 }}>
                <div>
                  <div style={{ ...eyebrowStyle(C.green), marginBottom: 8 }}>Sizing and risk</div>
                  {QM_SIZING.map((r, i) => (
                    <RuleLine key={i} mark="+" color={C.green}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(C.bronze), marginBottom: 8 }}>Distribution</div>
                  {QM_DISTRIBUTION.map((r, i) => (
                    <RuleLine key={i} mark={i + 1} color={C.bronze}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
              </div>
              <div className="cc-pb">
                <div>
                  <div style={{ ...eyebrowStyle(), marginBottom: 8 }}>Exposure tempo</div>
                  {QM_TEMPO.map((r, i) => (
                    <RuleLine key={i} mark={i + 1} color={C.mutedInk}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(C.brick), marginBottom: 8 }}>Drawdown reality</div>
                  {QM_DRAWDOWN.map((r, i) => (
                    <RuleLine key={i} mark="x" color={C.brick}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
              </div>
            </Disclosure>

            <Disclosure title="Ground rules">
              {GROUND_RULES.map((r, i) => (
                <RuleLine key={i} mark={i + 1} color={C.bronze}>
                  {r}
                </RuleLine>
              ))}
            </Disclosure>
          </div>
        )}

        {/* ============ RISK ============ */}
        {view === "risk" && (
          <div>
            <CardBox style={{ padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Daily risk check</div>
              <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 10, lineHeight: 1.5 }}>
                Before the first entry, every session. The check is the off switch working while
                you are still calm enough to flip it.
              </div>
              {RISK_CHECK.map((c) => (
                <CheckRow
                  key={c.id}
                  checked={riskChecks.includes(c.id)}
                  onToggle={() => toggleIn(riskChecks, setRiskChecks, c.id)}
                >
                  {c.label}
                </CheckRow>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid " + C.hairline,
                  marginTop: 10,
                  paddingTop: 10,
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color:
                      riskChecks.length === RISK_CHECK.length
                        ? C.green
                        : riskChecks.length > 0 && !riskChecks.includes("mental")
                        ? C.brick
                        : C.mutedInk,
                  }}
                >
                  {riskChecks.length === RISK_CHECK.length
                    ? "Cleared for full size within the guardrails."
                    : riskChecks.length > 0 && !riskChecks.includes("mental")
                    ? "Not right today: reduce risk or stand down."
                    : "Finish the check before the first entry. " +
                      riskChecks.length +
                      "/" +
                      RISK_CHECK.length}
                </span>
                {riskChecks.length > 0 && (
                  <button
                    onClick={() => setRiskChecks([])}
                    title="Untick the daily check"
                    style={{
                      padding: "6px 10px",
                      minHeight: 32,
                      fontSize: 11,
                      cursor: "pointer",
                      background: "transparent",
                      color: C.mutedInk,
                      border: "1px solid " + C.hairline,
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </CardBox>

            <CardBox style={{ padding: 20 }}>
              <div style={{ ...eyebrowStyle(), marginBottom: 14 }}>Session guardrails</div>
              <div className="cc-stats">
                {GUARDRAILS.map((g) => (
                  <Stat key={g.label} label={g.label} value={g.value} sub={g.sub} />
                ))}
              </div>
              <div style={{ fontSize: 12, color: C.mutedInk, marginTop: 14 }}>
                Guardrails live in the platform, not in willpower. Sim mirrors live rules so the
                habits transfer.
              </div>
            </CardBox>

            {/* Report card */}
            <CardBox style={{ padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Report card</div>
              <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 12, lineHeight: 1.5 }}>
                End of session: grade the process, not the P&L. Did you follow the rules today?
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setRGrade(rGrade === g ? "" : g)}
                      title={"Process grade " + g + ": rule adherence, never P&L"}
                      style={{
                        width: 44,
                        height: 44,
                        padding: 0,
                        fontFamily: MONO,
                        fontSize: 15,
                        cursor: "pointer",
                        background: rGrade === g ? gradeColor(g) : "transparent",
                        color: rGrade === g ? C.card : gradeColor(g),
                        border: "1px solid " + (rGrade === g ? gradeColor(g) : C.hairline),
                        borderRadius: 4,
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={rNote}
                  placeholder="One line: what held, what slipped"
                  onChange={(e) => setRNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveReport()}
                  style={{
                    ...smallInput,
                    flex: "1 1 200px",
                    minHeight: 44,
                    fontFamily: "'Archivo', sans-serif",
                  }}
                />
                <button
                  onClick={saveReport}
                  title="Save today's process grade and note; one entry per day"
                  disabled={!rGrade}
                  style={{
                    minHeight: 44,
                    padding: "0 16px",
                    fontSize: 13,
                    cursor: rGrade ? "pointer" : "default",
                    background: rGrade ? C.ink : "transparent",
                    color: rGrade ? C.card : C.mutedInk,
                    border: "1px solid " + (rGrade ? C.ink : C.hairline),
                    borderRadius: 4,
                  }}
                >
                  Save today
                </button>
              </div>
              {reports.length > 0 ? (
                [...reports]
                  .slice(-5)
                  .reverse()
                  .map((r) => (
                    <div
                      key={r.date}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "7px 0",
                        borderTop: "1px solid " + C.hairline,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ ...monoNum, color: C.mutedInk }}>{r.date}</span>
                      <GradeBadge g={r.grade} size={18} />
                      <span
                        style={{
                          color: r.note ? C.ink : C.mutedInk,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.note || "-"}
                      </span>
                    </div>
                  ))
              ) : (
                <div style={{ fontSize: 12, color: C.mutedInk }}>
                  No sessions graded yet. The first one starts the record.
                </div>
              )}
            </CardBox>

            <Disclosure title="Sizing and survival">
              <div className="cc-pb">
                <div>
                  <div style={{ ...eyebrowStyle(C.green), marginBottom: 8 }}>Sizing</div>
                  {RISK_SIZING.map((r, i) => (
                    <RuleLine key={i} mark="+" color={C.green}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(C.brick), marginBottom: 8 }}>Survival</div>
                  {RISK_SURVIVAL.map((r, i) => (
                    <RuleLine key={i} mark="x" color={C.brick}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
              </div>
            </Disclosure>

            <Disclosure title="Composite risk engine" meta="Thanos test book">
              <div style={{ fontSize: 12.5, color: C.mutedInk, marginBottom: 14, lineHeight: 1.5 }}>
                Scope: the composite setups, paper first then a small live account. The ORB
                guardrails above govern the futures practice; this engine governs the test book.
                Enforcement lives in the platform; this is the law it enforces.
              </div>
              <div className="cc-pb">
                <div>
                  <div style={{ ...eyebrowStyle(C.brick), marginBottom: 8 }}>Risk engine</div>
                  {[
                    "Base risk 0.25 percent of equity per trade, identical through phase one; notional is risk over stop distance",
                    "Stops rest in the market from fill: no working position without a resting order",
                    "ADTR skip for the breakout cards (S1, S2): a stop wider than 1 ADTR rejects the order. Reversal cards keep the structural stop beyond the climax extreme, log its width in ATR and require the target at least 2R away; whether a tighter stop keeps enough winners is answered by the winners' MAE distribution, not by a rule",
                    "Daily lock at 3 base risks, weekly restriction at 6 until a positive week resets",
                    "Kill tiers: 1.2x intended risk halves the trade, 1.5x flattens it, a 3x gap flattens the book and blocks the symbol",
                    "No averaging down, ever; three failed attempts ends the name for the day",
                    "Sizing ladder locked until promotion: 0.25 base, 0.5 B, 1.0 A+, pyramids to 2.0 total open risk; A+ at most twice a month",
                  ].map((r, i) => (
                    <RuleLine key={i} mark={i + 1} color={C.brick}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(C.bronze), marginBottom: 8 }}>Test protocol</div>
                  {[
                    "Phase one: 100 trades or three months, flat 0.25, fixed brackets so excursion data censors cleanly",
                    "A cell (setup times state) dies at n of 20 only if its bootstrap expectancy interval sits fully below zero",
                    "Promotion: expectancy positive at the lower bound at the cell floor, aggregate +0.15R per trade, gain to pain 1.5",
                    "Entry audit: e-ratio near 1.0 sends the setup back to development",
                    "Shape: the top decile of trades should carry half of gross profits; give-back disciplines the trails",
                    "Once distributions exist: quarter Kelly on the lower confidence bound, correlation-divided, drawdown-capped; the smaller governs",
                  ].map((r, i) => (
                    <RuleLine key={i} mark={i + 1} color={C.bronze}>
                      {r}
                    </RuleLine>
                  ))}
                </div>
              </div>
            </Disclosure>
          </div>
        )}

        {/* ============ PLAN ============ */}
        {view === "plan" && (
          <div>
            {/* Yearly plan */}
            <CardBox style={{ padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                Yearly plan {today().slice(0, 4)}
              </div>
              <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 14, lineHeight: 1.5 }}>
                Run it like a business: goals you control first, outcomes second, range third.
                Playbook and risk parameters live in their own tabs; this page holds the goals and
                the reviews.
              </div>
              <input
                type="text"
                value={plan.mission}
                placeholder="One line: the trader this year is building"
                onChange={(e) => setPlan({ ...plan, mission: e.target.value })}
                onBlur={() => persistPlan(plan)}
                style={{
                  ...smallInput,
                  width: "100%",
                  minHeight: 44,
                  fontFamily: "'Archivo', sans-serif",
                  marginBottom: 18,
                }}
              />
              <div className="cc-plan">
                {PLAN_BUCKETS.map((b) => {
                  const goals = plan.goals.filter((g) => g.bucket === b.key);
                  const done = goals.filter((g) => g.done).length;
                  return (
                    <div key={b.key}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: 6,
                        }}
                      >
                        <span style={eyebrowStyle(C.bronze)}>{b.label}</span>
                        <span style={{ ...monoNum, fontSize: 11, color: C.mutedInk }}>
                          {goals.length > 0 ? done + "/" + goals.length : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: C.mutedInk, marginBottom: 8 }}>
                        {b.hint}
                      </div>
                      {goals.map((g) => (
                        <div
                          key={g.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                            padding: "5px 0",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={g.done}
                            onChange={() => toggleGoal(g.id)}
                            style={{
                              accentColor: C.green,
                              marginTop: 3,
                              flexShrink: 0,
                              width: 17,
                              height: 17,
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              fontSize: 13,
                              lineHeight: 1.45,
                              color: g.done ? C.mutedInk : C.ink,
                              textDecoration: g.done ? "line-through" : "none",
                            }}
                          >
                            {g.text}
                          </span>
                          <button
                            onClick={() => deleteGoal(g.id)}
                            title="Delete goal"
                            style={{
                              width: 28,
                              height: 28,
                              background: "transparent",
                              border: "none",
                              color: C.mutedInk,
                              cursor: "pointer",
                              fontSize: 13,
                              lineHeight: 1,
                              flexShrink: 0,
                            }}
                          >
                            x
                          </button>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <input
                          type="text"
                          value={newGoal[b.key]}
                          placeholder={"Add " + b.label.toLowerCase() + " goal"}
                          onChange={(e) => setNewGoal({ ...newGoal, [b.key]: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && addGoal(b.key)}
                          style={{
                            ...smallInput,
                            flex: 1,
                            minHeight: 40,
                            fontFamily: "'Archivo', sans-serif",
                            fontSize: 12,
                          }}
                        />
                        <button
                          onClick={() => addGoal(b.key)}
                          title={"Add a goal to " + b.label}
                          disabled={!(newGoal[b.key] || "").trim()}
                          style={{
                            minHeight: 40,
                            padding: "0 12px",
                            fontSize: 12,
                            cursor: (newGoal[b.key] || "").trim() ? "pointer" : "default",
                            background: "transparent",
                            color: (newGoal[b.key] || "").trim() ? C.bronze : C.mutedInk,
                            border:
                              "1px solid " +
                              ((newGoal[b.key] || "").trim() ? C.bronze : C.hairline),
                            borderRadius: 4,
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBox>

            {/* Review cadence */}
            <CardBox style={{ padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Review cadence</div>
              <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 10, lineHeight: 1.5 }}>
                Daily is the report card in the Risk tab. These four keep the plan honest; tap a
                row for its questions, mark it done when the review is written.
              </div>
              {REVIEWS.map((r) => {
                const due = reviewDue(r.key, r.days);
                const open = expandedReview === r.key;
                return (
                  <div key={r.key} style={{ borderTop: "1px solid " + C.hairline }}>
                    <div
                      onClick={() => setExpandedReview(open ? null : r.key)}
                      title="Show the question set"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minHeight: 52,
                        padding: "8px 0",
                        cursor: "pointer",
                        background: open ? "rgba(165,128,76,0.06)" : "transparent",
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500, width: 84 }}>{r.label}</span>
                      <span style={{ ...monoNum, fontSize: 12, color: C.mutedInk, flex: 1 }}>
                        {plan.reviews[r.key] ? "last " + plan.reviews[r.key] : "never done"}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: due.color,
                        }}
                      >
                        {due.text}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markReview(r.key);
                        }}
                        title="Stamp this review as done today"
                        style={{
                          minHeight: 36,
                          padding: "0 12px",
                          fontSize: 12,
                          cursor: "pointer",
                          background: due.due ? C.ink : "transparent",
                          color: due.due ? C.card : C.mutedInk,
                          border: "1px solid " + (due.due ? C.ink : C.hairline),
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        Done today
                      </button>
                    </div>
                    {open && (
                      <div style={{ padding: "2px 0 12px 0" }}>
                        {r.questions.map((q, i) => (
                          <RuleLine key={i} mark={i + 1} color={C.bronze}>
                            {q}
                          </RuleLine>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardBox>
          </div>
        )}

        {/* ============ PROJECTION ============ */}
        {view === "project" && (
          <div>
            <div
              style={{
                display: "inline-flex",
                border: "1px solid " + C.hairline,
                borderRadius: 999,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              {[
                { k: "stats", label: "From trade stats" },
                { k: "fixed", label: "Fixed rate per period" },
                { k: "kelly", label: "Kelly sizing" },
              ].map((m) => (
                <button
                  key={m.k}
                  onClick={() => setMode(m.k)}
                  title={m.k === "stats" ? "Compound from your win rate and payoff" : m.k === "fixed" ? "Compound a fixed percentage per period" : "Optimal risk per bucket, computed from your own ledger"}
                  style={{
                    padding: "10px 16px",
                    minHeight: 42,
                    fontSize: 12,
                    cursor: "pointer",
                    background: mode === m.k ? C.ink : "transparent",
                    color: mode === m.k ? C.card : C.mutedInk,
                    border: "none",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mode !== "kelly" && (
            <div className="cc-grid">
              <CardBox style={{ padding: 22, alignSelf: "start", marginBottom: 0 }}>
                {mode === "stats" ? (
                  <>
                    <Field label="Risk per trade" suffix="%" value={riskPct} onChange={setRiskPct} min={0.05} max={5} step={0.05} slider />
                    <Field label="Reward to risk" suffix="R" value={rr} onChange={setRr} min={0.5} max={6} step={0.1} slider />
                    <Field label="Win rate" suffix="%" value={winRate} onChange={setWinRate} min={10} max={90} step={1} slider />
                    <Field label="Trades per session" value={tradesPerSession} onChange={setTradesPerSession} min={1} max={20} step={1} />
                    <Field label="Sessions per week" value={sessionsPerWeek} onChange={setSessionsPerWeek} min={1} max={7} step={1} />
                    <Field label="Horizon" suffix="wks" value={weeks} onChange={setWeeks} min={1} max={260} step={1} slider />
                    <Field label="Starting equity" suffix="$" value={startEquity} onChange={setStartEquity} min={100} max={10000000} step={100} />
                    <div
                      style={{
                        fontSize: 12,
                        color: C.mutedInk,
                        borderTop: "1px solid " + C.hairline,
                        paddingTop: 12,
                      }}
                    >
                      Breakeven win rate at {rr.toFixed(1)}R:{" "}
                      <span style={{ ...monoNum, color: C.ink }}>
                        {(calc.breakevenWR * 100).toFixed(1)}%
                      </span>
                    </div>
                    {canApply && (
                      <button
                        onClick={applyJournalStats}
                        title="Copy win rate and payoff from your ledger into these inputs"
                        style={{
                          marginTop: 12,
                          padding: "8px 12px",
                          minHeight: 36,
                          fontSize: 12,
                          cursor: "pointer",
                          background: "transparent",
                          color: C.bronze,
                          border: "1px solid " + C.bronze,
                          borderRadius: 4,
                        }}
                      >
                        Pull stats from journal
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <Field label={"Growth per " + periodLabel} suffix="%" value={fixedRate} onChange={setFixedRate} min={-10} max={30} step={0.25} slider />
                    <Field label={"Number of " + periodLabel + "s"} value={weeks} onChange={setWeeks} min={1} max={520} step={1} slider />
                    <Field label="Starting equity" suffix="$" value={startEquity} onChange={setStartEquity} min={100} max={10000000} step={100} />
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ ...eyebrowStyle(), marginBottom: 6 }}>Period</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {["day", "session", "week", "month"].map((p) => (
                          <button
                            key={p}
                            onClick={() => setPeriodLabel(p)}
                            title={"Compound once per " + p}
                            style={{
                              padding: "8px 12px",
                              minHeight: 36,
                              fontSize: 12,
                              cursor: "pointer",
                              background: periodLabel === p ? C.ink : "transparent",
                              color: periodLabel === p ? C.card : C.mutedInk,
                              border: "1px solid " + (periodLabel === p ? C.ink : C.hairline),
                              borderRadius: 4,
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardBox>

              <div>
                <div className="cc-stats" style={{ marginBottom: 20 }}>
                  {mode === "stats" ? (
                    <>
                      <Stat
                        label="Expectancy / trade"
                        value={(calc.expectancyR >= 0 ? "+" : "") + calc.expectancyR.toFixed(2) + "R"}
                        sub={fmtPct(calc.perTrade) + " of equity"}
                        tone={negative ? C.brick : C.ink}
                      />
                      <Stat label="Per session" value={fmtPct(calc.perSession)} tone={negative ? C.brick : C.ink} />
                      <Stat label="Per week" value={fmtPct(calc.perWeek)} tone={negative ? C.brick : C.ink} />
                      <Stat
                        label={"After " + calc.horizon + " weeks"}
                        value={calc.multiple.toFixed(2) + "x"}
                        sub={fmtMoney(calc.final)}
                        tone={negative ? C.brick : C.green}
                      />
                    </>
                  ) : (
                    <>
                      <Stat label={"Per " + calc.unit} value={fmtPct(calc.perPeriod)} tone={negative ? C.brick : C.ink} />
                      <Stat
                        label={"After " + calc.horizon + " " + calc.unit + "s"}
                        value={calc.multiple.toFixed(2) + "x"}
                        tone={negative ? C.brick : C.green}
                      />
                      <Stat label="Final equity" value={fmtMoney(calc.final)} sub={"from " + fmtMoney(startEquity)} />
                      <Stat
                        label="Annualised"
                        value={
                          calc.unit === "week"
                            ? fmtPct(Math.pow(1 + calc.perPeriod, 52) - 1, 0)
                            : calc.unit === "month"
                            ? fmtPct(Math.pow(1 + calc.perPeriod, 12) - 1, 0)
                            : fmtPct(Math.pow(1 + calc.perPeriod, 252) - 1, 0)
                        }
                        sub={calc.unit === "week" ? "52 weeks" : calc.unit === "month" ? "12 months" : "252 sessions"}
                      />
                    </>
                  )}
                </div>

                {negative && (
                  <div style={{ fontSize: 13, color: C.brick, marginBottom: 12 }}>
                    Negative expectancy: this curve compounds down, not up.
                  </div>
                )}

                <CardBox style={{ padding: "18px 12px 8px 0", marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0 12px 10px 20px",
                    }}
                  >
                    <div style={eyebrowStyle()}>Equity curve</div>
                    <label
                      style={{
                        fontSize: 12,
                        color: C.mutedInk,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        minHeight: 32,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={logScale}
                        onChange={(e) => setLogScale(e.target.checked)}
                        style={{ accentColor: C.bronze, width: 16, height: 16 }}
                      />
                      log scale
                    </label>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={calc.data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                      <CartesianGrid stroke={C.hairline} vertical={false} />
                      <XAxis
                        dataKey="x"
                        tick={{ fontSize: 11, fill: C.mutedInk, fontFamily: MONO }}
                        tickLine={false}
                        axisLine={{ stroke: C.hairline }}
                      />
                      <YAxis
                        scale={logScale ? "log" : "linear"}
                        domain={logScale ? ["auto", "auto"] : [0, "auto"]}
                        tickFormatter={(v) => fmtMoney(v)}
                        tick={{ fontSize: 11, fill: C.mutedInk, fontFamily: MONO }}
                        tickLine={false}
                        axisLine={false}
                        width={70}
                      />
                      <Tooltip
                        formatter={(v) => [fmtMoney(v), "Equity"]}
                        labelFormatter={(l) => calc.unit + " " + l}
                        contentStyle={{
                          background: C.card,
                          border: "1px solid " + C.hairline,
                          borderRadius: 4,
                          fontFamily: MONO,
                          fontSize: 12,
                        }}
                      />
                      <ReferenceLine y={startEquity} stroke={C.bronze} strokeDasharray="4 4" />
                      <Line
                        type="monotone"
                        dataKey="equity"
                        stroke={negative ? C.brick : C.ink}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardBox>

                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    flexWrap: "wrap",
                    ...monoNum,
                    fontSize: 13,
                  }}
                >
                  {milestones.map((m) => (
                    <div key={m.period}>
                      <span style={{ color: C.mutedInk }}>
                        {calc.unit} {m.period}:{" "}
                      </span>
                      <span>{fmtMoney(m.equity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}

            {mode === "kelly" && (
              <div>
                <CardBox style={{ padding: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Kelly sizing by type</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[
                        { k: "grade", label: "By grade" },
                        { k: "setup", label: "By setup" },
                      ].map((d) => (
                        <button
                          key={d.k}
                          onClick={() => setKellyDim(d.k)}
                          title={d.k === "grade" ? "Bucket the ledger by grade" : "Bucket the ledger by setup name"}
                          style={{
                            minHeight: 36,
                            padding: "0 12px",
                            fontSize: 12,
                            cursor: "pointer",
                            background: kellyDim === d.k ? C.ink : "transparent",
                            color: kellyDim === d.k ? C.card : C.mutedInk,
                            border: "1px solid " + (kellyDim === d.k ? C.ink : C.hairline),
                            borderRadius: 4,
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.mutedInk, marginBottom: 14, lineHeight: 1.55 }}>
                    Kelly is the fraction of equity lost at the stop that maximises growth if the
                    numbers are exact. Yours are estimates from a small sample of a shifting game,
                    so quarter Kelly is the working default: most of the growth, a fraction of the
                    drawdown. Buckets under ten trades show nothing, because expectancy from single
                    digits is a rumour. The day stop in Risk overrides whatever this table says.
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <div style={{ minWidth: 640 }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(90px,1.3fr) 44px 60px 68px 84px 74px 78px 60px",
                          gap: 8,
                          ...eyebrowStyle(),
                          fontSize: 10,
                          paddingBottom: 8,
                          borderBottom: "1px solid " + C.hairline,
                        }}
                      >
                        <div>Type</div>
                        <div style={{ textAlign: "right" }}>n</div>
                        <div style={{ textAlign: "right" }}>WR</div>
                        <div style={{ textAlign: "right" }}>Payoff</div>
                        <div style={{ textAlign: "right" }}>Exp / trade</div>
                        <div style={{ textAlign: "right" }}>Kelly</div>
                        <div style={{ textAlign: "right" }}>Quarter</div>
                        <div></div>
                      </div>
                      {[kellyData.all, ...kellyData.rows].map((r, idx) => {
                        const small = r.n < 10;
                        const noEdge = !small && (r.kelly === null || r.kelly <= 0);
                        const quarterPct = r.kelly !== null ? r.kelly * 25 : null;
                        return (
                          <div
                            key={idx + r.label}
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "minmax(90px,1.3fr) 44px 60px 68px 84px 74px 78px 60px",
                              gap: 8,
                              alignItems: "center",
                              padding: "9px 0",
                              borderBottom: "1px solid " + C.hairline,
                              ...monoNum,
                              fontSize: 13,
                            }}
                          >
                            <div
                              style={{
                                fontFamily: r.isGrade ? MONO : "'Archivo', sans-serif",
                                color: r.isGrade ? gradeColor(r.label) : C.ink,
                                fontWeight: idx === 0 ? 600 : 500,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {r.label}
                            </div>
                            <div style={{ textAlign: "right", color: C.mutedInk }}>{r.n}</div>
                            <div style={{ textAlign: "right" }}>
                              {r.decided > 0 ? (r.p * 100).toFixed(0) + "%" : "-"}
                            </div>
                            <div style={{ textAlign: "right" }}>
                              {r.payoff > 0 ? r.payoff.toFixed(2) : "-"}
                            </div>
                            <div
                              style={{
                                textAlign: "right",
                                color: r.evR > 0 ? C.green : r.evR < 0 ? C.brick : C.ink,
                              }}
                            >
                              {fmtR(r.evR)}
                            </div>
                            {small ? (
                              <div
                                style={{
                                  gridColumn: "6 / 9",
                                  fontSize: 11,
                                  color: C.mutedInk,
                                  fontFamily: "'Archivo', sans-serif",
                                }}
                              >
                                sample too small, needs {10 - r.n} more
                              </div>
                            ) : noEdge ? (
                              <div
                                style={{
                                  gridColumn: "6 / 9",
                                  fontSize: 11,
                                  color: C.brick,
                                  fontFamily: "'Archivo', sans-serif",
                                }}
                              >
                                no edge at these numbers: no bet
                              </div>
                            ) : (
                              <>
                                <div style={{ textAlign: "right" }}>
                                  {(r.kelly * 100).toFixed(1)}%
                                </div>
                                <div style={{ textAlign: "right", color: C.bronze }}>
                                  {quarterPct.toFixed(2)}%
                                </div>
                                <button
                                  onClick={() => setKRisk(Number(quarterPct.toFixed(2)))}
                                  title="Send quarter Kelly to the calculator"
                                  style={{
                                    minHeight: 32,
                                    padding: "0 10px",
                                    fontSize: 11,
                                    cursor: "pointer",
                                    background: "transparent",
                                    color: C.bronze,
                                    border: "1px solid " + C.bronze,
                                    borderRadius: 4,
                                    fontFamily: "'Archivo', sans-serif",
                                  }}
                                >
                                  Use
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                      {kellyData.rows.length === 0 && (
                        <div style={{ fontSize: 12, color: C.mutedInk, paddingTop: 10 }}>
                          {kellyDim === "setup"
                            ? "No named setups logged yet."
                            : "No graded trades logged yet."}
                        </div>
                      )}
                    </div>
                  </div>

                  {[kellyData.all, ...kellyData.rows].some((r) => r.n >= 10 && r.n < 30) && (
                    <div style={{ fontSize: 11, color: C.mutedInk, marginTop: 10 }}>
                      Buckets between 10 and 29 trades are directional at best: treat the quarter
                      column as a ceiling, not a licence.
                    </div>
                  )}
                </CardBox>

                <CardBox style={{ padding: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                    Contracts at this risk
                  </div>
                  <div style={{ fontSize: 12.5, color: C.mutedInk, marginBottom: 14, lineHeight: 1.5 }}>
                    Risk percent times equity is the dollar risk; stop distance times point value
                    is the risk per contract. The floor of the division is the size.
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      alignItems: "flex-end",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 5 }}>
                        Equity ($)
                      </div>
                      <input
                        type="number"
                        value={kEquity}
                        min={100}
                        step={100}
                        onChange={(e) => setKEquity(Number(e.target.value))}
                        style={{ ...smallInput, width: 110, minHeight: 44, textAlign: "right" }}
                      />
                    </div>
                    <div>
                      <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 5 }}>
                        Risk / trade (%)
                      </div>
                      <input
                        type="number"
                        value={kRisk}
                        min={0.01}
                        step={0.05}
                        onChange={(e) => setKRisk(Number(e.target.value))}
                        style={{ ...smallInput, width: 90, minHeight: 44, textAlign: "right" }}
                      />
                    </div>
                    <div>
                      <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 5 }}>
                        Stop (pts)
                      </div>
                      <input
                        type="number"
                        value={kStop}
                        min={0.25}
                        step={0.25}
                        onChange={(e) => setKStop(Number(e.target.value))}
                        style={{ ...smallInput, width: 90, minHeight: 44, textAlign: "right" }}
                      />
                    </div>
                    <div>
                      <div style={{ ...eyebrowStyle(), fontSize: 10, marginBottom: 5 }}>
                        Instrument
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {INSTRUMENTS.map((ins) => (
                          <button
                            key={ins.id}
                            onClick={() => setKInstr(ins.id)}
                            title={"$" + ins.ppt + " per point"}
                            style={{
                              minHeight: 44,
                              padding: "0 10px",
                              fontFamily: MONO,
                              fontSize: 12,
                              cursor: "pointer",
                              background: kInstr === ins.id ? C.ink : "transparent",
                              color: kInstr === ins.id ? C.card : C.mutedInk,
                              border: "1px solid " + (kInstr === ins.id ? C.ink : C.hairline),
                              borderRadius: 4,
                            }}
                          >
                            {ins.id}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const ppt = (INSTRUMENTS.find((i) => i.id === kInstr) || INSTRUMENTS[0]).ppt;
                    const riskDollar = (kEquity * kRisk) / 100;
                    const perContract = kStop > 0 ? kStop * ppt : 0;
                    const contracts =
                      perContract > 0 ? Math.floor(riskDollar / perContract) : 0;
                    const actual = contracts * perContract;
                    return (
                      <div className="cc-stats">
                        <Stat
                          label="Contracts"
                          value={String(contracts)}
                          sub={kInstr + " at $" + ppt + "/pt"}
                          tone={contracts === 0 ? C.brick : C.ink}
                        />
                        <Stat
                          label="Dollar risk (target)"
                          value={fmtMoney(riskDollar)}
                          sub={kRisk + "% of equity"}
                        />
                        <Stat
                          label="Risk / contract"
                          value={fmtMoney(perContract)}
                          sub={kStop + " pts stop"}
                        />
                        <Stat
                          label="Actual at size"
                          value={fmtMoney(actual)}
                          sub={
                            contracts === 0
                              ? "stop too wide for one contract"
                              : ((actual / kEquity) * 100).toFixed(2) + "% of equity"
                          }
                          tone={contracts === 0 ? C.brick : C.green}
                        />
                      </div>
                    );
                  })()}
                </CardBox>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(23,28,38,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            cursor: "zoom-out",
          }}
        >
          <img
            src={lightbox}
            alt="Trade screenshot"
            style={{ maxWidth: "94vw", maxHeight: "94vh", borderRadius: 4 }}
          />
        </div>
      )}
    </div>
  );
}
