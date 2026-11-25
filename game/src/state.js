// state.js — the single source of truth for Broth & Blade.
// Every module reads and writes this one object; nothing keeps a second
// copy of the game. Layout rects live here too, so input, render and
// the shot stager all agree on where things are.

import { makeRecipe } from './recipes.js';

export const W = 1280;
export const H = 720;
export const SHIFT_LENGTH = 180;

/** A tiny seeded RNG (mulberry32): the same seed, the same shift. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Layout, in canvas pixels. The order strip is the top band; the timer
 * ring sits top-right; vats and the board are middle-left; bins are
 * bottom-left; the counter with its bowl is centre-bottom; the serve
 * rail is the right end of the counter; the shift bar is the bottom edge.
 */
export const LAYOUT = {
  strip: { x: 0, y: 0, w: 1280, h: 122 },
  ticket: { w: 196, h: 100, gap: 10, x0: 16, y: 12 },
  timer: { x: 1212, y: 56, r: 34 },
  score: { x: 1212, y: 108 },
  vats: [
    { x: 130, y: 168, w: 118, h: 108, broth: 'shoyu' },
    { x: 272, y: 168, w: 118, h: 108, broth: 'tonkotsu' },
    { x: 414, y: 168, w: 118, h: 108, broth: 'miso' },
  ],
  board: { x: 70, y: 372, w: 400, h: 96 },
  bins: { x0: 40, y0: 500, w: 100, h: 84, gap: 12, perRow: 4 },
  tray: { x: 500, y: 500, w: 150, h: 150, slot: 42 },
  counter: { x: 670, y: 400, w: 342, h: 240 },
  bowl: { x: 841, y: 520, r: 82 },
  rail: { x: 1030, y: 400, w: 220, h: 240 },
  railPlate: { x: 1140, y: 520, r: 62 },
  shiftBar: { x: 0, y: 702, w: 1280, h: 10 },
};

/** The bin rect for BIN_IDS[i] (two rows of four, then the rest). */
export function binRect(i) {
  const { x0, y0, w, h, gap, perRow } = LAYOUT.bins;
  const row = Math.floor(i / perRow);
  const col = i % perRow;
  return { x: x0 + col * (w + gap), y: y0 + row * (h + gap), w, h };
}

/** The tray slot rect for chopped topping index i (a 2x2 grid). */
export function trayRect(i) {
  const { x, y, slot } = LAYOUT.tray;
  const col = i % 2;
  const row = Math.floor(i / 2);
  return { x: x + 10 + col * (slot + 10), y: y + 44 + row * (slot + 10), w: slot, h: slot };
}

export function createState(seed) {
  const rng = mulberry32(seed);
  return {
    seed,
    rng,
    time: 0,
    screen: 'title', // title | play | pause | over
    score: 0,
    tips: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    nextOrderId: 1,
    nextOrderIn: 2.5,
    difficulty: 1,
    orders: [],
    vats: LAYOUT.vats.map((v) => ({ ...v, basket: null })),
    board: null, // { topping, hits, need } | null
    tray: [], // chopped topping ids, max 4
    bowl: { broth: null, noodles: null, toppings: [] },
    hand: null, // { kind: 'noodles'|'basket'|'topping'|'bowl', ... } | null
    drag: null, // { kind: 'topping'|'bowl', id?, fromTray?, x, y } | null
    message: null, // { text, until, good } | null
    floaters: [], // { text, x, y, until, color }
    particles: [], // { x, y, vx, vy, until, color, r }
    lastTickSecond: -1,
    over: false,
    finalServed: 0,
    servedFlash: null, // { until } — the rail glows after a serve
    doneStamp: null, // { orderId, until } — DONE stamp on a ticket
    tipPopup: null, // { text, until } — tip popup after a serve
  };
}

/** A fresh state for a new shift, same seed shape as createState. */
export function resetState(state) {
  const fresh = createState(state.seed);
  fresh.screen = 'play';
  return fresh;
}

/** Seconds left in the shift, never below zero. */
export function timeLeft(state) {
  return Math.max(0, SHIFT_LENGTH - state.time);
}

/** Difficulty 1..4 from elapsed time: tickets come faster and hungrier. */
export function difficultyAt(time) {
  if (time < 45) return 1;
  if (time < 95) return 2;
  if (time < 140) return 3;
  return 4;
}

/** Patience of a new ticket, in seconds, shorter as the shift wears on. */
export function patienceFor(difficulty) {
  return [48, 42, 36, 30][difficulty - 1] ?? 30;
}

/** Spawn gap between tickets, in seconds. */
export function spawnGapFor(difficulty) {
  return [15, 12.5, 10, 8][difficulty - 1] ?? 8;
}

/** Add a floating score text that rises and fades. */
export function addFloater(state, text, x, y, color = '#ffd98a') {
  state.floaters.push({ text, x, y, until: state.time + 1.4, color });
}

/** A one-line message under the strip, good (gold) or bad (red). */
export function setMessage(state, text, good = true) {
  state.message = { text, until: state.time + 2.2, good };
}

/** A burst of tiny slices / sparks at (x, y). */
export function burst(state, x, y, color, n = 8) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + state.rng() * 0.6;
    const sp = 60 + state.rng() * 140;
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 60,
      until: state.time + 0.5 + state.rng() * 0.3,
      color,
      r: 2 + state.rng() * 3,
    });
  }
}

/** The next ticket id, and a fresh recipe for it. */
export function nextRecipe(state) {
  return makeRecipe(state.rng, state.difficulty);
}
