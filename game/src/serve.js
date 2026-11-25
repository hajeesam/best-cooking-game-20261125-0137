// serve.js — the serve rail: slide a finished bowl to the pass
// window, score it against the best-matching ticket, and keep the
// combo alive. A good serve (accuracy >= 0.8) raises the combo;
// anything else breaks it.

import { bestOrderFor, serveBowl } from './orders.js';
import { bowlMatch, bowlReady, clearBowl } from './assemble.js';
import { setMessage } from './state.js';
import { serveSound, buzzSound } from './audio.js';

/**
 * Serve the bowl on the counter. Returns the serve result, or null
 * when there is nothing (or no one) to serve.
 */
export function serve(state) {
  if (!bowlReady(state)) {
    setMessage(state, 'Bowl is not ready — noodles + a topping first', false);
    buzzSound();
    return null;
  }
  const match = bestOrderFor(state, (recipe) => bowlMatch(state, recipe));
  if (!match) {
    setMessage(state, 'No ticket waiting — hold the bowl', false);
    buzzSound();
    return null;
  }
  const result = serveBowl(state, state.bowl, match);
  if (!result) return null;
  clearBowl(state);
  if (result.goodServe) serveSound(state.combo);
  else buzzSound();
  return result;
}

/** The combo multiplier shown under the timer ring (x1.0 .. x2.0). */
export function comboMult(state) {
  return 1 + Math.min(state.combo, 4) * 0.25;
}
