// Shared paper pieces for the Christmas card (art written for this project; built on the papercraft kit, MIT).
import * as P2 from 'papercraft/lib/paperkit-2d.js';
export const C = {
  ground: '#e4e5e6', washA: '#d5d9e2', washB: '#eceae4', washC: '#dcdfe8', lane: '#cdd2dc', laneDeep: '#aab3c6', plaza: '#d3d7e0',
  spruce: '#2f5a46', spruceB: '#3c6b52', pine: '#35574a', pineB: '#456752', snow: '#f4f2ec', snowShade: '#c9cfdd',
  red: '#b23a32', redDeep: '#86302c', gold: '#d9a441', cream: '#f3ede0', ink: '#2e2230', trunk: '#6b4a34',
  wallA: '#e6d6ba', wallB: '#b65a42', wallC: '#8f9c8a', wallD: '#d9b98c', roof: '#7a4a3e', window: '#ffc35a', door: '#3f6a4e',
  deer: '#9a6a44', stone: '#8d93a6', hill: '#a9b3c8',
};
let rnd = P2.rng(101);
const D = P2.draw2, between = (a, b) => a + rnd() * (b - a);
const star = (g, cx, cy, R, r = R * 0.45, n = 5) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R; (i ? g.lineTo : g.moveTo).call(g, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); };
// a fir tier: a scalloped hem from left to right, then up to the apex
const tier = (g, hw, yb, yt, n, dep) => { g.beginPath(); g.moveTo(-hw, yb + dep); const sw = hw * 2 / n; for (let i = 0; i < n; i++) { const x0 = -hw + i * sw; g.quadraticCurveTo(x0 + sw / 2, yb - dep, x0 + sw, yb + dep); } g.lineTo(0, yt); g.closePath(); g.fill(); };
const dots = (g, list, r) => { g.beginPath(); for (const [x, y, s = 1] of list) { g.moveTo(x + r * s, y); g.arc(x, y, r * s, 0, Math.PI * 2); } g.fill(); };

// the village tree: five spruce tiers, a garland, baubles in three inks, a gold star
const villageTree = (h = 13.5) => {
  const r = P2.rng(17), k = h / 12.6, w = 8.2 * k, tiers = [];
  for (let i = 0; i < 5; i++) tiers.push({ hw: (3.8 - i * 0.66) * k, yb: (1.1 + i * 1.95) * k, yt: (1.1 + i * 1.95 + 3.5 - i * 0.22) * k });
  const top = tiers[4].yt;
  return P2.drawnPiece((g, ink) => {
    g.fillStyle = ink(C.trunk); D.rect(g, -0.45 * k, 0, 0.9 * k, 1.6 * k, 0.1);
    tiers.forEach((t, i) => { g.fillStyle = ink(i % 2 ? C.spruceB : C.spruce); tier(g, t.hw, t.yb, t.yt, 6 - Math.floor(i / 2), 0.22 * k); });
    // snow on the hems: a pale scalloped strip just above each hem
    g.fillStyle = ink(C.snow);
    tiers.forEach((t) => { const n = 6, sw = t.hw * 1.8 / n; g.beginPath(); for (let j = 0; j < n; j++) { const x0 = -t.hw * 0.9 + j * sw; g.moveTo(x0, t.yb + 0.22 * k); g.quadraticCurveTo(x0 + sw / 2, t.yb + 0.55 * k, x0 + sw, t.yb + 0.22 * k); g.quadraticCurveTo(x0 + sw / 2, t.yb + 0.12 * k, x0, t.yb + 0.22 * k); } g.fill(); });
    // garland: cream swags, printed flat
    g.strokeStyle = ink(C.cream, 'print'); g.lineWidth = 0.13 * k;
    tiers.forEach((t) => { const y = t.yb + (t.yt - t.yb) * 0.42, hw = t.hw * 0.62; g.beginPath(); g.moveTo(-hw, y + 0.15); g.quadraticCurveTo(0, y - 0.55 * k, hw, y + 0.15); g.stroke(); });
    // baubles: each colour one layer
    const spots = [];
    tiers.forEach((t) => { const m = 4; for (let j = 0; j < m; j++) { const u = (j + 0.5) / m * 2 - 1, y = t.yb + 0.45 * k + r() * 0.5 * k; spots.push([u * t.hw * 0.78, y, 0.9 + r() * 0.3]); } });
    for (const [col, sel] of [[C.red, 0], [C.gold, 1], [C.cream, 2]]) { g.fillStyle = ink(col); dots(g, spots.filter((_, i) => i % 3 === sel), 0.3 * k); }
    g.fillStyle = ink('#fff6dc', 'print'); dots(g, spots.map(([x, y, s]) => [x - 0.09 * k, y + 0.09 * k, s * 0.3]), 0.3 * k);
    g.fillStyle = ink(C.gold); star(g, 0, top + 0.35 * k, 0.95 * k);
    g.fillStyle = ink('#f7d98a', 'print'); star(g, -0.05 * k, top + 0.4 * k, 0.45 * k);
  }, { w: w + 0.4, h: top + 1.5 * k, name: 'village tree' });
};

// a snowy pine: dark spruce tiers with cream snow caps (seeded variants)
const snowPine = (h) => {
  const s = Math.floor(rnd() * 1e6), r = P2.rng(s), n = 3 + Math.floor(r() * 2), k = h / 10, tiers = [];
  for (let i = 0; i < n; i++) { const f = i / n; tiers.push({ hw: (3.0 - f * 2.0) * k * (0.92 + r() * 0.16), yb: (1.0 + f * 7.2) * k, yt: (1.0 + f * 7.2 + 4.0 - f * 1.4) * k }); }
  const top = Math.max(...tiers.map((t) => t.yt)), col = r() < 0.5 ? C.pine : C.pineB;
  return P2.drawnPiece((g, ink) => {
    g.fillStyle = ink(C.trunk); D.rect(g, -0.32 * k, 0, 0.64 * k, 1.4 * k, 0.08);
    tiers.forEach((t, i) => { g.fillStyle = ink(i % 2 ? P2.shade(col, 0.08) : col); tier(g, t.hw, t.yb, t.yt, 4 + (i === 0 ? 1 : 0), 0.2 * k); });
    g.fillStyle = ink(C.snow);   // snow caps on the upper slope of each tier, a wavy lower edge
    tiers.forEach((t) => { const yc = t.yt - (t.yt - t.yb) * 0.42, hc = t.hw * 0.42; g.beginPath(); g.moveTo(0, t.yt); g.lineTo(hc, yc); g.quadraticCurveTo(hc * 0.5, yc - 0.35 * k, 0, yc + 0.05); g.quadraticCurveTo(-hc * 0.5, yc - 0.3 * k, -hc, yc); g.closePath(); g.fill(); });
    g.fillStyle = ink(C.snowShade, 'print'); tiers.forEach((t) => { dots(g, [[t.hw * 0.4, t.yb + 0.3 * k], [-t.hw * 0.5, t.yb + 0.35 * k]], 0.1 * k); });
  }, { w: 6.4 * k, h: top + 0.3, name: 'snow pine' });
};

const snowman = (h = 3.4) => { const k = h / 3.4; return P2.drawnPiece((g, ink) => {
  g.fillStyle = ink(C.trunk); D.poly(g, [[-0.6 * k, 1.75 * k], [-1.45 * k, 2.35 * k], [-1.4 * k, 2.48 * k], [-0.55 * k, 1.95 * k]]); D.poly(g, [[0.6 * k, 1.8 * k], [1.4 * k, 2.5 * k], [1.5 * k, 2.4 * k], [0.62 * k, 1.98 * k]]);
  g.fillStyle = ink(C.snow); D.ell(g, 0, 0.82 * k, 0.95 * k, 0.82 * k); D.ell(g, 0, 1.95 * k, 0.68 * k, 0.6 * k); D.ell(g, 0, 2.78 * k, 0.46 * k, 0.44 * k);
  g.fillStyle = ink(C.red); D.rect(g, -0.5 * k, 2.34 * k, 1.0 * k, 0.2 * k, 0.08); D.rect(g, 0.15 * k, 1.85 * k, 0.24 * k, 0.55 * k, 0.06);
  g.fillStyle = ink(C.ink); D.rect(g, -0.5 * k, 3.1 * k, 1.0 * k, 0.12 * k, 0.04); D.rect(g, -0.32 * k, 3.18 * k, 0.64 * k, 0.6 * k, 0.05);
  g.fillStyle = ink(C.red, 'print'); D.rect(g, -0.32 * k, 3.24 * k, 0.64 * k, 0.1 * k);
  g.fillStyle = ink('#e07a2e', 'print'); D.poly(g, [[0, 2.78 * k], [0.42 * k, 2.72 * k], [0, 2.68 * k]]);
  g.fillStyle = ink(C.ink, 'print'); dots(g, [[-0.15 * k, 2.9 * k], [0.15 * k, 2.9 * k], [0, 2.0 * k], [0, 1.75 * k], [0, 1.0 * k]], 0.06 * k);
}, { w: 3.3 * k, h: 3.95 * k, name: 'snowman' }); };

const GIFT = [[C.red, C.gold], [C.spruceB, C.cream], [C.cream, C.red], ['#6a4a78', C.gold], [C.gold, C.red]];
const gift = (s = 1, v = Math.floor(rnd() * GIFT.length)) => { const [box, rib] = GIFT[v % GIFT.length], w = (0.95 + rnd() * 0.4) * s, hh = (0.8 + rnd() * 0.5) * s; return P2.drawnPiece((g, ink) => {
  g.fillStyle = ink(box); D.rect(g, -w / 2, 0, w, hh, 0.03);
  g.fillStyle = ink(P2.shade(box, 0.12)); D.rect(g, -w / 2 - 0.06 * s, hh - 0.18 * s, w + 0.12 * s, 0.22 * s, 0.03);
  g.fillStyle = ink(rib); D.rect(g, -0.08 * s, 0, 0.16 * s, hh + 0.04 * s); D.ell(g, -0.2 * s, hh + 0.14 * s, 0.22 * s, 0.13 * s, 0.4); D.ell(g, 0.2 * s, hh + 0.14 * s, 0.22 * s, 0.13 * s, -0.4);
  g.fillStyle = ink(P2.shade(box, -0.25), 'print'); dots(g, [[-w * 0.3, hh * 0.3], [w * 0.28, hh * 0.55], [-w * 0.25, hh * 0.62], [w * 0.3, hh * 0.2]], 0.05 * s);
}, { w: w + 0.6 * s, h: hh + 0.5 * s, name: 'gift' }); };

const reindeer = (h = 3) => { const k = h / 3; return P2.drawnPiece((g, ink) => {
  g.fillStyle = ink('#6a4a30'); for (const x of [-0.85, -0.55, 0.55, 0.85]) D.rect(g, x * k - 0.09 * k, 0, 0.18 * k, 1.2 * k, 0.05);
  g.fillStyle = ink(P2.shade(C.trunk, -0.1)); const ant = (s) => D.poly(g, [[0.95 * k, 2.45 * k], [(0.95 + 0.25 * s) * k, 3.0 * k], [(0.95 + 0.05 * s) * k, 2.95 * k], [(0.95 + 0.35 * s) * k, 2.75 * k], [(0.95 + 0.4 * s) * k, 2.85 * k], [(0.95 + 0.1 * s) * k, 2.45 * k]]); ant(-1); ant(1);
  g.fillStyle = ink(C.deer); D.ell(g, 0, 1.45 * k, 1.15 * k, 0.48 * k); D.poly(g, [[0.6 * k, 1.5 * k], [0.95 * k, 2.45 * k], [1.25 * k, 2.3 * k], [1.05 * k, 1.4 * k]]); D.ell(g, 1.2 * k, 2.35 * k, 0.32 * k, 0.22 * k, -0.3);
  g.fillStyle = ink(C.cream); D.ell(g, -0.05 * k, 1.15 * k, 0.75 * k, 0.2 * k); D.ell(g, -1.1 * k, 1.6 * k, 0.16 * k, 0.12 * k); D.ell(g, 1.42 * k, 2.25 * k, 0.12 * k, 0.1 * k);
  g.fillStyle = ink(C.red); D.rect(g, 0.68 * k, 1.75 * k, 0.48 * k, 0.16 * k, 0.05);
  g.fillStyle = ink(C.gold, 'print'); dots(g, [[0.92 * k, 1.68 * k]], 0.07 * k);
  g.fillStyle = ink(C.ink, 'print'); dots(g, [[1.2 * k, 2.42 * k]], 0.045 * k);
}, { w: 3.2 * k, h: 3.2 * k, name: 'reindeer' }); };

const lampPost = (h = 4.2) => { const k = h / 4.2; return [P2.fromDrawing((g) => { D.rect(g, -0.1 * k, 0, 0.2 * k, 3.2 * k); D.rect(g, -0.3 * k, 0, 0.6 * k, 0.22 * k); D.rect(g, -0.32 * k, 3.1 * k, 0.64 * k, 0.7 * k, 0.06); D.poly(g, [[-0.42 * k, 3.78 * k], [0, 4.15 * k], [0.42 * k, 3.78 * k]]); D.ell(g, 0, 2.55 * k, 0.42 * k, 0.42 * k); }, { w: 1.2 * k, h: 4.3 * k, name: 'lamp' }),
  (P) => { const { box, g } = P; P.fill('#3a2c38'); P.felt(0.5);
    P.layer((gg) => { gg.beginPath(); gg.arc(0, 2.55 * k, 0.42 * k, 0, 7); gg.arc(0, 2.55 * k, 0.24 * k, 0, 7, true); gg.fill(); }, C.spruceB, { lip: 0.8 });
    P.layer((gg) => { gg.beginPath(); gg.ellipse(-0.1 * k, 2.2 * k, 0.1 * k, 0.16 * k, 0.4, 0, 7); gg.ellipse(0.1 * k, 2.2 * k, 0.1 * k, 0.16 * k, -0.4, 0, 7); gg.fill(); }, C.red, { lip: 0.7 });
    P.draw(() => { g.fillStyle = '#ffd27a'; g.fillRect(-0.22 * k, 3.2 * k, 0.44 * k, 0.5 * k); });
    P.glow((gc) => gc.fillRect(-0.22 * k, 3.2 * k, 0.44 * k, 0.5 * k));
    P.layer((gg) => gg.fillRect(box.x0 - 1, 3.78 * k, box.w + 2, 0.12 * k), C.snow, { lip: 0.5 }); P.innerShade('#140a18', { alpha: 0.4, blurPx: 4 }); }]; };

const sled = (s = 1.4) => P2.drawnPiece((g, ink) => {
  g.fillStyle = ink('#7a4a2e'); D.poly(g, [[-1.0 * s, 1.2 * s], [-0.85 * s, 0.4 * s], [0.95 * s, 0.4 * s], [1.0 * s, 0.75 * s], [0.75 * s, 1.0 * s]]);
  g.fillStyle = ink('#c9b48a'); D.ell(g, 0.05 * s, 1.0 * s, 0.6 * s, 0.6 * s); D.rect(g, -0.12 * s, 1.45 * s, 0.3 * s, 0.25 * s, 0.05);
  g.fillStyle = ink(C.red); D.rect(g, -1.05 * s, 0.4 * s, 2.1 * s, 0.42 * s, 0.08); D.poly(g, [[-1.05 * s, 0.82 * s], [-1.05 * s, 1.35 * s], [-0.8 * s, 1.35 * s], [-0.8 * s, 0.82 * s]]);
  g.fillStyle = ink(C.gold); D.rect(g, -1.25 * s, 0, 2.6 * s, 0.12 * s, 0.06); D.rect(g, -0.75 * s, 0.08 * s, 0.1 * s, 0.36 * s); D.rect(g, 0.65 * s, 0.08 * s, 0.1 * s, 0.36 * s); D.ell(g, 1.3 * s, 0.25 * s, 0.14 * s, 0.25 * s);
  g.fillStyle = ink(C.gold, 'print'); D.rect(g, -0.9 * s, 0.58 * s, 1.8 * s, 0.05 * s); dots(g, [[-0.5 * s, 0.6 * s], [0, 0.6 * s], [0.5 * s, 0.6 * s]], 0.06 * s);
  g.fillStyle = ink(P2.shade('#c9b48a', -0.3), 'print'); D.rect(g, -0.1 * s, 1.4 * s, 0.32 * s, 0.06 * s);
}, { w: 3.0 * s, h: 1.9 * s, name: 'sled' });

// the greeting: a cream board on two posts, berry-red border, holly corners, lettering
const banner = (w = 9.5, hh = 2.1, post = 1.4) => {
  const art = (g, ink) => {
    g.fillStyle = ink(C.trunk); D.rect(g, -w * 0.38, 0, 0.3, post + 0.3); D.rect(g, w * 0.38 - 0.3, 0, 0.3, post + 0.3);
    g.fillStyle = ink(C.red); D.rect(g, -w / 2, post, w, hh, 0.18);
    g.fillStyle = ink(C.cream); D.rect(g, -w / 2 + 0.2, post + 0.2, w - 0.4, hh - 0.4, 0.1);
    g.fillStyle = ink(C.spruceB); for (const sx of [-1, 1]) for (const a of [0.5, 1.3, 2.1]) D.ell(g, sx * (w / 2 - 0.25) + Math.cos(a) * 0.38 * -sx, post + hh - 0.15 + Math.sin(a) * 0.12, 0.42, 0.17, a * 0.6 * sx);
    g.fillStyle = ink(C.red); dots(g, [[-(w / 2 - 0.35), post + hh - 0.05], [-(w / 2 - 0.12), post + hh - 0.22], [w / 2 - 0.35, post + hh - 0.05], [w / 2 - 0.12, post + hh - 0.22]], 0.13);
    g.fillStyle = ink(C.snow); D.rect(g, -w / 2 - 0.1, post + hh - 0.08, w + 0.2, 0.22, 0.11);
  };
  const pts = P2.fromDrawing((g) => art(g, () => '#000'), { w: w + 0.6, h: post + hh + 0.4, name: 'banner' });
  const paint = (P) => {
    P.parts(art);
    P.draw((g) => { g.save(); g.translate(0, post + hh * 0.5); g.scale(0.01, -0.01); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `italic 700 ${Math.round(hh * 38)}px Georgia, 'Times New Roman', serif`; g.fillStyle = C.redDeep; g.fillText('Merry Christmas', 0, 6); g.restore(); });
    P.marks('dot', { color: '#2a1608', alpha: 0.1, size: 0.025, density: 0.4 }); P.innerShade('#3a2010', { alpha: 0.25, blurPx: 8 });
  };
  return [pts, paint];
};

const holly = () => { const w = between(2.4, 3.2); return P2.drawnPiece((g, ink) => {
  g.fillStyle = ink(C.spruce); const m = P2.shape.mound(rnd, { w, h: w * 0.5, lobes: 6, depth: 0.2 }); D.poly(g, m);
  g.fillStyle = ink(C.spruceB); for (let i = 0; i < 9; i++) { const u = (i + 0.5) / 9 * 2 - 1; D.ell(g, u * w * 0.36, w * (0.14 + 0.18 * (1 - u * u)) + (i % 2) * 0.08, 0.34, 0.15, u * 0.9); }
  g.fillStyle = ink(C.snow); D.ell(g, -w * 0.08, w * 0.47, w * 0.26, w * 0.07);
  g.fillStyle = ink(C.red); const b = []; for (let i = 0; i < 4; i++) { const cx = (rnd() - 0.5) * w * 0.6, cy = w * (0.2 + rnd() * 0.18); b.push([cx, cy], [cx + 0.14, cy - 0.06], [cx - 0.06, cy - 0.13]); } dots(g, b, 0.09);
}, { w: w + 0.8, h: w * 0.7, name: 'holly' }); };
const snowRock = () => { const w = between(2.4, 3.6); return P2.drawnPiece((g, ink) => {
  g.fillStyle = ink(C.stone); D.poly(g, P2.shape.mound(rnd, { w, h: w * 0.5, lobes: 3, depth: 0.12 }));
  g.fillStyle = ink(P2.shade(C.stone, -0.18)); D.poly(g, [[w * 0.05, 0], [w * 0.42, 0], [w * 0.3, w * 0.3], [w * 0.1, w * 0.36]]);
  g.fillStyle = ink(C.snow); D.ell(g, -w * 0.05, w * 0.44, w * 0.34, w * 0.1);
}, { w: w + 0.5, h: w * 0.62, name: 'snow rock' }); };
const fence = () => { const w = between(4.4, 5.6), n = 5; return P2.drawnPiece((g, ink) => {
  g.fillStyle = ink('#8a5a3c'); for (let i = 0; i < n; i++) { const x = -w / 2 + 0.2 + i * (w - 0.4) / (n - 1); D.poly(g, [[x - 0.17, 0], [x + 0.17, 0], [x + 0.17, 1.6], [x, 1.85], [x - 0.17, 1.6]]); }
  g.fillStyle = ink('#a06c48'); D.rect(g, -w / 2, 0.45, w, 0.22); D.rect(g, -w / 2, 1.15, w, 0.22);
  g.fillStyle = ink(C.snow); for (let i = 0; i < n; i++) { const x = -w / 2 + 0.2 + i * (w - 0.4) / (n - 1); D.ell(g, x, 1.82, 0.22, 0.1); } D.rect(g, -w / 2, 1.33, w, 0.1, 0.05);
}, { w: w + 0.5, h: 2.1, name: 'fence' }); };

// cottage prints: the front with lit windows, a wreath on the door, a string of lights under the eave
const winPane = (P, x, y, ww, wh, frame) => {
  const fr = ww * 0.12;
  P.layer((g) => g.fillRect(x - ww / 2 - fr, y - fr, ww + 2 * fr, wh + 2 * fr), frame, { lip: 0.8, depth: 0.75 });
  P.draw((g) => { const gr = g.createRadialGradient(x, y + wh / 2, 0, x, y + wh / 2, ww * 0.8); gr.addColorStop(0, '#fff0c0'); gr.addColorStop(1, C.window); g.fillStyle = gr; g.fillRect(x - ww / 2, y, ww, wh); g.fillStyle = frame; g.fillRect(x - fr / 3, y, fr * 0.66, wh); g.fillRect(x - ww / 2, y + wh / 2 - fr / 3, ww, fr * 0.66); });
  P.glow((gc) => gc.fillRect(x - ww / 2, y, ww, wh));
  P.layer((g) => g.fillRect(x - ww / 2 - fr * 1.6, y - fr - ww * 0.12, ww + fr * 3.2, ww * 0.14), C.snow, { lip: 0.6, depth: 0.6 });   // snow on the sill
};
export { rnd, between, D, star, tier, dots, villageTree, snowPine, snowman, gift, reindeer, lampPost, sled, banner, holly, snowRock, fence, winPane };
