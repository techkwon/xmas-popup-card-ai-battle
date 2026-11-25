// design 2 — "숲속의 크리스마스" (Christmas in the snowy wood): a 180-degree pop-up book spread with V-folds.
//
// PAPER SPEC
// BRIEF     a Christmas greeting card on a table that opens by itself; daylight, a snowy wood, a great decorated tree
// SUBJECT   a book-like card: the scarlet front cover swings over the spine and lands flat; three V-fold pop-ups glued
//           across the gutter rise as it opens: a snowy mountain ridge with pines, a red cottage and a sledding hill
//           (back), the great Christmas tree with its folded star (middle), a drift with a snowman, a fir and a fox (front)
// STRUCTURE every V-fold has its glue lines at 45 deg from the spine and the same crease angle, so all three stay
//           parallel at every page angle and never touch; the crease direction is solved exactly from the page angle
//           (spherical linkage), so each piece rises the way the paper would
// MOTION    the cover lifts on a soft spring, passes upright and lands flat with a small slap (bounce); then: a sled with
//           two children rides a slot down the hill and is drawn back up (slider), baubles swing on their pins
//           (pendulums), the skating pond turns under its window (volvelle). Life: paper snow, chimney smoke.
// PALETTE   warm cream snow #faf6ee, pine #2d6a48 / #46895a, scarlet #cb342a, gold #e3aa3b, ice #b5d6e2; pale oak table;
//           cool blue-grey shadow leak (daylight from a window)
import * as THREE from 'three';
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { makeCard, paperMaterial, clipHalf } from 'papercraft/lib/paperkit-3d.js';
import { getMessage, loadMessageFont, wrapLines, mountMessageUI } from '../../kit/message.js';
import { createHarness } from './harness.js';
import { createSnow } from './snow.js';
import * as A from './prints.js';

const PW = 26, PD = 32, TB = 0.16, LIFT = 1.1;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = THREE.Vector3;

async function fonts(m) {
  await loadMessageFont();
  const wait = (p) => Promise.race([p, new Promise((r) => setTimeout(r, 5000))]).catch(() => {});
  await wait(Promise.all([
    document.fonts.load('64px "Nanum Pen Script"', `${m.to}${m.msg}${m.from}`),
    document.fonts.load('700 64px "Mountains of Christmas"', 'Merry Christmas'),
    document.fonts.load('64px "Jua"', '숲속의 크리스마스 스케이트 연못'),
  ]));
}
function tableTexture() {
  // a pale limed-oak table, planks running away from the viewer
  const S = 2048, U = 200, k = S / U, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), r = P2.rng(17), pw = 15 * k;
  for (let x = -pw * 0.4; x < S; x += pw) {
    g.fillStyle = P2.mix('#8e9c94', '#7e8d86', r()); g.fillRect(x, 0, pw, S);
    for (let j = 0; j < 40; j++) {
      const xx = x + r() * pw, a = 0.03 + r() * 0.06, ph = r() * 6, amp = 0.6 + r() * 2, f = 0.002 + r() * 0.004;
      g.strokeStyle = r() < 0.65 ? `rgba(50,62,58,${a})` : `rgba(235,240,232,${a})`; g.lineWidth = 0.8 + r() * 2;
      g.beginPath(); for (let y = 0; y <= S; y += 16) g.lineTo(xx + Math.sin(y * f + ph) * amp * 3, y); g.stroke();
    }
    g.fillStyle = 'rgba(40,50,46,0.5)'; g.fillRect(x + pw - 3, 0, 3, S);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / U, 1 / U);
  return t;
}
function worldPlane(size, mat, y = 0) {
  const geo = new THREE.PlaneGeometry(size, size), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * size, uv.getY(i) * size);   // world-unit UVs, no wrap inside the sheet
  const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true;
  return m;
}
const basisQuat = (x, y, z) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
function puffTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#fbf7ee'; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#d8d2c6'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath();
  for (let a = 0; a <= 9.5; a += 0.2) { const rr = 5 + a * 5.6; g.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); } g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

async function main() {
  const m = getMessage();
  await fonts(m);
  const H = createHarness({ fov: 30, background: '#6f7c76', stock: '#f8f4ec' });
  const { scene, paper } = H;
  let pieces = 0;
  const card = (pts, o) => { pieces++; return makeCard(pts, { paper, thickness: 0.08, edgeWidth: 0.06, rimLight: [-0.6, 0.8], ...o }); };

  // ---- the table -----------------------------------------------------------------------------------------------------
  scene.add(worldPlane(200, paperMaterial({ color: '#ffffff', map: tableTexture(), normalMap: paper.normalMap, normalScale: 0.3 }), 0));
  scene.add(worldPlane(1400, paperMaterial({ color: '#7a8882' }), -0.05));

  // ---- the book: the right board lies on the table, the left board (the front cover) turns on the spine (z axis) -------
  const right = card(P2.shape.rect(PW, PD), { paint: A.paintPage(-1, 5), thickness: TB, edgeWidth: 0.05, folds: ['left'], contact: { amount: 0 }, pxPerUnit: 36, back: false, seed: 41 });
  right.rotation.x = -Math.PI / 2; right.position.set(PW / 2, TB / 2, PD / 2); scene.add(right);
  const leftPivot = new THREE.Group(); scene.add(leftPivot);
  const left = card(P2.shape.rect(PW, PD), { paint: A.paintPage(1, 9), thickness: TB, edgeWidth: 0.05, folds: ['right'], contact: { amount: 0 }, pxPerUnit: 36, back: false, seed: 42 });
  left.rotation.x = -Math.PI / 2; left.position.set(-PW / 2, -TB / 2, PD / 2); leftPivot.add(left);
  const cover = card(P2.shape.rect(PW, PD), { paint: A.paintCover, thickness: 0.03, edgeWidth: 0.05, folds: ['left'], contact: { amount: 0 }, pxPerUnit: 36, back: false, seed: 43 });
  cover.quaternion.copy(basisQuat(new V3(-1, 0, 0), new V3(0, 0, -1), new V3(0, -1, 0)));
  cover.position.set(-PW / 2, -TB - 0.017, PD / 2); leftPivot.add(cover);
  // the spine: a rounded strip of the cover stock joining the two boards along the gutter's outside
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, PD, 20, 1, true, Math.PI, Math.PI), paperMaterial({ color: '#a82a24', map: paper.map, normalMap: paper.normalMap, normalScale: 0.3 }));
  spine.rotation.x = Math.PI / 2; spine.castShadow = spine.receiveShadow = true; scene.add(spine);

  // ---- things glued flat on the pages: the message note (left), the skating-pond volvelle (right) ---------------------
  const note = A.notePiece(m, wrapLines);
  const noteG = new THREE.Group(); noteG.position.set(-18.2, 0.025, 9.6); noteG.rotation.y = 0.05; leftPivot.add(noteG);
  const noteC = card(note.pts, { paint: note.paint, thickness: 0.03, folds: [], contact: { amount: 0 }, pxPerUnit: 76, back: false, seed: 44 });
  noteC.rotation.x = -Math.PI / 2; noteC.position.set(0, 0, A.NOTE.h / 2); noteG.add(noteC);
  const pond = A.pondFrame(), POND_AT = [18.0, 10.0];
  const pondG = new THREE.Group(); pondG.position.set(POND_AT[0], TB, POND_AT[1]); scene.add(pondG);
  const frameC = card(pond.pts, { paint: pond.paint, holes: [pond.hole], thickness: 0.05, folds: [], contact: { amount: 0 }, pxPerUnit: 56, back: false, seed: 45 });
  frameC.rotation.x = -Math.PI / 2; frameC.position.y = 0.07; pondG.add(frameC);
  const disc = A.pondDisc(), discG = new THREE.Group(); discG.position.y = 0.025; pondG.add(discG);
  const discC = card(disc.pts, { paint: disc.paint, thickness: 0.03, folds: [], contact: { amount: 0 }, pxPerUnit: 64, back: false, seed: 46 });
  discC.rotation.x = -Math.PI / 2; discG.add(discC);

  // ---- the V-folds -------------------------------------------------------------------------------------------------------
  const folds = (pts, W) => (x0, y0, x1, y1) => A.onV(x0, y0) && A.onV(x1, y1);
  function vfold({ pts, paint }, { z0, ppu, seed, glow = null }) {
    const gR = new THREE.Group(), gL = new THREE.Group(); scene.add(gR, gL);
    const fr = card(pts, { paint, geomPts: clipHalf(pts, 1), folds: folds(pts), back: 'kraft', pxPerUnit: ppu, seed, contact: { amount: 0.12, height: 1.0, color: '#3a5a5a' } });
    const fl = card(pts, { geomPts: clipHalf(pts, -1), materials: fr.material, folds: folds(pts), seed });
    if (glow != null) fr.userData.setGlow(glow);
    gR.add(fr); gL.add(fl);
    let x0 = Infinity, x1 = -Infinity, y1 = 0; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { gR, gL, z0, pts, box: { x0, x1, y1 } };
  }
  const BACK = vfold(A.backV(), { z0: -7.8, ppu: 40, seed: 51, glow: 1.0 });
  const TREE = vfold(A.treeV(), { z0: -4.0, ppu: 48, seed: 52, glow: 1.3 });
  const FRONT = vfold(A.frontV(), { z0: 6.4, ppu: 60, seed: 53 });
  const VS = [BACK, TREE, FRONT];
  const cA = Math.cos(A.ALPHA), sA = Math.sin(A.ALPHA), cG = Math.cos(A.GAMMA);
  /** The exact pose of every V-fold for a page dihedral of 2 beta: the crease lies in the bisecting plane at the angle
   *  where each half keeps its fixed angle GAMMA to its glue line (on its page, at ALPHA from the spine). */
  function frameFor(beta) {
    const B = sA * Math.cos(beta), R = Math.hypot(cA, B), tau = Math.atan2(B, cA) + Math.acos(Math.min(1, cG / R));
    const b = new V3(Math.cos(beta), Math.sin(beta), 0), e = new V3(0, 0, -1);   // glue lines run back from the crease
    const c = b.clone().multiplyScalar(Math.sin(tau)).addScaledVector(e, Math.cos(tau)).normalize();
    const gR = e.clone().multiplyScalar(cA).addScaledVector(new V3(1, 0, 0), sA);
    const gL = e.clone().multiplyScalar(cA).addScaledVector(new V3(Math.cos(2 * beta), Math.sin(2 * beta), 0), sA);
    const xR = gR.clone().addScaledVector(c, -gR.dot(c)).normalize(), xL = gL.clone().addScaledVector(c, -gL.dot(c)).normalize().negate();
    return { c, xR, xL, qR: basisQuat(xR, c, xR.clone().cross(c)), qL: basisQuat(xL, c, xL.clone().cross(c)) };
  }
  function poseV(V, F, lift) {
    V.gR.position.set(0, TB + lift, V.z0); V.gR.quaternion.copy(F.qR);
    V.gL.position.set(0, TB + lift, V.z0); V.gL.quaternion.copy(F.qL);
  }

  // ---- mechanisms on the V-folds -----------------------------------------------------------------------------------------
  const mount = (piece, parent, { x, y, z, ppu = 90, seed = 1, scale = 1 }) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(scale); parent.add(g);
    const c = card(piece[0], { paint: piece[1], folds: [], contact: { amount: 0 }, pxPerUnit: ppu, seed, thickness: 0.05, back: 'kraft' });
    const pv = piece.pivot || [0, 0]; c.position.set(-pv[0], -pv[1], 0); g.add(c);
    return g;
  };
  const baubles = A.BAUBLES.map(([x, y, col], i) => ({ g: mount(A.baublePiece(col), x > 0 ? TREE.gR : TREE.gL, { x, y, z: 0.1, ppu: 110, seed: 60 + i, scale: 1.35 }), ph: i * 1.7, w: 2.6 + (i % 3) * 0.35 }));
  const sled = mount(A.sledPiece(), BACK.gL, { x: -8, y: 6, z: 0.1, ppu: 84, seed: 70 });
  const hillSlope = (x) => (A.hillY(x + 0.01) - A.hillY(x - 0.01)) / 0.02;

  // chimney smoke: paper puffs that leave the chimney small, rise, drift, grow and fade (the allowed exception)
  const puffMat = paperMaterial({ color: '#ffffff', map: puffTexture(), side: THREE.DoubleSide }); puffMat.alphaTest = 0.5;
  const puffs = new THREE.InstancedMesh(new THREE.CircleGeometry(0.5, 20), puffMat, 6); puffs.frustumCulled = false; scene.add(puffs);
  const ck = A.COTTAGE, chimney = new V3(ck.x + 1.7, ck.y0 + ck.h + 3.25, 0);

  // ---- motion: pure functions of time -------------------------------------------------------------------------------------
  const PSI = (() => {   // the cover: lifted by a soft spring, passes upright, lands flat with a small slap
    const dt = 1 / 600, T = 16, n = Math.ceil(T / dt), a = new Float32Array(n + 2), w = 2 * Math.PI * 0.95, z = 0.5;
    let x = 0, v = 0;
    for (let i = 0; i <= n + 1; i++) { const t = i * dt; a[i] = x; const tg = Math.PI * 1.06 * smooth(0.35, 2.45, t); v += (w * w * (tg - x) - 2 * z * w * v) * dt; x += v * dt; if (x > Math.PI) { x = Math.PI; v = v > 0.25 ? -v * 0.22 : 0; } }
    return (t) => { if (t >= T) return a[n]; const u = Math.max(0, t / dt), i = Math.floor(u), f = u - i; return a[i] + (a[i + 1] - a[i]) * f; };
  })();
  const ramp = (t) => smooth(2.9, 4.0, t);
  const sledS = (t) => {   // a pull-tab: down the hill (gathering speed), a pause, drawn back up slowly
    const P = 6.4, u = ((Math.max(0, t - 3.2)) % P) / P;
    if (u < 0.36) { const k = u / 0.36; return k * k * (3 - 2 * k) * (0.6 + 0.4 * k); }
    if (u < 0.5) return 1;
    const k = (u - 0.5) / 0.5; return 1 - k * k * (3 - 2 * k);
  };
  const _v = new V3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new V3(), _c = new V3();

  // the open pose of every V-fold, for the snow to know where the paper is
  const OPEN = frameFor(Math.PI / 2);
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const underPaper = (x, z) => VS.some((V) => [[OPEN.xR, 1], [OPEN.xL, -1]].some(([xv, side]) => {
    const a = xv.x, b = OPEN.c.x, cc = xv.z, d = OPEN.c.z, det = a * d - b * cc; if (Math.abs(det) < 1e-6) return false;
    const dz = z - V.z0, u = (x * d - b * dz) / det, v = (a * dz - cc * x) / det;
    if (u * side < -0.6) return false;
    for (const [du, dv] of [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7]]) if (inPoly(V.pts, u + du, v + dv)) return true;
    return false;
  }));
  const snow = createSnow({ scene, count: 260, region: { x0: -31, x1: 29, z0: -14, z1: 22 }, top: 31, fall: [2.0, 2.8], size: [0.5, 0.9], wind: 0.22, start: [0.2, 13],
    avoid: (x, z) => underPaper(x, z), groundAt: (x, z) => (Math.abs(x) < PW && Math.abs(z) < PD / 2 ? TB + 0.075 : 0) });

  function pose(t) {
    const psi = PSI(t), k = 1 - smooth(0.0, 0.5, psi), lift = LIFT * k;
    leftPivot.position.set(0, TB + lift, 0); leftPivot.rotation.z = psi - Math.PI;
    const F = frameFor(psi / 2);
    for (const V of VS) poseV(V, F, lift * 0.5);
    // the spine strip
    const top = 2 * TB + lift, rr = lerp(lerp(top / 2, TB, smooth(0, Math.PI / 2, psi)), TB / 2, smooth(Math.PI / 2, Math.PI, psi));
    spine.scale.set(rr, 1, rr); spine.position.set(0, rr, 0);
    // mechanisms
    for (const B of baubles) B.g.rotation.z = 0.34 * Math.sin((t - 2.8) * B.w + B.ph) * ramp(t);
    const xs = lerp(-7.2, -12.9, sledS(t));
    sled.position.set(xs, A.hillY(xs) - 0.62, 0.1); sled.rotation.z = Math.atan(hillSlope(xs));
    discG.rotation.y = -0.32 * Math.max(0, t - 2.6) * ramp(t + 0.3);
    // smoke from the cottage chimney once the cottage stands
    BACK.gR.updateMatrixWorld(true);
    _c.copy(chimney).applyMatrix4(BACK.gR.matrixWorld);
    const on = smooth(2.6, 3.4, t), cam = H.camera;
    for (let i = 0; i < 6; i++) {
      const age = (((t - 2.6) / 4.2 + i / 6) % 1 + 1) % 1, tt = age * 4.2;
      const sz = on * (0.55 + 1.5 * age) * smooth(0, 0.12, age) * (1 - smooth(0.7, 1, age)) * (t > 2.6 ? 1 : 0);
      _v.set(_c.x + 0.6 * tt + 0.25 * Math.sin(tt * 1.7 + i), _c.y + 0.2 + 1.05 * tt, _c.z + 0.15 * tt);
      _q.copy(cam.quaternion); _q.multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), tt * 0.5 + i * 2.1));
      puffs.setMatrixAt(i, _m.compose(_v, _q, _s.setScalar(sz)));
    }
    puffs.instanceMatrix.needsUpdate = true;
    snow.update(t);
  }

  // the hull the camera keeps in frame: both boards and the top corners of the V-folds
  const hull = () => {
    const out = [];
    for (const x of [0, PW]) for (const z of [-PD / 2, PD / 2]) out.push(new V3(x, 0, z), new V3(x, TB, z));
    leftPivot.updateMatrixWorld(true);
    for (const x of [-PW, 0]) for (const z of [-PD / 2, PD / 2]) for (const y of [-TB - 0.03, 0]) out.push(new V3(x, y, z).applyMatrix4(leftPivot.matrixWorld));
    for (const V of VS) {
      V.gR.updateMatrixWorld(true); V.gL.updateMatrixWorld(true);
      out.push(new V3(0, V.box.y1, 0).applyMatrix4(V.gR.matrixWorld), new V3(V.box.x1, V.box.y1 * 0.7, 0).applyMatrix4(V.gR.matrixWorld), new V3(V.box.x0, V.box.y1 * 0.7, 0).applyMatrix4(V.gL.matrixWorld));
    }
    return out;
  };
  const view = (t) => ({
    pitch: lerp(60, 36.5, smooth(0.3, 3.4, t)),
    yaw: t <= 10 ? 5.5 * Math.sin(Math.PI / 2 * Math.min(1, Math.max(0, (t - 2.8) / 7.2))) : 5.5 * Math.cos(2 * Math.PI * (t - 10) / 46),
  });
  const margin = (t) => lerp(0.2, 0.035, smooth(0.3, 3.0, t));
  const F0 = new V3(13, 0.5, 0), F1 = new V3(0, 6, 0);
  const focus = (t) => F0.clone().lerp(F1, smooth(0.4, 2.8, t));

  H.start({ pose, hull, view, focus, margin, pieces,
    lightOpts: { target: new V3(0, 4, 2), keyDir: [-0.66, 0.86, 0.42], key: '#fff1de', keyIntensity: 3.1, fill: '#cfdaee', fillIntensity: 0.8, fillDir: [0.35, 0.5, 1.0],
      sky: '#eef3fa', ground: '#8a7a68', skyIntensity: 0.45, shadowExtent: 46, distance: 130, softness: 0.22, maxPenumbra: 1.5 },
    leak: '#6f80a8', wrap: 0.3, trans: 0.28, transTint: '#ffd8b0',
    lensOpts: { exposure: 0.9, vignette: 0.12, vignetteColor: '#3a2a1a', shadowTint: '#28304a', saturation: 1.0, contrast: 1.12, aoTint: '#4a5060' },
  });
  mountMessageUI();
}
main();
