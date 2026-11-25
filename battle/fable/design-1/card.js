// design-1 "달빛 썰매" (Moonlit Sleigh): a 90-degree pop-up card with a back wall.
//
// PAPER SPEC
// SUBJECT  a snowy village on Christmas night: the cover lifts to stand as the night sky with a huge rising moon,
//          four rows of card rise parallel to it (village, railway viaduct, two tunnel hills, a snow bank with the
//          letter board), Santa rides round the moon's face, a train crosses the viaduct.
// STOCK    smooth cardstock, quiet fibre.  PALETTE  night navy #131a3d / #3a568f, snow #eef2f8 / #c4d1e8,
//          moon cream #fbeecb, window gold #ffd870, berry red #b93a34, fir teal #24524f, kraft #c58f58.
// LIGHT    a warm desk lamp from the upper left (key ~50 deg up), cool frontal fill, violet-blue shadows.
// LENS     26 deg, the camera cranes from 52 deg (over the closed cover) down to 25 deg (looking into the card).
// TYPES    printed page + back wall on one fold; parallel folds (the rows, paper straps to the row behind);
//          a spinner arm on a pin at the moon's centre (Santa's sleigh); a slider in a slot (the train).
// MOTION   one fold angle drives every hinge (a spring following the hand); arm 17 deg/s; train +-10 cm in 14 s.
// LIFE     paper snow, smoke puffs from the chimneys and the locomotive.
import { createStage, THREE, P2, woodTable, makeSnow, makePuffs, frameExtent, smooth, smoother, lerp } from './stage.js';
import { makeCard, cardClips } from 'papercraft/lib/paperkit-3d.js';
import { getMessage, loadMessageFont, mountMessageUI } from '../../kit/message.js';
import * as A from './art.js';

const C = {
  sky0: '#131a3d', sky1: '#1e2b5c', sky2: '#3a568f', cover: '#18214a',
  moon: '#fbeecb', moonShade: '#ecd7a2',
  snow: '#eef2f8', snowLit: '#fbfcfd', snowShade: '#c4d1e8', snowDeep: '#9fb2d6',
  fir: '#24524f', firLight: '#34726a', firDark: '#173b3d',
  red: '#b93a34', redDark: '#8a2a2c', brick: '#9c4f3d', ochre: '#d9a45a', teal: '#3b7f86', plum: '#5b4a7a',
  cream: '#f6ecd4', kraft: '#c58f58', wood: '#6f4a34', skin: '#f1c7a4',
  gold: '#e3ae45', goldLight: '#f6d580', window: '#ffd870', stone: '#8690b8', stoneLight: '#a7b0d2', stoneDark: '#5f6996',
  ink: '#222a55', dark: '#1b2040',
};
const W = 36, D = 16.4, HW = W / 2;          // two panels of 36 x 16.4 cm
const TH0 = THREE.MathUtils.degToRad(1.3);  // closed, the cover rests on what is folded inside
const ROW = { far: 3.0, mid: 7.4, front: 11.3 };
const MOON = { x: -3.0, y: 8.3, r: 7.4 };      // a huge moon rising behind the village
const ARM = { R: 5.6, a0: -80, speed: 17 };   // the spinner: pinned at the moon's centre; degrees, deg/s
const TRAIN = { y: 5.6, travel: 10, t0: 2.6, half: 7.0 };

const msg = getMessage();
await loadMessageFont();
await loadMessageFont('Gowun Batang');
await Promise.race([Promise.all([
  document.fonts.load('100px "Nanum Pen Script"', `${msg.to}${msg.msg}${msg.from}—To.`),
  document.fonts.load('700 100px "Gowun Batang"', '메리 크리스마스 MERRY CHRISTMAS'),
]).catch(() => 0), new Promise((r) => setTimeout(r, 4000))]);

const stage = createStage({
  bg: '#2a1a14', fov: 26,
  light: { key: '#ffd9ae', keyIntensity: 3.0, keyDir: [-0.7, 1.0, 0.62], fill: '#cfd3f0', fillIntensity: 0.8, fillDir: [0.3, 0.5, 1.0],
    sky: '#e8e4f4', ground: '#7a5a48', skyIntensity: 0.4, target: [0, 3, 2] },
  leak: '#5d4a78',
  lens: { aoTint: '#3a2c50', shadowTint: '#1a1430', vignette: 0.2, vignetteColor: '#120a0c', exposure: 0.86, contrast: 1.15, saturation: 1.02 },
});
const { paper, scene, camera } = stage;
const CARD = { paper, thickness: 0.05, edgeWidth: 0.045, pxPerUnit: 64 };
const NAVY_SHADOW = 'rgba(8,12,40,0.5)';

// one drawing, cut AND printed: build(add) lists parts as add(pass, colour, fn(g)); the cut is their union, the print
// lays the passes down as cut-paper layers
function piece({ w, h, res = 36, name, build }) {
  const ops = [];
  build((pass, color, fn, o = {}) => ops.push({ pass, color, fn, ...o }));
  const pts = P2.fromDrawing((g) => { g.lineCap = g.lineJoin = 'round'; for (const o of ops) if (!o.print) { g.fillStyle = g.strokeStyle = '#000'; o.fn(g); } }, { w, h, res, simplify: 0.7, name });
  const run = (g, pass, tint = true) => { for (const o of ops) if (o.pass === pass) { if (tint) g.fillStyle = g.strokeStyle = o.color; o.fn(g); } };
  return {
    pts,
    layer: (P, pass, opts = {}) => P.layer((g) => run(g, pass), '#000', { depth: 0.7, ...opts }),
    flat: (P, pass) => P.draw((g) => { g.lineCap = g.lineJoin = 'round'; run(g, pass); }),
    glow: (P, pass) => P.glow((g) => run(g, pass, false)),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// the table and what lies on it
// ---------------------------------------------------------------------------------------------------------------
woodTable(stage, { tones: ['#5b4539', '#50392f', '#665043'], gap: '#241812', grainDark: '#2e1f18', grainLight: '#8f7562', plank: 11, seed: 21 });

const lay = (mesh, x, z, rot = 0, y = 0.02) => { mesh.rotation.set(-Math.PI / 2, 0, rot); mesh.position.set(x, y, z); mesh.userData.noFit = true; scene.add(mesh); return mesh; };
{ // the envelope the card came in, a few punched stars
  const env = makeCard(P2.shape.rect(30, 17).map(([x, y]) => [x, y - 8.5]), { ...CARD, thickness: 0.035, seed: 41, folds: [], back: false, contact: null, paint: (P) => {
    P.fill('#b89a72'); P.felt(0.7);
    P.layer([[-15, 8.5], [15, 8.5], [0, -2.5]], '#c4a67e', { depth: 1.2, rim: 0.4, shadow: 1.3 });
    P.layer((g) => A.disc(g, 0, -2.2, 1.25), C.red, { depth: 1.1 });
    P.layer((g) => A.star(g, 0, -2.2, 0.72, 0.3), C.redDark, { depth: 0.4, shadow: 0 });
    P.innerShade('#6a4a2a', { alpha: 0.22, blurPx: 14 });
  } });
  lay(env, 12.5, 7.6, -0.2, 0.019);
  const r = P2.rng(5);
  for (const [x, z, s, col] of [[-23.5, 9.5, 1.0, C.gold], [-21.6, 12.6, 0.62, C.cream], [-24.6, 13.4, 0.5, C.red], [23.4, -3.2, 0.7, C.gold], [-23.0, -6.5, 0.6, C.gold]]) {
    const st = makeCard(A.starPts(0, 0, s, s * 0.46), { ...CARD, thickness: 0.03, seed: 50 + x, folds: [], back: false, contact: null, edgeWidth: 0.03, paint: (P) => { P.fill(col); P.felt(0.5); } });
    lay(st, x, z, r() * 6.28, 0.016);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the card: a base page and the cover that stands up as the back wall
// ---------------------------------------------------------------------------------------------------------------
const card = new THREE.Group(); card.position.set(0, 0.045, -5.4); scene.add(card);   // the fold (spine) runs along x
const rows = [];        // pivots that stay parallel to the wall
const straps = [];      // paper straps that stay level

function paintFloor(P) {                       // x across, y = -z (0 at the fold, -16 at the front edge)
  P.gradient(C.snowShade, C.snow); P.felt(0.6);
  const r = P.r;
  // drifts: paler cut mounds, scalloped
  for (const [x, y, w, h] of [[-10, -5.2, 13, 2.4], [8, -4.6, 14, 2.2], [-2, -9.6, 19, 2.6], [12, -9.8, 10, 2.2], [-12, -13.9, 12, 2.4], [6, -14.4, 18, 2.2]]) {
    P.layer((g) => { g.beginPath(); g.moveTo(x - w / 2, y - h / 2); A.scallops(g, x - w / 2, x + w / 2, y - h / 2, 5, -0.22); g.ellipse(x, y - h / 2, w / 2, h, 0, 0, Math.PI, true); g.fill(); }, P2.mix(C.snow, C.snowLit, 0.6), { depth: 0.7, shadow: 0.7, shadowColor: 'rgba(60,84,150,0.3)', lip: 0.8 });
  }
  // a frozen brook running out under the viaduct to the front right
  const brook = [[2.6, -3.4], [1.2, -6], [3.4, -8.6], [8.5, -10.4], [12.6, -12.6], [14.4, -16.9]];
  const trace = (g) => { g.beginPath(); g.moveTo(...brook[0]); for (let i = 1; i < brook.length - 1; i++) g.quadraticCurveTo(brook[i][0], brook[i][1], (brook[i][0] + brook[i + 1][0]) / 2, (brook[i][1] + brook[i + 1][1]) / 2); g.lineTo(...brook[brook.length - 1]); };
  P.layer((g) => { g.lineWidth = 2.1; g.lineCap = 'round'; trace(g); g.stroke(); }, '#a9c6e6', { depth: 0.6, shadow: 0, lip: 0.4, shade: 1.2 });
  P.draw((g) => { g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.16; g.setLineDash([1.2, 1.9]); g.translate(0.3, 0.2); trace(g); g.stroke(); g.setLineDash([0.7, 2.6]); g.translate(-0.7, -0.3); trace(g); g.stroke(); });
  // printed firs along the front edge, footprints, sparkles
  P.layer((g) => { for (const [x, y, w, h] of [[-15.6, -15.7, 1.5, 2.3], [-13.9, -15.9, 1.2, 1.7], [-6.2, -15.8, 1.3, 1.9], [4.4, -15.9, 1.2, 1.7], [16.2, -15.3, 1.5, 2.2]]) A.fir(g, x, y, w, h, 3, true); }, '#7fa3b7', { depth: 0.4, shadow: 0.6, shadowColor: 'rgba(60,84,150,0.3)' });
  P.draw((g) => {
    g.fillStyle = P2.rgba(C.snowDeep, 0.55);
    for (let i = 0; i < 13; i++) { const u = i / 12, x = -11.6 + u * 9 + Math.sin(u * 5) * 0.7, y = -15.3 + u * 2.6 + (i % 2) * 0.32; A.ell(g, x, y, 0.2, 0.13, 0.3); }
    g.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 100; i++) A.sparkle(g, -HW + 0.5 + r() * (W - 1), -15.6 + r() * 15.2, 0.06 + r() * 0.1);
    g.strokeStyle = P2.rgba(C.snowDeep, 0.5); g.lineWidth = 0.05;        // score lines where the rows are hinged
    for (const d of Object.values(ROW)) { g.beginPath(); g.moveTo(-HW + 0.6, -d); g.lineTo(HW - 0.6, -d); g.stroke(); }
  });
  P.innerShade('#4a5f9a', { alpha: 0.25, blurPx: 18 });
}
const floor = makeCard(P2.shape.rect(W, D).map(([x, y]) => [x, y - D]), { ...CARD, thickness: 0.09, seed: 2, folds: ['top'], contact: null, back: false, paint: paintFloor });
floor.rotation.x = -Math.PI / 2; floor.position.y = 0.045; floor.name = 'floor'; card.add(floor);
const FLOOR_Y = 0.09;

// ---- the wall: night sky inside, the cover outside
function paintSky(P) {
  const r = P.r, inMoon = (x, y, m = 0.5) => Math.hypot(x - MOON.x, y - MOON.y) < MOON.r + m;
  P.gradient(C.sky2, C.sky0); P.felt(0.5);
  P.draw((g) => {                                   // the moon's glow, in steps like stacked tissue
    for (const [rad, a] of [[3.6, 0.07], [2.6, 0.08], [1.7, 0.1], [0.9, 0.12]]) { g.fillStyle = P2.rgba('#a9c0f0', a); A.disc(g, MOON.x, MOON.y, MOON.r + rad); }
    for (let i = 0; i < 190; i++) {                 // stars
      const x = -HW + 0.4 + r() * (W - 0.8), y = 4 + r() * (D - 4.3); if (inMoon(x, y)) continue;
      g.fillStyle = P2.rgba(r() < 0.3 ? C.goldLight : '#f4f1ff', 0.5 + r() * 0.5); A.disc(g, x, y, 0.035 + r() * r() * 0.085);
    }
  });
  P.layer((g) => {                                  // gold foil sparkles
    for (const [x, y, s] of [[-15.6, 13.2, 0.42], [-13.4, 8.4, 0.26], [6.6, 14.6, 0.34], [9.0, 11.0, 0.5], [12.2, 14.3, 0.3], [14.6, 11.6, 0.46], [16.4, 8.2, 0.26], [11.4, 8.4, 0.3], [5.6, 6.6, 0.22], [-16.6, 10.4, 0.2], [15.6, 15.2, 0.2], [-12.2, 14.9, 0.24], [7.2, 8.8, 0.2], [10.4, 12.9, 0.22], [16.8, 13.4, 0.3], [13.4, 9.4, 0.2], [-14.6, 11.4, 0.3]]) if (!inMoon(x, y, 0.8)) A.sparkle(g, x, y, s);
  }, C.goldLight, { depth: 0.35, shadow: 0.8, shadowColor: NAVY_SHADOW });
  // the moon
  P.layer(A.circlePts(MOON.x, MOON.y, MOON.r, 120), C.moon, { depth: 1.6, shadow: 1.5, shadowColor: 'rgba(6,10,36,0.6)', rim: 0.6, felt: 0.5 });
  P.layer((g) => { for (const [dx, dy, rr] of [[-3.0, 3.6, 1.5], [2.6, 4.4, 0.9], [-0.4, 5.9, 0.6], [4.6, 1.9, 0.8], [-5.2, 0.9, 1.0], [3.4, -0.6, 1.5], [-2.2, -0.2, 1.1], [0.6, 2.2, 0.5], [-4.4, 4.9, 0.5], [5.4, 4.0, 0.45]]) A.ell(g, MOON.x + dx, MOON.y + dy, rr, rr * 0.86, 0.4); }, C.moonShade, { depth: 0.4, shadow: 0, lip: 0, shade: 1.4, alpha: 0.7 });
  // far ridges with snow caps (they show between the roofs, in front of the moon)
  const ridge = (y0, amp, seed) => { const q = P2.rng(seed), p = [[-HW - 0.2, 0]]; for (let i = 0; i <= 18; i++) p.push([-HW - 0.2 + i * (W + 0.4) / 18, y0 + amp * (i % 2 ? 1 : 0.15) * (0.6 + q() * 0.6)]); p.push([HW + 0.2, 0]); return p; };
  P.layer(ridge(5.2, 2.4, 4), '#31497f', { depth: 0.9, shadowColor: NAVY_SHADOW, rim: 0.3, rimColor: '#6f8cc4' });
  P.layer(ridge(4.0, 1.9, 9), '#4763a0', { depth: 0.9, shadowColor: NAVY_SHADOW, rim: 0.3, rimColor: '#8aa6da' });
  P.innerShade('#070b26', { alpha: 0.4, blurPx: 26 });
}
function paintCover(P) {                           // x across, y from the opening edge (0) to the fold (16)
  const r = P.r;
  P.fill(C.cover); P.felt(0.7);
  P.draw((g) => {
    for (let i = 0; i < 130; i++) { const x = -HW + 1 + r() * (W - 2), y = 1 + r() * 14; g.fillStyle = P2.rgba(r() < 0.4 ? C.goldLight : '#dfe4ff', 0.35 + r() * 0.5); A.disc(g, x, y, 0.03 + r() * r() * 0.08); }
  });
  P.layer((g) => { g.lineWidth = 0.16; g.beginPath(); g.roundRect(-HW + 0.9, 0.9, W - 1.8, D - 1.8, 0.9); g.stroke(); g.lineWidth = 0.06; g.beginPath(); g.roundRect(-HW + 1.3, 1.3, W - 2.6, D - 2.6, 0.6); g.stroke(); }, C.gold, { depth: 0.4, shadow: 0.7, shadowColor: NAVY_SHADOW });
  P.layer(A.circlePts(0, 10.6, 3.2, 80), C.moon, { depth: 1.2, shadow: 1.4, shadowColor: 'rgba(6,10,36,0.6)', rim: 0.7, felt: 0.5 });
  P.layer((g) => { g.translate(-0.2, 9.3); g.scale(0.68, 0.68); g.rotate(0.16); sleigh.silhouette(g); }, C.cover, { depth: 0.5, shadowColor: 'rgba(120,90,30,0.4)' });
  P.layer((g) => { A.fir(g, -14.0, 1.35, 3.4, 5.6, 3, true); A.fir(g, -11.3, 1.35, 2.4, 3.8, 3, true); A.fir(g, 14.2, 1.35, 3.2, 5.2, 3, true); A.fir(g, 11.6, 1.35, 2.2, 3.4, 3, true); A.fir(g, -16.0, 1.35, 1.8, 2.8, 3, true); A.fir(g, 16.1, 1.35, 1.7, 2.6, 3, true); }, '#274a66', { depth: 0.8, shadowColor: NAVY_SHADOW, rim: 0.3, rimColor: '#5d83a8' });
  P.layer((g) => { for (const [x, y, s] of [[-12.5, 12.6, 0.5], [-7.0, 13.3, 0.3], [7.8, 13.0, 0.42], [12.8, 11.4, 0.6], [-15.0, 9.2, 0.3], [6.0, 8.2, 0.26], [15.4, 8.0, 0.3], [-5.6, 7.6, 0.24]]) A.sparkle(g, x, y, s); }, C.goldLight, { depth: 0.35, shadow: 0.8, shadowColor: NAVY_SHADOW });
  P.layer((g) => A.text(g, '메리 크리스마스', 0, 4.0, { size: 2.6, family: 'Gowun Batang', weight: 700 }), C.goldLight, { depth: 0.5, shadow: 1, shadowColor: NAVY_SHADOW });
  P.draw((g) => { g.fillStyle = P2.rgba(C.cream, 0.9); const s = 'MERRY CHRISTMAS'; let x = -((s.length - 1) * 0.9) / 2; for (const ch of s) { A.text(g, ch, x, 2.2, { size: 0.76, family: 'Gowun Batang', weight: 700 }); x += 0.9; } });
  P.innerShade('#070b26', { alpha: 0.4, blurPx: 22 });
}

// ---- what rides the spinner arm: Santa's sleigh behind two reindeer
const sleigh = (() => {
  const deer = (add, cx, lead) => {
    const coat = lead ? '#a9713f' : '#946238', y = 1.32;
    add('leg', P2.shade(coat, -0.22), (g) => { P2.fillLimb(g, cx - 0.42, y - 0.05, cx - 0.82, y - 0.2, cx - 1.12, y - 0.62, 0.2, 0.1); P2.fillLimb(g, cx + 0.42, y - 0.08, cx + 0.8, y - 0.25, cx + 1.14, y - 0.5, 0.2, 0.1); });
    add('body', coat, (g) => { A.ell(g, cx, y, 0.66, 0.31, 0.1); P2.fillLimb(g, cx + 0.42, y + 0.1, cx + 0.62, y + 0.45, cx + 0.86, y + 0.66, 0.36, 0.22); A.ell(g, cx - 0.66, y + 0.16, 0.14, 0.1, -0.5); });
    add('leg2', coat, (g) => { P2.fillLimb(g, cx - 0.3, y - 0.1, cx - 0.5, y - 0.45, cx - 0.86, y - 0.78, 0.22, 0.1); P2.fillLimb(g, cx + 0.3, y - 0.1, cx + 0.62, y - 0.5, cx + 1.0, y - 0.7, 0.22, 0.1); });
    add('head', P2.shade(coat, 0.1), (g) => { A.ell(g, cx + 1.02, y + 0.72, 0.27, 0.17, -0.25); A.ell(g, cx + 0.8, y + 0.9, 0.14, 0.07, 0.9); });
    add('antler', '#5e3d24', (g) => { g.lineWidth = 0.085; g.beginPath(); g.moveTo(cx + 0.88, y + 0.84); g.quadraticCurveTo(cx + 0.74, y + 1.18, cx + 0.92, y + 1.42); g.moveTo(cx + 0.8, y + 1.1); g.lineTo(cx + 0.58, y + 1.3); g.moveTo(cx + 0.83, y + 1.25); g.lineTo(cx + 1.08, y + 1.3); g.stroke(); });
    add('trim', C.red, (g) => { P2.fillLimb(g, cx + 0.5, y + 0.44, cx + 0.56, y + 0.3, cx + 0.72, y + 0.1, 0.13, 0.13); if (lead) A.disc(g, cx + 1.28, y + 0.66, 0.085); }, { print: true });
    add('eye', C.dark, (g) => A.disc(g, cx + 1.06, y + 0.77, 0.035), { print: true });
  };
  const build = (add) => {
    add('rein', C.wood, (g) => { g.lineWidth = 0.1; g.beginPath(); g.moveTo(-1.5, 1.62); g.quadraticCurveTo(-0.6, 1.5, 0.35, 1.72); g.quadraticCurveTo(1.4, 1.5, 2.6, 1.86); g.stroke(); g.beginPath(); g.moveTo(-1.25, 1.02); g.lineTo(-0.3, 1.3); g.stroke(); });
    add('runner', C.gold, (g) => { g.lineWidth = 0.13; g.beginPath(); g.moveTo(-3.3, 0.5); g.lineTo(-1.5, 0.5); g.quadraticCurveTo(-1.0, 0.52, -1.02, 1.0); g.stroke(); g.lineWidth = 0.1; g.beginPath(); g.moveTo(-2.95, 0.5); g.lineTo(-2.95, 0.85); g.moveTo(-1.85, 0.5); g.lineTo(-1.85, 0.85); g.stroke(); });
    add('sack', '#6d8a5a', (g) => { A.ell(g, -2.92, 1.72, 0.44, 0.5, 0.2); A.ell(g, -2.86, 2.24, 0.16, 0.12); });
    add('santa', C.red, (g) => { A.ell(g, -2.12, 1.5, 0.44, 0.52); P2.fillLimb(g, -2.05, 1.62, -1.75, 1.55, -1.48, 1.62, 0.26, 0.18); g.beginPath(); g.moveTo(-2.26, 2.16); g.quadraticCurveTo(-2.2, 2.62, -2.66, 2.5); g.quadraticCurveTo(-2.3, 2.42, -1.8, 2.2); g.fill(); });
    add('face', C.skin, (g) => A.disc(g, -2.0, 2.08, 0.23));
    add('beard', C.cream, (g) => { A.ell(g, -1.93, 1.9, 0.26, 0.24); A.disc(g, -2.68, 2.5, 0.11); g.lineWidth = 0.12; g.beginPath(); g.moveTo(-2.26, 2.2); g.lineTo(-1.8, 2.22); g.stroke(); });
    add('body', C.red, (g) => { g.beginPath(); g.moveTo(-3.3, 0.78); g.lineTo(-1.5, 0.78); g.quadraticCurveTo(-1.08, 0.82, -1.14, 1.4); g.lineTo(-1.42, 1.36); g.quadraticCurveTo(-1.5, 1.08, -1.8, 1.08); g.lineTo(-2.55, 1.08); g.quadraticCurveTo(-2.75, 1.5, -2.8, 1.9); g.quadraticCurveTo(-3.2, 2.0, -3.42, 1.8); g.quadraticCurveTo(-3.2, 1.5, -3.3, 0.78); g.fill(); });
    add('trim', C.goldLight, (g) => { g.lineWidth = 0.07; g.beginPath(); g.moveTo(-3.2, 0.93); g.lineTo(-1.5, 0.93); g.quadraticCurveTo(-1.26, 0.96, -1.26, 1.3); g.stroke(); }, { print: true });
    add('eye', C.dark, (g) => A.disc(g, -1.92, 2.12, 0.03), { print: true });
    deer(add, 0.3, false); deer(add, 2.2, true);
  };
  const p = piece({ w: 7.4, h: 3.0, res: 48, name: 'sleigh', build });
  const ops = []; build((pass, color, fn, o = {}) => ops.push({ fn, ...o }));
  return { ...p, silhouette: (g) => { g.lineCap = g.lineJoin = 'round'; for (const o of ops) if (!o.print) o.fn(g); },
    paint: (P) => { P.fill(C.kraft);
      for (const pass of ['rein', 'runner', 'sack', 'santa', 'face', 'beard', 'body', 'leg', 'leg2', 'head', 'antler']) p.layer(P, pass, { depth: 0.45, shadow: 0.7 });
      p.flat(P, 'trim'); p.flat(P, 'eye'); } };
})();
const wallPivot = new THREE.Group(); wallPivot.position.set(0, FLOOR_Y + 0.05, 0); card.add(wallPivot);
const wall = makeCard(P2.shape.rect(W, D), { ...CARD, seed: 3, paint: paintSky, back: false, contact: { amount: 0.16, height: 1.4, color: '#0a0f30' } });
wall.position.z = 0.025; wall.name = 'wall'; wallPivot.add(wall);
const cover = makeCard(P2.shape.rect(W, D), { ...CARD, seed: 4, paint: paintCover, back: false, contact: null, folds: ['top'] });
cover.rotation.x = Math.PI; cover.position.set(0, D, -0.025); cover.name = 'cover'; wallPivot.add(cover);

// the spinner: a moon-coloured arm on a brass pin at the moon's centre; Santa rides its end round the moon's face
const arm = new THREE.Group(); arm.position.set(MOON.x, MOON.y, 0.05 + 0.045); wallPivot.add(arm);
{
  const R = ARM.R, strip = makeCard([[-0.2, -0.55], [0.2, -0.55], [0.2, R], [-0.2, R]], { ...CARD, thickness: 0.035, seed: 7, folds: [], contact: null, edgeWidth: 0.03, paint: (P) => {
    P.fill(P2.mix(C.moon, C.moonShade, 0.35)); P.felt(0.4);
    P.layer((g) => A.disc(g, 0, 0, 0.2), C.gold, { depth: 0.4 }); P.layer((g) => A.disc(g, 0, 0, 0.08), C.wood, { depth: 0.2, shadow: 0 });
  } });
  strip.name = 'arm'; arm.add(strip);
  const s = makeCard(sleigh.pts, { ...CARD, seed: 8, folds: [], contact: null, paint: sleigh.paint, back: 'mirror', edgeWidth: 0.035 });
  s.scale.setScalar(1.1); s.position.set(0.4, R - 1.45 * 1.1, 0.05); s.name = 'sleigh'; arm.add(s);
}

// ---------------------------------------------------------------------------------------------------------------
// rows that stand parallel to the wall (parallel folds)
// ---------------------------------------------------------------------------------------------------------------
function row(d) { const p = new THREE.Group(); p.position.set(0, FLOOR_Y, d); card.add(p); rows.push(p); return p; }
function strap(parent, x, h, len, color = C.snowShade) {
  const g = new THREE.Group(); g.position.set(x, h, -0.04);
  g.add(makeCard(P2.shape.rect(1.3, len - 0.09), { ...CARD, thickness: 0.035, seed: 60 + x, folds: ['bottom', 'top'], contact: null, back: false, paint: (P) => { P.fill(color); P.felt(0.5); } }));
  g.children[0].name = 'strap'; parent.add(g); straps.push(g); return g;
}

// ---- far row: the village
const chimneys = [];
const LIFT = 0.5;
const village = piece({ w: 36, h: 13.2, res: 40, name: 'village', build: (add0) => {
  const add = (pass, color, fn, o) => add0(pass, color, (g) => { g.save(); g.translate(0, LIFT); fn(g); g.restore(); }, o);
  add0('wall', C.firDark, (g) => g.fillRect(-17.3, 0, 34.6, LIFT + 0.3));
  const win = (cx, cy, w = 0.62, h = 0.84, arch = false) => {
    add('frame', '#3b2b33', (g) => { if (arch) { g.beginPath(); g.moveTo(cx - w / 2 - 0.09, cy - h / 2 - 0.09); g.lineTo(cx + w / 2 + 0.09, cy - h / 2 - 0.09); g.lineTo(cx + w / 2 + 0.09, cy + h / 2 - w / 2); g.arc(cx, cy + h / 2 - w / 2, w / 2 + 0.09, 0, Math.PI); g.fill(); } else A.rrect(g, cx - w / 2 - 0.09, cy - h / 2 - 0.09, w + 0.18, h + 0.18, 0.06); }, { print: true });
    const panes = (g) => { if (arch) { g.beginPath(); g.moveTo(cx - w / 2, cy - h / 2); g.lineTo(cx + w / 2, cy - h / 2); g.lineTo(cx + w / 2, cy + h / 2 - w / 2); g.arc(cx, cy + h / 2 - w / 2, w / 2, 0, Math.PI); g.fill(); } else for (const sx of [-1, 1]) for (const sy of [-1, 1]) g.fillRect(cx + (sx < 0 ? -w / 2 : 0.04), cy + (sy < 0 ? -h / 2 : 0.04), w / 2 - 0.04, h / 2 - 0.04); };
    add('pane', C.window, panes, { print: true }); add('glow', '#fff', panes, { print: true });
  };
  const chimney = (cx, y0, y1) => {
    add('chim', C.brick, (g) => g.fillRect(cx - 0.3, y0, 0.6, y1 - y0));
    add('snow', C.snow, (g) => A.rrect(g, cx - 0.42, y1 - 0.06, 0.84, 0.28, 0.13));
    chimneys.push([cx, y1 + 0.3]);
  };
  const snowSlopes = (x, peak, hw, drop, t = 0.5, n = 3) => (g) => {   // snow lying on both slopes of a gable
    const U = (sd, s, dy) => [x + sd * s * hw, peak + 0.14 - s * drop - dy];
    g.beginPath(); g.moveTo(...U(1, 0, 0)); g.lineTo(...U(1, 1.04, -0.04)); g.lineTo(...U(1, 1.04, t * 0.7));
    for (let i = n; i >= 1; i--) g.quadraticCurveTo(...U(1, (i - 0.5) / n, t * 1.5), ...U(1, (i - 1) / n, t * 0.8));
    for (let i = 1; i <= n; i++) g.quadraticCurveTo(...U(-1, (i - 0.5) / n, t * 1.5), ...U(-1, i / n, t * 0.8));
    g.lineTo(...U(-1, 1.04, t * 0.7)); g.lineTo(...U(-1, 1.04, -0.04)); g.closePath(); g.fill();
  };
  const gable = ({ x, w, wall, roof, body, chim = 0, wins = [] }) => {
    if (chim) chimney(x + chim * w * 0.27, wall + roof * 0.35, wall + roof * 1.0 + 0.25);
    add('wall', body, (g) => A.poly(g, [[x - w / 2, 0], [x + w / 2, 0], [x + w / 2, wall], [x, wall + roof], [x - w / 2, wall]]));
    add('beam', P2.shade(body, -0.3), (g) => g.fillRect(x - w / 2, wall - 0.12, w, 0.14), { print: true });
    add('snow', C.snow, snowSlopes(x, wall + roof, w / 2 + 0.34, roof + 0.22));
    for (const [dx, y, ww, hh, arch] of wins) win(x + dx, y, ww, hh, arch);
  };
  const eave = ({ x, w, wall, roof, body, roofC, chim = 0, wins = [] }) => {
    if (chim) chimney(x + chim * w * 0.26, wall + roof * 0.5, wall + roof + 0.55);
    add('wall', body, (g) => g.fillRect(x - w / 2, 0, w, wall + 0.1));
    const bw = w / 2 + 0.36, tw = w * 0.36;
    add('roof', roofC, (g) => A.poly(g, [[x - bw, wall], [x + bw, wall], [x + tw, wall + roof], [x - tw, wall + roof]]));
    add('snow', C.snow, (g) => { const yk = wall + roof * 0.3, k = 0.3, xr = x + bw + (tw - bw) * k, xl = x - bw - (tw - bw) * k; g.beginPath(); g.moveTo(x - tw - 0.05, wall + roof + 0.14); g.lineTo(x + tw + 0.05, wall + roof + 0.14); g.lineTo(xr + 0.1, yk); A.scallops(g, xr + 0.1, xl - 0.1, yk, 5, -0.14); g.closePath(); g.fill(); });
    for (const [dx, y, ww, hh, arch] of wins) win(x + dx, y, ww, hh, arch);
  };
  const tree = (x, w, h, tone) => {
    add('fir0', tone, (g) => { g.fillRect(x - w * 0.07, 0, w * 0.14, h * 0.25); A.firTier(g, x, h * 0.16, w / 2, h * 0.62, 4); });
    add('fir1', P2.shade(tone, 0.08), (g) => A.firTier(g, x, h * 0.42, w * 0.38, h * 0.84, 3));
    add('fir2', P2.shade(tone, 0.16), (g) => A.firTier(g, x, h * 0.66, w * 0.25, h, 2));
    add('firsnow', C.snow, (g) => { for (const [yb, hw, top] of [[h * 0.42, w * 0.38, h * 0.62], [h * 0.66, w * 0.25, h * 0.84], [h * 0.86, w * 0.1, h]]) { g.beginPath(); g.moveTo(x - hw * 0.62, yb + (top - yb) * 0.42); g.quadraticCurveTo(x - hw * 0.3, yb + (top - yb) * 0.2, x, yb + (top - yb) * 0.45); g.quadraticCurveTo(x + hw * 0.3, yb + (top - yb) * 0.2, x + hw * 0.62, yb + (top - yb) * 0.42); g.lineTo(x, top + 0.02); g.closePath(); g.fill(); } }, { print: true });
  };
  // back firs
  tree(-16.4, 2.5, 8.6, C.firDark); tree(-4.2, 2.5, 8.2, C.firDark); tree(16.5, 2.5, 9.0, C.firDark); tree(10.3, 2.2, 8.6, C.firDark);
  // houses, left to right (their feet hide behind the viaduct: windows sit high)
  gable({ x: -13.0, w: 4.4, wall: 6.0, roof: 2.5, body: C.red, chim: -1, wins: [[-1.0, 4.9], [1.0, 4.9], [0, 6.9, 0.56, 0.7, true]] });
  eave({ x: -7.6, w: 5.0, wall: 5.2, roof: 1.9, body: C.ochre, roofC: C.plum, chim: 1, wins: [[-1.4, 4.2], [0, 4.2], [1.4, 4.2]] });
  gable({ x: -0.6, w: 4.4, wall: 6.4, roof: 2.6, body: C.teal, chim: 1, wins: [[-1.0, 5.3], [1.0, 5.3], [0, 7.4, 0.56, 0.7, true]] });
  // the church: nave and tower
  eave({ x: 5.4, w: 3.8, wall: 5.6, roof: 1.8, body: C.cream, roofC: C.stoneDark, wins: [[-0.8, 4.6, 0.56, 1.3, true], [0.75, 4.6, 0.56, 1.3, true]] });
  add('wall', P2.shade(C.cream, -0.06), (g) => g.fillRect(6.9, 0, 2.0, 8.6));
  add('snow', C.snow, snowSlopes(7.9, 11.8, 1.3, 3.3, 0.42, 2));
  add('roof', C.stoneDark, (g) => A.poly(g, [[6.72, 8.5], [9.08, 8.5], [7.9, 11.7]]));
  add('star', C.goldLight, (g) => A.star(g, 7.9, 12.0, 0.42, 0.19));
  win(7.9, 7.3, 0.7, 1.2, true); win(7.9, 5.2, 0.5, 0.9, true);
  gable({ x: 13.2, w: 4.2, wall: 5.7, roof: 2.4, body: '#c4573c', chim: -1, wins: [[-0.95, 4.7], [0.95, 4.7], [0, 6.5, 0.5, 0.64, true]] });
  // front firs and the snow the village stands in
  tree(-10.4, 1.9, 6.6, C.fir); tree(2.6, 1.8, 6.4, C.fir); tree(-15.6, 1.8, 5.6, C.fir); tree(15.9, 1.9, 6.0, C.fir); tree(-3.3, 1.6, 5.8, C.fir);
  add('bank', C.snow, (g) => { g.beginPath(); g.moveTo(-17.3, 0); g.lineTo(-17.3, 2.6); A.scallops(g, -17.3, 17.3, 2.6, 10, 0.5); g.lineTo(17.3, 0); g.closePath(); g.fill(); });
} });
function paintVillage(P) {
  P.fill(C.firDark);
  for (const k of ['fir0', 'fir1', 'fir2']) village.layer(P, k, { shadowColor: NAVY_SHADOW, depth: 0.6, rim: 0.25, rimColor: '#3f7f78' });
  village.flat(P, 'firsnow');
  village.layer(P, 'chim', { depth: 0.5 });
  village.layer(P, 'wall', { depth: 0.9, shadowColor: NAVY_SHADOW, felt: 0.5 });
  village.flat(P, 'beam');
  village.layer(P, 'roof', { depth: 0.8, shadowColor: NAVY_SHADOW });
  village.layer(P, 'snow', { depth: 0.9, shadowColor: 'rgba(40,50,110,0.5)', rim: 0.5, rimColor: '#ffffff' });
  village.layer(P, 'star', { depth: 0.4 });
  village.flat(P, 'frame'); village.flat(P, 'pane'); village.glow(P, 'glow');
  P.draw((g) => { g.fillStyle = 'rgba(255,246,214,0.55)'; });
  village.layer(P, 'bank', { depth: 1.1, shadowColor: 'rgba(40,50,110,0.5)', rim: 0.5, rimColor: '#ffffff' });
  P.innerShade('#1a2256', { alpha: 0.3, blurPx: 16 });
}
const farRow = row(ROW.far);
const villageCard = makeCard(village.pts, { ...CARD, seed: 11, paint: paintVillage, glow: 1.25, glowColor: '#ffcf6a', contact: { amount: 0.12, height: 1 } });
villageCard.name = 'village'; farRow.add(villageCard);
strap(farRow, -13, 2.4, ROW.far); strap(farRow, 13.2, 2.4, ROW.far);

// ---- middle row: the viaduct, its slot, the train, the two tunnel hills
const midRow = row(ROW.mid);
const ARCH = [-5.2, -2.6, 0, 2.6, 5.2], DECK = TRAIN.y;
const AY = 3.6;   // where the arches spring
const archHole = (cx) => { const p = [[cx - 1.0, 0.5], [cx + 1.0, 0.5], [cx + 1.0, AY]]; for (let i = 1; i < 18; i++) { const a = (i / 18) * Math.PI; p.push([cx + Math.cos(a) * 1.0, AY + Math.sin(a) * 1.0]); } p.push([cx - 1.0, AY]); return p; };
function paintViaduct(P) {
  P.gradient(C.stoneDark, C.stone); P.felt(0.7);
  P.marks('brick', { color: C.stoneLight, alpha: 0.5, size: 0.42, units: true, width: 1.3, region: { x0: -17, x1: 17, y0: 0, y1: DECK } });
  P.layer((g) => {                                  // the stones round each arch
    for (const cx of ARCH) { g.beginPath(); g.moveTo(cx - 1.26, 0.2); g.lineTo(cx - 1.26, AY); g.arc(cx, AY, 1.26, Math.PI, 0, true); g.lineTo(cx + 1.26, 0.2); g.lineTo(cx + 1.0, 0.2); g.lineTo(cx + 1.0, AY); g.arc(cx, AY, 1.0, 0, Math.PI, false); g.lineTo(cx - 1.0, 0.2); g.closePath(); g.fill(); }
  }, C.stoneLight, { depth: 0.5, shadowColor: NAVY_SHADOW });
  P.layer((g) => g.fillRect(-17.2, DECK - 0.02, 34.4, 1.0), C.stoneDark, { depth: 0.6, shadowColor: NAVY_SHADOW });   // the far parapet
  P.draw((g) => {                                   // the slot the train's tab runs in, the rail
    g.fillStyle = '#12173a'; A.rrect(g, -13.8, DECK + 0.4, 27.6, 0.1, 0.05);
    g.fillStyle = 'rgba(214,224,255,0.55)'; g.fillRect(-13.8, DECK + 0.34, 27.6, 0.035);
    g.fillStyle = P2.rgba(C.stoneLight, 0.5); for (let x = -16.6; x < 16.4; x += 1.3) g.fillRect(x, DECK + 0.66, 0.9, 0.2);
  });
  P.layer((g) => { g.beginPath(); g.moveTo(-17.2, DECK + 0.02); A.scallops(g, -17.2, 17.2, DECK - 0.3, 29, -0.1); g.lineTo(17.2, DECK + 0.02); g.closePath(); g.fill(); }, C.snow, { depth: 0.6, shadowColor: 'rgba(40,50,110,0.5)', rim: 0.4, rimColor: '#ffffff' });
  P.layer((g) => { g.beginPath(); g.moveTo(-17.2, 0); g.lineTo(-17.2, 0.5); A.scallops(g, -17.2, 17.2, 0.5, 16, 0.22); g.lineTo(17.2, 0); g.closePath(); g.fill(); }, C.snow, { depth: 0.6, shadowColor: 'rgba(40,50,110,0.5)' });
  P.innerShade('#141a48', { alpha: 0.3, blurPx: 14 });
}
const viaduct = makeCard(P2.shape.rect(34, DECK + 0.95), { ...CARD, seed: 13, paint: paintViaduct, holes: ARCH.map(archHole), contact: { amount: 0.12, height: 0.8 } });
viaduct.name = 'viaduct'; midRow.add(viaduct);
strap(midRow, -14.6, 2.6, ROW.mid - ROW.far); strap(midRow, 14.6, 2.6, ROW.mid - ROW.far);

const train = (() => {
  const p = piece({ w: 7.0, h: 2.3, res: 52, name: 'train', build: (add) => {
    const car = (x0, x1, body) => {
      add('body', body, (g) => A.rrect(g, x0, 0.4, x1 - x0, 1.08, 0.12));
      add('lid', C.snow, (g) => A.rrect(g, x0 - 0.1, 1.44, x1 - x0 + 0.2, 0.2, 0.1));
      add('wheel', C.dark, (g) => { A.disc(g, x0 + 0.36, 0.27, 0.27); A.disc(g, x1 - 0.36, 0.27, 0.27); });
      const panes = (g) => { const n = Math.round((x1 - x0) / 0.55); for (let i = 0; i < n; i++) A.rrect(g, x0 + 0.16 + i * ((x1 - x0 - 0.2) / n), 0.84, (x1 - x0 - 0.2) / n - 0.12, 0.42, 0.05); };
      add('pane', C.window, panes, { print: true }); add('glow', '#fff', panes, { print: true });
      add('trim', C.goldLight, (g) => g.fillRect(x0 + 0.06, 0.62, x1 - x0 - 0.12, 0.07), { print: true });
    };
    add('link', C.dark, (g) => g.fillRect(-3.0, 0.5, 5.4, 0.14));
    car(-3.2, -1.72, C.teal); car(-1.5, 0.2, '#7a5a9a');
    add('wheel', C.dark, (g) => { A.disc(g, 0.86, 0.33, 0.33); A.disc(g, 1.62, 0.33, 0.33); A.disc(g, 2.4, 0.25, 0.25); A.poly(g, [[2.66, 0.18], [3.2, 0.18], [2.66, 0.66]]); });
    add('body', C.red, (g) => { A.rrect(g, 1.18, 0.46, 1.62, 0.86, 0.3); A.rrect(g, 0.42, 0.42, 0.98, 1.36, 0.08); });
    add('lid', C.dark, (g) => { A.rrect(g, 0.3, 1.74, 1.22, 0.18, 0.08); A.poly(g, [[2.2, 1.26], [2.56, 1.26], [2.66, 1.96], [2.1, 1.96]]); });
    add('dome', C.goldLight, (g) => { A.ell(g, 1.74, 1.34, 0.22, 0.2); g.fillRect(2.12, 1.68, 0.52, 0.09); A.disc(g, 2.84, 0.98, 0.13); });
    const cab = (g) => A.rrect(g, 0.6, 1.08, 0.6, 0.46, 0.05);
    add('pane', C.window, cab, { print: true }); add('glow', '#fff', (g) => { cab(g); A.disc(g, 2.84, 0.98, 0.1); }, { print: true });
    add('hub', C.goldLight, (g) => { for (const [x, y, rr] of [[0.86, 0.33, 0.1], [1.62, 0.33, 0.1], [2.4, 0.25, 0.08], [-2.84, 0.27, 0.08], [-2.08, 0.27, 0.08], [-1.14, 0.27, 0.08], [-0.16, 0.27, 0.08]]) A.disc(g, x, y, rr); }, { print: true });
    add('trim', C.goldLight, (g) => { g.fillRect(1.3, 0.66, 1.4, 0.07); }, { print: true });
  } });
  return { ...p, paint: (P) => { P.fill(C.dark);
    for (const k of ['link', 'body', 'lid', 'dome', 'wheel']) p.layer(P, k, { depth: 0.4, shadowColor: NAVY_SHADOW });
    p.flat(P, 'trim'); p.flat(P, 'pane'); p.flat(P, 'hub'); p.glow(P, 'glow'); } };
})();
const trainCard = makeCard(train.pts, { ...CARD, seed: 15, folds: [], contact: null, paint: train.paint, glow: 1.3, glowColor: '#ffd070', edgeWidth: 0.035 });
const trainG = new THREE.Group(); trainG.position.set(0, DECK + 0.01, 0.16); trainCard.name = 'train'; trainG.add(trainCard); midRow.add(trainG);

function hill(side) {              // a wooded tunnel hill standing just in front of the viaduct: the train runs behind it
  const s = side, LEN = 10.7, X = (u) => (-LEN / 2 + u) * s;                 // u: distance from the tunnel mouth (the inner end)
  const p = piece({ w: LEN + 1, h: 9.05, res: 40, name: 'hill', build: (add) => {
    const top = (u) => lerp(7.78, 5.3, smooth(8.2, LEN, u)) + 0.12 * Math.sin(u * 1.3);
    const N = 28, prof = []; for (let i = 0; i <= N; i++) { const u = i * LEN / N; prof.push([X(u), top(u)]); }
    const band = (dy, k) => [...prof.map(([x, y], i) => [x, y - dy - k * Math.sin(i * 0.45 + dy) - (i / N) * dy * 0.4])];
    const tree = (u, w, h, y0, tone) => {
      const x = X(u);
      add('fir0', tone, (g) => { g.fillRect(x - w * 0.07, y0 - 0.6, w * 0.14, h * 0.3 + 0.6); A.firTier(g, x, y0 + h * 0.14, w / 2, y0 + h * 0.62, 3); });
      add('fir1', P2.shade(tone, 0.1), (g) => A.firTier(g, x, y0 + h * 0.46, w * 0.36, y0 + h, 2));
      add('firsnow', C.snow, (g) => { for (const [yb, hw, tp] of [[h * 0.46, w * 0.36, h * 0.62], [h * 0.8, w * 0.14, h]]) { g.beginPath(); g.moveTo(x - hw * 0.62, y0 + yb + (tp - yb) * 0.42); g.quadraticCurveTo(x - hw * 0.3, y0 + yb + (tp - yb) * 0.15, x, y0 + yb + (tp - yb) * 0.45); g.quadraticCurveTo(x + hw * 0.3, y0 + yb + (tp - yb) * 0.15, x + hw * 0.62, y0 + yb + (tp - yb) * 0.42); g.lineTo(x, y0 + tp + 0.02); g.closePath(); g.fill(); } }, { print: true });
    };
    // a line of firs along the ridge
    for (const [u, w, h, y0] of [[0.8, 1.5, 1.85, 7.05], [2.2, 1.7, 1.95, 7.0], [3.7, 1.5, 1.75, 7.1], [5.1, 1.8, 2.0, 6.95], [6.6, 1.5, 1.85, 7.0], [8.0, 1.6, 2.0, 6.8], [9.5, 1.6, 2.5, 5.2]]) tree(u, w, h, y0, C.fir);
    add('hill', C.snowShade, (g) => A.poly(g, [[X(0), 0], ...prof, [X(LEN), 0]]));
    add('band', C.snow, (g) => A.poly(g, [...prof, ...band(1.5, 0.3).reverse()]), { print: true });
    add('band2', P2.mix(C.snow, C.snowShade, 0.5), (g) => A.poly(g, [...band(3.3, 0.4), ...band(4.9, 0.3).reverse()]), { print: true });
    // firs standing on the slope
    for (const [u, w, h, y0] of [[3.9, 2.0, 3.0, 3.3], [6.3, 1.8, 2.6, 3.0], [8.4, 2.1, 3.1, 2.7], [10.0, 1.4, 2.2, 2.4]]) {
      const x = X(u);
      add('fir3', C.firDark, (g) => { g.fillRect(x - w * 0.07, y0 - 0.2, w * 0.14, h * 0.3); A.firTier(g, x, y0 + h * 0.14, w / 2, y0 + h * 0.62, 3); }, { print: true });
      add('fir4', C.fir, (g) => A.firTier(g, x, y0 + h * 0.46, w * 0.36, y0 + h, 2), { print: true });
    }
    // the tunnel mouth at the inner end: a stone ring round the dark
    const half = (r0) => (g) => { g.beginPath(); g.moveTo(X(-0.06), DECK - 0.12); g.lineTo(X(-0.06), DECK + 1.1 + r0); g.arc(X(0), DECK + 1.1, r0, Math.PI / 2, s > 0 ? 0 : Math.PI, s > 0); g.lineTo(X(r0), DECK - 0.12); g.closePath(); g.fill(); };
    add('ring', C.stoneLight, half(1.6), { print: true });
    add('mouth', '#0f1433', half(1.22), { print: true });
  } });
  const m = makeCard(p.pts, { ...CARD, seed: 17 + s, contact: { amount: 0.1, height: 0.8 }, paint: (P) => {
    P.fill(C.snowShade);
    for (const k of ['fir0', 'fir1']) p.layer(P, k, { shadowColor: NAVY_SHADOW, depth: 0.5, rim: 0.25, rimColor: '#3f7f78' });
    p.flat(P, 'firsnow');
    p.layer(P, 'hill', { depth: 0.9, felt: 0.5, shadowColor: NAVY_SHADOW });
    p.layer(P, 'band', { depth: 0.6, shadowColor: 'rgba(60,84,150,0.35)' }); p.layer(P, 'band2', { depth: 0.6, shadowColor: 'rgba(60,84,150,0.35)', lip: 0.6 });
    p.layer(P, 'fir3', { shadowColor: NAVY_SHADOW, depth: 0.5, rim: 0.25, rimColor: '#3f7f78' }); p.layer(P, 'fir4', { shadowColor: NAVY_SHADOW, depth: 0.5, rim: 0.25, rimColor: '#3f7f78' });
    p.layer(P, 'ring', { depth: 0.5, shadowColor: NAVY_SHADOW }); p.layer(P, 'mouth', { depth: 0.4, shadow: 0 });
    P.innerShade('#3b4f92', { alpha: 0.28, blurPx: 14 });
  } });
  m.position.set((6.5 + LEN / 2) * s, 0, 0); m.name = s > 0 ? 'hill R' : 'hill L';
  return m;
}
const hillRow = row(ROW.mid + 0.36);      // a hair in front of the viaduct: the train runs in the gap between them
hillRow.add(hill(-1), hill(1));

// ---- front row: the snow bank, the letter board, and two tags (to / from) held by a snowman and hung by a lamp
const frontRow = row(ROW.front);
const BOARD = { x0: -10.3, x1: 10.3, y0: 0.42, y1: 4.84 };
const TAG = { w: 6.2, h: 3.0, y0: 0.62, xL: -14.25, xR: 14.25, tilt: 0.045 };
const tagPath = (g, cx, sd) => {                 // a luggage tag: clipped corners toward the board, a punched eyelet
  const w = TAG.w / 2, h = TAG.h, k = 0.55;
  g.save(); g.translate(cx, TAG.y0 + h / 2); g.rotate(sd * TAG.tilt); g.beginPath();
  g.moveTo(-w * sd, -h / 2); g.lineTo((w - k) * sd, -h / 2); g.lineTo(w * sd, -h / 2 + k); g.lineTo(w * sd, h / 2 - k); g.lineTo((w - k) * sd, h / 2); g.lineTo(-w * sd, h / 2); g.closePath(); g.fill(); g.restore();
};
const front = piece({ w: 35.8, h: 5.1, res: 40, name: 'front', build: (add) => {
  add('bank', C.snow, (g) => { g.beginPath(); g.moveTo(-17.5, 0); g.lineTo(-17.5, 1.5); A.scallops(g, -17.5, 17.5, 1.5, 9, 0.4); g.lineTo(17.5, 0); g.closePath(); g.fill(); });
  // the snowman behind the left tag: head and hat above it, twig arms holding it
  const sx = TAG.xL + 0.1;
  const hy = 4.0;   // the snowman's head
  add('snowman', C.snowLit, (g) => { A.disc(g, sx, 1.9, 1.6); A.disc(g, sx, hy, 0.78); });
  add('hat', C.dark, (g) => { A.rrect(g, sx - 0.8, hy + 0.5, 1.6, 0.16, 0.06); A.rrect(g, sx - 0.5, hy + 0.58, 1.0, 0.46, 0.08); });
  add('hatband', C.red, (g) => g.fillRect(sx - 0.5, hy + 0.64, 1.0, 0.15), { print: true });
  add('coal', C.dark, (g) => { A.disc(g, sx - 0.27, hy + 0.17, 0.075); A.disc(g, sx + 0.27, hy + 0.17, 0.075); for (let i = -2; i <= 2; i++) A.disc(g, sx + i * 0.14, hy - 0.21 - 0.03 * (4 - i * i), 0.04); }, { print: true });
  add('nose', '#e8853a', (g) => A.poly(g, [[sx, hy + 0.07], [sx, hy - 0.09], [sx + 0.52, hy - 0.05]]), { print: true });
  add('scarf', C.red, (g) => A.rrect(g, sx - 0.72, hy - 0.72, 1.44, 0.3, 0.14), { print: true });
  // behind the right tag: a small fir and the street lamp
  const fx = TAG.xR - 1.5, lx = TAG.xR + 1.7;
  add('fir0', C.fir, (g) => A.firTier(g, fx, 2.0, 1.3, 4.0, 3));
  add('fir1', C.firLight, (g) => A.firTier(g, fx, 3.4, 0.95, 5.0, 2));
  add('dots', C.goldLight, (g) => { for (const [dx, dy] of [[-0.3, 3.85], [0.35, 3.95], [0, 4.45]]) A.disc(g, fx + dx, dy, 0.09); }, { print: true });
  add('lamp', C.dark, (g) => { g.fillRect(lx - 0.1, 0.5, 0.2, 3.6); A.rrect(g, lx - 0.42, 3.8, 0.84, 0.92, 0.08); A.poly(g, [[lx - 0.56, 4.68], [lx + 0.56, 4.68], [lx, 5.0]]); });
  const lp = (g) => A.rrect(g, lx - 0.29, 3.93, 0.58, 0.66, 0.05);
  add('pane', C.window, lp, { print: true }); add('glow', '#fff', lp, { print: true });
  // the two tags and the board
  add('tag', C.cream, (g) => { tagPath(g, TAG.xL, 1); tagPath(g, TAG.xR, -1); });
  add('twig', C.wood, (g) => { g.lineWidth = 0.13; g.beginPath(); for (const sd of [-1, 1]) { g.moveTo(sx + sd * 1.0, 3.0); g.lineTo(sx + sd * 2.2, TAG.y0 + TAG.h + 0.14); g.moveTo(sx + sd * 2.0, TAG.y0 + TAG.h - 0.08); g.lineTo(sx + sd * 2.5, TAG.y0 + TAG.h + 0.34); } g.stroke(); });
  add('post', C.wood, (g) => { g.fillRect(BOARD.x0 + 1.0, 0, 0.6, 4.0); g.fillRect(BOARD.x1 - 1.6, 0, 0.6, 4.0); });
  add('board', C.cream, (g) => A.rrect(g, BOARD.x0, BOARD.y0, BOARD.x1 - BOARD.x0, BOARD.y1 - BOARD.y0, 0.3));
  add('edge', C.red, (g) => { g.lineWidth = 0.08; g.beginPath(); g.roundRect(BOARD.x0 + 0.2, BOARD.y0 + 0.2, BOARD.x1 - BOARD.x0 - 0.4, BOARD.y1 - BOARD.y0 - 0.4, 0.2); g.stroke(); }, { print: true });
  add('cap', C.snow, (g) => { g.beginPath(); g.moveTo(BOARD.x0 - 0.1, BOARD.y1 - 0.1); A.scallops(g, BOARD.x0 - 0.1, BOARD.x1 + 0.1, BOARD.y1 - 0.12, 17, -0.1); g.lineTo(BOARD.x1 + 0.1, BOARD.y1 + 0.12); g.quadraticCurveTo(0, BOARD.y1 + 0.26, BOARD.x0 - 0.1, BOARD.y1 + 0.12); g.closePath(); g.fill(); });
  add('front', C.snowLit, (g) => { g.beginPath(); g.moveTo(-17.5, 0); g.lineTo(-17.5, 0.7); A.scallops(g, -17.5, 17.5, 0.7, 12, 0.28); g.lineTo(17.5, 0); g.closePath(); g.fill(); });
} });
function paintFront(P) {
  P.fill(C.snowShade);
  front.layer(P, 'bank', { depth: 0.9, shadowColor: 'rgba(40,50,110,0.45)', felt: 0.4 });
  front.layer(P, 'post', { depth: 0.6 });
  for (const k of ['fir0', 'fir1']) front.layer(P, k, { shadowColor: NAVY_SHADOW, depth: 0.6, rim: 0.25, rimColor: '#3f7f78' });
  front.flat(P, 'dots');
  front.layer(P, 'lamp', { depth: 0.5 }); front.flat(P, 'pane'); front.glow(P, 'glow');
  front.layer(P, 'snowman', { depth: 1.0, shadowColor: 'rgba(40,50,110,0.45)', shade: 1.6 });
  front.layer(P, 'scarf', { depth: 0.5 }); front.layer(P, 'hat', { depth: 0.5 }); front.flat(P, 'hatband'); front.flat(P, 'coal'); front.layer(P, 'nose', { depth: 0.35 });
  front.layer(P, 'tag', { depth: 1.0, shadow: 1.2, shadowColor: 'rgba(40,50,110,0.5)', felt: 0.6, rim: 0.4 });
  P.draw((g) => {                                  // each tag: a red line inside its edge, a brass eyelet
    for (const [cx, sd] of [[TAG.xL, 1], [TAG.xR, -1]]) {
      g.save(); g.translate(cx, TAG.y0 + TAG.h / 2); g.rotate(sd * TAG.tilt);
      g.strokeStyle = C.red; g.lineWidth = 0.06; g.beginPath(); g.roundRect(-TAG.w / 2 + 0.16, -TAG.h / 2 + 0.16, TAG.w - 0.32, TAG.h - 0.32, 0.12); g.stroke();
      g.fillStyle = C.gold; A.disc(g, sd * (TAG.w / 2 - 0.42), 0, 0.2); g.fillStyle = '#5a6a9a'; A.disc(g, sd * (TAG.w / 2 - 0.42), 0, 0.09);
      g.restore();
    }
  });
  front.layer(P, 'twig', { depth: 0.4 });
  front.layer(P, 'board', { depth: 1.2, shadow: 1.3, shadowColor: 'rgba(40,50,110,0.5)', felt: 0.6, rim: 0.4 });
  front.flat(P, 'edge');
  // holly in two corners
  const holly = [[BOARD.x0 + 0.78, BOARD.y1 - 0.74, 2.4], [BOARD.x1 - 0.78, BOARD.y0 + 0.74, -0.75]];
  P.layer((g) => { for (const [x, y, a] of holly) { P2.fillLeaf(g, x, y, 0.95, a, 0.34); P2.fillLeaf(g, x, y, 0.95, a + 1.25, 0.34); P2.fillLeaf(g, x, y, 0.8, a - 1.2, 0.34); } }, C.fir, { depth: 0.4 });
  P.layer((g) => { for (const [x, y] of holly) { A.disc(g, x, y, 0.15); A.disc(g, x + 0.22, y + 0.14, 0.13); A.disc(g, x + 0.05, y - 0.22, 0.13); } }, C.red, { depth: 0.3 });
  writeLetter(P);
  front.layer(P, 'cap', { depth: 0.6, shadowColor: 'rgba(40,50,110,0.45)', rim: 0.4, rimColor: '#ffffff' });
  front.layer(P, 'front', { depth: 0.9, shadowColor: 'rgba(40,50,110,0.45)', rim: 0.4, rimColor: '#ffffff' });
  P.draw((g) => { g.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 34; i++) A.sparkle(g, -17 + P.r() * 34, 0.1 + P.r() * 0.5, 0.05 + P.r() * 0.07); });
  P.innerShade('#3b4f92', { alpha: 0.22, blurPx: 12 });
}
/** The letter, handwritten: the message on the board, who it is for on the left tag, who it is from on the right
 *  one. Every line wraps and shrinks until it fits its paper. */
function writeLetter(P) {
  P.draw((g) => {
    const x0 = BOARD.x0 + 1.3, x1 = BOARD.x1 - 1.3, y0 = BOARD.y0 + 0.52, y1 = BOARD.y1 - 0.26;
    const body = A.fitText(g, msg.msg, { w: x1 - x0, h: y1 - y0, max: 1.9, min: 0.5, lead: 1.0, maxLines: 5 });
    const bh = body.lines.length * body.size * body.lead, top = (y0 + y1) / 2 + bh / 2;
    body.lines.forEach((ln, i) => A.text(g, ln, (x0 + x1) / 2, top - (i + 0.77) * body.size * body.lead, { size: body.size, color: C.ink }));
    for (const [str, cx, sd] of [[msg.to, TAG.xL, 1], [msg.from, TAG.xR, -1]]) {
      if (!str) continue;
      const w = TAG.w - 1.5, h = TAG.h - 0.6, f = A.fitText(g, str, { w, h, max: 1.45, min: 0.38, lead: 0.98, maxLines: 3 });
      const th = f.lines.length * f.size * f.lead;
      g.save(); g.translate(cx - sd * 0.32, TAG.y0 + TAG.h / 2); g.rotate(sd * TAG.tilt);
      f.lines.forEach((ln, i) => A.text(g, ln, 0, th / 2 - (i + 0.77) * f.size * f.lead, { size: f.size, color: C.red }));
      g.restore();
    }
  });
}
const frontCard = makeCard(front.pts, { ...CARD, seed: 19, paint: paintFront, pxPerUnit: 57, maxPx: 2048, glow: 1.2, glowColor: '#ffd070', contact: { amount: 0.08, height: 0.6, color: '#4a5f9a' } });
frontCard.name = 'front'; frontRow.add(frontCard);
strap(frontRow, -16.0, 1.1, ROW.front - ROW.mid - 0.36); strap(frontRow, 16.0, 1.1, ROW.front - ROW.mid - 0.36);

// ---------------------------------------------------------------------------------------------------------------
// life: paper snow, smoke
// ---------------------------------------------------------------------------------------------------------------
makeSnow(stage, { count: 160, x: [-29, 29], z: [-9, 13], top: 25, start: 0.5, seed: 12 });
const _v = new THREE.Vector3();
const trainX = (t) => -TRAIN.travel * Math.cos(Math.PI * Math.max(0, t - TRAIN.t0) / TRAIN.half);
makePuffs(stage, [
  ...chimneys.map(([x, y], i) => ({ every: 1.15, life: 3.4, rise: 0.75, drift: [0.22, 0], size: [0.35, 1.0], from: 3.2, phase: i * 0.37,
    at: () => _v.set(x, y + LIFT, 0.1).applyMatrix4(villageCard.matrixWorld).clone() })),
  { every: 0.42, life: 2.2, rise: 0.9, drift: [0, 0], size: [0.3, 0.95], from: 3.0,
    at: (tb) => { const x = trainX(tb) + 2.38; return Math.abs(x) > 6.3 ? null : _v.set(x, DECK + 2.1, 0.2).applyMatrix4(midRow.matrixWorld).clone(); } },
]);

// ---------------------------------------------------------------------------------------------------------------
// motion: one fold angle, driven like a hand opening the card (a spring following a ramp), poses everything
// ---------------------------------------------------------------------------------------------------------------
const CAM = { p0: 52, p1: 25, d0: 54, d1: 61, bump: 3, push: 1.0, az: -4, drift: 7, x1: 0, y0: 0.4, y1: 5.45, z0: 3.6, z1: -0.6 };
const fold = { p: 0, v: 0 };
stage.onRestart(() => { fold.p = 0; fold.v = 0; });
stage.onTick((h, t) => {
  const u = Math.min(1, Math.max(0, (t - 0.4) / 2.05)), target = u * u * (2 - u);       // eases in, arrives with speed
  const w = 2 * Math.PI * 1.5, z = 0.42;
  fold.v += (w * w * (target - fold.p) - 2 * z * w * fold.v) * h; fold.p += fold.v * h;
});
const armTurn = (t) => { const T = 1.2, u = Math.min(1, Math.max(0, (t - 2.0) / T)); return T * (u * u * u - u * u * u * u / 2) + Math.max(0, t - 2.0 - T); };   // seconds of turning
const D2R = Math.PI / 180;
stage.onPose((t) => {
  const th = TH0 + (Math.PI / 2 - TH0) * fold.p, lean = Math.PI / 2 - th;
  wallPivot.rotation.x = lean;
  for (const r of rows) r.rotation.x = lean;
  for (const s of straps) s.rotation.x = -Math.PI / 2 - lean;
  arm.rotation.z = -(ARM.a0 + ARM.speed * armTurn(t)) * D2R;       // clockwise: up over the moon from the left
  trainG.position.x = trainX(t);
  // camera: from above the closed cover down to looking into the card, then a slow drift
  const o = smoother(0.25, 3.3, t), u = Math.max(0, t - 3.3), sw = (1 - Math.cos(Math.PI * u / 7)) / 2;
  const pitch = lerp(CAM.p0, CAM.p1, o) * D2R, az = (lerp(0, CAM.az, o) + CAM.drift * sw) * D2R;
  const dist = lerp(CAM.d0, CAM.d1, o) + CAM.bump * Math.sin(Math.PI * o) ** 2 - CAM.push * sw;
  const look = _v.set(lerp(0, CAM.x1, o), lerp(CAM.y0, CAM.y1, o), lerp(CAM.z0, CAM.z1, o));
  camera.position.set(look.x + dist * Math.cos(pitch) * Math.sin(az), look.y + dist * Math.sin(pitch), look.z + dist * Math.cos(pitch) * Math.cos(az));
  camera.lookAt(look);
  stage.post.focus.set(0, lerp(0.3, 3.4, o), lerp(2.6, 2.2, o));
  card.updateMatrixWorld(true);                 // the smoke reads where the chimneys are now
}, true);

let pieces = 0; card.traverse((o) => { if (o.isMesh) pieces++; });
stage.start({ pieces, extra: {
  ext: () => frameExtent(card, camera), CAM, cardClips: () => cardClips(card),
  /** Extents over time for camera tuning: [t, x, top, bottom]. */
  scan(times) { const out = []; stage.restart(); let t = 0; for (const T of times) { stage.step(T - t); t = T; const e = frameExtent(card, camera); out.push([T, e.x, e.top, e.bottom]); } return out; },
  /** The card's reach in the frame (1 = the edge) over the first 10 seconds. */
  fit() { let x = 0, top = -9, bottom = 9; stage.restart(); for (let i = 0; i <= 100; i++) { if (i) stage.step(0.1); const e = frameExtent(card, camera); x = Math.max(x, e.x); top = Math.max(top, e.top); bottom = Math.min(bottom, e.bottom); } return { x, top, bottom }; },
} });
mountMessageUI();
if (!stage.CAPTURE) document.getElementById('hint')?.classList.add('show');
