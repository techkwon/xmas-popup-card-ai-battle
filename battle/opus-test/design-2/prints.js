// prints.js — design 2 "숲속의 크리스마스" (Christmas in the snowy wood): every cut outline and print, drawn in code with
// paperkit-2d. A 180-degree book spread: V-fold pieces stand across the gutter. Palette: warm cream snow, pine green,
// scarlet and gold, a little ice blue: a daylight folk-art book (no night indigo here).
import * as P2 from 'papercraft/lib/paperkit-2d.js';
const { shade, mix, rng, fillLimb, fillLeaf } = P2;

export const C = {
  page: '#f5efe3', snow: '#faf6ee', snowM: '#ebe9e2', snowS: '#c9d5d2',
  pine: '#2d6a48', pineL: '#46895a', pineD: '#1c4a32', pineT: '#3b7a68',
  red: '#cb342a', redL: '#e35c42', redD: '#8e1f18', gold: '#e3aa3b', goldL: '#f5d47e', goldD: '#a87420',
  cream: '#f8edd6', wood: '#8e5a34', woodD: '#5c381e', woodL: '#b98250', falu: '#b2362a', roof: '#4c585b', win: '#ffd46a', winL: '#fff2bd',
  ice: '#b5d6e2', iceD: '#84b0c3', iceL: '#e4f1f5', ink: '#3a2a22', skin: '#f2c8a2', blue: '#3f6fa6', blueL: '#6b97c8',
  cover: '#b9302a', coverD: '#8a1f18', berry: '#c8302c', mint: '#a9cdbb', fox: '#d9772e', white: '#fbf6ee',
};

// ---- the V-fold geometry shared by every V piece ------------------------------------------------------------------
// "prow" V-folds: the crease toward the reader, the glue lines running back from it at ALPHA from the spine; the crease
// stands at ELEV over the open spread, leaning back, so both printed faces turn up toward the reader.
// GAMMA = the angle between crease and glue edge on the flat piece, so each piece's bottom is a shallow V: y = |x| COT
export const ALPHA = 62 * Math.PI / 180, ELEV = 72 * Math.PI / 180;
export const GAMMA = Math.acos(Math.cos(ELEV) * Math.cos(ALPHA)), COT = 1 / Math.tan(GAMMA);
export const onV = (x, y) => Math.abs(y - Math.abs(x) * COT) < 0.1;
const clipV = (g, w, h) => { g.beginPath(); g.moveTo(-w, w * COT); g.lineTo(0, 0); g.lineTo(w, w * COT); g.lineTo(w, h + 6); g.lineTo(-w, h + 6); g.closePath(); g.clip(); };

// ---- helpers (shape units, y up) -----------------------------------------------------------------------------------
export const starPath = (g, cx, cy, R, r, n = 5, rot = Math.PI / 2) => {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n, d = i % 2 ? r : R; g.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); }
  g.closePath();
};
const disc = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };
const rect = (g, x, y, w, h, rr = 0) => { g.beginPath(); if (rr > 0) g.roundRect(x, y, w, h, rr); else g.rect(x, y, w, h); g.fill(); };
const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
function scallopBand(g, x0, x1, y0, y1, period, amp, ph = 0) {
  g.beginPath(); g.moveTo(x0, y0);
  const n = Math.max(8, Math.ceil((x1 - x0) / period * 10));
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, u = ((x - x0) / period + ph) % 1; g.lineTo(x, y1 + amp * Math.sin(Math.PI * u) ** 0.7); }
  g.lineTo(x1, y0); g.closePath(); g.fill();
}
function tier(x, yb, yt, hw) { return { x, yb, yt, hw }; }
/** A snow band whose lobed top follows the V of the glue lines (so a V piece is glued all along its foot). */
function vBand(g, W, hgt, amp, ph = 0.3) {
  g.beginPath(); g.moveTo(-W / 2, -1);
  for (let x = -W / 2; x <= W / 2 + 1e-6; x += 0.1) g.lineTo(x, Math.abs(x) * COT + hgt + amp * Math.abs(Math.sin(x * 1.3 + ph)) ** 0.7);
  g.lineTo(W / 2, -1); g.closePath(); g.fill();
}
function tierPath(g, T) {
  const { x, yb, yt, hw } = T;
  g.beginPath(); g.moveTo(x, yt); g.lineTo(x + hw, yb);
  const n = Math.max(3, Math.round(hw * 1.5));
  for (let i = 1; i <= n * 2; i++) { const xx = x + hw - (2 * hw * i) / (n * 2); g.lineTo(xx, yb + (i % 2 ? 0.3 * Math.min(1, hw / 1.5) : 0)); }
  g.closePath();
}
function snowHem(g, T, ph) {
  const { x, yb, yt, hw } = T, th = 0.3 + hw * 0.05;
  g.beginPath(); g.moveTo(x - hw * 0.97, yb + 0.05);
  const n = Math.max(3, Math.round(hw * 2.2));
  for (let i = 0; i <= n; i++) { const xx = x - hw * 0.97 + (hw * 1.94 * i) / n; g.lineTo(xx, yb + th + 0.13 * Math.sin(i * 2.1 + ph)); }
  g.lineTo(x + hw * 0.97, yb + 0.05); g.closePath(); g.fill();
}
function pine(x, y0, h, w, n = 4) {
  const out = [];
  for (let k = 0; k < n; k++) { const t0 = k / n; out.push(tier(x, y0 + h * (0.1 + t0 * 0.7), k === n - 1 ? y0 + h : y0 + h * (0.1 + (k + 1.55) / n * 0.7), (w / 2) * (1 - t0 * 0.62))); }
  return out;
}
export function textAt(g, str, x, y, { size, font = 'Nanum Pen Script', color = C.ink, align = 'left', alpha = 1, weight = '' }) {
  const m = g.getTransform();
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.font = `${weight ? weight + ' ' : ''}${Math.round(size * m.a)}px "${font}", "Jua", sans-serif`;
  g.fillStyle = color; g.globalAlpha = alpha; g.textAlign = align; g.textBaseline = 'alphabetic';
  g.fillText(str, m.a * x + m.e, m.d * y + m.f);
  g.restore();
}
function fitMessage(g, m, box, { wrapLines, font = 'Nanum Pen Script', size = 2, minSize = 0.5, maxLines = 4 }) {
  const k = g.getTransform().a;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  let s = size, lines = [m.msg];
  for (; s >= minSize; s *= 0.95) {
    g.font = `${Math.round(s * k)}px "${font}"`;
    lines = wrapLines(g, m.msg, box.w * k, 99);
    const hh = s * 0.85 * 1.2 + lines.length * s * 1.15 + s * 0.85 * 1.15;
    g.font = `${Math.round(s * 0.85 * k)}px "${font}"`;
    const wide = g.measureText(m.to).width > box.w * k || g.measureText(m.from).width > box.w * k;
    if (lines.length <= maxLines && hh <= box.h && !wide) break;
  }
  g.restore();
  return { s, lines };
}
function holly(g, x, y, s = 1, a0 = 0) {
  for (const a of [0.35, 1.25, 2.2]) fillLeaf(g, x, y, 1.15 * s, a + a0, 0.36);
}

// ---- the big tree (the middle V-fold) ----------------------------------------------------------------------------------
export const TREE_V = { w: 23, h: 25 };
const TREE_TIERS = (() => { const out = []; for (let k = 0; k < 6; k++) { const yb = 1.0 + k * 3.25; out.push(tier(0, yb, k === 5 ? 21.6 : yb + 5.7, 10.6 * (1 - k * 0.15))); } return out; })();
export const BAUBLES = [[-6.2, 2.25, C.red], [6.6, 2.0, C.gold], [-3.6, 8.75, C.gold], [4.4, 8.55, C.red], [-2.4, 15.25, C.red], [2.9, 15.1, '#e9eef2']];
export function treeV() {
  const W = TREE_V.w, Hh = TREE_V.h;
  const draw = (g) => {
    rect(g, -0.9, 0, 1.8, 2.6);
    for (const T of TREE_TIERS) { tierPath(g, T); g.fill(); }
    starPath(g, 0, 22.4, 1.9, 0.85); g.fill();
    vBand(g, W, 1.0, 0.6);
  };
  const pts = P2.fromDrawing((g) => { g.save(); clipV(g, W, Hh); draw(g); g.restore(); }, { w: W, h: Hh, res: 26, name: 'tree' });
  const paint = (P) => {
    const r = P.r;
    P.fill(C.snow);
    P.layer((g) => rect(g, -0.9, 0, 1.8, 2.6), C.woodD, { lip: 0.8, shadow: 0.8 });
    for (let k = 0; k < 6; k++) {
      P.layer((g) => { const T = TREE_TIERS[k], gr = g.createLinearGradient(-T.hw, 0, T.hw, 0); gr.addColorStop(0, shade(C.pineL, 0.1)); gr.addColorStop(0.5, C.pine); gr.addColorStop(1, shade(C.pine, -0.12)); g.fillStyle = gr; tierPath(g, T); g.fill(); }, C.pine, { lip: 1, shadow: 1.3, rim: 0.4 });
      P.draw((g) => { const T = TREE_TIERS[k]; g.strokeStyle = 'rgba(20,60,36,0.45)'; g.lineWidth = 0.07; g.lineCap = 'round';
        for (let i = 0; i < 14; i++) { const u = (r() - 0.5) * 1.6, x = u * T.hw, y = T.yb + 0.6 + r() * (T.yt - T.yb) * (0.55 - 0.4 * Math.abs(u)); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.3 * Math.sign(u || 1), y - 0.35); g.stroke(); } });
      P.layer((g) => snowHem(g, TREE_TIERS[k], k * 1.7), C.snow, { lip: 0.8, shadow: 0.9 });
    }
    // red bead garlands swagging across the tiers
    P.layer((g) => {
      for (let k = 0; k < 5; k++) {
        const T = TREE_TIERS[k], y = T.yb + (T.yt - T.yb) * 0.45, hw = T.hw * 0.74;
        for (let i = 0; i <= 18; i++) { const u = i / 18, x = -hw + 2 * hw * u, yy = y + 0.9 - Math.sin(Math.PI * u) * 1.1 + (k % 2 ? 0.4 * u : -0.4 * u); disc(g, x, yy, 0.17); }
      }
    }, C.red, { lip: 0.8, shadow: 0.7 });
    // little printed ornaments and lights
    const orn = [];
    for (let k = 0; k < 6; k++) { const T = TREE_TIERS[k]; for (let i = 0; i < 3 - Math.floor(k / 3); i++) orn.push([(r() - 0.5) * T.hw * 1.3, T.yb + 1.2 + r() * (T.yt - T.yb) * 0.32, [C.gold, C.blueL, C.white][(i + k) % 3]]); }
    P.layer((g) => { for (const [x, y, col] of orn) { g.fillStyle = col; disc(g, x, y, 0.32); } }, C.gold, { lip: 1, shadow: 1 });
    P.draw((g) => { g.fillStyle = 'rgba(255,255,255,0.6)'; for (const [x, y] of orn) disc(g, x - 0.1, y + 0.1, 0.09); });
    const bulbs = [];
    for (let k = 0; k < 6; k++) { const T = TREE_TIERS[k]; for (let i = 0; i < 7; i++) bulbs.push([(r() - 0.5) * T.hw * 1.5, T.yb + 0.5 + r() * (T.yt - T.yb) * 0.45]); }
    P.draw((g) => { g.fillStyle = '#ffe7a0'; for (const [x, y] of bulbs) disc(g, x, y, 0.12); });
    P.glow((g) => { for (const [x, y] of bulbs) disc(g, x, y, 0.14); });
    // the star on top (cut with the tree: it folds on the crease into a little 3D star)
    P.layer((g) => { starPath(g, 0, 22.4, 1.9, 0.85); g.fill(); }, C.gold, { lip: 1, shadow: 1.2, rim: 0.5 });
    P.layer((g) => { starPath(g, 0, 22.4, 1.0, 0.45); g.fill(); }, C.goldL, { lip: 0.8, shadow: 0.6 });
    P.glow((g) => { g.fillStyle = 'rgba(255,255,255,0.5)'; starPath(g, 0, 22.4, 1.9, 0.85); g.fill(); });
    // presents at the foot and the snow mound they sit in
    const gifts = [[-6.8, 1.6, 2.4, 1.9, C.red, C.gold], [-3.9, 1.0, 1.8, 1.4, C.blue, C.white], [4.2, 1.1, 2.0, 1.6, C.gold, C.red], [7.4, 1.7, 2.2, 1.5, C.pineT, C.red]];
    P.layer((g) => { for (const [x, y, w, h, col] of gifts) { g.fillStyle = col; rect(g, x - w / 2, y, w, h, 0.08); } }, C.red, { lip: 1, shadow: 1.2, rim: 0.5 });
    P.layer((g) => { for (const [x, y, w, h, , rib] of gifts) { g.fillStyle = rib; rect(g, x - 0.15, y, 0.3, h); rect(g, x - w / 2, y + h * 0.45, w, 0.26); ell(g, x - 0.32, y + h + 0.14, 0.36, 0.18, 0.4); ell(g, x + 0.32, y + h + 0.14, 0.36, 0.18, -0.4); } }, C.gold, { lip: 0.8, shadow: 0.7 });
    P.layer((g) => vBand(g, W, 1.0, 0.6), C.snow, { lip: 1, shadow: 1.2, rim: 0.6 });
    P.marks('dot', { color: '#ffffff', alpha: 0.6, size: 0.02, density: 0.4, region: { x0: -11, x1: 11, y0: 0, y1: 2.6 } });
    P.innerShade('#1c3a2a', { alpha: 0.22, blurPx: 14 });
  };
  return { pts, paint };
}

// ---- the back V-fold: a snowy mountain on the crease, pine wood, the red cottage, the sledding hill ----------------------
export const BACK_V = { w: 33, h: 13.4 };
export const hillY = (x) => { const t = Math.min(1, Math.max(0, (x + 16.4) / 10.6)); return 3.0 + 5.3 * t * t * (3 - 2 * t); };   // left half: the sledding hill
export const COTTAGE = { x: 11.6, y0: 2.3, w: 5.6, h: 3.6, rh: 3.4 };
const BACK_PINES = [[-9.4, 6.4, 6.6, 3.2], [-14.6, 3.2, 5.6, 2.8], [6.8, 2.0, 9.8, 4.0], [14.8, 2.2, 7.2, 3.0], [3.4, 5.6, 6.4, 3.0], [-4.2, 7.8, 5.2, 2.6]];
export function backV() {
  const W = BACK_V.w, Hh = BACK_V.h, ck = COTTAGE;
  const ridge = (x) => { const a = Math.abs(x); return a < 7.5 ? 12.8 - a * 0.62 - 0.25 * Math.sin(a * 2.2) : 0; };
  const pines = BACK_PINES.map(([x, y0, h, w]) => pine(x, y0 - 0.4, h, w, 4));
  const draw = (g) => {
    // ground: the mountain ridge in the middle, the hill on the left, a snowy field on the right
    g.beginPath(); g.moveTo(-W / 2, -1);
    for (let x = -W / 2; x <= W / 2; x += 0.2) { const y = Math.max(x < 0 ? hillY(x) : 2.6 + 0.35 * Math.sin(x * 0.7), ridge(x), Math.abs(x) * COT + 1.3); g.lineTo(x, y); }
    g.lineTo(W / 2, -1); g.closePath(); g.fill();
    for (const T of pines) for (const t of T) { tierPath(g, t); g.fill(); }
    rect(g, ck.x - ck.w / 2, ck.y0 - 0.5, ck.w, ck.h + 0.5);
    poly(g, [[ck.x - ck.w / 2 - 0.5, ck.y0 + ck.h], [ck.x + ck.w / 2 + 0.5, ck.y0 + ck.h], [ck.x, ck.y0 + ck.h + ck.rh]]);
    rect(g, ck.x + 1.3, ck.y0 + ck.h + 0.8, 0.8, 2.4);
  };
  const pts = P2.fromDrawing((g) => { g.save(); clipV(g, W, Hh); draw(g); g.restore(); }, { w: W, h: Hh, res: 22, name: 'back' });
  const paint = (P) => {
    const r = P.r;
    P.gradient('#e8ece8', C.snow, 0);
    P.felt(0.3);
    // the mountain: a lit face and a shaded face meeting on the crease (the V makes it a real ridge)
    P.layer((g) => { g.beginPath(); g.moveTo(-7.6, 0); for (let x = -7.6; x <= 7.6; x += 0.2) g.lineTo(x, ridge(x) || 0); g.lineTo(7.6, 0); g.closePath(); g.fill(); }, '#a9bcc6', { lip: 1, shadow: 1, rim: 0.5 });
    P.layer((g) => { g.beginPath(); g.moveTo(-6.6, 12.8 - 6.6 * 0.62); for (let x = -6.6; x <= 6.6; x += 0.2) g.lineTo(x, ridge(x) + 0.05); for (let x = 6.6; x >= -6.6; x -= 0.4) g.lineTo(x, ridge(x) - 1.6 - 0.5 * Math.abs(Math.sin(x * 1.7)) - (Math.abs(x) > 5 ? 0.6 : 0)); g.closePath(); g.fill(); }, C.snow, { lip: 1, shadow: 1, rim: 0.5 });
    // the hill and the field
    P.layer((g) => { g.beginPath(); g.moveTo(-W / 2, -1); for (let x = -W / 2; x <= 0; x += 0.2) g.lineTo(x, Math.max(hillY(x), -x * COT + 1.3)); g.lineTo(0, -1); g.closePath(); g.fill(); }, '#eef0ea', { lip: 1, shadow: 1.2, rim: 0.6 });
    for (let k = 0; k < 4; k++) {
      P.layer((g) => { for (const T of pines) { g.fillStyle = k % 2 ? C.pine : C.pineL; tierPath(g, T[k]); g.fill(); } }, C.pine, { lip: 0.9, shadow: 1.2, rim: 0.3 });
      P.layer((g) => { for (const T of pines) snowHem(g, T[k], k); }, C.snow, { lip: 0.7, shadow: 0.7 });
    }
    // the red cottage: Falu red boards, white trim, lit windows, a snowy roof, a chimney
    P.layer((g) => { const gr = g.createLinearGradient(ck.x - 3, 0, ck.x + 3, 0); gr.addColorStop(0, shade(C.falu, 0.08)); gr.addColorStop(1, shade(C.falu, -0.12)); g.fillStyle = gr; rect(g, ck.x - ck.w / 2, ck.y0 - 0.5, ck.w, ck.h + 0.5); }, C.falu, { lip: 1, shadow: 1.2, rim: 0.6 });
    P.draw((g) => { g.strokeStyle = 'rgba(70,14,10,0.4)'; g.lineWidth = 0.05; for (let x = ck.x - ck.w / 2 + 0.45; x < ck.x + ck.w / 2; x += 0.45) { g.beginPath(); g.moveTo(x, ck.y0 - 0.5); g.lineTo(x, ck.y0 + ck.h); g.stroke(); } });
    P.layer((g) => { rect(g, ck.x + 1.3, ck.y0 + ck.h + 0.8, 0.8, 2.4); }, '#7a4a3a', { lip: 0.8, shadow: 1 });
    P.layer((g) => { poly(g, [[ck.x - ck.w / 2 - 0.5, ck.y0 + ck.h], [ck.x + ck.w / 2 + 0.5, ck.y0 + ck.h], [ck.x, ck.y0 + ck.h + ck.rh]]); }, C.roof, { lip: 1, shadow: 1.2, rim: 0.5 });
    P.layer((g) => { g.save(); g.beginPath(); g.moveTo(ck.x - ck.w / 2 - 0.5, ck.y0 + ck.h + 0.15); g.lineTo(ck.x + ck.w / 2 + 0.5, ck.y0 + ck.h + 0.15); g.lineTo(ck.x, ck.y0 + ck.h + ck.rh + 0.15); g.closePath(); g.clip();
      scallopBand(g, ck.x - 4, ck.x + 4, ck.y0 + ck.h + 5, ck.y0 + ck.h + 0.75, 0.75, -0.32); g.restore(); ell(g, ck.x + 1.7, ck.y0 + ck.h + 3.25, 0.55, 0.2); }, C.snow, { lip: 1, shadow: 1.2, rim: 0.6 });
    const wins = [[ck.x - 1.5, ck.y0 + 1.1], [ck.x + 1.5, ck.y0 + 1.1]];
    P.layer((g) => { for (const [x, y] of wins) rect(g, x - 0.75, y - 0.15, 1.5, 1.6, 0.06); rect(g, ck.x - 0.55, ck.y0 - 0.5, 1.1, 2.4, 0.08); poly(g, [[ck.x - 0.9, ck.y0 + ck.h + 0.4], [ck.x + 0.9, ck.y0 + ck.h + 0.4], [ck.x, ck.y0 + ck.h + 1.9]]); }, C.white, { lip: 0.7, shadow: 0.8 });
    P.layer((g) => { const gr = g.createLinearGradient(0, ck.y0, 0, ck.y0 + 1.3); gr.addColorStop(0, C.win); gr.addColorStop(1, C.winL); g.fillStyle = gr; for (const [x, y] of wins) rect(g, x - 0.55, y, 1.1, 1.3, 0.04); disc(g, ck.x, ck.y0 + ck.h + 0.95, 0.32); }, C.win, { lip: 0.3, shadow: 0.5 });
    P.layer((g) => { rect(g, ck.x - 0.4, ck.y0 - 0.5, 0.8, 2.1, 0.06); }, C.pineD, { lip: 0.6, shadow: 0.6 });
    P.draw((g) => { g.strokeStyle = 'rgba(120,60,30,0.85)'; g.lineWidth = 0.08; for (const [x, y] of wins) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 1.3); g.moveTo(x - 0.55, y + 0.65); g.lineTo(x + 0.55, y + 0.65); g.stroke(); } g.fillStyle = C.gold; disc(g, ck.x + 0.22, ck.y0 + 0.5, 0.07); g.fillStyle = C.pine; disc(g, ck.x, ck.y0 + 1.85, 0.3); g.fillStyle = C.berry; disc(g, ck.x, ck.y0 + 1.6, 0.09); });
    P.glow((g) => { for (const [x, y] of wins) rect(g, x - 0.55, y, 1.1, 1.3, 0.04); disc(g, ck.x, ck.y0 + ck.h + 0.95, 0.32); });
    // the sled run: a cut slot along the hill (the sled's tab rides in it) and a few tracks
    P.draw((g) => {
      g.lineCap = 'round';
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.1; g.beginPath(); for (let x = -15.6; x <= -6.4; x += 0.2) g.lineTo(x, hillY(x) - 0.95); g.stroke();
      g.strokeStyle = '#4a3a34'; g.lineWidth = 0.2; g.beginPath(); for (let x = -15.6; x <= -6.4; x += 0.2) g.lineTo(x, hillY(x) - 0.8); g.stroke();
      g.strokeStyle = 'rgba(140,160,170,0.5)'; g.lineWidth = 0.06; for (const d of [-0.25, -0.4]) { g.beginPath(); for (let x = -16.4; x <= -6; x += 0.2) g.lineTo(x, hillY(x) + d); g.stroke(); }
    });
    // a fence of posts along the field on the right
    P.layer((g) => { for (let x = 3.0; x < 8.6; x += 1.1) rect(g, x - 0.14, 1.6, 0.28, 1.7, 0.06); rect(g, 2.8, 2.5, 6.0, 0.22); }, C.wood, { lip: 0.8, shadow: 1 });
    P.layer((g) => vBand(g, W, 0.9, 0.55, 0.4), C.snow, { lip: 1, shadow: 1.1, rim: 0.6 });
    P.marks('dot', { color: '#9ab0b8', alpha: 0.35, size: 0.02, density: 0.4 });
    P.innerShade('#2a4a4a', { alpha: 0.22, blurPx: 14 });
  };
  return { pts, paint };
}

// ---- the front V-fold: a low drift with a snowman, a fir sapling on the crease, presents and a fox -------------------
export const FRONT_V = { w: 15.4, h: 8.4 };
export function frontV() {
  const W = FRONT_V.w, Hh = FRONT_V.h;
  const sap = pine(0, 0.4, 5.6, 3.2, 3);
  const drift = (x) => Math.abs(x) * COT + 1.5 + 0.45 * Math.sin(x * 0.9 + 0.5);
  const draw = (g) => {
    g.beginPath(); g.moveTo(-W / 2, -1); for (let x = -W / 2; x <= W / 2; x += 0.1) g.lineTo(x, drift(x)); g.lineTo(W / 2, -1); g.closePath(); g.fill();
    for (const t of sap) { tierPath(g, t); g.fill(); }
    ell(g, -4.2, 2.3, 1.55, 1.4); ell(g, -4.2, 4.4, 1.1, 1.0); ell(g, -4.2, 5.9, 0.78, 0.74); rect(g, -4.85, 6.4, 1.3, 0.9, 0.08);
    // the fox, sitting, tail curled
    ell(g, 4.3, 2.2, 0.95, 1.05); ell(g, 4.6, 3.6, 0.62, 0.55); poly(g, [[4.15, 3.95], [4.35, 4.75], [4.65, 4.0]]); poly(g, [[4.75, 4.0], [5.1, 4.75], [5.15, 3.85]]);
    fillLimb(g, 3.5, 1.4, 2.4, 1.4, 2.6, 2.6, 0.75, 0.5);
  };
  const pts = P2.fromDrawing((g) => { g.save(); clipV(g, W, Hh); draw(g); g.restore(); }, { w: W, h: Hh, res: 40, name: 'front' });
  const paint = (P) => {
    P.fill(C.snow);
    for (let k = 0; k < 3; k++) {
      P.layer((g) => { g.fillStyle = k % 2 ? C.pine : C.pineL; tierPath(g, sap[k]); g.fill(); }, C.pine, { lip: 1, shadow: 1.1, rim: 0.3 });
      P.layer((g) => snowHem(g, sap[k], k), C.snow, { lip: 0.7, shadow: 0.7 });
    }
    P.layer((g) => { starPath(g, 0, 6.15, 0.55, 0.24); g.fill(); }, C.gold, { lip: 1, shadow: 0.9 });
    P.layer((g) => { for (const x of [-0.9, 0.7, -0.3, 1.0]) disc(g, x, 1.4 + Math.abs(x) * 0.6 + (x > 0 ? 1.2 : 0.4), 0.18); }, C.red, { lip: 1, shadow: 0.8 });
    // snowman: three balls, a red scarf, a hat with a holly sprig, a carrot nose
    P.layer((g) => { g.fillStyle = C.snowM; ell(g, -4.2, 2.3, 1.55, 1.4); g.fillStyle = C.snow; ell(g, -4.2, 4.4, 1.1, 1.0); ell(g, -4.2, 5.9, 0.78, 0.74); }, C.snow, { lip: 1, shadow: 1.3, rim: 0.4 });
    P.layer((g) => { poly(g, [[-5.1, 4.95], [-3.3, 4.95], [-3.3, 5.3], [-5.1, 5.3]]); poly(g, [[-3.75, 5.0], [-3.25, 5.0], [-3.0, 3.8], [-3.5, 3.8]]); }, C.red, { lip: 0.9, shadow: 0.9 });
    P.layer((g) => { rect(g, -4.85, 6.4, 1.3, 0.9, 0.08); rect(g, -5.1, 6.38, 1.8, 0.2, 0.06); }, C.ink, { lip: 0.8, shadow: 0.9 });
    P.draw((g) => { g.fillStyle = C.ink; disc(g, -4.45, 6.05, 0.08); disc(g, -3.95, 6.05, 0.08); for (const y of [4.7, 4.2, 3.7]) disc(g, -4.2, y, 0.09); g.fillStyle = '#e07a2a'; poly(g, [[-4.2, 5.9], [-4.2, 5.7], [-3.4, 5.78]]); g.fillStyle = C.red; rect(g, -4.85, 6.6, 1.3, 0.16); g.fillStyle = C.pine; fillLeaf(g, -4.0, 6.85, 0.4, 0.6, 0.35); fillLeaf(g, -4.0, 6.85, 0.4, 1.9, 0.35); });
    P.draw((g) => { g.strokeStyle = C.woodD; g.lineWidth = 0.12; g.lineCap = 'round'; g.beginPath(); g.moveTo(-5.2, 4.5); g.lineTo(-6.3, 5.4); g.moveTo(-5.85, 5.05); g.lineTo(-6.15, 5.55); g.moveTo(-3.2, 4.5); g.lineTo(-2.3, 5.3); g.stroke(); });
    // fox: orange coat, cream chest and tail tip, dark legs
    P.layer((g) => { fillLimb(g, 3.5, 1.4, 2.4, 1.4, 2.6, 2.6, 0.75, 0.5); ell(g, 4.3, 2.2, 0.95, 1.05); ell(g, 4.6, 3.6, 0.62, 0.55); poly(g, [[4.15, 3.95], [4.35, 4.75], [4.65, 4.0]]); poly(g, [[4.75, 4.0], [5.1, 4.75], [5.15, 3.85]]); }, C.fox, { lip: 1, shadow: 1.2, rim: 0.4 });
    P.layer((g) => { ell(g, 4.55, 2.4, 0.42, 0.7); ell(g, 2.62, 2.55, 0.28, 0.24); ell(g, 4.85, 3.4, 0.3, 0.2); }, C.cream, { lip: 0.6, shadow: 0.6 });
    P.draw((g) => { g.fillStyle = C.ink; disc(g, 4.5, 3.72, 0.06); disc(g, 4.85, 3.72, 0.06); disc(g, 5.12, 3.45, 0.07); g.fillStyle = '#5a2a16'; rect(g, 3.9, 1.2, 0.22, 0.6, 0.08); rect(g, 4.5, 1.2, 0.22, 0.6, 0.08); });
    // the drift in front
    P.layer((g) => { g.beginPath(); g.moveTo(-W / 2, -1); for (let x = -W / 2; x <= W / 2; x += 0.1) g.lineTo(x, drift(x) - 0.25); g.lineTo(W / 2, -1); g.closePath(); g.fill(); }, C.snow, { lip: 1, shadow: 1.2, rim: 0.6 });
    P.layer((g) => { holly(g, -1.6, 1.4, 0.8, 0.2); holly(g, 6.1, 1.1, 0.7, 0); }, C.pine, { lip: 1, shadow: 1 });
    P.layer((g) => { for (const [x, y] of [[-1.6, 1.4], [6.1, 1.1]]) { disc(g, x - 0.12, y + 0.05, 0.16); disc(g, x + 0.14, y + 0.08, 0.16); } }, C.berry, { lip: 1, shadow: 0.8 });
    P.innerShade('#2a4a4a', { alpha: 0.2, blurPx: 10 });
  };
  return { pts, paint };
}

// ---- moving pieces ------------------------------------------------------------------------------------------------------
/** A bauble on a thread; it swings on a pin at the top of the thread (pivot). */
export function baublePiece(col) {
  const D = P2.draw2;
  const piece = P2.drawnPiece((g, ink) => {
    g.fillStyle = ink(C.goldD); D.rect(g, -0.06, 0.95, 0.12, 1.2);
    g.fillStyle = ink(col); D.ell(g, 0, 0.55, 0.55, 0.55);
    g.fillStyle = ink(C.goldL); D.rect(g, -0.2, 1.0, 0.4, 0.22, 0.05);
    g.fillStyle = ink(col === C.red ? C.goldL : C.red, 'print'); D.rect(g, -0.5, 0.48, 1.0, 0.12);
    g.fillStyle = ink('rgba(255,255,255,0.7)', 'print'); D.ell(g, -0.2, 0.75, 0.14, 0.1, 0.5);
  }, { w: 1.3, h: 2.25, res: 150, name: 'bauble', layer: { depth: 0.35 } });
  piece.pivot = [0, 2.1];
  return piece;
}
/** A red sled with two children, facing downhill (-x); its tab rides the slot at the pivot. */
export function sledPiece() {
  const D = P2.draw2;
  const piece = P2.drawnPiece((g, ink) => {
    g.translate(0.2, 0);
    // runners with a front curl, struts, a slatted seat
    g.fillStyle = ink(C.goldD); fillLimb(g, 2.4, 0.15, 0, 0.05, -2.0, 0.15, 0.2, 0.2); fillLimb(g, -2.0, 0.15, -2.8, 0.3, -2.6, 0.95, 0.2, 0.15);
    D.rect(g, -1.4, 0.15, 0.2, 0.6); D.rect(g, 1.5, 0.15, 0.2, 0.6);
    g.fillStyle = ink(C.red); D.rect(g, -2.1, 0.65, 4.6, 0.55, 0.15);
    g.fillStyle = ink(C.redD, 'print'); for (let x = -1.6; x < 2.3; x += 0.6) D.rect(g, x, 0.7, 0.06, 0.45);
    // the child at the back: blue coat, yellow bobble hat
    g.fillStyle = ink(C.blue); D.ell(g, 1.25, 1.75, 0.68, 0.72);
    g.fillStyle = ink(C.skin); D.ell(g, 1.2, 2.75, 0.42, 0.42);
    g.fillStyle = ink(C.gold); D.ell(g, 1.2, 3.05, 0.45, 0.3); D.ell(g, 1.45, 3.4, 0.16, 0.16);
    g.fillStyle = ink(C.redL); D.rect(g, 0.75, 2.25, 0.95, 0.24, 0.1); fillLimb(g, 1.65, 2.35, 2.1, 2.5, 2.5, 2.25, 0.22, 0.14);
    // the child at the front: red coat, green hat with a white bobble, arms up in delight
    g.fillStyle = ink(C.redD); D.ell(g, -0.65, 1.7, 0.72, 0.75);
    g.fillStyle = ink(C.redD); fillLimb(g, -0.95, 2.0, -1.4, 2.6, -1.75, 3.0, 0.3, 0.24); fillLimb(g, -0.3, 2.0, 0.05, 2.65, -0.1, 3.05, 0.3, 0.24);
    g.fillStyle = ink(C.white); D.ell(g, -1.8, 3.1, 0.2, 0.2); D.ell(g, -0.12, 3.15, 0.2, 0.2);
    g.fillStyle = ink(C.skin); D.ell(g, -0.7, 2.75, 0.44, 0.44);
    g.fillStyle = ink(C.pine); D.ell(g, -0.68, 3.05, 0.48, 0.3); g.fillStyle = ink(C.white); D.ell(g, -0.35, 3.45, 0.17, 0.17);
    g.fillStyle = ink(C.ink, 'print'); D.ell(g, -0.95, 2.78, 0.06, 0.07); D.ell(g, 1.02, 2.78, 0.06, 0.07);
    g.fillStyle = ink('#e8908a', 'print'); D.ell(g, -1.0, 2.6, 0.1, 0.07); D.ell(g, 0.98, 2.6, 0.1, 0.07);
  }, { w: 6.2, h: 3.7, res: 90, name: 'sled', layer: { depth: 0.5 } });
  piece.pivot = [0.2, 0.05];
  return piece;
}

// ---- the skating pond volvelle: a turning ice disc under a window in a snow-bank frame on the right page -----------
export const POND = { rx: 5.1, ry: 3.9, R: 5.6 };
function pondHole() { const p = []; for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; p.push([Math.cos(a) * POND.rx * (1 + 0.03 * Math.sin(a * 5)), Math.sin(a) * POND.ry * (1 + 0.03 * Math.cos(a * 4))]); } return p; }
export function pondFrame() {
  const out = []; for (let i = 0; i < 80; i++) { const a = i / 80 * Math.PI * 2; out.push([Math.cos(a) * (POND.rx + 2.3 + 0.35 * Math.sin(a * 7)), Math.sin(a) * (POND.ry + 2.0 + 0.3 * Math.sin(a * 6 + 1))]); }
  const hole = pondHole();
  const paint = (P) => {
    P.gradient('#eceee8', C.snow, 0.4);
    P.felt(0.3);
    P.layer((g) => { g.beginPath(); for (let i = 0; i < 80; i++) { const a = i / 80 * Math.PI * 2; g.lineTo(Math.cos(a) * (POND.rx + 0.9 + 0.2 * Math.sin(a * 9)), Math.sin(a) * (POND.ry + 0.8 + 0.18 * Math.sin(a * 7))); } g.closePath(); g.fill(); }, '#dde6e6', { lip: 0.6, shadow: 0 });
    // little shrubs and a bench around the bank
    const tufts = [[-6.4, 2.6], [6.6, -2.2], [-2.0, 5.2], [3.8, 5.0], [-5.6, -3.4], [1.0, -5.3]];
    P.layer((g) => { for (const [x, y] of tufts) { disc(g, x, y, 0.62); disc(g, x + 0.45, y - 0.2, 0.48); disc(g, x - 0.45, y - 0.15, 0.45); } }, C.pine, { lip: 1, shadow: 1.1 });
    P.layer((g) => { for (const [x, y] of tufts) { ell(g, x, y + 0.35, 0.5, 0.24); } }, C.snow, { lip: 0.7, shadow: 0.7 });
    P.layer((g) => { for (const [x, y] of tufts) { disc(g, x + 0.2, y - 0.1, 0.13); disc(g, x - 0.25, y - 0.25, 0.13); } }, C.berry, { lip: 1, shadow: 0.7 });
    P.draw((g) => { textAt(g, '스케이트 연못', 0, -POND.ry - 1.4, { size: 0.85, font: 'Jua', color: C.redD, align: 'center', alpha: 0.9 }); });
  };
  return { pts: out, paint, hole };
}
export function pondDisc() {
  const pts = []; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2; pts.push([Math.cos(a) * POND.R, Math.sin(a) * POND.R]); }
  const skater = (g, x, y, a, coat, hat) => {   // a skater seen from above, gliding along the circle (a in radians)
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = '#5a4a5a'; ell(g, -0.15, -0.55, 0.14, 0.42, 0.3); ell(g, 0.15, -0.55, 0.14, 0.42, -0.2);
    g.fillStyle = coat; ell(g, 0, 0, 0.55, 0.42); ell(g, -0.75, 0.15, 0.4, 0.13, 0.25); ell(g, 0.75, 0.15, 0.4, 0.13, -0.25);
    g.fillStyle = C.skin; disc(g, 0, 0.55, 0.3); g.fillStyle = hat; ell(g, 0, 0.72, 0.32, 0.2); disc(g, 0, 0.95, 0.12);
    g.restore();
  };
  const paint = (P) => {
    const r = P.r;
    P.gradient(C.iceD, C.ice, 0.8);
    P.felt(0.25);
    P.layer((g) => { for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(0, 0, 4.6 - k * 1.4, 4.6 - k * 1.4, 0, 0, Math.PI * 2); g.ellipse(0, 0, 4.4 - k * 1.4, 4.4 - k * 1.4, 0, 0, Math.PI * 2, true); g.fill('evenodd'); } }, C.iceL, { lip: 0.4, shadow: 0.3 });
    P.draw((g) => { g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.07; g.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const rr = 1.3 + r() * 3.6, a0 = r() * 6.28; g.beginPath(); g.arc(0, 0, rr, a0, a0 + 0.8 + r() * 1.6); g.stroke(); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; g.save(); g.translate(Math.cos(a) * 2.6, Math.sin(a) * 2.6); for (let k = 0; k < 3; k++) { const b = k * Math.PI / 3; g.beginPath(); g.moveTo(-Math.cos(b) * 0.3, -Math.sin(b) * 0.3); g.lineTo(Math.cos(b) * 0.3, Math.sin(b) * 0.3); g.stroke(); } g.restore(); } });
    P.parts((g) => {
      skater(g, 3.6, 0, Math.PI, C.red, C.goldL);
      skater(g, -3.0, 1.8, -0.9 + Math.PI * 0.05, C.blue, C.red);
      skater(g, 0.4, -3.5, 0.15 + Math.PI * 0.5, C.pineL, C.white);
    }, { depth: 0.4 });
    P.innerShade('#2f5a70', { alpha: 0.3, blurPx: 10 });
  };
  return { pts, paint };
}

// ---- the pages, the cover and the message note ---------------------------------------------------------------------
// a page card: x across (-13 .. 13), y from the front edge (0) to the back edge (32); `spine` says which side
export function paintPage(spine, seed) {
  return (P) => {
    const r = rng(seed), out = spine > 0 ? -1 : 1;   // out: the side away from the spine
    P.gradient('#efe8da', '#f7f2e8', spine > 0 ? -Math.PI / 2 : Math.PI / 2);
    P.felt(0.35);
    // soft drifts printed on the page
    P.layer((g) => { for (let i = 0; i < 6; i++) { const x = (r() - 0.5) * 20, y = 2 + r() * 28; g.beginPath(); g.ellipse(x, y, 2.6 + r() * 3.4, 0.6 + r() * 0.5, (r() - 0.5) * 0.3, 0, Math.PI * 2); g.fill(); } }, '#e7ece6', { lip: 0.6, shadow: 0.5, rim: 0.3 });
    // a winding path of footprints toward the spine
    P.draw((g) => { g.fillStyle = 'rgba(110,128,140,0.38)'; for (let i = 0; i < 26; i++) { const t = i / 26, x = out * (11 - 10.5 * t), y = 4 + 21 * t + 2.2 * Math.sin(t * 7 + seed); const side = i % 2 ? 0.32 : -0.32; ell(g, x + side * 0.6, y + side, 0.17, 0.25, 0.4 * out); } });
    // small printed firs, bushes and gifts along the outer edge and the far corner (a printed illustration round the pop-ups)
    const firs = [[out * 10.2, 27.6, 3.4], [out * 7.6, 29.2, 2.6], [out * 10.8, 22.4, 2.4], [out * 4.2, 28.6, 2.2], [out * 11.2, 16.6, 2.0]];
    P.layer((g) => { for (const [x, y, h] of firs) { for (let k = 0; k < 3; k++) { const w = h * (0.55 - k * 0.14), yb = y + k * h * 0.26; g.fillStyle = k % 2 ? C.pine : C.pineL; poly(g, [[x - w, yb], [x + w, yb], [x, yb + h * 0.5]]); } } }, C.pine, { lip: 1, shadow: 1, rim: 0.3 });
    P.layer((g) => { for (const [x, y, h] of firs) for (let k = 0; k < 3; k++) { const w = h * (0.55 - k * 0.14), yb = y + k * h * 0.26; ell(g, x, yb + 0.08, w * 0.8, 0.14); } }, C.snow, { lip: 0.6, shadow: 0.6 });
    P.layer((g) => { for (const [x, y, h] of firs) rect(g, x - 0.18, y - 0.45, 0.36, 0.5); }, C.wood, { lip: 0.6, shadow: 0.6 });
    const bushes = [[out * 8.8, 12.4], [out * 3.0, 22.0], [out * 11.0, 9.0]];
    P.layer((g) => { for (const [x, y] of bushes) { disc(g, x, y, 0.75); disc(g, x + 0.6, y - 0.2, 0.55); disc(g, x - 0.6, y - 0.2, 0.55); } }, C.pineL, { lip: 1, shadow: 1 });
    P.layer((g) => { for (const [x, y] of bushes) { disc(g, x + 0.25, y + 0.1, 0.16); disc(g, x - 0.3, y - 0.1, 0.16); disc(g, x + 0.5, y - 0.35, 0.15); } }, C.berry, { lip: 1, shadow: 0.7 });
    P.layer((g) => { const x = out * 6.2, y = 26.0; g.fillStyle = C.red; rect(g, x - 0.7, y, 1.4, 1.0, 0.06); g.fillStyle = C.blue; rect(g, x + 0.6, y - 0.2, 1.0, 0.8, 0.06); }, C.red, { lip: 1, shadow: 1 });
    P.layer((g) => { const x = out * 6.2, y = 26.0; rect(g, x - 0.1, y, 0.2, 1.0); rect(g, x - 0.7, y + 0.42, 1.4, 0.16); rect(g, x + 1.02, y - 0.2, 0.16, 0.8); }, C.gold, { lip: 0.6, shadow: 0.5 });
    // a ruled red border with holly in the outer corners
    P.draw((g) => { g.strokeStyle = 'rgba(190,50,40,0.55)'; g.lineWidth = 0.1; g.strokeRect(-12.2, 0.8, 24.4, 30.4); g.lineWidth = 0.05; g.strokeRect(-11.9, 1.1, 23.8, 29.8); });
    P.layer((g) => { const x = out * 11.4; holly(g, x, 30.4, 0.8, out > 0 ? 0.9 : -0.9); holly(g, x, 1.6, 0.8, out > 0 ? 0.4 : -0.2); }, C.pine, { lip: 1, shadow: 1 });
    P.layer((g) => { const x = out * 11.4; for (const y of [30.4, 1.6]) { disc(g, x - 0.15, y, 0.17); disc(g, x + 0.15, y + 0.05, 0.17); } }, C.berry, { lip: 1, shadow: 0.8 });
    P.marks('dot', { color: '#a6b8bc', alpha: 0.3, size: 0.015, density: 0.4 });
    // the gutter: a soft shade where the page bends into the spine
    P.draw((g) => { const x0 = spine > 0 ? 13 : -13, gr = g.createLinearGradient(x0, 0, x0 - spine * 3.2, 0); gr.addColorStop(0, 'rgba(70,80,70,0.32)'); gr.addColorStop(1, 'rgba(70,80,70,0)'); g.fillStyle = gr; g.fillRect(-14, -1, 28, 34); });
  };
}
export function paintCover(P) {
  const r = P.r;
  P.gradient(C.coverD, C.cover, 0.4);
  P.felt(0.45);
  // a scalloped cream border and small folk stars
  P.layer((g) => { g.beginPath(); g.roundRect(-11.9, 1.0, 23.8, 30, 0.8); g.roundRect(-11.2, 1.7, 22.4, 28.6, 0.6); g.fill('evenodd'); }, C.cream, { lip: 1, shadow: 1 });
  P.layer((g) => { for (let x = -10.6; x <= 10.61; x += 1.06) { disc(g, x, 2.15, 0.28); disc(g, x, 29.85, 0.28); } for (let y = 3.0; y <= 29.01; y += 1.0) { disc(g, -10.75, y, 0.26); disc(g, 10.75, y, 0.26); } }, C.cream, { lip: 0.8, shadow: 0.7 });
  const nord = (g, x, y, s) => { for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.lineTo(s * 0.32, s * 0.32); g.lineTo(0, s); g.lineTo(-s * 0.32, s * 0.32); g.closePath(); g.fill(); g.restore(); } };
  P.layer((g) => { nord(g, -7.6, 27.2, 1.0); nord(g, 7.6, 27.2, 1.0); nord(g, -7.6, 4.6, 0.85); nord(g, 7.6, 4.6, 0.85); }, C.cream, { lip: 1, shadow: 0.9 });
  // the wreath: a ring of fat leaves in two greens, red berries, a red bow
  const cx = 0, cy = 17.6, R = 6.0;
  P.layer((g) => { g.beginPath(); g.arc(cx, cy, R + 1.2, 0, Math.PI * 2); g.arc(cx, cy, R - 1.2, 0, Math.PI * 2, true); g.fill('evenodd'); }, C.pineD, { lip: 0.8, shadow: 1.2 });
  P.layer((g) => { for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2, rr = R + (i % 2 ? 0.55 : -0.5); g.fillStyle = i % 3 ? C.pine : C.pineL; fillLeaf(g, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1.6, a + Math.PI / 2 + (i % 2 ? 0.5 : -0.4), 0.34); } }, C.pine, { lip: 1, shadow: 1 });
  P.layer((g) => { for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + 0.2, rr = R + (r() - 0.5) * 1.2; disc(g, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 0.3); disc(g, cx + Math.cos(a + 0.08) * (rr + 0.35), cy + Math.sin(a + 0.08) * (rr + 0.35), 0.24); } }, C.berry, { lip: 1, shadow: 1 });
  P.layer((g) => { const y = cy - R - 0.2; poly(g, [[cx, y], [cx - 2.0, y + 1.1], [cx - 2.2, y - 0.9]]); poly(g, [[cx, y], [cx + 2.0, y + 1.1], [cx + 2.2, y - 0.9]]); poly(g, [[cx - 0.2, y], [cx - 1.3, y - 2.6], [cx - 0.5, y - 2.4]]); poly(g, [[cx + 0.2, y], [cx + 1.3, y - 2.6], [cx + 0.5, y - 2.4]]); disc(g, cx, y, 0.5); }, C.redL, { lip: 1, shadow: 1.2 });
  P.draw((g) => {
    textAt(g, 'Merry', cx, cy + 0.9, { size: 2.6, font: 'Mountains of Christmas', weight: '700', color: C.cream, align: 'center' });
    textAt(g, 'Christmas', cx, cy - 1.7, { size: 2.3, font: 'Mountains of Christmas', weight: '700', color: C.cream, align: 'center' });
    textAt(g, '숲속의 크리스마스', cx, 6.3, { size: 1.55, font: 'Jua', color: C.cream, align: 'center' });
  });
  P.innerShade('#3a0806', { alpha: 0.35, blurPx: 22 });
}
export const NOTE = { w: 13.4, h: 10.2 };
export function notePiece(m, wrapLines) {
  const { w, h } = NOTE, pts = P2.shape.rect(w, h);
  const paint = (P) => {
    P.fill(C.cream);
    P.felt(0.3);
    // a candy-stripe border, red and white, then the writing paper
    P.layer((g) => { g.save(); g.beginPath(); g.rect(-w / 2, 0, w, h); g.rect(-w / 2 + 0.7, 0.7, w - 1.4, h - 1.4); g.clip('evenodd');
      for (let x = -w; x < w; x += 0.7) { g.beginPath(); g.moveTo(x, -1); g.lineTo(x + 0.35, -1); g.lineTo(x + 0.35 + h + 2, h + 1); g.lineTo(x + h + 2, h + 1); g.closePath(); g.fill(); } g.restore(); }, C.red, { lip: 0.4, shadow: 0.3 });
    P.layer((g) => rect(g, -w / 2 + 0.85, 0.85, w - 1.7, h - 1.7, 0.1), '#fbf5e6', { lip: 1, shadow: 1.2, rim: 0.4 });
    P.draw((g) => { g.strokeStyle = 'rgba(160,120,90,0.2)'; g.lineWidth = 0.035; for (let y = 1.9; y < h - 1.4; y += 1.05) { g.beginPath(); g.moveTo(-w / 2 + 1.4, y); g.lineTo(w / 2 - 1.4, y); g.stroke(); } });
    P.layer((g) => { holly(g, w / 2 - 1.3, h - 1.35, 0.85, 0.9); }, C.pine, { lip: 1, shadow: 1 });
    P.layer((g) => { disc(g, w / 2 - 1.45, h - 1.3, 0.2); disc(g, w / 2 - 1.15, h - 1.45, 0.2); disc(g, w / 2 - 1.2, h - 1.1, 0.18); }, C.berry, { lip: 1, shadow: 0.8 });
    const box = { x0: -w / 2 + 1.45, x1: w / 2 - 1.35, y0: 1.2, y1: h - 1.2 };
    box.w = box.x1 - box.x0; box.h = box.y1 - box.y0;
    P.draw((g) => {
      const { s, lines } = fitMessage(g, m, box, { wrapLines, size: 1.9, maxLines: 4 });
      const ts = s * 0.85, lh = s * 1.15;
      textAt(g, m.to, box.x0, box.y1 - ts * 0.85, { size: ts, color: '#2f5a40' });
      const room = (box.y1 - ts * 1.2) - (box.y0 + ts * 1.15), blockH = lines.length * lh;
      let y = box.y1 - ts * 1.2 - (room - blockH) / 2 - s * 0.88;
      for (const ln of lines) { textAt(g, ln, box.x0 + 0.3, y, { size: s, color: C.ink }); y -= lh; }
      textAt(g, m.from, box.x1, box.y0 + ts * 0.2, { size: ts, color: C.redD, align: 'right' });
    });
    P.innerShade('#5a3a20', { alpha: 0.18, blurPx: 10 });
  };
  return { pts, paint };
}
