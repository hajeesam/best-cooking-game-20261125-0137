// main.js — boot and the one loop of Broth & Blade.
// Input is read every frame; the world advances in fixed 1/60 s steps.
// The game moves between four screens: title, play, paused, over.
//
// ?shot=1..4 (with &seed=N) stages that scene instead of running the
// loop, paints it twice and sets window.__shotReady for a screenshot.
// ?seed=N fixes the shift's randomness; without it the seed is random.
import { createState, resetState, SHIFT_LENGTH } from './state.js';
import { stepOrders } from './orders.js';
import { stepBroth } from './broth.js';
import { attachInput } from './input.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';
import { endSound, tickSound } from './audio.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shotParam = Number.parseInt(params.get('shot') ?? '', 10);
const shot = Number.isInteger(shotParam) && shotParam >= 1 && shotParam <= 4 ? shotParam : 0;
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const state = createState(seed);
// Exposed for play-testing from a script: the state and the shot flag.
window.__game = state;

function announce(message) {
  status.textContent = message;
}

function step(dt) {
  if (state.screen !== 'play') return;
  state.time += dt;
  const expired = stepOrders(state, dt);
  void expired;
  stepBroth(state, dt);
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 260 * dt;
  }
  state.particles = state.particles.filter((p) => state.time < p.until);
  state.floaters = state.floaters.filter((f) => state.time < f.until);
  const sec = Math.floor(state.time);
  if (sec !== state.lastTickSecond) {
    state.lastTickSecond = sec;
    if (state.orders.some((o) => o.status === 'waiting' && o.patience < 5 && o.patience > 0)) tickSound();
  }
  if (state.time >= SHIFT_LENGTH) {
    state.time = SHIFT_LENGTH;
    state.screen = 'over';
    endSound();
    announce(`Shift over. Score ${state.score}. Served ${state.served}.`);
  }
}

function runShot(n) {
  const scene = stageShot(n, state);
  state.screen = scene.screen;
  let painted = 0;
  function paint() {
    draw(ctx, state, null, state.time);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = attachInput(canvas, state, {
    onStart() {
      if (state.screen === 'title' || state.screen === 'over') {
        const fresh = resetState(state);
        Object.assign(state, fresh);
        state.screen = 'play';
        announce('Playing. Read the tickets, chop, mind the vats.');
      } else if (state.screen === 'pause') {
        state.screen = 'play';
        announce('Playing.');
      }
    },
    onPause() {
      if (state.screen === 'play') {
        state.screen = 'pause';
        announce('Paused.');
      } else if (state.screen === 'pause') {
        state.screen = 'play';
        announce('Playing.');
      }
    },
    onRestart() {
      const fresh = resetState(state);
      Object.assign(state, fresh);
      state.screen = 'play';
      announce('New shift. Playing.');
    },
  });

  let accumulator = 0;
  let last = performance.now();
  // The animation clock: steam and lanterns move even on the title
  // screen. Shot mode never uses it — it passes the state's own time.
  let animT = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    while (accumulator >= STEP) {
      step(STEP);
      accumulator -= STEP;
    }
    animT += 1 / 60;
    draw(ctx, state, input.mouse(), animT);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === 'play') {
      state.screen = 'pause';
      announce('Paused.');
    }
  });

  announce('Broth and Blade. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
