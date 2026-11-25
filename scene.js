// Christmas Eve pop-up card: a snowy hamlet at dusk around a decorated village tree, built with the papercraft kit.
//
// PAPER SPEC
// BRIEF    a Christmas pop-up card that opens into a snowy village on Christmas Eve; warm, cosy, calm; must-haves: a
//          decorated tree, lit cottages, snow falling, Santa, gifts, a greeting; must-nots: sky or horizon, gloss, a table
// SUBJECT  the village tree with its star in the plaza, the greeting banner in front of it; Santa with his sack on the lane
// STOCK    cool white cardstock (snow), fibre quiet; prints are layered card collages
// PALETTE  snow ground #e4e5e6 / #d5d9e2, lead family spruce greens #2f5a46 #3c6b52, accents berry red #b23a32 and
//          gold #d9a441, cream #f3ede0, ink plum #2e2230, shadow tint lilac-blue #55609e, haze #b8b6d0
// LIGHT    low warm key #ffc4a0 from the left (az ~60 deg off camera, elev ~27 deg), cool violet-blue fill #8a92c8 ~0.4,
//          lit windows and lamps glow (dusk set)
// LENS     fov 26, pitch 47, sharp band ~40 % across tree + lane, big blurred pines and drifts at the bottom edge
// FORMAT   test: 1920x1080 30 fps, 6 s (rise + snow); later 1080x1920 Shorts
// GROUND   snow sheet: cool washes, a trodden lane with sled runner tracks and footprints, the plaza, blue drift marks
// LAYOUT   the lane enters bottom right, bends past the plaza and leaves top left; cottages ring the plaza; pine woods fill
// MOTION   template hinges, rises nearest-first, idle sway small
// LIFE     falling snow, chimney smoke, grazing reindeer
// TYPES    crosses (village tree, pines), box folds (cottages), layered cards (drifts, hills), single cards (props)
// SOUND    none for the test
// BANNED   look.md section 12 tells; no grey shadows; no white halos; no saturated green
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { makeCard, layeredCard, clusterLayout, boxFold } from 'papercraft/lib/paperkit-3d.js';
import { createLife } from 'papercraft/lib/paper-life.js';
import { createHarness, MOODS } from './harness.js';

// ---- 1. palette -----------------------------------------------------------------------------------------------------
const C = {
  ground: '#e4e5e6', washA: '#d5d9e2', washB: '#eceae4', washC: '#dcdfe8', lane: '#cdd2dc', laneDeep: '#aab3c6', plaza: '#d3d7e0',
  spruce: '#2f5a46', spruceB: '#3c6b52', pine: '#35574a', pineB: '#456752', snow: '#f4f2ec', snowShade: '#c9cfdd',
  red: '#b23a32', redDeep: '#86302c', gold: '#d9a441', cream: '#f3ede0', ink: '#2e2230', trunk: '#6b4a34',
  wallA: '#e6d6ba', wallB: '#b65a42', wallC: '#8f9c8a', wallD: '#d9b98c', roof: '#7a4a3e', window: '#ffc35a', door: '#3f6a4e',
  deer: '#9a6a44', stone: '#8d93a6', hill: '#a9b3c8',
};

const lane = P2.pathLine([[34, 26], [22, 12], [12, 3], [7, -4], [5, -11], [-2, -20], [-14, -28], [-26, -40], [-40, -52]]);
const PLAZA = { x: -3, z: -11, r: 6.4 };
const HERO_AT = [10.4, 1.4];

const EVE = { key: '#ffc4a0', ki: 3.1, dir: [-0.85, 0.5, 0.5], fill: '#8a92c8', fi: 1.2, sky: '#b4b8de', skyG: '#5a5a80', si: 1.0, leak: '#55609e', glow: 1.25, lamp: 6,
  post: { exposure: 1.02, tint: [1.0, 0.98, 1.02], saturation: 0.96, haze: '#b8b6d0', hazeStart: 24, hazeEnd: 80, hazeAmount: 0.35, vignette: 0.12, vignetteColor: '#1a1838', shadowTint: '#2a3060' } };

const URLQ = new URLSearchParams(location.search), PITCH = +URLQ.get('pitch') || 34;   // camera tilt: lower = seen more from the front
const H = createHarness({ ground: C.ground, stock: '#f1f1ee', view: { pitch: PITCH, dist: 66, target: [1, 1.5, -8] }, bounds: { x0: -64, x1: 64, z0: -62, z1: 38 },
  play: true, walkArea: { x0: -18, x1: 22, z0: -24, z1: 7 }, camBox: { x0: -1, x1: 5, z0: -10, z1: -6 }, subject: HERO_AT,
  focus: [2, 2, -6], moods: { ...MOODS, eve: EVE }, mood: 'eve' });
const { walk, flags } = H;
let RES = 1;
const popup = (pts, paint, o = {}) => H.popup(pts, paint, { res: RES, ...o });

// ---- 2. the printed ground: snow ------------------------------------------------------------------------------------
H.printGround(({ g, ppu, X, Z, rnd, washes, torn, bandOf, line, drifts }) => {
  washes([C.washA, C.washB, C.washC, C.washB]);
  // the plaza: a round of trodden snow, a darker ring of footprints round the tree
  const ring = (r, k = 1) => Array.from({ length: 48 }, (_, i) => { const a = i / 48 * Math.PI * 2, w = 1 + 0.05 * Math.sin(a * 3 + 1) + 0.04 * Math.sin(a * 7); return [PLAZA.x + Math.cos(a) * r * w, PLAZA.z + Math.sin(a) * r * w * k]; });
  torn(ring(PLAZA.r, 0.82), C.plaza, 'rgba(255,255,255,0.75)');
  // the lane: compacted snow, two sled runner tracks, footprints
  torn(bandOf(lane.pts, (t) => 1.55 + Math.sin(t * 19) * 0.12), C.lane, 'rgba(255,255,255,0.8)');
  for (const off of [-0.55, 0.55]) {
    const pts = lane.pts.map(([x, z], i) => { const [ax, az] = lane.pts[Math.max(0, i - 1)], [bx, bz] = lane.pts[Math.min(lane.pts.length - 1, i + 1)], tx = bx - ax, tz = bz - az, n = Math.hypot(tx, tz) || 1; return [x - tz / n * off, z + tx / n * off]; });
    line(pts, 0.16, P2.rgba(C.laneDeep, 0.55));
  }
  for (let i = 2; i < lane.pts.length - 1; i += 2) {   // footprints, alternating sides
    const [x, z] = lane.pts[i], [bx, bz] = lane.pts[i + 1], tx = bx - x, tz = bz - z, n = Math.hypot(tx, tz) || 1, s = (i / 2) % 2 ? 1 : -1;
    g.fillStyle = P2.rgba(C.laneDeep, 0.5);
    g.beginPath(); g.ellipse(X(x + tz / n * 0.2 * s), Z(z - tx / n * 0.2 * s), 0.13 * ppu, 0.22 * ppu, Math.atan2(tz, tx) + Math.PI / 2, 0, 7); g.fill();
  }
  for (let k = 0; k < 160; k++) {   // footprints round the tree
    const a = rnd() * 6.283, r = PLAZA.r * (0.45 + rnd() * 0.45), x = PLAZA.x + Math.cos(a) * r, z = PLAZA.z + Math.sin(a) * r * 0.82;
    g.fillStyle = P2.rgba(C.laneDeep, 0.35); g.beginPath(); g.ellipse(X(x), Z(z), 0.12 * ppu, 0.2 * ppu, a, 0, 7); g.fill();
  }
  // drift marks: blue-lilac curved shadows of wind-blown snow, and pale sparkles, gathered in drifts
  drifts((x, y) => {
    if (rnd() < 0.7) { g.strokeStyle = P2.rgba(rnd() < 0.5 ? '#aab3cc' : '#bcc2d6', 0.55); g.lineWidth = 1.6 + rnd() * 1.4; const l = 6 + rnd() * 10; g.beginPath(); g.moveTo(x - l, y); g.quadraticCurveTo(x, y - 3 - rnd() * 3, x + l, y); g.stroke(); }
    else { g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(x, y, 1.2 + rnd() * 1.2, 0, 7); g.fill(); }
  });
});

// ---- 3. the pieces --------------------------------------------------------------------------------------------------
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

// snow drift: two layered mounds, the back one cooler
function drift(x, z, { w = between(3.5, 5.5), yaw = 0, scale = 1 } = {}) {
  const node = layeredCard([
    { pts: P2.roughen(P2.shape.mound(rnd, { w, h: w * 0.32, lobes: 4, depth: 0.16 }), rnd), paint: (P) => { P.gradient('#e8ebf2', '#c9cfde', 0); P.felt(0.4); P.marks('wave', { color: '#aab3cc', alpha: 0.4, size: 0.12 }); P.innerShade('#55609e', { alpha: 0.3, blurPx: 10 }); } },
    { pts: P2.roughen(P2.shape.mound(rnd, { w: w * 0.7, h: w * 0.2, lobes: 3, depth: 0.12 }), rnd), paint: (P) => { P.gradient('#fbfaf6', '#e2e4ec', 0); P.felt(0.3); P.marks('dot', { color: '#ffffff', alpha: 0.8, size: 0.04, density: 0.4 }); P.innerShade('#55609e', { alpha: 0.2, blurPx: 8 }); }, z: 0.4 },
  ], H.cardOpts(x, z, scale, null, RES));
  return popup(null, null, { node, height: w * 0.32, x, z, yaw, scale });
}
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
const paintFront = (wall, wallH, windows) => (P) => {
  const { box, r } = P, cx = (box.x0 + box.x1) / 2;
  P.gradient(P2.shade(wall, 0.07), P2.shade(wall, -0.09), 0.5); P.felt(0.8);
  P.marks('brick', { color: P2.shade(wall, -0.3), alpha: 0.18, size: 0.07 });
  P.layer((g) => g.fillRect(box.x0 - 1, box.y0 - 1, box.w + 2, wallH * 0.12 + 1), P2.shade(wall, -0.25), { lip: 0.8, depth: 0.8 });
  const ww = box.w * 0.17, wh = wallH * 0.3, dw = box.w * 0.2, dh = wallH * 0.52, dx = windows === 2 ? cx : cx + box.w * 0.22;
  const xs = windows === 1 ? [cx - box.w * 0.22] : [box.x0 + box.w * 0.2, box.x1 - box.w * 0.2];
  for (const x of xs) winPane(P, x, wallH * 0.45, ww, wh, '#5a3424');
  P.layer((g) => { g.beginPath(); g.moveTo(dx - dw / 2, box.y0); g.lineTo(dx - dw / 2, dh - dw / 2); g.arc(dx, dh - dw / 2, dw / 2, Math.PI, 0, true); g.lineTo(dx + dw / 2, box.y0); g.closePath(); g.fill(); }, C.door, { lip: 0.8 });
  P.layer((g) => { g.beginPath(); g.arc(dx, dh * 0.72, dw * 0.3, 0, 7); g.arc(dx, dh * 0.72, dw * 0.17, 0, 7, true); g.fill(); }, C.spruceB, { lip: 0.9 });
  P.layer((g) => { g.beginPath(); g.ellipse(dx - dw * 0.1, dh * 0.6, dw * 0.1, dw * 0.06, 0.5, 0, 7); g.ellipse(dx + dw * 0.1, dh * 0.6, dw * 0.1, dw * 0.06, -0.5, 0, 7); g.fill(); }, C.red, { lip: 0.7 });
  // a string of lights under the eave: a dark wire and coloured bulbs that glow
  const yl = wallH * 0.9, bulbs = [];
  for (let i = 0; i <= 10; i++) { const x = box.x0 + box.w * (0.06 + 0.88 * i / 10); bulbs.push([x, yl - Math.sin(i / 10 * Math.PI * 3) ** 2 * wallH * 0.05]); }
  P.draw((g) => { g.strokeStyle = '#2e2230'; g.lineWidth = wallH * 0.012; g.beginPath(); bulbs.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    ['#ff6a50', '#ffd25a', '#8fe0b0', '#ffd25a'].forEach((c, j) => { g.fillStyle = c; bulbs.filter((_, i) => i % 4 === j).forEach(([x, y]) => { g.beginPath(); g.arc(x, y - wallH * 0.03, wallH * 0.028, 0, 7); g.fill(); }); }); });
  P.glow((gc) => bulbs.forEach(([x, y]) => { gc.beginPath(); gc.arc(x, y - wallH * 0.03, wallH * 0.03, 0, 7); gc.fill(); }));
  P.innerShade(P2.shade(wall, -0.6), { alpha: 0.28, blurPx: 10 });
};
const paintGable = (wall, wallH) => (P) => {
  const { box } = P; P.gradient(P2.shade(wall, 0.05), P2.shade(wall, -0.12), 0.5); P.felt(0.8);
  P.marks('brick', { color: P2.shade(wall, -0.3), alpha: 0.18, size: 0.07 });
  const cx = (box.x0 + box.x1) / 2, ww = Math.min(box.w * 0.22, wallH * 0.26);
  winPane(P, cx, wallH * 0.42, ww, ww * 1.2, '#5a3424');
  P.innerShade(P2.shade(wall, -0.6), { alpha: 0.3, blurPx: 10 });
};
const paintSnowRoof = (P) => {
  const { box } = P;
  P.gradient('#f7f6f2', '#dfe2ea', 0); P.felt(0.5);
  P.layer((g) => g.fillRect(box.x0 - 1, box.y0 - 1, box.w + 2, box.h * 0.1 + 1), C.roof, { lip: 0.6 });   // the roof's edge under the snow
  P.layer((g) => { g.beginPath(); g.moveTo(box.x0 - 1, box.y0 + box.h * 0.2); const n = 9, sw = (box.w + 2) / n; for (let i = 0; i < n; i++) { const x0 = box.x0 - 1 + i * sw; g.quadraticCurveTo(x0 + sw / 2, box.y0 + box.h * (0.04 + (i % 2) * 0.03), x0 + sw, box.y0 + box.h * 0.2); } g.lineTo(box.x1 + 1, box.y1 + 1); g.lineTo(box.x0 - 1, box.y1 + 1); g.closePath(); g.fill(); }, '#f9f8f4', { lip: 0.7, shadow: 1.2 });
  P.marks('scallop', { color: '#b8c0d4', alpha: 0.35, size: 0.12, region: { ...box, y0: box.y0 + box.h * 0.25 } });
  P.innerShade('#55609e', { alpha: 0.25, blurPx: 8 });
};
function cottage(x, z, { w = 5, d = 4, wallH = 3.4, roofH = 2.6, wall = C.wallA, windows = 2, yaw = 0, seed = 71 } = {}) {
  const print = H.cardOpts(x, z);
  const node = boxFold({ w, d, wallH, roofH, paper: H.paper, seed, print, paints: { front: paintFront(wall, wallH, windows), gable: paintGable(wall, wallH), roof: paintSnowRoof } });
  const cw = w * 0.13, chH = roofH * 0.7;
  const ch = makeCard(P2.shape.rect(cw, chH), { paper: H.paper, thickness: 0.08, edgeWidth: 0.06, back: 'kraft', seed: seed + 11, folds: ['bottom'], pxPerUnit: print.pxPerUnit ?? 64, effects: print.effects ?? 1,
    paint: (P) => { P.gradient('#a8583a', '#7e4030', 0.5); P.marks('brick', { color: '#3a1a10', alpha: 0.5, size: 0.12 }); P.layer((g) => g.fillRect(P.box.x0 - 1, P.box.y1 - P.box.h * 0.14, P.box.w + 2, P.box.h * 0.14 + 1), C.snow, { lip: 0.6 }); } });
  ch.position.set(-w * 0.24, -roofH * 0.2, 0); node.userData.ridge.add(ch);
  const h = popup(null, null, { node, height: wallH + roofH, x, z, yaw, solid: Math.min(w, d) * 0.7 });
  H.glowing(h.group); H.lamp(x + Math.sin(yaw) * (d / 2 + 0.8), 2.0, z + Math.cos(yaw) * (d / 2 + 0.8), 1, 9);
  LIFE.chimneys.push({ object: ch, offset: [0, chH * 1.02, 0] });
  return h;
}

// far hills: snowy ridges stepping back, cooler and paler toward the back
const ridge = (k) => { const w = 16 - k * 2, h = 7 - k * 1.4; return [P2.roughen(P2.shape.hill(rnd, { w, h, bumps: 2 }), rnd), (P) => {
  const c = P2.mix(C.hill, '#eef0f6', k * 0.3); P.gradient(P2.shade(c, 0.1), P2.shade(c, -0.12), 0); P.felt(0.5);
  P.layer((g) => { const { box } = P; g.beginPath(); g.moveTo(box.x0, box.y1 - box.h * 0.35); for (let i = 0; i <= 12; i++) g.lineTo(box.x0 + box.w * i / 12, box.y1 - box.h * (0.3 + 0.12 * Math.sin(i * 1.7 + k))); g.lineTo(box.x1, box.y1 + 1); g.lineTo(box.x0, box.y1 + 1); g.closePath(); g.fill(); }, '#f5f4f0', { lip: 0.6 });
  P.marks('tick', { color: P2.shade(c, -0.35), alpha: 0.3, size: 0.04, angle: 0.3 }); P.innerShade('#3a4070', { alpha: 0.3, blurPx: 10 }); }]; };

// ---- the hero: Santa, a small 3D paper model (the template's construction, Santa's own prints) ----------------------
const santaDoll = () => {
  const g = new H.THREE.Group(), body = new H.THREE.Group(); g.add(body);
  const PROFILE = -Math.PI / 2, T = 0.05, GAP = 0.03, SIDE = 0.01;
  const card = ([pts, paint], seed, { x = 0, y = 0, z = 0, ry = 0, parent = body, back = 'mirror', name = '', cut = null } = {}) => {
    const m = makeCard(pts, { paint, paper: H.paper, thickness: T, edgeWidth: 0.04, pxPerUnit: 64, seed, back, folds: [], geomPts: cut });
    m.position.set(x, y, z); m.rotation.y = ry; m.name = name; parent.add(m); return m;
  };
  const ext = ([pts]) => pts.reduce((e, [x, y]) => ({ x0: Math.min(e.x0, x), x1: Math.max(e.x1, x), y0: Math.min(e.y0, y), y1: Math.max(e.y1, y) }), { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity });
  const behind = (piece, z0) => z0 - T / 2 - GAP - ext(piece).x1;
  const band = (pts, lo, hi, k = 1) => [[lo, 1], [hi, -1]].reduce((poly, [v, s]) => {
    const out = [], ok = (p) => s * (p[k] - v) >= 0;
    poly.forEach((a, i) => { const b = poly[(i + 1) % poly.length]; if (ok(a)) out.push(a); if (ok(a) !== ok(b)) { const t = (v - a[k]) / (b[k] - a[k]); out.push(k ? [a[0] + (b[0] - a[0]) * t, v] : [v, a[1] + (b[1] - a[1]) * t]); } });
    return out;
  }, pts);
  const plain = (c) => (P) => { P.gradient(P2.shade(c, 0.08), P2.shade(c, -0.1), 0.5); P.felt(); P.innerShade(P2.shade(c, -0.5), { alpha: 0.25, blurPx: 8 }); };
  const coat = '#b8342e', coatSide = '#9c2c28', fur = '#f4eee2', belt = '#2e2226', boots = '#2e2226', skin = '#f1d3b4', beard = '#f6f2ea', mitt = '#3f6a4e';
  const Z = { hat: 0.16, face: 0.08, jacket: 0, legs: -0.16 };
  const coatFront = P2.drawnPiece((gg, ink) => {
    gg.fillStyle = ink(coat); D.rect(gg, -0.4, 0, 0.8, 1.28, 0.24);
    gg.fillStyle = ink(fur); D.rect(gg, -0.42, 0, 0.84, 0.16, 0.08); D.rect(gg, -0.08, 0.1, 0.16, 1.16, 0.06);
    gg.fillStyle = ink(belt); D.rect(gg, -0.4, 0.5, 0.8, 0.14, 0.03);
    gg.fillStyle = ink(C.gold, 'print'); D.rect(gg, -0.1, 0.5, 0.2, 0.14, 0.03); gg.fillStyle = ink(belt, 'print'); D.rect(gg, -0.05, 0.54, 0.1, 0.06);
  }, { w: 0.9, h: 1.3, name: 'coat' });
  const coatY = 0.78, jx = ext(coatFront), coatTop = coatY + jx.y1;
  card(coatFront, 301, { y: coatY, z: Z.jacket, back: plain(P2.shade(coat, -0.06)), name: 'coat' });
  const coatSidePiece = P2.drawnPiece((gg, ink) => { gg.fillStyle = ink(coatSide); D.rect(gg, -0.24, 0, 0.48, 1.24, 0.18); gg.fillStyle = ink(fur); D.rect(gg, -0.25, 0, 0.5, 0.14, 0.06); gg.fillStyle = ink(belt); D.rect(gg, -0.24, 0.5, 0.48, 0.14); }, { w: 0.55, h: 1.3, name: 'coat side' });
  const TORSO = 0.32, coatSideZ = behind(coatSidePiece, Z.jacket), coatBack = Z.jacket - T / 2 - GAP - TORSO;
  card(coatSidePiece, 302, { y: 0.8, z: coatSideZ, ry: PROFILE, name: 'coat side', cut: band(coatSidePiece[0], coatBack - coatSideZ, 9, 0) });
  const legFront = (i) => P2.drawnPiece((gg, ink) => { gg.fillStyle = ink(coat); D.rect(gg, -0.1, 0.24, 0.2, 0.74, 0.05); gg.fillStyle = ink(boots); D.rect(gg, -0.12, 0, 0.24, 0.3, 0.07); gg.fillStyle = ink(fur); D.rect(gg, -0.12, 0.26, 0.24, 0.07, 0.03); }, { w: 0.3, h: 1.0, name: `leg ${i}` });
  const legSide = (i) => P2.drawnPiece((gg, ink) => { gg.fillStyle = ink(coatSide); D.rect(gg, -0.1, 0.24, 0.2, 0.74, 0.05); gg.fillStyle = ink(boots); D.rect(gg, -0.1, 0, 0.32, 0.3, 0.08); gg.fillStyle = ink(fur); D.rect(gg, -0.1, 0.26, 0.24, 0.07, 0.03); }, { w: 0.45, h: 1.0, name: `leg ${i} side` });
  const hipX = ext(legFront(0)).x1 + T / 2 + SIDE;
  const legs = [-hipX, hipX].map((x, i) => {
    const hip = new H.THREE.Group(); hip.position.set(x, 0.95, Z.legs); body.add(hip);
    const side = legSide(i);
    card(legFront(i), 310 + i, { y: -0.97, parent: hip, name: `leg ${i}` });
    card(side, 320 + i, { y: -0.97, z: behind(side, 0), ry: PROFILE, parent: hip, name: `leg ${i} side` });
    return hip;
  });
  // the face with a big white beard hanging onto the chest (in front of the coat), a moustache, rosy cheeks
  const face = P2.drawnPiece((gg, ink) => {
    gg.fillStyle = ink(beard); D.ell(gg, 0, 0.37, 0.34, 0.36); D.rect(gg, -0.34, 0.35, 0.68, 0.3, 0.1);
    gg.fillStyle = ink(skin); D.ell(gg, 0, 0.73, 0.3, 0.26);
    gg.fillStyle = ink(beard); D.ell(gg, -0.12, 0.59, 0.14, 0.06, 0.2); D.ell(gg, 0.12, 0.59, 0.14, 0.06, -0.2);
    gg.fillStyle = ink('#2a1608', 'print'); D.ell(gg, -0.11, 0.77, 0.035, 0.045); D.ell(gg, 0.11, 0.77, 0.035, 0.045);
    gg.fillStyle = ink('#e59a86', 'print'); D.ell(gg, -0.2, 0.69, 0.06, 0.04); D.ell(gg, 0.2, 0.69, 0.06, 0.04); D.ell(gg, 0, 0.68, 0.05, 0.045);
  }, { w: 0.8, h: 1.06, name: 'face' });
  card(face, 304, { y: 1.62, z: Z.face, back: plain(beard), name: 'face' });
  const hatY = 2.5, headY = 1.9;
  const headSide = P2.drawnPiece((gg, ink) => { gg.fillStyle = ink(P2.shade(skin, -0.04)); D.ell(gg, 0, 0.45, 0.3, 0.3); gg.fillStyle = ink(beard); D.ell(gg, 0.05, 0.27, 0.26, 0.24); D.ell(gg, -0.12, 0.51, 0.2, 0.22); gg.fillStyle = ink('#2a1608', 'print'); D.ell(gg, 0.2, 0.49, 0.03, 0.045); }, { w: 0.7, h: 0.85, name: 'head side' });
  const headSideZ = behind(headSide, Z.face), headBack = headSideZ + ext(headSide).x0;
  card(headSide, 305, { y: headY, z: headSideZ, ry: PROFILE, name: 'head side', cut: band(headSide[0], coatTop + GAP - headY, hatY - GAP - headY) });
  // the hat: a red cone flopping to one side, a fur band, a pompom
  const hatPiece = (c) => P2.drawnPiece((gg, ink) => {
    gg.fillStyle = ink(c); D.poly(gg, [[-0.32, 0.06], [0.32, 0.06], [0.3, 0.28], [0.5, 0.48], [0.44, 0.58], [0.1, 0.54], [-0.2, 0.4]]);
    gg.fillStyle = ink(fur); D.rect(gg, -0.36, 0, 0.72, 0.15, 0.07); D.ell(gg, 0.5, 0.54, 0.11, 0.1);
  }, { w: 1.3, h: 0.8, name: 'hat' });
  card(hatPiece(coat), 306, { y: hatY, z: Z.hat, name: 'hat' });
  const hatSide = hatPiece(coatSide);
  card(hatSide, 307, { y: hatY, z: behind(hatSide, Z.face), ry: PROFILE, name: 'hat side' });
  const armArt = (c, name) => P2.drawnPiece((gg, ink) => { gg.fillStyle = ink(c); D.rect(gg, -0.1, 0.16, 0.2, 0.64, 0.09); gg.fillStyle = ink(fur); D.rect(gg, -0.11, 0.14, 0.22, 0.09, 0.04); gg.fillStyle = ink(mitt); D.ell(gg, 0, 0.08, 0.1, 0.09); }, { w: 0.3, h: 0.85, name });
  const shoulderX = jx.x1 + ext(armArt(coat, 'arm')).x1 + SIDE;
  const arms = [-shoulderX, shoulderX].map((x, i) => {
    const sh = new H.THREE.Group(); sh.position.set(x, 1.98, Z.jacket); body.add(sh);
    const side = armArt(coatSide, `arm ${i} side`);
    card(armArt(coat, `arm ${i}`), 330 + i, { y: -0.8, parent: sh, name: `arm ${i}` });
    card(side, 340 + i, { y: -0.8, z: behind(side, 0), ry: PROFILE, parent: sh, name: `arm ${i} side` });
    return sh;
  });
  // the sack on his back, gifts poking out at the top
  const sack = (side) => P2.drawnPiece((gg, ink) => {
    gg.fillStyle = ink(C.red); D.rect(gg, -0.18, 0.9, 0.22, 0.26, 0.03); gg.fillStyle = ink(C.spruceB); D.rect(gg, 0.02, 0.92, 0.2, 0.3, 0.03);
    gg.fillStyle = ink(side ? '#b89a6a' : '#c9ac7a'); D.ell(gg, 0, 0.5, side ? 0.24 : 0.36, 0.5); D.rect(gg, side ? -0.2 : -0.3, 0.8, side ? 0.4 : 0.6, 0.18, 0.06);
    gg.fillStyle = ink('#7a5a34', 'print'); D.rect(gg, side ? -0.2 : -0.3, 0.82, side ? 0.4 : 0.6, 0.05);
  }, { w: 0.85, h: 1.3, name: 'sack' });
  const sackSide = sack(true), bs = ext(sackSide), sackY = 0.9, DEPTH = 0.25;
  const sackSideZ = coatBack - GAP - bs.x1, sackZ = sackSideZ + bs.x1 - DEPTH - GAP - T / 2;
  card(sackSide, 361, { x: T + SIDE, y: sackY, z: sackSideZ, ry: PROFILE, name: 'sack side', cut: band(sackSide[0], bs.x1 - DEPTH, 9, 0) });
  card(sack(false), 360, { y: sackY, z: Math.min(sackZ, headBack - T / 2 - GAP), name: 'sack' });
  const legLen = 0.97 * 1.25, stepLen = 1.2, R = stepLen / (2 * legLen);
  const leg = (ph, gait) => { const u = (ph / Math.PI) % 2, A = gait * R; if (u >= 1) return A * (3 - 2 * u); const e = u * u * (3 - 2 * u); return A * (2 * e - 1); };
  g.userData.stride = (walked, gait) => {
    const ph = walked / stepLen * Math.PI, l0 = leg(ph, gait), l1 = leg(ph + Math.PI, gait);
    legs[0].rotation.x = -l0; legs[1].rotation.x = -l1; arms[0].rotation.x = l0 * 0.7; arms[1].rotation.x = l1 * 0.7;
    body.position.y = Math.abs(Math.sin(ph)) * 0.05 * gait;
  };
  return g;
};

// placement helpers
const keepOut = [], mark = (x, z, r) => keepOut.push([x, z, r]);
const free = (x, z, m = 0) => lane.dist(x, z) > 2.2 + m && Math.hypot((x - PLAZA.x), (z - PLAZA.z) / 0.82) > PLAZA.r + m && keepOut.every(([hx, hz, r]) => Math.hypot(x - hx, z - hz) > r + m);
const LIFE = { chimneys: [], creatures: [] };

// ---- 4. ?test: the material on a few cards -------------------------------------------------------------------------
if (flags.TEST) {
  { const doll = santaDoll(); H.setHero(popup(null, null, { node: doll, height: 3.1, x: 2, z: -4, sway: 0.2, scale: 1.25 }), { stride: doll.userData.stride }); }
  popup(...snowPine(9), { x: -3, z: -9, cross: true, sway: 0.5 });
  popup(...snowman(), { x: -1.5, z: -3, yaw: 0.15 });
  popup(...gift(1.2, 0), { x: 4.5, z: -2.5, yaw: -0.2 }); popup(...gift(1.0, 1), { x: 5.6, z: -3.4, yaw: 0.2 });
  drift(7.5, -6);
  cottage(9, -12, { yaw: -0.3, wall: C.wallB });
} else buildWorld();

// ---- 6. life: falling snow, chimney smoke, grazing reindeer ---------------------------------------------------------
if (!flags.TEST) {
  const life = createLife({ scene: H.scene, camera: H.camera, heroHeight: H.heroHeight, seed: 41, wind: [0.5, 0.2] });
  life.fallers({ count: 110, cut: 'flake', colors: ['#ffffff', '#f6f4ee', '#e6ecf6'], size: [0.16, 0.26], fall: [0.35, 0.6], sway: 0.6, tumble: 1.0, land: 9 });
  life.puffs({ at: LIFE.chimneys, perEmitter: 3, life: 4.5, rise: 0.45, size: [0.2, 0.45], colors: ['#eceaf0', '#e0dfe8'] });
  for (const [h, behaviour] of LIFE.creatures) life.critter(h.group, { behaviour, hero: H.hero.group.position, walk: H.walk, roam: 1.0 });
  life.setNight(0.5);
  life.reset(H.target);
  H.onStep((t, dt) => life.update(dt, H.target));
  H.onRestart(() => life.reset(H.target));
}

// ---- 5. the world -------------------------------------------------------------------------------------------------
function buildWorld() {
  // the landmark: the village tree in the plaza, gifts at its foot, the greeting in front
  popup(...villageTree(13.5), { x: PLAZA.x, z: PLAZA.z, cross: true, sway: 0.15 }); mark(PLAZA.x, PLAZA.z, 3.5);
  [[-2.4, 1.6, 1.3, 0], [-1.3, 2.4, 1.0, 1], [1.6, 2.0, 1.2, 2], [2.6, 1.0, 0.9, 3], [0.4, 2.9, 0.8, 4], [-3.0, -0.4, 1.0, 1]].forEach(([dx, dz, s, v]) => popup(...gift(s, v), { x: PLAZA.x + dx, z: PLAZA.z + dz, yaw: (rnd() - 0.5) * 0.6 }));
  popup(...banner(), { x: PLAZA.x - 0.5, z: PLAZA.z + 5.6, yaw: 0.08 }); mark(PLAZA.x - 0.5, PLAZA.z + 5.6, 5);
  mark(PLAZA.x - 0.5, PLAZA.z + 11, 4.5);   // a low clearing in front of the greeting: tall pines there hide it from a lower camera
  // cottages round the plaza, each with a small door scene
  const homes = [[-15, -15, { yaw: 0.4, wall: C.wallA, seed: 71 }], [9, -20, { yaw: -0.35, wall: C.wallB, w: 4.6, d: 3.8, wallH: 3.2, roofH: 2.4, windows: 1, seed: 73 }],
    [-17, -3, { yaw: 0.6, wall: C.wallD, w: 4.4, d: 3.6, wallH: 3.0, roofH: 2.3, windows: 1, seed: 79 }], [17, -9, { yaw: -0.55, wall: C.wallC, seed: 83 }], [-4, -27, { yaw: 0.1, wall: C.wallB, w: 5.4, seed: 89 }]];
  for (const [x, z, o] of homes) { cottage(x, z, o); mark(x, z, 4.4); }
  const DOOR = [['holly', 'gift', 'drift'], ['fence', 'holly'], ['gift', 'snowRock', 'holly'], ['holly', 'gift'], ['drift', 'fence']];
  homes.forEach(([x, z, o], i) => { const yaw = o.yaw, u = (i % 2 ? -1 : 1) * 3.6, v = 3.3, gx = x + u * Math.cos(yaw) + v * Math.sin(yaw), gz = z - u * Math.sin(yaw) + v * Math.cos(yaw); group(gx, gz, DOOR[i], 0.7); mark(gx, gz, 1.8); });
  popup(...snowman(3.4), { x: -10, z: -5.5, yaw: 0.2 }); mark(-10, -5.5, 2);
  popup(...sled(1.4), { x: 14.5, z: -1.5, yaw: -0.4 }); mark(14.5, -1.5, 2.4);
  for (const [x, z, yaw] of [[22, -17, -0.5], [25.5, -13.5, 0.6]]) { LIFE.creatures.push([popup(...reindeer(3), { x, z, yaw }), 'graze']); mark(x, z, 2.2); }
  for (const t of [0.12, 0.25, 0.38]) { const i = Math.floor(t * (lane.pts.length - 1)), [x, z] = lane.pts[i], [bx, bz] = lane.pts[i + 1], n = Math.hypot(bx - x, bz - z) || 1, s = i % 2 ? 1 : -1;
    const lx = x + (bz - z) / n * 2.4 * s, lz = z - (bx - x) / n * 2.4 * s; H.glowing(popup(...lampPost(), { x: lx, z: lz, scale: 1.1 }).group); H.lamp(lx, 4.2, lz + 0.3, 0.8, 9); mark(lx, lz, 1.2); }
  for (const [hx, hz] of [[-30, -40], [24, -42]]) { for (let k = 0; k < 3; k++) popup(...ridge(k), { x: hx + (k - 1) * 1.2, z: hz + k * 1.4 }); mark(hx, hz + 1.4, 7); }
  // the hero on the lane, lower right
  const doll = santaDoll(), hero = popup(null, null, { node: doll, height: 3.1, x: HERO_AT[0], z: HERO_AT[1], sway: 0.2, scale: 1.25 }); H.setHero(hero, { stride: doll.userData.stride });

  // the fill: pine woods where a slow noise is high, groups in the middle, clearings low
  rnd = P2.rng(202);
  const cellSeed = (gx, gz, salt) => (Math.imul(Math.round(gx * 10), 73856093) ^ Math.imul(Math.round(gz * 10), 19349663) ^ Math.imul(salt, 83492791)) >>> 0;
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const lush = (x, z) => 0.5 + 0.26 * Math.sin(x * 0.12 + ph[0]) * Math.sin(z * 0.14 + ph[1]) + 0.18 * Math.sin(x * 0.21 + z * 0.15 + ph[2]);
  const trees = [], placed = [];
  const corridor = (x, z) => z > HERO_AT[1] - 1 && z < HERO_AT[1] + 16 && Math.abs(x - HERO_AT[0]) < 7 + (z - HERO_AT[1]) * 0.35;
  const DRESS = ['drift', 'drift', 'holly', 'holly', 'snowRock', 'snowRock', 'gift', 'sapling', 'sapling'];
  const kindsFor = (n) => { const out = []; while (out.length < Math.min(n, 5)) { const k = DRESS[Math.floor(rnd() * DRESS.length)]; if (!out.includes(k)) out.push(k); } return out; };
  const fill = (see) => { for (let gz = -46; gz <= 18; gz += 3.1) for (let gx = -46; gx <= 46; gx += 3.1) {
    rnd = P2.rng(cellSeed(gx, gz, 19));
    const x = gx + (rnd() - 0.5) * 2.6, z = gz + (rnd() - 0.5) * 2.6, l = lush(x, z);
    if (!see(x, z, 0.12, 4) || l < 0.3 || placed.some(([px, pz]) => Math.hypot(x - px, z - pz) < 3.0)) continue;
    placed.push([x, z]);
    if (l > 0.52 && free(x, z, 1.6) && !corridor(x, z) && trees.every(([tx, tz]) => Math.hypot(x - tx, z - tz) > 4.4)) { trees.push([x, z]); popup(...snowPine(between(7.5, 10.5)), { x, z, cross: true, sway: 0.4 }); }
    else if (free(x, z, 1.0)) group(x, z, kindsFor(3 + Math.floor(rnd() * 3)), 1.0);
  } };
  fill(H.inFrame);
  // big blurred pieces across the bottom edge
  rnd = P2.rng(303);
  for (const [sx, dz, s, kind] of [[-1.05, 5.2, 1.9, 'pine'], [-0.38, 6.7, 1.6, 'drift'], [1.05, 7.2, 2.0, 'pine'], [0.3, 8.2, 1.4, 'drift']]) {
    const p = H.groundAt(sx, -1); if (!p) continue;
    if (kind === 'drift') drift(p.x, p.z + dz, { scale: s }); else popup(...snowPine(9), { x: p.x, z: p.z + dz, cross: true, scale: s, sway: 0.4 });
  }
  const ring = (x, z, m, y) => H.inReach(x, z, 0.02, y) && !H.inFrame(x, z, m, y);
  RES = 0.75; fill(ring); RES = 1;
}

function group(x, z, kinds, size = 1) {
  const ORDER = ['fence', 'drift', 'holly', 'sapling', 'snowRock', 'gift'];
  kinds = kinds.slice().sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  clusterLayout(x, z, { n: kinds.length, size: size * 5.0, seed: Math.round(x * 13 + z * 7) & 1023 }).forEach((c, i) => {
    if (!free(c.x, c.z, 0.2)) return;
    const k = kinds[i], sc = c.scale * size;
    if (k === 'drift') drift(c.x, c.z, { yaw: c.yaw, scale: sc });
    else if (k === 'holly') popup(...holly(), { x: c.x, z: c.z, yaw: c.yaw, scale: sc, sway: 0.3 });
    else if (k === 'snowRock') popup(...snowRock(), { x: c.x, z: c.z, yaw: c.yaw, scale: sc });
    else if (k === 'fence') popup(...fence(), { x: c.x, z: c.z, yaw: c.yaw * 0.6, scale: sc });
    else if (k === 'gift') popup(...gift(0.9 * sc), { x: c.x, z: c.z, yaw: c.yaw });
    else if (k === 'sapling') popup(...snowPine(between(3.2, 4.2)), { x: c.x, z: c.z, cross: true, sway: 0.4 });
  });
}

H.start();
