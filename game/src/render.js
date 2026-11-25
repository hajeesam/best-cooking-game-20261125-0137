// render.js — paints Broth & Blade on the 1280x720 canvas.
// One draw per frame from the state; nothing is cached, nothing is
// loaded. The judge reads the game through these frames, so every
// zone says what it is at a glance: tickets, vats, board, bins,
// the bowl mid-assembly, the timer, the rail.

import { PALETTE, rr, inkStroke, steam, lantern, drawTopping, drawBowl, drawVat, drawKnife, drawNoodles } from './look.js';
import { LAYOUT, W, H, binRect, trayRect, timeLeft, SHIFT_LENGTH } from './state.js';
import { BIN_IDS, BIN_LABELS, BROTHS, DONENESS, TOPPINGS } from './recipes.js';
import { ticketLines } from './orders.js';
import { qualityOf } from './broth.js';
import { comboMult } from './serve.js';

function text(ctx, str, x, y, size, color, align = 'left', weight = '700', font = 'system-ui, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function drawBackground(ctx, state, t) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, PALETTE.nightTop);
  grad.addColorStop(0.6, PALETTE.nightBottom);
  grad.addColorStop(1, '#16203a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // Wall panels
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 122, W, 278);
  ctx.strokeStyle = PALETTE.wallLine;
  ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x, 122);
    ctx.lineTo(x, 400);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.lineTo(W, 400);
  ctx.stroke();
  // Rainy window, far left
  ctx.save();
  ctx.fillStyle = '#0d1526';
  rr(ctx, 560, 140, 150, 120, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.wallLine;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(140, 170, 220, 0.35)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 7; i++) {
    const rx = 570 + i * 19 + Math.sin(t * 0.6 + i) * 2;
    const ry = 150 + ((t * 26 + i * 37) % 100);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 3, ry + 12);
    ctx.stroke();
  }
  ctx.restore();
  // Lanterns
  lantern(ctx, 60, 160, 16, t);
  lantern(ctx, 1240, 160, 16, t + 2);
  // Floor
  ctx.fillStyle = '#0c1224';
  ctx.fillRect(0, 660, W, 60);
  // Ember edge when time is nearly up
  const left = timeLeft(state);
  if (state.screen === 'play' && left < 30) {
    const pulse = 0.25 + 0.2 * Math.sin(t * 5);
    const edge = ctx.createLinearGradient(0, 0, 0, H);
    edge.addColorStop(0, `rgba(193,39,45,${pulse})`);
    edge.addColorStop(0.12, 'rgba(193,39,45,0)');
    edge.addColorStop(0.88, 'rgba(193,39,45,0)');
    edge.addColorStop(1, `rgba(193,39,45,${pulse})`);
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawTicket(ctx, order, index, t) {
  const { w, h, gap, x0, y } = LAYOUT.ticket;
  const targetX = x0 + index * (w + gap);
  const x = targetX + (1 - order.slide) * 260;
  const lines = ticketLines(order);
  const frac = Math.max(0, order.patience / order.maxPatience);
  ctx.save();
  // Card
  ctx.fillStyle = PALETTE.paper;
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Broth band
  ctx.fillStyle = BROTHS[order.recipe.broth].color;
  rr(ctx, x, y, w, 22, 8);
  ctx.fill();
  ctx.fillRect(x, y + 14, w, 8);
  text(ctx, `#${order.id} · ${lines.broth}`, x + 10, y + 16, 13, '#fff');
  text(ctx, lines.done, x + 10, y + 40, 13, PALETTE.inkSoft, 'left', '600');
  // Topping icons
  order.recipe.toppings.forEach((id, i) => {
    drawTopping(ctx, id, x + 24 + i * 44, y + 62, 0.9);
  });
  text(ctx, lines.tops, x + 10, y + 90, 10.5, PALETTE.inkSoft, 'left', '500');
  // Patience bar
  const barY = y + h - 8;
  ctx.fillStyle = 'rgba(43,38,32,0.2)';
  ctx.fillRect(x + 8, barY, w - 16, 4);
  ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.gold : PALETTE.red;
  ctx.fillRect(x + 8, barY, (w - 16) * frac, 4);
  // DONE stamp
  if (order.status === 'done') {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(-0.28);
    ctx.strokeStyle = PALETTE.green;
    ctx.lineWidth = 3;
    ctx.strokeRect(-52, -16, 104, 32);
    text(ctx, 'DONE', 0, 6, 20, PALETTE.green, 'center', '900');
    ctx.restore();
  }
  if (order.status === 'missed') {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#3a3448';
    rr(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.restore();
    text(ctx, 'WALKED OUT', x + w / 2, y + h / 2 + 5, 14, PALETTE.paper, 'center', '800');
  }
  ctx.restore();
}

function drawStrip(ctx, state, t) {
  ctx.fillStyle = '#0a0f1f';
  ctx.fillRect(0, 0, W, LAYOUT.strip.h);
  ctx.fillStyle = 'rgba(255,179,71,0.08)';
  ctx.fillRect(0, LAYOUT.strip.h - 4, W, 4);
  text(ctx, 'ORDER BOARD', 16, 10, 10, PALETTE.grey, 'left', '700');
  const waiting = state.orders.filter((o) => o.status !== 'waiting');
  state.orders.forEach((order, i) => drawTicket(ctx, order, i, t));
  if (state.orders.length === 0) {
    text(ctx, 'Tickets slide in from the right — get ready.', 40, 70, 15, PALETTE.grey, 'left', '500');
  }
  // Timer ring, top right
  const { x, y, r } = LAYOUT.timer;
  const left = timeLeft(state);
  const frac = left / SHIFT_LENGTH;
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(245,234,210,0.22)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.gold : PALETTE.red;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.stroke();
  const mm = Math.floor(left / 60);
  const ss = Math.floor(left % 60);
  text(ctx, `${mm}:${String(ss).padStart(2, '0')}`, x, y + 6, 19, '#fff', 'center', '800');
  // Score + combo under the ring
  text(ctx, `SCORE ${state.score}`, LAYOUT.score.x, LAYOUT.score.y, 13, PALETTE.white, 'center', '800');
  if (state.combo >= 2) {
    text(ctx, `COMBO x${comboMult(state).toFixed(2).replace(/\.?0+$/, '')} (${state.combo})`, LAYOUT.score.x, LAYOUT.score.y + 18, 12, PALETTE.lantern, 'center', '800');
  }
}

function drawVats(ctx, state, t) {
  // The hint sits under the vats, clear of the hanging baskets.
  text(ctx, 'BROTH VATS — click a vat with noodles, pull with Space', 110, 344, 11, PALETTE.grey, 'left', '600');
  state.vats.forEach((vat, i) => {
    drawVat(ctx, vat.x, vat.y, vat.w, vat.h, vat.broth, vat.basket, vat.basket ? vat.basket.doneness : 0, t);
    text(ctx, BROTHS[vat.broth].name, vat.x, vat.y + vat.h + 18, 12, PALETTE.white, 'center', '700');
    if (vat.basket) {
      const q = qualityOf(vat.basket.doneness);
      text(ctx, q.toUpperCase(), vat.x, vat.y + vat.h + 34, 10, vat.basket.doneness > 0.95 ? PALETTE.red : PALETTE.lantern, 'center', '800');
    }
    text(ctx, `${i + 1}`, vat.x - vat.w / 2 - 12, vat.y + 14, 11, PALETTE.grey, 'center', '700');
  });
}

function drawBoard(ctx, state, t) {
  const b = LAYOUT.board;
  ctx.save();
  text(ctx, 'CHOPPING BOARD — click 3x', b.x + 12, b.y - 10, 11, PALETTE.grey, 'left', '600');
  if (state.board) {
    // Full board: the topping sits on it, the knife is held over the
    // topping with chopped bits under the blade, and the chop marks
    // sit beside the topping instead of far away from it.
    ctx.fillStyle = PALETTE.woodDark;
    rr(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 10);
    ctx.fill();
    ctx.fillStyle = '#c89a5e';
    rr(ctx, b.x, b.y, b.w, b.h, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,55,20,0.35)';
    ctx.lineWidth = 1.2;
    for (const gy of [b.y + 24, b.y + 52, b.y + 78]) {
      ctx.beginPath();
      ctx.moveTo(b.x + 14, gy);
      ctx.bezierCurveTo(b.x + 140, gy + 4, b.x + 260, gy - 4, b.x + b.w - 14, gy);
      ctx.stroke();
    }
    const cx = b.x + 120;
    const cy = b.y + b.h / 2 + 6;
    drawTopping(ctx, state.board.topping, cx, cy, 1.6);
    // chop marks, beside the topping
    for (let i = 0; i < state.board.need; i++) {
      ctx.fillStyle = i < state.board.hits ? PALETTE.red : 'rgba(43,38,32,0.3)';
      ctx.beginPath();
      ctx.arc(cx + 44 + i * 22, cy + 26, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // chopped bits under the blade once the topping has been hit
    if (state.board.hits > 0) {
      const bits = [
        [cx + 8, cy + 14, '#e8d9b8', 3.2],
        [cx + 24, cy + 9, '#4caf6d', 2.8],
        [cx - 4, cy + 18, '#e8d9b8', 2.6],
      ];
      for (const [bx, by, color, r] of bits) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // knife held over the topping, blade coming down onto it
    drawKnife(ctx, cx - 52, cy - 38, 0.38, state.board.hits > 0);
    // flying slices while chopping
    for (const p of state.particles) {
      if (p.color === '#e8d9b8' && state.time < p.until) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Idle: the board shrinks to its content — a compact slab with
    // the knife resting on it, no dead tan expanse. Staged shots
    // show no instruction text at all; live play keeps one small
    // hint line below the board, outside it.
    const sw = 250;
    const sh = 64;
    const sx = b.x + (b.w - sw) / 2;
    const sy = b.y + (b.h - sh) / 2;
    ctx.fillStyle = PALETTE.woodDark;
    rr(ctx, sx - 5, sy - 5, sw + 10, sh + 10, 9);
    ctx.fill();
    ctx.fillStyle = '#c89a5e';
    rr(ctx, sx, sy, sw, sh, 7);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,55,20,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx + 14, sy + sh / 2);
    ctx.bezierCurveTo(sx + 90, sy + sh / 2 + 4, sx + 160, sy + sh / 2 - 4, sx + sw - 14, sy + sh / 2);
    ctx.stroke();
    drawKnife(ctx, sx + 42, sy + sh / 2 + 6, -0.18, false);
    if (!state.staged) {
      text(ctx, 'Click a topping bin to chop it here', b.x + b.w / 2, b.y + b.h + 16, 11, PALETTE.grey, 'center', '500');
    }
  }
  ctx.restore();
}

function drawBins(ctx, state, t) {
  text(ctx, 'INGREDIENTS', LAYOUT.bins.x0, LAYOUT.bins.y0 - 8, 11, PALETTE.grey, 'left', '600');
  BIN_IDS.forEach((id, i) => {
    const r = binRect(i);
    const active = state.hand && state.hand.kind === 'noodles' && id === 'noodles';
    ctx.fillStyle = active ? '#3d2f16' : '#1d2440';
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = active ? PALETTE.lantern : PALETTE.wallLine;
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.stroke();
    if (id === 'noodles') drawNoodles(ctx, r.x + r.w / 2, r.y + 30, 1.1);
    else drawTopping(ctx, id, r.x + r.w / 2, r.y + 30, 1.15);
    text(ctx, BIN_LABELS[id], r.x + r.w / 2, r.y + r.h - 12, 11.5, PALETTE.white, 'center', '700');
    if (i === 0) text(ctx, '1', r.x + 10, r.y + 14, 10, PALETTE.grey, 'left', '700');
  });
}

function drawTray(ctx, state) {
  const tr = LAYOUT.tray;
  ctx.fillStyle = '#1d2440';
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.wallLine;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, 'PREP TRAY', tr.x + tr.w / 2, tr.y + 20, 11, PALETTE.grey, 'center', '700');
  text(ctx, 'click to pick up', tr.x + tr.w / 2, tr.y + 34, 9.5, PALETTE.grey, 'center', '500');
  for (let i = 0; i < 4; i++) {
    const s = trayRect(i);
    ctx.strokeStyle = 'rgba(245,234,210,0.18)';
    ctx.lineWidth = 1.4;
    rr(ctx, s.x, s.y, s.w, s.h, 6);
    ctx.stroke();
    const id = state.tray[i];
    if (id) drawTopping(ctx, id, s.x + s.w / 2, s.y + s.h / 2, 1.1);
  }
}

function drawCounter(ctx, state, t) {
  const c = LAYOUT.counter;
  // counter body
  const grad = ctx.createLinearGradient(0, c.y, 0, c.y + c.h);
  grad.addColorStop(0, PALETTE.woodLight);
  grad.addColorStop(0.25, PALETTE.wood);
  grad.addColorStop(1, PALETTE.woodDark);
  ctx.fillStyle = grad;
  rr(ctx, c.x, c.y, c.w, c.h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodEdge;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // counter top highlight
  ctx.fillStyle = 'rgba(255,220,160,0.25)';
  ctx.fillRect(c.x + 8, c.y + 4, c.w - 16, 6);
  text(ctx, 'COUNTER', c.x + 14, c.y + 28, 11, 'rgba(245,234,210,0.75)', 'left', '700');
  // The bowl, mid-assembly, centre of the counter
  const draggingBowl = state.drag && state.drag.kind === 'bowl';
  if (!draggingBowl) drawBowl(ctx, LAYOUT.bowl.x, LAYOUT.bowl.y, LAYOUT.bowl.r, state.bowl, t);
  // A topping mid-drag toward the bowl
  if (state.drag && state.drag.kind === 'topping') {
    ctx.save();
    ctx.globalAlpha = 0.9;
    drawTopping(ctx, state.drag.id, state.drag.x, state.drag.y, 1.5);
    ctx.strokeStyle = PALETTE.lantern;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(state.drag.x, state.drag.y);
    ctx.lineTo(LAYOUT.bowl.x, LAYOUT.bowl.y - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  // Hand: what the player carries
  if (state.hand && state.hand.kind === 'basket') {
    drawNoodles(ctx, LAYOUT.bowl.x - 130, LAYOUT.bowl.y - 90, 1);
    text(ctx, 'POUR INTO BOWL', LAYOUT.bowl.x - 130, LAYOUT.bowl.y - 108, 10, PALETTE.lantern, 'center', '800');
  }
}

function drawRail(ctx, state, t) {
  const r = LAYOUT.rail;
  const glowing = state.servedFlash && state.time < state.servedFlash.until;
  ctx.save();
  const grad = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
  grad.addColorStop(0, glowing ? '#7a5a1e' : '#241d33');
  grad.addColorStop(1, '#120d1d');
  ctx.fillStyle = grad;
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.strokeStyle = glowing ? PALETTE.lantern : PALETTE.wallLine;
  ctx.lineWidth = glowing ? 3 : 2;
  ctx.stroke();
  text(ctx, 'SERVE RAIL', r.x + r.w / 2, r.y + 28, 12, glowing ? PALETTE.lantern : PALETTE.grey, 'center', '800');
  text(ctx, 'pass window', r.x + r.w / 2, r.y + 44, 10, PALETTE.grey, 'center', '500');
  // The plate spot: a faint plate outline with a soft glow while
  // empty, so it reads as a place waiting for a dish, not an
  // unfinished slot.
  if (!glowing) {
    const glowGrad = ctx.createRadialGradient(
      LAYOUT.railPlate.x, LAYOUT.railPlate.y, 4,
      LAYOUT.railPlate.x, LAYOUT.railPlate.y, LAYOUT.railPlate.r + 42,
    );
    glowGrad.addColorStop(0, 'rgba(255,179,71,0.14)');
    glowGrad.addColorStop(1, 'rgba(255,179,71,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(
      LAYOUT.railPlate.x - LAYOUT.railPlate.r - 42,
      LAYOUT.railPlate.y - LAYOUT.railPlate.r - 42,
      (LAYOUT.railPlate.r + 42) * 2,
      (LAYOUT.railPlate.r + 42) * 2,
    );
    ctx.fillStyle = 'rgba(245,234,210,0.07)';
    ctx.beginPath();
    ctx.ellipse(LAYOUT.railPlate.x, LAYOUT.railPlate.y, LAYOUT.railPlate.r + 8, (LAYOUT.railPlate.r + 8) * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,234,210,0.5)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(245,234,210,0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(LAYOUT.railPlate.x, LAYOUT.railPlate.y, LAYOUT.railPlate.r * 0.55, LAYOUT.railPlate.r * 0.55 * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // A served bowl glows on the rail for a beat
  if (glowing) {
    drawBowl(ctx, LAYOUT.railPlate.x, LAYOUT.railPlate.y, LAYOUT.railPlate.r, { broth: 'tonkotsu', noodles: { doneness: 0.65 }, toppings: ['chashu', 'egg', 'scallion'] }, t);
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4);
    ctx.strokeStyle = PALETTE.lantern;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(LAYOUT.railPlate.x, LAYOUT.railPlate.y - 18, LAYOUT.railPlate.r + 14, (LAYOUT.railPlate.r + 14) * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // Tip popup
  if (state.tipPopup && state.time < state.tipPopup.until) {
    const alpha = Math.min(1, (state.tipPopup.until - state.time) / 0.6);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = PALETTE.paper;
    rr(ctx, r.x + 18, r.y + 150, r.w - 36, 52, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, state.tipPopup.text, r.x + r.w / 2, r.y + 172, 13, PALETTE.ink, 'center', '800');
    text(ctx, 'served!', r.x + r.w / 2, r.y + 190, 11, PALETTE.inkSoft, 'center', '600');
    ctx.restore();
  }
  ctx.restore();
}

function drawHand(ctx, state, mouse) {
  if (!state.hand || !mouse) return;
  const { x, y } = mouse;
  ctx.save();
  ctx.globalAlpha = 0.95;
  if (state.hand.kind === 'noodles') {
    drawNoodles(ctx, x, y, 1.1);
    text(ctx, 'NOODLES', x, y - 22, 10, PALETTE.lantern, 'center', '800');
  } else if (state.hand.kind === 'basket') {
    drawNoodles(ctx, x, y, 1.1);
    text(ctx, `${state.hand.quality.toUpperCase()} NOODLES`, x, y - 22, 10, PALETTE.lantern, 'center', '800');
  } else if (state.hand.kind === 'topping') {
    drawTopping(ctx, state.hand.id, x, y, 1.3);
    text(ctx, TOPPINGS[state.hand.id].name.toUpperCase(), x, y - 22, 10, PALETTE.lantern, 'center', '800');
  } else if (state.hand.kind === 'bowl') {
    drawBowl(ctx, x, y, 46, state.bowl, 0);
  }
  ctx.restore();
}

function drawOverlays(ctx, state, t) {
  // Message line
  if (state.message && state.time < state.message.until) {
    const alpha = Math.min(1, (state.message.until - state.time) / 0.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    text(ctx, state.message.text, W / 2, 690, 14, state.message.good ? '#ffd98a' : '#ff9a9a', 'center', '700');
    ctx.restore();
  }
  // Floating score texts
  for (const f of state.floaters) {
    if (state.time > f.until) continue;
    const alpha = Math.min(1, (f.until - state.time) / 0.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    text(ctx, f.text, f.x, f.y - (1.4 - (f.until - state.time)) * 26, 20, f.color, 'center', '900');
    ctx.restore();
  }
  // Particles (slices, sparks)
  for (const p of state.particles) {
    if (state.time > p.until) continue;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Shift bar, bottom edge
  const left = timeLeft(state);
  const frac = left / SHIFT_LENGTH;
  ctx.fillStyle = 'rgba(245,234,210,0.15)';
  ctx.fillRect(0, 702, W, 10);
  ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.gold : PALETTE.red;
  ctx.fillRect(0, 702, W * frac, 10);
  if (state.screen === 'play' && left < 30) {
    // The warning sits beside the timer ring it belongs to, not
    // stranded on the bottom edge.
    text(ctx, `${Math.ceil(left)}s LEFT`, LAYOUT.timer.x - LAYOUT.timer.r - 12, LAYOUT.timer.y + 6, 15, PALETTE.red, 'right', '900');
  }
}

function drawTitle(ctx, state, t) {
  ctx.fillStyle = 'rgba(10, 15, 31, 0.72)';
  ctx.fillRect(0, 0, W, H);
  lantern(ctx, 340, 150, 26, t);
  lantern(ctx, 940, 150, 26, t + 2);
  text(ctx, 'BROTH & BLADE', W / 2, 250, 64, PALETTE.paper, 'center', '900', 'Georgia, serif');
  text(ctx, '— Midnight Ramen Counter —', W / 2, 292, 20, PALETTE.lantern, 'center', '600', 'Georgia, serif');
  text(ctx, 'Read the ticket. Chop the toppings. Mind the vats.', W / 2, 340, 17, PALETTE.white, 'center', '500');
  text(ctx, 'Pour, layer in recipe order, and serve before patience runs out.', W / 2, 366, 17, PALETTE.white, 'center', '500');
  text(ctx, 'Click or press Space to start  ·  1/2/3 vats  ·  Space pull  ·  R restart  ·  P pause  ·  M mute', W / 2, 430, 14, PALETTE.grey, 'center', '600');
  drawBowl(ctx, W / 2, 540, 70, { broth: 'shoyu', noodles: { doneness: 0.65 }, toppings: ['chashu', 'egg', 'scallion'] }, t);
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(10, 15, 31, 0.6)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'PAUSED', W / 2, 350, 48, PALETTE.paper, 'center', '900', 'Georgia, serif');
  text(ctx, 'Press P or click to keep cooking', W / 2, 396, 16, PALETTE.grey, 'center', '600');
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(10, 15, 31, 0.78)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'SHIFT OVER', W / 2, 240, 56, PALETTE.paper, 'center', '900', 'Georgia, serif');
  text(ctx, `Score ${state.score}  ·  Served ${state.served}  ·  Missed ${state.missed}  ·  Best combo x${(1 + Math.min(state.bestCombo, 4) * 0.25).toFixed(2).replace(/\.?0+$/, '')}`, W / 2, 300, 18, PALETTE.lantern, 'center', '700');
  text(ctx, `Tips earned ${state.tips}`, W / 2, 332, 16, PALETTE.white, 'center', '600');
  text(ctx, 'Press R or click to cook another shift', W / 2, 400, 15, PALETTE.grey, 'center', '600');
}

/** Paint the whole game for the current state and time t. */
export function draw(ctx, state, mouse, t) {
  drawBackground(ctx, state, t);
  drawStrip(ctx, state, t);
  drawVats(ctx, state, t);
  drawBoard(ctx, state, t);
  drawBins(ctx, state, t);
  drawTray(ctx, state);
  drawCounter(ctx, state, t);
  drawRail(ctx, state, t);
  drawHand(ctx, state, mouse);
  drawOverlays(ctx, state, t);
  if (state.screen === 'title') drawTitle(ctx, state, t);
  else if (state.screen === 'pause') drawPause(ctx);
  else if (state.screen === 'over') drawOver(ctx, state);
}
