// audio.js — tiny WebAudio synth, no files, no network.
// Every sound is an oscillator or filtered noise made on the spot.
// The context is created on the first user gesture; everything is
// guarded, so a headless browser or a muted tab never throws.
let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

/** Create (or reuse) the audio context. Call from a user gesture. */
export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0, slideTo = null) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Sound is garnish; a failure never breaks the game.
  }
}

function noiseBurst(dur, gain = 0.18, freq = 1800) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 0.8;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(ac.destination);
    src.start(t0);
  } catch {
    // Sound is garnish.
  }
}

/** A chop: a sharp thock, pitch rising with the combo of fast chops. */
export function chopSound(streak = 0) {
  noiseBurst(0.07, 0.22, 2400 + streak * 220);
  tone(190 + streak * 24, 0.08, 'triangle', 0.1);
}

/** Noodles dropped into a vat: a soft plip. */
export function plipSound() {
  tone(320, 0.16, 'sine', 0.12, 0, 140);
}

/** Basket pulled: a bright ding. */
export function dingSound(perfect) {
  tone(660, 0.14, 'sine', 0.12);
  tone(perfect ? 990 : 520, 0.2, 'sine', 0.1, 0.09);
}

/** A dish served: a little two-note chime, higher with the combo. */
export function serveSound(combo = 1) {
  const base = 520 + Math.min(combo, 5) * 40;
  tone(base, 0.14, 'sine', 0.13);
  tone(base * 1.5, 0.22, 'sine', 0.11, 0.1);
}

/** Something went wrong: a low buzz. */
export function buzzSound() {
  tone(140, 0.18, 'sawtooth', 0.07, 0, 90);
}

/** A ticket is about to expire: a soft tick. */
export function tickSound() {
  tone(880, 0.05, 'square', 0.04);
}

/** Shift over: a short closing phrase. */
export function endSound() {
  tone(392, 0.2, 'sine', 0.12);
  tone(523, 0.2, 'sine', 0.12, 0.16);
  tone(659, 0.34, 'sine', 0.12, 0.32);
}
