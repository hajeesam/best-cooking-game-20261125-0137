// input.js — mouse and keyboard for Broth & Blade.
// Clicks are the main control (with drag for toppings and the bowl);
// keys 1/2/3 pick a vat, Space pulls a basket, R restarts,
// P pauses, M mutes. All coordinates are mapped into the 1280x720
// canvas, whatever size the page shows it at.

import { W, H, LAYOUT, binRect, trayRect, setMessage } from './state.js';
import { BIN_IDS } from './recipes.js';
import { boardTopping, chop, takeFromTray } from './prep.js';
import { dropBasket, pullBasket, readyVat } from './broth.js';
import { pourBasket, addTopping, bowlReady } from './assemble.js';
import { serve } from './serve.js';
import { ensureAudio, setMuted, isMuted } from './audio.js';

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function inCircle(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

/**
 * Attach input to the canvas. `hooks` is { onStart, onPause, onRestart }:
 * title/over screens start on click or Space, P pauses, R restarts.
 * The state object is mutated in place by the game functions.
 */
export function attachInput(canvas, state, hooks) {
  let mouse = { x: 0, y: 0, down: false };

  function toGame(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  }

  function cancelHand() {
    if (!state.hand) return;
    if (state.hand.kind === 'topping') state.tray.push(state.hand.id);
    state.hand = null;
  }

  function clickVat(i) {
    const vat = state.vats[i];
    if (state.hand && state.hand.kind === 'noodles') {
      if (dropBasket(state, i)) state.hand = null;
      return;
    }
    if (vat.basket) {
      const basket = pullBasket(state, i);
      if (basket) {
        state.hand = { kind: 'basket', ...basket };
        setMessage(state, `Pulled — ${basket.quality} noodles`);
      }
      return;
    }
    if (!state.hand) setMessage(state, 'Take noodles from the bin first', false);
  }

  function clickBowl() {
    if (state.hand && state.hand.kind === 'basket') {
      if (pourBasket(state, state.hand)) {
        state.hand = null;
        setMessage(state, 'Noodles in — add toppings in recipe order');
      }
      return;
    }
    if (state.hand && state.hand.kind === 'topping') {
      if (addTopping(state, state.hand.id)) state.hand = null;
      return;
    }
    if (state.hand && state.hand.kind === 'bowl') {
      state.hand = null;
      return;
    }
    if (!state.hand) {
      if (state.bowl.noodles) {
        state.hand = { kind: 'bowl' };
        setMessage(state, 'Bowl in hand — click the serve rail');
      } else {
        setMessage(state, 'The bowl is empty — pour noodles in first', false);
      }
    }
  }

  function clickRail() {
    if (state.hand && state.hand.kind === 'bowl') {
      state.hand = null;
      serve(state);
      return;
    }
    if (!state.hand && bowlReady(state)) {
      serve(state);
      return;
    }
    if (!state.hand) setMessage(state, 'Nothing to serve yet', false);
  }

  function handleClick(x, y) {
    ensureAudio();
    if (state.screen !== 'play') {
      hooks.onStart();
      return;
    }
    // The chopping board.
    if (inRect(x, y, LAYOUT.board)) {
      if (state.hand) cancelHand();
      else chop(state);
      return;
    }
    // The three vats.
    for (let i = 0; i < 3; i++) {
      const v = state.vats[i];
      if (inRect(x, y, { x: v.x - v.w / 2, y: v.y - 14, w: v.w, h: v.h + 28 })) {
        clickVat(i);
        return;
      }
    }
    // The ingredient bins.
    for (let i = 0; i < BIN_IDS.length; i++) {
      if (inRect(x, y, binRect(i))) {
        const id = BIN_IDS[i];
        if (state.hand) cancelHand();
        if (id === 'noodles') {
          state.hand = { kind: 'noodles' };
          setMessage(state, 'Noodles in hand — click a vat');
        } else {
          boardTopping(state, id);
        }
        return;
      }
    }
    // The prep tray.
    for (let i = 0; i < state.tray.length; i++) {
      if (inRect(x, y, trayRect(i))) {
        if (state.hand) cancelHand();
        const id = takeFromTray(state, i);
        if (id) state.hand = { kind: 'topping', id };
        return;
      }
    }
    // The bowl on the counter.
    if (inCircle(x, y, LAYOUT.bowl.x, LAYOUT.bowl.y, LAYOUT.bowl.r + 14)) {
      clickBowl();
      return;
    }
    // The serve rail.
    if (inRect(x, y, LAYOUT.rail)) {
      clickRail();
      return;
    }
    // Anywhere else: put the hand down.
    cancelHand();
  }

  function handleDown(clientX, clientY) {
    const { x, y } = toGame(clientX, clientY);
    mouse = { x, y, down: true };
    ensureAudio();
    if (state.screen !== 'play') return;
    // Drag a topping out of the tray.
    for (let i = 0; i < state.tray.length; i++) {
      if (inRect(x, y, trayRect(i))) {
        state.drag = { kind: 'topping', index: i, id: state.tray[i], x, y };
        return;
      }
    }
    // Drag the bowl to the rail.
    if (state.bowl.noodles && inCircle(x, y, LAYOUT.bowl.x, LAYOUT.bowl.y, LAYOUT.bowl.r + 14)) {
      state.drag = { kind: 'bowl', x, y };
    }
  }

  function handleUp(clientX, clientY) {
    const { x, y } = toGame(clientX, clientY);
    mouse.down = false;
    if (!state.drag) return;
    const drag = state.drag;
    state.drag = null;
    if (state.screen !== 'play') return;
    if (drag.kind === 'topping') {
      if (inCircle(x, y, LAYOUT.bowl.x, LAYOUT.bowl.y, LAYOUT.bowl.r + 20)) {
        takeFromTray(state, drag.index);
        addTopping(state, drag.id);
      }
      return;
    }
    if (drag.kind === 'bowl') {
      if (inRect(x, y, LAYOUT.rail)) serve(state);
    }
  }

  canvas.addEventListener('mousedown', (e) => handleDown(e.clientX, e.clientY));
  canvas.addEventListener('mousemove', (e) => {
    const p = toGame(e.clientX, e.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
    if (state.drag) {
      state.drag.x = p.x;
      state.drag.y = p.y;
    }
  });
  window.addEventListener('mouseup', (e) => handleUp(e.clientX, e.clientY));
  canvas.addEventListener('click', (e) => {
    // A click that ends a drag is not a tap: ignore it.
    if (state.drag) return;
    const { x, y } = toGame(e.clientX, e.clientY);
    handleClick(x, y);
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    ensureAudio();
    const key = e.key.toLowerCase();
    if (key === 'm') {
      setMuted(!isMuted());
      setMessage(state, isMuted() ? 'Sound off' : 'Sound on');
      return;
    }
    if (key === 'r') {
      hooks.onRestart();
      return;
    }
    if (key === 'p') {
      hooks.onPause();
      return;
    }
    if (state.screen !== 'play') {
      if (key === ' ' || key === 'enter') {
        e.preventDefault();
        hooks.onStart();
      }
      return;
    }
    if (key === '1' || key === '2' || key === '3') {
      clickVat(Number(key) - 1);
      return;
    }
    if (key === ' ') {
      e.preventDefault();
      const i = readyVat(state);
      if (i >= 0) clickVat(i);
      else if (state.vats.some((v) => v.basket)) setMessage(state, 'Noodles are not ready yet', false);
      return;
    }
  });

  return {
    mouse: () => mouse,
  };
}
