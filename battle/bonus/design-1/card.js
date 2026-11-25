// The card: a 90-degree pop-up. The floor panel (ground.png) lies on the table, the back wall (backdrop.png inside,
// the cover outside) turns up about the fold, and every picture from the art set stands on a parallel fold: a card
// hinged to the floor that stays parallel to the wall, held by a paper strap (to the wall, or over a little rear leg),
// so the whole village folds flat forward under the wall and rises with it. Mechanisms: the sleigh rides a star rail
// across the sky on a slider, the snowman glides along a slot in the frozen pond, the great tree opens two wings.
// Everything is posed by pose(t), a pure function of the card's clock.
import * as THREE from 'three';
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { makeCard, paperMaterial, cloneMaterial, clipHalf, foldSkip, windSway } from 'papercraft/lib/paperkit-3d.js';
import { artPiece } from 'papercraft/art.js';
import { drawImg, sparkle, sheetOutline, paintLetter, paintCover } from './letter.js';

export const CARD = { W: 32, D: 20, WH: 20, SPINE: 0.34, T: 0.14 };
const DEG = Math.PI / 180, EDGE = 0.075, PIECE_T = 0.085;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---- the opening: the wall follows an eased pull through a soft spring (X: one small overshoot past 90 deg), and the
// standing cards flutter about it on a faster one (Y), a little later the further they are from the fold -------------
export const OPEN_T0 = 0.5, OPEN_RAMP = 1.9;
const DT = 1 / 240, TMAX = 8, NT = Math.round(TMAX / DT), TX = new Float32Array(NT + 2), TY = new Float32Array(NT + 2);
{
  let x = 0, vx = 0, y = 0, vy = 0;
  const w1 = 2 * Math.PI * 1.5, z1 = 0.5, w2 = 2 * Math.PI * 4.3, z2 = 0.17;
  for (let i = 0; i <= NT + 1; i++) {
    TX[i] = x; TY[i] = y;
    const u = clamp((i * DT - OPEN_T0) / OPEN_RAMP, 0, 1), g = u * u * (1.6 - 0.6 * u);     // slow lift, arrives with speed
    vx += (w1 * w1 * (g - x) - 2 * z1 * w1 * vx) * DT; x += vx * DT;
    vy += (w2 * w2 * (x - y) - 2 * z2 * w2 * vy) * DT; y += vy * DT;
  }
}
const tab = (T, t) => { if (t <= 0) return 0; if (t >= TMAX) return 1; const f = t / DT, i = Math.floor(f); return T[i] + (T[i + 1] - T[i]) * (f - i); };
/** The wall's opening, 0 closed .. 1 at 90 deg (a hair past 1 at the overshoot). */
export const openAt = (t) => tab(TX, t);

// ---- where everything stands: x across the card, d = distance from the fold, h = height (d + h <= 20: it folds inside) ----
const LAYOUT = [
  { n: 'sorting-house', x: -11.3, d: 1.7, h: 7.8, wall: [-2.5, 2.3], s: 4.6, glowAt: 3.3 },
  { n: 'lantern-cottage', x: 7.25, d: 2.3, h: 6.7, wall: [-2.0, 1.6], s: 3.9, glowAt: 3.08, smoke: 3.55 },
  { n: 'post-office', x: -4.3, d: 3.7, h: 8.9, wall: [-2.6, 2.4], s: 5.2, glowAt: 2.86, smoke: 3.25 },
  { n: 'pine-tall', x: 13.25, d: 3.3, h: 10.0, wall: [0], s: 5.0, sw: 0.9, sway: 0.7 },
  { n: 'tree', x: 1.2, d: 9.3, h: 10.6, leg: 2.0, s: 4.4, sw: 1.4, sway: 0.4, wings: 46, glowAt: 3.5, glow: 1.25 },
  { n: 'mailbox', x: -13.3, d: 10.8, h: 4.1, leg: 1.0, s: 1.7, sw: 1.0 },
  { n: 'postmaster', x: -8.0, d: 10.4, h: 5.5, leg: 1.1, s: 2.3, sw: 1.0 },
  { n: 'child', x: -4.95, d: 11.9, h: 4.3, leg: 1.0, s: 1.8, sw: 0.7 },
  { n: 'gifts', x: -9.1, d: 13.9, h: 2.3, leg: 0.8, s: 1.0, sw: 1.8 },
  { n: 'fox', x: 3.9, d: 13.9, h: 3.3, leg: 0.9, s: 1.4, sw: 0.9 },
  { n: 'snowman', x: 9.0, d: 9.75, h: 4.5, leg: 1.0, s: 1.9, sw: 1.0, slider: { x0: 6.9, x1: 11.9 } },
  { n: 'pine-small', x: 13.0, d: 14.6, h: 5.2, leg: 1.2, s: 2.3, sw: 0.9, sway: 0.6 },
  { n: 'holly-bush', x: 8.0, d: 16.9, h: 2.5, leg: 0.8, s: 1.1, sw: 1.6, sway: 0.35 },
  { n: 'holly-bush', x: -13.7, d: 17.0, h: 2.3, leg: 0.8, s: 1.0, sw: 1.6, sway: 0.35, flip: true },
];
export const PIECE_NAMES = [...new Set(LAYOUT.map((p) => p.n)), 'sleigh'];

// ---- the sky: the letter sits between the moon and the stars, the star rail runs under it and climbs to the moon ----
const LETTER = { w: 16.2, h: 6.85, x: 1.25, y: 12.85, tilt: -1.1 * DEG };
const RAIL_C = [[15.2, 7.15], [13.6, 7.4], [6.5, 8.1], [-1.5, 8.45], [-7.4, 9.3], [-11.7, 11.25], [-15.6, 13.1]];
const SLEIGH_H = 3.2, FLY = { t0: 3.3, go: 6.0, hold: 3.6, back: 4.6, rest: 2.4, s0: 2.5, s1: 1.0 };

function railCurve() {
  const C = RAIL_C, pts = [];
  const cr = (p0, p1, p2, p3, t) => [0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t));
  for (let i = 1; i < C.length - 2; i++) for (let j = 0; j < 28; j++) pts.push(cr(C[i - 1], C[i], C[i + 1], C[i + 2], j / 28));
  pts.push(C[C.length - 2]);
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1];
  const at = (s) => {                                                  // point and unit tangent at arc length s (from the right end)
    s = clamp(s, 0, total); let i = 1; while (i < L.length - 1 && L[i] < s) i++;
    const b = pts[i - 1], c = pts[i], f = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
    const tan = (k) => { const p = pts[Math.max(0, k - 1)], q = pts[Math.min(pts.length - 1, k + 1)], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]; };
    const t1 = tan(i - 1), t2 = tan(i);
    let tx = t1[0] + (t2[0] - t1[0]) * f, ty = t1[1] + (t2[1] - t1[1]) * f; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    return { x: b[0] + (c[0] - b[0]) * f, y: b[1] + (c[1] - b[1]) * f, tx, ty };
  };
  return { pts, total, at };
}

const plainCard = (w, h, t, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, t), mat); m.castShadow = m.receiveShadow = true; return m; };

/**
 * Build the card. art: loadArt()'s pictures; images: { backdrop, ground, cover }; message: { to, msg, from }.
 * Returns { root, pose(t), emitters, lamps, count, wallPivot, check() }.
 */
export function buildCard({ art, images, paper, message }) {
  const { W, D, WH, SPINE, T } = CARD;
  const root = new THREE.Group(); root.name = 'card';
  const stock = paperMaterial({ color: '#efe6d3', map: paper.map, normalMap: paper.normalMap, normalScale: 0.5 });       // unprinted card: straps, legs, edges
  const kraft = paperMaterial({ color: '#e3d5ba', map: paper.map, normalMap: paper.normalMap, normalScale: 0.5 });
  const panel = { paper, thickness: T, edgeWidth: 0, contact: { amount: 0 }, pxPerUnit: 64, backRes: 1, tone: 0, folds: ['bottom', 'top', 'left', 'right'] };
  let count = 0;

  // ---- floor: ground.png, with the slider's slot cut along the frozen pond ----
  const slider = LAYOUT.find((p) => p.slider), SL = slider.slider, slotZ = slider.d + 0.06;
  const floor = makeCard(P2.shape.rect(W, D), { ...panel, seed: 5, back: false,
    paint: (P) => {
      P.draw((g) => drawImg(g, images.ground, -W / 2, 0, W, D));
      P.draw((g) => {                                                   // the slot: a cut line with a lit lower lip
        const y = D - slotZ; g.lineCap = 'round';
        g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.2; g.beginPath(); g.moveTo(SL.x0 - 0.5, y - 0.07); g.lineTo(SL.x1 + 0.5, y - 0.07); g.stroke();
        g.strokeStyle = '#3f5f78'; g.lineWidth = 0.15; g.beginPath(); g.moveTo(SL.x0 - 0.5, y); g.lineTo(SL.x1 + 0.5, y); g.stroke();
      });
    } });
  floor.material[1].color.set('#e6dcc8');
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -T / 2, D); root.add(floor);

  // ---- the fold and the back wall: backdrop.png inside, the cover outside ----
  const spine = plainCard(W, SPINE + T, T, paperMaterial({ color: '#f4e4c6', map: paper.map, normalMap: paper.normalMap, normalScale: 0.4 }));
  spine.position.set(0, (SPINE - T) / 2, -T / 2 - 0.002); root.add(spine);
  const wallPivot = new THREE.Group(); wallPivot.position.set(0, SPINE, 0); root.add(wallPivot);
  const wall = makeCard(P2.shape.rect(W, WH), { ...panel, seed: 3,
    paint: (P) => P.draw((g) => drawImg(g, images.backdrop, -W / 2, 0, W, WH)),
    back: (P) => paintCover(P, images.cover, W, WH) });
  wall.material[1].color.set('#e6dcc8');
  wallPivot.add(wall);
  const wallFace = T / 2;                                               // the inside face, in the wall's frame

  // ---- one picture as a cut card: the cut follows its outline, both sides printed (the back is the picture mirrored) ----
  const cutPiece = (name, h, { flip = false, seed = 1, glow = 0.3 } = {}) => {
    const a = art[name], piece = artPiece(a, h, { name }), w = piece.w, k = flip ? -1 : 1;
    const pts = flip ? piece[0].map(([x, y]) => [-x, y]).reverse() : piece[0];
    const put = (g, src, mirror) => { g.save(); g.imageSmoothingQuality = 'high'; if (mirror) g.scale(-1, 1); g.translate(-w / 2, h); g.scale(w / a.w, -h / a.h); g.drawImage(src, 0, 0); g.restore(); };
    const contact = { amount: 0.13, height: Math.min(0.8, h * 0.14), color: '#2b3158' };
    const paint = (P) => { P.draw((g) => put(g, a.canvas, flip)); P.felt(0.2); P.innerShade('#2a1a20', { alpha: 0.22, blurPx: 8 }); if (a.glow) P.glow((gc) => put(gc, a.glow, flip)); };
    const back = (P) => {
      P.draw((g) => put(g, a.canvas, !flip)); P.felt(0.2); P.innerShade('#2a1a20', { alpha: 0.22, blurPx: 8 });
      P.draw((g) => { g.fillStyle = 'rgba(40,44,80,0.10)'; g.fillRect(P.box.x0 - 1, P.box.y0 - 1, P.box.w + 2, P.box.h + 2); });
      P.rim({ width: EDGE, skip: foldSkip(['bottom'], P.box), light: [0.55, 0.83] });
    };
    const mesh = makeCard(pts, { paint, back, paper, backRes: 0.6, thickness: PIECE_T, edgeWidth: EDGE, pxPerUnit: clamp(700 / h, 64, 112), seed, contact, glow, tone: 0.02 });
    mesh.name = name; count++;
    return { mesh, pts, w, h, chimney: [piece.chimney[0] * k, piece.chimney[1]], lit: !!a.glow };
  };

  // ---- the standing pieces on their parallel folds ----
  const pieces = [], emitters = [], lamps = [];
  LAYOUT.forEach((spec, i) => {
    const c = cutPiece(spec.n, spec.h, { flip: spec.flip, seed: 11 + i * 7 });
    const g = new THREE.Group(); g.position.set(spec.x, 0, spec.d); g.add(c.mesh); root.add(g);
    const p = { spec, g, mesh: c.mesh, w: c.w, glowMats: c.lit ? [c.mesh.material[0]] : [], wings: null, parts: [], x: spec.x };
    p.delay = 0.007 * spec.d; p.flutter = clamp(0.5 + spec.h / 9, 0.6, 1.5); p.off = 0.02 + (D - spec.d) * 0.011;
    if (spec.wings) {                                                   // two half cards hinged on the centre line: they fan out as the tree stands
      const mats = c.mesh.material.map((m) => { const k = cloneMaterial(m); k.color.multiplyScalar(0.9); return k; });
      p.wings = [1, -1].map((side) => {
        const m = makeCard(c.pts, { geomPts: clipHalf(c.pts, side), materials: mats, thickness: PIECE_T });
        const pv = new THREE.Group(); pv.position.z = PIECE_T * 1.08; pv.add(m); g.add(pv); pv.userData.side = side; return pv;
      });
      if (c.lit) p.glowMats.push(mats[0]);
      count += 2;
    }
    // the fold that holds it: straps back to the wall, or a strap over a rear leg (a little paper table)
    if (spec.wall) for (const dx of spec.wall) {
      const strap = plainCard(spec.sw ?? 1.0, 0.05, spec.d + 0.12, stock); root.add(strap); p.parts.push({ kind: 'wallStrap', m: strap, dx });
    } else {
      const leg = plainCard(spec.sw, spec.s, 0.05, kraft); leg.geometry.translate(0, spec.s / 2, 0);
      const lg = new THREE.Group(); lg.add(leg); root.add(lg);
      const strap = plainCard(spec.sw, 0.05, spec.leg, stock); root.add(strap);
      p.parts.push({ kind: 'leg', m: lg }, { kind: 'strap', m: strap });
    }
    if (spec.slider) {                                                  // the tab that rides in the slot
      const tab = plainCard(1.7, 0.03, 0.62, stock); tab.castShadow = false; root.add(tab); p.parts.push({ kind: 'tab', m: tab });
    }
    if (spec.smoke) emitters.push({ object: c.mesh, offset: [c.chimney[0], c.chimney[1] - 0.1, 0.05], start: spec.smoke });
    if (spec.glowAt) {
      const L = new THREE.PointLight('#ffb463', 0, spec.n === 'tree' ? 9 : 12, 1.2);
      L.position.set(spec.x, spec.n === 'tree' ? spec.h * 0.55 : spec.h * 0.3, spec.d + (spec.n === 'tree' ? 2.4 : 1.7)); root.add(L);
      lamps.push({ L, p, at: spec.glowAt, gain: spec.glow ?? 1, power: spec.n === 'tree' ? 9 : 16, id: i });
    }
    pieces.push(p);
  });

  // ---- on the wall: the letter ----
  const letter = makeCard(sheetOutline(LETTER.w, LETTER.h, 0.22), { paper, thickness: 0.05, edgeWidth: 0.05, contact: { amount: 0 }, pxPerUnit: 110, seed: 71, tone: 0, back: false, folds: [],
    paint: (P) => paintLetter(P, message, LETTER.w, LETTER.h) });
  letter.name = 'letter'; letter.position.y = -LETTER.h / 2;
  const letterG = new THREE.Group(); letterG.position.set(LETTER.x, LETTER.y + LETTER.h / 2, 0); letterG.rotation.z = LETTER.tilt; letterG.add(letter); wallPivot.add(letterG);
  count++;

  // ---- on the wall: the star rail (a strip standing off the sky on spacers) and the sleigh that rides it ----
  const rail = railCurve(), RW = 0.5;
  const band = [], under = [];
  for (let i = 0; i <= 96; i++) { const q = rail.at((i / 96) * rail.total), nx = -q.ty, ny = q.tx; band.push([q.x + nx * RW / 2, q.y + ny * RW / 2]); under.push([q.x - nx * RW / 2, q.y - ny * RW / 2]); }
  const railPts = band.concat(under.reverse());
  const starsOn = (g) => { for (let s = 0.9, k = 0; s < rail.total - 0.4; s += 1.55, k++) { const q = rail.at(s); sparkle(g, q.x, q.y, k % 2 ? 0.2 : 0.3, 0.42); g.fill(); } };
  const railCard = makeCard(railPts, { paper, thickness: 0.06, edgeWidth: 0.045, contact: { amount: 0 }, pxPerUnit: 70, seed: 83, tone: 0, back: false, folds: [],
    paint: (P) => { P.fill('#35557f'); P.layer((g) => starsOn(g), '#f7e6ad', { depth: 0.45 }); P.glow((g) => starsOn(g)); } });
  railCard.name = 'rail'; railCard.userData.glowBase = 0.9; wallPivot.add(railCard); count++;
  const railStock = paperMaterial({ color: '#2c4668', map: paper.map });
  const spacers = [0.45, rail.total * 0.36, rail.total * 0.68, rail.total - 0.4].map((s) => { const q = rail.at(s), m = plainCard(0.3, 0.3, 1, railStock); m.castShadow = false; m.userData.q = q; wallPivot.add(m); return m; });
  const sleigh = cutPiece('sleigh', SLEIGH_H, { seed: 131, glow: 0.5 });
  sleigh.mesh.position.y = -0.14;
  const clip = plainCard(1.0, 0.44, 0.04, stock); clip.position.set(0.1, 0.1, -0.11);          // the slider's clip, tucked behind the runner
  const finial = makeCard((() => { const p = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.27 : 0.66; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return p; })(),
    { paper, thickness: 0.06, edgeWidth: 0.04, contact: { amount: 0 }, pxPerUnit: 90, seed: 87, tone: 0, back: false, folds: [], paint: (P) => { P.fill('#f4dc97'); P.glow((g) => g.fillRect(-1, -1, 2, 2)); } });
  { const e = rail.at(rail.total); finial.position.set(e.x + e.tx * 0.25, e.y + e.ty * 0.25, 0); finial.rotation.z = 0.2; wallPivot.add(finial); count++; }
  const sleighG = new THREE.Group(); sleighG.add(sleigh.mesh, clip); wallPivot.add(sleighG);

  // the sleigh along the rail (arc length from the rail's right end): out, hold by the moon, slide back, rest
  const flyAt = (t) => {
    const cyc = FLY.go + FLY.hold + FLY.back + FLY.rest, a = rail.total - FLY.s1, b = FLY.s0;
    let u = t - FLY.t0; if (u <= 0) return b; u %= cyc;
    if (u < FLY.go) { const e = u / FLY.go; return b + (a - b) * (e * e * (3 - 2 * e) * 0.6 + e * 0.4 - 0.4 * Math.sin(e * Math.PI * 2) / (Math.PI * 2)); }
    if (u < FLY.go + FLY.hold) return a;
    if (u < FLY.go + FLY.hold + FLY.back) return a + (b - a) * sm(0, 1, (u - FLY.go - FLY.hold) / FLY.back);
    return b;
  };

  // ---- pose: everything from the clock ----
  function pose(t) {
    const X = tab(TX, t), theta = X * Math.PI / 2;
    wallPivot.rotation.x = Math.PI / 2 - theta;
    const ws = Math.sin(theta), wc = Math.cos(theta), settle = sm(2.7, 3.9, t);
    for (const p of pieces) {
      const sp = p.spec, tt = t - p.delay, x = tab(TX, tt), y = tab(TY, tt);
      let phi = clamp(x + p.flutter * (y - x), 0, 1.12) * Math.PI / 2;
      if (sp.sway) phi += windSway(t, sp.x, sp.d, { amp: sp.sway, heroHeight: 4.5 }) * settle;
      const s = Math.sin(phi), c = Math.cos(phi), yo = p.off * c;
      let px = sp.x, roll = 0;
      if (sp.slider) {                                                  // glides along the slot, leaning into each turn
        const go = sm(3.1, 4.4, t), w = 2 * Math.PI / 5.4, a = (t - 3.1) * w - 0.5, mid = (sp.slider.x0 + sp.slider.x1) / 2, amp = (sp.slider.x1 - sp.slider.x0) / 2;
        px = sp.x + go * (mid + amp * Math.sin(a) - sp.x); roll = -go * 0.085 * Math.cos(a) + go * 0.02 * Math.sin(t * 5.1);
      }
      p.x = px; p.g.position.set(px, yo, sp.d); p.g.rotation.x = Math.PI / 2 - phi; p.mesh.rotation.z = roll;
      if (p.wings) { const e = sm(0.3, 0.97, phi / (Math.PI / 2)) * sp.wings * DEG; for (const pv of p.wings) pv.rotation.y = -pv.userData.side * e; }
      for (const q of p.parts) {
        if (q.kind === 'wallStrap') {                                   // from the card's back to the wall, level when open
          const ay = yo + sp.s * s, az = sp.d + sp.s * c, by = SPINE + (sp.s - SPINE) * ws, bz = (sp.s - SPINE) * wc;
          q.m.position.set(px + q.dx, (ay + by) / 2, (az + bz) / 2 - 0.03); q.m.rotation.x = -Math.atan2(ay - by, az - bz);
        } else if (q.kind === 'leg') { q.m.position.set(px, yo, sp.d - sp.leg); q.m.rotation.x = Math.PI / 2 - phi; }
        else if (q.kind === 'strap') q.m.position.set(px, yo + sp.s * s - 0.03 * s, sp.d - sp.leg / 2 + sp.s * c);
        else if (q.kind === 'tab') q.m.position.set(px, 0.017, sp.d + 0.04);
      }
    }
    // paper stands off the wall on folded spacers that open with the card
    const off = 0.12 + 0.88 * sm(0.15, 0.9, X);
    letterG.position.z = wallFace + 0.05 + 0.3 * off;
    railCard.position.z = wallFace + 0.05 + 0.42 * off; finial.position.z = railCard.position.z + 0.075 * off;
    for (const m of spacers) { const dep = 0.02 + 0.42 * off; m.scale.z = dep; m.position.set(m.userData.q.x, m.userData.q.y, wallFace + dep / 2); }   // the folded spacer opens
    const q = rail.at(flyAt(t)), fly = sm(FLY.t0, FLY.t0 + 0.8, t);
    sleighG.position.set(q.x, q.y, wallFace + 0.05 + 0.74 * off);
    sleighG.rotation.z = Math.atan2(-q.ty, -q.tx) + fly * (0.022 * Math.sin(t * 4.1) + 0.012 * Math.sin(t * 6.7 + 1));
    // windows catch one after another, then breathe; the rail's stars twinkle
    for (const l of lamps) {
      const u = (t - l.at) / 0.6;
      let k = u <= 0 ? 0 : u < 1 ? u * u * (3 - 2 * u) + 0.35 * Math.sin(Math.PI * u) * u : 1 + 0.16 * Math.exp(-3.5 * (u - 1) * 0.6) * Math.sin(26 * (u - 1) * 0.6);
      if (u > 1) k *= 1 + 0.035 * Math.sin(t * 7.3 + l.id) + 0.025 * Math.sin(t * 12.1 + l.id * 2.3);
      const gl = 0.22 + 1.5 * l.gain * k; for (const m of l.p.glowMats) m.emissiveIntensity = gl;
      l.L.intensity = l.power * k * sm(0.6, 1, X);
    }
    railCard.material[0].emissiveIntensity = 0.25 + 0.75 * sm(2.9, 3.6, t) * (1 + 0.12 * Math.sin(t * 3.3));
    finial.material[0].emissiveIntensity = 0.1 + 0.5 * sm(2.9, 3.6, t) * (1 + 0.15 * Math.sin(t * 2.1 + 1));
    return { X, theta };
  }

  /** The sleigh's corners against the letter (design check): true when it never touches the sheet. */
  function check() {
    const hw = sleigh.w / 2, lx0 = LETTER.x - LETTER.w / 2 - 0.15, lx1 = LETTER.x + LETTER.w / 2 + 0.15, ly0 = LETTER.y - 0.15; let worst = Infinity;
    for (let s = FLY.s0; s <= rail.total - FLY.s1; s += 0.2) {
      const q = rail.at(s), g = Math.atan2(-q.ty, -q.tx);
      for (const [u, v] of [[-hw, SLEIGH_H], [hw, SLEIGH_H], [0, SLEIGH_H], [hw / 2, SLEIGH_H], [-hw / 2, SLEIGH_H]]) {
        const x = q.x + u * Math.cos(g) - v * Math.sin(g), y = q.y + u * Math.sin(g) + v * Math.cos(g);
        if (x > lx0 && x < lx1) worst = Math.min(worst, ly0 - y);
      }
    }
    return +worst.toFixed(2);
  }

  pose(0);
  return { root, pose, emitters, lamps, count, wallPivot, check, pieces };
}
