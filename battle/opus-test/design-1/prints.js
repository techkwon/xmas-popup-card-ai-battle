// prints.js — design 1 "고요한 밤 마을" (Silent Night village): every cut outline and every print, drawn in code with
// paperkit-2d (layered cut-paper parts with a lit lip and a short shadow, printed marks, lit panes as glow).
// Palette: midnight indigo sky, blue-white snow, warm gold light, a small cranberry note (Santa, berries).
import * as P2 from 'papercraft/lib/paperkit-2d.js';
const { shade, mix, rng, fillLimb, fillLeaf } = P2;

export const C = {
  skyTop: '#161a44', skyLow: '#323a82', glow: 'rgba(170,150,215,', cloud: '#424a96', cloud2: '#565cab', cloud3: '#6a6cb8',
  gold: '#e7b44a', goldL: '#f7d982', goldD: '#a8761f', moon: '#f4e4b4',
  snow: '#eef2f8', snowM: '#d5deed', snowD: '#a9b6d3', far: '#9eabcc', farL: '#bac5de',
  pine: '#22454e', pineL: '#2f5c63', pineFar: '#35566a', pineD: '#16303a',
  wallA: '#dcc6a0', wallB: '#b0703f', wallC: '#8390b4', wallD: '#a24f38', wallE: '#cf9a62', wallF: '#e8d9bd',
  roofA: '#4d4166', roofB: '#82392f', roofC: '#3b5a6c', roofD: '#5d6f8f',
  win: '#ffd36a', winL: '#fff2bd', frame: '#3a2a2e', door: '#5c3526', stone: '#9c9aae',
  red: '#c3352d', redD: '#8c2420', white: '#f6f1e8', skin: '#f1c7a1', brown: '#8a5638', brownD: '#5c3820', brownL: '#b07a50',
  wood: '#8a5a38', woodD: '#5b3922', woodL: '#b5804f', note: '#f5ecd6', ink: '#262035',
  holly: '#2e5a40', hollyL: '#4c7d55', berry: '#c8302c', cover: '#1d2a5c', coverD: '#141e46', silver: '#d9e0ee',
};

// ---- small drawing helpers (shape units, y up) -----------------------------------------------------------------------
export const starPath = (g, cx, cy, R, r, n = 5, rot = Math.PI / 2) => {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n, d = i % 2 ? r : R; g.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); }
  g.closePath();
};
const disc = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };
const rect = (g, x, y, w, h, rr = 0) => { g.beginPath(); if (rr > 0) g.roundRect(x, y, w, h, rr); else g.rect(x, y, w, h); g.fill(); };
const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
/** A scalloped band: flat bottom at y0, a lobed top around y1 (snow banks, drifts, cloud strips). */
function scallopBand(g, x0, x1, y0, y1, period, amp, ph = 0, rough = null) {
  g.beginPath(); g.moveTo(x0, y0);
  const n = Math.max(8, Math.ceil((x1 - x0) / period * 10));
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n, u = ((x - x0) / period + ph) % 1;
    g.lineTo(x, y1 + amp * Math.sin(Math.PI * u) ** 0.7 + (rough ? rough(x) : 0));
  }
  g.lineTo(x1, y0); g.closePath(); g.fill();
}
/** A tiered pine: n tiers (triangles with a dipped hem) from base y0 up to the tip at y0 + h. */
function pineTiers(x, y0, h, w, n = 4) {
  const tiers = [];
  for (let k = 0; k < n; k++) {
    const t0 = k / n, yb = y0 + h * (0.12 + t0 * 0.7), yt = k === n - 1 ? y0 + h : y0 + h * (0.12 + (k + 1.55) / n * 0.7);
    const hw = (w / 2) * (1 - t0 * 0.62);
    tiers.push({ x, yb, yt, hw });
  }
  return tiers;
}
function tierPath(g, T) {   // a pine tier: a triangle with a scalloped hem
  const { x, yb, yt, hw } = T;
  g.beginPath(); g.moveTo(x, yt); g.lineTo(x + hw, yb);
  const n = Math.max(3, Math.round(hw * 1.6));
  for (let i = 1; i <= n * 2; i++) { const xx = x + hw - (2 * hw * i) / (n * 2); g.lineTo(xx, yb + (i % 2 ? 0.22 * Math.min(1, hw / 1.5) : 0)); }
  g.closePath();
}
function snowHem(g, T, r) {   // snow lying on a tier: a band of lumps along its hem, thinner toward the tip
  const { x, yb, yt, hw } = T, th = 0.28 + hw * 0.05;
  g.beginPath();
  g.moveTo(x - hw * 0.98, yb + 0.05);
  const n = Math.max(3, Math.round(hw * 2.2));
  for (let i = 0; i <= n; i++) { const xx = x - hw * 0.98 + (hw * 1.96 * i) / n; g.lineTo(xx, yb + th + 0.12 * Math.sin(i * 2.1 + r)); }
  g.lineTo(x + hw * 0.98, yb + 0.05); g.closePath(); g.fill();
  // a cap on the tip
  g.beginPath(); g.moveTo(x, yt + 0.05); g.lineTo(x + hw * 0.18, yt - (yt - yb) * 0.22); g.lineTo(x - hw * 0.18, yt - (yt - yb) * 0.22); g.closePath(); g.fill();
}
/** Text in print pixels inside P.draw: convert shape units through the print's own transform (y up -> canvas y down). */
export function textAt(g, str, x, y, { size, font = 'Nanum Pen Script', color = C.ink, align = 'left', alpha = 1, weight = '', baseline = 'alphabetic' }) {
  const m = g.getTransform();
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.font = `${weight ? weight + ' ' : ''}${Math.round(size * m.a)}px "${font}", "Gowun Batang", serif`;
  g.fillStyle = color; g.globalAlpha = alpha; g.textAlign = align; g.textBaseline = baseline;
  g.fillText(str, m.a * x + m.e, m.d * y + m.f);
  g.restore();
}
/** Fit the card message into a box (shape units): wraps and shrinks until it fits; long messages stay inside. */
export function fitMessage(g, m, box, { wrapLines, font = 'Nanum Pen Script', size = 1.2, minSize = 0.55, maxLines = 4 }) {
  const M = g.getTransform(), k = M.a;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  let s = size, lines = [m.msg];
  for (; s >= minSize; s *= 0.94) {
    g.font = `${Math.round(s * k)}px "${font}"`;
    lines = wrapLines(g, m.msg, box.w * k, 99);
    const hh = s * 0.82 * 1.15 + lines.length * s * 1.12 + s * 0.82 * 1.1;
    let wide = false;
    g.font = `${Math.round(s * 0.82 * k)}px "${font}"`;
    if (g.measureText(m.to).width > box.w * k || g.measureText(m.from).width > box.w * k) wide = true;
    if (lines.length <= maxLines && hh <= box.h && !wide) break;
  }
  g.restore();
  return { s, lines };
}

// ---- the night sky (inner face of the back wall) -------------------------------------------------------------------
export const SLOT = { cx: 0, cy: -10, R: 28, x0: -16.6, x1: 13.6 };
export const slotPoint = (x) => [x, SLOT.cy + Math.sqrt(SLOT.R * SLOT.R - x * x)];
export const MOON = [16.6, 20.3, 2.7];
export function paintSky(P) {
  const r = P.r;
  P.gradient(C.skyLow, C.skyTop);
  P.draw((g) => {   // a lavender glow along the horizon, low behind the village
    const gr = g.createLinearGradient(0, 0, 0, 12); gr.addColorStop(0, C.glow + '0.6)'); gr.addColorStop(1, C.glow + '0)');
    g.fillStyle = gr; g.fillRect(-30, 0, 60, 12);
  });
  P.felt(0.35);
  P.marks('dot', { color: '#f3dca0', alpha: 0.8, size: 0.032, density: 0.42, region: { x0: -23, x1: 23, y0: 9, y1: 24 } });
  P.marks('dot', { color: '#cfd4f5', alpha: 0.55, size: 0.024, density: 0.5, region: { x0: -23, x1: 23, y0: 12, y1: 24 } });
  // cut-paper cloud wisps: lobed strips, each its own layer with a pale lip
  const wisp = (x0, x1, y, h, ph) => (g) => {
    g.beginPath(); g.moveTo(x0, y);
    for (let i = 0; i <= 40; i++) { const u = i / 40, x = x0 + (x1 - x0) * u, env = Math.sin(Math.PI * u) ** 0.6; g.lineTo(x, y + env * h * (0.55 + 0.45 * Math.abs(Math.sin(u * 5.3 + ph)))); }
    for (let i = 40; i >= 0; i--) { const u = i / 40, x = x0 + (x1 - x0) * u, env = Math.sin(Math.PI * u) ** 0.9; g.lineTo(x, y - env * h * 0.18); }
    g.closePath(); g.fill();
  };
  P.layer((g) => { wisp(-23, -6, 9.6, 2.0, 0.4)(g); wisp(4, 23.5, 10.4, 1.8, 2.1)(g); }, C.cloud, { rim: 0.5, lip: 0.9, shadow: 0.9 });
  P.layer((g) => { wisp(-19, -9, 10.8, 1.2, 1.3)(g); wisp(9, 19, 11.6, 1.0, 0.2)(g); wisp(-22.5, -12.5, 21.6, 1.1, 0.8)(g); }, C.cloud2, { rim: 0.5, lip: 0.9, shadow: 0.8 });
  // the moon: the crescent (a disc with its dark part cut away), its own inner sheet and printed craters
  const [mx, my, mr] = MOON;
  const cut = (g, x, y, r) => { g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore(); };
  const crescent = (g) => { g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill(); cut(g, mx + mr * 0.42, my + mr * 0.24, mr * 0.82); };
  P.layer((g) => crescent(g), C.moon, { lip: 1, shadow: 1.2, rim: 0.6 });
  P.layer((g) => { g.beginPath(); g.arc(mx - mr * 0.22, my - mr * 0.1, mr * 0.62, 0, Math.PI * 2); g.fill(); cut(g, mx + mr * 0.2, my + mr * 0.12, mr * 0.66); cut(g, mx + mr * 0.42, my + mr * 0.24, mr * 0.82); }, '#fbf0cc', { lip: 0.5, shadow: 0.6 });
  P.draw((g) => { g.fillStyle = 'rgba(190,160,100,0.35)'; for (const [dx, dy, rr] of [[-0.55, -0.9, 0.22], [-1.6, 0.2, 0.17], [-1.0, 1.25, 0.14]]) disc(g, mx + dx, my + dy, rr); });
  // gold stars: four- and five-pointed, each a glued layer; tiny ones printed
  const stars = [[-19.5, 18.2, 0.85, 5], [-14.2, 22.4, 0.6, 4], [-9.8, 19.6, 0.5, 5], [-4.6, 23.0, 0.7, 4], [-2.6, 15.9, 0.42, 5], [3.4, 22.2, 0.55, 5],
    [7.8, 19.2, 0.75, 4], [11.2, 23.1, 0.45, 5], [-21.5, 13.4, 0.5, 4], [21.4, 15.6, 0.55, 4], [12.2, 16.2, 0.38, 5], [-12.0, 15.2, 0.4, 4], [20.2, 23.0, 0.42, 5], [-17.0, 11.6, 0.35, 5]];
  P.layer((g) => { for (const [x, y, s, n] of stars) { starPath(g, x, y, s, n === 4 ? s * 0.32 : s * 0.45, n, Math.PI / 2 + (n === 4 ? 0 : 0.1)); g.fill(); } }, C.gold, { lip: 1, shadow: 1, rim: 0.3 });
  P.layer((g) => { for (const [x, y, s, n] of stars) if (s > 0.5) { starPath(g, x, y, s * 0.5, s * 0.2, n); g.fill(); } }, C.goldL, { lip: 0.6, shadow: 0.5 });
  P.glow((g) => { g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(mx + mr * 0.42, my + mr * 0.24, mr * 0.82, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.45)'; for (const [x, y, s, n] of stars) { starPath(g, x, y, s, s * 0.4, n); g.fill(); } });
  // the slot Santa's sleigh rides in: a cut line with a pale lit lip on its lower edge
  P.draw((g) => {
    const a0 = Math.acos(SLOT.x1 / SLOT.R), a1 = Math.acos(SLOT.x0 / SLOT.R);
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(210,205,255,0.32)'; g.lineWidth = 0.1; g.beginPath(); g.arc(SLOT.cx, SLOT.cy - 0.15, SLOT.R, a0, a1); g.stroke();
    g.strokeStyle = '#0b0d26'; g.lineWidth = 0.24; g.beginPath(); g.arc(SLOT.cx, SLOT.cy, SLOT.R, a0, a1); g.stroke();
    for (const x of [SLOT.x0, SLOT.x1]) { const [px, py] = slotPoint(x); g.fillStyle = '#0b0d26'; disc(g, px, py, 0.2); }
  });
  P.innerShade('#0a0c26', { alpha: 0.35, blurPx: 22 });
}

// ---- the floor (inner face of the lower panel; local y = 0 is the near edge) --------------------------------------
export function paintFloor(P) {
  P.gradient('#e9eef6', '#c3cde2');
  P.felt(0.35);
  P.layer((g) => { scallopBand(g, -24, 24, -1, 2.6, 2.6, 0.55, 0.3); }, '#f3f6fb', { rim: 0.6, lip: 0.8, shadow: 0.8 });
  // a printed border along the front: little six-armed flakes between two ruled lines
  P.draw((g) => {
    g.strokeStyle = 'rgba(80,96,150,0.5)'; g.lineWidth = 0.07;
    for (const y of [0.55, 3.05]) { g.beginPath(); g.moveTo(-22.3, y); g.lineTo(22.3, y); g.stroke(); }
    g.fillStyle = 'rgba(196,150,60,0.85)';
    for (let x = -21; x <= 21.01; x += 2.1) { starPath(g, x, 1.8, 0.42, 0.18, 5); g.fill(); }
    g.fillStyle = 'rgba(90,106,170,0.45)';
    for (let x = -20; x <= 20.01; x += 2.1) { disc(g, x, 1.8, 0.09); }
  });
  P.marks('dot', { color: '#8d9cc6', alpha: 0.35, size: 0.02, density: 0.5, region: { x0: -23, x1: 23, y0: 3.5, y1: 24 } });
  P.innerShade('#4a5688', { alpha: 0.25, blurPx: 16 });
}

// ---- the cover (outer face of the back wall, read when the card lies closed) --------------------------------------
export function snowflakePath(g, cx, cy, R, w, rot = Math.PI / 2) {
  for (let k = 0; k < 6; k++) {
    const a = rot + k * Math.PI / 3, ca = Math.cos(a), sa = Math.sin(a);
    const at = (s, t) => [cx + ca * s - sa * t, cy + sa * s + ca * t];
    poly(g, [at(0, -w / 2), at(R, -w / 2 * 0.7), at(R * 1.06, 0), at(R, w / 2 * 0.7), at(0, w / 2)]);
    for (const s of [0.42, 0.68]) for (const sd of [-1, 1]) {
      const L = R * (s === 0.42 ? 0.36 : 0.26), b = 0.95 * sd;
      const p0 = at(R * s, 0), dx = Math.cos(a + b), dy = Math.sin(a + b);
      poly(g, [[p0[0] - sa * w * 0.38, p0[1] + ca * w * 0.38], [p0[0] + sa * w * 0.38, p0[1] - ca * w * 0.38], [p0[0] + dx * L + sa * w * 0.25, p0[1] + dy * L - ca * w * 0.25], [p0[0] + dx * L - sa * w * 0.25, p0[1] + dy * L + ca * w * 0.25]]);
    }
  }
  g.beginPath(); for (let k = 0; k < 6; k++) { const a = rot + k * Math.PI / 3 + Math.PI / 6; g.lineTo(cx + Math.cos(a) * w * 1.4, cy + Math.sin(a) * w * 1.4); } g.closePath(); g.fill();
}
export function paintCover(P) {
  P.gradient(C.coverD, C.cover, 0.3);
  P.felt(0.45);
  P.marks('dot', { color: '#e8cf8a', alpha: 0.55, size: 0.03, density: 0.35 });
  // a gold double frame
  P.layer((g) => { g.beginPath(); g.roundRect(-21.8, 1.2, 43.6, 21.6, 1.2); g.roundRect(-21.1, 1.9, 42.2, 20.2, 0.9); g.fill('evenodd'); }, C.gold, { lip: 1, shadow: 1 });
  P.layer((g) => { g.beginPath(); g.roundRect(-20.5, 2.5, 41, 19, 0.7); g.roundRect(-20.25, 2.75, 40.5, 18.5, 0.6); g.fill('evenodd'); }, C.goldD, { lip: 0.4, shadow: 0.4 });
  // a village skyline cut from deep navy at the foot, with tiny lit windows
  const sky = (g) => {
    g.beginPath(); g.moveTo(-20.4, 2.6);
    const roofs = [[-20.4, 4.6], [-18.6, 4.6], [-17.4, 6.0], [-16.2, 4.6], [-14.8, 4.6], [-14.8, 5.6], [-13.2, 7.0], [-11.6, 5.6], [-10.6, 5.6], [-10.6, 6.6], [-9.9, 6.6], [-9.9, 9.2], [-9.35, 10.6], [-8.8, 9.2], [-8.8, 6.0], [-6.8, 6.0], [-5.6, 7.4], [-4.4, 6.0], [-3.4, 4.8],
      [-1.2, 4.8], [0.2, 6.4], [1.6, 4.8], [3.0, 4.8], [3.0, 5.8], [4.8, 7.2], [6.6, 5.8], [8.2, 5.8], [9.2, 6.8], [10.2, 5.8], [11.6, 4.6], [13.4, 4.6], [14.6, 6.2], [15.8, 4.6], [17.2, 5.2], [18.8, 6.4], [20.4, 5.2]];
    for (const [x, y] of roofs) g.lineTo(x, y);
    g.lineTo(20.4, 2.6); g.closePath(); g.fill();
  };
  P.layer(sky, '#0f1636', { lip: 0.7, shadow: 0.8, rim: 0.3 });
  P.layer((g) => { scallopBand(g, -20.4, 20.4, 2.55, 3.4, 2.2, 0.45, 0.2); }, '#dfe6f2', { lip: 0.8, shadow: 0.8, rim: 0.5 });
  P.draw((g) => { g.fillStyle = '#f7cd62'; for (const [x, y] of [[-17.6, 4.0], [-16.9, 4.0], [-13.6, 5.0], [-12.8, 5.0], [-9.35, 8.2], [-6.2, 5.0], [-5.2, 5.0], [0.0, 3.9], [4.3, 4.9], [5.3, 4.9], [9.0, 4.9], [14.2, 3.9], [18.4, 4.6], [19.2, 4.6]]) rect(g, x - 0.22, y - 0.25, 0.44, 0.55, 0.05); });
  P.glow((g) => { for (const [x, y] of [[-17.6, 4.0], [-16.9, 4.0], [-13.6, 5.0], [-12.8, 5.0], [-9.35, 8.2], [-6.2, 5.0], [-5.2, 5.0], [0.0, 3.9], [4.3, 4.9], [5.3, 4.9], [9.0, 4.9], [14.2, 3.9], [18.4, 4.6], [19.2, 4.6]]) rect(g, x - 0.22, y - 0.25, 0.44, 0.55, 0.05); });
  // the big paper snowflake: silver arms, a gold inner flake, a gem
  P.layer((g) => snowflakePath(g, 0, 15.6, 4.4, 0.62), C.silver, { lip: 1, shadow: 1.3, rim: 0.4 });
  P.layer((g) => snowflakePath(g, 0, 15.6, 2.1, 0.42, Math.PI / 2 + Math.PI / 6), C.gold, { lip: 1, shadow: 1 });
  P.layer((g) => { disc(g, 0, 15.6, 0.55); }, '#c9473a', { lip: 1, shadow: 0.8 });
  // gold stars around
  const st = [[-15, 18.6, 0.7], [-11.5, 20.2, 0.45], [-17.6, 15.2, 0.4], [14.6, 18.8, 0.7], [11.2, 20.4, 0.45], [17.4, 15.0, 0.42], [-7.8, 19.8, 0.32], [8.0, 19.6, 0.32]];
  P.layer((g) => { for (const [x, y, s] of st) { starPath(g, x, y, s, s * 0.42); g.fill(); } }, C.gold, { lip: 1, shadow: 0.8 });
  // the words, printed in gold and cream ink
  P.draw((g) => {
    textAt(g, 'Merry Christmas', 0.1, 8.25, { size: 3.4, font: 'Great Vibes', color: '#6a4a14', align: 'center', alpha: 0.5 });
    textAt(g, 'Merry Christmas', 0, 8.4, { size: 3.4, font: 'Great Vibes', color: C.gold, align: 'center' });
    textAt(g, '고요한 밤, 메리 크리스마스', 0, 6.6, { size: 1.15, font: 'Gowun Batang', weight: '700', color: '#efe6cf', align: 'center', alpha: 0.95 });
  });
  P.innerShade('#05081e', { alpha: 0.4, blurPx: 24 });
}

// ---- houses (layers L2 and L3) ----------------------------------------------------------------------------------------
// h: { x, w, h, rh, roof: 'gable' | 'step' | 'steep', wall, roofC, chim: [dx, w, h] | null, win: [[dx, dy, w, h, lit]], door: [dx, w, h] | null }
function roofPoly(H, y0 = 0) {
  const { x, w, h, rh } = H, ov = 0.35, b = y0 + h;
  if (H.roof === 'step') {
    const s = [];
    const steps = 3, hw = w / 2 + 0.15;
    s.push([x - hw, b]);
    for (let i = 0; i < steps; i++) { const fx = hw * (1 - (i + 1) / (steps + 0.6)), y1 = b + rh * (i + 1) / (steps + 0.4); s.push([x - hw * (1 - i / (steps + 0.6)), y1], [x - fx, y1]); }
    s.push([x - 0.45, b + rh], [x + 0.45, b + rh]);
    for (let i = steps - 1; i >= 0; i--) { const fx = hw * (1 - (i + 1) / (steps + 0.6)), y1 = b + rh * (i + 1) / (steps + 0.4); s.push([x + fx, y1], [x + hw * (1 - i / (steps + 0.6)), y1]); }
    s.push([x + hw, b]);
    return s;
  }
  return [[x - w / 2 - ov, b], [x + w / 2 + ov, b], [x, b + rh]];
}
export function houseShape(g, H, y0 = 0) {
  rect(g, H.x - H.w / 2, y0, H.w, H.h + 0.05);
  poly(g, roofPoly(H, y0));
  if (H.chim) { const [dx, cw, ch] = H.chim; rect(g, H.x + dx - cw / 2, y0 + H.h + H.rh * 0.25, cw, H.rh * 0.75 * Math.abs(dx) / (H.w / 2) + ch); }
}
const chimTop = (H, y0 = 0) => { const [dx, cw, ch] = H.chim; return [H.x + dx, y0 + H.h + H.rh * 0.25 + H.rh * 0.75 * Math.abs(dx) / (H.w / 2) + ch, cw]; };
export function paintHouses(P, houses, y0 = 0) {
  const r = P.r;
  // walls
  P.layer((g) => { for (const H of houses) { const gr = g.createLinearGradient(H.x - H.w / 2, 0, H.x + H.w / 2, 0); gr.addColorStop(0, shade(H.wall, 0.1)); gr.addColorStop(1, shade(H.wall, -0.12)); g.fillStyle = gr; rect(g, H.x - H.w / 2, y0, H.w, H.h + 0.05); } }, '#ccc', { rim: 0.7, lip: 0.9, shade: 0.8 });
  // wall texture: timber frames on pale walls, brick courses on red, boards on blue
  P.draw((g) => {
    for (const H of houses) {
      g.save(); g.beginPath(); g.rect(H.x - H.w / 2, y0, H.w, H.h); g.clip();
      if (H.tex === 'timber') {
        g.strokeStyle = 'rgba(92,52,30,0.75)'; g.lineWidth = 0.16;
        for (const yy of [y0 + H.h * 0.48, y0 + H.h - 0.1]) { g.beginPath(); g.moveTo(H.x - H.w / 2, yy); g.lineTo(H.x + H.w / 2, yy); g.stroke(); }
        for (let xx = H.x - H.w / 2 + 0.1; xx <= H.x + H.w / 2; xx += H.w / 3) { g.beginPath(); g.moveTo(xx, y0); g.lineTo(xx, y0 + H.h); g.stroke(); }
        g.beginPath(); g.moveTo(H.x - H.w / 2, y0 + H.h * 0.48); g.lineTo(H.x - H.w / 6, y0 + H.h); g.moveTo(H.x + H.w / 2, y0 + H.h * 0.48); g.lineTo(H.x + H.w / 6, y0 + H.h); g.stroke();
      } else if (H.tex === 'brick') {
        g.strokeStyle = 'rgba(70,24,14,0.4)'; g.lineWidth = 0.05;
        for (let yy = y0 + 0.3, k = 0; yy < y0 + H.h; yy += 0.42, k++) { g.beginPath(); g.moveTo(H.x - H.w / 2, yy); g.lineTo(H.x + H.w / 2, yy); g.stroke(); for (let xx = H.x - H.w / 2 + (k % 2) * 0.45; xx < H.x + H.w / 2; xx += 0.9) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 0.42); g.stroke(); } }
      } else if (H.tex === 'boards') {
        g.strokeStyle = 'rgba(30,36,70,0.32)'; g.lineWidth = 0.06;
        for (let xx = H.x - H.w / 2 + 0.45; xx < H.x + H.w / 2; xx += 0.5) { g.beginPath(); g.moveTo(xx, y0); g.lineTo(xx, y0 + H.h); g.stroke(); }
      } else {
        g.fillStyle = 'rgba(120,90,60,0.16)'; for (let i = 0; i < 18; i++) ell(g, H.x - H.w / 2 + r() * H.w, y0 + r() * H.h, 0.25 + r() * 0.3, 0.12 + r() * 0.12);
      }
      g.restore();
    }
  });
  // chimneys, then roofs, then the snow lying on them
  P.layer((g) => { for (const H of houses) if (H.chim) { const [cx, ct, cw] = chimTop(H, y0); g.fillStyle = shade(C.wallD, -0.1); rect(g, cx - cw / 2, y0 + H.h, cw, ct - y0 - H.h); g.fillStyle = shade(C.wallD, -0.3); rect(g, cx - cw / 2 - 0.12, ct - 0.3, cw + 0.24, 0.32); } }, C.wallD, { lip: 0.8, shadow: 1 });
  P.layer((g) => { for (const H of houses) { g.fillStyle = H.roofC; poly(g, roofPoly(H, y0)); } }, '#555', { rim: 0.6, lip: 1, shadow: 1.1 });
  P.draw((g) => {   // tile rows printed on the roofs
    for (const H of houses) { g.save(); g.beginPath(); roofPoly(H, y0).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
      g.strokeStyle = 'rgba(20,14,30,0.35)'; g.lineWidth = 0.06; for (let yy = y0 + H.h + 0.35; yy < y0 + H.h + H.rh; yy += 0.38) { g.beginPath(); g.moveTo(H.x - H.w, yy); g.lineTo(H.x + H.w, yy); g.stroke(); }
      g.restore(); }
  });
  P.layer((g) => {
    for (const H of houses) {
      const R = roofPoly(H, y0), b = y0 + H.h, top = b + H.rh, cut = b + H.rh * 0.34;
      g.save(); g.beginPath(); R.forEach(([x, y], i) => (i ? g.lineTo(x, y + 0.14) : g.moveTo(x, y + 0.14))); g.closePath(); g.clip();
      g.beginPath(); g.moveTo(H.x - H.w, top + 1);
      const n = Math.round(H.w * 1.4) + 3;
      for (let i = 0; i <= n; i++) { const xx = H.x - H.w * 0.75 + (H.w * 1.5 * i) / n; g.lineTo(xx, cut - (i % 2 ? 0.26 : 0) + 0.08 * Math.sin(i * 1.7)); }
      g.lineTo(H.x + H.w, top + 1); g.closePath(); g.fill(); g.restore();
      if (H.chim) { const [cx, ct, cw] = chimTop(H, y0); ell(g, cx, ct + 0.05, cw * 0.62, 0.22); }
    }
  }, C.snow, { rim: 0.7, lip: 1, shadow: 1.2 });
  // windows: dark frames, lit panes (glow), a few dark ones; doors
  const panes = [];
  P.layer((g) => { for (const H of houses) for (const [dx, dy, ww, hh] of H.win || []) rect(g, H.x + dx - ww / 2 - 0.14, y0 + dy - 0.14, ww + 0.28, hh + 0.28, 0.08); }, C.frame, { lip: 0.6, shadow: 0.7 });
  P.layer((g) => {
    for (const H of houses) for (const [dx, dy, ww, hh, lit = 1] of H.win || []) {
      const x = H.x + dx - ww / 2, y = y0 + dy;
      if (lit) { const gr = g.createLinearGradient(0, y, 0, y + hh); gr.addColorStop(0, C.win); gr.addColorStop(1, C.winL); g.fillStyle = gr; panes.push([x, y, ww, hh]); }
      else g.fillStyle = '#5d5a7a';
      rect(g, x, y, ww, hh, 0.05);
    }
  }, C.win, { lip: 0.3, shadow: 0.6 });
  P.draw((g) => { g.strokeStyle = 'rgba(58,40,40,0.85)'; g.lineWidth = 0.09; for (const H of houses) for (const [dx, dy, ww, hh] of H.win || []) { const x = H.x + dx, y = y0 + dy; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + hh); g.moveTo(x - ww / 2, y + hh * 0.55); g.lineTo(x + ww / 2, y + hh * 0.55); g.stroke(); } });
  P.glow((g) => { for (const [x, y, w, h] of panes) rect(g, x, y, w, h, 0.05); });
  P.layer((g) => { for (const H of houses) if (H.door) { const [dx, dw, dh] = H.door; g.beginPath(); g.moveTo(H.x + dx - dw / 2, y0); g.lineTo(H.x + dx - dw / 2, y0 + dh - dw / 2); g.arc(H.x + dx, y0 + dh - dw / 2, dw / 2, Math.PI, 0, true); g.lineTo(H.x + dx + dw / 2, y0); g.closePath(); g.fill(); } }, C.door, { lip: 0.8, shadow: 0.9, rim: 0.4 });
  P.draw((g) => { for (const H of houses) if (H.door) { const [dx, dw, dh] = H.door; g.fillStyle = C.gold; disc(g, H.x + dx + dw * 0.28, y0 + dh * 0.45, 0.09); g.fillStyle = C.holly; disc(g, H.x + dx, y0 + dh + 0.05, 0.36); g.fillStyle = C.berry; disc(g, H.x + dx, y0 + dh - 0.25, 0.1); } });
  return panes;
}

// ---- L1: far snowy hills and a forest of small pines -----------------------------------------------------------------
const hillAt = (x) => 3.2 + 1.3 * Math.sin(x * 0.19 + 1.1) + 0.7 * Math.sin(x * 0.43 + 2.3) + 0.3 * Math.sin(x * 1.1);
const FAR_PINES = [[-20.6, 7.6, 3.2], [-18.4, 9.8, 3.8], [-15.6, 7.0, 3.0], [-12.8, 8.6, 3.4], [-10.2, 6.6, 2.8], [-6.5, 7.8, 3.2], [-3.6, 9.4, 3.6], [-0.8, 7.2, 3.0], [2.2, 8.8, 3.4],
  [5.0, 6.8, 2.8], [8.2, 9.6, 3.8], [11.4, 7.4, 3.0], [14.0, 8.8, 3.4], [16.8, 7.2, 3.0], [19.6, 9.2, 3.6], [21.0, 6.4, 2.6]];
export function farLayer() {
  const tiers = FAR_PINES.map(([x, h, w]) => pineTiers(x, hillAt(x) - 1.9, h + 0.6, w, 4));
  const pts = P2.fromDrawing((g) => {
    g.beginPath(); g.moveTo(-21.8, 0); for (let x = -21.8; x <= 21.8; x += 0.25) g.lineTo(x, hillAt(x)); g.lineTo(21.8, 0); g.closePath(); g.fill();
    for (const T of tiers) for (const t of T) { tierPath(g, t); g.fill(); }
  }, { w: 44.4, h: 13.4, res: 22, name: 'far' });
  const paint = (P) => {
    P.gradient(C.far, C.farL, 0);
    P.felt(0.3);
    for (let k = 0; k < 4; k++) {
      P.layer((g) => { for (const T of tiers) { g.fillStyle = k % 2 ? C.pineFar : shade(C.pineFar, -0.08); tierPath(g, T[k]); g.fill(); } }, C.pineFar, { lip: 0.7, shadow: 0.9, rim: 0.3 });
      P.layer((g) => { for (const T of tiers) snowHem(g, T[k], k); }, '#dfe6f2', { lip: 0.6, shadow: 0.6 });
    }
    P.layer((g) => { g.beginPath(); g.moveTo(-23, 0); for (let x = -23; x <= 23; x += 0.25) g.lineTo(x, hillAt(x) - 1.3 + 0.35 * Math.sin(x * 0.9)); g.lineTo(23, 0); g.closePath(); g.fill(); }, C.farL, { lip: 1, shadow: 1.1, rim: 0.6 });
    P.layer((g) => { scallopBand(g, -23, 23, -0.5, 1.2, 3.4, 0.5, 0.6); }, '#cfd8ea', { lip: 0.9, shadow: 0.9, rim: 0.5 });
    P.marks('dot', { color: '#ffffff', alpha: 0.4, size: 0.06, density: 0.4, region: { x0: -22, x1: 22, y0: 0, y1: 6 } });
    P.innerShade('#202a58', { alpha: 0.3, blurPx: 14 });
  };
  return [pts, paint];
}

// ---- L2: the village row and the church with its belfry -------------------------------------------------------------
export const CHURCH = { naveX: -8.2, naveW: 5.8, naveH: 5.6, towerX: -4.4, towerW: 2.7, towerH: 11.0, spire: 5.0, belfry: [9.2, 1.15, 1.7] };
const VILLAGE = [
  { x: -18.6, w: 5.0, h: 6.0, rh: 3.0, roof: 'gable', wall: C.wallA, roofC: C.roofB, tex: 'timber', chim: [1.3, 0.8, 1.6], win: [[-1.2, 3.6, 1.0, 1.25], [1.2, 3.6, 1.0, 1.25], [-1.2, 1.2, 1.0, 1.25, 0]], door: [1.2, 1.1, 2.0] },
  { x: -13.3, w: 4.4, h: 7.8, rh: 3.4, roof: 'step', wall: C.wallD, roofC: C.wallD, tex: 'brick', win: [[0, 5.4, 1.1, 1.3], [-1.1, 2.6, 0.9, 1.2], [1.1, 2.6, 0.9, 1.2]], door: null },
  { x: 1.6, w: 4.8, h: 6.6, rh: 3.2, roof: 'gable', wall: C.wallC, roofC: C.roofA, tex: 'boards', chim: [-1.2, 0.75, 1.4], win: [[-1.2, 3.8, 1.0, 1.3], [1.2, 3.8, 1.0, 1.3], [1.2, 1.2, 1.0, 1.3]], door: [-1.15, 1.1, 2.1] },
  { x: 6.8, w: 4.0, h: 8.8, rh: 3.6, roof: 'gable', wall: C.wallE, roofC: C.roofC, tex: 'plain', win: [[0, 6.2, 1.1, 1.3], [-0.9, 3.4, 0.9, 1.3], [0.9, 3.4, 0.9, 1.3, 0]], door: [0, 1.15, 2.2] },
  { x: 12.0, w: 5.2, h: 5.6, rh: 2.8, roof: 'gable', wall: C.wallF, roofC: C.roofB, tex: 'timber', chim: [1.4, 0.8, 1.5], win: [[-1.4, 3.0, 1.0, 1.2], [0, 3.0, 1.0, 1.2], [1.4, 3.0, 1.0, 1.2]], door: null },
  { x: 17.6, w: 5.0, h: 7.2, rh: 3.2, roof: 'step', wall: C.wallB, roofC: C.wallB, tex: 'brick', win: [[-1.2, 4.6, 0.95, 1.25], [1.2, 4.6, 0.95, 1.25], [0, 1.6, 1.4, 1.4]], door: null },
];
const BASE2 = 1.0;
const churchParts = (g) => {
  const c = CHURCH;
  rect(g, c.naveX - c.naveW / 2, 0, c.naveW, BASE2 + c.naveH);
  poly(g, [[c.naveX - c.naveW / 2 - 0.4, BASE2 + c.naveH], [c.naveX + c.naveW / 2 + 0.2, BASE2 + c.naveH], [c.naveX, BASE2 + c.naveH + 3.2]]);
  rect(g, c.towerX - c.towerW / 2, 0, c.towerW, BASE2 + c.towerH);
  poly(g, [[c.towerX - c.towerW / 2 - 0.3, BASE2 + c.towerH], [c.towerX + c.towerW / 2 + 0.3, BASE2 + c.towerH], [c.towerX + 0.12, BASE2 + c.towerH + c.spire], [c.towerX - 0.12, BASE2 + c.towerH + c.spire]]);
  rect(g, c.towerX - 0.09, BASE2 + c.towerH + c.spire - 0.2, 0.18, 1.1);
  rect(g, c.towerX - 0.42, BASE2 + c.towerH + c.spire + 0.42, 0.84, 0.18);
};
export function belfryHole() {   // an arched opening in the tower where the bell swings
  const c = CHURCH, [y, w, h] = c.belfry, x = c.towerX, pts = [[x - w / 2, BASE2 + y]];
  for (let i = 0; i <= 12; i++) { const a = Math.PI - (Math.PI * i) / 12; pts.push([x + Math.cos(a) * w / 2, BASE2 + y + h - w / 2 + Math.sin(a) * w / 2]); }
  pts.push([x + w / 2, BASE2 + y]);
  return pts;
}
export function villageLayer() {
  const houses = VILLAGE.map((H) => ({ ...H }));
  const pts = P2.fromDrawing((g) => {
    rect(g, -21.6, 0, 43.2, BASE2 + 0.4);
    for (const H of houses) houseShape(g, H, BASE2);
    churchParts(g);
  }, { w: 44, h: 18.4, res: 22, name: 'village' });
  const paint = (P) => {
    P.gradient('#c4cde2', '#dfe6f1', 0);
    P.felt(0.3);
    const c = CHURCH;
    // church: stone nave and tower
    P.layer((g) => { const gr = g.createLinearGradient(c.naveX - 3, 0, c.naveX + 3, 0); gr.addColorStop(0, '#c6c3d2'); gr.addColorStop(1, '#9e9cb4'); g.fillStyle = gr; rect(g, c.naveX - c.naveW / 2, BASE2, c.naveW, c.naveH + 0.05); }, C.stone, { rim: 0.7, lip: 1, shade: 0.8 });
    P.layer((g) => { g.fillStyle = C.roofA; poly(g, [[c.naveX - c.naveW / 2 - 0.4, BASE2 + c.naveH], [c.naveX + c.naveW / 2 + 0.2, BASE2 + c.naveH], [c.naveX, BASE2 + c.naveH + 3.2]]); }, C.roofA, { rim: 0.6, lip: 1, shadow: 1 });
    P.layer((g) => { g.save(); g.beginPath(); g.moveTo(c.naveX - c.naveW / 2 - 0.4, BASE2 + c.naveH + 0.12); g.lineTo(c.naveX + c.naveW / 2 + 0.2, BASE2 + c.naveH + 0.12); g.lineTo(c.naveX, BASE2 + c.naveH + 3.35); g.closePath(); g.clip();
      scallopBand(g, c.naveX - 4, c.naveX + 4, BASE2 + c.naveH + 4, BASE2 + c.naveH + 1.0, 0.7, -0.25); g.restore(); }, C.snow, { lip: 1, shadow: 1.1, rim: 0.6 });
    P.layer((g) => { const gr = g.createLinearGradient(c.towerX - 1.4, 0, c.towerX + 1.4, 0); gr.addColorStop(0, '#d2cfdd'); gr.addColorStop(1, '#a6a4bc'); g.fillStyle = gr; rect(g, c.towerX - c.towerW / 2, BASE2, c.towerW, c.towerH + 0.05); }, C.stone, { rim: 0.7, lip: 1, shade: 0.9, shadow: 1.2 });
    P.draw((g) => {   // stone courses
      g.strokeStyle = 'rgba(60,56,90,0.3)'; g.lineWidth = 0.05;
      for (let y = BASE2 + 0.5, k = 0; y < BASE2 + c.towerH; y += 0.55, k++) { g.beginPath(); g.moveTo(c.towerX - c.towerW / 2, y); g.lineTo(c.towerX + c.towerW / 2, y); g.stroke(); for (let x = c.towerX - c.towerW / 2 + (k % 2) * 0.45; x < c.towerX + c.towerW / 2; x += 0.9) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 0.55); g.stroke(); } }
    });
    P.layer((g) => { poly(g, [[c.towerX - c.towerW / 2 - 0.3, BASE2 + c.towerH], [c.towerX + c.towerW / 2 + 0.3, BASE2 + c.towerH], [c.towerX + 0.12, BASE2 + c.towerH + c.spire], [c.towerX - 0.12, BASE2 + c.towerH + c.spire]]); }, C.roofC, { rim: 0.6, lip: 1, shadow: 1.2 });
    P.layer((g) => { poly(g, [[c.towerX - c.towerW / 2 - 0.3, BASE2 + c.towerH], [c.towerX + c.towerW / 2 + 0.3, BASE2 + c.towerH], [c.towerX + c.towerW / 2 - 0.1, BASE2 + c.towerH + 0.45], [c.towerX - c.towerW / 2 + 0.1, BASE2 + c.towerH + 0.45]]);
      rect(g, c.towerX - 0.09, BASE2 + c.towerH + c.spire - 0.2, 0.18, 1.1); rect(g, c.towerX - 0.42, BASE2 + c.towerH + c.spire + 0.42, 0.84, 0.18); }, C.gold, { lip: 1, shadow: 1 });
    // church windows: tall arched, lit, a round rose window on the nave gable
    const cw = [[c.naveX - 1.6, BASE2 + 1.6], [c.naveX, BASE2 + 1.6], [c.naveX + 1.6, BASE2 + 1.6]];
    const arch = (g, x, y, w, h) => { g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x - w / 2, y + h - w / 2); g.arc(x, y + h - w / 2, w / 2, Math.PI, 0, true); g.lineTo(x + w / 2, y); g.closePath(); g.fill(); };
    P.layer((g) => { for (const [x, y] of cw) arch(g, x, y - 0.12, 1.12, 2.9); disc(g, c.naveX, BASE2 + c.naveH + 1.15, 0.72); arch(g, c.towerX, BASE2 + 3.0, 1.0, 2.2); }, C.frame, { lip: 0.6, shadow: 0.7 });
    P.layer((g) => { const gr = g.createLinearGradient(0, BASE2 + 1.5, 0, BASE2 + 4.4); gr.addColorStop(0, '#ffcf5e'); gr.addColorStop(1, '#ffe9a6'); g.fillStyle = gr;
      for (const [x, y] of cw) arch(g, x, y, 0.86, 2.65); disc(g, c.naveX, BASE2 + c.naveH + 1.15, 0.52); arch(g, c.towerX, BASE2 + 3.12, 0.76, 1.95); }, C.win, { lip: 0.3, shadow: 0.5 });
    P.draw((g) => { g.strokeStyle = 'rgba(70,40,40,0.8)'; g.lineWidth = 0.07; for (const [x, y] of cw) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 2.6); g.moveTo(x - 0.43, y + 1.3); g.lineTo(x + 0.43, y + 1.3); g.stroke(); }
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(c.naveX - Math.cos(a) * 0.5, BASE2 + c.naveH + 1.15 - Math.sin(a) * 0.5); g.lineTo(c.naveX + Math.cos(a) * 0.5, BASE2 + c.naveH + 1.15 + Math.sin(a) * 0.5); g.stroke(); } });
    P.glow((g) => { for (const [x, y] of cw) arch(g, x, y, 0.86, 2.65); disc(g, c.naveX, BASE2 + c.naveH + 1.15, 0.52); arch(g, c.towerX, BASE2 + 3.12, 0.76, 1.95); });
    // the belfry: a frame round the opening the bell swings in; a clock below
    P.layer((g) => { const [y, w, h] = c.belfry; g.beginPath(); g.moveTo(c.towerX - w / 2 - 0.25, BASE2 + y - 0.25); g.lineTo(c.towerX - w / 2 - 0.25, BASE2 + y + h - w / 2); g.arc(c.towerX, BASE2 + y + h - w / 2, w / 2 + 0.25, Math.PI, 0, true); g.lineTo(c.towerX + w / 2 + 0.25, BASE2 + y - 0.25); g.closePath(); g.fill(); }, '#6f6a8a', { lip: 0.8, shadow: 0.8 });
    P.layer((g) => { disc(g, c.towerX, BASE2 + 7.4, 0.62); }, C.white, { lip: 0.8, shadow: 0.9, rim: 0.5 });
    P.draw((g) => { g.strokeStyle = C.ink; g.lineWidth = 0.08; g.lineCap = 'round'; g.beginPath(); g.moveTo(c.towerX, BASE2 + 7.4); g.lineTo(c.towerX, BASE2 + 7.85); g.moveTo(c.towerX, BASE2 + 7.4); g.lineTo(c.towerX + 0.3, BASE2 + 7.25); g.stroke();
      g.fillStyle = C.ink; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; disc(g, c.towerX + Math.cos(a) * 0.48, BASE2 + 7.4 + Math.sin(a) * 0.48, 0.035); } });
    // the houses
    paintHouses(P, houses, BASE2);
    // snow in the street at the foot, lumpy
    P.layer((g) => { scallopBand(g, -23, 23, -0.5, BASE2 + 0.25, 2.0, 0.45, 0.1); }, C.snowM, { lip: 1, shadow: 1.2, rim: 0.6 });
    P.innerShade('#283063', { alpha: 0.3, blurPx: 14 });
  };
  return [pts, paint, houses];
}

// ---- L3: the town Christmas tree, lamp posts, small houses ----------------------------------------------------------
export const TREE = { x: -1.2, base: 1.3, h: 10.0, w: 8.6 };
export const LAMPS = [-8.4, 5.8];
const SMALL = [
  { x: 12.4, w: 4.4, h: 4.6, rh: 2.6, roof: 'gable', wall: C.wallE, roofC: C.roofC, tex: 'plain', chim: [-1.1, 0.7, 1.2], win: [[-1.0, 2.2, 1.0, 1.2], [1.0, 2.2, 1.0, 1.2]], door: null },
  { x: 18.2, w: 5.0, h: 5.9, rh: 3.0, roof: 'gable', wall: C.wallA, roofC: C.roofA, tex: 'timber', win: [[-1.2, 3.4, 1.0, 1.25], [1.2, 3.4, 1.0, 1.25]], door: [0, 1.1, 2.1] },
];
const SIDE_PINES = [[-18.6, 1.0, 7.6, 3.8], [-14.0, 1.0, 5.6, 3.0]];
function treeTiers() { const { x, base, h, w } = TREE; return pineTiers(x, base - 0.6, h + 0.6, w, 5); }
export function townLayer() {
  const tiers = treeTiers(), side = SIDE_PINES.map(([x, b, h, w]) => pineTiers(x, b - 0.5, h, w, 4)), houses = SMALL.map((H) => ({ ...H }));
  const pts = P2.fromDrawing((g) => {
    rect(g, -21.6, 0, 43.2, 1.7);
    for (const t of tiers) { tierPath(g, t); g.fill(); }
    rect(g, TREE.x - 0.5, 0.5, 1.0, 1.6);
    for (const T of side) for (const t of T) { tierPath(g, t); g.fill(); }
    for (const x of LAMPS) { rect(g, x - 0.2, 0, 0.4, 6.6); rect(g, x - 0.75, 6.3, 1.5, 1.6, 0.3); poly(g, [[x - 0.95, 7.85], [x + 0.95, 7.85], [x, 8.7]]); }
    for (const H of houses) houseShape(g, H, 1.0);
  }, { w: 44, h: 13.2, res: 24, name: 'town' });
  const paint = (P) => {
    const r = P.r;
    P.gradient('#cfd7e8', '#e6ebf4', 0);
    P.felt(0.3);
    paintHouses(P, houses, 1.0);
    // side pines
    for (let k = 0; k < 4; k++) {
      P.layer((g) => { for (const T of side) { g.fillStyle = k % 2 ? C.pine : C.pineL; tierPath(g, T[k]); g.fill(); } }, C.pine, { lip: 0.8, shadow: 1, rim: 0.3 });
      P.layer((g) => { for (const T of side) snowHem(g, T[k], k); }, C.snow, { lip: 0.7, shadow: 0.7 });
    }
    // lamp posts: iron, a lit lantern head
    P.layer((g) => { for (const x of LAMPS) { rect(g, x - 0.2, 0, 0.4, 6.6); rect(g, x - 0.38, 0, 0.76, 0.6, 0.1); rect(g, x - 0.75, 6.3, 1.5, 1.6, 0.3); poly(g, [[x - 0.95, 7.85], [x + 0.95, 7.85], [x, 8.7]]); } }, '#2b2a40', { lip: 0.9, shadow: 1.1, rim: 0.3 });
    P.layer((g) => { for (const x of LAMPS) rect(g, x - 0.5, 6.5, 1.0, 1.2, 0.15); }, '#ffd977', { lip: 0.3, shadow: 0.5 });
    P.glow((g) => { for (const x of LAMPS) rect(g, x - 0.5, 6.5, 1.0, 1.2, 0.15); });
    P.layer((g) => { for (const x of LAMPS) { ell(g, x, 7.95, 0.95, 0.2); } }, C.snow, { lip: 0.6, shadow: 0.8 });
    // wreath bows on the posts
    P.layer((g) => { for (const x of LAMPS) { g.fillStyle = C.holly; disc(g, x, 4.4, 0.55); } }, C.holly, { lip: 0.8, shadow: 0.9 });
    P.layer((g) => { for (const x of LAMPS) { poly(g, [[x, 4.0], [x - 0.6, 3.6], [x - 0.5, 4.2]]); poly(g, [[x, 4.0], [x + 0.6, 3.6], [x + 0.5, 4.2]]); disc(g, x, 4.0, 0.16); } }, C.red, { lip: 0.8, shadow: 0.7 });
    // the tree: trunk, five tiers bottom up, each with its own snow and lights
    P.layer((g) => rect(g, TREE.x - 0.5, 0.5, 1.0, 1.6), C.brownD, { lip: 0.8, shadow: 0.8 });
    for (let k = 0; k < 5; k++) {
      P.layer((g) => { const T = tiers[k], gr = g.createLinearGradient(T.x - T.hw, 0, T.x + T.hw, 0); gr.addColorStop(0, shade(C.pineL, 0.12)); gr.addColorStop(1, shade(C.pine, -0.1)); g.fillStyle = gr; tierPath(g, T); g.fill(); }, C.pine, { lip: 1, shadow: 1.3, rim: 0.4 });
      P.layer((g) => snowHem(g, tiers[k], k * 1.3), C.snow, { lip: 0.8, shadow: 0.8 });
    }
    // garland swags (gold paper strips) and baubles
    P.layer((g) => {
      for (let k = 0; k < 4; k++) {
        const T = tiers[k], y = T.yb + (T.yt - T.yb) * 0.42, hw = T.hw * 0.78;
        g.beginPath(); g.moveTo(T.x - hw, y + 0.5); g.quadraticCurveTo(T.x, y - 0.65, T.x + hw, y + 0.5); g.lineTo(T.x + hw, y + 0.78); g.quadraticCurveTo(T.x, y - 0.35, T.x - hw, y + 0.78); g.closePath(); g.fill();
      }
    }, C.gold, { lip: 1, shadow: 1 });
    const baubles = [];
    for (let k = 0; k < 5; k++) { const T = tiers[k], n = 4 - Math.floor(k / 2); for (let i = 0; i < n; i++) { const u = (i + 0.5) / n - 0.5; baubles.push([T.x + u * T.hw * 1.5, T.yb + 0.55 + (T.yt - T.yb) * (0.05 + 0.25 * (1 - Math.abs(u) * 2)), [C.red, C.goldL, '#d8dcef', '#c94a8a'][(i + k) % 4]]); } }
    P.layer((g) => { for (const [x, y, col] of baubles) { g.fillStyle = col; disc(g, x, y, 0.3); } }, C.red, { lip: 1, shadow: 1 });
    P.draw((g) => { g.fillStyle = 'rgba(255,255,255,0.6)'; for (const [x, y] of baubles) disc(g, x - 0.1, y + 0.1, 0.08); });
    const bulbs = [];
    for (let k = 0; k < 5; k++) { const T = tiers[k]; for (let i = 0; i < 6; i++) bulbs.push([T.x + (r() - 0.5) * T.hw * 1.4, T.yb + 0.3 + r() * (T.yt - T.yb) * 0.5]); }
    P.draw((g) => { g.fillStyle = '#ffe9a0'; for (const [x, y] of bulbs) disc(g, x, y, 0.11); });
    P.glow((g) => { for (const [x, y] of bulbs) disc(g, x, y, 0.13); for (const [x, y, col] of baubles) if (col === C.goldL) disc(g, x, y, 0.2); });
    // gifts under the tree
    const gifts = [[TREE.x - 2.7, 1.2, 1.5, 1.2, C.red, C.gold], [TREE.x + 2.4, 1.2, 1.7, 1.0, '#3d6fa8', C.snow], [TREE.x - 1.1, 1.2, 1.1, 0.9, C.gold, C.red]];
    P.layer((g) => { for (const [x, y, w, h, col] of gifts) { g.fillStyle = col; rect(g, x - w / 2, y, w, h, 0.06); } }, C.red, { lip: 1, shadow: 1.1, rim: 0.5 });
    P.layer((g) => { for (const [x, y, w, h, , rib] of gifts) { g.fillStyle = rib; rect(g, x - 0.12, y, 0.24, h); rect(g, x - w / 2, y + h * 0.45, w, 0.22); ell(g, x - 0.25, y + h + 0.1, 0.28, 0.15, 0.4); ell(g, x + 0.25, y + h + 0.1, 0.28, 0.15, -0.4); } }, C.gold, { lip: 0.8, shadow: 0.7 });
    // the snowy square at the foot
    P.layer((g) => { scallopBand(g, -23, 23, -0.5, 1.15, 2.6, 0.5, 0.4); }, C.snow, { lip: 1, shadow: 1.3, rim: 0.6 });
    P.marks('dot', { color: '#ffffff', alpha: 0.5, size: 0.05, density: 0.3, region: { x0: -22, x1: 22, y0: 0, y1: 1.6 } });
    P.innerShade('#2c3460', { alpha: 0.28, blurPx: 14 });
  };
  return [pts, paint];
}

// ---- L4: the snowbank, snowy bushes, a fence, small pines ------------------------------------------------------------
const L4_PINES = [[-20.4, 0.8, 6.4, 3.0], [20.2, 0.8, 5.8, 2.8]];
const BUSHES4 = [[-18.6, 1.0, 3.6, 2.9], [-6.6, 0.9, 2.8, 2.3], [18.2, 1.0, 3.2, 2.6]];
function bushPath(g, x, y0, w, h, ph = 0) {   // a lobed mound on a flat foot
  g.beginPath(); g.moveTo(x - w / 2, y0);
  for (let i = 0; i <= 36; i++) { const a = Math.PI - (Math.PI * i) / 36, rr = 1 - 0.08 * (1 - Math.abs(Math.sin(a * 3.5 + ph))); g.lineTo(x + Math.cos(a) * w / 2 * rr, y0 + Math.sin(a) * h * rr); }
  g.lineTo(x + w / 2, y0); g.closePath();
}
function paintBushes(P, list, seed = 1) {
  const r = rng(seed);
  P.layer((g) => { for (const [x, y, w, h] of list) { g.fillStyle = C.pine; bushPath(g, x, y, w, h, x); g.fill(); } }, C.pine, { lip: 1, shadow: 1.2, rim: 0.3 });
  P.layer((g) => { for (const [x, y, w, h] of list) { g.fillStyle = C.pineL; bushPath(g, x + w * 0.06, y, w * 0.72, h * 0.78, x + 1); g.fill(); } }, C.pineL, { lip: 0.9, shadow: 0.9 });
  P.layer((g) => { for (const [x, y, w, h] of list) { g.save(); bushPath(g, x, y, w, h, x); g.clip(); scallopBand(g, x - w, x + w, y + h + 1, y + h * 0.68, w / 4.5, -0.28, 0.3); g.restore(); } }, C.snow, { lip: 1, shadow: 1.1, rim: 0.5 });
  P.layer((g) => { for (const [x, y, w, h] of list) for (let i = 0; i < 6; i++) disc(g, x + (r() - 0.5) * w * 0.7, y + h * (0.22 + 0.4 * r()), 0.15 + 0.05 * r()); }, C.berry, { lip: 1, shadow: 0.8 });
}
export function bankLayer() {
  const side = L4_PINES.map(([x, b, h, w]) => pineTiers(x, b - 0.5, h, w, 4));
  const bank = (x) => 1.55 + 0.6 * Math.sin(x * 0.37 + 0.6) + 0.3 * Math.sin(x * 1.1 + 1.4);
  const pts = P2.fromDrawing((g) => {
    g.beginPath(); g.moveTo(-21.8, 0); for (let x = -21.8; x <= 21.8; x += 0.2) g.lineTo(x, bank(x)); g.lineTo(21.8, 0); g.closePath(); g.fill();
    for (const T of side) for (const t of T) { tierPath(g, t); g.fill(); }
    for (const [x, y, w, h] of BUSHES4) { bushPath(g, x, y, w, h, x); g.fill(); }
    for (let x = -12.2; x <= -8.6; x += 1.2) rect(g, x - 0.18, 0.5, 0.36, 3.4, 0.08);
    rect(g, -12.5, 2.3, 4.2, 0.32); rect(g, -12.5, 3.2, 4.2, 0.32);
  }, { w: 44, h: 8.0, res: 26, name: 'bank' });
  const paint = (P) => {
    P.gradient('#dce3ef', '#eef2f8', 0);
    P.felt(0.3);
    P.layer((g) => { for (let x = -12.2; x <= -8.6; x += 1.2) { rect(g, x - 0.18, 0.5, 0.36, 3.4, 0.08); } rect(g, -12.5, 2.3, 4.2, 0.32); rect(g, -12.5, 3.2, 4.2, 0.32); }, C.wood, { lip: 1, shadow: 1.1 });
    P.layer((g) => { for (let x = -12.2; x <= -8.6; x += 1.2) ell(g, x, 3.95, 0.3, 0.14); ell(g, -10.4, 3.55, 2.0, 0.1); }, C.snow, { lip: 0.6, shadow: 0.6 });
    for (let k = 0; k < 4; k++) {
      P.layer((g) => { for (const T of side) { g.fillStyle = k % 2 ? C.pine : C.pineL; tierPath(g, T[k]); g.fill(); } }, C.pine, { lip: 0.9, shadow: 1.1, rim: 0.3 });
      P.layer((g) => { for (const T of side) snowHem(g, T[k], k + 2); }, C.snow, { lip: 0.7, shadow: 0.7 });
    }
    paintBushes(P, BUSHES4, 5);
    P.layer((g) => { g.beginPath(); g.moveTo(-23, -1); for (let x = -23; x <= 23; x += 0.2) g.lineTo(x, bank(x) - 0.02); g.lineTo(23, -1); g.closePath(); g.fill(); }, C.snow, { lip: 1, shadow: 1.2, rim: 0.7 });
    P.layer((g) => { scallopBand(g, -23, 23, -0.5, 0.75, 2.9, 0.4, 0.7); }, '#dbe2ef', { lip: 0.9, shadow: 0.9 });
    P.draw((g) => { g.fillStyle = 'rgba(120,136,186,0.35)'; for (let x = -20; x < 20; x += 1.7) { ell(g, x, 1.0 + 0.25 * Math.sin(x), 0.16, 0.1, 0.4); ell(g, x + 0.5, 1.25 + 0.25 * Math.sin(x), 0.16, 0.1, 0.4); } });
    P.innerShade('#34406e', { alpha: 0.25, blurPx: 12 });
  };
  return [pts, paint];
}

// ---- L5: the front drift: holly, glowing lanterns, a rabbit, candy canes -----------------------------------------------
const HOLLY_X5 = [-18.0, -1.0, 9.6, 19.6];
const LANTERNS5 = [-13.8, 14.2];
const CANES5 = [[-7.6, 1], [4.6, -1]];
const RABBIT_X5 = -4.2;
function canePts(x, dir) {   // a J of candy: the stem, then the hook, as one outline
  const pts = [], w = 0.17, path = [];
  for (let i = 0; i <= 10; i++) path.push([x, 0.2 + 2.6 * i / 10]);
  for (let i = 1; i <= 12; i++) { const a = Math.PI * i / 12; path.push([x + dir * (0.45 - Math.cos(a) * 0.45), 2.8 + Math.sin(a) * 0.5]); }
  const n = path.length, L = [], Rr = [];
  for (let i = 0; i < n; i++) {
    const [ax, ay] = path[Math.max(0, i - 1)], [bx, by] = path[Math.min(n - 1, i + 1)], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
    L.push([path[i][0] - dy / l * w, path[i][1] + dx / l * w]); Rr.push([path[i][0] + dy / l * w, path[i][1] - dx / l * w]);
  }
  return { outline: [...L, ...Rr.reverse()], path };
}
function lanternShape(g, x) {
  rect(g, x - 0.7, 0.3, 1.4, 0.25, 0.05); rect(g, x - 0.58, 0.5, 1.16, 1.6, 0.08);
  poly(g, [[x - 0.85, 2.05], [x + 0.85, 2.05], [x, 2.75]]); g.beginPath(); g.arc(x, 2.9, 0.2, 0, Math.PI * 2); g.fill();
}
function rabbitShape(g, x, y, ink = null) {
  const c = (col) => { if (ink) g.fillStyle = col; };
  c('#e7e4ee'); ell(g, x, y + 0.75, 0.95, 0.72); ell(g, x + 0.7, y + 1.45, 0.5, 0.46);
  ell(g, x + 0.5, y + 2.25, 0.16, 0.55, 0.25); ell(g, x + 0.85, y + 2.25, 0.16, 0.55, -0.2);
  c('#f5f3f8'); ell(g, x - 0.9, y + 0.85, 0.24, 0.22);
}
export function driftLayer() {
  const top = (x) => 1.7 + 0.6 * Math.sin(x * 0.33 + 0.4) + 0.3 * Math.sin(x * 0.9 + 1.9);
  const canes = CANES5.map(([x, d]) => canePts(x, d));
  const HOLLY5 = HOLLY_X5.map((x) => [x, top(x) + 0.05]), RABBIT5 = [RABBIT_X5, top(RABBIT_X5) - 0.3];
  const pts = P2.fromDrawing((g) => {
    g.beginPath(); g.moveTo(-21.8, 0); for (let x = -21.8; x <= 21.8; x += 0.2) g.lineTo(x, top(x)); g.lineTo(21.8, 0); g.closePath(); g.fill();
    for (const [x, y] of HOLLY5) for (const a of [0.5, 1.2, 2.0, 2.6]) fillLeaf(g, x, y - 0.3, 1.25, a, 0.34);
    for (const x of LANTERNS5) lanternShape(g, x);
    for (const c of canes) poly(g, c.outline);
    rabbitShape(g, ...RABBIT5);
  }, { w: 44, h: 4.0, res: 30, name: 'drift' });
  const paint = (P) => {
    P.gradient('#e1e7f2', '#f2f5fa', 0);
    P.felt(0.3);
    // candy canes: white sticks with red stripes
    P.layer((g) => { for (const c of canes) poly(g, c.outline); }, '#f7f2ea', { lip: 1, shadow: 1.1 });
    P.layer((g) => { for (const c of canes) { g.save(); g.beginPath(); c.outline.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
      for (let i = 1; i < c.path.length; i += 2) { const [x, y] = c.path[i]; g.save(); g.translate(x, y); g.rotate(0.7); g.fillRect(-0.5, -0.07, 1.0, 0.14); g.restore(); } g.restore(); } }, C.red, { lip: 0.4, shadow: 0.4 });
    // lanterns: iron frame, a lit pane, a snowy roof
    P.layer((g) => { for (const x of LANTERNS5) lanternShape(g, x); }, '#2b2a40', { lip: 1, shadow: 1.2, rim: 0.3 });
    P.layer((g) => { for (const x of LANTERNS5) { const gr = g.createLinearGradient(0, 0.65, 0, 1.95); gr.addColorStop(0, '#ffc85a'); gr.addColorStop(1, '#fff0b4'); g.fillStyle = gr; rect(g, x - 0.42, 0.65, 0.84, 1.3, 0.06); } }, C.win, { lip: 0.2, shadow: 0.4 });
    P.draw((g) => { g.fillStyle = '#ff9d3a'; for (const x of LANTERNS5) { ell(g, x, 1.15, 0.12, 0.22); } g.strokeStyle = 'rgba(43,42,64,0.9)'; g.lineWidth = 0.08; for (const x of LANTERNS5) { g.beginPath(); g.moveTo(x, 0.65); g.lineTo(x, 1.95); g.stroke(); } });
    P.glow((g) => { for (const x of LANTERNS5) rect(g, x - 0.42, 0.65, 0.84, 1.3, 0.06); });
    P.layer((g) => { for (const x of LANTERNS5) ell(g, x, 2.18, 0.8, 0.2); }, C.snow, { lip: 0.7, shadow: 0.8 });
    // the rabbit
    P.layer((g) => rabbitShape(g, ...RABBIT5, true), '#e7e4ee', { lip: 1, shadow: 1.2, rim: 0.4 });
    P.draw((g) => { const [x, y] = RABBIT5; g.fillStyle = '#e9a7b4'; ell(g, x + 0.5, y + 2.25, 0.07, 0.38, 0.25); ell(g, x + 0.85, y + 2.25, 0.07, 0.38, -0.2); g.fillStyle = C.ink; disc(g, x + 0.92, y + 1.55, 0.07); g.fillStyle = '#d9849a'; disc(g, x + 1.17, y + 1.42, 0.05); });
    // holly
    P.layer((g) => { for (const [x, y] of HOLLY5) for (const a of [0.5, 1.2, 2.0, 2.6]) { g.fillStyle = a > 1.5 ? C.holly : C.hollyL; fillLeaf(g, x, y - 0.3, 1.25, a, 0.34); } }, C.holly, { lip: 1, shadow: 1.1 });
    P.draw((g) => { g.strokeStyle = 'rgba(200,230,200,0.45)'; g.lineWidth = 0.05; for (const [x, y] of HOLLY5) for (const a of [0.5, 1.2, 2.0, 2.6]) { g.beginPath(); g.moveTo(x, y - 0.3); g.lineTo(x + Math.cos(a) * 1.0, y - 0.3 + Math.sin(a) * 1.0); g.stroke(); } });
    P.layer((g) => { for (const [x, y] of HOLLY5) { disc(g, x - 0.18, y - 0.2, 0.22); disc(g, x + 0.2, y - 0.18, 0.22); disc(g, x, y + 0.08, 0.22); } }, C.berry, { lip: 1, shadow: 0.9 });
    // the drift itself in front of everything
    P.layer((g) => { g.beginPath(); g.moveTo(-23, -1); for (let x = -23; x <= 23; x += 0.2) g.lineTo(x, top(x) - 0.75 + 0.22 * Math.sin(x * 2.1)); g.lineTo(23, -1); g.closePath(); g.fill(); }, C.snow, { lip: 1, shadow: 1.2, rim: 0.7 });
    P.layer((g) => { scallopBand(g, -23, 23, -0.5, 0.45, 3.3, 0.35, 0.2); }, '#e3e9f3', { lip: 0.8, shadow: 0.8 });
    P.marks('dot', { color: '#ffffff', alpha: 0.6, size: 0.06, density: 0.35, region: { x0: -22, x1: 22, y0: 0, y1: 2.4 } });
    P.innerShade('#3a4678', { alpha: 0.22, blurPx: 10 });
  };
  return [pts, paint];
}

// ---- moving pieces -----------------------------------------------------------------------------------------------------
/** Santa's sleigh and two reindeer, one connected cut (the reins join them). Faces +x; the slot tab sits at (0, 0). */
export function sleighPiece() {
  const D = P2.draw2;
  const piece = P2.drawnPiece((g, ink) => {
    g.translate(-1.8, 0);
    // reins and harness first (behind)
    g.fillStyle = ink(C.goldD); poly(g, [[0.6, 2.25], [5.7, 3.0], [5.7, 3.2], [0.6, 2.5]]); poly(g, [[3.0, 2.55], [6.2, 2.75], [6.2, 2.95], [3.0, 2.8]]);
    // reindeer (back one, then front one), flying pose
    for (const [x, k] of [[3.7, 0.92], [6.4, 1]]) {
      const y = 2.5;
      g.fillStyle = ink(shade(C.brown, k < 1 ? -0.12 : 0));
      fillLimb(g, x - 0.7, y - 0.25, x - 1.3, y - 0.6, x - 1.75, y - 0.4, 0.34, 0.22);   // hind legs stretched back
      fillLimb(g, x - 0.4, y - 0.35, x - 0.6, y - 0.95, x - 0.95, y - 1.05, 0.3, 0.2);
      fillLimb(g, x + 0.55, y - 0.3, x + 0.95, y - 0.75, x + 1.35, y - 0.55, 0.3, 0.2);  // fore legs tucked forward
      fillLimb(g, x + 0.75, y - 0.2, x + 1.2, y - 0.35, x + 1.5, y - 0.12, 0.28, 0.18);
      D.ell(g, x, y, 1.05 * k, 0.55 * k, 0.08);
      fillLimb(g, x + 0.7, y + 0.15, x + 1.0, y + 0.65, x + 1.15, y + 1.0, 0.45, 0.36); // neck
      D.ell(g, x + 1.45, y + 1.05, 0.45, 0.3, -0.25);                                      // head
      g.fillStyle = ink(C.brownL); D.ell(g, x - 0.95, y + 0.15, 0.2, 0.14);               // tail tuft
      g.fillStyle = ink(C.brownD);                                                         // antlers
      fillLimb(g, x + 1.25, y + 1.25, x + 1.1, y + 1.7, x + 0.8, y + 2.05, 0.14, 0.1);
      fillLimb(g, x + 1.12, y + 1.62, x + 1.35, y + 1.85, x + 1.45, y + 2.1, 0.11, 0.08);
      fillLimb(g, x + 1.0, y + 1.85, x + 0.75, y + 1.95, x + 0.55, y + 1.85, 0.1, 0.07);
      g.fillStyle = ink(C.red); D.ell(g, x + 0.62, y + 0.5, 0.2, 0.32, 0.5);             // a red collar
      g.fillStyle = ink(C.goldL); D.ell(g, x + 0.66, y + 0.32, 0.12, 0.12);               // a bell on it
      g.fillStyle = ink(C.ink, 'print'); D.ell(g, x + 1.58, y + 1.15, 0.06, 0.06); D.ell(g, x + 1.87, y + 0.98, 0.07, 0.06);
    }
    // the sack behind Santa
    g.fillStyle = ink('#9a6a42'); D.ell(g, -2.75, 2.45, 1.05, 1.15, -0.2); D.ell(g, -2.3, 3.35, 0.5, 0.35, 0.3);
    g.fillStyle = ink(C.red); D.rect(g, -3.0, 2.8, 0.5, 0.5, 0.1); g.fillStyle = ink(C.gold); D.rect(g, -2.95, 2.95, 0.4, 0.12);
    // Santa
    g.fillStyle = ink(C.red); D.ell(g, -1.15, 2.55, 0.92, 1.0);
    g.fillStyle = ink(C.white); D.rect(g, -1.35, 1.55, 0.36, 1.9, 0.12);
    fillLimb(g, -0.6, 2.85, -0.1, 2.6, 0.45, 2.45, 0.42, 0.34);                            // arm holding the reins
    g.fillStyle = ink(C.white); D.ell(g, 0.5, 2.42, 0.22, 0.2);
    g.fillStyle = ink(C.skin); D.ell(g, -1.0, 3.7, 0.46, 0.44);
    g.fillStyle = ink(C.white); D.ell(g, -0.95, 3.32, 0.55, 0.42); D.ell(g, -0.6, 3.55, 0.2, 0.12);
    g.fillStyle = ink(C.red); D.poly(g, [[-1.5, 3.95], [-0.45, 4.05], [-1.35, 4.95], [-1.95, 4.7]]);
    g.fillStyle = ink(C.white); D.rect(g, -1.6, 3.85, 1.25, 0.3, 0.14); D.ell(g, -2.0, 4.72, 0.22, 0.22);
    g.fillStyle = ink(C.ink, 'print'); D.ell(g, -0.78, 3.82, 0.06, 0.07);
    g.fillStyle = ink('#e59b8a', 'print'); D.ell(g, -0.62, 3.62, 0.1, 0.08);
    // the sleigh: body with a high curled back, a gold band, runners with a front curl
    g.fillStyle = ink(C.redD); D.poly(g, [[-4.0, 0.75], [1.1, 0.75], [1.6, 1.3], [1.6, 2.15], [0.9, 2.05], [0.4, 1.7], [-1.6, 1.85], [-3.4, 2.25], [-4.3, 3.0], [-4.75, 2.5], [-4.5, 1.4]]);
    g.fillStyle = ink(C.red); D.poly(g, [[-3.8, 0.95], [0.9, 0.95], [1.35, 1.4], [1.35, 1.9], [0.85, 1.8], [0.3, 1.5], [-1.6, 1.62], [-3.3, 1.95], [-4.1, 2.55], [-4.4, 2.3], [-4.2, 1.45]]);
    g.fillStyle = ink(C.gold); D.poly(g, [[-4.15, 1.2], [1.2, 1.2], [1.3, 1.42], [-4.25, 1.45]]);
    g.fillStyle = ink(C.gold);
    fillLimb(g, -4.2, 0.18, -1.5, 0.05, 1.4, 0.2, 0.22, 0.22);
    fillLimb(g, 1.4, 0.2, 2.3, 0.3, 2.2, 0.85, 0.22, 0.16);
    D.rect(g, -3.3, 0.15, 0.22, 0.75); D.rect(g, -0.5, 0.15, 0.22, 0.75);
    g.fillStyle = ink(C.goldL, 'print'); for (let i = 0; i < 5; i++) D.ell(g, -3.6 + i * 1.05, 1.32, 0.09, 0.07);
  }, { w: 14, h: 5.4, res: 64, name: 'sleigh', layer: { depth: 0.7 } });
  piece.pivot = [-3.0, 0.35];
  return piece;
}
/** The church bell: a gold bell with a crown loop; it swings on a pin at (0, 0). */
export function bellPiece() {
  const D = P2.draw2;
  const piece = P2.drawnPiece((g, ink) => {
    g.translate(0, 1.6);
    g.fillStyle = ink(C.goldD); D.rect(g, -0.12, -0.3, 0.24, 0.5, 0.08);
    g.fillStyle = ink(C.gold);
    g.beginPath(); g.moveTo(-0.62, -1.25); g.quadraticCurveTo(-0.55, -0.35, -0.3, -0.25); g.quadraticCurveTo(0, -0.12, 0.3, -0.25); g.quadraticCurveTo(0.55, -0.35, 0.62, -1.25); g.quadraticCurveTo(0, -1.45, -0.62, -1.25); g.fill();
    g.fillStyle = ink(C.goldL); D.ell(g, 0, -1.25, 0.66, 0.14);
    g.fillStyle = ink(C.goldD); D.ell(g, 0, -1.42, 0.16, 0.16);
  }, { w: 1.6, h: 1.9, res: 140, name: 'bell', layer: { depth: 0.4 } });
  piece.pivot = [0, 1.7];
  return piece;
}
/** The star on the town tree: an eight-point gold star with an inner star, spinning on a pin at its centre. */
export function starSpinner() {
  const piece = P2.drawnPiece((g, ink) => {
    g.translate(0, 1.4);
    g.fillStyle = ink(C.goldD); starPath(g, 0, 0, 1.25, 0.55, 8, Math.PI / 2); g.fill();
    g.fillStyle = ink(C.gold); starPath(g, 0, 0, 1.05, 0.42, 4, Math.PI / 2); g.fill(); starPath(g, 0, 0, 0.85, 0.36, 4, Math.PI / 4 + Math.PI / 2); g.fill();
    g.fillStyle = ink(C.goldL); starPath(g, 0, 0, 0.5, 0.22, 5); g.fill();
    g.fillStyle = ink('#fff4cc'); P2.draw2.ell(g, 0, 0, 0.13, 0.13);
  }, { w: 2.8, h: 2.8, res: 120, name: 'star', finish: false, layer: { depth: 0.45 } });
  piece.pivot = [0, 1.4];
  return piece;
}
/** The snowman, a card glued in front of the bank (its own print). */
export function snowmanPiece() {
  const D = P2.draw2;
  return P2.drawnPiece((g, ink) => {
    g.fillStyle = ink(C.snowM); D.ell(g, 0, 1.9, 2.0, 1.85);
    g.fillStyle = ink(C.snow); D.ell(g, 0, 4.85, 1.45, 1.35);
    g.fillStyle = ink(C.red); D.poly(g, [[-1.25, 3.55], [1.25, 3.55], [1.3, 3.95], [-1.3, 3.95]]); D.poly(g, [[0.55, 3.6], [1.1, 3.65], [1.45, 2.3], [0.85, 2.3]]);
    g.fillStyle = ink(C.snow); D.ell(g, 0, 6.85, 1.0, 0.95);
    g.fillStyle = ink(C.ink); D.rect(g, -0.85, 7.55, 1.7, 0.22, 0.08); D.rect(g, -0.6, 7.7, 1.2, 1.15, 0.1);
    g.fillStyle = ink(C.red); D.rect(g, -0.6, 7.85, 1.2, 0.24);
    g.fillStyle = ink(C.holly); fillLeaf(g, 0.35, 8.15, 0.5, 0.6, 0.35); fillLeaf(g, 0.35, 8.15, 0.5, 2.0, 0.35);
    g.fillStyle = ink('#e07a2a'); D.poly(g, [[0.1, 6.85], [0.1, 6.6], [1.1, 6.62]]);
    g.fillStyle = ink(C.ink, 'print'); D.ell(g, -0.35, 7.12, 0.1, 0.11); D.ell(g, 0.35, 7.12, 0.1, 0.11);
    for (const a of [-0.9, -0.5, 0, 0.5, 0.9]) D.ell(g, Math.sin(a) * 0.55, 6.5 - Math.cos(a) * 0.22, 0.065, 0.065);
    for (const y of [5.4, 4.8, 4.2]) D.ell(g, 0, y, 0.12, 0.12);
    g.fillStyle = ink('#f0a6a0', 'print'); D.ell(g, -0.6, 6.7, 0.16, 0.1); D.ell(g, 0.62, 6.7, 0.16, 0.1);
  }, { w: 4.4, h: 9.2, res: 70, name: 'snowman', layer: { depth: 0.8 } });
}
/** The snowman's twig arm with a red mitten, on a brad at (0, 0). */
export function armPiece() {
  const piece = P2.drawnPiece((g, ink) => {
    g.translate(0, 0.3);
    g.fillStyle = ink(C.brownD);
    fillLimb(g, 0, 0, 1.0, 0.25, 2.1, 0.75, 0.24, 0.15);
    fillLimb(g, 1.3, 0.38, 1.55, 0.85, 1.6, 1.1, 0.12, 0.08);
    g.fillStyle = ink(C.red); P2.draw2.ell(g, 2.3, 0.88, 0.36, 0.3, 0.6); P2.draw2.ell(g, 2.25, 1.15, 0.12, 0.2, 0.3);
    g.fillStyle = ink(C.brownD); P2.draw2.ell(g, 0, 0, 0.16, 0.16);
  }, { w: 5.6, h: 2.0, res: 110, name: 'arm', layer: { depth: 0.5 } });
  piece.pivot = [0, 0.3];
  return piece;
}
/** The message board: a wooden frame on two posts, a cream note pinned in it, snow on top, holly in the corner. */
export const SIGN = { w: 15.6, h: 7.7, y0: 0.75, post: 5.6 };
export function signPiece(m, wrapLines) {
  const { w, h, y0, post } = SIGN, D = P2.draw2;
  const pts = P2.fromDrawing((g) => {
    for (const x of [-post, post]) D.rect(g, x - 0.35, 0, 0.7, y0 + 1, 0.1);
    D.rect(g, -w / 2, y0, w, h, 0.45);
    for (let i = 0; i < 9; i++) D.ell(g, -w / 2 + 0.8 + i * (w - 1.6) / 8, y0 + h + 0.05, 1.0, 0.32 + 0.12 * Math.sin(i * 1.9));
    for (const a of [0.6, 1.4, 2.3]) fillLeaf(g, -w / 2 + 0.9, y0 + h - 0.5, 1.4, a, 0.34);
  }, { w: w + 3.2, h: y0 + h + 1.4, res: 60, name: 'sign' });
  const paint = (P) => {
    P.fill(C.wood);
    P.layer((g) => { for (const x of [-post, post]) rect(g, x - 0.35, -0.2, 0.7, y0 + 1.2, 0.1); }, C.woodD, { lip: 1, shadow: 1 });
    P.layer((g) => { const gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, shade(C.wood, -0.1)); gr.addColorStop(1, shade(C.wood, 0.08)); g.fillStyle = gr; rect(g, -w / 2, y0, w, h, 0.45); }, C.wood, { lip: 1, shadow: 1.2, rim: 0.5 });
    P.draw((g) => { g.strokeStyle = 'rgba(60,30,14,0.35)'; g.lineWidth = 0.05; for (let i = 0; i < 9; i++) { const y = y0 + 0.2 + i * 0.75; g.beginPath(); g.moveTo(-w / 2 + 0.2, y); g.bezierCurveTo(-3, y + 0.15, 3, y - 0.15, w / 2 - 0.2, y + 0.05); g.stroke(); } });
    P.layer((g) => { rect(g, -w / 2 + 0.6, y0 + 0.55, w - 1.2, h - 1.1, 0.12); }, C.note, { lip: 1, shadow: 1.4, rim: 0.4 });
    P.draw((g) => { g.strokeStyle = 'rgba(150,120,90,0.22)'; g.lineWidth = 0.035; for (let y = y0 + 1.35; y < y0 + h - 0.8; y += 0.95) { g.beginPath(); g.moveTo(-w / 2 + 1.1, y); g.lineTo(w / 2 - 1.1, y); g.stroke(); } });
    // the words
    const box = { x0: -w / 2 + 1.2, x1: w / 2 - 1.1, y0: y0 + 0.7, y1: y0 + h - 0.75 };
    box.w = box.x1 - box.x0; box.h = box.y1 - box.y0;
    P.draw((g) => {
      const { s, lines } = fitMessage(g, m, box, { wrapLines, size: 2.0, maxLines: 4 });
      const ts = s * 0.82, lh = s * 1.12;
      let y = box.y1 - ts * 0.9;
      textAt(g, m.to, box.x0, y, { size: ts, color: '#3a2c5a' });
      const blockH = lines.length * lh, room = (box.y1 - ts * 1.15) - (box.y0 + ts * 1.1);
      y = box.y1 - ts * 1.15 - (room - blockH) / 2 - s * 0.88;
      for (const ln of lines) { textAt(g, ln, box.x0 + 0.35, y, { size: s, color: C.ink }); y -= lh; }
      textAt(g, m.from, box.x1, box.y0 + ts * 0.25, { size: ts, color: '#7a2a24', align: 'right' });
    });
    P.layer((g) => { for (const [x, y] of [[-w / 2 + 1.0, y0 + h - 0.95], [w / 2 - 1.0, y0 + h - 0.95]]) disc(g, x, y, 0.2); }, C.gold, { lip: 1, shadow: 1 });
    P.layer((g) => { for (let i = 0; i < 9; i++) ell(g, -w / 2 + 0.8 + i * (w - 1.6) / 8, y0 + h + 0.05, 1.0, 0.32 + 0.12 * Math.sin(i * 1.9)); }, C.snow, { lip: 1, shadow: 1.1, rim: 0.6 });
    P.layer((g) => { for (const a of [0.6, 1.4, 2.3]) { g.fillStyle = a > 1 ? C.holly : C.hollyL; fillLeaf(g, -w / 2 + 0.9, y0 + h - 0.5, 1.4, a, 0.34); } }, C.holly, { lip: 1, shadow: 1 });
    P.layer((g) => { disc(g, -w / 2 + 0.75, y0 + h - 0.4, 0.24); disc(g, -w / 2 + 1.15, y0 + h - 0.55, 0.24); disc(g, -w / 2 + 0.95, y0 + h - 0.15, 0.22); }, C.berry, { lip: 1, shadow: 0.9 });
    P.innerShade('#3a2010', { alpha: 0.2, blurPx: 10 });
  };
  return [pts, paint];
}
/** Gifts glued in front of the bank (their own little card). */
export function giftsPiece() {
  const D = P2.draw2;
  return P2.drawnPiece((g, ink) => {
    const box = (x, y, w, h, col, rib) => { g.fillStyle = ink(col); D.rect(g, x - w / 2, y, w, h, 0.08); g.fillStyle = ink(rib); D.rect(g, x - 0.13, y, 0.26, h); D.rect(g, x - w / 2, y + h * 0.5 - 0.12, w, 0.24); D.ell(g, x - 0.3, y + h + 0.12, 0.34, 0.18, 0.5); D.ell(g, x + 0.3, y + h + 0.12, 0.34, 0.18, -0.5); };
    box(-1.1, 0, 2.2, 1.8, '#3f6fa6', C.snow);
    box(0.85, 0, 1.9, 1.4, C.red, C.gold);
    box(-0.3, 1.7, 1.5, 1.2, C.gold, C.red);
  }, { w: 4.8, h: 3.6, res: 90, name: 'gifts', layer: { depth: 0.7 } });
}
