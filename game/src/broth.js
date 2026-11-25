// broth.js — the three vats and their noodle baskets. Drop a basket
// in and its doneness ring fills; pull it in the window for perfect
// noodles, too early and it is underdone, too late and it goes soggy.
// Each vat cooks one basket at a time, in its own broth.

import { setMessage, burst } from './state.js';
import { plipSound, dingSound } from './audio.js';

export const COOK_TIME = 14; // seconds for doneness 0 -> 1

/** Drop the hand's noodles into vat i. Returns false when it cannot. */
export function dropBasket(state, i) {
  const vat = state.vats[i];
  if (!vat) return false;
  if (vat.basket) {
    setMessage(state, 'That vat already has a basket', false);
    return false;
  }
  vat.basket = { t: 0, doneness: 0 };
  plipSound();
  burst(state, vat.x, vat.y + 10, '#f2c94c', 4);
  return true;
}

/** Pull the basket out of vat i. Returns the basket, or null. */
export function pullBasket(state, i) {
  const vat = state.vats[i];
  if (!vat || !vat.basket) return null;
  const basket = vat.basket;
  vat.basket = null;
  const perfect = basket.doneness >= 0.32 && basket.doneness <= 0.95;
  dingSound(perfect);
  return { broth: vat.broth, doneness: basket.doneness, quality: qualityOf(basket.doneness) };
}

/** A doneness number 0..1 to a word the player (and judge) reads. */
export function qualityOf(doneness) {
  if (doneness < 0.32) return 'underdone';
  if (doneness <= 0.58) return 'al dente';
  if (doneness <= 0.8) return 'standard';
  if (doneness <= 0.95) return 'soft';
  return 'soggy';
}

/** Advance every cooking basket by dt seconds. */
export function stepBroth(state, dt) {
  for (const vat of state.vats) {
    if (!vat.basket) continue;
    vat.basket.t += dt;
    vat.basket.doneness = Math.min(1.15, vat.basket.t / COOK_TIME);
  }
}

/** The first vat whose basket is in the good window, or -1. */
export function readyVat(state) {
  for (let i = 0; i < state.vats.length; i++) {
    const b = state.vats[i].basket;
    if (b && b.doneness >= 0.32 && b.doneness <= 0.95) return i;
  }
  return -1;
}
