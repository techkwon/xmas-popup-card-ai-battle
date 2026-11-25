// design 1 — "고요한 밤 마을" (Silent Night village): a 90-degree pop-up card.
//
// PAPER SPEC
// BRIEF     a Christmas greeting card on a table, opening by itself; night village, Santa crossing the sky; Korean message
// SUBJECT   a 90-degree card: the back wall is a midnight sky with a moon and gold stars, the floor is snow; five
//           floating layers parallel to the wall (far forest, village + church, town tree + lamps, snow bank with the
//           message board and a snowman, a front drift) rise with the wall like a little theatre
// STRUCTURE every layer is hinged on the floor at its own depth d and tied to the wall, so it is a parallelogram linkage:
//           it stands at the wall's angle at every moment of the opening; each folds flat inside the closed card (d + H <= 24)
// MOTION    the wall lifts on a soft spring (overshoots ~4 deg, settles by ~3.4 s); the layers follow with a stiff paper
//           quiver. Then: Santa's sleigh slides along a cut slot across the sky (slider), the church bell swings on its
//           pin in the belfry (pendulum), the star on the town tree turns on its pin (spinner), the snowman waves (arm on
//           a brad). Life: paper snowflakes fall in front of the sky and settle on the snow.
// PALETTE   indigo sky #161a44-#323a82, blue-white snow #eef2f8 / #a9b6d3, warm gold light #e7b44a / #ffd36a, cranberry
//           #c3352d accents; a honey-oak table; violet-brown shadow leak
// LIGHT     a warm table lamp key from the left (#ffd7a8), a cool frontal fill, lit windows glowing
import * as THREE from 'three';
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { makeCard, paperMaterial } from 'papercraft/lib/paperkit-3d.js';
import { getMessage, loadMessageFont, wrapLines, mountMessageUI } from '../../kit/message.js';
import { createHarness } from './harness.js';
import { createSnow } from './snow.js';
import * as A from './prints.js';

const W = 46, D = 24, TB = 0.14;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/** A damped spring that follows a driver; tabulated once (deterministic), read as a pure function of time. */
function tabulate(driver, { hz, zeta, T = 16, dt = 1 / 600, x0 = 0 }) {
  const n = Math.ceil(T / dt), a = new Float32Array(n + 2), w = 2 * Math.PI * hz;
  let x = x0, v = 0;
  for (let i = 0; i <= n + 1; i++) { const t = i * dt; a[i] = x; const acc = w * w * (driver(t) - x) - 2 * zeta * w * v; v += acc * dt; x += v * dt; }
  return (t) => { if (t >= T) return a[n]; const u = Math.max(0, t / dt), i = Math.floor(u), f = u - i; return a[i] + (a[i + 1] - a[i]) * f; };
}

async function fonts(m) {
  await loadMessageFont();
  const wait = (p) => Promise.race([p, new Promise((r) => setTimeout(r, 5000))]).catch(() => {});
  await wait(Promise.all([
    document.fonts.load('64px "Nanum Pen Script"', `${m.to}${m.msg}${m.from}`),
    document.fonts.load('64px "Great Vibes"', 'Merry Christmas'),
    document.fonts.load('700 64px "Gowun Batang"', '고요한 밤, 메리 크리스마스'),
  ]));
}

function tableTexture() {
  // a honey-oak table: planks running across the view, grain lines, darker joints (printed on paper, like the rest)
  const S = 2048, U = 180, k = S / U, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), r = P2.rng(9);
  const pw = 13.5 * k;
  for (let y = -pw * 0.3, i = 0; y < S; y += pw, i++) {
    const base = P2.mix('#6e4a33', '#57392a', r());
    g.fillStyle = base; g.fillRect(0, y, S, pw);
    for (let j = 0; j < 46; j++) {
      const yy = y + r() * pw, a = 0.08 + r() * 0.16, ph = r() * 6, amp = 0.6 + r() * 2.2, f = 0.002 + r() * 0.004;
      g.strokeStyle = r() < 0.6 ? `rgba(40,22,12,${a})` : `rgba(200,160,120,${a * 0.6})`; g.lineWidth = 0.8 + r() * 2.4;
      g.beginPath(); for (let x = 0; x <= S; x += 16) g.lineTo(x, yy + Math.sin(x * f + ph) * amp * 3 + Math.sin(x * f * 3.1 + ph) * amp); g.stroke();
    }
    for (let j = 0; j < 3; j++) { const x = r() * S, yy = y + (0.2 + 0.6 * r()) * pw; g.fillStyle = 'rgba(80,44,20,0.25)'; g.beginPath(); g.ellipse(x, yy, 18 + r() * 20, 5 + r() * 4, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(52,28,12,0.75)'; g.fillRect(0, y + pw - 3, S, 4);
    g.fillStyle = 'rgba(255,225,180,0.2)'; g.fillRect(0, y + pw + 1, S, 2);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / U, 1 / U);
  return t;
}
function worldPlane(size, mat, y = 0) {
  const geo = new THREE.PlaneGeometry(size, size), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * size, uv.getY(i) * size);   // world-unit UVs, no wrap inside the sheet   // world-unit UVs
  const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true;
  return m;
}

async function main() {
  const m = getMessage();
  await fonts(m);
  const H = createHarness({ fov: 30, background: '#1c130c', stock: '#f7f3ea' });
  const { scene, paper } = H;
  let pieces = 0;
  const card = (pts, o) => { pieces++; return makeCard(pts, { paper, thickness: 0.08, edgeWidth: 0.06, rimLight: [-0.6, 0.8], ...o }); };

  // ---- the table ---------------------------------------------------------------------------------------------------
  const tex = tableTexture();
  const tableMat = paperMaterial({ color: '#ffffff', map: tex, normalMap: paper.normalMap, normalScale: 0.35 });
  scene.add(worldPlane(180, tableMat, 0));
  scene.add(worldPlane(1200, paperMaterial({ color: '#4c3222' }), -0.05));

  // ---- the card: floor panel on the table, the back wall hinged at the gutter (z = 0) ---------------------------------
  const floor = card(P2.shape.rect(W, D), { paint: A.paintFloor, thickness: TB, edgeWidth: 0.05, folds: ['top'], contact: { amount: 0 }, pxPerUnit: 30, back: false, seed: 13 });
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, TB / 2, D);
  scene.add(floor);
  const wallPivot = new THREE.Group(); scene.add(wallPivot);
  const wall = card(P2.shape.rect(W, D), { paint: A.paintSky, thickness: TB, edgeWidth: 0.05, folds: ['bottom'], contact: { amount: 0 }, pxPerUnit: 40, back: false, seed: 11, glowColor: '#ffe6a6' });
  wall.position.z = -TB / 2; wall.userData.setGlow(0.5); wallPivot.add(wall);
  const cover = card(P2.shape.rect(W, D), { paint: A.paintCover, thickness: 0.03, edgeWidth: 0.05, folds: ['top'], contact: { amount: 0 }, pxPerUnit: 36, back: false, seed: 12 });
  cover.rotation.x = Math.PI; cover.position.set(0, D, -TB - 0.017); cover.userData.setGlow(0.5); wallPivot.add(cover);
  // the fold at the gutter: a rounded strip of the same stock along the outside of the crease
  const foldMat = paperMaterial({ color: '#1d2a5c', map: paper.map, normalMap: paper.normalMap, normalScale: 0.3 });
  const foldMesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, W, 20, 1, true, Math.PI / 2, Math.PI), foldMat);
  foldMesh.rotation.z = Math.PI / 2; foldMesh.castShadow = true; foldMesh.receiveShadow = true; scene.add(foldMesh);

  // ---- the floating layers ---------------------------------------------------------------------------------------------
  const contact = { amount: 0.14, height: 1.2, color: '#2a2850' };
  const mk = (piece, o) => card(piece[0], { paint: piece[1], contact, back: 'kraft', ...o });
  const LAYERS = [
    { d: 2.4, off: 1.05, mesh: mk(A.farLayer(), { pxPerUnit: 34, seed: 21 }) },
    { d: 5.8, off: 0.85, mesh: mk(A.villageLayer(), { pxPerUnit: 39, seed: 22, glow: 1.2, glowColor: '#ffc95e', holes: [A.belfryHole()] }) },
    { d: 10.4, off: 0.7, mesh: mk(A.townLayer(), { pxPerUnit: 39, seed: 23, glow: 1.2, glowColor: '#ffc95e' }) },
    { d: 14.6, off: 0.45, mesh: mk(A.bankLayer(), { pxPerUnit: 42, seed: 24 }) },
    { d: 19.8, off: 0.05, mesh: mk(A.driftLayer(), { pxPerUnit: 46, seed: 25 }) },
  ];
  for (const L of LAYERS) { L.pivot = new THREE.Group(); L.pivot.add(L.mesh); scene.add(L.pivot); }
  LAYERS[1].mesh.userData.setGlow(1.25); LAYERS[2].mesh.userData.setGlow(1.25);

  // pieces glued onto layers, and the moving mechanisms (each on a pin at its pivot)
  const mount = (piece, parent, { x, y, z, ppu = 60, seed = 1, scale = 1, flip = false, thickness = 0.06, glow = null }) => {
    const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
    const c = card(piece[0], { paint: piece[1], folds: [], contact: { amount: 0 }, pxPerUnit: ppu, seed, thickness, back: 'kraft' });
    const pv = piece.pivot || [0, 0];
    c.position.set(-pv[0], -pv[1], 0); g.add(c); g.scale.set(flip ? -scale : scale, scale, scale);
    if (glow != null) c.userData.setGlow?.(glow);
    return g;
  };
  const sleigh = mount(A.sleighPiece(), wallPivot, { x: 0, y: 0, z: 0.1, ppu: 50, seed: 31 });
  const c2 = A.CHURCH;
  const bell = mount(A.bellPiece(), LAYERS[1].pivot, { x: c2.towerX, y: 1.0 + c2.belfry[0] + c2.belfry[2] - 0.12, z: -0.13, ppu: 120, seed: 32, scale: 0.78 });
  const star = mount(A.starSpinner(), LAYERS[2].pivot, { x: A.TREE.x, y: A.TREE.base + A.TREE.h + 0.35, z: 0.1, ppu: 100, seed: 33, scale: 1.2 });
  mount(A.snowmanPiece(), LAYERS[3].pivot, { x: -15.2, y: 0.12, z: 0.13, ppu: 64, seed: 34 });
  const arm = mount(A.armPiece(), LAYERS[3].pivot, { x: -14.0, y: 4.95, z: 0.22, ppu: 100, seed: 35 });
  const armL = mount(A.armPiece(), LAYERS[3].pivot, { x: -16.4, y: 4.85, z: 0.22, ppu: 100, seed: 36, flip: true });
  armL.rotation.z = 0.45;
  mount(A.giftsPiece(), LAYERS[3].pivot, { x: -3.6, y: 0.25, z: 0.14, ppu: 80, seed: 37 });
  mount(A.signPiece(m, wrapLines), LAYERS[3].pivot, { x: 9.0, y: 0.1, z: 0.24, ppu: 72, seed: 38, thickness: 0.07 });

  // ---- motion: pure functions of time ------------------------------------------------------------------------------
  const PHI = tabulate((t) => 1.62 * smooth(0.35, 2.05, t), { hz: 0.93, zeta: 0.31 });   // the wall lifts, overshoots, settles
  const LAY = tabulate(PHI, { hz: 3.1, zeta: 0.22 });                                     // the layers follow with a paper quiver
  const R = A.SLOT.R, xs0 = A.SLOT.x0 + 1.4, xs1 = A.SLOT.x1 - 1.2;
  const santa = (t) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, t - 3.1) / 6.6);       // a pull-tab: left end -> right end -> back
  const ramp = (t) => smooth(2.9, 4.2, t);
  const _v = new THREE.Vector3();
  const snow = createSnow({ scene, count: 230, region: { x0: -31, x1: 29, z0: 0.9, z1: 30 }, top: 30.5, fall: [2.0, 2.8], size: [0.42, 0.85], wind: 0.24, start: [0.2, 13],
    avoid: (x, z) => LAYERS.some((L) => Math.abs(z - L.d) < 0.75),
    groundAt: (x, z) => (Math.abs(x) < W / 2 && z > 0 && z < D ? TB + 0.01 : 0) });

  function pose(t) {
    const phi = PHI(t), a = LAY(t), k = 1 - smooth(0, 0.42, phi);
    wallPivot.position.set(0, TB + 1.25 * k, 0);
    wallPivot.rotation.x = Math.PI / 2 - phi;
    for (const L of LAYERS) { L.pivot.position.set(0, TB + L.off * k, L.d); L.pivot.rotation.x = Math.PI / 2 - a; }
    // the fold: half a tube joining the floor's underside and the wall's back round the gutter
    const top = wallPivot.position.y + TB, rr = Math.max(TB, top / 2) * 1.0;
    foldMesh.scale.set(rr, 1, rr); foldMesh.position.set(0, top / 2, 0);
    // Santa rides the slot from its left end to its right end, the sleigh rocking a little on its tab
    const xs = lerp(xs0, xs1, santa(t)), [px, py] = A.slotPoint(xs);
    sleigh.position.set(px, py, 0.1);
    sleigh.rotation.z = Math.atan2(-xs, Math.sqrt(R * R - xs * xs)) + 0.05 * Math.sin(t * 3.4) * ramp(t);
    bell.rotation.z = 0.32 * Math.sin((t - 2.9) * 3.9) * ramp(t);
    star.rotation.z = -0.9 * Math.max(0, t - 3.0) ** 1.0 * ramp(t + 0.4);
    arm.rotation.z = 0.35 + 0.42 * Math.sin((t - 3.0) * 5.2) * ramp(t);
    snow.update(t);
  }
  const corners = [];
  for (const x of [-W / 2, W / 2]) { corners.push([wallPivot, x, 0, -TB], [wallPivot, x, D, -TB], [wallPivot, x, D, 0.2]); }
  const floorPts = [];
  for (const x of [-W / 2, W / 2]) for (const z of [0, D]) for (const y of [0, TB]) floorPts.push(new THREE.Vector3(x, y, z));
  const hull = () => [...corners.map(([o, x, y, z]) => _v.set(x, y, z).applyMatrix4(o.matrixWorld).clone()), ...floorPts];
  const view = (t) => ({
    pitch: lerp(57, 22.5, smooth(0.25, 3.3, t)),
    yaw: t <= 10 ? -6.5 * Math.sin(Math.PI / 2 * Math.min(1, Math.max(0, (t - 2.6) / 7.4))) : -6.5 * Math.cos(2 * Math.PI * (t - 10) / 44),
  });
  const margin = (t) => lerp(0.2, 0.035, smooth(0.3, 3.0, t));
  const F0 = new THREE.Vector3(0, 1, 12), F1 = new THREE.Vector3(0, 8, 9);
  const focus = (t) => F0.clone().lerp(F1, smooth(0.4, 2.8, t));

  H.start({ pose, hull, view, focus, margin, pieces,
    lightOpts: { target: new THREE.Vector3(0, 6, 10), keyDir: [-0.78, 0.86, 0.62], key: '#ffd9ae', keyIntensity: 3.0, fill: '#b4bde2', fillIntensity: 0.72, fillDir: [0.3, 0.42, 1.0],
      sky: '#dcd2ea', ground: '#5a3e2c', skyIntensity: 0.38, shadowExtent: 44, distance: 130, softness: 0.2, maxPenumbra: 1.6 },
    leak: '#5f5590', wrap: 0.32, trans: 0.22, transTint: '#ffcf98',
    lensOpts: { exposure: 0.86, vignette: 0.2, vignetteColor: '#140b06', shadowTint: '#1c1838', shadowLift: 0.035, aoTint: '#3a2a40' },
  });
  mountMessageUI();
}
main();
