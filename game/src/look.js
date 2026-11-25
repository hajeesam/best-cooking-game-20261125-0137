// look.js — the palette and every drawn shape of Broth & Blade.
// All art is code: canvas paths, no images, no network. Sumi-e ink lines,
// indigo night, warm lantern light, steam. Nothing here loads anything.
export const PALETTE = {
  nightTop: '#10182e',
  nightBottom: '#1e2a4a',
  wall: '#232c4d',
  wallLine: '#2f3a63',
  woodDark: '#5d3a1c',
  wood: '#7a4a22',
  woodLight: '#a9743f',
  woodEdge: '#4a2c12',
  paper: '#f5ead2',
  paperDark: '#e8d9b8',
  ink: '#2b2620',
  inkSoft: '#4a4238',
  lantern: '#ffb347',
  lanternCore: '#ffd98a',
  glow: '#ff9d2e',
  shoyu: '#6e3f16',
  tonkotsu: '#e6d3a3',
  miso: '#9c4a24',
  noodle: '#f2c94c',
  noodleDark: '#d9a91f',
  chashu: '#e8a0a0',
  chashuDark: '#b95c5c',
  eggWhite: '#fdf6e3',
  yolk: '#f59e0b',
  scallion: '#4caf6d',
  chili: '#c1272d',
  mushroom: '#8d6e63',
  shallot: '#d9a441',
  nori: '#1f3d2b',
  steam: 'rgba(235, 240, 255, 0.55)',
  red: '#c1272d',
  green: '#4caf7d',
  gold: '#c9a227',
  white: '#f7f3e8',
  grey: '#8a8fa3',
};

/** Rounded-rect path, no fill/stroke on its own. */
export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** A sumi-e ink stroke: one dark line with two faint offset echoes. */
export function inkStroke(ctx, points, width = 2.5, color = PALETTE.ink) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [dx, dy, alpha] of [[0, 0, 1], [1.2, 0.8, 0.35], [-1, 1.4, 0.3]]) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x + dx, y + dy) : ctx.lineTo(x + dx, y + dy)));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** A wisp of steam: three rising sine strokes, phase from time t. */
export function steam(ctx, x, y, h, t, amount = 1) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const phase = t * 0.9 + i * 2.1;
    const sway = Math.sin(phase) * 6;
    ctx.strokeStyle = PALETTE.steam;
    ctx.globalAlpha = 0.28 * amount * (1 - (i % 3) * 0.18);
    ctx.lineWidth = 3 - i * 0.6;
    ctx.beginPath();
    ctx.moveTo(x + (i - 1) * 9, y);
    ctx.bezierCurveTo(x + (i - 1) * 9 + sway, y - h * 0.35, x + (i - 1) * 9 - sway, y - h * 0.7, x + (i - 1) * 9 + sway * 0.5, y - h);
    ctx.stroke();
  }
  ctx.restore();
}

/** A paper lantern with a warm glow halo. */
export function lantern(ctx, x, y, r, t) {
  const flicker = 0.92 + Math.sin(t * 3.1 + x) * 0.05;
  const grad = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.4);
  grad.addColorStop(0, `rgba(255, 179, 71, ${0.5 * flicker})`);
  grad.addColorStop(1, 'rgba(255, 157, 46, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.72, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(43, 38, 32, 0.55)';
  ctx.lineWidth = 1.4;
  for (const dy of [-r * 0.45, 0, r * 0.45]) {
    ctx.beginPath();
    ctx.ellipse(x, y + dy, r * 0.68, r * 0.16, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(x - 3, y - r - 7, 6, 7);
  ctx.fillRect(x - 3, y + r, 6, 7);
}

// ------------------------------------------------------------- food icons
// Every topping is drawn the same way in bins, on the board, in the tray
// and in the bowl, so the judge (and the player) reads it at a glance.

export function drawNoodles(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = PALETTE.noodle;
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, 5 + i * 4.4, Math.PI * (0.15 + i * 0.35), Math.PI * (1.15 + i * 0.3));
    ctx.stroke();
  }
  ctx.strokeStyle = PALETTE.noodleDark;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 7, Math.PI * 0.4, Math.PI * 1.2);
  ctx.stroke();
  ctx.restore();
}

export function drawChashu(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = PALETTE.chashu;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.chashuDark;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, 6.5, 0.4, Math.PI * 1.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 2.6, 0.6, Math.PI * 1.9);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawEgg(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = PALETTE.eggWhite;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 8.5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = PALETTE.yolk;
  ctx.beginPath();
  ctx.arc(1.5, 0, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(0, -1.6, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawScallion(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  for (const [dx, dy, r] of [[-7, -3, 4.2], [6, -5, 4.6], [0, 5, 4.4], [8, 4, 3.6], [-2, -8, 3.8]]) {
    ctx.strokeStyle = '#2e7d46';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.scallion;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawChiliOil(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = PALETTE.chili;
  for (const [dx, dy, r] of [[-6, 2, 4.5], [5, -4, 5], [1, 6, 3.6], [8, 4, 3]]) {
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(4, -6, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawMushroom(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#d7c9a8';
  ctx.fillRect(-2.5, 0, 5, 8);
  ctx.fillStyle = PALETTE.mushroom;
  ctx.beginPath();
  ctx.arc(0, 1, 10, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 1, 10, Math.PI, 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(245,234,210,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-5, -4);
  ctx.quadraticCurveTo(0, -8, 5, -4);
  ctx.stroke();
  ctx.restore();
}

export function drawShallot(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = PALETTE.shallot;
  for (const [dx, dy, rot] of [[-6, -2, 0.5], [4, -5, -0.7], [0, 4, 1.1], [7, 3, 0.2], [-2, -7, -1.2]]) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(-7, -6, 3, 1.4);
  ctx.restore();
}

export function drawNori(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = PALETTE.nori;
  rr(ctx, -9, -7, 18, 14, 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,234,210,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-5, -3);
  ctx.lineTo(5, -3);
  ctx.moveTo(-5, 1);
  ctx.lineTo(5, 1);
  ctx.stroke();
  ctx.restore();
}

/** One topping by id, at (x, y), scale s. */
export function drawTopping(ctx, id, x, y, s = 1) {
  if (id === 'chashu') drawChashu(ctx, x, y, s);
  else if (id === 'egg') drawEgg(ctx, x, y, s);
  else if (id === 'scallion') drawScallion(ctx, x, y, s);
  else if (id === 'chili') drawChiliOil(ctx, x, y, s);
  else if (id === 'mushroom') drawMushroom(ctx, x, y, s);
  else if (id === 'shallot') drawShallot(ctx, x, y, s);
  else if (id === 'nori') drawNori(ctx, x, y, s);
  else drawNoodles(ctx, x, y, s);
}

// ------------------------------------------------------------- vessels

/** A ramen bowl: dark ceramic, broth surface, noodles, toppings in layers. */
export function drawBowl(ctx, x, y, r, bowl, t) {
  ctx.save();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.72, r * 1.02, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  const body = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  body.addColorStop(0, '#3a3f5c');
  body.addColorStop(0.55, '#232742');
  body.addColorStop(1, '#14172e');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x - r, y - r * 0.28);
  ctx.quadraticCurveTo(x - r, y + r * 0.62, x, y + r * 0.66);
  ctx.quadraticCurveTo(x + r, y + r * 0.62, x + r, y - r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // rim
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.28, r, r * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
  // broth
  if (bowl && bowl.broth) {
    const brothColor = bowl.broth === 'shoyu' ? PALETTE.shoyu : bowl.broth === 'tonkotsu' ? PALETTE.tonkotsu : PALETTE.miso;
    ctx.fillStyle = brothColor;
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.28, r * 0.88, r * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // noodles in the broth
    if (bowl.noodles) drawNoodles(ctx, x - r * 0.1, y - r * 0.3, 1.15);
    // toppings, laid in the order they were added
    const spots = [
      [x - r * 0.52, y - r * 0.34],
      [x + r * 0.5, y - r * 0.36],
      [x + r * 0.08, y - r * 0.5],
      [x - r * 0.28, y - r * 0.1],
      [x + r * 0.3, y - r * 0.08],
    ];
    (bowl.toppings || []).forEach((id, i) => {
      const [tx, ty] = spots[i % spots.length];
      drawTopping(ctx, id, tx, ty, 1.05);
    });
    steam(ctx, x, y - r * 0.5, r * 0.9, t, 1);
  } else {
    // empty bowl: pale interior
    ctx.fillStyle = '#d9cfb4';
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.28, r * 0.88, r * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // chopsticks resting on the rim
  ctx.save();
  ctx.translate(x + r * 0.55, y - r * 0.62);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#b98a4a';
  ctx.fillRect(0, 0, r * 1.15, 4);
  ctx.fillStyle = '#8a5a2e';
  ctx.fillRect(0, 6, r * 1.15, 4);
  ctx.restore();
  ctx.restore();
}

/** The broth's colour at a doneness 0..1: pale while underdone, amber
 * in the good window, darker and charred as it goes soft and soggy.
 * Same thresholds as qualityOf in broth.js, so the tint, the bar and
 * the word under the vat always agree. */
export function donenessTint(doneness) {
  if (doneness < 0.32) return '#f0dca8';
  if (doneness <= 0.58) return '#e8b23a';
  if (doneness <= 0.8) return '#c07f1d';
  if (doneness <= 0.95) return '#7c4a16';
  return '#33200e';
}

/** A broth vat: iron pot, broth surface, basket when one is cooking. */
export function drawVat(ctx, x, y, w, h, broth, basket, doneness, t) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + h * 0.52, w * 0.55, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // pot body
  const body = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y + h);
  body.addColorStop(0, '#3d4458');
  body.addColorStop(0.5, '#232838');
  body.addColorStop(1, '#14172a');
  ctx.fillStyle = body;
  rr(ctx, x - w / 2, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // broth surface: the broth's own colour while idle, tinted by
  // doneness while a basket cooks, so the state reads at a glance.
  const brothColor = broth === 'shoyu' ? PALETTE.shoyu : broth === 'tonkotsu' ? PALETTE.tonkotsu : PALETTE.miso;
  ctx.fillStyle = basket ? donenessTint(doneness) : brothColor;
  ctx.beginPath();
  ctx.ellipse(x, y + 8, w / 2 - 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // doneness fill bar on the pot's front: the fill climbs with the
  // basket, coloured by its state, with ticks at the good window's
  // edges (0.32 and 0.95) so the pull moment is visible.
  if (basket) {
    const barX = x - w / 2 + 12;
    const barY = y + h - 26;
    const barW = w - 24;
    const barH = 10;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rr(ctx, barX, barY, barW, barH, 5);
    ctx.fill();
    ctx.fillStyle = donenessTint(doneness);
    rr(ctx, barX, barY, Math.max(4, barW * Math.min(1, doneness)), barH, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,234,210,0.75)';
    ctx.lineWidth = 1.4;
    for (const mark of [0.32, 0.95]) {
      const mx = barX + barW * mark;
      ctx.beginPath();
      ctx.moveTo(mx, barY - 3);
      ctx.lineTo(mx, barY + barH + 3);
      ctx.stroke();
    }
  }
  // gentle bubbles
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  const b1 = (t * 0.7 + x) % 1;
  ctx.beginPath();
  ctx.arc(x - w * 0.2 + b1 * 14, y + 6, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.18 - b1 * 10, y + 9, 1.8, 0, Math.PI * 2);
  ctx.fill();
  steam(ctx, x, y - 6, 34, t + x * 0.01, 0.8);
  // basket with noodles
  if (basket) {
    const bx = x;
    const by = y - 26;
    ctx.strokeStyle = '#c9c2b0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by + 6, 20, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx - 20, by + 6);
    ctx.lineTo(bx - 14, by + 26);
    ctx.lineTo(bx + 14, by + 26);
    ctx.lineTo(bx + 20, by + 6);
    ctx.stroke();
    drawNoodles(ctx, bx, by + 8, 0.85);
    // handle
    ctx.beginPath();
    ctx.moveTo(bx, by - 12);
    ctx.lineTo(bx, by - 26);
    ctx.stroke();
  }
  // doneness ring around the pot
  if (basket) {
    const cx = x + w / 2 + 16;
    const cy = y + h / 2;
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(245,234,210,0.25)';
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.stroke();
    const col = doneness < 0.35 ? PALETTE.noodle : doneness <= 0.8 ? PALETTE.green : PALETTE.red;
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, doneness));
    ctx.stroke();
  }
  ctx.restore();
}

/** A chopping knife, angled, blade catching the light. */
export function drawKnife(ctx, x, y, angle, chopping) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + (chopping ? Math.sin(Date.now() / 40) * 0.08 : 0));
  const grad = ctx.createLinearGradient(0, -8, 0, 8);
  grad.addColorStop(0, '#e8ecf4');
  grad.addColorStop(1, '#9aa3b5');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(64, -5);
  ctx.lineTo(72, 0);
  ctx.lineTo(64, 5);
  ctx.lineTo(0, 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = '#2b2620';
  ctx.fillRect(-26, -6, 26, 12);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(-28, -6, 3, 12);
  ctx.restore();
}
