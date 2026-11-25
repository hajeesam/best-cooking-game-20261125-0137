// orders.js — tickets: spawn, patience, expiry, and the score a
// served bowl earns. A ticket is a recipe plus a clock; when its
// patience ring runs out the customer walks away and the combo dies.

import { DONENESS, BROTHS, TOPPINGS } from './recipes.js';
import { patienceFor, spawnGapFor, difficultyAt, addFloater, setMessage, nextRecipe } from './state.js';

/** Spawn one ticket at the right end of the strip. */
export function spawnOrder(state) {
  const recipe = nextRecipe(state);
  const patience = patienceFor(state.difficulty);
  state.orders.push({
    id: state.nextOrderId++,
    recipe,
    patience,
    maxPatience: patience,
    born: state.time,
    status: 'waiting', // waiting | done | missed
    slide: 0, // 0..1 slide-in from the right
  });
}

/**
 * Advance tickets by dt seconds: patience drains, the slide-in finishes,
 * expired tickets leave (combo resets), and new tickets spawn.
 * Returns true when a ticket expired this step (for the tick sound).
 */
export function stepOrders(state, dt) {
  let expired = false;
  for (const order of state.orders) {
    if (order.status !== 'waiting') continue;
    order.patience -= dt;
    order.slide = Math.min(1, order.slide + dt * 2.2);
    if (order.patience <= 0) {
      order.status = 'missed';
      order.patience = 0;
      state.missed += 1;
      state.combo = 0;
      setMessage(state, `Ticket #${order.id} walked out — combo lost`, false);
      expired = true;
    }
  }
  // Drop finished tickets after a short beat so the DONE stamp is seen.
  state.orders = state.orders.filter((o) => o.status === 'waiting' || state.time - (o.doneAt ?? state.time) < 1.6);
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0 && state.orders.filter((o) => o.status === 'waiting').length < 5) {
    spawnOrder(state);
    state.nextOrderIn = spawnGapFor(state.difficulty);
  }
  state.difficulty = difficultyAt(state.time);
  return expired;
}

/** The waiting ticket whose recipe a bowl best matches, or null. */
export function bestOrderFor(state, matchFn) {
  let best = null;
  let bestScore = 0;
  for (const order of state.orders) {
    if (order.status !== 'waiting') continue;
    const m = matchFn(order.recipe);
    if (m.score > bestScore) {
      bestScore = m.score;
      best = { order, match: m };
    }
  }
  return best;
}

/**
 * Serve a finished bowl to its best-matching waiting ticket.
 * Returns the serve result, or null when no ticket is waiting.
 * Score: base 100 x accuracy, plus a tip that grows with patience
 * left and the combo, plus the spicy-variant bonus.
 */
export function serveBowl(state, bowl, match) {
  const waiting = state.orders.filter((o) => o.status === 'waiting');
  if (waiting.length === 0) return null;
  const { order, match: m } = match;
  const accuracy = m.score;
  const base = Math.round(100 * accuracy);
  const patienceFrac = Math.max(0, order.patience / order.maxPatience);
  const comboMult = 1 + Math.min(state.combo, 4) * 0.25;
  let tip = Math.round(base * (0.25 + patienceFrac * 0.6) * comboMult);
  let bonus = 0;
  let spicy = false;
  // The spicy variant: chili oil + fried shallot in the same bowl.
  if (bowl.toppings.includes('chili') && bowl.toppings.includes('shallot')) {
    bonus = 20;
    spicy = true;
  }
  const total = base + tip + bonus;
  const goodServe = accuracy >= 0.8;
  if (goodServe) {
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
  } else {
    state.combo = 0;
  }
  state.score += total;
  state.tips += tip + bonus;
  state.served += 1;
  order.status = 'done';
  order.doneAt = state.time;
  state.doneStamp = { orderId: order.id, until: state.time + 1.6 };
  state.servedFlash = { until: state.time + 1.2 };
  state.tipPopup = { text: `+${total}  ·  TIP ${tip}${bonus ? ` +${bonus} SPICY` : ''}`, until: state.time + 2.0 };
  addFloater(state, `+${total}`, 1140, 470, goodServe ? '#ffd98a' : '#f5ead2');
  return { order, total, base, tip, bonus, spicy, accuracy, goodServe };
}

/** Short human text for a ticket, used on the card and the stamp. */
export function ticketLines(order) {
  const r = order.recipe;
  const broth = BROTHS[r.broth].name;
  const done = DONENESS[r.doneness].name;
  const tops = r.toppings.map((t) => TOPPINGS[t].name).join(' + ');
  return { broth, done, tops };
}
