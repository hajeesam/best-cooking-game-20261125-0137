// assemble.js — the bowl on the counter. Noodles and broth pour in
// from a pulled basket; toppings layer on top in the order they are
// added. The recipe's order matters: a topping in the wrong slot
// still lands, it just earns nothing (see recipes.matchBowl).

import { matchBowl } from './recipes.js';
import { setMessage, burst } from './state.js';

/** Pour a pulled basket into the bowl. False when the bowl is full. */
export function pourBasket(state, basket) {
  if (state.bowl.noodles) {
    setMessage(state, 'The bowl already has noodles', false);
    return false;
  }
  state.bowl.broth = basket.broth;
  state.bowl.noodles = { doneness: basket.doneness, quality: basket.quality };
  burst(state, 841, 500, '#f2c94c', 6);
  return true;
}

/** Lay one topping onto the bowl. False when there is nothing to lay it on. */
export function addTopping(state, toppingId) {
  if (!state.bowl.noodles) {
    setMessage(state, 'Noodles first — the bowl is empty', false);
    return false;
  }
  state.bowl.toppings.push(toppingId);
  burst(state, 841, 500, '#e8d9b8', 4);
  return true;
}

/** Is the bowl ready to serve (noodles in, at least one topping)? */
export function bowlReady(state) {
  return !!state.bowl.noodles && state.bowl.toppings.length > 0;
}

/** Empty the bowl back to a clean one (after serving). */
export function clearBowl(state) {
  state.bowl = { broth: null, noodles: null, toppings: [] };
}

/** How well the current bowl matches a recipe (see recipes.js). */
export function bowlMatch(state, recipe) {
  return matchBowl(state.bowl, recipe);
}
