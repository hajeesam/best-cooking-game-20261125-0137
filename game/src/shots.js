// shots.js — the four staged scenes behind ?shot=1..4.
// Each one is a fixed state, written out by hand: the same seed
// always paints the same frame, because nothing here rolls dice.
// The frames are real renders of the game's own code, not pictures.
import { LAYOUT } from './state.js';

/** A ticket with a fixed recipe and fixed patience, for a shot. */
function fixedTicket(id, broth, doneness, toppings, patience, maxPatience, slide = 1) {
  return {
    id,
    recipe: { broth, doneness, toppings },
    patience,
    maxPatience,
    born: 0,
    status: 'waiting',
    slide,
  };
}

/**
 * Set `state` to the named shot (1..4; anything else is 1) and return
 * the screen to draw over it. The state's time is set so the timer,
 * the patience rings and the popups read exactly as staged.
 */
export function stageShot(n, state) {
  state.staged = true;
  state.orders = [];
  state.vats.forEach((v) => {
    v.basket = null;
  });
  state.board = null;
  state.tray = [];
  state.bowl = { broth: null, noodles: null, toppings: [] };
  state.hand = null;
  state.drag = null;
  state.message = null;
  state.floaters = [];
  state.particles = [];
  state.servedFlash = null;
  state.tipPopup = null;
  state.doneStamp = null;

  if (n === 1) {
    // Open: the shift just started, but the counter is already alive:
    // a half-built bowl on the counter, a garnish mid-chop on the
    // board, one chopped topping in the tray and a plated dish on the
    // rail, so the frame reads as a kitchen at work, not switched off.
    state.time = 15;
    state.score = 0;
    state.combo = 0;
    state.served = 0;
    state.missed = 0;
    state.orders = [
      fixedTicket(1, 'shoyu', 'standard', ['chashu', 'egg'], 44, 48),
      fixedTicket(2, 'tonkotsu', 'aldente', ['scallion', 'chili'], 40, 48),
    ];
    state.board = { topping: 'scallion', hits: 2, need: 3, streak: 1, lastHitAt: state.time - 0.2 };
    state.tray = ['egg'];
    state.bowl = { broth: 'shoyu', noodles: { doneness: 0.65, quality: 'standard' }, toppings: ['chashu'] };
    state.servedFlash = { until: state.time + 1.2 };
    return { screen: 'play' };
  }

  if (n === 3) {
    // The fire: five tickets, the rail glowing with a finished bowl,
    // the timer red in the last seconds, combo x5, ember edges.
    state.time = 168;
    state.score = 1250;
    state.combo = 5;
    state.bestCombo = 5;
    state.served = 9;
    state.missed = 1;
    state.orders = [
      fixedTicket(6, 'miso', 'soft', ['chashu', 'mushroom'], 9, 30),
      fixedTicket(7, 'shoyu', 'aldente', ['egg', 'scallion'], 14, 36),
      fixedTicket(8, 'tonkotsu', 'standard', ['chashu', 'shallot', 'chili'], 18, 36),
      fixedTicket(9, 'miso', 'standard', ['egg', 'chili'], 24, 42),
      fixedTicket(10, 'shoyu', 'soft', ['mushroom', 'scallion'], 28, 42),
    ];
    state.vats[0].basket = { t: 5.6, doneness: 0.4 };
    state.vats[1].basket = { t: 11.2, doneness: 0.8 };
    state.bowl = { broth: 'shoyu', noodles: { doneness: 0.65, quality: 'standard' }, toppings: ['chashu', 'egg'] };
    state.tray = ['scallion', 'chili'];
    state.servedFlash = { until: state.time + 1.2 };
    return { screen: 'play' };
  }

  if (n === 4) {
    // Served: the bowl is on the rail, the ticket is stamped DONE,
    // and the tip popup is up.
    state.time = 100;
    state.score = 1420;
    state.combo = 3;
    state.bestCombo = 4;
    state.served = 6;
    state.missed = 0;
    const done = fixedTicket(5, 'tonkotsu', 'standard', ['chashu', 'egg'], 20, 42);
    done.status = 'done';
    done.doneAt = state.time - 0.4;
    state.orders = [
      done,
      fixedTicket(6, 'shoyu', 'aldente', ['scallion', 'chili'], 30, 42),
      fixedTicket(7, 'miso', 'soft', ['mushroom', 'egg'], 36, 42),
    ];
    state.bowl = { broth: 'miso', noodles: { doneness: 0.84, quality: 'soft' }, toppings: ['mushroom'] };
    state.tray = ['egg'];
    state.servedFlash = { until: state.time + 1.2 };
    state.tipPopup = { text: '+132  ·  TIP 48 +20 SPICY', until: state.time + 2.0 };
    state.doneStamp = { orderId: 5, until: state.time + 1.6 };
    return { screen: 'play' };
  }

  // Shot 2, the cover: mid-rush. Four tickets, one patience ring
  // nearly red; three baskets at three donenesses; the bowl half
  // built (broth + noodles + one topping, the second mid-drag);
  // the knife mid-chop with slices in the air.
  state.time = 70;
  state.score = 340;
  state.combo = 2;
  state.bestCombo = 2;
  state.served = 3;
  state.missed = 0;
  state.orders = [
    fixedTicket(3, 'shoyu', 'standard', ['chashu', 'egg'], 4, 42),
    fixedTicket(4, 'tonkotsu', 'aldente', ['scallion', 'chili'], 22, 42),
    fixedTicket(5, 'miso', 'soft', ['mushroom', 'shallot', 'chili'], 30, 36),
    fixedTicket(6, 'shoyu', 'aldente', ['egg', 'scallion'], 34, 42),
  ];
  state.vats[0].basket = { t: 4.2, doneness: 0.3 };
  state.vats[1].basket = { t: 8.4, doneness: 0.6 };
  state.vats[2].basket = { t: 11.9, doneness: 0.85 };
  state.board = { topping: 'scallion', hits: 2, need: 3, streak: 1, lastHitAt: state.time - 0.2 };
  state.tray = ['chashu', 'mushroom'];
  state.bowl = { broth: 'shoyu', noodles: { doneness: 0.65, quality: 'standard' }, toppings: ['chashu'] };
  // The second topping, mid-drag from the tray to the bowl.
  state.drag = { kind: 'topping', index: 0, id: 'egg', x: 710, y: 545 };
  // Slices in the air above the board, frozen mid-flight.
  const bx = LAYOUT.board.x + 120;
  const by = LAYOUT.board.y + 48;
  state.particles = [
    { x: bx - 30, y: by - 26, vx: 0, vy: 0, until: state.time + 1, color: '#e8d9b8', r: 3.5 },
    { x: bx + 8, y: by - 38, vx: 0, vy: 0, until: state.time + 1, color: '#e8d9b8', r: 2.8 },
    { x: bx + 34, y: by - 20, vx: 0, vy: 0, until: state.time + 1, color: '#e8d9b8', r: 3.2 },
    { x: bx - 8, y: by - 48, vx: 0, vy: 0, until: state.time + 1, color: '#4caf6d', r: 3 },
  ];
  return { screen: 'play' };
}
