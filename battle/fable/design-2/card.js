// design-2 "트리 아래 장난감" (Toys under the tree): a 180-degree book spread with V-folds.
//
// PAPER SPEC
// SUBJECT  a card that opens flat like a book: a Christmas tree of three nested V-folds stands across the gutter
//          between stacks of parcels, a ribbon on candy canes runs in front, toys and potted saplings stand beside
//          it, the letter is written on the left page.
// STOCK    cream board, quiet fibre.  PALETTE  cream #f8f0dd, cranberry #c8413a, fir #2f6b4c / #57996a,
//          mint #cfe3cc, mustard #e5ab3a, kraft #c99a62, blush #f0b9a6; ink #3b2a2a.
// LIGHT    soft morning daylight from the upper left, warm fill, amber shadows.
// LENS     26 deg; the camera starts over the closed cover and moves back and across as the cover turns (58 -> 49 deg).
// TYPES    two printed pages on one gutter fold; four convex V-folds on the gutter, the sharpest at the back
//          (parcels + the back of the tree, two more tree tiers, the ribbon); parallel folds off the back V
//          (rocking horse, teddy and drum, saplings; ribbon straps); a spinner on a pin (the star); swinging arms
//          on pins (baubles, the teddy's drumming arm); a rocker on a pin (the horse).
// MOTION   one fold angle (a spring following the hand, one soft slap on the table) poses every hinge.
// LIFE     paper snow.
import { createStage, THREE, P2, woodTable, makeSnow, frameExtent, smooth, smoother, lerp } from './stage.js';
import { makeCard, clipHalf, cardClips } from 'papercraft/lib/paperkit-3d.js';
import { getMessage, loadMessageFont, mountMessageUI } from '../../kit/message.js';
import * as A from './art.js';

const C = {
  paper: '#f8f0dd', paperLit: '#fdf8ea', paperShade: '#eadfc6',
  red: '#c8413a', redDark: '#a03030', blush: '#f0b9a6',
  fir0: '#2f6b4c', fir1: '#3f8058', fir2: '#57996a', firDark: '#234f3a', mint: '#cfe3cc', sage: '#93b99a',
  gold: '#e5ab3a', goldLight: '#f6d273', kraft: '#c99a62', wood: '#8a5a3a', brown: '#6a4630', bear: '#b9824e',
  blue: '#6fa0b6', cream: '#fbf4e3', ink: '#3b2a2a', light: '#ffd870',
};
const WP = 19, DP = 20, T = 0.16, CX = WP / 2;    // each page 19 x 20 cm of thick board (what is folded inside beds into it)
const PHI0 = THREE.MathUtils.degToRad(1.8);       // closed, the cover rests on what is folded inside
const D2R = Math.PI / 180;
// the V-folds on the gutter: apex z, the angle between each glued base line and the gutter
// (a wing nearer the viewer must never stand up sooner than one behind it, or it would cut through it while the
// card closes: so the V at the back is the sharpest and each one in front is a little flatter)
const V0 = { z: -5.0, a: 62 * D2R }, V1 = { z: -3.3, a: 66 * D2R }, V2 = { z: -1.6, a: 70 * D2R }, V3 = { z: 2.0, a: 74 * D2R };

const msg = getMessage();
await loadMessageFont();
await loadMessageFont('Jua');
await Promise.race([Promise.all([
  document.fonts.load('100px "Nanum Pen Script"', `${msg.to}${msg.msg}${msg.from}—`),
  document.fonts.load('100px "Jua"', '메리 크리스마스 MERRY CHRISTMAS'),
]).catch(() => 0), new Promise((r) => setTimeout(r, 4000))]);

const stage = createStage({
  bg: '#b9a48c', fov: 26,
  light: { key: '#ffe6c8', keyIntensity: 3.0, keyDir: [-0.66, 1.0, 0.5], fill: '#f3e6d6', fillIntensity: 0.9, fillDir: [0.35, 0.6, 1.0],
    sky: '#fff3e0', ground: '#bfa58a', skyIntensity: 0.44, target: [0, 3, 0], shadowExtent: 32 },
  leak: '#a2683a',
  lens: { aoTint: '#6a4324', shadowTint: '#3a200c', vignette: 0.07, exposure: 0.83, contrast: 1.14, saturation: 1.0, greenDesat: 0.06 },
});
const { paper, scene, camera } = stage;
const CARD = { paper, thickness: 0.05, edgeWidth: 0.045, pxPerUnit: 64 };

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
woodTable(stage, { tones: ['#b9a792', '#b09d88', '#c2b19d'], gap: '#917b68', grainDark: '#836a55', grainLight: '#dccdb9', plank: 13, seed: 33, along: 'z', center: [0, 0] });
const lay = (mesh, x, z, rot = 0, y = 0.02) => { mesh.rotation.set(-Math.PI / 2, 0, rot); mesh.position.set(x, y, z); mesh.userData.noFit = true; scene.add(mesh); return mesh; };
{ // the red envelope, a sprig of fir, punched stars
  const env = makeCard(P2.shape.rect(22, 16).map(([x, y]) => [x, y - 8]), { ...CARD, thickness: 0.035, seed: 41, folds: [], back: false, contact: null, paint: (P) => {
    P.fill('#cdb18a'); P.felt(0.7);
    P.layer([[-11, 8], [11, 8], [0, -1.2]], '#d6bc96', { depth: 1.2, rim: 0.35, shadow: 1.3 });
    P.layer((g) => A.disc(g, 0, -1.0, 1.15), C.red, { depth: 1.0 });
    P.layer((g) => A.star(g, 0, -1.0, 0.66, 0.28), C.redDark, { depth: 0.4, shadow: 0 });
    P.innerShade('#6a4a2a', { alpha: 0.22, blurPx: 14 });
  } });
  lay(env, 17.5, -7.5, 0.3, 0.019);
  const r = P2.rng(8);
  for (const [x, z, s, col] of [[-24.5, 7.5, 0.9, C.gold], [-23.0, 10.6, 0.6, C.red], [24.6, 8.6, 0.8, C.gold], [23.4, 11.4, 0.5, C.fir1], [-24.4, -8.5, 0.6, C.gold], [25.6, 1.5, 0.55, C.red]]) {
    const st = makeCard(A.starPts(0, 0, s, s * 0.46), { ...CARD, thickness: 0.03, seed: 50 + x, folds: [], back: false, contact: null, edgeWidth: 0.03, paint: (P) => { P.fill(col); P.felt(0.5); } });
    lay(st, x, z, r() * 6.28, 0.016);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the card: two pages on a gutter fold (the right one stays on the table, the left one is the cover)
// ---------------------------------------------------------------------------------------------------------------
const card = new THREE.Group(); card.position.set(0, 0.045, 0); scene.add(card);      // the gutter runs along z
const SKIRT = { z: -4.6, r: 7.4 };
function pageBase(P, side) {                     // shared by both pages: x across (0 at the gutter), y = -z
  const r = P.r, sx = side;
  P.fill(C.paper); P.felt(0.5);
  P.draw((g) => {                                // pale printed stars and snowflakes
    g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = sx * (0.8 + r() * (WP - 1.6)), y = -9.4 + r() * 18.8, s = 0.22 + r() * 0.3;
      if (r() < 0.5) { g.fillStyle = P2.rgba(C.gold, 0.26); A.sparkle(g, x, y, s); } else { g.strokeStyle = P2.rgba(C.sage, 0.5); g.lineWidth = 0.05; A.snowflake(g, x, y, s * 1.1); }
    }
  });
  // the tree skirt: a cranberry round with a scalloped cream edge, half on each page
  P.layer((g) => A.disc(g, 0, -SKIRT.z, SKIRT.r), C.red, { depth: 0.8, felt: 0.5, rim: 0.3 });
  P.layer((g) => { for (let i = 0; i < 40; i++) { const a = (i / 40) * A.TAU; A.disc(g, Math.cos(a) * (SKIRT.r - 0.75), -SKIRT.z + Math.sin(a) * (SKIRT.r - 0.75), 0.36); } }, C.cream, { depth: 0.35, shadow: 0.6 });
  P.draw((g) => { g.strokeStyle = P2.rgba(C.cream, 0.85); g.lineWidth = 0.09; g.setLineDash([0.36, 0.3]); g.beginPath(); g.arc(0, -SKIRT.z, SKIRT.r - 1.6, 0, A.TAU); g.stroke(); g.setLineDash([]);
    g.strokeStyle = P2.rgba(C.cream, 0.6); g.lineWidth = 0.07; for (let i = 0; i < 9; i++) A.snowflake(g, Math.cos(i * 0.7 + 0.35) * 4.2, -SKIRT.z + Math.sin(i * 0.7 + 0.35) * 4.2, 0.5); });
  // a cranberry line inside the page edge, score lines where the V-folds are glued
  P.draw((g) => {
    g.strokeStyle = C.red; g.lineWidth = 0.09; g.beginPath(); g.moveTo(0, 9.4); g.lineTo(sx * (WP - 0.6), 9.4); g.lineTo(sx * (WP - 0.6), -9.4); g.lineTo(0, -9.4); g.stroke();
    g.strokeStyle = C.gold; g.lineWidth = 0.04; g.beginPath(); g.moveTo(0, 9.1); g.lineTo(sx * (WP - 0.9), 9.1); g.lineTo(sx * (WP - 0.9), -9.1); g.lineTo(0, -9.1); g.stroke();
    g.strokeStyle = P2.rgba(C.brown, 0.22); g.lineWidth = 0.05;
    for (const [v, len] of [[V0, 10.6], [V1, 6.8], [V2, 5.6], [V3, 6]]) { g.beginPath(); g.moveTo(0, -v.z); g.lineTo(sx * Math.sin(v.a) * len, -v.z + Math.cos(v.a) * len); g.stroke(); }
  });
}
function paintRight(P) {
  pageBase(P, 1);
  // a printed wreath in the open corner
  const cx = 10.8, cy = -5.3, R = 2.8, r = P.r;
  P.layer((g) => { for (let i = 0; i < 26; i++) { const a = (i / 26) * A.TAU; P2.fillLeaf(g, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 1.25, a + 1.9 + (i % 2) * 0.9, 0.3); } }, C.fir1, { depth: 0.45 });
  P.layer((g) => { for (let i = 0; i < 26; i++) { const a = (i / 26) * A.TAU + 0.12; P2.fillLeaf(g, cx + Math.cos(a) * (R + 0.1), cy + Math.sin(a) * (R + 0.1), 1.0, a + 1.3 - (i % 2) * 0.8, 0.3); } }, C.fir2, { depth: 0.4 });
  P.layer((g) => { for (let i = 0; i < 9; i++) { const a = (i / 9) * A.TAU + 0.3; A.disc(g, cx + Math.cos(a) * (R + (i % 2 ? 0.25 : -0.2)), cy + Math.sin(a) * (R + (i % 2 ? 0.25 : -0.2)), 0.2); } }, C.red, { depth: 0.3 });
  P.layer((g) => { A.ell(g, cx - 0.62, cy - R - 0.1, 0.7, 0.4, 0.5); A.ell(g, cx + 0.62, cy - R - 0.1, 0.7, 0.4, -0.5); P2.fillLeaf(g, cx, cy - R - 0.1, 1.5, -1.95, 0.2); P2.fillLeaf(g, cx, cy - R - 0.1, 1.5, -1.2, 0.2); A.disc(g, cx, cy - R - 0.1, 0.26); }, C.red, { depth: 0.45 });
  P.innerShade('#8a6a40', { alpha: 0.2, blurPx: 16 });
}
/** The letter, handwritten on the left page: who it is for, the message, who it is from. Wraps and shrinks to fit. */
const NOTE = { x0: -18.0, x1: -1.3, y0: -9.2, y1: -0.6 };
function paintLeft(P) {
  pageBase(P, -1);
  P.layer((g) => A.rrect(g, NOTE.x0, NOTE.y0, NOTE.x1 - NOTE.x0, NOTE.y1 - NOTE.y0, 0.35), C.paperLit, { depth: 0.8, shadow: 1.0, felt: 0.4, rim: 0.3 });
  P.layer((g) => { for (const [x, y, a] of [[NOTE.x0 + 0.9, NOTE.y1 - 0.85, 2.3], [NOTE.x1 - 0.9, NOTE.y0 + 0.85, -0.8]]) { P2.fillLeaf(g, x, y, 1.05, a, 0.34); P2.fillLeaf(g, x, y, 1.05, a + 1.25, 0.34); P2.fillLeaf(g, x, y, 0.9, a - 1.2, 0.34); } }, C.fir1, { depth: 0.4 });
  P.layer((g) => { for (const [x, y] of [[NOTE.x0 + 0.9, NOTE.y1 - 0.85], [NOTE.x1 - 0.9, NOTE.y0 + 0.85]]) { A.disc(g, x, y, 0.17); A.disc(g, x + 0.25, y + 0.15, 0.15); A.disc(g, x + 0.05, y - 0.25, 0.15); } }, C.red, { depth: 0.3 });
  P.draw((g) => {
    const x0 = NOTE.x0 + 0.7, x1 = NOTE.x1 - 0.7, w = x1 - x0, top = NOTE.y1 - 0.4, bot = NOTE.y0 + 0.45;
    const to = A.fitText(g, msg.to, { w: w * 0.86, h: 2.5, max: 1.75, min: 0.5, lead: 0.98, maxLines: 2 });
    const from = A.fitText(g, `— ${msg.from}`, { w: w * 0.86, h: 2.5, max: 1.75, min: 0.5, lead: 0.98, maxLines: 2 });
    const rowTo = msg.to ? to.lines.length * to.size * 1.0 : 0, rowFrom = msg.from ? from.lines.length * from.size * 1.0 : 0;
    const body = A.fitText(g, msg.msg, { w, h: top - bot - rowTo - rowFrom - 0.2, max: 2.1, min: 0.55, lead: 1.04, maxLines: 6 });
    if (msg.to) to.lines.forEach((ln, i) => A.text(g, ln, x0 + 1.3, top - (i + 0.8) * to.size * 0.98, { size: to.size, align: 'left', color: C.red }));
    const bh = body.lines.length * body.size * body.lead, by = top - rowTo - 0.1 - (top - bot - rowTo - rowFrom - 0.2 - bh) / 2;
    body.lines.forEach((ln, i) => A.text(g, ln, (x0 + x1) / 2, by - (i + 0.78) * body.size * body.lead, { size: body.size, color: C.ink }));
    if (msg.from) from.lines.forEach((ln, i) => A.text(g, ln, x1 - 1.3, bot + (from.lines.length - 1 - i + 0.26) * from.size * 0.98, { size: from.size, align: 'right', color: C.fir0 }));
  });
  P.innerShade('#8a6a40', { alpha: 0.2, blurPx: 16 });
}
function paintCover(P) {                         // x from the spine (0) to the opening edge (17), y away from the viewer
  const r = P.r;
  P.fill(C.red); P.felt(0.7);
  P.draw((g) => { g.strokeStyle = P2.rgba(C.blush, 0.3); g.lineWidth = 0.05; g.lineCap = 'round'; for (let i = 0; i < 30; i++) { const x = 1 + r() * (WP - 2), y = -9 + r() * 18; if (Math.hypot(x - CX, y - 1.4) < 6.4) continue; if (i % 2) A.snowflake(g, x, y, 0.3 + r() * 0.3); else { g.fillStyle = P2.rgba(C.goldLight, 0.55); A.sparkle(g, x, y, 0.16 + r() * 0.2); } } });
  P.layer((g) => { g.lineWidth = 0.14; g.beginPath(); g.roundRect(0.9, -9.1, WP - 1.8, DP - 1.8, 0.8); g.stroke(); }, C.goldLight, { depth: 0.4, shadow: 0.7 });
  P.layer(A.circlePts(CX, 1.6, 5.6, 90), C.cream, { depth: 1.2, shadow: 1.3, rim: 0.5, felt: 0.5 });
  P.draw((g) => { g.strokeStyle = C.red; g.lineWidth = 0.06; g.setLineDash([0.3, 0.26]); g.beginPath(); g.arc(CX, 1.6, 5.15, 0, A.TAU); g.stroke(); });
  // a little cut-paper tree on the round
  for (const [yb, hw, top, col] of [[-1.4, 3.1, 2.4, C.fir0], [0.6, 2.4, 4.2, C.fir1], [2.5, 1.6, 5.6, C.fir2]]) P.layer((g) => A.firTier(g, CX, yb, hw, top, 4), col, { depth: 0.7, rim: 0.4, rimColor: C.mint });
  P.layer((g) => g.fillRect(CX - 0.4, -2.5, 0.8, 1.4), C.wood, { depth: 0.5 });
  P.layer((g) => { for (const [x, y] of [[-1.5, -0.5], [1.1, 0.2], [-0.3, 1.6], [0.9, 2.2], [-0.9, 3.0], [0.1, 3.9], [1.9, -0.8], [-2.1, -0.9]]) A.disc(g, CX + x, y, 0.2); }, C.goldLight, { depth: 0.3 });
  P.layer((g) => { for (const [x, y] of [[0.1, -0.2], [-1.1, 1.2], [0.7, 3.2], [-0.5, 2.4]]) A.disc(g, CX + x, y, 0.2); }, C.red, { depth: 0.3 });
  P.layer((g) => A.star(g, CX, 5.9, 0.85, 0.38), C.goldLight, { depth: 0.6 });
  P.layer((g) => A.text(g, '메리 크리스마스', CX, -6.3, { size: 2.4, family: 'Jua' }), C.cream, { depth: 0.5, shadow: 1 });
  P.draw((g) => { g.fillStyle = P2.rgba(C.goldLight, 0.95); const s = 'MERRY CHRISTMAS'; let x = CX - ((s.length - 1) * 0.74) / 2; for (const ch of s) { A.text(g, ch, x, -7.9, { size: 0.72, family: 'Jua' }); x += 0.74; } });
  P.innerShade('#5a1410', { alpha: 0.35, blurPx: 22 });
}
const flat = (pts) => pts;     // page outlines are authored in (x, -z)
const rightPage = makeCard(flat([[0, -DP / 2], [WP, -DP / 2], [WP, DP / 2], [0, DP / 2]]), { ...CARD, thickness: T, seed: 2, folds: ['left'], contact: null, back: false, paint: paintRight });
rightPage.rotation.x = -Math.PI / 2; rightPage.position.y = T / 2; rightPage.name = 'right page'; card.add(rightPage);
const leftPivot = new THREE.Group(); leftPivot.position.y = T; card.add(leftPivot);
const leftPage = makeCard(flat([[-WP, -DP / 2], [0, -DP / 2], [0, DP / 2], [-WP, DP / 2]]), { ...CARD, thickness: T / 2, seed: 3, folds: ['right'], contact: null, back: false, paint: paintLeft });
leftPage.rotation.x = -Math.PI / 2; leftPage.position.y = -T / 4; leftPage.name = 'left page'; leftPivot.add(leftPage);
const coverCard = makeCard(flat([[0, -DP / 2], [WP, -DP / 2], [WP, DP / 2], [0, DP / 2]]), { ...CARD, thickness: T / 2, seed: 4, folds: ['left'], contact: null, back: false, paint: paintCover });
{ const g = new THREE.Group(); g.rotation.z = Math.PI; g.position.y = -T * 0.75; coverCard.rotation.x = -Math.PI / 2; coverCard.name = 'cover'; g.add(coverCard); leftPivot.add(g); }

// ---------------------------------------------------------------------------------------------------------------
// V-folds and the rows parallel to them. Everything is posed in the frame that bisects the two pages: there both
// pages are lifted by psi, each wing holds its glued base line and the crease they share.
// ---------------------------------------------------------------------------------------------------------------
const bis = new THREE.Group(); bis.position.y = T; card.add(bis);
const posed = [];           // { obj, sd, v, s0, d, flatOnPage }
const _b = new THREE.Vector3(), _c = new THREE.Vector3(), _e = new THREE.Vector3(), _x = new THREE.Vector3(), _z = new THREE.Vector3(), _n = new THREE.Vector3();
function place(o, psi) {
  const sa = Math.sin(o.v.a), ca = Math.cos(o.v.a), sp = Math.sin(psi), cp = Math.cos(psi), sd = o.sd;
  _b.set(sd * sa * cp, sa * sp, -ca);            // along the glued base line, away from the apex
  _c.set(0, ca, sa * sp).normalize();             // up the wing: the crease direction
  _e.set(sd * ca * cp, ca * sp, sa);              // in the page, square to the base line, toward the viewer
  const h = o.h || 0, px = _b.x * o.s0 + _e.x * o.d + _c.x * h, py = _b.y * o.s0 + _e.y * o.d + _c.y * h, pz = o.v.z + _b.z * o.s0 + _e.z * o.d + _c.z * h;
  if (o.strap) { _x.copy(_b).multiplyScalar(sd); _z.copy(_e).multiplyScalar(-1); o.obj.matrix.makeBasis(_x, _z, _n.crossVectors(_x, _z)); }   // a strap stays parallel to the page
  else { const k = o.k || 1; _x.copy(_b).multiplyScalar(sd); _z.crossVectors(_x, _c); o.obj.matrix.makeBasis(_x.multiplyScalar(k), _n.copy(_c).multiplyScalar(k), _z.multiplyScalar(k)); }
  o.obj.matrix.setPosition(px, py, pz); o.obj.matrixWorldNeedsUpdate = true;
}
const pose = (obj, sd, v, s0 = 0, d = 0, extra = {}) => { obj.matrixAutoUpdate = false; bis.add(obj); posed.push({ obj, sd, v, s0, d, ...extra }); return obj; };
/** A V-fold from one symmetric drawing: two wings sharing a crease on the gutter. Returns [right, left]. */
function vfold(pts, v, opts) {
  const right = makeCard(pts, { ...CARD, back: 'mirror', ...opts, geomPts: clipHalf(pts, 1) });
  const left = makeCard(pts, { ...CARD, back: 'mirror', ...opts, geomPts: clipHalf(pts, -1), materials: right.material });
  left.userData.setGlow = right.userData.setGlow;
  right.name = `${opts.name} R`; left.name = `${opts.name} L`;
  return [pose(right, 1, v), pose(left, -1, v)];
}
/** A paper strap from a row back to the wall it is parallel to. */
function strap(sd, v, s0, d, h) {
  const m = makeCard(P2.shape.rect(0.62, d), { ...CARD, thickness: 0.035, seed: 70 + s0 * sd, folds: ['bottom', 'top'], contact: null, back: false, paint: (P) => {   // printed as a ribbon
    P.fill(C.red); P.felt(0.5); P.draw((g) => { g.strokeStyle = C.cream; g.lineWidth = 0.05; g.setLineDash([0.22, 0.18]); for (const x of [-0.2, 0.2]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, d); g.stroke(); } }); } });
  m.name = 'strap'; return pose(m, sd, v, s0, d, { h, strap: true });
}

// ---- the tree: tiers of scalloped skirts, the same cut for every layer
const crease = (P, H) => P.draw((g) => { g.strokeStyle = 'rgba(30,40,30,0.22)'; g.lineWidth = 0.05; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, H); g.stroke(); g.strokeStyle = 'rgba(255,250,235,0.25)'; g.beginPath(); g.moveTo(-0.05, 0); g.lineTo(-0.05, H); g.stroke(); });
function treeOps(add, { hw, H, y0 = 0.9, tiers = 3, tone, sag = 0.13 }) {
  const tip = [];                                   // [x, y] of every skirt's outer points (for baubles)
  for (let k = 0; k < tiers; k++) {
    const yb = y0 + (H - y0) * (k / tiers) * 0.86, w = hw * (1 - (k / tiers) * 0.62), top = k === tiers - 1 ? H : yb + ((H - y0) / tiers) * 1.55;
    add(`tier${k}`, P2.shade(tone, k * 0.05), (g) => A.firTier(g, 0, yb, w, top, Math.max(3, 6 - k) | 0, sag));
    tip.push([w, yb + w * sag]);
  }
  return tip;
}
const garland = (g, y, w, n, r = 0.14, dip = 0.5) => { for (let i = 0; i <= n; i++) { const u = i / n; A.disc(g, -w + 2 * w * u, y - dip * Math.sin(u * Math.PI) + 0, r); } };

// ---- V0: the wall of parcels with the back of the tree in the middle
const TREE0 = { hw: 7.0, H: 14.4 }, boxes = [], BK = 1;
{ // parcels, mirrored with small differences: [x0, y0, w, h, body, ribbon]
  const stack = (sd) => {
    const m = (x0, y0, w, h, body, rib, bow = false) => boxes.push([(sd > 0 ? x0 : -x0 - w) * BK, y0 * BK, w * BK, h * BK, body, rib, bow]);
    m(6.2, 0, 2.7, 2.6, sd > 0 ? C.red : C.mint, sd > 0 ? C.cream : C.red); m(6.55, 2.6, 2.0, 1.9, sd > 0 ? C.mint : C.gold, sd > 0 ? C.red : C.cream); m(6.9, 4.5, 1.3, 1.2, sd > 0 ? C.gold : C.red, sd > 0 ? C.red : C.goldLight, true);
    m(8.95, 0, 1.6, 1.75, sd > 0 ? C.blush : C.fir2, sd > 0 ? C.fir1 : C.goldLight); m(9.15, 1.75, 1.2, 1.05, sd > 0 ? C.fir2 : C.blush, sd > 0 ? C.goldLight : C.red, true);
  };
  stack(1); stack(-1);
}
let tips0;
const wall = piece({ w: 22, h: 14.9, res: 36, name: 'wall', build: (add) => {
  for (const [x0, y0, w, h, body, rib, bow] of boxes) {
    add('box', body, (g) => A.rrect(g, x0, y0, w, h, 0.08));
    add('lid', P2.shade(body, -0.12), (g) => A.rrect(g, x0 - 0.1, y0 + h - 0.46, w + 0.2, 0.46, 0.08));
    add('ribbon', rib, (g) => { g.fillRect(x0 + w / 2 - 0.19, y0 + 0.04, 0.38, h - 0.04); g.fillRect(x0 + 0.04, y0 + h * 0.36, w - 0.08, 0.3); }, { print: true });
    if (bow) add('bow', rib, (g) => { A.ell(g, x0 + w / 2 - 0.34, y0 + h + 0.2, 0.36, 0.2, 0.5); A.ell(g, x0 + w / 2 + 0.34, y0 + h + 0.2, 0.36, 0.2, -0.5); A.disc(g, x0 + w / 2, y0 + h + 0.12, 0.15); });
  }
  add('snowline', C.cream, (g) => { g.beginPath(); g.moveTo(-10.6, 0); g.lineTo(-10.6, 0.5); A.scallops(g, -10.6, 10.6, 0.5, 11, 0.2); g.lineTo(10.6, 0); g.closePath(); g.fill(); });
  tips0 = treeOps(add, { hw: TREE0.hw, H: TREE0.H, y0: 1.0, tiers: 4, tone: C.fir0 });
} });
const [wallR, wallL] = vfold(wall.pts, V0, { name: 'wall', seed: 11, glow: 1.0, glowColor: '#ffcf70', contact: { amount: 0.1, height: 0.8 }, paint: (P) => {
  P.fill(C.paperShade);
  wall.layer(P, 'box', { depth: 0.9, felt: 0.4 }); wall.layer(P, 'lid', { depth: 0.5 }); wall.layer(P, 'ribbon', { depth: 0.35, shadow: 0.6 }); wall.layer(P, 'bow', { depth: 0.5 });
  P.draw((g) => { const r = P.r; g.fillStyle = 'rgba(255,255,255,0.5)'; for (const [x0, y0, w, h] of boxes) for (let i = 0; i < 5; i++) A.disc(g, x0 + 0.3 + r() * (w - 0.6), y0 + 0.3 + r() * (h - 0.9), 0.07); });
  for (let k = 0; k < 4; k++) wall.layer(P, `tier${k}`, { depth: 1.0, rim: 0.5, rimColor: C.sage, felt: 0.5 });
  treeTrim(P, tips0, TREE0, 7);
  wall.layer(P, 'snowline', { depth: 0.6, rim: 0.3 });
  crease(P, TREE0.H);
  P.innerShade('#2a2a18', { alpha: 0.24, blurPx: 16 });
} });
/** What hangs on a tree layer: bead garlands, small lit lamps (they glow), printed ornaments. */
function treeTrim(P, tips, tr, seed) {
  const r = P2.rng(seed), n = tips.length;
  P.layer((g) => { tips.forEach(([w, y], k) => { if (k < n) garland(g, y + (tr.H - y) / n * 0.5, w * 0.72, Math.round(w * 2.2), 0.13, 0.42); }); }, C.goldLight, { depth: 0.3, shadow: 0.7 });
  const lamps = []; tips.forEach(([w, y], k) => { const m = Math.max(2, Math.round(w * 0.9)); for (let i = 0; i < m; i++) lamps.push([(-0.8 + 1.6 * (i + 0.5) / m) * w + (r() - 0.5) * 0.3, y + 0.5 + r() * ((tr.H - y) / n * 0.5)]); });
  P.layer((g) => { for (const [x, y] of lamps) A.disc(g, x, y, 0.17); }, C.light, { depth: 0.3, shadow: 0.6 });
  P.glow((g) => { for (const [x, y] of lamps) A.disc(g, x, y, 0.13); });
  P.layer((g) => { tips.forEach(([w, y], k) => { for (const sx of [-1, 1]) { const x = sx * w * (0.34 + 0.2 * r()), yy = y + (tr.H - y) / n * (0.2 + 0.25 * r()); g.fillStyle = [C.red, C.cream, C.blush][(k + (sx > 0 ? 1 : 0)) % 3]; if ((k + (sx > 0)) % 2) A.star(g, x, yy, 0.3, 0.13); else { g.save(); g.translate(x, yy); g.rotate(sx * 0.3); A.rrect(g, -0.12, -0.34, 0.24, 0.68, 0.1); g.restore(); } } }); }, C.red, { depth: 0.3, shadow: 0.7 });
}

// ---- V1, V2: two more layers of the tree, each a sharper V standing in front
function treeLayer(v, tr, tone, seed, extra) {
  let tips;
  const p = piece({ w: tr.hw * 2 + 1, h: tr.H + 0.4, res: 36, name: 'tree', build: (add) => { if (extra) extra(add); tips = treeOps(add, { ...tr, tone }); } });
  const wings = vfold(p.pts, v, { name: `tree ${seed}`, seed, glow: 1.0, glowColor: '#ffcf70', contact: { amount: 0.12, height: 0.8 }, paint: (P) => {
    P.fill(tone);
    if (extra) { p.layer(P, 'trunk', { depth: 0.6 }); p.layer(P, 'pot', { depth: 0.8, felt: 0.4 }); p.flat(P, 'potband'); }
    for (let k = 0; k < tr.tiers; k++) p.layer(P, `tier${k}`, { depth: 1.0, rim: 0.5, rimColor: C.mint, felt: 0.5 });
    treeTrim(P, tips, tr, seed);
    crease(P, tr.H);
    P.innerShade('#1f3a22', { alpha: 0.22, blurPx: 14 });
  } });
  return { wings, tips };
}
const TREE1 = { hw: 6.8, H: 10.6, y0: 0.6, tiers: 3 }, TREE2 = { hw: 5.6, H: 7.0, y0: 1.9, tiers: 2 };
const tree1 = treeLayer(V1, TREE1, C.fir1, 21);
const tree2 = treeLayer(V2, TREE2, C.fir2, 23, (add) => {
  add('trunk', C.wood, (g) => g.fillRect(-0.55, 0.9, 1.1, 1.6));
  add('pot', C.red, (g) => A.poly(g, [[-1.5, 0], [1.5, 0], [1.9, 1.5], [-1.9, 1.5]]));
  add('potband', C.cream, (g) => { g.fillRect(-1.86, 1.06, 3.72, 0.22); for (let i = -3; i <= 3; i++) A.disc(g, i * 0.48, 0.55, 0.1); }, { print: true });
});

// ---- V3: a ribbon on two candy canes, across the front of the tree
const RIB = { hw: 5.9, y0: 1.25, y1: 3.2 };
const ribbon = piece({ w: 13.4, h: 4.3, res: 40, name: 'ribbon', build: (add) => {
  for (const sx of [-1, 1]) {
    const x = sx * 5.05;
    add('cane', C.cream, (g) => { g.lineWidth = 0.46; g.beginPath(); g.moveTo(x, 0.26); g.lineTo(x, 3.3); g.arc(x + sx * 0.52, 3.3, 0.52, sx > 0 ? Math.PI : 0, sx > 0 ? 0 : Math.PI, sx > 0); g.stroke(); g.fillRect(x - 0.23, 0, 0.46, 0.3); });
    add('stripe', C.red, (g) => { g.save(); g.beginPath(); g.rect(x - 0.24, 0, 0.48, 3.3); g.clip(); g.lineWidth = 0.2; for (let y = -0.2; y < 3.6; y += 0.52) { g.beginPath(); g.moveTo(x - 0.3, y); g.lineTo(x + 0.3, y + 0.36); g.stroke(); } g.restore();
      g.lineWidth = 0.2; for (let i = 0; i < 4; i++) { const a = (sx > 0 ? Math.PI : 0) + (sx > 0 ? -1 : 1) * (0.25 + i * 0.75); g.beginPath(); g.moveTo(x + sx * 0.52 + Math.cos(a) * 0.3, 3.3 + Math.sin(a) * 0.3); g.lineTo(x + sx * 0.52 + Math.cos(a + 0.25 * (sx > 0 ? -1 : 1)) * 0.74, 3.3 + Math.sin(a + 0.25 * (sx > 0 ? -1 : 1)) * 0.74); g.stroke(); } }, { print: true });
    add('tail', C.redDark, (g) => A.poly(g, [[sx * 5.3, RIB.y0 - 0.35], [sx * 6.5, RIB.y0 - 0.35], [sx * 6.05, (RIB.y0 + RIB.y1) / 2 - 0.35], [sx * 6.5, RIB.y1 - 0.35], [sx * 5.3, RIB.y1 - 0.35]]));
  }
  add('band', C.red, (g) => { g.beginPath(); g.moveTo(-RIB.hw, RIB.y0); g.quadraticCurveTo(0, RIB.y0 + 0.55, RIB.hw, RIB.y0); g.lineTo(RIB.hw, RIB.y1); g.quadraticCurveTo(0, RIB.y1 + 0.55, -RIB.hw, RIB.y1); g.closePath(); g.fill(); });
  add('words', C.cream, (g) => { A.text(g, '메리', -2.95, RIB.y0 + 0.78, { size: 1.5, family: 'Jua' }); A.text(g, '크리스마스', 2.95, RIB.y0 + 0.78, { size: 1.18, family: 'Jua' }); }, { print: true });
  add('seam', C.goldLight, (g) => { g.lineWidth = 0.06; g.setLineDash([0.22, 0.2]); for (const dy of [0.2, -0.2]) { g.beginPath(); g.moveTo(-RIB.hw + 0.15, (dy > 0 ? RIB.y0 : RIB.y1) + dy); g.quadraticCurveTo(0, (dy > 0 ? RIB.y0 : RIB.y1) + dy + 0.55, RIB.hw - 0.15, (dy > 0 ? RIB.y0 : RIB.y1) + dy); g.stroke(); } g.setLineDash([]); }, { print: true });
} });
vfold(ribbon.pts, V3, { name: 'ribbon', seed: 31, contact: { amount: 0.1, height: 0.5 }, paint: (P) => {
  P.fill(C.red);
  ribbon.layer(P, 'cane', { depth: 0.6 }); ribbon.flat(P, 'stripe');
  ribbon.layer(P, 'tail', { depth: 0.6 }); ribbon.layer(P, 'band', { depth: 0.9, felt: 0.5, rim: 0.3, rimColor: C.blush });
  ribbon.flat(P, 'seam'); ribbon.layer(P, 'words', { depth: 0.35, shadow: 0.9 });
  crease(P, 3.8);
} });

// ---- rows parallel to the wall of parcels: the rocking horse on its pin (right), teddy and drum (left)
const horse = piece({ w: 6.6, h: 5.8, res: 44, name: 'horse', build: (add0) => {
  const add = (pass, color, fn, o) => add0(pass, color, (g) => { g.save(); g.scale(-1, 1); fn(g); g.restore(); }, o);   // he faces the tree
  add('rocker', C.red, (g) => { g.lineWidth = 0.44; g.lineCap = 'butt'; g.beginPath(); g.arc(0, 4.6, 4.38, -Math.PI / 2 - 0.64, -Math.PI / 2 + 0.64); g.stroke(); });
  add('tail', C.gold, (g) => { P2.fillLimb(g, -1.6, 2.95, -2.55, 3.1, -2.6, 1.7, 0.55, 0.2); });
  add('leg', '#e3d2b6', (g) => { P2.fillLimb(g, -1.1, 2.2, -1.5, 1.4, -1.75, 0.55, 0.5, 0.3); P2.fillLimb(g, 1.0, 2.2, 1.5, 1.4, 1.95, 0.6, 0.5, 0.3); });
  add('body', C.cream, (g) => { A.ell(g, -0.1, 2.6, 1.75, 0.95); P2.fillLimb(g, 1.0, 2.9, 1.45, 3.7, 1.7, 4.45, 1.25, 0.85); });
  add('leg2', C.cream, (g) => { P2.fillLimb(g, -0.7, 2.2, -0.75, 1.3, -0.55, 0.36, 0.52, 0.32); P2.fillLimb(g, 0.75, 2.2, 0.8, 1.3, 0.75, 0.34, 0.52, 0.32); });
  add('head', C.cream, (g) => { A.ell(g, 2.22, 4.42, 0.86, 0.5, -0.55); A.poly(g, [[1.45, 4.85], [1.62, 5.5], [1.98, 4.95]]); });
  add('mane', C.gold, (g) => { for (let i = 0; i < 5; i++) A.ell(g, 1.36 - i * 0.17, 4.78 - i * 0.42, 0.36, 0.23, 1.0); A.ell(g, 1.75, 5.0, 0.3, 0.2, 0.2); });
  add('saddle', C.red, (g) => { g.beginPath(); g.moveTo(-0.95, 3.5); g.quadraticCurveTo(-0.1, 3.2, 0.75, 3.5); g.lineTo(0.62, 2.55); g.quadraticCurveTo(-0.1, 2.3, -0.82, 2.55); g.closePath(); g.fill(); });
  add('trim', C.fir1, (g) => { g.lineWidth = 0.16; g.beginPath(); g.moveTo(-0.82, 2.62); g.quadraticCurveTo(-0.1, 2.38, 0.62, 2.62); g.stroke(); }, { print: true });
  add('rein', C.red, (g) => { g.lineWidth = 0.12; g.beginPath(); g.moveTo(2.12, 3.98); g.lineTo(2.56, 4.5); g.stroke(); g.beginPath(); g.moveTo(2.3, 4.2); g.quadraticCurveTo(1.6, 3.3, 0.7, 3.42); g.stroke(); }, { print: true });
  add('dots', C.goldLight, (g) => { for (const [x, y] of [[-0.5, 2.95], [-0.1, 2.85], [0.3, 2.95]]) A.star(g, x, y, 0.17, 0.07); for (let i = -3; i <= 3; i++) A.disc(g, Math.sin(i * 0.17) * 4.38, 4.6 - Math.cos(i * 0.17) * 4.38, 0.09); }, { print: true });
  add('spots', '#e6d7bd', (g) => { for (const [x, y, r] of [[-0.9, 2.4, 0.2], [-1.25, 2.9, 0.15], [0.9, 2.35, 0.16], [1.35, 3.4, 0.14]]) A.disc(g, x, y, r); }, { print: true });
  add('eye', C.ink, (g) => { A.disc(g, 2.2, 4.6, 0.085); A.disc(g, 2.82, 4.08, 0.045); }, { print: true });
  add('hoof', C.brown, (g) => { for (const [x, y] of [[-1.78, 0.5], [1.98, 0.55], [-0.54, 0.32], [0.75, 0.3]]) A.ell(g, x, y, 0.2, 0.13); }, { print: true });
} });
const present = piece({ w: 5.2, h: 5.0, res: 40, name: 'present', build: (add) => {
  add('box', C.mint, (g) => A.rrect(g, -2.3, 0, 4.6, 3.7, 0.1));
  add('lid', P2.shade(C.mint, -0.14), (g) => A.rrect(g, -2.45, 3.1, 4.9, 0.7, 0.1));
  add('ribbon', C.red, (g) => { g.fillRect(-0.26, 0, 0.52, 3.8); }, { print: true });
  add('bow', C.red, (g) => { A.ell(g, -0.52, 4.12, 0.6, 0.34, 0.45); A.ell(g, 0.52, 4.12, 0.6, 0.34, -0.45); A.disc(g, 0, 3.98, 0.22); });
  add('dots', C.cream, (g) => { for (let i = 0; i < 12; i++) A.disc(g, -1.9 + (i % 4) * 1.25 + (Math.floor(i / 4) % 2) * 0.6, 0.5 + Math.floor(i / 4) * 0.95, 0.12); }, { print: true });
} });
const bear = piece({ w: 7.2, h: 5.0, res: 44, name: 'bear', build: (add) => {
  const bx = -1.3;
  add('ear', C.bear, (g) => { A.disc(g, bx - 0.72, 4.15, 0.36); A.disc(g, bx + 0.72, 4.15, 0.36); });
  add('limb', P2.shade(C.bear, -0.1), (g) => { A.ell(g, bx - 1.25, 0.55, 0.62, 0.5); A.ell(g, bx + 1.25, 0.55, 0.62, 0.5); A.ell(g, bx - 1.25, 1.9, 0.4, 0.7, 0.5); });
  add('body', C.bear, (g) => A.ell(g, bx, 1.5, 1.2, 1.4));
  add('head', C.bear, (g) => A.disc(g, bx, 3.5, 1.0));
  add('muzzle', '#ecd9b8', (g) => { A.ell(g, bx, 3.22, 0.5, 0.4); A.ell(g, bx, 1.35, 0.72, 0.85); A.disc(g, bx - 0.72, 4.15, 0.17); A.disc(g, bx + 0.72, 4.15, 0.17); A.ell(g, bx - 1.25, 0.5, 0.34, 0.27); A.ell(g, bx + 1.25, 0.5, 0.34, 0.27); }, { print: true });
  add('face', C.ink, (g) => { A.disc(g, bx - 0.36, 3.72, 0.09); A.disc(g, bx + 0.36, 3.72, 0.09); A.ell(g, bx, 3.36, 0.14, 0.1); g.lineWidth = 0.05; g.beginPath(); g.moveTo(bx, 3.3); g.lineTo(bx, 3.12); g.moveTo(bx - 0.2, 3.06); g.quadraticCurveTo(bx, 2.96, bx + 0.2, 3.06); g.stroke(); }, { print: true });
  add('bow', C.red, (g) => { A.ell(g, bx - 0.42, 2.58, 0.44, 0.26, 0.4); A.ell(g, bx + 0.42, 2.58, 0.44, 0.26, -0.4); A.disc(g, bx, 2.56, 0.17); });
  // the drum beside him
  const dx = 1.62;
  add('drum', C.red, (g) => A.rrect(g, dx - 1.25, 0, 2.5, 2.3, 0.12));
  add('hoop', C.goldLight, (g) => { A.rrect(g, dx - 1.33, 1.92, 2.66, 0.42, 0.12); A.rrect(g, dx - 1.33, 0, 2.66, 0.42, 0.12); });
  add('cord', C.cream, (g) => { g.lineWidth = 0.09; g.beginPath(); for (let i = 0; i < 5; i++) { const x = dx - 1.15 + i * 0.46; g.moveTo(x, 1.9); g.lineTo(x + 0.23, 0.44); g.lineTo(x + 0.46, 1.9); } g.stroke(); }, { print: true });
  add('stick', C.wood, (g) => { g.lineWidth = 0.14; g.beginPath(); g.moveTo(dx + 0.95, 2.36); g.lineTo(dx - 0.1, 2.62); g.stroke(); A.disc(g, dx - 0.1, 2.62, 0.15); });
} });
const ROWS = { s: 9.9, d: 6.5, k: 1.15 };
const presentCard = pose(makeCard(present.pts, { ...CARD, seed: 41, contact: { amount: 0.1, height: 0.6 }, paint: (P) => { P.fill(C.mint); present.layer(P, 'box', { depth: 0.9, felt: 0.4 }); present.flat(P, 'dots'); present.layer(P, 'lid', { depth: 0.5 }); present.layer(P, 'ribbon', { depth: 0.4, shadow: 0.6 }); present.layer(P, 'bow', { depth: 0.6 }); } }), 1, V0, ROWS.s + 0.5, ROWS.d, { k: ROWS.k });
presentCard.name = 'present';
const HPIN = [-0.1, 2.75];       // where the horse is pinned (in his own drawing), and where on the parcel
const horsePin = new THREE.Group(); horsePin.position.set(-0.75, HPIN[1], 0.1); presentCard.add(horsePin);
const horseCard = makeCard(horse.pts, { ...CARD, seed: 43, folds: [], contact: null, back: 'kraft', edgeWidth: 0.04, paint: (P) => {
  P.fill(C.cream);
  for (const k of ['rocker', 'tail', 'leg', 'body', 'leg2', 'head', 'mane', 'saddle']) horse.layer(P, k, { depth: 0.6, shadowColor: 'rgba(90,60,30,0.4)' });
  for (const k of ['spots', 'trim', 'rein', 'dots', 'eye', 'hoof']) horse.flat(P, k);
  P.layer((g) => A.disc(g, HPIN[0], HPIN[1], 0.15), C.gold, { depth: 0.3 });
} });
horseCard.position.set(-HPIN[0], -HPIN[1], 0); horseCard.name = 'horse'; horsePin.add(horseCard);
strap(1, V0, ROWS.s - 0.4, ROWS.d - 0.06, 0.45);
const bearCard = pose(makeCard(bear.pts, { ...CARD, seed: 45, contact: { amount: 0.1, height: 0.6 }, paint: (P) => {
  P.fill(C.bear);
  for (const k of ['ear', 'limb', 'body', 'drum', 'hoop', 'head']) bear.layer(P, k, { depth: 0.7, felt: 0.4 });
  bear.flat(P, 'muzzle'); bear.flat(P, 'face'); bear.flat(P, 'cord'); bear.layer(P, 'bow', { depth: 0.5 }); bear.layer(P, 'stick', { depth: 0.4 });
} }), -1, V0, ROWS.s + 0.2, ROWS.d, { k: ROWS.k });
strap(-1, V0, ROWS.s - 0.4, ROWS.d - 0.06, 0.45);
bearCard.name = 'bear';
// his drumming arm, on a pin at the shoulder
const armPin = new THREE.Group(); armPin.position.set(-0.42, 2.34, 0.085); bearCard.add(armPin);
{
  const AP = [-0.85, 0.5];
  const draw = (g) => { g.lineWidth = 0.14; g.lineCap = 'round'; g.beginPath(); g.moveTo(0.1, 0.72); g.lineTo(0.92, 0.6); g.stroke(); A.disc(g, 0.92, 0.6, 0.15); A.ell(g, -0.3, 0.6, 0.66, 0.36, 0.12); };
  const pts = P2.fromDrawing(draw, { w: 2.4, h: 1.2, res: 60, name: 'arm' });
  const m = makeCard(pts, { ...CARD, thickness: 0.04, seed: 47, folds: [], contact: null, back: 'kraft', edgeWidth: 0.035, paint: (P) => {
    P.fill(C.wood);
    P.layer((g) => { g.lineWidth = 0.14; g.lineCap = 'round'; g.beginPath(); g.moveTo(0.1, 0.72); g.lineTo(0.92, 0.6); g.stroke(); A.disc(g, 0.92, 0.6, 0.15); }, C.wood, { depth: 0.3 });
    P.layer((g) => A.ell(g, -0.3, 0.6, 0.66, 0.36, 0.12), P2.shade(C.bear, -0.1), { depth: 0.5, felt: 0.4 });
    P.layer((g) => A.ell(g, 0.18, 0.68, 0.2, 0.17), '#ecd9b8', { depth: 0.3 });
    P.layer((g) => A.disc(g, AP[0] + 0.02, AP[1], 0.1), C.gold, { depth: 0.25 });
  } });
  m.position.set(-AP[0], -AP[1], 0); m.name = 'drum arm'; armPin.add(m);
}

// two potted saplings in the back corners, parallel to the same wall
const sapling = piece({ w: 4.4, h: 5.6, res: 44, name: 'sapling', build: (add) => {
  add('pot', C.kraft, (g) => A.poly(g, [[-0.85, 0], [0.85, 0], [1.05, 1.2], [-1.05, 1.2]]));
  add('band', C.red, (g) => g.fillRect(-1.04, 0.78, 2.08, 0.26), { print: true });
  add('pot', C.wood, (g) => g.fillRect(-0.22, 1.1, 0.44, 0.9));
  add('tier0', C.fir1, (g) => A.firTier(g, 0, 1.5, 1.9, 3.6, 3));
  add('tier1', C.fir2, (g) => A.firTier(g, 0, 2.7, 1.4, 4.9, 2));
  add('star', C.goldLight, (g) => A.star(g, 0, 4.95, 0.5, 0.22));
  add('dots', C.red, (g) => { for (const [x, y] of [[-0.9, 1.75], [0.5, 1.95], [-0.2, 2.5], [0.7, 3.0], [-0.5, 3.35], [0.1, 3.9]]) A.disc(g, x, y, 0.13); }, { print: true });
} });
for (const sd of [1, -1]) {
  const m = makeCard(sapling.pts, { ...CARD, seed: 61 + sd, contact: { amount: 0.1, height: 0.6 }, paint: (P) => {
    P.fill(C.fir1); sapling.layer(P, 'pot', { depth: 0.6, felt: 0.4 }); sapling.flat(P, 'band');
    sapling.layer(P, 'tier0', { depth: 0.8, rim: 0.5, rimColor: C.mint, felt: 0.5 }); sapling.layer(P, 'tier1', { depth: 0.8, rim: 0.5, rimColor: C.mint, felt: 0.5 });
    sapling.flat(P, 'dots'); sapling.layer(P, 'star', { depth: 0.4 });
  } });
  m.name = 'sapling'; pose(m, sd, V0, 14.2, 4.2);
}

// ---- the star on its pin at the top of the tree; baubles swinging on theirs
const starPin = new THREE.Group(); starPin.position.set(0.5, TREE0.H + 0.25, 0.11); wallR.add(starPin);
const starCard = makeCard(A.starPts(0, 0, 1.65, 0.76), { ...CARD, seed: 51, folds: [], contact: null, back: 'mirror', edgeWidth: 0.04, paint: (P) => {
  P.gradient(C.gold, C.goldLight, 0.6); P.felt(0.4);
  P.layer(A.starPts(0, 0, 0.95, 0.44), C.goldLight, { depth: 0.5 }); P.layer((g) => A.disc(g, 0, 0, 0.16), C.wood, { depth: 0.3 });
} });
starCard.name = 'star'; starPin.add(starCard);
const baubles = [];
function bauble(wing, x, y, color, band, len = 0.75, r0 = 0.56, seed = 1) {
  const r = r0 * 1.2;
  const pin = new THREE.Group(); pin.position.set(x, y, 0.1); wing.add(pin);
  const pts = P2.fromDrawing((g) => { g.fillRect(-0.09, r * 2 + 0.1, 0.18, len); A.rrect(g, -0.17, r * 2 - 0.05, 0.34, 0.3, 0.06); A.disc(g, 0, r, r); A.disc(g, 0, r * 2 + 0.1 + len, 0.16); }, { w: 1.6, h: r * 2 + len + 0.6, res: 60, name: 'bauble' });
  const m = makeCard(pts, { ...CARD, thickness: 0.04, seed: 80 + seed, folds: [], contact: null, back: 'mirror', edgeWidth: 0.035, paint: (P) => {
    P.fill(C.kraft);
    P.layer((g) => A.disc(g, 0, r, r), color, { depth: 0.5, felt: 0.3 });
    P.draw((g) => { g.save(); g.beginPath(); g.arc(0, r, r, 0, A.TAU); g.clip(); g.fillStyle = band; g.fillRect(-r, r - 0.1, r * 2, 0.2); g.fillStyle = P2.rgba('#ffffff', 0.5); A.ell(g, -r * 0.35, r * 1.4, r * 0.2, r * 0.3, 0.5); for (let i = -2; i <= 2; i++) { g.fillStyle = band; A.disc(g, i * r * 0.42, r * 0.55, 0.06); } g.restore(); });
    P.layer((g) => A.rrect(g, -0.17, r * 2 - 0.05, 0.34, 0.3, 0.06), C.goldLight, { depth: 0.3 });
    P.layer((g) => A.disc(g, 0, r * 2 + 0.1 + len, 0.1), C.gold, { depth: 0.25 });
  } });
  m.position.y = -(r * 2 + 0.1 + len); m.name = `bauble ${seed}`; pin.add(m);
  baubles.push({ pin, amp: (9 + (seed * 37 % 7)) * D2R, hz: 0.42 + (seed * 53 % 10) * 0.016, ph: seed * 1.7 });
}
bauble(wallR, tips0[1][0] - 0.25, tips0[1][1] + 0.12, C.red, C.cream, 0.6, 0.6, 1);
bauble(wallL, -tips0[1][0] + 0.25, tips0[1][1] + 0.12, C.gold, C.red, 0.6, 0.6, 2);
bauble(wallR, tips0[3][0] - 0.2, tips0[3][1] + 0.1, C.cream, C.red, 0.55, 0.5, 3);
bauble(wallL, -tips0[3][0] + 0.2, tips0[3][1] + 0.1, C.red, C.goldLight, 0.55, 0.5, 4);
bauble(tree1.wings[0], tree1.tips[1][0] - 0.2, tree1.tips[1][1] + 0.1, C.gold, C.cream, 0.6, 0.55, 5);
bauble(tree1.wings[1], -tree1.tips[1][0] + 0.2, tree1.tips[1][1] + 0.1, C.blue, C.cream, 0.6, 0.55, 6);
bauble(tree2.wings[0], tree2.tips[0][0] - 0.25, tree2.tips[0][1] + 0.1, C.blush, C.red, 0.5, 0.52, 7);
bauble(tree2.wings[1], -tree2.tips[0][0] + 0.25, tree2.tips[0][1] + 0.1, C.red, C.cream, 0.5, 0.52, 8);

// ---------------------------------------------------------------------------------------------------------------
// life and motion
// ---------------------------------------------------------------------------------------------------------------
makeSnow(stage, { count: 150, x: [-30, 30], z: [-13, 13], top: 26, start: 0.5, seed: 9, colors: ['#ffffff', '#f4f8fc', '#fff3d2'] });

const CAM = { p0: 58, p1: 49, d0: 60, d1: 67, bump: 8, xbump: 0, ybump: 8, push: 1.2, az0: 6, az: -5, drift: 9, x0: CX, x1: 0, y0: 0.3, y1: 4.2, z0: 1.2, z1: -1.8 };
const fold = { p: 0, v: 0 };
stage.onRestart(() => { fold.p = 0; fold.v = 0; });
stage.onTick((h, t) => {
  const u = Math.min(1, Math.max(0, (t - 0.4) / 2.15)), target = u * u * (2 - u);       // eases in, arrives with speed
  const w = 2 * Math.PI * 1.5, z = 0.45;
  fold.v += (w * w * (target - fold.p) - 2 * z * w * fold.v) * h; fold.p += fold.v * h;
  if (fold.p > 1) { fold.p = 1; fold.v = fold.v > 0.12 ? -fold.v * 0.3 : 0; }           // the cover meets the table: one soft slap
});
const _v = new THREE.Vector3();
stage.onPose((t) => {
  const phi = PHI0 + (Math.PI - PHI0) * fold.p, psi = (Math.PI - phi) / 2;
  leftPivot.rotation.z = -2 * psi;
  bis.rotation.z = -psi;
  for (const o of posed) place(o, psi);
  // mechanisms: they stir once the card is nearly open
  const live = smooth(2.2, 3.4, t), tt = Math.max(0, t - 2.2);
  starPin.rotation.z = -0.9 * (tt - 0.6 * (1 - Math.exp(-tt / 0.6)));
  for (const b of baubles) b.pin.rotation.z = live * b.amp * Math.sin(A.TAU * b.hz * t + b.ph);
  horsePin.rotation.z = live * 7.5 * D2R * Math.sin(A.TAU * 0.5 * t + 0.6);
  armPin.rotation.z = live * (0.06 + 0.5 * Math.abs(Math.sin(Math.PI * 1.5 * t)) ** 0.7);       // the stick falls on the drum three times in two seconds
  // camera: over the closed cover, then back and across as the cover turns, then a slow drift
  const o = smoother(0.25, 3.3, t), u = Math.max(0, t - 3.3), sw = (1 - Math.cos(Math.PI * u / 7)) / 2;
  const pitch = lerp(CAM.p0, CAM.p1, o) * D2R, az = (lerp(CAM.az0, CAM.az, o) + CAM.drift * sw) * D2R;
  const dist = lerp(CAM.d0, CAM.d1, o) + CAM.bump * Math.sin(Math.PI * o) ** 2 - CAM.push * sw;
  const hump = Math.sin(Math.PI * o) ** 2;
  const look = _v.set(lerp(CAM.x0, CAM.x1, o) + CAM.xbump * hump, lerp(CAM.y0, CAM.y1, o) + CAM.ybump * hump, lerp(CAM.z0, CAM.z1, o));
  camera.position.set(look.x + dist * Math.cos(pitch) * Math.sin(az), look.y + dist * Math.sin(pitch), look.z + dist * Math.cos(pitch) * Math.cos(az));
  camera.lookAt(look);
  stage.post.focus.set(lerp(CX, 0, o), lerp(0.3, 2.5, o), lerp(0.5, -0.5, o));
}, true);

let pieces = 0; card.traverse((o) => { if (o.isMesh) pieces++; });
stage.start({ pieces, extra: {
  ext: () => frameExtent(card, camera), CAM, cardClips: () => cardClips(card),
  /** Extents over time for camera tuning: [t, x, top, bottom]. */
  scan(times) { const out = []; stage.restart(); let t = 0; for (const T of times) { stage.step(T - t); t = T; const e = frameExtent(card, camera); out.push([T, e.x, e.top, e.bottom]); } return out; },
} });
mountMessageUI();
if (!stage.CAPTURE) document.getElementById('hint')?.classList.add('show');
