// prep.js — the chopping board. A topping from a bin lands on the
// board; three rhythmic clicks chop it and the slices drop into the
// prep tray. Egg, chili oil and nori need no chopping: they go
// straight to the tray.

import { TOPPINGS } from './recipes.js';
import { burst, setMessage } from './state.js';
import { chopSound } from './audio.js';

export const CHOPS_NEEDED = 3;
export const TRAY_MAX = 4;

/** Put a topping on the board (or straight in the tray when it needs no chopping). */
export function boardTopping(state, toppingId) {
  if (!TOPPINGS[toppingId]) return false;
  if (!TOPPINGS[toppingId].needsChop) {
    if (state.tray.length >= TRAY_MAX) {
      setMessage(state, 'Prep tray is full', false);
      return false;
    }
    state.tray.push(toppingId);
    setMessage(state, `${TOPPINGS[toppingId].name} ready in the tray`);
    return true;
  }
  if (state.board) {
    setMessage(state, 'Board is busy — finish chopping first', false);
    return false;
  }
  state.board = { topping: toppingId, hits: 0, need: CHOPS_NEEDED, streak: 0, lastHitAt: -10 };
  return true;
}

/** One chop on the board. Returns the topping id when it is done. */
export function chop(state) {
  if (!state.board) return null;
  const now = state.time;
  // Fast rhythmic chops build a streak: the knife sings higher.
  state.board.streak = now - state.board.lastHitAt < 0.6 ? state.board.streak + 1 : 0;
  state.board.lastHitAt = now;
  state.board.hits += 1;
  chopSound(state.board.streak);
  burst(state, 270, 420, '#e8d9b8', 5);
  if (state.board.hits < state.board.need) return null;
  const done = state.board.topping;
  state.board = null;
  if (state.tray.length >= TRAY_MAX) {
    setMessage(state, 'Prep tray is full — chopped topping lost', false);
    return done;
  }
  state.tray.push(done);
  setMessage(state, `${TOPPINGS[done].name} chopped — in the tray`);
  return done;
}

/** Take a chopped topping out of the tray (index i) into the hand. */
export function takeFromTray(state, i) {
  if (i < 0 || i >= state.tray.length) return null;
  const [id] = state.tray.splice(i, 1);
  return id;
}
